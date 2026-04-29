/**
 * GET  /api/v1/lost-items   — list cases (PAT auth, scoped by token owner).
 * POST /api/v1/lost-items   — create or upsert a case via external_source/external_id.
 *
 * This is the PAT-authenticated counterpart to the older shared-key
 * `/api/lost-items` endpoint. The shared-key endpoint stays in place
 * for the existing intake form. PATs are the preferred path for new
 * external integrations because every action is attributed to a real
 * Haven user.
 */

import { NextResponse } from "next/server";
import {
  clampLimit,
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";
import { canonicalUrl } from "@/lib/canonical-url";
import { createCaseRaw } from "@/lib/lost-items/actions";
import type {
  LostItemSource,
  LostItemStatus,
} from "@/lib/lost-items/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "lost-items:read" }, async (req, ctx) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const externalSource = url.searchParams.get("external_source");
  const limit = clampLimit(url.searchParams.get("limit"));

  let q = ctx.admin
    .from("lost_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  if (externalSource) q = q.eq("external_source", externalSource);

  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ cases: (data ?? []).map(serialize) });
});

interface CreateBody {
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
}

export const POST = withApi({ scope: "lost-items:write" }, async (req, ctx) => {
  const body = await readJson<CreateBody>(req);
  if (!body) return jsonError(400, "Invalid JSON body");
  const description = body.item_description?.trim();
  if (!description) return jsonError(400, "item_description is required");

  const result = await createCaseRaw(
    {
      ...body,
      item_description: description,
      source: body.source ?? "external_agent",
      created_by: ctx.actor.id,
    },
    ctx.admin,
  );
  if (!result.ok) return jsonError(400, result.error);
  return NextResponse.json(
    {
      ok: true,
      case: serialize(result.data),
      url: canonicalUrl(`/operations/lost-items/${result.data.id}`),
    },
    { status: 201 },
  );
});

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
    assigned_to: row.assigned_to,
    source: row.source,
    external_source: row.external_source,
    external_id: row.external_id,
    external_url: row.external_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
