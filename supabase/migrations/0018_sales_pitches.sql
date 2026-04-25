-- 0018_sales_pitches.sql
-- Sales section v1: property pitch generator.
--
-- A "pitch" is a personalized one-pager Haven sends to a prospective
-- property owner. The page lives at /pitch/<slug> and is publicly
-- accessible (no auth) but expires 30 days after creation. Reads happen
-- through a server route using the service-role key, so we don't need a
-- public RLS policy on this table.

-- =============================================================================
-- ENUMS
-- =============================================================================

do $$ begin
  create type sales_pitch_status as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sales_listing_source as enum (
    'zillow', 'airbnb', 'vrbo', 'booking', 'other'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TABLE
-- =============================================================================

create table if not exists public.sales_pitches (
  id uuid primary key default gen_random_uuid(),
  -- Public URL slug (random, unguessable). Lowercase hex.
  slug text not null unique,

  -- Owner side
  owner_name text not null,
  owner_email text,

  -- Property side
  property_address text not null,
  listing_url text,
  listing_source sales_listing_source not null default 'other',
  beds numeric(4,1),
  baths numeric(4,1),
  sleeps int,
  hero_image_url text,
  -- gallery: array of { url: string, alt?: string }
  gallery jsonb not null default '[]'::jsonb,

  -- Projection
  projection_low int not null,
  projection_high int not null,
  projection_note text,

  -- Lifecycle
  status sales_pitch_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),

  -- Engagement
  view_count int not null default 0,
  last_viewed_at timestamptz,

  -- Sanity
  constraint sales_pitches_projection_range
    check (projection_low >= 0 and projection_high >= projection_low)
);

create index if not exists sales_pitches_status_idx
  on public.sales_pitches (status, created_at desc);
create index if not exists sales_pitches_created_by_idx
  on public.sales_pitches (created_by);
create index if not exists sales_pitches_slug_idx
  on public.sales_pitches (slug);

-- =============================================================================
-- updated_at trigger reuse
-- =============================================================================

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  -- noop columns, tgupdated_at not used here
  return new;
end;
$$;

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================

alter table public.sales_pitches enable row level security;

-- Read: any signed-in admin or super_admin can read all pitches.
drop policy if exists "sales_pitches admin read" on public.sales_pitches;
create policy "sales_pitches admin read"
  on public.sales_pitches for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin', 'super_admin')
    )
  );

-- Insert/update/delete: same audience.
drop policy if exists "sales_pitches admin write" on public.sales_pitches;
create policy "sales_pitches admin write"
  on public.sales_pitches for all
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

-- Note: the public /pitch/<slug> page reads via the service-role admin
-- client in a Route Handler / Server Component, which bypasses RLS.
