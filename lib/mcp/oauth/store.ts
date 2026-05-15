/**
 * Service-role DB helpers for the MCP OAuth flow. All callers are
 * route handlers that already use the admin client.
 *
 * The hash columns (token_hash, code_hash) are never returned to the
 * client — only the row metadata is.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import type { ApiScope } from "@/lib/api-tokens/types";
import { hashSecret } from "./secret";

export interface McpOauthClient {
  id: string;
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
  scopes: ApiScope[];
  token_endpoint_auth_method: string;
  revoked_at: string | null;
}

export interface McpOauthCode {
  id: string;
  client_id: string;
  profile_id: string;
  scopes: ApiScope[];
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  expires_at: string;
  consumed_at: string | null;
}

export interface McpOauthToken {
  id: string;
  token_type: "access" | "refresh";
  client_id: string;
  profile_id: string;
  scopes: ApiScope[];
  paired_token_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function insertClient(input: {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
  scopes: ApiScope[];
}): Promise<McpOauthClient | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("mcp_oauth_clients")
    .insert({
      client_id: input.client_id,
      client_name: input.client_name,
      redirect_uris: input.redirect_uris,
      scopes: input.scopes,
      token_endpoint_auth_method: "none",
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data as McpOauthClient;
}

export async function loadClient(clientId: string): Promise<McpOauthClient | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_clients")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  return (data as McpOauthClient | null) ?? null;
}

// ---------------------------------------------------------------------------
// Authorization codes
// ---------------------------------------------------------------------------

const AUTH_CODE_TTL_MS = 5 * 60 * 1000;

export async function insertAuthorizationCode(input: {
  rawCode: string;
  client_id: string;
  profile_id: string;
  scopes: ApiScope[];
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
}): Promise<boolean> {
  const admin = getAdminClient();
  const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_MS).toISOString();
  const { error } = await admin.from("mcp_oauth_authorization_codes").insert({
    code_hash: hashSecret(input.rawCode),
    client_id: input.client_id,
    profile_id: input.profile_id,
    scopes: input.scopes,
    redirect_uri: input.redirect_uri,
    code_challenge: input.code_challenge,
    code_challenge_method: input.code_challenge_method,
    expires_at: expiresAt,
  });
  return !error;
}

export async function consumeAuthorizationCode(
  rawCode: string,
): Promise<McpOauthCode | null> {
  const admin = getAdminClient();
  const hash = hashSecret(rawCode);

  // Atomic-ish consume: update consumed_at only if it was null and not
  // expired, return the row.
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("mcp_oauth_authorization_codes")
    .update({ consumed_at: nowIso })
    .eq("code_hash", hash)
    .is("consumed_at", null)
    .gt("expires_at", nowIso)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data as McpOauthCode;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const ACCESS_TTL_MS = 60 * 60 * 1000;      // 1 hour
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface IssuedTokenPair {
  access_token: string;
  access_expires_in: number; // seconds
  refresh_token: string;
  scopes: ApiScope[];
}

/**
 * Issue an access + refresh token pair for the given (client, user,
 * scopes). Both tokens are inserted and cross-linked via
 * paired_token_id so revoking one revokes the sibling.
 */
