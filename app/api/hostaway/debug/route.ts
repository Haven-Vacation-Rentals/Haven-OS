import { NextResponse } from "next/server";
import {
  getConsolidatedFinance,
  getReviews,
  isConfigured,
} from "@/lib/hostaway/client";
import { requireUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint — returns Hostaway API response shapes (not values)
 * so we can quickly see what the upstream returned without exposing data.
 * Auth-gated: only signed-in users.
 */
export async function GET() {
  await requireUser();

  if (!isConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const out: Record<string, unknown> = { configured: true };

  try {
    const fin = await getConsolidatedFinance({
      fromDate: ymd(first),
      toDate: ymd(now),
      dateType: "arrivalDate",
      revalidate: false,
    });
    out.finance = {
      columns: fin.columns?.map((c) => c.name),
      rowCount: fin.rows?.length ?? 0,
      totalsLength: fin.totals?.length ?? 0,
      currency: fin.currency ?? null,
      sampleRow: fin.rows?.[0]?.slice(0, 8) ?? null,
      totalsPreview: fin.totals?.slice(0, 8) ?? null,
    };
  } catch (err) {
    out.financeError = err instanceof Error ? err.message : String(err);
  }

  try {
    const reviews = await getReviews({
      type: "guest-to-host",
      limit: 20,
      revalidate: false,
    });
    const first = reviews[0];
    out.reviews = {
      returned: reviews.length,
      sampleKeys: first ? Object.keys(first) : null,
      sample: first
        ? {
            id: first.id,
            rating: first.rating,
            status: first.status,
            insertedOn: first.insertedOn,
            departureDate: first.departureDate,
          }
        : null,
      ratingStats: {
        withRating: reviews.filter((r) => typeof r.rating === "number").length,
        withoutRating: reviews.filter((r) => r.rating == null).length,
      },
    };
  } catch (err) {
    out.reviewsError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(out);
}
