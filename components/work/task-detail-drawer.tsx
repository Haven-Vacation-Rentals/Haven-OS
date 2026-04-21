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
  Flag,
  Eye,
  EyeOff,
  UserPlus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  addAssignee,
  removeAssignee,
  getWatchers,
  addWatcher,
  removeWatcher,
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
  initialTask = null,
  onClose,
}: {
  taskId: string;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  members?: { id: string; full_name: string | null; avatar_url: string | null }[];
  /** Optional cached task shape — lets the drawer render immediately while
   *  the fresh server copy loads in the background. */
  initialTask?: Task | null;
  onClose: () => void;
}) {
  const [task, setTask] = useState<Task | null>(initialTask);
  const [comments, setComments] = useState<
    (Comment & { author: { full_name: string | null; avatar_url: string | null } })[]
  >([]);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [description, setDescription] = useState(initialTask?.description ?? "");
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

  // Watchers — ClickUp-parity
  const [watcherIds, setWatcherIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [t, c, u, w] = await Promise.all([
      getTask(taskId),
      getComments(taskId),
      getMembers(),
      getWatchers(taskId),
    ]);
    setTask(t);
    setDescription(t?.description ?? "");
    setComments(c);
    setAllUsers(u);
    setWatcherIds(w.map((x) => x.profile_id));
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

  // Keyboard shortcuts — Esc closes; number keys jump between tabs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "Escape") {
        // Let the mention-input swallow Esc (for dismissing the @ menu)
        if (inInput) return;
        onClose();
        return;
      }

      // Tab hotkeys — only when not focused in a text field.
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      const tabMap: Record<string, string> = {
        "1": "details",
        "2": "checklist",
        "3": "comments",
        "4": "activity",
        "5": "time",
      };
      const target = tabMap[e.key];
      if (target) {
        e.preventDefault();
        setActiveTab(target);
      }
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

  // When no task is loaded yet AND no initial task was provided, render a
  // skeleton that shares the final layout so the drawer doesn't "jump" when
  // real data lands. For snappier perceived performance, callers should pass
  // initialTask so we can skip this branch entirely.
  if (!task) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[3px]"
          onClick={onClose}
        />
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 2 }}
            transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] min-h-[420px] w-full max-w-[1200px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="h-5 w-64 animate-pulse rounded bg-surface-alt" />
              <div className="ml-auto h-7 w-7 animate-pulse rounded-md bg-surface-alt" />
              <div className="h-7 w-7 animate-pulse rounded-md bg-surface-alt" />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3 px-6 py-5">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-alt" />
                <div className="h-48 animate-pulse rounded-md bg-surface-alt/60" />
              </div>
              <div className="space-y-3 border-t border-border px-6 py-5 lg:border-l lg:border-t-0 lg:bg-surface-alt/20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[100px_1fr] gap-2">
                    <div className="h-3 animate-pulse rounded bg-surface-alt" />
                    <div className="h-6 animate-pulse rounded bg-surface-alt" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Centered modal container (captures outside clicks to close) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.985, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.99, y: 2 }}
          transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[92vh] min-h-[420px] w-full max-w-[1200px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-2xl"
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
            <TabsList className="h-8 gap-0.5 bg-transparent p-0">
              {[
                { value: "details", label: "Details", icon: <AlignLeft className="h-3 w-3" />, hint: "1" },
                { value: "checklist", label: "Checklist", icon: <CheckSquare2 className="h-3 w-3" />, hint: "2" },
                { value: "comments", label: "Comments", icon: <MessageSquare className="h-3 w-3" />, hint: "3" },
                { value: "activity", label: "Activity", icon: <Activity className="h-3 w-3" />, hint: "4" },
                { value: "time", label: "Time", icon: <Timer className="h-3 w-3" />, hint: "5" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  title={`${tab.label} (press ${tab.hint})`}
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
            <span className="ml-auto hidden items-center gap-1 text-[10px] text-muted-foreground/60 md:flex">
              Press
              <kbd className="haven-kbd text-[9px]">1</kbd>–<kbd className="haven-kbd text-[9px]">5</kbd>
              to switch tabs
            </span>
          </div>

          {/* ── Details Tab ──────────────────────────────────────────── */}
          <TabsContent value="details" className="mt-0 min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* LEFT — primary content (description) */}
              <div className="flex flex-col gap-5 px-6 py-5">
                {/* Description */}
                <div className="flex flex-col">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <MentionInput
                    value={description}
                    onChange={setDescription}
                    users={allUsers}
                    placeholder="Add a description… (type @ to mention)"
                    autoGrow
                    rows={4}
                    maxHeight={700}
                    className="py-2"
                  />
                  {description !== (task.description ?? "") ? (
                    <div className="mt-2 flex gap-2">
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

              {/* RIGHT — metadata sidebar */}
              <div className="flex flex-col gap-4 border-t border-border px-6 py-5 lg:border-l lg:border-t-0 lg:bg-surface-alt/20">
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

                {/* Priority — tinted picker popover */}
                <FieldRow label="Priority">
                  <PriorityPicker
                    value={task.priority}
                    onChange={(p) => save({ priority: p })}
                  />
                </FieldRow>

                {/* Assignees */}
                <FieldRow label="Assignees">
                  <AssigneesField
                    taskId={task.id}
                    selectedIds={task.assignee_ids}
                    members={members}
                    onChange={load}
                  />
                </FieldRow>

                {/* Watchers — who gets notified */}
                <FieldRow label="Watchers">
                  <WatchersField
                    taskId={task.id}
                    watcherIds={watcherIds}
                    members={members}
                    onChange={(ids) => setWatcherIds(ids)}
                  />
                </FieldRow>

                {/* Due date — native picker + quick buttons */}
                <FieldRow label="Due date">
                  <DatePickerField
                    value={task.due_date}
                    onChange={(v) => save({ due_date: v })}
                  />
                </FieldRow>

                {/* Start date */}
                <FieldRow label="Start date">
                  <DatePickerField
                    value={task.start_date}
                    onChange={(v) => save({ start_date: v })}
                    hideQuickButtons
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
                      className="h-7 w-20 rounded-md border border-border bg-surface px-2 text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
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

              </div>
            </div>
          </TabsContent>

          {/* ── Checklist Tab ────────────────────────────────────────── */}
          <TabsContent value="checklist" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <div className="h-full">
              <div className="space-y-4 px-4 py-4 pb-10">
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
            </div>
          </TabsContent>

          {/* ── Comments Tab ─────────────────────────────────────────── */}
          <TabsContent value="comments" className="mt-0 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto">
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
            </div>

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
          <TabsContent value="activity" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <div className="h-full">
              <div className="space-y-1 px-4 py-4 pb-10">
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
            </div>
          </TabsContent>

          {/* ── Time Tracking Tab ────────────────────────────────────── */}
          <TabsContent value="time" className="mt-0 flex-1 min-h-0 overflow-y-auto">
            <div className="h-full">
              <div className="space-y-4 px-4 py-4 pb-10">
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
            </div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
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

// ---------------------------------------------------------------------------
// PriorityPicker — colored pill + popover with keyboard-friendly options.
// ---------------------------------------------------------------------------

function PriorityPicker({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (p: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = priorities.find((p) => p.value === value) ?? priorities[4];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[13px] font-medium",
            "hover:border-accent/50 hover:bg-surface-alt transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          )}
        >
          {active.value !== "none" ? (
            <Flag className={cn("h-3.5 w-3.5", active.color)} />
          ) : (
            <Flag className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
          <span className={active.color}>{active.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-40 p-1">
        {priorities.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onChange(p.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
              "hover:bg-surface-alt",
              p.value === value && "bg-accent-soft/60",
            )}
          >
            <Flag
              className={cn(
                "h-3.5 w-3.5",
                p.value === "none" ? "text-muted-foreground/30" : p.color,
              )}
            />
            <span
              className={cn(
                p.value === "none" ? "text-muted-foreground" : p.color,
                "font-medium",
              )}
            >
              {p.label}
            </span>
            {p.value === value && (
              <Check className="ml-auto h-3.5 w-3.5 text-accent" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// DatePickerField — native date input + quick-pick shortcuts (Today, Tmrw,
// Next week, Clear) for faster task triage.
// ---------------------------------------------------------------------------

function DatePickerField({
  value,
  onChange,
  hideQuickButtons = false,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  hideQuickButtons?: boolean;
}) {
  function iso(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  const isOverdue =
    value && new Date(value + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <CalendarIcon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            isOverdue ? "text-rose-500" : "text-muted-foreground",
          )}
        />
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={cn(
            "h-7 flex-1 rounded-md border border-border bg-surface px-2 text-[13px] outline-none",
            "focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors",
            isOverdue && "border-rose-300 text-rose-600",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Clear date"
            className="text-muted-foreground/50 hover:text-rose-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {!hideQuickButtons && (
        <div className="flex flex-wrap gap-1">
          {[
            { label: "Today", value: iso(0) },
            { label: "Tmrw", value: iso(1) },
            { label: "+1w", value: iso(7) },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange(q.value)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                value === q.value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-accent/50 hover:text-accent",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssigneesField — avatar stack + popover to add/remove people.
// ---------------------------------------------------------------------------

function AssigneesField({
  taskId,
  selectedIds,
  members,
  onChange,
}: {
  taskId: string;
  selectedIds: string[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  onChange: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const selectedSet = new Set(selectedIds);
  const selected = members.filter((m) => selectedSet.has(m.id));

  function toggle(id: string) {
    start(async () => {
      if (selectedSet.has(id)) await removeAssignee(taskId, id);
      else await addAssignee(taskId, id);
      await onChange();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-7 w-full items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-left",
            "hover:border-accent/50 hover:bg-surface-alt transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          )}
        >
          {selected.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5" />
              Assign…
            </span>
          ) : (
            <div className="flex -space-x-1.5">
              {selected.slice(0, 5).map((m) =>
                m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    src={m.avatar_url}
                    alt={m.full_name ?? ""}
                    title={m.full_name ?? ""}
                    className="h-5 w-5 rounded-full ring-2 ring-surface object-cover"
                  />
                ) : (
                  <span
                    key={m.id}
                    title={m.full_name ?? ""}
                    className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-[9px] font-bold text-accent ring-2 ring-surface"
                  >
                    {(m.full_name ?? "?")[0]?.toUpperCase()}
                  </span>
                ),
              )}
              {selected.length > 5 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold ring-2 ring-surface">
                  +{selected.length - 5}
                </span>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-56 p-1">
        {members.length === 0 ? (
          <p className="px-2 py-1.5 text-[12px] text-muted-foreground">No members yet.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {members.map((m) => {
              const on = selectedSet.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
                    "hover:bg-surface-alt",
                    on && "bg-accent-soft/60",
                  )}
                >
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold">
                      {(m.full_name ?? "?")[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{m.full_name ?? "Unnamed"}</span>
                  {on && <Check className="ml-auto h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// WatchersField — same shape as assignees but wired to task_watchers.
// ---------------------------------------------------------------------------

function WatchersField({
  taskId,
  watcherIds,
  members,
  onChange,
}: {
  taskId: string;
  watcherIds: string[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const selectedSet = new Set(watcherIds);

  function toggle(id: string) {
    start(async () => {
      const wasOn = selectedSet.has(id);
      if (wasOn) {
        await removeWatcher(taskId, id);
        onChange(watcherIds.filter((x) => x !== id));
      } else {
        await addWatcher(taskId, id);
        onChange([...watcherIds, id]);
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[12.5px]",
            "hover:border-accent/50 hover:bg-surface-alt transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          )}
        >
          {watcherIds.length > 0 ? (
            <>
              <Eye className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">{watcherIds.length}</span>
              <span className="text-muted-foreground">watching</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-muted-foreground">Not watched</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-56 p-1">
        {members.length === 0 ? (
          <p className="px-2 py-1.5 text-[12px] text-muted-foreground">No members yet.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {members.map((m) => {
              const on = selectedSet.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors",
                    "hover:bg-surface-alt",
                    on && "bg-accent-soft/60",
                  )}
                >
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatar_url}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold">
                      {(m.full_name ?? "?")[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{m.full_name ?? "Unnamed"}</span>
                  {on && <Eye className="ml-auto h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
