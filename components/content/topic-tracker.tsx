"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  KanbanSquare,
  ListIcon,
  ArrowRight,
  Trash2,
  AlertTriangle,
  UserRound,
  ClipboardPaste,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PILLAR_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  type ContentAssignee,
  type ContentPillar,
  type ContentPriority,
  type ContentSpace,
  type ContentTopicStage,
  type TopicWithArticle,
} from "@/lib/content/types";
import { deleteTopic, setTopicStage } from "@/lib/content/actions";
import { CreateTopicDialog } from "@/components/content/create-topic-dialog";
import { PasteDraftDialog } from "@/components/content/paste-draft-dialog";

type View = "pipeline" | "list" | "calendar";
type OwnerFilter = "all" | "unassigned" | string;

const PRIORITY_TONE: Record<ContentPriority, string> = {
  urgent: "bg-haven-coral/15 text-haven-coral-700 border-haven-coral/40",
  high: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
  medium: "bg-surface-alt text-foreground/70 border-border",
  low: "bg-surface-alt text-muted-foreground border-border",
};

const STAGE_TONE: Record<ContentTopicStage, string> = {
  idea: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200",
  in_progress:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200",
  draft:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
  complete:
    "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100",
  archived:
    "bg-surface-alt text-muted-foreground border-border opacity-70",
};

