/**
 * Unified bearer-auth shim for /api/mcp.
 *
 * Tries the PAT path first (hvn_pat_…) for compatibility; if the
 * bearer is an MCP OAuth access token (hvn_mcp_…) we go through the
 * OAuth verifier instead. On any 401 the caller should add the
 * RFC 6750 WWW-Authenticate header via withWwwAuthenticate().
 */

import { NextRequest, NextResponse } from "next/server";
import type { ApiAuthContext } from "@/lib/api-tokens/auth";
import { authenticatePat } from "@/lib/api-tokens/auth";
import { TOKEN_PREFIX } from "@/lib/api-tokens/secret";
import { MCP_ACCESS_PREFIX, looksLikeMcpAccessToken } from "@/lib/mcp/oauth/secret";
import { authenticateMcpOauth, withWwwAuthenticate } from "@/lib/mcp/oauth/auth";

export type McpAuthResult =
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; response: NextResponse };

function readBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() ?? null;
}

export async function authenticateMcpRequest(
  req: NextRequest,
): Promise<McpAuthResult> {
  const raw = readBearer(req);
  if (!raw) {
    const res = NextResponse.json(
      { error: "Missing Authorization bearer token" },
      { status: 401 },
    );
    return {
      ok: false,
      response: withWwwAuthenticate(res, req, "invalid_request", "Bearer token required"),
    };
  }

  // OAuth token? (hvn_mcp_…)
  if (raw.startsWith(MCP_ACCESS_PREFIX) && looksLikeMcpAccessToken(raw)) {
    const result = await authenticateMcpOauth(raw);
    if (result.ok) return { ok: true, ctx: result.ctx };
    const res = NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
    return { ok: false, response: withWwwAuthenticate(res, req, "invalid_token", result.error) };
  }

  // PAT (hvn_pat_…) — defer to the existing helper.
  if (raw.startsWith(TOKEN_PREFIX)) {
    const result = await authenticatePat(req);
    if (result.ok) return { ok: true, ctx: result.ctx };
    return {
      ok: false,
      response: withWwwAuthenticate(result.response, req, "invalid_token"),
    };
  }

  const res = NextResponse.json(
    {
      error: `Invalid token format — expected ${TOKEN_PREFIX}… or ${MCP_ACCESS_PREFIX}…`,
    },
    { status: 401 },
  );
  return {
    ok: false,
    response: withWwwAuthenticate(res, req, "invalid_token", "Unrecognized token format"),
  };
}
