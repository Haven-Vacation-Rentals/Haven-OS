"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  ExternalLink,
  Pencil,
  Trash2,
  MessageSquare,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandidateEditor } from "./candidate-editor";
import {
  addCandidateNote,
  deleteCandidate,
  deleteCandidateNote,
  setCandidateStage,
} from "@/lib/hr/actions";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_STATUS_LABELS,
  type ApplicationQuestionType,
  type CandidateStage,
  type DbCandidate,
  type DbCandidateAnswer,
  type DbCandidateNote,
  type DbRole,
  type DbRoleQuestion,
  type EmploymentType,
  type RoleStatus,
} from "@/lib/hr/types";

const STAGE_TONE: Record<
  CandidateStage,
  "neutral" | "coral" | "warn" | "success" | "danger"
> = {
  applied: "neutral",
  screen: "coral",
  interview: "coral",
  offer: "warn",
  hired: "success",
  rejected: "danger",
};

export function CandidateDetail({
  candidate,
  role,
  notes,
  questions = [],
  answers = [],
}: {
  candidate: DbCandidate;
  role: DbRole;
  notes: DbCandidateNote[];
  questions?: DbRoleQuestion[];
  answers?: DbCandidateAnswer[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const stage = candidate.stage as CandidateStage;
  const tone = STAGE_TONE[stage] ?? "neutral";

  const moveStage = (next: CandidateStage) => {
    if (next === stage) return;
    startTransition(async () => {
      const res = await setCandidateStage(candidate.id, next, role.id);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(`Moved to ${CANDIDATE_STAGE_LABELS[next]}`);
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Delete candidate "${candidate.name}"? This also removes all notes and cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteCandidate(candidate.id, role.id);
        toast.success("Candidate deleted");
        router.push(`/hr/hiring/${role.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="haven-card flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-[20px] font-bold">
                {candidate.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{CANDIDATE_STAGE_LABELS[stage]}</Badge>
                <Badge tone="neutral" className="capitalize">
                  {candidate.source.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={remove}
                disabled={pending}
                aria-label="Delete candidate"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              </Button>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" />
                {candidate.phone}
              </a>
            )}
            {candidate.resume_url && (
              <a
                href={candidate.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:brightness-90"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Resume
              </a>
            )}
            {candidate.loom_url && (
              <a
                href={candidate.loom_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent hover:brightness-90"
              >
                <Video className="h-3.5 w-3.5" />
                Video intro
              </a>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <span>Applied {formatDateTime(candidate.created_at)}</span>
            {candidate.updated_at !== candidate.created_at && (
              <span>Updated {formatDateTime(candidate.updated_at)}</span>
            )}
          </div>
        </div>

        {/* Cover letter / scratchpad */}
        {(candidate.cover_letter || candidate.notes) && (
          <div className="haven-card flex flex-col gap-3 p-5">
            {candidate.cover_letter && (
              <div>
                <h3 className="font-heading text-[14px] font-bold">
                  Cover letter
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {candidate.cover_letter}
                </p>
              </div>
            )}
            {candidate.notes && (
              <div>
                <h3 className="font-heading text-[14px] font-bold">
                  Application notes
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                  {candidate.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Application question answers */}
        <ApplicationAnswers questions={questions} answers={answers} />

        {/* Notes thread */}
        <NotesThread
          candidateId={candidate.id}
          roleId={role.id}
          notes={notes}
        />
      </div>

      {/* Side panel: role + stage */}
      <aside className="flex flex-col gap-4">
        <div className="haven-card flex flex-col gap-3 p-5">
          <h3 className="font-heading text-[14px] font-bold">Role</h3>
          <div>
            <div className="text-[15px] font-semibold">{role.title}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {[
                role.department,
                role.location,
                role.employment_type
                  ? EMPLOYMENT_TYPE_LABELS[
                      role.employment_type as EmploymentType
                    ] ?? role.employment_type
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
          </div>
          <Badge tone="neutral">
            {ROLE_STATUS_LABELS[role.status as RoleStatus] ?? role.status}
          </Badge>
        </div>

        <div className="haven-card flex flex-col gap-3 p-5">
          <h3 className="font-heading text-[14px] font-bold">Stage</h3>
          <div className="flex flex-col gap-1">
            {CANDIDATE_STAGES.map((s) => {
              const active = s === stage;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={pending || active}
                  onClick={() => moveStage(s)}
                  className={
                    "flex items-center justify-between rounded-md border px-3 py-2 text-left text-[13px] transition-colors " +
                    (active
                      ? "border-haven-coral-600 bg-accent-soft/50 font-semibold"
                      : "border-border hover:bg-surface-alt disabled:opacity-50")
                  }
                >
                  <span>{CANDIDATE_STAGE_LABELS[s]}</span>
                  {active && (
                    <span className="text-[11px] text-muted-foreground">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <CandidateEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        roleId={role.id}
        candidate={candidate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes thread
// ---------------------------------------------------------------------------

function NotesThread({
  candidateId,
  roleId,
  notes,
}: {
  candidateId: string;
  roleId: string;
  notes: DbCandidateNote[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await addCandidateNote({
        candidate_id: candidateId,
        body: trimmed,
        role_id: roleId,
      });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        setBody("");
        router.refresh();
      }
    });
  };

  const onDelete = (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      const res = await deleteCandidateNote(noteId, candidateId, roleId);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="haven-card flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-heading text-[14px] font-bold">
          Notes &amp; comments
        </h3>
        <span className="text-[12px] text-muted-foreground">
          ({notes.length})
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-surface/40 p-4 text-center text-[12px] text-muted-foreground">
          No notes yet. Be the first to leave one.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-border bg-surface p-3"
            >
              <div className="flex items-baseline justify-between gap-2 text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {n.author_name || n.author_email || "Unknown"}
                </span>
                <div className="flex items-center gap-2">
                  <time>{formatDateTime(n.created_at)}</time>
                  <button
                    type="button"
                    aria-label="Delete note"
                    className="rounded p-0.5 text-muted-foreground/60 hover:bg-surface-alt hover:text-rose-600"
                    onClick={() => onDelete(n.id)}
                    disabled={pending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">
                {n.body}
              </p>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Leave a note for the hiring team…"
          className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
          disabled={pending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending || !body.trim()}
          >
            {pending ? "Saving…" : "Add note"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ApplicationAnswers({
  questions,
  answers,
}: {
  questions: DbRoleQuestion[];
  answers: DbCandidateAnswer[];
}) {
  if (!questions.length && !answers.length) return null;

  // Build a map of question_id -> answer for fast lookup, then walk
  // questions in defined order. Include any answers whose question is gone
  // (defensive — shouldn't happen with the cascade).
  const byQ = new Map(answers.map((a) => [a.question_id, a]));
  const orphaned = answers.filter(
    (a) => !questions.some((q) => q.id === a.question_id),
  );

  const rows = questions
    .map((q) => ({ question: q, answer: byQ.get(q.id) }))
    .filter((r) => r.answer || !r.question.archived_at);

  if (rows.length === 0 && orphaned.length === 0) return null;

  return (
    <div className="haven-card flex flex-col gap-3 p-5">
      <div>
        <h3 className="font-heading text-[14px] font-bold">Application answers</h3>
        <p className="text-[12px] text-muted-foreground">
          Custom questions submitted with this application.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(({ question, answer }, i) => (
          <AnswerRow key={question.id} index={i} question={question} answer={answer} />
        ))}
        {orphaned.map((a, i) => (
          <div key={a.id} className="text-[12px] text-muted-foreground">
            <span className="font-semibold">Q{rows.length + i + 1}:</span>{" "}
            (question removed) —{" "}
            {a.value_text ??
              a.value_choice ??
              a.value_choices?.join(", ") ??
              (a.value_number !== null ? String(a.value_number) : "—")}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerRow({
  index,
  question,
  answer,
}: {
  index: number;
  question: DbRoleQuestion;
  answer: DbCandidateAnswer | undefined;
}) {
  const t = question.question_type as ApplicationQuestionType;
  const archived = !!question.archived_at;

  const renderValue = () => {
    if (!answer) return <span className="text-muted-foreground">— No response</span>;
    if (t === "url") {
      const v = answer.value_text;
      if (!v) return <span className="text-muted-foreground">—</span>;
      return (
        <a
          href={v}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-accent hover:brightness-90"
        >
          {v}
        </a>
      );
    }
    if (t === "short_text" || t === "long_text") {
      const v = answer.value_text;
      if (!v) return <span className="text-muted-foreground">—</span>;
      return <span className="whitespace-pre-wrap">{v}</span>;
    }
    if (t === "single_choice" || t === "yes_no") {
      const v = answer.value_choice;
      if (!v) return <span className="text-muted-foreground">—</span>;
      return <span className="capitalize">{v}</span>;
    }
    if (t === "multi_choice") {
      const v = answer.value_choices;
      if (!v || v.length === 0) return <span className="text-muted-foreground">—</span>;
      return <span>{v.join(", ")}</span>;
    }
    if (t === "rating") {
      const n = answer.value_number;
      if (n === null || n === undefined) return <span className="text-muted-foreground">—</span>;
      const min = question.config.scale_min ?? 1;
      const max = question.config.scale_max ?? 5;
      return (
        <span>
          {n} <span className="text-muted-foreground">/ {max}</span>{" "}
          <span className="text-[11px] text-muted-foreground">(scale {min}–{max})</span>
        </span>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground">
          Q{index + 1}
        </span>
        <span className="font-semibold text-[13px]">{question.prompt}</span>
        {archived && (
          <Badge tone="neutral" className="text-[10px]">
            Archived
          </Badge>
        )}
      </div>
      <div className="text-[13px] leading-relaxed">{renderValue()}</div>
    </div>
  );
}

function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}
