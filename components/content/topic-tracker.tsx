"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  KanbanSquare,
  ListIcon,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PILLAR_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  type ContentPillar,
  type ContentPriority,
  type ContentSpace,
  type ContentTopicStage,
  type TopicWithArticle,
} from "@/lib/content/types";
import { setTopicStage } from "@/lib/content/actions";
import { CreateTopicDialog } from "@/components/content/create-topic-dialog";
import { StudioChat } from "@/components/content/studio-chat";

type View = "pipeline" | "list" | "calendar";

const PRIORITY_TONE: Record<ContentPriority, string> = {
  urgent: "bg-haven-coral/15 text-haven-coral-700 border-haven-coral/40",
  high: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
  medium: "bg-surface-alt text-foreground/70 border-border",
  low: "bg-surface-alt text-muted-foreground border-border",
};

const STAGE_TONE: Record<ContentTopicStage, string> = {
  idea: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200",
  research:
    "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200",
  brief:
    "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200",
  outline:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200",
  draft:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
  optimize:
    "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200",
  review:
    "bg-haven-coral/10 text-haven-coral-700 border-haven-coral/30",
  wordpress_draft:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200",
  published:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100",
  monitor:
    "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200",
  archived:
    "bg-surface-alt text-muted-foreground border-border opacity-70",
};

