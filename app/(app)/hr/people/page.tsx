import { listEmployees } from "@/lib/hr/actions";
import { listDepartments } from "@/lib/admin/actions";
import { PeopleDirectory } from "@/components/hr/people-directory";

export const dynamic = "force-dynamic";

export default async function HrPeopleDirectoryPage() {
  const [employees, departments] = await Promise.all([
    listEmployees(),
    listDepartments(false),
  ]);
  return <PeopleDirectory employees={employees} departments={departments} />;
}
