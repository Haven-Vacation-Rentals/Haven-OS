/**
 * Haven OS — super-admin operations
 * ---------------------------------------------------------------------------
 * User role management, department management, and HR access grants.
 * All functions require super_admin unless noted.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
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

/**
 * Create a new Haven OS user.
 *
 * Two modes:
 *  - mode='invite' (default): send a Supabase invite email. The user
 *    confirms the email, sets a password, and lands in Haven OS.
 *  - mode='direct': create the user immediately with a provided
 *    password. Email is auto-confirmed.
 *
 * In either case the `handle_new_user` trigger creates the matching
 * `profiles` row; we then upgrade the role if the caller specified one
 * other than 'user'.
 *
 * Super-admin only.
 */
export type CreateUserInput = {
  email: string;
  full_name?: string;
  role?: HavenUserRole;
  mode?: "invite" | "direct";
  password?: string;
  redirect_to?: string;
};

export type CreateUserResult =
  | { ok: true; user: AdminUser }
  | { ok: false; error: string };

/**
 * Internal implementation. Returns a result object instead of throwing
 * so the calling Server Action can return errors verbatim to the client
 * (Next.js production strips error.message from thrown Server Action
 * errors).
 */
async function createUserImpl(input: CreateUserInput): Promise<CreateUserResult> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  const role: HavenUserRole = input.role ?? "user";
  const mode = input.mode ?? "invite";
  const fullName = input.full_name?.trim() || null;

  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  let userId: string;

  if (mode === "direct") {
    if (!input.password || input.password.length < 8) {
      return {
        ok: false,
        error: "Direct-create requires a password of at least 8 characters.",
      };
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });
    if (error) {
      const msg = error.message ?? "";
      const code = (error as { code?: string }).code;
      const isExisting =
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        code === "email_exists";
      return {
        ok: false,
        error: isExisting
          ? `A user with email ${email} already exists.`
          : `Failed to create user: ${msg}`,
      };
    }
    userId = data.user.id;
  } else {
    // invite flow
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: fullName ? { full_name: fullName } : undefined,
      redirectTo: input.redirect_to,
    });
    if (error) {
      const msg = error.message ?? "";
      const code = (error as { code?: string }).code;
      const isExisting =
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        code === "email_exists";
      return {
        ok: false,
        error: isExisting
          ? `A user with email ${email} already exists.`
          : `Failed to invite user: ${msg}`,
      };
    }
    userId = data.user.id;
  }

  // The auth trigger creates a profiles row with role='user'. Upgrade if
  // needed and ensure full_name lands on the profile too (the trigger
  // only copies metadata if present).
  //
  // We use the service-role admin client here so this works regardless
  // of profiles RLS — the regular SSR client only allows users to update
  // / read their own profile.
  const updates: { full_name?: string; role?: HavenUserRole } = {};
  if (fullName) updates.full_name = fullName;
  if (role !== "user") updates.role = role;
  if (Object.keys(updates).length > 0) {
    const { error: updErr } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (updErr) {
      console.error("createUser: profiles update failed", updErr);
      return {
        ok: false,
        error: `User created, but failed to apply role/name: ${updErr.message}`,
      };
    }
  }

  // Read back the canonical profile (service-role bypasses RLS).
  const { data: profile, error: readErr } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, created_at")
    .eq("id", userId)
    .single();
  if (readErr) {
    console.error("createUser: profiles readback failed", readErr);
    return {
      ok: false,
      error: `User created, but couldn't read back profile: ${readErr.message}`,
    };
  }

  revalidatePath("/settings/users");
  return { ok: true, user: profile as AdminUser };
}

/**
 * Server-action-friendly variant that returns a result object so the
 * client can surface error messages (Next.js production sanitizes
 * thrown Server Action errors into a generic digest).
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  return createUserImpl(input);
}

/**
 * Throws-on-error variant for callers that prefer exceptions (e.g.,
 * the in-app agent tool runtime, which converts thrown errors into
 * tool error responses for the model).
 */
export async function createUserOrThrow(input: CreateUserInput): Promise<AdminUser> {
  const r = await createUserImpl(input);
  if (!r.ok) throw new Error(r.error);
  return r.user;
}

/**
 * Permanently delete a user (auth + profile cascade).
 * Super-admin only. Cannot delete yourself.
 */
export async function deleteUser(userId: string): Promise<void> {
  const superId = await requireSuperAdmin();
  if (userId === superId) {
    throw new Error("You can't delete your own account.");
  }
  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
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
