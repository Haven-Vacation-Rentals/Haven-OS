# Haven OS — Design System

> The operating system for **Haven Vacation Rentals**. This document is a complete audit of the UI design system as implemented in the codebase. All values are extracted verbatim from source; file names are cited throughout.
>
> **Stack:** Next.js 15.3.6 (App Router) · React 19 · TypeScript · Tailwind CSS 3.4 · Radix UI primitives · lucide-react icons · `next-themes` (class-based dark mode) · `framer-motion`, `sonner`, `cmdk`, `@dnd-kit`.
>
> **Brand source of truth:** A brand packet extracted from `havenvacationrentals.com` — Coral, Charcoal, Sage Mist, White, Dark Gray; Futura PT + Raleway typography. (`tailwind.config.ts` header comment.)

---

## 1. Color Palette

There are two layers of color in this system:

1. **Raw Haven brand palette** — fixed hex values, exposed as Tailwind `haven-*` utilities (`tailwind.config.ts`).
2. **Semantic tokens** — CSS custom properties defined as space-separated **R G B triples** (no commas) so they compose with Tailwind's `<color> / <alpha-value>` syntax. Defined in `app/globals.css` for both `:root` (light) and `.dark`.

### 1.1 Raw brand palette — `tailwind.config.ts` (`colors.haven`)

| Token | Hex | RGB | Role |
|---|---|---|---|
| `haven-coral` | `#FF564E` | `255 86 78` | **Primary accent** — CTAs, links, active states |
| `haven-coral-700` | `#E8463F` | `232 70 63` | Coral hover / pressed, coral text-on-light |
| `haven-coral-100` | `#FFE4E2` | `255 228 226` | Coral soft fill (badge backgrounds) |
| `haven-charcoal` | `#424242` | `66 66 66` | Ink / dark sections (primary foreground) |
| `haven-ink` | `#333333` | `51 51 51` | Secondary ink (dark gray) |
| `haven-sage` | `#EDF0EE` | `237 240 238` | Sage Mist — secondary surface / alt sections |
| `haven-sage-200` | `#DDE3E0` | `221 227 224` | Sage border / divider |
| `haven-cream` | `#FAF8F3` | `250 248 243` | Cream (logo ink on dark bg) |
| `haven-white` | `#FFFFFF` | `255 255 255` | White |

### 1.2 Semantic tokens — Light (`:root` in `app/globals.css`)

| CSS variable | R G B | Hex equivalent | Tailwind utility | Purpose |
|---|---|---|---|---|
| `--background` | `255 255 255` | `#FFFFFF` | `bg-background` | Page background (Haven white) |
| `--surface` | `255 255 255` | `#FFFFFF` | `bg-surface` | Card / panel surface |
| `--surface-alt` | `237 240 238` | `#EDF0EE` | `bg-surface-alt` | Alt surface (Sage Mist) — chips, headers, inputs |
| `--muted` | `241 243 242` | `#F1F3F2` | `bg-muted` | Muted hover fill |
| `--muted-foreground` | `115 120 118` | `#737876` | `text-muted-foreground` | Secondary / placeholder text |
| `--foreground` | `66 66 66` | `#424242` | `text-foreground` | Primary ink (Charcoal) |
| `--ink-alt` | `51 51 51` | `#333333` | — (var only) | Secondary ink |
| `--accent` | `255 86 78` | `#FF564E` | `bg-accent` / `text-accent` | Coral accent |
| `--accent-foreground` | `255 255 255` | `#FFFFFF` | `text-accent-foreground` | Text on coral |
| `--accent-soft` | `255 228 226` | `#FFE4E2` | `bg-accent-soft` | Soft coral fill (active nav, hover) |
| `--border` | `226 228 226` | `#E2E4E2` | `border-border` | Default border / divider |
| `--ring` | `255 86 78` | `#FF564E` | `ring` / `shadow-ring` | Focus ring |

### 1.3 Semantic tokens — Dark (`.dark` in `app/globals.css`)

