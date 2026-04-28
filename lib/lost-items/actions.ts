"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn, getPermissions } from "@/lib/auth/permissions";
import type {
  LostItemCase,
  LostItemCaseWithRelations,
  LostItemEventWithActor,
  LostItemFilter,
  LostItemStatus,
  CreateLostItemInput,
  UpdateLostItemInput,
} from "./types";
import { OPEN_LOST_ITEM_STATUSES } from "./types";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function revalidateLostItems(caseId?: string) {
  revalidatePath("/operations/lost-items");
  if (caseId) revalidatePath(`/operations/lost-items/${caseId}`);
}

const RELATION_SELECT = `
  *,
  property:properties!property_id(id, name),
  assignee:profiles!assigned_to(id, full_name, email, avatar_url)
`;

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listCases(
  filter?: LostItemFilter,
): Promise<LostItemCaseWithRelations[]> {
  const supabase = await db();
  let q = supabase
    .from("lost_items")
    .select(RELATION_SELECT)
    .order("created_at", { ascending: false });

  if (filter?.status && filter.status !== "all") {
    if (filter.status === "open") {
      q = q.in("status", OPEN_LOST_ITEM_STATUSES);
    } else {
      q = q.eq("status", filter.status);
    }
  }
  if (filter?.property_id && filter.property_id !== "all") {
    q = q.eq("property_id", filter.property_id);
  }
  if (filter?.assigned_to && filter.assigned_to !== "all") {
    if (filter.assigned_to === "unassigned") {
      q = q.is("assigned_to", null);
    } else {
      q = q.eq("assigned_to", filter.assigned_to);
    }
  }
  if (filter?.overdue) {
    const today = new Date().toISOString().slice(0, 10);
    q = q.lt("follow_up_date", today).in("status", OPEN_LOST_ITEM_STATUSES);
  }

  const { data, error } = await q;
  if (error) throw error;

  let rows = (data ?? []) as LostItemCaseWithRelations[];

  if (filter?.search) {
    const needle = filter.search.toLowerCase();
    rows = rows.filter((r) => {
      const haystack = [
        r.case_number,
        r.item_description,
        r.found_location,
        r.guest_name,
        r.guest_email,
        r.guest_phone,
        r.property_name,
        r.property?.name ?? null,
        r.cleaning_vendor,
        r.notes,
        r.slack_thread_url,
        r.conversation_url,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
        .join(" ");
      return haystack.includes(needle);
    });
  }

  return rows;
}

export async function getCase(
  id: string,
): Promise<LostItemCaseWithRelations | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lost_items")
    .select(RELATION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as LostItemCaseWithRelations | null;
}

export async function getCaseByNumber(
  caseNumber: string,
): Promise<LostItemCaseWithRelations | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lost_items")
    .select(RELATION_SELECT)
    .eq("case_number", caseNumber)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as LostItemCaseWithRelations | null;
}

