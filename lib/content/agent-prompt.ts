/**
 * Haven OS — Content Studio agent prompt module.
 *
 * The Content Studio agent is intended to run as a Claude Managed Agent
 * (Tier B in the Haven Assistant architecture) with its own ID. Until
 * that's wired up, this module owns:
 *
 *   - The system prompt + brand voice rules
 *   - The fallback local "agent" that runs when no managed agent is
 *     configured. The fallback is rule-based — it returns suggestions
 *     for common edits (rewrite, append, set title/meta) so the
 *     workspace is usable end-to-end without external secrets.
 *
 * To wire the real agent, set CLAUDE_CONTENT_AGENT_ID and (optionally)
 * CLAUDE_CONTENT_ENVIRONMENT_ID in the environment, then build a
 * dispatcher in lib/content/agent.ts that prefers the managed agent
 * when available and falls back to runLocalAgent below.
 */

import type {
  ContentAgentSuggestion,
  ContentArticle,
  ContentTopic,
} from "./types";
import { runSeoChecks, runGeoChecks } from "./scoring";
import type { ContentResearchSource } from "./types";
import { parsePostBlocks, serializePostBlocks, type PostBlock } from "./markdown";

export type ContentAgentReply = {
  message: string;
  suggestion: ContentAgentSuggestion | null;
};

export const CONTENT_AGENT_SYSTEM_PROMPT = `You are the Haven Content Studio agent. You help Jack Zoppa, CEO of Haven Vacation Rentals, plan, draft, and ship the Haven Homeowner Blog.

# Audience
Vacation rental property owners in the Smoky Mountains region (Gatlinburg, Pigeon Forge, Sevierville). Never write to guests or travelers.

# Voice
- First-person Jack Zoppa.
- Conversational, direct, data-backed.
- Operator credibility — you run cabins; you have the numbers.
- Confident, not salesy.

# Content pillars
Market Data and Trends; Revenue Strategy; Operations and Guest Experience; Industry Insights; Haven Performance and Case Studies.

# Hard requirements per article
- Title 50-70 characters and includes the location keyword.
- Meta description 150-160 characters.
- 800-1500 words.
- 2-3 sourced data points.
- No em dashes.
- No exclamation points.
- No buzzwords or filler.
- Descriptive, keyword-aware headers.
- At least one internal link to a Haven property or page.
- Soft CTA (no hard pitch).
- Sign-off exactly: "-- Jack Zoppa, CEO, Haven Vacation Rentals".

# Workflow
You move topics through these stages: idea → research → brief → outline → draft → optimize → review → wordpress_draft → published → monitor.

# Tools / capabilities you expose to Jack
- create_topic_from_conversation(message): Parse a free-form line like
  "write about gap nights in Pigeon Forge" or "I want a post on owner
  tax prep" into a structured topic. Pick a pillar, derive a 50-70 char
  title, primary + secondary keywords, an angle, a hypothesis, a brief,
  and a list of key points. Persist to the backlog and confirm in chat
  with a link to the new topic. Use sensible defaults if anything is
  missing — don't ask Jack to fill out a form.
- generate_topic_ideas(count?): Produce a small set of seasonally-aware
  Smoky Mountain homeowner blog ideas pinned to today's date and the
  five content pillars. Each idea includes title, pillar, rationale,
  primary keyword, secondary keywords, brief, key points, urgency,
  difficulty, and impact. Today's local fallback is deterministic; once
  live web search is wired in, use it to anchor each idea to a recent
  data point or article and cite the source.
- add_suggested_topic_to_backlog(idea): Promote a single suggestion to
  a real topic + seeded article in one click.

# How you respond
When the user asks you to edit the article, return the change as a
structured suggestion. When the user asks for a new topic or for
ideas, call the matching tool and respond with a short confirmation.
Never write to an article without a suggestion the user can apply.
Never publish. Drafts only.`;

export const CONTENT_AGENT_ID_ENV = "CLAUDE_CONTENT_AGENT_ID";
export const CONTENT_AGENT_ENV_ID_ENV = "CLAUDE_CONTENT_ENVIRONMENT_ID";

export function isManagedAgentConfigured(): boolean {
  return !!process.env[CONTENT_AGENT_ID_ENV]?.trim();
}

