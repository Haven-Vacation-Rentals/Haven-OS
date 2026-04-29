/**
 * GET /api/v1/hr/employees — list employees the actor can see.
 *
 * Honors HR access grants: super_admin or 'all'-grant sees every employee;
 * a grant scoped to a department or single employee narrows the list.
 * Tokens without `hr:read` scope OR token owners with no HR access at all
 * receive 403.
 */

import { NextResponse } from "next/server";
import { jsonError, withApi } from "@/lib/api-tokens/route-helpers";
import { visibleEmployeeIdsFor } from "@/lib/api-tokens/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "hr:read" }, async (_req, ctx) => {
  if (!ctx.actor.has_any_hr_access) {
    return jsonError(403, "Token owner has no HR access grant");
  }
  const ids = await visibleEmployeeIdsFor(ctx.admin, ctx.actor);
  let q = ctx.admin
    .from("hr_employees")
    .select(
      "id, full_name, email, role_title, department, department_id, status, start_date, profile_id, created_at, updated_at",
    )
    .order("full_name");
  if (ids !== null) {
    if (ids.length === 0) return NextResponse.json({ employees: [] });
    q = q.in("id", ids);
  }
  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ employees: data ?? [] });
});
