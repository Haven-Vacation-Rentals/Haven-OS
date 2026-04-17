"use client";

/**
 * TaskDetailDrawer — ClickUp-parity rewrite with Radix Tabs.
 *
 * Tabs: Details, Checklist, Comments, Activity, Time
 * Animation: slide in from right, 280ms cubic-bezier, backdrop blur
 */

import { useCallback, useEffect, useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  X,
  Send,
  Trash2,
  Plus,
  Check,
  Clock,
  Play,
  Square,
  Pencil,
  ChevronRight,
  Paperclip,
  CheckSquare2,
  MessageSquare,
  Activity,
  Timer,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusPill } from "@/components/work/status-pill";
import { StatusPickerPopover } from "@/components/work/status-picker-popover";
import { CustomFieldCell } from "@/components/work/custom-field-cell";
import {
  getTask,
  getComments,
  getMembers,
  updateTask,
  deleteTask,
  createComment,
  addComment,
  deleteComment,
  getChecklists,
  createChecklist,
  renameChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistItemContent,
  deleteChecklistItem,
  getTaskActivity,
  getTaskTimeTotal,
  getActiveTimer,
  startTimer,
  stopTimer,
  addManualTimeEntry,
  deleteTimeEntry,
} from "@/lib/work/actions";
import type {
  Task,
  Status,
  Comment,
  CustomFieldDef,
  TaskPriority,
  Checklist,
  ChecklistItem,
  TimeEntry,
} from "@/lib/work/types";
import type {
  TaskActivityWithActor,
  TaskTimeTotalResult,
} from "@/lib/work/actions";
import { MentionInput, MentionText, type MentionUser } from "@/components/work/mention-input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------

const priorities: { value: TaskPriority; label: string; color: string; dot: string }[] = [
  { value: "urgent", label: "Urgent", color: "text-rose-600", dot: "bg-rose-500" },
  { value: "high", label: "High", color: "text-amber-600", dot: "bg-amber-500" },
  { value: "normal", label: "Normal", color: "text-sky-600", dot: "bg-sky-500" },
  { value: "low", label: "Low", color: "text-foreground/50", dot: "bg-foreground/20" },
  { value: "none", label: "None", color: "text-muted-foreground", dot: "" },
];

// ---------------------------------------------------------------------------
// Duration formatter
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ---------------------------------------------------------------------------
// ActivityIcon helper
// ---------------------------------------------------------------------------