// ---------------------------------------------------------------------------
// Local fallback agent
// ---------------------------------------------------------------------------

type LocalAgentInput = {
  prompt: string;
  article: ContentArticle;
  topic: ContentTopic;
  sources: ContentResearchSource[];
};

/**
 * Rule-based fallback. Recognizes a handful of common editor commands
 * so Jack can demo the loop without wiring the managed agent. Returns
 * a single message + optional suggestion.
 */
export function runLocalAgent(input: LocalAgentInput): ContentAgentReply {
  const { prompt, article, topic, sources } = input;
  const text = prompt.trim();
  const lower = text.toLowerCase();

  // Score / status
  if (/(score|grade|how am i doing|how does (this|it) (look|score))/.test(lower)) {
    const seo = runSeoChecks({ article, topic, sources });
    const geo = runGeoChecks({ article, topic, sources });
    const seoFails = seo.checks.filter((c) => !c.ok).slice(0, 3);
    const geoFails = geo.checks.filter((c) => !c.ok).slice(0, 3);
    const lines = [
      `SEO ${seo.score}/100, GEO ${geo.score}/100.`,
      seoFails.length
        ? `Top SEO gaps: ${seoFails.map((c) => c.label).join("; ")}.`
        : "No SEO gaps.",
      geoFails.length
        ? `Top GEO gaps: ${geoFails.map((c) => c.label).join("; ")}.`
        : "No GEO gaps.",
    ];
    return { message: lines.join(" "), suggestion: null };
  }

  // Set title
  const titleMatch = /^(?:set|change|make)\s+(?:the\s+)?title(?:\s+to)?\s*[:\-]?\s*(.+)$/i.exec(
    text,
  );
  if (titleMatch) {
    const newTitle = titleMatch[1]!.trim().replace(/^["']|["']$/g, "");
    return {
      message: `Suggested new title (${newTitle.length} chars).`,
      suggestion: { kind: "set_title", title: newTitle },
    };
  }

  // Set meta
  const metaMatch = /^(?:set|change|write|draft)\s+(?:the\s+)?meta(?:\s+description)?(?:\s+to)?\s*[:\-]?\s*(.+)$/i.exec(
    text,
  );
  if (metaMatch) {
    const meta = metaMatch[1]!.trim().replace(/^["']|["']$/g, "");
    return {
      message: `Suggested new meta description (${meta.length} chars).`,
      suggestion: { kind: "set_meta", meta_description: meta },
    };
  }

  // Append section
  const appendMatch = /^(?:add|append)\s+(?:a\s+)?(?:section|paragraph)\s+(?:about|on|titled)?\s*[:\-]?\s*(.+)$/i.exec(
    text,
  );
  if (appendMatch) {
    const heading = appendMatch[1]!.trim().replace(/^["']|["']$/g, "");
    const body = `I'll flesh this out with operator-level detail. The point I want to make: ${heading} is a real lever for Smoky Mountains owners, and here is what I'm seeing in the data.`;
    return {
      message: `Drafted a stub section "${heading}" — review and edit before applying.`,
      suggestion: { kind: "append_section", heading, body_md: body },
    };
  }

  // Add sign-off
  if (/(sign[- ]?off|jack zoppa)/i.test(lower) && /add|insert|missing/i.test(lower)) {
    const signOff = "-- Jack Zoppa, CEO, Haven Vacation Rentals";
    if (article.body_md.includes(signOff)) {
      return { message: "Sign-off is already present.", suggestion: null };
    }
    const next = article.body_md.trimEnd() + "\n\n" + signOff + "\n";
    return {
      message: "Added the standard Jack sign-off to the end of the article.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Strip em dashes
  if (/em[- ]?dash|—/.test(lower) && /remove|strip|fix|delete/.test(lower)) {
    const next = article.body_md.replaceAll("—", "-");
    return {
      message: "Replaced every em dash with a hyphen.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Strip exclamations
  if (/exclamation/.test(lower) && /remove|strip|fix|delete/.test(lower)) {
    const next = article.body_md.replaceAll("!", ".");
    return {
      message: "Toned down every exclamation point to a period.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Make title stronger
  if (/(stronger|better|punchier|sharper).*title|title.*(stronger|better|punchier|sharper)|improve\s+the\s+title|tighten\s+the\s+title/.test(lower)) {
    const candidate = strongerTitle(article, topic);
    return {
      message: `Drafted a sharper title (${candidate.length} chars). Review before applying.`,
      suggestion: { kind: "set_title", title: candidate },
    };
  }

  // Tighten the meta description / draft a meta
  if (/(tighten|improve|rewrite|draft).*(meta|description)/.test(lower)) {
    const candidate = strongMeta(article, topic);
    return {
      message: `Drafted a 150-160 char meta description (${candidate.length} chars).`,
      suggestion: { kind: "set_meta", meta_description: candidate },
    };
  }

  // Add H2 structure to a flat draft
  if (/(add|insert|create).*(h2|headings?|sections?)|structure\s+(this|the\s+article|it)/.test(lower)) {
    const next = autoSectionHeadings(article);
    if (!next || next === article.body_md) {
      return {
        message:
          "The draft already has section headings, or there is not enough content to split into sections yet.",
        suggestion: null,
      };
    }
    return {
      message:
        "Added H2 section headings to break up the draft. Review and rename anything that does not match the section's point.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Rewrite intro
  if (/(rewrite|tighten|sharpen|improve|punch up).*(intro|opening|lede|first paragraph)/.test(lower)) {
    const next = rewriteIntro(article, topic);
    if (!next) {
      return {
        message:
          "There is no intro paragraph yet. Add a first paragraph and I will tighten it.",
        suggestion: null,
      };
    }
    return {
      message:
        "Drafted a tighter operator-voice intro. Review and edit before applying.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Add FAQ section
  if (/(add|insert|append|create).*(faq|frequently asked|q&a)/.test(lower)) {
    const heading = "FAQ";
    const body = buildFaqSection(topic);
    return {
      message:
        "Drafted an FAQ section with the questions homeowners actually ask. Edit answers before applying.",
      suggestion: { kind: "append_section", heading, body_md: body },
    };
  }

  // Tighten CTA / add soft CTA
  if (/(tighten|sharpen|improve|rewrite|add|soft).*\bcta\b|call.to.action/.test(lower)) {
    const next = upsertSoftCta(article);
    return {
      message:
        "Replaced any existing CTA with a soft, operator-voice CTA at the end of the draft.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Make it more Jack voice
  if (/(jack|operator|first.person|more.*voice|more.*voice|punch.*voice)/.test(lower) && /(more|sound|voice|rewrite|punch)/.test(lower)) {
    const next = applyJackVoicePass(article);
    return {
      message:
        "Tightened the draft toward Jack's voice — removed buzzwords, exclamations, and hedge phrases. Review before applying.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Improve SEO — opinionated single pass
  if (/(improve|optimize|fix|run).*(seo|search)/.test(lower)) {
    const next = applySeoPass(article, topic);
    if (next === article.body_md) {
      return {
        message:
          "The draft already covers the basics — keyword in the title, an intro, sections, and a sign-off. Run the scorers to see specific gaps.",
        suggestion: null,
      };
    }
    return {
      message:
        "Drafted an SEO pass — added the target keyword to the intro, tightened headings, and ensured a sign-off is present.",
      suggestion: { kind: "replace_body", body_md: next },
    };
  }

  // Rewrite a paragraph that contains a substring (e.g. "rewrite the paragraph about X")
  const rewriteAboutMatch = /^(?:rewrite|sharpen|tighten|polish)\s+(?:the\s+)?paragraph\s+(?:about|on|that mentions|with)\s+(.+)$/i.exec(
    text,
  );
  if (rewriteAboutMatch) {
    const needle = rewriteAboutMatch[1]!.trim();
    const blocks = parsePostBlocks(article.body_md);
    const idx = blocks.findIndex(
      (b) => b.type === "p" && b.text.toLowerCase().includes(needle.toLowerCase()),
    );
    if (idx === -1) {
      return {
        message: `I could not find a paragraph mentioning "${needle}". Tell me which section it's in.`,
        suggestion: null,
      };
    }
    const before = blocks[idx]!;
    const after: PostBlock = {
      ...before,
      type: "p",
      text: tightenSentence(
        (before as Extract<PostBlock, { type: "p" }>).text,
      ),
    };
    blocks[idx] = after;
    return {
      message: `Tightened the paragraph mentioning "${needle}".`,
      suggestion: { kind: "replace_body", body_md: serializePostBlocks(blocks) },
    };
  }

  // Default — note response (no body change)
  return {
    message:
      "I can rewrite the intro, tighten the title or meta, add H2 sections, append an FAQ, sharpen the CTA, or run an SEO pass. Tell me what to change and I'll draft a suggestion you can review before applying.",
    suggestion: null,
  };
}

// ---------------------------------------------------------------------------
// Helpers used by the local agent — kept side-effect free.
// ---------------------------------------------------------------------------

const SIGN_OFF = "-- Jack Zoppa, CEO, Haven Vacation Rentals";

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const trimmed = s.slice(0, max).replace(/\s+\S*$/, "");
  return trimmed.replace(/[,.;:\-–—]\s*$/, "").trim();
}

function strongerTitle(
  article: ContentArticle,
  topic: ContentTopic,
): string {
  const kw = topic.target_keyword?.trim() ?? "";
  const base = article.title?.trim() || topic.working_title?.trim() || topic.title;
  const cleaned = base.replace(/\s+/g, " ").replace(/[!?.]+$/g, "").trim();
  let candidate = cleaned;
  if (kw && !candidate.toLowerCase().includes(kw.toLowerCase())) {
    candidate = `${kw}: ${candidate}`;
  }
  // Aim for the sweet spot 50-70.
  if (candidate.length < 50) {
    candidate = `${candidate} — operator playbook`;
  }
  candidate = candidate.replace(/—/g, "-");
  if (candidate.length > 70) candidate = clamp(candidate, 70);
  return candidate;
}

function strongMeta(article: ContentArticle, topic: ContentTopic): string {
  const kw = topic.target_keyword?.trim() ?? "";
  const angle = topic.angle?.trim() ?? "";
  const base =
    article.meta_description?.trim() ||
    angle ||
    `What I'm seeing on the ground in the Smoky Mountains, with the numbers, so you can make the call as the owner.`;
  let m = base.replace(/\s+/g, " ").trim();
  if (kw && !m.toLowerCase().includes(kw.toLowerCase())) {
    m = `${kw}. ${m}`;
  }
  if (m.length < 150) {
    m = `${m} Operator-level detail from Haven Vacation Rentals — the data, the playbook, the sign-off.`;
  }
  if (m.length > 160) m = clamp(m, 160);
  // Soft pad to 150 if still short.
  while (m.length < 150) m = m + " Read on.";
  if (m.length > 160) m = clamp(m, 160);
  return m;
}

function autoSectionHeadings(article: ContentArticle): string {
  const blocks = parsePostBlocks(article.body_md);
  // If there's already an H2/H3, no-op.
  if (blocks.some((b) => b.type === "h2" || b.type === "h3")) {
    return article.body_md;
  }
  const paragraphs = blocks.filter((b) => b.type === "p");
  if (paragraphs.length < 3) return article.body_md;

  const sectionTitles = [
    "What's actually happening",
    "The numbers that matter",
    "What I'd do as the owner",
    "Where most operators get stuck",
    "Takeaway",
  ];

  const out: PostBlock[] = [];
  let pIndex = 0;
  let sIndex = 0;
  for (const b of blocks) {
    if (b.type === "p") {
      if (pIndex % 2 === 0 && sIndex < sectionTitles.length) {
        out.push({ id: `h2_${sIndex}`, type: "h2", text: sectionTitles[sIndex]! });
        sIndex += 1;
      }
      pIndex += 1;
    }
    out.push(b);
  }
  return serializePostBlocks(out);
}

function rewriteIntro(article: ContentArticle, topic: ContentTopic): string | null {
  const blocks = parsePostBlocks(article.body_md);
  const introIdx = blocks.findIndex((b) => b.type === "p");
  if (introIdx === -1) return null;
  const kw = topic.target_keyword?.trim() ?? "the Smoky Mountains";
  const angle = topic.angle?.trim();
  const newIntro: PostBlock = {
    id: `p_intro`,
    type: "p",
    text: `I run cabins in the Smokies, so when ${kw} comes up I look at the booking pace, the ADR, and what guests are actually doing — not the press releases. Here is what I'm seeing right now${
      angle ? `, and the angle that matters for owners: ${angle.replace(/[.!?]+$/, "")}.` : "."
    }`,
  };
  blocks[introIdx] = newIntro;
  return serializePostBlocks(blocks);
}

function buildFaqSection(topic: ContentTopic): string {
  const kw = topic.target_keyword?.trim() ?? "this strategy";
  const lines = [
    `**Is ${kw} worth the effort for a single-cabin owner?**`,
    `Yes if you can hold the line for a full quarter and review the numbers monthly. The owners who give up at six weeks are the ones who say it doesn't work.`,
    "",
    `**How do I know if my pricing cadence is wrong?**`,
    `Pull your last 90 days, sort by lead time, and look at the days that booked at a discount inside seven days. Those are the days you mispriced.`,
    "",
    `**What's the one mistake to avoid?**`,
    `Treating the calendar like a static thing. Pricing is a daily decision, not a quarterly one.`,
  ];
  return lines.join("\n");
}

function upsertSoftCta(article: ContentArticle): string {
  const cta =
    "If you want a second set of eyes on your numbers, send me a note at sales@havenvacationrentals.com — I'll tell you what I'd change first.";
  const blocks = parsePostBlocks(article.body_md);
  // Remove any existing block that looks like a CTA paragraph.
  const filtered = blocks.filter((b) => {
    if (b.type !== "p") return true;
    const t = b.text.toLowerCase();
    return !(
      t.includes("send me a note") ||
      t.includes("sales@havenvacationrentals.com") ||
      /^(if you|reach out|contact us|book a call)/.test(t)
    );
  });
  // Find sign-off if present and insert before it.
  const signIdx = filtered.findIndex(
    (b) => b.type === "p" && b.text.includes("Jack Zoppa, CEO"),
  );
  const ctaBlock: PostBlock = { id: `p_cta`, type: "p", text: cta };
  if (signIdx === -1) {
    filtered.push(ctaBlock);
    filtered.push({ id: "p_signoff", type: "p", text: SIGN_OFF });
  } else {
    filtered.splice(signIdx, 0, ctaBlock);
  }
  return serializePostBlocks(filtered);
}

function applyJackVoicePass(article: ContentArticle): string {
  let body = article.body_md;
  body = body.replaceAll("—", "-");
  body = body.replaceAll("!", ".");
  // Buzzwords / hedge phrases
  const replacements: Array<[RegExp, string]> = [
    [/\bleverage\b/gi, "use"],
    [/\butilize\b/gi, "use"],
    [/\bsynergy\b/gi, "fit"],
    [/\bgame[- ]?changer\b/gi, "real lever"],
    [/\bcutting[- ]edge\b/gi, "current"],
    [/\bworld[- ]class\b/gi, "strong"],
    [/\bin order to\b/gi, "to"],
    [/\bvery (very )?\b/gi, ""],
    [/\bjust\b\s+/gi, ""],
    [/\breally\b\s+/gi, ""],
    [/\bsimply\b\s+/gi, ""],
  ];
  for (const [r, s] of replacements) body = body.replace(r, s);
  // Ensure sign-off
  if (!body.includes(SIGN_OFF)) {
    body = body.trimEnd() + "\n\n" + SIGN_OFF + "\n";
  }
  return body;
}

function applySeoPass(article: ContentArticle, topic: ContentTopic): string {
  let body = article.body_md;
  const kw = topic.target_keyword?.trim();
  if (kw) {
    const blocks = parsePostBlocks(body);
    const introIdx = blocks.findIndex((b) => b.type === "p");
    if (introIdx >= 0) {
      const intro = blocks[introIdx]! as Extract<PostBlock, { type: "p" }>;
      if (!intro.text.toLowerCase().includes(kw.toLowerCase())) {
        intro.text = `${kw} — ${intro.text}`.replace("—", "-");
      }
    }
    body = serializePostBlocks(blocks);
  }
  if (!body.includes(SIGN_OFF)) {
    body = body.trimEnd() + "\n\n" + SIGN_OFF + "\n";
  }
  body = body.replaceAll("—", "-").replaceAll("!", ".");
  return body;
}

function tightenSentence(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\bvery (very )?\b/gi, "")
    .replace(/\bjust\s+/gi, "")
    .replace(/\bin order to\b/gi, "to")
    .replace(/—/g, "-")
    .trim();
}
