"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  Wand2,
  FileText,
  ListChecks,
  BookOpen,
  Cloud,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyAgentSuggestion,
  createResearch,
  queueWordPressDraft,
  runArticleScorers,
  sendAgentPrompt,
  setTopicStage,
  updateArticle,
} from "@/lib/content/actions";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type ContentAgentMessage,
  type ContentArticle,
  type ContentCheck,
  type ContentGeoCheck,
  type ContentPublishJob,
  type ContentResearchSource,
  type ContentSeoCheck,
  type ContentTopicStage,
  type TopicWithArticle,
} from "@/lib/content/types";

type Tab = "draft" | "brief" | "outline" | "scorecards" | "sources" | "publish";

export function ArticleWorkspace({
  topic,
  article,
  messages,
  sources,
  seo,
  geo,
  jobs,
  wpConfigured,
}: {
  topic: TopicWithArticle;
  article: ContentArticle;
  messages: ContentAgentMessage[];
  sources: ContentResearchSource[];
  seo: ContentSeoCheck | null;
  geo: ContentGeoCheck | null;
  jobs: ContentPublishJob[];
  wpConfigured: boolean;
}) {
  const [tab, setTab] = useState<Tab>("draft");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <AgentChat
        article={article}
        initialMessages={messages}
        seoScore={article.seo_score}
        geoScore={article.geo_score}
      />
      <div className="flex min-w-0 flex-col gap-4">
        <WorkspaceHeader topic={topic} article={article} />
        <Tabs tab={tab} setTab={setTab} />
        {tab === "draft" ? (
          <DraftEditor article={article} />
        ) : tab === "brief" ? (
          <PlainEditor
            article={article}
            field="brief_md"
            label="Brief"
            placeholder="Audience, goal, primary keyword, must-include data points, soft CTA, sign-off."
          />
        ) : tab === "outline" ? (
          <PlainEditor
            article={article}
            field="outline_md"
            label="Outline"
            placeholder="Section headings + the operator point each one is making."
          />
        ) : tab === "scorecards" ? (
          <ScorecardsView article={article} seo={seo} geo={geo} />
        ) : tab === "sources" ? (
          <SourcesView topicId={topic.id} sources={sources} />
        ) : (
          <PublishView
            article={article}
            jobs={jobs}
            wpConfigured={wpConfigured}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header — title, meta, stage controls
// ---------------------------------------------------------------------------

function WorkspaceHeader({
  topic,
  article,
}: {
  topic: TopicWithArticle;
  article: ContentArticle;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(article.title);
  const [meta, setMeta] = useState(article.meta_description);
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

  const dirty = title !== article.title || meta !== article.meta_description;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {topic.target_keyword
            ? `Keyword: ${topic.target_keyword}`
            : "No target keyword"}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={topic.stage}
            onChange={(e) => moveStage(e.target.value as ContentTopicStage)}
            className="h-7 rounded-md border border-border bg-surface px-2 text-[11.5px] font-semibold"
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
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
        className="w-full bg-transparent font-heading text-display-4 font-bold text-foreground outline-none placeholder:text-muted-foreground"
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
        className="mt-3 w-full resize-none rounded-md border border-border bg-surface-alt/30 p-2 text-[13px] text-foreground outline-none focus:border-haven-coral/40"
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
    </div>
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
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "draft", label: "Draft", icon: FileText },
    { id: "brief", label: "Brief", icon: BookOpen },
    { id: "outline", label: "Outline", icon: ListChecks },
    { id: "scorecards", label: "SEO & GEO", icon: Sparkles },
    { id: "sources", label: "Sources", icon: BookOpen },
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
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold",
              active
                ? "bg-accent-soft text-haven-coral-700"
                : "text-muted-foreground hover:text-foreground",
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
// Draft editor
// ---------------------------------------------------------------------------

function DraftEditor({ article }: { article: ContentArticle }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState(article.body_md);
  const dirty = body !== article.body_md;

  // Re-sync when the underlying article changes (e.g. after agent suggestion applied)
  useEffect(() => {
    setBody(article.body_md);
  }, [article.body_md]);

  function save() {
    startTransition(async () => {
      const r = await updateArticle(article.id, { body_md: body });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Draft saved");
      router.refresh();
    });
  }

  const wc = countWords(body);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {wc} words · {Math.max(1, Math.round(wc / 220))} min read
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={pending || !dirty}
        >
          <Save className="h-3.5 w-3.5" />
          Save draft
        </Button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[640px] w-full rounded-card border border-border bg-surface p-5 font-mono text-[13px] leading-6 text-foreground outline-none focus:border-haven-coral/40"
        placeholder="# Section heading\n\nFirst-person Jack Zoppa, operator credibility, no em dashes, no exclamations."
        spellCheck
      />
    </div>
  );
}

function PlainEditor({
  article,
  field,
  label,
  placeholder,
}: {
  article: ContentArticle;
  field: "brief_md" | "outline_md";
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(article[field]);
  const dirty = value !== article[field];

  useEffect(() => {
    setValue(article[field]);
  }, [article, field]);

  function save() {
    startTransition(async () => {
      const r = await updateArticle(article.id, { [field]: value });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`${label} saved`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">{label}</span>
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
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[400px] w-full rounded-card border border-border bg-surface p-4 font-mono text-[13px] leading-6 text-foreground outline-none focus:border-haven-coral/40"
        placeholder={placeholder}
      />
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
// Sources
// ---------------------------------------------------------------------------

function SourcesView({
  topicId,
  sources,
}: {
  topicId: string;
  sources: ContentResearchSource[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [finding, setFinding] = useState("");
  const [dataPoint, setDataPoint] = useState("");
  const [url, setUrl] = useState("");
  const [publisher, setPublisher] = useState("");

  function add() {
    if (!finding.trim()) {
      toast.error("Finding is required");
      return;
    }
    startTransition(async () => {
      const r = await createResearch({
        topic_id: topicId,
        finding: finding.trim(),
        data_point: dataPoint.trim() || undefined,
        url: url.trim() || undefined,
        publisher: publisher.trim() || undefined,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setFinding("");
      setDataPoint("");
      setUrl("");
      setPublisher("");
      toast.success("Source added");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Add source
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Input
            value={finding}
            onChange={(e) => setFinding(e.target.value)}
            placeholder="Finding (what does this source tell us?)"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={dataPoint}
              onChange={(e) => setDataPoint(e.target.value)}
              placeholder="Data point (e.g. ADR $310-$360)"
            />
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Publisher"
            />
          </div>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL"
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={add}
              disabled={pending}
            >
              <Plus className="h-3.5 w-3.5" />
              Add source
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface">
        {sources.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            No sources tracked yet. Add at least 2 to satisfy the SEO and
            GEO scorecards.
          </div>
        ) : (
          sources.map((s) => (
            <div
              key={s.id}
              className="border-b border-border/60 px-4 py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13.5px] font-semibold text-foreground">
                  {s.finding}
                </div>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-haven-coral hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {s.data_point ? (
                  <span className="rounded-full border border-border bg-surface-alt/40 px-2 py-0.5 font-semibold text-foreground/80">
                    {s.data_point}
                  </span>
                ) : null}
                {s.publisher ? <span>· {s.publisher}</span> : null}
                {s.is_verified ? (
                  <span className="text-emerald-600">· verified</span>
                ) : (
                  <span>· not verified</span>
                )}
              </div>
            </div>
          ))
        )}
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

// ---------------------------------------------------------------------------
// Agent chat
// ---------------------------------------------------------------------------

function AgentChat({
  article,
  initialMessages,
  seoScore,
  geoScore,
}: {
  article: ContentArticle;
  initialMessages: ContentAgentMessage[];
  seoScore: number | null;
  geoScore: number | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContentAgentMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(prompt: string) {
    if (!prompt.trim()) return;
    setSending(true);
    try {
      const r = await sendAgentPrompt({
        article_id: article.id,
        prompt: prompt.trim(),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setMessages((m) => [...m, r.data.user_message, r.data.agent_message]);
      setInput("");
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function apply(messageId: string) {
    const r = await applyAgentSuggestion(messageId);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success("Applied to article");
    router.refresh();
  }

  return (
    <div className="flex h-[860px] flex-col rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-haven-coral">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12.5px] font-bold text-foreground">
              Content agent
            </div>
            <div className="text-[10.5px] text-muted-foreground">
              Local fallback active
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold">
          <ScoreTab label="SEO" score={seoScore} />
          <ScoreTab label="GEO" score={geoScore} />
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <Sparkles className="h-5 w-5 text-haven-coral" />
            <div className="text-[12.5px] font-semibold text-foreground">
              Ask the agent for an edit
            </div>
            <div className="max-w-[260px] text-[11px] text-muted-foreground">
              Try: "set the title to ...", "add a section about pricing
              cadence", "score this", "add the Jack sign-off".
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} onApply={apply} />
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Agent is thinking
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Tell the agent what to change…"
            className="flex-1 rounded-md border border-border bg-surface-alt/30 px-2.5 py-2 text-[13px] outline-none focus:border-haven-coral/40"
            disabled={sending}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => void send(input)}
            disabled={sending || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Score this", "Add Jack sign-off", "Remove em dashes"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              disabled={sending}
              className="rounded-full border border-border bg-surface-alt/30 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground hover:bg-surface-alt"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreTab({ label, score }: { label: string; score: number | null }) {
  if (score === null)
    return (
      <span className="rounded-md border border-border bg-surface-alt px-1.5 py-0.5 text-muted-foreground">
        {label} —
      </span>
    );
  const tone =
    score >= 85
      ? "bg-emerald-100 text-emerald-800"
      : score >= 65
        ? "bg-amber-100 text-amber-800"
        : "bg-haven-coral/15 text-haven-coral-700";
  return (
    <span className={cn("rounded-md px-1.5 py-0.5", tone)}>
      {label} {score}
    </span>
  );
}

function ChatBubble({
  message,
  onApply,
}: {
  message: ContentAgentMessage;
  onApply: (id: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-md px-3 py-2 text-[13px] leading-5",
          isUser
            ? "bg-accent-soft text-foreground"
            : "border border-border bg-surface-alt/40 text-foreground",
        )}
      >
        <div>{message.content}</div>
        {!isUser && message.suggestion ? (
          <div className="mt-2">
            {message.applied ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Applied
              </span>
            ) : message.suggestion.kind === "note" ? null : (
              <button
                type="button"
                onClick={() => onApply(message.id)}
                className="rounded-md bg-haven-coral px-2 py-1 text-[11px] font-bold text-white hover:brightness-95"
              >
                Apply suggestion
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function countWords(s: string): number {
  if (!s) return 0;
  return s
    .replace(/[#>*_`~\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
