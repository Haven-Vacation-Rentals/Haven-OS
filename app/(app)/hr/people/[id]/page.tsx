import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getEmployee,
  listReviews,
  listIssues,
  listEmployeeAccess,
  listLinkableProfiles,
} from "@/lib/hr/actions";
import { listDepartments, listUsers } from "@/lib/admin/actions";
import { getPermissions } from "@/lib/auth/permissions";
import { EmployeeDetail } from "@/components/hr/employee-detail";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const perm = await getPermissions();
  const canManageAccess = perm.is_super_admin;

  const [reviews, issues, departments, access, profiles, users] = await Promise.all([
    listReviews(id),
    listIssues(id),
    listDepartments(true),
    listEmployeeAccess(id),
    listLinkableProfiles(),
    canManageAccess ? listUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/hr/people"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to People
      </Link>
      <EmployeeDetail
        employee={employee}
        reviews={reviews}
        issues={issues}
        departments={departments}
        access={access}
        profiles={profiles}
        users={users}
        canManageAccess={canManageAccess}
      />
    </div>
  );
}
