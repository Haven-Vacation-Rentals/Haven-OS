/**
 * Recurring-task helpers.
 *
 * Kept intentionally small: just compute the *next* due date given a rule,
 * a reference date, and a completion date. The server is the source of truth
 * for rollover logic — the UI only edits the rule.
 */

import type { RecurrenceRule } from "./types";

/** Format a Date as ISO yyyy-mm-dd (local, not UTC — matches how tasks.due_date is stored). */
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function addYears(d: Date, n: number): Date {
  const out = new Date(d);
  out.setFullYear(out.getFullYear() + n);
  return out;
}

/**
 * Compute the next occurrence date for a recurring task.
 *
 * @param rule       The recurrence rule.
 * @param prevDue    Previous due date (yyyy-mm-dd) or null when unset.
 * @param completedAt Date the task was marked complete (ISO string). Used as
 *                   fallback when the rule is anchored to "completion" or
 *                   when no prevDue exists.
 * @returns yyyy-mm-dd of the next occurrence, or null if the series has ended.
 */
export function computeNextOccurrence(
  rule: RecurrenceRule,
  prevDue: string | null,
  completedAt: string | Date,
): string | null {
  const interval = Math.max(1, rule.interval ?? 1);
  const anchor = rule.anchor ?? "due_date";

  // Base date — where we start counting from
  const base: Date =
    anchor === "completion" || !prevDue
      ? typeof completedAt === "string"
        ? new Date(completedAt)
        : completedAt
      : parseIsoDate(prevDue);

  let next: Date;

  switch (rule.pattern) {
    case "daily":
      next = addDays(base, interval);
      break;

    case "weekly": {
      // If days_of_week provided, find the next matching weekday after base.
      // Otherwise advance by interval weeks.
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        const days = [...rule.days_of_week].sort((a, b) => a - b);
        const baseDay = base.getDay();
        const upcoming = days.find((d) => d > baseDay);
        if (upcoming !== undefined) {
          next = addDays(base, upcoming - baseDay);
        } else {
          // Wrap to first day, skipping (interval-1) weeks
          next = addDays(base, 7 * interval - baseDay + days[0]);
        }
      } else {
        next = addDays(base, 7 * interval);
      }
      break;
    }

    case "monthly": {
      next = addMonths(base, interval);
      if (rule.day_of_month) {
        const lastDayOfNext = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0,
        ).getDate();
        next.setDate(Math.min(rule.day_of_month, lastDayOfNext));
      }
      break;
    }

    case "yearly":
      next = addYears(base, interval);
      break;

    default:
      return null;
  }

  // Respect "ends" constraints
  if (rule.ends.type === "on") {
    const limit = parseIsoDate(rule.ends.date);
    if (next > limit) return null;
  }
  // "after" (count) is enforced by the server using tasks.recurrence_count

  return toIsoDate(next);
}

/**
 * Human-readable summary of a rule — used in the UI to show "Every 2 weeks"
 * etc. without the user having to open the picker.
 */
export function summarizeRule(rule: RecurrenceRule | null | undefined): string {
  if (!rule) return "Doesn't repeat";
  const every = rule.interval > 1 ? `Every ${rule.interval} ` : "Every ";
  const unit = (() => {
    switch (rule.pattern) {
      case "daily":
        return rule.interval > 1 ? "days" : "day";
      case "weekly":
        return rule.interval > 1 ? "weeks" : "week";
      case "monthly":
        return rule.interval > 1 ? "months" : "month";
      case "yearly":
        return rule.interval > 1 ? "years" : "year";
    }
  })();
  let summary = `${every}${unit}`;
  if (rule.pattern === "weekly" && rule.days_of_week && rule.days_of_week.length > 0) {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    summary += ` on ${rule.days_of_week.sort((a, b) => a - b).map((d) => labels[d]).join(", ")}`;
  }
  if (rule.ends.type === "on") summary += ` until ${rule.ends.date}`;
  if (rule.ends.type === "after") summary += `, ${rule.ends.count}×`;
  return summary;
}
