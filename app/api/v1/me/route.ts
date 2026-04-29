/**
 * GET /api/v1/me
 *
 * Returns the actor profile + the scopes the bearer token carries.
 * Useful for external agents to introspect their own access before
 * making other calls.
 */

import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "me:read" }, async (_req, ctx) => {
  return NextResponse.json({
    actor: {
      id: ctx.actor.id,
      email: ctx.actor.email,
      full_name: ctx.actor.full_name,
      role: ctx.actor.role,
      is_super_admin: ctx.actor.is_super_admin,
      is_admin_or_above: ctx.actor.is_admin_or_above,
      has_any_hr_access: ctx.actor.has_any_hr_access,
    },
    token: {
      id: ctx.token_id,
      scopes: ctx.scopes,
    },
  });
});
