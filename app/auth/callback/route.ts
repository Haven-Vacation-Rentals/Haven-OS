import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonicalBaseUrl } from "@/lib/canonical-url";

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${base}${next}`);
}
