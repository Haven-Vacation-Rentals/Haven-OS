"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyUpdateInput } from "./types";

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

export async function archiveProperty(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("properties")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/properties", "layout");
}
