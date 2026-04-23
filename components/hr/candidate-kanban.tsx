"use client";

import { CandidateCard } from "./candidate-card";
import { CANDIDATE_STAGES, CANDIDATE_STAGE_LABELS, type CandidateStage, type DbCandidate } from "@/lib/hr/types";

export function CandidateKanban({
  candidates,
  roleId,
}: {
  candidates: DbCandidate[];
  roleId: string;
}) {
  const byStage: Record<CandidateStage, DbCandidate[]> = {
    applied: [],
    screen: [],
    interview: [],
    offer: [],
    hired: [],
    rejected: [],
  };
  for (const c of candidates) {
    const stage = (c.stage as CandidateStage);
    if (byStage[stage]) byStage[stage].push(c);
    else byStage.applied.push(c);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {CANDIDATE_STAGES.map((stage) => (
        <Column
          key={stage}
          stage={stage}
          candidates={byStage[stage]}
          roleId={roleId}
        />
      ))}
    </div>
  );
}

function Column({
  stage,
  candidates,
  roleId,
}: {
  stage: CandidateStage;
  candidates: DbCandidate[];
  roleId: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface-alt/30 p-2">
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {CANDIDATE_STAGE_LABELS[stage]}
        </div>
        <div className="text-[11px] text-muted-foreground">{candidates.length}</div>
      </div>
      <div className="flex flex-col gap-2">
        {candidates.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface/40 py-4 text-center text-[11px] text-muted-foreground">
            None
          </div>
        ) : (
          candidates.map((c) => <CandidateCard key={c.id} candidate={c} roleId={roleId} />)
        )}
      </div>
    </div>
  );
}