export async function issueTokenPair(input: {
  client_id: string;
  profile_id: string;
  scopes: ApiScope[];
  rawAccess: string;
  rawRefresh: string;
}): Promise<IssuedTokenPair | null> {
  const admin = getAdminClient();
  const now = Date.now();
  const accessExpires = new Date(now + ACCESS_TTL_MS).toISOString();
  const refreshExpires = new Date(now + REFRESH_TTL_MS).toISOString();

  const { data: accessRow, error: accessErr } = await admin
    .from("mcp_oauth_tokens")
    .insert({
      token_type: "access",
      token_hash: hashSecret(input.rawAccess),
      client_id: input.client_id,
      profile_id: input.profile_id,
      scopes: input.scopes,
      expires_at: accessExpires,
    })
    .select("id")
    .maybeSingle();
  if (accessErr || !accessRow) return null;

  const { data: refreshRow, error: refreshErr } = await admin
    .from("mcp_oauth_tokens")
    .insert({
      token_type: "refresh",
      token_hash: hashSecret(input.rawRefresh),
      client_id: input.client_id,
      profile_id: input.profile_id,
      scopes: input.scopes,
      paired_token_id: accessRow.id as string,
      expires_at: refreshExpires,
    })
    .select("id")
    .maybeSingle();
  if (refreshErr || !refreshRow) {
    // Best-effort cleanup of orphaned access token.
    await admin.from("mcp_oauth_tokens").delete().eq("id", accessRow.id as string);
    return null;
  }

  // Back-link the access token to the refresh token id.
  await admin
    .from("mcp_oauth_tokens")
    .update({ paired_token_id: refreshRow.id as string })
    .eq("id", accessRow.id as string);

  return {
    access_token: input.rawAccess,
    access_expires_in: Math.floor(ACCESS_TTL_MS / 1000),
    refresh_token: input.rawRefresh,
    scopes: input.scopes,
  };
}

export async function loadAccessTokenForVerify(
  rawAccess: string,
): Promise<McpOauthToken | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_tokens")
    .select("*")
    .eq("token_hash", hashSecret(rawAccess))
    .eq("token_type", "access")
    .maybeSingle();
  return (data as McpOauthToken | null) ?? null;
}

export async function loadRefreshTokenForVerify(
  rawRefresh: string,
): Promise<McpOauthToken | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_tokens")
    .select("*")
    .eq("token_hash", hashSecret(rawRefresh))
    .eq("token_type", "refresh")
    .maybeSingle();
  return (data as McpOauthToken | null) ?? null;
}

export async function revokeTokenAndPair(tokenId: string): Promise<void> {
  const admin = getAdminClient();
  const nowIso = new Date().toISOString();

  // Pull the row first so we know its sibling.
  const { data: row } = await admin
    .from("mcp_oauth_tokens")
    .select("id, paired_token_id")
    .eq("id", tokenId)
    .maybeSingle();
  if (!row) return;

  const ids = [row.id as string];
  if (row.paired_token_id) ids.push(row.paired_token_id as string);

  await admin
    .from("mcp_oauth_tokens")
    .update({ revoked_at: nowIso })
    .in("id", ids);
}

/**
 * Revoke by raw token (used by /revoke). Accepts either access or
 * refresh format; tolerates unknown tokens (RFC 7009 — return 200
 * regardless to avoid token-enumeration oracles).
 */
export async function revokeByRawToken(raw: string): Promise<void> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_tokens")
    .select("id")
    .eq("token_hash", hashSecret(raw))
    .maybeSingle();
  if (!data) return;
  await revokeTokenAndPair(data.id as string);
}

export async function touchAccessTokenUsed(id: string): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("mcp_oauth_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * List active (non-revoked) MCP OAuth tokens for the given user —
 * powers the connector settings UI revoke list. Returns access tokens
 * only (one row per "session") so users don't see paired refresh rows.
 */
export async function listActiveTokensForUser(
  profile_id: string,
): Promise<
  Array<{
    id: string;
    client_id: string;
    scopes: ApiScope[];
    created_at: string;
    last_used_at: string | null;
    expires_at: string;
  }>
> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_tokens")
    .select("id, client_id, scopes, created_at, last_used_at, expires_at, revoked_at, token_type")
    .eq("profile_id", profile_id)
    .eq("token_type", "access")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return (data ?? [])
    .filter((r) => r.revoked_at === null)
    .map((r) => ({
      id: r.id as string,
      client_id: r.client_id as string,
      scopes: (r.scopes as ApiScope[]) ?? [],
      created_at: r.created_at as string,
      last_used_at: r.last_used_at as string | null,
      expires_at: r.expires_at as string,
    }));
}
