import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  MessageSquareText,
  RefreshCw,
  Star,
} from "lucide-react";
import {
  HostawayError,
  getReviews,
  isConfigured as isHostawayConfigured,
  type HostawayReview,
} from "@/lib/hostaway/client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const REVIEW_TYPES = ["guest-to-host", "host-to-guest"] as const;
type ReviewType = (typeof REVIEW_TYPES)[number];

const REVIEW_STATUSES = [
  "all",
  "awaiting",
  "pending",
  "scheduled",
  "submitted",
  "published",
  "expired",
] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const WINDOW_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "all", label: "All time" },
] as const;
type ReviewWindow = (typeof WINDOW_OPTIONS)[number]["value"];

type SearchParams = {
  status?: string;
  window?: string;
  type?: string;
};

type ReviewLoadResult =
  | { ok: true; reviews: HostawayReview[] }
  | { ok: false; reason: "unconfigured" | "error"; message: string };

function asReviewType(value: string | undefined): ReviewType {
  return REVIEW_TYPES.includes(value as ReviewType)
    ? (value as ReviewType)
    : "guest-to-host";
}

function asStatus(value: string | undefined): ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus)
    ? (value as ReviewStatus)
    : "all";
}

function asWindow(value: string | undefined): ReviewWindow {
  return WINDOW_OPTIONS.some((option) => option.value === value)
    ? (value as ReviewWindow)
    : "90";
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadReviews({
  status,
  reviewType,
  window,
}: {
  status: ReviewStatus;
  reviewType: ReviewType;
  window: ReviewWindow;
}): Promise<ReviewLoadResult> {
  if (!isHostawayConfigured()) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "Hostaway is not configured. Add HOSTAWAY_ACCOUNT_ID and HOSTAWAY_API_KEY to enable live reviews.",
    };
  }

  try {
    const days = window === "all" ? null : Number(window);
    const reviews = await getReviews({
      type: reviewType,
      statuses: status === "all" ? undefined : status,
      departureDateStart: days ? isoDaysAgo(days - 1) : undefined,
      departureDateEnd: days ? isoToday() : undefined,
      limit: 500,
      revalidate: 60,
    });
    return { ok: true, reviews };
  } catch (err) {
    const message =
      err instanceof HostawayError
        ? err.message
        : "Hostaway reviews could not be loaded.";
    return { ok: false, reason: "error", message };
  }
}

export default async function OperationsReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = asStatus(sp.status);
  const reviewType = asReviewType(sp.type);
  const window = asWindow(sp.window);
  const result = await loadReviews({ status, reviewType, window });

  const reviews = result.ok ? result.reviews : [];
  const summary = summarizeReviews(reviews);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Operations
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft">
            <Star className="h-5 w-5 text-haven-coral-700" />
          </div>
          <div>
            <h1 className="font-heading text-display-2 font-bold tracking-tight">
              Reviews
            </h1>
            <p className="text-sm text-muted-foreground">
              Live Hostaway guest feedback by property, stay window, rating, and response status.
            </p>
          </div>
        </div>
      </header>

      <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select name="status" label="Status" value={status}>
            {REVIEW_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : titleize(option)}
              </option>
            ))}
          </Select>
          <Select name="window" label="Window" value={window}>
            {WINDOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select name="type" label="Type" value={reviewType}>
            <option value="guest-to-host">Guest to host</option>
            <option value="host-to-guest">Host to guest</option>
          </Select>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            <RefreshCw className="h-4 w-4" />
            Apply
          </button>
        </div>
        <Link
          href="/operations/reviews"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Reset
        </Link>
      </form>

      {!result.ok ? <ConfigState result={result} /> : null}

      {result.ok ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              label="Average 5-star"
              value={summary.averageRatingFive}
              icon={Star}
              sub={`Raw Hostaway avg: ${summary.averageRatingTen}/10`}
              accent
            />
            <KpiCard
              label="Reviews"
              value={String(summary.count)}
              icon={MessageSquareText}
              sub={window === "all" ? "All loaded reviews" : `Last ${window} days`}
            />
            <KpiCard
              label="Published"
              value={String(summary.statuses.published)}
              icon={Star}
            />
            <KpiCard
              label="Submitted"
              value={String(summary.statuses.submitted)}
              icon={CalendarDays}
            />
            <KpiCard
              label="Awaiting"
              value={String(summary.statuses.awaiting)}
              icon={AlertCircle}
            />
          </div>

          {reviews.length === 0 ? (
            <EmptyState />
          ) : (
            <ReviewsTable reviews={reviews} />
          )}
        </>
      ) : null}
    </div>
  );
}

