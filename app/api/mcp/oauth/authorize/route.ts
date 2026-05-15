/**
 * Authorization endpoint — entry point for the OAuth code flow.
 *
 *   GET /api/mcp/oauth/authorize?
 *     response_type=code
 *     &client_id=hvn_mcp_client_…
 *     &redirect_uri=https://claude.ai/…
 *     &scope=tasks:read+tasks:write
 *     &state=<opaque>
 *     &code_challenge=<S256>
 *     &code_challenge_method=S256
 *
 * Behavior:
 *   1. Validate client_id, redirect_uri (exact match), response_type,
 *      PKCE parameters.
 *   2. If the user is not signed in to Haven OS, redirect them
 *      through /login?next=/mcp/consent?ck=<signed-state>.
 *   3. Otherwise redirect straight to /mcp/consent?ck=<signed-state>.
 *
 * Errors before the user-agent reaches consent are surfaced via the
 * redirect_uri with `error=…` per RFC 6749 §4.1.2.1 when (and only
 * when) the client_id + redirect_uri pair is valid. Otherwise we
 * render a plain error page so we don't bounce the user-agent to an
 * attacker-controlled URI.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadClient } from "@/lib/mcp/oauth/store";
import { parseScopeParam } from "@/lib/mcp/oauth/scopes";
import { signConsentState } from "@/lib/mcp/oauth/secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const client_id = q.get("client_id") ?? "";
  const redirect_uri = q.get("redirect_uri") ?? "";
  const response_type = q.get("response_type") ?? "";
  const scope = q.get("scope");
  const state = q.get("state");
  const code_challenge = q.get("code_challenge") ?? "";
  const code_challenge_method = q.get("code_challenge_method") ?? "";

  if (!client_id) {
    return renderError(req, "invalid_request", "Missing client_id");
  }
  const client = await loadClient(client_id);
  if (!client || client.revoked_at) {
    return renderError(req, "invalid_client", "Unknown client_id");
  }

  if (!redirect_uri || !client.redirect_uris.includes(redirect_uri)) {
    return renderError(
      req,
      "invalid_request",
      "redirect_uri is not registered for this client",
    );
  }

  // From here, errors bounce back to the client via redirect_uri.
  if (response_type !== "code") {
    return redirectWithError(redirect_uri, "unsupported_response_type", state);
  }
  if (!code_challenge) {
    return redirectWithError(
      redirect_uri,
      "invalid_request",
      state,
      "Missing code_challenge (PKCE required)",
    );
  }
  if (code_challenge_method !== "S256") {
    return redirectWithError(
      redirect_uri,
      "invalid_request",
      state,
      "Only S256 code_challenge_method is supported",
    );
  }

  const scopes = parseScopeParam(scope);

  // Hand off to the consent page with a signed state blob — that page
  // is server-rendered behind requireUser() and will redirect through
  // /login if needed. Including the consent token in `next` makes the
  // post-login redirect deterministic.
  const consentToken = signConsentState({
    c: client_id,
    r: redirect_uri,
    s: scopes,
    cc: code_challenge,
    st: state,
  });

  const consentPath = `/mcp/consent?ck=${encodeURIComponent(consentToken)}`;
  return NextResponse.redirect(`${url.origin}${consentPath}`, { status: 302 });
}

function renderError(req: NextRequest, code: string, description: string) {
  const url = new URL(req.url);
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>OAuth error — Haven OS</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 4rem auto; padding: 0 1.25rem; color: #111;"><h1 style="font-size:1.25rem;">Connector authorization failed</h1><p><strong>${escapeHtml(code)}</strong>: ${escapeHtml(description)}</p><p style="color:#555;font-size:0.9rem;">If you didn't initiate this from Claude, you can safely close this window.</p><p style="margin-top:2rem;"><a href="${url.origin}">← Back to Haven OS</a></p></body></html>`;
  return new NextResponse(body, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function redirectWithError(
  redirectUri: string,
  code: string,
  state: string | null,
  description?: string,
) {
  const u = new URL(redirectUri);
  u.searchParams.set("error", code);
  if (description) u.searchParams.set("error_description", description);
  if (state) u.searchParams.set("state", state);
  return NextResponse.redirect(u.toString(), { status: 302 });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
