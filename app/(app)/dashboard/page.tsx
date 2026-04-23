import { Star, Wallet } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoomCard } from "@/components/board/loom-card";
import { AnnouncementFeed } from "@/components/board/announcement-feed";
import {
  getPmCommissionTotal,
  getPortfolioReviewAverage,
  isConfigured as isHostawayConfigured,
} from "@/lib/hostaway/client";
import { getBoardData } from "@/lib/board/actions";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** Format a Date as Y-m-d (UTC-stable). */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Current month → today. */
function monthToDate() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from: ymd(first), to: ymd(now) };
}

function currency(n: number, code: string | null): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: code ?? "USD",
    maximumFractionDigits: 0,
  });
}

function currentMonthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

async function loadHostawayStats() {
  if (!isHostawayConfigured()) {
    return {
      connected: false,
      pmCommission: null as number | null,
      pmCurrency: null as string | null,
      pmCommissionRows: 0,
      reviewAverage: null as number | null,
      reviewCount: 0,
      error: null as string | null,
    };
  }
  const { from, to } = monthToDate();
  try {
    const [commission, reviews] = await Promise.all([
      getPmCommissionTotal({
        fromDate: from,
        toDate: to,
        dateType: "arrivalDate",
      }),
      getPortfolioReviewAverage(7),
    ]);
    return {
      connected: true,
      pmCommission: commission.total,
      pmCurrency: commission.currency,
      pmCommissionRows: commission.rowCount,
      reviewAverage: reviews.average,
      reviewCount: reviews.count,
      error: null as string | null,
    };
  } catch (err) {
    return {
      connected: true,
      pmCommission: null,
      pmCurrency: null,
      pmCommissionRows: 0,
      reviewAverage: null,
      reviewCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * The Board — team home page. Shows the quarterly Loom, announcements,
 * and live portfolio signals from Hostaway.
 */
export default async function BoardPage() {
  const [hostaway, board] = await Promise.all([
    loadHostawayStats(),
    getBoardData(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          The Board
        </h1>
        <p className="text-sm text-muted-foreground">
          Team home · quarterly updates, announcements, and live signals
        </p>
      </div>

      {/* Loom + announcements — two-column on desktop, stacked on mobile */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <LoomCard loom={board.loom} />
        <AnnouncementFeed
          announcements={board.announcements}
          isAdmin={board.isAdmin}
        />
      </section>

      {/* Live tiles */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="PM Commission · MTD"
          value={
            hostaway.pmCommission === null
              ? "—"
              : currency(hostaway.pmCommission, hostaway.pmCurrency)
          }
          icon={Wallet}
          sub={
            !hostaway.connected
              ? "Hostaway not connected — set it up in Settings"
              : hostaway.error
                ? `Hostaway error: ${hostaway.error.slice(0, 80)}`
                : `${currentMonthLabel()} · ${hostaway.pmCommissionRows} reservation${hostaway.pmCommissionRows === 1 ? "" : "s"}`
          }
          accent
        />
        <KpiCard
          label="Portfolio Review Avg · 7d"
          value={
            hostaway.reviewAverage === null
              ? "—"
              : `${hostaway.reviewAverage.toFixed(2)} ★`
          }
          icon={Star}
          sub={
            !hostaway.connected
              ? "Hostaway not connected"
              : hostaway.error
                ? "Check Hostaway connection"
                : hostaway.reviewCount === 0
                  ? "No rated reviews in the last 7 days"
                  : `${hostaway.reviewCount} review${hostaway.reviewCount === 1 ? "" : "s"} · scale 1–10`
          }
        />
      </section>
    </div>
  );
}
