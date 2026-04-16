"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Kick off the Google OAuth flow via Supabase. Supabase returns the
 * provider URL we need to send the browser to; we redirect to it.
 *
 * The callback route lives at /auth/callback — make sure that exact
 * URL is whitelisted in the Supabase dashboard under:
 *   Authentication → URL Configuration → Redirect URLs
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable.");

  const origin = await resolveOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      queryParams: {
        // Internal tool — force Haven workspace picker every time.
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned from Supabase.");

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Best-effort origin for OAuth redirect. Precedence:
 *   1. Vercel preview/dev deployments → use that deployment's URL
 *      (so a branch deploy redirects back to itself, not prod).
 *   2. Vercel production with NEXT_PUBLIC_APP_URL set → use the custom
 *      domain (e.g. https://os.havenvacationrentals.com).
 *   3. Vercel production without custom domain → use VERCEL_URL.
 *   4. Local dev → NEXT_PUBLIC_APP_URL or the request host headers.
 *   5. Absolute fallback → http://localhost:3000.
 *
 * The returned URL is ALWAYS one that must be in Supabase's redirect
 * allowlist (Authentication → URL Configuration) or Supabase will
 * refuse the OAuth handshake.
 */
async function resolveOrigin(): Promise<string> {
  const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development"
  const vercelUrl = process.env.VERCEL_URL; // e.g. "haven-os-abc.vercel.app"

  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (vercelUrl) return `https://${vercelUrl}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
