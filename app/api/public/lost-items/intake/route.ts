/**
 * POST /api/public/lost-items/intake
 *
 * Unauthenticated intake endpoint backing the public form at
 * /lost-items/intake. Lets Haven team members (and trusted partners)
 * file a new lost-item case without an OS login.
 *
 * Abuse mitigations:
 *   - Honeypot field ("website") that real users never fill in.
 *   - Per-IP rate limit (process-local sliding window).
 *   - Server-side validation: required item description, length caps,
 *     basic URL/email shape checks, ignored unknown fields.
 *
 * Always writes status=pending_pickup, source=internal_form, and tags
 * the case with external_source="public_intake" so it can be audited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { canonicalUrl } from "@/lib/canonical-url";
import { createCaseRaw } from "@/lib/lost-items/actions";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntakeBody = {
  item_description?: string;
  found_location?: string;
  property_id?: string | null;
  property_name?: string | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  slack_thread_url?: string;
  conversation_url?: string;
  follow_up_date?: string;
  cleaning_vendor?: string;
  notes?: string;
  /** Honeypot — must remain empty. */
  website?: string;
  /** Optional reporter context, recorded in notes for audit. */
  reporter_name?: string;
  /** Optional assignee (profile id). Validated against profiles before use. */
  assigned_to?: string | null;
};

const MAX_TEXT = 2000;
const MAX_SHORT = 200;

function trimOrNull(v: unknown, max = MAX_SHORT): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function isValidUrl(s: string | null): boolean {
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(s: string | null): boolean {
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidIsoDate(s: string | null): boolean {
  if (!s) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`lost-items:public-intake:${ip}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: IntakeBody;
  try {
    body = (await req.json()) as IntakeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields, real users don't.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const description = trimOrNull(body.item_description, MAX_TEXT);
  if (!description) {
    return NextResponse.json(
      { error: "Item description is required" },
      { status: 400 },
    );
  }

  const slackUrl = trimOrNull(body.slack_thread_url, MAX_SHORT);
  const convoUrl = trimOrNull(body.conversation_url, MAX_SHORT);
  const guestEmail = trimOrNull(body.guest_email, MAX_SHORT);
  const followUp = trimOrNull(body.follow_up_date, MAX_SHORT);

  if (!isValidUrl(slackUrl)) {
    return NextResponse.json(
      { error: "Slack thread link must be a valid http(s) URL" },
      { status: 400 },
    );
  }
  if (!isValidUrl(convoUrl)) {
    return NextResponse.json(
      { error: "Conversation link must be a valid http(s) URL" },
      { status: 400 },
    );
  }
  if (!isValidEmail(guestEmail)) {
    return NextResponse.json(
      { error: "Guest email is not valid" },
      { status: 400 },
    );
  }
  if (!isValidIsoDate(followUp)) {
    return NextResponse.json(
      { error: "Follow-up date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const reporter = trimOrNull(body.reporter_name, MAX_SHORT);
  const userNotes = trimOrNull(body.notes, MAX_TEXT);
  const auditFooter = `Submitted via public intake form${reporter ? ` by ${reporter}` : ""}.`;
  const notes = userNotes ? `${userNotes}\n\n— ${auditFooter}` : auditFooter;

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Lost Items intake is not configured.",
      },
      { status: 503 },
    );
  }

  // Validate optional assignee against the profiles table so this
  // endpoint cannot be used to set arbitrary IDs.
  let assignedTo: string | null = null;
  const requestedAssignee = trimOrNull(body.assigned_to, MAX_SHORT);
  if (requestedAssignee) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", requestedAssignee)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json(
        { error: "Selected assignee is not valid" },
        { status: 400 },
      );
    }
    assignedTo = profile.id as string;
  }

  const result = await createCaseRaw(
    {
      item_description: description,
      found_location: trimOrNull(body.found_location, MAX_SHORT),
      property_id: trimOrNull(body.property_id, MAX_SHORT),
      property_name: trimOrNull(body.property_name, MAX_SHORT),
      guest_name: trimOrNull(body.guest_name, MAX_SHORT),
      guest_email: guestEmail,
      guest_phone: trimOrNull(body.guest_phone, MAX_SHORT),
      slack_thread_url: slackUrl,
      conversation_url: convoUrl,
      cleaning_vendor: trimOrNull(body.cleaning_vendor, MAX_SHORT),
      follow_up_date: followUp,
      assigned_to: assignedTo,
      status: "pending_pickup",
      source: "internal_form",
      external_source: "public_intake",
      notes,
    },
    supabase,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      case_number: result.data.case_number,
      url: canonicalUrl(`/operations/lost-items/${result.data.id}`),
    },
    { status: 201 },
  );
}
