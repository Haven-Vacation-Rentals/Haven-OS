"use client";

import {
  LOST_ITEM_STATUS_LABELS,
  type LostItemStatus,
} from "@/lib/lost-items/types";

const STATUS_TONE: Record<LostItemStatus, string> = {
  pending_pickup:
    "bg-amber-50 text-amber-800 border-amber-200",
  picked_up:
    "bg-blue-50 text-blue-800 border-blue-200",
  delivered:
    "bg-teal-50 text-teal-800 border-teal-200",
  failed:
    "bg-rose-50 text-rose-700 border-rose-200",
  completed:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function StatusBadge({ status }: { status: LostItemStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        STATUS_TONE[status]
      }
    >
      {LOST_ITEM_STATUS_LABELS[status]}
    </span>
  );
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}
