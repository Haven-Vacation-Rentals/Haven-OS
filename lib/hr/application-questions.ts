"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrModule } from "@/lib/auth/permissions";
import {
  APPLICATION_QUESTION_TYPES,
  type ApplicationQuestionConfig,
  type ApplicationQuestionType,
  type DbCandidateAnswer,
  type DbRoleQuestion,
} from "./types";

/**
 * Per-role application questions + candidate answers.
 *
 * Mirrors the survey questions/answers design from lib/hr/surveys.ts but is
 * scoped to hiring roles. Public submission of answers happens via
 * lib/hr/public.ts (submitApplication); these helpers cover the HR admin
 * authoring side.
 */

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function isQuestionType(v: unknown): v is ApplicationQuestionType {
  return (
    typeof v === "string" &&
    (APPLICATION_QUESTION_TYPES as readonly string[]).includes(v)
  );
}

function normaliseQuestion(q: DbRoleQuestion): DbRoleQuestion {
  return {
    ...q,
    config: (q.config ?? {}) as ApplicationQuestionConfig,
    archived_at: q.archived_at ?? null,
  };
}

function pruneConfig(cfg: ApplicationQuestionConfig): ApplicationQuestionConfig {
  return {
    ...cfg,
    options: cfg.options ? cfg.options.map((o) => o.trim()).filter(Boolean) : undefined,
  };
}

function configRemovesChoices(
  before: ApplicationQuestionConfig,
  after: ApplicationQuestionConfig,
): boolean {
  const beforeOpts = before.options ?? [];
  const afterOpts = new Set(after.options ?? []);
  for (const o of beforeOpts) if (!afterOpts.has(o)) return true;
  return false;
}

async function questionAnswerCount(questionId: string): Promise<number> {
  const supabase = await db();
  const { count } = await supabase
    .from("hr_candidate_answers")
    .select("id", { head: true, count: "exact" })
    .eq("question_id", questionId);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * List questions for a role. Used both server-side from the public apply
 * page (where we want only active questions) and from the HR admin UI
 * (where we usually want archived too).
 */
export async function listRoleQuestions(
  roleId: string,
  options?: { includeArchived?: boolean },
): Promise<DbRoleQuestion[]> {
  const supabase = await db();
  let query = supabase
    .from("hr_role_questions")
    .select("*")
    .eq("role_id", roleId)
    .order("position", { ascending: true });
  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }
  const { data } = await query;
  return ((data ?? []) as DbRoleQuestion[]).map(normaliseQuestion);
}

/**
 * Public-safe variant: only active questions for an OPEN role. Anonymous
 * RLS already enforces this, but we go through the same query path here so
 * the public landing page (server component) gets typed data without
 * requiring HR access.
 */
export async function listPublicRoleQuestions(
  roleId: string,
): Promise<DbRoleQuestion[]> {
  return listRoleQuestions(roleId, { includeArchived: false });
}

export async function listCandidateAnswers(
  candidateId: string,
): Promise<DbCandidateAnswer[]> {
  await requireHrModule("hiring");
  const supabase = await db();
  const { data } = await supabase
    .from("hr_candidate_answers")
    .select("*")
    .eq("candidate_id", candidateId);
  return (data ?? []) as DbCandidateAnswer[];
}

// ---------------------------------------------------------------------------
// Mutations (HR admin)
// ---------------------------------------------------------------------------

export type AddRoleQuestionInput = {
  role_id: string;
  question_type: ApplicationQuestionType;
  prompt: string;
  help_text?: string;
  required?: boolean;
  config?: ApplicationQuestionConfig;
  position?: number;
};

