"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireHrAccess } from "@/lib/auth/permissions";
import type {
  DbHrSurvey,
  DbHrSurveyAnswer,
  DbHrSurveyQuestion,
  DbHrSurveyResponse,
  PublicAnswerInput,
  QuestionConfig,
  QuestionType,
  SurveyListItem,
  SurveyResponseWithAnswers,
  SurveyStatus,
} from "./surveys-types";
import { QUESTION_TYPES, SURVEY_STATUSES } from "./surveys-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentEmail(): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = await db();
  let slug = base || "survey";
  let i = 1;
  while (i < 50) {
    let q = supabase.from("hr_surveys").select("id").eq("slug", slug);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function revalidateSurveys(id?: string) {
  revalidatePath("/hr/surveys");
  if (id) revalidatePath(`/hr/surveys/${id}`);
}

function isQuestionType(v: unknown): v is QuestionType {
  return typeof v === "string" && (QUESTION_TYPES as readonly string[]).includes(v);
}

function isStatus(v: unknown): v is SurveyStatus {
  return typeof v === "string" && (SURVEY_STATUSES as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Surveys (admin-side)
// ---------------------------------------------------------------------------

export async function listSurveys(): Promise<SurveyListItem[]> {
  await requireHrAccess();
  const supabase = await db();
  const { data: surveys } = await supabase
    .from("hr_surveys")
    .select("*")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });
  const list = (surveys ?? []) as DbHrSurvey[];
  if (list.length === 0) return [];

  const ids = list.map((s) => s.id);
  const [{ data: responses }, { data: questions }] = await Promise.all([
    supabase
      .from("hr_survey_responses")
      .select("survey_id, submitted_at")
      .in("survey_id", ids),
    supabase.from("hr_survey_questions").select("survey_id").in("survey_id", ids),
  ]);

  const respBySurvey = new Map<string, { count: number; last: string | null }>();
  for (const r of (responses ?? []) as { survey_id: string; submitted_at: string }[]) {
    const cur = respBySurvey.get(r.survey_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || r.submitted_at > cur.last) cur.last = r.submitted_at;
    respBySurvey.set(r.survey_id, cur);
  }
  const qBySurvey = new Map<string, number>();
  for (const q of (questions ?? []) as { survey_id: string }[]) {
    qBySurvey.set(q.survey_id, (qBySurvey.get(q.survey_id) ?? 0) + 1);
  }

  return list.map((s) => ({
    ...s,
    response_count: respBySurvey.get(s.id)?.count ?? 0,
    last_response_at: respBySurvey.get(s.id)?.last ?? null,
    question_count: qBySurvey.get(s.id) ?? 0,
  }));
}

export async function getSurvey(id: string): Promise<DbHrSurvey | null> {
  await requireHrAccess();
  const supabase = await db();
  const { data } = await supabase
    .from("hr_surveys")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as DbHrSurvey | null;
}

export async function getSurveyQuestions(
  surveyId: string,
  options?: { includeArchived?: boolean },
): Promise<DbHrSurveyQuestion[]> {
  await requireHrAccess();
  const supabase = await db();
  let query = supabase
    .from("hr_survey_questions")
    .select("*")
    .eq("survey_id", surveyId)
    .order("position", { ascending: true });
  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }
  const { data } = await query;
  return ((data ?? []) as DbHrSurveyQuestion[]).map(normaliseQuestion);
}

function normaliseQuestion(q: DbHrSurveyQuestion): DbHrSurveyQuestion {
  return {
    ...q,
    config: (q.config ?? {}) as QuestionConfig,
    archived_at: q.archived_at ?? null,
  };
}

async function questionAnswerCount(questionId: string): Promise<number> {
  const supabase = await db();
  const { count } = await supabase
    .from("hr_survey_answers")
    .select("id", { head: true, count: "exact" })
    .eq("question_id", questionId);
  return count ?? 0;
}

