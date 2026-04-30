# Content Studio

Editorial pipeline tracker for the Haven Homeowner Blog. Every topic,
article, scorecard, and WordPress publish job lives in Supabase — the
studio is the single source of truth for the editorial workflow.

**Route:** `/content` (internal admin only).
**Initial space:** Haven Homeowner Blog (`content_spaces.slug = 'haven-homeowner-blog'`).

The studio is a **tracker first**: a Kanban over Idea → In Progress →
Draft → Complete, with strategy metadata (assignee, pillar, keyword,
priority, due date, publish target) surfaced on every surface — pipeline
cards, list view, and the article header. Status counts and Needs-owner
/ Overdue indicators sit on top of the board.

---

## Architecture

### Data model (migration `0019_content_studio.sql`)

| Table | Purpose |
|---|---|
| `content_spaces` | Top-level spaces. Seeded with the Homeowner Blog. |
| `content_topics` | Topic backlog / editorial calendar. Carries pillar, stage, priority, target keyword, owner (FK → `profiles.id`), due/publish dates. |
| `content_articles` | One current draft per topic — title, meta, body markdown, outline, brief, denormalized SEO/GEO scores. |
| `content_article_versions` | Append-only history of article snapshots (every save). |
| `content_research_sources` | Tracked sources / data points per topic. |
| `content_seo_checks` | SEO scorecard runs (score + checklist). |
| `content_geo_checks` | GEO / AI-ranking scorecard runs. |
| `content_agent_messages` | Legacy chat log per article. The Content agent UI has been removed; the table remains so historical rows are preserved and a future agent surface can be re-introduced without a schema change. |
| `content_publish_jobs` | WordPress draft job lifecycle. |

All tables are gated by `admin` / `super_admin` RLS, mirroring the sales
pitches module.

### Server actions (`lib/content/actions.ts`)

All client-callable mutations return `{ ok, data } | { ok, error }`.
`requireAdminOrAbove()` gates every mutation. Reads use the SSR
Supabase client; the service-role admin client is **not** required.

Key actions:

- Topics: `listTopics`, `getTopic`, `createTopic`, `updateTopic`,
  `setTopicStage`, `setTopicOwner`, `archiveTopic`.
- Assignees: `listContentAssignees` (pulled from `profiles`).
- Articles: `getArticleByTopic`, `getArticle`, `updateArticle` (writes a
  new version row), `listArticleVersions`.
- Research: `listResearch`, `createResearch`, `deleteResearch` (no UI;
  data preserved for the SEO/GEO scorers).
- Scoring: `runArticleScorers` (writes one SEO row + one GEO row,
  refreshes denormalized scores), `getLatestScores`,
  `optimizeArticleSeo` (full SEO pass, mutates the article in place).
- Publish: `queueWordPressDraft`, `listPublishJobs`,
  `getWordPressEnvStatus`.

The legacy chat actions (`sendAgentPrompt`, `applyAgentSuggestion`,
`listAgentMessages`, `runStudioChat`) remain in the module but are no
longer surfaced in the UI.

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

### Optimize-for-SEO action (`lib/content/agent-prompt.ts`)

`optimizeArticleSeo` runs an opinionated, deterministic SEO/GEO pass
over an article — title, meta, structure, voice, CTA, sign-off — and
re-runs the scorers. This is wired to the **Optimize for SEO** button in
the article header. It is a one-shot tool, not a chat surface; there is
no Content agent panel in the UI.

The `applyFullSeoOptimization` helper in `agent-prompt.ts` is the pure
function behind it, kept separate so it can be reused by a future
managed-agent dispatcher without changing the caller contract.

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

- Header: space name, short tracker description, WordPress configured/
  not-configured pill.
- **Status strip** above the board — Total + per-stage counts + Needs
  owner + Overdue tiles, computed from the currently filtered backlog.
- **Filters** — view toggle (Pipeline / List / Calendar), pillar,
  assignee (with an *Unassigned* shortcut).
- **Toolbar buttons** — Import draft (paste markdown / plain text → new
  topic + seeded article) and New topic (full-control form: pillar,
  priority, keyword, assignee, angle, hypothesis, due date, publish
  target).
- `TopicTracker` views:
  - **Pipeline** (default): drag-and-drop Kanban by stage with color-
    coded chips, assignee chips on every card, and an overdue marker
    when `publish_target` (or `due_date`) is in the past.
  - **List**: sortable rows with assignee, priority, stage, due/publish,
    and scores. Overdue rows highlight the date column.
  - **Calendar**: month grid pinned to publish target (or due date).

`/content/[topicId]` (`app/(app)/content/[topicId]/page.tsx`):

`ArticleWorkspace` is a single-column editor (no agent panel):

- **Header** — editable title + meta (with character-count guidance),
  Optimize for SEO button, Save button, and a strategy-metadata strip
  (Assignee, Stage, Due, Publish target) that updates inline.
- **Post** — rich semantic editor (`PostCanvas`).
- **SEO & GEO** — two scorecards with re-run button. Failed checks show
  inline severity (blocker / warning / info).
- **Publish** — "Queue WordPress draft" button + job history. Shows
  status (`credentials_missing`, `blocked`, `completed`) and a deep
  link to the WP draft when available.

Brief / Outline / Sources tabs from the previous version have been
removed from the UI. The underlying columns and tables (`brief_md`,
`outline_md`, `content_research_sources`) are preserved so the SEO/GEO
scorers continue to read them and a future surface can re-introduce
them without a migration.

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

### Managed agent (deferred)

A Claude Managed Agent (`agent_011CaT8cFgxnMar5p8jGrr4q`) was
provisioned during an earlier iteration but is **not** wired into the
current UI. The agent panel was removed; Content Studio is a tracker +
editor surface, with the Optimize-for-SEO action as the only AI-powered
button. The env vars `CLAUDE_CONTENT_AGENT_ID` and
`CLAUDE_CONTENT_ENVIRONMENT_ID` are still respected by the helper in
`lib/content/agent-prompt.ts` if a future surface decides to call it.

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
