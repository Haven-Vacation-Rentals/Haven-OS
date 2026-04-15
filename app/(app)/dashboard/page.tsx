import {
  Activity,
  Building2,
  CircleDollarSign,
  Clock,
  DoorOpen,
  LogIn,
  Percent,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RangeTabs } from "@/components/dashboard/range-tabs";
import {
  ProfitDistribution,
  PropertiesByStage,
} from "@/components/dashboard/stage-distribution";
import {
  ActivityList,
  type ActivityRow,
} from "@/components/dashboard/activity-list";

/**
 * Dashboard — Phase 1 mock data. Wired to real queries once the Work
 * + Properties modules land. Layout deliberately mirrors the Tendwell
 * reference so the muscle memory carries over, re-skinned in Haven's
 * brand language (Futura numerics + coral accent).
 */
export default function DashboardPage() {
  const newProperties: ActivityRow[] = [
    { title: "Laura Earl 1117", subtitle: "Gatlinburg · 3 BR", meta: "Active" },
    { title: "Eric Fleming 1260", subtitle: "Pigeon Forge · 2 BR", meta: "Active" },
    { title: "David Sussman 3759", subtitle: "Sevierville · 4 BR", meta: "Active" },
    { title: "Adam Pike 1071", subtitle: "Gatlinburg · 3 BR", meta: "Active" },
    { title: "Bonnie Olsten 317", subtitle: "Townsend · 2 BR", meta: "Active" },
    { title: "Andrew Kirby 228", subtitle: "Gatlinburg · 5 BR", meta: "Active" },
  ];

  const offboarded: ActivityRow[] = [
    { title: "Ed Zorn 1531", subtitle: "Owner transferred", meta: "Apr 8" },
    { title: "Laurie Keenan 3428", subtitle: "Lease ended", meta: "Apr 8" },
    { title: "Laurie Keenan 2589", subtitle: "Lease ended", meta: "Apr 8" },
    { title: "Laurie Keenan 2587", subtitle: "Lease ended", meta: "Apr 8" },
    { title: "Josh Heuser 2646", subtitle: "Sold", meta: "Mar 22" },
    { title: "Sonia Schumm 2470", subtitle: "Sold", meta: "Mar 21" },
  ];

  const transitions: ActivityRow[] = [
    { title: "Ed Zorn 1531", subtitle: "Active → Offboarded", meta: "7 days ago" },
    { title: "Laura Earl 1117", subtitle: "Onboarding → Active", meta: "7 days ago" },
    { title: "Nathan Frame 4530", subtitle: "Onboarding → Active", meta: "7 days ago" },
    { title: "Laurie Keenan 2587", subtitle: "Active → Offboarded", meta: "7 days ago" },
    { title: "Adam Pike 1071", subtitle: "Onboarding → Active", meta: "7 days ago" },
    { title: "Eric Fleming 1260", subtitle: "Onboarding → Active", meta: "7 days ago" },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Operations overview</p>
      </div>

      <RangeTabs />

      {/* Top KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Properties"
          value="153"
          icon={Building2}
          delta={{ value: "+7", direction: "up" }}
        />
        <KpiCard
          label="Active"
          value="94"
          icon={Activity}
          delta={{ value: "+3", direction: "up" }}
        />
        <KpiCard
          label="Onboarding"
          value="5"
          icon={LogIn}
          sub="2 scheduled this week"
        />
        <KpiCard
          label="Offboarding"
          value="7"
          icon={DoorOpen}
          sub="3 completing this week"
        />
      </section>

      {/* Second KPI row — one accent card for focus */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Monthly Revenue"
          value="$112,174"
          icon={CircleDollarSign}
          sub="$23,315 profit"
          accent
        />
        <KpiCard
          label="Avg Profit %"
          value="21.1%"
          icon={Percent}
          delta={{ value: "+0.8pt", direction: "up" }}
        />
        <KpiCard
          label="Conversions"
          value="7"
          icon={Users}
          sub="in 30 days"
        />
        <KpiCard
          label="Avg Onboarding"
          value="— "
          icon={Clock}
          sub="No transitions yet"
        />
      </section>

      {/* Activity row — new properties + offboarded */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityList
          title="New Properties"
          subtitle="(30 days)"
          rows={newProperties}
          count={7}
          statusFor={() => ({ label: "Active", tone: "success" })}
        />
        <ActivityList
          title="Offboarded"
          subtitle="(30 days)"
          rows={offboarded}
          count={12}
          viewAllHref="/properties?status=offboarded"
        />
      </section>

      {/* Bottom row — distribution + stages + recent transitions */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProfitDistribution
          title="Profit Distribution"
          subtitle="(Active · current)"
          buckets={[
            { label: "High (≥30%)", count: 7, tone: "bg-emerald-500" },
            { label: "Mid (15–30%)", count: 69, tone: "bg-amber-400" },
            { label: "Low (0–15%)", count: 15, tone: "bg-rose-500" },
            { label: "Negative", count: 0, tone: "bg-foreground/40" },
          ]}
        />
        <PropertiesByStage
          title="Properties by Stage"
          subtitle="(current)"
          rows={[
            { label: "Lead", count: 0, dot: "bg-muted-foreground" },
            { label: "Quote", count: 33, dot: "bg-amber-500" },
            { label: "Onboarding", count: 5, dot: "bg-sky-500" },
            { label: "Active", count: 94, dot: "bg-emerald-500" },
            { label: "Offboarding", count: 7, dot: "bg-accent" },
            { label: "Offboarded", count: 14, dot: "bg-foreground/50" },
          ]}
        />
        <ActivityList
          title="Recent Transitions"
          subtitle="(30 days)"
          rows={transitions}
        />
      </section>
    </div>
  );
}
