/**
 * GET   /api/v1/lost-items/[id]
 * PATCH /api/v1/lost-items/[id]
 *
 * Accepts case id as either the canonical uuid or the human-readable
 * `case_number` (e.g. "LI-0042").
 */

import { NextResponse } from "next/server";
import {
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";
import { updateCaseRaw } from "@/lib/lost-items/actions";
import type {
  LostItemStatus,
  UpdateLostItemInput,
} from "@/lib/lost-items/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCase(
  admin: SupabaseClient,
  idOrNumber: string,
): Promise<{ id: string } | null> {
  // case_number tends to be like "LI-0042"; uuid has dashes too. Try
  // uuid lookup first, then case_number.
  if (/^[0-9a-f-]{36}$/i.test(idOrNumber)) {
    const { data } = await admin
      .from("lost_items")
      .select("id")
      .eq("id", idOrNumber)
      .maybeSingle();
    if (data) return { id: data.id as string };
  }
  const { data: byNum } = await admin
    .from("lost_items")
    .select("id")
    .eq("case_number", idOrNumber)
    .maybeSingle();
  return byNum ? { id: byNum.id as string } : null;
}

export const GET = withApi({ scope: "lost-items:read" }, async (_req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");
  const resolved = await resolveCase(ctx.admin, id);
  if (!resolved) return jsonError(404, "Case not found");
  const { data, error } = await ctx.admin
    .from("lost_items")
    .select("*")
    .eq("id", resolved.id)
    .maybeSingle();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ case: data });
});

interface PatchBody extends UpdateLostItemInput {
  status?: LostItemStatus;
}

export const PATCH = withApi({ scope: "lost-items:write" }, async (req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");
  const resolved = await resolveCase(ctx.admin, id);
  if (!resolved) return jsonError(404, "Case not found");

  const body = await readJson<PatchBody>(req);
  if (!body) return jsonError(400, "Invalid JSON body");

  const result = await updateCaseRaw(
    resolved.id,
    body,
    { actor_id: ctx.actor.id },
    ctx.admin,
  );
  if (!result.ok) return jsonError(400, result.error);
  return NextResponse.json({ case: result.data });
});
