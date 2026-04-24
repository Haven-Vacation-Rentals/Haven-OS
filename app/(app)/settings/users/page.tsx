import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/user";
import { getPermissions } from "@/lib/auth/permissions";
import { listUsers, listDepartments, listHrAccessGrants } from "@/lib/admin/actions";
import { listEmployees } from "@/lib/hr/actions";
import { UserPermissionsTable } from "@/components/settings/user-permissions-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "User Permissions — Haven OS",
};

export default async function UsersSettingsPage() {
  await requireUser();
  const perm = await getPermissions();
  if (!perm.is_super_admin) redirect("/settings" as never);

  const [users, departments, grants, employees] = await Promise.all([
    listUsers(),
    listDepartments(true),
    listHrAccessGrants(),
    listEmployees(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <header>
        <h1 className="font-heading text-display-3 font-bold">Users & Permissions</h1>
        <p className="text-[13px] text-muted-foreground">
          Manage everyone&apos;s role in Haven OS and grant granular HR access.
          Changes take effect on the user&apos;s next page load.
        </p>
      </header>

      <UserPermissionsTable
        users={users}
        departments={departments}
        grants={grants}
        employees={employees}
        currentUserId={perm.user_id ?? ""}
      />
    </div>
  );
}
