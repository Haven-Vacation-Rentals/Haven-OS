/**
 * Haven OS — Content Studio scoring.
 *
 * Pure, local SEO + GEO (AI ranking) scorers. No external API calls. The
 * scorers consume the article model plus its research sources and
 * produce a 0-100 score with itemized checks.
 *
 * Voice / brand checks specific to Haven Homeowner Blog:
 *   - first-person Jack Zoppa
 *   - audience: vacation rental owners (not guests)
 *   - 800-1500 words
 *   - title 50-70 chars, meta 150-160 chars
 *   - sign-off "-- Jack Zoppa, CEO, Haven Vacation Rentals"
 *   - no em dashes, no exclamation points, no buzzwords/filler
 *   - keyword-aware descriptive headers
 *   - 2-3 sourced data points
 *   - internal links + soft CTA
 */

import type {
  ContentArticle,
  ContentCheck,
  ContentResearchSource,
  ContentTopic,
} from "./types";

const BUZZWORDS = [
  "synergy",
  "leverage",
  "unlock",
  "supercharge",
  "game-changer",
  "game changer",
  "revolutionize",
  "revolutionary",
  "best-in-class",
  "world-class",
  "next-level",
  "cutting-edge",
  "robust",
  "seamless",
  "elevate",
  "empower",
  "delve",
  "unleash",
  "thrilled",
  "excited to announce",
];

const FILLER = [
  "in today's world",
  "in this fast-paced",
  "at the end of the day",
  "needless to say",
  "it goes without saying",
  "the bottom line is",
];

const SIGN_OFF = "-- Jack Zoppa, CEO, Haven Vacation Rentals";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

export function readingTimeMin(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

function extractHeadings(body: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = [];
  for (const line of body.split("\n")) {
    const m = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (m) out.push({ level: m[1]!.length, text: m[2]! });
  }
  return out;
}

function countMatches(haystack: string, terms: string[]): string[] {
  const lower = haystack.toLowerCase();
  const found = new Set<string>();
  for (const t of terms) {
    if (!t) continue;
    if (lower.includes(t.toLowerCase())) found.add(t);
  }
  return Array.from(found);
}

function countMarkdownLinks(body: string): {
  total: number;
  internal: number;
  external: number;
} {
  let total = 0;
  let internal = 0;
  let external = 0;
  const re = /\[[^\]]+\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    total += 1;
    const url = m[1]!;
    if (url.startsWith("http")) {
      if (url.includes("havenvacationrentals")) internal += 1;
      else external += 1;
    } else if (url.startsWith("/")) {
      internal += 1;
    } else {
      external += 1;
    }
  }
  return { total, internal, external };
}

