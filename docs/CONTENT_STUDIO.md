# Paid Advertising

Project space for paid advertising at Haven Vacation Rentals. Every ad
idea, script, and creative brief lives in Supabase — the studio is the
single source of truth for the paid-ads workflow.

**Route:** `/content` (internal admin only; labeled **Paid Ads** in the
nav).
**Default space:** Paid Advertising (`content_spaces.slug =
'paid-advertising'`).

The studio is a **tracker first**: a Kanban over Idea → In Progress →
Draft → Complete, with strategy metadata (assignee, channel, priority,
draft-due date, launch date) surfaced on every surface — pipeline cards,
list view, and the ad header. Status counts and Needs-owner / Overdue
indicators sit on top of the board.

> **History.** This space began life as the "Haven Homeowner Blog"
> editorial pipeline (migrations `0019`, `0026`). Migration `0045`
> repurposed it into Paid Advertising: the blog "pillar" axis became the
> `ad_channel` enum, the article gained creative-brief columns, and the
> SEO/GEO scoring + WordPress publishing surfaces were removed. The
> scorecard/publish tables remain in the schema (unused) so historical
> rows are preserved.

---

## Architecture

### Data model (migrations `0019`, `0026`, `0045`)

| Table | Purpose |
|---|---|
| `content_spaces` | Top-level spaces. Default is **Paid Advertising**. |
| `content_topics` | The ad cards / backlog. Carries `channel` (ad_channel enum), stage, priority, owner (FK → `profiles.id`), draft-due (`due_date`), launch date (`publish_target`), and an optional creative `angle` / `hypothesis`. |
| `content_articles` | One record per card. Holds the **ad script** (`body_md`) plus the **creative brief**: `hook`, `primary_text`, `cta`, `ad_format`, `budget`. |
| `content_article_versions` | Append-only history of script snapshots (every save). |

All tables are gated by `admin` / `super_admin` RLS, mirroring the sales
module.

The `content_research_sources`, `content_seo_checks`,
`content_geo_checks`, `content_agent_messages`, and
`content_publish_jobs` tables remain from the blog era. They are no
longer written or read by the app; they are kept so old data survives.

### Channels (`ad_channel`)

The category axis is the ad channel: `meta`, `google`, `tiktok`,
`youtube`, `other`. Labels live in `CHANNEL_LABELS`
(`lib/content/types.ts`). Defaults to `meta`.

### Stages

```
Idea  →  In Progress  →  Draft  →  Complete
```

- **Idea** — backlog. Default for new ads.
- **In Progress** — actively being scripted / iterated on.
- **Draft** — a full script is on the canvas. Pasted-script imports land
  here.
- **Complete** — shipped / launched.

Each stage advances by picking the new stage from the workspace header,
or by dragging the card across the pipeline columns. Cards can be deleted
from the pipeline (trash icon + confirm) or archived via `archiveTopic`
for reversible removal. `archived` is hidden from the board.

### Server actions (`lib/content/actions.ts`)

All client-callable mutations return `{ ok, data } | { ok, error }`.
`requireAdminOrAbove()` gates every mutation. Reads use the SSR Supabase
client.

Key actions:

- Cards: `listTopics`, `getTopic`, `createTopic`, `updateTopic`,
  `setTopicStage`, `setTopicOwner`, `archiveTopic`, `deleteTopic`.
- Assignees: `listContentAssignees` (pulled from `profiles`).
- Scripts: `getArticleByTopic`, `getArticle`, `updateArticle` (writes a
  new version row), `listArticleVersions`.
- Import: `createTopicFromPastedDraft` — paste an existing script (md or
  plain text); derives a card title and seeds the script body.

There is no SEO/GEO scoring, agent chat, research log, idea generator, or
WordPress publishing. Those were blog-era features and have been removed.

---

## UI

`/content` (`app/(app)/content/page.tsx`):

- Header: space name + short description.
- **Status strip** — Total + per-stage counts + Needs owner + Overdue
  tiles, computed from the currently filtered backlog.
- **Filters** — view toggle (Pipeline / List / Calendar), channel,
  assignee (with an *Unassigned* shortcut).
- **Toolbar buttons** — Import script (paste markdown / plain text → new
  card) and New ad (channel, format, budget, hook, angle, priority,
  assignee, dates).
- `TopicTracker` views:
  - **Pipeline** (default): drag-and-drop Kanban by stage, channel chip
    and format on every card, an overdue marker when the launch date (or
    draft-due date) is in the past, and the budget on the card footer.
  - **List**: sortable rows with channel, stage, assignee, priority,
    draft-due, launch, and budget.
  - **Calendar**: month grid pinned to the launch date (or draft-due
    date).

`/content/[topicId]` (`app/(app)/content/[topicId]/page.tsx`):

`ArticleWorkspace` is a single-column editor:

- **Header** — editable ad name, Save button, and a strategy-metadata
  strip (Channel, Stage, Assignee, Draft due, Launch date) that updates
  inline.
- **Script** — block editor (`PostCanvas`): headings, paragraphs, lists,
  callouts. Round-trips to markdown in `body_md`.
- **Creative brief** — Hook, Primary text / caption, CTA, Format, Budget.

---

## MCP & token API

The MCP tools (`lib/mcp/tools.ts`) and the token REST API
(`app/api/v1/content/*`) expose the same space:

- `list_content_spaces` — list Paid Advertising spaces.
- `list_content_ideas` — list ad cards (filter by `space_id`, `stage`).
- `create_content_idea` — add an ad card (channel, priority, format,
  budget, angle, due date). Seeds an empty script so the card opens.
- `update_content_status` — move an ad's stage; also channel, priority,
  title, angle, due date.

Tool **names** are unchanged from the blog era to avoid breaking existing
tokens; only their behavior and descriptions reflect paid ads.
