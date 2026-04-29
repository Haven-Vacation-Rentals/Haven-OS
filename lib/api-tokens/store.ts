/**
 * Service-role helpers for PAT verification. Kept separate from
 * `actions.ts` (which is "use server" — every export there becomes a
 * client-callable server action). These functions are server-only but
 * are *not* server actions and must never be exposed to the client.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import type { PersonalAccessTokenRow } from "./types";

export async function loadTokenForVerify(
  hash: string,
): Promise<PersonalAccessTokenRow | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("personal_access_tokens")
    .select("*")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error) return null;
  return data as PersonalAccessTokenRow | null;
}

export async function markTokenUsed(id: string): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from("personal_access_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);
}