| CSS variable | R G B | Hex equivalent | Notes |
|---|---|---|---|
| `--background` | `22 24 23` | `#161817` | Near-black warm charcoal |
| `--surface` | `28 31 30` | `#1C1F1E` | Raised surface |
| `--surface-alt` | `36 40 38` | `#242826` | Alt surface |
| `--muted` | `40 44 42` | `#282C2A` | Muted fill |
| `--muted-foreground` | `160 167 163` | `#A0A7A3` | Secondary text |
| `--foreground` | `237 240 238` | `#EDF0EE` | Sage Mist as soft white |
| `--ink-alt` | `200 205 202` | `#C8CDCA` | Secondary ink |
| `--accent` | `255 118 111` | `#FF766F` | Lightened coral for contrast on dark |
| `--accent-foreground` | `24 25 24` | `#181918` | Dark text on coral |
| `--accent-soft` | `80 36 34` | `#502422` | Deep coral fill |
| `--border` | `50 54 52` | `#323634` | Dark border |
| `--ring` | `255 118 111` | `#FF766F` | Focus ring |

### 1.4 Functional / status colors (Tailwind defaults)

Status semantics borrow Tailwind's standard palette rather than custom tokens.

- **Badge tones** (`components/ui/badge.tsx`): `success` → `emerald-50 / emerald-700`; `warn` → `amber-50 / amber-800`; `danger` → `rose-50 / rose-700`; `dark` → `foreground / background` (inverted).
- **Property status badges** (`components/properties/property-badges.tsx`): `live` → emerald; `onboarding` → amber; `paused` → sky; `offboarding` → rose; `offboarded` → muted. Each has a `dark:` variant (e.g. `dark:bg-emerald-900/40 dark:text-emerald-300`).
- **Property tier badges**: `top` → `accent-soft / accent` (coral); `key` → violet; `normal` → surface-alt; `junior` → sky; `low` → muted.
- **KPI deltas** (`components/dashboard/kpi-card.tsx`): up → `emerald-600`, down → `rose-600`, flat → `muted-foreground`.

> **Alpha composition convention:** Because tokens are R G B triples, opacity modifiers work everywhere — e.g. `bg-foreground/80`, `text-accent/50`, `bg-accent-soft/30`, `hover:bg-accent-soft/40`, `border-border/30`. The global selector `* { border-color: rgb(var(--border)); }` sets the default border color (`app/globals.css`).

---

## 2. Typography

### 2.1 Font families (`tailwind.config.ts` → `fontFamily`)

| Family | Stack | Used for |
|---|---|---|
| `font-heading` | `futura-pt`, `Futura`, `ui-sans-serif`, `system-ui`, `sans-serif` | All headings (`h1`–`h6`), display numerics, titles, wordmark |
| `font-sans` (default body) | `var(--font-raleway)`, `Helvetica`, `Arial`, `sans-serif` | Body & UI text |
| `font-mono` | `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace` | Keyboard hints (`.haven-kbd`), code |

**Futura PT** is loaded at runtime via **Adobe Fonts / Typekit** — `<link rel="stylesheet" href="https://use.typekit.net/sjo0mew.css" />` in `app/layout.tsx` `<head>`.

