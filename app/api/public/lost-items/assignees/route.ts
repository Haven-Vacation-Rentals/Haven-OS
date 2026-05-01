/**
 * GET /api/public/lost-items/assignees
 *
 * Limited, unauthenticated lookup of eligible Haven team members for
 * the public lost-items intake form. Returns profile id + display name
 * only — no emails, avatars, or other PII. The roster is small and
 * already discoverable by anyone with the intake link, so exposing
 * names is acceptable; emails/avatars are not.
 *
 * Rate-limited per client IP to discourage scraping.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 200;

export async function GET(req: NextRequest) {
  const limit = rateLimit(`lost-items:public-assignees:${clientIp(req.headers)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    return NextResponse.json({ assignees: [] });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name")
    .limit(MAX_RESULTS);
  if (error) {
    return NextResponse.json({ assignees: [] });
  }

  const assignees = (data ?? [])
    .map((p: { id: string; full_name: string | null; email: string | null }) => {
      const name =
        (p.full_name && p.full_name.trim()) ||
        (p.email ? p.email.split("@")[0] : "") ||
        "";
      return { id: p.id, name };
    })
    .filter((p: { id: string; name: string }) => p.name.length > 0);

  return NextResponse.json({ assignees });
}
