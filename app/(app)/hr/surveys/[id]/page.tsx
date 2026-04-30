import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getSurvey,
  getSurveyQuestions,
  listResponses,
  listSurveyAccess,
} from "@/lib/hr/surveys";
import { getPermissions } from "@/lib/auth/permissions";
import { listUsers } from "@/lib/admin/actions";
import { SurveyDetail } from "@/components/hr/survey-detail";

export const dynamic = "force-dynamic";

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();

  const perm = await getPermissions();
  const canManageAccess = perm.is_super_admin;

  const [questions, responses, allResponses, access, users] = await Promise.all([
    getSurveyQuestions(id, { includeArchived: true }),
    listResponses(id),
    listResponses(id, { includeDeleted: true }),
    listSurveyAccess(id),
    canManageAccess ? listUsers() : Promise.resolve([]),
  ]);
  const deletedResponses = allResponses.filter((r) => r.deleted_at !== null);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/hr/surveys"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Surveys
      </Link>
      <SurveyDetail
        survey={survey}
        questions={questions}
        responses={responses}
        deletedResponses={deletedResponses}
        access={access}
        users={users}
        canManageAccess={canManageAccess}
      />
    </div>
  );
}
