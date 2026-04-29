/**
 * GET /api/v1/work/spaces — list spaces visible to the actor.
 */

import { NextResponse } from "next/server";
import { jsonError, withApi } from "@/lib/api-tokens/route-helpers";
import { visibleSpaceIdsFor } from "@/lib/api-tokens/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "work:read" }, async (_req, ctx) => {
  const visible = await visibleSpaceIdsFor(ctx.admin, ctx.actor);
  let q = ctx.admin
    .from("spaces")
    .select("id, name, color, privacy, created_at, updated_at")
    .order("name");
  if (visible !== null) {
    if (visible.length === 0) return NextResponse.json({ spaces: [] });
    q = q.in("id", visible);
  }
  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ spaces: data ?? [] });
});
