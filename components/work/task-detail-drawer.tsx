"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  X,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTask,
  getComments,
  getMembers,
  updateTask,
  deleteTask,
  createComment,
} from "@/lib/work/actions";
import type {
  Task,
  Status,
  Comment,
  CustomFieldDef,
  TaskPriority,
} from "@/lib/work/types";
import { MentionInput, MentionText, type MentionUser } from "@/components/work/mention-input";

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "text-rose-600" },
  { value: "high", label: "High", color: "text-amber-600" },
  { value: "normal", label: "Normal", color: "text-sky-600" },
  { value: "low", label: "Low", color: "text-foreground/50" },
  { value: "none", label: "None", color: "text-muted-foreground" },
];

export function TaskDetailDrawer({
  taskId,
  statuses,
  fieldDefs,
  onClose,
}: {
  taskId: string;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  onClose: () => void;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<
    (Comment & { author: { full_name: string | null; avatar_url: string | null } })[]
  >([]);
  const [commentBody, setCommentBody] = useState("");
  const [description, setDescription] = useState("");
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [pending, start] = useTransition();

  const load = useCallback(async () => {
    const [t, c, u] = await Promise.all([
      getTask(taskId),
      getComments(taskId),
      getMembers(),
    ]);
    setTask(t);
    setDescription(t?.description ?? "");
    setComments(c);
    setAllUsers(u);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  function save(input: Record<string, unknown>) {
    start(async () => {
      await updateTask(taskId, input);
      await load();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this task?")) return;
    start(async () => {
      await deleteTask(taskId);
      onClose();
    });
  }

  function handleComment() {
    if (!commentBody.trim()) return;
    start(async () => {
      await createComment(taskId, commentBody.trim());
      setCommentBody("");
      const c = await getComments(taskId);
      setComments(c);
    });
  }

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!task) {
    return (
      <div className="w-[420px] shrink-0 border-l border-border bg-surface p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-3/4 rounded bg-surface-alt" />
          <div className="h-4 w-full rounded bg-surface-alt" />
          <div className="h-4 w-2/3 rounded bg-surface-alt" />
        </div>
      </div>
    );
  }

  const currentStatus = statuses.find((s) => s.id === task.status_id);

  return (
    <div className="flex w-[420px] shrink-0 flex-col border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="flex-1 truncate font-heading text-base font-bold">
          Task Detail
        </h2>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Title (editable) */}
        <input
          defaultValue={task.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== task.title) save({ title: v });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="mb-4 w-full bg-transparent font-heading text-lg font-bold outline-none focus:underline focus:decoration-accent focus:underline-offset-4"
        />

        {/* Fields grid */}
        <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-2 text-[13px]">
          {/* Status */}
          <span className="text-muted-foreground">Status</span>
          <select
            value={task.status_id ?? ""}
            onChange={(e) => save({ status_id: e.target.value || null })}
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          >
            <option value="">No status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority */}
          <span className="text-muted-foreground">Priority</span>
          <select
            value={task.priority}
            onChange={(e) =>
              save({ priority: e.target.value as TaskPriority })
            }
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Due date */}
          <span className="text-muted-foreground">Due date</span>
          <input
            type="date"
            value={task.due_date ?? ""}
            onChange={(e) =>
              save({ due_date: e.target.value || null })
            }
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />

          {/* Start date */}
          <span className="text-muted-foreground">Start date</span>
          <input
            type="date"
            value={task.start_date ?? ""}
            onChange={(e) =>
              save({ start_date: e.target.value || null })
            }
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />

          {/* Time estimate */}
          <span className="text-muted-foreground">Estimate</span>
          <input
            type="number"
            placeholder="minutes"
            value={task.time_estimate ?? ""}
            onChange={(e) =>
              save({
                time_estimate: e.target.value
                  ? parseInt(e.target.value, 10)
                  : null,
              })
            }
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />

          {/* Tags */}
          <span className="text-muted-foreground">Tags</span>
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <Badge key={tag} tone="sage" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            <button
              type="button"
              onClick={() => {
                const tag = prompt("Tag name:");
                if (tag?.trim()) {
                  save({ tags: [...task.tags, tag.trim()] });
                }
              }}
              className="text-[11px] text-accent hover:underline"
            >
              + add
            </button>
          </div>

          {/* Custom fields */}
          {fieldDefs.map((fd) => (
            <CustomFieldRow
              key={fd.id}
              def={fd}
              value={task.custom_fields[fd.id]}
              onChange={(val) =>
                save({
                  custom_fields: { ...task.custom_fields, [fd.id]: val },
                })
              }
            />
          ))}
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="haven-eyebrow mb-1.5 block">Description</label>
          <MentionInput
            value={description}
            onChange={setDescription}
            users={allUsers}
            placeholder="Add a description… (type @ to mention)"
            rows={4}
            className="resize-y py-2"
          />
          {description !== (task.description ?? "") ? (
            <div className="mt-1.5 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => save({ description: description || null })}
                disabled={pending}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDescription(task.description ?? "")}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>

        {/* Comments */}
        <div className="mt-6">
          <label className="haven-eyebrow mb-2 block">
            Comments ({comments.length})
          </label>

          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                {c.author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.author.avatar_url}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full"
                  />
                ) : (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold">
                    {(c.author.full_name ?? "?")[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-semibold">
                      {c.author.full_name ?? "Unknown"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <MentionText text={c.body} className="text-[13px] text-foreground/90" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              <MentionInput
                value={commentBody}
                onChange={setCommentBody}
                users={allUsers}
                placeholder="Write a comment… (type @ to mention)"
                onSubmit={handleComment}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={!commentBody.trim() || pending}
              onClick={handleComment}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomFieldRow({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (def.field_type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <input
            type={def.field_type === "email" ? "email" : def.field_type === "url" ? "url" : "text"}
            defaultValue={(value as string) ?? ""}
            onBlur={(e) => onChange(e.target.value || null)}
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />
        </>
      );
    case "number":
    case "currency":
    case "percent":
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <input
            type="number"
            defaultValue={(value as number) ?? ""}
            onBlur={(e) =>
              onChange(e.target.value ? parseFloat(e.target.value) : null)
            }
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />
        </>
      );
    case "date":
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <input
            type="date"
            defaultValue={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          />
        </>
      );
    case "checkbox":
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </>
      );
    case "select": {
      const options = ((def.config as Record<string, unknown>)?.options ?? []) as {
        value: string;
        label: string;
      }[];
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-7 rounded border border-border bg-surface px-2 text-[13px]"
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      );
    }
    default:
      return (
        <>
          <span className="text-muted-foreground">{def.name}</span>
          <span className="text-[12px] text-muted-foreground/70">
            ({def.field_type})
          </span>
        </>
      );
  }
}
