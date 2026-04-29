import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import { listLeadMagnets } from "@/lib/gtm/lead-magnets/actions";
import { LeadMagnetsList } from "@/components/gtm/lead-magnets/lead-magnets-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Magnets — Haven OS",
};

export default async function LeadMagnetsPage() {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const all = await listLeadMagnets({ includeArchived: true });
  const drafts = all.filter((m) => m.status === "draft");
  const active = all.filter((m) => m.status === "active");
  const archived = all.filter((m) => m.status === "archived");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="haven-eyebrow text-haven-coral">GTM</div>
          <h1 className="font-heading text-display-3 text-foreground">
            Lead Magnets
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Spin up branded landing pages for guides, checklists, calculators, or
            any other lead magnet. Pages live at{" "}
            <code className="rounded bg-surface-alt px-1 text-[12px]">
              /lead-magnet/&lt;slug&gt;
            </code>{" "}
            and capture submissions back to Haven OS. Slugs are unguessable and
            expire automatically — bump <code>expires_at</code> to extend.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-accent-soft/40 border border-haven-coral/30 px-3 py-2 text-[12px] text-haven-coral-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-semibold">GTM · v1</span>
        </div>
      </header>

      <LeadMagnetsList drafts={drafts} active={active} archived={archived} />
    </div>
  );
}
