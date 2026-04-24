"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getPermissions,
  visibleEmployeeIds,
  requireEmployeeAccess,
} from "@/lib/auth/permissions";
import type {
  DbCandidate,
  DbEmployee,
  DbHrDoc,
  DbHrIssue,
  DbPerformanceReview,
  DbRole,
} from "./types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentEmail(): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/**
 * Legacy HR admin check. Kept for compatibility with callers that pass in
 * a specific email (e.g. the agent tool registry). Returns true if the user
 * has ANY HR access (super_admin or any grant). For per-employee access
 * checks, use canAccessEmployee from lib/auth/permissions.
 */
export async function isHrAdmin(email?: string | null): Promise<boolean> {
  // If an email is passed, look up that user's permissions explicitly.
  if (email) {
    const supabase = await db();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .ilike("email", email)
      .maybeSingle();
    if (!profile) return false;
    if (profile.role === "super_admin") return true;
    const { data: grants } = await supabase
      .from("hr_access_grants")
      .select("id")
      .eq("grantee_id", profile.id)
      .limit(1);
    return (grants?.length ?? 0) > 0;
  }
  // No email passed — use the current session.
  const perm = await getPermissions();
  return perm.has_any_hr_access;
}

/**
 * Guard used by HR mutation/read actions.
 * Any caller with has_any_hr_access passes; concrete row-level filtering
 * (which employees are visible) is done via visibleEmployeeIds / canAccessEmployee.
 */
async function requireHrAdmin(): Promise<string> {
  const perm = await getPermissions();
  if (!perm.user_id) throw new Error("Not signed in");
  if (!perm.has_any_hr_access)
    throw new Error(
      "HR access required — ask a super admin to grant you HR access",
    );
  return perm.email ?? "";
}

function revalidateHr() {
  revalidatePath("/hr");
  revalidatePath("/hr/hiring");
  revalidatePath("/hr/policies");
  revalidatePath("/hr/procedures");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// Admin whitelist
// ---------------------------------------------------------------------------

export async function listHrAdmins(): Promise<string[]> {
  await requireHrAdmin();
  const supabase = await db();
  const { data } = await supabase.from("hr_admins").select("email").order("email");
  return ((data ?? []) as { email: string }[]).map((r) => r.email);
}

export async function addHrAdmin(email: string): Promise<void> {
  await requireHrAdmin();
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) throw new Error("Valid email required");
  const supabase = await db();
  await supabase.from("hr_admins").upsert({ email: clean }, { onConflict: "email" });
  revalidatePath("/settings");
}

export async function removeHrAdmin(email: string): Promise<void> {
  const caller = await requireHrAdmin();
  if (email.toLowerCase() === caller.toLowerCase()) {
    throw new Error("You can't remove yourself — ask another admin to do it.");
  }
  const supabase = await db();
  await supabase.from("hr_admins").delete().eq("email", email);
  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export async function listEmployees(): Promise<DbEmployee[]> {
  await requireHrAdmin();
  const supabase = await db();
  const visible = await visibleEmployeeIds();
  let q = supabase
    .from("hr_employees")
    .select("*")
    .order("status", { ascending: true })
    .order("full_name", { ascending: true });
  if (visible !== null) {
    if (visible.length === 0) return [];
    q = q.in("id", visible);
  }
  const { data } = await q;
  return (data ?? []) as DbEmployee[];
}

export async function getEmployee(id: string): Promise<DbEmployee | null> {
  await requireEmployeeAccess(id);
  const supabase = await db();
  const { data } = await supabase
    .from("hr_employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as DbEmployee | null;
}

export async function createEmployee(input: {
  full_name: string;
  email?: string;
  role_title?: string;
  department?: string;
  start_date?: string;
  status?: string;
  notes?: string;
}): Promise<DbEmployee> {
  await requireHrAdmin();
  const supabase = await db();
  if (!input.full_name.trim()) throw new Error("Name is required");
  const { data, error } = await supabase
    .from("hr_employees")
    .insert({
      full_name: input.full_name.trim(),
      email: input.email?.trim() || null,
      role_title: input.role_title?.trim() || null,
      department: input.department?.trim() || null,
      start_date: input.start_date || null,
      status: input.status || "active",
      notes: input.notes ?? "",
    })
    .select()
    .single();
  if (error) throw error;
  revalidateHr();
  return data as DbEmployee;
}

export async function updateEmployee(
  id: string,
  input: Partial<{
    full_name: string;
    email: string | null;
    role_title: string | null;
    department: string | null;
    department_id: string | null;
    start_date: string | null;
    status: string;
    notes: string;
  }>,
): Promise<void> {
  await requireEmployeeAccess(id);
  const supabase = await db();
  await supabase.from("hr_employees").update(input).eq("id", id);
  revalidateHr();
  revalidatePath(`/hr/people/${id}`);
}

export async function deleteEmployee(id: string): Promise<void> {
  await requireEmployeeAccess(id);
  const supabase = await db();
  await supabase.from("hr_employees").delete().eq("id", id);
  revalidateHr();
}

// ---------------------------------------------------------------------------
// Performance reviews
// ---------------------------------------------------------------------------

export async function listReviews(employeeId: string): Promise<DbPerformanceReview[]> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  const { data } = await supabase
    .from("hr_performance_reviews")
    .select("*")
    .eq("employee_id", employeeId)
    .order("review_date", { ascending: false });
  return (data ?? []) as DbPerformanceReview[];
}

export async function createReview(input: {
  employee_id: string;
  review_date?: string;
  rating?: string;
  summary?: string;
  goals?: string;
}): Promise<void> {
  await requireEmployeeAccess(input.employee_id);
  const email = await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_performance_reviews").insert({
    employee_id: input.employee_id,
    review_date: input.review_date || new Date().toISOString().slice(0, 10),
    reviewer_email: email,
    rating: input.rating ?? null,
    summary: input.summary ?? "",
    goals: input.goals ?? "",
  });
  revalidatePath(`/hr/people/${input.employee_id}`);
}

