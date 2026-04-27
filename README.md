# Haven OS

The operating system for [Haven Vacation Rentals](https://havenvacationrentals.com) — internal-only, one home for every module we build over time. Module 1 is **Work**, a native replacement for ClickUp.

---

## What's in this first draft (Phase 0 + Phase 1)

- Next.js 15 App Router + TypeScript (strict) + Tailwind v3.4
- Haven design tokens wired to Tailwind: Coral `#FF564E`, Charcoal `#424242`, Sage Mist `#EDF0EE`, White
- Typography: **Futura PT** (headings) via Adobe Typekit kit `sjo0mew`, **Raleway** (body/UI) via `next/font/google`
- App shell with sidebar, topbar, ⌘K command palette, dark mode toggle
- Dashboard mock (KPI cards, profit distribution, stages, activity) modeled on the Tendwell reference but re-skinned to Haven
- Haven monoline badge recreated as inline SVG (`components/brand/haven-logo.tsx`)
- Supabase SSR client stubs (`lib/supabase/*`), middleware session refresh
- Login page with Google OAuth stub (enables once `.env.local` is populated)
- "Coming soon" pages for every other module so the sidebar is clickable end-to-end

Nothing in this draft hits a database yet — everything is mock data so you can evaluate the aesthetic before we pour concrete on the Work module.

---

## Run it locally

```bash
pnpm install     # or npm install / yarn
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000> — login page first, `/dashboard` after sign-in.

Without a Supabase project the app still boots; the login page just shows a setup banner.

### Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key |
| `ANTHROPIC_API_KEY` | For Haven Assistant (Phase 4) |
| `NEXT_PUBLIC_APP_URL` | Absolute app URL (e.g. `https://os.havenvacationrentals.com`) |
| `CLAUDE_CONTENT_AGENT_ID` | Optional Content Studio managed agent. Falls back to a local rule-based agent. Recommended value: `agent_011CaT8cFgxnMar5p8jGrr4q` (created in the Claude Console). See [`docs/CONTENT_STUDIO.md`](docs/CONTENT_STUDIO.md) for the auto-added WordPress.com / Slack connector caveat. |
| `CLAUDE_CONTENT_ENVIRONMENT_ID` | Optional companion environment for the Content Studio agent. |
| `HAVEN_WP_URL` | WordPress site for the Content Studio draft queue (defaults to `https://havenvacationrentals.com`). |
| `HAVEN_WP_USER` | WordPress user with draft permissions. |
| `HAVEN_WP_APP_PASSWORD` | WordPress application password. Drafts only — never publishes directly. |
| `HAVEN_LOST_ITEMS_API_KEY` | Shared secret for the external **Lost Items** API (`/api/lost-items`). Required when external partners (cleaning vendors, third-party trackers) need to create or update cases. Header: `x-haven-api-key: <key>`. See [`docs/LOST_ITEMS_API.md`](docs/LOST_ITEMS_API.md). |

---

## Supabase setup

One-time, takes ~10 minutes.

### 1. Create the project
1. Go to <https://supabase.com> → **New project** (pick the closest region).
2. Copy **Project URL** and **anon public key** into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # Settings → API → service_role
   ```

### 2. Run the initial migration
Open **SQL Editor** in Supabase and paste the contents of
[`supabase/migrations/0001_init_profiles.sql`](supabase/migrations/0001_init_profiles.sql) — creates the `profiles` table, RLS policies, and the auto-provision trigger.

### 3. Enable Google OAuth
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application).
   - **Authorized JavaScript origins:** `http://localhost:3000`, your Vercel URL.
   - **Authorized redirect URIs:** `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
2. In Supabase: **Authentication → Providers → Google** → paste the Client ID + secret → Save.
3. In Supabase: **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (dev) or your production URL.
   - **Redirect URLs:** add both `http://localhost:3000/auth/callback` and `https://YOUR-APP/auth/callback`.

### 4. (Optional) Restrict to Haven Google Workspace
In Google Cloud Console → **OAuth consent screen** → set **User type = Internal** so only `@havenvacationrentals.com` accounts can complete the flow. That + the redirect URL allowlist is enough to keep the tool internal without any per-user invite flow.

### 5. Restart dev server
`pnpm dev` — login page should now let you click **Continue with Google**.

---

## Deploy to Vercel

~5 minutes end-to-end once Supabase is set up.

### 1. Import the repo
1. <https://vercel.com/new> → **Import Git Repository** → select `haven-vacation-rentals/haven-os`.
2. Framework Preset → **Next.js** (auto-detected).
3. Root Directory → leave as `.` Build + Output settings → leave as defaults.
4. **Don't click Deploy yet** — add env vars first (next step).

### 2. Environment variables
Open **Settings → Environment Variables** and add each of these. For each one, tick the environments it applies to.

| Variable | Production | Preview | Development | Notes |
|---|:-:|:-:|:-:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | Same screen |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Server-only. Same screen. |
| `NEXT_PUBLIC_APP_URL` | ✅ | — | — | Set to your custom domain (e.g. `https://os.havenvacationrentals.com`). Leave blank on Preview so each preview redirects to itself via `VERCEL_URL`. |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | — | Only required once the Haven Assistant lands. |

Then hit **Deploy**. First build takes about 60 seconds.

### 3. Tell Supabase about your Vercel URLs
Still in the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL** → your production URL (e.g. `https://os.havenvacationrentals.com`).
- **Redirect URLs** → add *all* of these:
  ```
  http://localhost:3000/auth/callback
  https://os.havenvacationrentals.com/auth/callback   # or your vercel.app URL
  https://haven-os-*-haven.vercel.app/auth/callback   # optional: wildcard for previews
  ```
  > The wildcard is only needed if you want Google sign-in to work on preview deployments. For an internal tool, many teams skip it and only auth-test on prod.

### 4. (Optional but recommended) Custom domain
1. Vercel → **Settings → Domains** → add `os.havenvacationrentals.com`.
2. Add the CNAME record Vercel shows you to the Haven DNS.
3. Update `NEXT_PUBLIC_APP_URL` (Production only) to the custom domain.
4. In Supabase → URL Configuration, update **Site URL** and the Redirect URL list to use the custom domain.
5. In Google Cloud → OAuth Client → **Authorized JavaScript origins**, add the custom domain.

### 5. Restrict access (internal-only tool)
Two layers of defense in depth:

- **Google Workspace**: Google Cloud Console → **OAuth consent screen** → User type = **Internal**. Only `@havenvacationrentals.com` accounts can complete sign-in.
- **Vercel Password Protection**: Vercel → **Settings → Deployment Protection** → enable *Vercel Authentication* on Preview environments so random preview URLs aren't crawlable. Production sits behind the Google Workspace check above, which is enough.

### 6. Verify
After the first deploy:

```bash
curl https://os.havenvacationrentals.com/api/health
```

Should return JSON like:
```json
{"ok":true,"app":"haven-os","env":"production","commit":"5c5835f","supabase":"configured"}
```

If `supabase: "missing"` the env vars didn't take — go re-check step 2 and redeploy.

---

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold + design system | ✅ |
| 1 | App shell, ⌘K, dashboard mock | ✅ |
| 1.5 | Supabase Auth (Google OAuth), profiles table, RLS, gated routes | ✅ |
| 1.6 | Vercel-ready: health probe, robots, VERCEL_URL-aware OAuth | ✅ |
| 2 | **Work** — data model, Spaces/Lists/Tasks, List + Board + Calendar, custom fields, saved views | ⏭️ next |
| 3 | Work power features — Timeline/Gantt, dependencies, recurring, Docs, time tracking | |
| 4 | **Haven Assistant** — Claude Agent SDK in ⌘J drawer, context-aware, tool-use on Haven data | |
| 5 | **Managed Agents** — YAML-defined long-horizon agents, audit log, spend caps, webhook ingest | |
| 6 | Properties module — lifecycle, revenue, checklists | |
| 7 | **Content Studio** — app-native SEO + GEO blog workspace, agent-driven editing, WordPress draft queue. See [`docs/CONTENT_STUDIO.md`](docs/CONTENT_STUDIO.md). | ✅ v1 |

---

## Design system

All tokens live in two places:

1. `app/globals.css` — semantic CSS variables (`--accent`, `--foreground`, etc.) that flip on `.dark`.
2. `tailwind.config.ts` — raw Haven palette (`haven-coral`, `haven-charcoal`, …) + semantic aliases.

**Use the semantic names in components** (`bg-accent`, `text-foreground`) so dark mode and future re-skins are a one-file change.

The primary-CTA variant of `<Button>` (`variant="cta"`) matches the havenvacationrentals.com button spec 1:1: pill radius, Raleway 14px/900, uppercase, 2px tracking, coral fill.

### Logo

The inline `<HavenLogo />` is a recreation. Drop the official PNG (`Haven-Logo-Black-Transparent-2.png`) into `public/brand/` and we'll swap the sidebar/login hero to the authoritative asset.

---

## Haven Assistant — architecture preview

Two tiers, both planned around Anthropic's current offerings:

- **Tier A (sync, conversational)** — built on the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) (TypeScript). Lives in the ⌘J drawer. Tools exposed to it are Haven-native (`tasks.create`, `people.lookup`, etc.), not shell. Streams responses with visible tool-use.
- **Tier B (async, long-horizon)** — [Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/overview). YAML-defined in `/agents/*.yaml`, invoked from the backend, results streamed back via `/api/agents/webhook`. For jobs like "audit every active property's onboarding."

Every tool call is scoped by the caller's RBAC and written to an audit log. Destructive tools run in dry-run by default and require a human approve in a diff view.

---

## Project layout

```
app/
  (app)/            authenticated shell + module pages
  (auth)/login      Google OAuth entry
  layout.tsx        root — fonts, providers
  globals.css       design tokens
components/
  brand/            logo, topographic motif
  shell/            sidebar, topbar, command palette, theme
  ui/               Button, Card, Badge, Input
  dashboard/        KPI + stage + activity widgets
  soon.tsx          module placeholder page
lib/
  supabase/         ssr client/server/middleware
  utils.ts          cn + formatters
  fonts.ts          next/font setup
middleware.ts       refreshes Supabase session on every request
```
