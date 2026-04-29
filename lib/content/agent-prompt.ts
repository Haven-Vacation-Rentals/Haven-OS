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
  /**
   * When true, the suggestion is unambiguous enough to apply without an
   * "Apply to draft" round-trip. Used for direct edits like hyperlink
   * insertion — Jack pastes URLs, the agent links them, the right pane
   * updates immediately. The chat still records the suggestion + a
   * concise message, and the message is marked applied=true.
   */
  auto_apply?: boolean;
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
You move topics through four stages: Idea → In Progress → Draft → Complete. "Idea" is the backlog. "In Progress" is anything actively being researched, briefed, outlined, or optimized. "Draft" means a full article is on the canvas and ready for review. "Complete" means the article has shipped (WordPress draft created, reviewed, or published).

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
structured suggestion that updates body_md, title, or meta_description.
Do not paste URLs or advice into the chat as the answer — the chat is
for confirmation. The actual edit must land in the article on the
right.

# Adding hyperlinks (very important)
When Jack pastes a list of links or asks you to "add these links",
"weave these links into the post", "turn these into hyperlinks", "link
these sources throughout the article", "add internal/external links",
or "make X link to Y", you must update body_md to insert inline
markdown links of the form [anchor](url) on relevant words or phrases
inside the existing post.

Rules for hyperlink insertion:
- Prioritize weaving links into existing relevant words or phrases in
  the article where they are mentioned. A Rabbu URL should land on
  "Rabbu", "market data", "STR market data", or a directly relevant
  data phrase. An amenities/hot-tub URL should land on "hot tubs",
  "amenity upgrade", or "ADR" only when context fits.
- Each URL is used once. Never double-link text that is already inside
  an existing markdown link.
- If a URL cannot be placed cleanly on an existing phrase, do NOT
  invent filler sentences like "For context, see Rabbu." Leave the
  URL in chat and say which links you placed and which you couldn't.
- Only add a "Sources" or "Further reading" section if Jack explicitly
  asks for one. Default behavior: no fallback sources block.
- When Jack says "weave the links into the post" or "clean up the
  links", treat that as a re-run: strip any prior "For context, see
  ..." filler paragraphs you added, keep good inline links, then
  place the freed-up URLs onto better anchors if you can.
- Internal links (havenvacationrentals.com or relative /paths) are
  preferred where they make sense for the topic.
- Markdown anchor text must be clean - never include a URL, brackets,
  or stray punctuation inside the anchor of [anchor](url).
- Never echo the raw URL list back at the user. The answer is the
  edited article. Reply with a concise summary like "Wove 8 links
  into the post. 5 didn't fit cleanly — they're still in chat for
  you to triage."

