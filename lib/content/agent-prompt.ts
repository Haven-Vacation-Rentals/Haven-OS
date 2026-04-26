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
    const next = article.body_md.replaceAll("—", " — ").replaceAll("—", "-");
    return {
      message: "Replaced every em dash with a hyphen.",
      suggestion: { kind: "replace_body", body_md: next.replaceAll("—", "-") },
    };
  }

  // Default — note response (no body change)
  return {
    message:
      "I can rewrite sections, set the title or meta, append a section, or run the SEO and GEO scorers. Tell me what you want changed and I'll draft a suggestion you can review before applying.",
    suggestion: null,
  };
}