export type CreateSurveyInput = {
  title: string;
  description?: string;
  instructions?: string;
  status?: SurveyStatus;
  audience?: string;
  anonymous_allowed?: boolean;
  collect_name?: boolean;
  collect_email?: boolean;
  collect_department?: boolean;
  closes_at?: string | null;
  questions?: Array<{
    question_type: QuestionType;
    prompt: string;
    help_text?: string;
    required?: boolean;
    config?: QuestionConfig;
  }>;
};

export async function createSurvey(input: CreateSurveyInput): Promise<DbHrSurvey> {
  await requireHrAccess();
  const supabase = await db();
  const title = input.title?.trim();
  if (!title) throw new Error("Title is required");

  const slug = await ensureUniqueSlug(slugify(title));
  const status: SurveyStatus = isStatus(input.status) ? input.status : "draft";
  const email = await currentEmail();

  const { data, error } = await supabase
    .from("hr_surveys")
    .insert({
      slug,
      title,
      description: input.description ?? "",
      instructions: input.instructions ?? "",
      status,
      audience: input.audience ?? null,
      anonymous_allowed: input.anonymous_allowed ?? true,
      collect_name: input.collect_name ?? true,
      collect_email: input.collect_email ?? true,
      collect_department: input.collect_department ?? true,
      closes_at: input.closes_at ?? null,
      created_by: email,
    })
    .select()
    .single();
  if (error) throw error;

  const survey = data as DbHrSurvey;

  if (input.questions && input.questions.length > 0) {
    const rows = input.questions.map((q, i) => ({
      survey_id: survey.id,
      position: i,
      question_type: q.question_type,
      prompt: q.prompt,
      help_text: q.help_text ?? "",
      required: q.required ?? false,
      config: q.config ?? {},
    }));
    const { error: qErr } = await supabase.from("hr_survey_questions").insert(rows);
    if (qErr) throw qErr;
  }

  revalidateSurveys(survey.id);
  return survey;
}

export type UpdateSurveyInput = Partial<{
  title: string;
  description: string;
  instructions: string;
  status: SurveyStatus;
  audience: string | null;
  anonymous_allowed: boolean;
  collect_name: boolean;
  collect_email: boolean;
  collect_department: boolean;
  closes_at: string | null;
}>;

export async function updateSurvey(
  id: string,
  input: UpdateSurveyInput,
): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  const patch: Record<string, unknown> = { ...input };
  await supabase.from("hr_surveys").update(patch).eq("id", id);
  revalidateSurveys(id);
}

export async function setSurveyStatus(id: string, status: SurveyStatus): Promise<void> {
  if (!isStatus(status)) throw new Error("Invalid status");
  await updateSurvey(id, { status });
}

export async function deleteSurvey(id: string): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  await supabase.from("hr_surveys").delete().eq("id", id);
  revalidateSurveys();
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export type AddQuestionInput = {
  survey_id: string;
  question_type: QuestionType;
  prompt: string;
  help_text?: string;
  required?: boolean;
  config?: QuestionConfig;
  position?: number;
};

