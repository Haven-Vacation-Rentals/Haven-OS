/**
 * Haven OS — External email invites.
 *
 * Super admins use these actions to invite a specific non-Haven email
 * to sign in with Google. The default Haven domain restriction stays
 * the rule for everyone else; this module is the allowlist.
 *
 * See: supabase/migrations/0039_external_invites.sql
 * See: app/auth/callback/route.ts (consumer)
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  requireSuperAdmin,
  type HavenUserRole,
} from "@/lib/auth/permissions";
import { canonicalBaseUrl } from "@/lib/canonical-url";
import { isHavenDomainEmail } from "@/lib/auth/allowed-emails";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export type ExternalInvite = {
  id: string;
  email: string;
  full_name: string | null;
  role: HavenUserRole;
  token: string;
  status: InviteStatus;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  invited_by: string | null;
  invited_by_email: string | null;
  invited_by_name: string | null;
  revoked_by: string | null;
  accepted_user_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  invite_url: string;
};

const DEFAULT_EXPIRY_DAYS = 14;

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function buildInviteUrl(token: string): string {
  return `${canonicalBaseUrl()}/login?invite=${encodeURIComponent(token)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvite(r: any): ExternalInvite {
  const role: HavenUserRole =
    r.role === "admin" || r.role === "super_admin" ? r.role : "user";
  return {
    id: r.id,
    email: r.email,
    full_name: r.full_name,
    role,
    token: r.token,
    status: r.status,
    expires_at: r.expires_at,
    accepted_at: r.accepted_at,
    revoked_at: r.revoked_at,
    invited_by: r.invited_by ?? r.invited_by_profile?.id ?? null,
    invited_by_email: r.invited_by_profile?.email ?? null,
    invited_by_name: r.invited_by_profile?.full_name ?? null,
    revoked_by: r.revoked_by,
    accepted_user_id: r.accepted_user_id,
    note: r.note,
    created_at: r.created_at,
    updated_at: r.updated_at,
    invite_url: buildInviteUrl(r.token),
  };
}

const SELECT_COLUMNS = `
  id, email, full_name, role, token, status,
  expires_at, accepted_at, revoked_at,
  invited_by, revoked_by, accepted_user_id, note,
  created_at, updated_at,
  invited_by_profile:profiles!external_invites_invited_by_fkey ( id, email, full_name )
`;

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listExternalInvites(): Promise<ExternalInvite[]> {
  await requireSuperAdmin();
  const supabase = await db();
  const { data, error } = await supabase
    .from("external_invites")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Mark expired-but-pending rows so the UI doesn't need to recompute.
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => {
    if (
      r.status === "pending" &&
      r.expires_at &&
      new Date(r.expires_at).getTime() < now
    ) {
      r.status = "expired";
    }
    return rowToInvite(r);
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreateInviteInput = {
  email: string;
  full_name?: string;
  role?: HavenUserRole;
  expires_in_days?: number;
  note?: string;
};

export type CreateInviteResult =
  | { ok: true; invite: ExternalInvite }
  | { ok: false; error: string };

export async function createExternalInvite(
  input: CreateInviteInput,
): Promise<CreateInviteResult> {
  let superId: string;
  try {
    superId = await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  if (isHavenDomainEmail(email)) {
    return {
      ok: false,
      error:
        "This email is already on a Haven domain — use the regular Add user flow instead.",
    };
  }

  const role: HavenUserRole = input.role ?? "user";
  const fullName = input.full_name?.trim() || null;
  const note = input.note?.trim() || null;
  const days = Math.max(
    1,
    Math.min(60, input.expires_in_days ?? DEFAULT_EXPIRY_DAYS),
  );
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString();

  const supabase = await db();
  const { data, error } = await supabase
    .from("external_invites")
    .insert({
      email,
      full_name: fullName,
      role,
      invited_by: superId,
      expires_at: expiresAt,
      note,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: `An active invite already exists for ${email}. Revoke it first if you want to start over.`,
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/users");
  return { ok: true, invite: rowToInvite(data) };
}

// ---------------------------------------------------------------------------
// Revoke
// ---------------------------------------------------------------------------

export type RevokeInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function revokeExternalInvite(
  inviteId: string,
): Promise<RevokeInviteResult> {
  let superId: string;
  try {
    superId = await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const supabase = await db();
  const { error } = await supabase
    .from("external_invites")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: superId,
    })
    .eq("id", inviteId)
    .in("status", ["pending", "accepted"]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resend / extend
// ---------------------------------------------------------------------------

export type ResendInviteResult =
  | { ok: true; invite: ExternalInvite }
  | { ok: false; error: string };

/**
 * Re-arms an invite: bumps the expiry by `expires_in_days` (defaulting
 * to 14) and resets the status to 'pending' if it had expired. The
 * token stays the same so any link already shared keeps working. Only
 * useful for pending/expired invites; revoked/accepted invites are
 * left alone.
 */
