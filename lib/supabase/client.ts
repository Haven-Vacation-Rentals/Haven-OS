import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Browser-side Supabase client. Use inside "use client" components.
 * Returns `null` when env is not configured so callers can render a
 * "Supabase not configured" UX instead of crashing.
 */
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey);
}
