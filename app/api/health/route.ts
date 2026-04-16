import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Health probe. Used by Vercel deploy protection, uptime pingers,
 * and humans wanting to confirm env + build from the command line.
 *
 * Intentionally cheap — does not hit the database. Returns 200 even
 * when Supabase is unconfigured so this route can smoke-test a fresh
 * deployment before env vars land.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "haven-os",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    supabase: isSupabaseConfigured() ? "configured" : "missing",
    time: new Date().toISOString(),
  });
}
