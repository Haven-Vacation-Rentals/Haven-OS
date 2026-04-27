import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getSurvey,
  getSurveyQuestions,
  listResponses,
} from "@/lib/hr/surveys";
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

  const [questions, responses] = await Promise.all([
    getSurveyQuestions(id),
    listResponses(id),
  ]);

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
      />
    </div>
  );
}
