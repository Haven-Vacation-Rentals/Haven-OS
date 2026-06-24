import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  MessageSquareText,
  RefreshCw,
  Star,
} from "lucide-react";
import {
  HostawayError,
  getReviews,
  getReviewsPage,
  isConfigured as isHostawayConfigured,
  type HostawayReview,
} from "@/lib/hostaway/client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

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
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "180d", label: "180 days" },
  { value: "365d", label: "365 days" },
  { value: "2y", label: "2 years" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
] as const;
type ReviewWindow = (typeof WINDOW_OPTIONS)[number]["value"];

const RATING_BANDS = [
  "all",
  "5",
  "4.5",
  "4",
  "below4",
  "unrated",
] as const;
type RatingBand = (typeof RATING_BANDS)[number];

const RESPONSE_STATES = ["all", "responded", "needs_response"] as const;
type ResponseState = (typeof RESPONSE_STATES)[number];

const SORT_OPTIONS = [
  "newest_departure",
  "oldest_departure",
  "highest_rating",
  "lowest_rating",
  "listing",
  "guest",
] as const;
type ReviewSort = (typeof SORT_OPTIONS)[number];

type SearchParams = {
  status?: string;
  window?: string;
  start?: string;
  end?: string;
  rating?: string;
  listing?: string;
  guest?: string;
  response?: string;
  sort?: string;
};

type ReviewLoadResult =
  | { ok: true; reviews: HostawayReview[] }
  | { ok: false; reason: "unconfigured" | "error"; message: string };

function asStatus(value: string | undefined): ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus)
    ? (value as ReviewStatus)
    : "all";
}

function asWindow(value: string | undefined): ReviewWindow {
  return WINDOW_OPTIONS.some((option) => option.value === value)
    ? (value as ReviewWindow)
    : "365d";
}

function asRatingBand(value: string | undefined): RatingBand {
  return RATING_BANDS.includes(value as RatingBand)
    ? (value as RatingBand)
    : "all";
}

function asResponseState(value: string | undefined): ResponseState {
  return RESPONSE_STATES.includes(value as ResponseState)
    ? (value as ResponseState)
    : "all";
}

