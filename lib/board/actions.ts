"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DbBoardAnnouncement,
  DbBoardAdmin,
  DbBoardSetting,
  Announcement,
  LoomEmbed,
  BoardData,
} from "./types";
import { BOARD_KEYS } from "./types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentEmail(): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function isAdmin(email?: string | null): Promise<boolean> {
  const e = (email ?? (await currentEmail()) ?? "").toLowerCase();
  if (!e) return false;
  const supabase = await db();
  const { data } = await supabase
    .from("board_admins")
    .select("email")
    .ilike("email", e)
    .maybeSingle();
  return !!data;
}

async function requireAdmin(): Promise<string> {
  const email = await currentEmail();
  if (!email) throw new Error("Not signed in");
  if (!(await isAdmin(email))) throw new Error("Not authorized — admins only");
  return email;
}

function mapAnnouncement(r: DbBoardAnnouncement): Announcement {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    isPinned: r.is_pinned,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Loom URL parsing
// ---------------------------------------------------------------------------

/**
 * Accepts:
 *   https://www.loom.com/share/<id>?sid=...
 *   https://loom.com/share/<id>
 *   https://www.loom.com/embed/<id>
 *   <id>  (bare ID)
 * Returns the normalized embed URL, or null if unparseable.
 */
function parseLoomUrl(raw: string): LoomEmbed | null {
  const input = raw.trim();
  if (!input) return null;

  // Bare ID (hex, 24+ chars)
  if (/^[a-f0-9]{20,}$/i.test(input)) {
    return { url: `https://www.loom.com/share/${input}`, embedUrl: `https://www.loom.com/embed/${input}`, title: null };
  }

  try {
    const u = new URL(input);
    if (!/loom\.com$/i.test(u.hostname)) return null;
    const match = u.pathname.match(/\/(?:share|embed)\/([a-f0-9]+)/i);
    if (!match) return null;
    const id = match[1];
    return {
      url: input,
      embedUrl: `https://www.loom.com/embed/${id}`,
      title: null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getBoardData(): Promise<BoardData> {
  const supabase = await db();
  const email = await currentEmail();

  const [settingsRes, announcementsRes, adminCheck] = await Promise.all([
    supabase.from("board_settings").select("*"),
    supabase
      .from("board_announcements")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    isAdmin(email),
  ]);

  const settings = (settingsRes.data ?? []) as DbBoardSetting[];
  const loomUrl = settings.find((s) => s.key === BOARD_KEYS.LOOM_URL)?.value ?? "";
  const loomTitle = settings.find((s) => s.key === BOARD_KEYS.LOOM_TITLE)?.value ?? null;

  const loom = loomUrl ? parseLoomUrl(loomUrl) : null;
  if (loom && loomTitle) loom.title = loomTitle;

  const announcements = ((announcementsRes.data ?? []) as DbBoardAnnouncement[]).map(mapAnnouncement);

  return { loom, announcements, isAdmin: adminCheck };
}

// ---------------------------------------------------------------------------
// Loom settings (admin only)
// ---------------------------------------------------------------------------

export async function saveLoomUrl(rawUrl: string, title: string): Promise<void> {
  const email = await requireAdmin();
  const supabase = await db();

  const trimmedUrl = rawUrl.trim();
  // Validate if non-empty
  if (trimmedUrl && !parseLoomUrl(trimmedUrl)) {
    throw new Error("That doesn't look like a valid Loom URL. Paste a loom.com share or embed link.");
  }

  await supabase.from("board_settings").upsert(
    [
      { key: BOARD_KEYS.LOOM_URL, value: trimmedUrl || null, updated_by: email },
      { key: BOARD_KEYS.LOOM_TITLE, value: title.trim() || null, updated_by: email },
    ],
    { onConflict: "key" },
  );

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Announcements (admin only to write; anyone reads)
// ---------------------------------------------------------------------------

export async function createAnnouncement(input: {
  title: string;
  body: string;
  isPinned: boolean;
}): Promise<void> {
  const email = await requireAdmin();
  const supabase = await db();

  if (!input.title.trim()) throw new Error("Title is required");

  await supabase.from("board_announcements").insert({
    title: input.title.trim(),
    body: input.body,
    is_pinned: input.isPinned,
    created_by: email,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function updateAnnouncement(
  id: string,
  input: { title: string; body: string; isPinned: boolean },
): Promise<void> {
  await requireAdmin();
  const supabase = await db();

  if (!input.title.trim()) throw new Error("Title is required");

  await supabase
    .from("board_announcements")
    .update({
      title: input.title.trim(),
      body: input.body,
      is_pinned: input.isPinned,
    })
    .eq("id", id);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await db();
  await supabase.from("board_announcements").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function togglePin(id: string, isPinned: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await db();
  await supabase.from("board_announcements").update({ is_pinned: isPinned }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Admin whitelist
// ---------------------------------------------------------------------------

export async function listAdmins(): Promise<string[]> {
  const supabase = await db();
  const { data } = await supabase.from("board_admins").select("email").order("email");
  return ((data ?? []) as DbBoardAdmin[]).map((r) => r.email);
}

export async function addAdmin(email: string): Promise<void> {
  await requireAdmin();
  const supabase = await db();
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) throw new Error("Valid email required");
  await supabase.from("board_admins").upsert({ email: clean }, { onConflict: "email" });
  revalidatePath("/settings");
}

export async function removeAdmin(email: string): Promise<void> {
  const currentUser = await requireAdmin();
  if (email.toLowerCase() === currentUser.toLowerCase()) {
    throw new Error("You can't remove yourself — ask another admin to do it.");
  }
  const supabase = await db();
  await supabase.from("board_admins").delete().eq("email", email);
  revalidatePath("/settings");
}
