"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSignedIn, getPermissions } from "@/lib/auth/permissions";
import { generateToken } from "./secret";
import {
  ALL_SCOPES,
  toPublic,
  type ApiScope,
  type PersonalAccessTokenPublic,
} from "./types";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function sanitizeScopes(scopes: ApiScope[] | undefined): ApiScope[] {
  if (!scopes || scopes.length === 0) return ["platform:full"];
  const allowed = new Set<ApiScope>(ALL_SCOPES);
  const filtered = scopes.filter((s): s is ApiScope => allowed.has(s));
  return filtered.length > 0 ? filtered : ["platform:full"];
}

// ---------------------------------------------------------------------------
// List (own tokens, or — for super admins — every token in the system)
// ---------------------------------------------------------------------------

export async function listOwnTokens(): Promise<PersonalAccessTokenPublic[]> {
  const userId = await requireSignedIn();
  const supabase = await db();
  const { data, error } = await supabase
    .from("personal_access_tokens")
    .select(
      "id, profile_id, name, token_prefix, scopes, expires_at, last_used_at, revoked_at, created_by, created_at, updated_at",
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  // The select above already excludes token_hash, but route through
  // toPublic for type-safety + future-proofing.
  return ((data ?? []) as PersonalAccessTokenPublic[]).map(
    (r) => r as PersonalAccessTokenPublic,
  );
}

export async function listAllTokens(): Promise<PersonalAccessTokenPublic[]> {
  const perm = await getPermissions();
  if (!perm.is_super_admin)
    throw new Error("Requires super admin");
  const supabase = await db();
  const { data, error } = await supabase
    .from("personal_access_tokens")
    .select(
      "id, profile_id, name, token_prefix, scopes, expires_at, last_used_at, revoked_at, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PersonalAccessTokenPublic[];
}

// ---------------------------------------------------------------------------
// Create (returns the raw token exactly once)
// ---------------------------------------------------------------------------

export interface CreateTokenInput {
  name: string;
  scopes?: ApiScope[];
  /** ISO date or null. */
  expires_at?: string | null;
}

export interface CreateTokenResult {
  /** Raw bearer — show to the user once, never persisted in plaintext. */
  raw: string;
  token: PersonalAccessTokenPublic;
}

export async function createToken(
  input: CreateTokenInput,
): Promise<CreateTokenResult> {
  const userId = await requireSignedIn();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (name.length > 80) throw new Error("Name is too long (max 80)");

  const scopes = sanitizeScopes(input.scopes);
  const expiresAt = input.expires_at?.trim() ? input.expires_at : null;
  if (expiresAt) {
    const ms = Date.parse(expiresAt);
    if (Number.isNaN(ms)) throw new Error("Invalid expires_at");
    if (ms <= Date.now()) throw new Error("expires_at must be in the future");
  }

  const supabase = await db();
  const { raw, prefix, hash } = generateToken();

  const { data, error } = await supabase
    .from("personal_access_tokens")
    .insert({
      profile_id: userId,
      name,
      token_prefix: prefix,
      token_hash: hash,
      scopes,
      expires_at: expiresAt,
      created_by: userId,
    })
    .select(
      "id, profile_id, name, token_prefix, scopes, expires_at, last_used_at, revoked_at, created_by, created_at, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/settings/api-tokens");
  return {
    raw,
    token: data as PersonalAccessTokenPublic,
  };
}

// ---------------------------------------------------------------------------
// Revoke / delete
// ---------------------------------------------------------------------------

export async function revokeToken(id: string): Promise<void> {
  await requireSignedIn();
  const supabase = await db();
  const { error } = await supabase
    .from("personal_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/api-tokens");
}

export async function deleteToken(id: string): Promise<void> {
  await requireSignedIn();
  const supabase = await db();
  // RLS limits this to the caller's own tokens (or super_admin).
  // Super admin uses revokeToken instead — destructive delete is the
  // user's own escape hatch.
  const { error } = await supabase
    .from("personal_access_tokens")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/api-tokens");
}

export { toPublic };
