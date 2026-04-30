"use client";

/**
 * Haven OS — Article workspace.
 *
 * Single-column editor for a content topic. Tabs:
 *   Post — the live editor.
 *   SEO & GEO — scorecard.
 *   Publish — WordPress draft queue + history.
 *
 * Strategy metadata (assignee, stage, due date, publish target) lives
 * in the header so it stays visible while editing. The Content agent
 * panel is intentionally absent — Content Studio is a tracker + editor,
 * not an agent surface.
 */

import {
  useEffect,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  Wand2,
  FileText,
  Cloud,
  ExternalLink,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  optimizeArticleSeo,
  queueWordPressDraft,
  runArticleScorers,
  setTopicOwner,
  setTopicStage,
  updateArticle,
  updateTopic,
} from "@/lib/content/actions";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type ContentArticle,
  type ContentAssignee,
  type ContentCheck,
  type ContentGeoCheck,
  type ContentPublishJob,
  type ContentSeoCheck,
  type ContentTopicStage,
  type TopicWithArticle,
} from "@/lib/content/types";
import { PostCanvas } from "@/components/content/post-canvas";

type Tab = "post" | "scorecards" | "publish";

export function ArticleWorkspace({
  topic,
  article,
  seo,
  geo,
  jobs,
  wpConfigured,
  assignees,
}: {
  topic: TopicWithArticle;
  article: ContentArticle;
  seo: ContentSeoCheck | null;
  geo: ContentGeoCheck | null;
  jobs: ContentPublishJob[];
  wpConfigured: boolean;
  assignees: ContentAssignee[];
}) {
  const [tab, setTab] = useState<Tab>("post");

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceHeader topic={topic} article={article} assignees={assignees} />
      <Tabs tab={tab} setTab={setTab} />
      {tab === "post" ? (
        <PostCanvas article={article} />
      ) : tab === "scorecards" ? (
        <ScorecardsView article={article} seo={seo} geo={geo} />
      ) : (
        <PublishView
          article={article}
          jobs={jobs}
          wpConfigured={wpConfigured}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header — title, meta, stage, assignee, dates
// ---------------------------------------------------------------------------

function WorkspaceHeader({
  topic,
  article,
  assignees,
}: {
  topic: TopicWithArticle;
  article: ContentArticle;
  assignees: ContentAssignee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimizing, setOptimizing] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [meta, setMeta] = useState(article.meta_description);

  function optimize() {
    setOptimizing(true);
    startTransition(async () => {
      const r = await optimizeArticleSeo({ article_id: article.id });
      setOptimizing(false);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const before = r.data.before;
      const after = r.data.after;
      const seoDelta =
        before.seo === null ? after.seo : after.seo - before.seo;
      const geoDelta =
        before.geo === null ? after.geo : after.geo - before.geo;
      toast.success(
        `Optimized · SEO ${after.seo}${
          before.seo !== null ? ` (${seoDelta >= 0 ? "+" : ""}${seoDelta})` : ""
        } · GEO ${after.geo}${
          before.geo !== null ? ` (${geoDelta >= 0 ? "+" : ""}${geoDelta})` : ""
        }`,
      );
      router.refresh();
    });
  }

  // Re-seed local state when the article changes upstream.
  useEffect(() => setTitle(article.title), [article.title]);
  useEffect(() => setMeta(article.meta_description), [article.meta_description]);

  const titleLen = title.length;
  const metaLen = meta.length;
  const titleOk = titleLen >= 50 && titleLen <= 70;
  const metaOk = metaLen >= 150 && metaLen <= 160;

  function save() {
    startTransition(async () => {
      const r = await updateArticle(article.id, {
        title,
        meta_description: meta,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  }

  function moveStage(stage: ContentTopicStage) {
    startTransition(async () => {
      const r = await setTopicStage(topic.id, stage);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Moved to ${STAGE_LABELS[stage]}`);
      router.refresh();
    });
  }

  function changeOwner(ownerId: string | null) {
    startTransition(async () => {
      const r = await setTopicOwner(topic.id, ownerId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(ownerId ? "Assignee updated" : "Assignee cleared");
      router.refresh();
    });
  }

  function changeDate(field: "due_date" | "publish_target", value: string) {
    startTransition(async () => {
      const r = await updateTopic(topic.id, {
        [field]: value || null,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(field === "due_date" ? "Due date saved" : "Publish date saved");
      router.refresh();
    });
  }

  const dirty = title !== article.title || meta !== article.meta_description;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {topic.target_keyword
            ? `Keyword: ${topic.target_keyword}`
            : "No target keyword"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={optimize}
            disabled={pending || optimizing}
            title="Apply a full SEO/GEO pass: title, meta, structure, voice, CTA, sign-off."
          >
            <Wand2 className="h-3.5 w-3.5" />
            {optimizing ? "Optimizing…" : "Optimize for SEO"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={save}
            disabled={pending || !dirty}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent font-heading text-display-2 font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Article title"
      />
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "font-semibold",
            titleOk ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {titleLen} / 50–70 chars
        </span>
      </div>

      <textarea
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        rows={2}
        className="mt-3 w-full resize-none rounded-md border border-border bg-surface-alt/30 p-2 text-[13px] leading-5 text-foreground outline-none focus:border-haven-coral/40"
        placeholder="Meta description (150–160 chars)"
      />
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "font-semibold",
            metaOk ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {metaLen} / 150–160 chars
        </span>
      </div>

      {/* Strategy metadata strip — assignee, stage, dates. Kept on the
          header so the editor below stays focused on the post. */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaField
          label="Assignee"
          icon={UserRound}
          control={
            <select
              value={topic.owner_id ?? ""}
              onChange={(e) => changeOwner(e.target.value || null)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px] font-medium"
            >
              <option value="">— Unassigned —</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.email}
                </option>
              ))}
            </select>
          }
        />
        <MetaField
          label="Stage"
          icon={Sparkles}
          control={
            <select
              value={topic.stage}
              onChange={(e) => moveStage(e.target.value as ContentTopicStage)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px] font-semibold"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          }
        />
        <MetaField
          label="Due"
          icon={CalendarClock}
          control={
            <input
              type="date"
              value={topic.due_date ?? ""}
              onChange={(e) => changeDate("due_date", e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px]"
            />
          }
        />
        <MetaField
          label="Publish target"
          icon={CalendarClock}
          control={
            <input
              type="date"
              value={topic.publish_target ?? ""}
              onChange={(e) => changeDate("publish_target", e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px]"
            />
          }
        />
      </div>
    </div>
  );
}

function MetaField({
  label,
  icon: Icon,
  control,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  control: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      {control}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function Tabs({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const items: {
    id: Tab;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }[] = [
    { id: "post", label: "Post", icon: FileText },
    { id: "scorecards", label: "SEO & GEO", icon: Sparkles },
    { id: "publish", label: "Publish", icon: Cloud },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border pb-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setTab(it.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition",
              active
                ? "bg-accent-soft text-haven-coral-700"
                : "text-muted-foreground hover:bg-surface-alt/60 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scorecards
// ---------------------------------------------------------------------------

function ScorecardsView({
  article,
  seo,
  geo,
}: {
  article: ContentArticle;
  seo: ContentSeoCheck | null;
  geo: ContentGeoCheck | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function rerun() {
    startTransition(async () => {
      const r = await runArticleScorers(article.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Scorers re-run");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-card border border-border bg-surface p-3">
        <div className="text-[12px] text-muted-foreground">
          Local SEO + GEO scorers. Re-run after edits to refresh the
          scorecard. Last run is shown below.
        </div>
        <Button variant="primary" size="sm" onClick={rerun} disabled={pending}>
          <Wand2 className="h-3.5 w-3.5" />
          {pending ? "Running…" : "Run scorers"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreCard title="SEO" score={seo?.score ?? null} checks={seo?.checks ?? []} />
        <ScoreCard
          title="GEO / AI ranking"
          score={geo?.score ?? null}
          checks={geo?.checks ?? []}
        />
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  checks,
}: {
  title: string;
  score: number | null;
  checks: ContentCheck[];
}) {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="font-heading text-base font-bold text-foreground">{title}</div>
        <ScoreDial score={score} />
      </div>
      <div className="flex flex-col">
        {checks.length === 0 ? (
          <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
            Run the scorers to populate this card.
          </div>
        ) : (
          checks.map((c) => <CheckRow key={c.id} check={c} />)
        )}
      </div>
    </div>
  );
}

function ScoreDial({ score }: { score: number | null }) {
  if (score === null)
    return (
      <span className="text-[11px] text-muted-foreground">Not scored yet</span>
    );
  const tone =
    score >= 85
      ? "text-emerald-600"
      : score >= 65
        ? "text-amber-600"
        : "text-haven-coral";
  return (
    <span className={cn("font-heading text-2xl font-bold", tone)}>{score}</span>
  );
}

function CheckRow({ check }: { check: ContentCheck }) {
  const Icon = check.ok
    ? CheckCircle2
    : check.severity === "blocker"
      ? AlertTriangle
      : Info;
  const tone = check.ok
    ? "text-emerald-600"
    : check.severity === "blocker"
      ? "text-haven-coral"
      : "text-amber-600";
  return (
    <div className="flex items-start gap-2.5 border-b border-border/60 px-4 py-2.5 last:border-b-0">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-foreground">
          {check.label}
        </div>
        {check.detail || check.hint ? (
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {check.detail ?? check.hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

function PublishView({
  article,
  jobs,
  wpConfigured,
}: {
  article: ContentArticle;
  jobs: ContentPublishJob[];
  wpConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function queue() {
    startTransition(async () => {
      const r = await queueWordPressDraft(article.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (
        r.data.status === "credentials_missing" ||
        r.data.status === "blocked"
      ) {
        toast.warning(`Job ${r.data.status.replace("_", " ")}`);
      } else {
        toast.success("WordPress draft created");
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-heading text-base font-bold text-foreground">
              WordPress draft
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Creates a DRAFT post on havenvacationrentals.com. Never
              publishes directly. If credentials are missing the job is
              recorded with status <code>credentials_missing</code> and the
              article stays here in Haven OS.
            </p>
            <div className="mt-2 text-[11px]">
              <span className="text-muted-foreground">WordPress: </span>
              <span
                className={
                  wpConfigured ? "text-emerald-600" : "text-amber-600"
                }
              >
                {wpConfigured ? "configured" : "credentials missing"}
              </span>
            </div>
          </div>
          <Button variant="primary" onClick={queue} disabled={pending}>
            <Cloud className="h-4 w-4" />
            {pending ? "Working…" : "Queue WordPress draft"}
          </Button>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Publish history
        </div>
        {jobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            No publish jobs yet.
          </div>
        ) : (
          jobs.map((j) => (
            <div
              key={j.id}
              className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
            >
              <div>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <StatusBadge status={j.status} />
                  <span>{new Date(j.created_at).toLocaleString()}</span>
                </div>
                {j.error_message ? (
                  <div className="mt-1 line-clamp-2 text-[11.5px] text-haven-coral">
                    {j.error_message}
                  </div>
                ) : null}
              </div>
              {j.wp_draft_url ? (
                <a
                  href={j.wp_draft_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-haven-coral hover:underline"
                >
                  Open in WP
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ContentPublishJob["status"] }) {
  const tone =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "credentials_missing"
        ? "bg-amber-100 text-amber-800"
        : status === "blocked" || status === "failed"
          ? "bg-haven-coral/15 text-haven-coral-700"
          : "bg-surface-alt text-foreground/80";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
