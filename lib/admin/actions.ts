/**
 * Haven OS — super-admin operations
 * ---------------------------------------------------------------------------
 * User role management, department management, and HR access grants.
 * All functions require super_admin unless noted.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  requireSuperAdmin,
  getPermissions,
  type HavenUserRole,
} from "@/lib/auth/permissions";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: HavenUserRole;
  created_at: string;
};

export async function listUsers(): Promise<AdminUser[]> {
  await requireSuperAdmin();
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at")
    .order("role", { ascending: false })
    .order("email", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function setUserRole(
  userId: string,
  role: HavenUserRole,
): Promise<void> {
  const superId = await requireSuperAdmin();
  if (userId === superId && role !== "super_admin") {
    throw new Error("You can't demote yourself from super admin.");
  }
  const supabase = await db();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
  revalidatePath("/settings/users");
}

// ---------------------------------------------------------------------------
// DEPARTMENTS
// ---------------------------------------------------------------------------

export type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  archived: boolean;
};

/**
 * Public read — any signed-in user can list departments (used for filters,
 * dropdowns, etc). Writes are super-admin only.
 */
export async function listDepartments(includeArchived = false): Promise<
  Department[]
> {
  const perm = await getPermissions();
  if (!perm.user_id) return [];
  const supabase = await db();
  let q = supabase
    .from("departments")
    .select("id, name, slug, description, sort_order, archived")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (!includeArchived) q = q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Department[];
}

export async function createDepartment(input: {
  name: string;
  description?: string;
  sort_order?: number;
}): Promise<Department> {
  await requireSuperAdmin();
  const supabase = await db();
  const slug = slugify(input.name);
  if (!slug) throw new Error("Name is required");
  const { data, error } = await supabase
    .from("departments")
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      sort_order: input.sort_order ?? 1000,
    })
    .select("id, name, slug, description, sort_order, archived")
    .single();
  if (error) throw error;
  revalidatePath("/settings/departments");
  return data as Department;
}

export async function updateDepartment(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    sort_order?: number;
    archived?: boolean;
  },
): Promise<void> {
  await requireSuperAdmin();
  const supabase = await db();
  const fields: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    fields.name = patch.name.trim();
    fields.slug = slugify(patch.name);
  }
  if (patch.description !== undefined)
    fields.description = patch.description?.trim() || null;
  if (patch.sort_order !== undefined) fields.sort_order = patch.sort_order;
  if (patch.archived !== undefined) fields.archived = patch.archived;
  const { error } = await supabase.from("departments").update(fields).eq("id", id);
  if (error) throw error;
  revalidatePath("/settings/departments");
}

export async function deleteDepartment(id: string): Promise<void> {
  await requireSuperAdmin();
  const supabase = await db();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/settings/departments");
}

// ---------------------------------------------------------------------------
// HR ACCESS GRANTS
// ---------------------------------------------------------------------------

export type HrGrantScope = "all" | "department" | "employee";

export type HrAccessGrant = {
  id: string;
  grantee_id: string;
  grantee_email: string | null;
  grantee_name: string | null;
  scope: HrGrantScope;
  department_id: string | null;
  department_name: string | null;
  employee_id: string | null;
  employee_name: string | null;
  note: string | null;
  created_at: string;
};

export async function listHrAccessGrants(
  opts?: { grantee_id?: string },
): Promise<HrAccessGrant[]> {
  await requireSuperAdmin();
  const supabase = await db();
  let q = supabase
    .from("hr_access_grants")
    .select(
      `
      id, scope, department_id, employee_id, note, created_at,
      grantee:profiles!hr_access_grants_grantee_id_fkey ( id, email, full_name ),
      department:departments ( id, name ),
      employee:hr_employees ( id, full_name )
      `,
    )
    .order("created_at", { ascending: false });
  if (opts?.grantee_id) q = q.eq("grantee_id", opts.grantee_id);
  const { data, error } = await q;
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    grantee_id: r.grantee?.id ?? null,
    grantee_email: r.grantee?.email ?? null,
    grantee_name: r.grantee?.full_name ?? null,
    scope: r.scope,
    department_id: r.department?.id ?? null,
    department_name: r.department?.name ?? null,
    employee_id: r.employee?.id ?? null,
    employee_name: r.employee?.full_name ?? null,
    note: r.note,
    created_at: r.created_at,
  }));
}

export async function grantHrAccess(input: {
  grantee_id: string;
  scope: HrGrantScope;
  department_id?: string;
  employee_id?: string;
  note?: string;
}): Promise<void> {
  const superId = await requireSuperAdmin();
  if (input.scope === "department" && !input.department_id)
    throw new Error("department_id is required for department scope");
  if (input.scope === "employee" && !input.employee_id)
    throw new Error("employee_id is required for employee scope");
  const supabase = await db();
  const { error } = await supabase.from("hr_access_grants").insert({
    grantee_id: input.grantee_id,
    scope: input.scope,
    department_id: input.scope === "department" ? input.department_id : null,
    employee_id: input.scope === "employee" ? input.employee_id : null,
    granted_by: superId,
    note: input.note?.trim() || null,
  });
  if (error) throw error;
  revalidatePath("/settings/users");
  revalidatePath("/settings/hr-access");
}

export async function revokeHrAccess(grantId: string): Promise<void> {
  await requireSuperAdmin();
  const supabase = await db();
  const { error } = await supabase
    .from("hr_access_grants")
    .delete()
    .eq("id", grantId);
  if (error) throw error;
  revalidatePath("/settings/users");
  revalidatePath("/settings/hr-access");
}
