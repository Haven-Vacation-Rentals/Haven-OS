"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/work/types";

interface StatusPillProps {
  status: Status | null;
  interactive?: boolean;
  onClick?: () => void;
  taskId?: string;
  className?: string;
  size?: "sm" | "md";
}

/** Hex → rgba helper — adds alpha to a 3 or 6-digit hex color */
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEFAULT_COLOR = "#94a3b8";

export function StatusPill({
  status,
  interactive = false,
  onClick,
  taskId,
  className,
  size = "md",
}: StatusPillProps) {
  const color = status?.color ?? DEFAULT_COLOR;
  const name = status?.name ?? "No Status";

  const pill = (
    <motion.span
      layoutId={taskId ? `status-pill-${taskId}` : undefined}
      layout="preserve-aspect"
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      style={{
        backgroundColor: hexAlpha(color, 0.15),
        color,
        borderColor: hexAlpha(color, 0.3),
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 font-medium leading-none whitespace-nowrap",
        size === "sm" ? "h-[20px] text-[11px]" : "h-[22px] text-[12px]",
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </motion.span>
  );

  if (!interactive) return pill;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {pill}
    </motion.button>
  );
}
