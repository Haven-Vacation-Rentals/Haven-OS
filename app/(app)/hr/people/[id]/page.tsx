import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEmployee, listReviews, listIssues } from "@/lib/hr/actions";
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

  const [reviews, issues] = await Promise.all([listReviews(id), listIssues(id)]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/hr"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to People
      </Link>
      <EmployeeDetail employee={employee} reviews={reviews} issues={issues} />
    </div>
  );
}
