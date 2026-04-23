"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Mail, Phone, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CandidateEditor } from "./candidate-editor";
import {
  deleteCandidate,
  updateCandidateStage,
} from "@/lib/hr/actions";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  type CandidateStage,
  type DbCandidate,
} from "@/lib/hr/types";

export function CandidateCard({
  candidate,
  roleId,
}: {
  candidate: DbCandidate;
  roleId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  const move = (stage: CandidateStage) => {
    startTransition(async () => {
      try {
        await updateCandidateStage(candidate.id, stage, roleId);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const remove = () => {
    if (!confirm("Delete this candidate?")) return;
    startTransition(async () => {
      try {
        await deleteCandidate(candidate.id, roleId);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="group flex flex-col gap-1.5 rounded-md border border-border bg-surface p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{candidate.name}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {candidate.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{candidate.email}</span>
              </span>
            )}
            {candidate.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {candidate.phone}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Candidate actions"
              className="rounded-md p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-alt group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            {candidate.resume_url && (
              <DropdownMenuItem asChild>
                <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                  Open resume
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Move to
            </div>
            {CANDIDATE_STAGES.filter((s) => s !== candidate.stage).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => move(s)}>
                {CANDIDATE_STAGE_LABELS[s]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={remove}
              className="text-rose-600 focus:text-rose-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge tone="neutral" className="text-[10px] capitalize">
          {candidate.source.replace("_", " ")}
        </Badge>
        {candidate.resume_url && (
          <Badge tone="neutral" className="text-[10px]">
            <ExternalLink className="h-2.5 w-2.5" />
            Resume
          </Badge>
        )}
      </div>
      {candidate.notes && (
        <div className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
          {candidate.notes}
        </div>
      )}

      <CandidateEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        roleId={roleId}
        candidate={candidate}
      />
    </div>
  );
}
