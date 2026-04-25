/**
 * Listing extractor — pull what we can from a public listing URL so the
 * sales pitch dialog can auto-fill address, beds/baths/sleeps, and a
 * hero photo without the user typing.
 *
 * We *try* to be polite and resilient: server-side fetch with a real
 * UA, parse meta tags + JSON-LD, fall back gracefully when a site
 * blocks us (Airbnb often does). Anything we can't extract just stays
 * empty and the user fills it in.
 *
 * Sources supported (best-effort):
 *   - zillow.com
 *   - airbnb.com / airbnb.<tld>
 *   - vrbo.com
 *   - booking.com
 *
 * Anything else is treated as 'other' and we still try OpenGraph.
 */

export type ListingSource = "zillow" | "airbnb" | "vrbo" | "booking" | "other";

export type ExtractedListing = {
  source: ListingSource;
  url: string;
  /** Extraction succeeded for at least one field. */
  ok: boolean;
  /** Human-readable problem when nothing came back. */
  reason?: string;
  property_address?: string;
  beds?: number;
  baths?: number;
  sleeps?: number;
  hero_image_url?: string;
  gallery?: string[];
  /** Title of the listing (for fallback owner_name parsing). */
  title?: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/127.0 Safari/537.36";

export function detectSource(url: string): ListingSource {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("zillow")) return "zillow";
    if (host.includes("airbnb")) return "airbnb";
    if (host.includes("vrbo")) return "vrbo";
    if (host.includes("booking")) return "booking";
    return "other";
  } catch {
    return "other";
  }
}

/**
 * Fetch a listing URL and extract what we can. Never throws — always
 * returns an ExtractedListing object, with `ok=false` when nothing
 * useful could be extracted.
 */
export async function extractListing(url: string): Promise<ExtractedListing> {
  const source = detectSource(url);
  const base: ExtractedListing = { source, url, ok: false };

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Don't follow login walls forever; cap response time.
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        ...base,
        reason: `Listing site returned ${res.status}. You'll need to fill these in manually.`,
      };
    }
    html = await res.text();
  } catch (e) {
    return {
      ...base,
      reason:
        e instanceof Error
          ? `Couldn't reach the listing (${e.message}). Fill in the fields manually.`
          : "Couldn't reach the listing. Fill in the fields manually.",
    };
  }

  // Generic OpenGraph + JSON-LD extraction first; per-source overrides next.
  const out: ExtractedListing = {
    ...base,
    title: pickMeta(html, ["og:title", "twitter:title"]) ?? extractTitleTag(html),
    hero_image_url: pickMeta(html, [
      "og:image:secure_url",
      "og:image",
      "twitter:image",
    ]),
    gallery: [],
  };

  const ld = extractJsonLd(html);

  // Always try JSON-LD images for the gallery — most listing sites embed
  // them, and they're high quality.
  const ldImages = collectJsonLdImages(ld);

  switch (source) {
    case "zillow":
      applyZillow(out, html, ld);
      break;
    case "airbnb":
      applyAirbnb(out, html, ld);
      break;
    case "vrbo":
      applyVrbo(out, html, ld);
      break;
    case "booking":
      applyBooking(out, html, ld);
      break;
    default:
      applyGeneric(out, html, ld);
  }

  // Build a deduped gallery: extractor-supplied (already in out.gallery from
  // a per-source adapter) + JSON-LD images + og:image-style siblings, with
  // the hero filtered out so we don't show it twice.
  const ogImages = collectOgImages(html);
  const merged = new Set<string>();
  const galleryFinal: string[] = [];
  const stripParams = (u: string) => stripQuery(u);
  for (const raw of [...(out.gallery ?? []), ...ldImages, ...ogImages]) {
    if (!raw) continue;
    const u = stripParams(raw);
    if (merged.has(u)) continue;
    // Filter out obvious non-property photos (Airbnb UI, review icons, etc).
    // Other platform CDN URLs are kept as-is — it's better to show them
    // than fall back to a generic Smoky Mountain photo.
    if (
      /a0\.muscache\.com\/im\/pictures\//i.test(u) &&
      !isAirbnbPropertyPhoto(u)
    ) {
      continue;
    }
    if (out.hero_image_url && u === stripParams(out.hero_image_url)) continue;
    merged.add(u);
    galleryFinal.push(u);
    if (galleryFinal.length >= 8) break;
  }
  out.gallery = galleryFinal;

  // If the hero we picked was a platform asset rather than a real property
  // photo, swap it for the first real gallery photo.
  if (out.hero_image_url && isAirbnbPlatformAsset(out.hero_image_url)) {
    out.hero_image_url = galleryFinal[0] ?? undefined;
  }

  // Normalize numeric fields.
  if (out.beds && !Number.isFinite(out.beds)) out.beds = undefined;
  if (out.baths && !Number.isFinite(out.baths)) out.baths = undefined;
  if (out.sleeps && !Number.isFinite(out.sleeps)) out.sleeps = undefined;

  out.ok = Boolean(
    out.property_address ||
      out.beds ||
      out.baths ||
      out.sleeps ||
      out.hero_image_url ||
      (out.gallery && out.gallery.length > 0),
  );
  if (!out.ok && !out.reason) {
    out.reason =
      "We fetched the page but couldn't parse property details. Fill them in below.";
  }

  return out;
}

