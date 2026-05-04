"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getPermissions,
  visibleEmployeeIds,
  requireEmployeeAccess,
  requireHrModule,
  canAccessHrModuleByName,
} from "@/lib/auth/permissions";
import type {
  DbCandidate,
  DbCandidateNote,
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
  revalidatePath("/hr/people");
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
  // People module gates the directory; row-level grants
  // (department/employee scope) further narrow what's returned.
  // For backwards compatibility, a user with department/employee scoped
  // grants but no explicit people-module grant still sees their scoped
  // people. Migration 0032 backfills modules for everyone with grants
  // pre-existing, so this is the rare case where someone has only
  // scope grants from the API.
  const perm = await getPermissions();
  if (!perm.user_id) throw new Error("Not signed in");
  const visible = await visibleEmployeeIds();
  if (!perm.is_super_admin) {
    const hasPeople = await canAccessHrModuleByName("people");
    if (!hasPeople && (visible === null || visible.length === 0)) {
      throw new Error(
        "HR People access required — ask a super admin to grant you the People module.",
      );
    }
  }
  const supabase = await db();
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
  department_id?: string | null;
  profile_id?: string | null;
  start_date?: string;
  status?: string;
  notes?: string;
}): Promise<DbEmployee> {
  await requireHrModule("people");
  const supabase = await db();
  if (!input.full_name.trim()) throw new Error("Name is required");
  const { data, error } = await supabase
    .from("hr_employees")
    .insert({
      full_name: input.full_name.trim(),
      email: input.email?.trim() || null,
      role_title: input.role_title?.trim() || null,
      department: input.department?.trim() || null,
      department_id: input.department_id ?? null,
      profile_id: input.profile_id ?? null,
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
    profile_id: string | null;
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

/**
 * Move an employee to a different department (or clear the assignment with
 * `null`). Resolves the department name for the legacy `department` text
 * column so filters and seeded data stay in sync.
 *
 * Used by both the People directory drag-and-drop UI and the
 * `set_employee_department` agent tool.
 */
export async function setEmployeeDepartment(
  employeeId: string,
  departmentId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireEmployeeAccess(employeeId);
    const supabase = await db();
    let deptName: string | null = null;
    if (departmentId) {
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", departmentId)
        .maybeSingle();
      if (!dept) return { ok: false, error: "Department not found" };
      deptName = (dept.name as string) ?? null;
    }
    const { error } = await supabase
      .from("hr_employees")
      .update({ department_id: departmentId, department: deptName })
      .eq("id", employeeId);
    if (error) return { ok: false, error: error.message };
    revalidateHr();
    revalidatePath("/hr/people");
    revalidatePath(`/hr/people/${employeeId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to move employee",
    };
  }
}

// ---------------------------------------------------------------------------
// Per-employee access view
// ---------------------------------------------------------------------------

export type EmployeeAccessGrantSource =
  | "super_admin"
  | "module"
  | "all"
  | "department"
  | "employee";

export type EmployeeAccessEntry = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  source: EmployeeAccessGrantSource;
  // For 'department' / 'employee' sources, the grant id we'd revoke. Null
  // when access is inherited (super_admin) or via an 'all' grant.
  grant_id: string | null;
  // For 'department' source, the department name that grants the access.
  department_name: string | null;
};

/**
 * Who can currently see this employee's HR file?
 * Returns one entry per (user, source-of-access). Super-admins are listed
 * with source='super_admin'. Users with an 'all' grant are listed with
 * source='all'. Department/employee grants are listed individually so the
 * UI can show how a user got access and offer a revoke action when relevant.
 *
 * Caller must already have access to the employee (caller is the HR person
 * file viewer).
 */
export async function listEmployeeAccess(
  employeeId: string,
): Promise<EmployeeAccessEntry[]> {
  await requireEmployeeAccess(employeeId);
  const supabase = await db();

  const { data: emp } = await supabase
    .from("hr_employees")
    .select("id, department_id")
    .eq("id", employeeId)
    .maybeSingle();
  const deptId = emp?.department_id ?? null;

  const [supersRes, moduleGrantsRes, allGrantsRes, deptGrantsRes, empGrantsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("role", "super_admin"),
      supabase
        .from("hr_module_grants")
        .select(
          "id, module, grantee:profiles!hr_module_grants_grantee_id_fkey(id, email, full_name, role)",
        )
        .eq("module", "people"),
      supabase
        .from("hr_access_grants")
        .select(
          "id, scope, grantee:profiles!hr_access_grants_grantee_id_fkey(id, email, full_name, role)",
        )
        .eq("scope", "all"),
      deptId
        ? supabase
            .from("hr_access_grants")
            .select(
              "id, scope, department_id, grantee:profiles!hr_access_grants_grantee_id_fkey(id, email, full_name, role), department:departments(id, name)",
            )
            .eq("scope", "department")
            .eq("department_id", deptId)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase
        .from("hr_access_grants")
        .select(
          "id, scope, employee_id, grantee:profiles!hr_access_grants_grantee_id_fkey(id, email, full_name, role)",
        )
        .eq("scope", "employee")
        .eq("employee_id", employeeId),
    ]);

  const out: EmployeeAccessEntry[] = [];

  for (const s of (supersRes.data ?? []) as Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
  }>) {
    out.push({
      user_id: s.id,
      email: s.email,
      full_name: s.full_name,
      role: s.role,
      source: "super_admin",
      grant_id: null,
      department_name: null,
    });
  }

  type GranteeShape = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
  };

  for (const g of (moduleGrantsRes.data ?? []) as unknown as Array<{
    id: string;
    grantee: GranteeShape | null;
  }>) {
    if (!g.grantee) continue;
    out.push({
      user_id: g.grantee.id,
      email: g.grantee.email,
      full_name: g.grantee.full_name,
      role: g.grantee.role,
      source: "module",
      grant_id: g.id,
      department_name: null,
    });
  }

  for (const g of (allGrantsRes.data ?? []) as unknown as Array<{
    id: string;
    grantee: GranteeShape | null;
  }>) {
    if (!g.grantee) continue;
    out.push({
      user_id: g.grantee.id,
      email: g.grantee.email,
      full_name: g.grantee.full_name,
      role: g.grantee.role,
      source: "all",
      grant_id: g.id,
      department_name: null,
    });
  }

  for (const g of (deptGrantsRes.data ?? []) as unknown as Array<{
    id: string;
    grantee: GranteeShape | null;
    department: { id: string; name: string } | null;
  }>) {
    if (!g.grantee) continue;
    out.push({
      user_id: g.grantee.id,
      email: g.grantee.email,
      full_name: g.grantee.full_name,
      role: g.grantee.role,
      source: "department",
      grant_id: g.id,
      department_name: g.department?.name ?? null,
    });
  }

  for (const g of (empGrantsRes.data ?? []) as unknown as Array<{
    id: string;
    grantee: GranteeShape | null;
  }>) {
    if (!g.grantee) continue;
    out.push({
      user_id: g.grantee.id,
      email: g.grantee.email,
      full_name: g.grantee.full_name,
      role: g.grantee.role,
      source: "employee",
      grant_id: g.id,
      department_name: null,
    });
  }

  // De-duplicate: if a user has multiple paths (e.g. super_admin AND a grant),
  // keep the most "authoritative" first. We dedupe by user_id, preferring the
  // source order: super_admin → all → department → employee.
  const order: Record<EmployeeAccessGrantSource, number> = {
    super_admin: 0,
    module: 1,
    all: 2,
    department: 3,
    employee: 4,
  };
  const byUser = new Map<string, EmployeeAccessEntry>();
  for (const e of out) {
    const existing = byUser.get(e.user_id);
    if (!existing || order[e.source] < order[existing.source]) {
      byUser.set(e.user_id, e);
    }
  }
  return Array.from(byUser.values()).sort((a, b) => {
    const r = order[a.source] - order[b.source];
    if (r !== 0) return r;
    const an = (a.full_name ?? a.email ?? "").toLowerCase();
    const bn = (b.full_name ?? b.email ?? "").toLowerCase();
    return an.localeCompare(bn);
  });
}

/**
 * Lightweight list of profile candidates for linking an HR person file to
 * a Haven OS user account. Returns id, email, full_name. Available to HR
 * admins (anyone with HR access) so they can pick a user from a dropdown.
 */
export async function listLinkableProfiles(): Promise<
  Array<{ id: string; email: string; full_name: string | null }>
> {
  await requireHrModule("people");
  const supabase = await db();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("full_name", { ascending: true });
  return ((data ?? []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
  }>);
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
  const email = (await currentEmail()) ?? "";
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
  const email = (await currentEmail()) ?? "";
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
  await requireHrModule("hiring");
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });
  return (data ?? []) as DbRole[];
}

export async function getRole(id: string): Promise<DbRole | null> {
  await requireHrModule("hiring");
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
  await requireHrModule("hiring");
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
  await requireHrModule("hiring");
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
  await requireHrModule("hiring");
  const supabase = await db();
  await supabase.from("hr_roles").delete().eq("id", id);
  revalidateHr();
  revalidatePath("/careers");
}

// ---------------------------------------------------------------------------
// Hiring — candidates (admin)
// ---------------------------------------------------------------------------

export async function listCandidates(roleId: string): Promise<DbCandidate[]> {
  await requireHrModule("hiring");
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
  loom_url?: string;
  cover_letter?: string;
  source?: string;
  stage?: string;
  notes?: string;
}): Promise<void> {
  await requireHrModule("hiring");
  const supabase = await db();
  if (!input.name.trim()) throw new Error("Name is required");
  await supabase.from("hr_candidates").insert({
    role_id: input.role_id,
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    resume_url: input.resume_url?.trim() || null,
    loom_url: input.loom_url?.trim() || null,
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
  await requireHrModule("hiring");
  const supabase = await db();
  await supabase.from("hr_candidates").update({ stage }).eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
  revalidatePath(`/hr/hiring/${roleId}/candidates/${id}`);
}

/**
 * Result-shape variant of {@link updateCandidateStage} used by the candidate
 * Kanban for optimistic-update + revert-on-error UX. Same permissions as the
 * throwing version.
 */
export async function setCandidateStage(
  id: string,
  stage: string,
  roleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await updateCandidateStage(id, stage, roleId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update stage",
    };
  }
}

export async function getCandidate(id: string): Promise<DbCandidate | null> {
  await requireHrModule("hiring");
  const supabase = await db();
  const { data } = await supabase
    .from("hr_candidates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as DbCandidate | null;
}

export async function updateCandidate(
  id: string,
  input: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    resume_url: string | null;
    loom_url: string | null;
    cover_letter: string;
    stage: string;
    notes: string;
  }>,
  roleId: string,
): Promise<void> {
  await requireHrModule("hiring");
  const supabase = await db();
  await supabase.from("hr_candidates").update(input).eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
  revalidatePath(`/hr/hiring/${roleId}/candidates/${id}`);
}

export async function deleteCandidate(id: string, roleId: string): Promise<void> {
  await requireHrModule("hiring");
  const supabase = await db();
  await supabase.from("hr_candidates").delete().eq("id", id);
  revalidatePath(`/hr/hiring/${roleId}`);
}

// ---------------------------------------------------------------------------
// Hiring — candidate notes / comments
// ---------------------------------------------------------------------------

export async function listCandidateNotes(
  candidateId: string,
): Promise<DbCandidateNote[]> {
  await requireHrModule("hiring");
  const supabase = await db();
  const { data } = await supabase
    .from("hr_candidate_notes")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });
  return (data ?? []) as DbCandidateNote[];
}

export async function addCandidateNote(input: {
  candidate_id: string;
  body: string;
  role_id?: string;
}): Promise<
  | { ok: true; data: DbCandidateNote }
  | { ok: false; error: string }
> {
  try {
    await requireHrModule("hiring");
    const body = (input.body ?? "").trim();
    if (!body) return { ok: false, error: "Note cannot be empty" };

    const supabase = await db();
    const perm = await getPermissions();
    let authorName: string | null = null;
    if (perm.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", perm.user_id)
        .maybeSingle();
      authorName =
        (profile as { full_name: string | null } | null)?.full_name ?? null;
    }

    const { data, error } = await supabase
      .from("hr_candidate_notes")
      .insert({
        candidate_id: input.candidate_id,
        author_id: perm.user_id,
        author_email: perm.email,
        author_name: authorName,
        body,
      })
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    if (input.role_id) {
      revalidatePath(`/hr/hiring/${input.role_id}`);
      revalidatePath(
        `/hr/hiring/${input.role_id}/candidates/${input.candidate_id}`,
      );
    }
    return { ok: true, data: data as DbCandidateNote };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to add note",
    };
  }
}

export async function deleteCandidateNote(
  id: string,
  candidateId: string,
  roleId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();
    const { error } = await supabase
      .from("hr_candidate_notes")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (roleId) {
      revalidatePath(`/hr/hiring/${roleId}/candidates/${candidateId}`);
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete note",
    };
  }
}

// ---------------------------------------------------------------------------
// Policies & Procedures
// ---------------------------------------------------------------------------

export async function listDocs(kind: "policy" | "procedure"): Promise<DbHrDoc[]> {
  await requireHrModule(kind === "policy" ? "policies" : "procedures");
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
  await requireHrModule(input.kind === "policy" ? "policies" : "procedures");
  const email = (await currentEmail()) ?? "";
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
  await requireHrModule(kind === "policy" ? "policies" : "procedures");
  const supabase = await db();
  await supabase.from("hr_docs").update(input).eq("id", id);
  revalidatePath(`/hr/${kind === "policy" ? "policies" : "procedures"}`);
}

export async function deleteDoc(id: string, kind: "policy" | "procedure"): Promise<void> {
  await requireHrModule(kind === "policy" ? "policies" : "procedures");
  const supabase = await db();
  await supabase.from("hr_docs").delete().eq("id", id);
  revalidatePath(`/hr/${kind === "policy" ? "policies" : "procedures"}`);
}

// ---------------------------------------------------------------------------
// Hiring — candidate resume attachment (signed URL access)
// ---------------------------------------------------------------------------

/**
 * Mint a short-lived signed URL for a candidate's stored resume. The
 * `hr-resumes` bucket is private; HR pages call this server-side and pass
 * the resulting URL to the client. Returns null if no file is on the
 * candidate or the signing fails (e.g. object missing).
 */
export async function getCandidateResumeSignedUrl(
  candidateId: string,
  expiresInSeconds: number = 60 * 10,
): Promise<string | null> {
  await requireHrModule("hiring");
  const supabase = await db();
  const { data: candidate } = await supabase
    .from("hr_candidates")
    .select("resume_path")
    .eq("id", candidateId)
    .maybeSingle();
  const path = candidate?.resume_path as string | null | undefined;
  if (!path) return null;
  // Use the service-role client for signing — the SSR client may not have
  // a session present in some HR-admin grant flows.
  const admin = getAdminClient();
  const { data, error } = await admin.storage
    .from("hr-resumes")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