When the user asks for a new topic or for ideas, call the matching
tool and respond with a short confirmation. Never write to an article
without a suggestion the user can apply (or that the harness applies
automatically for unambiguous edits like link insertion). Never
publish. Drafts only.`;

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

  // Hyperlink insertion / cleanup. Detect this BEFORE the generic
  // "improve / add" handlers so a paste of URLs is recognized, and so
  // that "I want the links woven into the post where they are
  // mentioned" triggers a real edit instead of a generic response.
  if (looksLikeLinkInsertion(text)) {
    const promptLinks = extractLinks(text);
    const cleanupOnly = promptLinks.length === 0 && looksLikeLinkCleanup(text);

    if (promptLinks.length === 0 && !cleanupOnly) {
      return {
        message:
          "I see you want to add links but I could not find any URLs in that message. Paste the URLs (with optional source names) and I will weave them into the post.",
        suggestion: null,
      };
    }

    if (!article.body_md || article.body_md.trim().length === 0) {
      return {
        message:
          "I have the URLs but the article body is empty. Add a draft first and I will weave the links in.",
        suggestion: null,
      };
    }

    const result = applyLinkInsertion({
      body: article.body_md,
      promptLinks,
      sources,
    });

    const bodyChanged = result.body !== article.body_md;
    if (!bodyChanged && result.placed.length === 0 && result.cleanedFallbacks === 0) {
      // Nothing we could do without making the post awkward.
      const total = promptLinks.length + result.alreadyPresent.length;
      return {
        message: cleanupOnly
          ? "I looked through the post and there's nothing I can weave in more naturally — every link is already on a relevant phrase. If you want me to introduce a new phrase to anchor a specific link, tell me which one and where."
          : `I couldn't place ${promptLinks.length === 1 ? "that link" : `those ${promptLinks.length} links`} on existing phrases without making the post awkward. ${total === result.alreadyPresent.length ? "Most of them are already linked in the body." : "Tell me which phrase to anchor each one to, or paste them with a label like \"Rabbu - https://...\"."}`,
        suggestion: null,
      };
    }

    const parts: string[] = [];
    const placedCount = result.placed.length;
    const unplacedCount = result.unplaced.length;
    if (placedCount > 0) {
      parts.push(
        `Wove ${placedCount} link${placedCount === 1 ? "" : "s"} into the post on phrases that already match.`,
      );
    } else if (cleanupOnly && result.cleanedFallbacks > 0) {
      parts.push(
        `Cleaned up ${result.cleanedFallbacks} filler sentence${result.cleanedFallbacks === 1 ? "" : "s"} that were sitting before the sign-off.`,
      );
    }
    if (result.cleanedFallbacks > 0 && placedCount > 0) {
      parts.push(
        `Removed ${result.cleanedFallbacks} stale "For context, see ..." sentence${result.cleanedFallbacks === 1 ? "" : "s"} from before the sign-off.`,
      );
    }
    if (unplacedCount > 0) {
      parts.push(
        `${unplacedCount} link${unplacedCount === 1 ? "" : "s"} didn't fit cleanly — left ${unplacedCount === 1 ? "it" : "them"} in chat for you to triage. Tell me which phrase to anchor each one to and I'll place them.`,
      );
    }
    if (parts.length === 0) {
      parts.push("Tightened the link placement in the draft.");
    }

    return {
      message: parts.join(" "),
      suggestion: { kind: "replace_body", body_md: result.body },
      auto_apply: true,
    };
  }

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

// ---------------------------------------------------------------------------
// Full SEO/GEO optimization pass — opinionated, multi-step. Used by the
// studio "Optimize this draft" action so a single click applies a real
// improvement to the article instead of returning advice.
// ---------------------------------------------------------------------------

export type FullOptimizationResult = {
  title: string;
  meta_description: string;
  body_md: string;
  summary: string[];
};

/**
 * Apply every safe, deterministic SEO/GEO improvement we can without
 * inventing facts:
 *   - Tighten title to 50–70 chars + include keyword + location.
 *   - Build/repair a 150–160 char meta description.
 *   - Strip em dashes, exclamations, common buzzwords, hedge filler.
 *   - Replace `leverage`, `utilize`, etc. with plain English.
 *   - Add H2 structure if the body is a flat run of paragraphs.
 *   - Ensure target keyword shows up in lede.
 *   - Ensure soft CTA + Jack sign-off are present.
 *   - Add an FAQ section if the body is long enough and lacks one.
 */
