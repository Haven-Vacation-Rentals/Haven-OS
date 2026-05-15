/**
 * Token revocation — RFC 7009.
 *
 *   POST /api/mcp/oauth/revoke
 *   Content-Type: application/x-www-form-urlencoded
 *   token=<raw access or refresh token>
 *   [token_type_hint=access_token|refresh_token]
 *   [client_id=…]
 *
 * Always returns 200 — RFC 7009 §2.2 prohibits leaking whether the
 * token existed. Revoking either kind of token revokes its paired
 * sibling via paired_token_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { revokeByRawToken } from "@/lib/mcp/oauth/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders();
  const ct = req.headers.get("content-type")?.toLowerCase() ?? "";
  let token = "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await req.text().catch(() => ""));
    token = params.get("token") ?? "";
  } else if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { token?: string };
    token = body.token ?? "";
  } else {
    const params = new URLSearchParams(await req.text().catch(() => ""));
    token = params.get("token") ?? "";
  }
  if (token) {
    await revokeByRawToken(token).catch(() => {});
  }
  return new NextResponse(null, { status: 200, headers: cors });
}
