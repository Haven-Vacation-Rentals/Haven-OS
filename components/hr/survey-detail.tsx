"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Link2,
  Trash2,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  Save,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  Hash,
  TrendingUp,
  Sparkles,
  RotateCcw,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  setSurveyStatus,
  deleteSurvey,
  updateSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  archiveQuestion,
  unarchiveQuestion,
  reorderQuestions,
  deleteResponse,
  restoreResponse,
  type SurveyAccessEntry,
} from "@/lib/hr/surveys";
import {
  grantHrAccess,
  revokeHrAccess,
  revokeHrModule,
  type AdminUser,
} from "@/lib/admin/actions";
import {
  computeSummary,
  computePerQuestionStats,
  type PerQuestionStats,
} from "@/lib/hr/survey-analytics";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  SURVEY_STATUSES,
  SURVEY_STATUS_LABELS,
  type DbHrSurvey,
  type DbHrSurveyAnswer,
  type DbHrSurveyQuestion,
  type QuestionConfig,
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
  deletedResponses?: SurveyResponseWithAnswers[];
  access?: SurveyAccessEntry[];
  users?: AdminUser[];
  canManageAccess?: boolean;
};

export function SurveyDetail({
  survey,
  questions,
  responses,
  deletedResponses = [],
  access = [],
  users = [],
  canManageAccess = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"overview" | "edit" | "access">("overview");

  const status = (survey.status as SurveyStatus) ?? "draft";
  const tone = STATUS_TONE[status] ?? "neutral";

  const publicUrl = canonicalUrl(`/survey/${survey.slug}`);

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

  const liveQuestions = useMemo(
    () => questions.filter((q) => !q.archived_at),
    [questions],
  );

  const answerCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of responses)
      for (const a of r.answers) {
        m.set(a.question_id, (m.get(a.question_id) ?? 0) + 1);
      }
    return m;
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
          <Button
            variant={tab === "edit" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTab(tab === "edit" ? "overview" : "edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
            {tab === "edit" ? "Done editing" : "Edit survey"}
          </Button>
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

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "overview" | "edit" | "access")}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-3 w-3" />
            Edit
          </TabsTrigger>
          {canManageAccess && (
            <TabsTrigger value="access">
              Access
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <DashboardPanel
            survey={survey}
            liveQuestions={liveQuestions}
            archivedQuestions={questions.filter((q) => q.archived_at)}
            allQuestions={questions}
            responses={responses}
            deletedResponses={deletedResponses}
          />
        </TabsContent>

        <TabsContent value="edit">
          <EditPanel
            survey={survey}
            questions={questions}
            answerCounts={answerCounts}
            isLive={status === "active"}
          />
        </TabsContent>

        {canManageAccess && (
          <TabsContent value="access">
            <SurveyAccessPanel
              survey={survey}
              access={access}
              users={users}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function DashboardPanel({
  survey,
  liveQuestions,
  archivedQuestions,
  allQuestions,
  responses,
  deletedResponses,
}: {
  survey: DbHrSurvey;
  liveQuestions: DbHrSurveyQuestion[];
  archivedQuestions: DbHrSurveyQuestion[];
  allQuestions: DbHrSurveyQuestion[];
  responses: SurveyResponseWithAnswers[];
  deletedResponses: SurveyResponseWithAnswers[];
}) {
  const requiredIds = useMemo(
    () =>
      liveQuestions.filter((q) => q.required).map((q) => q.id),
    [liveQuestions],
  );
  const summary = useMemo(
    () =>
      computeSummary(responses, {
        deletedCount: deletedResponses.length,
        requiredQuestionIds: requiredIds,
      }),
    [responses, deletedResponses.length, requiredIds],
  );
  const stats = useMemo(
    () => computePerQuestionStats(allQuestions, responses),
    [allQuestions, responses],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Responses"
          value={summary.active_responses.toString()}
          hint={
            summary.deleted_responses > 0
              ? `${summary.deleted_responses} deleted`
              : survey.audience
                ? `Audience: ${survey.audience}`
                : "All-time"
          }
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Latest"
          value={
            summary.last_response_at
              ? formatDistanceToNow(new Date(summary.last_response_at), {
                  addSuffix: true,
                })
              : "—"
          }
          hint={
            summary.last_response_at
              ? format(new Date(summary.last_response_at), "MMM d, h:mm a")
              : "No responses yet"
          }
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completion"
          value={
            summary.full_completion_rate !== null
              ? `${summary.full_completion_rate}%`
              : summary.completion_rate !== null
                ? `${summary.completion_rate}%`
                : "—"
          }
          hint={
            requiredIds.length > 0
              ? `${requiredIds.length} required question${requiredIds.length === 1 ? "" : "s"}`
              : `${summary.active_responses} answered`
          }
        />
        <SummaryCard
          icon={<Hash className="h-4 w-4" />}
          label="Identity"
          value={
            summary.active_responses === 0
              ? "—"
              : `${summary.identified_responses} / ${summary.anonymous_responses}`
          }
          hint="Identified · Anonymous"
        />
      </section>

      {/* Per-question analytics */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-[15px] font-bold">
            Question results ({liveQuestions.length})
          </h3>
        </div>
        {liveQuestions.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/30 p-6 text-center text-[13px] text-muted-foreground">
            No questions yet. Switch to the Edit tab to add some.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stats
              .filter((s) => !s.question.archived_at)
              .map((s, i) => (
                <QuestionStatsCard key={s.question.id} index={i} stats={s} />
              ))}
          </div>
        )}
      </section>

      {archivedQuestions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-[13px] font-semibold text-muted-foreground">
            Archived questions ({archivedQuestions.length})
          </h3>
          <div className="flex flex-col gap-2 opacity-70">
            {stats
              .filter((s) => s.question.archived_at)
              .map((s, i) => (
                <QuestionStatsCard
                  key={s.question.id}
                  index={liveQuestions.length + i}
                  stats={s}
                  archived
                />
              ))}
          </div>
        </section>
      )}

      {/* Raw responses (with delete) */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-[15px] font-bold">
          Individual responses ({responses.length})
        </h3>
        {responses.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/30 p-6 text-center text-[13px] text-muted-foreground">
            No responses yet. Share the link above to start collecting feedback.
          </div>
        ) : (
          <ResponsesTable responses={responses} questions={allQuestions} />
        )}
      </section>

      {deletedResponses.length > 0 && (
        <DeletedResponses responses={deletedResponses} />
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-foreground/60">{icon}</span>
        {label}
      </div>
      <div className="mt-1 truncate font-heading text-[20px] font-bold tracking-tight">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  );
}

function QuestionStatsCard({
  index,
  stats,
  archived,
}: {
  index: number;
  stats: PerQuestionStats;
  archived?: boolean;
}) {
  const q = stats.question;
  const t = q.question_type as QuestionType;

  let body: React.ReactNode = null;
  let headerExtra: React.ReactNode = null;

  if (stats.type === "rating") {
    headerExtra = (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground/80">
        <TrendingUp className="h-3 w-3 text-emerald-500" />
        Avg{" "}
        <span className="font-semibold text-foreground">
          {stats.average === null ? "—" : stats.average.toFixed(2)}
        </span>{" "}
        / {stats.max}
      </span>
    );
    body = (
      <div className="flex flex-col gap-1.5">
        {stats.distribution.map((d) => (
          <div key={d.value} className="flex items-center gap-2 text-[12px]">
            <div className="w-8 text-right tabular-nums text-muted-foreground">
              {d.value}
            </div>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500"
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <div className="w-20 text-right tabular-nums text-muted-foreground">
              {d.count} ({d.pct}%)
            </div>
          </div>
        ))}
      </div>
    );
  } else if (stats.type === "yes_no") {
    headerExtra = (
      <span className="text-[12px] text-muted-foreground">
        {stats.answer_count} response{stats.answer_count === 1 ? "" : "s"}
      </span>
    );
    body = (
      <div className="flex flex-col gap-1.5">
        <ChoiceBar label="Yes" count={stats.yes} pct={stats.yes_pct} tone="success" />
        <ChoiceBar label="No" count={stats.no} pct={stats.no_pct} tone="warn" />
      </div>
    );
  } else if (stats.type === "choice") {
    headerExtra = (
      <span className="text-[12px] text-muted-foreground">
        {stats.answer_count} response{stats.answer_count === 1 ? "" : "s"}
      </span>
    );
    body =
      stats.counts.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">No answers yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {stats.counts.map((c) => (
            <ChoiceBar
              key={c.value}
              label={c.value || "—"}
              count={c.count}
              pct={c.pct}
            />
          ))}
        </div>
      );
  } else {
    // text
    headerExtra = (
      <span className="text-[12px] text-muted-foreground">
        {stats.answer_count} response{stats.answer_count === 1 ? "" : "s"}
      </span>
    );
    body = (
      <div className="flex flex-col gap-3">
        {stats.themes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Themes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.themes.map((th) => (
                <span
                  key={th.phrase}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[11px]"
                  title={`Appears in ${th.count} response${th.count === 1 ? "" : "s"}`}
                >
                  <span className="font-medium">{th.phrase}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground tabular-nums">{th.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {stats.sample.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Recent answers
            </div>
            <div className="flex flex-col gap-1.5">
              {stats.sample.map((s, i) => (
                <div
                  key={i}
                  className="rounded-md bg-surface-alt/40 p-2 text-[12px] text-foreground/80"
                >
                  &ldquo;{s.text}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}
        {stats.answer_count === 0 && (
          <div className="text-[12px] text-muted-foreground">No answers yet.</div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Q{index + 1}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {QUESTION_TYPE_LABELS[t] ?? t}
            </span>
            {q.required && (
              <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                Required
              </span>
            )}
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Archive className="h-2.5 w-2.5" />
                Archived
              </span>
            )}
          </div>
          <div className="mt-0.5 font-heading text-[14px] font-bold">
            {q.prompt}
          </div>
          {q.help_text && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {q.help_text}
            </div>
          )}
        </div>
        {headerExtra}
      </div>
      <div className="mt-3">{body}</div>
    </div>
  );
}

function ChoiceBar({
  label,
  count,
  pct,
  tone,
}: {
  label: string;
  count: number;
  pct: number;
  tone?: "success" | "warn";
}) {
  const barColour =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-rose-500"
        : "bg-accent";
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <div className="w-32 truncate" title={label}>
        {label}
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`absolute inset-y-0 left-0 ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 text-right tabular-nums text-muted-foreground">
        {count} ({pct}%)
      </div>
    </div>
  );
}

function SurveyAccessPanel({
  survey,
  access,
  users,
}: {
  survey: DbHrSurvey;
  access: SurveyAccessEntry[];
  users: AdminUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickUserId, setPickUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const accessByUser = new Map(access.map((a) => [a.user_id, a]));
  const candidates = users.filter(
    (u) => !accessByUser.has(u.id) && u.role !== "super_admin",
  );

  const grantAccess = () => {
    if (!pickUserId) return;
    setError(null);
    startTransition(async () => {
      try {
        await grantHrAccess({
          grantee_id: pickUserId,
          scope: "survey",
          survey_id: survey.id,
        });
        setPickUserId("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const revoke = (entry: SurveyAccessEntry) => {
    if (!entry.grant_id) return;
    if (entry.source === "module") {
      if (
        !confirm(
          "Revoking the Surveys module will remove this user's access to every survey, not just this one. Continue?",
        )
      )
        return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (entry.source === "module") {
          await revokeHrModule(entry.grant_id!);
        } else {
          await revokeHrAccess(entry.grant_id!);
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="haven-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-heading text-[15px] font-bold">
          Who can see this survey
        </h3>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Super admins always have access. Anyone with the <strong>Surveys</strong>{" "}
        module sees every survey. Per-survey grants below give access to this
        survey only.
      </p>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {access.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No one has access yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[6px] border border-border">
          {access.map((a) => (
            <li
              key={`${a.user_id}-${a.source}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">
                  {a.full_name ?? a.email ?? "—"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {a.email}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  a.source === "super_admin"
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    : a.source === "module"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
              >
                {a.source === "super_admin"
                  ? "Super admin"
                  : a.source === "module"
                    ? "Surveys module"
                    : "Direct"}
              </span>
              {a.grant_id && a.source !== "super_admin" ? (
                <button
                  type="button"
                  onClick={() => revoke(a)}
                  disabled={pending}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  aria-label="Revoke access"
                  title="Revoke this grant"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="h-6 w-6" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-dashed border-border bg-surface p-2">
        <select
          value={pickUserId}
          onChange={(e) => setPickUserId(e.target.value)}
          className="h-9 flex-1 min-w-[180px] rounded-md border border-border bg-surface px-2 text-[12px]"
        >
          <option value="">Add a user…</option>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {(u.full_name ?? u.email)} {u.role !== "user" ? `· ${u.role}` : ""}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          onClick={grantAccess}
          disabled={pending || !pickUserId}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Grant access
        </Button>
      </div>
    </div>
  );
}

function DeletedResponses({
  responses,
}: {
  responses: SurveyResponseWithAnswers[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const onRestore = (id: string) => {
    startTransition(async () => {
      const res = await restoreResponse(id);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };
  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 self-start text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Deleted responses ({responses.length})
      </button>
      {open && (
        <div className="haven-card overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border bg-surface-alt/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Submitted</th>
                <th className="px-3 py-2">Respondent</th>
                <th className="px-3 py-2">Deleted</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {format(new Date(r.submitted_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-3 py-2">
                    {r.is_anonymous ? (
                      <span className="text-muted-foreground">Anonymous</span>
                    ) : (
                      r.respondent_name ?? r.respondent_email ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.deleted_at
                      ? formatDistanceToNow(new Date(r.deleted_at), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRestore(r.id)}
                      disabled={pending}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Edit panel: settings + questions (works on live surveys too)
// ---------------------------------------------------------------------------

type DraftQuestion = DbHrSurveyQuestion & { _isNew?: boolean; _key: string };

function EditPanel({
  survey,
  questions,
  answerCounts,
  isLive,
}: {
  survey: DbHrSurvey;
  questions: DbHrSurveyQuestion[];
  answerCounts: Map<string, number>;
  isLive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Settings state
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description ?? "");
  const [instructions, setInstructions] = useState(survey.instructions ?? "");
  const [status, setStatus] = useState<SurveyStatus>(
    (survey.status as SurveyStatus) ?? "draft",
  );
  const [audience, setAudience] = useState(survey.audience ?? "");
  const [anonymousAllowed, setAnonymousAllowed] = useState(
    survey.anonymous_allowed,
  );
  const [collectName, setCollectName] = useState(survey.collect_name);
  const [collectEmail, setCollectEmail] = useState(survey.collect_email);
  const [collectDepartment, setCollectDepartment] = useState(
    survey.collect_department,
  );
  const [closesAt, setClosesAt] = useState<string>(
    survey.closes_at ? survey.closes_at.slice(0, 16) : "",
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsOk, setSettingsOk] = useState(false);

  const saveSettings = () => {
    setSettingsError(null);
    setSettingsOk(false);
    if (!title.trim()) {
      setSettingsError("Title is required");
      return;
    }
    setSavingSettings(true);
    startTransition(async () => {
      try {
        await updateSurvey(survey.id, {
          title: title.trim(),
          description,
          instructions,
          status,
          audience: audience.trim() || null,
          anonymous_allowed: anonymousAllowed,
          collect_name: collectName,
          collect_email: collectEmail,
          collect_department: collectDepartment,
          closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        });
        setSettingsOk(true);
        router.refresh();
      } catch (e) {
        setSettingsError(e instanceof Error ? e.message : String(e));
      } finally {
        setSavingSettings(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {isLive && (
        <div className="flex items-start gap-2 rounded-card border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            This survey is <strong>live</strong>. You can still edit it. Existing
            responses are preserved — questions with answers are archived rather
            than deleted, and we block edits that would change the meaning of
            stored answers.
          </div>
        </div>
      )}

      {/* Settings card */}
      <div className="haven-card flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold">Survey settings</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={saveSettings}
            disabled={pending || savingSettings}
          >
            <Save className="h-3.5 w-3.5" />
            {savingSettings ? "Saving…" : "Save settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Survey title"
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
                placeholder="How should respondents answer?"
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>
          <Field label="Closes at (optional)">
            <Input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface-alt/40 p-3 text-[12px]">
              <div className="font-semibold text-foreground">Respondent identity</div>
              <Toggle
                label="Allow anonymous responses"
                checked={anonymousAllowed}
                onChange={setAnonymousAllowed}
              />
              <Toggle
                label="Collect name"
                checked={collectName}
                onChange={setCollectName}
              />
              <Toggle
                label="Collect email"
                checked={collectEmail}
                onChange={setCollectEmail}
              />
              <Toggle
                label="Collect department"
                checked={collectDepartment}
                onChange={setCollectDepartment}
              />
            </div>
          </div>
        </div>

        {settingsError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {settingsError}
          </div>
        )}
        {settingsOk && !settingsError && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-400">
            Settings saved.
          </div>
        )}
      </div>

      {/* Questions editor */}
      <QuestionsEditor
        surveyId={survey.id}
        questions={questions}
        answerCounts={answerCounts}
      />
    </div>
  );
}

function QuestionsEditor({
  surveyId,
  questions,
  answerCounts,
}: {
  surveyId: string;
  questions: DbHrSurveyQuestion[];
  answerCounts: Map<string, number>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const live = questions.filter((q) => !q.archived_at);
  const archived = questions.filter((q) => q.archived_at);

  const [adding, setAdding] = useState<DraftQuestion | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const startNew = () => {
    setEditingId(null);
    setAdding({
      _isNew: true,
      _key: Math.random().toString(36).slice(2),
      id: "",
      survey_id: surveyId,
      position: live.length,
      question_type: "short_text",
      prompt: "",
      help_text: "",
      required: false,
      config: {},
      archived_at: null,
      created_at: "",
      updated_at: "",
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    const ids = live.map((q) => q.id);
    const idx = ids.indexOf(id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= ids.length) return;
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    startTransition(async () => {
      try {
        await reorderQuestions(surveyId, ids);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const onArchive = (id: string) => {
    startTransition(async () => {
      try {
        await archiveQuestion(id, surveyId);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const onUnarchive = (id: string) => {
    startTransition(async () => {
      try {
        await unarchiveQuestion(id, surveyId);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const onDelete = (id: string, hasAnswers: boolean) => {
    const msg = hasAnswers
      ? "This question has responses. It will be archived (hidden from the public form) so historical answers stay intact. Continue?"
      : "Delete this question?";
    if (!confirm(msg)) return;
    startTransition(async () => {
      try {
        await deleteQuestion(id, surveyId);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="haven-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[15px] font-bold">
          Questions ({live.length})
        </h3>
        <Button variant="primary" size="sm" onClick={startNew}>
          <Plus className="h-3.5 w-3.5" />
          Add question
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {live.length === 0 && !adding && (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/30 p-6 text-center text-[13px] text-muted-foreground">
            No questions yet — click <strong>Add question</strong> to begin.
          </div>
        )}
        {live.map((q, i) => (
          <QuestionEditCard
            key={q.id}
            index={i}
            question={q}
            answerCount={answerCounts.get(q.id) ?? 0}
            isEditing={editingId === q.id}
            onEdit={() => {
              setAdding(null);
              setEditingId(q.id);
            }}
            onCancel={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              router.refresh();
            }}
            onMoveUp={() => move(q.id, -1)}
            onMoveDown={() => move(q.id, 1)}
            onArchive={() => onArchive(q.id)}
            onDelete={() => onDelete(q.id, (answerCounts.get(q.id) ?? 0) > 0)}
            isFirst={i === 0}
            isLast={i === live.length - 1}
          />
        ))}
        {adding && (
          <NewQuestionCard
            surveyId={surveyId}
            draft={adding}
            onCancel={() => setAdding(null)}
            onSaved={() => {
              setAdding(null);
              router.refresh();
            }}
          />
        )}
      </div>

      {archived.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <div className="text-[12px] font-semibold text-muted-foreground">
            Archived questions ({archived.length})
          </div>
          {archived.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-surface-alt/40 p-3 text-[12px]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{q.prompt}</div>
                <div className="text-[11px] text-muted-foreground">
                  {QUESTION_TYPE_LABELS[q.question_type as QuestionType] ??
                    q.question_type}{" "}
                  · {answerCounts.get(q.id) ?? 0} historical answers
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnarchive(q.id)}
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewQuestionCard({
  surveyId,
  draft,
  onCancel,
  onSaved,
}: {
  surveyId: string;
  draft: DraftQuestion;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<QuestionType>(draft.question_type as QuestionType);
  const [prompt, setPrompt] = useState(draft.prompt);
  const [helpText, setHelpText] = useState(draft.help_text);
  const [required, setRequired] = useState(draft.required);
  const [config, setConfig] = useState<QuestionConfig>(
    defaultConfig(draft.question_type as QuestionType, draft.config),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    startTransition(async () => {
      try {
        await addQuestion({
          survey_id: surveyId,
          question_type: type,
          prompt: prompt.trim(),
          help_text: helpText.trim(),
          required,
          config: cleanConfig(type, config),
        });
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <QuestionFormShell
      title="New question"
      type={type}
      onTypeChange={(t) => {
        setType(t);
        setConfig(defaultConfig(t, config));
      }}
      prompt={prompt}
      setPrompt={setPrompt}
      helpText={helpText}
      setHelpText={setHelpText}
      required={required}
      setRequired={setRequired}
      config={config}
      setConfig={setConfig}
      pending={pending}
      error={error}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Add question"}
          </Button>
        </div>
      }
    />
  );
}

function QuestionEditCard({
  index,
  question,
  answerCount,
  isEditing,
  onEdit,
  onCancel,
  onSaved,
  onMoveUp,
  onMoveDown,
  onArchive,
  onDelete,
  isFirst,
  isLast,
}: {
  index: number;
  question: DbHrSurveyQuestion;
  answerCount: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [type, setType] = useState<QuestionType>(question.question_type as QuestionType);
  const [prompt, setPrompt] = useState(question.prompt);
  const [helpText, setHelpText] = useState(question.help_text);
  const [required, setRequired] = useState(question.required);
  const [config, setConfig] = useState<QuestionConfig>(question.config);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasAnswers = answerCount > 0;
  const typeChanged = type !== question.question_type;

  const save = () => {
    setError(null);
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateQuestion(
          question.id,
          {
            question_type: type,
            prompt: prompt.trim(),
            help_text: helpText.trim(),
            required,
            config: cleanConfig(type, config),
          },
          question.survey_id,
        );
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  if (!isEditing) {
    return (
      <div className="rounded-card border border-border bg-surface p-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
            Q{index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-[14px] font-bold">
              {question.prompt}
              {question.required && <span className="text-rose-500"> *</span>}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {QUESTION_TYPE_LABELS[question.question_type as QuestionType] ??
                question.question_type}
              {question.help_text ? ` · ${question.help_text}` : ""}
              {hasAnswers ? ` · ${answerCount} answer${answerCount === 1 ? "" : "s"}` : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onArchive}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuestionFormShell
      title={`Edit Q${index + 1}`}
      type={type}
      onTypeChange={(t) => {
        setType(t);
        setConfig(defaultConfig(t, config));
      }}
      prompt={prompt}
      setPrompt={setPrompt}
      helpText={helpText}
      setHelpText={setHelpText}
      required={required}
      setRequired={setRequired}
      config={config}
      setConfig={setConfig}
      pending={pending}
      error={error}
      banner={
        hasAnswers ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <div>
              This question has <strong>{answerCount}</strong> existing answer
              {answerCount === 1 ? "" : "s"}.
              {typeChanged
                ? " Changing the type isn't allowed because it would invalidate stored answers — archive this question and add a replacement instead."
                : " Editing prompt/help/required is safe; removing existing options is blocked."}
            </div>
          </div>
        ) : null
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={pending}>
            <Save className="h-3.5 w-3.5" />
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    />
  );
}

function QuestionFormShell({
  title,
  type,
  onTypeChange,
  prompt,
  setPrompt,
  helpText,
  setHelpText,
  required,
  setRequired,
  config,
  setConfig,
  pending,
  error,
  banner,
  footer,
}: {
  title: string;
  type: QuestionType;
  onTypeChange: (t: QuestionType) => void;
  prompt: string;
  setPrompt: (s: string) => void;
  helpText: string;
  setHelpText: (s: string) => void;
  required: boolean;
  setRequired: (b: boolean) => void;
  config: QuestionConfig;
  setConfig: (c: QuestionConfig) => void;
  pending: boolean;
  error: string | null;
  banner?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-accent/40 bg-surface p-3 ring-1 ring-accent/20">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-muted-foreground">{title}</div>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as QuestionType)}
          className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] focus:outline-none focus:shadow-ring"
          disabled={pending}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {banner}

      <div className="mt-2 flex flex-col gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Question prompt"
          disabled={pending}
        />
        <Input
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          placeholder="Help text (optional)"
          disabled={pending}
        />

        {(type === "single_choice" || type === "multi_choice") && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-medium text-muted-foreground">Options</div>
            {(config.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...(config.options ?? [])];
                    next[oi] = e.target.value;
                    setConfig({ ...config, options: next });
                  }}
                  placeholder={`Option ${oi + 1}`}
                  disabled={pending}
                />
                <button
                  type="button"
                  className="text-rose-500 hover:text-rose-600"
                  onClick={() => {
                    const next = (config.options ?? []).filter(
                      (_, idx) => idx !== oi,
                    );
                    setConfig({ ...config, options: next });
                  }}
                  aria-label="Remove option"
                  disabled={pending}
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
                setConfig({
                  ...config,
                  options: [...(config.options ?? []), ""],
                })
              }
              disabled={pending}
            >
              <Plus className="h-3 w-3" />
              Add option
            </Button>
          </div>
        )}

        {type === "rating" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SmallField label="Min">
              <Input
                type="number"
                value={config.scale_min ?? 1}
                onChange={(e) =>
                  setConfig({ ...config, scale_min: Number(e.target.value) || 1 })
                }
                disabled={pending}
              />
            </SmallField>
            <SmallField label="Max">
              <Input
                type="number"
                value={config.scale_max ?? 5}
                onChange={(e) =>
                  setConfig({ ...config, scale_max: Number(e.target.value) || 5 })
                }
                disabled={pending}
              />
            </SmallField>
            <SmallField label="Low label">
              <Input
                value={config.scale_label_low ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, scale_label_low: e.target.value })
                }
                placeholder="Strongly disagree"
                disabled={pending}
              />
            </SmallField>
            <SmallField label="High label">
              <Input
                value={config.scale_label_high ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, scale_label_high: e.target.value })
                }
                placeholder="Strongly agree"
                disabled={pending}
              />
            </SmallField>
          </div>
        )}

        <label className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            disabled={pending}
          />
          Required
        </label>
      </div>

      {error && (
        <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-3">{footer}</div>
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
    return {
      options: prev.options && prev.options.length ? prev.options : ["", ""],
    };
  }
  return {};
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

function ResponsesTable({
  responses,
  questions,
}: {
  responses: SurveyResponseWithAnswers[];
  questions: DbHrSurveyQuestion[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const qById = new Map(questions.map((q) => [q.id, q]));

  const onDelete = (
    e: React.MouseEvent,
    r: SurveyResponseWithAnswers,
  ) => {
    e.stopPropagation();
    const who = r.is_anonymous
      ? "this anonymous response"
      : `the response from ${r.respondent_name ?? r.respondent_email ?? "this respondent"}`;
    if (
      !confirm(
        `Delete ${who}? It will be hidden from results but kept for audit. You can restore it from the Deleted Responses panel below.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteResponse(r.id);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  };

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
            <th className="px-3 py-2 text-right" aria-label="Actions" />
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
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => onDelete(e, r)}
                      disabled={pending}
                      title="Delete this response"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
                      aria-label="Delete response"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="border-b border-border/50 bg-surface-alt/20">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {r.answers.map((a, i) => {
                          const q = qById.get(a.question_id);
                          return (
                            <div key={a.id} className="flex flex-col">
                              <div className="text-[11px] font-medium text-muted-foreground">
                                Q{i + 1}.{" "}
                                {q ? q.prompt : "(question removed)"}
                                {q?.archived_at && (
                                  <span className="ml-1 text-[10px] italic">
                                    (archived)
                                  </span>
                                )}
                              </div>
                              <div className="text-[13px]">
                                {q ? renderAnswer(q, a) : renderAnswerRaw(a)}
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

function renderAnswerRaw(a: DbHrSurveyAnswer): string {
  if (a.value_text) return a.value_text;
  if (a.value_choice) return a.value_choice;
  if (a.value_choices && a.value_choices.length > 0)
    return a.value_choices.join(", ");
  if (a.value_number !== null && a.value_number !== undefined)
    return String(a.value_number);
  return "—";
}
