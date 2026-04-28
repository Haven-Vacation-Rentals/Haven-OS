-- 0026_content_pipeline_simplify.sql
-- Haven OS — Content Studio: collapse the long content workflow to four
-- pipeline stages: idea, in_progress, draft, complete (plus archived,
-- which is hidden from the board).
--
-- Mapping from the old `content_topic_stage` enum:
--   idea                                  -> idea
--   research, brief, outline, optimize    -> in_progress
--   draft                                 -> draft
--   review, wordpress_draft, published,
--   monitor                               -> complete
--   archived                              -> archived
--
-- Strategy: add a new enum, swap the column over, drop the old enum.

-- 1. Create the new enum if it doesn't already exist.
do $$ begin
  create type content_topic_stage_v2 as enum (
    'idea',
    'in_progress',
    'draft',
    'complete',
    'archived'
  );
exception when duplicate_object then null; end $$;

-- 2. Switch the column over with an inline mapping. We drop the default
--    first because it references the old enum, then re-add it on the
--    new type.
alter table public.content_topics
  alter column stage drop default;

alter table public.content_topics
  alter column stage type content_topic_stage_v2
  using (
    case stage::text
      when 'idea'             then 'idea'
      when 'research'         then 'in_progress'
      when 'brief'            then 'in_progress'
      when 'outline'          then 'in_progress'
      when 'optimize'         then 'in_progress'
      when 'draft'            then 'draft'
      when 'review'           then 'complete'
      when 'wordpress_draft'  then 'complete'
      when 'published'        then 'complete'
      when 'monitor'          then 'complete'
      when 'archived'         then 'archived'
      else 'idea'
    end
  )::content_topic_stage_v2;

alter table public.content_topics
  alter column stage set default 'idea'::content_topic_stage_v2;

-- 3. Drop the old enum and rename the new one to take its place.
drop type if exists content_topic_stage;
alter type content_topic_stage_v2 rename to content_topic_stage;
