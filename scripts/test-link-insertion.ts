/**
 * Lightweight assertion script for the Content Studio link-insertion
 * helpers. We don't have a test framework wired up, so this runs as a
 * standalone tsx script:
 *
 *   npx tsx scripts/test-link-insertion.ts
 *
 * Exits non-zero on the first failed assertion so CI / typecheck
 * smoke runs can catch regressions in the link weaving logic.
 *
 * Covers the behaviors the studio cares about:
 *   - extractLinks strips URL/markdown junk out of labels
 *   - looksLikeLinkInsertion accepts cleanup phrases without URLs
 *   - insertLinksIntoBody weaves onto domain-aware phrases
 *     (Rabbu → "market data" / "STR market data" / "Rabbu")
 *   - URLs already linked are reported as alreadyPresent, not re-placed
 *   - URLs that don't fit cleanly are returned as `unplaced` instead
 *     of triggering "For context, see …" filler
 *   - stripFallbackLinkSentences removes legacy filler paragraphs
 *   - applyLinkInsertion re-weaves freed-up URLs after cleanup
 */

import {
  applyLinkInsertion,
  collectExistingLinks,
  extractLinks,
  insertLinksIntoBody,
  looksLikeLinkCleanup,
  looksLikeLinkInsertion,
  stripFallbackLinkSentences,
} from "../lib/content/agent-prompt";

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    process.stdout.write(`  ok  ${name}\n`);
    return;
  }
  failures += 1;
  process.stdout.write(`  FAIL ${name}\n`);
  if (detail !== undefined) {
    process.stdout.write(
      `       ${typeof detail === "string" ? detail : JSON.stringify(detail)}\n`,
    );
  }
}

process.stdout.write("\nlink-insertion helpers\n");

// ---------------------------------------------------------------------------
// extractLinks
// ---------------------------------------------------------------------------
{
  const links = extractLinks(
    "Rabbu - https://rabbu.com/market/pigeon-forge\n" +
      "AirDNA: https://www.airdna.co/data/us/tn/pigeon-forge\n" +
      "[NPS](https://www.nps.gov/grsm)",
  );
  const byUrl = (u: string) => links.find((l) => l.url === u);
  check("extractLinks finds 3 urls", links.length === 3, links);
  check(
    "extractLinks keeps Rabbu label clean",
    byUrl("https://rabbu.com/market/pigeon-forge")?.label === "Rabbu",
    byUrl("https://rabbu.com/market/pigeon-forge"),
  );
  check(
    "extractLinks parses markdown link",
    byUrl("https://www.nps.gov/grsm")?.label === "NPS",
    byUrl("https://www.nps.gov/grsm"),
  );
}

{
  // A nasty paste with the URL embedded inside the label.
  const links = extractLinks(
    "[Rabbu — https://rabbu.com](https://rabbu.com/market/pigeon-forge)",
  );
  check(
    "label with embedded URL is sanitized",
    links[0]?.label === "Rabbu" || links[0]?.label === "Rabbu —",
    links[0],
  );
  // Trailing punctuation strip from URL.
  const trailing = extractLinks("see https://rabbu.com/market/pigeon-forge.");
  check(
    "trailing punctuation stripped from bare URL",
    trailing[0]?.url === "https://rabbu.com/market/pigeon-forge",
    trailing[0],
  );
}

// ---------------------------------------------------------------------------
// looksLikeLinkInsertion + cleanup
// ---------------------------------------------------------------------------
check(
  "cleanup phrase without URL is recognized",
  looksLikeLinkInsertion("I want the links woven into the post where they are mentioned"),
);
check(
  "cleanup phrase explicit",
  looksLikeLinkCleanup("clean up the links in the post"),
);
check(
  "plain question is not link insertion",
  !looksLikeLinkInsertion("What's the SEO score?"),
);
check(
  "URL paste is recognized",
  looksLikeLinkInsertion("https://rabbu.com\nhttps://airdna.co"),
);

// ---------------------------------------------------------------------------
// insertLinksIntoBody — Rabbu URL must land on "market data" / "Rabbu"
// instead of producing filler.
// ---------------------------------------------------------------------------
{
  const body = [
    "I run cabins in the Smokies, so when revenue strategy comes up I look at the market data first.",
    "Rabbu is one source I lean on for ADR and occupancy.",
    "",
    "-- Jack Zoppa, CEO, Haven Vacation Rentals",
  ].join("\n\n");

  const result = insertLinksIntoBody({
    body,
    links: [{ url: "https://rabbu.com/market/pigeon-forge", label: "Rabbu" }],
    sources: [],
  });
  check(
    "Rabbu URL placed inline",
    result.placed.length === 1 && result.unplaced.length === 0,
    result,
  );
  check(
    "Rabbu inline link landed on a real phrase",
    /\[(market data|Rabbu)\]\(https:\/\/rabbu\.com\/market\/pigeon-forge\)/.test(
      result.body,
    ),
    result.body,
  );
  check(
    "no 'For context, see' filler is added",
    !/For context, see/.test(result.body),
  );
}

