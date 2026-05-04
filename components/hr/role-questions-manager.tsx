"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  ChevronUp,
  ChevronDown,
  Save,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addRoleQuestion,
  archiveRoleQuestion,
  deleteRoleQuestion,
  reorderRoleQuestions,
  unarchiveRoleQuestion,
  updateRoleQuestion,
} from "@/lib/hr/application-questions";
import {
  APPLICATION_QUESTION_TYPES,
  APPLICATION_QUESTION_TYPE_LABELS,
  type ApplicationQuestionConfig,
  type ApplicationQuestionType,
  type DbRoleQuestion,
} from "@/lib/hr/types";

type Props = {
  roleId: string;
  questions: DbRoleQuestion[];
};

export function RoleQuestionsManager({ roleId, questions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = questions.filter((q) => !q.archived_at);
  const archived = questions.filter((q) => !!q.archived_at);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= active.length) return;
    const next = [...active];
    [next[idx], next[target]] = [next[target], next[idx]];
    const orderedIds = next.map((q) => q.id);
    startTransition(async () => {
      const res = await reorderRoleQuestions(roleId, orderedIds);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });
  };

  const onArchive = (id: string) => {
    startTransition(async () => {
      const res = await archiveRoleQuestion(id, roleId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Question archived");
      router.refresh();
    });
  };

  const onUnarchive = (id: string) => {
    startTransition(async () => {
      const res = await unarchiveRoleQuestion(id, roleId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Question restored");
      router.refresh();
    });
  };

  const onDelete = (id: string, prompt: string) => {
    if (!confirm(`Delete question "${prompt}"? Questions with answers will be archived instead.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteRoleQuestion(id, roleId);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(res.archived ? "Question archived (had answers)" : "Question deleted");
      }
      router.refresh();
    });
  };

  return (
    <section className="haven-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-[15px] font-bold">Application questions</h3>
          <p className="text-[12px] text-muted-foreground">
            Custom questions shown on the public apply form for this role.
          </p>
        </div>
        {!adding && (
          <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add question
          </Button>
        )}
      </div>

      {adding && (
        <QuestionForm
          roleId={roleId}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      )}

      {active.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed border-border bg-surface-alt/40 px-4 py-6 text-center text-[12px] text-muted-foreground">
          No custom questions yet. Add one above to gather extra info on the apply form.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((q, i) => (
            <li key={q.id}>
              {editingId === q.id ? (
                <QuestionForm
                  roleId={roleId}
                  question={q}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <QuestionRow
                  question={q}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === active.length - 1}
                  pending={pending}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  onEdit={() => setEditingId(q.id)}
                  onArchive={() => onArchive(q.id)}
                  onDelete={() => onDelete(q.id, q.prompt)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Archived ({archived.length})
          </div>
          <ul className="flex flex-col gap-2">
            {archived.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-alt/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{q.prompt}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {APPLICATION_QUESTION_TYPE_LABELS[q.question_type as ApplicationQuestionType] ??
                      q.question_type}
                    {" · "}
                    Hidden from new applicants
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => onUnarchive(q.id)}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => onDelete(q.id, q.prompt)}
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function QuestionRow({
  question,
  index,
  isFirst,
  isLast,
  pending,
  onMoveUp,
  onMoveDown,
  onEdit,
  onArchive,
  onDelete,
}: {
  question: DbRoleQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const t = question.question_type as ApplicationQuestionType;
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex flex-col gap-0.5 pt-1">
        <button
          type="button"
          aria-label="Move up"
          disabled={isFirst || pending}
          onClick={onMoveUp}
          className="rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast || pending}
          onClick={onMoveDown}
          className="rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Q{index + 1}
          </span>
          <span className="text-[14px] font-semibold">{question.prompt}</span>
          {question.required && (
            <Badge tone="warn" className="text-[10px]">
              Required
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {APPLICATION_QUESTION_TYPE_LABELS[t] ?? t}
          {question.help_text && <> · {question.help_text}</>}
        </div>
        {(t === "single_choice" || t === "multi_choice") &&
          (question.config.options ?? []).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(question.config.options ?? []).map((o) => (
                <span
                  key={o}
                  className="inline-flex rounded border border-border bg-surface-alt/60 px-1.5 py-0.5 text-[11px]"
                >
                  {o}
                </span>
              ))}
            </div>
          )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" disabled={pending} onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={onArchive}>
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
        </Button>
      </div>
    </div>
  );
}

function QuestionForm({
  roleId,
  question,
  onClose,
  onSaved,
}: {
  roleId: string;
  question?: DbRoleQuestion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!question;
  const [questionType, setQuestionType] = useState<ApplicationQuestionType>(
    (question?.question_type as ApplicationQuestionType) ?? "short_text",
  );
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [helpText, setHelpText] = useState(question?.help_text ?? "");
  const [required, setRequired] = useState(question?.required ?? false);
  const [options, setOptions] = useState<string[]>(
    question?.config.options && question.config.options.length > 0
      ? question.config.options
      : ["", ""],
  );
  const [scaleMin, setScaleMin] = useState(question?.config.scale_min ?? 1);
  const [scaleMax, setScaleMax] = useState(question?.config.scale_max ?? 5);
  const [scaleLow, setScaleLow] = useState(question?.config.scale_label_low ?? "");
  const [scaleHigh, setScaleHigh] = useState(question?.config.scale_label_high ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const showOptions = questionType === "single_choice" || questionType === "multi_choice";
  const showRating = questionType === "rating";

  const buildConfig = (): ApplicationQuestionConfig => {
    const cfg: ApplicationQuestionConfig = {};
    if (showOptions) {
      cfg.options = options.map((o) => o.trim()).filter(Boolean);
    }
    if (showRating) {
      cfg.scale_min = scaleMin;
      cfg.scale_max = scaleMax;
      if (scaleLow.trim()) cfg.scale_label_low = scaleLow.trim();
      if (scaleHigh.trim()) cfg.scale_label_high = scaleHigh.trim();
    }
    return cfg;
  };

  const save = () => {
    setError(null);
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    if (showOptions && buildConfig().options!.length < 1) {
      setError("Add at least one option");
      return;
    }
    if (showRating && scaleMax <= scaleMin) {
      setError("Rating max must be greater than min");
      return;
    }
    startTransition(async () => {
      if (editing && question) {
        const res = await updateRoleQuestion(
          question.id,
          {
            question_type: questionType,
            prompt: prompt.trim(),
            help_text: helpText.trim(),
            required,
            config: buildConfig(),
          },
          roleId,
        );
        if (!res.ok) {
          setError(res.error);
          return;
        }
        toast.success("Question updated");
      } else {
        const res = await addRoleQuestion({
          role_id: roleId,
          question_type: questionType,
          prompt: prompt.trim(),
          help_text: helpText.trim(),
          required,
          config: buildConfig(),
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        toast.success("Question added");
      }
      onSaved();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-accent/40 bg-accent-soft/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold">
          {editing ? "Edit question" : "New question"}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Question type">
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as ApplicationQuestionType)}
            className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
          >
            {APPLICATION_QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {APPLICATION_QUESTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Required?">
          <label className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Applicants must answer this question
          </label>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Prompt" required>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What's the question?"
              autoFocus
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Help text (optional)">
            <Input
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Extra context shown beneath the prompt"
            />
          </Field>
        </div>

        {showOptions && (
          <div className="sm:col-span-2">
            <Field label="Options">
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setOptions((opts) => opts.filter((_, idx) => idx !== i))
                      }
                      disabled={options.length <= 1}
                      aria-label="Remove option"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions((opts) => [...opts, ""])}
                  className="self-start"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              </div>
            </Field>
          </div>
        )}

        {showRating && (
          <>
            <Field label="Scale min">
              <Input
                type="number"
                value={scaleMin}
                onChange={(e) => setScaleMin(Number(e.target.value))}
                min={0}
                max={10}
              />
            </Field>
            <Field label="Scale max">
              <Input
                type="number"
                value={scaleMax}
                onChange={(e) => setScaleMax(Number(e.target.value))}
                min={1}
                max={10}
              />
            </Field>
            <Field label="Low label (optional)">
              <Input
                value={scaleLow}
                onChange={(e) => setScaleLow(e.target.value)}
                placeholder="e.g. Not at all"
              />
            </Field>
            <Field label="High label (optional)">
              <Input
                value={scaleHigh}
                onChange={(e) => setScaleHigh(e.target.value)}
                placeholder="e.g. Extremely"
              />
            </Field>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={save} disabled={pending}>
          <Save className="h-3.5 w-3.5" />
          {pending ? "Saving…" : editing ? "Save changes" : "Add question"}
        </Button>
      </div>
    </div>
  );
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
