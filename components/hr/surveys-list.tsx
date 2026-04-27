"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MessageSquare, ExternalLink, Users } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SurveyEditor } from "./survey-editor";
import {
  SURVEY_STATUS_LABELS,
  type SurveyListItem,
  type SurveyStatus,
} from "@/lib/hr/surveys-types";

const STATUS_TONE: Record<SurveyStatus, "neutral" | "success" | "warn"> = {
  draft: "neutral",
  active: "success",
  closed: "warn",
};

const STATUS_ORDER: SurveyStatus[] = ["active", "draft", "closed"];

export function SurveysList({ surveys }: { surveys: SurveyListItem[] }) {
  const [newOpen, setNewOpen] = useState(false);

  const byStatus: Record<SurveyStatus, SurveyListItem[]> = {
    active: [],
    draft: [],
    closed: [],
  };
  for (const s of surveys) {
    const k = (s.status as SurveyStatus) ?? "draft";
    (byStatus[k] ??= []).push(s);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-[18px] font-bold">Surveys</h2>
          <p className="text-sm text-muted-foreground">
            Build a form, share the public link, and track responses here.
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New survey
        </Button>
      </div>

      {surveys.length === 0 ? (
        <EmptyState onAdd={() => setNewOpen(true)} />
      ) : (
        STATUS_ORDER.map((status) => {
          const list = byStatus[status] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-[14px] font-bold">
                  {SURVEY_STATUS_LABELS[status]}
                </h3>
                <span className="text-[12px] text-muted-foreground">
                  {list.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((s) => (
                  <SurveyRow key={s.id} survey={s} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <SurveyEditor open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function SurveyRow({ survey }: { survey: SurveyListItem }) {
  const status = (survey.status as SurveyStatus) ?? "draft";
  const tone = STATUS_TONE[status] ?? "neutral";
  const last = survey.last_response_at
    ? `${formatDistanceToNowStrict(new Date(survey.last_response_at))} ago`
    : "No responses yet";

  return (
    <Link
      href={`/hr/surveys/${survey.id}` as never}
      className="haven-card haven-card-hover flex items-center gap-4 p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-haven-coral-700 dark:text-haven-coral">
        <MessageSquare className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate font-heading text-[14px] font-bold">
            {survey.title}
          </div>
          <Badge tone={tone} className="text-[10px]">
            {SURVEY_STATUS_LABELS[status] ?? survey.status}
          </Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {survey.response_count} response{survey.response_count === 1 ? "" : "s"}
          </span>
          <span>{survey.question_count} question{survey.question_count === 1 ? "" : "s"}</span>
          <span>{last}</span>
        </div>
      </div>
      {status === "active" && (
        <a
          href={`/survey/${survey.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View page
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </Link>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/30 py-12 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-heading text-[15px] font-bold">No surveys yet</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Create one to start collecting feedback from the team.
        </p>
      </div>
      <Button variant="primary" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        New survey
      </Button>
    </div>
  );
}
