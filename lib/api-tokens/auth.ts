/**
 * /api/v1 authentication helper.
 *
 * Usage in a route handler:
 *
 *   const auth = await authenticatePat(req);
 *   if (!auth.ok) return auth.response;        // 401 / 403 already shaped
 *   if (!hasApiScope(auth.ctx, "tasks:read"))
 *     return scopeDeniedResponse("tasks:read");
 *
 *   // auth.ctx.profile_id is the actor — every subsequent DB query
 *   // must scope to that user's permissions.
 *
 * Important guarantee: a PAT *never* elevates the actor's app-level
 * permissions. The token gives the bearer the same read/write surface
 * the owner already has — no more.
 */

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  hashToken,
  looksLikePat,
  TOKEN_PREFIX,
} from "./secret";
import { ALL_SCOPES, type ApiScope } from "./types";
import { loadTokenForVerify, markTokenUsed } from "./store";

export interface ApiActorProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin" | "super_admin";
  has_any_hr_access: boolean;
  is_super_admin: boolean;
  is_admin_or_above: boolean;
}

export interface ApiAuthContext {
  token_id: string;
  scopes: ApiScope[];
  actor: ApiActorProfile;
  /** Service-role Supabase client. Use with care: bypasses RLS. */
  admin: SupabaseClient;
}

export type ApiAuthResult =
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; response: NextResponse };

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

/**
 * Verify the request's bearer token. On success, returns a context the
 * route handler can use; on failure, returns a fully-formed NextResponse
 * the handler can return directly.
 *
 * Logs the resulting status to api_access_logs in the background (best
 * effort — log failures never block the request).
 */
export async function authenticatePat(
  req: NextRequest,
): Promise<ApiAuthResult> {
  const raw = readBearer(req);
  if (!raw) {
    return {
      ok: false,
      response: errorResponse(401, "Missing Authorization bearer token", req),
    };
  }
  if (!looksLikePat(raw)) {
    return {
      ok: false,
      response: errorResponse(
        401,
        `Invalid token format — expected ${TOKEN_PREFIX}…`,
        req,
      ),
    };
  }

  const hash = hashToken(raw);
  const row = await loadTokenForVerify(hash);
  if (!row) {
    return { ok: false, response: errorResponse(401, "Unknown token", req) };
  }
  if (row.revoked_at) {
    return { ok: false, response: errorResponse(401, "Token revoked", req) };
  }
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    return { ok: false, response: errorResponse(401, "Token expired", req) };
  }

  const actor = await loadActor(row.profile_id);
  if (!actor) {
    return {
      ok: false,
      response: errorResponse(401, "Token owner no longer exists", req),
    };
  }

  const admin = getAdminClient();
  const ctx: ApiAuthContext = {
    token_id: row.id,
    scopes: sanitizeScopes(row.scopes),
    actor,
    admin,
  };

  // Touch last_used_at; don't await — best-effort.
  markTokenUsed(row.id).catch(() => {});

  return { ok: true, ctx };
}

// ---------------------------------------------------------------------------
// Scope helpers
// ---------------------------------------------------------------------------

export function hasApiScope(ctx: ApiAuthContext, scope: ApiScope): boolean {
  if (ctx.scopes.includes("platform:full")) return true;
  return ctx.scopes.includes(scope);
}

export function requireApiScope(
  ctx: ApiAuthContext,
  scope: ApiScope,
): NextResponse | null {
  if (hasApiScope(ctx, scope)) return null;
  return scopeDeniedResponse(scope);
}

export function scopeDeniedResponse(scope: ApiScope): NextResponse {
  return NextResponse.json(
    { error: `Token missing required scope: ${scope}` },
    { status: 403 },
  );
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

/**
 * Log an authenticated request to api_access_logs. Always best-effort.
 * Call from route handlers via `logApiAccess(req, ctx, status)` after
 * the response status is known.
 */
export async function logApiAccess(
  req: NextRequest,
  ctx: ApiAuthContext | null,
  statusCode: number,
): Promise<void> {
  try {
    const admin = getAdminClient();
    const url = new URL(req.url);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ip_hash = ip
      ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
      : null;
    await admin.from("api_access_logs").insert({
      token_id: ctx?.token_id ?? null,
      profile_id: ctx?.actor.id ?? null,
      method: req.method,
      path: url.pathname,
      status_code: statusCode,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      ip_hash,
    });
  } catch {
    // Audit failures never block the API response.
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function readBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() ?? null;
}

function sanitizeScopes(scopes: unknown): ApiScope[] {
  const allowed = new Set<ApiScope>(ALL_SCOPES);
  if (!Array.isArray(scopes)) return ["platform:full"];
  const out = scopes.filter((s): s is ApiScope =>
    typeof s === "string" && allowed.has(s as ApiScope),
  );
  return out.length > 0 ? out : ["platform:full"];
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

function errorResponse(
  status: number,
  message: string,
  req: NextRequest,
): NextResponse {
  const res = NextResponse.json({ error: message }, { status });
  // Best-effort audit (no ctx because auth failed).
  logApiAccess(req, null, status).catch(() => {});
  return res;
}
