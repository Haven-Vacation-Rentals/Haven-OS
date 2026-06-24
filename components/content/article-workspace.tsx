"use client";

/**
 * Haven OS — Ad workspace.
 *
 * Single-column editor for one ad card. Tabs:
 *   Script        — the live script editor (PostCanvas).
 *   Creative brief — hook, primary text, CTA, format, budget.
 *
 * Strategy metadata (assignee, stage, channel, draft due, launch date)
 * lives in the header so it stays visible while writing. There is no
 * SEO/GEO scoring or WordPress publishing — this is a paid-ads project
 * space, not a blog.
 */

import {
  useEffect,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Save,
  FileText,
  ClipboardList,
  UserRound,
  CalendarClock,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  setTopicOwner,
  setTopicStage,
  updateArticle,
  updateTopic,
} from "@/lib/content/actions";
import {
  AD_FORMATS,
  CHANNEL_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  type AdChannel,
  type ContentArticle,
  type ContentAssignee,
  type ContentTopicStage,
  type TopicWithArticle,
} from "@/lib/content/types";
import { PostCanvas } from "@/components/content/post-canvas";

type Tab = "script" | "brief";

export function ArticleWorkspace({
  topic,
  article,
  assignees,
}: {
  topic: TopicWithArticle;
  article: ContentArticle;
  assignees: ContentAssignee[];
}) {
  const [tab, setTab] = useState<Tab>("script");

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceHeader topic={topic} article={article} assignees={assignees} />
      <Tabs tab={tab} setTab={setTab} />
      {tab === "script" ? (
        <PostCanvas article={article} />
      ) : (
        <CreativeBriefView article={article} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header — name, channel, stage, assignee, dates
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
  const [title, setTitle] = useState(topic.title);

  // Re-seed local state when the card changes upstream.
  useEffect(() => setTitle(topic.title), [topic.title]);

  function save() {
    startTransition(async () => {
      // Keep the card name and the article title in sync so the board
      // and the workspace agree.
      const [t, a] = await Promise.all([
        updateTopic(topic.id, { title }),
        updateArticle(article.id, { title }),
      ]);
      if (!t.ok || !a.ok) {
        toast.error((!t.ok && t.error) || (!a.ok && a.error) || "Save failed");
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

  function changeChannel(channel: AdChannel) {
    startTransition(async () => {
      const r = await updateTopic(topic.id, { channel });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Channel updated");
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
      toast.success(field === "due_date" ? "Draft due saved" : "Launch date saved");
      router.refresh();
    });
  }

  const dirty = title !== topic.title;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-haven-coral">
          <Megaphone className="h-3.5 w-3.5" />
          {CHANNEL_LABELS[topic.channel]}
          {article.ad_format ? (
            <span className="text-muted-foreground"> · {article.ad_format}</span>
          ) : null}
        </div>
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

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent font-heading text-display-2 font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Ad name"
      />

      {/* Strategy metadata strip — channel, stage, assignee, dates. */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetaField
          label="Channel"
          icon={Radio}
          control={
            <select
              value={topic.channel}
              onChange={(e) => changeChannel(e.target.value as AdChannel)}
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px] font-semibold"
            >
              {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          }
        />
        <MetaField
          label="Stage"
          icon={Megaphone}
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
          label="Draft due"
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
          label="Launch date"
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
    { id: "script", label: "Script", icon: FileText },
    { id: "brief", label: "Creative brief", icon: ClipboardList },
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
// Creative brief
// ---------------------------------------------------------------------------

function CreativeBriefView({ article }: { article: ContentArticle }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hook, setHook] = useState(article.hook);
  const [primaryText, setPrimaryText] = useState(article.primary_text);
  const [cta, setCta] = useState(article.cta);
  const [adFormat, setAdFormat] = useState(article.ad_format);
  const [budget, setBudget] = useState(article.budget);

  useEffect(() => setHook(article.hook), [article.hook]);
  useEffect(() => setPrimaryText(article.primary_text), [article.primary_text]);
  useEffect(() => setCta(article.cta), [article.cta]);
  useEffect(() => setAdFormat(article.ad_format), [article.ad_format]);
  useEffect(() => setBudget(article.budget), [article.budget]);

  const dirty =
    hook !== article.hook ||
    primaryText !== article.primary_text ||
    cta !== article.cta ||
    adFormat !== article.ad_format ||
    budget !== article.budget;

  function save() {
    startTransition(async () => {
      const r = await updateArticle(article.id, {
        hook,
        primary_text: primaryText,
        cta,
        ad_format: adFormat,
        budget,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Creative brief saved");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-card border border-border bg-surface p-3">
        <div className="text-[12px] text-muted-foreground">
          The creative brief — hook, primary text, CTA, format, and budget.
          These show on the card and travel with the script.
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={pending || !dirty}>
          <Save className="h-3.5 w-3.5" />
          {pending ? "Saving…" : "Save brief"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-5 lg:grid-cols-2">
        <BriefField label="Hook">
          <textarea
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            rows={2}
            placeholder="The first 3 seconds — what stops the scroll?"
            className="w-full resize-none rounded-md border border-border bg-surface-alt/30 p-2 text-[13px] leading-5 text-foreground outline-none focus:border-haven-coral/40"
          />
        </BriefField>
        <BriefField label="Call to action">
          <input
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="e.g. Book direct — see October dates"
            className="h-9 w-full rounded-md border border-border bg-surface-alt/30 px-2 text-[13px] text-foreground outline-none focus:border-haven-coral/40"
          />
        </BriefField>
        <BriefField label="Primary text / caption" full>
          <textarea
            value={primaryText}
            onChange={(e) => setPrimaryText(e.target.value)}
            rows={4}
            placeholder="The body copy that runs with the creative."
            className="w-full resize-y rounded-md border border-border bg-surface-alt/30 p-2 text-[13px] leading-6 text-foreground outline-none focus:border-haven-coral/40"
          />
        </BriefField>
        <BriefField label="Format">
          <select
            value={adFormat}
            onChange={(e) => setAdFormat(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-surface px-2 text-[13px] text-foreground"
          >
            <option value="">— Not set —</option>
            {AD_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </BriefField>
        <BriefField label="Budget">
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. $50/day"
            className="h-9 w-full rounded-md border border-border bg-surface-alt/30 px-2 text-[13px] text-foreground outline-none focus:border-haven-coral/40"
          />
        </BriefField>
      </div>
    </div>
  );
}

function BriefField({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "lg:col-span-2")}>
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
