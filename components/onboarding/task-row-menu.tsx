"use client";

/**
 * TaskRowMenu — quiet `⋯` overflow menu shown on hover/focus of a task row.
 * Hosts secondary actions (Open, Add subtask, Delete) so the row itself
 * stays clean and the trash icon is no longer the loudest thing on screen.
 */

import { useState } from "react";
import { MoreHorizontal, Trash2, ExternalLink, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function TaskRowMenu({
  onOpen,
  onAddSubtask,
  onDelete,
  alwaysVisible = false,
}: {
  onOpen?: () => void;
  onAddSubtask?: () => void;
  onDelete: () => void;
  /** When false, only visible on row hover (parent uses `group` class). */
  alwaysVisible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        title="More actions"
        aria-label="More actions"
        className={
          "shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md " +
          "text-muted-foreground hover:text-foreground hover:bg-surface-alt " +
          "focus-visible:outline-none focus-visible:shadow-ring " +
          (alwaysVisible
            ? ""
            : "opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100")
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[200px] p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {onOpen ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-surface-alt"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Open details</span>
          </button>
        ) : null}
        {onAddSubtask ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddSubtask();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-surface-alt"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Add subtask</span>
          </button>
        ) : null}
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
