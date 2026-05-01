-- 0034_sales_pitch_kim_photo_reset.sql
-- One-shot backfill: Kim Lache's pitch (active, ~5/1/2026) was created when
-- the listing extractor still let through Airbnb's "Find a place" /
-- category-cover lifestyle hero. The public page rendered a stranger's
-- face above "Kim, your cabin deserves Haven" — clearly broken.
--
-- The accompanying app-level fix (a) tightens the extractor so this
-- can't happen on new pitches and (b) defensively re-filters any stored
-- photos that don't look like real listing photos.
--
-- This migration is a belt-and-braces cleanup: blank out hero/gallery on
-- Kim's pitch row when the stored hero is anything but a Haven cabin
-- shot or a real Airbnb listing photo. With the row blanked, the public
-- page will fall back to a curated Haven cabin shot until Jack pastes
-- real photos via the admin "Edit photos" / "Refresh photos" actions.
--
-- Strictly scoped to Kim's row by owner_name + property_address. No
-- effect on Dylan Robinson's canary pitch or anyone else.

do $$
declare
  bad_hero boolean;
begin
  -- We only want to reset rows whose stored hero is *not* a real listing
  -- photo. The check below mirrors the app's `looksLikePropertyPhoto`:
  --   - Haven CDN → real, keep.
  --   - a0.muscache.com /im/pictures/ → real only on the /prohost-api/Hosting-,
  --     /miso/Hosting-, /Hosting-N, /hosting/ paths. Anything else (category
  --     covers, AirbnbPlatformAssets, avatars) is fake.
  --   - Anything that mentions unsplash / pexels / etc → fake.
  --   - Anything else → assume fake (conservative for this targeted backfill).
  update public.sales_pitches
     set hero_image_url = null,
         gallery        = '[]'::jsonb
   where status = 'active'
     and owner_name ilike 'kim lache%'
     and property_address ilike '%268 jolene way%sevierville%'
     and (
       hero_image_url is null
       or (
         hero_image_url not ilike '%havenvacationrentals.com%'
         and not (
           hero_image_url ilike '%a0.muscache.com/im/pictures/prohost-api/hosting-%'
           or hero_image_url ilike '%a0.muscache.com/im/pictures/miso/hosting-%'
           or hero_image_url ~* 'a0\.muscache\.com/im/pictures/hosting-\d'
           or hero_image_url ilike '%a0.muscache.com/im/pictures/hosting/%'
         )
       )
     );
  get diagnostics bad_hero = row_count;
  raise notice 'sales_pitches Kim Lache photo reset: % row(s) updated', bad_hero;
end $$;
