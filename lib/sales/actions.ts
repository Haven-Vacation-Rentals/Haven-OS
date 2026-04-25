/**
 * Haven OS — sales pitch actions
 * ---------------------------------------------------------------------------
 * CRUD over `public.sales_pitches`. The internal admin-facing actions
 * require admin or super_admin role. The public reader for /pitch/<slug>
 * uses the service-role admin client because that page is unauthenticated.
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
import { extractListing, type ExtractedListing } from "@/lib/sales/listing-extractor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SalesPitchStatus = "active" | "archived";
export type SalesListingSource =
  | "zillow"
  | "airbnb"
  | "vrbo"
  | "booking"
  | "other";

export type SalesPitch = {
  id: string;
  slug: string;
  owner_name: string;
  owner_email: string | null;
  property_address: string;
  listing_url: string | null;
  listing_source: SalesListingSource;
  beds: number | null;
  baths: number | null;
  sleeps: number | null;
  hero_image_url: string | null;
  gallery: { url: string; alt?: string }[];
  projection_low: number;
  projection_high: number;
  projection_note: string | null;
  status: SalesPitchStatus;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  last_viewed_at: string | null;
};

export type CreatePitchInput = {
  owner_name: string;
  owner_email?: string;
  property_address: string;
  listing_url?: string;
  listing_source?: SalesListingSource;
  beds?: number;
  baths?: number;
  sleeps?: number;
  hero_image_url?: string;
  gallery?: { url: string; alt?: string }[];
  projection_low: number;
  projection_high: number;
  projection_note?: string;
};

export type UpdatePitchInput = Partial<CreatePitchInput> & {
  status?: SalesPitchStatus;
  expires_at?: string;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

/** 12-char hex slug. ~48 bits of entropy — plenty for unguessable URLs. */
function generateSlug(): string {
  // Build six bytes of randomness without leaning on Node's `crypto`.
  let hex = "";
  for (let i = 0; i < 12; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

function rowToPitch(r: Record<string, unknown>): SalesPitch {
  return {
    id: r.id as string,
    slug: r.slug as string,
    owner_name: r.owner_name as string,
    owner_email: (r.owner_email as string | null) ?? null,
    property_address: r.property_address as string,
    listing_url: (r.listing_url as string | null) ?? null,
    listing_source: (r.listing_source as SalesListingSource) ?? "other",
    beds: (r.beds as number | null) ?? null,
    baths: (r.baths as number | null) ?? null,
    sleeps: (r.sleeps as number | null) ?? null,
    hero_image_url: (r.hero_image_url as string | null) ?? null,
    gallery: Array.isArray(r.gallery)
      ? (r.gallery as { url: string; alt?: string }[])
      : [],
    projection_low: r.projection_low as number,
    projection_high: r.projection_high as number,
    projection_note: (r.projection_note as string | null) ?? null,
    status: r.status as SalesPitchStatus,
    created_by: (r.created_by as string | null) ?? null,
    created_at: r.created_at as string,
    expires_at: r.expires_at as string,
    view_count: (r.view_count as number) ?? 0,
    last_viewed_at: (r.last_viewed_at as string | null) ?? null,
  };
}

function validateInput(input: CreatePitchInput): string | null {
  if (!input.owner_name?.trim()) return "Owner name is required.";
  if (!input.property_address?.trim()) return "Property address is required.";
  if (
    !Number.isFinite(input.projection_low) ||
    !Number.isFinite(input.projection_high)
  ) {
    return "Projection range must be numbers.";
  }
  if (input.projection_low < 0 || input.projection_high < 0) {
    return "Projection values must be positive.";
  }
  if (input.projection_high < input.projection_low) {
    return "Projection high must be greater than or equal to low.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Listing extraction (admin-only — uses outbound fetch)
// ---------------------------------------------------------------------------

export async function extractListingDetails(
  url: string,
): Promise<Result<ExtractedListing>> {
  try {
    await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!url || typeof url !== "string") {
    return { ok: false, error: "URL is required." };
  }
  try {
    const data = await extractListing(url);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to extract listing.",
    };
  }
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

async function createPitchImpl(
  input: CreatePitchInput,
): Promise<Result<SalesPitch>> {
  let userId: string;
  try {
    userId = await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const err = validateInput(input);
  if (err) return { ok: false, error: err };

  const supabase = await db();

  // Try a few times in the (extremely unlikely) event of a slug collision.
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = generateSlug();
    const payload = {
      slug,
      owner_name: input.owner_name.trim(),
      owner_email: input.owner_email?.trim() || null,
      property_address: input.property_address.trim(),
      listing_url: input.listing_url?.trim() || null,
      listing_source: input.listing_source ?? "other",
      beds: input.beds ?? null,
      baths: input.baths ?? null,
      sleeps: input.sleeps ?? null,
      hero_image_url: input.hero_image_url?.trim() || null,
      gallery: input.gallery ?? [],
      projection_low: Math.round(input.projection_low),
      projection_high: Math.round(input.projection_high),
      projection_note: input.projection_note?.trim() || null,
      created_by: userId,
    };
    const { data, error } = await supabase
      .from("sales_pitches")
      .insert(payload)
      .select("*")
      .single();
    if (!error && data) {
      revalidatePath("/sales/pitches");
      return { ok: true, data: rowToPitch(data) };
    }
    lastError = error?.message ?? "Insert failed";
    // 23505 = unique_violation. Retry with a new slug.
    if (error && (error as { code?: string }).code !== "23505") break;
  }
  return { ok: false, error: lastError ?? "Could not create pitch." };
}

export async function createPitch(
  input: CreatePitchInput,
): Promise<Result<SalesPitch>> {
  return createPitchImpl(input);
}

export async function createPitchOrThrow(
  input: CreatePitchInput,
): Promise<SalesPitch> {
  const r = await createPitchImpl(input);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// READ (admin)
// ---------------------------------------------------------------------------

export async function listPitches(opts?: {
  includeArchived?: boolean;
}): Promise<SalesPitch[]> {
  await requireAdminOrAbove();
  const supabase = await db();
  let q = supabase
    .from("sales_pitches")
    .select("*")
    .order("created_at", { ascending: false });
  if (!opts?.includeArchived) q = q.eq("status", "active");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToPitch);
}

export async function getPitch(id: string): Promise<SalesPitch | null> {
  await requireAdminOrAbove();
  const supabase = await db();
  const { data, error } = await supabase
    .from("sales_pitches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPitch(data) : null;
}

// ---------------------------------------------------------------------------
// READ (public — service-role)
// ---------------------------------------------------------------------------

/**
 * Public read for /pitch/<slug>. Bypasses RLS via the admin client.
 * Increments view_count + sets last_viewed_at as a side effect.
 */
export async function getPitchBySlug(
  slug: string,
): Promise<SalesPitch | null> {
  if (!slug || typeof slug !== "string") return null;
  let admin;
  try {
    admin = getAdminClient();
  } catch {
    return null;
  }
  const { data, error } = await admin
    .from("sales_pitches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  // Best-effort tracking; do not fail the page if this errors.
  try {
    await admin
      .from("sales_pitches")
      .update({
        view_count: ((data.view_count as number) ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  } catch {
    /* ignore */
  }
  return rowToPitch(data);
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

async function updatePitchImpl(
  id: string,
  patch: UpdatePitchInput,
): Promise<Result<SalesPitch>> {
  try {
    await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!id) return { ok: false, error: "Pitch id is required." };

  // Normalize patch values.
  const update: Record<string, unknown> = {};
  if (patch.owner_name !== undefined) update.owner_name = patch.owner_name.trim();
  if (patch.owner_email !== undefined)
    update.owner_email = patch.owner_email?.trim() || null;
  if (patch.property_address !== undefined)
    update.property_address = patch.property_address.trim();
  if (patch.listing_url !== undefined)
    update.listing_url = patch.listing_url?.trim() || null;
  if (patch.listing_source !== undefined)
    update.listing_source = patch.listing_source;
  if (patch.beds !== undefined) update.beds = patch.beds ?? null;
  if (patch.baths !== undefined) update.baths = patch.baths ?? null;
  if (patch.sleeps !== undefined) update.sleeps = patch.sleeps ?? null;
  if (patch.hero_image_url !== undefined)
    update.hero_image_url = patch.hero_image_url?.trim() || null;
  if (patch.gallery !== undefined) update.gallery = patch.gallery;
  if (patch.projection_low !== undefined)
    update.projection_low = Math.round(patch.projection_low);
  if (patch.projection_high !== undefined)
    update.projection_high = Math.round(patch.projection_high);
  if (patch.projection_note !== undefined)
    update.projection_note = patch.projection_note?.trim() || null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.expires_at !== undefined) update.expires_at = patch.expires_at;

  if (
    update.projection_low !== undefined &&
    update.projection_high !== undefined &&
    (update.projection_high as number) < (update.projection_low as number)
  ) {
    return { ok: false, error: "Projection high must be >= low." };
  }

  const supabase = await db();
  const { data, error } = await supabase
    .from("sales_pitches")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed" };
  }
  revalidatePath("/sales/pitches");
  revalidatePath(`/sales/pitches/${id}`);
  return { ok: true, data: rowToPitch(data) };
}

export async function updatePitch(
  id: string,
  patch: UpdatePitchInput,
): Promise<Result<SalesPitch>> {
  return updatePitchImpl(id, patch);
}

export async function updatePitchOrThrow(
  id: string,
  patch: UpdatePitchInput,
): Promise<SalesPitch> {
  const r = await updatePitchImpl(id, patch);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// ARCHIVE / RESTORE
// ---------------------------------------------------------------------------

export async function archivePitch(id: string): Promise<Result<SalesPitch>> {
  return updatePitchImpl(id, { status: "archived" });
}

export async function restorePitch(id: string): Promise<Result<SalesPitch>> {
  return updatePitchImpl(id, { status: "active" });
}

export async function archivePitchOrThrow(id: string): Promise<SalesPitch> {
  const r = await archivePitch(id);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

async function deletePitchImpl(id: string): Promise<Result<{ id: string }>> {
  try {
    await requireAdminOrAbove();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!id) return { ok: false, error: "Pitch id is required." };
  const supabase = await db();
  const { error } = await supabase.from("sales_pitches").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sales/pitches");
  return { ok: true, data: { id } };
}

export async function deletePitch(id: string): Promise<Result<{ id: string }>> {
  return deletePitchImpl(id);
}

export async function deletePitchOrThrow(id: string): Promise<{ id: string }> {
  const r = await deletePitchImpl(id);
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// ---------------------------------------------------------------------------
// Public URL helper
// ---------------------------------------------------------------------------

export async function getPitchPublicUrl(slug: string): Promise<string> {
  const base =
    process.env.NEXT_PUBLIC_PITCH_BASE_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "";
  if (base) return `${base}/pitch/${slug}`;
  return `/pitch/${slug}`;
}