// ---------------------------------------------------------------------------
// Already-linked URL is reported as alreadyPresent, not re-placed.
// ---------------------------------------------------------------------------
{
  const body =
    "The [market data](https://rabbu.com/market/pigeon-forge) for Pigeon Forge tells the story.";
  const result = insertLinksIntoBody({
    body,
    links: [{ url: "https://rabbu.com/market/pigeon-forge", label: "Rabbu" }],
    sources: [],
  });
  check(
    "double-link prevented",
    result.placed.length === 0 && result.alreadyPresent.length === 1,
    result,
  );
  check("body unchanged when URL already linked", result.body === body);
}

// ---------------------------------------------------------------------------
// Unplaceable URL is returned as `unplaced`, not auto-appended as filler.
// ---------------------------------------------------------------------------
{
  const body = [
    "A short opening paragraph about cabins.",
    "",
    "-- Jack Zoppa, CEO, Haven Vacation Rentals",
  ].join("\n\n");
  const result = insertLinksIntoBody({
    body,
    links: [{ url: "https://example.com/research", label: null }],
    sources: [],
  });
  check(
    "unplaceable URL goes to unplaced",
    result.placed.length === 0 && result.unplaced.length === 1,
    result,
  );
  check(
    "no fallback sentence appended",
    result.body === body,
    result.body,
  );
}

// ---------------------------------------------------------------------------
// Each URL used once even if multiple anchor candidates would match.
// ---------------------------------------------------------------------------
{
  const body =
    "Rabbu publishes market data for Pigeon Forge. The market data is the input I use for ADR.";
  const result = insertLinksIntoBody({
    body,
    links: [
      { url: "https://rabbu.com", label: "Rabbu" },
      { url: "https://rabbu.com", label: "Rabbu" },
    ],
    sources: [],
  });
  check(
    "duplicate URL deduped",
    result.placed.length + result.alreadyPresent.length === 1,
    result,
  );
  // Should appear exactly once in the body.
  const occurrences = (result.body.match(/\]\(https:\/\/rabbu\.com\)/g) ?? [])
    .length;
  check("URL inserted exactly once", occurrences === 1, occurrences);
}

// ---------------------------------------------------------------------------
// stripFallbackLinkSentences removes the legacy filler.
// ---------------------------------------------------------------------------
{
  const body = [
    "I look at the market data first.",
    "",
    "For context, see [Awning](https://awning.com).",
    "",
    "For context, see [Rabbu](https://rabbu.com).",
    "",
    "Worth a look: short-term rental data ([AirDNA](https://airdna.co)).",
    "",
    "-- Jack Zoppa, CEO, Haven Vacation Rentals",
  ].join("\n\n");
  const cleaned = stripFallbackLinkSentences(body);
  check(
    "all 3 fallback sentences removed",
    cleaned.removedUrls.length === 3,
    cleaned.removedUrls,
  );
  check(
    "no 'For context, see' remains",
    !/For context, see/.test(cleaned.body),
  );
  check("sign-off preserved", cleaned.body.includes("Jack Zoppa, CEO"));
}

// ---------------------------------------------------------------------------
// collectExistingLinks
// ---------------------------------------------------------------------------
{
  const body =
    "Try [Rabbu](https://rabbu.com) and [PriceLabs](https://pricelabs.co) for pricing.";
  const links = collectExistingLinks(body);
  check("collectExistingLinks finds both", links.length === 2, links);
  check("labels are clean", links.every((l) => l.label && !/[\[\]]/.test(l.label)));
}

// ---------------------------------------------------------------------------
// applyLinkInsertion: cleans up filler then re-weaves freed-up URLs onto
// real phrases when the body has them.
// ---------------------------------------------------------------------------
{
  const body = [
    "I run cabins and I lean on Rabbu for market data.",
    "",
    "For context, see [Rabbu](https://rabbu.com).",
    "",
    "-- Jack Zoppa, CEO, Haven Vacation Rentals",
  ].join("\n\n");

  const result = applyLinkInsertion({ body, promptLinks: [], sources: [] });
  check(
    "cleanup pass removed the filler",
    result.cleanedFallbacks === 1,
    result,
  );
  check(
    "freed URL re-placed on a real phrase",
    result.placed.includes("https://rabbu.com"),
    result,
  );
  check(
    "no fallback paragraph remains",
    !/For context, see/.test(result.body),
    result.body,
  );
  check(
    "URL appears exactly once in body",
    (result.body.match(/\]\(https:\/\/rabbu\.com\)/g) ?? []).length === 1,
    result.body,
  );
}

// ---------------------------------------------------------------------------
process.stdout.write(
  failures === 0
    ? `\nall checks passed\n`
    : `\n${failures} failure${failures === 1 ? "" : "s"}\n`,
);
process.exit(failures === 0 ? 0 : 1);
