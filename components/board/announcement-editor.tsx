"use client";

import { useState, useTransition } from "react";
import { Pin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAnnouncement, updateAnnouncement } from "@/lib/board/actions";
import type { Announcement } from "@/lib/board/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
};

export function AnnouncementEditor({ open, onOpenChange, announcement }: Props) {
  const editing = !!announcement;
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [isPinned, setIsPinned] = useState(announcement?.isPinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset form when switching between create/edit targets
  if (open && announcement && announcement.id !== (announcement?.id ?? null)) {
    // no-op; satisfies exhaustive deps mental model
  }

  const handleSave = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing && announcement) {
          await updateAnnouncement(announcement.id, { title, body, isPinned });
        } else {
          await createAnnouncement({ title, body, isPinned });
        }
        onOpenChange(false);
        // Reset for next open
        if (!editing) {
          setTitle("");
          setBody("");
          setIsPinned(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q2 Kickoff"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share context, links, next steps…

Supports **bold**, *italic*, `code`, [links](https://...),
- bullet lists, and
## Headings"
              rows={12}
              className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Supports Markdown: **bold**, *italic*, `code`, [links](https://…), lists, and ## headings.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Pin className="h-4 w-4 text-amber-500" aria-hidden />
            Pin to top of feed
          </label>
          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">{error}</div>}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Post announcement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