export async function addRoleQuestion(
  input: AddRoleQuestionInput,
): Promise<{ ok: true; data: DbRoleQuestion } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    if (!isQuestionType(input.question_type)) {
      return { ok: false, error: "Invalid question_type" };
    }
    if (!input.prompt?.trim()) {
      return { ok: false, error: "Prompt is required" };
    }
    const supabase = await db();

    let position = input.position;
    if (position === undefined) {
      const { data: maxRow } = await supabase
        .from("hr_role_questions")
        .select("position")
        .eq("role_id", input.role_id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      position = ((maxRow?.position as number | undefined) ?? -1) + 1;
    }

    const { data, error } = await supabase
      .from("hr_role_questions")
      .insert({
        role_id: input.role_id,
        question_type: input.question_type,
        prompt: input.prompt.trim(),
        help_text: input.help_text ?? "",
        required: input.required ?? false,
        config: pruneConfig(input.config ?? {}),
        position,
      })
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/hr/hiring/${input.role_id}`);
    return { ok: true, data: normaliseQuestion(data as DbRoleQuestion) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to add question",
    };
  }
}

export type UpdateRoleQuestionInput = Partial<{
  prompt: string;
  help_text: string;
  required: boolean;
  config: ApplicationQuestionConfig;
  position: number;
  question_type: ApplicationQuestionType;
}>;

export async function updateRoleQuestion(
  id: string,
  input: UpdateRoleQuestionInput,
  roleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();

    // Safety: if answers already exist, refuse edits that would corrupt them.
    // Prompt/help/required/position/option-additions stay safe.
    const isTypeChange = input.question_type !== undefined;
    const isConfigChange = input.config !== undefined;
    if (isTypeChange || isConfigChange) {
      const answers = await questionAnswerCount(id);
      if (answers > 0) {
        const { data: current } = await supabase
          .from("hr_role_questions")
          .select("question_type, config")
          .eq("id", id)
          .maybeSingle();
        const cur = (current ?? {}) as {
          question_type?: string;
          config?: ApplicationQuestionConfig;
        };
        if (
          isTypeChange &&
          input.question_type &&
          input.question_type !== cur.question_type
        ) {
          return {
            ok: false,
            error:
              "This question already has answers. Changing its type would invalidate stored answers — archive it and add a replacement question instead.",
          };
        }
        if (isConfigChange && input.config) {
          const cleaned = pruneConfig(input.config);
          const before = pruneConfig(cur.config ?? {});
          if (configRemovesChoices(before, cleaned)) {
            return {
              ok: false,
              error:
                "Cannot remove choices that already have answers. You can rename or add choices, or archive this question and add a new one.",
            };
          }
        }
      }
    }

    const patch: Record<string, unknown> = { ...input };
    if (input.config) patch.config = pruneConfig(input.config);

    const { error } = await supabase
      .from("hr_role_questions")
      .update(patch)
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/hr/hiring/${roleId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update question",
    };
  }
}

export async function deleteRoleQuestion(
  id: string,
  roleId: string,
): Promise<{ ok: true; archived: boolean } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();
    const answers = await questionAnswerCount(id);
    if (answers > 0) {
      const { error } = await supabase
        .from("hr_role_questions")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      revalidatePath(`/hr/hiring/${roleId}`);
      return { ok: true, archived: true };
    }
    const { error } = await supabase.from("hr_role_questions").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/hr/hiring/${roleId}`);
    return { ok: true, archived: false };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete question",
    };
  }
}

export async function archiveRoleQuestion(
  id: string,
  roleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();
    const { error } = await supabase
      .from("hr_role_questions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/hr/hiring/${roleId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to archive",
    };
  }
}

export async function unarchiveRoleQuestion(
  id: string,
  roleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();
    const { error } = await supabase
      .from("hr_role_questions")
      .update({ archived_at: null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/hr/hiring/${roleId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to restore",
    };
  }
}

export async function reorderRoleQuestions(
  roleId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireHrModule("hiring");
    const supabase = await db();
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase
          .from("hr_role_questions")
          .update({ position: i })
          .eq("id", id)
          .eq("role_id", roleId),
      ),
    );
    revalidatePath(`/hr/hiring/${roleId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reorder",
    };
  }
}
