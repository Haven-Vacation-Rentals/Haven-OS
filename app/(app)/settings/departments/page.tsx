import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/user";
import { getPermissions } from "@/lib/auth/permissions";
import { listDepartments } from "@/lib/admin/actions";
import { DepartmentsCard } from "@/components/settings/departments-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Departments — Haven OS",
};

export default async function DepartmentsSettingsPage() {
  await requireUser();
  const perm = await getPermissions();
  if (!perm.is_super_admin) redirect("/settings" as never);

  const departments = await listDepartments(true);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div>
        <Link
          href={"/settings" as never}
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Settings
        </Link>
      </div>
      <header>
        <h1 className="font-heading text-display-3 font-bold">Departments</h1>
        <p className="text-[13px] text-muted-foreground">
          Manage the list of departments used across HR and employee records.
        </p>
      </header>

      <DepartmentsCard initialDepartments={departments} />
    </div>
  );
}