// ---------------------------------------------------------------------------
// Source adapters
// ---------------------------------------------------------------------------

function applyZillow(
  out: ExtractedListing,
  html: string,
  ld: JsonLdNode[],
): void {
  // JSON-LD on Zillow detail pages includes a SingleFamilyResidence with
  // address, numberOfRooms, numberOfBathroomsTotal, etc.
  const home = ld.find((n) =>
    [
      "SingleFamilyResidence",
      "House",
      "Residence",
      "RealEstateListing",
      "Place",
    ].some((t) => matchesType(n["@type"], t)),
  );
  if (home) {
    const addr = parseAddress(home.address);
    if (addr) out.property_address = addr;
    const beds = numericish(
      home.numberOfRooms ??
        home.numberOfBedrooms ??
        // sometimes nested
        (home.geo as Record<string, unknown> | undefined)?.numberOfRooms,
    );
    if (beds) out.beds = beds;
    const baths = numericish(
      home.numberOfBathroomsTotal ?? home.numberOfBathrooms,
    );
    if (baths) out.baths = baths;
  }
  // og:street-address style fallback used by older Zillow templates.
  if (!out.property_address) {
    const street = pickMeta(html, ["zillow:address"]);
    if (street) out.property_address = street;
  }
}

function applyAirbnb(
  out: ExtractedListing,
  html: string,
  _ld: JsonLdNode[],
): void {
  // Airbnb often returns 403 to bots; if we got HTML we still try OG.
  // Title format: "Beach Cabin · 3 beds · 2 baths · Sleeps 6 - Pigeon Forge"
  if (out.title) {
    const beds = matchFirst(out.title, /(\d+(?:\.\d+)?)\s*beds?/i);
    const baths = matchFirst(out.title, /(\d+(?:\.\d+)?)\s*baths?/i);
    const sleeps = matchFirst(out.title, /sleeps?\s*(\d+)/i);
    if (beds) out.beds = parseFloat(beds);
    if (baths) out.baths = parseFloat(baths);
    if (sleeps) out.sleeps = parseInt(sleeps, 10);
  }
  // Extract a city/state hint from og:description "Vacation rental in
  // Gatlinburg, TN"
  const desc = pickMeta(html, ["og:description", "description"]);
  if (desc) {
    const cityState = matchFirst(
      desc,
      /(?:in|·)\s*([A-Z][a-zA-Z .'-]+,\s*[A-Z]{2})/,
    );
    if (cityState) out.property_address = cityState;
  }
  // Best-effort image scrape: Airbnb embeds picture URLs in markup as
  // https://a0.muscache.com/im/pictures/... but mixes property photos
  // ("prohost-api/Hosting-", "miso/Hosting-", "hosting/") in with platform
  // assets, review icons, and host avatars. We only want the property ones.
  const muscacheAll = collectMatches(
    html,
    /https:\/\/a0\.muscache\.com\/im\/pictures\/[^"'\s)]+\.(?:jpe?g|png|webp)/gi,
  );
  const propertyOnly = dedupeKeepFirst(muscacheAll).filter(isAirbnbPropertyPhoto);
  if (propertyOnly.length) {
    // Strip any querystring so the database stores a stable canonical URL,
    // and prefer larger renditions when Airbnb gives us a choice.
    const cleaned = propertyOnly.map(stripQuery);
    if (!out.hero_image_url || isAirbnbPlatformAsset(out.hero_image_url)) {
      out.hero_image_url = cleaned[0];
    }
    out.gallery = dedupeKeepFirst(cleaned).slice(0, 12);
  }
}

function isAirbnbPropertyPhoto(u: string): boolean {
  // Match real listing photos and exclude UI assets and host avatars.
  if (!/^https:\/\/a0\.muscache\.com\/im\/pictures\//i.test(u)) return false;
  if (/airbnbplatformassets/i.test(u)) return false;
  if (/airbnb-platform-assets/i.test(u)) return false;
  if (/\/user\//i.test(u)) return false;
  if (/\/avatars?\//i.test(u)) return false;
  return (
    /\/prohost-api\/Hosting-/i.test(u) ||
    /\/miso\/Hosting-/i.test(u) ||
    /\/Hosting-\d/i.test(u) ||
    /\/hosting\//i.test(u)
  );
}

function isAirbnbPlatformAsset(u: string): boolean {
  return /a0\.muscache\.com\/im\/pictures\/(?:AirbnbPlatformAssets|airbnb-platform-assets|user|avatar)/i.test(
    u,
  );
}

function stripQuery(u: string): string {
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

function applyVrbo(
  out: ExtractedListing,
  html: string,
  ld: JsonLdNode[],
): void {
  const lodging = ld.find((n) =>
    ["LodgingBusiness", "VacationRental", "Place"].some((t) =>
      matchesType(n["@type"], t),
    ),
  );
  if (lodging) {
    const addr = parseAddress(lodging.address);
    if (addr) out.property_address = addr;
    const beds = numericish(
      (lodging.containsPlace as Record<string, unknown> | undefined)
        ?.numberOfRooms ?? lodging.numberOfRooms,
    );
    if (beds) out.beds = beds;
    const occ = numericish(lodging.occupancy);
    if (occ) out.sleeps = occ;
  }
  // VRBO often puts "X bedrooms · Y bathrooms · sleeps Z" in og:description
  const desc = pickMeta(html, ["og:description", "description"]);
  if (desc) {
    if (!out.beds)
      out.beds =
        parseFloatSafe(matchFirst(desc, /(\d+(?:\.\d+)?)\s*bedroom/i)) ??
        out.beds;
    if (!out.baths)
      out.baths =
        parseFloatSafe(matchFirst(desc, /(\d+(?:\.\d+)?)\s*bathroom/i)) ??
        out.baths;
    if (!out.sleeps)
      out.sleeps =
        parseIntSafe(matchFirst(desc, /sleeps?\s*(\d+)/i)) ?? out.sleeps;
  }
}

function applyBooking(
  out: ExtractedListing,
  html: string,
  ld: JsonLdNode[],
): void {
  const hotel = ld.find((n) =>
    ["Hotel", "LodgingBusiness", "Apartment"].some((t) =>
      matchesType(n["@type"], t),
    ),
  );
  if (hotel) {
    const addr = parseAddress(hotel.address);
    if (addr) out.property_address = addr;
  }
  const desc = pickMeta(html, ["og:description", "description"]);
  if (desc) {
    if (!out.beds)
      out.beds =
        parseFloatSafe(matchFirst(desc, /(\d+(?:\.\d+)?)\s*bedroom/i)) ??
        out.beds;
    if (!out.baths)
      out.baths =
        parseFloatSafe(matchFirst(desc, /(\d+(?:\.\d+)?)\s*bathroom/i)) ??
        out.baths;
  }
}

function applyGeneric(
  out: ExtractedListing,
  html: string,
  ld: JsonLdNode[],
): void {
  const place = ld.find((n) =>
    ["Place", "Residence", "House", "RealEstateListing"].some((t) =>
      matchesType(n["@type"], t),
    ),
  );
  if (place) {
    const addr = parseAddress(place.address);
    if (addr) out.property_address = addr;
  }
  const desc = pickMeta(html, ["og:description", "description"]);
  if (desc) {
    out.beds ??= parseFloatSafe(
      matchFirst(desc, /(\d+(?:\.\d+)?)\s*(?:bd|bed|bedroom)/i),
    );
    out.baths ??= parseFloatSafe(
      matchFirst(desc, /(\d+(?:\.\d+)?)\s*(?:ba|bath|bathroom)/i),
    );
    out.sleeps ??= parseIntSafe(matchFirst(desc, /sleeps?\s*(\d+)/i));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type JsonLdNode = Record<string, unknown> & {
  "@type"?: string | string[];
  address?: unknown;
  numberOfRooms?: unknown;
  numberOfBedrooms?: unknown;
  numberOfBathroomsTotal?: unknown;
  numberOfBathrooms?: unknown;
  occupancy?: unknown;
  geo?: unknown;
  containsPlace?: unknown;
};

function pickMeta(html: string, names: string[]): string | undefined {
  for (const name of names) {
    // Try property="..." then name="..."
    const re1 = new RegExp(
      `<meta[^>]+property=["']${escape(name)}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+name=["']${escape(name)}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const re3 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*property=["']${escape(name)}["']`,
      "i",
    );
    const re4 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*name=["']${escape(name)}["']`,
      "i",
    );
    for (const re of [re1, re2, re3, re4]) {
      const m = html.match(re);
      if (m && m[1]) return decodeHtml(m[1]);
    }
  }
  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeHtml(m[1]).trim() : undefined;
}

function extractJsonLd(html: string): JsonLdNode[] {
  const out: JsonLdNode[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) if (item && typeof item === "object") out.push(item);
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as { "@graph"?: unknown })["@graph"])) {
          for (const item of (parsed as { "@graph": unknown[] })["@graph"]) {
            if (item && typeof item === "object") out.push(item as JsonLdNode);
          }
        } else {
          out.push(parsed as JsonLdNode);
        }
      }
    } catch {
      // tolerate bad JSON-LD blobs (Airbnb sometimes ships partials)
    }
  }
  return out;
}

function matchesType(t: unknown, target: string): boolean {
  if (typeof t === "string") return t.toLowerCase() === target.toLowerCase();
  if (Array.isArray(t))
    return t.some(
      (x) => typeof x === "string" && x.toLowerCase() === target.toLowerCase(),
    );
  return false;
}

function parseAddress(addr: unknown): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr.trim() || undefined;
  if (typeof addr === "object") {
    const a = addr as Record<string, unknown>;
    const parts = [
      a.streetAddress,
      a.addressLocality,
      a.addressRegion,
      a.postalCode,
    ].filter((p): p is string => typeof p === "string" && p.trim().length > 0);
    if (parts.length === 0) return undefined;
    // "123 Main St, Pigeon Forge, TN 37863"
    const street = parts[0];
    const rest = parts.slice(1);
    return [street, rest.join(", ")].filter(Boolean).join(", ");
  }
  return undefined;
}

function numericish(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function matchFirst(s: string, re: RegExp): string | undefined {
  const m = s.match(re);
  return m ? m[1] : undefined;
}

function parseFloatSafe(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseIntSafe(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pull image-like URLs out of any JSON-LD blob (Place / Product / Hotel). */
function collectJsonLdImages(ld: JsonLdNode[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const u = v.trim();
    if (!u || !/^https?:\/\//i.test(u)) return;
    if (seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  for (const node of ld) {
    const img = (node as Record<string, unknown>).image;
    if (!img) continue;
    if (typeof img === "string") {
      push(img);
    } else if (Array.isArray(img)) {
      for (const it of img) {
        if (typeof it === "string") push(it);
        else if (it && typeof it === "object") {
          push((it as Record<string, unknown>).url);
          push((it as Record<string, unknown>).contentUrl);
        }
      }
    } else if (typeof img === "object") {
      push((img as Record<string, unknown>).url);
      push((img as Record<string, unknown>).contentUrl);
    }
  }
  return out;
}

/** Collect every <meta property="og:image*" content="..."> URL on the page. */
function collectOgImages(html: string): string[] {
  const re =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::[a-z_]+)?|twitter:image[0-9]?)["'][^>]*content=["']([^"']+)["']/gi;
  const out: string[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = decodeHtml(m[1]);
    if (!/^https?:\/\//i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  // Reverse pattern: content first, then property.
  const re2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::[a-z_]+)?|twitter:image[0-9]?)["']/gi;
  while ((m = re2.exec(html)) !== null) {
    const u = decodeHtml(m[1]);
    if (!/^https?:\/\//i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function collectMatches(s: string, re: RegExp): string[] {
  const out: string[] = [];
  let m;
  while ((m = re.exec(s)) !== null) out.push(m[0]);
  return out;
}

function dedupeKeepFirst<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}