export function applyFullSeoOptimization(input: {
  article: ContentArticle;
  topic: ContentTopic;
}): FullOptimizationResult {
  const { article, topic } = input;
  const summary: string[] = [];

  // ---- Title -----------------------------------------------------------
  const newTitle = strongerTitle(article, topic);
  if (newTitle !== article.title) {
    summary.push(
      `Title rewritten to ${newTitle.length} chars (target 50–70).`,
    );
  }

  // ---- Meta description ------------------------------------------------
  const newMeta = strongMeta(article, topic);
  if (newMeta !== article.meta_description) {
    summary.push(
      `Meta description rewritten to ${newMeta.length} chars (target 150–160).`,
    );
  }

  // ---- Body ------------------------------------------------------------
  let body = article.body_md ?? "";

  // Em dashes / exclamations.
  if (/—/.test(body)) {
    body = body.replaceAll("—", "-");
    summary.push("Replaced em dashes with hyphens.");
  }
  if (/!/.test(body)) {
    body = body.replaceAll("!", ".");
    summary.push("Toned down exclamation points to periods.");
  }

  // Buzzword / hedge replacements.
  const replacements: Array<[RegExp, string, string]> = [
    [/\bleverage\b/gi, "use", "leverage→use"],
    [/\butilize\b/gi, "use", "utilize→use"],
    [/\bsynergy\b/gi, "fit", "synergy→fit"],
    [/\bgame[- ]?changer\b/gi, "real lever", "game-changer→real lever"],
    [/\bcutting[- ]edge\b/gi, "current", "cutting-edge→current"],
    [/\bworld[- ]class\b/gi, "strong", "world-class→strong"],
    [/\bin order to\b/gi, "to", "in order to→to"],
    [/\bvery (very )?\b/gi, "", "stripped 'very'"],
    [/\bjust\b\s+/gi, "", "stripped 'just'"],
    [/\breally\b\s+/gi, "", "stripped 'really'"],
    [/\bsimply\b\s+/gi, "", "stripped 'simply'"],
    [/\bunlock\b/gi, "open up", "unlock→open up"],
    [/\bsupercharge\b/gi, "speed up", "supercharge→speed up"],
    [/\brevolutioni[sz]e\b/gi, "change", "revolutionize→change"],
  ];
  const swapsApplied: string[] = [];
  for (const [r, replacement, label] of replacements) {
    const before = body;
    body = body.replace(r, replacement);
    if (body !== before) swapsApplied.push(label);
  }
  if (swapsApplied.length > 0) {
    summary.push(
      `Replaced buzzwords/hedges: ${swapsApplied.slice(0, 4).join(", ")}${swapsApplied.length > 4 ? "…" : ""}.`,
    );
  }

  // Add H2 structure if missing.
  const before = body;
  const sectioned = autoSectionHeadings({ ...article, body_md: body });
  if (sectioned !== before) {
    body = sectioned;
    summary.push("Added H2 section headings to break up the draft.");
  }

  // Ensure keyword in lede.
  const kw = topic.target_keyword?.trim();
  if (kw) {
    const blocks = parsePostBlocks(body);
    const introIdx = blocks.findIndex((b) => b.type === "p");
    if (introIdx >= 0) {
      const intro = blocks[introIdx]! as Extract<PostBlock, { type: "p" }>;
      if (!intro.text.toLowerCase().includes(kw.toLowerCase())) {
        intro.text = `${kw} — ${intro.text}`.replaceAll("—", "-");
        body = serializePostBlocks(blocks);
        summary.push(`Added target keyword "${kw}" to the lede.`);
      }
    }
  }

  // Soft CTA.
  const lowerBody = body.toLowerCase();
  if (
    !/sales@havenvacationrentals\.com/.test(lowerBody) &&
    !/(reach out|talk through|walk you through|second set of eyes|happy to)/.test(
      lowerBody,
    )
  ) {
    body = upsertSoftCta({ ...article, body_md: body });
    summary.push("Added a soft operator-voice CTA before the sign-off.");
  }

  // Sign-off.
  if (!body.includes(SIGN_OFF)) {
    body = body.trimEnd() + "\n\n" + SIGN_OFF + "\n";
    summary.push("Added the Jack Zoppa sign-off.");
  }

  // FAQ section if missing and body is long enough.
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const hasFaq = /(^|\n)#{2,3}\s+(FAQ|Frequently Asked)/i.test(body);
  if (!hasFaq && wordCount >= 600) {
    body =
      body.trimEnd() +
      "\n\n## FAQ\n\n" +
      buildFaqSection(topic) +
      "\n";
    summary.push("Added an FAQ section to surface common owner questions.");
  }

  if (summary.length === 0) {
    summary.push(
      "The draft already meets the basics — title length, keyword in title and lede, sign-off, and clean voice. Run the scorers to see the remaining warnings.",
    );
  }

  return {
    title: newTitle,
    meta_description: newMeta,
    body_md: body,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Hyperlink insertion — local fallback. Weaves URLs into existing
// phrases in the article instead of dumping fallback "For context, see
// ..." sentences before the sign-off. The insertion engine:
//
//   1. Scans for an explicit user label, the publisher/title of the
//      registered research source, the URL's domain (Rabbu, AirDNA),
//      AND a curated set of topic-shaped anchor phrases tied to that
//      domain (Rabbu → "market data", "STR market data", "ADR";
//      AirDNA → "occupancy", "RevPAR"; etc.) — picks the first one
//      that already exists in the body, prefers longer/more specific
//      candidates, and skips text already inside a markdown link.
//   2. If no candidate fits, the URL is reported as "unplaced" and
//      left for the caller to handle. The fallback sentence path is
//      gone — we no longer auto-append "For context, see ..." spam.
// ---------------------------------------------------------------------------

/**
 * Anchor-phrase hints keyed by the source's root domain. When a URL
 * comes from one of these publishers, we look for these phrases in the
 * article body before falling back to the bare publisher name. Order
 * matters: more specific phrases first so "STR market data" wins over
 * "market data". Lowercase for matching.
 */
const DOMAIN_ANCHOR_HINTS: Record<string, string[]> = {
  rabbu: [
    "STR market data",
    "short-term rental market data",
    "market data",
    "revenue projections",
    "revenue projection",
    "ADR",
    "average daily rate",
    "occupancy rate",
    "Pigeon Forge market",
    "Gatlinburg market",
    "Sevierville market",
    "market comp",
    "comparable rentals",
  ],
  airdna: [
    "RevPAR",
    "occupancy",
    "occupancy rate",
    "ADR",
    "average daily rate",
    "market score",
    "demand index",
    "STR data",
    "short-term rental data",
  ],
  airbnb: ["Airbnb listing", "Airbnb"],
  vrbo: ["Vrbo listing", "Vrbo"],
  pricelabs: ["dynamic pricing", "pricing strategy", "PriceLabs"],
  wheelhouse: ["dynamic pricing", "Wheelhouse"],
  beyondpricing: ["dynamic pricing", "Beyond Pricing"],
  tnvacation: [
    "Tennessee tourism",
    "Smoky Mountains tourism",
    "Tennessee Department of Tourist Development",
  ],
  nps: ["national park visitation", "Great Smoky Mountains National Park"],
  sevierville: ["Sevierville"],
  pigeonforge: ["Pigeon Forge"],
  gatlinburg: ["Gatlinburg"],
};

/**
 * Generic topic anchors used as a last resort across any source. Order
 * matters — most specific first.
 */
const GENERIC_TOPIC_ANCHORS = [
  "STR market data",
  "short-term rental market data",
  "market data",
  "revenue projections",
  "revenue projection",
  "RevPAR",
  "ADR",
  "average daily rate",
  "occupancy rate",
  "occupancy",
  "amenity upgrade",
  "amenity upgrades",
  "hot tubs",
  "hot tub",
  "cabin upgrades",
  "guest experience",
  "booking pace",
  "lead time",
];

/**
 * Heuristic: does this prompt look like Jack asking for hyperlink
 * work? Two flavors:
 *
 *   - "Add/weave/embed these links": URLs are present in the prompt.
 *   - "Weave the links into the post" / "clean up the link spam":
 *      no new URL needed — the user wants us to re-run placement on
 *      the URLs already in the body and clean up filler sentences.
 *
 * `requiresUrl=false` means the cleanup-only path is OK; the caller
 * should still check for URLs to decide whether new links can be
 * inserted.
 */
export function looksLikeLinkInsertion(text: string): boolean {
  const lower = text.toLowerCase();
  const hasUrl = /https?:\/\/\S+/i.test(text) || /\(\/[^)]+\)/.test(text);

  // Cleanup / re-weave intent — true even without URLs in the prompt.
  if (looksLikeLinkCleanup(text)) return true;

  if (!hasUrl) return false;
  if (
    /\b(add|insert|include|weave|sprinkle|put|place|drop|embed|inline)\b.*\b(link|hyperlink|source|citation|reference|url)s?\b/.test(
      lower,
    )
  )
    return true;
  if (/\bturn\b.*\b(into|to)\b.*\b(link|hyperlink|anchor)s?\b/.test(lower))
    return true;
  if (/\blink\b.*\b(through|throughout|in|into)\b.*\b(article|post|draft|piece)\b/.test(lower))
    return true;
  if (/\b(internal|external|outbound|inbound)\s+links?\b/.test(lower)) return true;
  if (/\bmake\s+\S+\s+(?:link|point)\s+to\b/.test(lower)) return true;
  if (/\bhyperlink/.test(lower)) return true;
  if (/\b(cite|reference|attribute)\b/.test(lower)) return true;

  // Mostly-URLs heuristic — count how much of the text is URL-shaped.
  const urlChars = (text.match(/https?:\/\/\S+/g) ?? []).join("").length;
  if (urlChars > 0 && urlChars / Math.max(1, text.length) > 0.35) return true;

  return false;
}

/**
 * Does this prompt ask us to weave existing links into the post or
 * clean up previously-inserted filler sentences? No URLs required —
 * we operate on what's already in the article.
 */
export function looksLikeLinkCleanup(text: string): boolean {
  const lower = text.toLowerCase();
  // "I want the links woven into the post where they are mentioned"
  if (/\b(weave|embed|inline|integrate|fold|work)\b.*\blinks?\b/.test(lower))
    return true;
  if (/\blinks?\b.*\b(woven|embedded|inlined|integrated|inline)\b/.test(lower))
    return true;
  if (/\b(clean|tidy|fix)\s+up\b.*\blinks?\b/.test(lower)) return true;
  if (/\blinks?\b.*\b(in (the )?(post|article|draft|body))\b/.test(lower) &&
      /\b(woven|inline|where|mentioned|naturally)\b/.test(lower))
    return true;
  if (/\b(remove|kill|drop|strip)\b.*\b(for context|see source|filler)\b/.test(lower))
    return true;
  return false;
}

export type ParsedLink = {
  url: string;
  /** Optional human label scraped from the prompt, e.g. "Rabbu" */
  label: string | null;
};

/**
 * Pull URLs out of free-form text. Recognizes:
 *   - bare URLs: https://rabbu.com/market/pigeon-forge
 *   - markdown links: [Rabbu](https://rabbu.com)
 *   - "Name - https://..." or "Name: https://..." style lines
 *   - relative internal paths in markdown links: [About](/about)
 *
 * Labels are scrubbed: any URL shape, stray brackets/parens, or
 * trailing punctuation is stripped so we never emit anchors like
 * `[Rabbu - https://rabbu.com](https://rabbu.com)`.
 */
export function extractLinks(text: string): ParsedLink[] {
  const out: ParsedLink[] = [];
  const seen = new Set<string>();

  const sanitizeUrl = (raw: string): string =>
    raw.replace(/[).,;:!?\]]+$/, "").trim();

  // 1. Markdown-style [label](url) — captures both http(s) and /paths.
  const mdRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(text))) {
    const url = sanitizeUrl(m[2]!);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, label: cleanLabel(m[1]!) });
  }

  // 2. "Label - https://..." / "Label: https://..." per line.
  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const lm = /^([^-:|–]{2,80})\s*[-–:|]\s*(https?:\/\/\S+)/.exec(line);
    if (lm) {
      const url = sanitizeUrl(lm[2]!);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, label: cleanLabel(lm[1]!) });
    }
  }

  // 3. Bare URLs anywhere we haven't already captured.
  const bareRe = /https?:\/\/[^\s<>()\[\]"']+/g;
  while ((m = bareRe.exec(text))) {
    const url = sanitizeUrl(m[0]!);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, label: null });
  }

  return out;
}

