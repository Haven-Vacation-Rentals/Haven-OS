"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createReview, updateReview } from "@/lib/hr/actions";
import type { DbPerformanceReview } from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  review?: DbPerformanceReview | null;
};

export function ReviewEditor({ open, onOpenChange, employeeId, review }: Props) {
  const editing = !!review;
  const [reviewDate, setReviewDate] = useState(
    review?.review_date ?? new Date().toISOString().slice(0, 10),
  );
  const [rating, setRating] = useState(review?.rating ?? "");
  const [summary, setSummary] = useState(review?.summary ?? "");
  const [goals, setGoals] = useState(review?.goals ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (editing && review) {
          await updateReview(
            review.id,
            { review_date: reviewDate, rating: rating || null, summary, goals },
            employeeId,
          );
        } else {
          await createReview({
            employee_id: employeeId,
            review_date: reviewDate,
            rating,
            summary,
            goals,
          });
        }
        onOpenChange(false);
        if (!editing) {
          setRating("");
          setSummary("");
          setGoals("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit review" : "Log performance review"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Review date</label>
            <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              <option value="">—</option>
              <option value="exceeds">Exceeds expectations</option>
              <option value="meets">Meets expectations</option>
              <option value="below">Below expectations</option>
              <option value="needs_improvement">Needs improvement</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Strengths, wins, areas to work on…"
              className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Goals</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
              placeholder="Goals for next cycle…"
              className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Log review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
