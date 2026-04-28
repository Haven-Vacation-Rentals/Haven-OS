# Content Studio

App-native SEO + GEO content workspace inside Haven OS. ClickUp is **not**
the source of truth — every topic, article, scorecard, agent message,
and WordPress publish job lives in Supabase.

**Route:** `/content` (internal admin only).
**Initial space:** Haven Homeowner Blog (`content_spaces.slug = 'haven-homeowner-blog'`).

---

## Architecture

### Data model (migration `0019_content_studio.sql`)

| Table | Purpose |
|---|---|
| `content_spaces` | Top-level spaces. Seeded with the Homeowner Blog. |
| `content_topics` | Topic backlog / editorial calendar. Carries pillar, stage, priority, target keyword, due/publish dates. |
| `content_articles` | One current draft per topic — title, meta, body markdown, outline, brief, denormalized SEO/GEO scores. |
| `content_article_versions` | Append-only history of article snapshots (every save). |
| `content_research_sources` | Tracked sources / data points per topic. |
| `content_seo_checks` | SEO scorecard runs (score + checklist). |
| `content_geo_checks` | GEO / AI-ranking scorecard runs. |
| `content_agent_messages` | Left-pane chat log per article — user prompts, agent replies, structured suggestions. |
| `content_publish_jobs` | WordPress draft job lifecycle. |

All tables are gated by `admin` / `super_admin` RLS, mirroring the sales
pitches module.

### Server actions (`lib/content/actions.ts`)

All client-callable mutations return `{ ok, data } | { ok, error }`.
`requireAdminOrAbove()` gates every mutation. Reads use the SSR
Supabase client; the service-role admin client is **not** required.

Key actions:

- Topics: `listTopics`, `getTopic`, `createTopic`, `updateTopic`,
  `setTopicStage`, `archiveTopic`.
- Articles: `getArticleByTopic`, `getArticle`, `updateArticle` (writes a
  new version row), `listArticleVersions`.
- Research: `listResearch`, `createResearch`, `deleteResearch`.
- Scoring: `runArticleScorers` (writes one SEO row + one GEO row,
  refreshes denormalized scores), `getLatestScores`.
- Chat: `listAgentMessages`, `sendAgentPrompt`, `applyAgentSuggestion`.
- Publish: `queueWordPressDraft`, `listPublishJobs`,
  `getWordPressEnvStatus`.

### Scoring (`lib/content/scoring.ts`)

Pure local scorers — no external API calls. Both return a 0-100 score
plus an itemized `ContentCheck[]`.

**SEO checks** (selected):

- Title 50–70 chars and includes target keyword + location reference
- Meta description 150–160 chars
- Word count 800–1500
- 3+ descriptive subheadings, ≥1 with a keyword
- ≥1 internal link (`havenvacationrentals.com` or `/path`)
- ≥2 sourced data points
- No em dashes, no exclamation points
- No buzzwords / no filler phrases
- Target keyword density ≥2 mentions, ≤2.5%
- Soft CTA present
- Sign-off `-- Jack Zoppa, CEO, Haven Vacation Rentals` (blocker)

**GEO / AI-ranking checks**:

- 3+ relevant local entities (Smoky Mountains, Gatlinburg, Pigeon
  Forge, Sevierville, Haven Vacation Rentals)
- At least one question phrasing (matches what owners actually ask)
- 5+ concrete numeric data points
- ≥2 tracked sources
- First-person operator voice + Haven brand mention (blocker)
- Lede paragraph 35-80 words (TL;DR shape)
- At least one bullet/numbered list (extractable answer snippet)
- ≥2 H2s (Article-schema readiness)
- Cites at least one third-party publisher
- Target keyword in lede

### Agent (`lib/content/agent-prompt.ts`)

The Content Studio agent is intended to run as its own Claude Managed
Agent. The system prompt + brand voice rules live in this module so the
managed-agent definition is the single source of truth.

Tools the agent exposes (declared in the system prompt — implementations
live in `lib/content/actions.ts` and `lib/content/topic-intent.ts`):