/**
 * Strip a label down to safe anchor text. Removes URL shapes, markdown
 * formatting marks, list bullets, and stray brackets/parens that would
 * otherwise leak into `[anchor](url)` and produce broken renderings.
 */
function cleanLabel(raw: string): string | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  // Drop any embedded URL — labels like "Rabbu — https://rabbu.com" lose
  // the URL part and just keep "Rabbu".
  s = s.replace(/https?:\/\/\S+/g, "").trim();
  // Strip markdown bullets, asterisks, backticks, quotes.
  s = s.replace(/^[-*+•]\s+/, "");
  s = s.replace(/[*_`"']/g, "");
  // Strip stray brackets/parens (especially `](url)` fragments left
  // behind by sloppy paste).
  s = s.replace(/\]\([^)]*\)/g, "");
  s = s.replace(/[\[\]()]/g, "");
  // Trim punctuation residue.
  s = s.replace(/^[\s\-–—:|.,]+|[\s\-–—:|.,]+$/g, "").trim();
  if (!s) return null;
  if (s.length > 60) return null;
  return s;
}

/**
 * Pick the best anchor phrase for a URL by trying, in order:
 *   1. the user-provided label,
 *   2. anchors derived from the registered ContentResearchSource
 *      (publisher, title, data_point words),
 *   3. domain-specific topic anchors (Rabbu → "market data", etc.),
 *   4. the URL's domain word as a brand mention,
 *   5. generic topic anchors.
 *
 * Returns the first candidate that exists verbatim in the body and is
 * not already inside an existing markdown link. Returns null when no
 * clean placement exists — caller decides what to do.
 */
function chooseAnchorPhrase(input: {
  url: string;
  label: string | null;
  body: string;
  sources: ContentResearchSource[];
}): string | null {
  const { url, label, body } = input;
  const candidates: string[] = [];
  if (label) candidates.push(label);

  const src = input.sources.find((s) => s.url && s.url.trim() === url);
  if (src) {
    if (src.publisher) candidates.push(src.publisher);
    if (src.title) candidates.push(src.title);
    if (src.data_point) {
      // Pull noun-ish phrases out of the data point so we don't try to
      // anchor on a full sentence.
      for (const phrase of extractDataPointPhrases(src.data_point)) {
        candidates.push(phrase);
      }
    }
  }

  const domainKey = extractDomainKey(url);
  if (domainKey && DOMAIN_ANCHOR_HINTS[domainKey]) {
    for (const hint of DOMAIN_ANCHOR_HINTS[domainKey]!) candidates.push(hint);
  }

  const domain = extractDomain(url);
  if (domain) candidates.push(domain);

  for (const hint of GENERIC_TOPIC_ANCHORS) candidates.push(hint);

  // Sort candidates by length (longer = more specific), but keep stable
  // order within same-length groups so the user-provided label still
  // wins ties.
  const seen = new Set<string>();
  const ranked = candidates
    .map((c, i) => ({ phrase: c.trim(), i }))
    .filter((c) => {
      if (!c.phrase || c.phrase.length < 3) return false;
      const key = c.phrase.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const dl = b.phrase.length - a.phrase.length;
      if (dl !== 0) return dl;
      return a.i - b.i;
    });

  for (const c of ranked) {
    if (phraseExistsAndIsLinkable(body, c.phrase)) return c.phrase;
  }
  return null;
}

/**
 * Pull short anchorable phrases out of a research data point so we
 * don't try to match against an entire sentence. Heuristic: split on
 * punctuation, keep fragments shorter than ~6 words, drop pure numbers.
 */
function extractDataPointPhrases(text: string): string[] {
  const out: string[] = [];
  for (const part of text.split(/[,;:.()]+/)) {
    const p = part.trim();
    if (!p) continue;
    if (/^\d/.test(p)) continue;
    const words = p.split(/\s+/);
    if (words.length === 0 || words.length > 6) continue;
    out.push(p);
  }
  return out;
}

/**
 * Return the lowercase root domain word, e.g. "https://www.rabbu.com"
 * → "rabbu". Used to look up `DOMAIN_ANCHOR_HINTS`.
 */
function extractDomainKey(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const root = host.split(".")[0] ?? host;
    return root || null;
  } catch {
    return null;
  }
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const root = host.split(".")[0] ?? host;
    if (!root) return null;
    if (/^[a-z]+$/.test(root)) {
      return root[0]!.toUpperCase() + root.slice(1);
    }
    return root;
  } catch {
    return null;
  }
}

/**
 * True when the phrase appears in the body as plain text (not already
 * part of a markdown link `[..](..)`).
 */
function phraseExistsAndIsLinkable(body: string, phrase: string): boolean {
  return findLinkableIndex(body, phrase) !== -1;
}

/**
 * Find the first index of `phrase` in `body` that:
 *   - lies outside any existing markdown link span `[..](..)`,
 *   - is at a word boundary (matches the *whole word* / phrase),
 * or -1 if no such occurrence exists.
 */
function findLinkableIndex(body: string, phrase: string): number {
  const lower = body.toLowerCase();
  const needle = phrase.toLowerCase();
  const isWordChar = (c: string) => /[A-Za-z0-9_]/.test(c);
  let i = 0;
  while (i < lower.length) {
    if (body[i] === "[") {
      const close = body.indexOf("](", i);
      if (close !== -1) {
        const end = body.indexOf(")", close + 2);
        if (end !== -1) {
          i = end + 1;
          continue;
        }
      }
    }
    const found = lower.indexOf(needle, i);
    if (found === -1) return -1;
    // Reject if inside an existing [..](..) span (the loop above only
    // skips spans whose open `[` is at i; this catches phrases that
    // sit inside a span we've already passed).
    const openBefore = body.lastIndexOf("[", found);
    const closeBefore = body.lastIndexOf(")", found);
    if (openBefore > closeBefore) {
      const closeAfter = body.indexOf(")", found);
      if (closeAfter !== -1 && body.slice(openBefore, closeAfter + 1).includes("](")) {
        i = closeAfter + 1;
        continue;
      }
    }
    const before = body[found - 1] ?? " ";
    const after = body[found + phrase.length] ?? " ";
    if (
      (phrase[0] && isWordChar(phrase[0]) && isWordChar(before)) ||
      (phrase[phrase.length - 1] &&
        isWordChar(phrase[phrase.length - 1]!) &&
        isWordChar(after))
    ) {
      i = found + 1;
      continue;
    }
    return found;
  }
  return -1;
}

/**
 * Replace the first plain-text occurrence of `phrase` in `body` with a
 * markdown link `[phrase](url)`. Returns null when nothing was changed.
 */
function linkifyFirst(body: string, phrase: string, url: string): string | null {
  const idx = findLinkableIndex(body, phrase);
  if (idx === -1) return null;
  const matched = body.slice(idx, idx + phrase.length);
  return body.slice(0, idx) + `[${matched}](${url})` + body.slice(idx + phrase.length);
}

export type LinkInsertionResult = {
  body: string;
  /** URLs that were placed inline as `[anchor](url)`. */
  placed: string[];
  /** URLs we could not place cleanly. The caller decides what to do. */
  unplaced: ParsedLink[];
  /** URLs that were already linked in the body before we started. */
  alreadyPresent: string[];
};

/**
 * Weave links into existing phrases in the body. Skips URLs already
 * linked. Each URL is used at most once. **Does not** auto-append
 * "For context, see ..." filler — unplaced URLs are returned to the
 * caller so the agent can phrase the right reply (or just stay quiet
 * and leave them in the chat for Jack to triage).
 */
export function insertLinksIntoBody(input: {
  body: string;
  links: ParsedLink[];
  sources: ContentResearchSource[];
}): LinkInsertionResult {
  let body = input.body ?? "";
  const placed: string[] = [];
  const unplaced: ParsedLink[] = [];
  const alreadyPresent: string[] = [];
  const used = new Set<string>();

  for (const link of input.links) {
    if (!link.url || used.has(link.url)) continue;
    used.add(link.url);

    if (body.includes(`](${link.url})`)) {
      alreadyPresent.push(link.url);
      continue;
    }

    const phrase = chooseAnchorPhrase({
      url: link.url,
      label: link.label,
      body,
      sources: input.sources,
    });

    if (phrase) {
      const next = linkifyFirst(body, phrase, link.url);
      if (next && next !== body) {
        body = next;
        placed.push(link.url);
        continue;
      }
    }

    unplaced.push(link);
  }

  return { body, placed, unplaced, alreadyPresent };
}

/**
 * Detect and remove fallback "For context, see ..." / "Worth a look:
 * ..." / "For the numbers behind that, see ..." paragraphs that earlier
 * versions of the agent appended before the sign-off. Preserves any
 * inline links that the body already wove in correctly.
 *
 * Returns the cleaned body and the list of URLs that were freed up
 * (so the caller can try to re-place them inline).
 */
export function stripFallbackLinkSentences(body: string): {
  body: string;
  removedUrls: string[];
} {
  const blocks = parsePostBlocks(body ?? "");
  const removedUrls: string[] = [];
  const FALLBACK_PATTERNS: RegExp[] = [
    /^for context,?\s*see\s+\[[^\]]+\]\([^)]+\)\.?\s*$/i,
    /^for the numbers behind that,?\s*see\s+\[[^\]]+\]\([^)]+\)(?:\s*\([^)]*\))?\.?\s*$/i,
    /^worth a look:\s+.+\(\[[^\]]+\]\([^)]+\)\)\.?\s*$/i,
    // Older variants without the parenthesised anchor.
    /^worth a look:\s+\[[^\]]+\]\([^)]+\)\.?\s*$/i,
    /^see\s+\[[^\]]+\]\([^)]+\)\s+for\s+(?:more|context)\.?\s*$/i,
  ];

  const kept: PostBlock[] = [];
  for (const b of blocks) {
    if (b.type !== "p") {
      kept.push(b);
      continue;
    }
    const text = b.text.trim();
    const isFallback = FALLBACK_PATTERNS.some((re) => re.test(text));
    if (!isFallback) {
      kept.push(b);
      continue;
    }
    // Capture the URL(s) in the removed sentence so the caller can
    // try to re-place them.
    const urlRe = /\[[^\]]+\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(text))) {
      const u = m[1]!.trim();
      if (u) removedUrls.push(u);
    }
  }

  return { body: serializePostBlocks(kept), removedUrls: dedupe(removedUrls) };
}

/**
 * Pull every URL that is currently linked in the body, regardless of
 * anchor text. Used by the cleanup path to know what links the article
 * is already trying to cite so we can re-weave them.
 */
export function collectExistingLinks(body: string): ParsedLink[] {
  const out: ParsedLink[] = [];
  const seen = new Set<string>();
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body ?? ""))) {
    const url = m[2]!.trim();
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, label: cleanLabel(m[1]!) });
  }
  return out;
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

/**
 * High-level helper used by the local agent for both fresh insertion
 * (Jack pasted URLs) and the re-weave / cleanup path (Jack said "weave
 * the links into the post"). Strips known fallback sentences first,
 * unions the resulting freed-up URLs with any new ones from the
 * prompt, and runs the placement engine once. Returns the new body
 * plus a structured outcome the caller turns into a chat reply.
 */
export function applyLinkInsertion(input: {
  body: string;
  promptLinks: ParsedLink[];
  sources: ContentResearchSource[];
}): {
  body: string;
  placed: string[];
  unplaced: ParsedLink[];
  alreadyPresent: string[];
  cleanedFallbacks: number;
} {
  const cleanup = stripFallbackLinkSentences(input.body);
  let body = cleanup.body;
  const cleanedFallbacks = cleanup.removedUrls.length;

  // Build the set of links to place: new URLs from the prompt first
  // (they carry fresh labels), then URLs we just freed from fallback
  // sentences, then URLs the body already had inlined (we won't
  // re-place those — they show up as `alreadyPresent`).
  const existing = collectExistingLinks(body);
  const merged: ParsedLink[] = [];
  const seen = new Set<string>();
  const push = (link: ParsedLink) => {
    if (!link.url || seen.has(link.url)) return;
    seen.add(link.url);
    merged.push(link);
  };
  for (const l of input.promptLinks) push(l);
  for (const u of cleanup.removedUrls) push({ url: u, label: null });
  for (const l of existing) push(l);

  const result = insertLinksIntoBody({
    body,
    links: merged,
    sources: input.sources,
  });
  body = result.body;

  return {
    body,
    placed: result.placed,
    unplaced: result.unplaced,
    alreadyPresent: result.alreadyPresent,
    cleanedFallbacks,
  };
}
