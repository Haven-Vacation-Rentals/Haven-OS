-- 0029_gtm_lead_magnets.sql
-- GTM section: Lead Magnet landing pages.
--
-- A "lead magnet" is a public, branded landing page Haven hosts at
-- /lead-magnet/<slug> — used to capture leads with a downloadable
-- guide / checklist / calculator / etc. The exact creative is TBD,
-- so the schema favors flexibility:
--   - `content` (jsonb)  → freeform sections (hero, bullets, FAQ, etc.)
--   - `cta` (jsonb)      → CTA + capture form config
--   - `theme` (jsonb)    → optional per-magnet color/imagery overrides
--
-- Public page reads happen through a server route using the service-role
-- key (same pattern as /pitch/<slug>), so we don't need a public RLS
-- policy on the campaigns table. Submissions are written through the
-- same admin client.

-- =============================================================================
-- ENUMS
-- =============================================================================

do $$ begin
  create type gtm_lead_magnet_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TABLE — campaigns (one per lead-magnet landing page)
-- =============================================================================

create table if not exists public.gtm_lead_magnets (
  id uuid primary key default gen_random_uuid(),
  -- Public URL slug (random, unguessable). Lowercase hex.
  slug text not null unique,

  -- Top-of-page identity
  title text not null,
  subtitle text,
  eyebrow text,
  hero_image_url text,

  -- Flexible content body. Render order driven by the array.
  -- Suggested section shapes (renderer is permissive):
  --   { kind: "rich_text", body_md: string }
  --   { kind: "bullets", heading?: string, items: string[] }
  --   { kind: "stat_band", stats: { value: string, label: string }[] }
  --   { kind: "faq", items: { q: string, a: string }[] }
  --   { kind: "cta_block", heading?: string, body?: string }
  content jsonb not null default '[]'::jsonb,

  -- CTA + capture-form config:
  --   { label: string, type: "form" | "link", href?: string,
  --     fields?: ("name"|"email"|"phone"|"property_address"|"message")[],
  --     success_message?: string }
  cta jsonb not null default jsonb_build_object(
    'label', 'Get the guide',
    'type', 'form',
    'fields', jsonb_build_array('name','email')
  ),

  -- Optional per-magnet branding overrides (e.g. accent color, logo, footer).
  theme jsonb not null default '{}'::jsonb,

  -- Owner / contact
  owner_name text,
  owner_email text,

  -- Lifecycle
  status gtm_lead_magnet_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),

  -- Engagement (mirrors sales_pitches)
  view_count int not null default 0,
  submission_count int not null default 0,
  last_viewed_at timestamptz,
  last_submission_at timestamptz
);

create index if not exists gtm_lead_magnets_status_idx
  on public.gtm_lead_magnets (status, created_at desc);
create index if not exists gtm_lead_magnets_created_by_idx
  on public.gtm_lead_magnets (created_by);
create index if not exists gtm_lead_magnets_slug_idx
  on public.gtm_lead_magnets (slug);

-- Restore the canonical updated_at trigger function (0018 left it as a
-- noop because sales_pitches doesn't have updated_at). We need the
-- real version for gtm_lead_magnets.updated_at.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists tg_gtm_lead_magnets_set_updated_at on public.gtm_lead_magnets;
create trigger tg_gtm_lead_magnets_set_updated_at
  before update on public.gtm_lead_magnets
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- TABLE — submissions (one per public form submission)
-- =============================================================================

create table if not exists public.gtm_lead_magnet_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_magnet_id uuid not null
    references public.gtm_lead_magnets(id) on delete cascade,

  -- Captured fields. All optional so the schema accommodates whichever
  -- combination the magnet's CTA is configured to ask for.
  name text,
  email text,
  phone text,
  property_address text,
  message text,

  -- Anything else the form posted (utm params, custom fields, etc).
  extra jsonb not null default '{}'::jsonb,

  -- Forensics
  user_agent text,
  referrer text,

  created_at timestamptz not null default now()
);

create index if not exists gtm_lead_magnet_submissions_magnet_idx
  on public.gtm_lead_magnet_submissions (lead_magnet_id, created_at desc);

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================

alter table public.gtm_lead_magnets enable row level security;
alter table public.gtm_lead_magnet_submissions enable row level security;

-- Read: any signed-in admin or super_admin can read all magnets.
drop policy if exists "gtm_lead_magnets admin read" on public.gtm_lead_magnets;
create policy "gtm_lead_magnets admin read"
  on public.gtm_lead_magnets for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  );

-- Insert/update/delete: same audience.
drop policy if exists "gtm_lead_magnets admin write" on public.gtm_lead_magnets;
create policy "gtm_lead_magnets admin write"
  on public.gtm_lead_magnets for all
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  );

-- Submissions: admin/super_admin can read all. Public writes happen via
-- service-role from a server action (no public insert policy needed —
-- mirrors the sales pitch pattern).
drop policy if exists "gtm_lead_magnet_submissions admin read" on public.gtm_lead_magnet_submissions;
create policy "gtm_lead_magnet_submissions admin read"
  on public.gtm_lead_magnet_submissions for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  );

drop policy if exists "gtm_lead_magnet_submissions admin write" on public.gtm_lead_magnet_submissions;
create policy "gtm_lead_magnet_submissions admin write"
  on public.gtm_lead_magnet_submissions for all
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  );

-- Note: the public /lead-magnet/<slug> page reads via the service-role
-- admin client in a Server Component, which bypasses RLS. Public form
-- submissions also flow through the service-role client.
