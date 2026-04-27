"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Link2,
  Trash2,
  PlayCircle,
  PauseCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  setSurveyStatus,
  deleteSurvey,
} from "@/lib/hr/surveys";
import {
  QUESTION_TYPE_LABELS,
  SURVEY_STATUS_LABELS,
  type DbHrSurvey,
  type DbHrSurveyAnswer,
  type DbHrSurveyQuestion,
  type QuestionType,
  type SurveyResponseWithAnswers,
  type SurveyStatus,
} from "@/lib/hr/surveys-types";

const STATUS_TONE: Record<SurveyStatus, "neutral" | "success" | "warn"> = {
  draft: "neutral",
  active: "success",
  closed: "warn",
};

type Props = {
  survey: DbHrSurvey;
  questions: DbHrSurveyQuestion[];
  responses: SurveyResponseWithAnswers[];
};

export function SurveyDetail({ survey, questions, responses }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const status = (survey.status as SurveyStatus) ?? "draft";
  const tone = STATUS_TONE[status] ?? "neutral";

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/survey/${survey.slug}`
      : `/survey/${survey.slug}`;

  const setStatus = (next: SurveyStatus) => {
    startTransition(async () => {
      try {
        await setSurveyStatus(survey.id, next);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Delete survey "${survey.title}"? This removes all responses and cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteSurvey(survey.id);
        router.push("/hr/surveys");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const answersByQ = useMemo(() => {
    const map = new Map<string, DbHrSurveyAnswer[]>();
    for (const r of responses)
      for (const a of r.answers) {
        const cur = map.get(a.question_id) ?? [];
        cur.push(a);
        map.set(a.question_id, cur);
      }
    return map;
  }, [responses]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="haven-card flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[20px] font-bold">{survey.title}</h2>
            <Badge tone={tone}>
              {SURVEY_STATUS_LABELS[status] ?? survey.status}
            </Badge>
            <span className="text-[12px] text-muted-foreground">
              {responses.length} response{responses.length === 1 ? "" : "s"}
            </span>
          </div>
          {survey.description ? (
            <p className="mt-1 text-[13px] text-muted-foreground">
              {survey.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:brightness-90"
            >
              <ExternalLink className="h-3 w-3" />
              {status === "active" ? "Public landing page" : "Preview link (not yet active)"}
            </a>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Link2 className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {status !== "active" && (
            <Button variant="primary" size="sm" onClick={() => setStatus("active")} disabled={pending}>
              <PlayCircle className="h-3.5 w-3.5" />
              Activate
            </Button>
          )}
          {status === "active" && (
            <Button variant="outline" size="sm" onClick={() => setStatus("closed")} disabled={pending}>
              <PauseCircle className="h-3.5 w-3.5" />
              Close
            </Button>
          )}
          {status === "closed" && (
            <Button variant="outline" size="sm" onClick={() => setStatus("draft")} disabled={pending}>
              Reopen as draft
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      </div>

      {/* Questions list (read-only summary view) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold">
            Questions ({questions.length})
          </h3>
        </div>
        {questions.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/30 p-6 text-center text-[13px] text-muted-foreground">
            No questions yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <QuestionSummary
                key={q.id}
                index={i}
                question={q}
                answers={answersByQ.get(q.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      {/* Responses */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-[15px] font-bold">
          Responses ({responses.length})
        </h3>
        {responses.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/30 p-6 text-center text-[13px] text-muted-foreground">
            No responses yet. Share the link above to start collecting feedback.
          </div>
        ) : (
          <ResponsesTable responses={responses} questions={questions} />
        )}
      </section>
    </div>
  );
}

function QuestionSummary({
  index,
  question,
  answers,
}: {
  index: number;
  question: DbHrSurveyQuestion;
  answers: DbHrSurveyAnswer[];
}) {
  const t = question.question_type as QuestionType;

  let body: React.ReactNode = null;

  if (t === "rating") {
    const nums = answers
      .map((a) => a.value_number)
      .filter((n): n is number => typeof n === "number");
    const avg =
      nums.length === 0 ? null : nums.reduce((s, n) => s + n, 0) / nums.length;
    const min = question.config.scale_min ?? 1;
    const max = question.config.scale_max ?? 5;
    body = (
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
        <span>
          Avg{" "}
          <span className="font-semibold text-foreground">
            {avg === null ? "—" : avg.toFixed(2)}
          </span>{" "}
          / {max}
        </span>
        <span>
          n = <span className="font-semibold text-foreground">{nums.length}</span>
        </span>
        <span>
          scale {min}–{max}
        </span>
      </div>
    );
  } else if (t === "yes_no") {
    let yes = 0;
    let no = 0;
    for (const a of answers) {
      if (a.value_choice === "yes") yes += 1;
      else if (a.value_choice === "no") no += 1;
    }
    body = (
      <div className="flex gap-4 text-[12px]">
        <span>
          Yes <span className="font-semibold text-foreground">{yes}</span>
        </span>
        <span>
          No <span className="font-semibold text-foreground">{no}</span>
        </span>
      </div>
    );
  } else if (t === "single_choice" || t === "multi_choice") {
    const counts = new Map<string, number>();
    for (const a of answers) {
      const vals =
        t === "multi_choice"
          ? a.value_choices ?? []
          : a.value_choice
            ? [a.value_choice]
            : [];
      for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, [, n]) => s + n, 0);
    body =
      rows.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">No answers yet.</div>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map(([value, count]) => {
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div key={value} className="flex items-center gap-2 text-[12px]">
                <div className="w-32 truncate">{value || "—"}</div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-16 text-right font-semibold text-foreground">
                  {count} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      );
  } else {
    // text
    const samples = answers
      .map((a) => a.value_text)
      .filter((s): s is string => !!s && s.trim().length > 0)
      .slice(0, 3);
    body =
      samples.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">No answers yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {samples.map((s, i) => (
            <div
              key={i}
              className="rounded-md bg-surface-alt/40 p-2 text-[12px] text-foreground/80"
            >
              “{s}”
            </div>
          ))}
          {answers.length > samples.length && (
            <div className="text-[11px] text-muted-foreground">
              +{answers.length - samples.length} more in responses below.
            </div>
          )}
        </div>
      );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Q{index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[14px] font-bold">
            {question.prompt}
            {question.required && <span className="text-rose-500"> *</span>}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {QUESTION_TYPE_LABELS[t] ?? t}
            {question.help_text ? ` · ${question.help_text}` : ""}
          </div>
        </div>
      </div>
      <div className="mt-2">{body}</div>
    </div>
  );
}

function ResponsesTable({
  responses,
  questions,
}: {
  responses: SurveyResponseWithAnswers[];
  questions: DbHrSurveyQuestion[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const qById = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="haven-card overflow-hidden">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-border bg-surface-alt/40 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2"></th>
            <th className="px-3 py-2">Submitted</th>
            <th className="px-3 py-2">Respondent</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Department</th>
            <th className="px-3 py-2 text-right">Answers</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => {
            const open = openId === r.id;
            return (
              <Fragment key={r.id}>
                <tr
                  className="cursor-pointer border-b border-border/50 hover:bg-surface-alt/40"
                  onClick={() => setOpenId(open ? null : r.id)}
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {format(new Date(r.submitted_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-3 py-2">
                    {r.is_anonymous ? (
                      <span className="text-muted-foreground">Anonymous</span>
                    ) : (
                      r.respondent_name ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.is_anonymous ? "—" : r.respondent_email ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.is_anonymous ? "—" : r.respondent_department ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {r.answers.length}
                  </td>
                </tr>
                {open && (
                  <tr className="border-b border-border/50 bg-surface-alt/20">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {questions.map((q, i) => {
                          const ans = r.answers.find((a) => a.question_id === q.id);
                          return (
                            <div key={q.id} className="flex flex-col">
                              <div className="text-[11px] font-medium text-muted-foreground">
                                Q{i + 1}. {q.prompt}
                              </div>
                              <div className="text-[13px]">
                                {renderAnswer(qById.get(q.id) ?? q, ans)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function renderAnswer(
  q: DbHrSurveyQuestion,
  a: DbHrSurveyAnswer | undefined,
): string {
  if (!a) return "—";
  const t = q.question_type as QuestionType;
  if (t === "rating") return a.value_number == null ? "—" : String(a.value_number);
  if (t === "yes_no") return a.value_choice ? a.value_choice : "—";
  if (t === "single_choice") return a.value_choice ?? "—";
  if (t === "multi_choice") return (a.value_choices ?? []).join(", ") || "—";
  return a.value_text ?? "—";
}

// silence unused imports for icons we may add later
void format;
void ArrowDown;
void ArrowUp;
