/**
 * GET   /api/lost-items/:id
 * PATCH /api/lost-items/:id
 * POST  /api/lost-items/:id/comments  (handled below via POST + ?action=comment)
 *
 * External-agent reads + updates for a single case. Same auth as the
 * collection endpoint (HAVEN_LOST_ITEMS_API_KEY).
 *
 * `:id` accepts either the UUID or the case_number (LI-001023).
 *
 * To add a comment from an external system, POST to this endpoint with
 *   ?action=comment   and  body { "body": "..." }
 * (We expose comments here rather than as a nested route to keep the
 * external surface small.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { updateCaseRaw, addCommentRaw } from "@/lib/lost-items/actions";
import type { LostItemStatus } from "@/lib/lost-items/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          "Lost Items API not configured — set HAVEN_LOST_ITEMS_API_KEY.",
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveId(supabase: any, idOrNumber: string): Promise<string | null> {
  if (UUID_RE.test(idOrNumber)) return idOrNumber;
  const { data } = await supabase
    .from("lost_items")
    .select("id")
    .eq("case_number", idOrNumber)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { id } = await params;
  const supabase = getAdminClient();
  const realId = await resolveId(supabase, id);
  if (!realId) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("lost_items")
    .select("*")
    .eq("id", realId)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  return NextResponse.json({ case: data });
}

type PatchBody = {
  status?: LostItemStatus;
  pickup_scheduled_at?: string | null;
  pickup_completed_at?: string | null;
  shipping_carrier?: string | null;
  shipping_tracking?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  return_method?: "shipped" | "guest_pickup" | "in_person" | "other" | null;
  cleaning_vendor?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  external_url?: string | null;
  slack_thread_url?: string | null;
  conversation_url?: string | null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { id } = await params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const realId = await resolveId(supabase, id);
  if (!realId) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const result = await updateCaseRaw(
    realId,
    body,
    {
      actor_label: `external:${
        req.headers.get("x-haven-source") ?? "api"
      }`,
    },
    supabase,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, case: result.data });
}

/**
 * POST /api/lost-items/:id?action=comment   { "body": "..." }
 *
 * Adds a comment from an external partner. The comment is recorded with
 * actor_label so the team sees which system posted it.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action !== "comment") {
    return NextResponse.json(
      { error: "Unsupported action. Use ?action=comment." },
      { status: 400 },
    );
  }

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = body.body?.trim();
  if (!text) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const realId = await resolveId(supabase, id);
  if (!realId) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const result = await addCommentRaw(
    realId,
    text,
    {
      actor_label: `external:${
        req.headers.get("x-haven-source") ?? "api"
      }`,
    },
    supabase,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