export async function addQuestion(input: AddQuestionInput): Promise<DbHrSurveyQuestion> {
  await requireHrAccess();
  if (!isQuestionType(input.question_type)) throw new Error("Invalid question_type");
  if (!input.prompt?.trim()) throw new Error("Prompt is required");
  const supabase = await db();

  let position = input.position;
  if (position === undefined) {
    const { data: maxRow } = await supabase
      .from("hr_survey_questions")
      .select("position")
      .eq("survey_id", input.survey_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = ((maxRow?.position as number | undefined) ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("hr_survey_questions")
    .insert({
      survey_id: input.survey_id,
      question_type: input.question_type,
      prompt: input.prompt.trim(),
      help_text: input.help_text ?? "",
      required: input.required ?? false,
      config: input.config ?? {},
      position,
    })
    .select()
    .single();
  if (error) throw error;
  revalidateSurveys(input.survey_id);
  return normaliseQuestion(data as DbHrSurveyQuestion);
}

export async function updateQuestion(
  id: string,
  input: Partial<{
    prompt: string;
    help_text: string;
    required: boolean;
    config: QuestionConfig;
    position: number;
    question_type: QuestionType;
  }>,
  surveyId: string,
): Promise<void> {
  await requireHrAccess();
  const supabase = await db();

  // If responses already exist for this question, refuse the kinds of edits
  // that would silently corrupt historical answers (changing the answer
  // shape). Prompt / help / required / position / option additions are still
  // safe and allowed.
  const isTypeChange = input.question_type !== undefined;
  const isConfigChange = input.config !== undefined;
  if (isTypeChange || isConfigChange) {
    const answers = await questionAnswerCount(id);
    if (answers > 0) {
      const { data: current } = await supabase
        .from("hr_survey_questions")
        .select("question_type, config")
        .eq("id", id)
        .maybeSingle();
      const cur = (current ?? {}) as {
        question_type?: string;
        config?: QuestionConfig;
      };
      if (
        isTypeChange &&
        input.question_type &&
        input.question_type !== cur.question_type
      ) {
        throw new Error(
          "This question already has responses. Changing its type would invalidate stored answers — archive it and add a replacement question instead.",
        );
      }
      if (isConfigChange && input.config) {
        const cleaned = pruneConfig(cur.question_type ?? "", input.config);
        const before = pruneConfig(cur.question_type ?? "", cur.config ?? {});
        if (configRemovesChoices(before, cleaned)) {
          throw new Error(
            "Cannot remove choices that already have responses. You can rename or add choices, or archive this question and add a new one.",
          );
        }
      }
    }
  }

  await supabase.from("hr_survey_questions").update(input).eq("id", id);
  revalidateSurveys(surveyId);
}

function pruneConfig(_type: string, cfg: QuestionConfig): QuestionConfig {
  return {
    ...cfg,
    options: cfg.options ? cfg.options.map((o) => o.trim()).filter(Boolean) : undefined,
  };
}

function configRemovesChoices(
  before: QuestionConfig,
  after: QuestionConfig,
): boolean {
  const beforeOpts = before.options ?? [];
  const afterOpts = new Set(after.options ?? []);
  for (const o of beforeOpts) if (!afterOpts.has(o)) return true;
  return false;
}

export async function deleteQuestion(id: string, surveyId: string): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  // If this question has any answers, soft-archive instead of hard-deleting,
  // so historical responses keep their question context.
  const answers = await questionAnswerCount(id);
  if (answers > 0) {
    await supabase
      .from("hr_survey_questions")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
  } else {
    await supabase.from("hr_survey_questions").delete().eq("id", id);
  }
  revalidateSurveys(surveyId);
}

export async function archiveQuestion(
  id: string,
  surveyId: string,
): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  await supabase
    .from("hr_survey_questions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  revalidateSurveys(surveyId);
}

export async function unarchiveQuestion(
  id: string,
  surveyId: string,
): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  await supabase
    .from("hr_survey_questions")
    .update({ archived_at: null })
    .eq("id", id);
  revalidateSurveys(surveyId);
}

export async function reorderQuestions(
  surveyId: string,
  orderedIds: string[],
): Promise<void> {
  await requireHrAccess();
  const supabase = await db();
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from("hr_survey_questions")
        .update({ position: i })
        .eq("id", id)
        .eq("survey_id", surveyId),
    ),
  );
  revalidateSurveys(surveyId);
}

// ---------------------------------------------------------------------------
// Responses (read)
// ---------------------------------------------------------------------------

