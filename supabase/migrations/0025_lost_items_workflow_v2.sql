-- Haven OS — Lost Items: simplified workflow (Jack's final status model)
--
-- Final pipeline statuses (in order):
--   pending_pickup → picked_up → delivered → completed
-- Plus terminal "failed" state.
--
-- Drops the prior `intake`, `in_transit`, `cancelled` statuses. Old rows
-- are migrated:
--   intake     → pending_pickup
--   in_transit → picked_up    (still en route, vendor has it)
--   cancelled  → failed
--
-- Also adds two optional URL fields used by the team for cross-linking:
--   slack_thread_url
--   conversation_url
--
-- Old `priority` and `item_category` columns are LEFT ON THE TABLE on
-- purpose — dropping them risks data loss and the columns are now hidden
-- from every UI / API path. They're effectively dead weight; we can drop
-- them in a later migration once we're confident nothing reads them.
--
-- Run AFTER 0024_lost_items.sql.

-- ---------------------------------------------------------------------------
-- 1. Status migration
-- ---------------------------------------------------------------------------

-- Drop the old check constraint by name (Postgres auto-named it
-- lost_items_status_check). We recreate it after backfilling.
alter table public.lost_items
  drop constraint if exists lost_items_status_check;

-- Backfill existing rows to the new workflow vocabulary.
update public.lost_items
   set status = case status
                  when 'intake'     then 'pending_pickup'
                  when 'in_transit' then 'picked_up'
                  when 'cancelled'  then 'failed'
                  else status
                end
 where status in ('intake', 'in_transit', 'cancelled');

-- New default + check constraint.
alter table public.lost_items
  alter column status set default 'pending_pickup';

alter table public.lost_items
  add constraint lost_items_status_check
  check (status in (
    'pending_pickup',
    'picked_up',
    'delivered',
    'failed',
    'completed'
  ));

-- ---------------------------------------------------------------------------
-- 2. New optional URL columns
-- ---------------------------------------------------------------------------

alter table public.lost_items
  add column if not exists slack_thread_url text,
  add column if not exists conversation_url text;
