/**
 * Haven OS — Content Studio topic-intent parser.
 *
 * Turns a free-form line from Jack ("write about gap nights in Pigeon
 * Forge", "I want a post on owner tax prep") into a structured topic
 * draft with sensible defaults. Pure / deterministic — no API calls.
 *
 * Used by the conversational topic creation flow on /content. Intent
 * detection lives next to it so we can route a chat message to either:
 *   - create_topic_from_conversation (build a topic + open it)
 *   - generate_topic_ideas (return a list of suggestions)
 *
 * Both intents have a structured output the UI can render and act on.
 */

import {
  PILLAR_LABELS,
  type ContentPillar,
  type ContentPriority,
} from "./types";

export type TopicIntent =
  | { kind: "create_topic"; raw: string; draft: TopicDraft }
  | { kind: "generate_ideas"; raw: string; count: number }
  | { kind: "unknown"; raw: string };

export type TopicDraft = {
  title: string;
  pillar: ContentPillar;
  priority: ContentPriority;
  target_keyword: string;
  secondary_keywords: string[];
  angle: string;
  hypothesis: string;
  brief: string;
  key_points: string[];
};

export type TopicIdea = TopicDraft & {
  rationale: string;
  urgency: "now" | "this_quarter" | "evergreen";
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
};

const LOCATIONS: { match: RegExp; label: string }[] = [
  { match: /\bgatlinburg\b/i, label: "Gatlinburg" },
  { match: /\bpigeon\s*forge\b/i, label: "Pigeon Forge" },
  { match: /\bsevierville\b/i, label: "Sevierville" },
  { match: /\bsmoky\s*mountain[s]?\b/i, label: "Smoky Mountains" },
  { match: /\bsmokies\b/i, label: "Smoky Mountains" },
];

const PILLAR_KEYWORDS: { pillar: ContentPillar; words: RegExp }[] = [
  {
    pillar: "haven_performance",
    words:
      /\bhaven\b|\bcase study\b|\bour cabins?\b|\bportfolio\b|\bperformance\b/i,
  },
  {
    pillar: "revenue_strategy",
    words:
      /\b(revenue|adr|rev\s*par|booking pace|pricing|gap night|min(imum)? stay|yield|seasonality|discount|promotion|occupancy)\b/i,
  },
  {
    pillar: "operations",
    words:
      /\b(clean(ing)?|turnover|housekeeping|maintenance|guest|review|hot tub|amenit(y|ies)|stocking|supply|insurance|tax|compliance|permit|owner)\b/i,
  },
  {
    pillar: "industry_insights",
    words:
      /\b(airbnb|vrbo|otas?|industry|regulation|rule|short[- ]term rental|str|legislation|trend|market shift)\b/i,
  },
  {
    pillar: "market_data",
    words:
      /\b(market|data|forecast|outlook|stat|report|year[- ]over[- ]year|yoy|projection|comp|comparable|airdna|sevier county)\b/i,
  },
];

const PRIORITY_KEYWORDS: { priority: ContentPriority; words: RegExp }[] = [
  { priority: "urgent", words: /\b(urgent|asap|today|tomorrow|this week|rush)\b/i },
  { priority: "high", words: /\b(high priority|priorit(y|ize)|important|key)\b/i },
  { priority: "low", words: /\b(low priority|backlog|whenever|nice to have)\b/i },
];

const STOP_WORDS = new Set(
  "the a an of in on for to and or with that this is are was were be been being i we he she it they our your their his hers theirs my mine its as at by from but if not into out so do does did doing have has had if then than there here when where why how what about which who whom whose can could may might shall should will would just also more most some any all any one two three over under between among can't won't isn't aren't didn't doesn't wasn't weren't haven't hasn't hadn't"
    .split(/\s+/)
    .filter(Boolean),
);

