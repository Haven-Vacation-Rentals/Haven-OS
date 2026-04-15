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

Open <http://localhost:3000> — you'll land on `/dashboard`.

### Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key |
| `ANTHROPIC_API_KEY` | For Haven Assistant (Phase 4) |
| `NEXT_PUBLIC_APP_URL` | Absolute app URL |

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold + design system | ✅ this PR |
| 1 | App shell, ⌘K, dashboard mock | ✅ this PR |
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
