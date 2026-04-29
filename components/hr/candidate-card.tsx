"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Mail,
  Phone,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  isOverlay,
}: {
  candidate: DbCandidate;
  roleId: string;
  isOverlay?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const open = () => {
    router.push(`/hr/hiring/${roleId}/candidates/${candidate.id}`);
  };

  const move = (stage: CandidateStage) => {
    startTransition(async () => {
      try {
        await updateCandidateStage(candidate.id, stage, roleId);
        toast.success(`Moved to ${CANDIDATE_STAGE_LABELS[stage]}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const remove = () => {
    if (!confirm("Delete this candidate?")) return;
    startTransition(async () => {
      try {
        await deleteCandidate(candidate.id, roleId);
        toast.success("Candidate deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (isOverlay) return;
        // Ignore clicks that originated inside the dropdown menu trigger /
        // content. Those elements stop propagation themselves, but this is
        // a defence-in-depth.
        const target = e.target as HTMLElement;
        if (target.closest("[data-no-card-nav]")) return;
        open();
      }}
      onKeyDown={(e) => {
        // Space is reserved by dnd-kit's keyboard sensor; Enter opens the
        // detail page.
        if (e.key === "Enter") {
          e.preventDefault();
          open();
        }
      }}
      className={
        "group relative flex flex-col gap-1.5 rounded-md border border-border bg-surface p-2.5 shadow-sm " +
        (isOverlay
          ? "shadow-lg border-haven-coral-300 rotate-1"
          : "hover:shadow-md hover:border-foreground/20 transition-all")
      }
    >
      <GripVertical className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">
            {candidate.name}
          </div>
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
        <div data-no-card-nav onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Candidate actions"
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded-md p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-alt group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onSelect={open}>Open profile</DropdownMenuItem>
              {candidate.resume_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={candidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
      </div>
      <div className="flex flex-wrap items-center gap-1 pl-2">
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
        <div className="mt-1 line-clamp-3 pl-2 text-[11px] text-muted-foreground">
          {candidate.notes}
        </div>
      )}
    </div>
  );
}