function asSort(value: string | undefined): ReviewSort {
  return SORT_OPTIONS.includes(value as ReviewSort)
    ? (value as ReviewSort)
    : "newest_departure";
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(value: string | undefined): string {
  return (value ?? "").trim();
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function windowDays(window: ReviewWindow): number | null {
  switch (window) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "180d":
      return 180;
    case "365d":
      return 365;
    case "2y":
      return 730;
    default:
      return null;
  }
}

function resolveDateRange({
  window,
  start,
  end,
}: {
  window: ReviewWindow;
  start: string | undefined;
  end: string | undefined;
}): { start?: string; end?: string; label: string } {
  if (window === "all") return { label: "All time" };

  if (window === "custom" && isIsoDate(start) && isIsoDate(end)) {
    return start <= end
      ? { start, end, label: `${formatShortDate(start)} - ${formatShortDate(end)}` }
      : { start: end, end: start, label: `${formatShortDate(end)} - ${formatShortDate(start)}` };
  }

  const days = windowDays(window) ?? 365;
  return {
    start: isoDaysAgo(days - 1),
    end: isoToday(),
    label:
      window === "custom"
        ? "365 days"
        : WINDOW_OPTIONS.find((option) => option.value === window)?.label ??
          "365 days",
  };
}

type ReviewFilters = {
  status: ReviewStatus;
  window: ReviewWindow;
  start: string;
  end: string;
  rating: RatingBand;
  listing: string;
  guest: string;
  response: ResponseState;
  sort: ReviewSort;
  dateRange: { start?: string; end?: string; label: string };
};

async function loadReviews({
  status,
  dateRange,
  sort,
  allTime,
}: {
  status: ReviewStatus;
  dateRange: ReviewFilters["dateRange"];
  sort: ReviewSort;
  allTime: boolean;
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
    const baseParams = {
      type: "guest-to-host",
      statuses: status === "all" ? undefined : status,
      departureDateStart: dateRange.start,
      departureDateEnd: dateRange.end,
      sortBy: sort === "guest" ? "guestName" : "departureDate",
      sortOrder: sort === "oldest_departure" || sort === "guest" ? "asc" : "desc",
      limit: 500,
      revalidate: 60,
    } as const;
    const reviews = allTime
      ? await loadAllReviewPages(baseParams)
      : await getReviews(baseParams);
    return {
      ok: true,
      reviews: reviews.filter((review) => review.type === "guest-to-host"),
    };
  } catch (err) {
    const message =
      err instanceof HostawayError
        ? err.message
        : "Hostaway reviews could not be loaded.";
    return { ok: false, reason: "error", message };
  }
}

async function loadAllReviewPages(
  params: Parameters<typeof getReviewsPage>[0],
): Promise<HostawayReview[]> {
  const limit = params?.limit ?? 500;
  const reviews: HostawayReview[] = [];
  let offset = params?.offset ?? 0;
  let total: number | undefined;
  let previousFirstId: number | undefined;

  do {
    const page = await getReviewsPage({ ...params, limit, offset });
    const pageReviews = page.result ?? [];
    const firstId = pageReviews[0]?.id;
    if (firstId !== undefined && firstId === previousFirstId) break;
    previousFirstId = firstId;
    reviews.push(...pageReviews);
    total = page.count;
    offset += limit;

    if (pageReviews.length < limit) break;
  } while (total === undefined || reviews.length < total);

  return reviews;
}

export default async function OperationsReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = asStatus(sp.status);
  const window = asWindow(sp.window);
  const filters: ReviewFilters = {
    status,
    window,
    start: cleanText(sp.start),
    end: cleanText(sp.end),
    rating: asRatingBand(sp.rating),
    listing: cleanText(sp.listing),
    guest: cleanText(sp.guest),
    response: asResponseState(sp.response),
    sort: asSort(sp.sort),
    dateRange: resolveDateRange({
      window,
      start: cleanText(sp.start),
      end: cleanText(sp.end),
    }),
  };
  const result = await loadReviews({
    status,
    dateRange: filters.dateRange,
    sort: filters.sort,
    allTime: filters.window === "all",
  });

  const loadedReviews = result.ok ? result.reviews : [];
  const reviews = sortReviews(filterReviews(loadedReviews, filters), filters.sort);
  const summary = summarizeReviews(reviews);
  const activeFilters = activeFilterSummary(filters);

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
              Live Hostaway guest-to-host feedback by property, stay window, rating, and response status.
            </p>
          </div>
        </div>
      </header>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-12 lg:items-end">
          <Select name="window" label="History" value={filters.window} className="lg:col-span-2">
            {WINDOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Field label="Start" className="lg:col-span-2">
            <Input name="start" type="date" defaultValue={filters.start} />
          </Field>
          <Field label="End" className="lg:col-span-2">
            <Input name="end" type="date" defaultValue={filters.end} />
          </Field>
          <Select name="status" label="Status" value={filters.status} className="lg:col-span-2">
            {REVIEW_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : titleize(option)}
              </option>
            ))}
          </Select>
          <Select name="rating" label="Rating" value={filters.rating} className="lg:col-span-2">
            <option value="all">All ratings</option>
            <option value="5">5.0 only</option>
            <option value="4.5">4.5+</option>
            <option value="4">4.0+</option>
            <option value="below4">Below 4.0</option>
            <option value="unrated">Unrated</option>
          </Select>
          <Select name="response" label="Response" value={filters.response} className="lg:col-span-2">
            <option value="all">All responses</option>
            <option value="responded">Responded</option>
            <option value="needs_response">Needs response</option>
          </Select>
          <Field label="Listing" className="lg:col-span-3">
            <Input
              name="listing"
              defaultValue={filters.listing}
              placeholder="Name or Hostaway ID"
            />
          </Field>
          <Field label="Guest" className="lg:col-span-3">
            <Input
              name="guest"
              defaultValue={filters.guest}
              placeholder="Guest name"
            />
          </Field>
          <Select name="sort" label="Sort" value={filters.sort} className="lg:col-span-3">
            <option value="newest_departure">Newest departure</option>
            <option value="oldest_departure">Oldest departure</option>
            <option value="highest_rating">Highest rating</option>
            <option value="lowest_rating">Lowest rating</option>
            <option value="listing">Listing</option>
            <option value="guest">Guest</option>
          </Select>
          <div className="flex gap-2 lg:col-span-3">
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "flex-1")}
            >
              <RefreshCw className="h-4 w-4" />
              Apply
            </button>
            <Link
              href="/operations/reviews"
              className={cn(buttonVariants({ variant: "ghost", size: "md" }))}
            >
              Reset
            </Link>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Active:</span>
          {activeFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-md bg-surface-alt px-2 py-1 text-foreground"
            >
              {filter}
            </span>
          ))}
          <span>{reviews.length} of {loadedReviews.length} loaded guest reviews shown</span>
        </div>
      </Card>

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
              sub={filters.dateRange.label}
            />
            <KpiCard
              label="Needs response"
              value={String(summary.needsResponse)}
              icon={AlertCircle}
            />
            <KpiCard
              label="Below 4.0/5"
              value={String(summary.belowFour)}
              icon={CalendarDays}
            />
            <KpiCard
              label="Properties"
              value={String(summary.uniqueListings)}
              icon={Building2}
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
  className,
}: {
  name: string;
  label: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring md:h-9"
      >
        {children}
      </select>
    </label>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
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
        Try widening the guest feedback history window or clearing filters.
      </p>
    </Card>
  );
}

