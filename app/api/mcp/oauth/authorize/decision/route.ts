/**
 * Consent decision endpoint. The /mcp/consent form POSTs here with
 * either "approve" or "deny". On approve we issue an authorization
 * code and redirect back to the client; on deny we redirect with
 * access_denied per RFC 6749 §4.1.2.1.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { verifyConsentState, generateAuthorizationCode } from "@/lib/mcp/oauth/secret";
import {
  loadClient,
  insertAuthorizationCode,
} from "@/lib/mcp/oauth/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Invalid form body" },
      { status: 400 },
    );
  }

  const ck = String(form.get("ck") ?? "");
  const decision = String(form.get("decision") ?? "");
  const payload = verifyConsentState(ck);
  if (!payload) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Consent token invalid or expired",
      },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    // Should not happen — /mcp/consent gates on requireUser — but be
    // defensive and bounce to login.
    const next = `/mcp/consent?ck=${encodeURIComponent(ck)}`;
    return NextResponse.redirect(
      `${new URL(req.url).origin}/login?next=${encodeURIComponent(next)}`,
    );
  }

  const client = await loadClient(payload.c);
  if (!client || client.revoked_at) {
    return NextResponse.json(
      {
        error: "invalid_client",
        error_description: "Unknown client",
      },
      { status: 400 },
    );
  }
  if (!client.redirect_uris.includes(payload.r)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri no longer registered for this client",
      },
      { status: 400 },
    );
  }

  if (decision !== "approve") {
    return redirectWithError(payload.r, "access_denied", payload.st);
  }

  const { raw } = generateAuthorizationCode();
  const ok = await insertAuthorizationCode({
    rawCode: raw,
    client_id: payload.c,
    profile_id: user.id,
    scopes: payload.s,
    redirect_uri: payload.r,
    code_challenge: payload.cc,
    code_challenge_method: "S256",
  });
  if (!ok) {
    return redirectWithError(payload.r, "server_error", payload.st);
  }

  const u = new URL(payload.r);
  u.searchParams.set("code", raw);
  if (payload.st) u.searchParams.set("state", payload.st);
  return NextResponse.redirect(u.toString());
}

function redirectWithError(redirectUri: string, code: string, state: string | null) {
  const u = new URL(redirectUri);
  u.searchParams.set("error", code);
  if (state) u.searchParams.set("state", state);
  return NextResponse.redirect(u.toString());
}