export async function listEvents(
  caseId: string,
): Promise<LostItemEventWithActor[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lost_item_events")
    .select(
      "*, actor:profiles!actor_id(id, full_name, email, avatar_url)",
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LostItemEventWithActor[];
}

// Property dropdown helper. Light, name-only.
export async function listPropertiesLite(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name")
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Create / Update / Delete
// ---------------------------------------------------------------------------

export type CreateCaseResult =
  | { ok: true; data: LostItemCase }
  | { ok: false; error: string };

export type UpdateCaseResult =
  | { ok: true; data: LostItemCase }
  | { ok: false; error: string };

export async function createCase(
  input: CreateLostItemInput,
): Promise<CreateCaseResult> {
  try {
    const userId = await requireSignedIn();
    return await createCaseRaw({ ...input, created_by: userId });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create case",
    };
  }
}

/**
 * Internal: insert a case using the supplied client. Reused by both the
 * server action (RLS-aware client) and the API route handler (service-role).
 */
export async function createCaseRaw(
  input: CreateLostItemInput & { created_by?: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<CreateCaseResult> {
  try {
    const supabase = clientOverride ?? (await db());
    const description = input.item_description?.trim();
    if (!description) {
      return { ok: false, error: "Item description is required" };
    }

    let property_id = input.property_id ?? null;
    let property_name = input.property_name ?? null;
    if (property_id && !property_name) {
      const { data: prop } = await supabase
        .from("properties")
        .select("name")
        .eq("id", property_id)
        .maybeSingle();
      if (prop?.name) property_name = prop.name as string;
    } else if (!property_id && property_name) {
      const { data: prop } = await supabase
        .from("properties")
        .select("id")
        .ilike("name", property_name)
        .is("archived_at", null)
        .maybeSingle();
      if (prop?.id) property_id = prop.id as string;
    }

    const row: Record<string, unknown> = {
      item_description: description,
      found_location: input.found_location ?? null,
      photo_urls: input.photo_urls ?? [],
      property_id,
      property_name,
      guest_name: input.guest_name ?? null,
      guest_email: input.guest_email ?? null,
      guest_phone: input.guest_phone ?? null,
      slack_thread_url: input.slack_thread_url ?? null,
      conversation_url: input.conversation_url ?? null,
      status: input.status ?? "pending_pickup",
      cleaning_vendor: input.cleaning_vendor ?? null,
      follow_up_date: input.follow_up_date ?? null,
      assigned_to: input.assigned_to ?? null,
      source: input.source ?? "internal_form",
      external_source: input.external_source ?? null,
      external_id: input.external_id ?? null,
      external_url: input.external_url ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    };

    // Idempotent upsert when caller provides external_source+external_id.
    let data: LostItemCase | null = null;
    if (row.external_source && row.external_id) {
      const { data: existing } = await supabase
        .from("lost_items")
        .select("*")
        .eq("external_source", row.external_source)
        .eq("external_id", row.external_id)
        .maybeSingle();
      if (existing) {
        return { ok: true, data: existing as LostItemCase };
      }
    }

    const { data: inserted, error } = await supabase
      .from("lost_items")
      .insert(row)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    data = inserted as LostItemCase;

    await supabase.from("lost_item_events").insert({
      case_id: data.id,
      event_type: "created",
      body: `Case opened (${data.source})`,
      to_value: data.status,
      actor_id: input.created_by ?? null,
      actor_label: input.created_by
        ? null
        : `external:${input.external_source ?? "api"}`,
    });

    revalidateLostItems();
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create case",
    };
  }
}

export async function updateCase(
  id: string,
  patch: UpdateLostItemInput,
): Promise<UpdateCaseResult> {
  try {
    const userId = await requireSignedIn();
    return await updateCaseRaw(id, patch, { actor_id: userId });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update case",
    };
  }
}

export async function updateCaseRaw(
  id: string,
  patch: UpdateLostItemInput,
  meta: { actor_id?: string | null; actor_label?: string | null } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<UpdateCaseResult> {
  try {
    const supabase = clientOverride ?? (await db());

    const { data: before, error: readErr } = await supabase
      .from("lost_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return { ok: false, error: readErr.message };
    if (!before) return { ok: false, error: "Case not found" };

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      clean[k] = v;
    }

    // Status transitions stamp the matching milestone timestamp. Failed
    // is terminal but does not stamp anything.
    if (typeof clean.status === "string") {
      const next = clean.status as LostItemStatus;
      if (next === "picked_up" && !before.pickup_completed_at) {
        clean.pickup_completed_at = new Date().toISOString();
      }
      if (next === "delivered" && !before.delivered_at) {
        clean.delivered_at = new Date().toISOString();
      }
      if (next === "completed" && !before.completed_at) {
        clean.completed_at = new Date().toISOString();
      }
      if (next !== "completed" && next !== "failed") {
        clean.completed_at = null;
      }
    }

    const { data: updated, error } = await supabase
      .from("lost_items")
      .update(clean)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    const events: Array<Record<string, unknown>> = [];
    if (
      typeof patch.status === "string" &&
      patch.status !== before.status
    ) {
      events.push({
        case_id: id,
        event_type: "status_change",
        from_value: before.status,
        to_value: patch.status,
        actor_id: meta.actor_id ?? null,
        actor_label: meta.actor_label ?? null,
      });
    }
    if (
      "assigned_to" in patch &&
      (patch.assigned_to ?? null) !== (before.assigned_to ?? null)
    ) {
      events.push({
        case_id: id,
        event_type: "assignment",
        from_value: before.assigned_to ?? null,
        to_value: (patch.assigned_to ?? null) as string | null,
        actor_id: meta.actor_id ?? null,
        actor_label: meta.actor_label ?? null,
      });
    }
    if (events.length) {
      await supabase.from("lost_item_events").insert(events);
    }

    revalidateLostItems(id);
    return { ok: true, data: updated as LostItemCase };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update case",
    };
  }
}

export async function setStatus(
  id: string,
  status: LostItemStatus,
): Promise<UpdateCaseResult> {
  return updateCase(id, { status });
}

export async function setAssignee(
  id: string,
  assignedTo: string | null,
): Promise<UpdateCaseResult> {
  return updateCase(id, { assigned_to: assignedTo });
}

export async function completeCase(
  id: string,
): Promise<UpdateCaseResult> {
  return updateCase(id, { status: "completed" });
}

export async function addComment(
  caseId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireSignedIn();
    const text = body?.trim();
    if (!text) return { ok: false, error: "Comment cannot be empty" };
    const supabase = await db();
    const { error } = await supabase.from("lost_item_events").insert({
      case_id: caseId,
      event_type: "comment",
      body: text,
      actor_id: userId,
    });
    if (error) return { ok: false, error: error.message };
    revalidateLostItems(caseId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to add comment",
    };
  }
}

