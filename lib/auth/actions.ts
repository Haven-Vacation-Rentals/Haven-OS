"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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
 *
 * Before starting the flow we wipe any stale `sb-*` cookies. Without
 * this, a verifier cookie left over from a previous attempt on a
 * different canonical host would collide with the fresh PKCE
 * challenge and the callback would fail with "code challenge does
 * not match previously saved code verifier".
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  await clearStaleSupabaseCookies();

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
  await clearStaleSupabaseCookies();
  redirect("/login");
}

/**
 * Delete every `sb-*` cookie visible to this request. Server Actions
 * are allowed to mutate cookies, and the new PKCE flow we're about
 * to start will write fresh ones.
 */
async function clearStaleSupabaseCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-")) {
      try {
        cookieStore.set({ name: c.name, value: "", path: "/", maxAge: 0 });
      } catch {
        // Read-only context (rare for a Server Action) — middleware
        // refresh will reconcile on the next request.
      }
    }
  }
}
