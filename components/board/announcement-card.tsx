"use client";

import { useState, useTransition } from "react";
import { Pin, PinOff, Pencil, Trash2, MoreVertical } from "lucide-react";
import { AnnouncementEditor } from "./announcement-editor";
import { deleteAnnouncement, togglePin } from "@/lib/board/actions";
import { renderAnnouncementBody } from "@/lib/board/markdown";
import type { Announcement } from "@/lib/board/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AnnouncementCard({
  announcement,
  isAdmin,
}: {
  announcement: Announcement;
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const html = renderAnnouncementBody(announcement.body);

  const handleDelete = () => {
    if (!confirm("Delete this announcement? This can't be undone.")) return;
    startTransition(async () => {
      await deleteAnnouncement(announcement.id);
    });
  };

  const handleTogglePin = () => {
    startTransition(async () => {
      await togglePin(announcement.id, !announcement.isPinned);
    });
  };

  return (
    <article
      className={`relative rounded-card border bg-surface p-4 shadow-card transition-opacity ${
        pending ? "opacity-60" : ""
      } ${announcement.isPinned ? "border-amber-400/60" : "border-border"}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {announcement.isPinned && (
            <Pin
              className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-amber-500"
              aria-label="Pinned"
            />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-heading text-[15px] font-bold leading-snug">
              {announcement.title}
            </h3>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {announcement.createdBy ? `${announcement.createdBy} · ` : ""}
              {relativeTime(announcement.createdAt)}
              {announcement.updatedAt !== announcement.createdAt && " · edited"}
            </div>
          </div>
        </div>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleTogglePin}>
                {announcement.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" /> Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" /> Pin to top
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Body */}
      {announcement.body && (
        <div
          className="prose-announcement mt-3 flex flex-col gap-2 text-[13px] text-foreground/90"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {isAdmin && (
        <AnnouncementEditor
          open={editOpen}
          onOpenChange={setEditOpen}
          announcement={announcement}
        />
      )}
    </article>
  );
}
