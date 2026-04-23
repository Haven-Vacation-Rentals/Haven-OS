-- Haven OS — seed jordan@havenvacationrentals.com as admin
-- Adds Jordan to both admin whitelists (board + HR).
-- Onboarding reuses hr_admins, so this grants Board, HR, and Onboarding access.

insert into public.board_admins (email) values
  ('jordan@havenvacationrentals.com')
on conflict (email) do nothing;

insert into public.hr_admins (email) values
  ('jordan@havenvacationrentals.com')
on conflict (email) do nothing;
