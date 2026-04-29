/**
 * GET   /api/v1/properties/[id]
 * PATCH /api/v1/properties/[id]   (admin-or-above only)
 */

import { NextResponse } from "next/server";
import {
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "properties:read" }, async (_req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");
  const { data, error } = await ctx.admin
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return jsonError(500, error.message);
  if (!data) return jsonError(404, "Property not found");
  return NextResponse.json({ property: data });
});

export const PATCH = withApi({ scope: "properties:write" }, async (req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");
  if (!ctx.actor.is_admin_or_above) {
    return jsonError(403, "Requires admin role");
  }
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError(400, "Invalid JSON body");

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    clean[k] = v;
  }

  const { data, error } = await ctx.admin
    .from("properties")
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ property: data });
});
