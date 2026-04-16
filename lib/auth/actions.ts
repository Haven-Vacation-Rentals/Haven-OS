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
 * Best-effort origin for OAuth redirect. Prefers NEXT_PUBLIC_APP_URL
 * (stable across envs), falls back to the request host, finally
 * localhost.
 */
async function resolveOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