export async function updateReview(
  id: string,
  input: Partial<{ review_date: string; rating: string | null; summary: string; goals: string }>,
  employeeId: string,
): Promise<void> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  await supabase.from("hr_performance_reviews").update(input).eq("id", id);
  revalidatePath(`/hr/people/${employeeId}`);
}

export async function deleteReview(id: string, employeeId: string): Promise<void> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  await supabase.from("hr_performance_reviews").delete().eq("id", id);
  revalidatePath(`/hr/people/${employeeId}`);
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export async function listIssues(employeeId: string): Promise<DbHrIssue[]> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  const { data } = await supabase
    .from("hr_issues")
    .select("*")
    .eq("employee_id", employeeId)
    .order("reported_date", { ascending: false });
  return (data ?? []) as DbHrIssue[];
}

export async function createIssue(input: {
  employee_id: string;
  title: string;
  description?: string;
  category?: string;
  severity?: string;
  status?: string;
  reported_date?: string;
}): Promise<void> {
  await requireEmployeeAccess(input.employee_id);
  const email = await requireHrAdmin();
  const supabase = await db();
  if (!input.title.trim()) throw new Error("Title is required");
  await supabase.from("hr_issues").insert({
    employee_id: input.employee_id,
    title: input.title.trim(),
    description: input.description ?? "",
    category: input.category ?? "other",
    severity: input.severity ?? "low",
    status: input.status ?? "open",
    reported_by: email,
    reported_date: input.reported_date || new Date().toISOString().slice(0, 10),
  });
  revalidatePath(`/hr/people/${input.employee_id}`);
}

export async function updateIssue(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    category: string;
    severity: string;
    status: string;
    resolution: string;
    reported_date: string;
  }>,
  employeeId: string,
): Promise<void> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  await supabase.from("hr_issues").update(input).eq("id", id);
  revalidatePath(`/hr/people/${employeeId}`);
}

export async function deleteIssue(id: string, employeeId: string): Promise<void> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();
  await supabase.from("hr_issues").delete().eq("id", id);
  revalidatePath(`/hr/people/${employeeId}`);
}

// ---------------------------------------------------------------------------
// Hiring — roles
// ---------------------------------------------------------------------------

export async function listRoles(): Promise<DbRole[]> {
  await requireHrAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });
  return (data ?? []) as DbRole[];
}