export async function listResponses(
  surveyId: string,
): Promise<SurveyResponseWithAnswers[]> {
  await requireHrAccess();
  const supabase = await db();
  const { data: responses } = await supabase
    .from("hr_survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false });
  const list = (responses ?? []) as DbHrSurveyResponse[];
  if (list.length === 0) return [];
  const ids = list.map((r) => r.id);
  const { data: answers } = await supabase
    .from("hr_survey_answers")
    .select("*")
    .in("response_id", ids);
  const byResp = new Map<string, DbHrSurveyAnswer[]>();
  for (const a of (answers ?? []) as DbHrSurveyAnswer[]) {
    const cur = byResp.get(a.response_id) ?? [];
    cur.push(a);
    byResp.set(a.response_id, cur);
  }
  return list.map((r) => ({ ...r, answers: byResp.get(r.id) ?? [] }));
}

export async function getResponse(
  responseId: string,
): Promise<SurveyResponseWithAnswers | null> {
  await requireHrAccess();
  const supabase = await db();
  const { data: r } = await supabase
    .from("hr_survey_responses")
    .select("*")
    .eq("id", responseId)
    .maybeSingle();
  if (!r) return null;
  const { data: answers } = await supabase
    .from("hr_survey_answers")
    .select("*")
    .eq("response_id", responseId);
  return {
    ...(r as DbHrSurveyResponse),
    answers: (answers ?? []) as DbHrSurveyAnswer[],
  };
}

export async function getSurveySummary(surveyId: string): Promise<{
  survey: DbHrSurvey;
  questions: DbHrSurveyQuestion[];
  response_count: number;
  last_response_at: string | null;
  per_question: Array<{
    question: DbHrSurveyQuestion;
    answer_count: number;
    average?: number | null;
    yes?: number;
    no?: number;
    counts?: { value: string; count: number }[];
    sample?: string[];
  }>;
}> {
  await requireHrAccess();
  const supabase = await db();
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error("Survey not found");
  const questions = await getSurveyQuestions(surveyId, { includeArchived: true });
  const responses = await listResponses(surveyId);

  const all_answers: DbHrSurveyAnswer[] = responses.flatMap((r) => r.answers);
  const byQ = new Map<string, DbHrSurveyAnswer[]>();
  for (const a of all_answers) {
    const cur = byQ.get(a.question_id) ?? [];
    cur.push(a);
    byQ.set(a.question_id, cur);
  }

  const per_question = questions.map((q) => {
    const answers = byQ.get(q.id) ?? [];
    const base = { question: q, answer_count: answers.length };
    if (q.question_type === "rating") {
      const nums = answers
        .map((a) => a.value_number)
        .filter((n): n is number => typeof n === "number");
      const avg = nums.length === 0 ? null : nums.reduce((s, n) => s + n, 0) / nums.length;
      return { ...base, average: avg };
    }
    if (q.question_type === "yes_no") {
      let yes = 0;
      let no = 0;
      for (const a of answers) {
        if (a.value_choice === "yes") yes += 1;
        else if (a.value_choice === "no") no += 1;
      }
      return { ...base, yes, no };
    }
    if (q.question_type === "single_choice" || q.question_type === "multi_choice") {
      const counts = new Map<string, number>();
      for (const a of answers) {
        const vals =
          q.question_type === "multi_choice"
            ? a.value_choices ?? []
            : a.value_choice
              ? [a.value_choice]
              : [];
        for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      return {
        ...base,
        counts: Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
      };
    }
    // text
    const sample = answers
      .map((a) => a.value_text)
      .filter((t): t is string => !!t && t.trim().length > 0)
      .slice(0, 5);
    return { ...base, sample };
  });

  const last_response_at =
    responses.length > 0 ? responses[0].submitted_at : null;

  return {
    survey,
    questions,
    response_count: responses.length,
    last_response_at,
    per_question,
  };
}

// ---------------------------------------------------------------------------
// Public landing — used by /survey/[slug]
// ---------------------------------------------------------------------------

export type PublicSurveyView = {
  survey: DbHrSurvey;
  questions: DbHrSurveyQuestion[];
};

export async function getPublicSurveyBySlug(
  slug: string,
): Promise<PublicSurveyView | null> {
  // Public Server Component fetch — never throw, so the page always renders
  // an "Unavailable" state instead of the production digest error.
  try {
    if (!slug || typeof slug !== "string") return null;
    const supabase = await createClient();
    if (!supabase) return null;
    const { data: survey } = await supabase
      .from("hr_surveys")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!survey) return null;
    const s = survey as DbHrSurvey;
    if (s.status !== "active") return { survey: s, questions: [] };
    const { data: qs } = await supabase
      .from("hr_survey_questions")
      .select("*")
      .eq("survey_id", s.id)
      .is("archived_at", null)
      .order("position", { ascending: true });
    const questions = ((qs ?? []) as DbHrSurveyQuestion[]).map(normaliseQuestion);
    return { survey: s, questions };
  } catch {
    return null;
  }
}

export type SubmitSurveyResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitSurveyResponse(input: {
  survey_id: string;
  slug: string;
  respondent_name?: string;
  respondent_email?: string;
  respondent_department?: string;
  is_anonymous?: boolean;
  user_agent?: string;
  answers: PublicAnswerInput[];
}): Promise<SubmitSurveyResult> {
  // This is the public, anonymous submission path. It must NEVER throw
  // back to the client — a throw turns into an opaque "Server Components
  // render" error in production builds. Return a tagged result instead so
  // the form can show a friendly inline message.
  try {
    if (!input?.survey_id || typeof input.survey_id !== "string") {
      return { ok: false, error: "Missing survey id." };
    }
    if (!Array.isArray(input.answers)) {
      return { ok: false, error: "Invalid answers payload." };
    }

    const supabase = await createClient();
    if (!supabase) {
      return {
        ok: false,
        error: "Survey service is temporarily unavailable. Please try again.",
      };
    }

    // Defence in depth — re-verify the survey is active.
    const { data: survey, error: surveyErr } = await supabase
      .from("hr_surveys")
      .select("id, status, anonymous_allowed")
      .eq("id", input.survey_id)
      .maybeSingle();
    if (surveyErr) {
      return { ok: false, error: "Could not verify the survey. Please try again." };
    }
    if (!survey || (survey as { status: string }).status !== "active") {
      return {
        ok: false,
        error: "This survey is no longer accepting responses.",
      };
    }

    const allowAnon = (survey as { anonymous_allowed: boolean }).anonymous_allowed;
    const isAnon = !!input.is_anonymous;
    if (isAnon && !allowAnon) {
      return {
        ok: false,
        error: "Anonymous responses are not allowed for this survey.",
      };
    }

    const { data: resp, error } = await supabase
      .from("hr_survey_responses")
      .insert({
        survey_id: input.survey_id,
        respondent_name: isAnon ? null : input.respondent_name?.trim() || null,
        respondent_email: isAnon ? null : input.respondent_email?.trim() || null,
        respondent_department: isAnon
          ? null
          : input.respondent_department?.trim() || null,
        is_anonymous: isAnon,
        user_agent: input.user_agent ?? null,
      })
      .select("id")
      .single();
    if (error || !resp) {
      return {
        ok: false,
        error: "We couldn't save your response. Please try again.",
      };
    }

    if (input.answers.length > 0) {
      const rows = input.answers
        .filter((a) => a && typeof a.question_id === "string" && a.question_id)
        .map((a) => ({
          response_id: (resp as { id: string }).id,
          question_id: a.question_id,
          value_text:
            typeof a.value_text === "string" ? a.value_text : null,
          value_choice:
            typeof a.value_choice === "string" ? a.value_choice : null,
          value_choices: Array.isArray(a.value_choices)
            ? a.value_choices.filter((v) => typeof v === "string")
            : null,
          value_number:
            typeof a.value_number === "number" && Number.isFinite(a.value_number)
              ? a.value_number
              : null,
        }));
      if (rows.length > 0) {
        const { error: aErr } = await supabase
          .from("hr_survey_answers")
          .insert(rows);
        if (aErr) {
          return {
            ok: false,
            error: "We couldn't save your answers. Please try again.",
          };
        }
      }
    }

    // Best-effort revalidation — never let a revalidate failure break the
    // submission acknowledgement to the user.
    try {
      revalidatePath(`/hr/surveys/${input.survey_id}`);
      revalidatePath(`/survey/${input.slug}`);
    } catch {
      // ignore
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Something went wrong submitting your response. Please try again.",
    };
  }
}
