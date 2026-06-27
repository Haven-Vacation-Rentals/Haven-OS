/**
 * GET /api/reviews
 *
 * Read-only feed of Hostaway guest reviews for trusted internal partners
 * (e.g. the Tendwell cleaning-ops app, which reads Haven's reviews because
 * cleaning quality shows up directly in guest feedback).
 *
 * Authentication: a shared API key passed in `x-haven-api-key` (or
 * `Authorization: Bearer <key>`). Configured via env var
 * `HAVEN_REVIEWS_API_KEY`. Without this env var set, the endpoint returns
 * 503 — we never serve review data anonymously. This mirrors the
 * shared-key pattern used by `/api/lost-items`.
 *
 * Hostaway credentials live only in this app; partners never hold them.
 *
 * Query params (all optional):
 *   - type:               "guest-to-host" (default) | "host-to-guest"
 *   - departureDateStart: Y-m-d window start (by reservation departure)
 *   - departureDateEnd:   Y-m-d window end
 *   - limit:              max rows (default 500, clamped to 500)
 *   - offset:             pagination offset (default 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { getReviews, isConfigured } from "@/lib/hostaway/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// API-key check (shared-key, mirrors /api/lost-items)
// ---------------------------------------------------------------------------

function checkApiKey(req: NextRequest):
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> } {
  const expected = process.env.HAVEN_REVIEWS_API_KEY?.trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      body: {
        error:
          "Reviews API not configured — set HAVEN_REVIEWS_API_KEY in the deployment environment.",
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
// GET — Hostaway review feed
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const auth = checkApiKey(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Hostaway is not configured on the Haven server." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const typeParam = url.searchParams.get("type");
  const type =
    typeParam === "host-to-guest" ? "host-to-guest" : "guest-to-host";

  const departureDateStart =
    url.searchParams.get("departureDateStart") ?? undefined;
  const departureDateEnd =
    url.searchParams.get("departureDateEnd") ?? undefined;

  const rawLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 500;
  const rawOffset = Number(url.searchParams.get("offset"));
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;

  try {
    const reviews = await getReviews({
      type,
      departureDateStart,
      departureDateEnd,
      limit,
      offset,
      // Short server-side cache; the partner caches/syncs on its own side too.
      revalidate: 300,
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        rating: r.rating, // Hostaway scale: 0–10
        publicReview: r.publicReview,
        reviewCategory: r.reviewCategory ?? [],
        listingMapId: r.listingMapId,
        listingName: r.listingName,
        reservationId: r.reservationId,
        guestName: r.guestName,
        arrivalDate: r.arrivalDate,
        departureDate: r.departureDate,
        insertedOn: r.insertedOn,
        updatedOn: r.updatedOn,
      })),
      count: reviews.length,
      ratingScale: 10,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch reviews from Hostaway: ${message}` },
      { status: 502 },
    );
  }
}