export async function getRole(id: string): Promise<DbRole | null> {
  await requireHrAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as DbRole | null;
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = await db();
  let slug = base;
  let i = 1;
  // Try up to 50 variants
  while (i < 50) {
    let query = supabase.from("hr_roles").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function createRole(input: {
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  responsibilities?: string;
  perks?: string;
  status?: string;
}): Promise<DbRole> {
  await requireHrAdmin();
  const supabase = await db();
  if (!input.title.trim()) throw new Error("Title is required");
  const baseSlug = slugify(input.title) || "role";
  const slug = await ensureUniqueSlug(baseSlug);
  const { data, error } = await supabase
    .from("hr_roles")
    .insert({
      slug,
      title: input.title.trim(),
      department: input.department?.trim() || null,
      location: input.location?.trim() || null,
      employment_type: input.employment_type || null,
      description: input.description ?? "",
      responsibilities: input.responsibilities ?? "",
      perks: input.perks ?? "",
      status: input.status || "draft",
    })
    .select()
    .single();
  if (error) throw error;
  revalidateHr();
  revalidatePath("/careers");
  return data as DbRole;
}

export async function updateRole(
  id: string,
  input: Partial<{
    title: string;
    department: string | null;
    location: string | null;
    employment_type: string | null;
    description: string;
    responsibilities: string;
    perks: string;
    status: string;
    slug: string;
  }>,
): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  const payload = { ...input };
  // If slug was provided, ensure uniqueness
  if (payload.slug) {
    payload.slug = await ensureUniqueSlug(slugify(payload.slug), id);
  }
  await supabase.from("hr_roles").update(payload).eq("id", id);
  revalidateHr();
  revalidatePath("/careers");
  revalidatePath(`/hr/hiring/${id}`);
}

export async function deleteRole(id: string): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_roles").delete().eq("id", id);
  revalidateHr();
  revalidatePath("/careers");
}

// ---------------------------------------------------------------------------
// Hiring — candidates (admin)
// ---------------------------------------------------------------------------

export async function listCandidates(roleId: string): Promise<DbCandidate[]> {
  await requireHrAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from("hr_candidates")
    .select("*")
    .eq("role_id", roleId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DbCandidate[];
}

export async function createCandidate(input: {
  role_id: string;
  name: string;
  email?: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  source?: string;
  stage?: string;
  notes?: string;
}): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  if (!input.name.trim()) throw new Error("Name is required");
  await supabase.from("hr_candidates").insert({
    role_id: input.role_id,
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    resume_url: input.resume_url?.trim() || null,
    cover_letter: input.cover_letter ?? "",
    source: input.source || "manual",
    stage: input.stage || "applied",
    notes: input.notes ?? "",
  });
  revalidatePath(`/hr/hiring/${input.role_id}`);
}

export async function updateCandidateStage(
  id: string,
  stage: string,
  roleId: string,
): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_candidates").update({ stage }).eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
}

export async function updateCandidate(
  id: string,
  input: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    resume_url: string | null;
    cover_letter: string;
    stage: string;
    notes: string;
  }>,
  roleId: string,
): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_candidates").update(input).eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
}

export async function deleteCandidate(id: string, roleId: string): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_candidates").delete().eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
}

// ---------------------------------------------------------------------------
// Policies & Procedures
// ---------------------------------------------------------------------------

export async function listDocs(kind: "policy" | "procedure"): Promise<DbHrDoc[]> {
  await requireHrAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from("hr_docs")
    .select("*")
    .eq("kind", kind)
    .order("updated_at", { ascending: false });
  return (data ?? []) as DbHrDoc[];
}

export async function createDoc(input: {
  kind: "policy" | "procedure";
  title: string;
  body?: string;
}): Promise<void> {
  const email = await requireHrAdmin();
  const supabase = await db();
  if (!input.title.trim()) throw new Error("Title is required");
  await supabase.from("hr_docs").insert({
    kind: input.kind,
    title: input.title.trim(),
    body: input.body ?? "",
    created_by: email,
  });
  revalidatePath(`/hr/${input.kind === "policy" ? "policies" : "procedures"}`);
}

export async function updateDoc(
  id: string,
  input: { title: string; body: string },
  kind: "policy" | "procedure",
): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_docs").update(input).eq("id", id);
  revalidatePath(`/hr/${kind === "policy" ? "policies" : "procedures"}`);
}

export async function deleteDoc(id: string, kind: "policy" | "procedure"): Promise<void> {
  await requireHrAdmin();
  const supabase = await db();
  await supabase.from("hr_docs").delete().eq("id", id);
  revalidatePath(`/hr/${kind === "policy" ? "policies" : "procedures"}`);
}
