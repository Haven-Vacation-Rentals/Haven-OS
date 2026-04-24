/**
 * Haven OS — permissions helpers
 * ---------------------------------------------------------------------------
 * Single source of truth for "what is this user allowed to do?"
 *
 * Roles:
 *   - 'user'         — default. Work, Properties, Onboarding (future: Offboarding).
 *   - 'admin'        — everything except HR and user management.
 *   - 'super_admin'  — everything, including HR and user management.
 *
 * HR access is ALSO gated by explicit grants (hr_access_grants) so that a
 * non-super_admin can have scoped HR access to a specific department or
 * employee. Super admins always pass HR checks.
 */

"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type HavenUserRole = "user" | "admin" | "super_admin";

export type CurrentPermissions = {
  user_id: string | null;
  email: string | null;
  role: HavenUserRole;
  has_any_hr_access: boolean;
  is_super_admin: boolean;
  is_admin_or_above: boolean;
};

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

/**
 * Resolve the signed-in user's permission context.
 *
 * Returns a default "anonymous" permission set if the user isn't signed in
 * or has no profile row yet.
 *
 * Cached within a single request via React.cache.
 */
export const getPermissions = cache(async (): Promise<CurrentPermissions> => {
  const supabase = await db();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return {
      user_id: null,
      email: null,
      role: "user",
      has_any_hr_access: false,
      is_super_admin: false,
      is_admin_or_above: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role: HavenUserRole =
    (profile?.role as HavenUserRole | undefined) ?? "user";

  // Do we have any HR grants? (Super admins short-circuit.)
  let hasHr = role === "super_admin";
  if (!hasHr) {
    const { data: grants } = await supabase
      .from("hr_access_grants")
      .select("id")
      .eq("grantee_id", user.id)
      .limit(1);
    hasHr = (grants?.length ?? 0) > 0;
  }

  return {
    user_id: user.id,
    email: user.email ?? null,
    role,
    has_any_hr_access: hasHr,
    is_super_admin: role === "super_admin",
    is_admin_or_above: role === "admin" || role === "super_admin",
  };
});

// ---------------------------------------------------------------------------
// Capability helpers (page-level)
// ---------------------------------------------------------------------------

export async function canAccessScorecard(): Promise<boolean> {
  const p = await getPermissions();
  return p.is_admin_or_above;
}

export async function canAccessAgentChat(): Promise<boolean> {
  const p = await getPermissions();
  return p.is_admin_or_above;
}

export async function canAccessHrModule(): Promise<boolean> {
  const p = await getPermissions();
  return p.has_any_hr_access;
}

export async function canManageUsers(): Promise<boolean> {
  const p = await getPermissions();
  return p.is_super_admin;
}

// Work / Properties / Onboarding are accessible to all signed-in users.
// Exposed as functions anyway so callers can be uniform + we can change later.
export async function canAccessWork(): Promise<boolean> {
  const p = await getPermissions();
  return !!p.user_id;
}
export async function canAccessProperties(): Promise<boolean> {
  return canAccessWork();
}
export async function canAccessOnboarding(): Promise<boolean> {
  return canAccessWork();
}

// ---------------------------------------------------------------------------
// HR-specific helpers (row-level)
// ---------------------------------------------------------------------------

/**
 * Return the set of employee ids visible to the current user.
 * Super admins get `null` to mean "no filter / everyone visible".
 * Users with a scope='all' grant also get `null`.
 * Others get a concrete (possibly empty) array.
 */
export async function visibleEmployeeIds(): Promise<string[] | null> {
  const supabase = await db();
  const perm = await getPermissions();
  if (!perm.user_id) return [];
  if (perm.is_super_admin) return null;

  const { data: grants } = await supabase
    .from("hr_access_grants")
    .select("scope, department_id, employee_id")
    .eq("grantee_id", perm.user_id);

  if (!grants || grants.length === 0) return [];

  // 'all' grant → everyone
  if (grants.some((g) => g.scope === "all")) return null;

  const deptIds = grants
    .filter((g) => g.scope === "department" && g.department_id)
    .map((g) => g.department_id as string);

  const directIds = grants
    .filter((g) => g.scope === "employee" && g.employee_id)
    .map((g) => g.employee_id as string);

  const ids = new Set<string>(directIds);
  if (deptIds.length > 0) {
    const { data: emps } = await supabase
      .from("hr_employees")
      .select("id")
      .in("department_id", deptIds);
    for (const e of emps ?? []) ids.add(e.id as string);
  }
  return Array.from(ids);
}

/**
 * Can the current user read this specific employee's HR record?
 */
export async function canAccessEmployee(
  employeeId: string,
): Promise<boolean> {
  const perm = await getPermissions();
  if (!perm.user_id) return false;
  if (perm.is_super_admin) return true;
  const supabase = await db();
  const { data } = await supabase.rpc("user_has_hr_access_to_employee", {
    p_user_id: perm.user_id,
    p_employee_id: employeeId,
  });
  return !!data;
}

// ---------------------------------------------------------------------------
// Guards — throw on failure, for use in server actions / API routes
// ---------------------------------------------------------------------------

export async function requireSignedIn(): Promise<string> {
  const p = await getPermissions();
  if (!p.user_id) throw new Error("Not signed in");
  return p.user_id;
}

export async function requireSuperAdmin(): Promise<string> {
  const p = await getPermissions();
  if (!p.user_id) throw new Error("Not signed in");
  if (!p.is_super_admin) throw new Error("Requires super admin");
  return p.user_id;
}

export async function requireAdminOrAbove(): Promise<string> {
  const p = await getPermissions();
  if (!p.user_id) throw new Error("Not signed in");
  if (!p.is_admin_or_above) throw new Error("Requires admin access");
  return p.user_id;
}

export async function requireHrAccess(): Promise<string> {
  const p = await getPermissions();
  if (!p.user_id) throw new Error("Not signed in");
  if (!p.has_any_hr_access)
    throw new Error(
      "HR access required — ask a super admin to grant you HR access",
    );
  return p.user_id;
}

export async function requireEmployeeAccess(
  employeeId: string,
): Promise<string> {
  const userId = await requireSignedIn();
  const ok = await canAccessEmployee(employeeId);
  if (!ok)
    throw new Error(
      "You don't have access to this employee's HR record",
    );
  return userId;
}
