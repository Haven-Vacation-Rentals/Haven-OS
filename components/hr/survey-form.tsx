"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitSurveyResponse } from "@/lib/hr/surveys";
import {
  type DbHrSurvey,
  type DbHrSurveyQuestion,
  type PublicAnswerInput,
  type QuestionType,
} from "@/lib/hr/surveys-types";

type Props = {
  survey: DbHrSurvey;
  questions: DbHrSurveyQuestion[];
};

type AnswerState = {
  text?: string;
  choice?: string;
  choices?: string[];
  number?: number;
};

export function SurveyForm({ survey, questions }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleAnswer = (qid: string, patch: AnswerState) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAnonymous && survey.collect_email) {
      if (email && !email.includes("@")) {
        setError("Email looks invalid");
        return;
      }
    }

    // Validate required questions
    for (const q of questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      const t = q.question_type as QuestionType;
      const empty =
        !a ||
        (t === "short_text" && !a.text?.trim()) ||
        (t === "long_text" && !a.text?.trim()) ||
        (t === "single_choice" && !a.choice) ||
        (t === "multi_choice" && (!a.choices || a.choices.length === 0)) ||
        (t === "rating" && a.number === undefined) ||
        (t === "yes_no" && !a.choice);
      if (empty) {
        setError(`Please answer: "${q.prompt}"`);
        return;
      }
    }

    const payload: PublicAnswerInput[] = questions.map((q) => {
      const a = answers[q.id] ?? {};
      const t = q.question_type as QuestionType;
      return {
        question_id: q.id,
        value_text: t === "short_text" || t === "long_text" ? a.text ?? null : null,
        value_choice:
          t === "single_choice" || t === "yes_no" ? a.choice ?? null : null,
        value_choices: t === "multi_choice" ? a.choices ?? null : null,
        value_number: t === "rating" ? a.number ?? null : null,
      };
    });

    startTransition(async () => {
      try {
        await submitSurveyResponse({
          survey_id: survey.id,
          slug: survey.slug,
          respondent_name: isAnonymous ? undefined : name,
          respondent_email: isAnonymous ? undefined : email,
          respondent_department: isAnonymous ? undefined : department,
          is_anonymous: isAnonymous,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          answers: payload,
        });
        setSubmitted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        <div>
          <div className="font-heading text-[18px] font-bold">Thanks!</div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Your response has been recorded.
          </p>
        </div>
      </div>
    );
  }

  const showIdentity =
    !isAnonymous &&
    (survey.collect_name || survey.collect_email || survey.collect_department);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Identity section */}
      {(survey.anonymous_allowed || showIdentity) && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-[14px] font-bold">About you</h3>
            {survey.anonymous_allowed && (
              <label className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Submit anonymously
              </label>
            )}
          </div>
          {showIdentity && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {survey.collect_name && (
                <Field label="Name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>
              )}
              {survey.collect_email && (
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
              )}
              {survey.collect_department && (
                <Field label="Department">
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </Field>
              )}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionField
            key={q.id}
            index={i}
            question={q}
            answer={answers[q.id] ?? {}}
            onChange={(patch) => handleAnswer(q.id, patch)}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <Button
          type="submit"
          variant="cta"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? "Submitting…" : "Submit response"}
        </Button>
      </div>
    </form>
  );
}

function QuestionField({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: DbHrSurveyQuestion;
  answer: AnswerState;
  onChange: (patch: AnswerState) => void;
}) {
  const t = question.question_type as QuestionType;

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Q{index + 1}
        </span>
        <span className="font-heading text-[15px] font-bold">
          {question.prompt}
          {question.required && <span className="text-rose-500"> *</span>}
        </span>
        {question.help_text && (
          <span className="text-[12px] text-muted-foreground">
            {question.help_text}
          </span>
        )}
      </label>

      {t === "short_text" && (
        <Input
          value={answer.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      )}

      {t === "long_text" && (
        <textarea
          value={answer.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
        />
      )}

      {t === "single_choice" && (
        <div className="flex flex-col gap-1.5">
          {(question.config.options ?? []).map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2 text-[13px]">
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={answer.choice === opt}
                onChange={() => onChange({ choice: opt })}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {t === "multi_choice" && (
        <div className="flex flex-col gap-1.5">
          {(question.config.options ?? []).map((opt) => {
            const selected = (answer.choices ?? []).includes(opt);
            return (
              <label key={opt} className="inline-flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const cur = answer.choices ?? [];
                    onChange({
                      choices: e.target.checked
                        ? [...cur, opt]
                        : cur.filter((v) => v !== opt),
                    });
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {t === "rating" && (
        <RatingPicker
          min={question.config.scale_min ?? 1}
          max={question.config.scale_max ?? 5}
          lowLabel={question.config.scale_label_low}
          highLabel={question.config.scale_label_high}
          value={answer.number}
          onChange={(n) => onChange({ number: n })}
        />
      )}

      {t === "yes_no" && (
        <div className="flex gap-2">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ choice: v })}
              className={`rounded-md border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                answer.choice === v
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface hover:bg-surface-alt"
              }`}
            >
              {v === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingPicker({
  min,
  max,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  min: number;
  max: number;
  lowLabel?: string;
  highLabel?: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const range: number[] = [];
  for (let i = min; i <= max; i++) range.push(i);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {range.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-md border text-[13px] font-semibold transition-colors ${
              value === n
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface hover:bg-surface-alt"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{lowLabel ?? ""}</span>
          <span>{highLabel ?? ""}</span>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