export function TopicTracker({
  space,
  topics,
  assignees,
}: {
  space: ContentSpace;
  topics: TopicWithArticle[];
  assignees: ContentAssignee[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("pipeline");
  const [createOpen, setCreateOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pillarFilter, setPillarFilter] = useState<ContentPillar | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<TopicWithArticle | null>(
    null,
  );
  const [, startTransition] = useTransition();

  // Local board state so DnD updates feel instant. Resyncs whenever the
  // server-rendered topics change (after revalidation).
  const [board, setBoard] = useState<TopicWithArticle[]>(topics);
  useEffect(() => {
    setBoard(topics);
  }, [topics]);

  const filtered = useMemo(() => {
    return board.filter((t) => {
      if (t.stage === "archived") return false;
      if (pillarFilter !== "all" && t.pillar !== pillarFilter) return false;
      if (ownerFilter === "unassigned" && t.owner_id) return false;
      if (ownerFilter !== "all" && ownerFilter !== "unassigned" && t.owner_id !== ownerFilter)
        return false;
      return true;
    });
  }, [board, pillarFilter, ownerFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const moveTopic = (topicId: string, nextStage: ContentTopicStage) => {
    setBoard((curr) =>
      curr.map((t) => (t.id === topicId ? { ...t, stage: nextStage } : t)),
    );
  };

  const requestDelete = (topic: TopicWithArticle) => {
    setPendingDelete(topic);
  };

  const confirmDelete = () => {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    setBoard((curr) => curr.filter((t) => t.id !== target.id));
    startTransition(async () => {
      const r = await deleteTopic(target.id);
      if (!r.ok) {
        setBoard((curr) => [...curr, target]);
        toast.error(r.error || "Failed to delete topic");
        return;
      }
      toast.success(`Deleted "${target.title}"`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <StatusStrip stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <PillarFilter value={pillarFilter} setValue={setPillarFilter} />
          <OwnerFilterSelect
            value={ownerFilter}
            setValue={setOwnerFilter}
            assignees={assignees}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setPasteOpen(true)}>
            <ClipboardPaste className="h-4 w-4" />
            Import draft
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New topic
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : view === "pipeline" ? (
        <PipelineView
          topics={filtered}
          onMove={moveTopic}
          onDelete={requestDelete}
        />
      ) : view === "list" ? (
        <ListView topics={filtered} onDelete={requestDelete} />
      ) : (
        <CalendarView topics={filtered} />
      )}

      <CreateTopicDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        spaceId={space.id}
        assignees={assignees}
      />

      <PasteDraftDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        spaceId={space.id}
      />

      <DeleteTopicDialog
        topic={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

interface TrackerStats {
  total: number;
  byStage: Record<ContentTopicStage, number>;
  needsOwner: number;
  overdue: number;
  publishingThisWeek: number;
}

function computeStats(topics: TopicWithArticle[]): TrackerStats {
  const byStage: Record<ContentTopicStage, number> = {
    idea: 0,
    in_progress: 0,
    draft: 0,
    complete: 0,
    archived: 0,
  };
  let needsOwner = 0;
  let overdue = 0;
  let publishingThisWeek = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  for (const t of topics) {
    byStage[t.stage] = (byStage[t.stage] ?? 0) + 1;
    if (!t.owner_id) needsOwner += 1;
    const target = t.publish_target ?? t.due_date;
    if (target && t.stage !== "complete") {
      const d = new Date(target + "T00:00:00");
      if (d < today) overdue += 1;
      else if (d <= weekFromNow) publishingThisWeek += 1;
    }
  }

  return { total: topics.length, byStage, needsOwner, overdue, publishingThisWeek };
}

function StatusStrip({ stats }: { stats: TrackerStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <StatTile label="Total" value={stats.total} />
      {STAGE_ORDER.map((s) => (
        <StatTile
          key={s}
          label={STAGE_LABELS[s]}
          value={stats.byStage[s] ?? 0}
          tone={STAGE_TONE[s]}
        />
      ))}
      <StatTile
        label="Needs owner"
        value={stats.needsOwner}
        tone={
          stats.needsOwner > 0
            ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200"
            : undefined
        }
        emphasize={stats.needsOwner > 0}
      />
      <StatTile
        label="Overdue"
        value={stats.overdue}
        tone={
          stats.overdue > 0
            ? "bg-haven-coral/15 text-haven-coral-700 border-haven-coral/40"
            : undefined
        }
        emphasize={stats.overdue > 0}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-card border bg-surface px-3 py-2",
        tone ? tone : "border-border",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-heading text-lg font-bold leading-tight",
          emphasize ? "text-current" : "text-foreground",
        )}
      >
        {value}
      </span>
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

function OwnerFilterSelect({
  value,
  setValue,
  assignees,
}: {
  value: OwnerFilter;
  setValue: (v: OwnerFilter) => void;
  assignees: ContentAssignee[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value as OwnerFilter)}
      className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] font-medium text-foreground"
    >
      <option value="all">All assignees</option>
      <option value="unassigned">Unassigned</option>
      {assignees.map((a) => (
        <option key={a.id} value={a.id}>
          {a.full_name || a.email}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------

function PipelineView({
  topics,
  onMove,
  onDelete,
}: {
  topics: TopicWithArticle[];
  onMove: (topicId: string, stage: ContentTopicStage) => void;
  onDelete: (topic: TopicWithArticle) => void;
}) {
  const router = useRouter();
  const stages = STAGE_ORDER;
  const grouped = new Map<ContentTopicStage, TopicWithArticle[]>();
  for (const s of stages) grouped.set(s, []);
  for (const t of topics) {
    if (grouped.has(t.stage)) grouped.get(t.stage)!.push(t);
  }

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTopic = activeId
    ? topics.find((t) => t.id === activeId) ?? null
    : null;

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
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTopic ? (
          <TopicCard topic={activeTopic} isOverlay onDelete={null} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function PipelineColumn({
  stage,
  items,
  activeId,
  onDelete,
}: {
  stage: ContentTopicStage;
  items: TopicWithArticle[];
  activeId: string | null;
  onDelete: (topic: TopicWithArticle) => void;
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
            onDelete={onDelete}
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
  onDelete,
}: {
  topic: TopicWithArticle;
  stage: ContentTopicStage;
  isOverlayActive: boolean;
  onDelete: (topic: TopicWithArticle) => void;
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
      <TopicCard topic={topic} onDelete={onDelete} />
    </div>
  );
}

function TopicCard({
  topic,
  isOverlay,
  onDelete,
}: {
  topic: TopicWithArticle;
  isOverlay?: boolean;
  onDelete: ((topic: TopicWithArticle) => void) | null;
}) {
  const target = topic.publish_target ?? topic.due_date;
  const dateLabel = topic.publish_target
    ? `Publish ${formatDate(topic.publish_target)}`
    : topic.due_date
      ? `Due ${formatDate(topic.due_date)}`
      : "—";
  const overdue =
    !!target && topic.stage !== "complete" && isPastDate(target);

  return (
    <div
      className={cn(
        "group relative rounded-md",
        isOverlay && "rotate-1",
      )}
    >
      <Link
        href={`/content/${topic.id}` as never}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3 pr-8 shadow-card transition hover:border-haven-coral/40 hover:shadow-card-hover",
          isOverlay && "border-haven-coral/40 shadow-card-hover",
          overdue && "border-haven-coral/50",
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
          <span
            className={cn(
              "flex items-center gap-1",
              overdue ? "font-semibold text-haven-coral" : "text-muted-foreground",
            )}
          >
            {overdue ? <AlertTriangle className="h-3 w-3" /> : null}
            {overdue ? `Overdue · ${dateLabel}` : dateLabel}
          </span>
          <ScoreBadges
            seo={topic.article?.seo_score ?? null}
            geo={topic.article?.geo_score ?? null}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <AssigneeChip owner={topic.owner} />
        </div>
      </Link>
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete topic "${topic.title}"`}
          title="Delete topic"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(topic);
          }}
          className="absolute right-1.5 top-1.5 hidden rounded p-1 text-muted-foreground transition-colors hover:bg-haven-coral/10 hover:text-haven-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haven-coral/40 group-hover:block"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function AssigneeChip({ owner }: { owner: TopicWithArticle["owner"] }) {
  if (!owner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        <UserRound className="h-3 w-3" />
        Needs owner
      </span>
    );
  }
  const label = owner.full_name || owner.email;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt/60 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/80">
      <UserRound className="h-3 w-3" />
      {label}
    </span>
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

function ListView({
  topics,
  onDelete,
}: {
  topics: TopicWithArticle[];
  onDelete: (topic: TopicWithArticle) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-alt/40 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Topic</th>
            <th className="px-3 py-2 text-left">Pillar</th>
            <th className="px-3 py-2 text-left">Stage</th>
            <th className="px-3 py-2 text-left">Assignee</th>
            <th className="px-3 py-2 text-left">Priority</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-left">Publish</th>
            <th className="px-3 py-2 text-left">Scores</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {topics.map((t) => {
            const target = t.publish_target ?? t.due_date;
            const overdue =
              !!target && t.stage !== "complete" && isPastDate(target);
            return (
              <tr
                key={t.id}
                className="group border-t border-border hover:bg-surface-alt/30"
              >
                <td className="max-w-[360px] px-3 py-2">
                  <div className="flex items-center gap-2">
                    {overdue ? (
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0 text-haven-coral"
                        aria-label="Overdue"
                      />
                    ) : null}
                    <span className="line-clamp-1 font-semibold text-foreground">
                      {t.title}
                    </span>
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
                  <AssigneeChip owner={t.owner} />
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
                <td
                  className={cn(
                    "px-3 py-2",
                    overdue && !t.publish_target
                      ? "font-semibold text-haven-coral"
                      : "text-muted-foreground",
                  )}
                >
                  {t.due_date ? formatDate(t.due_date) : "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-2",
                    overdue && t.publish_target
                      ? "font-semibold text-haven-coral"
                      : "text-muted-foreground",
                  )}
                >
                  {t.publish_target ? formatDate(t.publish_target) : "—"}
                </td>
                <td className="px-3 py-2">
                  <ScoreBadges
                    seo={t.article?.seo_score ?? null}
                    geo={t.article?.geo_score ?? null}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      aria-label={`Delete topic "${t.title}"`}
                      title="Delete topic"
                      onClick={() => onDelete(t)}
                      className="hidden rounded p-1 text-muted-foreground transition-colors hover:bg-haven-coral/10 hover:text-haven-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haven-coral/40 group-hover:inline-flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/content/${t.id}` as never}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-haven-coral hover:underline"
                    >
                      Open
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------

function DeleteTopicDialog({
  topic,
  onCancel,
  onConfirm,
}: {
  topic: TopicWithArticle | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const open = !!topic;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this topic?</DialogTitle>
          <DialogDescription>
            {topic ? (
              <>
                "{topic.title}" and its draft, research, scorecards, and
                publish history will be removed. This can't be undone.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="bg-haven-coral text-white hover:bg-haven-coral-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        Add a topic to start the editorial pipeline. Drag cards across
        Idea → In Progress → Draft → Complete as work moves through it.
      </p>
      <Button variant="outline" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        New topic
      </Button>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return d < today;
}
