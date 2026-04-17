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
  type: "guest-to-host" | "host-to-guest";
  status: string;
  rating: number | null; // typically 0–10; null if no numeric rating
  publicReview: string | null;
  listingMapId: number | null;
  listingName: string | null;
  reservationId: number | null;
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

/**
 * Fetches reviews with optional departure-date window. Returns guest→host
 * reviews by default (the ones you'd read to see how you're doing).
 */
export async function getReviews(params: {
  departureDateStart?: string; // Y-m-d
  departureDateEnd?: string; // Y-m-d
  type?: "guest-to-host" | "host-to-guest";
  limit?: number;
  offset?: number;
  revalidate?: number | false;
} = {}): Promise<HostawayReview[]> {
  const qp = new URLSearchParams();
  if (params.departureDateStart) qp.set("departureDateStart", params.departureDateStart);
  if (params.departureDateEnd) qp.set("departureDateEnd", params.departureDateEnd);
  qp.set("type", params.type ?? "guest-to-host");
  qp.set("limit", String(params.limit ?? 500));
  qp.set("offset", String(params.offset ?? 0));
  qp.set("sortBy", "departureDate");
  qp.set("sortOrder", "desc");

  const json = await request<ListEnvelope<HostawayReview>>(
    `/reviews?${qp.toString()}`,
    { revalidate: params.revalidate ?? 60 },
  );
  return json.result ?? [];
}

// ---------------------------------------------------------------------------
// Finance — Consolidated report
// ---------------------------------------------------------------------------

export type ConsolidatedFinanceRow = {
  listingMapId?: number;
  listingName?: string;
  reservationId?: number;
  pmCommission?: number;
  pmCommissionAbc?: number;
  totalPaid?: number;
  ownerPayout?: number;
  channelFee?: number;
  cleaningFee?: number;
  // The endpoint returns many fields; we type only what we use.
  [k: string]: unknown;
};

type ConsolidatedEnvelope = {
  status: "success" | "fail";
  result: {
    rows?: ConsolidatedFinanceRow[];
    totals?: Record<string, number>;
    // Fallback: some tenants get a flat array.
    [k: string]: unknown;
  };
};

/**
 * Calls the consolidated finance report. We sum `pmCommission` across
 * returned rows to get total PM commission for the window.
 */
export async function getConsolidatedFinance(params: {
  fromDate: string; // Y-m-d
  toDate: string; // Y-m-d
  dateType?: "arrivalDate" | "departureDate" | "reservationDate";
  revalidate?: number | false;
}): Promise<ConsolidatedEnvelope["result"]> {
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
  return json.result ?? {};
}

// ---------------------------------------------------------------------------
// Summary helpers (shape data for dashboard tiles)
// ---------------------------------------------------------------------------

/**
 * Sum PM commission across a window. Handles both the `rows[]` shape and
 * a flat array fallback.
 */
export async function getPmCommissionTotal(params: {
  fromDate: string;
  toDate: string;
  dateType?: "arrivalDate" | "departureDate" | "reservationDate";
}): Promise<{ total: number; rowCount: number }> {
  const result = await getConsolidatedFinance(params);
  const rows: ConsolidatedFinanceRow[] = Array.isArray((result as { rows?: unknown }).rows)
    ? ((result as { rows: ConsolidatedFinanceRow[] }).rows)
    : Array.isArray(result)
      ? (result as unknown as ConsolidatedFinanceRow[])
      : [];

  // Prefer the API's own totals if present.
  const totals = (result as { totals?: Record<string, number> }).totals;
  if (totals && typeof totals.pmCommission === "number") {
    return { total: totals.pmCommission, rowCount: rows.length };
  }

  const total = rows.reduce((sum, r) => {
    const v = typeof r.pmCommission === "number" ? r.pmCommission : 0;
    return sum + v;
  }, 0);
  return { total, rowCount: rows.length };
}

/**
 * Average review rating over the last N days, across all listings.
 * Only counts reviews with a non-null numeric rating.
 */
export async function getPortfolioReviewAverage(days: number): Promise<{
  average: number | null;
  count: number;
  scale: 10; // Hostaway reviews are 1–10
}> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const reviews = await getReviews({
    departureDateStart: fmt(start),
    departureDateEnd: fmt(end),
    type: "guest-to-host",
    limit: 500,
  });

  const rated = reviews.filter((r) => typeof r.rating === "number");
  if (rated.length === 0) return { average: null, count: 0, scale: 10 };
  const avg =
    rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length;
  return { average: avg, count: rated.length, scale: 10 };
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
