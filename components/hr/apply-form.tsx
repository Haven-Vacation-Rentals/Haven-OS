"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitApplication } from "@/lib/hr/public";
import {
  type ApplicationAnswerInput,
  type ApplicationQuestionType,
  type DbRoleQuestion,
} from "@/lib/hr/types";

type Props = {
  roleId: string;
  roleSlug: string;
  questions?: DbRoleQuestion[];
};

type AnswerState = {
  text?: string;
  choice?: string;
  choices?: string[];
  number?: number;
};

export function ApplyForm({ roleId, roleSlug, questions = [] }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
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
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }

    for (const q of questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      const t = q.question_type as ApplicationQuestionType;
      const empty =
        !a ||
        ((t === "short_text" || t === "long_text" || t === "url") &&
          !a.text?.trim()) ||
        (t === "single_choice" && !a.choice) ||
        (t === "multi_choice" && (!a.choices || a.choices.length === 0)) ||
        (t === "rating" && a.number === undefined) ||
        (t === "yes_no" && !a.choice);
      if (empty) {
        setError(`Please answer: "${q.prompt}"`);
        return;
      }
    }

    const payload: ApplicationAnswerInput[] = questions.map((q) => {
      const a = answers[q.id] ?? {};
      const t = q.question_type as ApplicationQuestionType;
      const text =
        (t === "short_text" || t === "long_text" || t === "url") &&
        typeof a.text === "string"
          ? a.text.trim() || null
          : null;
      return {
        question_id: q.id,
        value_text: text,
        value_choice:
          t === "single_choice" || t === "yes_no" ? a.choice ?? null : null,
        value_choices:
          t === "multi_choice" && Array.isArray(a.choices) ? a.choices : null,
        value_number:
          t === "rating" && typeof a.number === "number" ? a.number : null,
      };
    });

    startTransition(async () => {
      try {
        const res = await submitApplication({
          role_id: roleId,
          role_slug: roleSlug,
          name,
          email,
          phone,
          resume_url: resumeUrl,
          loom_url: loomUrl,
          cover_letter: coverLetter,
          answers: payload,
        });
        if (res?.ok) {
          setSubmitted(true);
        } else {
          setError(
            (res && "error" in res && res.error) ||
              "Something went wrong submitting your application. Please try again.",
          );
        }
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
          <div className="font-heading text-[18px] font-bold">Application received</div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Thanks for applying. If it's a fit, someone from Haven will reach out to {email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
        <Field label="Resume URL">
          <Input
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="Google Drive, Dropbox, LinkedIn…"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Video intro (Loom or other)"
            hint="Optional — share a short video about why you'd be a fit. Loom, YouTube, Vimeo, etc."
          >
            <Input
              value={loomUrl}
              onChange={(e) => setLoomUrl(e.target.value)}
              placeholder="https://www.loom.com/share/…"
              type="url"
              inputMode="url"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Why you?">
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="A short note about why you're a fit for this role."
              className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
          </Field>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface/50 p-4">
          <div>
            <h3 className="font-heading text-[14px] font-bold">A few more questions</h3>
            <p className="text-[12px] text-muted-foreground">Help us get to know you.</p>
          </div>
          <div className="flex flex-col gap-3">
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
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div>
        <Button type="submit" variant="cta" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Submitting…" : "Submit application"}
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
  question: DbRoleQuestion;
  answer: AnswerState;
  onChange: (patch: AnswerState) => void;
}) {
  const t = question.question_type as ApplicationQuestionType;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-muted-foreground">Q{index + 1}</span>
        <span className="font-heading text-[14px] font-bold">
          {question.prompt}
          {question.required && <span className="text-rose-500"> *</span>}
        </span>
        {question.help_text && (
          <span className="text-[12px] text-muted-foreground">{question.help_text}</span>
        )}
      </label>

      {t === "short_text" && (
        <Input value={answer.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} />
      )}

      {t === "url" && (
        <Input
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={answer.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      )}

      {t === "long_text" && (
        <textarea
          value={answer.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={4}
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
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
