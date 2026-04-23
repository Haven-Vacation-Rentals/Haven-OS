import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRole, listCandidates } from "@/lib/hr/actions";
import { RoleDetail } from "@/components/hr/role-detail";

export const dynamic = "force-dynamic";

export default async function RolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  const role = await getRole(roleId);
  if (!role) notFound();

  const candidates = await listCandidates(roleId);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/hr/hiring"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Hiring
      </Link>
      <RoleDetail role={role} candidates={candidates} />
    </div>
  );
}
