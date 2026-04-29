/**
 * GET  /api/v1/lost-items/[id]/comments — list events (incl. comments) for a case.
 * POST /api/v1/lost-items/[id]/comments — add a comment to a case.
 */

import { NextResponse } from "next/server";
import {
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";
import { addCommentRaw } from "@/lib/lost-items/actions";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveCase(
  admin: SupabaseClient,
  idOrNumber: string,
): Promise<string | null> {
  if (/^[0-9a-f-]{36}$/i.test(idOrNumber)) {
    const { data } = await admin
      .from("lost_items")
      .select("id")
      .eq("id", idOrNumber)
      .maybeSingle();
    if (data) return data.id as string;
  }
  const { data } = await admin
    .from("lost_items")
    .select("id")
    .eq("case_number", idOrNumber)
    .maybeSingle();
  return data ? (data.id as string) : null;
}

export const GET = withApi({ scope: "lost-items:read" }, async (_req, ctx, params) => {
  const caseId = await resolveCase(ctx.admin, params.id ?? "");
  if (!caseId) return jsonError(404, "Case not found");
  const { data, error } = await ctx.admin
    .from("lost_item_events")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ events: data ?? [] });
});

interface CommentBody {
  body?: string;
}

export const POST = withApi({ scope: "lost-items:write" }, async (req, ctx, params) => {
  const caseId = await resolveCase(ctx.admin, params.id ?? "");
  if (!caseId) return jsonError(404, "Case not found");
  const body = await readJson<CommentBody>(req);
  if (!body || typeof body.body !== "string" || !body.body.trim()) {
    return jsonError(400, "body is required");
  }
  const result = await addCommentRaw(
    caseId,
    body.body,
    { actor_id: ctx.actor.id },
    ctx.admin,
  );
  if (!result.ok) return jsonError(400, result.error);
  return NextResponse.json({ ok: true }, { status: 201 });
});
