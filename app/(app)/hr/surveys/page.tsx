import { listSurveys } from "@/lib/hr/surveys";
import { SurveysList } from "@/components/hr/surveys-list";

export const dynamic = "force-dynamic";

export default async function HrSurveysPage() {
  const surveys = await listSurveys();
  return <SurveysList surveys={surveys} />;
}
