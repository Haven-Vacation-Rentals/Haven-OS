/**
 * POST /api/public/career-apply
 *
 * Unauthenticated submission endpoint for the public /careers/[slug] apply
 * form. Accepts a JSON body describing a candidate (name/email/phone/resume
 * attachment metadata/loom link/cover letter) plus optional answers to the
 * role's custom application questions, and inserts the corresponding rows
 * via the service-role admin client.
 *
 * Why service-role rather than anon-with-RLS:
 *   * The form is public, so the only viable RLS policy is anon INSERT with
 *     check (true) — that's a foot-gun (anyone can stuff rows). Doing it
 *     server-side lets us validate "role is open" + custom question shape
 *     before touching the table, and keeps DB policies tight (no anon
 *     INSERT / SELECT on hr_candidates or hr_candidate_answers).
 *   * Mirrors the resume upload route (/api/public/career-resume) which
 *     already uses the service-role client and keeps the public surface
 *     consistent.
 *
 * Mitigations: per-IP rate limit, server-side validation against active
 * questions, role must be `open`, answers only persisted for questions
 * still attached to the role.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type {
  ApplicationAnswerInput,
  ApplicationQuestionType,
  DbRoleQuestion,
} from "@/lib/hr/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplyPayload = {
  role_id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  resume_url?: unknown;
  resume_path?: unknown;
  resume_filename?: unknown;
  resume_mime?: unknown;
  resume_size?: unknown;
  loom_url?: unknown;
  cover_letter?: unknown;
  answers?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function isLikelyUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  const candidate = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(candidate);
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

function normaliseUrl(v: string): string {
  const s = v.trim();
  if (!s) return s;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function normaliseAnswers(value: unknown): ApplicationAnswerInput[] {
  if (!Array.isArray(value)) return [];
  const out: ApplicationAnswerInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    const qid = asString(a.question_id);
    if (!qid) continue;
    out.push({
      question_id: qid,
      value_text:
        typeof a.value_text === "string" ? a.value_text : null,
      value_choice:
        typeof a.value_choice === "string" ? a.value_choice : null,
      value_choices: Array.isArray(a.value_choices)
        ? a.value_choices.filter((c): c is string => typeof c === "string")
        : null,
      value_number:
        typeof a.value_number === "number" && Number.isFinite(a.value_number)
          ? a.value_number
          : null,
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`career-apply:submit:${ip}`, {
    limit: 6,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: ApplyPayload;
  try {
    body = (await req.json()) as ApplyPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const roleId = asString(body.role_id).trim();
  const name = asString(body.name).trim();
  const email = asString(body.email).trim();

  if (!roleId) {
    return NextResponse.json(
      { ok: false, error: "Missing role" },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Name is required" },
      { status: 400 },
    );
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Valid email is required" },
      { status: 400 },
    );
  }

  const loomRaw = asString(body.loom_url).trim();
  if (loomRaw && !isLikelyUrl(loomRaw)) {
    return NextResponse.json(
      { ok: false, error: "Video link doesn't look like a valid URL" },
      { status: 400 },
    );
  }
  const loomUrl = loomRaw ? normaliseUrl(loomRaw) : null;

  const resumeRaw = asString(body.resume_url).trim();
  const resumeUrl = resumeRaw
    ? isLikelyUrl(resumeRaw)
      ? normaliseUrl(resumeRaw)
      : resumeRaw
    : null;

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Applications are not configured.",
      },
      { status: 503 },
    );
  }

  // Verify role is open. Service-role bypasses RLS; we do it explicitly.
  const { data: role, error: roleErr } = await supabase
    .from("hr_roles")
    .select("id, slug, status")
    .eq("id", roleId)
    .eq("status", "open")
    .maybeSingle();
  if (roleErr) {
    return NextResponse.json(
      { ok: false, error: roleErr.message },
      { status: 500 },
    );
  }
  if (!role) {
    return NextResponse.json(
      { ok: false, error: "This role is no longer accepting applications." },
      { status: 400 },
    );
  }

  // Pull active questions for this role to validate + filter answers.
  const { data: questionRows } = await supabase
    .from("hr_role_questions")
    .select("id, question_type, prompt, required, config")
    .eq("role_id", roleId)
    .is("archived_at", null);
  const questions = (questionRows ?? []) as DbRoleQuestion[];
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  const submittedAnswers = normaliseAnswers(body.answers);
  const submittedById = new Map(
    submittedAnswers.map((a) => [a.question_id, a]),
  );

  for (const q of questions) {
    const a = submittedById.get(q.id);
    const t = q.question_type as ApplicationQuestionType;
    const empty =
      !a ||
      ((t === "short_text" || t === "long_text" || t === "url") &&
        !(a.value_text ?? "").trim()) ||
      (t === "single_choice" && !a.value_choice) ||
      (t === "multi_choice" &&
        (!a.value_choices || a.value_choices.length === 0)) ||
      (t === "rating" &&
        (a.value_number === null || a.value_number === undefined)) ||
      (t === "yes_no" && !a.value_choice);
    if (q.required && empty) {
      return NextResponse.json(
        { ok: false, error: `Please answer: "${q.prompt}"` },
        { status: 400 },
      );
    }
    if (!empty && t === "url") {
      const v = (a!.value_text ?? "").trim();
      if (!isLikelyUrl(v)) {
        return NextResponse.json(
          { ok: false, error: `"${q.prompt}" must be a valid URL` },
          { status: 400 },
        );
      }
    }
  }

  // Defensive: if a resume_path was supplied, it must live under this role's
  // prefix. The upload route writes to `${roleId}/...`; reject anything else
  // so a caller can't attach an unrelated upload.
  const resumePath = asStringOrNull(body.resume_path);
  if (resumePath && !resumePath.startsWith(`${roleId}/`)) {
    return NextResponse.json(
      { ok: false, error: "Invalid resume attachment." },
      { status: 400 },
    );
  }

  const { data: candidateRow, error: candErr } = await supabase
    .from("hr_candidates")
    .insert({
      role_id: roleId,
      name,
      email,
      phone: asStringOrNull(body.phone),
      resume_url: resumeUrl,
      resume_path: resumePath,
      resume_filename: asStringOrNull(body.resume_filename),
      resume_mime: asStringOrNull(body.resume_mime),
      resume_size: asNumberOrNull(body.resume_size),
      loom_url: loomUrl,
      cover_letter: asString(body.cover_letter),
      source: "public_form",
      stage: "applied",
    })
    .select("id")
    .single();
  if (candErr || !candidateRow) {
    return NextResponse.json(
      {
        ok: false,
        error: candErr?.message ?? "Failed to submit application",
      },
      { status: 500 },
    );
  }

  const answerRows = submittedAnswers
    .filter((a) => questionsById.has(a.question_id))
    .map((a) => {
      const q = questionsById.get(a.question_id)!;
      const t = q.question_type as ApplicationQuestionType;
      const text =
        (t === "short_text" || t === "long_text" || t === "url") &&
        typeof a.value_text === "string"
          ? t === "url"
            ? a.value_text.trim()
              ? normaliseUrl(a.value_text)
              : null
            : a.value_text.trim() || null
          : null;
      return {
        candidate_id: candidateRow.id as string,
        question_id: a.question_id,
        value_text: text,
        value_choice:
          t === "single_choice" || t === "yes_no"
            ? a.value_choice ?? null
            : null,
        value_choices:
          t === "multi_choice" && Array.isArray(a.value_choices)
            ? a.value_choices
            : null,
        value_number:
          t === "rating" && typeof a.value_number === "number"
            ? a.value_number
            : null,
      };
    })
    .filter(
      (r) =>
        r.value_text !== null ||
        r.value_choice !== null ||
        (r.value_choices && r.value_choices.length > 0) ||
        r.value_number !== null,
    );

  if (answerRows.length > 0) {
    const { error: ansErr } = await supabase
      .from("hr_candidate_answers")
      .insert(answerRows);
    if (ansErr) {
      // Candidate exists; surface as warning in logs and return ok.
      console.error("Failed to insert candidate answers", ansErr);
    }
  }

  return NextResponse.json({ ok: true, role_slug: role.slug });
}
