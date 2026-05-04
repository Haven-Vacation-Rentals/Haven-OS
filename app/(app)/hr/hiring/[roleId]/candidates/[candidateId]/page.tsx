import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getCandidate,
  getRole,
  listCandidateNotes,
} from "@/lib/hr/actions";
import {
  listRoleQuestions,
  listCandidateAnswers,
} from "@/lib/hr/application-questions";
import { CandidateDetail } from "@/components/hr/candidate-detail";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ roleId: string; candidateId: string }>;
}) {
  const { roleId, candidateId } = await params;
  const [candidate, role] = await Promise.all([
    getCandidate(candidateId),
    getRole(roleId),
  ]);
  if (!candidate || !role || candidate.role_id !== roleId) notFound();

  const [notes, questions, answers] = await Promise.all([
    listCandidateNotes(candidateId),
    listRoleQuestions(roleId, { includeArchived: true }),
    listCandidateAnswers(candidateId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/hr/hiring/${roleId}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {role.title}
      </Link>
      <CandidateDetail
        candidate={candidate}
        role={role}
        notes={notes}
        questions={questions}
        answers={answers}
      />
    </div>
  );
}
