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
import { getAdminClient } from "@/lib/supabase/admin";

export type HavenUserRole = "user" | "admin" | "super_admin";

import { HR_MODULES, type HrModule, HR_MODULE_LABELS } from "./hr-modules";

export type CurrentPermissions = {
  user_id: string | null;
  email: string | null;
  role: HavenUserRole;
  has_any_hr_access: boolean;
  is_super_admin: boolean;
  is_admin_or_above: boolean;
};

const OWNER_EMAILS = new Set([
  "jack@havenvacationrentals.com",
  "jack13zoppa@gmail.com",
]);

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

  // If the auth user has no profile row (e.g. they signed in before the
  // handle_new_user trigger existed, or the trigger errored), create
  // one on the fly via the service-role admin client. This guarantees
  // the user shows up in the Settings users list and gets a default
  // 'user' role on every subsequent permission check.
  const email = user.email?.toLowerCase() ?? null;
  let role: HavenUserRole =
    (profile?.role as HavenUserRole | undefined) ?? "user";
  if (!profile) {
    try {
      const admin = getAdminClient();
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        (meta.full_name as string | undefined) ??
        (meta.name as string | undefined) ??
        null;
      const avatar =
        (meta.avatar_url as string | undefined) ??
        (meta.picture as string | undefined) ??
        null;
      await admin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: fullName,
          avatar_url: avatar,
          role: "user",
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      role = "user";
    } catch (e) {
      console.error("getPermissions: ensure-profile failed", e);
      // Keep role='user' default; the user is still recognized.
    }
  }

  // Jack is the owner/operator. If his profile row was created after the
  // original admin seed migrations (or through an external invite), repair the
  // DB role immediately so admin-gated UI and RLS-backed sales/GTM queries work.
  if (email && OWNER_EMAILS.has(email) && role !== "super_admin") {
    try {
      const admin = getAdminClient();
      await admin
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", user.id);
      role = "super_admin";
    } catch (e) {
      console.error("getPermissions: owner role repair failed", e);
    }
  }

  // Do we have any HR grants? (Super admins short-circuit.)
  // A user counts as "has HR access" if they have any access grant
  // (department/employee/survey scope) OR any module grant.
  let hasHr = role === "super_admin";
  if (!hasHr) {
    const [{ data: grants }, { data: modules }] = await Promise.all([
      supabase
        .from("hr_access_grants")
        .select("id")
        .eq("grantee_id", user.id)
        .limit(1),
      supabase
        .from("hr_module_grants")
        .select("id")
        .eq("grantee_id", user.id)
        .limit(1),
    ]);
    hasHr = (grants?.length ?? 0) > 0 || (modules?.length ?? 0) > 0;
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

export async function canAccessSales(): Promise<boolean> {
  const p = await getPermissions();
  return p.is_admin_or_above;
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

// ---------------------------------------------------------------------------
// HR module / per-survey access
// ---------------------------------------------------------------------------

/**
 * Resolve the set of HR modules the current user can access.
 * Super admins always get every module.
 */
export async function userHrModules(): Promise<HrModule[]> {
  const perm = await getPermissions();
  if (!perm.user_id) return [];
  if (perm.is_super_admin) return [...HR_MODULES];
  const supabase = await db();
  const { data } = await supabase
    .from("hr_module_grants")
    .select("module")
    .eq("grantee_id", perm.user_id);
  const set = new Set<HrModule>();
  for (const r of (data ?? []) as { module: string }[]) {
    if ((HR_MODULES as readonly string[]).includes(r.module)) {
      set.add(r.module as HrModule);
    }
  }
  return Array.from(set);
}

export async function canAccessHrModuleByName(
  module: HrModule,
): Promise<boolean> {
  const perm = await getPermissions();
  if (!perm.user_id) return false;
  if (perm.is_super_admin) return true;
  const supabase = await db();
  const { data } = await supabase.rpc("user_has_hr_module_access", {
    p_user_id: perm.user_id,
    p_module: module,
  });
  return !!data;
}

export async function requireHrModule(module: HrModule): Promise<string> {
  const userId = await requireSignedIn();
  const ok = await canAccessHrModuleByName(module);
  if (!ok)
    throw new Error(
      `HR ${HR_MODULE_LABELS[module]} access required — ask a super admin to grant you the ${HR_MODULE_LABELS[module]} module.`,
    );
  return userId;
}

/**
 * Return the set of survey ids the current user can read/manage.
 * Returns `null` to mean "no filter / all surveys" (super admin or
 * surveys-module grant). An empty array means no access at all.
 */
export async function visibleSurveyIds(): Promise<string[] | null> {
  const perm = await getPermissions();
  if (!perm.user_id) return [];
  if (perm.is_super_admin) return null;
  const supabase = await db();
  // Module grant gives access to every survey.
  const { data: mg } = await supabase
    .from("hr_module_grants")
    .select("module")
    .eq("grantee_id", perm.user_id)
    .eq("module", "surveys")
    .limit(1);
  if ((mg?.length ?? 0) > 0) return null;
  const { data: g } = await supabase
    .from("hr_access_grants")
    .select("survey_id")
    .eq("grantee_id", perm.user_id)
    .eq("scope", "survey");
  const ids = new Set<string>();
  for (const r of (g ?? []) as { survey_id: string | null }[]) {
    if (r.survey_id) ids.add(r.survey_id);
  }
  return Array.from(ids);
}

export async function canAccessSurvey(surveyId: string): Promise<boolean> {
  const perm = await getPermissions();
  if (!perm.user_id) return false;
  if (perm.is_super_admin) return true;
  const supabase = await db();
  const { data } = await supabase.rpc("user_has_hr_survey_access", {
    p_user_id: perm.user_id,
    p_survey_id: surveyId,
  });
  return !!data;
}

export async function requireSurveyAccess(surveyId: string): Promise<string> {
  const userId = await requireSignedIn();
  const ok = await canAccessSurvey(surveyId);
  if (!ok)
    throw new Error(
      "You don't have access to this survey",
    );
  return userId;
}
