-- 0011_task_recurrence.sql
-- Fully customizable recurring tasks.
--
-- Stored as JSONB on the task itself so we don't need an extra table.
-- Shape (all fields optional unless noted):
--   {
--     "pattern":     "daily" | "weekly" | "monthly" | "yearly",  -- REQUIRED
--     "interval":    1,                  -- every N units; default 1
--     "days_of_week": [1,3,5],           -- 0=Sun … 6=Sat (weekly only)
--     "day_of_month": 15,                -- 1..31  (monthly only)
--     "anchor":       "due_date"         -- "due_date" | "completion"; default "due_date"
--                                          when "due_date", next_due = prev_due + interval
--                                          when "completion", next_due = today + interval
--     "ends":         { "type": "never" }
--                  |  { "type": "on", "date": "2026-12-31" }
--                  |  { "type": "after", "count": 10 }
--   }

alter table public.tasks
  add column if not exists recurrence_rule jsonb;

-- Helpful partial index so "which tasks recur?" queries are fast.
create index if not exists tasks_recurring_idx
  on public.tasks ((recurrence_rule is not null))
  where recurrence_rule is not null;

-- Count of times this recurring series has already rolled over.
-- Used to stop at {"ends": {"type": "after", "count": N}}.
alter table public.tasks
  add column if not exists recurrence_count integer not null default 0;

comment on column public.tasks.recurrence_rule
  is 'JSONB recurrence rule. See migration 0011 for shape.';
comment on column public.tasks.recurrence_count
  is 'How many times this recurring task has already rolled over.';
