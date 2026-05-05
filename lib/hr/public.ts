"use server";

import { createClient } from "@/lib/supabase/server";
import type { DbRole, DbRoleQuestion } from "./types";

/**
 * Public (unauthenticated) helpers that power /careers landing pages.
 *
 * Reads (`hr_roles` open + `hr_role_questions` for those roles) go through
 * the SSR Supabase client because their RLS policies grant anon SELECT
 * directly. Application submissions are handled by the server-only API
 * route at `/api/public/career-apply`, which uses the service-role client
 * — there's no public anon INSERT into `hr_candidates`.
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

export async function getPublicRoleQuestions(
  roleId: string,
): Promise<DbRoleQuestion[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_role_questions")
    .select("*")
    .eq("role_id", roleId)
    .is("archived_at", null)
    .order("position", { ascending: true });
  return ((data ?? []) as DbRoleQuestion[]).map((q) => ({
    ...q,
    config: q.config ?? {},
  }));
}
