import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth return endpoint.
 *
 * Supabase redirects here after Google signs the user in. We exchange
 * the `code` query param for a session (which writes auth cookies via
 * our server client), then bounce the user to `next` (or /dashboard).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=missing_code`, request.url),
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL(`/login?error=not_configured`, request.url),
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
