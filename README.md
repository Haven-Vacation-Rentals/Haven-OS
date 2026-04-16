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

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold + design system | ✅ |
| 1 | App shell, ⌘K, dashboard mock | ✅ |
| 1.5 | Supabase Auth (Google OAuth), profiles table, RLS, gated routes | ✅ |
| 2 | **Work** — data model, Spaces/Lists/Tasks, List + Board + Calendar, custom fields, saved views | ⏭️ next |
| 3 | Work power features — Timeline/Gantt, dependencies, recurring, Docs, time tracking | |
| 4 | **Haven Assistant** — Claude Agent SDK in ⌘J drawer, context-aware, tool-use on Haven data | |
| 5 | **Managed Agents** — YAML-defined long-horizon agents, audit log, spend caps, webhook ingest | |
| 6 | Properties module — lifecycle, revenue, checklists | |

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
