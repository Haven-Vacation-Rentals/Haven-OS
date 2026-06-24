/**
 * Hostaway API client.
 *
 * Uses OAuth2 client_credentials. Access tokens are long-lived
 * (Hostaway returns ~6 months), so we cache the token in module memory
 * for the lifetime of the serverless container. A cold start requests
 * a fresh token.
 *
 * All calls are server-side only. Do not import from client components.
 */

const BASE = "https://api.hostaway.com/v1";

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

export class HostawayError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "HostawayError";
  }
}

export function hostawayCredentials(): { accountId: string; apiKey: string } | null {
  const accountId = process.env.HOSTAWAY_ACCOUNT_ID;
  const apiKey = process.env.HOSTAWAY_API_KEY;
  if (!accountId || !apiKey) return null;
  return { accountId, apiKey };
}

export function isConfigured(): boolean {
  return hostawayCredentials() !== null;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const creds = hostawayCredentials();
  if (!creds) {
    throw new HostawayError("Hostaway is not configured (missing env vars).");
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.accountId,
    client_secret: creds.apiKey,
    scope: "general",
  });
  const res = await fetch(`${BASE}/accessTokens`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // Token endpoint; never cache at the fetch layer.
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HostawayError(
      `Token request failed (${res.status}): ${text.slice(0, 200)}`,
      res.status,
    );
  }
  const json = (await res.json()) as {
    token_type: string;
    expires_in: number;
    access_token: string;
  };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

type RequestInitLite = {
  method?: "GET" | "POST";
  body?: URLSearchParams | string;
  headers?: Record<string, string>;
  // Seconds for Next.js fetch cache; default 60.
  revalidate?: number | false;
};

