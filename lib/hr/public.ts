"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationAnswerInput,
  ApplicationQuestionType,
  DbRole,
  DbRoleQuestion,
} from "./types";

/**
 * Public (unauthenticated) helpers that power /careers landing pages.
 * These bypass the HR admin gate — DB RLS is set up so anon users can:
 *   - SELECT hr_roles where status='open'
 *   - SELECT hr_role_questions where parent role is open and not archived
 *   - INSERT hr_candidates
 *   - INSERT hr_candidate_answers
 */

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export async function listPublicRoles(): Promise<DbRole[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .eq("status", "open")
    .order("updated_at", { ascending: false });
  return (data ?? []) as DbRole[];
}

export async function getPublicRoleBySlug(slug: string): Promise<DbRole | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_roles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "open")
    .maybeSingle();
  return (data ?? null) as DbRole | null;
}

export async function getPublicRoleQuestions(
  roleId: string,
): Promise<DbRoleQuestion[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("hr_role_questions")
    .select("*")
    .eq("role_id", roleId)
    .is("archived_at", null)
    .order("position", { ascending: true });
  return ((data ?? []) as DbRoleQuestion[]).map((q) => ({
    ...q,
    config: q.config ?? {},
  }));
}

function isLikelyUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  // Accept bare domains too: convert to https:// for validation only.
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

export async function submitApplication(input: {
  role_id: string;
  role_slug: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  resume_path?: string | null;
  resume_filename?: string | null;
  resume_mime?: string | null;
  resume_size?: number | null;
  loom_url?: string;
  cover_letter?: string;
  answers?: ApplicationAnswerInput[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!input.name.trim()) {
      return { ok: false, error: "Name is required" };
    }
    if (!input.email.trim() || !input.email.includes("@")) {
      return { ok: false, error: "Valid email is required" };
    }

    const loomRaw = input.loom_url?.trim();
    if (loomRaw && !isLikelyUrl(loomRaw)) {
      return { ok: false, error: "Video link doesn't look like a valid URL" };
    }
    const loomUrl = loomRaw ? normaliseUrl(loomRaw) : null;

    const resumeRaw = input.resume_url?.trim();
    const resumeUrl = resumeRaw
      ? isLikelyUrl(resumeRaw)
        ? normaliseUrl(resumeRaw)
        : resumeRaw // keep tolerant of free-form sources (LinkedIn handle, drive…) for back-compat
      : null;

    const supabase = await db();

    // Verify role is actually open (defence in depth beyond RLS).
    const { data: role } = await supabase
      .from("hr_roles")
      .select("id, status")
      .eq("id", input.role_id)
      .eq("status", "open")
      .maybeSingle();
    if (!role) {
      return {
        ok: false,
        error: "This role is no longer accepting applications.",
      };
    }

    // Look up active questions so we can validate answers + reject stragglers.
    const { data: questionRows } = await supabase
      .from("hr_role_questions")
      .select("id, question_type, prompt, required, config")
      .eq("role_id", input.role_id)
      .is("archived_at", null);
    const questions = (questionRows ?? []) as DbRoleQuestion[];
    const questionsById = new Map(questions.map((q) => [q.id, q]));

    // Validate required answers and shape against question type.
    const submittedAnswers = input.answers ?? [];
    const submittedById = new Map(
      submittedAnswers.map((a) => [a.question_id, a]),
    );
    for (const q of questions) {
      const a = submittedById.get(q.id);
      const t = q.question_type as ApplicationQuestionType;
      const empty =
        !a ||
        ((t === "short_text" || t === "long_text") &&
          !(a.value_text ?? "").trim()) ||
        (t === "url" && !(a.value_text ?? "").trim()) ||
        (t === "single_choice" && !a.value_choice) ||
        (t === "multi_choice" && (!a.value_choices || a.value_choices.length === 0)) ||
        (t === "rating" && (a.value_number === null || a.value_number === undefined)) ||
        (t === "yes_no" && !a.value_choice);
      if (q.required && empty) {
        return { ok: false, error: `Please answer: "${q.prompt}"` };
      }
      if (!empty && t === "url") {
        const v = (a!.value_text ?? "").trim();
        if (!isLikelyUrl(v)) {
          return { ok: false, error: `"${q.prompt}" must be a valid URL` };
        }
      }
    }

    // Insert the candidate first so we can attach answers to it.
    const { data: candidateRow, error: candErr } = await supabase
      .from("hr_candidates")
      .insert({
        role_id: input.role_id,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || null,
        resume_url: resumeUrl,
        resume_path: input.resume_path ?? null,
        resume_filename: input.resume_filename ?? null,
        resume_mime: input.resume_mime ?? null,
        resume_size:
          typeof input.resume_size === "number" ? input.resume_size : null,
        loom_url: loomUrl,
        cover_letter: input.cover_letter ?? "",
        source: "public_form",
        stage: "applied",
      })
      .select("id")
      .single();
    if (candErr || !candidateRow) {
      return {
        ok: false,
        error: candErr?.message ?? "Failed to submit application",
      };
    }

    // Insert answers (best-effort but explicit). Skip empties; only rows for
    // questions that still exist & are active.
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
            t === "single_choice" || t === "yes_no" ? a.value_choice ?? null : null,
          value_choices:
            t === "multi_choice" && Array.isArray(a.value_choices) ? a.value_choices : null,
          value_number:
            t === "rating" && typeof a.value_number === "number" ? a.value_number : null,
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
        // Don't fail the whole submission — candidate exists, but surface a
        // soft warning so HR knows the answers got dropped. Server actions
        // can't return both ok:true and a warning shape cleanly, so just log
        // and return ok: true.
        console.error("Failed to insert candidate answers", ansErr);
      }
    }

    revalidatePath("/careers");
    revalidatePath(`/careers/${input.role_slug}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your application. Please try again.",
    };
  }
}