export async function resendExternalInvite(
  inviteId: string,
  expiresInDays = DEFAULT_EXPIRY_DAYS,
): Promise<ResendInviteResult> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  const days = Math.max(1, Math.min(60, expiresInDays));
  const supabase = await db();
  const { data, error } = await supabase
    .from("external_invites")
    .update({
      status: "pending",
      expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString(),
    })
    .eq("id", inviteId)
    .in("status", ["pending", "expired"])
    .select(SELECT_COLUMNS)
    .single();
  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error: "Invite can't be resent (already accepted or revoked).",
    };
  }
  revalidatePath("/settings/users");
  return { ok: true, invite: rowToInvite(data) };
}

// ---------------------------------------------------------------------------
// Callback-side helpers (used by /auth/callback)
// ---------------------------------------------------------------------------

/**
 * Look up an active invite for the given email using the service-role
 * client (bypasses RLS by design — the callback runs in a context
 * where the user is technically authenticated, but we don't want to
 * leak invite rows to the regular SSR session).
 *
 * Returns the invite if it is `pending` and not expired; `null` for
 * anything else.
 */
export async function findActiveInviteForEmailAdmin(
  email: string,
): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  role: HavenUserRole;
  status: InviteStatus;
  expires_at: string;
} | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("external_invites")
    .select("id, email, full_name, role, status, expires_at")
    .eq("email", normalized)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("findActiveInviteForEmailAdmin: query failed", error);
    return null;
  }
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    // Lazily flip expired invites so the UI/audit log reflects reality.
    await admin
      .from("external_invites")
      .update({ status: "expired" })
      .eq("id", data.id)
      .eq("status", "pending");
    return null;
  }
  const role: HavenUserRole =
    data.role === "admin" || data.role === "super_admin" ? data.role : "user";
  return { ...data, role };
}

/**
 * Mark an invite as accepted and attach it to the resolved auth user.
 * Best-effort — failure here is logged but never blocks login (the
 * profile row is already in place from the trigger).
 */
export async function markInviteAcceptedAdmin(
  inviteId: string,
  userId: string,
): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin
    .from("external_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_user_id: userId,
    })
    .eq("id", inviteId)
    .eq("status", "pending");
  if (error) {
    console.error("markInviteAcceptedAdmin: update failed", error);
  }
}

/**
 * Apply the invite's intended role/full_name to the new profile, using
 * the service-role admin client (bypasses profiles RLS). No-op when
 * role='user' and full_name is already populated by the auth trigger.
 */
export async function applyInviteDefaultsAdmin(
  userId: string,
  invite: {
    full_name: string | null;
    role: HavenUserRole;
  },
): Promise<void> {
  const admin = getAdminClient();
  const updates: { full_name?: string; role?: HavenUserRole } = {};
  if (invite.full_name) updates.full_name = invite.full_name;
  if (invite.role && invite.role !== "user") updates.role = invite.role;
  if (Object.keys(updates).length === 0) return;
  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) {
    console.error("applyInviteDefaultsAdmin: profiles update failed", error);
  }
}
