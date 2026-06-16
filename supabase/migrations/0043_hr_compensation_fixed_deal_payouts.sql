-- 0043_hr_compensation_fixed_deal_payouts.sql
-- Closed deals now use a fixed dollar payout per deal. Public submissions
-- can include a deal count, and payout is calculated as
-- deal_count * closed_deal_payout_amount.

alter table public.hr_compensation_forms
  add column if not exists closed_deal_payout_amount numeric(12,2) not null default 0;

update public.hr_compensation_forms
set closed_deal_payout_amount = deal_commission_percent
where closed_deal_payout_amount = 0
  and deal_commission_percent > 0;

alter table public.hr_compensation_submissions
  add column if not exists deal_count integer;