**Raleway** was originally loaded via `next/font/google`, but `lib/fonts.ts` now resolves `--font-raleway` to a **system sans-serif stack** (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`) to avoid a build-time network fetch. The exported `raleway` object preserves its shape (`raleway.variable`, applied to `<html>`) so callers are unchanged. The CSS variable is also defined inline in `:root` (`app/globals.css`).

### 2.2 Base body settings (`app/globals.css` → `body`)

- `font-family: var(--font-raleway)` → fallbacks
- `font-weight: 500`
- `font-size: 15px`
- `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility` (on `html`)
- `overflow-x: hidden` (scroll regions opt back in via `overflow-x-auto`)
- **iOS zoom guard:** `@media (max-width: 767px)` bumps `textarea, select, input` to `font-size: 16px`.

### 2.3 Heading defaults (`app/globals.css` → `h1…h6`)

- `font-family: "futura-pt", "Futura", ui-sans-serif, system-ui, sans-serif`
- `font-weight: 700`
- `color: rgb(var(--foreground))`
- `letter-spacing: -0.01em`

### 2.4 Display type scale (`tailwind.config.ts` → `fontSize`)

| Class | Size | Line height | Weight |
|---|---|---|---|
| `text-display-1` | `40px` | `1.1` | `700` |
| `text-display-2` | `34px` | `1.15` | `700` |
| `text-display-3` | `29px` | `1.2` | `700` |
| `text-display-4` | `24px` | `1.25` | `700` |

Page `<h1>` headers typically use `font-heading text-display-2 font-bold tracking-tight` (e.g. `app/(app)/dashboard/page.tsx`). KPI numerics use `font-heading text-[32px] font-bold leading-none tracking-tight` (`kpi-card.tsx`). Card titles use `font-heading text-base font-bold` (`card.tsx`).

### 2.5 Letter spacing & weights

- `tracking-cta` = **`2px`** (`tailwind.config.ts`) — used on uppercase CTA buttons.
- Common UI weights: body `500`, semibold labels `600`, bold headings `700`, **`font-black` (900)** on the `cta` button variant and `.haven-btn-cta`.
- Eyebrow labels use `tracking-[0.14em]`; uppercase micro-labels use `tracking-wider`.

### 2.6 Reusable type primitives (`@layer components` in `app/globals.css`)

- **`.haven-eyebrow`** — `text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground`. Section eyebrows, nav headings, KPI labels.

---

## 3. Spacing & Layout System

### 3.1 Container (`tailwind.config.ts` → `theme.container`)

```ts
container: { center: true, padding: "1.5rem", screens: { "2xl": "1440px" } }
```

Centered, `1.5rem` (24px) horizontal padding, max content width `1440px` at `2xl`.

### 3.2 Breakpoints

Default Tailwind breakpoints (no overrides): `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px` (container caps `2xl` content at `1440px`). The primary responsive seam is **`md` (768px)** — the sidebar collapses to a drawer, the search bar collapses to an icon, and touch target heights grow below `md`.

### 3.3 App shell layout (`app/(app)/layout.tsx`)

```
<div class="flex min-h-dvh">
  <Sidebar />                     // sticky, w-60 (240px), hidden below md
  <div class="flex min-w-0 flex-1 flex-col">
    <Topbar />                    // sticky, h-60px mobile / h-68px desktop
    <main class="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8"> {children} </main>
  </div>
  <CommandPalette /> <Toaster position="bottom-right" richColors />
</div>
```

- **Sidebar:** `w-60` (240px), `h-dvh`, `sticky top-0`, `bg-surface-alt/40 backdrop-blur-sm`, right border. Brand header is `h-[68px]`. Mobile: off-canvas drawer `w-[82vw] max-w-[300px]`, `translate-x` transition, dark `bg-black/40` backdrop.
- **Topbar:** `sticky top-0 z-30`, `h-[60px] md:h-[68px]`, `bg-background/80 backdrop-blur`, bottom border.
- **Main content padding:** `px-4 py-5` mobile → `md:px-8 md:py-8`.

### 3.4 Page-level width & spacing conventions

- Page wrappers commonly use `mx-auto` with `max-w-[1400px]` (dashboards/wide views), `max-w-[720px]` (forms/reading), and `max-w-2xl/3xl/md` for narrow content. Observed widths: `1600px`, `1400px`, `1200px`, `1100px`, `720px`.
- Vertical rhythm between sections: `gap-6`. Page header → body: `flex flex-col gap-1` for title+subtitle.
- **Grid usage** (frequency across `app`/`components`): `grid-cols-1` is the mobile default, scaling via `sm:grid-cols-2`, `md:grid-cols-2/3/4`, `lg:grid-cols-3`, `xl:grid-cols-4`. KPI rows typically `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Asymmetric two-column layouts use explicit fractions, e.g. `lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]` (`dashboard/page.tsx`).

### 3.5 Border radii (`tailwind.config.ts` → `borderRadius`)

| Class | Value | Use |
|---|---|---|
| `rounded-pill` | `30px` | CTA buttons, badges, chips |
| `rounded-card` | `14px` | Cards, tables |
| `rounded-xl` | `0.75rem` (Tailwind default) | Dialogs, dropdown menus |
| `rounded-lg` | `0.5rem` | Tabs list, tooltips, wordmark badge |
| `rounded-md` | `0.375rem` | Buttons (non-CTA), inputs, menu items |

### 3.6 Shadows (`tailwind.config.ts` → `boxShadow`)

| Class | Value |
|---|---|
| `shadow-card` | `0 1px 2px rgba(66,66,66,0.06), 0 1px 1px rgba(66,66,66,0.03)` |
| `shadow-card-hover` | `0 4px 14px rgba(66,66,66,0.08), 0 2px 4px rgba(66,66,66,0.04)` |
| `shadow-ring` | `0 0 0 3px rgba(255,86,78,0.25)` — the coral focus ring |

> Shadows are tuned to the charcoal ink (`rgba(66,66,66,…)`) rather than pure black — soft, warm elevation.

### 3.7 Motion (`tailwind.config.ts` → `keyframes` / `animation`)

- `animate-fade-in` — `fade-in 200ms ease-out` (opacity 0→1)
- `animate-slide-up` — `slide-up 240ms ease-out` (translateY 6px→0 + fade)
- Radix enter/exit handled by `tailwindcss-animate` (`data-[state=open]:animate-in`, `zoom-in-95`, `slide-in-from-*`).
- Most interactive transitions: `transition-all/colors duration-150`.

---

## 4. Component Patterns

All primitives live in `components/ui/` and use **class-variance-authority (cva)** for variants + the `cn()` helper (`clsx` + `tailwind-merge`, `lib/utils.ts`). Overlay components wrap **Radix UI**.

### 4.1 Buttons (`components/ui/button.tsx`)

`cva` base: `inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 focus-visible:shadow-ring disabled:opacity-50 disabled:pointer-events-none`.

**Variants:**

| Variant | Style |
|---|---|
| `cta` | `rounded-pill bg-accent text-accent-foreground text-[14px] font-black uppercase tracking-cta` + `hover:brightness-95 active:brightness-90`. **Exact match to havenvacationrentals.com CTAs.** |
| `primary` *(default)* | `rounded-md bg-accent text-accent-foreground font-semibold` |
| `secondary` | `rounded-md bg-surface-alt text-foreground font-semibold border border-border hover:bg-muted` |
| `outline` | `rounded-md border border-border bg-transparent hover:bg-surface-alt` |
| `ghost` | `rounded-md bg-transparent hover:bg-surface-alt` |
| `link` | `text-accent underline-offset-4 hover:underline` |

**Sizes:** `sm` `h-8 px-3 text-[13px]` · `md` *(default)* `h-9 px-4 text-sm` · `lg` `h-11 px-6 text-[15px]` · `icon` `h-9 w-9`.

There is also a CSS-class twin **`.haven-btn-cta`** in `globals.css` for `@apply` usage in JSX (pill, coral, uppercase, font-black, `tracking-cta`).

### 4.2 Cards (`components/ui/card.tsx` + `.haven-card` in `globals.css`)

- **`.haven-card`** = `rounded-card border border-border bg-surface shadow-card transition-shadow`.
- **`.haven-card-hover`** = `hover:shadow-card-hover` (applied when `interactive`, adds `cursor-pointer`).
- Subcomponents: `CardHeader` (`px-5 pt-5 pb-3`, `flex flex-col gap-1`), `CardTitle` (`font-heading text-base font-bold`), `CardDescription` (`text-sm text-muted-foreground`), `CardContent` (`px-5 pb-5`).
- **Accent KPI card** inverts: `bg-foreground text-background border-transparent` (`kpi-card.tsx`).

### 4.3 Badges & chips

- **`Badge`** (`components/ui/badge.tsx`): base `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold`. Tones: `neutral` (default, `surface-alt`/`foreground/80`), `coral` (`haven-coral-100`/`haven-coral-700`), `sage`, `success`, `warn`, `danger`, `dark`. Optional `dot` prop renders a `h-1.5 w-1.5 rounded-full bg-current` indicator.
- **`.haven-chip`** (`globals.css`): `inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-foreground/80`.
- **Status/Tier badges** (`property-badges.tsx`): smaller, louder — `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider` with semantic color maps (see §1.4).
- **`.haven-kbd`** (`globals.css`): keyboard hint pill — `rounded-md border border-border bg-surface-alt px-1.5 font-mono text-[10px] font-semibold text-foreground/70 min-w-[20px] h-[20px]`.

### 4.4 Tables (`components/properties/property-table.tsx`)

The reference table pattern (spreadsheet-style, inline-editable):

- Wrapper: `overflow-hidden rounded-card border border-border bg-surface shadow-card` → inner `overflow-x-auto`.
- `<table class="w-full text-[13px]">`.
- **`<thead>`**: `border-b border-border bg-surface-alt/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground`.
- **Sticky first column:** `sticky left-0 z-10/z-20` with `bg-surface` / `bg-surface-alt/95 backdrop-blur-sm`.
- **Rows:** `border-b border-border/30 transition-colors hover:bg-surface-alt/30`; last row drops its border.
- **Cells:** `px-2 py-1.5`, numeric columns `text-center tabular-nums`; editable cells `cursor-pointer rounded hover:bg-accent-soft/40`; inline-edit inputs `border border-accent/40 focus:shadow-ring`.
- Per-column min widths via inline `style={{ minWidth }}`.

### 4.5 Navigation — Sidebar (`components/shell/sidebar.tsx`)

- Sections grouped with `.haven-eyebrow` headings (Overview, Operations, GTM, Admin), visibility gated by permission flags.
- **Nav row:** `flex items-center gap-2.5 rounded-md px-3 py-2 md:py-1.5 text-[14px] md:text-[13.5px] font-medium text-foreground/80 hover:bg-surface hover:text-foreground`.
- **Active row:** `bg-accent-soft shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)] text-haven-coral-700 dark:text-haven-coral` — soft coral fill + 1px inset coral ring.
- Icons are lucide `h-[15px] w-[15px]`. Badges (e.g. `Beta`) use `<Badge tone="coral">`; "Soon" items render disabled.
- **Haven Assistant launcher** (sidebar footer): `bg-foreground text-background` button with a coral `Sparkles` icon and a `⌘J` `.haven-kbd` hint; `hover:-translate-y-px`.

### 4.6 Topbar (`components/shell/topbar.tsx`)

Mobile hamburger (dispatches `haven:open-sidebar` event) · a **search trigger button** (`h-9 w-[340px] rounded-md border bg-surface-alt`, opens command palette via synthetic `⌘K`) collapsing to an icon below `md` · right cluster: Help (ghost icon), `NotificationBell`, `ThemeToggle`, vertical divider (`h-6 w-px bg-border`), `UserMenu`.

### 4.7 Tabs (`components/ui/tabs.tsx`, Radix)

- `TabsList`: `inline-flex h-9 rounded-lg bg-surface-alt p-1 gap-0.5`.
- `TabsTrigger`: `rounded-md px-3 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground`; **active** → `data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm` (segmented-control look).

### 4.8 Modals / Dialogs (`components/ui/dialog.tsx`, Radix)

- **Overlay:** `fixed inset-0 z-50 bg-black/20 backdrop-blur-sm` + fade in/out.
- **Content:** centered (`left/top 50%` + translate), `w-[calc(100vw-1.5rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto`, `border border-border bg-surface p-4 md:p-6 shadow-xl rounded-xl`, with `zoom-95` + `slide-in-from-top-[48%]` enter animation.
- `DialogTitle` → `font-heading text-base font-bold tracking-tight`; `DialogDescription` → `text-[13px] text-muted-foreground`; `DialogFooter` → `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`. Close "X" lucide icon, top-right.

### 4.9 Dropdown menus & popovers (`dropdown-menu.tsx`, `popover.tsx`, Radix)

- Menu content: `min-w-[8rem] rounded-xl border border-border bg-surface p-1 shadow-lg` + zoom/slide animations.
- Items: `rounded-md px-2 py-1.5 text-[13px] focus:bg-surface-alt`; labels uppercase `text-[11px] font-semibold tracking-wide text-muted-foreground`; separators `h-px bg-border`.
- The properties table also implements a **portal dropdown** (`createPortal`) with viewport flip-up logic and selected-item style `font-bold text-accent bg-accent-soft/30`.

### 4.10 Form controls

- **`Input`** (`input.tsx`): `h-10 md:h-9 w-full rounded-md border border-border bg-surface px-3 text-base md:text-sm placeholder:text-muted-foreground focus:shadow-ring`. (Taller + 16px text on mobile to defeat iOS zoom.)
- **`Checkbox`** (`checkbox.tsx`, Radix): `h-4 w-4 rounded border border-border bg-surface`; checked → `bg-accent border-accent text-accent-foreground` with a lucide `Check`.
- **Tooltip** (`tooltip.tsx`): inverted — `rounded-lg border border-border bg-foreground text-background px-2.5 py-1 text-[12px] font-medium shadow-md`.

### 4.11 Toasts

`sonner` `<Toaster richColors position="bottom-right" />` (`app/(app)/layout.tsx`); used app-wide via `toast.success` / `toast.error`.

---

## 5. Icons & Imagery

### 5.1 Icons

- **Library:** `lucide-react` (`^0.468.0`), imported in **114** files across `app`/`components`.
- **Sizing:** `h-4 w-4` (16px) is the workhorse; `h-3/3.5 w-3/3.5` inside small controls; `h-[15px] w-[15px]` in the sidebar; `h-5 w-5` for mobile touch targets.
- **Representative set:** `LayoutDashboard, ListTodo, FolderKanban, Home, Settings, Sparkles, Target, ShieldAlert, ClipboardList, Bot, Megaphone, PenSquare, Magnet, PackageSearch, Search, Menu, HelpCircle, X, Check, ChevronRight, TrendingUp/Down` (`sidebar.tsx`, `topbar.tsx`, etc.).
- Icons inherit `currentColor`; the only routinely colored icon is the coral `Sparkles` on the assistant launcher.

### 5.2 Brand marks (`components/brand/haven-logo.tsx`, `public/brand/`)

- **`HavenLogo`** — real Haven Vacation Rentals logo (circle badge w/ A-frame cabin), self-hosted PNGs: `/brand/haven-logo.png` (dark/black ink, default) and `/brand/haven-logo-cream.png` (cream `#FAF8F3` ink for dark backgrounds). Rendered via `next/image`, `priority`.
- **`HavenWordmark`** — sidebar lockup: a `h-10 w-10 rounded-lg bg-foreground` badge holding the cream logo, beside "Haven **OS**" in `font-heading font-bold`, where **"OS" gets `text-accent`** (coral). Optional muted subtitle (the user's first name).
- **App favicon** (`app/icon.svg`): rounded-rect (`rx=14`) `#FF564E` coral tile with a white "H" glyph.

### 5.3 Decorative motifs

- **`TopographicBg`** (`components/brand/topographic-bg.tsx`): a pure-SVG topographic contour-line backdrop ("evoking the Smoky Mountains") using `currentColor`, low opacity, `linearGradient` fade — used behind empty states and the login hero.
- **`.haven-topo`** (`globals.css`): a dotted radial-gradient texture — `radial-gradient(circle at 1px 1px, rgba(66,66,66,0.06) 1px, transparent 0)` at `22px 22px` (light) / `rgba(237,240,238,0.05)` (dark). Used for empty states & the login screen.
- **Custom scrollbars** (`@media (pointer: fine)`): 10px, `border-radius: 10px`, thumb `rgb(var(--border))` with a 2px background-colored inset border; hover `rgb(var(--muted-foreground)/0.5)`.
- **Drag-and-drop:** `[data-dnd-dragging="true"] { cursor: grabbing }` and a `.drag-insert-line::before` 2px coral insertion indicator.

---

## 6. Overall Theme / Vibe

- **Mode:** Light-first with a fully realized dark theme. `darkMode: "class"` (`tailwind.config.ts`), driven by `next-themes` via `components/shell/theme-provider.tsx` + a `ThemeToggle`. `<html suppressHydrationWarning>` (`app/layout.tsx`).
- **Brand personality:** Warm, calm, outdoorsy hospitality — **Sage Mist** surfaces and **Charcoal** ink rather than cold grays; shadows tinted with charcoal, not black; topographic/mountain motifs nodding to the Smoky Mountains vacation-rental roots.
- **Accent discipline:** **Coral `#FF564E`** is the single brand accent, used sparingly — primary CTAs, links, active nav, the "OS" in the wordmark, focus rings, and the one "focus" KPI per row. Everything else stays neutral so coral always reads as *the* action.
- **Voice in type:** Geometric **Futura PT** headings (uppercase, tight tracking, `font-black` CTAs with `2px` letter-spacing — straight from the marketing site) over humanist **Raleway** body. Confident headlines, quiet UI text.
- **Surface system:** Three-tier depth — `background` (white) → `surface` (cards) → `surface-alt` (Sage Mist headers/chips/inputs) — with soft `shadow-card` elevation and generous `14px` card radii / `30px` pills. Feels friendly and rounded, not sharp/corporate.
- **Motion:** Subtle and fast (150–240ms), favoring fades and small slide/translate nudges; never flashy.

---

## 7. Tailwind Config (`tailwind.config.ts`)

Full file, verbatim:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        haven: {
          coral: "#FF564E",
          "coral-700": "#E8463F",
          "coral-100": "#FFE4E2",
          charcoal: "#424242",
          ink: "#333333",
          sage: "#EDF0EE",
          "sage-200": "#DDE3E0",
          cream: "#FAF8F3",
          white: "#FFFFFF",
        },
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["futura-pt", "Futura", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-raleway)", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "display-1": ["40px", { lineHeight: "1.1", fontWeight: "700" }],
        "display-2": ["34px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-3": ["29px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-4": ["24px", { lineHeight: "1.25", fontWeight: "700" }],
      },
      letterSpacing: { cta: "2px" },
      borderRadius: { pill: "30px", card: "14px" },
      boxShadow: {
        card: "0 1px 2px rgba(66,66,66,0.06), 0 1px 1px rgba(66,66,66,0.03)",
        "card-hover": "0 4px 14px rgba(66,66,66,0.08), 0 2px 4px rgba(66,66,66,0.04)",
        ring: "0 0 0 3px rgba(255,86,78,0.25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 240ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**PostCSS** (`postcss.config.mjs`): `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.

---

## 8. How to Replicate This Theme on a New Project

### 8.1 Install dependencies

```bash
npm install tailwindcss@^3.4 tailwindcss-animate autoprefixer postcss \
  class-variance-authority clsx tailwind-merge lucide-react next-themes \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-checkbox @radix-ui/react-popover \
  sonner
```

### 8.2 Font imports

**Futura PT** — Adobe Fonts (Typekit). Add to your document `<head>` (Next.js: `app/layout.tsx`):

```html
<link rel="stylesheet" href="https://use.typekit.net/sjo0mew.css" />
```
*(Use your own Typekit kit ID licensed for Futura PT; `sjo0mew` is Haven's.)*

**Body font (Raleway)** — choose one:

```ts
// Option A — Google Fonts via next/font (true Raleway)
import { Raleway } from "next/font/google";
export const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", weight: ["400","500","600","700"] });
// apply raleway.variable to <html>
```
```css
/* Option B — Haven's deterministic system stack (no network fetch) */
:root { --font-raleway: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
```

### 8.3 CSS variables + base layer (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-raleway: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;

    /* Surfaces */
    --background: 255 255 255;
    --surface:    255 255 255;
    --surface-alt: 237 240 238;   /* Sage Mist */
    --muted:      241 243 242;
    --muted-foreground: 115 120 118;

    /* Ink */
    --foreground: 66 66 66;        /* Charcoal */
    --ink-alt:    51 51 51;

    /* Accent (Haven Coral) */
    --accent:            255 86 78;
    --accent-foreground: 255 255 255;
    --accent-soft:       255 228 226;

    /* Structural */
    --border: 226 228 226;
    --ring:   255 86 78;
  }

  .dark {
    --background: 22 24 23;
    --surface:    28 31 30;
    --surface-alt: 36 40 38;
    --muted:      40 44 42;
    --muted-foreground: 160 167 163;

    --foreground: 237 240 238;     /* Sage Mist as soft white */
    --ink-alt:    200 205 202;

    --accent:            255 118 111;
    --accent-foreground: 24 25 24;
    --accent-soft:       80 36 34;

    --border: 50 54 52;
    --ring:   255 118 111;
  }

  * { border-color: rgb(var(--border)); }
  html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  body {
    background: rgb(var(--background));
    color: rgb(var(--foreground));
    font-family: var(--font-raleway), Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 15px;
    overflow-x: hidden;
  }
  @media (max-width: 767px) {
    textarea, select, input:not([type="checkbox"]):not([type="radio"]) { font-size: 16px; }
  }
  h1,h2,h3,h4,h5,h6 {
    font-family: "futura-pt", "Futura", ui-sans-serif, system-ui, sans-serif;
    font-weight: 700;
    color: rgb(var(--foreground));
    letter-spacing: -0.01em;
  }
}

@layer components {
  .haven-btn-cta {
    @apply inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5
           text-[14px] font-black uppercase tracking-cta text-accent-foreground
           transition-all duration-150 hover:brightness-95 active:brightness-90
           focus-visible:outline-none focus-visible:shadow-ring
           disabled:opacity-50 disabled:pointer-events-none;
  }
  .haven-card { @apply rounded-card border border-border bg-surface shadow-card transition-shadow; }
  .haven-card-hover { @apply hover:shadow-card-hover; }
  .haven-chip {
    @apply inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-0.5
           text-xs font-semibold text-foreground/80;
  }
  .haven-kbd {
    @apply inline-flex items-center justify-center rounded-md border border-border bg-surface-alt px-1.5
           font-mono text-[10px] font-semibold text-foreground/70 min-w-[20px] h-[20px];
  }
  .haven-eyebrow {
    @apply text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground;
  }
}

/* Topographic dotted texture for empty states / login */
.haven-topo {
  background-image: radial-gradient(circle at 1px 1px, rgba(66,66,66,0.06) 1px, transparent 0);
  background-size: 22px 22px;
}
.dark .haven-topo {
  background-image: radial-gradient(circle at 1px 1px, rgba(237,240,238,0.05) 1px, transparent 0);
}
```

### 8.4 Tailwind config snippet

Use the full config from **§7** verbatim. The essential extensions to copy:

- `darkMode: "class"`
- the `colors.haven` raw palette **and** the semantic `rgb(var(--…) / <alpha-value>)` tokens
- `fontFamily.heading` / `.sans` / `.mono`
- `fontSize.display-1…4`
- `letterSpacing.cta = "2px"`, `borderRadius.pill = "30px"` / `card = "14px"`
- `boxShadow.card` / `card-hover` / `ring`
- `keyframes` + `animation` (`fade-in`, `slide-up`)
- `container: { center: true, padding: "1.5rem", screens: { "2xl": "1440px" } }`
- `plugins: [require("tailwindcss-animate")]`

### 8.5 `cn()` helper (`lib/utils.ts`)

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

### 8.6 Theme provider (dark mode)

```tsx
// next-themes wrapper, applied around the app
import { ThemeProvider } from "next-themes";
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
```

### 8.7 Recreate-the-look checklist

1. **Accent = coral, used sparingly.** Reserve `bg-accent`/`text-accent` for CTAs, links, active nav, focus rings, one focus metric.
2. **Three-tier surfaces:** `background` → `surface` (cards) → `surface-alt` (Sage Mist headers/chips/inputs).
3. **Futura headings, Raleway body.** Headings bold, tight tracking; CTAs uppercase `font-black` + `tracking-cta`.
4. **Rounded & soft:** `rounded-card` (14px) panels, `rounded-pill` (30px) buttons/badges, charcoal-tinted `shadow-card`.
5. **Coral focus ring** everywhere interactive: `focus-visible:shadow-ring`.
6. **cva variants + `cn()`** for every primitive (button/badge/card) to match the variant architecture.
7. **Warmth cues:** topographic SVG / dotted `.haven-topo` texture on empty states; charcoal (not black) ink and shadows.

---

*Audited files: `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, `app/icon.svg`, `lib/fonts.ts`, `lib/utils.ts`, `components/ui/{button,badge,card,input,dialog,tabs,dropdown-menu,tooltip,checkbox,popover,scroll-area}.tsx`, `components/shell/{sidebar,topbar}.tsx`, `components/brand/{haven-logo,topographic-bg}.tsx`, `components/dashboard/kpi-card.tsx`, `components/properties/{property-table,property-badges}.tsx`, `app/(app)/dashboard/page.tsx`, `public/brand/`.*
