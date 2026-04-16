import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Shape we pass to the shell. Derived from Supabase auth + optional
 * profile row; kept small so we can render without extra DB hits.
 */
export type HavenUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
};

/**
 * Resolve the currently signed-in user, or `null` if unauthenticated
 * or if Supabase isn't configured. Safe to call from any Server
 * Component.
 */
export async function getCurrentUser(): Promise<HavenUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const rawName: string =
    meta.full_name || meta.name || user.email || "Haven";
  const email = user.email ?? "";

  return {
    id: user.id,
    email,
    name: rawName,
    initials: initialsFromName(rawName),
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

/**
 * Gate a page/layout behind auth. Redirects to /login if not signed in.
 * If Supabase isn't configured yet, behaves the same way so the login
 * page can render the setup banner.
 */
export async function requireUser(): Promise<HavenUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "H";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
