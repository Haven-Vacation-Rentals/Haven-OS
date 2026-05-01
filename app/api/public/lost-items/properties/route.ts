/**
 * GET /api/public/lost-items/properties?q=...
 *
 * Limited, unauthenticated property lookup powering the public lost-
 * items intake form. Returns active properties matching the search
 * needle, with id + name only — no addresses, owners, financials, or
 * any other operational data. Capped to 12 results so the endpoint is
 * not useful for scraping the property catalogue.
 *
 * Rate-limited per client IP to discourage enumeration.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 12;

export async function GET(req: NextRequest) {
  const limit = rateLimit(`lost-items:public-props:${clientIp(req.headers)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    return NextResponse.json({ properties: [] });
  }

  let query = supabase
    .from("properties")
    .select("id, name")
    .is("archived_at", null)
    .order("name")
    .limit(MAX_RESULTS);

  if (q) {
    const safe = q.replace(/[%_]/g, "\\$&");
    query = query.ilike("name", `%${safe}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ properties: [] });
  }
  return NextResponse.json({
    properties: (data ?? []) as { id: string; name: string }[],
  });
}
