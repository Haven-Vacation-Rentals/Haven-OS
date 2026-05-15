/**
 * Token / code / client-id generators and hashing for the MCP OAuth
 * flow. Mirrors lib/api-tokens/secret.ts in spirit — high-entropy
 * random bearers, stored sha256-hashed only.
 *
 * Prefixes:
 *   - Access token:      hvn_mcp_<base64url(32)>
 *   - Refresh token:     hvn_mcp_ref_<base64url(32)>
 *   - Authorization code: hvn_mcp_code_<base64url(32)>
 *   - Client identifier: hvn_mcp_client_<base64url(16)>
 *
 * The `hvn_mcp_` prefix on access tokens lets /api/mcp distinguish
 * OAuth bearers from PATs (hvn_pat_…) at a glance.
 */

import { createHash, randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import type { ApiScope } from "@/lib/api-tokens/types";

export const MCP_ACCESS_PREFIX = "hvn_mcp_";
export const MCP_REFRESH_PREFIX = "hvn_mcp_ref_";
export const MCP_CODE_PREFIX = "hvn_mcp_code_";
export const MCP_CLIENT_PREFIX = "hvn_mcp_client_";

export interface GeneratedSecret {
  raw: string;
  hash: string;
}

function generate(prefix: string, bytes = 32): GeneratedSecret {
  const random = randomBytes(bytes).toString("base64url");
  const raw = `${prefix}${random}`;
  return { raw, hash: hashSecret(raw) };
}

export function hashSecret(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateAccessToken(): GeneratedSecret {
  return generate(MCP_ACCESS_PREFIX);
}

export function generateRefreshToken(): GeneratedSecret {
  return generate(MCP_REFRESH_PREFIX);
}

export function generateAuthorizationCode(): GeneratedSecret {
  return generate(MCP_CODE_PREFIX);
}

export function generateClientId(): string {
  return `${MCP_CLIENT_PREFIX}${randomBytes(16).toString("base64url")}`;
}

/**
 * True iff the raw bearer is shaped like one of our MCP OAuth access
 * tokens (and definitely not a PAT). Cheap shape check before hitting
 * the DB. Refresh tokens have their own prefix and are not bearers for
 * /api/mcp.
 */
export function looksLikeMcpAccessToken(raw: string): boolean {
  if (!raw.startsWith(MCP_ACCESS_PREFIX)) return false;
  if (raw.startsWith(MCP_REFRESH_PREFIX)) return false;
  if (raw.startsWith(MCP_CODE_PREFIX)) return false;
  if (raw.startsWith(MCP_CLIENT_PREFIX)) return false;
  const tail = raw.slice(MCP_ACCESS_PREFIX.length);
  return /^[A-Za-z0-9_-]{30,80}$/.test(tail);
}

/**
 * PKCE S256 verification: base64url(sha256(verifier)) === challenge.
 *
 * Constant-time compare to avoid timing leaks.
 */
export function verifyPkceS256(verifier: string, challenge: string): boolean {
  if (!verifier || !challenge) return false;
  const computed = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Sign a short consent-state blob (so the consent page's hidden form
 * fields can't be tampered with between display and POST). We use the
 * Supabase service-role key as the HMAC secret since it's already
 * required and server-only. Stale or tampered state → reject.
 */
const CONSENT_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function consentSigningKey(): Buffer {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!k) {
    // We never want to fall back to a constant — refuse to sign rather
    // than issue a forgeable consent state.
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — cannot sign MCP consent state",
    );
  }
  return Buffer.from(k);
}

export interface ConsentStatePayload {
  /** ClientId requesting consent. */
  c: string;
  /** Redirect URI. */
  r: string;
  /** Requested scopes. */
  s: ApiScope[];
  /** PKCE challenge (S256). */
  cc: string;
  /** OAuth `state` param to echo back to the client. */
  st: string | null;
  /** Issued-at, ms. */
  iat: number;
}

export function signConsentState(payload: Omit<ConsentStatePayload, "iat">): string {
  const body: ConsentStatePayload = { ...payload, iat: Date.now() };
  const json = JSON.stringify(body);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac("sha256", consentSigningKey())
    .update(b64)
    .digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyConsentState(token: string): ConsentStatePayload | null {
  if (!token || typeof token !== "string") return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const expected = createHmac("sha256", consentSigningKey())
    .update(b64)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(b64, "base64url").toString("utf-8"),
    ) as ConsentStatePayload;
    if (
      typeof parsed.iat !== "number" ||
      Date.now() - parsed.iat > CONSENT_STATE_TTL_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
