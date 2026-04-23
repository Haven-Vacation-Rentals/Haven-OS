import { listEmployees } from "@/lib/hr/actions";
import { PeopleDirectory } from "@/components/hr/people-directory";

export const dynamic = "force-dynamic";

export default async function HrPeoplePage() {
  const employees = await listEmployees();
  return <PeopleDirectory employees={employees} />;
}
