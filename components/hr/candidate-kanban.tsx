"use client";

/**
 * CandidateKanban — drag-and-drop candidates between hiring stages.
 *
 * Mirrors the proven onboarding/lost-items pattern: PointerSensor with a 6px
 * activation distance so a click on a card still navigates to the detail page,
 * KeyboardSensor for accessibility, optimistic update with revert + toast on
 * failure, and a drop-zone highlight on the target column.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CandidateCard } from "./candidate-card";
import { setCandidateStage } from "@/lib/hr/actions";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  type CandidateStage,
  type DbCandidate,
} from "@/lib/hr/types";

const COLS = CANDIDATE_STAGES;

export function CandidateKanban({
  candidates,
  roleId,
}: {
  candidates: DbCandidate[];
  roleId: string;
}) {
  const router = useRouter();
  const [board, setBoard] = useState<DbCandidate[]>(candidates);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setBoard(candidates);
  }, [candidates]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const groups = useMemo(() => {
    const m = new Map<CandidateStage, DbCandidate[]>();
    for (const c of COLS) m.set(c, []);
    for (const c of board) {
      const stage = c.stage as CandidateStage;
      (m.get(stage) ?? m.get("applied"))!.push(c);
    }
    return m;
  }, [board]);

  const activeCandidate = activeId
    ? board.find((c) => c.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const candidateId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    let targetCol: CandidateStage | null = null;
    if ((COLS as readonly string[]).includes(overId)) {
      targetCol = overId as CandidateStage;
    } else {
      const overCard = board.find((c) => c.id === overId);
      if (overCard) targetCol = overCard.stage as CandidateStage;
    }
    if (!targetCol) return;

    const c = board.find((x) => x.id === candidateId);
    if (!c) return;
    if (c.stage === targetCol) return;

    const prevStage = c.stage;
    setBoard((curr) =>
      curr.map((x) => (x.id === candidateId ? { ...x, stage: targetCol! } : x)),
    );

    void (async () => {
      const res = await setCandidateStage(candidateId, targetCol!, roleId);
      if (!res.ok) {
        setBoard((curr) =>
          curr.map((x) =>
            x.id === candidateId ? { ...x, stage: prevStage } : x,
          ),
        );
        toast.error(res.error);
      } else {
        toast.success(`Moved to ${CANDIDATE_STAGE_LABELS[targetCol!]}`);
        router.refresh();
      }
    })();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <div className="flex gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:gap-3">
          {COLS.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              candidates={groups.get(stage) ?? []}
              roleId={roleId}
              activeId={activeId}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCandidate ? (
          <CandidateCard candidate={activeCandidate} roleId={roleId} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  candidates,
  roleId,
  activeId,
}: {
  stage: CandidateStage;
  candidates: DbCandidate[];
  roleId: string;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={
        "flex flex-col gap-2 rounded-card border bg-surface-alt/30 p-2 min-h-[140px] w-[260px] shrink-0 md:w-auto transition-colors " +
        (isOver
          ? "border-haven-coral-600 bg-accent-soft/50 ring-2 ring-haven-coral-600/30"
          : "border-border")
      }
    >
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {CANDIDATE_STAGE_LABELS[stage]}
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          {candidates.length}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {candidates.length === 0 ? (
          <div
            className={
              "rounded-md border border-dashed py-4 text-center text-[11px] " +
              (isOver
                ? "text-haven-coral-700 border-haven-coral-300 bg-accent-soft/40"
                : "text-muted-foreground border-border bg-surface/40")
            }
          >
            {isOver ? "Drop here" : "None"}
          </div>
        ) : (
          candidates.map((c) => (
            <DraggableCandidate
              key={c.id}
              candidate={c}
              roleId={roleId}
              isOverlayActive={activeId === c.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCandidate({
  candidate,
  roleId,
  isOverlayActive,
}: {
  candidate: DbCandidate;
  roleId: string;
  isOverlayActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: candidate.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging || isOverlayActive ? 0.4 : 1 }}
      className="touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:shadow-ring rounded-md"
    >
      <CandidateCard candidate={candidate} roleId={roleId} />
    </div>
  );
}