- `create_topic_from_conversation(message)` — parse a free-form Jack
  line into a structured topic and persist it. Picks pillar, builds a
  50-70 char title, derives keywords, angle, hypothesis, brief, and key
  points. No form required.
- `generate_topic_ideas(count?)` — return seasonally-aware Smoky
  Mountain homeowner blog ideas anchored to the current month. The
  current implementation is deterministic / local; structured for clean
  upgrade to a live web-search backed generator.
- `add_suggested_topic_to_backlog(idea)` — one-click promote a
  suggestion to a real topic + seeded article.

Until `CLAUDE_CONTENT_AGENT_ID` is set, a local rule-based fallback
runs. The article-pane fallback recognizes:

- "score this" / "how does this look" → returns SEO + GEO summary
- "set the title to ..." → suggestion `set_title`
- "set the meta to ..." → suggestion `set_meta`
- "add a section about ..." → suggestion `append_section`
- "add the Jack sign-off" → suggestion `replace_body`
- "remove em dashes" → suggestion `replace_body`
- otherwise → "tell me what you want changed"

The studio-pane fallback (`runStudioChat` in `lib/content/actions.ts`)
recognizes:

- "write about ...", "I want a post on ...", "add a topic about ..."
  → `create_topic_from_conversation`
- "research ideas", "brainstorm topics", "give me 6 ideas"
  → `generate_topic_ideas`
- otherwise → instructional reply with example prompts

Suggestions are recorded with the agent message and the user clicks
**Apply** to write them onto the article (creating a new version row).

To wire the real managed agent: set `CLAUDE_CONTENT_AGENT_ID` (and
optionally `CLAUDE_CONTENT_ENVIRONMENT_ID`) and add a dispatcher in
`lib/content/agent.ts` that calls the Anthropic SDK and falls back to
`runLocalAgent`. The system prompt in `CONTENT_AGENT_SYSTEM_PROMPT` is
the canonical text.

### WordPress integration (`lib/content/wordpress.ts`)

Draft-only wrapper around the WordPress REST API. Contract:

- Reads `HAVEN_WP_URL`, `HAVEN_WP_USER`, `HAVEN_WP_APP_PASSWORD`.
- Always sets `status: "draft"` — never publishes.
- Returns a structured result; never throws.
- If credentials are missing, the `queueWordPressDraft` action records
  the publish job with status `credentials_missing` and the article
  stays put. **Drafts are never lost.**
- If WordPress responds non-2xx or is unreachable, status is `blocked`
  with the error message captured.
- Includes a tiny markdown→HTML converter (no dependency) so the body
  posts cleanly.

Tests and builds never call this module. Only `queueWordPressDraft` —
explicitly invoked by an admin from the Publish tab — fires it.

---

## UI

`/content` (`app/(app)/content/page.tsx`):

- Header: space name, brand voice summary, status pills for WP +
  managed agent.
