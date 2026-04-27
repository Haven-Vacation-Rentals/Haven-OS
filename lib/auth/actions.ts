"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canonicalBaseUrl } from "@/lib/canonical-url";

/**
 * Kick off the Google OAuth flow via Supabase. Supabase returns the
 * provider URL we need to send the browser to; we redirect to it.
 *
 * The callback route lives at /auth/callback — make sure that exact
 * URL (on the canonical domain) is whitelisted in the Supabase
 * dashboard under: Authentication → URL Configuration → Redirect URLs.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase client unavailable.");

  const origin = canonicalBaseUrl();

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
