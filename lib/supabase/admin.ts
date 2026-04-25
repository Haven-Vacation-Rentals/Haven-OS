/**
 * Supabase admin client (service-role key).
 *
 * Used for privileged operations the regular SSR client can't perform,
 * notably inviting / creating users via auth.admin. Keep all callers
 * inside server-only modules — the service role bypasses RLS.
 */

import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client unavailable — NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    );
  }
  cached = createAdminSupabase(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
