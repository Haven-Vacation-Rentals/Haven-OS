/**
 * Token endpoint — RFC 6749 §4.1.3 (authorization_code) and §6
 * (refresh_token) grant types.
 *
 *   POST /api/mcp/oauth/token
 *   Content-Type: application/x-www-form-urlencoded
 *
 *   For authorization_code:
 *     grant_type=authorization_code
 *     code=<raw>
 *     redirect_uri=<must match the /authorize value>
 *     client_id=<hvn_mcp_client_…>
 *     code_verifier=<PKCE verifier>
 *
 *   For refresh_token:
 *     grant_type=refresh_token
 *     refresh_token=<raw>
 *     client_id=<hvn_mcp_client_…>
 *     scope=<optional narrower subset>
 *
 * On success we return an `access_token` (1h) and a `refresh_token`
 * (30d). Refresh always rotates — the prior refresh token is
 * revoked, and the prior access token is revoked alongside it
 * (paired_token_id link).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  consumeAuthorizationCode,
  issueTokenPair,
  loadClient,
  loadRefreshTokenForVerify,
  revokeTokenAndPair,
} from "@/lib/mcp/oauth/store";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyPkceS256,
} from "@/lib/mcp/oauth/secret";
import type { ApiScope } from "@/lib/api-tokens/types";
import { MCP_OAUTH_SCOPE_SET } from "@/lib/mcp/oauth/scopes";

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

  const form = await readForm(req);
  if (!form) {
    return tokenError(400, "invalid_request", "Invalid request body", cors);
  }

  const grant_type = form.get("grant_type") ?? "";
  const client_id = form.get("client_id") ?? "";
  if (!client_id) {
    return tokenError(400, "invalid_client", "Missing client_id", cors);
  }
  const client = await loadClient(client_id);
  if (!client || client.revoked_at) {
    return tokenError(401, "invalid_client", "Unknown client", cors);
  }

  if (grant_type === "authorization_code") {
    return handleAuthorizationCode(form, client.client_id, cors);
  }
  if (grant_type === "refresh_token") {
    return handleRefresh(form, client.client_id, cors);
  }
  return tokenError(
    400,
    "unsupported_grant_type",
    `Unsupported grant_type: ${grant_type}`,
    cors,
  );
}

// ---------------------------------------------------------------------------
// authorization_code grant
// ---------------------------------------------------------------------------

async function handleAuthorizationCode(
  form: URLSearchParams,
  client_id: string,
  cors: Record<string, string>,
) {
  const code = form.get("code") ?? "";
  const redirect_uri = form.get("redirect_uri") ?? "";
  const code_verifier = form.get("code_verifier") ?? "";

  if (!code) return tokenError(400, "invalid_request", "Missing code", cors);
  if (!redirect_uri) {
    return tokenError(400, "invalid_request", "Missing redirect_uri", cors);
  }
  if (!code_verifier) {
    return tokenError(400, "invalid_request", "Missing code_verifier", cors);
  }

  const codeRow = await consumeAuthorizationCode(code);
  if (!codeRow) {
    return tokenError(400, "invalid_grant", "Authorization code is invalid or expired", cors);
  }
  if (codeRow.client_id !== client_id) {
    return tokenError(400, "invalid_grant", "Code was issued to a different client", cors);
  }
  if (codeRow.redirect_uri !== redirect_uri) {
    return tokenError(400, "invalid_grant", "redirect_uri does not match", cors);
  }
  if (!verifyPkceS256(code_verifier, codeRow.code_challenge)) {
    return tokenError(400, "invalid_grant", "PKCE verification failed", cors);
  }

  return mintAndRespond(client_id, codeRow.profile_id, codeRow.scopes, cors);
}

// ---------------------------------------------------------------------------
// refresh_token grant
// ---------------------------------------------------------------------------

async function handleRefresh(
  form: URLSearchParams,
  client_id: string,
  cors: Record<string, string>,
) {
  const refresh_token = form.get("refresh_token") ?? "";
  if (!refresh_token) {
    return tokenError(400, "invalid_request", "Missing refresh_token", cors);
  }

  const row = await loadRefreshTokenForVerify(refresh_token);
  if (!row) {
    return tokenError(400, "invalid_grant", "Unknown refresh token", cors);
  }
  if (row.revoked_at) {
    return tokenError(400, "invalid_grant", "Refresh token has been revoked", cors);
  }
  if (Date.parse(row.expires_at) <= Date.now()) {
    return tokenError(400, "invalid_grant", "Refresh token expired", cors);
  }
  if (row.client_id !== client_id) {
    return tokenError(400, "invalid_grant", "Token belongs to a different client", cors);
  }

  // Optional scope narrowing — clients may request a subset.
  const requestedScope = form.get("scope");
  let scopes = row.scopes;
  if (requestedScope) {
    const requested = requestedScope.split(/\s+/).filter(Boolean);
    const narrowed = requested.filter(
      (s): s is ApiScope => MCP_OAUTH_SCOPE_SET.has(s) && row.scopes.includes(s as ApiScope),
    );
    if (narrowed.length > 0) scopes = narrowed;
  }

  // Rotate: revoke the existing refresh + paired access, then issue
  // a fresh pair.
  await revokeTokenAndPair(row.id);
  return mintAndRespond(client_id, row.profile_id, scopes, cors);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mintAndRespond(
  client_id: string,
  profile_id: string,
  scopes: ApiScope[],
  cors: Record<string, string>,
) {
  const access = generateAccessToken();
  const refresh = generateRefreshToken();
  const issued = await issueTokenPair({
    client_id,
    profile_id,
    scopes,
    rawAccess: access.raw,
    rawRefresh: refresh.raw,
  });
  if (!issued) {
    return tokenError(500, "server_error", "Failed to issue token", cors);
  }
  return NextResponse.json(
    {
      access_token: issued.access_token,
      token_type: "Bearer",
      expires_in: issued.access_expires_in,
      refresh_token: issued.refresh_token,
      scope: issued.scopes.join(" "),
    },
    { status: 200, headers: cors },
  );
}

async function readForm(req: NextRequest): Promise<URLSearchParams | null> {
  const ct = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const text = await req.text().catch(() => "");
    return new URLSearchParams(text);
  }
  if (ct.includes("application/json")) {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return null;
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(json)) {
      if (v !== undefined && v !== null) p.set(k, String(v));
    }
    return p;
  }
  // Fall back: try form anyway.
  const text = await req.text().catch(() => "");
  if (text) return new URLSearchParams(text);
  return null;
}

function tokenError(
  status: number,
  code: string,
  description: string,
  cors: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: code, error_description: description },
    { status, headers: cors },
  );
}
