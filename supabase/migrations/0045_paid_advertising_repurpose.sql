-- 0045_paid_advertising_repurpose.sql
-- Haven OS — repurpose the Content Studio from the Haven Homeowner Blog
-- (SEO/GEO editorial pipeline) into a Paid Advertising project space.
--
-- What changes:
--   * The default space is re-themed: "Haven Homeowner Blog" -> "Paid
--     Advertising" (slug 'haven-homeowner-blog' -> 'paid-advertising').
--   * The category axis moves from blog content pillars to ad channels.
--     The `content_pillar` enum becomes `ad_channel` and the
--     `content_topics.pillar` column is renamed to `channel`.
--   * `content_articles` gains creative-brief columns (hook, primary
--     text, CTA, ad format, budget) so each card can carry an ad script
--     plus its brief.
--   * The blog seed topic is dropped and replaced with a paid-ads
--     example so a fresh database opens on a representative card.
--
-- The Kanban itself is unchanged: idea -> in_progress -> draft ->
-- complete (plus archived). The SEO/GEO scorecard and WordPress publish
-- tables are intentionally left in place (harmless, data preserved); the
-- UI no longer surfaces them.

-- =============================================================================
-- 1. Re-theme the default space
-- =============================================================================

update public.content_spaces
set
  slug = 'paid-advertising',
  name = 'Paid Advertising',
  description = 'Paid ad project space for Haven Vacation Rentals. Capture ideas, write and customize ad scripts, and run them to completion across Meta, Google, TikTok, and YouTube.'
where slug = 'haven-homeowner-blog';

-- =============================================================================
-- 2. Category axis: content_pillar -> ad_channel, pillar column -> channel
-- =============================================================================

-- New channel enum.
do $$ begin
  create type ad_channel as enum (
    'meta',
    'google',
    'tiktok',
    'youtube',
    'other'
  );
exception when duplicate_object then null; end $$;

-- Swap the column over with an inline mapping from the old blog pillars.
-- Drop the default first (it references the old enum), then re-add it on
-- the new type.
alter table public.content_topics
  alter column pillar drop default;

alter table public.content_topics
  alter column pillar type ad_channel
  using (
    case pillar::text
      when 'market_data'        then 'meta'
      when 'revenue_strategy'   then 'google'
      when 'operations'         then 'tiktok'
      when 'industry_insights'  then 'youtube'
      when 'haven_performance'  then 'other'
      else 'other'
    end
  )::ad_channel;

alter table public.content_topics
  alter column pillar set default 'meta'::ad_channel;

-- Rename the column to match the new mental model.
alter table public.content_topics
  rename column pillar to channel;

-- Drop the now-unused blog enum.
drop type if exists content_pillar;

-- =============================================================================
-- 3. Creative-brief columns on content_articles
-- =============================================================================

alter table public.content_articles
  add column if not exists hook         text not null default '',
  add column if not exists primary_text text not null default '',
  add column if not exists cta          text not null default '',
  add column if not exists ad_format    text not null default '',
  add column if not exists budget       text not null default '';

-- =============================================================================
-- 4. Replace the blog seed with a paid-ads example
-- =============================================================================

do $$
declare
  v_space_id uuid;
  v_topic_id uuid;
begin
  select id into v_space_id from public.content_spaces where slug = 'paid-advertising';
  if v_space_id is null then return; end if;

  -- Drop the old homeowner-blog seed topic if it is still around. Its
  -- article, versions, research, scorecards, and publish jobs cascade.
  delete from public.content_topics
  where space_id = v_space_id
    and title = 'Smoky Mountains Cabin Revenue Outlook: What Owners Should Expect';

  -- Seed a representative paid-ads card (only once).
  if exists (
    select 1 from public.content_topics
    where space_id = v_space_id
      and title = 'Gatlinburg Fall Getaway — Meta Reel'
  ) then
    return;
  end if;

  insert into public.content_topics (
    space_id, title, working_title, channel, stage, priority,
    angle, hypothesis, due_date, publish_target
  ) values (
    v_space_id,
    'Gatlinburg Fall Getaway — Meta Reel',
    'Gatlinburg Fall Getaway',
    'meta',
    'draft',
    'high',
    'Lead with the empty-calendar pain, then the view payoff. Direct-booking offer, not OTA.',
    'A short founder-voice Reel with a fall-foliage hook converts better than a polished brand spot for cabin getaways.',
    (current_date + interval '5 days')::date,
    (current_date + interval '10 days')::date
  ) returning id into v_topic_id;

  insert into public.content_articles (
    topic_id, title, body_md, hook, primary_text, cta, ad_format, budget,
    word_count, reading_time_min
  ) values (
    v_topic_id,
    'Gatlinburg Fall Getaway — Meta Reel',
    E'## Hook (0-3s)\n\nText on screen over a drone shot of foliage: "Your Smoky Mountain fall is booking up fast."\n\n## Scene 1 (3-8s)\n\nInterior cabin, warm light, coffee on the deck rail with the ridge behind it. VO: "Floor-to-ceiling views, a hot tub under the trees, and you are ten minutes from downtown Gatlinburg."\n\n## Scene 2 (8-15s)\n\nQuick cuts: fire pit, game room, the drive into the national park. VO: "We manage it, you just show up."\n\n## CTA (15-20s)\n\nText on screen: "Book direct and skip the fees." VO: "Tap to see dates for October."',
    'Your Smoky Mountain fall is booking up fast.',
    'Floor-to-ceiling views, a hot tub under the trees, and ten minutes from downtown Gatlinburg. Book direct and skip the OTA fees — October dates are going quick.',
    'Book direct — see October dates',
    'Video (Reel)',
    '$50/day',
    72,
    1
  );
end $$;
