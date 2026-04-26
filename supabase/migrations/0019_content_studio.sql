-- 0019_content_studio.sql
-- Haven OS — Content Studio (SEO + GEO blog workspace).
--
-- This migration owns the content workflow inside Haven OS. ClickUp is
-- no longer the source of truth; topics, articles, research, scoring,
-- agent chat, and publish jobs all live here.
--
-- Tables:
--   content_spaces           — top-level spaces (e.g. "Haven Homeowner Blog")
--   content_topics           — topic backlog / editorial calendar items
--   content_articles         — article drafts (one current draft per topic)
--   content_article_versions — append-only history of article snapshots
--   content_research_sources — sourced data points / citations
--   content_seo_checks       — SEO scorecard runs
--   content_geo_checks       — GEO / AI ranking scorecard runs
--   content_agent_messages   — left-pane chat log per article
--   content_publish_jobs     — WordPress draft creation jobs (status only)
--
-- All RLS policies require admin or super_admin (mirrors sales).

-- =============================================================================
-- ENUMS
-- =============================================================================

do $$ begin
  create type content_pillar as enum (
    'market_data',
    'revenue_strategy',
    'operations',
    'industry_insights',
    'haven_performance'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_topic_stage as enum (
    'idea',
    'research',
    'brief',
    'outline',
    'draft',
    'optimize',
    'review',
    'wordpress_draft',
    'published',
    'monitor',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_publish_status as enum (
    'pending',
    'queued',
    'in_progress',
    'completed',
    'failed',
    'blocked',
    'credentials_missing'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_agent_role as enum ('user', 'agent', 'system');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- SPACES
-- =============================================================================

create table if not exists public.content_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.content_spaces (slug, name, description)
values (
  'haven-homeowner-blog',
  'Haven Homeowner Blog',
  'SEO + GEO content for vacation rental property owners in the Smoky Mountains. Voice: Jack Zoppa, first-person, operator credibility.'
) on conflict (slug) do nothing;

-- =============================================================================
-- TOPICS
-- =============================================================================

create table if not exists public.content_topics (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.content_spaces(id) on delete cascade,

  title text not null,
  working_title text,
  pillar content_pillar not null default 'market_data',
  stage content_topic_stage not null default 'idea',
  priority content_priority not null default 'medium',

  target_keyword text,
  secondary_keywords text[] not null default array[]::text[],
  audience text default 'Smoky Mountains vacation rental owners',
  angle text,
  hypothesis text,

  due_date date,
  publish_target date,

  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_topics_space_idx
  on public.content_topics (space_id, stage, priority);
create index if not exists content_topics_due_idx
  on public.content_topics (due_date);
create index if not exists content_topics_publish_idx
  on public.content_topics (publish_target);

-- =============================================================================
-- ARTICLES (one current draft per topic; versions accumulate)
-- =============================================================================

create table if not exists public.content_articles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null unique references public.content_topics(id) on delete cascade,

  title text not null default '',
  meta_description text not null default '',
  slug text,
  hero_image_url text,

  -- Markdown body
  body_md text not null default '',
  outline_md text not null default '',
  brief_md text not null default '',

  word_count int not null default 0,
  reading_time_min int not null default 0,

  -- Latest scorecards (denormalized for list views)
  seo_score int,
  geo_score int,

  -- Publish bookkeeping
  wp_post_id text,
  wp_draft_url text,
  last_publish_status content_publish_status,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_articles_topic_idx
  on public.content_articles (topic_id);

-- =============================================================================
-- ARTICLE VERSIONS (append-only history)
-- =============================================================================

create table if not exists public.content_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_articles(id) on delete cascade,
  version_number int not null,

  title text not null default '',
  meta_description text not null default '',
  body_md text not null default '',

  source content_agent_role not null default 'user',
  note text,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (article_id, version_number)
);

create index if not exists content_article_versions_article_idx
  on public.content_article_versions (article_id, version_number desc);

-- =============================================================================
-- RESEARCH SOURCES / FINDINGS
-- =============================================================================

create table if not exists public.content_research_sources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.content_topics(id) on delete cascade,

  url text,
  title text,
  publisher text,
  published_on date,

  finding text not null,
  data_point text,
  is_verified boolean not null default false,

  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_research_topic_idx
  on public.content_research_sources (topic_id);

-- =============================================================================
-- SCORECARDS — SEO & GEO
-- =============================================================================

create table if not exists public.content_seo_checks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_articles(id) on delete cascade,

  score int not null,
  -- Detailed checks: array of { id, label, ok, severity, hint }
  checks jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists content_seo_checks_article_idx
  on public.content_seo_checks (article_id, created_at desc);

create table if not exists public.content_geo_checks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_articles(id) on delete cascade,

  score int not null,
  checks jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists content_geo_checks_article_idx
  on public.content_geo_checks (article_id, created_at desc);

-- =============================================================================
-- AGENT CHAT
-- =============================================================================

create table if not exists public.content_agent_messages (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_articles(id) on delete cascade,

  role content_agent_role not null,
  content text not null,
  -- Optional structured suggestion: { kind, before, after, target } etc.
  suggestion jsonb,
  applied boolean not null default false,

  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_agent_messages_article_idx
  on public.content_agent_messages (article_id, created_at);

-- =============================================================================
-- PUBLISH JOBS
-- =============================================================================

create table if not exists public.content_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.content_articles(id) on delete cascade,

  status content_publish_status not null default 'pending',
  target text not null default 'wordpress',
  attempt int not null default 0,

  result jsonb not null default '{}'::jsonb,
  error_message text,
  wp_post_id text,
  wp_draft_url text,

  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_publish_jobs_article_idx
  on public.content_publish_jobs (article_id, created_at desc);
create index if not exists content_publish_jobs_status_idx
  on public.content_publish_jobs (status, created_at desc);

-- =============================================================================
-- updated_at triggers
-- =============================================================================

create or replace function public.tg_content_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tg_content_topics_updated_at on public.content_topics;
create trigger tg_content_topics_updated_at
  before update on public.content_topics
  for each row execute function public.tg_content_set_updated_at();

drop trigger if exists tg_content_articles_updated_at on public.content_articles;
create trigger tg_content_articles_updated_at
  before update on public.content_articles
  for each row execute function public.tg_content_set_updated_at();

drop trigger if exists tg_content_publish_jobs_updated_at on public.content_publish_jobs;
create trigger tg_content_publish_jobs_updated_at
  before update on public.content_publish_jobs
  for each row execute function public.tg_content_set_updated_at();

-- =============================================================================
-- ROW-LEVEL SECURITY (admin/super_admin only — mirrors sales)
-- =============================================================================

alter table public.content_spaces            enable row level security;
alter table public.content_topics            enable row level security;
alter table public.content_articles          enable row level security;
alter table public.content_article_versions  enable row level security;
alter table public.content_research_sources  enable row level security;
alter table public.content_seo_checks        enable row level security;
alter table public.content_geo_checks        enable row level security;
alter table public.content_agent_messages    enable row level security;
alter table public.content_publish_jobs      enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'content_spaces',
    'content_topics',
    'content_articles',
    'content_article_versions',
    'content_research_sources',
    'content_seo_checks',
    'content_geo_checks',
    'content_agent_messages',
    'content_publish_jobs'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "%s admin read" on public.%I', t, t);
    execute format($f$
      create policy "%s admin read"
        on public.%I for select
        using (
          exists (
            select 1 from public.profiles me
            where me.id = auth.uid()
              and me.role in ('admin', 'super_admin')
          )
        )
    $f$, t, t);

    execute format('drop policy if exists "%s admin write" on public.%I', t, t);
    execute format($f$
      create policy "%s admin write"
        on public.%I for all
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
        )
    $f$, t, t);
  end loop;
end $$;

-- =============================================================================
-- SEED — sample topic + draft article for the Homeowner Blog
-- =============================================================================

do $$
declare
  v_space_id uuid;
  v_topic_id uuid;
  v_article_id uuid;
begin
  select id into v_space_id from public.content_spaces where slug = 'haven-homeowner-blog';
  if v_space_id is null then return; end if;

  if exists (
    select 1 from public.content_topics
    where space_id = v_space_id
      and title = 'Smoky Mountains Cabin Revenue Outlook: What Owners Should Expect'
  ) then
    return;
  end if;

  insert into public.content_topics (
    space_id, title, working_title, pillar, stage, priority,
    target_keyword, secondary_keywords, angle, hypothesis,
    due_date, publish_target
  ) values (
    v_space_id,
    'Smoky Mountains Cabin Revenue Outlook: What Owners Should Expect',
    'Smoky Mountains Cabin Revenue Outlook',
    'market_data',
    'draft',
    'high',
    'smoky mountains cabin rental income',
    array['gatlinburg vacation rental revenue','pigeon forge cabin income','sevierville short term rental'],
    'Real numbers from operating in this market — not generic STR commentary.',
    'Owners over-rely on national STR averages; the Smokies bucket has its own seasonality and ADR floor.',
    (current_date + interval '14 days')::date,
    (current_date + interval '21 days')::date
  ) returning id into v_topic_id;

  insert into public.content_articles (
    topic_id, title, meta_description, slug,
    body_md, outline_md, brief_md, word_count, reading_time_min
  ) values (
    v_topic_id,
    'Smoky Mountains Cabin Revenue Outlook: What Owners Should Expect in 2026',
    'A first-person look at what Smoky Mountains cabin owners can realistically expect for revenue in 2026, with operator-level detail on ADR, occupancy, and seasonality.',
    'smoky-mountains-cabin-revenue-outlook',
    E'I run Haven Vacation Rentals in the Smoky Mountains, and the question I get most from owners is simple: what should I actually expect this property to make next year?\n\n## The honest baseline\n\nNational STR averages do not describe this market. The Smokies bucket has its own ADR floor, its own shoulder seasons, and a leisure-driven demand curve that punishes anyone treating it like a generic short term rental.\n\n## What I am seeing in the data\n\n- ADR has held in the $310 to $360 band on properly positioned 2 to 4 bedroom cabins\n- Occupancy on tuned listings is running roughly 62 to 68 percent annualized\n- October and the holiday weeks remain the largest single revenue contributors\n\n## How owners get the number wrong\n\nThe most common mistake I see is anchoring on a peak-week ADR and projecting that across the calendar. Real revenue is built on consistent shoulder season pricing, fast turn quality, and a guest experience that earns the repeat booking.\n\n## What this means for your property\n\nIf the cabin is well located, professionally managed, and priced for the actual demand curve, you should be modeling revenue against the bands above, not against a national STR newsletter.\n\n-- Jack Zoppa, CEO, Haven Vacation Rentals',
    E'1. The honest baseline\n2. What I am seeing in the data\n3. How owners get the number wrong\n4. What this means for your property',
    E'Audience: Smoky Mountains cabin owners.\nGoal: Set realistic 2026 revenue expectations and position Haven as the operator who knows the market.\nPrimary keyword: smoky mountains cabin rental income.\nMust include: ADR band, occupancy band, seasonality call-out, soft CTA, sign-off.',
    230,
    2
  ) returning id into v_article_id;

  insert into public.content_research_sources (topic_id, title, publisher, finding, data_point, is_verified)
  values
    (v_topic_id, 'AirDNA Q1 market summary — Smokies cluster',
     'AirDNA',
     'Smokies submarket ADR has stayed elevated relative to national averages through the latest reporting period.',
     'ADR $310 to $360 in the 2 to 4 BR cabin segment',
     false),
    (v_topic_id, 'Internal Haven booking ledger',
     'Haven Vacation Rentals',
     'Annualized occupancy on tuned listings clustered between 62 and 68 percent.',
     '62 to 68 percent annualized occupancy',
     true);
end $$;
