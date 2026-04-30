/**
 * HR Survey analytics — pure functions usable on both server and client.
 *
 * Compute summary metrics, per-question rollups, and lightweight text themes
 * (frequent meaningful words/phrases) without any external AI dependency.
 */

import type {
  DbHrSurveyAnswer,
  DbHrSurveyQuestion,
  QuestionType,
  SurveyResponseWithAnswers,
} from "./surveys-types";

export type SurveySummaryMetrics = {
  total_responses: number;
  active_responses: number;
  deleted_responses: number;
  anonymous_responses: number;
  identified_responses: number;
  last_response_at: string | null;
  first_response_at: string | null;
  // % of active responses that answered at least one question
  completion_rate: number | null;
  // % of active responses that answered every required question
  full_completion_rate: number | null;
};

export type PerQuestionStats =
  | {
      type: "rating";
      question: DbHrSurveyQuestion;
      answer_count: number;
      average: number | null;
      distribution: { value: number; count: number; pct: number }[];
      min: number;
      max: number;
    }
  | {
      type: "yes_no";
      question: DbHrSurveyQuestion;
      answer_count: number;
      yes: number;
      no: number;
      yes_pct: number;
      no_pct: number;
    }
  | {
      type: "choice";
      question: DbHrSurveyQuestion;
      answer_count: number;
      counts: { value: string; count: number; pct: number }[];
    }
  | {
      type: "text";
      question: DbHrSurveyQuestion;
      answer_count: number;
      themes: { phrase: string; count: number }[];
      sample: { text: string; submitted_at: string }[];
    };

const STOPWORDS = new Set(
  [
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "his",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "me",
    "my",
    "no",
    "not",
    "of",
    "on",
    "or",
    "our",
    "she",
    "so",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "will",
    "with",
    "would",
    "you",
    "your",
    "yours",
    "ours",
    "us",
    "him",
    "do",
    "does",
    "did",
    "done",
    "im",
    "ive",
    "dont",
    "didnt",
    "cant",
    "couldnt",
    "wouldnt",
    "shouldnt",
    "isnt",
    "wasnt",
    "werent",
    "be",
    "been",
    "being",
    "all",
    "any",
    "some",
    "more",
    "most",
    "much",
    "many",
    "few",
    "lot",
    "lots",
    "thing",
    "things",
    "stuff",
    "really",
    "kind",
    "sort",
    "feel",
    "felt",
    "think",
    "thought",
    "get",
    "got",
    "going",
    "goes",
    "go",
    "way",
    "made",
    "make",
    "makes",
  ],
);

function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * Extract "themes": frequent unigrams + meaningful bigrams across answers.
 * Returns up to `limit` items, each with the phrase and how many answers it
 * appeared in (not how many total occurrences — co-occurrence-style score).
 */
export function extractThemes(
  answers: { value_text: string | null }[],
  limit = 8,
): { phrase: string; count: number }[] {
  const docCounts = new Map<string, number>();
  for (const a of answers) {
    if (!a.value_text) continue;
    const tokens = normalise(a.value_text);
    if (tokens.length === 0) continue;
    const seen = new Set<string>();
    // unigrams
    for (const t of tokens) seen.add(t);
    // bigrams (skip stopwords inside tokens already)
    for (let i = 0; i < tokens.length - 1; i++) {
      const bi = `${tokens[i]} ${tokens[i + 1]}`;
      seen.add(bi);
    }
    for (const phrase of seen) {
      docCounts.set(phrase, (docCounts.get(phrase) ?? 0) + 1);
    }
  }
  // Prefer multi-word phrases when tied to surface real themes.
  const items = Array.from(docCounts.entries()).map(([phrase, count]) => ({
    phrase,
    count,
  }));
  // Drop singletons unless we have nothing better.
  const useful = items.filter((i) => i.count >= 2);
  const ranked = (useful.length > 0 ? useful : items)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const aMulti = a.phrase.includes(" ") ? 1 : 0;
      const bMulti = b.phrase.includes(" ") ? 1 : 0;
      if (bMulti !== aMulti) return bMulti - aMulti;
      return a.phrase.localeCompare(b.phrase);
    })
    .slice(0, limit);
  return ranked;
}