- **Topic agent** chat box at the top — tell it what to write about
  in plain English ("write about gap nights in Pigeon Forge", "I want
  a post on owner tax prep") and it adds the topic to the backlog with
  a brief and key points already filled in. Quick action chips next to
  the box: **Add topic**, **Research ideas**, **Build outline**, **SEO
  pass**.
- `TopicTracker` — three views:
  - **Pipeline** (default): kanban by stage, color-coded stage chips.
  - **List**: sortable rows with priority/stage/scores.
  - **Calendar**: month grid pinned to publish target (or due date).
- **Advanced form** (the original new-topic dialog) is still available
  for full-control entry — pillar, priority, keyword, angle,
  hypothesis, due date, publish target.

`/content/[topicId]` (`app/(app)/content/[topicId]/page.tsx`):

`ArticleWorkspace` is a 380px chat pane on the left + tabbed right pane:

- **Draft** — markdown editor, live word count, save button.
- **Brief** / **Outline** — separate plain-text editors persisted to
  `content_articles.brief_md` / `outline_md`.
- **SEO & GEO** — two scorecards with run button. Failed checks show
  inline severity (blocker / warning / info).
- **Sources** — add a finding + data point + URL + publisher; see all
  tracked sources.
- **Publish** — "Queue WordPress draft" button + job history. Shows
  status (`credentials_missing`, `blocked`, `completed`) and a deep
  link to the WP draft when available.

Stage selector in the workspace header advances the topic through the
lifecycle: Idea → In Progress → Draft → Complete.

---

## Workflow

```
Idea  →  In Progress  →  Draft  →  Complete
```

- **Idea** — backlog. Default for new topics.
- **In Progress** — actively being researched, briefed, outlined, or
  optimized. Running an SEO pass on an Idea-stage topic auto-advances
  it here.
- **Draft** — a full article body is on the post canvas. Pasted-draft
  imports land here.
- **Complete** — shipped. The WordPress publish action auto-advances
  to Complete on success.

Each stage advances by either:

1. Jack picking the new stage from the workspace header dropdown,
2. Dragging the card across the pipeline columns, or
3. An action firing (SEO optimize → In Progress; WordPress draft
   created → Complete).

Topics can also be deleted from the pipeline directly via the trash
icon on each card (with a confirm dialog), or archived via
`archiveTopic` for reversible removal.

---

## Brand requirements (enforced by the SEO scorer)

- First-person Jack Zoppa voice
- Audience: vacation rental property **owners**, not guests
- Smoky Mountains regional focus
- 800–1500 words
- Title 50–70 chars with location keyword
- Meta 150–160 chars
- ≥2 sourced data points
- No em dashes, no exclamation points, no buzzwords/filler
- Soft CTA, no hard pitch
- Sign-off exactly `-- Jack Zoppa, CEO, Haven Vacation Rentals`

---

## Environment variables

| Var | Purpose | Required for build? |
|---|---|---|
| `CLAUDE_CONTENT_AGENT_ID` | Optional Claude Managed Agent ID. Falls back to local rule-based agent if unset. Recommended: `agent_011CaT8cFgxnMar5p8jGrr4q`. | No |
| `CLAUDE_CONTENT_ENVIRONMENT_ID` | Companion environment ID for the managed agent. | No |
| `HAVEN_WP_URL` | `https://havenvacationrentals.com`. | No |
| `HAVEN_WP_USER` | WordPress user with draft-create permission. | No |
| `HAVEN_WP_APP_PASSWORD` | Application password. | No |

Build/typecheck don't touch any of these — the workspace runs on local
fallbacks.

### Managed agent provisioning

The Content Studio managed agent has been created in the Claude Console:

- **Agent ID:** `agent_011CaT8cFgxnMar5p8jGrr4q`
- **Console:** [config tab](https://platform.claude.com/workspaces/default/agents/agent_011CaT8cFgxnMar5p8jGrr4q?tab=config)

Set `CLAUDE_CONTENT_AGENT_ID` to this value in Vercel (Production +
Preview) once the dispatcher in `lib/content/agent.ts` is wired to call
the Anthropic SDK. Until then the local rule-based fallback runs.

> **Heads up — auto-added connectors.** During agent creation, the
> Claude Console automatically attached **WordPress.com** and **Slack**
> entries to this agent's connector list. Neither is required for the
> Content Studio flow (publishing goes through the Haven WordPress REST
> API using `HAVEN_WP_*` credentials, not the WordPress.com connector).
> Jack may want to review and remove these in the Console if they
> aren't intentional.

---

## ClickUp

ClickUp is no longer part of the workflow. It can optionally be used
for one-off legacy import/migration of historical topics, but the
studio does not sync to or read from ClickUp during normal operation.
There is no ClickUp client, webhook, or background job in this module.

---

## Future hooks

- `content_publish_jobs.result` is `jsonb` — easy to attach Search
  Console / GSC import data, AI visibility scrapes, and ranking
  snapshots without a schema change.
- Monitoring (Search Console, AI prompt tracking, rank tracking) can
  attach to a topic via additional tables (`content_monitoring_*`)
  without disturbing the editorial loop.
- Slack/email notifications can mirror the sales pattern when wanted —
  no in-progress hooks shipped in v1.