async function request<T>(path: string, init: RequestInitLite = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Cache-Control": "no-cache",
    ...(init.headers ?? {}),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    next:
      init.revalidate === false
        ? undefined
        : { revalidate: init.revalidate ?? 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HostawayError(
      `Hostaway ${init.method ?? "GET"} ${path} failed (${res.status}): ${text.slice(0, 300)}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type HostawayReview = {
  id: number;
  accountId?: number | null;
  type: "guest-to-host" | "host-to-guest";
  status: string;
  rating: number | null; // typically 0–10; null if no numeric rating
  publicReview: string | null;
  privateFeedback?: string | null;
  revieweeResponse?: string | null;
  reviewCategory?: unknown;
  listingMapId: number | null;
  listingName: string | null;
  reservationId: number | null;
  channelId?: number | null;
  guestName: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  insertedOn: string;
  updatedOn: string | null;
};

type ListEnvelope<T> = {
  status: "success" | "fail";
  result: T[];
  count?: number;
  limit?: number;
  offset?: number;
};

type GetReviewsParams = {
  departureDateStart?: string; // Y-m-d
  departureDateEnd?: string; // Y-m-d
  type?: "guest-to-host" | "host-to-guest";
  statuses?: string | string[];
  sortBy?: "id" | "guestName" | "arrivalDate" | "departureDate";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  revalidate?: number | false;
};

/**
 * Fetches reviews with optional departure-date window. Returns guest→host
 * reviews by default (the ones you'd read to see how you're doing).
 */
export async function getReviewsPage(
  params: GetReviewsParams = {},
): Promise<ListEnvelope<HostawayReview>> {
  const qp = new URLSearchParams();
  if (params.departureDateStart) qp.set("departureDateStart", params.departureDateStart);
  if (params.departureDateEnd) qp.set("departureDateEnd", params.departureDateEnd);
  qp.set("type", params.type ?? "guest-to-host");
  if (params.statuses) {
    const statuses = Array.isArray(params.statuses)
      ? params.statuses
      : [params.statuses];
    for (const status of statuses) qp.append("statuses", status);
  }
  qp.set("limit", String(params.limit ?? 500));
  qp.set("offset", String(params.offset ?? 0));
  qp.set("sortBy", params.sortBy ?? "id");
  qp.set("sortOrder", params.sortOrder ?? "desc");

  return request<ListEnvelope<HostawayReview>>(
    `/reviews?${qp.toString()}`,
    { revalidate: params.revalidate ?? 60 },
  );
}

export async function getReviews(
  params: GetReviewsParams = {},
): Promise<HostawayReview[]> {
  const json = await getReviewsPage(params);
  return json.result ?? [];
}

// ---------------------------------------------------------------------------
// Finance — Consolidated report
// ---------------------------------------------------------------------------

/**
 * The consolidated finance report returns data in a tabular shape:
 *   result: {
 *     columns: [{ name, title, valueType }, ...],
 *     rows:    [ [val, val, val, ...], ... ],       // positional
 *     totals:  ["Totals", val, val, val, ...]       // parallel to columns
 *     currency?: string | null
 *   }
 * We look up `pmCommission` by column name and sum the matching cell in
 * each row (or read the `totals` row if present).
 */
export type ConsolidatedColumn = {
  name: string;
  title: string;
  valueType: string;
};

export type ConsolidatedResult = {
  columns?: ConsolidatedColumn[];
  rows?: Array<Array<string | number | null>>;
  totals?: Array<string | number | null>;
  currency?: string | null;
};

type ConsolidatedEnvelope = {
  status: "success" | "fail";
  message?: string;
  result: ConsolidatedResult;
};

/** POST /finance/report/consolidated with format=json. */
export async function getConsolidatedFinance(params: {
  fromDate: string; // Y-m-d
  toDate: string; // Y-m-d
  dateType?: "arrivalDate" | "departureDate" | "reservationDate";
  revalidate?: number | false;
}): Promise<ConsolidatedResult> {
  const body = new URLSearchParams();
  body.set("fromDate", params.fromDate);
  body.set("toDate", params.toDate);
  body.set("dateType", params.dateType ?? "arrivalDate");
  body.set("format", "json");

  const json = await request<ConsolidatedEnvelope>(
    `/finance/report/consolidated`,
    {
      method: "POST",
      body,
      revalidate: params.revalidate ?? 60,
    },
  );
  if (json.status === "fail") {
    throw new HostawayError(
      `Finance report failed: ${json.message ?? "unknown error"}`,
    );
  }
  return json.result ?? {};
}

// ---------------------------------------------------------------------------
// Summary helpers (shape data for dashboard tiles)
// ---------------------------------------------------------------------------

/** Coerce API cell to a number (handles numeric strings, nulls). */
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Sum PM commission across a window. Reads `result.totals` if present,
 * otherwise sums the pmCommission cell across `result.rows`.
 */
export async function getPmCommissionTotal(params: {
  fromDate: string;
  toDate: string;
  dateType?: "arrivalDate" | "departureDate" | "reservationDate";
}): Promise<{ total: number; rowCount: number; currency: string | null }> {
  const result = await getConsolidatedFinance(params);
  const columns = result.columns ?? [];
  const rows = result.rows ?? [];
  const totals = result.totals ?? [];
  const currency = result.currency ?? null;

  const idx = columns.findIndex((c) => c.name === "pmCommission");
  if (idx === -1) {
    // API didn't return a pmCommission column at all.
    return { total: 0, rowCount: rows.length, currency };
  }

  // Prefer the authoritative totals row.
  if (totals.length > idx) {
    const t = toNumber(totals[idx]);
    if (t !== 0 || rows.length === 0) {
      return { total: t, rowCount: rows.length, currency };
    }
    // Fall through to per-row sum if totals row was blank.
  }

  const total = rows.reduce((sum, row) => sum + toNumber(row[idx]), 0);
  return { total, rowCount: rows.length, currency };
}

/**
 * Average review rating over the last N days, across all listings.
 *
 * Filters by `insertedOn` (when the review was received) rather than
 * reservation departure date — a review posted yesterday for a trip
 * that ended 2 weeks ago still counts as "this week's review".
 */
export async function getPortfolioReviewAverage(days: number): Promise<{
  average: number | null;
  count: number;
  scale: 10; // Hostaway reviews are 1–10
}> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // Pull recent reviews sorted desc by id — most recent first — without a
  // departure-date filter (which would miss newly-received reviews for
  // older stays). Hostaway caps limit at 500.
  const reviews = await getReviews({
    type: "guest-to-host",
    limit: 500,
  });

  const recent = reviews.filter((r) => {
    if (typeof r.rating !== "number") return false;
    const ts = r.insertedOn ? Date.parse(r.insertedOn) : NaN;
    return Number.isFinite(ts) && ts >= cutoff;
  });

  if (recent.length === 0) return { average: null, count: 0, scale: 10 };
  const avg =
    recent.reduce((sum, r) => sum + (r.rating as number), 0) / recent.length;
  return { average: avg, count: recent.length, scale: 10 };
}

/**
 * Ping Hostaway by requesting a token and a minimal reviews query. Used
 * by the Settings "Test connection" button.
 */
export async function testConnection(): Promise<
  | { ok: true; tokenPreview: string }
  | { ok: false; error: string; status?: number }
> {
  try {
    const token = await getAccessToken();
    // Sanity check with a cheap endpoint.
    await request(`/reviews?limit=1`, { revalidate: false });
    return { ok: true, tokenPreview: `${token.slice(0, 6)}…${token.slice(-4)}` };
  } catch (err) {
    if (err instanceof HostawayError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