function Select({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring"
      >
        {children}
      </select>
    </label>
  );
}

function ConfigState({ result }: { result: Exclude<ReviewLoadResult, { ok: true }> }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold">
            {result.reason === "unconfigured"
              ? "Hostaway reviews are not connected"
              : "Hostaway reviews are unavailable"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-2 px-5 py-12 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-card bg-surface-alt">
        <MessageSquareText className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-base font-bold">No reviews found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Try widening the date window or clearing the status filter.
      </p>
    </Card>
  );
}

function ReviewsTable({ reviews }: { reviews: HostawayReview[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="font-heading text-base font-bold">Recent reviews</h2>
        <span className="text-xs text-muted-foreground">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2 font-semibold">Stay</th>
              <th className="px-3 py-2 font-semibold">Listing</th>
              <th className="px-3 py-2 font-semibold">Guest</th>
              <th className="px-3 py-2 font-semibold">Rating</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Feedback</th>
              <th className="px-5 py-2 font-semibold">Response</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr
                key={review.id}
                className="border-b border-border/60 align-top transition-colors hover:bg-surface-alt/50"
              >
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">
                    {formatDate(review.departureDate)}
                  </div>
                  <div>Arrival {formatDate(review.arrivalDate)}</div>
                </td>
                <td className="max-w-[190px] px-3 py-3 font-semibold">
                  <div className="line-clamp-2">
                    {review.listingName || `Listing ${review.listingMapId ?? "unknown"}`}
                  </div>
                  {review.reservationId ? (
                    <div className="mt-1 text-xs font-normal text-muted-foreground">
                      Reservation {review.reservationId}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3">{review.guestName || "Unknown"}</td>
                <td className="px-3 py-3">
                  <RatingDisplay rating={review.rating} />
                </td>
                <td className="px-3 py-3">
                  <Badge tone={statusTone(review.status)} dot>
                    {titleize(review.status)}
                  </Badge>
                </td>
                <td className="max-w-[310px] px-3 py-3">
                  <Snippet label="Public" value={review.publicReview} />
                  <Snippet label="Private" value={review.privateFeedback} />
                </td>
                <td className="max-w-[260px] px-5 py-3">
                  {review.revieweeResponse ? (
                    <p className="line-clamp-4 text-sm text-foreground">
                      {review.revieweeResponse}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground">No response</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Snippet({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="line-clamp-3 text-sm text-foreground">{value}</p>
    </div>
  );
}

function summarizeReviews(reviews: HostawayReview[]) {
  const rated = reviews.filter((review) => typeof review.rating === "number");
  const average =
    rated.length > 0
      ? rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / rated.length
      : null;

  return {
    count: reviews.length,
    averageRatingFive: formatFiveStarRating(average),
    averageRatingTen: formatTenPointRating(average),
    statuses: {
      published: countStatus(reviews, "published"),
      submitted: countStatus(reviews, "submitted"),
      awaiting: countStatus(reviews, "awaiting"),
    },
  };
}

function countStatus(reviews: HostawayReview[], status: string): number {
  return reviews.filter((review) => review.status === status).length;
}

function RatingDisplay({ rating }: { rating: number | null }) {
  return (
    <div className="flex flex-col gap-1 tabular-nums">
      <span className="inline-flex items-center gap-1 font-semibold">
        <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
        {formatFiveStarRating(rating)}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {formatTenPointRating(rating)}/10 raw
      </span>
    </div>
  );
}

function formatTenPointRating(rating: number | null): string {
  return typeof rating === "number" ? rating.toFixed(1) : "—";
}

function formatFiveStarRating(rating: number | null): string {
  return typeof rating === "number" ? `${(rating / 2).toFixed(1)}/5` : "—";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function titleize(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string): BadgeProps["tone"] {
  switch (status) {
    case "published":
      return "success";
    case "submitted":
    case "scheduled":
      return "sage";
    case "awaiting":
    case "pending":
      return "warn";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}
