"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn } from "@/lib/auth/permissions";
import type { Property, PropertyUpdateInput } from "./types";

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
