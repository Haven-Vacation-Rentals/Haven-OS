import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import { listPitches } from "@/lib/sales/actions";
import { PitchesList } from "@/components/sales/pitches-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Property Pitches — Haven OS",
};

export default async function PitchesPage() {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const [active, archived] = await Promise.all([
    listPitches({ includeArchived: false }),
    listPitches({ includeArchived: true }).then((rows) =>
      rows.filter((p) => p.status === "archived"),
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="haven-eyebrow text-haven-coral">Sales</div>
          <h1 className="font-heading text-display-3 text-foreground">
            Property Pitches
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
            Drop in a Zillow or OTA link, set a projection range, and Haven OS
            will spin up a personalized one-pager you can send to a property
            owner. Pitch links expire after 30 days.{" "}
            <Link
              href="/sales/pitches"
              className="text-haven-coral underline-offset-2 hover:underline"
            >
              Learn more
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-accent-soft/40 border border-haven-coral/30 px-3 py-2 text-[12px] text-haven-coral-700">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="font-semibold">Sales · v1</span>
        </div>
      </header>

      <PitchesList active={active} archived={archived} />
    </div>
  );
}