function score(checks: ContentCheck[]): number {
  if (checks.length === 0) return 0;
  let weighted = 0;
  let total = 0;
  for (const c of checks) {
    const weight = c.severity === "blocker" ? 3 : c.severity === "warning" ? 2 : 1;
    total += weight;
    if (c.ok) weighted += weight;
  }
  return Math.round((weighted / total) * 100);
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export function runSeoChecks(input: {
  article: ContentArticle;
  topic: ContentTopic;
  sources: ContentResearchSource[];
}): { score: number; checks: ContentCheck[] } {
  const { article, topic, sources } = input;
  const body = article.body_md ?? "";
  const title = (article.title ?? "").trim();
  const meta = (article.meta_description ?? "").trim();
  const words = countWords(body);
  const headings = extractHeadings(body);
  const links = countMarkdownLinks(body);
  const target = (topic.target_keyword ?? "").trim();
  const allKeywords = [target, ...(topic.secondary_keywords ?? [])].filter(
    Boolean,
  );

  const checks: ContentCheck[] = [];

  // Title length 50-70
  checks.push({
    id: "title_length",
    label: "Title is 50–70 characters",
    severity: "blocker",
    ok: title.length >= 50 && title.length <= 70,
    detail: `${title.length} chars`,
    hint: "Include the primary location keyword and stay between 50 and 70 characters.",
  });

  // Title contains target keyword
  checks.push({
    id: "title_keyword",
    label: "Title contains target keyword",
    severity: "blocker",
    ok: !!target && title.toLowerCase().includes(target.toLowerCase()),
    detail: target ? `Looking for "${target}"` : "No target keyword set",
  });

  // Title contains location
  checks.push({
    id: "title_location",
    label: "Title contains a location reference",
    severity: "warning",
    ok: /smoky|gatlinburg|pigeon forge|sevier|tennessee/i.test(title),
    hint: "Smoky Mountains, Gatlinburg, Pigeon Forge, Sevierville.",
  });

  // Meta length 150-160
  checks.push({
    id: "meta_length",
    label: "Meta description is 150–160 characters",
    severity: "blocker",
    ok: meta.length >= 150 && meta.length <= 160,
    detail: `${meta.length} chars`,
  });

  // Word count 800-1500
  checks.push({
    id: "word_count",
    label: "Word count is 800–1500",
    severity: "blocker",
    ok: words >= 800 && words <= 1500,
    detail: `${words} words`,
  });

  // Headings (>= 3 H2/H3)
  const subheads = headings.filter((h) => h.level >= 2 && h.level <= 3);
  checks.push({
    id: "headings_count",
    label: "At least 3 descriptive subheadings",
    severity: "warning",
    ok: subheads.length >= 3,
    detail: `${subheads.length} subheadings`,
  });

  // Headings keyword presence
  const headingsWithKeyword = subheads.filter((h) =>
    countMatches(h.text, allKeywords).length > 0,
  );
  checks.push({
    id: "headings_keyword",
    label: "At least one subheading uses a keyword",
    severity: "warning",
    ok: allKeywords.length === 0 || headingsWithKeyword.length >= 1,
  });

  // Internal links
  checks.push({
    id: "internal_links",
    label: "Has at least 1 internal link",
    severity: "warning",
    ok: links.internal >= 1,
    detail: `${links.internal} internal`,
    hint: "Link to a Haven property, landing page, or another blog post.",
  });

  // External links / sources
  checks.push({
    id: "external_sources",
    label: "Has at least 2 sourced data points",
    severity: "warning",
    ok: sources.length >= 2,
    detail: `${sources.length} sources tracked`,
  });

  // Em dashes
  checks.push({
    id: "no_em_dashes",
    label: "No em dashes",
    severity: "blocker",
    ok: !/—/.test(body) && !/—/.test(title) && !/—/.test(meta),
    hint: "Use hyphens or short sentences instead.",
  });

  // Exclamation points
  checks.push({
    id: "no_exclamation",
    label: "No exclamation points",
    severity: "blocker",
    ok: !/!/.test(body) && !/!/.test(title),
  });

  // Buzzwords
  const buzz = countMatches(body + " " + title, BUZZWORDS);
  checks.push({
    id: "no_buzzwords",
    label: "No buzzwords",
    severity: "warning",
    ok: buzz.length === 0,
    detail: buzz.length ? `Found: ${buzz.join(", ")}` : undefined,
  });

  // Filler
  const filler = countMatches(body, FILLER);
  checks.push({
    id: "no_filler",
    label: "No filler phrases",
    severity: "warning",
    ok: filler.length === 0,
    detail: filler.length ? `Found: ${filler.join(", ")}` : undefined,
  });

  // Keyword density (target appears at least twice in body, not >2.5%)
  if (target) {
    const targetLower = target.toLowerCase();
    const bodyLower = body.toLowerCase();
    let count = 0;
    let idx = bodyLower.indexOf(targetLower);
    while (idx !== -1) {
      count += 1;
      idx = bodyLower.indexOf(targetLower, idx + targetLower.length);
    }
    const density = words > 0 ? count / words : 0;
    checks.push({
      id: "keyword_density",
      label: "Target keyword appears 2+ times and density ≤ 2.5%",
      severity: "warning",
      ok: count >= 2 && density <= 0.025,
      detail: `${count} mentions, ${(density * 100).toFixed(2)}% density`,
    });
  }

  // Sign-off
  checks.push({
    id: "sign_off",
    label: "Includes Jack Zoppa sign-off",
    severity: "blocker",
    ok: body.includes(SIGN_OFF),
    hint: `Add "${SIGN_OFF}" to the end of the post.`,
  });

  // Soft CTA
  checks.push({
    id: "soft_cta",
    label: "Soft CTA present",
    severity: "info",
    ok: /(reach out|get in touch|haven vacation rentals|talk through|walk you through|happy to)/i.test(
      body,
    ),
  });

  return { score: score(checks), checks };
}

// ---------------------------------------------------------------------------
// GEO / AI ranking
// ---------------------------------------------------------------------------

export function runGeoChecks(input: {
  article: ContentArticle;
  topic: ContentTopic;
  sources: ContentResearchSource[];
}): { score: number; checks: ContentCheck[] } {
  const { article, topic, sources } = input;
  const body = article.body_md ?? "";
  const headings = extractHeadings(body);
  const target = (topic.target_keyword ?? "").trim();

  const checks: ContentCheck[] = [];

  // Entity coverage — important Smokies entities
  const entities = [
    "Smoky Mountains",
    "Gatlinburg",
    "Pigeon Forge",
    "Sevierville",
    "Haven Vacation Rentals",
  ];
  const matchedEntities = countMatches(body, entities);
  checks.push({
    id: "entity_coverage",
    label: "Mentions 3+ relevant local entities",
    severity: "warning",
    ok: matchedEntities.length >= 3,
    detail: `${matchedEntities.length}/${entities.length} entities`,
    hint: "AI answer engines reward explicit place + brand naming.",
  });

  // Question / FAQ coverage — at least 1 H2/H3 phrased as a question OR
  // a "what / how / why / when / should" sentence early in body.
  const questionHeadings = headings.filter((h) => /\?$/.test(h.text));
  const questionPhrasing =
    questionHeadings.length > 0 ||
    /(^|\n)\s*(what|how|why|when|should|do you)\b[^.\n]{8,}/i.test(body);
  checks.push({
    id: "question_coverage",
    label: "Frames at least one question users actually ask",
    severity: "warning",
    ok: questionPhrasing,
    hint: "Mirror the question owners ask so AI assistants can quote you.",
  });

  // Fact density — number of numeric tokens
  const numericMatches = body.match(/\b\d{1,4}(\.\d+)?(%|\s?(percent|days|nights|weeks|months|cabins|rentals|owners|properties))?/gi);
  const numericCount = numericMatches?.length ?? 0;
  checks.push({
    id: "fact_density",
    label: "Has 5+ concrete numbers / data points",
    severity: "warning",
    ok: numericCount >= 5,
    detail: `${numericCount} numeric tokens`,
  });

  // Citation readiness
  checks.push({
    id: "citations_attached",
    label: "Each major claim has a tracked source",
    severity: "warning",
    ok: sources.length >= 2,
    detail: `${sources.length} sources tracked`,
  });

  // E-E-A-T / operator credibility — first person + Haven
  const firstPerson = /\bI\b|\bwe\b|\bour\b|\bmy\b/i.test(body);
  const operatorBrand = /Haven Vacation Rentals|Jack Zoppa/i.test(body);
  checks.push({
    id: "operator_credibility",
    label: "First-person operator voice present",
    severity: "blocker",
    ok: firstPerson && operatorBrand,
    hint: "Speak as Jack, the operator. Reference Haven.",
  });

  // Structured summary — first paragraph short and direct (TL;DR-ish)
  const firstPara =
    body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#")) ?? "";
  const firstWords = countWords(firstPara);
  checks.push({
    id: "lede_summary",
    label: "Lede paragraph is a tight 35–80 word summary",
    severity: "info",
    ok: firstWords >= 35 && firstWords <= 80,
    detail: `${firstWords} words`,
  });

  // AI-answer snippet — has a bullet or numbered list
  checks.push({
    id: "answer_snippet",
    label: "Includes an extractable bullet or numbered list",
    severity: "info",
    ok: /(\n[-*]\s+\S)|(\n\d+\.\s+\S)/.test(body),
  });

  // Schema readiness — has both H1 (or title) and at least 2 H2s
  const h2 = headings.filter((h) => h.level === 2);
  checks.push({
    id: "schema_ready",
    label: "Headings support Article schema (≥ 2 H2s)",
    severity: "info",
    ok: h2.length >= 2,
    detail: `${h2.length} H2s`,
  });

  // Competitor / source influence placeholder — present if we have at least
  // one external publisher named in research.
  const externalPublisher =
    sources.find((s) => s.publisher && !/haven/i.test(s.publisher)) ?? null;
  checks.push({
    id: "competitor_signal",
    label: "Cites at least one third-party publisher",
    severity: "info",
    ok: !!externalPublisher,
    detail: externalPublisher?.publisher ?? undefined,
  });

  // Target keyword in lede
  if (target) {
    checks.push({
      id: "lede_keyword",
      label: "Target keyword appears in lede paragraph",
      severity: "warning",
      ok: firstPara.toLowerCase().includes(target.toLowerCase()),
    });
  }

  return { score: score(checks), checks };
}
