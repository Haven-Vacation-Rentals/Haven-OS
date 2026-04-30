"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  CalendarDays,
  CheckCircle2,
  UserPlus,
  Inbox,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  deleteNotification,
  getMyNotifications,
  getMyUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import type { Notification, NotificationKind } from "@/lib/notifications/types";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  task_assigned: UserPlus,
  task_status_changed: CheckCircle2,
  task_due_changed: CalendarDays,
  task_comment_added: MessageSquare,
  task_completed: CheckCircle2,
  task_archived: Inbox,
};

const KIND_TINT: Record<string, string> = {
  task_assigned: "text-sky-600 dark:text-sky-400",
  task_status_changed: "text-amber-600 dark:text-amber-400",
  task_due_changed: "text-amber-600 dark:text-amber-400",
  task_comment_added: "text-violet-600 dark:text-violet-400",
  task_completed: "text-emerald-600 dark:text-emerald-400",
  task_archived: "text-muted-foreground",
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell({
  initialUnread = 0,
}: {
  initialUnread?: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        getMyNotifications(50),
        getMyUnreadCount(),
      ]);
      setItems(list);
      setUnread(count);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  // Load when opened, plus poll every 60s while mounted to catch new
  // notifications without a full page refresh.
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    const t = setInterval(() => {
      void getMyUnreadCount().then((c) => setUnread(c)).catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  function handleMarkRead(id: string) {
    setItems((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    startTransition(async () => {
      try {
        await markNotificationRead(id);
      } catch {
        toast.error("Couldn't mark as read");
        await refresh();
      }
    });
  }

  function handleMarkAllRead() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((curr) =>
      curr.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    );
    setUnread(0);
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        toast.success("All caught up");
      } catch {
        toast.error("Couldn't mark all as read");
        await refresh();
      }
    });
  }

  function handleDelete(id: string) {
    setItems((curr) => curr.filter((n) => n.id !== id));
    startTransition(async () => {
      try {
        await deleteNotification(id);
      } catch {
        toast.error("Couldn't dismiss");
        await refresh();
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread > 0
              ? `Notifications (${unread} unread)`
              : "Notifications"
          }
        >
          <span className="relative inline-flex">
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] max-w-[calc(100vw-32px)] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[13px] font-semibold">Notifications</span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unread === 0}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium transition-colors",
              unread === 0
                ? "text-muted-foreground/50"
                : "text-accent hover:underline",
            )}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {!loaded ? (
            <div className="grid place-items-center py-10 text-[12px] text-muted-foreground">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-30" />
              <span className="text-[12px]">You&apos;re all caught up.</span>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClose={() => setOpen(false)}
                  onMarkRead={() => handleMarkRead(n.id)}
                  onDelete={() => handleDelete(n.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  n,
  onClose,
  onMarkRead,
  onDelete,
}: {
  n: Notification;
  onClose: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const Icon =
    KIND_ICON[n.kind as NotificationKind] ?? Bell;
  const tint = KIND_TINT[n.kind as NotificationKind] ?? "text-muted-foreground";
  const unread = !n.read_at;

  const inner = (
    <>
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-alt",
          tint,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          {unread ? (
            <span
              aria-hidden
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            />
          ) : null}
          <span
            className={cn(
              "line-clamp-2 text-[12.5px] leading-snug",
              unread ? "font-semibold text-foreground" : "text-foreground/80",
            )}
          >
            {n.title}
          </span>
        </div>
        {n.body ? (
          <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
            {n.body}
          </p>
        ) : null}
        <span className="mt-1 inline-block text-[10.5px] text-muted-foreground">
          {formatRelative(n.created_at)}
        </span>
      </div>
    </>
  );

  return (
    <li className="group relative">
      {n.subject_url ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Link
          href={n.subject_url as any}
          onClick={() => {
            if (unread) onMarkRead();
            onClose();
          }}
          className="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-alt/50"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-3 py-2.5">{inner}</div>
      )}

      {/* Row actions */}
      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {unread ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead();
            }}
            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-surface hover:text-foreground"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-surface hover:text-foreground"
          aria-label="Dismiss"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}
