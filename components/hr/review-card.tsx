"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewEditor } from "./review-editor";
import { deleteReview } from "@/lib/hr/actions";
import type { DbPerformanceReview } from "@/lib/hr/types";

const RATING_LABEL: Record<string, string> = {
  exceeds: "Exceeds expectations",
  meets: "Meets expectations",
  below: "Below expectations",
  needs_improvement: "Needs improvement",
};

const RATING_TONE: Record<string, "success" | "sage" | "warn" | "danger"> = {
  exceeds: "success",
  meets: "sage",
  below: "warn",
  needs_improvement: "danger",
};

export function ReviewCard({
  review,
  employeeId,
}: {
  review: DbPerformanceReview;
  employeeId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      try {
        await deleteReview(review.id, employeeId);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const rating = review.rating ?? "";
  const ratingLabel = RATING_LABEL[rating] ?? rating;
  const tone = RATING_TONE[rating];

  return (
    <div className="haven-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-heading text-[14px] font-bold">
              {formatDate(review.review_date)}
            </div>
            {rating && tone && (
              <Badge tone={tone} className="text-[10px]">
                {ratingLabel}
              </Badge>
            )}
          </div>
          {review.reviewer_email && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              by {review.reviewer_email}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      </div>

      {review.summary && (
        <Section label="Summary">
          <p className="whitespace-pre-wrap">{review.summary}</p>
        </Section>
      )}
      {review.goals && (
        <Section label="Goals">
          <p className="whitespace-pre-wrap">{review.goals}</p>
        </Section>
      )}

      <ReviewEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        employeeId={employeeId}
        review={review}
      />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[13px] leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
