/**
 * Haven OS — GTM lead magnet actions
 * ---------------------------------------------------------------------------
 * CRUD over `public.gtm_lead_magnets` and submissions over
 * `public.gtm_lead_magnet_submissions`. The internal admin-facing actions
 * require admin or super_admin role. The public reader for
 * /lead-magnet/<slug> uses the service-role admin client because that
 * page is unauthenticated. Public form submissions also flow through
 * the service-role client.
 *
 * All client-callable mutations return a result object
 *   { ok: true, data } | { ok: false, error }
 * because Next.js sanitizes thrown Server Action errors in production.
 *
 * Companion *OrThrow variants are exposed for the agent runtime, which
 * prefers exceptions.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrAbove } from "@/lib/auth/permissions";
import { canonicalUrl } from "@/lib/canonical-url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeadMagnetStatus = "draft" | "active" | "archived";

export type LeadMagnetSectionKind =
  | "rich_text"
  | "bullets"
  | "stat_band"
  | "faq"
  | "cta_block";

export type LeadMagnetSection = {
  kind: LeadMagnetSectionKind | string;
  // Each shape varies by `kind` — kept loose so Jack can iterate without
  // a schema rev. The renderer is permissive and ignores unknown kinds.
  [k: string]: unknown;
};

export type LeadMagnetCtaField =
  | "name"
  | "email"
  | "phone"
  | "property_address"
  | "message";

export type LeadMagnetCta = {
  label: string;
  type: "form" | "link";
  href?: string;
  fields?: LeadMagnetCtaField[];
  success_message?: string;
};

export type LeadMagnetTheme = {
  accent_color?: string;
  // Reserved for future per-magnet branding (logo override, footer, etc).
  [k: string]: unknown;
};

export type LeadMagnet = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  hero_image_url: string | null;
  content: LeadMagnetSection[];
  cta: LeadMagnetCta;
  theme: LeadMagnetTheme;
  owner_name: string | null;
  owner_email: string | null;
  status: LeadMagnetStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  view_count: number;
  submission_count: number;
  last_viewed_at: string | null;
  last_submission_at: string | null;
};

export type LeadMagnetSubmission = {
  id: string;
  lead_magnet_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  property_address: string | null;
  message: string | null;
  extra: Record<string, unknown>;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
};

export type CreateLeadMagnetInput = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  hero_image_url?: string;
  content?: LeadMagnetSection[];
  cta?: Partial<LeadMagnetCta>;
  theme?: LeadMagnetTheme;
  owner_name?: string;
  owner_email?: string;
  status?: LeadMagnetStatus;
  expires_in_days?: number;
};

export type UpdateLeadMagnetInput = Partial<
  Omit<CreateLeadMagnetInput, "expires_in_days">
> & {
  expires_at?: string | null;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CTA: LeadMagnetCta = {
  label: "Get the guide",
  type: "form",
  fields: ["name", "email"],
};

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

/** 12-char hex slug (~48 bits of entropy). */
function generateSlug(): string {
  let hex = "";
  for (let i = 0; i < 12; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

function rowToLeadMagnet(r: Record<string, unknown>): LeadMagnet {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    subtitle: (r.subtitle as string | null) ?? null,
    eyebrow: (r.eyebrow as string | null) ?? null,
    hero_image_url: (r.hero_image_url as string | null) ?? null,
    content: Array.isArray(r.content)
      ? (r.content as LeadMagnetSection[])
      : [],
    cta: {
      ...DEFAULT_CTA,
      ...((r.cta as Record<string, unknown>) ?? {}),
    } as LeadMagnetCta,
    theme: (r.theme as LeadMagnetTheme) ?? {},
    owner_name: (r.owner_name as string | null) ?? null,
    owner_email: (r.owner_email as string | null) ?? null,
    status: (r.status as LeadMagnetStatus) ?? "draft",
    created_by: (r.created_by as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    expires_at: r.expires_at as string,
    view_count: (r.view_count as number) ?? 0,
    submission_count: (r.submission_count as number) ?? 0,
    last_viewed_at: (r.last_viewed_at as string | null) ?? null,
    last_submission_at: (r.last_submission_at as string | null) ?? null,
  };
}

function rowToSubmission(
  r: Record<string, unknown>,
): LeadMagnetSubmission {
  return {
    id: r.id as string,
    lead_magnet_id: r.lead_magnet_id as string,
    name: (r.name as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    property_address: (r.property_address as string | null) ?? null,
    message: (r.message as string | null) ?? null,
    extra: (r.extra as Record<string, unknown>) ?? {},
    user_agent: (r.user_agent as string | null) ?? null,
    referrer: (r.referrer as string | null) ?? null,
    created_at: r.created_at as string,
  };
}

function validateCreate(input: CreateLeadMagnetInput): string | null {
  if (!input.title?.trim()) return "Title is required.";
  if (input.cta?.type === "link" && !input.cta.href?.trim()) {
    return "CTA href is required when type='link'.";
  }
  if (input.expires_in_days !== undefined) {
    if (
      !Number.isFinite(input.expires_in_days) ||
      input.expires_in_days <= 0
    ) {
      return "expires_in_days must be a positive number.";
    }
  }
  return null;
}

function normalizeCta(cta?: Partial<LeadMagnetCta>): LeadMagnetCta {
  const merged: LeadMagnetCta = { ...DEFAULT_CTA, ...(cta ?? {}) };
  if (merged.type !== "link") merged.type = "form";
  if (merged.type === "form" && (!merged.fields || merged.fields.length === 0)) {
    merged.fields = ["name", "email"];
  }
  return merged;
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

async function createLeadMagnetImpl(
  input: CreateLeadMagnetInput,
): Promise<Result<LeadMagnet>> {
  let userId: string;
  try {
    userId = await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const err = validateCreate(input);
  if (err) return { ok: false, error: err };

  const supabase = await db();

  const expiresAt = new Date(
    Date.now() + (input.expires_in_days ?? 90) * 24 * 60 * 60 * 1000,
  ).toISOString();

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = generateSlug();
    const payload = {
      slug,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      eyebrow: input.eyebrow?.trim() || null,
      hero_image_url: input.hero_image_url?.trim() || null,
      content: input.content ?? [],
      cta: normalizeCta(input.cta),
      theme: input.theme ?? {},
      owner_name: input.owner_name?.trim() || null,
      owner_email: input.owner_email?.trim() || null,
      status: input.status ?? "draft",
      expires_at: expiresAt,
      created_by: userId,
    };
    const { data, error } = await supabase
      .from("gtm_lead_magnets")
      .insert(payload)
      .select("*")
      .single();
    if (!error && data) {
      revalidatePath("/gtm/lead-magnets");
      return { ok: true, data: rowToLeadMagnet(data) };
    }
    lastError = error?.message ?? "Insert failed";
    if (error && (error as { code?: string }).code !== "23505") break;
  }
  return { ok: false, error: lastError ?? "Could not create lead magnet." };
}

export async function createLeadMagnet(
  input: CreateLeadMagnetInput,
): Promise<Result<LeadMagnet>> {
  return createLeadMagnetImpl(input);
}

export async function createLeadMagnetOrThrow(
  input: CreateLeadMagnetInput,
): Promise<LeadMagnet> {
  const r = await createLeadMagnetImpl(input);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// READ (admin)
// ---------------------------------------------------------------------------

export async function listLeadMagnets(opts?: {
  includeArchived?: boolean;
}): Promise<LeadMagnet[]> {
  await requireAdminOrAbove();
  const supabase = await db();
  let q = supabase
    .from("gtm_lead_magnets")
    .select("*")
    .order("created_at", { ascending: false });
  if (!opts?.includeArchived) q = q.neq("status", "archived");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToLeadMagnet);
}

export async function getLeadMagnet(id: string): Promise<LeadMagnet | null> {
  await requireAdminOrAbove();
  const supabase = await db();
  const { data, error } = await supabase
    .from("gtm_lead_magnets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToLeadMagnet(data) : null;
}

export async function listLeadMagnetSubmissions(
  leadMagnetId: string,
): Promise<LeadMagnetSubmission[]> {
  await requireAdminOrAbove();
  const supabase = await db();
  const { data, error } = await supabase
    .from("gtm_lead_magnet_submissions")
    .select("*")
    .eq("lead_magnet_id", leadMagnetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSubmission);
}

// ---------------------------------------------------------------------------
// READ (public — service-role)
// ---------------------------------------------------------------------------

/**
 * Public read for /lead-magnet/<slug>. Bypasses RLS via the admin client.
 * Increments view_count + sets last_viewed_at as a side effect.
 */
export async function getLeadMagnetBySlug(
  slug: string,
): Promise<LeadMagnet | null> {
  if (!slug || typeof slug !== "string") return null;
  let admin;
  try {
    admin = getAdminClient();
  } catch {
    return null;
  }
  const { data, error } = await admin
    .from("gtm_lead_magnets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  // Best-effort tracking; do not fail the page if this errors.
  try {
    await admin
      .from("gtm_lead_magnets")
      .update({
        view_count: ((data.view_count as number) ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  } catch {
    /* ignore */
  }
  return rowToLeadMagnet(data);
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

async function updateLeadMagnetImpl(
  id: string,
  patch: UpdateLeadMagnetInput,
): Promise<Result<LeadMagnet>> {
  try {
    await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!id) return { ok: false, error: "Lead magnet id is required." };

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.subtitle !== undefined)
    update.subtitle = patch.subtitle?.trim() || null;
  if (patch.eyebrow !== undefined)
    update.eyebrow = patch.eyebrow?.trim() || null;
  if (patch.hero_image_url !== undefined)
    update.hero_image_url = patch.hero_image_url?.trim() || null;
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.cta !== undefined) update.cta = normalizeCta(patch.cta);
  if (patch.theme !== undefined) update.theme = patch.theme;
  if (patch.owner_name !== undefined)
    update.owner_name = patch.owner_name?.trim() || null;
  if (patch.owner_email !== undefined)
    update.owner_email = patch.owner_email?.trim() || null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.expires_at !== undefined)
    update.expires_at = patch.expires_at ?? new Date().toISOString();

  const supabase = await db();
  const { data, error } = await supabase
    .from("gtm_lead_magnets")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed" };
  }
  revalidatePath("/gtm/lead-magnets");
  revalidatePath(`/gtm/lead-magnets/${id}`);
  revalidatePath(`/lead-magnet/${data.slug}`);
  return { ok: true, data: rowToLeadMagnet(data) };
}

export async function updateLeadMagnet(
  id: string,
  patch: UpdateLeadMagnetInput,
): Promise<Result<LeadMagnet>> {
  return updateLeadMagnetImpl(id, patch);
}

export async function updateLeadMagnetOrThrow(
  id: string,
  patch: UpdateLeadMagnetInput,
): Promise<LeadMagnet> {
  const r = await updateLeadMagnetImpl(id, patch);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// ARCHIVE / RESTORE / PUBLISH
// ---------------------------------------------------------------------------

export async function archiveLeadMagnet(
  id: string,
): Promise<Result<LeadMagnet>> {
  return updateLeadMagnetImpl(id, { status: "archived" });
}

export async function restoreLeadMagnet(
  id: string,
): Promise<Result<LeadMagnet>> {
  return updateLeadMagnetImpl(id, { status: "active" });
}

export async function publishLeadMagnet(
  id: string,
): Promise<Result<LeadMagnet>> {
  return updateLeadMagnetImpl(id, { status: "active" });
}

export async function archiveLeadMagnetOrThrow(
  id: string,
): Promise<LeadMagnet> {
  const r = await archiveLeadMagnet(id);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

async function deleteLeadMagnetImpl(
  id: string,
): Promise<Result<{ id: string }>> {
  try {
    await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!id) return { ok: false, error: "Lead magnet id is required." };
  const supabase = await db();
  const { error } = await supabase
    .from("gtm_lead_magnets")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/gtm/lead-magnets");
  return { ok: true, data: { id } };
}

export async function deleteLeadMagnet(
  id: string,
): Promise<Result<{ id: string }>> {
  return deleteLeadMagnetImpl(id);
}

export async function deleteLeadMagnetOrThrow(
  id: string,
): Promise<{ id: string }> {
  const r = await deleteLeadMagnetImpl(id);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// PUBLIC SUBMISSION
// ---------------------------------------------------------------------------

export type SubmitLeadMagnetInput = {
  slug: string;
  name?: string;
  email?: string;
  phone?: string;
  property_address?: string;
  message?: string;
  extra?: Record<string, unknown>;
  user_agent?: string;
  referrer?: string;
};

/**
 * Public-facing submission. Runs through the service-role admin client
 * so unauthenticated visitors can post without an RLS public-insert
 * policy (mirrors how /pitch reads work).
 */
export async function submitLeadMagnet(
  input: SubmitLeadMagnetInput,
): Promise<Result<{ id: string }>> {
  if (!input?.slug) return { ok: false, error: "Missing slug." };

  let admin;
  try {
    admin = getAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const { data: magnet, error: lookupErr } = await admin
    .from("gtm_lead_magnets")
    .select("id, status, expires_at, submission_count")
    .eq("slug", input.slug)
    .maybeSingle();
  if (lookupErr || !magnet) {
    return { ok: false, error: "Lead magnet not found." };
  }
  if (magnet.status !== "active") {
    return { ok: false, error: "This page is not currently accepting submissions." };
  }
  if (
    magnet.expires_at &&
    new Date(magnet.expires_at as string).getTime() < Date.now()
  ) {
    return { ok: false, error: "This page has expired." };
  }

  // Light email shape check — keep it permissive.
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const payload = {
    lead_magnet_id: magnet.id as string,
    name: input.name?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    property_address: input.property_address?.trim() || null,
    message: input.message?.trim() || null,
    extra: input.extra ?? {},
    user_agent: input.user_agent?.slice(0, 500) || null,
    referrer: input.referrer?.slice(0, 500) || null,
  };

  const { data, error } = await admin
    .from("gtm_lead_magnet_submissions")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Submission failed." };
  }

  // Best-effort counter bump.
  try {
    await admin
      .from("gtm_lead_magnets")
      .update({
        submission_count: ((magnet.submission_count as number) ?? 0) + 1,
        last_submission_at: new Date().toISOString(),
      })
      .eq("id", magnet.id);
  } catch {
    /* ignore */
  }

  return { ok: true, data: { id: data.id as string } };
}

// ---------------------------------------------------------------------------
// Public URL helper
// ---------------------------------------------------------------------------

export async function getLeadMagnetPublicUrl(slug: string): Promise<string> {
  return canonicalUrl(`/lead-magnet/${slug}`);
}
