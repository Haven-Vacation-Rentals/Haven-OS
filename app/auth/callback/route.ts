import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { canonicalBaseUrl } from "@/lib/canonical-url";
import { isHavenDomainEmail } from "@/lib/auth/allowed-emails";
import {
  findActiveInviteForEmailAdmin,
  markInviteAcceptedAdmin,
  applyInviteDefaultsAdmin,
} from "@/lib/admin/invites";

/**
 * OAuth return endpoint.
 *
 * Supabase redirects here after Google signs the user in. We exchange
 * the `code` query param for a session (which writes auth cookies via
 * our server client), then bounce the user to `next` (or /dashboard).
 *
 * We rebase the redirect on the canonical app URL so that even if
 * Supabase's redirect_uri pointed at the raw Vercel hostname, the
 * authenticated user lands back on the custom domain.
 *
 * Domain restriction:
 *   - Haven domain emails (havenvacationrentals.com / haven.com) pass.
 *   - Any other email must have an active row in `external_invites`.
 *     If not, we sign the user out, wipe their cookies, and bounce
 *     them back to /login with a friendly error. This is a defense-
 *     in-depth check; Google's OAuth consent screen (Internal user
 *     type or Workspace allowlist) should already block most cases.
 *
 * If the PKCE exchange fails because the verifier cookie was written
 * on a different host (e.g. the user started on the Vercel URL and
 * landed back on the canonical custom domain after we changed the
 * Site URL), we wipe stale `sb-*` cookies and send the user back to
 * /login with a friendly message instead of leaking the raw error.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : `/${nextParam}`;

  const base = canonicalBaseUrl();

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${base}/login?error=not_configured`);
  }

  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    if (isVerifierMismatch(error.message)) {
      const response = NextResponse.redirect(
        `${base}/login?error=auth_session_expired`,
      );
      await clearSupabaseCookies(request, response);
      return response;
    }
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // -------------------------------------------------------------------------
  // Domain / invite gate
  // -------------------------------------------------------------------------
  const sessionUser = exchanged.user;
  const sessionEmail = sessionUser?.email ?? "";
  if (sessionUser && sessionEmail && !isHavenDomainEmail(sessionEmail)) {
    const invite = await findActiveInviteForEmailAdmin(sessionEmail);
    if (!invite) {
      await supabase.auth.signOut();
      const response = NextResponse.redirect(
        `${base}/login?error=not_invited`,
      );
      await clearSupabaseCookies(request, response);
      // Best-effort: remove the just-created Supabase auth.users row so
      // a stale, unusable user doesn't accumulate. The profiles row
      // (if any) cascades via the FK on auth.users.id.
      try {
        const admin = getAdminClient();
        await admin.auth.admin.deleteUser(sessionUser.id);
      } catch (e) {
        console.error("callback: failed to delete uninvited user", e);
      }
      return response;
    }
    await applyInviteDefaultsAdmin(sessionUser.id, {
      full_name: invite.full_name,
      role: invite.role,
    });
    await markInviteAcceptedAdmin(invite.id, sessionUser.id);
  }

  return NextResponse.redirect(`${base}${next}`);
}

function isVerifierMismatch(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("code verifier") ||
    m.includes("code challenge") ||
    m.includes("code_verifier") ||
    m.includes("invalid request") ||
    m.includes("flow state") ||
    m.includes("pkce")
  );
}

/**
 * Wipe Supabase auth cookies on the response so the next request to
 * /login starts a fresh PKCE flow. We delete on both the request's
 * own host and (defensively) without a domain so any stale verifier
 * left over from a prior canonical-URL switch is cleared.
 */
async function clearSupabaseCookies(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const cookieStore = await cookies();
  const names = new Set<string>();
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-")) names.add(c.name);
  }
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-")) names.add(c.name);
  }
  for (const name of names) {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
}
