"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth/permissions";
import type {
  WorkOrder,
  WorkOrderFilter,
  WorkOrderRole,
  WorkOrderSource,
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  CostsSummary,
  EmployeeOption,
} from "./types";
import { havenToday, normalizeWorkOrder, summarizeWorkOrders } from "./util";

const TABLE = "operations_work_orders";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function revalidateCosts() {
  revalidatePath("/operations/costs");
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listWorkOrders(
  filter?: WorkOrderFilter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<WorkOrder[]> {
  const supabase = clientOverride ?? (await db());
  let q = supabase
    .from(TABLE)
    .select("*")
    .order("work_date", { ascending: false })
    .order("profit", { ascending: false });

  if (filter?.date) q = q.eq("work_date", filter.date);
  if (filter?.from) q = q.gte("work_date", filter.from);
  if (filter?.to) q = q.lte("work_date", filter.to);
  if (filter?.role && filter.role !== "all") {
    q = q.eq("employee_role", filter.role);
  }
  if (filter?.employee && filter.employee !== "all") {
    q = q.eq("employee_name", filter.employee);
  }

  const { data, error } = await q;
  if (error) throw error;

  let rows: WorkOrder[] = ((data ?? []) as Record<string, unknown>[]).map((r) =>
    normalizeWorkOrder(r),
  );

  if (filter?.search) {
    const needle = filter.search.toLowerCase();
    rows = rows.filter((r) =>
      [
        r.employee_name,
        r.title,
        r.description,
        r.property_name,
        r.notes,
        r.external_ref,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
        .join(" ")
        .includes(needle),
    );
  }

  return rows;
}

/** Totals + per-employee rollup for the given filter. */
export async function getCostsSummary(
  filter?: WorkOrderFilter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<CostsSummary> {
  const rows = await listWorkOrders(filter, clientOverride);
  return summarizeWorkOrders(rows);
}

/** Distinct business days that have data, newest first (for history nav). */
export async function getAvailableDates(limit = 90): Promise<string[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from(TABLE)
    .select("work_date")
    .order("work_date", { ascending: false });
  if (error) throw error;
  const seen: string[] = [];
  const set = new Set<string>();
  for (const r of data ?? []) {
    const d = r.work_date as string;
    if (!set.has(d)) {
      set.add(d);
      seen.push(d);
      if (seen.length >= limit) break;
    }
  }
  return seen;
}

/** Distinct employees seen across all work orders (for filter dropdowns). */
export async function listEmployees(): Promise<EmployeeOption[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from(TABLE)
    .select("employee_name, employee_role")
    .order("employee_name", { ascending: true });
  if (error) throw error;
  const map = new Map<string, WorkOrderRole>();
  for (const r of data ?? []) {
    const name = r.employee_name as string;
    if (!map.has(name)) map.set(name, r.employee_role as WorkOrderRole);
  }
  return [...map.entries()].map(([name, role]) => ({ name, role }));
}

// ---------------------------------------------------------------------------
// Create / Update / Delete
// ---------------------------------------------------------------------------

export type WorkOrderResult =
  | { ok: true; data: WorkOrder; mode: "created" | "updated" }
  | { ok: false; error: string };

/** Signed-in create (RLS-aware), attributed to the current user. */
export async function createWorkOrder(
  input: CreateWorkOrderInput,
): Promise<WorkOrderResult> {
  try {
    const userId = await requireSignedIn();
    return await createWorkOrderRaw({
      ...input,
      source: input.source ?? "manual",
      created_by: userId,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save work order",
    };
  }
}

/**
 * Internal: insert (or, when external_ref matches an existing row, update)
 * a work order using the supplied client. Reused by the signed-in server
 * action (RLS-aware client) and the external agent paths (service-role).
 */
export async function createWorkOrderRaw(
  input: CreateWorkOrderInput & {
    created_by?: string | null;
    source?: WorkOrderSource;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<WorkOrderResult> {
  try {
    const supabase = clientOverride ?? (await db());

    const employee_name = input.employee_name?.trim();
    if (!employee_name) {
      return { ok: false, error: "employee_name is required" };
    }

    // Resolve property linkage like lost_items: caller may pass an id, a
    // name, or neither.
    let property_id = input.property_id ?? null;
    let property_name = input.property_name?.trim() || null;
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
      work_date: input.work_date || havenToday(),
      employee_name,
      employee_role: input.employee_role ?? "maintenance_tech",
      employee_id: input.employee_id ?? null,
      title: input.title?.trim() || null,
      description: input.description ?? null,
      property_id,
      property_name,
      amount_charged: Math.max(0, input.amount_charged ?? 0),
      amount_paid: Math.max(0, input.amount_paid ?? 0),
      source: input.source ?? "manual",
      external_ref: input.external_ref?.trim() || null,
      notes: input.notes ?? null,
      created_by: input.created_by ?? null,
    };

    // Idempotent upsert when an external_ref is supplied: update in place.
    if (row.external_ref) {
      const { data: existing } = await supabase
        .from(TABLE)
        .select("id")
        .eq("external_ref", row.external_ref)
        .maybeSingle();
      if (existing?.id) {
        const patch = { ...row };
        delete patch.created_by; // preserve original creator
        const { data: updated, error } = await supabase
          .from(TABLE)
          .update(patch)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) return { ok: false, error: error.message };
        revalidateCosts();
        return { ok: true, data: normalizeWorkOrder(updated), mode: "updated" };
      }
    }

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidateCosts();
    return { ok: true, data: normalizeWorkOrder(inserted), mode: "created" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save work order",
    };
  }
}

export type BulkUpsertResult =
  | { ok: true; created: number; updated: number; errors: string[] }
  | { ok: false; error: string };

/**
 * Batch upsert a day's work orders — the primary path an AI agent uses to
 * push the day's completed jobs into the dashboard in one call. Each entry
 * is upserted by `external_ref` when present.
 */
export async function bulkUpsertWorkOrdersRaw(
  inputs: CreateWorkOrderInput[],
  meta: { created_by?: string | null; source?: WorkOrderSource } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientOverride?: any,
): Promise<BulkUpsertResult> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return { ok: false, error: "Provide a non-empty array of work orders" };
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const res = await createWorkOrderRaw(
      {
        ...inputs[i],
        source: inputs[i].source ?? meta.source ?? "agent_upload",
        created_by: meta.created_by ?? null,
      },
      clientOverride,
    );
    if (!res.ok) {
      errors.push(`Row ${i + 1}: ${res.error}`);
    } else if (res.mode === "updated") {
      updated++;
    } else {
      created++;
    }
  }

  revalidateCosts();
  return { ok: true, created, updated, errors };
}

export async function updateWorkOrder(
  id: string,
  patch: UpdateWorkOrderInput,
): Promise<WorkOrderResult> {
  try {
    await requireSignedIn();
    const supabase = await db();
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      clean[k] = v;
    }
    const { data, error } = await supabase
      .from(TABLE)
      .update(clean)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidateCosts();
    return { ok: true, data: normalizeWorkOrder(data), mode: "updated" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update work order",
    };
  }
}

export async function deleteWorkOrder(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireSignedIn();
    const supabase = await db();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidateCosts();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete work order",
    };
  }
}