/**
 * Variant of addComment used by external paths (API / co-pilot tool with
 * a pre-resolved actor). Server action callers should use addComment.
 */
export async function addCommentRaw(
  caseId: string,
  body: string,
  meta: { actor_id?: string | null; actor_label?: string | null } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const text = body?.trim();
    if (!text) return { ok: false, error: "Comment cannot be empty" };
    const supabase = clientOverride ?? (await db());
    const { error } = await supabase.from("lost_item_events").insert({
      case_id: caseId,
      event_type: "comment",
      body: text,
      actor_id: meta.actor_id ?? null,
      actor_label: meta.actor_label ?? null,
    });
    if (error) return { ok: false, error: error.message };
    revalidateLostItems(caseId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to add comment",
    };
  }
}

export async function deleteCase(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const perm = await getPermissions();
    if (!perm.is_admin_or_above) {
      return { ok: false, error: "Requires admin access" };
    }
    const supabase = await db();
    const { error } = await supabase.from("lost_items").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateLostItems();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete case",
    };
  }
}

// ---------------------------------------------------------------------------
// Aggregate helpers (used by board summary tiles + agent tools)
// ---------------------------------------------------------------------------

export async function getCaseStats(): Promise<{
  total: number;
  open: number;
  overdue: number;
  by_status: Record<LostItemStatus, number>;
}> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lost_items")
    .select("status, follow_up_date");
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const by_status: Record<string, number> = {};
  let open = 0;
  let overdue = 0;
  for (const r of data ?? []) {
    const s = r.status as LostItemStatus;
    by_status[s] = (by_status[s] ?? 0) + 1;
    if (OPEN_LOST_ITEM_STATUSES.includes(s)) {
      open++;
      if (r.follow_up_date && (r.follow_up_date as string) < today) overdue++;
    }
  }
  return {
    total: data?.length ?? 0,
    open,
    overdue,
    by_status: by_status as Record<LostItemStatus, number>,
  };
}
