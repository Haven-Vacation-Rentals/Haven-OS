# Haven OS

The internal operating system for [Haven Vacation Rentals](https://havenvacationrentals.com) — one app for property operations, GTM, content, HR, and admin tooling.

- **Production:** <https://www.havenvros.com> (canonical)
- **Legacy Vercel domain:** <https://haven-os-five.vercel.app> (redirects/back-compat only)
- **Active feature branch:** `claude/haven-os-ui-design-7hPCX` — most recent product work lives here, not on `main`. Cut PRs from this branch.

---

## Stack

- **Next.js 15** App Router, **React 19**, **TypeScript** (strict)
- **Tailwind v3.4** with Haven design tokens (Coral `#FF564E`, Charcoal `#424242`, Sage Mist `#EDF0EE`)
- **Supabase** — Postgres, Auth (Google OAuth), Row-Level Security
- **Vercel** for hosting + preview deployments
- **Anthropic Claude** — Managed Agents for the HavenOS assistant and Content Studio

---

## Modules

Sidebar layout, in order:

### Overview
- **The Board** — top-level operational dashboard.
- **My Tasks** — per-user task inbox.

### Operations
- **Project Management** (`/work`) — projects, tasks, assignments.
- **Properties** (`/properties`) — property roster and metadata.
- **Onboarding** (`/onboarding`) — new-property onboarding workflow.
- **Lost Items** (`/operations/lost-items`) — guest lost-and-found case tracker (see below).

### GTM
- **Sales Pitches** (`/sales`) — owner-facing pitch pages with draft/published flow.
- **Lead Magnets** (`/gtm/lead-magnets`) — branded landing pages at `/lead-magnet/<slug>` for guides, checklists, calculators. Flexible content sections (rich text / bullets / FAQ / stats / CTA), configurable capture forms, expiring public slugs, submission tracking.
- **Content Studio** (`/content`) — Haven Homeowner Blog pipeline (see below).

### Admin
- **Northstar Scorecard** (`/scorecard`) — company KPIs.
- **Agents** (`/agents`) — Claude Managed Agent registry + tool wiring.
- **HR** (`/hr`) — people directory + surveys (see below).
- **Settings** (`/settings`).

---

## Content Studio

App-native SEO + GEO blog workspace at `/content`. Replaced the previous ClickUp-based workflow — Content Studio is now the source of truth for the Haven Homeowner Blog.

- **Pipeline stages:** Idea → In Progress → Draft → Complete.
- **Workflow:** left-side chat with the content agent, right-side article editor.
- **Features:**
  - Paste-draft import from existing copy.
  - SEO/GEO optimization passes.
  - Real inline hyperlink insertion (anchor text → URL written into the canvas).
  - Post / Source view toggle.
  - WordPress draft push when `HAVEN_WP_*` env vars are configured (drafts only — never publishes directly).
  - One-click topic delete.
- **Managed agent ID:** `agent_011CaT8cFgxnMar5p8jGrr4q` — set as `CLAUDE_CONTENT_AGENT_ID`. Without it, the studio falls back to a local rule-based agent.
- See [`docs/CONTENT_STUDIO.md`](docs/CONTENT_STUDIO.md) for full agent + connector details.

---

## HR

People directory + survey tooling at `/hr`. Gated by **HR access grants** — admins do **not** automatically receive HR access; it must be granted explicitly.

### People directory
Departments:
- Maintenance and Field Ops
- Guest Experience
- Owner Relations
- General Operations

### HR Surveys
- Internal survey builder with live editing.
- Public submission form at `/survey/[slug]` — no login required.
- Responses stream back into the HR survey detail view.
- Anonymous submissions are scoped via Supabase RLS (see migration `0027_hr_survey_anon_answer_rls_fix.sql`).

---

## Lost Items

Guest lost-and-found tracker at `/operations/lost-items`. Kanban built on `@dnd-kit`.

- **Statuses (exact):** Pending Pickup, Picked Up, Delivered, Failed, Completed.
- **Linked context:** Slack thread URL + Conversation URL fields per case.
- **First-class comments** on each case.
- **External API:** `/api/lost-items` endpoints, protected by `HAVEN_LOST_ITEMS_API_KEY` (header `x-haven-api-key: <key>`). Used by cleaning vendors and third-party trackers to create/update cases.
- See [`docs/LOST_ITEMS_API.md`](docs/LOST_ITEMS_API.md).

---

## Sales Pitches

Owner-facing pitch pages under `/sales`. Drafts edit privately; publishing exposes a public pitch URL.

---

## Public API & Personal Access Tokens

Haven OS exposes a user-scoped REST surface under `/api/v1` for external agents and scripts. Authentication is via **Personal Access Tokens** (`hvn_pat_…`) created from **Settings → Personal Access Tokens**.

- Tokens authenticate as the user who created them — they cannot do anything that user can't do.
- Scopes (`platform:full`, `tasks:read`, `lost-items:write`, etc.) let owners restrict a token below their own permissions.
- Hashed at rest (sha256). Raw token shown once at creation; revoke any time.
- Endpoints span: profile, my tasks, work tasks/lists/spaces, lost items, properties, content studio, HR (read-only, with grant).
- The legacy `/api/lost-items` shared-key endpoint still works; PATs are the preferred path for new integrations.

See [`docs/PERSONAL_ACCESS_TOKENS.md`](docs/PERSONAL_ACCESS_TOKENS.md) for the full endpoint catalog and security model.

---

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the vars below
npm run dev
```

Open <http://localhost:3000>.

Useful scripts:

```bash
npm run dev         # next dev
npm run build       # next build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

---

## Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (browser-safe) key. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Privileged Supabase key — never expose to the browser. |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL. **Production:** `https://www.havenvros.com`. Leave blank on Preview so each deploy resolves itself via `VERCEL_URL`. |
| `ANTHROPIC_API_KEY` | Anthropic API key for the HavenOS assistant + Content Studio agent calls. |
| `CLAUDE_CONTENT_AGENT_ID` | Content Studio managed agent ID. Recommended: `agent_011CaT8cFgxnMar5p8jGrr4q`. Falls back to a local rule-based agent if unset. |
| `CLAUDE_CONTENT_ENVIRONMENT_ID` | Optional companion environment for the Content Studio agent. |
| `HAVEN_LOST_ITEMS_API_KEY` | Shared secret for the external Lost Items API. Required for any non-Haven caller. |
| `HAVEN_WP_URL` | WordPress site for Content Studio drafts (defaults to `https://havenvacationrentals.com`). |
| `HAVEN_WP_USER` | WordPress user with draft permissions. |
| `HAVEN_WP_APP_PASSWORD` | WordPress application password. Drafts only. |

Other Claude Managed Agent IDs (HavenOS assistant, etc.) are tracked in Vercel env per environment.

---

## Supabase

### Migrations

SQL migrations live in [`supabase/migrations/`](supabase/migrations) and are **applied manually** against the Supabase project (paste into the SQL Editor or `supabase db push` from a local CLI). They are not run automatically by deploy.

Latest known migration: `0027_hr_survey_anon_answer_rls_fix.sql`. When adding a new migration, bump the prefix and apply it before merging the PR that depends on it.

### Auth setup

1. Supabase → **Authentication → Providers → Google** — paste the OAuth Client ID + secret from Google Cloud Console.
2. Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://www.havenvros.com`
   - **Redirect URLs:** must include the custom-domain callback `https://www.havenvros.com/auth/callback`, plus `http://localhost:3000/auth/callback` for dev. Optionally include the legacy Vercel domain callback during the cutover window.
3. In Google Cloud Console → OAuth consent screen, set **User type = Internal** so only `@havenvacationrentals.com` accounts can complete sign-in.

### Security model

- **Service-role key is server-only.** Used in route handlers/server components; never shipped to the browser.
- **HR data is gated by HR access grants.** Admins are not auto-granted HR access; check `app/(app)/hr` and the access-control migrations (`0023_work_access_controls.sql`).
- **Public survey submissions** rely on a scoped anon RLS policy — see `0027_hr_survey_anon_answer_rls_fix.sql`.
- **Lost Items external API** requires the `HAVEN_LOST_ITEMS_API_KEY` header on every request.

---

## Managed agent tools

When you change the agent tool registry, sync it to the Anthropic side after pulling Vercel env:

```bash
npx vercel pull --yes --environment=production
set -a && . .vercel/.env.production.local && set +a
npx tsx scripts/sync-agent-tools.ts
```

---

## Deploy

Standard flow:

1. **Local sanity:** `npm run typecheck` and (when feasible) `npm run build`.
2. **Commit + push** to the active feature branch.
3. **Vercel** auto-builds on push.

Remote Vercel builds occasionally flake. Proven fallback (deploys directly from your machine using prebuilt output):

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod --yes
```

### Verify after deploy

```bash
curl https://www.havenvros.com/api/health
```

Expect:

```json
{"ok":true,"app":"haven-os","env":"production","commit":"<sha>","supabase":"configured"}
```

If `supabase: "missing"`, the env vars didn't take — re-check Vercel project settings and redeploy.

Spot-check live custom-domain routes (`/dashboard`, `/content`, `/operations/lost-items`, `/hr`) before declaring a deploy good.

---

## Project layout

```
app/
  (app)/
    dashboard/         The Board
    my-tasks/
    work/              Project Management
    properties/
    onboarding/
    operations/
      lost-items/
    sales/             Sales Pitches
    gtm/lead-magnets/  Lead Magnet landing pages
    content/           Content Studio
    scorecard/         Northstar Scorecard
    agents/            Managed Agent registry
    hr/                People + Surveys
    settings/
  (auth)/login         Google OAuth entry
  api/                 route handlers (incl. /api/health, /api/lost-items, /api/agents/*)
  survey/[slug]/       public HR survey form
  pitch/[slug]/        public Sales Pitch page
  lead-magnet/[slug]/  public Lead Magnet landing page
components/
  brand/               logo, topographic motif
  shell/               sidebar, topbar, command palette, theme
  ui/                  Button, Card, Badge, Input, …
  content/, hr/, lost-items/, sales/, work/   module-specific components
docs/
  CONTENT_STUDIO.md
  LOST_ITEMS_API.md
lib/
  supabase/            ssr client/server/middleware
  utils.ts, fonts.ts
scripts/
  sync-agent-tools.ts  push tool registry to Claude Managed Agents
supabase/migrations/   hand-applied SQL migrations
middleware.ts          refreshes Supabase session on every request
```

---

## Design system

Tokens live in two places:

1. `app/globals.css` — semantic CSS variables (`--accent`, `--foreground`, …) that flip on `.dark`.
2. `tailwind.config.ts` — raw Haven palette (`haven-coral`, `haven-charcoal`, …) + semantic aliases.

Use the semantic names in components (`bg-accent`, `text-foreground`) so dark mode and future re-skins are a one-file change. The primary CTA `<Button variant="cta">` matches the havenvacationrentals.com button spec: pill radius, Raleway 14px/900, uppercase, 2px tracking, coral fill.

Typography: **Futura PT** (headings) via Adobe Typekit kit `sjo0mew`; **Raleway** (body/UI) via `next/font/google`.

The `<HavenLogo />` component is an inline SVG recreation of the Haven monoline badge.
