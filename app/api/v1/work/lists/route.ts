/**
 * GET /api/v1/work/lists  — lists visible to the actor.
 *   ?space_id=<uuid>   — optional, filter to one space
 */

import { NextResponse } from "next/server";
import { jsonError, withApi } from "@/lib/api-tokens/route-helpers";
import {
  hasListAccessFor,
  visibleSpaceIdsFor,
} from "@/lib/api-tokens/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "work:read" }, async (req, ctx) => {
  const url = new URL(req.url);
  const spaceId = url.searchParams.get("space_id");

  const visibleSpaces = await visibleSpaceIdsFor(ctx.admin, ctx.actor);

  let q = ctx.admin
    .from("lists")
    .select(
      "id, space_id, name, type, personal_owner_id, created_at, updated_at",
    )
    .order("name");

  if (spaceId) q = q.eq("space_id", spaceId);

  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  const rows = data ?? [];

  // Filter by access. Personal lists where actor is owner are always
  // visible. Lists in visible spaces are visible. Public lists with no
  // space are visible to everyone signed-in.
  const filtered: typeof rows = [];
  for (const row of rows) {
    if (row.personal_owner_id && row.personal_owner_id === ctx.actor.id) {
      filtered.push(row);
      continue;
    }
    if (row.personal_owner_id) continue;

    if (visibleSpaces === null) {
      // super admin — see everything
      filtered.push(row);
      continue;
    }
    if (row.space_id && visibleSpaces.includes(row.space_id)) {
      // Space-level access; lists with type='private' inside a space
      // still need a list-level grant — leave that to the per-task path.
      // For listing, surface them; future fetch will gate.
      filtered.push(row);
      continue;
    }
    if (!row.space_id && row.type === "public") {
      filtered.push(row);
      continue;
    }
    // Otherwise check explicit list-level grant.
    if (await hasListAccessFor(ctx.admin, ctx.actor, row.id)) {
      filtered.push(row);
    }
  }

  return NextResponse.json({ lists: filtered });
});
