import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import {
  getLeadMagnet,
  listLeadMagnetSubmissions,
} from "@/lib/gtm/lead-magnets/actions";
import { LeadMagnetEditor } from "@/components/gtm/lead-magnets/lead-magnet-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Magnet — Haven OS",
};

export default async function LeadMagnetDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const { id } = await props.params;
  const magnet = await getLeadMagnet(id);
  if (!magnet) notFound();

  const submissions = await listLeadMagnetSubmissions(id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/gtm/lead-magnets"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Lead Magnets
        </Link>
      </div>
      <LeadMagnetEditor magnet={magnet} submissions={submissions} />
    </div>
  );
}
