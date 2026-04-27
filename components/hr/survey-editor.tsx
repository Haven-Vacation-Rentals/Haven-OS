"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSurvey } from "@/lib/hr/surveys";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionConfig,
  type QuestionType,
  SURVEY_STATUSES,
  SURVEY_STATUS_LABELS,
  type SurveyStatus,
} from "@/lib/hr/surveys-types";

type DraftQuestion = {
  key: string;
  question_type: QuestionType;
  prompt: string;
  help_text: string;
  required: boolean;
  config: QuestionConfig;
};

function makeQuestion(question_type: QuestionType = "short_text"): DraftQuestion {
  const cfg: QuestionConfig = {};
  if (question_type === "rating") {
    cfg.scale_min = 1;
    cfg.scale_max = 5;
  }
  if (question_type === "single_choice" || question_type === "multi_choice") {
    cfg.options = ["", ""];
  }
  return {
    key: Math.random().toString(36).slice(2),
    question_type,
    prompt: "",
    help_text: "",
    required: false,
    config: cfg,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function SurveyEditor({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<SurveyStatus>("draft");
  const [audience, setAudience] = useState("");
  const [anonymousAllowed, setAnonymousAllowed] = useState(true);
  const [collectName, setCollectName] = useState(true);
  const [collectEmail, setCollectEmail] = useState(true);
  const [collectDepartment, setCollectDepartment] = useState(true);
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    makeQuestion("short_text"),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setInstructions("");
    setStatus("draft");
    setAudience("");
    setAnonymousAllowed(true);
    setCollectName(true);
    setCollectEmail(true);
    setCollectDepartment(true);
    setQuestions([makeQuestion("short_text")]);
    setError(null);
  };

  const updateQuestion = (i: number, patch: Partial<DraftQuestion>) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (i: number) => {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  };

  const moveQuestion = (i: number, dir: -1 | 1) => {
    setQuestions((qs) => {
      const next = [...qs];
      const target = i + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const save = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    const cleanQs = questions
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        question_type: q.question_type,
        prompt: q.prompt.trim(),
        help_text: q.help_text.trim(),
        required: q.required,
        config: cleanConfig(q.question_type, q.config),
      }));
    if (cleanQs.length === 0) {
      setError("Add at least one question with a prompt");
      return;
    }
    startTransition(async () => {
      try {
        const created = await createSurvey({
          title,
          description,
          instructions,
          status,
          audience: audience.trim() || undefined,
          anonymous_allowed: anonymousAllowed,
          collect_name: collectName,
          collect_email: collectEmail,
          collect_department: collectDepartment,
          questions: cleanQs,
        });
        reset();
        onOpenChange(false);
        router.push(`/hr/surveys/${created.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Create survey</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Q2 Team Pulse Check"
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SurveyStatus)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {SURVEY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SURVEY_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Audience">
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Whole team"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short summary shown to respondents."
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Instructions">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="How should respondents answer? Any context they need?"
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface-alt/40 p-3 text-[12px]">
              <div className="font-semibold text-foreground">Respondent identity</div>
              <Toggle
                label="Allow anonymous responses"
                checked={anonymousAllowed}
                onChange={setAnonymousAllowed}
              />
              <Toggle label="Collect name" checked={collectName} onChange={setCollectName} />
              <Toggle label="Collect email" checked={collectEmail} onChange={setCollectEmail} />
              <Toggle
                label="Collect department"
                checked={collectDepartment}
                onChange={setCollectDepartment}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-[14px] font-bold">Questions</h4>
            <span className="text-[12px] text-muted-foreground">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </span>
          </div>
          {questions.map((q, i) => (
            <QuestionRow
              key={q.key}
              q={q}
              index={i}
              onChange={(patch) => updateQuestion(i, patch)}
              onRemove={() => removeQuestion(i)}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
              total={questions.length}
            />
          ))}
          <div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setQuestions((qs) => [...qs, makeQuestion("short_text")])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Creating…" : "Create survey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cleanConfig(type: QuestionType, cfg: QuestionConfig): QuestionConfig {
  if (type === "single_choice" || type === "multi_choice") {
    const opts = (cfg.options ?? []).map((o) => o.trim()).filter(Boolean);
    return { options: opts };
  }
  if (type === "rating") {
    return {
      scale_min: cfg.scale_min ?? 1,
      scale_max: cfg.scale_max ?? 5,
      scale_label_low: cfg.scale_label_low,
      scale_label_high: cfg.scale_label_high,
    };
  }
  return {};
}

function QuestionRow({
  q,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  total,
}: {
  q: DraftQuestion;
  index: number;
  onChange: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  total: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex flex-col text-muted-foreground hover:text-foreground"
          aria-label="Reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-[11px] font-semibold text-muted-foreground">
          Q{index + 1}
        </span>
        <select
          value={q.question_type}
          onChange={(e) => {
            const next = e.target.value as QuestionType;
            onChange({
              question_type: next,
              config: defaultConfig(next, q.config),
            });
          }}
          className="ml-auto h-8 rounded-md border border-border bg-surface px-2 text-[12px] focus:outline-none focus:shadow-ring"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-rose-500 hover:text-rose-600"
          aria-label="Remove question"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Input
          value={q.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder="Question prompt"
        />
        <Input
          value={q.help_text}
          onChange={(e) => onChange({ help_text: e.target.value })}
          placeholder="Help text (optional)"
        />

        {(q.question_type === "single_choice" ||
          q.question_type === "multi_choice") && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-medium text-muted-foreground">Options</div>
            {(q.config.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...(q.config.options ?? [])];
                    next[oi] = e.target.value;
                    onChange({ config: { ...q.config, options: next } });
                  }}
                  placeholder={`Option ${oi + 1}`}
                />
                <button
                  type="button"
                  className="text-rose-500 hover:text-rose-600"
                  onClick={() => {
                    const next = (q.config.options ?? []).filter((_, idx) => idx !== oi);
                    onChange({ config: { ...q.config, options: next } });
                  }}
                  aria-label="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  config: {
                    ...q.config,
                    options: [...(q.config.options ?? []), ""],
                  },
                })
              }
            >
              <Plus className="h-3 w-3" />
              Add option
            </Button>
          </div>
        )}

        {q.question_type === "rating" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SmallField label="Min">
              <Input
                type="number"
                value={q.config.scale_min ?? 1}
                onChange={(e) =>
                  onChange({
                    config: { ...q.config, scale_min: Number(e.target.value) || 1 },
                  })
                }
              />
            </SmallField>
            <SmallField label="Max">
              <Input
                type="number"
                value={q.config.scale_max ?? 5}
                onChange={(e) =>
                  onChange({
                    config: { ...q.config, scale_max: Number(e.target.value) || 5 },
                  })
                }
              />
            </SmallField>
            <SmallField label="Low label">
              <Input
                value={q.config.scale_label_low ?? ""}
                onChange={(e) =>
                  onChange({
                    config: { ...q.config, scale_label_low: e.target.value },
                  })
                }
                placeholder="Strongly disagree"
              />
            </SmallField>
            <SmallField label="High label">
              <Input
                value={q.config.scale_label_high ?? ""}
                onChange={(e) =>
                  onChange({
                    config: { ...q.config, scale_label_high: e.target.value },
                  })
                }
                placeholder="Strongly agree"
              />
            </SmallField>
          </div>
        )}

        <label className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={q.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          Required
        </label>
      </div>
    </div>
  );
}

function defaultConfig(type: QuestionType, prev: QuestionConfig): QuestionConfig {
  if (type === "rating") {
    return {
      scale_min: prev.scale_min ?? 1,
      scale_max: prev.scale_max ?? 5,
      scale_label_low: prev.scale_label_low,
      scale_label_high: prev.scale_label_high,
    };
  }
  if (type === "single_choice" || type === "multi_choice") {
    return { options: prev.options && prev.options.length ? prev.options : ["", ""] };
  }
  return {};
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
