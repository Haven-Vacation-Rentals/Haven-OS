"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createStatus,
  updateStatus,
  deleteStatus,
  reorderStatuses,
} from "@/lib/work/actions";
import { toast } from "sonner";
import type { Status, TaskStatusCategory } from "@/lib/work/types";

const CATEGORY_OPTIONS: { value: TaskStatusCategory; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
];

const PRESET_COLORS = [
  "#94a3b8", "#64748b", "#3b82f6", "#06b6d4", "#10b981",
  "#84cc16", "#eab308", "#f97316", "#ef4444", "#FF564E",
  "#ec4899", "#a855f7", "#8b5cf6",
];

interface SortableStatusRowProps {
  status: Status;
  onNameChange: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onCategoryChange: (id: string, cat: TaskStatusCategory) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

function SortableStatusRow({
  status,
  onNameChange,
  onColorChange,
  onCategoryChange,
  onDelete,
  canDelete,
}: SortableStatusRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Color swatch */}
      <div className="relative">
        <input
          type="color"
          value={status.color}
          onChange={(e) => onColorChange(status.id, e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          title="Pick color"
        />
        <div
          className="h-5 w-5 rounded cursor-pointer border border-border/50 shadow-sm"
          style={{ backgroundColor: status.color }}
        />
      </div>

      {/* Name */}
      <Input
        value={status.name}
        onChange={(e) => onNameChange(status.id, e.target.value)}
        className="h-7 flex-1 text-[13px]"
      />

      {/* Category */}
      <select
        value={status.category}
        onChange={(e) => onCategoryChange(status.id, e.target.value as TaskStatusCategory)}
        className="h-7 rounded-md border border-border bg-surface px-2 text-[12px] text-muted-foreground"
      >
        {CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(status.id)}
        disabled={!canDelete}
        className="text-muted-foreground/40 hover:text-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={canDelete ? "Delete status" : "Need at least one status"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface StatusManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  statuses: Status[];
  onStatusesChange: (statuses: Status[]) => void;
}

export function StatusManagerDialog({
  open,
  onOpenChange,
  listId,
  statuses: initialStatuses,
  onStatusesChange,
}: StatusManagerDialogProps) {
  const [localStatuses, setLocalStatuses] = useState<Status[]>(initialStatuses);
  const [pending, startTransition] = useTransition();
  // Track which status to delete + reassign UI
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalStatuses((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleNameChange(id: string, name: string) {
    setLocalStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s)),
    );
  }

  function handleColorChange(id: string, color: string) {
    setLocalStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s)),
    );
  }

  function handleCategoryChange(id: string, cat: TaskStatusCategory) {
    setLocalStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, category: cat } : s)),
    );
  }

  function handleDelete(id: string) {
    if (localStatuses.length <= 1) return;
    setDeleteTarget(id);
    setReassignTo(localStatuses.find((s) => s.id !== id)?.id ?? "");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deleteStatus(targetId, reassignTo || undefined);
        setLocalStatuses((prev) => prev.filter((s) => s.id !== targetId));
        onStatusesChange(localStatuses.filter((s) => s.id !== targetId));
        toast.success("Status deleted");
      } catch {
        toast.error("Failed to delete status");
      }
    });
  }

  function handleAddStatus() {
    startTransition(async () => {
      try {
        const newStatus = await createStatus(listId, {
          name: "New Status",
          color: "#94a3b8",
          category: "todo",
          order: localStatuses.length,
        });
        const updated = [...localStatuses, newStatus];
        setLocalStatuses(updated);
        onStatusesChange(updated);
        toast.success("Status added");
      } catch {
        toast.error("Failed to add status");
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        // Update all statuses
        await Promise.all(
          localStatuses.map((s, i) =>
            updateStatus(s.id, {
              name: s.name,
              color: s.color,
              category: s.category,
              order: i,
            }),
          ),
        );
        // Reorder
        await reorderStatuses(listId, localStatuses.map((s) => s.id));
        onStatusesChange(localStatuses);
        toast.success("Statuses saved");
        onOpenChange(false);
      } catch {
        toast.error("Failed to save statuses");
      }
    });
  }

  const deleteTargetStatus = localStatuses.find((s) => s.id === deleteTarget);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Statuses</DialogTitle>
          </DialogHeader>

          {/* Preset colors */}
          <div className="flex flex-wrap gap-1.5 py-1">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className="h-5 w-5 rounded cursor-pointer hover:scale-110 transition-transform border border-border/30"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <span className="text-[11px] text-muted-foreground self-center ml-1">
              Click color swatch on a row to pick custom color
            </span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 py-1 pr-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localStatuses.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {localStatuses.map((status) => (
                  <SortableStatusRow
                    key={status.id}
                    status={status}
                    onNameChange={handleNameChange}
                    onColorChange={handleColorChange}
                    onCategoryChange={handleCategoryChange}
                    onDelete={handleDelete}
                    canDelete={localStatuses.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Add status */}
          <button
            type="button"
            onClick={handleAddStatus}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add status
          </button>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Reassign tasks
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Tasks using <strong>&quot;{deleteTargetStatus?.name}&quot;</strong> will be
            moved to:
          </p>
          <select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px]"
          >
            {localStatuses
              .filter((s) => s.id !== deleteTarget)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              disabled={pending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              Delete & reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
