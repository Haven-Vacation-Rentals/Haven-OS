"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth/permissions";
import type {
  Property,
  PropertyFilter,
  PropertyUpdateInput,
} from "./types";

export type CreatePropertyInput = Partial<
  Omit<Property, "id" | "created_at" | "updated_at" | "archived_at">
> & {
  name: string;
};

export type CreatePropertyResult =
  | { ok: true; data: Property }
  | { ok: false; error: string };

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getProperties(): Promise<Property[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Property[];
}

export interface PropertyQuery extends PropertyFilter {
  page?: number;
  page_size?: number;
}

export interface PaginatedProperties {
  properties: Property[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Server-side property search + pagination.
 *
 * Uses the `search_vector` tsvector column (migration 0031) for >=3 char
 * queries — covers name, address, region, account_manager,
 * revenue_manager, notes. Shorter queries fall back to `ilike` on name
 * + address. Returns the page slice plus the total count for pagination
 * UI; the filtered total respects all facets.
 */
export async function getPropertiesPaginated(
  q: PropertyQuery = {},
): Promise<PaginatedProperties> {
  const supabase = await db();
  const pageSize = Math.min(Math.max(q.page_size ?? 50, 10), 200);
  const page = Math.max(q.page ?? 0, 0);

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .is("archived_at", null);

  if (q.status && q.status !== "all") query = query.eq("status", q.status);
  if (q.tier && q.tier !== "all") query = query.eq("tier", q.tier);
  if (q.region && q.region !== "all") query = query.eq("region", q.region);
  if (q.account_manager && q.account_manager !== "all")
    query = query.eq("account_manager", q.account_manager);
  if (q.airbnb_account && q.airbnb_account !== "all")
    query = query.eq("airbnb_account", q.airbnb_account);

  const term = q.search?.trim();
  if (term && term.length >= 3) {
    query = query.textSearch("search_vector", term, {
      type: "websearch",
      config: "english",
    });
  } else if (term && term.length > 0) {
    // Short queries — fall back to ilike on the user-visible identifiers.
    query = query.or(
      `name.ilike.%${term}%,address.ilike.%${term}%,region.ilike.%${term}%`,
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.order("name").range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    properties: (data ?? []) as Property[],
    total,
    page,
    page_size: pageSize,
    has_more: from + (data?.length ?? 0) < total,
  };
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Property;
}

/**
 * Distinct facet values for filter chips. Computed in Node since Supabase
 * doesn't have a clean distinct primitive.
 */
export async function getPropertyFacets(): Promise<{
  regions: string[];
  account_managers: string[];
  airbnb_accounts: string[];
  revenue_managers: string[];
}> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("properties")
    .select("region, account_manager, airbnb_account, revenue_manager")
    .is("archived_at", null);
  if (error) throw error;

  const regions = new Set<string>();
  const account_managers = new Set<string>();
  const airbnb_accounts = new Set<string>();
  const revenue_managers = new Set<string>();

  for (const row of data ?? []) {
    if (row.region) regions.add(row.region);
    if (row.account_manager) account_managers.add(row.account_manager);
    if (row.airbnb_account) airbnb_accounts.add(row.airbnb_account);
    if (row.revenue_manager) revenue_managers.add(row.revenue_manager);
  }

  return {
    regions: [...regions].sort(),
    account_managers: [...account_managers].sort(),
    airbnb_accounts: [...airbnb_accounts].sort(),
    revenue_managers: [...revenue_managers].sort(),
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function updateProperty(
  id: string,
  input: PropertyUpdateInput,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("properties")
    .update(input)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/properties", "layout");
}

/**
 * Create a new property (app-native, not a Hostaway import).
 *
 * Returns a tagged result so callers can render validation messages
 * without throwing. Hostaway sync still owns `external_id` / `hostaway_id`
 * for imported rows; manually-created rows leave those null unless the
 * caller fills them in.
 */
export async function createProperty(
  input: CreatePropertyInput,
): Promise<CreatePropertyResult> {
  try {
    await requireSignedIn();
    const name = input.name?.trim();
    if (!name) return { ok: false, error: "Name is required" };
    const supabase = await db();

    // Strip empty strings on optional text fields so we don't overwrite the
    // column default (null) with "".
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v === undefined) continue;
      if (typeof v === "string") {
        const t = v.trim();
        clean[k] = t === "" ? null : t;
      } else {
        clean[k] = v;
      }
    }
    clean.name = name;
    if (!clean.status) clean.status = "onboarding";
    if (clean.priority === undefined) clean.priority = "none";
    if (clean.sales_status === undefined) clean.sales_status = "none";
    if (clean.currently_hosting === undefined) clean.currently_hosting = false;

    const { data, error } = await supabase
      .from("properties")
      .insert(clean)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/properties", "layout");
    return { ok: true, data: data as Property };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create property",
    };
  }
}

export async function archiveProperty(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("properties")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/properties", "layout");
}