export function computeSummary(
  responses: SurveyResponseWithAnswers[],
  options?: { deletedCount?: number; requiredQuestionIds?: string[] },
): SurveySummaryMetrics {
  const active = responses;
  const deleted = options?.deletedCount ?? 0;
  let anon = 0;
  let identified = 0;
  let completed = 0;
  let fullyCompleted = 0;
  let first: string | null = null;
  let last: string | null = null;
  const required = new Set(options?.requiredQuestionIds ?? []);
  for (const r of active) {
    if (r.is_anonymous) anon += 1;
    else identified += 1;
    if (!first || r.submitted_at < first) first = r.submitted_at;
    if (!last || r.submitted_at > last) last = r.submitted_at;
    if (r.answers.length > 0) completed += 1;
    if (required.size > 0) {
      const answered = new Set(r.answers.map((a) => a.question_id));
      let allReq = true;
      for (const q of required) if (!answered.has(q)) { allReq = false; break; }
      if (allReq) fullyCompleted += 1;
    }
  }
  return {
    total_responses: active.length + deleted,
    active_responses: active.length,
    deleted_responses: deleted,
    anonymous_responses: anon,
    identified_responses: identified,
    first_response_at: first,
    last_response_at: last,
    completion_rate:
      active.length === 0 ? null : Math.round((completed / active.length) * 100),
    full_completion_rate:
      active.length === 0 || required.size === 0
        ? null
        : Math.round((fullyCompleted / active.length) * 100),
  };
}

export function computePerQuestionStats(
  questions: DbHrSurveyQuestion[],
  responses: SurveyResponseWithAnswers[],
): PerQuestionStats[] {
  const byQ = new Map<string, DbHrSurveyAnswer[]>();
  const byQRespMeta = new Map<string, Map<string, string>>();
  for (const r of responses) {
    for (const a of r.answers) {
      const list = byQ.get(a.question_id) ?? [];
      list.push(a);
      byQ.set(a.question_id, list);
      const meta = byQRespMeta.get(a.question_id) ?? new Map<string, string>();
      meta.set(a.id, r.submitted_at);
      byQRespMeta.set(a.question_id, meta);
    }
  }

  return questions.map((q) => {
    const t = q.question_type as QuestionType;
    const answers = byQ.get(q.id) ?? [];

    if (t === "rating") {
      const min = q.config.scale_min ?? 1;
      const max = q.config.scale_max ?? 5;
      const nums = answers
        .map((a) => a.value_number)
        .filter((n): n is number => typeof n === "number");
      const avg =
        nums.length === 0
          ? null
          : nums.reduce((s, n) => s + n, 0) / nums.length;
      const dist: { value: number; count: number; pct: number }[] = [];
      for (let v = min; v <= max; v++) {
        const count = nums.filter((n) => Math.round(n) === v).length;
        const pct = nums.length === 0 ? 0 : Math.round((count / nums.length) * 100);
        dist.push({ value: v, count, pct });
      }
      return {
        type: "rating",
        question: q,
        answer_count: nums.length,
        average: avg,
        distribution: dist,
        min,
        max,
      };
    }

    if (t === "yes_no") {
      let yes = 0;
      let no = 0;
      for (const a of answers) {
        if (a.value_choice === "yes") yes += 1;
        else if (a.value_choice === "no") no += 1;
      }
      const total = yes + no;
      return {
        type: "yes_no",
        question: q,
        answer_count: total,
        yes,
        no,
        yes_pct: total === 0 ? 0 : Math.round((yes / total) * 100),
        no_pct: total === 0 ? 0 : Math.round((no / total) * 100),
      };
    }

    if (t === "single_choice" || t === "multi_choice") {
      const counts = new Map<string, number>();
      let total = 0;
      for (const a of answers) {
        const vals =
          t === "multi_choice"
            ? a.value_choices ?? []
            : a.value_choice
              ? [a.value_choice]
              : [];
        for (const v of vals) {
          counts.set(v, (counts.get(v) ?? 0) + 1);
          total += 1;
        }
      }
      // Ensure declared options always show up, even with 0 count.
      const declared = q.config.options ?? [];
      for (const opt of declared) if (!counts.has(opt)) counts.set(opt, 0);
      const rows = Array.from(counts.entries())
        .map(([value, count]) => ({
          value,
          count,
          pct: total === 0 ? 0 : Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
      return {
        type: "choice",
        question: q,
        answer_count: total,
        counts: rows,
      };
    }

    // text (short_text / long_text)
    const textAnswers = answers
      .map((a) => ({
        text: a.value_text ?? "",
        submitted_at: byQRespMeta.get(q.id)?.get(a.id) ?? "",
      }))
      .filter((a) => a.text.trim().length > 0);
    const themes = extractThemes(
      textAnswers.map((t) => ({ value_text: t.text })),
      8,
    );
    const sample = textAnswers
      .slice()
      .sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1))
      .slice(0, 6);
    return {
      type: "text",
      question: q,
      answer_count: textAnswers.length,
      themes,
      sample,
    };
  });
}