const LEAD_VERBS =
  /^(write\s+(?:a\s+|the\s+)?(?:post|article|piece|blog)?\s*(?:on|about)?|i\s+want\s+(?:a\s+|the\s+)?(?:post|article|piece|blog)?\s*(?:on|about)?|let'?s\s+write\s+(?:about)?|add\s+(?:a\s+)?(?:topic|post|article|idea|backlog item)?\s*(?:on|about)?|create\s+(?:a\s+)?(?:topic|post|article|idea)?\s*(?:on|about)?|draft\s+(?:a\s+)?(?:post|article|piece)?\s*(?:on|about)?|new\s+(?:topic|post|article|idea)?\s*(?:on|about)?|topic\s*(?:on|about)?|idea\s*(?:on|about)?|post\s*(?:on|about)?|blog\s*(?:on|about)?)\s*[:\-]?\s*/i;

const RESEARCH_RX =
  /\b(research|brainstorm|ideate|come up with|suggest|propose|generate|need|give me)\b.*\b(idea|topic|post|article|backlog)s?\b/i;

const STRIP_QUOTES = /^["'“‘]+|["'”’]+$/g;

export function detectIntent(raw: string): TopicIntent {
  const text = raw.trim();
  if (!text) return { kind: "unknown", raw };

  if (RESEARCH_RX.test(text) || /^research(\s+ideas?)?$/i.test(text)) {
    const count = readCount(text);
    return { kind: "generate_ideas", raw, count };
  }

  if (looksLikeTopicCreate(text)) {
    return { kind: "create_topic", raw, draft: parseTopicDraft(text) };
  }

  return { kind: "unknown", raw };
}

function readCount(text: string): number {
  const m = /\b(\d{1,2})\s*(?:idea|topic|post|article)s?\b/i.exec(text);
  if (m) {
    const n = Math.max(1, Math.min(12, Number(m[1])));
    return n;
  }
  return 6;
}

function looksLikeTopicCreate(text: string): boolean {
  if (LEAD_VERBS.test(text)) return true;
  if (/^(?:topic|idea|post|blog)\s*[:\-]/i.test(text)) return true;
  return false;
}

export function parseTopicDraft(raw: string): TopicDraft {
  const cleaned = raw.trim().replace(LEAD_VERBS, "").replace(STRIP_QUOTES, "").trim();
  const sentence = cleaned.replace(/[.!?]+$/g, "").trim();

  const pillar = detectPillar(sentence) ?? "market_data";
  const priority = detectPriority(sentence) ?? "medium";
  const locations = detectLocations(sentence);
  const primaryLocation = locations[0] ?? "Smoky Mountains";

  const baseSubject = cleanSubject(sentence);
  const title = buildTitle(baseSubject, primaryLocation);
  const target_keyword = buildKeyword(baseSubject, primaryLocation);
  const secondary_keywords = buildSecondaryKeywords(baseSubject, locations);
  const angle = buildAngle(baseSubject, primaryLocation);
  const hypothesis = buildHypothesis(baseSubject, pillar);
  const brief = buildBrief(baseSubject, primaryLocation, pillar);
  const key_points = buildKeyPoints(baseSubject, primaryLocation, pillar);

  return {
    title,
    pillar,
    priority,
    target_keyword,
    secondary_keywords,
    angle,
    hypothesis,
    brief,
    key_points,
  };
}

function detectPillar(text: string): ContentPillar | null {
  for (const { pillar, words } of PILLAR_KEYWORDS) {
    if (words.test(text)) return pillar;
  }
  return null;
}

function detectPriority(text: string): ContentPriority | null {
  for (const { priority, words } of PRIORITY_KEYWORDS) {
    if (words.test(text)) return priority;
  }
  return null;
}

function detectLocations(text: string): string[] {
  const found: string[] = [];
  for (const { match, label } of LOCATIONS) {
    if (match.test(text) && !found.includes(label)) found.push(label);
  }
  return found;
}

function cleanSubject(text: string): string {
  return text
    .replace(/^(?:about|on|regarding|for)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      if (/^(in|on|of|the|a|an|and|or|for|to|with|vs|by)$/i.test(word)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

function buildTitle(subject: string, location: string): string {
  const subjectTC = titleCase(subject.replace(/\s+/g, " ").trim());
  // Try to keep a location reference if one isn't already present.
  const hasLocation = LOCATIONS.some(({ match }) => match.test(subjectTC));
  let candidate = hasLocation ? subjectTC : `${subjectTC} for ${location} Cabin Owners`;

  // Aim for 50-70 chars. Trim or extend gently.
  if (candidate.length < 45) {
    candidate = hasLocation
      ? `${subjectTC}: What ${location} Cabin Owners Should Know`
      : `${subjectTC} for ${location} Vacation Rental Owners`;
  }
  if (candidate.length > 70) {
    candidate = candidate.slice(0, 67).replace(/[\s,;:.-]+$/g, "") + "...";
  }
  return candidate;
}

function buildKeyword(subject: string, location: string): string {
  const tokens = tokenize(subject).slice(0, 4);
  const base = tokens.join(" ");
  const lowerLoc = location.toLowerCase();
  if (base.toLowerCase().includes(lowerLoc)) return base.toLowerCase();
  return `${lowerLoc} ${base}`.trim().toLowerCase();
}

function buildSecondaryKeywords(subject: string, locations: string[]): string[] {
  const tokens = tokenize(subject);
  const out = new Set<string>();
  for (const loc of locations.length ? locations : ["Smoky Mountains"]) {
    out.add(`${loc.toLowerCase()} vacation rental`);
    out.add(`${loc.toLowerCase()} cabin owner`);
  }
  if (tokens.length >= 2) out.add(tokens.slice(0, 3).join(" ").toLowerCase());
  if (tokens.length >= 3) out.add(tokens.slice(0, 2).join(" ").toLowerCase());
  return Array.from(out).slice(0, 5);
}

function buildAngle(subject: string, location: string): string {
  return `Operator-level take on ${subject.toLowerCase()} for ${location} cabin owners — what is actually working in our portfolio, not generic advice.`;
}

function buildHypothesis(subject: string, pillar: ContentPillar): string {
  const lens: Record<ContentPillar, string> = {
    market_data: "the data tells a clearer story than the headlines",
    revenue_strategy: "small pricing or stay-rule changes move the needle more than guests do",
    operations: "the boring operational details are what protect the margin",
    industry_insights: "the industry narrative misses the on-the-ground reality",
    haven_performance: "our portfolio numbers show the play before the rest of the market catches up",
  };
  return `For ${subject.toLowerCase()}, ${lens[pillar]}. We can show that with our own numbers and a couple of cited sources.`;
}

function buildBrief(subject: string, location: string, pillar: ContentPillar): string {
  const audience =
    pillar === "haven_performance"
      ? "Haven owners and prospective owners"
      : `${location} cabin owners`;
  return [
    `Audience: ${audience}.`,
    `Subject: ${subject}.`,
    `Pillar: ${PILLAR_LABELS[pillar]}.`,
    `Voice: first-person Jack Zoppa. Operator credibility, no guru tone.`,
    `Must include 2-3 sourced data points and one Haven internal link.`,
  ].join(" ");
}

function buildKeyPoints(
  subject: string,
  location: string,
  pillar: ContentPillar,
): string[] {
  const generic = [
    `Why ${subject.toLowerCase()} matters right now for ${location} cabin owners.`,
    `What our Haven portfolio numbers show on this.`,
    `Two or three external data points (AirDNA, county tax records, Sevier County, or industry reports).`,
    `One thing owners should change this month, and one to watch this quarter.`,
    `Soft CTA back to a Haven page or internal post.`,
  ];
  const pillarSpecific: Record<ContentPillar, string[]> = {
    revenue_strategy: [
      `Show the pricing or stay-rule lever in plain numbers.`,
    ],
    operations: [
      `Tie the operational change to a guest review or repeat-booking signal.`,
    ],
    market_data: [
      `Anchor with a year-over-year stat for the Smoky Mountains region.`,
    ],
    industry_insights: [
      `Contrast the industry headline with what we are seeing in Sevier County.`,
    ],
    haven_performance: [
      `Lead with one specific cabin or cohort and a dated result.`,
    ],
  };
  return [...generic, ...pillarSpecific[pillar]];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

// ---------------------------------------------------------------------------
// Idea generation (deterministic / local fallback)
// ---------------------------------------------------------------------------

/**
 * Returns seasonal-ish idea seeds for Smoky Mountain cabin owners
 * keyed on the current month. The shape is structured for clean
 * upgrade to a live web-search backed generator later.
 */
export function generateLocalTopicIdeas(input: {
  now?: Date;
  count?: number;
}): TopicIdea[] {
  const now = input.now ?? new Date();
  const count = Math.max(1, Math.min(12, input.count ?? 6));
  const month = now.getMonth(); // 0-11
  const seeds = SEASONAL_SEEDS[month];

  // Always include 2 evergreen anchor seeds so the list is varied.
  const evergreen = EVERGREEN_SEEDS;
  const ordered = [...seeds, ...evergreen];

  return ordered.slice(0, count).map((seed) => seedToIdea(seed, now));
}

type Seed = {
  title: string;
  pillar: ContentPillar;
  rationale: string;
  primary_keyword: string;
  secondary: string[];
  key_points: string[];
  urgency: "now" | "this_quarter" | "evergreen";
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
  priority: ContentPriority;
};

function seedToIdea(seed: Seed, now: Date): TopicIdea {
  const monthName = now.toLocaleString("en-US", { month: "long" });
  return {
    title: seed.title,
    pillar: seed.pillar,
    priority: seed.priority,
    target_keyword: seed.primary_keyword,
    secondary_keywords: seed.secondary,
    angle: `${seed.rationale} (planned for ${monthName} ${now.getFullYear()}.)`,
    hypothesis: `${seed.rationale} The Haven portfolio numbers and a couple of regional data points should make this concrete.`,
    brief:
      `Audience: Smoky Mountain cabin owners. ${seed.rationale} ` +
      `Voice: first-person Jack Zoppa, operator credibility, 2-3 sourced data points, one Haven internal link.`,
    key_points: seed.key_points,
    rationale: seed.rationale,
    urgency: seed.urgency,
    difficulty: seed.difficulty,
    impact: seed.impact,
  };
}

const EVERGREEN_SEEDS: Seed[] = [
  {
    title: "Cabin Owner Tax Prep: What Every Smoky Mountain Owner Should Track",
    pillar: "operations",
    rationale:
      "Most owners under-track deductible expenses; a clean year-end checklist saves real money.",
    primary_keyword: "smoky mountains cabin tax prep",
    secondary: ["short-term rental tax", "cabin owner deductions", "sevier county tax"],
    key_points: [
      "Categories most owners miss (depreciation, software, mileage)",
      "Sevier County occupancy and lodging tax cadence",
      "When to escalate to a CPA familiar with STR",
      "Haven's owner-statement export and how it lines up",
    ],
    urgency: "evergreen",
    difficulty: "medium",
    impact: "high",
    priority: "high",
  },
  {
    title: "Pricing Floors That Protect ADR Without Killing Occupancy",
    pillar: "revenue_strategy",
    rationale:
      "Owners default to discounting; a defended floor with a smart minimum-stay change usually beats a price cut.",
    primary_keyword: "smoky mountains cabin pricing",
    secondary: ["pricing floor", "minimum stay", "adr vacation rental"],
    key_points: [
      "Why a price floor + min-stay shift outperforms a 10% discount",
      "Two examples from Haven's portfolio with before/after",
      "The cheapest pricing tools that respect a floor",
      "When to break the floor (only)",
    ],
    urgency: "evergreen",
    difficulty: "medium",
    impact: "high",
    priority: "medium",
  },
];

const SEASONAL_SEEDS: Seed[][] = [
  // 0 = January
  [
    {
      title: "Smoky Mountains Booking Pace: What January Tells You About Spring",
      pillar: "market_data",
      rationale:
        "January pace is the earliest reliable signal for spring revenue. Most owners under-react.",
      primary_keyword: "smoky mountains booking pace january",
      secondary: ["spring booking pace", "gatlinburg cabin demand", "vacation rental pace"],
      key_points: [
        "What pace data we look at on the 15th of January",
        "Year-over-year comparison and what to do if pace lags",
        "Two pricing levers if pace is soft",
        "When to leave it alone",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
    {
      title: "Owner Tax Prep Checklist for Smoky Mountain Cabins",
      pillar: "operations",
      rationale:
        "Tax season starts now. A simple checklist prevents missed deductions.",
      primary_keyword: "cabin owner tax prep",
      secondary: ["short-term rental tax", "smoky mountains tax", "vacation rental cpa"],
      key_points: [
        "What to pull from your PMS or owner portal",
        "Common missed deductions",
        "When a 1099 or Schedule E specialist matters",
      ],
      urgency: "now",
      difficulty: "easy",
      impact: "high",
      priority: "high",
    },
    {
      title: "Gap Nights: How to Turn Empty Tuesdays Into Bookings",
      pillar: "revenue_strategy",
      rationale: "Winter exposes gap-night problems most aggressively.",
      primary_keyword: "gap nights smoky mountains",
      secondary: ["minimum stay strategy", "tuesday booking", "shoulder night pricing"],
      key_points: [
        "How we identify gap nights in Haven's portfolio",
        "The min-stay / orphan-night rule we use",
        "Pricing tweaks that don't cannibalize weekends",
      ],
      urgency: "this_quarter",
      difficulty: "medium",
      impact: "medium",
      priority: "medium",
    },
  ],
  // 1 = February
  [
    {
      title: "Spring Break Demand: Reading the Smoky Mountains Calendar Early",
      pillar: "market_data",
      rationale:
        "Spring break weeks vary by school district. A regional view beats one calendar.",
      primary_keyword: "smoky mountains spring break demand",
      secondary: ["spring break booking", "gatlinburg spring cabin", "school district calendars"],
      key_points: [
        "Top feeder markets and their spring break weeks",
        "How we stage rates by week, not by month",
        "When to extend min-stay vs. lift price",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
    {
      title: "Maintenance Walk-Throughs Before Spring: A 12-Item List",
      pillar: "operations",
      rationale: "Cheap to fix in February; expensive after the first spring guest review.",
      primary_keyword: "cabin maintenance spring",
      secondary: ["smoky mountains cabin maintenance", "hot tub winterizing", "owner walkthrough"],
      key_points: [
        "Hot tubs, decks, HVAC, roofs",
        "Which items the cleaning team can flag vs. owner",
        "What we replace on a schedule and what we run to fail",
      ],
      urgency: "now",
      difficulty: "easy",
      impact: "medium",
      priority: "medium",
    },
  ],
  // 2 = March
  [
    {
      title: "Spring Booking Pace in Gatlinburg: What the Data Shows",
      pillar: "market_data",
      rationale: "By March, pace data is solid enough to call the season.",
      primary_keyword: "gatlinburg spring booking pace",
      secondary: ["spring break gatlinburg", "smoky mountains pace", "vacation rental pace"],
      key_points: [
        "Pace comparison vs. last year",
        "Where Haven is over- and under-performing",
        "What we change in the next 30 days",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "urgent",
    },
    {
      title: "Easter and Spring Break Pricing: A Two-Week Plan for Cabin Owners",
      pillar: "revenue_strategy",
      rationale: "Most cabin owners flat-price the whole season. Stage it instead.",
      primary_keyword: "easter cabin pricing smoky mountains",
      secondary: ["spring break pricing", "cabin pricing strategy"],
      key_points: [
        "Calendar overlay: Easter, spring break, school weeks",
        "Stairstep pricing approach",
        "How we test a 7% lift on shoulder nights",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
  ],
  // 3 = April
  [
    {
      title: "Summer Booking Window in the Smokies: When to Hold and When to Discount",
      pillar: "revenue_strategy",
      rationale:
        "Summer pace by mid-April separates the cabins that hit budget from the ones that scramble.",
      primary_keyword: "smoky mountains summer booking pace",
      secondary: ["summer cabin demand", "vacation rental summer pricing"],
      key_points: [
        "How we read pace at 8, 12, and 16 weeks out",
        "When to discount and when to hold",
        "What we never discount",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "urgent",
    },
    {
      title: "Outdoor Amenity Investment: What Pays Back in 12 Months",
      pillar: "operations",
      rationale: "Spring is the right time to commit. Most owners overspend on the wrong amenity.",
      primary_keyword: "cabin amenity roi smoky mountains",
      secondary: ["hot tub roi", "fire pit cabin", "outdoor kitchen vacation rental"],
      key_points: [
        "Top 3 amenities by review impact in Haven's portfolio",
        "What we have NOT recouped",
        "Hidden insurance and maintenance costs",
      ],
      urgency: "this_quarter",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
  ],
  // 4 = May
  [
    {
      title: "Memorial Day Weekend in the Smoky Mountains: Last-Minute Levers",
      pillar: "revenue_strategy",
      rationale: "Pace decisions in mid-May still move the needle for Memorial Day.",
      primary_keyword: "memorial day smoky mountains cabin",
      secondary: ["memorial day cabin pricing", "last minute vacation rental"],
      key_points: [
        "Last-minute discount vs. min-stay relax",
        "OTA promo decisions",
        "What we never compromise",
      ],
      urgency: "now",
      difficulty: "easy",
      impact: "medium",
      priority: "high",
    },
  ],
  // 5 = June
  [
    {
      title: "Peak Summer Operations: Avoiding the July Review Slump",
      pillar: "operations",
      rationale: "Reviews dip in July under volume. The fix is operational, not pricing.",
      primary_keyword: "summer cabin operations smoky mountains",
      secondary: ["vacation rental review management", "peak season turnover"],
      key_points: [
        "Where reviews actually slip in our data",
        "Cleaning team capacity planning",
        "Owner-side restock cadence",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
  ],
  // 6 = July
  [
    {
      title: "July Pace Check and a Fall Pricing Reset for Smoky Mountain Cabins",
      pillar: "revenue_strategy",
      rationale: "July is the right moment to set a fall floor; most owners wait too long.",
      primary_keyword: "smoky mountains fall cabin pricing",
      secondary: ["fall booking pace", "fall foliage cabin", "october cabin pricing"],
      key_points: [
        "Fall pace signals to look at in July",
        "Why an October floor beats October discounts",
        "What we lock in for foliage weeks",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
  ],
  // 7 = August
  [
    {
      title: "Fall Foliage Demand Forecast for the Smoky Mountains",
      pillar: "market_data",
      rationale: "Foliage drives the second-best revenue weeks of the year.",
      primary_keyword: "smoky mountains fall foliage demand",
      secondary: ["october cabin demand", "leaf peeping vacation rental"],
      key_points: [
        "Historical pace shape for Sept and Oct",
        "Where foliage weeks land this year",
        "Pricing posture week-by-week",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "urgent",
    },
  ],
  // 8 = September
  [
    {
      title: "Holiday Booking Window: When Smoky Mountain Cabins Should Open Christmas",
      pillar: "revenue_strategy",
      rationale: "Christmas opens earlier every year. Owners who hold rates often miss the window.",
      primary_keyword: "christmas cabin smoky mountains booking",
      secondary: ["holiday cabin rental", "december cabin demand"],
      key_points: [
        "Pace data for Christmas week",
        "How we open and close inventory by date",
        "What the OTA promos look like in late September",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "high",
    },
  ],
  // 9 = October
  [
    {
      title: "Fall Foliage Performance: What the Smoky Mountains Numbers Show",
      pillar: "haven_performance",
      rationale: "Real numbers from foliage weeks beat any forecast.",
      primary_keyword: "smoky mountains fall foliage performance",
      secondary: ["october cabin revenue", "foliage week adr"],
      key_points: [
        "Haven portfolio ADR/occupancy this foliage stretch",
        "Where we beat last year and where we missed",
        "What we change for next year",
      ],
      urgency: "now",
      difficulty: "easy",
      impact: "high",
      priority: "high",
    },
  ],
  // 10 = November
  [
    {
      title: "Winter and Holiday Pace in the Smoky Mountains: November Signals",
      pillar: "market_data",
      rationale:
        "November pace usually predicts holiday revenue better than any forecast tool.",
      primary_keyword: "smoky mountains winter holiday pace",
      secondary: ["thanksgiving cabin demand", "christmas cabin smoky mountains"],
      key_points: [
        "Pace signals on Thanksgiving and Christmas weeks",
        "What we do in week 1 of November vs. week 4",
        "When to push New Year's bookings",
      ],
      urgency: "now",
      difficulty: "medium",
      impact: "high",
      priority: "urgent",
    },
  ],
  // 11 = December
  [
    {
      title: "Year-End Wrap: What 2025 Taught Smoky Mountain Cabin Owners",
      pillar: "haven_performance",
      rationale:
        "A year-end reflection grounded in real Haven numbers travels well in early January.",
      primary_keyword: "smoky mountains cabin year end review",
      secondary: ["vacation rental year in review", "haven performance"],
      key_points: [
        "Top 3 wins and 2 misses in our portfolio",
        "What we are doing differently in Q1",
        "What every owner should track for next year",
      ],
      urgency: "now",
      difficulty: "easy",
      impact: "medium",
      priority: "high",
    },
  ],
];