function ActivityIcon({ action }: { action: string }) {
  switch (action) {
    case "status_changed": return <ChevronRight className="h-3.5 w-3.5 text-accent" />;
    case "comment_added": return <MessageSquare className="h-3.5 w-3.5 text-sky-500" />;
    case "created": return <Plus className="h-3.5 w-3.5 text-emerald-500" />;
    case "priority_changed": return <Activity className="h-3.5 w-3.5 text-amber-500" />;
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TaskDetailDrawer({
  taskId,
  statuses,
  fieldDefs,
  members = [],
  onClose,
}: {
  taskId: string;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  members?: { id: string; full_name: string | null; avatar_url: string | null }[];
  onClose: () => void;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<
    (Comment & { author: { full_name: string | null; avatar_url: string | null } })[]
  >([]);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [pending, start] = useTransition();

  // Checklist state
  const [checklists, setChecklists] = useState<
    (Checklist & { items: ChecklistItem[] })[]
  >([]);

  // Time tracking state
  const [timeTotal, setTimeTotal] = useState<TaskTimeTotalResult | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Activity state
  const [activity, setActivity] = useState<TaskActivityWithActor[]>([]);

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

  const loadChecklists = useCallback(async () => {
    const data = await getChecklists(taskId);
    setChecklists(data);
  }, [taskId]);

  const loadActivity = useCallback(async () => {
    const data = await getTaskActivity(taskId, 50);
    setActivity(data);
  }, [taskId]);

  const loadTimeData = useCallback(async () => {
    const [total] = await Promise.all([getTaskTimeTotal(taskId)]);
    setTimeTotal(total);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  // Load tab-specific data on demand
  useEffect(() => {
    if (activeTab === "checklist") loadChecklists();
    if (activeTab === "activity") loadActivity();
    if (activeTab === "time") loadTimeData();
  }, [activeTab, loadChecklists, loadActivity, loadTimeData]);

  // Timer polling
  useEffect(() => {
    if (activeTab !== "time") return;
    // Check for active timer
    async function checkTimer() {
      // Can't get current user easily from client — skip active timer polling for now
      // Instead rely on the time data load
    }
    checkTimer();
  }, [activeTab]);

  // Timer tick
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - new Date(activeTimer.started_at).getTime();
        setTimerElapsed(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      await addComment(taskId, commentBody.trim());
      setCommentBody("");
      const c = await getComments(taskId);
      setComments(c);
    });
  }

  const currentStatus = statuses.find((s) => s.id === task?.status_id) ?? null;

  if (!task) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
        <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] border-l border-border bg-surface p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-3/4 rounded bg-surface-alt" />
            <div className="h-4 w-full rounded bg-surface-alt" />
            <div className="h-4 w-2/3 rounded bg-surface-alt" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed right-0 top-0 bottom-0 z-50 flex w-[480px] flex-col border-l border-border bg-surface shadow-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
          <div className="flex-1 min-w-0">
            <input
              defaultValue={task.title}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== task.title) save({ title: v });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full bg-transparent font-heading text-base font-bold outline-none focus:underline focus:decoration-accent focus:underline-offset-4 truncate"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete task">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close (Esc)">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border px-4 py-2">
            <TabsList className="h-8 gap-0.5 bg-transparent p-0">
              {[
                { value: "details", label: "Details", icon: <AlignLeft className="h-3 w-3" /> },
                { value: "checklist", label: "Checklist", icon: <CheckSquare2 className="h-3 w-3" /> },
                { value: "comments", label: "Comments", icon: <MessageSquare className="h-3 w-3" /> },
                { value: "activity", label: "Activity", icon: <Activity className="h-3 w-3" /> },
                { value: "time", label: "Time", icon: <Timer className="h-3 w-3" /> },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-7 gap-1 rounded-md px-2 text-[11px] data-[state=active]:bg-surface-alt data-[state=active]:shadow-none"
                >
                  {tab.icon}
                  {tab.label}
                  {tab.value === "comments" && comments.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-accent/20 px-1 text-[10px] text-accent">
                      {comments.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Details Tab ──────────────────────────────────────────── */}
          <TabsContent value="details" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-5 px-4 py-4">
                {/* Status */}
                <FieldRow label="Status">
                  <StatusPickerPopover
                    statuses={statuses}
                    currentStatus={currentStatus}
                    onSelect={(status) => {
                      save({
                        status_id: status.id,
                        completed_at:
                          status.category === "done" || status.category === "closed"
                            ? new Date().toISOString()
                            : null,
                      });
                    }}
                  >
                    <div>
                      <StatusPill status={currentStatus} interactive taskId={task.id} />
                    </div>
                  </StatusPickerPopover>
                </FieldRow>

                {/* Priority */}
                <FieldRow label="Priority">
                  <select
                    value={task.priority}
                    onChange={(e) => save({ priority: e.target.value as TaskPriority })}
                    className="h-7 rounded-md border border-border bg-surface px-2 text-[13px]"
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </FieldRow>

                {/* Due date */}
                <FieldRow label="Due date">
                  <input
                    type="date"
                    value={task.due_date ?? ""}
                    onChange={(e) => save({ due_date: e.target.value || null })}
                    className="h-7 rounded-md border border-border bg-surface px-2 text-[13px]"
                  />
                </FieldRow>

                {/* Start date */}
                <FieldRow label="Start date">
                  <input
                    type="date"
                    value={task.start_date ?? ""}
                    onChange={(e) => save({ start_date: e.target.value || null })}
                    className="h-7 rounded-md border border-border bg-surface px-2 text-[13px]"
                  />
                </FieldRow>

                {/* Estimate */}
                <FieldRow label="Estimate">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="0"
                      value={task.time_estimate ?? ""}
                      onChange={(e) =>
                        save({
                          time_estimate: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      className="h-7 w-20 rounded-md border border-border bg-surface px-2 text-[13px]"
                    />
                    <span className="text-[12px] text-muted-foreground">min</span>
                  </div>
                </FieldRow>

                {/* Tags */}
                <FieldRow label="Tags">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} tone="sage" className="text-[10px]">
                        {tag}
                        <button
                          type="button"
                          onClick={() => save({ tags: task.tags.filter((t) => t !== tag) })}
                          className="ml-1 text-muted-foreground/50 hover:text-rose-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const tag = prompt("Tag name:");
                        if (tag?.trim()) save({ tags: [...task.tags, tag.trim()] });
                      }}
                      className="text-[11px] text-accent hover:underline"
                    >
                      + add
                    </button>
                  </div>
                </FieldRow>

                {/* Custom fields */}
                {fieldDefs.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Custom Fields
                    </p>
                    <div className="space-y-3">
                      {fieldDefs.map((fd) => (
                        <FieldRow key={fd.id} label={fd.name}>
                          <CustomFieldCell
                            taskId={task.id}
                            fieldDef={fd}
                            value={task.custom_fields[fd.id]}
                            onValueChange={(val) =>
                              save({ custom_fields: { ...task.custom_fields, [fd.id]: val } })
                            }
                            compact={false}
                          />
                        </FieldRow>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <MentionInput
                    value={description}
                    onChange={setDescription}
                    users={allUsers}
                    placeholder="Add a description… (type @ to mention)"
                    autoGrow
                    rows={3}
                    className="py-2"
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
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Checklist Tab ────────────────────────────────────────── */}
          <TabsContent value="checklist" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-4 py-4">
                {checklists.map((cl) => (
                  <ChecklistSection
                    key={cl.id}
                    checklist={cl}
                    onRefresh={loadChecklists}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => {
                    start(async () => {
                      const name = prompt("Checklist name:") ?? "Checklist";
                      await createChecklist(taskId, name);
                      await loadChecklists();
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add checklist
                </button>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Comments Tab ─────────────────────────────────────────── */}
          <TabsContent value="comments" className="mt-0 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 px-4 py-4">
                {comments.length === 0 && (
                  <p className="text-center text-[13px] text-muted-foreground py-6">
                    No comments yet. Be the first to comment.
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    {c.author.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.author.avatar_url} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                    ) : (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">
                        {(c.author.full_name ?? "?")[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12px] font-semibold">
                          {c.author.full_name ?? "Unknown"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            start(async () => {
                              await deleteComment(c.id);
                              const updated = await getComments(taskId);
                              setComments(updated);
                            });
                          }}
                          className="ml-auto text-muted-foreground/30 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <MentionText text={c.body} className="mt-0.5 text-[13px] text-foreground/90" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Comment composer */}
            <div className="shrink-0 border-t border-border px-4 py-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <MentionInput
                    value={commentBody}
                    onChange={setCommentBody}
                    users={allUsers}
                    placeholder="Write a comment… (@ to mention)"
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
          </TabsContent>

          {/* ── Activity Tab ─────────────────────────────────────────── */}
          <TabsContent value="activity" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 px-4 py-4">
                {activity.length === 0 && (
                  <p className="text-center text-[13px] text-muted-foreground py-6">
                    No activity yet.
                  </p>
                )}
                {activity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5 py-2">
                    {entry.actor?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.actor.avatar_url}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full mt-0.5"
                      />
                    ) : (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold mt-0.5">
                        {(entry.actor?.full_name ?? "?")[0]}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ActivityIcon action={entry.action} />
                        <span className="text-[12px] text-foreground/80">
                          <span className="font-medium">{entry.actor?.full_name ?? "Someone"}</span>
                          {" "}
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Time Tracking Tab ────────────────────────────────────── */}
          <TabsContent value="time" className="mt-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-4 py-4">
                {/* Total */}
                <div className="rounded-xl border border-border bg-surface-alt p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total Tracked
                  </p>
                  <p className="mt-1 font-heading text-3xl font-bold">
                    {timeTotal ? formatDuration(timeTotal.total_ms) : "0s"}
                  </p>
                </div>

                {/* Timer button */}
                {activeTimer ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                    />
                    <span className="flex-1 font-mono text-[14px] font-semibold text-emerald-700">
                      {formatDuration(timerElapsed)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        start(async () => {
                          await stopTimer(activeTimer.id);
                          setActiveTimer(null);
                          await loadTimeData();
                          toast.success("Timer stopped");
                        });
                      }}
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      start(async () => {
                        try {
                          const entry = await startTimer(taskId);
                          setActiveTimer(entry);
                          toast.success("Timer started");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to start timer");
                        }
                      });
                    }}
                    disabled={pending}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start timer
                  </Button>
                )}

                {/* Manual entry */}
                <ManualTimeEntry
                  taskId={taskId}
                  onAdded={loadTimeData}
                />

                {/* Entries list */}
                {timeTotal && timeTotal.entries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Entries
                    </p>
                    {timeTotal.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium">
                            {entry.duration_ms ? formatDuration(entry.duration_ms) : "Running…"}
                          </p>
                          {entry.description && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {entry.description}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(entry.started_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            start(async () => {
                              await deleteTimeEntry(entry.id);
                              await loadTimeData();
                            });
                          }}
                          className="text-muted-foreground/30 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Field row helper
// ---------------------------------------------------------------------------

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-x-2 gap-y-1">
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist section
// ---------------------------------------------------------------------------

function ChecklistSection({
  checklist,
  onRefresh,
}: {
  checklist: Checklist & { items: ChecklistItem[] };
  onRefresh: () => Promise<void>;
}) {
  const [, start] = useTransition();
  const [newItemContent, setNewItemContent] = useState("");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = checklist.items.filter((i) => i.completed).length;
  const progress = checklist.items.length > 0
    ? Math.round((doneCount / checklist.items.length) * 100)
    : 0;

  function handleAddItem() {
    const content = newItemContent.trim();
    if (!content) {
      setEditing(false);
      return;
    }
    start(async () => {
      await addChecklistItem(checklist.id, content);
      setNewItemContent("");
      await onRefresh();
    });
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[13px] font-semibold">{checklist.name}</span>
        <span className="text-[11px] text-muted-foreground">
          {doneCount}/{checklist.items.length}
        </span>
        <button
          type="button"
          onClick={() => {
            start(async () => {
              await deleteChecklist(checklist.id);
              await onRefresh();
            });
          }}
          className="text-muted-foreground/30 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      {checklist.items.length > 0 && (
        <div className="h-1 w-full rounded-full bg-surface-alt overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {checklist.items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onRefresh={onRefresh}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add item */}
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
              if (e.key === "Escape") {
                setNewItemContent("");
                setEditing(false);
              }
            }}
            onBlur={handleAddItem}
            placeholder="Item…"
            className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-[13px] outline-none focus:border-accent"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-accent transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist item row with animation
// ---------------------------------------------------------------------------

function ChecklistItemRow({
  item,
  onRefresh,
}: {
  item: ChecklistItem;
  onRefresh: () => Promise<void>;
}) {
  const [, start] = useTransition();
  const [editingContent, setEditingContent] = useState(false);
  const [draft, setDraft] = useState(item.content);

  function handleToggle() {
    start(async () => {
      await toggleChecklistItem(item.id);
      await onRefresh();
    });
  }

  function handleUpdateContent() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.content) {
      setEditingContent(false);
      setDraft(item.content);
      return;
    }
    start(async () => {
      await updateChecklistItemContent(item.id, trimmed);
      setEditingContent(false);
      await onRefresh();
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface-alt/50 transition-colors group"
    >
      {/* Animated checkbox */}
      <motion.button
        type="button"
        onClick={handleToggle}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "h-4 w-4 shrink-0 rounded border transition-colors",
          item.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-surface hover:border-accent",
        )}
      >
        {item.completed && <Check className="h-3 w-3 m-auto" />}
      </motion.button>

      {/* Content */}
      {editingContent ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleUpdateContent}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUpdateContent();
            if (e.key === "Escape") {
              setDraft(item.content);
              setEditingContent(false);
            }
          }}
          className="flex-1 bg-transparent text-[13px] outline-none border-b border-accent"
        />
      ) : (
        <motion.span
          animate={{
            opacity: item.completed ? 0.5 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex-1 text-[13px]",
            item.completed ? "line-through text-muted-foreground" : "text-foreground",
          )}
          onDoubleClick={() => setEditingContent(true)}
        >
          {item.content}
        </motion.span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setEditingContent(true)}
          className="text-muted-foreground/30 hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            start(async () => {
              await deleteChecklistItem(item.id);
              await onRefresh();
            });
          }}
          className="text-muted-foreground/30 hover:text-rose-500"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Manual time entry
// ---------------------------------------------------------------------------

function ManualTimeEntry({
  taskId,
  onAdded,
}: {
  taskId: string;
  onAdded: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [desc, setDesc] = useState("");
  const [, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-accent hover:text-accent transition-colors"
      >
        <Plus className="h-4 w-4" />
        Log time manually
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border p-3 space-y-3">
      <p className="text-[12px] font-semibold text-muted-foreground">Log time</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Start</label>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="mt-0.5 h-7 w-full rounded-md border border-border bg-surface px-2 text-[12px]"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">End</label>
          <input
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="mt-0.5 h-7 w-full rounded-md border border-border bg-surface px-2 text-[12px]"
          />
        </div>
      </div>
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        className="h-7 w-full rounded-md border border-border bg-surface px-2 text-[12px] outline-none focus:border-accent"
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!startedAt || !endedAt}
          onClick={() => {
            start(async () => {
              await addManualTimeEntry(taskId, {
                startedAt: new Date(startedAt).toISOString(),
                endedAt: new Date(endedAt).toISOString(),
                description: desc || undefined,
              });
              setOpen(false);
              setStartedAt("");
              setEndedAt("");
              setDesc("");
              await onAdded();
              toast.success("Time entry added");
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
