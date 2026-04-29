/**
 * Permission helpers used by /api/v1 routes.
 *
 * These mirror (a subset of) lib/work/actions and lib/auth/permissions
 * but operate on an explicit actor uuid instead of reading
 * `auth.getUser()` from the SSR client cookie. They use the admin
 * client (which bypasses RLS) so the route handler can filter
 * exactly to what the actor is allowed to see — never more.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiActorProfile } from "./auth";

const ACCESS_RANK: Record<string, number> = {
  admin: 3,
  editor: 2,
  member: 2,
  viewer: 1,
};

function rank(level: string | null | undefined): number {
  return ACCESS_RANK[String(level ?? "").toLowerCase()] ?? 0;
}

export type ListAccessLevel = "viewer" | "editor" | "admin";
export type SpaceMemberRole = "admin" | "member" | "viewer";

export async function getSpaceAccessLevelFor(
  admin: SupabaseClient,
  actor: ApiActorProfile,
  spaceId: string,
): Promise<SpaceMemberRole | null> {
  if (actor.is_super_admin) return "admin";

  const { data: space } = await admin
    .from("spaces")
    .select("privacy")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) return null;

  const { data: member } = await admin
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("profile_id", actor.id)
    .maybeSingle();
  if (member?.role) return member.role as SpaceMemberRole;
  if (space.privacy === "team") return "member";
  return null;
}

export async function getListAccessLevelFor(
  admin: SupabaseClient,
  actor: ApiActorProfile,
  listId: string,
): Promise<ListAccessLevel | null> {
  if (actor.is_super_admin) return "admin";

  const { data: list } = await admin
    .from("lists")
    .select("space_id, type, personal_owner_id")
    .eq("id", listId)
    .maybeSingle();
  if (!list) return null;

  if (list.personal_owner_id) {
    return list.personal_owner_id === actor.id ? "admin" : null;
  }

  const { data: lm } = await admin
    .from("list_members")
    .select("access_level, role")
    .eq("list_id", listId)
    .eq("profile_id", actor.id)
    .maybeSingle();
  if (lm) {
    const lvl =
      (lm.access_level as ListAccessLevel | null) ??
      (lm.role === "owner" ? "admin" : "editor");
    return lvl;
  }

  if (list.space_id) {
    const spaceLvl = await getSpaceAccessLevelFor(admin, actor, list.space_id);
    if (spaceLvl) {
      if (spaceLvl === "admin") return "admin";
      if (spaceLvl === "viewer") return "viewer";
      if (list.type === "private") return null;
      return "editor";
    }
  }

  if (!list.space_id && list.type === "public") return "editor";
  return null;
}

export async function hasListAccessFor(
  admin: SupabaseClient,
  actor: ApiActorProfile,
  listId: string,
  min: ListAccessLevel = "viewer",
): Promise<boolean> {
  const lvl = await getListAccessLevelFor(admin, actor, listId);
  if (!lvl) return false;
  return rank(lvl) >= rank(min);
}

/**
 * Set of space ids the actor can see. `null` ⇒ no filter (super admin).
 * Empty array ⇒ no access.
 */
export async function visibleSpaceIdsFor(
  admin: SupabaseClient,
  actor: ApiActorProfile,
): Promise<string[] | null> {
  if (actor.is_super_admin) return null;
  const { data: openSpaces } = await admin
    .from("spaces")
    .select("id")
    .eq("privacy", "team");
  const open = new Set((openSpaces ?? []).map((s) => s.id as string));
  const { data: memberSpaces } = await admin
    .from("space_members")
    .select("space_id")
    .eq("profile_id", actor.id);
  for (const r of memberSpaces ?? []) open.add(r.space_id as string);
  return Array.from(open);
}

/**
 * Set of employee ids the actor can read (HR). `null` ⇒ no filter.
 */
export async function visibleEmployeeIdsFor(
  admin: SupabaseClient,
  actor: ApiActorProfile,
): Promise<string[] | null> {
  if (actor.is_super_admin) return null;
  const { data: grants } = await admin
    .from("hr_access_grants")
    .select("scope, department_id, employee_id")
    .eq("grantee_id", actor.id);

  if (!grants || grants.length === 0) return [];
  if (grants.some((g) => g.scope === "all")) return null;

  const deptIds = grants
    .filter((g) => g.scope === "department" && g.department_id)
    .map((g) => g.department_id as string);
  const directIds = grants
    .filter((g) => g.scope === "employee" && g.employee_id)
    .map((g) => g.employee_id as string);

  const ids = new Set<string>(directIds);
  if (deptIds.length > 0) {
    const { data: emps } = await admin
      .from("hr_employees")
      .select("id")
      .in("department_id", deptIds);
    for (const e of emps ?? []) ids.add(e.id as string);
  }
  return Array.from(ids);
}
