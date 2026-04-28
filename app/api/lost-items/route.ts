/**
 * POST /api/lost-items
 * GET  /api/lost-items
 *
 * External-agent path for the Lost Items tracker.
 *
 * Authentication: a shared API key passed in `x-haven-api-key` (or
 * `Authorization: Bearer <key>`). Configured via env var
 * `HAVEN_LOST_ITEMS_API_KEY`. Without this env var set, the endpoints
 * return 503 — we never accept anonymous writes.
 *
 * Writes use the Supabase service-role client (bypasses RLS) so external
 * partners don't need a Haven user account. Idempotent on
 * (external_source, external_id) — a second POST with the same pair
 * returns the existing case instead of duplicating it.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  createCaseRaw,
  type CreateCaseResult,
} from "@/lib/lost-items/actions";
import type {
  LostItemSource,
  LostItemStatus,
} from "@/lib/lost-items/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// API-key check
// ---------------------------------------------------------------------------

function checkApiKey(req: NextRequest):
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> } {
  const expected = process.env.HAVEN_LOST_ITEMS_API_KEY?.trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      body: {
        error:
          "Lost Items API not configured — set HAVEN_LOST_ITEMS_API_KEY in the deployment environment.",
      },
    };
  }
  const headerKey =
    req.headers.get("x-haven-api-key") ??
    (req.headers.get("authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();
  if (!headerKey || headerKey !== expected) {
    return {
      ok: false,
      status: 401,
      body: { error: "Invalid or missing API key" },
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// GET — list (filterable, scoped by external_source by default)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const externalSource = url.searchParams.get("external_source");
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );

  const supabase = getAdminClient();
  let q = supabase
    .from("lost_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  if (externalSource) q = q.eq("external_source", externalSource);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    cases: (data ?? []).map(serialize),
  });
}

// ---------------------------------------------------------------------------
// POST — create (or upsert via external_source/external_id)
// ---------------------------------------------------------------------------

type CreateBody = {
  item_description?: string;
  found_location?: string | null;
  photo_urls?: string[];

  property_id?: string | null;
  property_name?: string | null;

  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;

  slack_thread_url?: string | null;
  conversation_url?: string | null;

  status?: LostItemStatus;

  cleaning_vendor?: string | null;
  follow_up_date?: string | null;

  source?: LostItemSource;
  external_source?: string | null;
  external_id?: string | null;
  external_url?: string | null;

  notes?: string | null;
};

export async function POST(req: NextRequest) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = body.item_description?.trim();
  if (!description) {
    return NextResponse.json(
      { error: "item_description is required" },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();
  const result: CreateCaseResult = await createCaseRaw(
    {
      ...body,
      item_description: description,
      source: body.source ?? "external_agent",
    },
    supabase,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      case: serialize(result.data),
      url: canonicalUrl(`/operations/lost-items/${result.data.id}`),
    },
    { status: 201 },
  );
}

// ---------------------------------------------------------------------------
// Serialization — keep API stable independent of column changes
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(row: any) {
  return {
    id: row.id,
    case_number: row.case_number,
    status: row.status,
    item_description: row.item_description,
    found_location: row.found_location,
    photo_urls: row.photo_urls ?? [],
    property_id: row.property_id,
    property_name: row.property_name,
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    slack_thread_url: row.slack_thread_url,
    conversation_url: row.conversation_url,
    cleaning_vendor: row.cleaning_vendor,
    pickup_scheduled_at: row.pickup_scheduled_at,
    pickup_completed_at: row.pickup_completed_at,
    return_method: row.return_method,
    shipping_carrier: row.shipping_carrier,
    shipping_tracking: row.shipping_tracking,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
    completed_at: row.completed_at,
    follow_up_date: row.follow_up_date,
    source: row.source,
    external_source: row.external_source,
    external_id: row.external_id,
    external_url: row.external_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
