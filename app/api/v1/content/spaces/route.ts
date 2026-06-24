/**
 * GET /api/v1/content/spaces — list Paid Advertising spaces.
 */

import { NextResponse } from "next/server";
import { jsonError, withApi } from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "content:read" }, async (_req, ctx) => {
  const { data, error } = await ctx.admin
    .from("content_spaces")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ spaces: data ?? [] });
});
