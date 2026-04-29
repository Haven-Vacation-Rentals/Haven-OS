/**
 * GET  /api/v1/properties — list non-archived properties.
 * POST /api/v1/properties — create a property (admin-or-above only, mirrors app rule).
 */

import { NextResponse } from "next/server";
import {
  clampLimit,
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "properties:read" }, async (req, ctx) => {
  const url = new URL(req.url);
  const limit = clampLimit(url.searchParams.get("limit"), 200, 500);
  const includeArchived =
    url.searchParams.get("include_archived") === "true";

  let q = ctx.admin.from("properties").select("*").order("name").limit(limit);
  if (!includeArchived) q = q.is("archived_at", null);
  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ properties: data ?? [] });
});

export const POST = withApi({ scope: "properties:write" }, async (req, ctx) => {
  // Mirror the app — only admin-or-above can create properties.
  if (!ctx.actor.is_admin_or_above) {
    return jsonError(403, "Requires admin role");
  }
  const body = await readJson<Record<string, unknown>>(req);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return jsonError(400, "name is required");
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    if (typeof v === "string") {
      const t = v.trim();
      clean[k] = t === "" ? null : t;
    } else {
      clean[k] = v;
    }
  }
  if (!clean.status) clean.status = "onboarding";
  if (clean.priority === undefined) clean.priority = "none";
  if (clean.sales_status === undefined) clean.sales_status = "none";
  if (clean.currently_hosting === undefined) clean.currently_hosting = false;

  const { data, error } = await ctx.admin
    .from("properties")
    .insert(clean)
    .select()
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ property: data }, { status: 201 });
});
