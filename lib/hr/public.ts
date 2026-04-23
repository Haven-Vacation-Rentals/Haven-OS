"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DbRole } from "./types";

/**
 * Public (unauthenticated) helpers that power /careers landing pages.
 * These bypass the HR admin gate — DB RLS is set up so anon users can:
 *   - SELECT hr_roles where status='open'
 *   - INSERT hr_candidates
 */

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export async function listPublicRoles(): Promise<DbRole[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .eq("status", "open")
    .order("updated_at", { ascending: false });
  return (data ?? []) as DbRole[];
}

export async function getPublicRoleBySlug(slug: string): Promise<DbRole | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "open")
    .maybeSingle();
  return (data ?? null) as DbRole | null;
}

export async function submitApplication(input: {
  role_id: string;
  role_slug: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
}): Promise<{ ok: true }> {
  if (!input.name.trim()) throw new Error("Name is required");
  if (!input.email.trim() || !input.email.includes("@")) {
    throw new Error("Valid email is required");
  }
  const supabase = await db();

  // Verify role is actually open (defence in depth beyond RLS)
  const { data: role } = await supabase
    .from("hr_roles")
    .select("id, status")
    .eq("id", input.role_id)
    .eq("status", "open")
    .maybeSingle();
  if (!role) throw new Error("This role is no longer accepting applications.");

  const { error } = await supabase.from("hr_candidates").insert({
    role_id: input.role_id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    resume_url: input.resume_url?.trim() || null,
    cover_letter: input.cover_letter ?? "",
    source: "public_form",
    stage: "applied",
  });
  if (error) throw error;

  revalidatePath("/careers");
  revalidatePath(`/careers/${input.role_slug}`);
  return { ok: true };
}
