/**
 * MCP OAuth bearer authentication.
 *
 * The shape mirrors lib/api-tokens/auth.authenticatePat — return a
 * fully-formed ApiAuthContext on success so the MCP dispatcher and
 * tool handlers don't need to care whether the actor authenticated
 * with a PAT or an OAuth access token.
 *
 * /api/mcp uses authenticateMcp() (see lib/mcp/auth-bearer.ts) which
 * tries the PAT path first, then falls back here for hvn_mcp_* tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import type { ApiAuthContext, ApiActorProfile } from "@/lib/api-tokens/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadAccessTokenForVerify, touchAccessTokenUsed } from "./store";
import { looksLikeMcpAccessToken } from "./secret";

export type McpOauthAuthResult =
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; status: number; error: string };

/**
 * Verify an MCP OAuth access token. Returns the same ApiAuthContext
 * the PAT path produces so callers downstream are oblivious.
 *
 * Caller is responsible for the WWW-Authenticate response header —
 * /api/mcp adds it uniformly for both PAT and OAuth failures.
 */
export async function authenticateMcpOauth(
  raw: string,
): Promise<McpOauthAuthResult> {
  if (!looksLikeMcpAccessToken(raw)) {
    return { ok: false, status: 401, error: "Invalid token format" };
  }

  const row = await loadAccessTokenForVerify(raw);
  if (!row) return { ok: false, status: 401, error: "Unknown token" };
  if (row.revoked_at) return { ok: false, status: 401, error: "Token revoked" };
  if (Date.parse(row.expires_at) <= Date.now()) {
    return { ok: false, status: 401, error: "Token expired" };
  }

  const actor = await loadActor(row.profile_id);
  if (!actor) {
    return { ok: false, status: 401, error: "Token owner no longer exists" };
  }

  // Best-effort last-used update.
  touchAccessTokenUsed(row.id).catch(() => {});

  return {
    ok: true,
    ctx: {
      // Reuse token_id for audit logging. Distinguishable from PATs by
      // the row table — but ApiAuthContext only carries the uuid.
      token_id: row.id,
      scopes: row.scopes,
      actor,
      admin: getAdminClient(),
    },
  };
}

/**
 * RFC 6750 §3 — when the protected resource serves a 401, it MUST
 * include a `WWW-Authenticate: Bearer` header so that clients can
 * discover the OAuth metadata. We point at the protected-resource
 * metadata URL Claude can fetch to begin the flow.
 */
export function withWwwAuthenticate(
  res: NextResponse,
  req: NextRequest,
  error: "invalid_token" | "invalid_request" = "invalid_token",
  description?: string,
): NextResponse {
  const origin = new URL(req.url).origin;
  const resourceMeta = `${origin}/.well-known/oauth-protected-resource`;
  const parts = [
    `Bearer realm="haven-os-mcp"`,
    `error="${error}"`,
    description ? `error_description="${description.replace(/"/g, "")}"` : null,
    `resource_metadata="${resourceMeta}"`,
  ].filter(Boolean);
  res.headers.set("WWW-Authenticate", parts.join(", "));
  return res;
}

async function loadActor(profileId: string): Promise<ApiActorProfile | null> {
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return null;

  const role = (profile.role ?? "user") as ApiActorProfile["role"];
  let hasHr = role === "super_admin";
  if (!hasHr) {
    const { data: grants } = await admin
      .from("hr_access_grants")
      .select("id")
      .eq("grantee_id", profileId)
      .limit(1);
    hasHr = (grants?.length ?? 0) > 0;
  }
  return {
    id: profile.id,
    email: profile.email ?? null,
    full_name: profile.full_name ?? null,
    role,
    has_any_hr_access: hasHr,
    is_super_admin: role === "super_admin",
    is_admin_or_above: role === "admin" || role === "super_admin",
  };
}
