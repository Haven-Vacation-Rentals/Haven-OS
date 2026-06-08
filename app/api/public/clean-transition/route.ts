/**
 * POST /api/public/clean-transition
 *
 * Unauthenticated intake endpoint backing the public share form at
 * /clean-transition/intake. Submissions feed the internal Clean Transition
 * approval queue.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CleanTransitionBody = {
  property_name?: string;
  address?: string;
  owner_name?: string;
  submitted_by_name?: string;
  cleaning_contact?: string;
  transition_date?: string;
  old_price?: number | string;
  new_price?: number | string;
  notes?: string;
  /** Honeypot — must remain empty. */
  website?: string;
};

const MAX_TEXT = 1200;
const MAX_SHORT = 240;

function trimOrNull(value: unknown, max = MAX_SHORT): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

function parsePrice(value: unknown): number | null {
  const num =
    typeof value === "number"
      ? value
      : Number(
          String(value ?? "")
            .replace(/[$,]/g, "")
            .trim(),
        );
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function validDateOrNull(value: unknown): string | null {
  const text = trimOrNull(value, 40);
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`clean-transition:public:${ip}`, {
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: CleanTransitionBody;
  try {
    body = (await req.json()) as CleanTransitionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields, real users don't.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const propertyName = trimOrNull(body.property_name, 180);
  const oldPrice = parsePrice(body.old_price);
  const newPrice = parsePrice(body.new_price);
  const transitionDate = validDateOrNull(body.transition_date);

  if (!propertyName) {
    return NextResponse.json(
      { error: "Property name is required" },
      { status: 400 },
    );
  }
  if (oldPrice === null || newPrice === null) {
    return NextResponse.json(
      { error: "Old price and new price must be valid numbers" },
      { status: 400 },
    );
  }
  if (body.transition_date && !transitionDate) {
    return NextResponse.json(
      { error: "Transition date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Clean Transition intake is not configured.",
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("clean_transition_submissions")
    .insert({
      property_name: propertyName,
      address: trimOrNull(body.address, 240),
      owner_name: trimOrNull(body.owner_name, 140),
      submitted_by_name: trimOrNull(body.submitted_by_name, 140),
      cleaning_contact: trimOrNull(body.cleaning_contact, 180),
      transition_date: transitionDate,
      old_price: oldPrice,
      new_price: newPrice,
      notes: trimOrNull(body.notes, MAX_TEXT),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      submission_id: data.id,
    },
    { status: 201 },
  );
}
