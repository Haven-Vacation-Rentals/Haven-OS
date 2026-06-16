import {
  listCompensationForms,
  listCompensationSubmissions,
} from "@/lib/hr/compensation";
import { CompensationDashboard } from "@/components/hr/compensation-dashboard";

export const dynamic = "force-dynamic";

export default async function HrCompensationPage() {
  const [forms, submissions] = await Promise.all([
    listCompensationForms(),
    listCompensationSubmissions(),
  ]);
  return <CompensationDashboard forms={forms} submissions={submissions} />;
}