function ReviewsTable({ reviews }: { reviews: HostawayReview[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="font-heading text-base font-bold">Guest feedback</h2>
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

  const uniqueListingKeys = new Set(
    reviews.map((review) =>
      review.listingMapId ? `id:${review.listingMapId}` : `name:${review.listingName ?? "unknown"}`,
    ),
  );

  return {
    count: reviews.length,
    averageRatingFive: formatFiveStarRating(average),
    averageRatingTen: formatTenPointRating(average),
    needsResponse: reviews.filter(needsResponse).length,
    belowFour: reviews.filter((review) => ratingFive(review.rating) < 4).length,
    uniqueListings: uniqueListingKeys.size,
  };
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

function ratingFive(rating: number | null): number {
  return typeof rating === "number" ? rating / 2 : Number.NaN;
}

function hasResponse(review: HostawayReview): boolean {
  return Boolean(review.revieweeResponse?.trim());
}

function needsResponse(review: HostawayReview): boolean {
  return !hasResponse(review);
}

function filterReviews(reviews: HostawayReview[], filters: ReviewFilters) {
  const listingNeedle = filters.listing.toLowerCase();
  const guestNeedle = filters.guest.toLowerCase();

  return reviews.filter((review) => {
    if (listingNeedle) {
      const listingHaystack = [
        review.listingName,
        review.listingMapId ? String(review.listingMapId) : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!listingHaystack.includes(listingNeedle)) return false;
    }

    if (
      guestNeedle &&
      !(review.guestName ?? "").toLowerCase().includes(guestNeedle)
    ) {
      return false;
    }

    if (filters.response === "responded" && !hasResponse(review)) return false;
    if (filters.response === "needs_response" && !needsResponse(review)) {
      return false;
    }

    const fiveStar = ratingFive(review.rating);
    switch (filters.rating) {
      case "5":
        if (fiveStar < 5) return false;
        break;
      case "4.5":
        if (fiveStar < 4.5) return false;
        break;
      case "4":
        if (fiveStar < 4) return false;
        break;
      case "below4":
        if (!(fiveStar < 4)) return false;
        break;
      case "unrated":
        if (typeof review.rating === "number") return false;
        break;
    }

    return true;
  });
}

function sortReviews(reviews: HostawayReview[], sort: ReviewSort) {
  return [...reviews].sort((a, b) => {
    switch (sort) {
      case "oldest_departure":
        return compareDates(a.departureDate, b.departureDate, "asc");
      case "highest_rating":
        return compareNumbers(a.rating, b.rating, "desc");
      case "lowest_rating":
        return compareNumbers(a.rating, b.rating, "asc");
      case "listing":
        return compareStrings(
          a.listingName ?? String(a.listingMapId ?? ""),
          b.listingName ?? String(b.listingMapId ?? ""),
        );
      case "guest":
        return compareStrings(a.guestName ?? "", b.guestName ?? "");
      case "newest_departure":
      default:
        return compareDates(a.departureDate, b.departureDate, "desc");
    }
  });
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

function compareNumbers(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc",
): number {
  const left = typeof a === "number" ? a : direction === "asc" ? Infinity : -Infinity;
  const right = typeof b === "number" ? b : direction === "asc" ? Infinity : -Infinity;
  return direction === "asc" ? left - right : right - left;
}

function compareDates(
  a: string | null,
  b: string | null,
  direction: "asc" | "desc",
): number {
  const left = a ? Date.parse(`${a}T00:00:00`) : NaN;
  const right = b ? Date.parse(`${b}T00:00:00`) : NaN;
  const aValue = Number.isFinite(left)
    ? left
    : direction === "asc"
      ? Infinity
      : -Infinity;
  const bValue = Number.isFinite(right)
    ? right
    : direction === "asc"
      ? Infinity
      : -Infinity;
  return direction === "asc" ? aValue - bValue : bValue - aValue;
}

function formatTenPointRating(rating: number | null): string {
  return typeof rating === "number" ? rating.toFixed(1) : "—";
}

function formatFiveStarRating(rating: number | null): string {
  return typeof rating === "number" ? `${(rating / 2).toFixed(1)}/5` : "—";
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

function activeFilterSummary(filters: ReviewFilters): string[] {
  const active = [`Guest-to-host`, filters.dateRange.label];
  if (filters.status !== "all") active.push(`Status: ${titleize(filters.status)}`);
  if (filters.rating !== "all") active.push(`Rating: ${ratingLabel(filters.rating)}`);
  if (filters.listing) active.push(`Listing: ${filters.listing}`);
  if (filters.guest) active.push(`Guest: ${filters.guest}`);
  if (filters.response !== "all") {
    active.push(`Response: ${titleize(filters.response)}`);
  }
  active.push(`Sort: ${sortLabel(filters.sort)}`);
  return active;
}

function ratingLabel(value: RatingBand): string {
  switch (value) {
    case "5":
      return "5.0";
    case "4.5":
      return "4.5+";
    case "4":
      return "4.0+";
    case "below4":
      return "Below 4.0";
    case "unrated":
      return "Unrated";
    default:
      return "All";
  }
}

function sortLabel(value: ReviewSort): string {
  switch (value) {
    case "oldest_departure":
      return "Oldest departure";
    case "highest_rating":
      return "Highest rating";
    case "lowest_rating":
      return "Lowest rating";
    case "listing":
      return "Listing";
    case "guest":
      return "Guest";
    default:
      return "Newest departure";
  }
}

function titleize(value: string): string {
  return value
    .split(/[-_]/)
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
