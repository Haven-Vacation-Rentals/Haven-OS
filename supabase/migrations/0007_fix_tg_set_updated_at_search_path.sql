-- Haven OS — Fix mutable search_path on tg_set_updated_at
-- Migration 0007: closes Supabase security advisor lint 0011
--
-- Run AFTER 0006_task_lists_tendwell.sql.
-- Idempotent (create or replace).

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