export function TopicTracker({
  space,
  topics,
}: {
  space: ContentSpace;
  topics: TopicWithArticle[];
}) {
  const [view, setView] = useState<View>("pipeline");
  const [createOpen, setCreateOpen] = useState(false);
  const [pillarFilter, setPillarFilter] = useState<ContentPillar | "all">("all");

  // Local board state so DnD updates feel instant. Resyncs whenever the
  // server-rendered topics change (after revalidation).
  const [board, setBoard] = useState<TopicWithArticle[]>(topics);
  useEffect(() => {
    setBoard(topics);
  }, [topics]);

  const filtered = useMemo(() => {
    return board.filter(
      (t) =>
        t.stage !== "archived" &&
        (pillarFilter === "all" || t.pillar === pillarFilter),
    );
  }, [board, pillarFilter]);

  const moveTopic = (topicId: string, nextStage: ContentTopicStage) => {
    setBoard((curr) =>
      curr.map((t) => (t.id === topicId ? { ...t, stage: nextStage } : t)),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <StudioChat
        spaceId={space.id}
        onAdvancedTopic={() => setCreateOpen(true)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <PillarFilter value={pillarFilter} setValue={setPillarFilter} />
        </div>
        <Button variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Advanced form
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : view === "pipeline" ? (
        <PipelineView topics={filtered} onMove={moveTopic} />
      ) : view === "list" ? (
        <ListView topics={filtered} />
      ) : (
        <CalendarView topics={filtered} />
      )}

      <CreateTopicDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        spaceId={space.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function ViewToggle({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  const items: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
    { id: "list", label: "List", icon: ListIcon },
    { id: "calendar", label: "Calendar", icon: Calendar },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-alt/40 p-0.5">
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setView(it.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold",
              active
                ? "bg-surface text-foreground shadow-sm"
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

function PillarFilter({
  value,
  setValue,
}: {
  value: ContentPillar | "all";
  setValue: (v: ContentPillar | "all") => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value as ContentPillar | "all")}
      className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] font-medium text-foreground"
    >
      <option value="all">All pillars</option>
      {Object.entries(PILLAR_LABELS).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------

function PipelineView({
  topics,
  onMove,
}: {
  topics: TopicWithArticle[];
  onMove: (topicId: string, stage: ContentTopicStage) => void;
}) {
  const router = useRouter();
  const stages = STAGE_ORDER.filter((s) => s !== "monitor");
  const grouped = new Map<ContentTopicStage, TopicWithArticle[]>();
  for (const s of stages) grouped.set(s, []);
  for (const t of topics) {
    if (grouped.has(t.stage)) grouped.get(t.stage)!.push(t);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTopic = activeId
    ? topics.find((t) => t.id === activeId) ?? null
    : null;

  // 6px activation distance keeps clicks → navigation working; small
  // movements past that threshold start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragCancel = () => setActiveId(null);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const topicId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // Resolve drop target → stage. Columns use stage id; cards expose
    // their own stage via data.current.
    let nextStage: ContentTopicStage | null = null;
    if ((stages as string[]).includes(overId)) {
      nextStage = overId as ContentTopicStage;
    } else {
      const overStage = e.over?.data.current?.stage as
        | ContentTopicStage
        | undefined;
      if (overStage) nextStage = overStage;
    }
    if (!nextStage) return;

    const topic = topics.find((t) => t.id === topicId);
    if (!topic || topic.stage === nextStage) return;

    const prevStage = topic.stage;
    onMove(topicId, nextStage);

    void (async () => {
      const result = await setTopicStage(topicId, nextStage);
      if (!result.ok) {
        onMove(topicId, prevStage);
        toast.error(result.error || "Failed to move topic");
        return;
      }
      toast.success(`Moved to ${STAGE_LABELS[nextStage]}`);
      // Refresh server data so other views see the new stage.
      router.refresh();
    })();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {stages.map((stage) => {
            const items = grouped.get(stage) ?? [];
            return (
              <PipelineColumn
                key={stage}
                stage={stage}
                items={items}
                activeId={activeId}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTopic ? <TopicCard topic={activeTopic} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function PipelineColumn({
  stage,
  items,
  activeId,
}: {
  stage: ContentTopicStage;
  items: TopicWithArticle[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[260px] shrink-0 flex-col gap-2 rounded-card border bg-surface-alt/30 p-2 transition-colors",
        isOver
          ? "border-haven-coral/50 bg-accent-soft/30 ring-1 ring-haven-coral/30"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
            STAGE_TONE[stage],
          )}
        >
          {STAGE_LABELS[stage]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="flex min-h-[40px] flex-col gap-2">
        {items.map((t) => (
          <DraggableTopicCard
            key={t.id}
            topic={t}
            stage={stage}
            isOverlayActive={activeId === t.id}
          />
        ))}
        {items.length === 0 ? (
          <div
            className={cn(
              "rounded-md border border-dashed py-6 text-center text-[11px] transition-colors",
              isOver
                ? "border-haven-coral/40 bg-accent-soft/30 text-haven-coral-700"
                : "border-border/60 bg-surface/40 text-muted-foreground",
            )}
          >
            {isOver ? "Drop here" : "Empty"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DraggableTopicCard({
  topic,
  stage,
  isOverlayActive,
}: {
  topic: TopicWithArticle;
  stage: ContentTopicStage;
  isOverlayActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: topic.id,
    data: { stage },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging || isOverlayActive ? 0.4 : 1 }}
      className="touch-none cursor-grab rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haven-coral/40 active:cursor-grabbing"
    >
      <TopicCard topic={topic} />
    </div>
  );
}

function TopicCard({
  topic,
  isOverlay,
}: {
  topic: TopicWithArticle;
  isOverlay?: boolean;
}) {
  // The whole card drags via PointerSensor with a 6px activation
  // distance, so a click still navigates. We use Link for native
  // accessibility (Enter, middle-click open in new tab, etc.).
  return (
    <Link
      href={`/content/${topic.id}` as never}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        "group flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3 shadow-card transition hover:border-haven-coral/40 hover:shadow-card-hover",
        isOverlay && "rotate-1 border-haven-coral/40 shadow-card-hover",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[13px] font-semibold text-foreground">
          {topic.title}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
            PRIORITY_TONE[topic.priority],
          )}
        >
          {topic.priority}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>{PILLAR_LABELS[topic.pillar]}</span>
        {topic.target_keyword ? (
          <>
            <span>·</span>
            <span className="truncate">{topic.target_keyword}</span>
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {topic.publish_target
            ? `Publish ${formatDate(topic.publish_target)}`
            : topic.due_date
              ? `Due ${formatDate(topic.due_date)}`
              : "—"}
        </span>
        <ScoreBadges
          seo={topic.article?.seo_score ?? null}
          geo={topic.article?.geo_score ?? null}
        />
      </div>
    </Link>
  );
}

function ScoreBadges({
  seo,
  geo,
}: {
  seo: number | null;
  geo: number | null;
}) {
  if (seo === null && geo === null) return null;
  return (
    <span className="flex items-center gap-1">
      {seo !== null ? <ScorePill label="SEO" value={seo} /> : null}
      {geo !== null ? <ScorePill label="GEO" value={geo} /> : null}
    </span>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 85
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : value >= 65
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
        : "bg-haven-coral/15 text-haven-coral-700";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-bold",
        tone,
      )}
    >
      {label} {value}
    </span>
  );
}

// ---------------------------------------------------------------------------

function ListView({ topics }: { topics: TopicWithArticle[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-alt/40 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Topic</th>
            <th className="px-3 py-2 text-left">Pillar</th>
            <th className="px-3 py-2 text-left">Stage</th>
            <th className="px-3 py-2 text-left">Priority</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-left">Publish</th>
            <th className="px-3 py-2 text-left">Scores</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => (
            <tr
              key={t.id}
              className="border-t border-border hover:bg-surface-alt/30"
            >
              <td className="max-w-[360px] px-3 py-2">
                <div className="line-clamp-1 font-semibold text-foreground">
                  {t.title}
                </div>
                {t.target_keyword ? (
                  <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    kw: {t.target_keyword}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {PILLAR_LABELS[t.pillar]}
              </td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                    STAGE_TONE[t.stage],
                  )}
                >
                  {STAGE_LABELS[t.stage]}
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                    PRIORITY_TONE[t.priority],
                  )}
                >
                  {t.priority}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {t.due_date ? formatDate(t.due_date) : "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {t.publish_target ? formatDate(t.publish_target) : "—"}
              </td>
              <td className="px-3 py-2">
                <ScoreBadges
                  seo={t.article?.seo_score ?? null}
                  geo={t.article?.geo_score ?? null}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/content/${t.id}` as never}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-haven-coral hover:underline"
                >
                  Open
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

function CalendarView({ topics }: { topics: TopicWithArticle[] }) {
  const today = new Date();
  const monthLabel = today.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= end.getDate(); d++) {
    days.push(new Date(today.getFullYear(), today.getMonth(), d));
  }
  const padStart = start.getDay();

  function topicsOn(d: Date): TopicWithArticle[] {
    const iso = d.toISOString().slice(0, 10);
    return topics.filter(
      (t) => t.publish_target === iso || (!t.publish_target && t.due_date === iso),
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-base font-bold">{monthLabel}</h3>
        <span className="text-[11px] text-muted-foreground">
          Items pinned to publish target (or due date if no publish target).
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="px-2 py-1 text-center font-semibold uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square rounded bg-transparent" />
        ))}
        {days.map((d) => {
          const items = topicsOn(d);
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "flex aspect-square flex-col gap-0.5 rounded border border-border/60 bg-surface-alt/30 p-1 text-left",
                isToday && "border-haven-coral/40 bg-accent-soft/20",
              )}
            >
              <span className="text-[10.5px] font-semibold text-muted-foreground">
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 2).map((t) => (
                  <Link
                    key={t.id}
                    href={`/content/${t.id}` as never}
                    className="line-clamp-1 rounded bg-haven-coral/15 px-1 py-0.5 text-[10px] font-semibold text-haven-coral-700 hover:bg-haven-coral/25"
                  >
                    {t.title}
                  </Link>
                ))}
                {items.length > 2 ? (
                  <span className="text-[9.5px] text-muted-foreground">
                    +{items.length - 2}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/40 px-6 py-14 text-center">
      <h3 className="font-heading text-lg text-foreground">
        No topics yet
      </h3>
      <p className="max-w-md text-[13px] text-muted-foreground">
        Tell the topic agent above what to write about, paste an existing
        draft to import, or tap "Research ideas" to pull a fresh seasonal
        list. The advanced form is here for full-control entry.
      </p>
      <Button variant="outline" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Advanced form
      </Button>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
