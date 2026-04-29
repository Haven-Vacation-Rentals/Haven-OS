/**
 * Tiny wrappers for /api/v1 route handlers. Each handler runs through
 * `withApi` so we get uniform auth, scope checks, error shape, and
 * audit logging.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticatePat,
  hasApiScope,
  logApiAccess,
  scopeDeniedResponse,
  type ApiAuthContext,
} from "./auth";
import type { ApiScope } from "./types";

export interface ApiHandlerOptions {
  /**
   * Required scope. `platform:full` always satisfies. If the token
   * lacks the scope, the handler returns 403 without ever running.
   */
  scope: ApiScope;
}

export type ApiHandler = (
  req: NextRequest,
  ctx: ApiAuthContext,
  params: Record<string, string>,
) => Promise<NextResponse>;

export function withApi(
  options: ApiHandlerOptions,
  handler: ApiHandler,
) {
  return async function wrapped(
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    const auth = await authenticatePat(req);
    if (!auth.ok) return auth.response;

    if (!hasApiScope(auth.ctx, options.scope)) {
      const r = scopeDeniedResponse(options.scope);
      logApiAccess(req, auth.ctx, r.status).catch(() => {});
      return r;
    }

    const params = routeCtx?.params ? await routeCtx.params : {};

    let res: NextResponse;
    try {
      res = await handler(req, auth.ctx, params);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal error";
      res = NextResponse.json({ error: message }, { status: 500 });
    }
    logApiAccess(req, auth.ctx, res.status).catch(() => {});
    return res;
  };
}

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function readJson<T = unknown>(req: NextRequest): Promise<T | null> {
  return req
    .json()
    .then((b) => b as T)
    .catch(() => null);
}

export function clampLimit(
  raw: string | null,
  fallback = 50,
  max = 200,
): number {
  const n = parseInt(raw ?? String(fallback), 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
}
