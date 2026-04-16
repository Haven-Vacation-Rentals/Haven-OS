-- Haven OS — List-level view supporting fields
-- Migration 0008: add completed_subtask_count view helper index,
--                 no schema changes needed (parent_id, status_id, priority,
--                 due_date, task_assignees, task_watchers all already exist).
--
-- Run AFTER 0007_fix_tg_set_updated_at_search_path.sql.
-- Idempotent.

-- Partial index to speed up subtask lookups (tasks with a parent)
create index if not exists idx_tasks_parent_id_non_null
  on public.tasks(parent_id)
  where parent_id is not null;

-- Index on (list_id, parent_id) for fast grouped queries
create index if not exists idx_tasks_list_parent
  on public.tasks(list_id, parent_id);

-- Index on task_assignees (task_id) for fast per-task joins
create index if not exists idx_task_assignees_task_id
  on public.task_assignees(task_id);
