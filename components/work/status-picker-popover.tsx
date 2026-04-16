"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { StatusPill } from "@/components/work/status-pill";
import type { Status } from "@/lib/work/types";

interface StatusPickerPopoverProps {
  statuses: Status[];
  currentStatus: Status | null;
  onSelect: (status: Status) => void;
  onManage?: () => void;
  children: React.ReactNode;
}

export function StatusPickerPopover({
  statuses,
  currentStatus,
  onSelect,
  onManage,
  children,
}: StatusPickerPopoverProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(status: Status) {
    onSelect(status);
    setOpen(false);
  }

  // Group statuses by category
  const grouped = statuses.reduce<Record<string, Status[]>>((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    closed: "Closed",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <AnimatePresence>
        {open && (
          <PopoverContent
            forceMount
            align="start"
            sideOffset={6}
            className="w-52 p-1.5"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-0.5">
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {categoryLabels[cat] ?? cat}
                    </p>
                    {items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(s)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-alt transition-colors"
                      >
                        <StatusPill status={s} size="sm" />
                        {currentStatus?.id === s.id && (
                          <Check className="ml-auto h-3.5 w-3.5 text-accent shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {onManage && (
                <>
                  <div className="mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onManage();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Manage statuses
                  </button>
                </>
              )}
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  );
}
