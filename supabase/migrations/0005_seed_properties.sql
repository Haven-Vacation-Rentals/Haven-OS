-- Auto-generated seed data — do not hand-edit.
-- Re-run scripts/seed_properties.py to regenerate.

-- Wipe existing properties to make this migration idempotent.
truncate table public.properties restart identity cascade;

insert into public.properties (
  external_id,
  name,
  status,
  tier,
  priority,
  sales_status,
  currently_hosting,
  address,
  address_map,
  region,
  account_manager,
  revenue_manager,
  bedroom_count,
  bathroom_count_full,
  bathroom_count_half,
  king_beds,
  queen_beds,
  full_beds,
  twin_beds,
  kitchen_count,
  indoor_pool_hot_tub,
  max_guests,
  extra_guest_fee_threshold,
  airbnb_account,
  airbnb_listing_account,
  hostaway_id,
  breezeway_id,
  listing_link,
  platform_links,
  lockbox,
  key_box_location,
  master_code,
  locks_and_codes,
  wifi_login,
  thermostat,
  cleaning_fee,
  cleaner_pay,
  pest_control_notes,
  pool_vendor_notes,
  lawn_care,
  gas_company,
  water_source,
  fireplace,
  parking,
  cancellation_policy,
  pay_date,
  hoa_community,
  notes
) values
('86e0vdc19', 'Stephanie Keegan 1260-1306', 'onboarding', 'normal', 'none', 'none', false, '1260 Ski View Dr # 1306, Gatlinburg, TN 37738, USA', '1260 Ski View Dr #1306, Gatlinburg, TN 37738, USA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Main Account', 'Haven', '507467', '1310272', NULL, NULL, NULL, NULL, NULL, NULL, 'Network name: summitsmokymountainviews Password: nestvalley510', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'HOA', NULL, NULL, NULL, NULL, 'Firm', '25th', NULL, NULL),
('86e0vdbzj', 'Stephanie Keegan 1260-5307', 'onboarding', 'normal', 'none', 'none', false, '1260 Ski View Dr # 5307, Gatlinburg, TN 37738, USA', '1260 Ski View Dr # 5307, Gatlinburg, TN 37738, USA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Main Account', 'Haven', '507465', '1310271', NULL, NULL, NULL, NULL, NULL, NULL, 'Network Name: SmokyViews1 Pasword: Franc88!', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'HOA', NULL, NULL, NULL, NULL, 'Firm', '25th', NULL, NULL),
('86e0hg4t5', 'Robert Miller 191', 'onboarding', 'junior', 'none', 'none', false, '191 TN-32 Cosby, TN 37722', '191 TN-32, Cosby, TN 37722, USA', NULL, 'Lily Bryant Macon', NULL, 1, 1, NULL, NULL, 2, NULL, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '500280', '1282566', NULL, 'AIRBNB LINK: airbnb.com/h/smokies-cozy-peaceful-porch- VRBO LINK: https://www.vrbo.com/5214106?dateless=true BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1NDjSXtMkDiAOkPKKIVsilsjqr7B0d6ALLK7_0A_qUQ4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1eMW4gtuO08oj7eYNz1zPZN1YoXGVMqr9 GOOGLE LINK:', '3726', NULL, '9172', 'Owner Code: 3161 | Vendor Code: 4722', 'WiFi Network: BlackBear3 Password: CosbyCabin181', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Electric
', 'Gravel, Flat
2 spots 
No RVs/Trailers allowed

', 'Firm', '25th', NULL, NULL),
('86e06ze7z', 'Heidi Schelton 247', 'onboarding', 'normal', 'none', 'none', false, '247 Boat Gunnel Rd, Townsend, TN 37882', '247 Boat Gunnel Rd, Townsend, TN 37882, USA', NULL, 'Katie Work', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '494307', '1265052', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'Handled by Owner', NULL, NULL, NULL, NULL, 'Firm', '25th', NULL, NULL),
('86e00w09q', 'Teresa Wentz 4161', 'onboarding', 'normal', 'none', 'none', false, '4161 Paint Horse Way, Sevierville, TN 37876', '4161 Paint Horse Way, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '491167', '1254064', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', '25th', NULL, NULL),
('86dzn55dd', 'Lindsey Hatcher 255-200', 'onboarding', 'normal', 'none', 'none', false, '255 S Gay St Unit 200, Knoxville TN 37902', '327 W Summit Hill Dr SW, Knoxville, TN 37902, USA', NULL, 'Regina Shrout', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '484697', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, '20% at 1 year 

'),
('86dzn55a4', 'Megan Hatcher 255-202', 'onboarding', 'normal', 'none', 'none', false, '255 S Gay St Unit 202, Knoxville TN 37902', '327 W Summit Hill Dr SW, Knoxville, TN 37902, USA', NULL, 'Regina Shrout', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '484695', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, '20% at 1 year 
'),
('86dzju6j1', 'Troy Mowery 3452', 'onboarding', 'normal', 'none', 'none', false, '3452 Cove Meadows Dr, Sevierville, TN 37862', '3452 Cove Meadows Dr, Pigeon Forge, TN 37862, USA', NULL, 'Summer Mathews', NULL, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '482838', '1234875', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, NULL),
('86dyk16y2', 'Eric Fleming 1260', 'onboarding', 'normal', 'none', 'none', false, '1260 Ski View Dr, Gatlinburg, TN 37738', '1260 Ski View Dr, Gatlinburg, TN 37738, USA', NULL, 'Lily Bryant Macon', NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '458087', '1172376', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, 'fyi: There is a community outdoor pool, then and Indoor pool with two hottubs. No card or access number needed, just walk over and enjoy. Pools and hot tubs close around 9:45pm.
'),
('86dxqj283', 'David Artuso 69', 'onboarding', 'key', 'none', 'none', false, '69 Smoky Ridge Way, Sevierville, TN 37862', 'Smoky Ridge Way, Tennessee 37862, USA', NULL, 'Regina Shrout', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '432565', '1104843', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1508727552775966820 VRBO LINK:  BOOKING.COM LINK:  MARRIOTT LINK:  DIRECT BOOKING SITE LINK:  GREEN LIGHT DOC LINK: OWNER PROFILE FOLDER: GOOGLE LINK:', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, NULL),
('86dx90kqv', 'Jenn Sackenheim 100-B3', 'onboarding', 'junior', 'none', 'none', false, '100 S Gay St unit B3 Knoxville, TN 37902', '100 S Gay St b3, Knoxville, TN 37902, USA', NULL, 'Regina Shrout', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '413965', '1060653', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', NULL, NULL, NULL),
('86e0rdmjv', 'Catherine Nelms 1274', 'live', 'normal', 'none', 'none', true, '1274 Bear Cub Way Gatlinburg, TN 37738', '1274 Bear Cub Way, Gatlinburg, TN 37738, USA', NULL, 'Regina Shrout', NULL, 3, 3, NULL, 2, 1, NULL, 1, 1, 1, 8, 4, 'Main Account', 'Haven', '504537', '1299935', 'https://www.airbnb.com/rooms/1659557462377262120?source_impression_id=p3_1775830031_P39jgWEJBjnpz9vS', 'AIRBNB LINK: https://www.airbnb.com/rooms/1659557462377262120 VRBO LINK: https://www.vrbo.com/5214102?dateless=true BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Gj6QleR4OIIYD5cX_Cife9uo7EaHaVwtGK2Gh9WNt8Q/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1V6rh53AShiBT5n2BJyUK06I84TFgJbYW?usp=drive_link GOOGLE LINK: ', '1964', NULL, '1989', NULL, 'Network: Ober Overlook Password: Gatlinburg1274', NULL, 379, NULL, 'Johnson Pest Control', 'Precision Pools', NULL, 'Thompson', 'HUD', 'Gas
', NULL, 'Firm', '25th', NULL, NULL),
('86e0mx96x', 'Ricardo Robles 1254', 'live', 'normal', 'none', 'none', true, '1254 W New Era Rd, Sevierville, TN 37876', '1254 W New Era Rd, Pigeon Forge, TN 37876, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 3, 2, NULL, NULL, 3, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '502327', '1293683', NULL, ' AIRBNB LINK: https://airbnb.com/h/smokies-peaceful-nest VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1pZBfgEag6De4j30B6LI9cvEaTrpfXd9QBFir7EcaYK0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1SBjvD6a0iulNbGLEEDQWrWNIwfL2Yho3 GOOGLE LINK:', '4213', NULL, '6179', 'Owner Code: 1786 | Vendor Code: 8672', 'WiFi Network: SpectrumSetup-19 Password: jazzrockets631', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, 'Private Well', '1
', 'Long Gravel
3 spots
No RVs/Trailers allowed

', 'Firm', '25', NULL, NULL),
('86e0djb8r', 'David Joyner 3136', 'live', 'normal', 'none', 'none', true, '3136 Cherokee Valley Dr, Sevierville, TN 37862', '3136 Cherokee Vly Dr, Pigeon Forge, TN 37862, USA', 'NW Parkway', 'Summer Mathews', NULL, 5, 4, NULL, 3, 3, 5, NULL, 1, 1, 22, 10, 'Main Account', 'Haven', '498422', '1278272', NULL, ' AIRBNB LINK: https://airbnb.com/h/smokies-paradise VRBO LINK: https://www.vrbo.com/5191431  BOOKING.COM LINK: Not pushed yet!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/498422 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1EZwEluMCEslzrnXg5j7KYeDaIyrwHfLkTQiA8vh0neo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1sssHTMbnssbrAch5GXO-01FV_e7M9_-i GOOGLE LINK: ', '8266', NULL, '6739', 'Owner Code: 4663 + Vendor Code: 0124', 'Wifi name: bearsonthecreek Wifi password: welcome2tn', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, '1
', '4 spots
slight incline, concrete.
no rv/trailer
', 'Firm', '25th', NULL, 'As of Apr 15, 2026:
Early check in requests are no longer an option for this property.

Change of ownership from Van Mulkey 3136 

AS of Mar 31,2026:
HKF should be $400
Haven CE should be $400

'),
('86e0dj4n9', 'James Johnson 1250', 'live', 'normal', 'none', 'none', true, '1250 Secona Way, Sevierville TN 37876', '1250 Secona Way, Sevierville, TN 37876, USA', 'East Parkway', 'Regina Shrout', NULL, 4, 3, 1, 1, 4, 3, NULL, 1, 1, 16, 10, 'Main Account', 'Haven', '498421', '1278269', NULL, 'AIRBNB LINK: https://airbnb.com/h/happy-hideaway-cabin VRBO LINK: https://www.vrbo.com/5191430  BOOKING.COM LINK: https://www.booking.com/hotel/us/retreat-w-hot-tub-fire-pit-pool-table-foosball.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/498421 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1-l1fwBdyuzoaxpFdn9b2iSSQikMtmFJRrqFANB5bhq8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1cvMixAe0a-6NFLJLWtmuJfOVZkDD6Hlc GOOGLE LINK: ', '2021', NULL, '1225', 'Owner Code: 1620', 'Wifi name: HiddenPleasures 2G or Hidden Pleasures 5G Wifi password: hiddenpleasures', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, 'Steep, paved driveway
4 spots
No RVs/Trailers
', 'Firm', '25th', NULL, 'Change of ownership from Daniel Rivers 1250 

This is the one that works;
Network: Happyhideaway
PW: 1250secona

'),
('86e0dhqtp', 'Amy Christopher 3303', 'live', 'normal', 'none', 'none', true, '3303 Shagbark Hickory Rdg, Sevierville, TN 37862', '3303 Shagbark Hickory Ridge, Sevierville, TN 37862, USA', 'SW Parkway', 'Summer Mathews', NULL, 2, 2, NULL, 1, 3, NULL, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '498061', '1276142', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-be-still-experience VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15FWR2HWQp3QUaHWVqF-_tm8PfVZKaXjRHwzcgsUD6Ms/edit?usp=sharing OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1Dlhq8JW1aPJJybHNu8OCkxHeHKdOmrEJ?usp=drive_link GOOGLE LINK: ', '2479', NULL, '6194', 'Owner Code: 9200 | 2nd Owner Code: 2531 | Vendor Code: 3922', 'WiFi Network: BeStill_Guest | Password: 3303Shagbark - WiFi Admin Network: BeStill3303 Password: Willow2020!', NULL, NULL, NULL, 'Knox Pest Management - +18653560465', NULL, NULL, NULL, 'Private Well', 'Gas
', '2 SPOTS
Long, Paved
No RV/trailer

', 'Firm', '25th', NULL, 'FYI:  Vehicle information SOP same with Franey 3325 (Gated community)
Rentals
Overnight rentals are allowed in Shagbark
§ All incoming guests must be registered with the HOA and will be issued a pass by the guard gate upon arrival.
§ A fee for the use of the common areas by non-owners is $10 per booking and $10 per car, collected from the cabin owner or management company.
§ For more info on setting up your cabin for rentals, please get in touch with the guard gate at (865) 428-5956 Monday through Friday, 8 AM to 4 PM, or email security@shagbarkpoa.com
'),
('86e06zy03', 'Hali Hoag 2140', 'live', 'normal', 'none', 'none', true, '2140 Eagle Feather Dr, Sevierville, TN 37876', '2140 Eagle Feather Dr, Sevierville, TN 37876, USA', NULL, 'Regina Shrout', NULL, 3, 3, NULL, 2, NULL, 2, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '142770', '1265095', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-green-sky-lodge  VRBO LINK: https://www.vrbo.com/5206500 BOOKING.COM LINK: https://www.booking.com/hotel/us/green-sky-lodge-views-hot-tub-play-area-more.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/494328 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1t1obfAFyvH0mNr2LzKoNB8lX0ybYbUvsJ-fAuNE4Cvs/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1MjFkrnmBPHsUboUglAxwC7Yv-mMPwJG1 GOOGLE LINK: ', '4175', NULL, '5974', 'Owner Code: 0006 | Vendor Code: 1447 ', 'WiFi Network: Green Sky Lodge Password: cabinlove ', NULL, NULL, NULL, 'Avada', NULL, 'HOA', NULL, NULL, 'Electric & Wood 

', '2 spots
Incline, pavement
No RV/Trailer
', 'Firm', '25th', NULL, NULL),
('86e06zxwz', 'Adam Pike 1071', 'live', 'normal', 'none', 'none', true, '1071 Scenic Hills Rd, Pigeon Forge, TN 37863', '1071 Scenic Hills Rd, Pigeon Forge, TN 37863, USA', NULL, 'Katie Work', NULL, 6, 4, NULL, 5, NULL, NULL, 2, 1, 1, 16, 10, 'Main Account', 'Haven', '494319', '1265076', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1645762345641663453?source_impression_id=p3_1775751926_P3lRQ_ZbIjhFc_Uz VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1sdWHUk8asWLa1hbW-HvTG2GhmNSJ5W0cDvsRY66htC8/edit?usp=sharing OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1NR1iN3x03DmKk_moxV_rVjBJbao6V1Ef?usp=drive_link GOOGLE LINK: ', '3582', NULL, '4271', 'Owner Code: 2981 | Vendor Code: 8155', 'WiFi Network: SpectrumSetup-3D Password: quietsteak214', 'Honeywell', NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, 'City of Pigeon Forge', 'Wood-burning
', 'Incline, pavement
5 spots
No RVs/Trailers
', 'Firm', '25th', NULL, NULL),
('86e06zxu6', 'Thom Capps 1386-114', 'live', 'normal', 'none', 'none', true, '1386 Ski View Dr #114, Gatlinburg, TN 37738', '1386 Ski View Dr #114, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', NULL, 2, 2, NULL, 1, 3, NULL, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '494315', '1265064', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-tranquility-skies VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1fWd6UwoIHpOUU36c5cgdCEassYXptsc4QunHTX97xL0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1MTMXyJtFG0DUpV4OdXptsRRtjwSjtj3Z GOOGLE LINK:', '2371', NULL, '7899', 'Owner Code: 1983 | Vendor Code: 4023', 'WiFi Network: TranquilitySkies Password: cabinlove', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, 'SCUD', NULL, 'Wood & Electric
', '2 spots, Flat, Pavement
No RVs/Trailers allowed

', 'Firm', '25th', NULL, 'FYI: Community pool - No special Access 
The pool will be open from Memorial day to Labor day. Availability hours from 9 am to 10 pm.
'),
('86e06zxqz', 'Thom Capps 542', 'live', NULL, 'none', 'none', true, '542 Johnson Ln, Gatlinburg, TN 37738', '542 Johnson Ln, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Katie Work', NULL, 4, 3, 1, 3, 2, 4, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '494265', '1265026', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1658738277575226384 VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1R_iiDL3cpRZ23q0IbTh8_PlCclR-JTHHQTTPKvKORQo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1KhQWRkUvnOf9nHAITV3qEUlqNC9otloo GOOGLE LINK:', '2719', NULL, '9721', 'Owner Code: 1983 | Vendor Code: 5883', 'WiFi Network: Avada Properties Guest Password: smokylove', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, 'SCUD', 'City of Gatlinburg', 'Gas 

', '2 spots
Flat, Pavement
No RV/trailer

', 'Firm', '25th', NULL, NULL),
('86e06zxng', 'Paul Ganev 1073', 'live', 'normal', 'none', 'none', true, '1073 Towering Oaks Dr, Sevierville, TN 37876', '1073 Towering Oaks Dr, Sevierville, TN 37876, USA', 'NW Parkway', 'Katie Work', NULL, 4, 5, NULL, 4, 1, NULL, 1, 1, 1, 9, 5, 'Main Account', 'Haven', '494274 ', '1265038', NULL, 'AIRBNB LINK: https://airbnb.com/h/picturesque-smokies-escape VRBO LINK: Not pushed yet! BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1M2VBycS6NmF0FThKa4vutVzSoU02wWdhqzgYClDfojc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/16n2QWhYKfb2L9WLJ-d8RN9GopmMVNQPh GOOGLE LINK: ', '2541', NULL, '1684', 'Owner Code: 5443 | Vendor Code: 1289', 'WiFi Network: SpectrumSetup-A5 Password: farmernorth854', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'HOA', NULL, NULL, 'Electric
', 'flat, pavement
4 spots
No RVs/Trailers allowed

', 'Firm', '25th', NULL, NULL),
('86e0645y6', 'Billie Armstrong 2915', 'live', 'normal', 'none', 'none', true, '2915 Tipi Way Pigeon Forge TN', '2915 Tipi Wy, Pigeon Forge, TN 37863, USA', NULL, 'Summer Mathews', NULL, 3, 3, 2, 2, 1, NULL, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '494261', '1265013', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-haven-cabin VRBO LINK: https://www.vrbo.com/5201248 BOOKING.COM LINK: https://www.booking.com/hotel/us/new-build-smokies-haven-w-hot-tub-games-more.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/494261  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1CGsRJ0Nf2r6Gj1jqtp35gcp_DafxZSvtl9Pqh5-g-tM/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1EEdrCDEgxsDm-Ouq2bOIYXtXpd8NUTZK GOOGLE LINK: ', '3759', NULL, '8711', 'Owner Code: 0265 | Vendor Code: 6635', 'WiFi Network: Black Sheep Password: 99forOne', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, 'HOA', 'Electric
', 'Flat, Brick
2 spots
No RVs/Trailers

', 'Firm', '25th', NULL, 'As of Apr 8, 2026:
This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 
'),
('86e01ruzr', 'Cale Hanie 6617', 'live', 'normal', 'none', 'none', true, '6617 Old Walland Hwy Townsend, TN 37882', '6617 Old Walland Hwy, Townsend, TN 37882, USA', NULL, 'Katie Work', NULL, 3, 2, 1, NULL, 3, NULL, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '491503', '1255496', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1634775013960156494?source_impression_id=p3_1774272944_P3OD49ge0erowMGb VRBO LINK: https://www.airbnb.com/rooms/1634775013960156494?source_impression_id=p3_1774272944_P3OD49ge0erowMGb BOOKING.COM LINK: https://www.booking.com/hotel/us/townsend-charm-river-view-historic-log-cabin.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/491503 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1j1fiTZrxOuHMV9hT0BxZIXJ3NO92mfIPFlvRLkDBbfk/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1IBT2E0tTtGsXhtXbBPCY1ERy0R4PzsT5?lfhs=2 GOOGLE LINK: https://www.google.com/travel/hotels/s/5n5xcTDS5Mf2dPg89', '5281', NULL, '7341', 'Owner Code: 0010 | Vendor Code: 5027', 'WiFi Network: LittleRiver6617_2GEXT | Password:Sierra6617', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, 'Tuckaleechee Utility', '1
', '2 slots
Gravel
No RV/Trailer
', 'Firm', '25th', NULL, NULL),
('86e00vrxb', 'Travis Anders 1437', 'live', 'normal', 'none', 'none', true, '1437 Twin Rock Dr, Sevierville, TN 37862', '1437 Twin Rock Dr, Sevierville, TN 37862, USA', 'SE Parkway', 'Lily Bryant Macon', NULL, 4, 3, 1, 3, 1, NULL, NULL, 1, 1, 9, 5, 'Main Account', 'Haven', '491160', '1254063', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1635616669951283574?source_impression_id=p3_1773408548_P3Est1oOpvkouhhe VRBO LINK: https://www.vrbo.com/5149925?dateless=true  BOOKING.COM LINK: https://www.booking.com/hotel/us/smokies-twin-rock-views-game-room-hot-tub-more.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/491160 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1L8IJXxxDmucSWRoDZ4z3Oo4-__xyNLVJ-VmWCZuvIBM/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1ICvCU2xcM_Lqi3mFXuvGnbGGUT6wdrWO GOOGLE LINK: ', '5281 ', NULL, '4673', 'Owner Code: 5961 |  Vendor Code: 2151 ', 'WiFi Network: Peaceful Views Password: smokymt1437', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, '1
', '2 Spots Allowed
Slight incline, Pavement
No RV/Trailer

', 'Firm', '25th', NULL, NULL),
('86dzqh56a', 'Nathan Frame 4530', 'live', 'junior', 'none', 'none', true, '4530 Stackstone Rd, Sevierville, TN 37862', '4530 Stackstone Rd, Sevierville, TN 37862, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 2, 2, 0, 1, 4, 1, NULL, 1, 1, 12, 7, 'Main Account', 'Haven', '485969', '1242146', NULL, ' AIRBNB LINK: https://airbnb.com/h/perfect-smokies-escape VRBO LINK: https://www.vrbo.com/5104076 BOOKING.COM LINK: https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/home.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/485969 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1kr9-7SXaMGMFMGdaMWOY8qWYqM0GKxPfiDQUfRlO5OI/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1-tcdP8lvj2f9mlbweUWdQRIyiq2MbUo9 GOOGLE LINK: https://www.google.com/travel/hotels/s/ZHEf4WHzoADNcJ3K9', '5293', NULL, '0', 'Fixed Code: 9742', 'Wifi Network: Peacefulretreat1 Password: Relaxinthetrees1', NULL, NULL, NULL, 'Waynes', NULL, NULL, NULL, 'Well', 'Electric
', '2 spots
incline, pavement
No RV/Trailer

', 'Firm', '25th', NULL, NULL),
('86dzq17ua', 'Richard Nevels 3286', 'live', 'normal', 'none', 'none', true, '3286 Caywood Rd, Dandridge, TN 37725', '3286 Caywood Rd, Dandridge, TN 37725, USA', 'Dandridge', 'Summer Mathews', NULL, 3, 3, 1, 2, 1, 2, 1, 1, 1, 9, 5, 'Main Account', 'Haven', '485771', '1240443', NULL, 'AIRBNB LINK: https//airbnb.com/h/hill-top-retreat-jc VRBO LINK: https://www.vrbo.com/5104073  BOOKING.COM LINK: https://www.booking.com/hotel/us/hill-top-retreat-lake-sauna-hot-tub-mtn-view.en-gb.html?label=gen173nr-10CAso7AFCLGhpbGwtdG9wLXJldHJlYXQtbGFrZS1zYXVuYS1ob3QtdHViLW10bi12aWV3SAlYBGi0AYgBAZgBM7gBB8gBDNgBA-gBAfgBAYgCAagCAbgC2KjQzQbAAgHSAiQ0M2VhOWFmMC1hODQ3LTQyMDktYmY1Ny0wM2Q4YjcyNzQ3MWHYAgHgAgE&sid=233347f76fe764bc62628c3b29096cc1&dist=0&keep_landing=1&sb_price_type=total&type=total&chal_t=1773409369171&force_referer=  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/485771  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Kh868nHsvEySZ5XGS93c7c8fc3PuE-RwvbnOn-hlfXI/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/14NtoEh0eR_grFjSRYH7X35MlbUghqSiK GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQmZyj1O2b1Pr6ARAC/overview?g2lb=43807868', '3860', NULL, '7942', 'Owner Code: 9875 | Vendor Code: 0866', 'Wi-Fi Name: Hilltop2-5G Network Password: retreat3286 ', NULL, NULL, NULL, 'Valley Pest', NULL, 'Wright Way Mowing', NULL, 'AWS Water Systems', NULL, '3
', 'Firm', '25th', NULL, '20% at 1 year
FYI: first month to be at 5% commission

As of Mar 16, 2026:
Fishing is allowed but they need to comply with TN state laws and get a permit through wild life office. 
'),
('86dzpttvb', 'Katie Smith 2880', 'live', 'normal', 'none', 'none', true, '2880 Pine Haven Drive, Sevierville, TN 37862', '2880 Pine Haven Dr, Sevierville, TN 37862, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 3, 3, 1, 2, 2, 2, NULL, 1, 1, 10, 6, 'Main Account', 'Haven', '485560', '1240440', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-mountain-majesty VRBO LINK: https://www.vrbo.com/5126157 BOOKING.COM LINK: https://www.booking.com/hotel/us/mountain-majesty-views-hot-tub-games-theater.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/485560 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15L-eTPwLM5eeZ1r-Bx3Swbbrn9BdPO7I6kvczlnXTBM/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1TgDa41IQ21MLdmkerYv1JBqQwMvXmw1A GOOGLE LINK: https://www.google.com/travel/hotels/s/hYL8H5eov2vUaXgu8', '4183', NULL, '0329', 'Owner Code: 1746 |  Vendor Code: 8834', 'Wi-Fi Name: Inn For A Hoot 2.4 GHz | Password: Relaxandfun', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Electric

', '2 spots
 incline, concrete
No RV/Trailer

', 'Firm', '25th', NULL, '20% at 1 year. 5% commission for their first 30 days 

'),
('86dzpq0gq', 'Richard Wright 810', 'live', 'normal', 'none', 'none', true, '810 Great Smoky Way, Gatlinburg, TN 37738', '810 Great Smoky Way, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Summer Mathews', NULL, 6, 5, NULL, 4, 2, NULL, 2, 1, 1, 14, 8, 'Main Account', 'Haven', '485423', '1240436', NULL, 'AIRBNB LINK: https://airbnb.com/h/lookout-lodge-gatlinburg VRBO LINK: https://www.vrbo.com/5146865 BOOKING.COM LINK: Not pushed yet!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/480709  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1LAh3T99t5zl5uRGg0UjhE88BBaGqaJ1Xrky7DqavYJM/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1v-Xn1qKhojIHnug6f4WkAmHP5Fn1ALCl GOOGLE LINK: ', '2834', NULL, '6372', 'Owner Code: 3130 | Vendor Code: 0454', 'Wi-Fi Name: Lookout Lodge  | Password: lookout810', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Electric
', '2 spots
incline, pavement
NO RV/Trailer

', 'Firm', '25th ', NULL, '20% at 1 year 

'),
('86dzn555v', 'Rebecca Eisenback 1152', 'live', 'normal', 'none', 'none', true, '1152 Fawn Hollow TrailTownsend, TN 37882', '1152 Fawn Hollow Trail, Townsend, TN 37882, USA', 'Wears Valley/Little Cove', 'Summer Mathews', NULL, 3, 2, NULL, 1, 5, 1, 1, 1, 1, 13, 7, 'Main Account', 'Haven', '484372', '1238613', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-mountain-top-getaway  VRBO LINK: https://www.vrbo.com/5106346  BOOKING.COM LINK: Not pushed yet!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/484372  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Xd2v0E0n3k2TOoSt5hLbFWPm0vJu3Zn6VLoDHNNuMDQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1G7ko2os2plZ8Z6QGhlF58lbTAJt6qb2L GOOGLE LINK: https://www.google.com/travel/hotels/s/PPL3uJh8A9tUavE2A', '4039', NULL, '6478', 'Owner Code: 2999 | Vendor Code: 2087', 'Wi-Fi Name: Netgear49 | Network Password: greenunit685', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Wood

', '5 spots
Paved
No RV/trailer

', 'Firm', '25th', NULL, 'As of Apr 13, 2026:
Please note that it is a low-producing well. No vendors should be sent for any reports about low water pressure.

Starting April 1:
New Gate code: 7319


FYI: Community Pool: 
It is located at 4005 Tomahawk Way, Sevierville, TN 37862 - Honey Suckle Meadows pool

As of Feb 27, 2026: 
Owner has their own lawn care.


'),
('86dzn54wv', 'Su-Tang Lo 4005', 'live', 'normal', 'none', 'none', true, '4005 Dolly Dr Unit 51, Sevierville, TN 37876', '4005 Dollys Dr #51, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Katie Work', NULL, 3, 1, 1, 2, 1, NULL, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '484286', '1238611', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1635507235764990496?source_impression_id=p3_1773410262_P3cKeTxUuHpFbsi_ VRBO LINK: https://www.vrbo.com/5149924?dateless=true BOOKING.COM LINK: https://www.booking.com/hotel/us/dollys-outdoor-oasis-hot-tub-sauna-more.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/484286 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/11u-u3i90SR90cuzo44PjJGm8O7Vi-wi-SqWvb3p81rk/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1bR2P-O5kcdsoAsC0Ji-oSmG7081zyIgH GOOGLE LINK: ', '6289', NULL, '3761', 'Owner Code: 4670 | Vendor Code: 6659', 'WiFi Network: Dolly Password:4005Dollys', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, '1
', '3 slots
Incline, Concrete
No RV/Trailer
', 'Firm', '25th', NULL, '20% at 1 year

As of Mar 9, 2026: 
This owner has his own handyman. His name is Josh 865-805-2438. "If the propane for the fire pit needs to be filled, we will need to call Josh. Please add a disclaimer that he does a bunch of other handyman tasks here so owner approval is needed first before we send our team" 
'),
('86dzfq0tq', 'Laura Gill 327-304', 'live', 'normal', 'none', 'none', true, '327 W Summit Hill, unit 304, Knoxville, TN 37902', '327 W Summit Hill Dr SW #304, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', NULL, 2, 1, NULL, 1, NULL, NULL, 1, 1, NULL, 5, 4, 'KnoxStaytion Account', 'KnoxStaytion', '480709', '1231378', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1630456089159613689?source_impression_id=p3_1772224463_P3aSJGA11YheEtsZ VRBO LINK: https://www.vrbo.com/5146879 BOOKING.COM LINK: https://www.booking.com/hotel/us/new-construction-1br-condo-downtown-knoxville.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/480709 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Rt-oK_egwhf6WgrJTSAkiT1cmitpH1e9EzFIWDriKeo/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1SdyrN9L17W3ye8I7cSGeaaCR3UTO_PXq?usp=drive_link GOOGLE LINK:  https://www.google.com/travel/hotels/s/WfJyBHL5364rmQiK6', '3725', NULL, '0', NULL, 'WiFi Network: Lone Pass 304 Password: Knoxville!', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, '1 spot in Crown Plaza parking garage
No RV/Trailer

', 'Firm', '25th', NULL, '18% @ 1 year

Parking Pass- it is hanging inside the door when you enter the unit it is on the wall to the right by the office

'),
('86dzbhz4f', 'Laura Earl 1117', 'live', 'top', 'none', 'none', true, '1117 Towering Oaks Drive, Sevierville, 37876', '1117 Towering Oaks Dr, Sevierville, TN 37876, USA', 'NW Parkway', 'Summer Mathews', NULL, 3, 4, 0, 2, 2, NULL, 2, NULL, 1, 12, 7, 'Main Account', 'Haven', '478090', '1224655', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1623995278382109591?source_impression_id=p3_1772459652_P3YI563zVnZ4oE8a VRBO LINK: https://www.vrbo.com/5146871 BOOKING.COM LINK: https://www.booking.com/hotel/us/perfect-cabin-in-paradise-hot-tub-pool-games.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/478090 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1n1c9NPu3COSA3QiZ7UoaX7iphqMKKcQo1HnIvprjnSQ/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/15b8UaiVkztFSC-oqbJKxuPyAhVutIH60?usp=drive_link GOOGLE LINK: https://www.google.com/travel/hotels/s/x9K4roXhPi1BXqAR6', '5184', NULL, '4903', 'Pool Room: 1117 | Pool Maintenance doors: 1088', 'Wi-Fi Name: SpectrumSetup-BF | Password: elkspringsresort', NULL, NULL, NULL, 'Elk Spring', NULL, NULL, NULL, NULL, 'Yes
', '4
RV or trailer parking in parking lot by resort swimming pool
', 'Firm', '25th', NULL, '20% at 1 year. FB Deal

As of Mar 16, 2026:
Wahoo Ziplines offers discounts to guests. Simply use the promo code on the magnet on the fridge when purchasing tickets online, or show confirmation of your booking when purchasing in store.  

FYI: The property owner requests that the pool be covered when not in use to help manage moisture and improve energy efficiency. While it is understood that most guests may not follow this practice, it is expected that the pool will be covered shortly after check-out and remain covered until the next guest uses it. Additionally, the property owner is interested in implementing other energy-efficient practices, which can be discussed at a later time.



'),
('86dz9hwuz', 'Bonnie Olsten 317', 'live', 'junior', 'none', 'none', true, '317 Saddleback Way, Sevierville, TN 37862', '317 Saddleback Way, Sevierville, TN 37862, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 2, 2, NULL, 2, NULL, NULL, NULL, 1, NULL, 8, 4, 'Superhost Account', 'Superhost', '476929', '1222496', NULL, 'AIRBNB LINK: https://airbnb.com/h/spacious-family-getaway VRBO LINK: https://www.vrbo.com/5151879?dateless=true BOOKING.COM LINK: https://www.booking.com/hotel/us/a-dolly-good-time-with-fireplace-and-game-room.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/476929 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1WEUUG_LUZtKV1nfY9usYUJotT7lIDz_OScr1sWaCthY/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1mvWvi-OEIeOeI9aU67OYnBE1yilsodj6 GOOGLE LINK: https://www.google.com/travel/hotels/s/S12ZUDvLyTYYTrsj9', '3628', NULL, '7319', 'Owner Code:  2870 | Vendor Code: 3682', 'WiFi Network: DollyGoodTime Password: CabinTime4819', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'HOA', 'SCUD', NULL, '1
', '2 spots allowed
Flat, Concrete
No RV/Trailer

', 'Firm', '25th', NULL, '20% at 1 year
FYI: We have the pool key. We typically leave it on a shelf by the front door. There is a cost of $50 to replace it. No sleeping allowed in the game room per fire department.

Community Pools:
Community Pool is seasonal. The hours are 10 am to 8 pm. Only guests of A Dolly Good Time are allowed. No additional guests. The HOA requests that guests put back any moved furniture and lower umbrellas. There is No Smoking at the pool and there is no lifeguard.
'),
('86dz79v1a', 'Jason Barton 750', 'live', 'normal', 'none', 'none', true, '750 Ellis Ogle Road Gatlinburg, TN 37738', '750 Ellis Ogle Rd, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', NULL, 3, 2, NULL, 1, 3, NULL, 5, 1, 1, 13, 7, 'Main Account', 'Haven', '475435 ', '1216103', NULL, 'AIRBNB LINK: airbnb.com/h/smokies-bearpoint-meeting-place VRBO LINK: https://www.vrbo.com/5086378  BOOKING.COM LINK: https://www.booking.com/hotel/us/bear-point-the-meeting-place-w-hot-tub-games.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40681919 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/475435  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1dPoT18Y2ixiAm4FjKB5Oib_YomNdKevH-vVnXPgT2js/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1asAXmcksecSDvc2gxvKl7OYxxamY6WNT GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQjMOLgPH33cDLARAC/overview', '5923', NULL, '4180', 'Owner Code: 5465 | Vendor Code: 0464', 'Wi-Fi Name: The Meeting Place | Password: meeting1', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'Brad Whaley', NULL, NULL, NULL, '3 spots
Flat, pavement
No RV/Trailer

', 'Firm', '25th ', NULL, '20% at 1 year. 
Did our first 30 day free deal
'),
('86dz5f1hd', 'Rob Byun 2013', 'live', 'normal', 'none', 'none', true, '2013 Myrtle Way, Pigeon Forge, TN 37863', '2013 Myrtle Wy, Pigeon Forge, TN 37863, USA', 'SE Parkway', 'Summer Mathews', NULL, 5, 5, 1, 5, 2, 1, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '474437', '1214798', NULL, ' AIRBNB LINK: https://airbnb.com/h/smoky-dream-lodge  VRBO LINK: https://www.vrbo.com/5080620 BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-dream-lodge-heated-pool-hot-tub-games.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/474437  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1xYMBdsDWKhAJvg-wgnf_vvYaQYTTu80N43paAO0RlqE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1BF7sktOph8LPq332__bohTXjUKJXTA9n GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ4vLapuz6nb2KARAC/overview', '4693', NULL, '1568', 'Owner Code: 5415 | Vendor Code: 0149 | Cleaner code: 9700 | Maint code: 0097', 'Direct Wifi: WiFi Network: Smoky Dream Lodge Password: 9to5Dolly', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'electric

', '3 spots
No RV/trailer
flat, pavement

', 'Firm', '25th', NULL, 'FYI: This owner will be at 15% commission. First month of management free.
Signed up for our value plan. So first month is free. 

FYI:  We allow a maximum of 2 housebroken dogs (under 40 lbs each). $175 PET PET PER STAY

As of Feb 27, 2026:
Per owner, lawn care is provided by HOA. 

'),
('86dz4z7v3', 'Derek Trainer 1687', 'live', 'normal', 'none', 'none', true, '1687 Zurich Rd Gatlinburg, TN 37738', '1687 Zurich Rd, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Regina Shrout', NULL, 2, 2, NULL, 2, 1, NULL, NULL, 1, 1, 6, 4, 'Superhost Account', 'Superhost', '473977', '1213997', NULL, 'AIRBNB LINK: airbnb.com/h/smokies-locklyns-loft  VRBO LINK: https://www.vrbo.com/5069985  BOOKING.COM LINK: https://www.booking.com/hotel/us/locklyns-loft-views-hot-tub-game-room-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40735638  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/473977  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ATumcweb98MdHmEaNsjcNNNgN_gaekXvF9JTzR-iVc8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1HTC6Z9ioMNdxde6itv2F6oTcguCEIJKQ GOOGLE LINK: https://www.google.com/travel/hotels/s/kNsGbVkLfcB4yp7X6', '1032', NULL, '5738', 'Owner Code: 5860 | Vendor code: 3984', 'DIRECT WIFI: Wi-Fi Name: Locklyns Loft | Password: chillyball622', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Gas

', '3 spots
incline, pavement
No RV/Trailer

', 'Firm', '25th ', NULL, 'FYI: first month is Free. 

***PLEASE NOTE: DO NOT CHANGE THIS CABIN''S LISTING NAME AS PER THE OWNER''S REQUEST. **

COMMUNITY POOL INFO: (Chalet Village)
Guests have access to the 3 community pools & clubhouses, tennis courts & playground!
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September
 
***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.
 
South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.
 
Chalet Village Office Address: 1319 south baden drive


'),
('86dz4pup3', 'Ken Brown 510', 'live', 'normal', 'none', 'none', true, '510 Hoot Owl Way, Gatlinburg, TN 37738', '510 Hoot Owl Way, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 4, 3, NULL, NULL, 3, 1, 1, 1, NULL, 9, 5, 'Superhost Account', 'Superhost', '473518', '1212618', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-bear-trax  VRBO LINK: https://www.vrbo.com/5069974 BOOKING.COM LINK: https://www.booking.com/hotel/us/bear-trax-retreat-fireplace-grill-arcade.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40735636  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/473518  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1VAvBq8EEN_4ry0i8QAwmPoUwop8XYzdf22hOen40_r4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1iwm7Hq-DXqVrt6WQHRfFSftDDVrPTqA1 GOOGLE LINK: ', '4827', NULL, '5586', 'Owner Code: 0369 | Vendor Code: 0124', 'Direct WIFI: Wi-Fi Name: 510 Hoot Owl Network Password: quicktiger055', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Gas
', '3 spots
No RV/Trailer
Incline, concrete

', 'Firm', '25th', NULL, 'FYI: PLEASE DO NOT CHANGE THE LISTING NAME AS PER THE OWNER''S REQUEST. TY!

Community Pool - Mountain Shadows Resort - HOA has pool 2 doors up from the cabin. No pass or code required.
'),
('86dz4puj2', 'Sharon Holderman 1523', 'live', 'normal', 'none', 'none', true, '1523 Sky View Dr, Sevierville, TN 37876', '1523 Sky View Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 2, 1, 1, 2, NULL, NULL, NULL, 1, 1, 4, 2, 'Superhost Account', 'Superhost', '473513', '1212616', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-eagle-sky-view VRBO LINK: https://www.vrbo.com/5069972  BOOKING.COM LINK: https://www.booking.com/hotel/us/eagle-sky-view-peaceful-cozy-with-hot-tub.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40735634  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/473513 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1caV-k98jzGg38vyUU8Y2tKSbaTJWPtxordc8HONty9k/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1x_EKZ4gJ7VBiZNBfdkCHJ7qxpX93-UJu GOOGLE LINK: https://www.google.com/travel/hotels/s/UMQBgKdzFC6xMmT66', '1296', NULL, '2104', 'Owner Code: 5348 | Vendor Code: 0184', 'Wi-Fi Name: Relax&Enjoy | Password: 1523Welcome!', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Gas
', '3 spots
incline, Pavement
No RV/Trailer

', 'Firm', '25th', NULL, '18% 
'),
('86dyxgxhk', 'Raju Kalidindi 2685', 'live', 'normal', 'none', 'none', true, '2685 S Clear Fork Rd, Sevierville, TN 37862', '2685 S Clear Fork Rd, Sevierville, TN 37862, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 5, 3, NULL, 1, 5, NULL, 2, 1, 1, 14, 8, 'Superhost Account', 'Superhost', '467671', '1199221', NULL, ' AIRBNB LINK:  https://airbnb.com/h/smokies-mountain-serene  VRBO LINK: https://www.vrbo.com/5049197  BOOKING.COM LINK:https://www.booking.com/hotel/us/serene-mountain-cabin-hot-tub-2fireplace-grill.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40732176  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/467671 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1z33OnKEcRkgBlNe6KuPs9IOQVHn-to3FHIuKiCF7xYo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/13f2P-VsV8yayRGAmizYkwPc5f-9iI1IO GOOGLE LINK: ', '4751', NULL, '7533', 'Owner Code: 6703 | Vendor code:  6956', 'Wi-Fi Name: Viasat-24 | Password: jfa1snj950vruqlg', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'Handled by Owner', NULL, NULL, 'Gas & electric


', '2 spots
No RV/Trailer
Steep, Pavement

', 'Firm', '25th', NULL, '18% for 1 year

• We only allow a maximum of 2 pets, a maximum of 50 pounds each. We charge a $75 pet fee per pet. Also pets are not allowed on the furniture, must be potty trained, and must be kenneled when left at the property alone.

'),
('86dyuy38h', 'Duane Reeder 136', 'live', 'normal', 'none', 'none', true, '136 Little Round Top Ln, Townsend, TN 37882', '136 Little Round Top Ln, Townsend, TN 37882, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 4, 3, NULL, 2, 2, 1, 2, 1, 1, 11, 6, 'Superhost Account', 'Superhost', '466115', '1192025', NULL, 'AIRBNB LINK: airbnb.com/h/above-the-clouds-smokies  VRBO LINK: https://www.vrbo.com/5049199  BOOKING.COM LINK: https://www.booking.com/hotel/us/above-the-clouds-views-hot-tub-grill-games.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40732178  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/466115  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1pKeIUbVjAEB6bY7KKlofS-8DUGz-eE2aOpC5i8kLqPo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/15wr1X3SjtKkjEwdkrUTo9v4TgYXn7818 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ3Mrmys7AzpVuEAI=/overview?g2lb=43807868', '1117', NULL, 'Front Door, main floor back door, Downstairs Door: 7816 ', 'Owner Code: 0758 | Vendor Code: 4549 | Special Codes: Upstairs bedroom crawl space/ small storage-> looking at window Left 0409 Right 0975 Garage door - inside: 2012 Hot tub lock combo: 925', 'Direct Wifi: WiFi Network:136 LRTL Password:136E1013', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, 'Well', 'Wood

', '3 spots
No RV/Trailer
Incline, pavement

', 'Firm', '25th', NULL, 'Entry Instructions:
Entry to the cabin is from the lower parking area. Guests will need to walk up the exterior stairs to the upper deck, where the main entrance is located facing the valley.
Please note: The lower level (1 bedroom, game room, laundry room, and bathroom) has a separate exterior entrance. It is not accessible from the main upper level interior and requires going outside and down the exterior stairs to enter.
'),
('86dyuu4td', 'Jake Cowley 745', 'live', 'normal', 'none', 'none', true, '745 Golf View Blvd Pigeon Forge, TN 37863', '745 Golf View Blvd, Pigeon Forge, TN 37863, USA', NULL, 'Lily Bryant Macon', NULL, 2, 2, 1, 1, 2, NULL, 2, 1, 1, 8, 4, 'Superhost Account', 'Superhost', '465445', '1190099', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-whisperwood-lodge VRBO LINK: https://www.vrbo.com/5049198 BOOKING.COM LINK: https://www.booking.com/hotel/us/whisperwood-lodge-hot-tub-arcade-2fireplace.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40675537 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/465445  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/16q9zWtfNkjot4VIbfZ7PrcfHTmIxrlMMoRJTFd2Fif4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Xl5lSGhOdxkk0F9g0GIupKYi5eVzNKDB GOOGLE LINK: ', '0528', NULL, '8046', 'Owner Code: 0102 | 2nd Owner Code: 2525 |  Vendor Code: 1824  ', 'Direct Wifi: WiFi Network:745-Golf View Password: WeLove5*Reviews', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, '2 Gas
', '2 spots
No RV/trailer
Concrete, Incline

', 'Firm', '25th', NULL, 'Community Pool - Golf View resort which has an indoor and outdoor pool. Available all year. No passes needed. 
'),
('86dyuu2mv', 'Annie Wang 904', 'live', 'normal', 'none', 'none', true, '904 Autumn Ridge Way, Sevierville, TN 37876', '904 Autumn Ridge Way, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 3, 3, 1, 3, 1, NULL, NULL, 1, 1, 8, 4, 'Superhost Account', 'Superhost', '465438', '1190095', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-peakview-retreat VRBO LINK: https://www.vrbo.com/5029817 BOOKING.COM LINK: https://www.booking.com/hotel/us/peak-view-retreat-spacious-hot-tub-game-room.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/465438  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/18TIDr_r_jZzeM3vgSiPjhoTHdA4AXGXq5vKxh6DMUMA/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/13NQ_i7e96nj9T-7lLgCzrIZE4WT4mhm2 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQm4C8psn_o4EIEAI=/overview?g2lb=43807868', '2175', NULL, '0', 'gate code: 6753 Crawl space: 9002', 'Direct Wifi: WiFi Network: Cabin On The Hill Password: MyVacation904  2.4g Name: Cabin On The Hill 2.4 Password: MyVacation904', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, 'Amerigas', 'Private well', '2 Gas 
', '5 spots
No RV/Trailer

', 'Firm', '25th ', NULL, 'Unit door code: 4379

'),
('86dyprmb5', 'Jeff Albaum 215', 'live', 'normal', 'none', 'none', true, '215 Tree Frog Trce, Townsend, TN 37882', '215 Tree Frog Trce, Townsend, TN 37882, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 4, 3, NULL, NULL, 4, NULL, 2, 1, 1, 10, 6, 'Superhost Account', 'Superhost , Haven', '461618', '1177605', NULL, 'AIRBNB LINK: https://airbnb.com/h/woodview-hideaway VRBO LINK: https://www.vrbo.com/5021704 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-woodview-hideaway-hot-tub-game-room-more.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/461618  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/19w8pnb6-2InXHJgsOtegTDvabUPoT5h6-QQzB8bYfeA/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1DJLQ1RZtWa_hyrByRaAhy4RaETftRK-c GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQiqCx2q2XjeVGEAI=/overview?g2lb=43807868', '2623', NULL, '7349', '7349', 'Network Name: TreeFrog Password: TreeFrogGuest', NULL, NULL, NULL, 'Thomas Pest Control', NULL, NULL, NULL, NULL, 'Propane

', '4 spots
 long flat pavement
No RV/Trailer

', 'Firm', '25th ', NULL, NULL),
('86dyha7y2', 'Lindsey Burch 110-A', 'live', 'key', 'none', 'none', true, '110 S Central Street, Knoxville, TN 37902', '110 S Central St, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', NULL, 2, 1, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', 'KnoxStaytion', '457025', '1169314', NULL, 'AIRBNB LINK: https://airbnb.com/h/knoxville-old-city-loft VRBO LINK: https://www.vrbo.com/5104062  BOOKING.COM LINK: https://www.booking.com/hotel/us/old-city-loft-knoxville.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://www.booking.com/hotel/us/old-city-loft-knoxville.html  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1pGlA-HYdwY5DcLrHI1MubN_fz3iRF9X8pmKTmHGt53o/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1VQKRJfHRz8MB6ol9gUf94sCxjMb22b4y GOOGLE LINK:   https://havenvacationrentals.slack.com/archives/C039D68A35X/p1775076485992019?thread_ts=1775073224.535299&cid=C039D68A35X', '2106', NULL, '5713', 'Street Entrance Yale: 9304 | Vendor code: 1753 | Owner Code: 0237', 'Wi-Fi Name: The OC 110 | Password: EastTenn1!', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, 'Street or Public Parking 
', 'Firm', '25th', NULL, NULL),
('86dyha7wt', 'Lindsey Burch 110-B', 'live', 'key', 'none', 'none', true, '110 S Central Street, Knoxville, TN 37902', '110 S Central St, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', NULL, 1, 1, NULL, NULL, 1, NULL, NULL, 1, NULL, 2, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '457014', '1169311', NULL, 'AIRBNB LINK:  https://airbnb.com/h/knoxville-central-loft VRBO LINK: https://www.vrbo.com/5104063  BOOKING.COM LINK: booking.com/hotel/us/the-luxe-loft-knoxville.en.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://www.booking.com/hotel/us/the-luxe-loft-knoxville.html  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1NSkPCZ6MeFP1gYx-jIl2g9qxyNMDYDOvbZaMAY1SR_Q/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1f9qSTc-7ECbZoStMZt_ozVrLELIH0ChF GOOGLE LINK:', '7283', NULL, '3794', 'Owner Code: 0237 | Vendor Code: 3656 | Street Entrance Yale: 9304', 'Wi-Fi Name: The OC 110 | Password: EastTenn1!', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, '1 spot
Street or Public Parking

', 'Firm', '25th ', NULL, 'Installed Yale lock on the Unit doors and Street entrance.
Yale lock entry code: 5713 (the only code that works for the past guest''s stay)
Lockbox code: 7283 (located near the street door) 
Street Entrance Yale: 9304


'),
('86dyfm49g', 'Siobhan Belgiovene 1820', 'live', 'junior', 'none', 'none', true, '1820 Beach Front Dr Sevierville, TN 37876', '1820 Beach Front Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 2, 2, NULL, 1, 1, 2, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '454793', '1162815', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-little-woods-cabin VRBO LINK: https://www.vrbo.com/5049196 BOOKING.COM LINK: https://www.booking.com/hotel/us/little-woods-cabin-family-friendly-with-games.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40732174 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/454793  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1SefKSb9q33NjhT-bRdnR218Ba3KxpNzjlHqlP9F1Qss/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1S1r6_inEsu0VqAMK3GE6RKMv8VygDppz GOOGLE LINK: ', '3528', NULL, '9104', 'Owner Code: 3762 | Vendor Code: 6321', 'Wi-Fi Name: SpectrumSetup-21 | Password: pinksquirrel867', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, 'Marsh', 'Shared well', 'Gas
', '3 spots
No RV/Trailer
Incline, Pavement, 4x4 needed in winter

', 'Firm', '25th', NULL, '20% at 1 year

'),
('86dyfm477', 'Raman Gurai 1118', 'live', 'key', 'none', 'none', true, '1118 Eagle Pointe Way, Pigeon Forge, TN 37863', '1118 Eagle Pointe Way, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', NULL, 5, 5, NULL, 4, 3, NULL, NULL, 1, 1, 14, 8, 'Superhost Account', 'Superhost', '454800', '1174706', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-wedded-nest VRBO LINK: https://www.vrbo.com/5007045  BOOKING.COM LINK: https://www.booking.com/hotel/us/the-wedded-nest-views-huge-hot-tub-game-room.html!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/454800  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1cKTaDI3Q1IUHUycfKS5KR4Qd2GJaZTmVOKp_E1dmza4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/19Sxl5yvWPSnC-ezr5l9V2pxOJjQoFHbb GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQyNTm3ojlqd9BEAI=/overview?g2lb=43807868', '9445', NULL, '3496', 'Owner Code: 9642 | Vendor code: 3650', 'Wi-Fi Name: A Grand View Network | Password: AGrandView1118', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'Brad Whaley', NULL, NULL, 'Gas

', '6 spots
no rv/trailer
incline, pavement

', 'Firm', '25th ', NULL, '18% at 1 year

FYI: This property is recommend lodging with Magnolia Venue who is close by to this cabin. We will likely get a lot of wedding stays at this property. Please note this partnership in the listing description and in SuiteOp. This is the venue''s website
  
Our point of contact at the venue is Macey Conwell
T H E M A G N O L I A
865-213-2309
www.themagnoliavenue.com
info@themagnoliavenue.com
'),
('86dye657c', 'Sarah Pearce 2622', 'live', 'normal', 'none', 'none', true, '2622 Raccoon Hollow Way Sevierville, TN 37862', '2622 Raccoon Hollow Way, Sevierville, TN 37862, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 3, 2, 1, 1, 2, 2, NULL, 1, 1, 9, 5, 'Main Account', 'Haven', '453233', '1158508', NULL, ' AIRBNB LINK: https://airbnb.com/h/high-cotton-smokies VRBO LINK:  https://www.vrbo.com/5007051  BOOKING.COM LINK: https://www.booking.com/hotel/us/high-cotton-epic-views-hot-tub-pool-table.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40664205 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/453233  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Kz8KGmK8QZpOSbs6Ph-Di0mSAfBRk-lfSjF8cuaS03I/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1d75nOuUr_iAfCp5SAaIZNGJt-At2CWBI GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ-uO24MrqqeDIARAC/overview?g2lb=43807868', '4513', NULL, '7249', 'Owner Code: | Vendor Code: ', 'Wi-Fi Name: High Cotton | Password: cabin123', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'ELECTRIC

', '3 spots
Steep, pavement
No RV/Trailer

', 'Firm', '25th', '86dxmbcx4', 'Confirmed season passes for Honeysuckle Meadows

1 year contract signed 

As of Dec 3, 2025:
Xfinity details:  
Account Number: 8396 50 045 0035666
Name: Neil Stevenson 

 
'),
('86dydprk3', 'Haven/Blessed/Tendwell Facility', 'live', NULL, 'none', 'none', false, '1308 Ownby CirSevierville, TN 37862, USA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Door: 2688 | Front Office: 4366 | Key/Linen Room: 2024', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('86dya1yyq', 'Laurie Keenan Combo 2587/2589', 'live', 'normal', 'none', 'none', true, '2587 & 2589 Windfall Estates Sevierville, TN 37876', NULL, NULL, 'Regina Shrout', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12, 7, 'Main Account', 'Haven', '449759', '1148042', NULL, 'AIRBNB LINK: https://airbnb.com/h/2cabins-whiskey-stone-and-barrel VRBO LINK: Not pushed yet! BOOKING.COM LINK: https://booking.com/hotel/us/whiskey-duo-2-cabins-sidebyside-hottubs-firepit.en.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40657190 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/449759 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1mVMxA5xJm8vASlEtPU3HgHIXmU19tHFdFXMwF7mtmVg/edit?usp=drive_web&ouid=112043874674402029607 OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/12F7FPnQUo5njKU3MXVTt78pd-Z6oollp GOOGLE LINK: https://www.google.com/travel/hotels/s/ubj3H2brZ4xPVMhe9', '2587 (7148) & 2589 (2905)', NULL, '0', NULL, 'DIRECT WIFI > CABIN 2589:  WiFi Network: WhiskeyBarrel Password: WhiskeyBarrel25 CABIN 2587: WiFi Network: WhiskeyStone Password: WhiskeyStone25', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, 'Electric 

', 'total of 4 spots for these 2 properties
No RV/trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dy7u7gv', 'Patrick Hurd 1825', 'live', 'normal', 'none', 'none', true, '1825 sunnydale dr sevierville tn 37862', '1825 Sunnydale Dr, Sevierville, TN 37862, USA', 'SE Parkway', 'Katie Work', NULL, 3, 2, NULL, 2, 2, NULL, 3, 1, 1, 10, 6, 'Main Account', 'Haven', '447892', '1140289', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-sunshine-cottage VRBO LINK: https://www.vrbo.com/5084475 BOOKING.COM LINK: https://www.booking.com/hotel/us/1-mi-to-dollywood-mins-to-all-attractions-amp-gsmnp.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40738438  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/447892  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1v8e02Xzj0q6HrV89ifWgFyzR9sJYZsVxjYM45e-iLqc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1BQxv06TC6N9COf-cTUpp4M1G8vyHwWO_ GOOGLE LINK:  ', '3526', NULL, '3946', 'Owner Code: 1017 | Vendor code: 6957 ', 'Wi-Fi Name: Sunshine Cottage | Password: SC1017SC', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, 'Handled by Owner', NULL, NULL, 'Gas
', '3 spots
paved
No RV/Trailer

', 'Firm', '25th', NULL, NULL),
('86dy5fuxp', 'Emily Korte 1114', 'live', 'normal', 'none', 'none', true, '1114 Red Maple Ln Sevierville, TN 37876', '1114 Red Maple Ln, Sevierville, TN 37876, USA', NULL, 'Katie Work', NULL, 2, 2, NULL, NULL, 1, NULL, 2, 1, NULL, 4, 2, 'Main Account', 'Haven', '445961', '1136707', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-bluebird-cabin VRBO LINK: https://www.vrbo.com/4958680 BOOKING.COM LINK: https://www.booking.com/hotel/us/bluebird-escape-rooftop-deck-cozy-insane-views.html MARRIOTT LINK: ttps://homes-and-villas.marriott.com/en/properties/40662640 DIRECT BOOKING SITE LINK: https://www.booking.com/hotel/us/bluebird-escape-rooftop-deck-cozy-insane-views.html GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GD0dCDkeiDTNOcBsh0myqYUOjAoLhRthjH24LBfhFUw/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1rSldiIyhQCUSqhVtS4yVBqZPDZrrLtvW GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ096V3cCw6I-YARAC/overview?g2lb=43807868', '9406', NULL, '8013', 'Owner Code: 2057 | Vendor Code: 3880', 'Direct Wifi: Wi-Fi Name: TheBlueBird Network Password: MountainView', NULL, NULL, NULL, 'Arrow (No other pest control)', NULL, NULL, NULL, NULL, NULL, '2 spots
Gravel driveway
No RV/Trailer

', 'Firm', '25th ', NULL, '20% at 1 year

'),
('86dy3zmby', 'Laurie Keenan 3428', 'live', 'normal', 'none', 'none', true, '3428 Connie Ln, White Pine, TN 37890', '3428 Connie Ln, White Pine, TN 37890, USA', 'Dandridge', 'Regina Shrout', NULL, 3, 2, NULL, 1, 1, 2, NULL, 1, NULL, 6, 4, 'Main Account', 'Haven', '444432', '1132410', NULL, 'AIRBNB LINK: https://airbnb.com/h/white-pines-whiskey-cove- VRBO LINK: https://www.vrbo.com/4942949?dateless=true BOOKING.COM LINK: Not pushed yet! MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/444432 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1fyvtI4WdG6ETOd9625ximAu7FUdsyM2eKSYAzcACnig/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1oFm_vFIFLYDZiHcrx6dQLMeoEWZnrtzA GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQh_zHkrKEu6_tARAC/overview?g2lb=43807868', '9884', 'GNG 10/30; Photos 10/31', '0246', 'Owner Code: 9940 | Vendor Code: 9335', 'Username: Whiskey Cove | Password: Whiskeycove25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'electric
', '4 spots
Gravel
No RV or camper
Trailer parking is allowed. Please note: No longer than 20ft. No dump or construction trailers. 

', 'Firm', '25th of the month', NULL, NULL),
('86dxvgt0y', 'Krista Fontana 2779', 'live', 'key', 'none', 'none', true, '2779 Maplecrest Ln, Sevierville, TN 37876', '2779 Maplecrest Ln, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 4, 2, 1, 1, 2, 2, NULL, 1, 1, 10, 6, 'Main Account', 'Haven', '437003', '1118064', NULL, 'AIRBNB LINK: https://airbnb.com/h/white-serenity-smokies VRBO LINK: https://www.vrbo.com/4914040 BOOKING.COM LINK: https://www.booking.com/hotel/us/sleeps-10-hottub-game-room-views-pet-friendly.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40602125 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/437003 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/17_CMUolZJEhHjx3_Fcrow9MYwmmh4eyntz2hRLPKB04/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1I_jbpJ1fCjmMKxN2T5Sf9i2nqX6iHe-3 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQyKqE76f8j_NbEAI=/overview?g2lb=43807868', '4702', NULL, '7391', 'Owner Code: 6903 |  Vendor Code: 8511', 'Spectrum Internet | Account Number: 8316400350296962 | WiFi Name: SeviervilleSerenity | Password: 2779maple', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, 'Electric

', '4 spots
concrete
No RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dxvgt03', 'Lauren Dela Cruz 526', 'live', 'key', 'none', 'none', true, '526 Blackberry Ridge Way, Pigeon Forge, TN 37863', '526 Blackberry Rdg Wy, Pigeon Forge, TN 37863, USA', 'NW Parkway', 'Summer Mathews', NULL, 2, 2, NULL, 1, 1, 2, 1, 1, NULL, 6, 4, 'Main Account', 'Haven', '436999', '1118060', NULL, 'AIRBNB LINK: https://airbnb.com/h/bearly-behavin-cabin-smokies VRBO LINK: https://www.vrbo.com/4904754?dateless=true BOOKING.COM LINK: https://www.booking.com/hotel/us/bearly-behaving-pigeon-forge.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40600301 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/436999 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ZqlygN6IiNmUmoYztySL0A9kcDv9lQz6hYxUwNBOI0A/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1T5FSdjaIdZLSkuL-94jVKV8fNI_0bEbN GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ6L3mtJrd0MUiEAI=/overview?g2lb=43807868', '4163', NULL, 'Yale lock entry code: 6437', 'Owner Code: 3243 | Vendor Code: 3426', 'Wi-Fi Name: Bearly_Behavin / Password: BEHAVEYOURSELF!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas

', '2 
incline, pavement
No RV/Trailer
', 'Firm', '25th ', NULL, 'Use Door Code: 0259 for now for Transfer guests. 
Water: This is City water under City of Pigeon Forge.

'),
('86dxvgrz1', 'Lauren Dela Cruz 1550', 'live', 'key', 'none', 'none', true, '1550 Bears Den Way Sevierville, TN 37876', '1550 Bears Den Way, Sevierville, TN 37876, USA', 'SE Parkway', 'Summer Mathews', NULL, 3, 3, NULL, 2, NULL, 2, 2, 1, NULL, 10, 6, 'Main Account', 'Haven', '436996', '1118052', NULL, 'AIRBNB LINK: https://airbnb.com/h/pitch-perfect-cabin-smokies VRBO LINK: https://www.vrbo.com/4904757?dateless=true BOOKING.COM LINK: https://www.booking.com/hotel/us/pitch-perfect-sevierville.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40646692 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/436996 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1b5E20lq8s9_HqSGVD_NvZTg2_3Y9Sl97PQyMxIix7uQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1WuRKVa1kV2OVY2BF19bgULUdnDlUUlZB GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQrJqHwr-xk444EAI=/overview?g2lb=43807868', '5138', NULL, '2495', 'Owner Code: 3243 | Vendor Code: 5332 | Gate Codes: Sept: 4839, Oct: 1645, Nov: 2956, Dec: 7160 Front door: 0259 All 3 digit codes: 832', 'Comcast Network name: Pitch Perfect | Password: singalong1550', NULL, NULL, NULL, 'Clear Defense', NULL, NULL, 'Holston Gas', 'HOA', 'Yes (propane)
', '3 spots
incline, pavement 
No RV/Trailer
', 'Firm', '25th of the month', NULL, 'As of Feb 27, 2026:
Per owner, no lawn care needed.
 
Community Pool: 
The pool is closed January and February for Maintenance. It’s a heated covered pool open access after enter entering the front gates of resort. Pool hours are 10am to 10pm


Gate code Sept: 4839
Gate code Oct: 1645
Nov: 2956
Dec: 7160

Added as of Dec 8, 2025: 
Gate Codes for 2026:
• January – 1480 
• February – 7931 
• March – 4637 
• April – 8923 
• May – 5290 
• June – 2475 
• July – 3172 
• August – 6924 
• September – 9486 
• October – 4970 
• November – 5632 
• December - 7240


'),
('86dxvgrwv', 'Juan Nunez 3272', 'live', 'normal', 'none', 'none', true, '3272 Smoky Ridge Way Sevierville TN 37862', '3272 Smoky Ridge Way, Sevierville, TN 37862, USA', 'SW Parkway', 'Katie Work', NULL, 3, 2, NULL, 2, NULL, NULL, 4, 1, 1, 8, 4, 'Main Account', 'Haven', '436992', '1118048', NULL, 'AIRBNB LINK: https://airbnb.com/h/rustic-ridgeview-cabin VRBO LINK: https://www.vrbo.com/4904759 BOOKING.COM LINK: https://www.booking.com/hotel/us/rustic-ridgeview-hot-tub-grill-foosball-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40646690 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/436992 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ccz2vPvse4nRROJafVa7JPYQefDrAHg81MasU98VFCQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/14DNG59SSqJLxu26btZhfzkE32wFQBo4y GOOGLE LINK: http://stay.havenvacationrentals.com/listings/436992', '4570', NULL, '3268', 'Owner Code: 5823 | Vendor Code: 3545', 'Xfinity/Comcast; WiFi Name: The Great Escape! Password: Loving the Smokies#!', NULL, NULL, NULL, 'Johnson Pest Control', NULL, NULL, NULL, 'Sevier County Water', NULL, 'max of 4 spots
incline, concrete
No RV/Trailer
', 'Moderate', '25th ', NULL, 'ADT alarm > Alarm App Login:
ownerrelations@havenvacationrentals.com
Password: JuanNunez3272@


'),
('86dxut8kd', 'Rick Norris 1712', 'live', 'normal', 'none', 'none', true, '1712 Lake view circle, Sevierville TN 37876', '1712 Lake View Cir, Sevierville, TN 37876, USA', 'NW Parkway', 'Regina Shrout', NULL, 2, 1, NULL, NULL, 2, NULL, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '436020', '1116431', NULL, 'AIRBNB LINK: https://airbnb.com/h/warm-modern-lodge VRBO LINK: https://www.vrbo.com/4883473 BOOKING.COM LINK: https://www.booking.com/hotel/us/warm-modern-lodge-hot-tub-fireplace-pacman.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/436020 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Xk3CfvqCA5UH60UYwQEbokyA0y70TWt5qVCBUMARsP8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1yug6hxq6IxIL9NJFo-0ASyYGCQyVfw5Z GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQh6-y8fXfoNwMEAI=/overview?g2lb=43807868', '3627', NULL, '4691', 'Owner Code: | Vendor Code: ', 'Username: AutumnLeaf Password: 1712AutumnLeaf', NULL, NULL, NULL, 'Clear Defense Pest Control', NULL, NULL, NULL, 'Well', 'Gas & Wood

', '3 spots
incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dxrp4uz', 'Janet Briel 316', 'live', 'normal', 'none', 'none', false, '316 W Blount Ave, Knoxville, TN 37920', '316 W Blount Ave, Knoxville, TN 37920, USA', 'Knoxville', 'Regina Shrout', NULL, 2, 1, 1, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', 'KnoxStaytion', '434011 ', '1108824', NULL, 'AIRBNB LINK: https://airbnb.com/h/cityscape-townhouse-knoxville VRBO LINK: https://www.vrbo.com/4914041 BOOKING.COM LINK: https://www.booking.com/hotel/us/cityscape-townhouse-near-market-square-downtown.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40602123 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/434011 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1eqO0iTHG-KOBeqhL1qqrQq9cPGKIISknZXcAKiMqeR4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Z5R2l5PVbHxKJ0LEeTWUbAzDVz9ouiYQ GOOGLE LINK: http://stay.havenvacationrentals.com/listings/434011', '5281', NULL, '3791', 'Owner Code: 0099 | Vendor Code: 9616', 'WiFi Network: BigOrangeBasecamp Password: Bentley123!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'This unit has 2 parking spaces
should only allow 2 cars here since there are only 2 spaces. Parking with the passes will be free
NO RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dxrnhqa', 'Mohan Thorat 2424', 'live', 'normal', 'none', 'none', true, '2424 Walnut Ridge Way Seviervill, TN 37862', '2424 Walnut Ridge Way, Sevierville, TN 37862, USA', 'Wears Valley/Little Cove', 'Katie Work', NULL, 3, 3, NULL, 3, 2, 2, NULL, 1, 1, 12, 7, 'Main Account', 'Haven', '434010 ', '1108822', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-real-mccoy VRBO LINK: https://www.vrbo.com/4922308 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-real-mccoy-epic-viewshot-tub-arcade.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40603271 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/434010 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1jFATFxQAnf3aslr6EpF7jFbM9TrEOC86pDPZPZlowu4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1lDbfy0uxAc7BSzswj0FrgWiZPvKpjThV GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQpuDpj6TNrpESEAI=/overview?g2lb=43807868', '2091', NULL, '3476', 'Owners Closet’s access code: 1103', 'Direct Wifi: WiFi Network: The Real McCoy Password: 8657747966', NULL, NULL, NULL, 'Arrow Exterminators (865)453-5860.', NULL, 'FireFly Lawn Care & Services (865)607-7520', NULL, NULL, 'Gas

', '2 spots
 incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dxrmw24', 'Bobby Nicely 1132', 'live', 'normal', 'none', 'none', true, '1132 Sanctuary Shores Way Sevierville, TN 37876', '1132 Sanctuary Shrs Wy, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 3, 2, 2, 2, 3, NULL, 2, 1, 1, 12, 7, 'Main Account', 'Haven', '434009 ', '1108820', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-fire-side-lodge VRBO LINK: https://www.vrbo.com/4922306 BOOKING.COM LINK: https://www.booking.com/hotel/us/fireside-lodge-lake-view-hot-tub-game-room.html MARRIOTT LINK:https://homes-and-villas.marriott.com/en/properties/40603269 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/434009 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/10t6qm8WoRX9pvntXK9xokybJrnvh0YLYTstbJakTmQs/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1zzP3qqFY67SaoKsWY7enMBkIYgrVJpq_ GOOGLE LINK: http://stay.havenvacationrentals.com/listings/434009', '9516', NULL, ' 4589 ', 'Gate Code: 7206 | Owner Code: 7200 | Vendor Code: 6389', 'DIRECT WIFI WiFi Network: Fireside 5g Password: Meredith14 OR Wi-Fi Network: Fireside 2.4g Password:Meredith14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric

', '8 spots
Flat pavement.
No RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dxqj2f3', 'Kerry Doane 3005', 'live', 'top', 'none', 'none', true, '3005 Nellie Dr, Sevierville, TN 37876', '3005 Nellie Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Summer Mathews', NULL, 3, 3, 1, 1, 2, NULL, 4, 1, 1, 12, 7, 'Main Account', 'Haven', '432553', '1104841', NULL, 'AIRBNB LINK: https://airbnb.com/h/secluded-mountain-views-cabin VRBO LINK: https://www.vrbo.com/4922307  BOOKING.COM LINK: https://www.booking.com/hotel/us/secluded-cabin-with-mountain-views-hot-tub-games.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40605951 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/432553 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1gFiEI7FrIZ8yNXlQLj7rcMoJqLp8NvEYGODeWIQnh9s/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1jxJtHBMB51UCw1qvX2VD8um44LlufHg7 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQl8bGoqLn9bE6EAI=/overview?g2lb=43807868', '4901', NULL, '9724', 'Owner Code: 6673 | Vendor Code: 6059', 'Wi-Fi Name: Nellie Network Password: Highspeed3005', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'electric


', '4 o5 5 (if cars are small)
RV/Trailer allowed - We can allow a small RV or trailer BUT IT WILL BE TIGHT. The road is narrow and so is the driveway. They need to be skilled and comfortable backing up a trailer. Lets ONLY ALLOW this on a case by case basis 
Paved/blacktop

', 'Firm', '25th ', NULL, 'As of Dec 22, 2025: 
Owner already installed the washer and dryer

As of Nov 28, 2025: 
Removed washer and dryer from the amenities 
The owner says a standard size will not fit in that closet so he has to get something custom fit.

'),
('86dxqj1wx', 'Simon Shanco 1626', 'live', 'normal', 'none', 'none', false, '1626 Lake Drive Gatlinburg TN 37738', '1626 Lake Dr, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Regina Shrout', NULL, 2, 1, NULL, 1, 2, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '432546', '1104837', NULL, 'AIRBNB LINK: https://airbnb.com/h/whispers-in-the-smokies VRBO LINK: https://www.vrbo.com/4877683 BOOKING.COM LINK: https://www.booking.com/hotel/us/whispers-of-the-smokies-hot-tub-pool-table-grill.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40594569 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/432546GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1fHAAwciRf6gwqaLoS_wDg1dlLpH2859TDQ1lpro2gC0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1fZ64mfqRcd7IUuZnnNHaivlhVkAMTDmN GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQw9D36ZH_hPvNARAC/overview?g2lb=43807868', '2153', NULL, '9461', 'Owner Code: 3207 | Vendor Code: 5202', 'Direct Wifi: Wi-Fi Name: Whispers Of The Smokies Network Password: BlackBear1626', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Well', 'Gas
', '2 spots
gravel, incline
No RV/Trailer

', 'Firm', '25th of the month', NULL, 'As of Feb 6, 2026: 
The owner has their own pest control vendor.

The pin for the TV is the last four digits of the owner’s phone number (3207) 


'),
('86dxqj1bd', 'Daniel Shepherd 1931', 'live', 'normal', 'none', 'none', false, '1931 Legacy Dr, Sevierville, TN 37876, USA', '1931 Legacy Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Summer Mathews', NULL, 2, 2, NULL, 2, NULL, NULL, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '432526', '1104835', NULL, ' AIRBNB LINK: https://www.airbnb.com/rooms/1557411243649201487 VRBO LINK: https://www.vrbo.com/5021705  BOOKING.COM LINK: https://www.booking.com/hotel/us/smokies-mountain-charm-views-hot-tub-game-room.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/432526  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1_daDUWo4S1Vi_SmHp3VmFBhoYVN5SUrzUVJvcwZQHKQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1tzC3MdjYtTyUunr1Qg6kWNvSYSlut9e5 GOOGLE LINK: ', '5291', NULL, '9582', 'Fixed code set up for now', 'Wi-Fi Name: Castleonacloud | Password: 1931legacy', NULL, NULL, NULL, NULL, NULL, NULL, 'sevier Co propane', 'Public', 'Gas & Electric

', '2 spots
Flat, pavement
No RV/Trailer

', 'Firm', '25th', NULL, NULL),
('86dxq02uv', 'Jeff Winberry 2627', 'live', 'junior', 'none', 'none', false, '2627 May Ave, Maryville, TN 37804', '2627 May Ave, Maryville, TN 37804, USA', 'Townsend', 'Regina Shrout', NULL, 4, 2, NULL, 2, 1, NULL, 2, 1, NULL, 8, 4, 'Main Account', 'Haven', '431878 ', '1103319', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-white-lodge VRBO LINK: https://www.vrbo.com/4875303 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-white-lodge-4bdr-sleeps-8-with-fire-pit.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40640296 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/431878 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/18Yh3uYLpPMKCu2o-hus01sdW9p90cLJWm7eXnWvq_gw/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/14m4MCOz1r00XV5zGR2-Es3o1LWKGJg3O GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ0Pq5yYfx3MvSARAC/overview?g2lb=43807868', '6379', NULL, '3754 ', 'Owner Code: 9100 | Vendor Code: 1231', 'Direct Wifi: WiFi Network: Mayhouse Password: HSH2025!', NULL, NULL, NULL, 'Thomas Pest Control', NULL, NULL, 'Atmos Energy', 'City of Alcoa', NULL, '4 spots
flat, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, 'Front door: 9475

Back door: 9149
'),
('86dxpf3fa', 'Bob Surak 2010', 'live', 'normal', 'none', 'none', true, '2010 Smoky Cove Rd, Sevierville, TN 37876', '2010 Smoky Cove Rd, Sevierville, TN 37876, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 7, 3, 1, 4, 2, NULL, 1, 1, 1, 13, 7, 'Main Account', 'Haven', '431015', '1101469', NULL, 'AIRBNB LINK: https://airbnb.com/h/rustic-cove-retreat VRBO LINK: https://www.vrbo.com/4864186 BOOKING.COM LINK: https://www.booking.com/hotel/us/rustic-cove-views-hot-tub-theater-game-room.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/431015 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1BwOgPbqSwYD_vKt42RLbYueuPDRGevY5eWuMPU9G51Q/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1BmbH3MzwuzQpHdnA_IIVwJO9rtQNK7W4 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ74LGvbbWlZ4BEAI=/overview?g2lb=43807868', '4631', NULL, '7641', 'Owner Code: 7646 | Vendor Code: 2827 | Locked Closet Codes: 0044', 'Direct WiFi | Wi-Fi Name: blessmystars | Password: smoky2010', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric & Gas 



', '2 spots
 incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', '86e02jemq', 'Community Pool:

Smoky Cove Resorts
The Resort Pool is for all to enjoy from 10am to 10pm. Please follow all posted rules and guidelines. The maximum capacity is limited to 10 people. The pool will be closed if the posted rules are not followed.

The common fire pit is in its shared recreation area near the seasonal pool and picnic pavilion.


'),
('86dxjdn6k', 'Dan and Melissa Hanlon Combo 1&2', 'live', 'normal', 'none', 'none', true, '131 Unit 1 & 2 Cedar St., Sevierville 37862', NULL, 'SE Parkway', 'Lily Bryant Macon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Main Account', 'Haven', '385831', '994708', NULL, 'AIRBNB LINK: https://airbnb.com/h/cedars-peak-downtown-2-condos VRBO LINK: https://www.vrbo.com/4899688 BOOKING.COM LINK: https://www.booking.com/hotel/us/cedars-peak-downtown-2-condos.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40598265 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/385831 GREEN LIGHT DOC LINK: OWNER PROFILE FOLDER: GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQpuymrZuAnZs6EAI=/overview?g2lb=43807868', '6921', NULL, '3037', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Strict', NULL, NULL, NULL),
('86dxh149y', 'Patrick Lannon 210', 'live', 'normal', 'none', 'none', true, '100 S Gay St #210, Knoxville, TN 37902', '100 S Gay St #210, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', NULL, 2, 1, NULL, 1, 1, NULL, NULL, 1, NULL, 4, 2, 'KnoxStaytion Account', 'KnoxStaytion', '423929', '1082443', NULL, 'AIRBNB LINK: airbnb.com/h/highway-vintage-boutique-escape VRBO LINK: https://www.vrbo.com/4883466 BOOKING.COM LINK: https://www.booking.com/hotel/us/urban-haven-loft-near-market-square.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40641784 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/423929 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1dD1J7-XmTJGyG_1EeH65fBmAa_VMpRBzA6zAEblvXgE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1e8w-Ya6QpwzFTz14nj85LFhM9I_3oUoj GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ6tDP653gruS5ARAC/overview?g2lb=43807868', '6287', NULL, '3049', 'Owner Code: 2329 | Vendor Code: 3501', 'Direct WIFI: Wi-Fi Name: Highway Vintage Network Password: fuzzywind068', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'get the guests license plate and enter it in online so the city doens''t give them a ticket. This is jack approved. 
**There is FREE Parking, but ONLY for 1 vehicle. 
- Please note: The unit comes with access to one parking spot in the lot behind the building at 121 State Street. Parking spots are not assigned and are first come, serve. If you would like to utilize the available parking space, you must register your vehicle information with the property management team prior to your arrival. NOTE: the parking will not be available for free prior to your stay or after your checkout.
- Additionally, there are public paid Electric Vehicle chargers throughout downtown Knoxville, and there is not a free one available at the property. We recommend searching for close-by charging stations, at 378 S Central St, Knoxville, TN 37902..
', 'Firm', '5th of the month', NULL, 'Getting to the property:
Walk past the art gallery and there is a metal fence with a door, enter the code and walk to the end of that pathway and the actual building entrance is on the left with a locked door with a code. Then go to the elevator and go to floor 2 and turn right and walk all the way down the hallway and unit 210 is on the left.  

PLEASE NOTE: not child-friendly listing

'),
('86dxh149n', 'Patty Cloninger 2208', 'live', 'normal', 'none', 'none', true, '2208 Legend Dr, Sevierville TN 37876', '2208 Legend Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 2, 2, NULL, 1, 2, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '423924', '1082442', NULL, 'AIRBNB LINK: https://airbnb.com/h/peaceful-retreat-smokies VRBO LINK: https://www.vrbo.com/4909204 BOOKING.COM LINK: https://www.booking.com/hotel/us/peaceful-retreat-hot-tub-grill-fireplace-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40601231 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/423924 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1j5mxWPZQ6AILf6xin0QRyHsAAhgCWrxXQJjaG1zO-u8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1e7UYitiS5kmQkhoF_W976-YRzZsTTr0H GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQtZXH4NKiiNQUEAI=/overview?g2lb=43807868', '0628', NULL, '9437', NULL, 'Direct Wifi: WiFi Network: Dave''s Hideaway Password: BearTracts2208!', NULL, NULL, NULL, 'Thomas Pest Control', NULL, NULL, NULL, NULL, 'Gas

', '2 spots
incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, 'Patty signed a 1-year contract with Haven. 



'),
('86dxg4r7k', 'Jerry Pegram 2137', 'live', 'normal', 'none', 'none', true, '2137 BEACH FRONT DR SEVIERVILLE, TN 37876', '2137 Beach Front Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 3, 3, NULL, 3, 2, NULL, 2, 1, 1, 12, 7, 'Main Account', 'Haven', ' 422587', '1077836', NULL, 'AIRBNB LINK: https://airbnb.com/h/secluded-cabin-gameroom-grill-fireplace VRBO LINK: https://www.vrbo.com/4857137 BOOKING.COM LINK: https://www.booking.com/hotel/us/secluded-cabin-hot-tub-fireplace-gameroom-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40585017 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/422587 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1SKbGOLIWRqc7BMRpWGsEPD8vre3xEXMJaYG9Z-Jrhms/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1ybp0H9XkTtLn4qqzkqKhHPDjmU1kBOvP GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ_86SuOObwKOfARAC/overview?g2lb=43807868', '4519', NULL, '1557', 'Owner Code: 0117 | Vendor Code: 2279', 'Direct WIFI: Wi-Fi Name: SpectrumSetup-3D Network Password: outletwalnut785', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas

', NULL, 'Firm', '25th of the month', NULL, NULL),
('86dxfy9cm', 'Karen Wanamarta 3736', 'live', 'normal', 'none', 'none', true, '3736 Dollys Dr, Sevierville, TN 37876', '3736 Dollys Dr, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Katie Work', NULL, 4, 2, 1, 3, NULL, 3, NULL, 1, 1, 12, 7, 'Main Account', 'Haven', '422503', '1077835', NULL, 'AIRBNB LINK: https://airbnb.com/h/dollys-darling-cabin VRBO LINK: Not pushed yet! BOOKING.COM LINK: https://www.booking.com/hotel/us/dollys-darling-cabin-views-hot-tub-game-area.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40585015 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/422503 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1p7l_6mBzszAWGUxyfsiCul8WgwU7WkwoWu-n2N4V_sI/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1K_18eEHz2jtrUAm_gzavSfo7f9ZGuYop GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ0b2bq5a-15CVARAC/overview?g2lb=43807868', '2341', NULL, '4712', 'Owner Code: 8889 | Vendor code: 4019', 'Direct Wifi: Wi-Fi Name: Dolly’s Darling Network Password: OliveOil2022', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood

', '
pavement, driveway, parking area
No RV/Trailer
3 spots outside

', 'Firm', '25th of the month', NULL, 'YouTube video for Mini Golf Light feature >   

For the Access to the property: 
The gate has a latch that can be opened from either side. You go through the gate to the back door. The front door is not an arrival access point

The light switch for the basement level is down the stairs, turn right and it is on that wall. 
The breaker panel is in the putt putt room/garage to the left at the bottom of the stairs, though they shouldn''t need the panel.

'),
('86dxd0qhb', 'Robin Lall 3931', 'live', 'normal', 'none', 'none', false, '3931 Boogertown Rd, Sevierville, TN 37876', '3931 Boogertown Rd, Sevierville, TN 37876, USA', 'SE Parkway', 'Summer Mathews', NULL, 1, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 4, 2, 'Main Account', 'Haven', '418398', '1069490', NULL, 'AIRBNB LINK: https://airbnb.com/h/unique-modern-lodge VRBO LINK: https://www.vrbo.com/4786116 BOOKING.COM LINK: https://www.booking.com/hotel/us/honeyscape-treehouse-hottub-intimate-getaway-firepit.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/418398 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1aZPPUD8d_vJd1tZ8A7dkRSaF8xXiK2njtYYqjmH9-GQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1_xxURiQmlgb_Z5LYIEVUDa9mzxkuY3X8 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQkPy2spHVkJzTARAC/overview?g2lb=43807868', '2379', NULL, '8641', NULL, 'Direct Wifi: WiFi Network: The Honeyscape Password:  honeyscape3931', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Aquaclear (1-year warranty)', 'Electric
', '3 spots
incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, 'As of Apr 7, 2026:
Our builders was ELKMONT Interior design. 
(865) 366-2235
 

As of Aug 20, 2025
Aquaclear is scheduled to install the water filtration system on the 26th of this month.
1-year warranty 

This property runs on a well water. 

'),
('86dx9t7hx', 'Jeanine Patterson 1161', 'live', 'normal', 'none', 'none', true, '1161 Ski Mountain Rd, Gatlinburg, TN 37738', '1161 Ski Mountain Rd, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', NULL, 3, 2, NULL, NULL, 2, NULL, 3, 1, 1, 7, 4, 'Main Account', 'Haven', '415225', '1063829', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-hearth-retreat VRBO LINK: https://www.vrbo.com/4791487 BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-hearth-retreat-pool-hot-tub-games-more.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/415225 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1-pcdfaTvyvw2ALE547BmGtPZjgd_HbJ0mvYVt5jfGg8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1a_B0TxVYVqTg3ulyoH1VP-LBi5gpq-ku GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ3I7Qw7ruiJT7ARAC/overview?g2lb=43807868', '3182', NULL, '6487', NULL, 'DIRECT WIFI: Wi-Fi Name: TheSwissOnyx Wi-Fi Password: Gatlinburg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2  spots
steep, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, 'As of Aug 18, 2025:
• Owner approval is required for all tasks. 

COMMUNITY POOL INFO: (Chalet Village)

 

Guests have access to the community pool! 
This house is in the Chalet Village - guests have access to 3 clubhouses. 
Chalet Village Office Address: 1319 south baden drive 
Contact: Ken with Chalet Village - 865-436-4440 
Pools are open Friday of Memorial Day Weekend thru Labor Day. 
Pool Hours are 9am to 9pm. Passes in property.

 ***Please Note: Lost passes will result in the guest being required to pay a $50 fee.
 South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays. 
North Pool is located at 705 Village Loop Road. Closed on Wednesdays. 
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesday

3 Seasonal Outdoor Swimming Pools
'),
('86dx9qqdv', 'Priya Dhawan 2534', 'live', 'top', 'none', 'none', true, '2534 Mountain Holly Way Sevierville, TN 37862', '2534 Mountain Holly Way, Sevierville, TN 37862, USA', 'SW Parkway', 'Jordan Lynde', NULL, 7, 6, 3, 6, 4, NULL, 5, 1, 1, 26, 16, 'Jordan Account', 'Jordan', '408382', '1041001', NULL, 'AIRBNB LINK: https://https://www.airbnb.com/rooms/1455864320309618130 VRBO LINK: https://www.vrbo.com/5037147 BOOKING.COM LINK: https://www.booking.com/hotel/us/golf-sim-theater-pool-hot-tub.html?chal_t=1767882565419 MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/408382! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1eXYgLrt0_iJTeEm7WyQNKBww1ofKmpBZRw3VeVUL-R4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1ppeE63YZB0FDGGTiJ9Amsj_fRLekbzRB GOOGLE LINK: google.com/travel/hotels/entity/CgoQmZX5yKCfvLMPEAI=/overview?g2lb=43807868', '3180', NULL, '4961', ' Owner Code: 4700 | Vendor Code: 7989 | Community gate: 4724 | Pool room: 4794 | Mechanical room in pool room: 7366', 'DIRECT WIFI Wifi: ATT 2534 Password: 2534Mountain', NULL, NULL, NULL, 'Valley', NULL, NULL, NULL, NULL, 'Electric & Propane


', '8 spots
Paved, steep hills. Parking for 8 vehicles
NO RV/Trailer

', 'Strict', '15th of the month', NULL, 'Gate code 4724
mechanical room 7366

FYI: Per Jordan, Commission % is 10% until March and then 20% after that. 
Priya’s WiFi router is inside the maintenance closet inside the pool room
'),
('86dx7grtz', 'Matt Painter 2104', 'live', 'junior', 'none', 'none', true, '2104 Jayne Lane, Knoxville, TN 37918', '2104 Jayne Ln NE, Knoxville, TN 37918, USA', 'Knoxville', 'Regina Shrout', NULL, 3, 3, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', 'KnoxStaytion', '411807', '1057976', NULL, 'AIRBNB LINK: https://airbnb.com/h/cozy-corner-knoxville VRBO LINK: https://www.vrbo.com/4721113 BOOKING.COM LINK: https://www.booking.com/hotel/us/cozy-corner-spacious-area-outdoor-lounges.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/411807 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1nlau3i5LnAcpHoy0CLKZA1qdueehM8CYJ6aDIioSbDs/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/196gYnZBcs1ONDMs5x55nSrQJyU1VgN6l GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ8JS4kM3r-6STARAC/overview?g2lb=43807868', '0', NULL, '9146', 'Owner Code: 8642 | Vendor Code: 8705', 'Direct WIFI: Wi-Fi Name: GoodVibes Wi-Fi Password: 259012447', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 spots
Flat, gravel
No RV/Trailer

', NULL, '25th of the month', NULL, 'As of 09/16: Changed to Flexible cancellation policy as per Summer

AC vendor to call - They should have the history of service and not charge for on-site inspection. 
All-Star Heating & Air Conditioning 3541 Neal Drive Knoxville, TN 37918

'),
('86dx6172h', 'Nick Jacoby 440', 'live', 'key', 'none', 'none', true, '440 Pinnacle Vista Rd Pittman Center, TN 37876', '440 Pinnacle Vista Rd, Pittman Center, TN 37876, USA', 'Pittman Center', 'Lily Bryant Macon', NULL, 6, 6, 1, 6, NULL, 2, NULL, 1, 1, 15, 8, 'Main Account', 'Haven', '409426', '1043884', NULL, 'AIRBNB LINK: https://airbnb.com/h/treasure-of-tennessee VRBO LINK: https://www.vrbo.com/4717234 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-treasure-of-tennessee-view-2-hot-tubs-pool.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40609728 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/409426 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1prhmVT4P9L7mpWe9k9E1ShQ24CSOuItsxhTr7cWsOek/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1zYDKGD7l3jkvz6BXufEr9Rh9Vo7X9yFR GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ-cnyqYK2s7-LARAC/overview?g2lb=43807868', '8265', NULL, '9614', NULL, 'Direct Wifi: WiFi Network:  treasure of Tennessee Password: freelake186', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, 'Electric


', '-4 spots
 Steep incline, concrete  
No RV/trailer


', 'Firm', '25th of the month', NULL, 'As of Aug 26, 2025:
- Please note that our TVs no longer include cable service.

As of Sept 2, 2025: 
Per owner, their gas provider is Sevier County Propane (recently acquired by Ferrell Gas). 

Pool code - 6754
'),
('86dx6171c', 'Ramesh Kumar 772', 'live', 'normal', 'none', 'none', true, '772 Village Loop Rd, Gatlinburg, TN 37738', '772 Village Loop Rd, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', NULL, 3, 3, NULL, 2, 2, NULL, 2, 1, 1, 10, 6, 'Main Account', 'Haven', '409413', '1043882', NULL, 'AIRBNB LINK: https://airbnb.com/h/bearfoot-ridge-smokies-cabin VRBO LINK: https://www.vrbo.com/4752171 BOOKING.COM LINK: https://www.booking.com/hotel/us/bearfoot-ridge-hot-tub-game-room-mtn-views.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/409413 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1xzwh_AX9s55QeV1XjD-1NCGKcFb-EI-Ut2UP_I3RZBI/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1gKtMUMwHyAJ2Qe_-RghKwHy06PrJZb9H GOOGLE LINK: https://www.google.com/travel/hotels/s/FsbhZsELK82FWgu59', '5431', NULL, '3491', 'Owner Code: 0065 | Vendor Code: 7074', 'Direct Wifi: WiFi Network: Googlewifi Password: happyplace12', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric

', '2 spots
Incline, pavement
No RV/Trailer

', 'Firm', '25th of the month', NULL, NULL),
('86dx4yqtg', 'Jeanine Spangler 1150', 'live', 'normal', 'none', 'none', true, '1150 Sanctuary Shore Way Sevierville, TN 37876', '1150 Sanctuary Shrs Wy, Sevierville, TN 37876, USA', 'Dandridge', 'Lily Bryant Macon', NULL, 2, 2, NULL, NULL, 2, NULL, 2, 1, 1, 6, 4, 'Main Account', 'Haven', '407952', '1039986', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-mountain-sanctuary VRBO LINK: https://www.vrbo.com/4734646 BOOKING.COM LINK: https://www.booking.com/hotel/us/smokies-sanctuary-hot-tub-fireplace-firepit.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40615124 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/407952 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15lUvujbHCtq_pr4_uHaHJh2PrUZe08BUP5SCdaOmRpU/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1rpHO83R7zMnZZ9E6AC2HDRwoHd8WKbYA GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQk8SV89ma8P0KEAI=/overview?g2lb=43807868', '6270', NULL, '6491', 'Owner Code:  5524| Vendor Code: 4628 | Gate Code: 5714 ', 'Direct WIFI Wifi Name: ATTSqASUMq Wifi Password: t8?2y#7amvfb Network: Haven Vacation Rentals Guest Password: havenguest ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'wood


', '3 spots
flat, concrete
No RV/Trailer

', 'Strict', '25th of the month', NULL, NULL),
('86dx1ef4p', 'Brandon Brown 207', 'live', 'junior', 'none', 'none', false, '1102 Ski View Drive Unit # 207 Gatlinburg, TN 37738', '1102 Ski View Dr # 207, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', NULL, 2, 2, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'Main Account', 'Haven', '403310', '1031477', NULL, 'AIRBNB LINK: https://airbnb.com/h/stunning-mountain-views-condo VRBO LINK: https://www.vrbo.com/4677717 BOOKING.COM LINK: https://www.booking.com/hotel/us/ski-view-hideout-view-fireplace-community-grill.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/403310 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1rYS3myfiy0i5MHXczN_uUt4bT3iNiueFTUyT6nm_Q_0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1SKO8Vw05WJeIt5xUiJxDYAJb2dH9z6r3 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ75yxofO6gM-nARAC/overview?g2lb=43807868', '5083', 'Blessed - 79', '3457', NULL, 'Network information: Wi-Fi Name: Resort Wi-Fi Wi-Fi Password: no password needed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'parking lot 
Pavement
No RV/Trailer

', 'Strict', '25th of the month', '86dxfp6qp', NULL),
('86dx1bqcx', 'Rachel Turbyville 2246', 'live', 'top', 'none', 'none', false, '2246 Valley Mountain Way Sevierville, TN 37862', '2246 Vly Mountain Wy, Sevierville, TN 37862, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 3, 2, NULL, 1, 2, 1, 1, 1, 1, 9, 5, 'Main Account', 'Haven', '403233', '1031473', NULL, 'AIRBNB LINK: https://airbnb.com/h/jeremiah-lodge VRBO LINK: https://www.vrbo.com/4717141?dateless=true BOOKING.COM LINK: https://www.booking.com/hotel/us/jeremiahs-lodge-hot-tub-grill-fireplace-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40562701 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/403233 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1zYKAzL9UgQTMGTRwxxGmHBBEc9Qam8rh-c9dKUr_9wY/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1iBUtAuLB_GG8TVNMYNW73ssMWEeAIIql GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQipGy-_rTwpi6ARAC/overview?g2lb=43807868', '2258', NULL, '8156', 'Owner Code: 5363 | Vendor Code: 2556', 'Direct WIFI: Wi-Fi Name: Jeremiah’s Lodge Wi-Fi Password: jeremiahslodge1', NULL, NULL, NULL, 'Valley Pest Co. (owner cancelled 12/08/25)  NEW: All About Bugs ', NULL, NULL, NULL, NULL, NULL, '4 spots
 Long, gravel
No RV/Trailer

', NULL, '25th of the month\\', NULL, 'As of Aug 15, 2025:
For Rachel Turbyville''s two properties, she would like to offer a 15% discount to all first responders and military.
They also have two businesses (Business names: Family Allergy and Southern KY Distillery) that if any employee wants to book, they would like to offer 15% off as well.  
 
Team members are expected to offer the rates with discount if they encounter those two scenarios. 

⚠️Any furnishing replacements, like lamps/rugs/etc, require owner approval. 
'),
('86dx1bq9u', 'Rachel Turbyville 2244', 'live', 'top', 'none', 'none', false, '2244 Valley Mountain Way Sevierville, TN 37862', '2244 Vly Mountain Wy, Sevierville, TN 37862, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 3, 2, NULL, 1, 2, NULL, 2, 1, 1, 8, 4, 'Main Account', 'Haven', '403224', '1031472', NULL, 'AIRBNB LINK: https://airbnb.com/h/tucked-inn-smokies VRBO LINK: https://www.vrbo.com/4713111 BOOKING.COM LINK: https://www.booking.com/hotel/us/tucked-inn-hot-tub-grill-fireplace-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40562699 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/403224 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1S9pLjIKKmakUWTquRmWC-O4iXVlUp8CwtBbL6gggrjQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1do8K1mQwCtMpbt3qIv7lioJ2W7dyfF5X GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQxf7OuZ6Th4DCARAC/overview?g2lb=43807868', '3519', NULL, '6149', 'Owner Code: 5363 | Vendor Code: 6715', 'Direct Wifi: WiFi Network: tuckedinn  Password: tuckedinn1', NULL, NULL, NULL, 'Pest Control: Valley Pest Co. (owner cancelled 12/08/25)  NEW: All About Bugs ', NULL, NULL, NULL, NULL, NULL, '2 spots
Long, gravel.
No RV/Trailer

', NULL, '25th of the month ', NULL, 'As of Aug 15, 2025:
For Rachel Turbyville''s two properties, she would like to offer a 15% discount to all first responders and military.
They also have two businesses (Business names: Family Allergy and Southern KY Distillery) that if any employee wants to book, they would like to offer 15% off as well.  

Team members are expected to offer the rates with discount if they encounter those two scenarios. 

⚠️Any furnishing replacements, like lamps/rugs/etc, require owner approval. 

'),
('86dx1bq8k', 'Jamie Braddy 810', 'live', 'key', 'none', 'none', true, '810 Crystal Branch Way Gatlinburg, TN 37738', '810 Crystal Br Wy, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', NULL, 9, 5, NULL, 8, 2, NULL, 2, 1, 1, 22, 16, 'Main Account', 'Haven', '403210', '1031471', NULL, 'AIRBNB LINK: https://airbnb.com/h/gatlinburg-getaway-smokies VRBO LINK: https://www.vrbo.com/4702841 BOOKING.COM LINK: https://www.booking.com/hotel/us/gatlinburgs-getaway-view-hot-tub-theater-more.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40556211 ! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/403210 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Gh9daIvFf5ypt7llRaQmOBUxhSE4J2yFnA9Q7OhfDzo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1GLb5THNY3D8lwIkOD-QR8YcrjNcV7tUW GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQicqP3PeYrNG6ARAC/overview?g2lb=43807868', '0', NULL, 'SuiteOp Fixed code: 5837', 'Alarm code: 3161 | Haven Code: 3161 | Haven Cleaner Code 0791 | Haven Handyman Code: 2864  Haven Guest Code: 5837  Extra Guest Code: 5838', 'Direct Wifi: WiFi Network:Gatlinburg Getaway Password:mountainmagic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood

', '4 spots
Flat, pavement.
No RV/Trailer

', 'Strict', '25th of the month', NULL, 'As of Sep 1, 2025:
This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

As of 10/15:
Still no Yale Lock - Use Fixed code for now, or the ones under "Locks & Codes" 


'),
('86dx11kg1', 'Daryl Nelson 159', 'live', 'key', 'none', 'none', false, '159 Spotted Fawn Ln Dandridge, TN 37725, USA', NULL, 'Dandridge', 'Summer Mathews', NULL, 6, 5, 1, 3, 2, 6, 2, 1, NULL, 23, 16, 'Main Account', 'Haven', '402604', '1029989', NULL, 'AIRBNB LINK: https://airbnb.com/h/blesses-getaway VRBO LINK: https://www.vrbo.com/4665420 BOOKING.COM LINK: https://www.booking.com/hotel/us/blessed-getaway-hot-tub-theater-lakeview-games.en-gb.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/402604 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ShfWw_K2v09ZDJJeiStlo2Gc_NbHx5PVojX3ADE09T0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1if6X2Zs48BW56UrRQv0Buoh8yzR3gCiQ GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ2pmTqPbpycAMEAI=/overview?g2lb=43807868', '1350', NULL, '0', 'Garage door code: 5441; Yale lock: 3491', 'WiFi Network: Lowe5 WiFi Password: Daisy2018', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '5 spots
Flat, pavement
No RV/Trailer

', NULL, NULL, NULL, 'As of Mar 26, 2026: 
Fireplace was removed from the listing. No fires are permitted in the indoor fireplaces.

AS of Jan 22, 2025:
Enter through the garage using the keypad mounted on the exterior wall. Use the code 1988 then press 0 after typing the code in. After that, enter through the Yale Key pad on the door inside in the garage that leads into the home. 
Garage door: 1988 hold the 0 and lg door goes up.

As of Nov 4, 2025:
• Hot tub was removed as part of the amenities.  The hot tub burnt the breaker.

As of Aug 21, 2025:
• Please note that ONLY Rocky Top should work on any HVAC system here. It has a warranty and they installed two new units with them and they serviced the third.  They are familiar with all the air conditioner units in this cabin. 

'),
('86dwz04af', 'Taylor Mast 793', 'live', 'key', 'none', 'none', false, '793 Chestnut Dr, Gatlinburg, TN 37738, USA', '793 Chestnut Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', NULL, 5, 5, NULL, 5, NULL, NULL, NULL, 1, 1, 14, 8, 'StaySimpli Account', 'Haven StaySimpli', '399869', '1025303', NULL, 'AIRBNB LINK: https://airbnb.com/h/grand-vista-lodge VRBO LINK: https://www.vrbo.com/3274101 BOOKING.COM LINK: https://www.booking.com/hotel/us/grand-vista-lodge-pool-hot-tub-epic-views.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40631522 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/399869 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1SDIDZ7GQXaahTkrDJSFB4nrKAEgb9jVMbGZAzUMmi6o/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/14HITBcuYR5N93GjDpLlrk3p3ForTsyMi GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ87rx1t-Xj6qjARAC/overview?g2lb=43807868', '1971', NULL, '1971', NULL, 'Wi-fi Username: ATTJ8MXPG4 Wi-fi Password: t892agb7%kp9', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, 'Electric
', NULL, NULL, NULL, NULL, '
Quirks 
This property only uses one key for access for the guest and the cleaner. Please remind the guest to leav the key inside the lockbox before leaving the property. 

'),
('86dwz043h', 'Angela Mcllveen 811', 'live', 'key', 'none', 'none', true, '811 Bethlehem Wy, Sevierville, TN 37876, USA', '811 Bethlehem Wy, Sevierville, TN 37876, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 8, 8, 1, 4, 8, NULL, NULL, 1, 1, 26, 10, 'StaySimpli Account', 'Haven StaySimpli', '398789', '1023864', NULL, 'AIRBNB LINK: https://airbnb.com/h/best-area-views VRBO LINK: https://www.vrbo.com/4438039 BOOKING.COM LINK: https://www.booking.com/hotel/us/best-area-views-games-hottub-private-pool-puttputt.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40567815 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/398789 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1USfxeAzS_drOju4nSoFNlLGhvlGYarFdOIqgOlLgNCM/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1rceHiTNampiD6NutXnvD9Tq3VNkszivW GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQrMXiz6byk-vKARAC/overview?g2lb=43807868', '1971', NULL, '2022', NULL, 'open network', NULL, NULL, NULL, NULL, 'Sunrise Pools', NULL, 'Thompson', NULL, 'Electric
', '7 available spots
Flat and wide
No RV/Trailer

', 'Strict', NULL, NULL, NULL),
('86dwz03yy', 'Rachel Ewe 816', 'live', 'key', 'none', 'none', true, '816 Chestnut Dr, Gatlinburg, TN 37738, USA', '816 Chestnut Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', NULL, 4, 3, NULL, 3, NULL, 2, NULL, 1, 1, 10, 6, 'StaySimpli Account', 'Haven StaySimpli', '398775', '1023847', NULL, 'AIRBNB LINK: https://airbnb.com/h/chalet-vista VRBO LINK: https://www.vrbo.com/2511863 BOOKING.COM LINK: https://www.booking.com/hotel/us/chalet-vista-pool-hot-tub-game-room-views.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40567817 WHIMSTAY: DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/398775 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1HdaU3HBAw-xFRgjRVYu2Ha-hBVnO8SlsHQs_FaGuOCo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1eD8_GZIQPshZ6d2vbEL_U3xBjfZSIRL8 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ__KB4aPRx-xwEAI=/overview?g2lb=43807868', '0930', NULL, '4316', NULL, 'WiFi:ATTMGjBkaa Password: T8a7q4riimzd', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas

', '3 spots
Flat and open
No RV/Trailer

', 'Strict', NULL, NULL, 'When the door won''t unlock/open
 
 
'),
('86dwyw2ry', 'Patrick Glasco 2728', 'live', 'key', 'none', 'none', true, '2728 Grn Mountain Wy, Sevierville, TN 37876, USA', '2728 Grn Mountain Wy, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', NULL, 8, 8, 1, 5, 8, 2, NULL, 1, 1, 30, 16, 'StaySimpli Account', 'Haven StaySimpli', '398774', '1023843', NULL, 'AIRBNB LINK: https://airbnb.com/h/cha-chas-castle VRBO LINK: https://www.vrbo.com/3424966 BOOKING.COM LINK: https://www.booking.com/hotel/us/cha-chas-castle-8br-sleeps-30-w-pool-jacuzzi.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40617798 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/398774 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1WUejzML_yvowPgaSR5jwSTrSqnC7VUYT2sqC2K_xynI/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1kzzRJWssy8Ch1OJ8mXmNgPj91wsIO90Z GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQooW68LWRwoHXARAC/overview?g2lb=43807868', '0', NULL, '2022', NULL, 'Direct Wifi: WiFi Network: StaySimpli2728 Password: StaySimpli2728! ', NULL, NULL, NULL, 'Owner has their own vendor, pls coordinate with AM/AAM. ', 'Berry Maintenance', NULL, NULL, NULL, 'Electric
', '7 spots
Flat and open
No RV/Trailer

', 'Strict', NULL, NULL, 'Trash code: 0000
Pool code: 2022

'),
('86dwy5p5d', 'Lou and Elva Romano 2556', 'live', 'key', 'none', 'none', false, '2556 Walnut Ridge Way, Sevierville, TN 37862', '2556 Walnut Ridge Way, Sevierville, TN 37862, USA', 'Wears Valley/Little Cove', 'Lily Bryant Macon', NULL, 7, 8, NULL, 4, NULL, 6, NULL, 1, 1, 20, 10, 'StaySimpli Account', 'Haven StaySimpli', '398239', '1022988', NULL, 'AIRBNB LINK: airbnb.com/h/mr-blue-skies VRBO LINK: https://www.vrbo.com/3424965 BOOKING.COM LINK: https://www.booking.com/hotel/us/blue-skies-7br-sleeps-20-views-private-pool.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40585477 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/398239! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1W_Op4ARiGc9K763Zfre0o5j_MrXtdM6BmW_Aw7w5X9k/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1QMqjM_stEn1Yx8CT8d7e_g6NTkWPP3uP GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQzLaJtMDg57XOARAC/overview?g2lb=43807868', '0', NULL, '2022', 'Pool door lock code: 2906 Pool lockbox code:5719', 'Wi-fi Username: TP-Link_615C Wi-fi Password: 45538599', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric
', NULL, 'Firm', NULL, NULL, 'The pool is manually filled by hose only. The pool is saltwater.
Elevator code: 0964  (Elevator will be used for medical reasons only) 




'),
('86dwwv2p5', 'Dylan Robinson 744', 'live', 'key', 'none', 'none', true, '744 Village Loop, Gatlinburg, TN 37738', '744 Village Loop Rd, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Summer Mathews', NULL, 5, 4, 1, 4, NULL, 4, NULL, 1, 1, 16, 10, 'Superhost Account', 'Superhost', '396708', '1019851', NULL, 'AIRBNB LINK: airbnb.com/h/overlook-chalet-village VRBO LINK: https://www.vrbo.com/4864187 BOOKING.COM LINK: https://www.booking.com/hotel/us/family-5br-cabin-near-downtown-gatlinburg-with-games-hot-tub.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40590887 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/396708 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1axsV27rupsiR92eAJbivz3yvmFhz-JfFzfS4XSfobQY/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1BtrtTh4OptB79U3r-9lLEmfdaucKgAHk?usp=drive_link GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQzOfH_KGglMNdEAI=/overview?g2lb=43807868', '3056', NULL, '9425', 'Owner Code: 0101 | Vendor Code: 8737', 'Wifi Network A Frame 744 Password 744guest!', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas

', '3 spots
Incline, concrete
No RV/Trailer

', 'Firm', NULL, '86dwufgw9', 'Deck Dimension: The deck is approximately 9ft by 30ft.

As of Mar 24, 2026:
Tennis and basketball court are available all year round. The guest doesn’t need a pass to enter. It’s the North clubhouse that has open tennis courts. They need to enter from Chalet Village Boulevard to gain access.

COMMUNITY POOL INFO: 

Guests have access to the 3 community pools & clubhouses, tennis courts & playground!

(Chalet Village)
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.


South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

Chalet Village Office Address: 1319 south baden drive
'),
('86dwwuwtd', 'Jason Hyre 568', 'live', 'normal', 'none', 'none', false, '568 Warbonnet Way, Pigeon Forge, TN 37863', '568 Warbonnet Wy, Pigeon Forge, TN 37863, USA', NULL, 'Lily Bryant Macon', NULL, 3, 3, NULL, 1, 2, NULL, 4, 1, 1, 8, 4, 'Main Account', 'Haven', '396703', '1018869', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1431820942786086366 VRBO LINK: https://www.vrbo.com/4645123?dateless=true BOOKING.COM LINK: https://booking.com/hotel/us/winding-down-modern-cabin-retreat.en.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40578326 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/396703 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1QULzvJl-JyrwA4OFZ6yIslLg8abuX9SuTBa_0D-puqM/edit?usp=drive_link OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/19SPBySvWv9A3ITIfkK_PbaF62AO3X6qy?usp=drive_link GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQkcmR38D9wYeqARAC/overview?g2lb=43807868', '2418', NULL, '9146', 'Owner Code: 5024 | Vendor Code: 9660', 'Wi-Fi Name:WindingDown568 Wi-Fi Password: Areweoutofthewoods?1989', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Brick, flat.
No/RV Trailer

', NULL, NULL, NULL, 'UPDATE: 
Owner don''t want any repairs or techs sent out without approval. 

The thermostat code is 6584.

Reminder for the HVAC unit:
Hey, just wanted to make sure I pass along some information to Haven regarding our rental property (568 Warbonnet Way).  It''s nothing of emergency nature.  Our HVAC team instructed us to tell the cleaning team that goes in to make sure that they don''t move the beds in front of the return vents on the second floor, or leave them blocking the vents when done.  That will block air circulation and it will get really hot up there. They also recommended having that information in the renters'' welcome packet information if possible, so guests don''t move the beds there


'),
('86dww5m44', 'Candace Thompson 673', 'live', 'top', 'none', 'none', true, '673 Woodland Dr. Gatlinburg TN 37738', '673 Woodland Dr, Gatlinburg, TN 37738, USA', NULL, 'Jordan Lynde', NULL, 3, 3, NULL, 2, 4, NULL, NULL, 1, 1, 12, 8, 'Jordan Account', 'Jordan', '394794', '1016529', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1427522513275898238 VRBO LINK: https://www.vrbo.com/5036512 BOOKING.COM LINK: https://www.booking.com/hotel/us/gatlinburg-splash-home-theater-heated-indoor-pool-game-room.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40631512 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/394794 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1FPdzlJCjZmNE5aOiPn2DbSlszXB4PKErU2KoDwAgLeA/edit?usp=sharing OWNER PROFILE FOLDER: GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQsdyKsvvFkO9TEAI=/overview?g2lb=43807868', '0', NULL, '1975', '1975 front door, 2014 pool code, Pool Closet Maintenance 1954', ' Direct WIFI Wifi Name: Gatlinburg Splash Wifi Password: splash673', NULL, NULL, NULL, 'Valley', 'Tracey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('86dww5kv1', 'Candace Thompson 720', 'live', 'top', 'none', 'none', true, '720 Pinecrest Court Gatlinburg TN 37738', '720 Pinecrest Ct, Gatlinburg, TN 37738, USA', NULL, 'Jordan Lynde', NULL, 6, 6, 1, 5, 4, 5, 2, 1, 1, 30, 16, 'Jordan Account', 'Jordan', '394796', '1016534', NULL, 'AIRBNB LINK: https://www.airbnb.com/rooms/1426900501200579875 VRBO LINK: https://www.vrbo.com/5036511 BOOKING.COM LINK: https://www.booking.com/hotel/us/great-smoky-getaway.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40631510 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/394796 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1mOWGvBLEstWBfW_4V2u96VDQfxRqcbRZDVfhJHOcmlY/edit?usp=drive_link OWNER PROFILE FOLDER: GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQzLDh47fLlsooEAI=/overview?g2lb=43807868', '3175 Lockbox Code', NULL, '1975', '1975 front door, 2014 pool code', 'Direct WIFI Wifi Name: Great Smoky Getaway Wifi Password: Pinecrest720', NULL, NULL, NULL, 'Valley', 'Tracey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('86dwunfce', 'Andrew Crawford 1024', 'live', 'normal', 'none', 'none', true, '1024 Ravens Ford WaySevierville, TN 37876, USA', '1024 Ravens Ford Way, Sevierville, TN 37876, United States', NULL, 'Lily Bryant Macon', NULL, 3, 3, NULL, 2, 2, NULL, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '393926', '1015513', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-get-away VRBO LINK: https://stay.havenvacationrentals.com/listings/376033 BOOKING.COM LINK: https://www.booking.com/hotel/us/mountain-getaway-hot-tub-2-king-suites.en-gb.html? MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40534489 DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1VVIBadJSCQ1u7-hRi86id1voNzpkrrmcf-OD2XMBCMQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ul4VP-I8QJS7Eg8q55ki42iYzEpYTADS GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQjaaau-fh95hHEAI=/overview?g2lb=43807868', '1306', 'Blessed - 25', 'Yale lock entry code: 9154', NULL, 'Wi-Fi Name: Guest Wi-Fi Wi-Fi Password: Raven.102', NULL, NULL, NULL, 'Barnes Exterminatin', NULL, NULL, 'SCUD', NULL, 'Gas
', '3 spots 
Incline, concrete
No RV/trailer


', NULL, NULL, NULL, 'this has a blue ribbon package with Ambient. Please ensure Ambient is aware he is in the program whenever we send Ambient out for service. For HVAC and plumbing, ONLY send Ambient here. He gets the discount on their services.


- This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. 
As of Aug 1, 2025:
An exterior camera is installed facing the driveway to help ensure guest safety and property security.

As of July 31, 2025:
Pest Control : Tennessee Pest Control (865) 888-5105
Gas fireplace yearly maintenance: SCUD Homestore (865) 453-3272 
If you can have them come out every September to check and clean the fireplace and logs inside.
Please use your HVAC company to check and maintain system 2x yearly.

'),
('86dwumzqf', 'Mark Urban 2123', 'live', 'normal', 'none', 'none', true, '2123 Megan Ridge Dr, Sevierville, TN 37876', '2123 Megan Ridge Dr, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 3, 3, NULL, 2, NULL, 2, 3, 1, 1, 11, 6, 'Main Account', 'Haven', '393898', '1015511', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokeys-summit-cabin VRBO LINK: https://www.vrbo.com/4665416 BOOKING.COM LINK: https://www.booking.com/hotel/us/smokeys-summit-epic-view-hot-tub-fireplace.html MARRIOTT LINK:https://homes-and-villas.marriott.com/en/properties/40547787 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/393898 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1DM_9cXSOIsHx8JwHUfYG3x0upQHKjMNySQGUSj5Vje8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1qFYZGSW45Nf-9QR12P8JtIGP5dxdE5Md GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQkorGn_j_tYr6ARAC/overview?g2lb=43807868', '5150', NULL, '1672', 'Owner Code: 9696 | Vendor Code: 4624', 'Network information: Wi-Fi Name: SmokeysSummit Wi-Fi Password: Smokey2123!', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, NULL, '4 spots
Long, pavement, incline.
No RV/Trailer
 
', 'Firm', '25th of the month', NULL, 'As of Mar 19, 2026:
- This is a pet-friendly property. There will be a fee of $125.00 per pet. Please note that no pets should be over 50 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

As of Mar 17, 2026:
$319 on CE
$350 on HKF
'),
('86dwu42c1', 'Katrina Maloney 659', 'live', 'normal', 'none', 'none', false, '659 Stockton Dr, Pigeon Forge, TN 37876', '659 Stockton Dr, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 1, 2, 1, 1, NULL, 1, NULL, 1, 1, 4, 2, 'Main Account', NULL, '393226', '1012474', NULL, 'AIRBNB LINK: https://airbnb.com/h/rustic-retreat-hottub VRBO LINK: https://www.vrbo.com/4685424 BOOKING.COM LINK:https://www.booking.com/hotel/us/rustic-retreat-jacuzzi-fireplaces-views.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40550161 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/393226 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1vAA-MvFYcOzfNG4brftuS_2HoRN06PhrruQndfCBt30/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Q4IiMBJdY-fw_yFrzGLDfU9QKoDTP7j5 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ_pnfn5yQoPx7EAI=/overview?g2lb=43807868', '5621', NULL, '0', '8667', 'Wi-Fi Name:RydersView Wi-Fi Password: RydersView659', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
incline, pavement
No RV/trailer


', NULL, NULL, NULL, NULL),
('86dwu41mh', 'Pooja Mehta 2933', 'live', 'normal', 'none', 'none', false, '2933 Fiddlers Creek Way Pigeon Forge TN. 37863', '2933 Fiddlers Creek Way, Pigeon Forge, TN 37863, USA', NULL, 'Katie Work', NULL, 5, 5, NULL, 4, NULL, 4, NULL, 1, 1, 12, 7, 'Main Account', 'Haven', '393217', '1012471', NULL, 'AIRBNB LINK: https://airbnb.com/h/spacious-6br-retreat VRBO LINK: https://www.vrbo.com/4622484  BOOKING.COM LINK: https://www.booking.com/hotel/us/spacious-6br-retreat-with-theater-and-hot-tub.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/393217 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1wxXIAku0F0nVwrgDH1C5fDku0iD6T5w2gbhr5knKg5E/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1qA0gZ8ExM9ckQL-3s0gvoHDE4cib88cJ GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQh4LNzIal5amOARAC/overview?g2lb=43807868', '2159', NULL, '6473', '9024 ', 'WiFi Network:LazyBearLodge  Password: lazybears2933', NULL, NULL, NULL, 'Valley Pest', NULL, NULL, NULL, NULL, NULL, '4 spots
concrete private
No RV/Trailer

', NULL, '25th of the month', NULL, NULL),
('86dwnrnwp', 'Kaley Eversgerd 933', 'live', 'normal', 'none', 'none', false, '933 Buck Way, Sevierville, TN 37876', '933 Buck Wy, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 2, 2, NULL, 1, 1, 1, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '387295', '998259', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-rnr-top VRBO LINK: https://www.vrbo.com/4641525 BOOKING.COM LINK: https://www.booking.com/hotel/us/mountaintop-rnr-hot-tub-roku-tvs-fireplace.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/387295 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1wHHn7wCamTyjgWLIZVm32hFHAM9rtXUEn9ThpMObQ7Y/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1D94tF3WvODVPvnI2b4INMOW2PMDFwsks GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQo8qrrI66mfzJARAC/overview?g2lb=43807868', '0529', 'Blessed - 17', '7519', 'Owner Code: 4908 | Vendor Code: 5179 ', 'Wi-Fi Name: MountainTopRnR Wi-Fi Password: gpc224ds9nt', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', '2 spots
Flat, pavement.
No RV/Trailer

', NULL, NULL, '86dxq7y2r', NULL),
('86dwnefm8', 'Ruth Heath 458', 'live', 'normal', 'none', 'none', false, ' 458 Troy Dr Pigeon Forge, TN 37863', '458 Troy Dr, Pigeon Forge, TN 37863, USA', NULL, 'Lily Bryant Macon', NULL, 3, 2, NULL, NULL, 4, 1, 4, 1, NULL, 14, 8, 'Main Account', 'Haven', '387284', '998258', NULL, 'AIRBNB LINK: airbnb.com/h/cloudspire-chalet VRBO LINK: https://www.vrbo.com/4639539 BOOKING.COM LINK: https://www.booking.com/hotel/us/cloudspire-chalet-arcade-games-outdoor-lounge.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/387284 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1donLCeSDUuqfyycbHXZGc57l2R_Ubj6KUfqSlOU2AmE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/100c0qPNr3wMQa9D0rWM6T83vh8oAWsxu GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ0_jq-d2CiJceEAI=/overview?g2lb=43807868', '2150', NULL, '4135', 'Owner Code: 0220 | Vendor Code: 8807', 'Direct Wifi: WiFi Network: MySpectrumWiFiCB-5G Password:friendoutlet623', NULL, NULL, NULL, NULL, NULL, 'Handled by Owner', NULL, NULL, NULL, '6 spots
2 driveways, one is concrete, the other is gravel and grass.
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86dwn3ry3', 'Tara Rao 116', 'live', 'normal', 'none', 'none', false, '116 Little Round Top Ln, Townsend TN 37882', '116 Little Round Top Ln, Townsend, TN 37882, USA', NULL, 'Lily Bryant Macon', NULL, 2, 2, NULL, 2, NULL, NULL, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '386914', '997687', NULL, 'AIRBNB LINK: https://airbnb.com/h/little-timber VRBO LINK: https://www.vrbo.com/4665415 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-little-timber-cozy-hot-tub-fireplace.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40592280 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/386914 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tDeE6fD8J8n-4TenzzpRPMMLthDBDj6eypZ8hK6fXxc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/10cf8DBZEcd8ZNcrLuxzZeCsBsCK7H0sQ GOOGLE LINK:', '9991', NULL, '0821', 'Owner Code: 9991 | Vendor code: ', 'Network information: Wi-Fi Name: Dollywood Hills Wi-Fi Password: Dolly116', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Incline, pavement
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86dwn3rw0', 'Jordan Sims 1467', 'live', 'normal', 'none', 'none', false, '1467 Licking Spring Way #3, Sevierville, TN 37876', '1467 Licking Spring Way, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 1, 1, NULL, 1, NULL, 1, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '386891', '997685', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-mountain-dove VRBO LINK: https://www.vrbo.com/4639538 BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-mountain-dove-hot-tub-firepit-fireplace.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40577110 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/386891 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1YvjjwZhsVJBnTkbFX4aHVL2wKGlJFzcERKZN82tCUjg/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1OsQYFnWAhFh1istpj9N3JLcEjJvrUEMS GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQgZTupYqpz_kYEAI=/overview?g2lb=43807868', '4203', NULL, '6924', 'Owner Code: 5939 | Vendor Code: 5684', 'WiFi Network:FX3100-1E00 Password: a7e5eaed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'As of Aug 18, 2025:
Instructions on how to go to the cabin: 
Guests and cleaners need to go to Cabin #3

'),
('86dwkuyx7', 'Lowell Weiss 229', 'live', 'normal', 'none', 'none', true, '229 Rodeo Dr, Gatlinburg, TN 37738', '229 Rodeo Dr, Gatlinburg, TN 37738, USA', NULL, 'Lily Bryant Macon', NULL, 4, 3, NULL, 2, 5, NULL, 1, 1, 1, 15, 8, 'Main Account', 'Haven', '385800', '994707', NULL, '  AIRBNB LINK: https://airbnb.com/h/the-smoky-bear VRBO LINK: https://www.vrbo.com/4937037  BOOKING.COM LINK: https://www.booking.com/hotel/us/the-smoky-bear-view-hot-tub-pool-more.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/4065457  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1p_3MFjJqt3rEkr7qZhF_wb_kDLryaYU41zu-i_dBeQY/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ek17V10geKhSsV8b4wuhU_wADxYx0M-5 GOOGLE LINK: ', '4791', NULL, '6794', 'Owner Code: 0317 | Vendor Code: 4562', 'Direct Wifi: WiFi Network: Smoky Bear Lookout Password: 5starreview', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '5 spots
long, incline, pavement
No RV/Trailer

', NULL, '25th of the month', NULL, ' Community Amenities:
The pools are open from Memorial Day weekend through Labor Day Weekend. The Pool Access pass is on a lanyard in the kitchen and should be returned there at checkout.Community Amenities. 
There are 3  outdoor pools in Cobbly Nob     
-Little Bit of Heaven Pool - 734 Sunshine Trail
-Timberidge Pool - 705 Picadilly Lane ​
- Golf Creek Pool - 3649 Birdie Lane
-Tennis court - 3649 Birdie Lane
- Basketball goal - 3649 Birdie Lane

  
'),
('86dwkuyvr', 'Jill Bishop 2719', 'live', 'normal', 'none', 'none', true, '2719 Sawmill Branch DrSevierville, TN 37862', '2719 Sawmill Branch Dr, Sevierville, TN 37862, USA', 'NW Parkway', 'Lily Bryant Macon', NULL, 3, 3, 1, 3, 2, 2, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '385795', '994705', NULL, 'AIRBNB LINK: airbnb.com/h/sawmill-lodge  VRBO LINK: https://www.vrbo.com/4637398  BOOKING LINK: https://www.booking.com/hotel/us/sawmill-lodge-hot-tub-theater-putt-putt-views.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40576860 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/385795  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1vikc0qOxOFLNHeWbff4DOk07v9PZZxC3JYkEy5mQOzE/edit?usp=drive_link  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1gmr50fmeeHDTageMrJorrBkmUl0-bNEL?usp=drive_link GOOGLE LINK: NAhttps://www.google.com/travel/hotels/entity/CgoQ8-SLot2UtOEIEAI%3D/overview?g2lb=43807868&utm_campaign=sharing&utm_medium=link&utm_source=htls&ved=0CAAQ5JsGahcKEwiIp7j5xM6OAxUAAAAAHQAAAAAQBA', '3952', NULL, '0421', 'Owner Code: 8045 | Vendor Code: 8372 ', 'WiFi Network: Sawmill_Lodge Password: mountainmusic', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4 spots
Pavement and gravel, steep, 4x4 only in winter
NO RV/Trailer

', NULL, '25th of the month', '86dznzgx3', NULL),
('86dwkuytn', 'David Sussman 3759', 'live', 'key', 'none', 'none', false, '3759 Revetta Cir, Sevierville, TN 37862, USA', '3759 Revetta Cir, Sevierville, TN 37862, USA', NULL, 'Jordan Lynde', NULL, 6, 5, NULL, 5, NULL, NULL, 2, 1, 1, 12, 7, 'Main Account', 'Haven', '385793 ', '994701', NULL, 'AIRBNB LINK: HTTPS://airbnb.com/h/chalet-bellemont VRBO LINK: https://www.vrbo.com/4578105  BOOKING.COM LINK: https://www.booking.com/hotel/us/chalet-bellemont-view-heated-swim-spa-game-room.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40565794  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/385793  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GadRad868AnEpyCMrCsp8GsZnfifdwvB9gtSQ7wX85Y/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1gXmY1pT41yt5E7hLQ0PB-DHGt0xcmxKy GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ9rHl0YjuzpfrARAC/overview?g2lb=43807868&utm_campaign=sharing&utm_medium=link&utm_source=htls&ved=0CAAQ5JsGahcKEwjAuYGn9J6OAxUAAAAAHQAAAAAQBA', '3521', 'Blessed - 16', '9127', 'Owner Code: 7798 | Vendor Code: 6142', 'Wi-Fi Name: 3759Cabin  Wi-Fi Password:Password1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4 spots
Slight incline, concrete.
No RV/trailer


', NULL, NULL, NULL, 'Fire Table
https://share.icloud.com/photos/099Y5k3OUAi22d-ptkHRykJFg 

For the grill and fire table 

The property has propane there, the gas is a direct line in, and so are the fire pits, fire places, grill.

 
'),
('86dwjz3yg', 'Digant Patel 1554', 'live', 'normal', 'none', 'none', true, '1554 Bears Den Way, Sevierville, TN 37862', '1554 Bears Den Way, Sevierville, TN 37862, USA', NULL, 'Katie Work', NULL, 2, 2, NULL, 1, 2, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '384346', '992268', NULL, 'AIRBNB LINK: airbnb.com/h/mountain-mischief VRBO LINK: https://www.vrbo.com/4639536 BOOKING LINK: https://www.booking.com/hotel/us/mountain-mischief-hot-tub-games-cozy-fireplace.html MARRIOTT LINK: NA DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/384346 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1q5n7whIOfcIEtif9DNvFUzeZ3xIPIxWBo3tRnA9ZH4Q/edit?tab=t.0 OWNER PROFILE FOLDER: https://docs.google.com/document/d/1q5n7whIOfcIEtif9DNvFUzeZ3xIPIxWBo3tRnA9ZH4Q/edit?tab=t.0 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ95HThq-Q5a5KEAI=/overview?g2lb=43807868', 'Lockbox code: 5270', NULL, '0', 'Yale lock entry code: 3669  | Gate Code: 2689', 'WiFi Network: Mountain Mischief WiFi Password: 1554bearsden', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas

', '2 spots
No RV Trailer 

', 'Firm', '25th', '86dxfp7fd', 'Gate Codes
• April – 3674
• May – 2689
• June – 1980
• July – 6574
• August – 8691
• September – 4839
• October – 1645
• November – 2956
• December - 7160
• January  - 1480
• February - 7931

'),
('86dwj1x9b', 'Lindsey Smith 2833', 'live', 'normal', 'none', 'none', false, '2833 Longvale Lane, Sevierville, TN 37862', NULL, NULL, 'Lily Bryant Macon', NULL, 3, 2, NULL, 1, 5, NULL, NULL, 1, 1, 12, 7, 'Main Account', 'Haven', '383100', '988959', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-bear-cabin VRBO LINK: https://www.vrbo.com/4668931 BOOKING.COM LINK: https://www.booking.com/hotel/us/little-bears-cabin-hot-tub-fireplace-grill.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40592974 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/383100 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/19JpIo460hBBom5LbSa3NWqF9vzbi88ZTkpzcDOq0cBA/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1LUv8aOTys0BzX6lUHAazGtKWSj0ua4V8 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQtOP4sLnK-7y7ARAC/overview?g2lb=43807868', '9224', 'Blessed - 49', '4972', 'Owner Code: 2130 | Vendor Code: ', 'Direct Wifi: WiFi Network: Little Bears Cabin Password: happyplace28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric
', '3 spots
Incline, pavement.
No RV/trailer

', NULL, NULL, NULL, 'AS of July 21,2025:
No builder warranty. 
'),
('86dwh6gv1', 'Michelle and Roncie Fernandes 1144', 'live', 'key', 'none', 'none', false, '1144 Cole Ln, Gatlinburg, TN 37738', '1144 Cole Ln, Gatlinburg, TN 37738, USA', NULL, 'Lily Bryant Macon', NULL, 4, 4, NULL, 1, 4, 4, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '382134 ', '986417', NULL, 'AIRBNB LINK:  https://airbnb.com/h/majestic-overlook-smokies VRBO LINK: https://www.vrbo.com/4594663 BOOKING.COM LINK: https://www.booking.com/hotel/us/bearly-dreaming-mtn-view-hot-tub-game-room.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40569250  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/382134  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15AMUN9QoS6tAo9XTqQBLPizn52c0ikBrhUZboeQf28c/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1OOnjr6dWvCscN5QzLTQvqBOGXPbraXgv GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQtLLbw4qhwI0FEAI=/overview', '3145', 'Blessed - 73', '4167', 'Owner Code: 5419 | Vendor Code: 6066', 'Direct Wifi: WiFi Network:BearlyDreaming5 Password: 3LittleBears', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 spots
Incline, pavement
No RV/Trailer


', NULL, NULL, NULL, 'PROPERTY HAS BUILDER WARRANTY - please tag AM/AAM for approval of all repairs moving forward (09/26/25)

A gas grill is available on the property. 
'),
('86dwg8rj6', 'Kevin Ling 5436', 'live', 'normal', 'none', 'none', true, '5436 Briercliff Rd Knoxville, TN 37918', '5436 Briercliff Rd, Knoxville, TN 37918, USA', 'Knoxville', 'Regina Shrout', NULL, 3, 2, NULL, 1, 1, 1, 2, 1, NULL, 8, 4, 'KnoxStaytion Account', 'KnoxStaytion', '381210 ', '984041', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-knoxville-nest VRBO LINK: https://www.vrbo.com/4715520 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-knoxville-nest-cozy-3br-retreat-w-fireplace.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40563245 DIRECT BOOKING SITE LINK:http://stay.havenvacationrentals.com/listings/381210 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1b8KaFJ8ZORaREti3L7NkXNsvYf8wvpnqatx_fGp6Vxo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1HCl9PzzsnNH2a0Jx4IrKRnxwtfQDeOAF GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ-qDShbSNmpl6EAI=/overview?g2lb=43807868', '0394', 'Knox Storage - 16', 'Yale lock entry code:6497', 'Owner Code:2509 | Vendor Code: 3157', 'WIFI network: XFSETUP-4328 Password: flight4040entry', NULL, NULL, NULL, 'Alta Pest Control', NULL, 'Brad Whaley', NULL, NULL, NULL, '4 spots
Incline, concrete.
No RV/Trailer

', NULL, '25th of the month', NULL, 'Correct WIFI Details

WIFI network: XFSETUP-4328
Password: flight4040entry

As of Aug 18, 2025:
The number for Alta Pest Control is (865) 413-5294.

'),
('86dwg8rf7', 'Geri Giddens 437', 'live', 'key', 'none', 'none', false, '437 Keegan Dr Pigeon Forge, TN 37863', '437 Keegan Dr, Pigeon Forge, TN 37863, USA', NULL, 'Lily Bryant Macon', NULL, 8, 7, NULL, NULL, 5, 1, 6, 1, 1, 18, 10, 'Main Account', 'Haven', '381205 ', '984036', NULL, 'AIRBNB LINK: https://airbnb.com/h/enchanted-mountain-escape VRBO LINK: https://www.vrbo.com/4639535 BOOKING.COM LINK: https://www.booking.com/hotel/us/enchanted-mountain-escape-hot-tub-grill-games.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40532795 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/381205 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1sSatGGkhNKJMpBYvoLYkc9uAGqXJw2emGGpMBzbEvq0/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1E_eU8tfrHic952ZzEzlxpOy3xRG6Z6SB GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQhJSYhtH934fgARAC/overview?g2lb=43807868', '2135', 'Blessed - 2', '4617', 'Owner Code: 4191 | Vendor Code: 1290', 'Direct Wifi: WiFi Network:SpectrumSetup-BB Password:barreljudge150 | Network Name: MySpectrumWiFi00-2G or MySpectrumWiFi00-5G Wifi Password: tinycity401', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'only operational from October 1 - April 1.
', ' incline, concrete, 2 driveways, 3 spots on the long one, 4 spots on the other one.: 
NO RV/Trailer

', NULL, NULL, NULL, NULL),
('86dwe28j3', 'Melissa Allen 3666', 'live', 'normal', 'none', 'none', false, '3666 Marshall Ln Sevierville, TN 37862', '3666 Marshall Ln, Sevierville, TN 37862, USA', NULL, 'Lily Bryant Macon', NULL, 3, 3, NULL, 3, 1, 1, NULL, 1, 1, 10, 6, 'Main Account', 'Haven', '378580', '972873', NULL, 'AIRBNB LINK: airbnb.com/h/smokies-cabin-life VRBO LINK: https://www.vrbo.com/4668930 BOOKING.COM LINK: https://www.booking.com/hotel/us/smokies-cabin-life-view-hot-tub-grill-game-room.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40547791 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/378580 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/12Ifjwh4rMmMceSzSBkRe1vMShd-jbyTG74JmhgHNGFo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1nZ90aHx5d6kp2WrVemkbPYI9j9LEABbo GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQpYX47u2_nq2iARAC/overview?g2lb=43807868', '4653', 'Blessed - 3', '6379', 'Owner Code: 1099 | Vendor Code: 7820', 'Direct Wifi: WiFi Network:Cabin Life Password: effect76390dodge', NULL, NULL, NULL, NULL, NULL, 'Handled by Owner', NULL, NULL, 'Gas
', '3 spots
Pavement,  incline on both 
No RV/Trailer


', NULL, NULL, NULL, NULL),
('86dwd193p', 'Glen Peterson 3710', 'live', 'key', 'none', 'none', false, '3710 Weber Rd c303 Gatlinburg, TN 37738', NULL, 'Pittman Center', 'Summer Mathews', NULL, 2, 1, NULL, 1, NULL, NULL, 2, 1, NULL, 4, 2, 'Main Account', 'Haven', '376944', '967952', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-mountain-luxurious-serenity  VRBO LINK: https://www.vrbo.com/4624734  BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-mountain-luxurious-serenity.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40574766  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/376944  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1FrcVnL8wPtbtOCnMu4DfAyS2dH6X3A5740Ey2EfjE4A/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1oLKI8kAHaCUKtiV0C3axZc-wcDlPAej_ GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQjf2ctb-xtLbzARAC/overview', '3841', 'Blessed - 52', '9124', 'Owner Code: 5979 | Vendor Code: ', 'Direct Wifi: Network name: C303 Network password: BlackBear', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '  As of July 21, 2025:
All tasks, including purchases, require owner approval. 

'),
('86dwd190t', 'Glen Peterson 5175', 'live', 'key', 'none', 'none', true, '5175 Riversong Way Severville, TN 37876', '5175 Riversong Way, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 2, 2, 1, NULL, 1, 1, 4, 1, 1, 8, 4, 'Main Account', 'Haven', '376938', '967948', NULL, ' AIRBNB LINK: https://airbnb.com/h/multi-level-getaway-smokies VRBO LINK: https://www.vrbo.com/4873968  BOOKING.COM LINK: https://www.booking.com/hotel/us/multi-level-getaway-pool-hot-tub-and-fireplace.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/376938 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1r5hBZKbIjsHA53Lck_t6xnzyZWHp60sHEcKHcK6eMaU/edit?usp=drive_web&ouid=112043874674402029607 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1XOQtpx7NnGOqmpRN_9h9z7FR-S8F9lkk GOOGLE LINK:  ', '7498', NULL, '9734', 'Owner Code: 5979 | Vendor Code: 7855', 'Network Name: MutiLevel Getaway Password: getaway5175', NULL, NULL, NULL, NULL, 'Precision Pools', NULL, NULL, NULL, NULL, '4
', 'Firm', '25th', NULL, 'As of Dec 23, 2025
The property is on well water. 
'),
('86dwd18wx', 'Glen Peterson 233', 'live', 'key', 'none', 'none', true, '233 Cherokee Path Way Sevierville, TN 37876', '233 Cherokee Path Way, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 3, 2, NULL, NULL, 3, 2, NULL, 1, 1, 10, 6, 'Main Account', 'Haven', '376933', '967945', NULL, 'AIRBNB LINK:  https://airbnb.com/h/boujee-bear VRBO LINK: https://www.vrbo.com/4542529  BOOKING.COM LINK: Not pushed yet!  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40513147-sevierville-the-boujee-bear-mtn-view-hot-tub-foosball  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/376933  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GMK10eeZNsmCF8iZQAn9xA1HxbgQzqBME5JWp8CCBvs/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1roZJBkaTBmUnPTXhBbOysTfWm-8sD4RP GOOGLE LINK: ', '7108', 'Blessed - 71', '7268', 'Owner Code: 5979 | Vendor Code: 0611', 'Direct Wifi: WiFi Network:233Cherokee Password:BlackBear', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric

', '2 spots
Pavement, incline.
No RV/Trailer

', 'Strict', '25th', NULL, '  As of July 21, 2025:
All tasks, including purchases, require owner approval. 

As of August 4, 2025:
Hot tub gate code: 1111 or 2222

'),
('86dwbnpez', 'Dylan Robinson 768', 'live', 'key', 'none', 'none', true, '768 Village Loop Road, Gatlinburg, TN 37738', NULL, 'West Gatlinburg', 'Summer Mathews', NULL, 5, 4, 1, 4, NULL, 4, NULL, 1, 1, 16, 10, 'Superhost Account', 'Superhost', '375171', '965955', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-village-getaway VRBO LINK: https://www.vrbo.com/4564025  BOOKING.COM LINK: https://www.booking.com/hotel/us/the-lookout-at-chalet-village-hot-tub-games-more.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40518323 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/375171  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1F0xN9Qm4IB-vWBdWvzohIylMNGwSGFX_Igl_9hLdxT4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1UdzdqkWyMEE7qfGx_W2WeB4SBZ-KAkLH GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ4LO2pdLv9ctfEAI%3D/overview', '4143', 'Blessed - 23', '0', 'Owner Code: 0101 | Vendor Code: 7981', 'Direct Wifi: WiFi Network: A Frame 768 Password: 768guest!', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4 spots
Pull in concrete lot
No RV/Trailer
', NULL, NULL, '86dwufgw9', '
the door lock was finally installed on the sliding glass door on May 19. It should be good now! 

If the attic area becomes hot, encourage guests to turn on the fan. The top floor has its own AC unit, but the fan helps circulate air to keep it cool. To operate the fan, turn on the switch on the wall and control it with the remote.
 
The closet beside the washer contains the iron, ironing board, air filters, and extra light bulbs.
 

COMMUNITY POOL INFO: (Chalet Village)

Guests have access to the 3 community pools & clubhouses, tennis courts & playground!
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.

South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

Chalet Village Office Address: 1319 south baden drive

'),
('86dwb1j1q', 'Elizabeth Garcia 309', 'live', 'junior', 'none', 'none', false, '309 Elk Cove Wy Gatlinburg, TN 37738', '309 Elk Cove Wy, Gatlinburg, TN 37738, USA', NULL, 'Lily Bryant Macon', NULL, 3, 2, NULL, 2, NULL, 2, 1, 1, 1, 9, 5, 'Main Account', 'Haven', '374406', '963833', NULL, ' AIRBNB LINK: https://airbnb.com/h/smoky-mountain-gem VRBO LINK: https://www.vrbo.com/4515280H  BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-mountain-gem-mtn-view-hot-tub-grill.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40507591 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/374406 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/13AIMQnNpSt-cA4wW0qH5OpdUynVWXouurDik36lke7Y/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/15cNzz1_pxKOE7lMdWUJL26nCCqvR6N2v GOOGLE LINK: ', '3360', 'Blessed - 74', '1453', 'Owner Code: 6653 | Vendor Code: 5539', 'Direct Wifi: WiFi Network: Smoky mountain gem Password: goofysled244', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas
', '2 parking spots
Pavement, slight incline
No RV/trailer
', NULL, NULL, NULL, 'ALL Tasks must be approved by the owner first. Please tag AM/AAM for all repairs. 
'),
('86dwb1hxt', 'Dustin Francis 3213', 'live', 'normal', 'none', 'none', false, '3213 Smoky Ridge Way Sevierville, TN 37862', '3213 Smoky Ridge Way, Sevierville, TN 37862, USA', 'SW Parkway', 'Lily Bryant Macon', NULL, 2, 2, NULL, 2, NULL, NULL, 2, 1, 1, 6, 4, 'Main Account', 'Haven', '374404', '963831', NULL, 'AIRBNB LINK: https://airbnb.com/h/smoky-ridge-hideaway VRBO LINK: https://www.vrbo.com/4641522 BOOKING.COM LINK: https://www.booking.com/hotel/us/smoky-ridge-hideaway-views-hot-tub-game-room.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/374404GREEN LIGHT DOC LINK: https://docs.google.com/document/d/17OtdHZr_qoK3jDRMY5YuL4Mu2-j4opfsiJDaiWSoIy8/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1w6KxeuqPJnL6dgXdWk-cE0-pf-H3LZmm GOOGLE LINK: ', '2215', NULL, '4319', 'Owner Code: 7928 | Vendor Code 4902', 'Direct Wifi: WiFi Network:RememberWhen Password:RememberWhen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric
', '2 spots
Concrete, slight incline.
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86dwb1htu', 'John Kirkman 510', 'live', 'normal', 'none', 'none', false, '510 Houser Rd, Gatlinburg, TN 37738', NULL, NULL, 'Lily Bryant Macon', NULL, 5, 3, NULL, 2, 3, 2, 2, 1, 1, 15, 8, 'Main Account', 'Haven', '374398', '963826', NULL, 'AIRBNB LINK: https://airbnb.com/h/secluded-escape VRBO LINK: https://www.vrbo.com/4564022  BOOKING.COM LINK: https://www.booking.com/hotel/us/secluded-escape-views-hot-tub-outdoor-lounge.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/374398 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/17iDvJ2ngaigFVMKoTY_cI4WWKN-m88TNne5-uT2RhhU/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1DXKHZI7Ln7Km10RjErYcCfK5KFe6Js1Z GOOGLE LINK: ', '6923', NULL, '5719', 'Owner Code: 5885 | Vendor Code: 4459', 'Direct Wifi: WiFi Network: SpectrumSetup-42 Password: bluesquirrel577', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '8 spots
pavement, incline
no rv/trailer

', NULL, NULL, NULL, NULL),
('86dwadd7h', 'Cameron Penn 1750', 'live', 'normal', 'none', 'none', false, '1750 Oakridge View Ln, Sevierville TN 37876', '1750 Oakridge View Ln, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 2, 2, NULL, 1, 2, 1, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '373559', '961341', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-natures-nest VRBO LINK: https://www.vrbo.com/4549113  BOOKING.COM LINK: https://www.booking.com/hotel/us/natures-nest-mtn-view-hot-tub-arcade-games.html  MARRIOTT LINK: villas.marriott.com/en/properties/40514653 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/373559  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1vvwwyEHwLCWu65oNJQmibn3IhZE032ntVRD_Xt99iGo/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1X2Rt0VxANNkVfff2vsAkLfNpYsxYINji GOOGLE LINK: ', '5280', 'Blessed - 55', '6719', 'Owner Code: 6805 | Vendor Code: 1657', 'Direct Wifi: WiFi Network: Natures Nest Password: BMC20022', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
 incline, pavement.
No RV/Trailer

', NULL, NULL, NULL, 'As of Mar 26,2026:
Removed cable TV from the listing
'),
('86dw7tfwb', 'Mark Mobley 135-102', 'live', 'normal', 'none', 'none', false, '135 S Central St APT 102, Knoxville, TN 37902', '135 S Central St #102, Knoxville, TN 37902, USA', NULL, 'Summer Mathews', NULL, 2, 1, NULL, NULL, 2, NULL, NULL, 1, NULL, 4, 2, 'KnoxStaytion Account', 'KnoxStaytion', '370539', '952489', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-quiet-old-city-knoxville VRBO LINK: https://www.vrbo.com/4502965 BOOKING.COM LINK: https://www.booking.com/hotel/us/the-quiet-old-city-hideout.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/370539 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/16xRc-aVQw8Gz90_IhAuSLq1z7hRtaUFDcsXSqkbvpJE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1_gxG01svEj5R1GHpn5HAE-tcy9c69rny GOOGLE LINK: ', '2371', NULL, '4025', 'Owner Code: 8050 | Vendor code: 3610', 'Direct Wifi: WiFi Network:102Wifi Password:*98Xfinity', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'As of Mar 17, 2026:
Gate Access:
Please note that the push-button code entry on the gate is decorative only and does not unlock the gate. If the gate is closed and does not open easily, please reach for the handle on the opposite side to open it manually. During your stay, you’re welcome to leave the gate barely closed to make entry easier.

As of Dec 23, 2025:
Per owner: 
There’s a large trash can on the porch that you’re welcome to use for full kitchen trash bags. It’s fully enclosed, so it’s reserved just for our guests. For additional trash, there’s a convenient trash collection station located just to the right of the back parking lot, only a few hundred feet away, where you can dispose of everything easily.

'),
('86dw7pz05', 'Kristen Cannon 428', 'live', 'normal', 'none', 'none', false, '428 Moody Dr Gatlinburg, TN 37738', '428 Moody Dr, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Summer Mathews', NULL, 4, 3, NULL, 1, 2, 2, 3, 1, 1, 12, 7, 'Main Account', 'Haven', '370546 ', '952493', NULL, 'AIRBNB LINK: https://airbnb.com/h/moody-mountain-lodge VRBO LINK: https://www.vrbo.com/4511313  BOOKING.COM LINK: https://www.booking.com/hotel/us/moody-mountain-lodge-mtn-views-hot-tub-gameroom.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/370546 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1LKwrWPJg0hSixwoCWmoIqhe5gjj6ka_rVR6UufCzy40/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/18V4IAZC04kTzRf9V66kK4Il9GL09UJ3V GOOGLE LINK: ', '2418', NULL, '9173', 'Owner Code: 9621 | Vendor Code: 0591', 'DIRECT WIFI Network name: MoodyMountainLodge Network password: lodge428', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', '2 spots
Steep, concrete, 4x4 needed in winter.
NO RV/Trailer

', NULL, NULL, NULL, 'Update: 23 May
Please advise AM before any purchases or repairs for the cabin. The owner wants to be informed first.

'),
('86dw7ee15', 'Michael Hooper 2335', 'live', 'junior', 'none', 'none', true, '2335 Summer Ln, Sevierville, TN 37876', '2335 Summer Ln, Sevierville, TN 37876, USA', NULL, 'Regina Shrout', NULL, 1, 1, NULL, 1, NULL, NULL, NULL, 1, 1, 2, NULL, 'Main Account', 'Haven', '370142 ', '951841', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-secret-nest-smokies  VRBO LINK: https://www.vrbo.com/4511312  BOOKING.COM LINK: https://www.booking.com/hotel/us/the-secret-nest-hot-tub-jacuzzi-tub-grill.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/370142  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1h-R3NuM2-lSIw_LvM_c0rkjZli5Jq2J6QNmIdefWI-o/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1_qTBIWi2e3e9xaGFCHhLcWccciraD55U GOOGLE LINK: ', '2481', NULL, '4573', 'Owner Code: 3103 | Vendor code: 0772', 'DIRECT Wifi Network name: Netgear87 Network password: breezyspider299', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Pavement, slight incline.
No RV/Trailer
', NULL, NULL, NULL, NULL),
('86dw7edz4', 'Kylie Willis 914', 'live', 'normal', 'none', 'none', false, '914 E Fir Street, Sevierville, TN 3787', 'Moutain momma cabin, 914 E Fir St, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 2, 2, NULL, 2, 1, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '370119 ', '951838', NULL, 'AIRBNB LINK: airbnb.com/h/blue-mist-lodge VRBO LINK: Not pushed yet!  BOOKING.COM LINK: Not pushed yet!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1PIOWpGnzezdCZCGfs0pSWtg6Jx8c1CffhH3a18Uw3Co/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ia4jFA3ZbAFCAjy-l1aSKEMwyGn0tzFj GOOGLE LINK: ', '1938', NULL, '3645', 'Owner Code: 5690 | Vendor code: 4850 ', 'Direct Wifi: WiFi Network: Spectrumsetup-beaf  Password: roundfish329', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Incline, pavement
NO RV/Trailer
', NULL, NULL, NULL, ' Trash code -  3121
'),
('86dw7edxf', 'Walter Franey 3325', 'live', 'key', 'none', 'none', false, '3325 Shagbark Hickory Ridge. Sevierville, TN', '3325 Shagbark Hickory Ridge, Sevierville, TN 37862, USA', NULL, 'Summer Mathews', NULL, 3, 3, 1, 3, NULL, NULL, 2, 1, 1, 9, 5, 'Main Account', 'Haven', '373390', '952216', NULL, ' AIRBNB LINK: https://airbnb.com/h/big-blue-ridge-cabin VRBO LINK: https://www.vrbo.com/4502964 BOOKING.COM LINK: https://www.booking.com/hotel/us/big-blue-ridge-mtn-views-hot-tub-pool-table.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/370390 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1uDE6KSwYcIve167Cz3S1mNTBvQcT7SLF8djr5tBOUGQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1_BfEfY41Uv8o_sAnALlyJ5lUedKL8_Gf GOOGLE LINK: ', '2162', NULL, '2639', 'Owner Code: 3201 | Vendor Code: 7805', 'Direct Wifi: WiFi Network:BigBlueRidge Password:Shag3325', NULL, NULL, NULL, 'Thomas Pest Control', NULL, NULL, NULL, NULL, NULL, '3 spots
Incline, pavement and gravel.
no rv/trailer
', NULL, NULL, '86dwv32wz', 'Community Outdoor Pool
Availability will be posted soon!

With community pool
Details yet to be posted

no code or pass required

Lockbox: Attached to the post in the back deck
Bottom lockbox code: 2616

Crawlspace: 1968 or 1969

UPDATE:
For lawn care services, please reach out to the vendor below. NOTE: Please ensure that Blessed Cleaning is not doing the lawn care for this property. 

Lawn care: Wanda with Reliable Lawn Service
Email address: wandalatham25@yahoo.com
Phone: 865-654-2621

Pest Control: Thomas Pest control

 Fire extinguisher vendor:
- Erica Brown from Life Safety Inspections.
email address: erica@lsitn.com  

They do annual inspections for both cabins. They may be able to provide replacements at a discount. Please coordinate with them for the fire extinguishers.   

Gate Access: 
How to access the  Shagbarkguest.com
User:tfraney
Pswd: Wildcats
5:25
"Make sure each group is entered as one check-in; otherwise, they will charge us more. It''s $10 per car plus $10 per check-in."
 
'),
('86dw5jt8t', 'Erica Sadler 1625', 'live', 'normal', 'none', 'none', true, '1625 Bear Claw Way, Sevierville, TN 37876', '1625 Bear Claw Way, Sevierville, TN 37876, USA', 'SE Parkway', 'Lily Bryant Macon', NULL, 3, 2, NULL, 1, 1, 2, NULL, 1, 1, 7, 4, 'Main Account', 'Haven', '367983', '946768', NULL, 'AIRBNB LINK: https://airbnb.com/h/bear-claw-hideaway VRBO LINK: Not pushed yet!  BOOKING.COM LINK: https://www.booking.com/hotel/us/bear-claw-hideaway-view-hot-tub-lifesize-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/367983   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GLEkl16fY3jvdjaU7ZGvSW_ApV3eAMhjANzqdg9S3Yw/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/16T7Wj7T_tkswqSv4Ev-9YzJspP2TKYqs  GOOGLE LINK: ', '3654', NULL, '1622', 'Owner Code: 2669 | Vendor Code: 8400', 'Network information: Network name: Haven Vacation rentals Guest Network password: havenguest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric
', '4 spots
Incline, Pavement
No RV/Trailer

', 'Strict', '25th of the month', NULL, NULL),
('86dw5jt7e', 'Mike Nahom 622', 'live', 'normal', 'none', 'none', false, '622 Timber Ridge Rd, Gatlinburg, TN 37738', '622 Timber Ridge Rd, Gatlinburg, TN 37738, USA', NULL, 'Summer Mathews', NULL, 2, 2, 1, 1, 1, 1, 2, 1, 1, 8, 4, 'Main Account', 'Haven', '368011 ', '946790', NULL, ' AIRBNB LINK: https://airbnb.com/h/timber-log-cabin VRBO LINK: https://www.vrbo.com/4527656  BOOKING.COM LINK: https://www.booking.com/hotel/us/timber-log-cabin-hot-tub-pool-table-games-more.en-gb.html?label=gen173nr-1BCAso7AFCLnRpbWJlci1sb2ctY2FiaW4taG90LXR1Yi1wb29sLXRhYmxlLWdhbWVzLW1vcmVICVgEaLQBiAEBmAEJuAEYyAEM2AEB6AEBiAIBqAIEuAKjq4rABsACAdICJDczNDhlNTkyLWE4M2YtNGQwZi05YjZmLTYzMDAxZjliNGU0NtgCBeACAQ&sid=8e52459b6d074d681b417ea7e083cf2e&dist=0&keep_landing=1&sb_price_type=total&type=total& MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/368011  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1KNB253Ur5T6aLzHbNIsdVvxqB_PshDmL7vWgAyxOzkM/edit?tab=t.0 OWNER PROFILE FOLDER: WLBY8Az9dkjN2D3cOpxzoSJ_1XFZFa GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQhqDJkcHG0tVsEAI%3D/overview', '3145', NULL, '3047', 'Owner Code: | Vendor Code: 7885', 'Direct Wifi Network name: 622TimberRidge Network password: lightstudio796', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, NULL, '3 spots
 Incline, Pavement
no RV/Trailer

', NULL, NULL, NULL, '  
Unit Gmail Account:
ID: 622timberridge@gmail.com
PW: Welcome3**
 
Lock: 
Schlage:
ID: 622timberridge@gmail.com
PW: Welcome3**
 
Cameras:
Ring
ID: 622timberridge@gmail.com
PW: Welcome3**
 
Thermostats:
Nest
My Personal Gmail Account; I can give you access.
 
Code to Lock Box: 2001
Crawl Space & Owner’s closet: 1978
 
WiFi: ID: 622TimberRidge
Password: lightstudio796
 
Air B&B:Tied to my work email: miken@nmfac.com.https://www.airbnb.com/hosting/listings/editor/50115370/details/custom-link
 
Subs:
Cleaning: Trejos: Cell 865-951-8970
HVAC: Carl Marks: 865-659-8920
Bugs, Monthly Service: Jimmie Murphy jimmiethebugman@gmail.com865-453-5574
 
Some generic info I created on google Doc
 
 
    
'),
('86dw5jt5e', 'Luning Wang 1056', 'live', 'key', 'none', 'none', false, '1056 Black Bear Cub Way, Pigeon Forge, TN 37862', '1056 Black Bear Cub Way, Sevierville, TN 37862, USA', NULL, 'Summer Mathews', NULL, 8, 7, 1, 6, NULL, 4, 6, 1, 1, 24, 16, 'Main Account', 'Haven', '367999 ', '946783', NULL, 'AIRBNB LINK: https://airbnb.com/h/grand-theatre-lodge  VRBO LINK: https://www.vrbo.com/4511309  BOOKING.COM LINK: https://www.booking.com/hotel/us/grand-theatre-lodge-view-hot-tub-pool-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/367999 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1X5dIdxT8ehxPEBqggKziC9GPxB0LDKhjI06XnXzZ7ao/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1MOxiE6x2OPbi6IilCdnbLCLpiiNaiExp GOOGLE LINK: ', '3164', 'Blessed - 77', '9461', 'Owner Code: | Vendor Code: Trash can code: 075', 'Direct Wifi: Network information: Network name: Grand Theatre Guest Network password: Nomad-75!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'City water. Sevier county water department', NULL, '6 spots
Slight incline, pavement.
NO RV/Trailer
', NULL, NULL, '86dxbk23n', 'Pool 
The pool is within the community near "Angels View Wedding Chapel", can find it in google map, about 10 minutes walk from the property. When asked, guests can say they are from Grand Theater Lodge
no /codepasses required
hours to be confirmed by the guests with the admin

Owner''s Closet, please also let them know that those locked closets are Owner’s closets and that they are locked by the homeowner for personal purposes.

As of Mar 10, 2026:
Updated bathroom details: 
On the very bottom floor is 1 full bath & 1 half bath.. 
The main floor has 2 full baths..
One floor up from the main floor has 3 full baths.. very top floor has 0 bathrooms..
'),
('86dw5aepz', 'Cristina Turcan 8540', 'live', 'normal', 'none', 'none', true, '8540 Towns End Ln, Townsend, TN 37882', '8540 Towns End Dr, Townsend, TN 37882, USA', NULL, 'Regina Shrout', NULL, 4, 2, NULL, NULL, 3, NULL, 2, 1, 1, 8, 4, 'Main Account', 'Haven', '367835', '946762', NULL, ' AIRBNB LINK: https://airbnb.com/h/skinners-cabin-townsend VRBO LINK: https://www.vrbo.com/4549109  BOOKING.COM LINK: https://www.booking.com/hotel/us/the-skinners-cabin-hot-tub-fireplace-grill.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/367835 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1OTsoSi--fib_EPb2x2WNG1Ly5eit0E0uZprqvipos4A/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1pCyQJSg7W90_Eu8dggu6ICNzS4cQigQj GOOGLE LINK: ', '8310', NULL, '6740', 'Owner Code: 5223 | Vendor Code: 4649', 'Direct Wifi: WiFi Network: Netgear75 Password: vaststreet244', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Sloped, gravel lot
no rv/trailer

', NULL, NULL, NULL, 'Update: 23 May 2025
Please inform AM first if we need to do something for the cabin. Owner need to know first before any repairs.

 ‘the Yale keypad on the door next to the hot tub, inside the screen door’ 
'),
('86dw4wk9m', 'Kim Mills 1654', 'live', 'key', 'none', 'none', true, '1654 Veterans Blvd #4, Sevierville, TN 37876', '1654 Veterans Blvd #4, Sevierville, TN 37862, USA', NULL, 'Summer Mathews', NULL, 5, 3, NULL, 3, NULL, 4, NULL, 1, 1, 13, 7, 'Main Account', 'Haven', '366679', '944971', NULL, 'AIRBNB LINK: https://airbnb.com/h/grey-wood-lodge VRBO LINK: https://www.vrbo.com/4542520  BOOKING.COM LINK: https://www.booking.com/hotel/us/grey-wood-lodge-hot-tub-fireplace-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/366679 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1A0jn8bnJatpRrzefcOHAieLKrZ4_D218SSGIAuYA0Wc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1LZYIJKnITn1BMGmto9W6m1rYlAqMVgFf GOOGLE LINK: ', '2903', 'Blessed - 10', '8631', 'Owner Code: 8509 | Vendor Code: 3642', 'Direct Wifi: Network name: ATTcZpD65a Network password: t8kit5++ijit', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 spots
 Flat pavement.
No RV/Trailer

', NULL, NULL, NULL, 'As of Feb 4, 2026: 
This is now pet-friendly. There will be a fee of $75.00 per pet. Please note that no pets should be over 50 lbs and we only allow a maximum of 2 dogs. We’re unable to host the following dog breeds: Siberian Huskies, Staffordshire Terriers, Chow Chows, Akitas, Wolf Hybrids, Alaskan Malamutes, Rottweilers, Mastiffs, and Dobermans. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking.  

COMMUNITY POOL INFO: (Alpine)

The community pool is located at 2260 Alpine Village Way.
'),
('86dw4wk8m', 'Kim Mills 2222', 'live', 'key', 'none', 'none', true, '2222 Alpine Village Way Pigeon Forge, TN 37863', '2222 Alpine Village Way, Pigeon Forge, TN 37863, USA', NULL, 'Summer Mathews', NULL, 2, 2, NULL, 2, 1, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '366682', '944972', NULL, '  AIRBNB LINK: https://airbnb.com/h/the-beary-cottage  VRBO LINK: https://www.vrbo.com/4542522 BOOKING.COM LINK: https://www.booking.com/hotel/us/beary-cottage-hot-tub-grill-arcade-games.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/366682 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1BplTRHxIlx_VhZOsvdpcn6GcMYmGQFzmRXIcOlk97eE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/17O_oia1G73osLzmYcVVs1kzQdrkGzQ4o GOOGLE LINK: ', '3912', 'Blessed - 56', '5942', 'Owner Code: 8509 | Vendor Code: 6786', 'Direct WIFI: Network Name: Beary_cottage Network password: Friday13th', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
Flat pavement
No RV/Trailer

', NULL, NULL, '86dwuh712', 'As of Feb 4, 2026: 
This is now pet-friendly. There will be a fee of $75.00 per pet. Please note that no pets should be over 50 lbs and we only allow a maximum of 2 dogs. We’re unable to host the following dog breeds: Siberian Huskies, Staffordshire Terriers, Chow Chows, Akitas, Wolf Hybrids, Alaskan Malamutes, Rottweilers, Mastiffs, and Dobermans. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking.  

Community pool address: 2260 Alpine Village Way. 
'),
('86dw2tfk4', 'Graham Brown 3940', 'live', 'normal', 'none', 'none', false, '3940 Ole Smokey Way, Sevierville, TN 37862', '3940 Ole Smoky Way, Pigeon Forge, TN 37862, USA', NULL, 'Katie Work', NULL, 5, 3, NULL, 2, 2, 4, 2, 1, 1, 14, 8, 'Main Account', 'Haven', '367540', '945905', NULL, 'AIRBNB LINK: https://airbnb.com/h/fourtunate-view-smokies VRBO LINK: https://www.vrbo.com/4479565  BOOKING.COM LINK: https://www.booking.com/hotel/us/mtn-view-community-pool-game-room-hot-tub.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/367540 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1gyGq1YYBC4V1kABkIijCaUhrnD8EOBpYY2i0DOMtwcU/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/16EShIp1lzXl5y3DHWGrwdQPac--IKh4z GOOGLE LINK: ', '0808', NULL, '6195', NULL, 'Direct Wifi: WiFi Network: The Fortunate View Password: Fourtunate3940!', NULL, NULL, NULL, NULL, NULL, 'Rene Hernandez 865-208-3518', NULL, NULL, 'Wood    
', '3-4 spots
Gravel lot
NO RV/Trailer
', NULL, NULL, NULL, NULL),
('86dw1xr1j', 'Sanjay Arukala 1728', 'live', 'normal', 'none', 'none', false, '1728 Scenic Woods Way, Sevierville, TN 37876', '1728 Scenic Woods Way, Sevierville, TN 37876, USA', NULL, 'Katie Work', NULL, 3, 2, NULL, 2, 2, NULL, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '363185', '938426', NULL, 'AIRBNB LINK: https://airbnb.com/h/bear-paw-hideaway VRBO LINK: https://www.vrbo.com/4479563 BOOKING.COM LINK: https://www.booking.com/hotel/us/bear-paw-hideaway-hot-tub-theater-multicade.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/363185 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/13EzABnep7HBtz6T0LV6paKuOfoo4Z-umHRgUppNHYVc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Iz7LLzb8zlq2YgwKIMs-uEy1qoQd5nmF GOOGLE LINK: ', '0628', NULL, '2543', NULL, 'Direct Wifi: WiFi Network: vsat-5g-955418 Password:i90qmhdd83zulgc2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2-3 spots
Pull in concrete lot
no RV/Trailer
', NULL, NULL, NULL, 'Reach out to Matt Taylor (previous owner) for the codes for padlocked bin & locked closet downstairs
865-805-4318


102
'),
('86dvwp161', 'Dylan Robinson Combo 3742/3746', 'live', 'key', 'none', 'none', true, '3742 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', '3742 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', NULL, 'Summer Mathews', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Superhost Account', 'Superhost', '353223', '918710', NULL, ' AIRBNB LINK: https://www.airbnb.com/rooms/1340553022300716744?source_impression_id=p3_1742910004_P3QEuWxj178bQU97 VRBO LINK: https://www.vrbo.com/4415653 BOOKING.COM LINK: https://www.booking.com/hotel/us/splendid-2cabins-sleeps-28-pool-hot-tub-more.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/353223 GREEN LIGHT DOC LINK:  OWNER PROFILE FOLDER:  GOOGLE LINK: ', '3742 (7430) & 3746 (', NULL, '5333 both ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '86dwuh5jm', NULL),
('86dvwp146', 'Dylan Robinson Combo 3738/3734', 'live', 'key', 'none', 'none', true, '3738 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', '3738 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', NULL, 'Summer Mathews', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 16, 'Superhost Account', 'Superhost', '352889', '917891', NULL, 'AIRBNB LINK: https://https://www.airbnb.com/rooms/1339140813191611236?source_impression_id=p3_1742910004_P3QEuWxj178bQU97 VRBO LINK: https://www.vrbo.com/4415651 BOOKING.COM LINK: https://www.booking.com/hotel/us/2-cabins-sleeps-28-8bedroom-pool-hot-tub-game-room.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/352889 GREEN LIGHT DOC LINK:  OWNER PROFILE FOLDER:  GOOGLE LINK: ', '3738 (3465) & 3734 (5080)', NULL, '9734 & 5333 ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '86dwuh5jm', NULL),
('86dvw67nk', 'Shaun Halberstadt 417', 'live', 'top', 'none', 'none', false, '417 Hatchet Way, Pigeon Forge, TN 37863', '417 Hatchet Wy, Pigeon Forge, TN 37863, USA', NULL, 'Summer Mathews', NULL, 3, 4, 1, 2, NULL, 3, 2, 1, 1, 10, 6, 'Main Account', 'Haven', '357048', '927815', NULL, ' AIRBNB LINK: https://airbnb.com/h/twilight-mist-getaway VRBO LINK: https://www.vrbo.com/4475804 BOOKING.COM LINK: https://www.booking.com/hotel/us/twilight-mist-getaway-pool-hot-tub-game-room.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/357048  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1G7Mvg-uIvC2ZQ6wo13F2LwciyPM7JCoN4FBWMFzrb4A/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1t2jgQERCmnrSX1J4ODDPolSIkI8wIgea GOOGLE LINK: ', '1103', NULL, '4817', 'Owner Code: | Vendor Code: | Pool Door Code: 0963', 'Direct Wifi:  WiFi Network: SHR417 Password: 417SHR417', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 spots
paved bricked lot
no RV/trailer

', NULL, NULL, NULL, 'Pool is serviced every check-out. 

Pool door code: 0963

Router''s Location: The router is in a closet in BR on the first floor

Electric is provided by Sevier County Electric System. They can be reached at 865-453-2887, or by visiting their website at: 
  They may ask you for an account number, which is 389330-535. 

Water and sewer services are provided by Sequoia Heights Resort Owners Association, Inc. 

For warranty related items, please contact the following companies:
HVAC – GENT Heating & Cooling – 865-247-5092
Electrical – Southern Service Electric – 423-307-9847
Plumbing – Elite Plumbing – 423-736-1211
Pool – Geo Builder’s & Pools – 423-200-7396
GE Appliances -1-800-432-2737
 
Whirlpool Appliances – 1-800-253-1301
 


'),
('86dvw67ec', 'Stephen Obeng 1580', 'live', 'normal', 'none', 'none', false, '1580 Zermatt Dr, Gatlinburg, TN 37738', '1580 Zermatt Dr, Gatlinburg, TN 37738, USA', NULL, 'Summer Mathews', NULL, 2, 2, NULL, 2, NULL, 2, NULL, 1, 1, 8, 4, 'Main Account', 'Haven', '356573', '926640', NULL, 'AIRBNB LINK: https://airbnb.com/h/wanderers-retreat-smokies VRBO LINK: https://www.vrbo.com/4459383  BOOKING.COM LINK: https://www.booking.com/hotel/us/wanderers-retreat-hot-tub-multicade-grill-more.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/356573 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1uP9nT6NpnongkRzijtbpis_lUn61XnDZDLVIm3ZL3co/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1yUQQkaBL7VrdDyT70TN3uLDujleiidsB GOOGLE LINK: ', '2135', NULL, '0213', 'Owner Code: 3078 | Vendor Code: 3136', 'Direct Wifi: Network name: ATT34Kyr7m Network password: t8#%9zu?svgm', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spots
Extremely steep concrete driveway, must need all/4 wheel drive to get up in extreme rain or snow
no RV/Trailer

', NULL, NULL, '86dwufgw9', 'COMMUNITY POOL INFO: (Chalet Village)

Guests have access to the 3 community pools & clubhouses, tennis courts & playground!
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.

South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

Chalet Village Office Address: 1319 south baden drive
'),
('86dvw67d3', 'Laurie Keenan 2587', 'live', 'normal', 'none', 'none', true, '2587 Windfall Estates Sevierville, TN 37876', '2587 Windfall Estates Dr, Sevierville, TN 37876, USA', NULL, 'Regina Shrout', NULL, 1, 1, NULL, NULL, 1, NULL, 1, 1, 1, 4, 2, 'Main Account', 'Haven', '356560', '926624', NULL, 'AIRBNB LINK: https://airbnb.com/h/whiskey-stone-smokies VRBO LINK: https://www.vrbo.com/4477768 BOOKING.COM LINK: https://www.booking.com/hotel/us/whiskey-stone-hot-tub-fireplace-grill-arcade.en-gb.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/356560 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/17VyAGy46-MLNtHVS2gcAErqKhtYKnfyzvMcoOzbbCl4/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ua-Afksk0JAf8mEKHojl-lIWu4GXDys9 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ45SWipKxzshlEAI=/overview?g2lb=43807868', '7148', NULL, '4961 | Yale lock settings code: 4962', 'Owner Code:  4418 | Vendor Code: 2785', 'WiFi Network:  WhiskeyStone Password: WhiskeyStone25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spots
Pull in gravel lot
No RV/Trailer 

', NULL, NULL, NULL, '**Owner has their own handyman to be called FIRST- Cody Bowman (423) 277-2167
**Please Note: 
Our cabins have deeded access to lake access/boat launch located in the Lake Douglas Resort. However, we have had difficulties getting the seasonal parking passes or getting current information on season timeline and parking restrictions. The lake access is at:  2567 Fleming Way, Sevierville, TN 37876. We do not have any access to any other Lake Douglas Resort amenities (like the pool or clubhouse).


'),
('86dvw67bn', 'Laurie Keenan 2589', 'live', 'normal', 'none', 'none', true, '2589 Windfall Estates Sevierville, TN 37876', '2589 Windfall Estates Dr, Sevierville, TN 37876, USA', NULL, 'Regina Shrout', NULL, 2, 2, NULL, 1, 1, 1, 1, 1, 1, 8, 4, 'Main Account', 'Haven', '356571', '926630', NULL, 'AIRBNB LINK:  https://airbnb.com/h/whiskey-barrel-smokies VRBO LINK: https://www.vrbo.com/4477770  BOOKING.COM LINK:https://www.booking.com/hotel/us/whiskey-barrel-w-hot-tub-arcade-game-fire-pit.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1fFRxxe_cVm9v94mMemM4ruErVAU0vkN26rGMzQUBbpY/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ua-Afksk0JAf8mEKHojl-lIWu4GXDys9 GOOGLE LINK:', '2905', NULL, '2478 | Yale lock settings code: 2479', 'Owner Code: 4418 | Vendor Code: 4593', 'Direct Wifi: WiFi Network: WhiskeyBarrel Password: WhiskeyBarrel25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spots
Pull in gravel lot
NO RV/Trailer

', NULL, NULL, NULL, '**Owner has their own handyman to be called FIRST- Cody Bowman (423) 277-2167
**Please Note: 
Our cabins have deeded access to lake access/boat launch located in the Lake Douglas Resort. However, we have had difficulties getting the seasonal parking passes or getting current information on season timeline and parking restrictions. The lake access is at:  2567 Fleming Way, Sevierville, TN 37876. We do not have any access to any other Lake Douglas Resort amenities (like the pool or clubhouse).

'),
('86dvqxpq3', 'Josh Cowan 2683', 'live', 'normal', 'none', 'none', true, '2683 Valley Heights Dr, Pigeon Forge, TN 37863', '2683 Valley Heights Dr, Pigeon Forge, TN 37863, USA', NULL, 'Katie Work', NULL, 3, 3, NULL, 1, 4, 2, 1, 1, 1, 11, 6, 'Main Account', 'Haven', '351688', '916747', NULL, 'AIRBNB LINK: https://airbnb.com/h/valley-heights-smokies  VRBO LINK: Not pushed yet!  BOOKING.COM LINK: https://www.booking.com/hotel/us/valley-heights-w-hot-tub-life-size-games-lounge.en-gb.html!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1TEdjbb86mf9mPw51yj-otRGwgPBH2v6EUSNkG_omYZQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/11-QuURPd19b6Mqxn554vqC-PnToi65rF GOOGLE LINK', '4521', NULL, '7204', 'Owner Code: 7228 | Vendor code: ', 'Direct Wifi: WiFi Network: BigChill Password: bigchill1', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 parking spots
Flat pavement lot.
No RV/Trailer
', NULL, NULL, '86dxbjmvj', 'no special access needed for the pool per the hoa                                                                                                                                                                                                            Opens May 16, 2025 (weather permitting)
Closes October 13, 2025
This property is not accessible for individuals with mobility impairments or those who require wheelchair access.
312 Greenwood Way, Pigeon Forge, TN 37863, USA
Pool is 2 minutes walk

'),
('86dvp2vvt', 'Walter Franey 2170', 'live', 'key', 'none', 'none', false, '2170 Windswept View Way, Sevierville, TN 37876', '2170 Windswept View Way, Sevierville, TN 37876, USA', 'NW Parkway', 'Summer Mathews', NULL, 3, 2, NULL, NULL, 3, 1, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '349853', '913643', NULL, 'AIRBNB LINK: https://airbnb.com/h/big-blue-mist-smokies VRBO LINK: https://www.vrbo.com/4395173 BOOKING.COM LINK: https://www.booking.com/hotel/us/big-blue-mist-w-hot-tub-grill-fireplace-games.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ar_DkUdjVbdUgrjhS4Ub5n7TPegHJXo-P4F5IEDX_-U/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1gPIkiEuHUs0h5fsqJ4rC4O0CkeMJM1-x GOOGLE LINK: ', '2091', NULL, '1086', 'Owner Code: 3201 | Vendor code: 5516 | Secondary lockbox: 1080', 'Direct Wifi: Network name: Bigbluemist Network password: Wind2170', NULL, NULL, NULL, 'Thomas Pest Control', NULL, NULL, NULL, NULL, NULL, '2 parking spots
Must drive up decently steep hill to reach property (may be hard during severe rain or snow) 
No RV/trailer

', NULL, NULL, NULL, NULL),
('86dvnwc52', 'Daniel Shepherd 2005', 'live', 'normal', 'none', 'none', true, '2005 Mikey St, Sevierville, TN 37876', '2005 Mikey St, Sevierville, TN 37876, USA', 'SE Parkway', 'Summer Mathews', NULL, 2, 2, NULL, 2, 1, NULL, 1, 1, 1, 7, 4, 'Main Account', 'Haven', '349839', '913641 ', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-valley-view-cabin VRBO LINK: https://www.vrbo.com/4393302 BOOKING.COM LINK: https://www.booking.com/hotel/us/valley-view-cabin-view-hot-tub-fireplace-grill.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/349839 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1hAuV3a_05VagWVzZeGunV8RA6AchTLW1P95oWO8Tioc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1GTBT-mzhK0EHiN6yxTF5OFIlfBxJqAJ6 GOOGLE LINK: ', '4072', NULL, '8514', 'Owner Code: 3987 | Vendor Code: 7231', 'Direct Wifi: WiFi Network: Love Shack Password: Dollywood', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spots
Sloped concrete street into small gravel parking area
No RV/Trailer

', NULL, NULL, NULL, 'As of Feb 24,2026:
Removed Firepit from Airbnb title
'),
('86dvnexxh', 'Alex Cameron 1502', 'live', 'low', 'none', 'none', false, '1502 Berry Road, Knoxville, TN 37920', '1502 Berry Rd, Knoxville, TN 37920, USA', 'West Gatlinburg, Knoxville', 'Regina Shrout', NULL, 3, 3, NULL, 1, 1, NULL, 2, 1, NULL, 6, 4, 'KnoxStaytion Account', 'KnoxStaytion', '349115', '912025', NULL, 'AIRBNB LINK: https://airbnb.com/h/knoxville-charm-cottage VRBO LINK: https://www.vrbo.com/4396907  BOOKING.COM LINK: https://www.booking.com/hotel/us/knoxville-charm-cottage-5-miles-to-market-square.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/349115  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1US7qhjnKNPvGS9Cx9tGj_gnC7myHxYndpJu2nhAPROs/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1z-knoHXwEfbmwRTNH6bqukZv_QrZfjnt GOOGLE LINK: ', '6064', NULL, '5369 ', 'Owner Code: 5992 | Vendor code: 2697', 'Direct Wifi: WiFi Network: BerryRoadGuest Password: suaab60641', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2-3 spots available
Pull-in paved lot
No RV/Trailer

', NULL, NULL, NULL, ' Secondary lockbox code: 5367. 
The keys for the garage closet are in here.
This code shouldn''t be given to guests as per the owner

Shade Batteries: The charging cables are in the left drawer under the living room TV. The shades will beep 3-4 times when activated if the battery is low.

'),
('86dvk51tn', 'Chris Montagna 2104', 'live', 'normal', 'none', 'none', true, '2104 Eagle Feather Dr Sevierville', '2104 Eagle Feather Dr, Sevierville, TN 37876, USA', NULL, 'Katie Work', NULL, 3, 3, NULL, 3, NULL, 1, NULL, 1, 1, 8, 4, 'Main Account', NULL, '336450', '886630', NULL, 'AIRBNB LINK: airbnb.com/h/peaky-woods-cabin VRBO LINK: https://www.vrbo.com/4375207 BOOKING.COM LINK: https://www.booking.com/hotel/us/peaky-woods-cabin-hot-tub-game-room-mtn-views.html MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/336450 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/19otfilvS-a97CmA7nLn2_dzJGhpleiEoR5zXf6zPfk8/edit?tab=t.0 OWNER PROFILE https://drive.google.com/drive/folders/1lFulXTwJdUKPi5W98_YUq80MeJ-lT9W0?usp=drive_link GOOGLE LINK: Not pushed yet! ', '7426 | Lockbox location: Panel to the left of front door', NULL, '8481', '2104', 'WiFi Network: SpectrumSetup-6977 Password: statusearth217', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('86dvjtzeu', 'Kachi Nwabuko 2087', 'live', 'normal', 'none', 'none', true, '2087 Kerr Rd, Sevierville, TN 37876', '2087 Kerr Rd, Sevierville, TN 37876, USA', NULL, 'Katie Work', NULL, 3, 3, NULL, 1, 2, 2, NULL, 1, 1, 10, 6, 'Main Account', NULL, '343231', '903476', NULL, 'AIRBNB LINK: airbnb.com/h/galaxy-splash VRBO LINK: https://www.vrbo.com/4440876 BOOKING.COM LINK: https://www.booking.com/hotel/us/galaxy-splash-hot-tub-pool-theater-and-mtn-views.en-gb.html  MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/343231 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tZDYUf5QFvpIhbyFbNiDmwjtLJHnh-jvoY-AZkWloLc/edit?tab=t.0 OWNER PROFILE https://drive.google.com/drive/folders/1ZSukOrcwC9upkBA9yr43GWBrRqQouvq5?usp=drive_link GOOGLE LINK: Not pushed yet!  ', '4127 | Lockbox location: Panel to the right of front door', 'Blessed - 30', '9851', 'Owner Code: 4804 | Vendor code: 3214', 'WiFi Network: SpectrumSetup-2D7C Password: bestbonus445', NULL, NULL, NULL, 'Thomas Pest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Pool Door Code: 2021

'),
('86dvax84t', 'Nicole Allison 3690', 'live', 'junior', 'none', 'none', true, '3690 Plaza Way, Pigeon Forge, TN 37863', NULL, NULL, 'Lily Bryant Macon', NULL, 2, 2, 1, 1, 2, 1, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '336439', '886627', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-hillside-hideaway VRBO LINK: https://www.vrbo.com/44795 BOOKING.COM LINK:https://www.booking.com/hotel/us/hillside-hideaway-community-pool-grill-more.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/336439 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GkdoQeLjtEdInLFJJUr2Qa__8u4Vl-nSjGpOODHjmnc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1E6ajdyT9W6wIEc0_QcKX9V0ungbCQuTB GOOGLE LINK: ', '6083', NULL, '8085', 'Owner Code: 1360 | Vendor Code: 5989', 'Direct Wifi: Network name: PCST Guest 136 Network password: Army1776', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1 spot
 Paved parking along street
 NO RV/Trailer
', NULL, NULL, NULL, 'Update: 23 May
Please inform AM first before purchasing any item for the condo.

WiFi Network: PCST Guest 136
Password: Army1776

'),
('86dv8j45x', 'Renee Carter 123', 'live', 'normal', 'none', 'none', true, '123 Cutter Gap Rd Townsend, TN 37882', '123 Cutter Gap Rd, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', NULL, 2, 2, NULL, NULL, 3, 1, NULL, 1, NULL, 8, 4, 'Main Account', 'Haven', '332092', '880169', NULL, 'AIRBNB LINK: airbnb.com/h/peaceful-heights VRBO LINK:https://www.vrbo.com/4341289 BOOKING.COM LINK: https://www.booking.com/hotel/us/peaceful-heights-with-cozy-decks-and-smart-tvs.en-gb.html  MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/332092 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1XC5O07SimG3LpkpBaAq-7sX7bBZn6YOt7UZf97-TlOU/edit?tab=t.0  OWNER PROFILE https://drive.google.com/drive/folders/1jzAQJSE1S10BSpwPbWSzGTIzsXUjqNL1?usp=drive_link GOOGLE LINK: Not pushed yet!  ', '0729 | Lockbox location: Pole at the far end of the front porch', 'Knox Storage - 15', '3516', '3516', 'Network name: Renee Cottage Network password: al5061624 ', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gate Code: 20057 and press EnterGate.


'),
('86dv7vzym', 'Paul Leamon 1120', 'live', 'normal', 'none', 'none', false, '1120 Condo Dr Gatlinburg, TN 37738', '1120 Condo Dr, Gatlinburg, TN 37738, USA', NULL, 'Summer Mathews', NULL, 5, 5, 1, 4, 3, 1, NULL, 1, 1, 16, 10, 'Main Account', 'Haven', '331435', '877810', NULL, 'AIRBNB LINK: airbnb.com/h/hillbilly-hilton VRBO LINK: https://www.vrbo.com/4341283  BOOKING.COM LINK: https://www.booking.com/hotel/us/hillbilly-hilton-hot-tub-game-room-mtn-view.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40460775  DIRECT BOOKING SITE LINK: Not pushed yet! GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1b--ppm_l0Z_RZuTPOmUo-KGDCjTqQGfCJ5jNXDlqFQ8/edit?tab=t.0 OWNER PROFILE https://drive.google.com/drive/folders/147Yq4fK2Qu8scWcFcl3b5I3v5hinLO5U?usp=drive_link GOOGLE LINK: Not pushed yet!  ', '1970', NULL, '7623', 'Owner Code: 6001 | Vendor Code: 5504| Yale lock settings code: 7624', 'WiFi Network: MySpectrumWiFi13-5G Password: barreljudge910', NULL, NULL, NULL, 'Thomas Pests', NULL, 'Brad Whaley', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'As of April 14, 2026:
Updated info from gas to charcoal grill

As of Feb 17, 2026:
Updated from electric to gas fireplace

As of Dec 2, 2025: 
Pest Control: Thomas Pests
'),
('86dv7eru8', 'Angela Newell 1428', 'live', 'normal', 'none', 'none', true, '1428 S Baden Drive Gatlinburg, TN 37738', '1428 S Baden Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Regina Shrout', NULL, 2, 4, NULL, 2, NULL, 2, NULL, 1, 1, 6, 4, 'Main Account', NULL, '330381', '876218', NULL, 'AIRBNB LINK: airbnb.com/h/heights-retreat-cabin VRBO LINK:  https://www.vrbo.com/4375206 BOOKING.COM LINK: https://www.booking.com/hotel/us/heights-retreat-mountain-views-hot-tub.en-gb.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/330381 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GSmTdZQNCwzrsnuZqzP9gxxPyUf_oeEEICKQK6GZpiM/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1Y27giFiPn-l0MfVNAt2SqaSjahAcz-gJ GOOGLE LINK:', '5237', NULL, '4560', NULL, 'Direct Wifi: WiFi Network: SpectrumSetup-D5 Password: betterextent917', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Sloped, thin concrete lot
Parking: 1, 2 if you block one car in
No RVs/Trailers
', NULL, NULL, '86dwufgw9', 'COMMUNITY POOL INFO: (Chalet Village)

 

Guests have access to the community pool! 
This house is in the Chalet Village - guests have access to 3 clubhouses. 
Chalet Village Office Address: 1319 south baden drive 
Contact: Ken with Chalet Village - 865-436-4440 
Pools are open Friday of Memorial Day Weekend thru Labor Day. 
Pool Hours are 9am to 9pm. Passes in property.

 ***Please Note: Lost passes will result in the guest being required to pay a $50 fee.
 South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays. 
North Pool is located at 705 Village Loop Road. Closed on Wednesdays. 
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesday

3 Seasonal Outdoor Swimming Pools
'),
('86dv1wwj8', 'Jeanine Roddy 2940', 'live', 'normal', 'none', 'none', true, '2940 All Saints Way, Knoxville, TN 37920', '2940 All Saints Wy, Knoxville, TN 37920, USA', NULL, 'Regina Shrout', NULL, 2, 1, 1, NULL, 2, NULL, 1, 1, NULL, 5, 4, 'KnoxStaytion Account', 'KnoxStaytion', '322672', '862979', NULL, 'AIRBNB LINK: https://airbnb.com/h/modern-city-escape  VRBO LINK: https://www.vrbo.com/4375204  BOOKING.COM LINK: https://www.booking.com/hotel/us/modern-cityscape-downtown-knoxville.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/322672 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/10BxIEVScdvsol1KiZVrLy7nAHsUWSQUqGRnnUJt0FvQ/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1kMp-AtH8q8WQr1AVuibwPRaHnVvCjzgZ  GOOGLE LINK: ', '0', NULL, '2070', 'Owner Code: 4534 | Vendor code: 3960', 'Direct Wifi: WiFi Network: KUB 2940 Password: Rockytop', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spot
paved lot 
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86dv1quet', 'Chris Scarth 1091', 'live', 'normal', 'none', 'none', true, '1091 Towering Oaks Drive Sevierville, TN 37876', '1091 Towering Oaks Dr, Sevierville, TN 37876, USA', NULL, 'Lily Bryant Macon', NULL, 3, 3, 1, 1, 2, 1, 2, 1, 1, 11, 6, 'Main Account', 'Haven', '322586', '862976', NULL, 'AIRBNB LINK: https://airbnb.com/h/highland-haven-smokies VRBO LINK: https://www.vrbo.com/4295555 BOOKING.COM LINK: https://www.booking.com/hotel/us/highland-haven-w-hot-tub-grill-fireplace.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/322586 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1xfuMFnj6JM1pOLvJnICuL2EJkq0bgughcWCTVBVd1bc/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1M_Ni7b9o_giBukiPhiBRtQ6LLf-qKw6b GOOGLE LINK: ', '1471', NULL, '5923', 'Owner code: 1446 | Vendor code:  1492', 'Direct Wifi: WiFi Network: SpectrumSetup48 Password: teallight285', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Gas
', '2-3 spots
paved lot
No RV/Trailer

', NULL, NULL, '86dwvjfpd', 'Septic Alarm located on the left side of the house.

COMMUNITY POOL INFO: (Grand View Resort)

Resort Swimming Pool 

The pool is typically open from Memorial Day to Labor Day, depending on weather.
Please follow all pool rules as posted. Pool hours are 9am – Sunset.
Grandview''s pool is for owners and their contracted guests only.
Our pool does not have a lifeguard on duty. Swim at your own risk.
Children under the age of 14 must be supervised by a responsible adult at all times.
No food of any kind is allowed in the pools.
No glass containers of any kind are allowed in the pools or on the pool deck.
The pool pavilion cannot be reserved for large groups or parties. Decorations on the pavilion are not allowed.
Swim diapers must be worn by any child that is not potty trained.
Please clean up your area before leaving the pool area.

 
'),
('86dv14wb9', 'Kathleen Atkins 2417', 'live', 'normal', 'none', 'none', true, '2417 W Gallaher Ferry Rd, Knoxville, TN37932', '2417 W Gallaher Ferry Rd, Knoxville, TN 37932, USA', NULL, 'Regina Shrout', NULL, 4, 2, NULL, 2, NULL, 2, 3, 1, NULL, 11, 6, 'KnoxStaytion Account', 'KnoxStaytion', '322142', '862119', NULL, 'AIRBNB LINK: https://airbnb.com/h/cozy-cabin-smokies VRBO LINK: https://www.vrbo.com/4288574 BOOKING.COM LINK: https://www.booking.com/hotel/us/cozy-cabin-in-the-woods-w-playroom-deck-lounge.en-gb.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/322142 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1L94uIdM8za6c1cEGYzHyQXpslw_K7MO69RdaMeXfQkg/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Qk_KGrDGjdQVLdHD3rD9DES1FoFGhUbJ GOOGLE LINK: ', '0', NULL, '1634', 'Owner Code: 7280 | Vendor Code: 4264, ', 'WiFi Network: Wing Kong Trading Company Password: Foxtrot44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '6-8 parking spots
paved driveway
No RV/Trailer

', NULL, '25th', NULL, NULL),
('86duz7926', 'Chad McDaniel 3012', 'live', 'key', 'none', 'none', true, '3012 Cloudburst Dr, Sevierville, TN 37862', '3012 Cloudburst Dr, Sevierville, TN 37862, USA', 'SW Parkway', 'Summer Mathews', NULL, 4, 4, 1, 1, 4, NULL, 4, 1, 1, 12, 7, 'Main Account', 'Haven', '320089', '858227', NULL, ' AIRBNB LINK: https://airbnb.com/h/mountain-haven-cabin  VRBO LINK: https://www.vrbo.com/4277645  BOOKING.COM LINK: https://www.booking.com/hotel/us/mountain-haven-hot-tub-pool-arcade-theater-room.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/320089  GREEN LIGHT DOC LINK:  OWNER PROFILE FOLDER: https://docs.google.com/document/d/1n6VGJxa0bqf412cNpqlNGlR5Tqus93IWvWTpTbNmGH8/edit  https://drive.google.com/drive/u/1/folders/1zhOV8E9v8clFqtWVHW4XuZHDb7qoocPk GOOGLE LINK: ', '0372', NULL, '9263', 'Owner Code: 5998 | Vendor code:  9332', 'Direct Wifi: WiFi Network: Mountain Haven Password: cloudburst@3012', NULL, NULL, NULL, NULL, 'Precision Pool', NULL, NULL, NULL, NULL, '2 parking spots
paved concrete lot
No RV/Trailer 

', NULL, NULL, NULL, 'As of Apr 15, 2026:
Per Precision Pools, estimated pool depth is 4-5 ft.

POOL IS NOT HEATED

'),
('86dux8t8n', 'Abhi Kulkarni 824', 'live', 'normal', 'none', 'none', true, '824 E Foothills Dr. Gatlinburg, TN 37738', '824 E Foothills Dr, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Regina Shrout', NULL, 2, 2, NULL, 0, 1, 1, NULL, 1, 1, 4, 2, 'Main Account', 'Haven', '318443', '854036', NULL, 'AIRBNB LINK: https://airbnb.com/h/birchwood-bliss-cabin  VRBO LINK: https://www.vrbo.com/4263457 BOOKING.COM LINK: https://www.booking.com/hotel/us/birchwood-bliss-fireplace-grill-outdoor-lounge.html MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/318443GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tDwO9zl06m8DVZl0v4O9ISJKuGfQXlPp5P21LQjszQM/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1BjUCLqGyDIQwYey5zpuYmGRDAtauKoGn  GOOGLE LINK: ', '1963 | Lockbox location: wood panel to the right of the door frame', NULL, ' 4752', ' 4752', 'Password: pledgeyard128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spot 
sloped concrete lot\\
no RV/Trailer

', NULL, NULL, '86dxmer0w', NULL),
('86dux86vh', 'Jason Whitehead 659', 'live', 'normal', 'none', 'none', true, '659 Black Bear Falls WayGatlinburg, TN 37738', '659 Black Bear Falls Way, Gatlinburg, TN 37738, United States', 'East Gatlinburg', 'Katie Work', NULL, 3, 3, NULL, 2, NULL, 3, NULL, 1, 1, 10, 6, 'Main Account', 'Haven', '318372', '854020', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokies-bears-corner VRBO LINK: https://www.vrbo.com/4284785  BOOKING.COM LINK: https://www.booking.com/hotel/us/bears-corner-w-hot-tub-arcade-community-pool.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/318372 REEN LIGHT DOC LINK: https://docs.google.com/document/d/1NqQnXc1zL9dJZr5ROK8JehDc0FkicoODKyDOppAg080/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1viwAQGW3pL5yN7RrUOh80cWVZUCTJNva GOOGLE LINK: ', '0301', NULL, '0389', 'Owner Code: 0704 | Vendor code: 6141', 'Direct Wifi: WiFi Network: Spectrum FE Password: jollylemon439', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 parking spots
narrow uphill
No RV/Trailer

', NULL, NULL, '86dx5cnfq', ' Black Bear Falls office@hoagrouptn.com  
  pool requires pool pass  

'),
('86durv93d', 'Jace and Katty Eichorn 1525', 'live', 'key', 'none', 'none', true, '1525 Zermatt ct Gatlinburg, TN 37738', '1525 Zermatt Ct, Gatlinburg, TN 37738, USA', NULL, 'Summer Mathews', NULL, 3, 3, NULL, 2, NULL, NULL, 4, 1, 1, 8, 4, 'Main Account', 'Haven', '312679', '841849', NULL, 'AIRBNB LINK: https://airbnb.com/h/magnificent-view-smokies  VRBO LINK: https://www.vrbo.com/4224296 BOOKING.COM LINK: https://www.booking.com/hotel/us/magnificent-view-hot-tub-arcade-games-theater.en-gb.html    MARRIOTT LINK: Not pushed yet!    DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/312679  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1sDDw_GzjM8kUr0GUJ_cqEsyS91Ll6pYKAJc5Ydy2xU4/edit   OWNER PROFILE FOLDER:  https://drive.google.com/drive/u/1/folders/1kYnHp5oBL8usUMxxOtx5J_Pq3anq55nK  GOOGLE LINK: ', '1461', NULL, '8431', 'Owner Code: 3551 | Vendor Code: 0752', 'Direct Wifi: WiFi Network: SweetSerenity Password: Sereni3!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 spots
Paved lot going downhill
No RV/Trailer
', NULL, NULL, '86dwufgw9', '
As of Dec 23, 2025: DO NOT GIVE TO GUESTS
Google Nest thermostat login:
Log in is: sereni3llc@gmail.com. Password is: Indigo51!

Update: 27 May 2025
The owner advised that they have their owners passes but they paid the higher HOA fee to allow their guests to use the amenities such as the pool and tennis court. When asked, please advise the guest that they have access for the pool and tennis court. 

COMMUNITY POOL INFO: (Chalet Village)

Guests have access to the 3 community pools & clubhouses, tennis courts & playground!
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.

South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

Chalet Village Office Address: 1319 south baden drive
'),
('86dur8ku8', 'Amit Chowdhary 770', 'live', 'key', 'none', 'none', true, '770 Bethlehem Way Sevierville TN 37876', '770 Bethlehem Wy, Sevierville, TN 37876, USA', NULL, 'Summer Mathews', NULL, 6, 6, NULL, 5, NULL, 4, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '311934', '839974', NULL, 'AIRBNB LINK: airbnb.com/h/maya-cabin-smokies VRBO LINK: https://www.vrbo.com/4256115  BOOKING.COM LINK: https://www.booking.com/hotel/us/maya-w-indoor-pool-hot-tub-theater.en-gb.html  MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/311934 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/18dwYKaqfKCKJc3CEDKJhk1d8qZIK8ZRPEugKWKqFYgY/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1mMLGhY0bMd7Q1yGTBb5Fe5WvBkYzbUId  GOOGLE LINK:  41', '6276 | Secondary maintenance lockbox Code: 9341', NULL, '9688', 'Owner Code: 3599 | Vendor Code: 6294 | Pool Lock Code: 9341', 'Network name: Maya WiFi Password: Forbygrace10', NULL, NULL, NULL, NULL, 'Precision Pools', NULL, NULL, NULL, NULL, '3 parking spots
paved concrete lot
no RV/Trailer 
', NULL, NULL, NULL, '
As of Jan 12, 2026: 
Equipment room code: 9341


As of October 1, 2025:
- This is a pet-friendly property. There will be a fee of $100.00 per pet. Please note that no pets should be over 60 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 


Owner Code: 3599
Vendor Code: 6294
Pool Lock Code: 3605

'),
('86dummegm', 'Sean Gagnon 411', 'live', 'key', 'none', 'none', true, '411 Pa Proffitt Rd, Gatlinburg, TN 37738', '411 P A Proffitt Rd, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Summer Mathews', NULL, 4, 4, NULL, 3, NULL, NULL, 4, 1, 1, 10, 6, 'Roach Account', 'Haven Roach', '308118', '830488', NULL, 'AIRBNB LINK: https://airbnb.com/h/big-foots-hideout  VRBO LINK:https://www.vrbo.com/4265185 BOOKING.COM LINK: https://www.booking.com/hotel/us/bigfoots-hideout-hot-tub-lifesize-games-theater.en-gb.html MARRIOTT LINK: Not pushed yet!   DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ZkveExRJ79GHML5A3yaoyIMEKYEPzz3xb2iQJNWycLo/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1roXvO0OeU_oTwSkO8WFSrKsUpdrNndFq  GOOGLE LINK: ', '4239', NULL, '0801', 'Owner Code: 5099 | Vendor Code: 9984', 'Direct Wifi: WiFi Network: Big Foots Hideout Password:  BFHguest13!', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4 spots
paved lot
no RV/Trailer

', NULL, NULL, NULL, NULL),
('86ducrb4c', 'Porter Landreth 2316', 'live', 'key', 'none', 'none', true, '2316 Boulder Way, Sevierville, TN 37862', '2316 Boulder Way, Sevierville, TN 37862, USA', NULL, 'Summer Mathews', NULL, 6, 9, NULL, 5, NULL, NULL, 4, 1, 1, 14, 8, 'Roach Account', 'Haven Roach', '299676', '809771', NULL, 'AIRBNB LINK: https://airbnb.com/h/bear-paddle-smokies VRBO LINK: https://www.vrbo.com/4187937 BOOKING.COM LINK: https://www.booking.com/hotel/us/bear-paddle-w-pool-hot-tub-game-room-theater.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40389233  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Daon25mR6T-hhRNIFPVGcHIYUkw9yk4eX457ZQpwZmk/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1mMKNQQXTh59lVkoArsHzZ_XAjBusbpil GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQpbvUyP-H5741EAI%3D/overviewff', '9018', 'Blessed - 31', '5315', 'Owner code: 2655| Vendor code: 1927| Pool Code: 1234', 'StayFi:  WiFi Name: Haven Vacation Rentals  Guest WiFi Password: havenguest Direct Wifi: Network name: Oksu Network password: Okland50!', 'Ecobee', NULL, NULL, NULL, 'Berry', NULL, NULL, NULL, NULL, '3 parking spots
paved concrete lot
no rv/trailer
', NULL, '25th', NULL, '

Breaker panel
We shouldn''t let the guest flip the breaker when something is wrong with the pool - Berry 

UPDATE: June 25, 2025
For any HVAC - American Home Shield is their warranty guy.


'),
('86dubg92x', 'Greg Forderhase 1354', 'live', 'normal', 'none', 'none', true, '1354 Lk Hvn Wy, Sevierville, TN 37876, USA', '1354 Lk Hvn Wy, Sevierville, TN 37876, USA', 'Dandridge', 'Lily Bryant Macon', 'Ailyn Regidor', 3, 2, NULL, 2, 2, NULL, NULL, 1, 1, 8, 4, 'Roach Account', 'Haven Roach', '299225', '809285', NULL, '  AIRBNB LINK: https://airbnb.com/h/pine-ridge-retreat VRBO LINK: https://www.vrbo.com/4203465 BOOKING.COM LINK: https://www.booking.com/hotel/us/pine-ridge-retreat-w-hot-tub-grill-games-more.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/299225 GREEN LIGHT DOC LINK:  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1A6eSWYs95_jA0ska3o45Y9kzN17puBOZ GOOGLE LINK: ', '0371', NULL, '5694', 'Owner Code: 3124 | Vendor code: 4993', ' Direct Wifi: Wi-Fi Network: NETGEAR03 Password: strongunit646', NULL, NULL, NULL, NULL, NULL, 'HOA', NULL, NULL, NULL, '2 parking spots
paved asphalt
No RV/Trailer

', NULL, '25th', NULL, NULL),
('86du7p647', 'Dan and Melissa Hanlon 131-2', 'live', 'junior', 'none', 'none', false, '131 Unit 2 Cedar St., Sevierville, TN 37862', '2 Cedar St #131, Sevierville, TN 37862, USA', 'SE Parkway', 'Lily Bryant Macon', NULL, 2, 2, NULL, 1, 1, NULL, NULL, 1, NULL, 4, 2, 'Main Account', 'Haven', '294839', '794181', NULL, 'AIRBNB LINK: https://airbnb.com/h/cedar-peak-cabin VRBO LINK: https://www.vrbo.com/4429085 BOOKING.COM LINK: https://www.booking.com/hotel/us/cedar-peak-condo-downtown-sevierville.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40485635 DIRECT BOOKING SITE LINK: http://stay.havenvacationrentals.com/listings/294839 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1-g4rippGtvuYX6BIGcOB4jTdL-0wVqpwOV5bUs2faHE/edit?tab=t.0 OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1sz6nAzFfczC66cccppe5oY2lv7kwJs8c GOOGLE LINK:', '6921', NULL, '3037', 'Owner Code: 5850 | Vendor code: 3565', 'Direct Wifi: WiFi Network: Spectrum-Setup50 Password: widerobin056', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1 parking spot
paved lot
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86du4g9r1', 'Justin Goodbread 2670', 'live', 'key', 'none', 'none', true, '2670 Cloud View Dr Sevierville, TN 37862', '2670 Cloud View Dr, Sevierville, TN 37862, USA', 'Townsend', 'Summer Mathews', NULL, 4, 4, NULL, 4, NULL, 2, 2, 1, 1, 12, 7, 'Roach Account', 'Haven Roach', '291926', '788529', NULL, 'AIRBNB LINK: https://airbnb.com/h/elevation-escape VRBO LINK:https://www.vrbo.com/4187936 BOOKING.COM LINK: https://www.booking.com/hotel/us/cloud-peak-hideaway-pool-hot-tub-theater-games.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/291926  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1SKplxVfO3o85RZHEXPYU4Q2_QyqvDonvO9UXWWshA4o/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1rgFVAP_uxRwG3TKjtEWgMsXyTTN1rjMZ GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQk6u2wIeVq9OtARAC/overview', '3928', 'Blessed - 33', '5079', ' Owner code: | Vendor code: | Pool Code:1122 | Guest Code: 1122', 'Direct Wifi: Network name: Elevation Escape Network password: nowyoucanrelax', NULL, NULL, NULL, NULL, 'Precision Pools', NULL, NULL, NULL, NULL, '3 parking spots
paved street
No RV/Trailer

', NULL, NULL, NULL, ' Owner code: 
Vendor code: 
 Pool Code:1122 
Guest Code: 1122

Let the guest use the key in the lockbox to access the pool.

Owner has an active builder warranty. There is also a warranty on all the furniture. Do not send any runners or maint. techs here without explicit approval from Summer!

BUILDER WARRANTY ON THIS PROPERTY!!!! CONTACT AM BEFORE ANY REPAIRS COMPLETED.
FOR ANY WELL ISSUES: CONTACT WARRANTY BELOW
Owner is set up on bi-annual maint. plan for well with them. 
Elite Water
(865) 286-5046 (Office), (865) 254-5327 (Jonathan/ Field Supervisor)


 




COUNTY SPRINKLER SYSTEM INSTALLED HERE

Update: 12 Mar 2025

This is a pet-friendly property. Please see additional notes below: 
$75 per pet fee - This should be charged to the guest 
No pets over 60lbs
MAXIMUM of 2 pets
Pets must be kenneled when not supervised, must be housebroken, and no pets are allowed on furniture

'),
('86du4g90f', 'Dan and Melissa Hanlon 131-1', 'live', 'junior', 'none', 'none', true, '131 Cedar St., Sevierville, TN 37862', 'Cedar St, Sevierville, TN 37862, USA', NULL, 'Lily Bryant Macon', NULL, 1, 1, NULL, 1, NULL, NULL, NULL, 1, NULL, 2, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '291937', '788530', NULL, 'AIRBNB LINK: airbnb.com/h/cedars-downtown-condo VRBO LINK: https://www.vrbo.com/4375202 BOOKING.COM LINK: https://www.booking.com/hotel/us/cedars-condo-modern-downtown-escape.html MARRIOTT LINK: Not pushed yet! DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/291937 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1VlQ2IgL9ZGkF58MuTD0oXG9wpb7iRbD2PGZ6PGNjmAI/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1N3CL0sa6qlSp-FBPuI-Kv7iLETNpD-CY?usp=drive_link GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQlIrfmunej5_sARAC/overview?g2lb=43807868', '6921', NULL, '4805', 'Owner code: 5850 | Vendor code:  7226', 'Direct Wifi: WiFi Network: Spectrum-Setup50 Password: widerobin056', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1 parking spot
paved lot right under units (parking visible from unit)
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86du4g87h', 'Nathan Sukhia 843', 'live', 'normal', 'none', 'none', true, '843 Stonegate Way, Townsend TN 37882', '843 Stonegate Way, Townsend, TN 37882, USA', 'Townsend', 'Summer Mathews', 'Ailyn Regidor', 4, 3, NULL, 2, NULL, 2, 2, 1, 1, 9, 5, 'KnoxStaytion Account', 'KnoxStaytion', '291913', '788527', NULL, ' AIRBNB LINK: airbnb.com/h/firefly-ridge-smokies   VRBO LINK: https://www.vrbo.com/4147168  BOOKING.COM LINK:  https://www.booking.com/hotel/us/firefly-ridge-mtn-view-hot-tub-theater-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/291913 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Hkf9_sws-jlhC2RD2i49sMMUi-jdXgtU8Cj02kx4DD4/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1-ineRfZiXliC-PYWOy8i1YWouwv85IGR GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQreTItpeRkPlgEAI=/overview ', '4199 ', 'Blessed - 58', '8190', 'Owner Code: 6171 | Vendor Code: 6892', 'Direct Wifi: WiFi Network: Verizon_BX764J Password: raft-oxide3-cry', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', '2-3 spots
Pull-in sloped driveway
No RV/Trailer

', NULL, NULL, NULL, 'ADT Security Alarm
Should lower the sensitivity so that it won’t go off during showers
The verbal password for cove is "firefly" - if there is a key code it''s probably 4618
 
There was a FIRE SMOKE HF 2 SMOKE HF 2 alarm from MICHAEL SPARKS. Tap on the link to cancel the alarm or dispatch authorities.

Pet Friendly
2 pet max and have the pets in a kennel when guests are not at the property.

For the Fireplace and Hot Tub
The fireplace gas starter is disengaged. Fires in the fireplace need to be started in the traditional way and carefully monitored because of fire danger.
The hot tub should be turned up to maximum on arrival if you want to use it and turned back to 80 on departure.
'),
('86du3862g', 'Lucy McCandless 1125', 'live', 'normal', 'none', 'none', true, '1125 Lower Alpine Way Gatlinburg TN 37738', '1125 Lower Alpine Way, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', 'Ailyn Regidor', 4, 3, NULL, 3, NULL, 2, NULL, 1, 1, 8, 4, 'KnoxStaytion Account', 'KnoxStaytion', '291806', '788526', NULL, 'AIRBNB LINK:  https://airbnb.com/h/ridge-view-smokies  VRBO LINK:  https://www.vrbo.com/4176705 BOOKING.COM LINK: https://www.booking.com/hotel/us/ridgeview-games-hot-tub-fireplace-pool.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40387957  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/291806 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/11eMPtvfeIc1KEcyXX_Zmvx7l_6H1NhnGtljjBBLGsM0/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1w80nuxHV463-QjOFvjK7TX7FsM9FfT-2 GOOGLE LINK: ', '0254', 'Blessed - 19', '0724', 'Owner Code: 1125 | Vendor Code:  0413', 'Direct Wifi: WiFi Network: Deco_9384 Password: N/A (Temporary)', NULL, NULL, NULL, 'Valley Pest', NULL, NULL, NULL, NULL, 'Wood    
', '2 parking spots
Narrow paved slope to property
No RV/Trailer

', NULL, NULL, '86dwufgw9', 'Community Pool:
Upper Alpine Clubhouse
1151 Upper Alpine Way, Gatlinburg, TN 37738
Gatlinburg Chalet Village Upper Alpine Clubhouse | Chalet Village Owners Club

COMMUNITY POOL INFO: (Chalet Village) 
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

'),
('86du095x8', 'Lindsey Hatcher 206', 'live', 'normal', 'none', 'none', true, '222 N Central St Unit 206 Knoxville TN 37917 ', '222 N Central St #206, Knoxville, TN 37917, USA', NULL, 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, 1, NULL, NULL, NULL, 1, NULL, 2, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '287653', '780974', NULL, ' AIRBNB LINK: https://airbnb.com/h/scenic-city-loft VRBO LINK: https://www.vrbo.com/4168124  BOOKING.COM LINK: https://www.booking.com/hotel/us/scenic-city-loft-in-downtown-knoxville.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/287653 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1mF6lGrzKynIuq-2npR89xQP2kfOOxDhjUTF1LktexZc/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/19BM289v7RIjSEoQ-CTrWLgbp7RlcNGQP GOOGLE LINK: ', '3027', NULL, '5162', 'Owner Code: 8653 | Vendor Code: 1395 | Building code - 1580', 'Direct Wifi: WiFi Network:ATTja8pZae  Password:z3axd6ue+wvv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PAID STREET PARKING
Paid lot parking across the street
Free street parking by white lily and a lot around the corner of the tattoo shop



', NULL, '25th', NULL, 'Owner Code: 8653 
Vendor Code: 1395  
Building code - 1580
'),
('86du09596', 'Megan Hatcher 222-205', 'live', 'junior', 'none', 'none', true, '222 N. Central Street, Unit 205, Knoxville, TN 37917', '222 N Central St #205, Knoxville, TN 37917, USA', 'Knoxville', 'Regina Shrout', NULL, 1, 1, NULL, 1, NULL, NULL, NULL, 1, NULL, 2, NULL, 'KnoxStaytion Account', 'KnoxStaytion', '287651', '780973', NULL, 'AIRBNB LINK: https://airbnb.com/h/dollys-downtown-loft VRBO LINK: https://www.vrbo.com/4180564 BOOKING.COM LINK: https://www.booking.com/hotel/us/dollys-downtown-loft-knoxville.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/287651 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/13pdA48GO7B_N9Bom0ONPbvFVvzNI8cdxpux75yCqE2o/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1XWmZrFVj4x_HLp5u0E1ERmVeJpNmykz7 GOOGLE LINK: ', '9678', NULL, '4939', 'Owner Code: 2239 | Vendor code: 5029', 'Direct Wifi: WiFi Network:ATTja8pZae  Password:z3axd6ue+wvv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'There is a paid lot parking across the street. 
There is Free street parking by white lily and a lot around the corner of the tattoo shop.
No RV/Trailer parking.

', NULL, '25th', NULL, 'Building Code: 1580
'),
('86dttuzwd', 'Misty Mcintyre 2729', 'live', 'normal', 'none', 'none', true, '2729 Buck Board Ln, Sevierville, TN 37862, USA', '2729 Buck Board Ln, Sevierville, TN 37862, USA', NULL, 'Lily Bryant Macon', 'Ailyn Regidor', 4, 2, NULL, 2, 2, 2, 2, 1, 1, 12, 7, 'KnoxStaytion Account', NULL, '281864', '769832', NULL, 'AIRBNB LINK: https://airbnb.com/h/buck-board-lodge VRBO LINK:  https://www.vrbo.com/4065440  BOOKING LINK: https://www.booking.com/hotel/us/buck-board-lodge-w-hot-tub-fire-pit-game-room.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40413492  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/281864  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15lQi-7q06oLVUWDbfPPunqmEqpL1ZNA91sIrWvBYVI8/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Swu_O0XDP3ENTb4LHSILth9y6R6QM8Sr GOOGLE LINK: google.com/travel/hotels/entity/CgoQqN_N7vax3us7EAI=/overview', '9188', 'Blessed - 42', '7343 ( As per guest - the code that works for the door pad is 8726 )', 'Owner Code: 0373 Vendor Code: 3548', 'Direct Wifi: WiFi Network: Buck Board Lodge Password: BBL2729!', NULL, NULL, NULL, 'Johnson''s Pest Control', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '86dxmbcx4', NULL),
('86dtq8yy0', 'Nora Merriman 757', 'live', 'normal', 'none', 'none', true, '757 Chickasaw Gap Way, Pigeon Forge, TN 37863, USA', '757 Chickasaw Gap Way, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Lily Bryant Macon', NULL, 3, 3, NULL, 2, 1, 1, 3, 1, 1, 11, 6, 'KnoxStaytion Account', 'KnoxStaytion', '278500', '764991', NULL, ' AIRBNB LINK: https://airbnb.com/h/pigeon-forge-moose-tracks-lodge VRBO LINK: https://www.vrbo.com/4112062  BOOKING.COM LINK: https://www.booking.com/hotel/us/moose-tracks-lodge-hot-tub-arcade-board-games.html MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/278500 GREEN LIGHT DOC LINK: https://docs.google.com/document/u/1/d/1s2jee0yZhLixRj_h4xa8Pz1XuCrD8lszCZZILi9jbX4/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/14wJPCGdy0tZCVqwNt4IoJMWEwlYcdZuF GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQpoej0qri2sMEEAI%3D/overview', '0808', 'Blessed - 50', '9581', 'Owner Code: 2655 | Vendor Code: 5437  | Community Pool Code: 8767', 'Direct Wifi: Network: Moose Tracks Lodge Password: MountainAir789!', NULL, NULL, NULL, 'Valley Pest', NULL, NULL, NULL, NULL, 'Gas
', '3 parking spots
Flat, paved
No RV/Trailer

', NULL, NULL, '86dwv6pxp', 'The pool will be opening for the season on Saturday, May 24th. The pool is being filled today and tomorrow. Some updated details below, including a new code to access the pool.

There have been extensive work done to the pool including: new paint, new stain, 4 new picnic tables, and new signage. 

Things to note:
-Operating hours: 10 am - 9 pm (no change from previous years)
-Weekly maintenance: The pool will be closed each Wednesday for maintenance. This is to ensure the pool remains great shape for our owners and guests. A sign has been posted indicating the pool will be closed on Wednesdays. 
-New signage: There is a new sign posted in front of the entrance that states pool passes are required. No such passes are required. The sign was added to deter those not a part of the resort from using the pool. 
-New code: 3987.

3205 Choctaw Hill Way
We tentatively expect the pool to close for the season on September 29th.

'),
('86dtnuehb', 'Megan Helms 1469', 'live', 'normal', 'none', 'none', true, '1469 Newcomb Hollow Rd, Sevierville, TN 37862, USA', '1469 Newcomb Hollow Rd, Sevierville, TN 37862, USA', NULL, 'Lily Bryant Macon', 'Ailyn Regidor', 3, 2, NULL, 1, 3, NULL, NULL, 1, 1, 8, 4, 'KnoxStaytion Account', NULL, '277224', '762253', NULL, ' AIRBNB LINK: https://airbnb.com/h/helms-hollow VRBO LINK: https://www.vrbo.com/4097798  BOOKING LINK: https://www.booking.com/hotel/us/helms-hollow-theater-hot-tub-fire-pit.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40424036  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/277224  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1NEU06-oC6y1aeRR-ONHk9VLwYvhgxkFNDNoNxbz8u-M/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ap4EOQT4fgagyxpOHC9tv87nsX3JPeq7 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQxsTPo5a109xjEAI%3D/overview', '1448', NULL, '9612 ', 'Outdoor Game Cabinet: 38-00-10', 'Wi-Fi network: Helms Hollow  WiFi password: helmshollowguest', NULL, NULL, NULL, NULL, NULL, 'Blessed Lawncare', NULL, NULL, 'Electric
', '4 parking spots
paved, flat
No RV/Trailer

', NULL, '25th', NULL, 'Water Supply: Well - for reference  

For the Arcade, it should have an unlimited spending limit-10/14/2025


The breaker panel is located at the back of the house.
'),
('86dtncmne', 'Mike Lillie 536', 'live', 'normal', 'none', 'none', true, '536 Laurel Rd, Townsend, TN 37882, USA', '536 Laurel Rd, Townsend, TN 37882, USA', NULL, 'Summer Mathews', 'Ailyn Regidor', 3, 2, 1, 1, 1, 2, 3, 1, 1, 10, 6, 'KnoxStaytion Account', NULL, '276567', '758371', NULL, '   AIRBNB LINK: https://airbnb.com/h/dancing-trees-townsend VRBO LINK: https://www.vrbo.com/4055361 BOOKING LINK: https://www.booking.com/hotel/us/townsend-gem-retreat-with-hot-tub-fire-pit.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40411402  DIRECT BOOKING SITE LINK:  https://stay.havenvacationrentals.com/listings/276567 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1-FjZEDjPwUrG6dqYWmmnfxdq4MGwkA4KOExx7wQeRWA/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1agXMl1utXqnAqb6nOKcL20K6WdENVVDE GOOGLE LINK:', '1375', 'Blessed - 6', '2450', 'Owner Code: 7038 Vendor code: 2447 | Community Gate Code: 49701', 'Direct Wifi: WiFi Network: DancingTrees Password:  MtnHouse!', NULL, NULL, NULL, NULL, NULL, 'Blessed Lawncare', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Note: Owner will change the lower level king bed to queen bed during their owner stay on Feb 15-17, 2026. 
'),
('86dtn2ph2', 'Anthony Simoncini 2852', 'live', 'normal', 'none', 'none', true, '2852 Sequoia Road Pigeon Forge, TN', '2852 Sequoia Rd, Pigeon Forge, TN 37863, USA', NULL, 'Regina Shrout', 'Ailyn Regidor', 3, 3, 1, 3, NULL, 1, 2, 1, 1, 10, 6, 'Roach Account', NULL, '276205', '757352', NULL, 'AIRBNB LINK: https://airbnb.com/h/state-of-mind-pigeon-forge VRBO LINK: https://www.vrbo.com/4037368  BOOKING LINK: https://www.booking.com/hotel/us/private-indoor-pool-cabin-w-game-room-hot-tub.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40407078  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/276205 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Md2wtgFb4o90JPohPzG_qEFDxCwi9Th_8fkcdlMNKqQ/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Ntm4NABN54TEfHxy-Aw4LLGAV9hWinFl GOOGLE LINK: ', '#7623', 'Blessed - 51', '4712', 'Owner Code: 6738 Master code: 4712 Pool room code - 2852 Lockbox with pool key - #285 Vendor code:', 'StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct Wifi Wifi Name: Stateofmindguest Wifi Password: Sequoiaroad1  Wifi Name: Stateofmind Wifi Password: Hmjnbtcha2852', NULL, NULL, NULL, 'Arrow Exterminators', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Owner Code: 6738 
Master code: 4712 
Pool room code - 2852 
Lockbox with pool key - #285 
Vendor code:

Pool Vendor:  
Under Warranty
Teaster''s Natural Creations 
865-256-5461

We provide packages of coffee grounds. 
'),
('86dte8ckj', 'Megan Waymire 3770', 'live', 'normal', 'none', 'none', true, '3770 Ravens Den Way Sevierville, TN 37862', '3770 Ravens Den Way, Pigeon Forge, TN 37862, USA', NULL, 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, NULL, 2, NULL, NULL, 1, 1, 4, 2, 'Roach Account', 'Haven Roach', '268281', '728706', NULL, 'AIRBNB LINK: https://airbnb.com/h/ravens-hollow-cabin  VRBO LINK: https://www.vrbo.com/4108476 BOOKING LINK: https://www.booking.com/hotel/us/ravens-hollow-private-pool-hot-tub-games.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/277224  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1swwJLMmcv3iddBpIW6eViruYHUVsit5ghwqV7uW7OYI/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1UQMDo8_NjCJvWFnzxICAbfCwjUue5fPJ GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQqeepvP3Y-6lFEAI=/overview ', '1492', 'Blessed - 68', '0180', 'Owner Code: 5217 | Vendor Code: 2171', 'Direct Wifi WiFi Network: Ravens Nest Password: ravensden (NO STAYFI HERE)', NULL, NULL, NULL, NULL, 'Pool Vendor:  Nick at PH Pools Contact number: (865) 310-9575', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Pool Vendor:  Nick at PH Pools
Contact number: (865) 310-9575
'),
('86dt3tgva', 'Sandra Pernavaite 1617', 'live', 'normal', 'none', 'none', true, ' 1617 Bluff Ridge Rd Sevierville, TN 37876', NULL, NULL, 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 2, NULL, NULL, 2, 1, 1, 6, 4, 'Main Account', 'Haven', '257347', '703062', NULL, ' AIRBNB LINK: https://airbnb.com/h/allure-woods  VRBO LINK: https://www.vrbo.com/3981556  BOOKING LINK: https://www.booking.com/hotel/us/allure-woods-view-hottub-outdoor-dining-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/257347  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1n4nOTFOwKmMFuSRxB7XyKHcjIP8TVBji0la8tNraE7I/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1x8d1syIVc527l7srJMaNAIg5EC5XJ99D  GOOGLE LINK:', '7410', 'Blessed - 20', '1521', 'Owner code: 7979 | Vendor code: 1078', 'Stayfi Wifi Name: Haven Vacation Rentals Guest  Wifi Password: havenguest  Direct Wifi  Network name: Bluff-Ridge-Cabin  Network password: cabinlove', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3 parking spots
Paved, flat
No RV/Trailer

', NULL, NULL, NULL, NULL),
('86drqxj02', 'Rohan Thakker 653', 'live', 'normal', 'none', 'none', true, '653 Eagles Blvd Way, Pigeon Forge 37863', '653 Eagles Blvd Way, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Ailyn Regidor', 4, 4, NULL, 4, NULL, 2, NULL, 1, NULL, 11, 6, 'Main Account', 'Haven', '244186', '648507', NULL, 'AIRBNB LINK: https://airbnb.com/h/vivs-view-cabin VRBO LINK: https://www.vrbo.com/3882475 BOOKING LINK: https://www.booking.com/hotel/us/5-mins-to-pigeon-forge-strip-w-hot-tub-grill-more.en-gb.html \\ MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/244186  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/181LQVXFniyDXY8WGkWnnO8nHD9FGUxKQAwwX0qF6pYM/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1f5YVeF88Hib2U4gXbF9qSgCQevV3_t2O GOOGLE LINK: ', '3430', NULL, '2372', 'Owner Code: 6772 | Vendor Code: 8976 | Owner’s Closet Lockbox Code: 6221', ' Direct Wifi WiFi Network: ATTi4t4hCl  Password: x%28ntud5p?g', NULL, NULL, NULL, NULL, NULL, 'HOA', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'The property is now pet-friendly as per Summer. 2 pets max. $75 pet fee each
-

'),
('86drkk0r0', 'Chris Elkendier 1622', 'live', 'key', 'none', 'none', true, '1622 Mountain Ash Way, Sevierville, TN 37876', NULL, 'Dandridge', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 4, NULL, NULL, 4, 1, 1, 12, 7, 'Main Account', NULL, '141714', '390748', NULL, 'AIRBNB LINK: https://airbnb.com/h/three-pines-lodge  VRBO LINK: https://www.vrbo.com/3268539   BOOKING LINK: https://www.booking.com/hotel/us/three-pines-lodge-brand-new-build-luxury-cabin.html?lang=xu   MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/141714   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1_StFDKrNafRhU0_w7nzo-dQhaFxngquf9Q9R6qkjJHU/edit#   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1ZpvFf61Zm32-hWO0J-53vgzZx4ffEytE   GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQyabkvNHz8cA2EAI%3D/overview ', '0301', NULL, '7745', '7745', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: WiFi Network:3PinesLodgeGuest  Password:Viewtiful   "', 'Ecobee', NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'EXTRA CODES
Gate Code: 1122

QUIRKS AND ODDITIES
Switch for the Chandelier in the Main Living Room is located near the entrance.

ADDITIONAL INFORMATION

-4WD may be necessary in the winter! 
-This property has a private Electric Vehicle charger.  


PARKING/DRIVEWAY

--4 parking spots 
-Pull-Through driveway that is paved and gently sloped toward the property 
-No RV/Trailer 


Trash Can Location

There are two bear proof cans located on the left side of the property if you are looking at the front door. Note: Please do not dump the trash on a trailer in front of the clubhouse


'),
('86drcdju3', 'JP Davanzo 327', 'live', 'normal', 'none', 'none', true, '327 Caney Creek Rd, Pigeon Forge, TN 37863', '327 Caney Creek Rd, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Ailyn Regidor', 1, 2, NULL, 1, NULL, 3, 1, 1, 1, 8, 4, 'Main Account', NULL, '221975', '594570', NULL, 'AIRBNB LINK: https://airbnb.com/h/dream-on-the-stream-cabin  VRBO LINK: https://www.vrbo.com/3811628  BOOKING LINK: https://www.booking.com/hotel/us/dream-on-the-stream-hottub-pooltable-firepit-more.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40349450  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/221975  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1OilI6rgPpq6DOWpOSs-1bZCE4f3dTWPlRDyF6NNfAy0/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1KI2rWC5cTsVRyoI6psIgR4TiW10i8hj1  GOOGLE LINK: ', '3125', 'Blessed - 11', '5333', '5571', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi  Network: DreamStream2  Password: Caney327Creek"', NULL, NULL, NULL, NULL, NULL, ' Lawn mower  Connie Hawkins 865- 394-8188', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Guests are responsible for providing their own firewood & charcoal

PARKING/DRIVEWAY
--3 parking spots 
-Flat, Paved 
-NO RV/Trailer  

Trash Can Location
-Bear proof trash cages in the driveway

'),
('86drbe71e', 'Walt Ward 2414', 'live', 'normal', 'none', 'none', true, ' 2414 Walnut Cove Way Sevierville, TN 37862', '2414 Walnut Cove Way, Sevierville, TN 37862, USA', 'NW Parkway', 'Summer Mathews', 'Ailyn Regidor', 5, 5, 1, 3, 3, 1, 1, 1, 1, 15, 8, 'Main Account', NULL, '231216', '611064', NULL, 'AIRBNB LINK: https://airbnb.com/h/wayward-travelers-lodge  VRBO LINK: https://www.vrbo.com/3851192  BOOKING LINK: https://www.booking.com/hotel/us/wayward-travelers-lodge-hottub-theater-arcade-more.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40314871  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/231216 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1kxF5cieGPLC6L0OpLYswBYbWc-csHykySKw-o4e6pXA/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1_syQhjRdxH2ULmH6PugzQM0MibZACMh-  GOOGLE LINK: ', '0144', 'Blessed - 72', '5333', '1369', 'StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network:Walnut Password: Walnut2414%', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'ADDITIONAL INFORMATION: 4wd may be needed in winter months during snowy / icy conditions. 
-The ice marker on the fridge does not work. There should be ice trays in the freezer. 
-For the Hot Tub
The hot tub needs to be filled a specific way, or it will burn up the pump. The hose needs to be inserted into the slot. 
 
They can NOT just throw the hose over the side and start filling it.
A solid red light will be displayed when the hot tub is filled correctly and ready to use.

If it is not filled correctly, it will display a blinking red light. This will happen if it is not filled correctly and has an airlock. They will have to clear the airlock, reset the breaker, and then fill it correctly to resolve this.


PARKING / DRIVEWAY: 
5 parking spot
No RV or Trailer
Paved, flat driveway

TRASH CAN LOCATION: Bear Proof trash cans located on the back side of the house on the main level

'),
('86drb87un', 'Doug Poll 740', 'live', 'normal', 'none', 'none', true, '740 Bear Hollow Way, Sevierville, TN, 37876', '740 Bear Hollow Way, Sevierville, TN 37876, USA', 'NW Parkway', 'Summer Mathews', 'Ailyn Regidor', 4, 3, NULL, 3, NULL, 1, 4, 1, 1, 12, 7, 'Main Account', NULL, '219208', '586692', NULL, 'AIRBNB LINK: https://airbnb.com/h/bears-hollow-lodge  VRBO LINK: https://www.vrbo.com/3833272  BOOKING LINK: https://www.booking.com/hotel/us/bears-hollow-retreat-hottub-firepit-gameroom-more.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40354156  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/219208  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1BbpfO56GWFHaO2iYRmSLxmY3SAAK040Fuz-844Qgi04/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1tid8QEIhGyd4ILoRRlucNFZx4QzpmBf4  GOOGLE LINK: ', '0174', 'Blessed - 52', '5131', '9360', 'StayFi WiFi Name: Haven Retreat WiFi Password: haven740 Direct Wifi WiFi Network:hugh693366 Password: topic91salar', NULL, NULL, NULL, 'Valley Pest', NULL, 'Brad Whaley', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'As of 09/18/2025 
FIXED CODE - 5131 

UPDATE: Apr 15, 2025
The new credentials for guests are below:
Network: Haven Retreat
Password: haven740
==============================================

QUIRKS AND ODDITIES
-

TRASH INFORMATION
If the guest has more trash than what will fit in the bear cages they can bring the excess trash to the Sevier County Convivence Center. Information below. They CAN NOT leave excess bags outside the cabin or outside of the cages. There very high bear activity in the area and it will get tore up very quickly.
 
 



ADDITIONAL INFORMATION
--4WD may be necessary during winter months during snowy/ icy conditions.  
-There is a pond nearby.
Brine Tanks in Shed - Access is on a padlock. 
Padlock Code: Right 3 times, Stop at 10, Left, 1 Full Turn, Stop at 16, and Right to #10

ALL BLINDS ARE UNDER WARRANTY - DO NOT DO ANY BLIND PURCHASES.
"Our blinds were broken, according to the notes. We had our blinds guy, who originally installed those, give us a lifetime warranty on repair and replacement. His name is Sam Catlett of Smoky Mountain Blinds samuel@smokymountainblinds.com and 865-429-0807 mobile. "

PARKING/DRIVEWAY
-5 parking spots
-Paved, Flat
-NO RV/Trailer 

-

Trash Can Location
Bear Proof Trash Cans in the driveway.
'),
('86drb82zh', 'Matthew Long 1363', 'live', 'key', 'none', 'none', true, '1363 Lake Haven Way, Sevierville, TN 37876', '1363 Lk Hvn Wy, Pigeon Forge, TN 37876, USA', 'Dandridge', 'Summer Mathews', 'Thomas Hampton', 2, 2, NULL, 2, NULL, 1, 4, 1, 1, 10, 6, 'Main Account', 'Haven', '232744', '614387', NULL, 'AIRBNB LINK: https://airbnb.com/h/chalet-amelia  VRBO LINK: https://www.vrbo.com/3835198  BOOKING LINK: https://www.booking.com/hotel/us/chalet-amelia-lake-view-hottub-fireplace-arcade.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/232744 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1dqKP1ygh3xnlHesW2dQ64qa4MS-KmCkccpQZ6C2IOag/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1Blb65ZXHklb-COi4qai2PG-5exXGI51P  GOOGLE LINK: ', ' 9070', NULL, '8740', 'Owner Code: 7601', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: TP-Link_EDIC Password: 67090679"', NULL, NULL, NULL, NULL, NULL, 'Brad Whaley', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION

-This cabin is in a new construction neighborhood. There are a few unpaved roads leading to the property & you may hear construction noise from neighboring cabins at times. 

PARKING/DRIVEWAY

--3 parking spot
-No RV or Trailer
-This cabin is located directly on a wide paved street. There is room to parallel park in front of the cabin on the street. 

Trash Can Location

 Outdoor trash cans are located on the back deck.  


'),
('86dr6z319', 'Roger Bell 3729', 'live', 'normal', 'none', 'none', true, '3729 Plaza Way # 204 Pigeon Forge, TN 37863', '3729 Plaza Way, Pigeon Forge, TN 37863, USA', 'East Parkway, East Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 2, 1, 1, NULL, 1, NULL, 1, NULL, 4, 2, 'B Account ', 'Haven BETA', '231192', '611062', NULL, 'https://airbnb.com/h/papa-bears-hideaway-pigeonforge VRBO LINK: https://www.vrbo.com/3819059 BOOKING LINK: https://www.booking.com/hotel/us/papa-bears-hideaway-stunning-views-communitypool.en-gb.html MARRIOTT LINK: PENDING. DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/231192 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1o5WpnJfFAOIjybNkQ5yNoE9S02tlLv7lpuxNn6rCHs8/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/13exwll5YWBxWONZWtWGoJj8UgNmWScg1 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ7-HD0YzSjvDeARAC/overview to –', '0209', 'Blessed - 9', 'None ', 'Yale Lock: 8449', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi Network name: SpectrumSetup-0D Network password: actualincome918 "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '-1 parking spot
-No RV or Trailer
-Shared, paved, flat lot


', NULL, '25th', NULL, 'ADDITIONAL INFORMATION
"**PLEASE NOTE:
- Community Indoor pool is open 24/7/365, except when maintenance or unforeseen circumstances arise. The pool is located in the clubhouse, which you will pass on the left as you are driving to the condominium. To access the pool, use the key on the lanyard located inside the condo. 

**Please Note: This unit is in a condo with other units. Please be aware that you may hear noise from the neighbors at times."

Trash Can Location
Community dumpsters located at the end of the parking lot
'),
('86dr4zgy0', 'Lionel Li 1113', 'live', 'normal', 'none', 'none', true, '1113 Eagle Pointe Way, Pigeon Forge, TN 37863', '1113 Eagle Pointe Way, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Ailyn Regidor', 4, 3, NULL, 3, NULL, 1, 2, 1, 1, 9, 4, 'Main Account', NULL, '228083', '602932', NULL, 'AIRBNB LINK: https://airbnb.com/h/eagle-sunset-cabin  VRBO LINK: https://www.vrbo.com/3819058  BOOKING LINK: https://www.booking.com/hotel/us/eagle-sunset-view-hottub-fireplace-airhockey.en-gb.html  MARRIOTT LINK: https://channel-portal.homes-and-villas.marriott.com/en/preview/40305545  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/228083  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1-T8rAxZviR-gerqnYlZyELJWw2g4g1imKUw_UZ5RRwk/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1py2hzzY6YVZxJ1jl3Qyz6k886vUY_QK9  GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQ2I7V0rGBublDEAI%3D/overview', '1521', 'Blessed - 46', 'Yale Lock: 7751', NULL, '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi Network name: Eagle Sunset Network password: 5StarReview"', NULL, NULL, NULL, 'All about bugs', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'ADDITIONAL INFORMATION
Guests are responsible for providing their own charcoal. 

PARKING/DRIVEWAY
-4 parking spots
-No RV or Trailer
-Paved, Flat lot

Trash Can Location
Bear-proof trash cans located in the driveway''




'),
('86dqtwq7k', 'Atlee Hammaker 3129', 'live', 'normal', 'high', 'none', true, '3129 W Gallaher Ferry Rd, Knoxville, TN 37932', '3129 W Gallaher Ferry Rd, Knoxville, TN 37932, USA', 'Knoxville', 'Lily Bryant Macon', 'Ailyn Regidor', 4, 3, NULL, 2, 2, NULL, 2, 1, 1, 8, 6, 'KnoxStaytion Account', NULL, '219226', '586694', NULL, 'AIRBNB LINK: https://airbnb.com/h/misty-lake  VRBO LINK: https://www.vrbo.com/3778610  BOOKING LINK: https://www.booking.com/hotel/us/misty-lake-hot-tub-w-lake-access.en-gb.html  MARRIOTT LINK: https://channel-portal.homes-and-villas.marriott.com/en/preview/40343122  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/219226  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1nk5QvDRbAnVPRrsYAbSFLZ6wyZHIIv8Acz6oqG-SwyY/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/11csnuitz7AcKScJaeORF7AJBdFsyDQDf  GOOGLE LINK: https://docs.google.com/document/d/1nk5QvDRbAnVPRrsYAbSFLZ6wyZHIIv8Acz6oqG-SwyY/edit ', '3075', 'Knox Storage - 1', '9552', '1937', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi Network name: ATTgtsZy4Z Network password: t894n30%cj#c "', NULL, NULL, NULL, 'Arrow Pest Control', NULL, NULL, 'SCUD', NULL, 'Gas
', NULL, NULL, '25th', NULL, 'EXTRA CODES
Gate Code: “Pin” 888888 “Okay”

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION


PARKING/DRIVEWAY
-6 available parking spots 
-Plenty of free parking 

Trash Can Location

'),
('85yyf2m1w', 'Wayne Flatt 536', 'live', 'junior', 'none', 'none', true, '536 Forest Springs Dr, Gatlinburg, TN 37738', '536 Forrest Springs Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 1, 2, NULL, 1, 1, NULL, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '100830', '225321', NULL, 'AIRBNB LINK: https://airbnb.com/h/whisk-a-way  VRBO LINK: https://www.vrbo.com/2677977  BOOKING LINK: http://www.booking.com/Share-Mdxxi1   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070937  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/100830  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Y82-PKVGbVYtYL0GBSbv12rigNvfOZ_Uke0-Csyl1Sg/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1jJFG_eNqZubvwnK_D6_QbPoJSSpz4CCW  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQy4W48aHKnc0tEAI%3D/overview ', '1166', 'Blessed - 51', '5333', '2312', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: MYSPECTRUM Password: rainybike644', NULL, NULL, NULL, 'Valley Pest co', NULL, 'Handled by Owner', NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'Lockbox code: 0301

ADDITIONAL INFORMATION: How to operate GAS fireplace:

https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING / DRIVEWAY: 
1 ? No Trailers/RVs
Paved but a little steep

TRASH CAN LOCATION: The trash cans are in the driveway
'),
('85yyf2m12', 'Wah Shum 4160', 'live', 'key', 'none', 'none', true, '4160 High Ridge Way, Sevierville, TN 37862', '4160 High Rdg Wy, Sevierville, TN 37862, USA', 'West Gatlinburg', 'Summer Mathews', 'Thomas Hampton', 4, 5, NULL, 4, 3, 1, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '90258', '186123', NULL, 'AIRBNB LINK: https://airbnb.com/h/million-dollar-viewz  VRBO LINK: https://www.vrbo.com/2590828  BOOKING LINK: http://www.booking.com/Share-uzbL9D  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070957  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/90258  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1qMaxYC54x9e84kkxuvLfXHnVZhwY5Laox3AMephYPi0/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1R8DlimkQ53qmHIBmmQjenIkx2UoeORU7  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ9MP7v6bTs8sJEAI%3D/overview ', '1114', 'Blessed - 41', '5333', '1974', 'Direct WIFI: WiFi Name: Million Dollar View WiFi Password: wearsvalley', NULL, NULL, NULL, 'Valley Pest co', 'Integrity Pools', NULL, NULL, NULL, NULL, 'Parking for 5
No RV
No trailer will make it up the drive
There is a flat area at the bottom of the driveway right before you go straight up that you can park at and walk up if you need to. You just have to pull off to the side. It will be about a quarter to a mile walk from there, just make sure you are not blocking.


', 'Strict', '15th', NULL, 'As of Mar 12, 2026:
HKF for guest and Owner stay: $350
Haven CE: $325

As of Sep 3, 2025:
The shared pool and pavilion were removed from the amenities for both Leo Shum 4150 and Wah Shum 4160 as it needs major repair. 

EXTRA CODES
Alarm Code: 1925 
Alarm Location: Left of Front Door 
Owners closet lockbox code (downstairs bedroom): 2468 
Pool door code access (to access pool filter and heater): 2468

QUIRKS AND ODDITIES: MUST HAVE ALL WHEEL OR 4 WHEEL DRIVE VEHICLE. Very steep gravel driveway.

 ADDITIONAL INFORMATION: - Breaker box is on the side of the home with the HVAC units.

How to operate GAS fireplace: https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

TRASH CAN LOCATION: Out front door to the left with 2 bear proof trash bins (2 cans in each, total of 4)

The pool and pavillion are shared with the cabin next door!
Pool door code access (to access pool filter and heater): 2468


'),
('85yyf2kv5', 'Terry Reeves 830', 'live', 'junior', 'none', 'none', true, '830 Golf View Blvd Unit 3109, Pigeon Forge, TN 37863', '830 Golf View Blvd Unit 3109, Pigeon Forge, TN 37863, USA', 'East Parkway', 'Katie Work', 'Ailyn Regidor', 3, 3, NULL, 3, 1, NULL, NULL, 1, NULL, 8, 4, 'Main Account', NULL, '104542', '237393', NULL, 'AIRBNB LINK: https://airbnb.com/h/fairway-getaway-condo  VRBO LINK: https://www.vrbo.com/2818060  BOOKING LINK: https://www.booking.com/hotel/us/higher-ground-condo-with-mountain-and-golf-view.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40095695  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/104542  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/11aH4g20uoKQ7IMZhMfbqNY6OaSRQyOKqqQyz_YI6SNw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1RwLb_ayqT4-SlCeBzshh7haButIIc7a5  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ64mX_-qZ-bfzARAC/overview', '9115', 'Blessed - 1', '8005', '8005', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: WIFI Name: 31093109 WIFI Password: Vacay3109', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'AS of 2025 FIXED DOOR CODE : 8005  (09/17/2005)

QUIRKS AND ODDITIES: This property is located inside a condominium. Please be respectful and considerate of any loud music or noise. Thanks for serving those around you.

ADDITIONAL INFORMATION: HOA maintenance guy contact info: Jimmy - 865-282-7760 (maintenance)
Mitch Lattimer at 205-746-4374 (HOA)

- Indoor & Outdoor Community Pool and Hot tub opens 9:00 am to 10:30 pm daily. (Outdoor pool is seasonal (Memorial day to Labor Day). Indoor open year round)

PARKING / DRIVEWAY: 
2 spots /  No RV or Trailer (banned from HOA)
Parking Garage - is a one-way road inside Building 830. - Easy access - flat paved parking garage.

TRASH CAN LOCATION: - No bear proof bins - dumpster located near the entrance of the condominiums.
'),
('85yyf2kun', 'Sue Landis 410-3002', 'live', 'junior', 'none', 'none', true, '410 Big Bear Way, Unit #3002, Pigeon Forge, TN 37863', '410 Big Bear Wy # 3002, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Lily Bryant Macon', 'Ailyn Regidor', 2, 2, NULL, 2, 1, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '101823', '228498', NULL, 'AIRBNB LINK: https://airbnb.com/h/a-view-to-remember VRBO LINK: https://www.vrbo.com/2735263 BOOKING LINK: https://www.booking.com/hotel/us/a-view-to-remember-jacuzzi-tub-community-pools.ru.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40083044 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/101823 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/10UqjKZIFxInS5uQV5K8NJLiiUPL4ONhJERa5NDxnvgs/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1YtNpyfbAcqZD734wzPROzpIdrBJh2nzJ GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ2cSN8cuIoIeoARAC/overview', '4019', 'Blessed - 5', '5984', '2535 |  Indoor Pool code:  4262 | New Game Room code: 3151 ', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: BB3002 Password: ResortNet', 'Ecobee', NULL, NULL, 'Valley Pest', NULL, NULL, NULL, NULL, NULL, NULL, 'Firm', '15th', '86dwv9nn2', 'EXTRA CODES
Fitness Center: Should be unlocked (if not 9876)
 Indoor Pool code - 4262 New Game Room code - 3151 (10/14/25)

ADDITIONAL INFORMATION: 9 steps to the elevator. 26 steps from back stairwell. The community outdoor pool is open from Memorial Day weekend to Labor Day weekend.

PARKING / DRIVEWAY: There are a few spots in front of the condo. Extra parking is located behind the condo. Once you arrive at your destination, continue straight and follow right, up the hill towards the large white cross. Please do not park in cabin parking spots. No RV or Trailers allowed

TRASH CAN LOCATION: Community Dumpster is located at the exit.

 • Community Indoor Year-Round Pool & Spa
• Community Outdoor Seasonal Pool & Hot Tub

Indoor Pool and Spa:
Located on the main floor of the condominium. 
Hours of operation 10am - 10pm. Year-round access. 

The Spa Timer for jets is located at the end of the pool.
Seasonal Outdoor Pool:
Located at the resort’s entrance. First left turn. 

Open from Memorial Day weekend to Labor Day weekend.
Hours of operation 10am - 10pm. 
Pull up on the knob and push gently. 
Please follow the community pool rules: 

Please take note: There is NO Lifeguard on Duty.
Pets are not allowed in the pool areas.
Please no glass or breakable containers in the pool areas.
No Diving or Horseplay in the pools.
Children under 16 must be accompanied by an adult.

Pool code is needed


'),
('85yyf2kug', 'Kirk Kelso 116-102', 'live', 'junior', 'normal', 'none', true, '116 S Gay St Unit 102, Knoxville, TN 37902', '116 S Gay St #102, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, NULL, 2, 1, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', NULL, '84252', '135920', NULL, 'AIRBNB LINK: https://airbnb.com/h/modern-downtown-l0ft VRBO LINK: https://www.vrbo.com/2298663 BOOKING LINK: http://www.booking.com/Share-VKMVG8 MARRIOTT LINK: Marriott listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84252 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1GXZmjMTSGUUDEycFGap1Zl0aqZLGXKz5SF4R2Rv95o0/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1RD5ggVLg0ZfqtmqFGvlNcPKG1mc8mOjl GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQm_HenMKyzN5BEAI%3D/overview ', '0', 'Knox Storage - 17', '2649', '2684', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Name: Linksys102 Wifi Password: knoxstaytion', 'Nest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632#
Master code: 2649

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

PARKING / DRIVEWAY: Free Parking Pass (3 blocks away)

TRASH CAN LOCATION: If you''re facing the elevators, there''s a trash chute behind the door to the right.

ADDED INFORMATION: 

The extra mattress is in the closet
'),
('85yyf2kue', 'Stephen Su 641', 'live', 'normal', 'none', 'none', true, '641 Gloryland Way, Sevierville, TN 37863', '641 Gloryland Way, Sevierville, TN 37863, USA', 'NW Parkway', 'Summer Mathews', 'Ailyn Regidor', 1, 2, NULL, 1, NULL, NULL, NULL, 1, 1, 2, NULL, 'Main Account', NULL, '90666', '188687', NULL, 'AIRBNB LINK: https://airbnb.com/h/sweetdreams-new VRBO LINK: https://www.vrbo.com/2507870 BOOKING LINK: http://www.booking.com/Share-4mFu6P9 MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058319 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/90666 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1AYPOvkW9Xj-6swQLOtOW_8vQ_IkDYkw72KCmjNqbvjs/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1bCFAJoNNL-P203SBWdBx8ubJevQPwDFc GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQlrCew8CU64kGEAI%3D/overview ', '8490', 'Blessed - 64', '9290', '6361', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: SweetDreams641 Password: Havenvacationguest100', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '15th', NULL, 'As of Apr 13, 2026:
Pool table was removed from the amenities. 
Grill was updated from charcoal to propane.


Master: 9290

QUIRKS AND ODDITIES: PLEASE NOTE: Max expense without consulting owner is $500, per service agreement.

PARKING / DRIVEWAY: Gravel Driveway. 2 spots. Trailer allowed

TRASH CAN LOCATION: Outdoor trash can in the barrel on the porch.
'),
('85yyf2kuc', 'Stephen Su 637', 'live', 'normal', 'none', 'none', true, '637 Gloryland Way, Sevierville, TN 37863', '637 Gloryland Way, Sevierville, TN 37863, USA', 'NW Parkway', 'Summer Mathews', 'Ailyn Regidor', 1, 1, NULL, 1, NULL, NULL, NULL, 1, 1, 2, NULL, 'Main Account', NULL, '90930', '189411', NULL, 'AIRBNB LINK: https://airbnb.com/h/peekaboocabin VRBO LINK: https://www.vrbo.com/2507871 BOOKING LINK: http://www.booking.com/Share-Vzg5dk MARRIOTT LINK: Marriott listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/90930 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tcQcQnYOBmMvw5TNq9AGNSHhSHGE9dROM1rhcg2XJRI/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1aifqKVizHXr8foy5_6ZLKTZZ6A2ABgCr GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ3vecyKqJq4CfARAC/overview ', '5168', 'Blessed - 65', '6331', '7253', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Name: Peekaboo637 Wifi Password: Havenvacationguest100', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '15th', NULL, 'As of Mar 2, 2026: 
Updated HKF Fee to $140

Master: 6331

Well water (10/15/2025)

QUIRKS AND ODDITIES: PLEASE NOTE: Max expense without consulting owner is $500, per service agreement.

PARKING / DRIVEWAY: 
2 parking spots
 Windy, flat gravel driveway 
Plenty of space for trailer

TRASH CAN LOCATION: Outdoor bin in a barrel on the porch
'),
('85yyf2ku8', 'Stephen Fu 225', 'live', 'normal', 'none', 'none', true, '225 Alpine Mountain Way, Pigeon Forge, TN 37863', '225 Alpine Mountain Way, Pigeon Forge, TN 37863, USA', 'East Parkway', 'Summer Mathews', 'Ailyn Regidor', 2, 2, NULL, 1, 1, NULL, 2, 1, 1, 8, 4, 'Main Account', NULL, '106774', '242316', NULL, 'AIRBNB LINK: https://airbnb.com/h/bear-hugs  VRBO LINK: https://www.vrbo.com/2818062  BOOKING LINK: http://www.booking.com/Share-WBB5IK  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40103216  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/106774  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ZytKg7YYzb8Q1yoD1BT3zUPhH4WTKgPur0VVkAmtftU/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1IsHg59ZuuioD9TpDhtzY-jofylVqbmir  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ_4W_4s3IsLthEAI%3D/overview ', '0301', NULL, '3677', '3677', 'StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Bearhugs225 Password: havenpass225', 'Ecobee', NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh712', 'As of Feb 26, 2026:
Xfinity account details
Account Number: 8396 50 046 0045242
Name Stephen Fu

ADDITIONAL INFORMATION:  If there are no pool passes, the guest can mention the cabin name/number and there should be no issues getting in.

There are two Community Pools open from Memorial Day weekend to Labor Day weekend. 9AM - 9 PM.

Wristbands are required for entrance and they are located inside the cabin. If you do not find the wristbands, please let us know right away. There will be a $100 fee if they are lost or stolen. 

Pool #1 Directions: When you enter the resort’s neighborhood, turn right going towards the Wedding Chapel, and the pool will be next door. 

Pool #2 Directions: The address is Campfire Way, Pigeon Forge, TN 37863. Drive to the end of the road and it is located at the end of the cul-de-sac.
No pool passes needed

How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

QUIRKS AND ODDITIES: There is construction being done down the street, so you may occasionally hear construction during the day.

PARKING / DRIVEWAY:
3 Spots Available
No RV or Trailer Parking
Paved and flat

TRASH CAN LOCATION: Bear-proof trash cans, located in the driveway.

'),
('85yyf2ku6', 'Stephen Fu 2107', 'live', 'normal', 'none', 'none', true, '2107 Tamins Dr N, Gatlinburg, TN 37738', '2107 N Tamins Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Summer Mathews', 'Ailyn Regidor', 4, 2, NULL, 2, 3, NULL, NULL, 1, NULL, 14, 8, 'Main Account', 'Haven', '114919', '274686', NULL, 'AIRBNB LINK: https://airbnb.com/h/serenity-view-cabin VRBO LINK: https://www.vrbo.com/2969342?unitId=3541382 BOOKING LINK: https://www.booking.com/hotel/us/serenity-view-firepit-game-room-community-pools.html?lang=xu MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40113231 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/114919 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1g3Wo0gkZLZpPns_a_B0V6jKtEDkmDJjNQr5rqDhlLRE/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1OYh4cuXihF_RoAMVFchPm6Qv2Ekb5SSb GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQiO2yrM3P-afvARAC/overview   ', '8279', NULL, '5333', '5889', 'StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Username: SpectrumSetup-F8 Password: fastlake525', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, '- 4 parking spots
- No RV or Trailer
- Winding road leading to a steep paved driveway. Flattens out enough for 1 car, and the rest will be on an incline.


', 'Strict', '15th', '86dwufgw9', 'ADDITIONAL INFORMATION: Community Pools: https://chaletvillageownersclub.com/
Guests have access to the community pool!
This house is in the Chalet Village - guests have access to 3 clubhouses. 
Chalet Village Office Address: 1319 south baden drive 
Contact: Ken with Chalet Village - 865-436-4440 
Pools are open Friday of Memorial Day Weekend thru Labor Day. 
Pool Hours are 9am to 9pm. 
Passes in property. They only need 1 pass for the whole group.
"The community game room and gym are included. It is only open during the pool hours 9 AM - 9PM. "
***Please Note: Lost passes will result in the guest being required to pay a $50 fee.
South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays. 
North Pool is located at 705 Village Loop Road. Closed on Wednesdays. 
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

TRASH CAN LOCATION: Bear proof cans are located at the end of the driveway.
'),
('85yyf2ku3', 'Stephanie Bowersock 658', 'live', 'key', 'none', 'none', true, '658 Wiley Oakley Dr, Gatlinburg, TN 37738', '658 Wiley Oakley Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Lily Bryant Macon', 'Thomas Hampton', 3, 4, NULL, 3, NULL, 2, NULL, 1, 1, 10, 6, 'Main Account', NULL, '195316', '522250', NULL, 'AIRBNB LINK: https://airbnb.com/h/moonshiners-hideout  VRBO LINK: https://www.vrbo.com/3622325  BOOKING LINK: https://www.booking.com/hotel/us/moonshiners-hideout-hot-tub-game-room-pool.en-gb.html   MARRIOTT LINK: No Link yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/195316  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1T1KaW6TLRH6_0HQrxpdsYzbohPt9euOd7TTPLTUMA3w/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1XLtDaFfXInmI9No2BgR5VCTdUZzf0hr2  GOOGLE LINK: ', '0301', NULL, '3410', '9911', 'StayFi WiFi Name: Haven Vacation Rentals GueWifi Network : SpectrumSetup-277A  Password: materialdiscount484    Direct WIFI WiFi Network: Moonshiners Hideout Password:Applepie@658', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '25th', '86dwufgw9', 'ADDITIONAL INFORMATION: 4wd will be necessary in snowy / icy conditions. 
**Please Note: The fireplace in the living room is only decorative. Please do not burn fires here. 

PARKING /DRIVEWAY:
3 parking spot 
Steep, paved, driveway 
No RV/Trailer 

TRASH CAN LOCATION: Bear Proof trash can in the driveway

COMMUNITY POOL INFO: (Chalet Village)
Guests have access to the 3 community pools & clubhouses, tennis courts & playground!
Pools are open Friday of Memorial Day Weekend thru Labor Day.
Pool Hours are 9am to 9pm.
Passes are in the property from May - September

***Please Note: Lost pool passes will result in the guest being required to pay a $50 fee.

South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays.
North Pool is located at 705 Village Loop Road. Closed on Wednesdays.
Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.

Chalet Village Office Address: 1319 south baden drive


'),
('85yyf2ktz', 'Sridhar Kodati 2951', 'live', 'key', 'none', 'none', true, '2951 Lightning Strike Dr, Sevierville, TN 37862', '2951 Lightning Strike Dr, Sevierville, TN 37862, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, 1, 3, NULL, NULL, 6, 1, 1, 12, 7, 'Main Account', NULL, '202530', '543906', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-view-manor  VRBO LINK: https://www.vrbo.com/3683359  BOOKING LINK: https://www.booking.com/hotel/us/mountain-view-manor-pool-hot-tub-game-room.en-gb.html? MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40317318  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/202530  GREEN LIGHT DOC LINK: https://docs.google.com/spreadsheets/d/1azLx72adUWY6avwfeY7DF6_5I-VaWV2O3LZvx9b6hlA/edit#gid=1108067951  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1NoGpgvTQQqO7ClfyMNVonC4tGzTzOtix  GOOGLE LINK:    https://docs.google.com/document/d/1IedwRn_8mkjre45aOMaCfvMJEElLCUHKie82w1Lbrco/edit', '5724', 'Blessed - 47', '5333', '6372', 'Direct WIFI Wi-Fi network: Mountain Springs Manor WiFi password: manorwood', NULL, NULL, NULL, 'Valley Pest', 'Lori Berry', NULL, NULL, NULL, NULL, NULL, 'Moderate', '25th', NULL, 'As of Mar 27, 2026:
Updated grill info from gas/charcoal combo to gas grill only

EXTRA CODES
Pool Room: 2014 
Pool Lockbox: 2014

ADDITIONAL INFORMATION: 4WD may be needed in snow / icy conditions but is not needed under normal road conditions.  Guests are responsible for providing their own charcoal  

PARKING / DRIVEWAY: 2-3 parking spot / Paved, sloped entrance, then flat. No RV/Trailer 

TRASH CAN LOCATION:  Bear proof trashcans in the driveway

Locked closet by pool room. Lockbox code 1954. 

'),
('85yyf2ktj', 'Spike & Nadim 507', 'live', 'key', 'high', 'none', true, '507 N Central St, Knoxville, TN 37917', '507 N Central St, Knoxville, TN 37917, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 4, 3, NULL, 2, 1, 2, NULL, 1, NULL, 9, 6, 'KnoxStaytion Account', NULL, '84259', '135927', NULL, 'AIRBNB LINK: https://airbnb.com/h/historic-townhome VRBO LINK: https://www.vrbo.com/2298671 BOOKING LINK: http://www.booking.com/Share-qRr3wd MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051707 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84259 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1qVqR-tg7POMYJLFsSTL-xfSayHmYfUn884XM4KCviCE/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1-Jr8e46buqfUvDqNveS_ftdYhnrWlmyW GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ9KSKpsKU5e0KEAI%3D/overview ', '9490', 'Blessed - 63', '1665', '8500', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest WiFi Name: 507NCentralNet Password: 507guest*"', 'Ecobee', NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'EXTRA CODES
Basement lock code: 301 (not for guests)
Lock Code: 8500

ADDITIONAL INFORMATION
"-Crafty Bastard Brewery is a 2 minute walk around the corner
-Dopo Sourdough Pizza is a 4 minute walk
-Market Square is easily accessible by foot
- Outside dumpster is either at the street/behind the house
-The fireplace is not usable at this time and just for aesthetics (We have not listed it as an amenity)
-The lockbox is located by the door in the back. If you walk down the driveway you’ll see it, lockbox is to the right of the door!"

PARKING/DRIVEWAY
- Free Parking in Driveway, up to 3 vehicles. There''s also parking along the street across the house

Trash Can Location
The outside dumpster is either at the street or behind the house.'),
('85yyf2kt7', 'Seann Gloss 459', 'live', 'normal', 'normal', 'none', true, '459 Alpine Mountain Way, Pigeon Forge, TN 37863', '459 Alpine Mountain Way, Pigeon Forge, TN 37863, USA', 'East Parkway', 'Summer Mathews', 'Ailyn Regidor', 2, 3, NULL, 2, 2, NULL, NULL, 1, 1, 8, 4, 'Main Account', NULL, '78819', '134492', NULL, 'AIRBNB LINK: https://airbnb.com/h/splash-of-moonshine  VRBO LINK: https://www.vrbo.com/1779783  BOOKING LINK: http://www.booking.com/Share-VYDSo1  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058317  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/78819  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1vCq4lq5YpdvqTwJ_3zQM3V6_4j4HjULxauWYh1Rnw0o/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1YJXZomjZFxe2LcMmTGrw8-S_h1B-30Rk  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQmo-5lsXcwYswEAI%3D/overview ', '8972', 'Blessed - 15', '1752', '0221', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Name: Linksys06574 Password: e5h7q6pvcm"', 'Ecobee', NULL, NULL, 'Valley Pest co', 'Precision Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh712', 'Lawn care managed by HOA

EXTRA CODES
Pool door keycode 7733

It is imperative that we keep the pool room door open at the property to prevent moisture buildup. Until the dehumidifier is reinstalled, keeping the door open is the only viable option to avoid damage to the lighting.

ADDITIONAL INFORMATION
"PET FRIENDLY
-The community pool is 2260 Alpine Village Way
Memorial day is the official opening day. -The remotes for the lights were in the basket in the living room""
-Pool cleaning day is every Mondays & Thursdays
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be
"

PARKING/DRIVEWAY
Slight incline, blacktop. 3+ spots.

Trash Can Location
There is a bear proof trash bin right outside the cabin'),
('85yyf2kt0', 'Michael Rohwer 2455', 'live', 'junior', 'normal', 'none', true, '2455 Burke Ave, Sevierville, TN 37876', '2455 Burke Ave, Sevierville, TN 37876, USA', 'NW Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, NULL, 1, 2, NULL, 1, 1, 6, NULL, 'Main Account', NULL, '84290', '135930', NULL, 'AIRBNB LINK: https://airbnb.com/h/cab1n-in-the-woods VRBO LINK: https://www.vrbo.com/2334082 BOOKING LINK: http://www.booking.com/Share-Tiks89 MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058315 DIRECT BOOKING SITE LINK: hhttps://stay.havenvacationrentals.com/listings/84290 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1gU88ajyySjY_esSrr1RLm01ZCYVZsWWW4dJsvUL_TDw/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1Pu0kr5qjtfnxAOKtX4CZW5FaQwXqqeVm GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQnOeSl9Ww-5-hARAC/overview ', '1493', 'Blessed - 43', '9132', '1519', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Name: Network: Cabin in the Woods Password: 2455guest!', NULL, NULL, NULL, 'All About Bugs', NULL, 'Blessed Lawncare', NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'EXTRA CODES
Alarm Code: 3185
Crawl Space: 2455

QUIRKS AND ODDITIES
Google maps is Pigeon Forge, Maps in Sevierville

ADDITIONAL INFORMATION
"How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be
  The must be a button at the bottom that you need to press. If there is none, pull the panel that’s at the bottom of the fireplace down. You should see the pilot light switch and the ignition. Set the switch to ""Pilot"" position, push it in, and hit the ignition. That should get the pilot light on. Let us know if this works!

PARKING/DRIVEWAY
- can fit up to 6 cars in the parking space
- Flat, paved driveway
- No 4WD necessary, property is easily accessible

Trash Can Location
double bin to the left of the house'),
('85yyf2krq', 'Sandra Hill 116-101', 'live', 'junior', 'normal', 'none', true, '116 S Gay St, Unit #101, Knoxville, TN 37902', '116 S Gay St #101, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', NULL, '84261', '135929', NULL, 'AIRBNB LINK: https://airbnb.com/h/cozy-downtown-l0ft VRBO LINK: https://www.vrbo.com/2298673 BOOKING LINK: http://www.booking.com/Share-GDkC8J MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058313 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84261 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/11sINk3hRaNx60t7u6WA09thhd35d3tVNQWfwA-rZiO0/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1sh07WUCdl9kERldL5EIELBhveWmEFQlW GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQwNHMr7n4ktHLARAC/overview ', '0', 'Knox Storage - 22', '6982 (updated 3/14)', '9308', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Name: Linksys102 Wifi Password: knoxstaytion"', 'Nest', NULL, NULL, NULL, 'None', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'EXTRA CODES

  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632#
Master code: 4424

Got this from AI - The code to unlock the gym door is 1929.(Guests have access to the gym )

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

ADDITIONAL INFORMATION
-Breaker panel is behind the mirror in the living room

PARKING/DRIVEWAY
"- Sterchi List 
- Free Parking Pass (3 Blocks Away)
- $50 charge for loss or taken parking passes"

Trash Can Location
If you''re facing the elevators, there''s a trash chute behind the door to the right.'),
('85yyf2kra', 'Rob Hart 1141', 'live', 'junior', 'none', 'none', true, '1141 Ski View Lane, Sevierville, TN 37876', '1141 Ski View Ln, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Lily Bryant Macon', 'Ailyn Regidor', 3, 4, NULL, 1, 3, NULL, NULL, 1, 1, 8, 4, 'Main Account', NULL, '107045', '243445', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-hartland    VRBO LINK: https://www.vrbo.com/2818063   BOOKING LINK: http://www.booking.com/Share-j1gDW6  MARRIOTT LINK: Marriott listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/107045  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1L0Z3u0ajBQG5CmbHS6sycvs-7QLg1q6RRGdYKwZQpUo/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1GBzcz-HSQeMo9s40WdICn34bfucymCys  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ2fuBuuT9-rA7EAI%3D/overview ', '1995', NULL, '7950', '1416', '" StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Name: Hartland WiFi Password: havefun1141"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '15th', NULL, 'QUIRKS AND ODDITIES
"- During your stay, you may hear the sound of distant gunshots, do not be alarmed. You are hearing the Gatlinburg Sportsman Club, which is an outdoor licensed shooting range about 2 miles away. We care about our guests'' safety, so please know you are safe at A Beary Happy Place! 

- There is a little bump leading to the kitchen. Please be mindful, so you do not trip.
The breaker box is in the main bedroom."

ADDITIONAL INFORMATION
"4WD or AWD is only necessary in winter months due to the steep paved roads. Guests are responsible for providing their own Firewood.
If you decide to book, you may hear the sound of distant gunshots, do not be alarmed. You are hearing the Gatlinburg Sportsman Club, which is an outdoor licensed shooting range about 2 miles away. We care about our guests'' safety and please know you are safe at A Beary Happy Place!"

PARKING/DRIVEWAY
"2 spots available.
No RV or Trailer Parking"

Trash Can Location
There are bear-proof bins at the front of the driveway.

'),
('85yyf2kqa', 'Porter Landreth 616', 'live', 'normal', 'none', 'none', true, '616 Turkey Nest Rd , APT 306, , Gatlinburg, TN 37738', '616 Turkey Nest Rd Apt 306, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Summer Mathews', 'Ailyn Regidor', 3, 3, NULL, NULL, 2, 2, NULL, 1, NULL, 8, 4, 'B Account ', 'Haven BETA', '191700', '514013', NULL, 'AIRBNB LINK: https://airbnb.com/h/serene-views VRBO LINK: Not pushed yet!  BOOKING LINK: Not pushed yet!  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: Not pushed yet!  GREEN LIGHT DOC LINK:  OWNER PROFILE FOLDER:  GOOGLE LINK: ', '0301', NULL, '5333', '8123', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network:SpectrumSetup-63 Password:tabletduty306"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '-2 parking spot
-Shared Parking Lot
-No RV/Trailer


', 'Strict', '25th', NULL, 'UPDATE: 6 May 2025

HVAC units at this property are under warranty with American Home Shield
No HVAC repairs are to be completed without owner approval. Do not get quotes either. 
As soon as there is an HVAC issue, the owner needs to be contacted by the AM

ADDITIONAL INFORMATION
4wd may be necessary in winter months in Snowy & Icy conditions, but is not needed for normal road conditions. 

Trash Can Location
There is a dumper towards the exit of the complex

Community pool opens from Memorial Day weekend to Labor Day weekend. 

The hours are 9 am - 9 pm.
Community Amenities: Seasonal Outdoor Pool & picnic area
no codes or pass needed

'),
('85yyf2kq8', 'Philip Graves 527', 'live', 'normal', 'none', 'none', true, '527 Golf Road, Pigeon Forge, TN 37863', '527 Golf Rd, Pigeon Forge, TN 37863, USA', 'East Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, NULL, 2, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '86231', '149419', NULL, 'AIRBNB LINK: https://airbnb.com/h/bearly-out-of-bounds  VRBO LINK: https://www.vrbo.com/2416838  BOOKING LINK: http://www.booking.com/Share-xVYA5V  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058309  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/86231  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1rmU6_uGwkJ4foYBPoKO56hm_Q3YvLf8Rrxa5GbmAo-U/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1RCCbYz6C-1HsSLFjo5ifjYloVWmg3hG8  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQr4Klhb3o34VjEAI%3D/overview ', '4973', 'Blessed - 45', '8527', '8999', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI:  WiFi Name:Netgear 80  WiFi Password: greenquail661   "', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'ADDITIONAL INFORMATION
"- New House 
- Cleaning Supplies: Kitchen Closet w/ Washer and Dryer
- Added a charcoal grill to the property"

PARKING/DRIVEWAY
- No Space for RV - Up to 4 Parking Spots - driveway is not steep and does not require a 4WD

Trash Can Location
Normal trash bin on the side of the cabin'),
('85yyf2kpu', 'Nathan Jobe 4515', 'live', 'normal', 'none', 'none', true, ' 4514 Forest Vista Way, Pigeon Forge, TN 37863', '4515 Forest Vista Way, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Ailyn Regidor', 6, 5, NULL, 5, 1, 2, NULL, 1, 1, 16, NULL, 'Main Account', NULL, '181337', '492992', NULL, 'AIRBNB LINK: https://airbnb.com/h/million-dollar-view-cabin  VRBO LINK: https://www.vrbo.com/3559050  BOOKING LINK: https://www.booking.com/hotel/us/million-dollar-view-games-table-movie-theater.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40296428  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/181337  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1FiMrFcSO_lFMmbQLsKw_rlsLKKRFzJ94yfUejZK1iOU/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/13CjkfN-qXr_6x6UCVCcwpWhJG7NJ7bHI ', '8769', 'Blessed - 8', '5333', '7325', '" Stayfi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: Spectrum-setup-8B Password:mistyjet435"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, '22EXTRA CODES
Community Gate Code: 5654 

ADDITIONAL INFORMATION
4WD may be necessary in the winter months. 

PARKING/DRIVEWAY
"-4 parking spots
-paved, sloped
-No RV/trailer parking"

Trash Can Location
Bear Proof trash cans are located in the driveway 

Nathan Jobe Theater Couch 
https://drive.google.com/file/d/1L2oVDCr6Jv9_eX_yLGpVnSmdpeO3_yaH/view?usp=drive_link 


'),
('85yyf2kpe', 'Mike Martin 2939', 'live', 'junior', 'none', 'none', true, '2939 Crestview Ct, Sevierville, TN 37862', '2939 Crestview Ct, Sevierville, TN 37862, USA', 'NW Parkway', 'Katie Work', 'Ailyn Regidor', 3, 2, NULL, 1, 2, 1, NULL, 1, NULL, 8, 4, 'Main Account', NULL, '92981', '200575', NULL, 'AIRBNB LINK: https://airbnb.com/h/crestviewlodge VRBO LINK: https://www.vrbo.com/2593347 BOOKING LINK: http://www.booking.com/Share-C6Co2o MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40077230 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/92981  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ZiiUnx9I_0QU6YxcuZ4v6mRJlyej0Iuo0ZPlRknBNZI/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1HanU_4S8kSHzphAPYBOqKbmYa0LonbJX GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQl7TJjpyFxOXFARAC/overview ', '2592', 'Blessed - 67', '6859', '9652', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Wifi Name: Crestview Retreat Password: havenguest"', 'Ecobee', NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'When a guest complains about the shower not working, advise them to pull the handle out towards them to get the water to come on 

QUIRKS AND ODDITIES
Gate to enter porch - lift gold tap up to open red gate (This is in Owner Profiles as a video)
Hot to open YouTubeTV:
- To open the YouTube app, go to the left side of the screen towards the bottom - Click on the link that says "YouTube TV."
If guest is using Kcups for coffee machine: - If using K-cups, it will use all the water that is placed into the reservoir
- Fill a coffee cup with water
- Place that water into the coffee machine reservoir and then brew coffee using K-cups.

ADDITIONAL INFORMATION
Please follow the steps below to make the shower work.
1. Pull Shower Knob/Handle out (away from wall)
2. Then, once the water is on, press button underneath into the wall.
How to operate GAS fireplace: https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING/DRIVEWAY
4-5 parking spots. RV/Trailers allowed. Flat Blacktop driveway

Trash Can Location
Bear Proof trash cans will be installed soon

'),
('85yyf2kpc', 'Mike Griffith 1036', 'live', 'normal', 'none', 'none', true, '1036 Timber Woods Dr, Sevierville, TN 37862', '1036 Timber Woods Dr, Pigeon Forge, TN 37862, USA', 'NW Parkway', 'Summer Mathews', 'Ailyn Regidor', 3, 3, NULL, 3, 2, 2, NULL, 1, 1, 12, 7, 'Main Account', NULL, '164434', '442273', NULL, 'AIRBNB LINK: https://airbnb.com/h/timber-woods-lodge  VRBO LINK: https://www.vrbo.com/3428578  BOOKING LINK: https://www.booking.com/hotel/us/timber-woods-lodge-view-hot-tub-game-theater-room.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40217781  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/164434 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1QVdIdtebRbelr4UJePO-WqleI6aN_6RHHHIgwlGDmYM/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1bfZbn-Nog67S98i_rxk49x_PYDzy5uVp?ths=true GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQkcLIn5DMo9IOEAI%3D/overview ', '0301', 'Blessed - 69', '0145', '1886', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: WiFi Network: TimberWoodView  Password: 1036timber "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master code: 0145

ADDITIONAL INFORMATION
Guests are responsible for providing their own firewood

PARKING/DRIVEWAY
"-4 parking spots
- Wide and flat paved driveway
-No RV/Trailer "

Trash Can Location
Two bear proof cans located in the driveway
'),
('85yyf2kp3', 'Mehrnaz Mortazavi 1909', 'live', 'normal', 'none', 'none', true, '1909 Rose Pass, Sevierville, TN 37876', '1909 Rose Pass, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 3, NULL, 1, 1, NULL, 3, 1, 1, 7, 4, 'Main Account', NULL, '162886', '436586', NULL, 'AIRBNB LINK: https://airbnb.com/h/sweet-honey-lodge   VRBO LINK: https://www.vrbo.com/3402341    BOOKING LINK: https://www.booking.com/hotel/us/sweet-honey-lodge-newly-built-luxury-escape.html?lang=xu    MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40242052  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/162886    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1mY1_XjVjYVcmhq2PPDi6D7GPP3aNolDaXp9mJ_qIxF4/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1J8b0zrBf_Cz3Cx2dVc7H2LOi_ZA4FYEK?ths=true    GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ7LjFgLbLhMFPEAI%3D/overview ', '0301', NULL, '5333', '#N/A', '"StayFi WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI WiFi Network:Spectrumsetup-59 Password:modernstreet586WiFi Network:Spectrumsetup-23 Password: heavycanoe400 "', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'As of Sep 10, 2025:
Guests are responsible for providing their own propane for grills and outdoor fireplaces/fire pits. There is often a supply left by previous guests, so we recommend checking before purchase.

ADDITIONAL INFORMATION
NO Open FIre 
NO Fireworks 
NO Hunting 
NO Discharging of Firearms 
Speed Limit of 20 mph throughout resort 

PARKING/DRIVEWAY
-3 parking spots
- A short steeply sloped paved driveway that flattens at the top
-NO RV/Trailer 
Trash Can Location
There is a trash can on the porch, we will suggest two bear proof cages to be placed in the driveway 




'),
('85yyf2knw', 'Mary Bierds 3215-503', 'live', 'junior', 'none', 'none', true, '3215 N River Rd, #503, Pigeon Forge, TN 37863', '3215 N River Rd # 503, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Lily Bryant Macon', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '133425', '353831', NULL, 'AIRBNB LINK: https://airbnb.com/h/dolly-dreams VRBO LINK: https://www.vrbo.com/3155578 BOOKING LINK: https://www.booking.com/hotel/us/dolly-dreams-fireplace-minutes-to-dollywood.html?lang=xu MARRIOTT LINK: Still on pending status!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/133425  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/10oionNZ3EgtvdLtOkhToxT07cubtY3iC1ozEVMWp8x4/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/13mbCJL9wNVVARXLCUaFL8QCV_99apC3S GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQiYyliuOfj4iaARAC/overview ', '0930', NULL, '5333', '0930', '" Direct WIFI: Wifi name: River Place Condo’s WiFi Wifi password: riverplacehighspeed "', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', '86dxcvx3h', 'ADDITIONAL INFORMATION
-Guests are responsible for providing their on charcoal 

**Please note: This unit is in a condo. Please be aware that you may hear noise from the neighbors at times. Please respect the other guests who are here by being considerate of any loud music or noise. Thank you!  

Additionally, this condo is near the Pigeon Forge Strip, so you may hear noise from the road at times.  

PARKING/DRIVEWAY
-2 parking spots  
-Condo parking lot 
-No RV/Trailer 

Trash Can Location
Dumpers located in the parking lot to the left of the building (if looking at the building). Guests are responsible for taking their trash there.

Community pool: 
It will be opened on Friday if he doesnt encounter any issues. 
Open from 10am to 10pm daily. 
Location:
Ground Floor, and they go to the back of the building, out the back door, and the pool is on the left.

No access code is needed

'),
('85yyf2kn7', 'Lindsey Hatcher 129', 'live', 'normal', 'normal', 'none', true, ' 129 W Jackson Ave, Unit 103, Knoxville, TN  37902', '129 W Jackson Ave #103, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 4, 2, 'KnoxStaytion Account', NULL, '146058', '402077', NULL, 'AIRBNB LINK: https://airbnb.com/h/jackson-jewel  VRBO LINK: https://www.vrbo.com/3320748  BOOKING LINK:  https://www.booking.com/hotel/us/jackson-jewel-downtown-suite.html?lang=xu   MARRIOTT LINK: No link yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/146058  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Ds7MHChKbxAHwPVJlU7eCVLpJcABlqrt3kR7O8p9UnY/edit#  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/19m3fLOEJ5ACi_BRE7kzDRkuuHBZcujlx  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ-_Xm1u7IxfX8ARAC/overview ', '0301', NULL, '0129', '8772', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: Nmlh103 password: Dolphins94! "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'EXTRA CODES
Second Lockbox code-3855 
Special Codes: Building Code: #8501
Master Code: 0129
Honeywell Thermostat code :  3469

PARKING/DRIVEWAY
-There is paid parking next to the building. Or there is a lot by restaurant Osteria Stella close by. 
-No RV/Trailer

Trash Can Location
Public trash cans are located to the right of the building.  





'),
('85yyf2kmt', 'Lewis Anderson 2691', 'live', 'junior', 'none', 'none', true, '2691 Jessie Rd, Cozy Creek Vlg Unit 7, Sevierville, TN 37876', '2691 Jessie Rd, Sevierville, TN 37876, United States', 'East Parkway', 'Katie Work', 'Ailyn Regidor', 1, 1, NULL, NULL, 2, NULL, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '113415', '262600', NULL, 'AIRBNB LINK: https://airbnb.com/h/sevierville-tiny-home  VRBO LINK: https://www.vrbo.com/2953739  BOOKING LINK: https://www.booking.com/Share-CVCXZh  MARRIOTT LINK: Marriott Listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/113415  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Nzv1JqzHGSmjhiz6f0Fse0VlWbASAMmraWM5aH1lGcY/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1gsSIpgOiCw2ff6QAm9g6gqH--9sczLYP  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQoaTB4ZacpOvSARAC/overview ', '7071', NULL, '4409', '2879', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Wifi Name: hug2g325856 Wifi Password: court71fruit"', NULL, NULL, NULL, 'Valley Pest Co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master Code: 4409

QUIRKS AND ODDITIES
**Please Note: There is no Washer/Dryer, Dishwasher, or Oven in the property - so guests will need to plan accordingly.

ADDITIONAL INFORMATION
Guests are responsible for providing their own Firewood & Charcoal.
**Please Note: There is no Washer/Dryer, Dishwasher, or Oven in the property - so guests will need to plan accordingly.
4WD or AWD is only necessary in winter months due to the steep paved roads.

PARKING/DRIVEWAY
-2 parking spot
-No RV or Trailer
-Gravel - downhill slope

Trash Can Location
-No bear-proof just a regular trash bins

'),
('85yyf2kmj', 'Leo Shum 4150', 'live', 'key', 'none', 'none', true, '4150 High Ridge Way, Sevierville, TN 37862', '4150 High Rdg Wy, Sevierville, TN 37862, USA', 'West Gatlinburg', 'Summer Mathews', 'Thomas Hampton', 4, 5, NULL, 4, 3, 1, NULL, 1, 1, 14, 8, 'Main Account', NULL, '90093', '185297', NULL, 'AIRBNB LINK: https://airbnb.com/h/copper-top  VRBO LINK: https://www.vrbo.com/2590827  BOOKING LINK: https://www.booking.com/hotel/us/copper-top-stunning-views-hot-tub-and-pool.en-gb.html?label=gen173nr-10CAso7AFCKmNvcHBlci10b3Atc3R1bm5pbmctdmlld3MtaG90LXR1Yi1hbmQtcG9vbEgJWARotAGIAQGYATO4ARfIAQzYAQPoAQH4AQGIAgGoAgG4Asyc_8YGwAIB0gIkZDBhMDVhN2UtNTY4MC00N2I1LWFjNGItMzlkYzQ2NjJjNDA52AIB4AIB&sid=f7b730078a0ed52c382d243b411c85c6&dist=0&keep_landing=1&sb_price_type=total&type=total&  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070955  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/90093  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/19GMI4Eqvp0V39U5FjhLSE4yrprlwoDKg2v9_INg331E/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1wFatIwrCjNcn2CjDapLGtZpvm28vhDCx  GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQqvj3t7WPzsh0EAI%3D/overview ', '9741', 'Blessed - 56', '5333', '5159', '"Direct WIFI: Network: Copper Top Password: wearsvalley (Or cabin111 but I think wearsvalley)"', NULL, NULL, NULL, 'Valley Pest co', 'Integrity Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'As of April 6, 2026: 
Removed hot tub amenity since replacement hot tub will be installed on Apr 13

As of Mar 24,2026:
Futon pull out couch is broken and will not close back. Updated from 4 - 3 sleeper sofas 

As of Mar 12, 2026:
HKF for guest and Owner stay: $350
Haven CE: $325

As of Dec 1, 2025:
• The fireplace is currently undergoing maintenance and will be temporarily unavailable. 

As of Sep 3, 2025: 
The shared pool and pavilion were removed from the amenities for both Leo Shum 4150 and Wah Shum 4160 as it needs major repair. 

EXTRA CODES
Alarm Code: 0131 Alarm Location: Left of Front Door 
Owners closet lockbox code (downstairs bedroom): 2468 
Pool door code access (to access pool filter and heater): 2468

QUIRKS AND ODDITIES
- MUST HAVE ALL WHEEL OR 4 WHEEL DRIVE VEHICLE, steep gravel drive

ADDITIONAL INFORMATION
- Shared indoor pool and picnic area between 2 properties on "Million Dollar View" property.
- NO TRAILERS
- Beware of Bears! Do not leave trash or food anywhere outside the cabin. There is a family of bears that is often spotted around the property.
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING/DRIVEWAY
5 parking spots, steep gravel drive

-there is a flat area at the bottom of the driveway right before you go straight up that you can park at and walk up if you need to. You just have to pull off to the side. It will be about a quarter to a mile walk from there, just make sure you are not blocking.

Trash Can Location
Out front door to the left with 4 trash cans (2 in one bear proof, 2 in one bear roof)
'),
('85yyf2kme', 'Leigh Burch 116-108', 'live', 'normal', 'normal', 'none', true, '116 South Gay Street, Unit #108, Knoxville, TN 37902', '116 S Gay St #108, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', NULL, '95208', '208711', NULL, 'AIRBNB LINK: https://airbnb.com/h/sterchi-lofts-getaway  VRBO LINK: https://www.vrbo.com/2674088  BOOKING LINK: http://www.booking.com/Share-skGc76  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070959  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95208 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1gxURS0IKplUGN0aJ0aVtadGPs7KVdfEz202FYPe7AQo/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1xh4qrZ62r75tMl-AtwBMV1s4h8aHIxx1  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ3e-a6r2fz9kVEAI%3D/overview   ', '0', 'Knox Storage - 21', ' 7069', '2949', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: 108Airbnb Password: Sterchilofts108! Location: Next to the Murphy Bed"', NULL, NULL, NULL, 'd', NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '15th', '86dwuh56r', 'CONTACT AM PRIOR TO ANY REPAIRS BEING COMPLETED - THE OWNER HAS THEIR OWN MAINT. TEAM AND WOULD LIKE THE OPPORTUNITY TO USE THEIR GUYS.
NO WEEKEND SUBBED-OUT REPAIRS WITHOUT EXPLICIT OWNER APPROVAL!

USE THIS FOR WIFI:
Network: 108Airbnb
Password: Sterchilofts108!

EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 
Master code: 7069

Parking is now managed by Park Tenn. Follow the instructions here: https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

QUIRKS AND ODDITIES
Guests must sign a waiver in order to use the loft due to the low ceiling

ADDITIONAL INFORMATION
To locate the property:
Enter Sterchi at ground floor and walk back toward the elevators. When facing the elevators, there is a door to your right that leads towards the stairs. Enter this door and Sterchi 108 is directly behind the door.
BREAKER PANEL: Next to the thermostat by the workspace table

PARKING/DRIVEWAY
Parking pass for 1 car on 305 West Vine Avenue 

We may also suggest parking at the Free Public Parking Lot: 
202 E Jackson Ave 
*Haven has digital copies of parking passes to replace passes taken by guests.

Trash Can Location
Trash Compactor on each floor of the building (might want to edit wording haha)
'),
('85yyf2kmc', 'Leigh Burch 116-105', 'live', 'normal', 'normal', 'none', true, '116 S Gay St, Unit 105, Knoxville, TN 37902', '116 S Gay St #105, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 4, 2, NULL, 1, 4, NULL, 2, 1, NULL, 11, 6, 'KnoxStaytion Account', NULL, '151631', '417116', NULL, 'AIRBNB LINK: https://airbnb.com/h/downtown-loft-modern-flare   VRBO LINK: https://www.vrbo.com/3370367   BOOKING LINK: https://www.booking.com/hotel/us/historic-downtown-loft-with-modern-flare.html?lang=xu   MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/151631    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1IVSXfKirfBYc-oL9e5ryMCVhRbOcBhAuSgQ6r91IJA8/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1Fp1C06g3ptXEyvLoRHacVPqYJk5XEXcn?ths=true    GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQoZPlqpu4vauRARAC/overview', '0', NULL, '5327', '5979', '"StayFi:  WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'CONTACT AM PRIOR TO ANY REPAIRS BEING COMPLETED - THE OWNER HAS THEIR OWN MAINT. TEAM AND WOULD LIKE THE OPPORTUNITY TO USE THEIR GUYS
NO WEEKEND SUBBED-OUT REPAIRS WITHOUT EXPLICIT OWNER APPROVAL!

EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 
Master: 5327

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

ADDITIONAL INFORMATION
-There are public paid Electric Vehicle chargers throughout downtown Knoxville, and there is not a free one available at the property. We recommend searching for close by charging stations, such as at ChargePoint Charging Station located at 811 Neyland Dr, Knoxville or you can try and check Electric Vehicle Charging Station at 520 State St, Knoxville, TN 37902. 
-There is a parking pass in the unit for the parking lot located at 305 W Vine Ave. The pass is good until the 8th of the month after the month shown on the pass. For example if it says “March 2018” then it is good through April 8th. DO NOT PARK IN THE LOT UNLESS THE PASS IS IN YOUR CAR BECAUSE THEY WILL TOW IT! Also, make sure you put the pass back before you check out! This lot is about 3 blocks away so you may want to pull into one of the metered spots in front of the building to unload your luggage and grab the parking pass.

PARKING/DRIVEWAY
-Street or Public Parking 
-No RV/Trailer

Trash Can Location
 If guests need to remove trash during their stay, they can use the trash compactor on the main level in the hallway
'),
('85yyf2kma', 'Leigh Burch 116-103', 'live', 'normal', 'normal', 'none', true, '116 South Gay Street, Unit #103, Knoxville, TN 37902', '116 S Gay St #103, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 1, NULL, NULL, 2, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '102072', '230093', NULL, 'AIRBNB LINK: https://airbnb.com/h/urban-sterchi-lofts VRBO LINK: https://www.vrbo.com/2733380 BOOKING LINK: No listing link for guest. Status is Closed/Not bookable. MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40077221 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/102072 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1MEnt6a4EbYR-GGXJwRhvvva4kX3PrVPaya8Go_xqPKk/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1ZAsch8kl99-jw2s03V1xUaE_qUZJgPBL GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQhPz9mpOCiapnEAI%3D/overview ', '0', 'Knox Storage - 20', '6317', '6740', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: ATTPYKM9AB Password: bw6=q6znwix9 The actual equipment for this unit is in unit 102. (Steve Desoto 116- 102)"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'CONTACT AM PRIOR TO ANY REPAIRS BEING COMPLETED - THE OWNER HAS THEIR OWN MAINT. TEAM AND WOULD LIKE THE OPPORTUNITY TO USE THEIR GUYS
NO WEEKEND SUBBED-OUT REPAIRS WITHOUT EXPLICIT OWNER APPROVAL!

EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

ADDITIONAL INFORMATION
- There will be a $50 charge if the parking pass is lost or taken.

- We provide 2 parking passes for a lot about 3 blocks away. More vehicles? Free public parking on the weekends and after 6PM on weekdays. Uber and Lyft are both utilized frequently in this area. In addition, Knoxville downtown/campus areas are serviced by electric scooters if you are up for an adventure!

PARKING/DRIVEWAY
Parking pass for 1 car on 305 West Vine Avenue 

We may also suggest parking at the Free Public Parking Lot: 
202 E Jackson Ave 
*Haven has digital copies of parking passes to replace passes taken by guests.

Trash Can Location
If you have any excess trash during your stay, you may use the trash compactor in the hallway.
'),
('85yyf2km7', 'Leigh Anne Chong 2021', 'live', 'normal', 'none', 'none', true, '2021 McCarter Dr, Sevierville, TN 37862', '2021 McCarter Dr, Sevierville, TN 37862, USA', 'East Parkway', 'Summer Mathews', 'Ailyn Regidor', 3, 3, NULL, 3, NULL, 2, 5, 1, 1, 15, NULL, 'Main Account', NULL, '86393', '149898', NULL, 'AIRBNB LINK: https://airbnb.com/h/peaks-of-blue  VRBO LINK: https://www.vrbo.com/2397792  BOOKING LINK: http://www.booking.com/Share-MToxy5  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063890  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/86393  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Js4INxlkzutCHQpoMybJDvSk_iTaAU9hnsvEucuQnxE/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1PkO8_gBsKuij9daOG87Twn8bIPCQZSeQ  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQjvWL56aRtrA2EAI%3D/overview    ', '8824', 'Knox Storage - 19', '5333', '5169', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password:a havenguest Direct WIFI: Network: Peaks of Blue Password: Time4r&r"', NULL, NULL, NULL, 'Bug Busters', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'EXTRA CODES
ADT Alarm Code: 2021 

QUIRKS AND ODDITIES
Theater Room Instructions:
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1677349177796979

ADDITIONAL INFORMATION
Storage unit: Affordable storage guys 2339 old Callahan road, Knoxville TN 37912 Unit #B25 Gate code: 22580#
-The property has a compact Keurig and a regular coffee maker
- Breaker is the gray panel on the front left of the house
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING/DRIVEWAY
8 Spots, driveway is steep but paved

Trash Can Location
On the left side of the driveway
'),
('85yyf2km1', 'Laura Oxendine 4808', 'live', 'junior', 'high', 'none', true, '4808 Deanbrook Rd, Knoxville, TN 37920', '4808 Deanbrook Rd, Knoxville, TN 37920, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 3, 3, NULL, NULL, 3, 1, 2, 1, 1, 9, 5, 'KnoxStaytion Account', NULL, '179643', '488339', NULL, 'AIRBNB LINK: https://airbnb.com/h/creekside-rancher  VRBO LINK: https://www.vrbo.com/3529735  BOOKING LINK: https://www.booking.com/hotel/us/cozy-creekside-rancher-heart-of-downtown-knoxville.en-gb.html MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40290742  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/179643  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1HWmiNKEqXVB29Iv0LMIsoceCWC_fVCJ3w0L7rfK54RI/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/18dAXpxId_cP__S6pVz5gG6vM4D5GU54y  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ9cioweemopBfEAI%3D/overview ', '5172', 'Knox Storage - 18', '8241', '3725', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI  WiFi Network: Deanbrook Password: 08132011 "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'ADDITIONAL INFORMATION
-Guest are responsible for providing their own firewood, charcoal, & wood pellets 
-Private Tesla Charger on site. 

PARKING/DRIVEWAY
-4 parking spots
-paved, private, flat 
-No RV/trailer parking
FYI: Please do not park on the bridge. 

Trash Can Location
 Two outdoor trashcans on the other side of the pink door in the patio 
'),
('85yyf2kkz', 'Larry Burton 725', 'live', 'junior', 'none', 'none', true, '725 Lloyd Huskey Rd, Sevierville, TN 37862', '725 Lloyd Huskey Rd, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Lily Bryant Macon', 'Ailyn Regidor', 3, 2, NULL, 1, 2, NULL, 3, 1, 1, 9, 5, 'Main Account', NULL, '122798', '315117', NULL, 'AIRBNB LINK: https://airbnb.com/h/secluded-forest-home  VRBO LINK: https://www.vrbo.com/3032568  BOOKING LINK: https://www.booking.com/hotel/us/forest-home-hot-tub-fire-pit-pool-table.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40131336    DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/122798  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1lffkKG8AOgPlMdHKIPfqeXZh4ZeoALYb387oBMXQOaI/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1GvbNP24jEdcQ8UVT5Bwk8df2aFzzSpqv  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ4pvV5frso5qOARAC/overview ', '1632', NULL, '2432', '9346', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: NEW WiFi Network: STARLINK Wifi Password: 725LloydHuskey', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master Code: 2432

ADDITIONAL INFORMATION
- Guests are responsible for providing their own firewood 
FYI:
The extra bedding is in the chest in the master bedroom

PARKING/DRIVEWAY
-5 parking spots -Paved.

Trash Can Location
Bear proof trashcans across from the porch

'),
('85yyf2kkk', 'Kirk Kumagai 1012', 'live', 'normal', 'none', 'none', true, '1012 Vista Dr, Gatlinburg, TN 37738', '1012 Vista Dr, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Summer Mathews', 'Ailyn Regidor', 1, 1, NULL, 1, NULL, 1, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '94054', '205711', NULL, 'AIRBNB LINK: https://airbnb.com/h/constellation-station  VRBO LINK: https://www.vrbo.com/2771688  BOOKING LINK: http://www.booking.com/Share-vD4YycE  MARRIOTT LINK: No listing link.   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/94054    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tLzhKWNXRTdafGA228VbI11PxPifxYfuwAVFrj4DRWw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/146N1zBGVgY5rWCeN5ordrBc9XpbcvuP1  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQnvn2lsyH2pYZEAI%3D/overview ', '7838', 'Blessed - 24', '3845', '7809', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Wifi Network: Mountain Escape Wifi Password: *open network* "', 'Ecobee', NULL, NULL, 'Valley Pest Co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'ADDITIONAL INFORMATION
Hot Tub breaker located inside laundry room, which is in bathroom

PARKING/DRIVEWAY
2 Parking Spots. No RV or Trailers allowed
Blacktop, downhill not super steep

Trash Can Location
bear- proof in front of cabin
'),
('85yyf2kkb', 'Kathleen Atkins 123', 'live', 'normal', 'none', 'none', true, '123 Valerie Ln, Seymour , TN 37865', '123 Valerie St, Seymour, TN 37865, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 3, 3, NULL, 2, 1, 3, NULL, 1, 1, 14, 8, 'Main Account', NULL, '147152', '404213', NULL, 'AIRBNB LINK: https://airbnb.com/h/smokys-landing   VRBO LINK: https://www.vrbo.com/3291741     BOOKING LINK:  https://www.booking.com/hotel/us/smokys-landing-disc-golf-game-room-fire-pit.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40194233  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/147152    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1P7NaAInShwpCDTXT-Q189GaFBM1Rie4vTBoYcGqPa4Q/edit#   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1bNnxNejftk_pr8ff5q2IdXRZMgRkvask    GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQk_uW2LTl06ohEAI%3D/overview ', '9830', NULL, '7732', '8047', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: 123Valerie Password: jackburton"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'EXTRA CODES
Gate Code: 1313, 1314
Master code: 7732

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION
Nearest EV charger: Blink Charging Station - 2915 Island Home Ave, Knoxville, TN 37920, **Please Note: The garage door in the game room can be opened manually, but has no child sensor yet. So guests will need to be careful when opening and closing the door. 

PARKING/DRIVEWAY
-4 parking spots 
-a stone drive that widens out in the middle of the lane. 
-No RV Trailer 

Trash Can Location
-There are trash cans located in the garage in the lower level

Kathleen Atkins Fold Out Couch
https://drive.google.com/file/d/12-sZSeLYdlwn8BpC3JviE0vDoPhHcaC0/view?usp=drive_link 

'),
('85yyf2kk8', 'Karim Boghani 118-4', 'live', 'key', 'normal', 'none', true, '118 East Jackson Ave, Unit #4, Knoxville, TN 37915', '118 E Jackson Ave #4, Knoxville, TN 37915, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 2, NULL, NULL, 4, NULL, NULL, 1, NULL, 8, 4, 'B Account ', NULL, '95211', '208712', NULL, 'AIRBNB LINK: https://airbnb.com/h/unique-old-city-loft-knoxville  VRBO LINK: https://www.vrbo.com/2606656  BOOKING LINK: Closed/Not bookable  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40060283  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95211  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1D7GMHuppzz9TtqONYKvnDafk9yLxW_GRMjlKAc2PJVs/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1GE5o0DKql2k3QIVj0HWDbvvgOUH-roTp  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ3fHij4j5lKMaEAI%3D/overview ', 'New: 5943    1160/1439', 'Knox Storage - 23', '1044', '2273', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Linksys56651 Password: nzkdp1eqdt Location: behind the TV on the left"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '25th', NULL, 'EXTRA CODES
As of Feb 26, 2026:
Street Door Code: 2460
Room Lockbox Code (just inside the door): 5943 Location: Entry on Street Level 
Cleaning Storage Cabinet Code: 819 
Black door to the mailbox code: 6019
Master Code:  1044

QUIRKS AND ODDITIES
-Spiral staircase if very narrow

ADDITIONAL INFORMATION
-Breaker panel: By the front door, labeled.

PARKING/DRIVEWAY
Please note that Jackson Avenue Lofts no longer provides free parking. The previous parking passes are no longer working, and we''ve had reports of guests getting towed. We''ve also removed the "free parking" amenity from these listings. Alternative Paid Parking Nearby:
 
If you''re at Jackson Avenue Lofts, you can use the Old City Public Parking Lot at:
298 E Jackson Ave, Knoxville, TN 37915

Trash Can Location
-Place all trash in trash cans located on the left side of the building (beside Kefi Restaurant).
'),
('85yyf2kk5', 'Karim Boghani 118-3', 'live', 'key', 'normal', 'none', true, '118 East Jackson Avenue, Unit #3, Knoxville, TN 37915', '118 E Jackson Ave #3, Knoxville, TN 37915, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 2, NULL, NULL, 4, 1, NULL, 1, NULL, 10, 6, 'KnoxStaytion Account', NULL, '95464', '209237', NULL, 'AIRBNB LINK: https://airbnb.com/h/heart-of-the-old-city-loft  VRBO LINK: https://www.vrbo.com/2602343  BOOKING LINK: http://www.booking.com/Share-LQ2JUg  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40077200  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95464  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1AoxCd2ZMpBckvpX2LoqAXk8SSnRE4TOhwDFicn8XKRM/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/10Ni-rhPXZLcHYhs8dGkCVDdGReqHppmL  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQxZWct8DhkIoHEAI%3D/overview ', 'New: 3725    ', 'Knox Storage - 14', '0410', '9181', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Linksys56651_2GEXT Password: nzkdp1eqdt"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '25th', NULL, 'EXTRA CODES
AS of Feb 26, 2026:
Street Door Code: 2460
Room Lockbox Code (just inside the door): 3725 Cleaning Storage Cabinet Code: 819 
Black door to the mailbox code: 6019
Master Code:  0410

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Breaker panel: In the foyer, labeled

PARKING/DRIVEWAY
Please note that Jackson Avenue Lofts no longer provides free parking. The previous parking passes are no longer working, and we''ve had reports of guests getting towed. We''ve also removed the "free parking" amenity from these listings. Alternative Paid Parking Nearby:
 
If you''re at Jackson Avenue Lofts, you can use the Old City Public Parking Lot at:
298 E Jackson Ave, Knoxville, TN 37915

Trash Can Location
-Place all trash in trash cans located on the left side of the building (beside Kefi Restaurant).
'),
('85yyf2kk3', 'Karim Boghani 118-2', 'live', 'key', 'normal', 'none', true, '118 East Jackson Ave, Unit #2, Knoxville, TN 37915', '118 E Jackson Ave #2, Knoxville, TN 37915, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 1, NULL, NULL, 2, 2, NULL, 1, NULL, 8, 4, 'KnoxStaytion Account', NULL, '95305', '208979', NULL, 'AIRBNB LINK: https://airbnb.com/h/spacious-old-city-loft  VRBO LINK: https://www.vrbo.com/2602341  BOOKING LINK: http://www.booking.com/Share-tVL4J9  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40077212  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95305  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1hCrj5CaZhm3mvTbuQXL60umtRDoxC8SEKSRm0rE-WI0/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1ng-F7UMXPA_lrK6YCu_EeXN-9OpaQ5sE  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ_8Df59T8tZabARAC/overview ', 'New: 7204', 'Knox Storage - 13', '6437', '7005', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Terminus 118-2 Password: Terminus1"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '25th', NULL, 'EXTRA CODES
Street Door Code 2460
Room Lockbox Code (just inside the door): 7204 Location: Entry on Street Level 
Cleaning Storage Cabinet Code: 819 
Black door to the mailbox code: 6019
Master Code:  6437
Roof code : 5901 (lockbox)
QUIRKS AND ODDITIES
-Per guest review, this loft is located right across a station

ADDITIONAL INFORMATION
-Breaker panel: By the front door, labeled.

PARKING/DRIVEWAY
Please note that Jackson Avenue Lofts no longer provides free parking. The previous parking passes are no longer working, and we''ve had reports of guests getting towed. We''ve also removed the "free parking" amenity from these listings.

Alternative Paid Parking Nearby:
 If you''re at Jackson Avenue Lofts, you can use the Old City Public Parking Lot at:
 298 E Jackson Ave, Knoxville, TN 37915


Trash Can Location
-Place all trash in trash cans located on the left side of the building (beside Kefi Restaurant).
'),
('85yyf2kk1', 'Karim Boghani 118-1', 'live', 'key', 'normal', 'none', true, '118 East Jackson Ave, Unit #1, Knoxville, TN 37915', '118 E Jackson Ave #1, Knoxville, TN 37915, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, NULL, 1, 2, NULL, 1, NULL, 5, 4, 'KnoxStaytion Account', NULL, '95422', '209236', NULL, 'AIRBNB LINK: https://airbnb.com/h/modern-old-city-loft  VRBO LINK: https://www.vrbo.com/2602342  BOOKING LINK: http://www.booking.com/Share-owzdg9  MARRIOTT LINK: Marriott listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95422  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1nBd064WFoH5O9KuszZMOoHQHH-7MhAQqODFZ4ckJm9c/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1cUJnoioKsQabecKoltF-5ddzp6HAnGsC  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQiazbjs228aBZEAI%3D/overview ', 'New: 4087', 'Knox Storage - 12', '0714', '2744', '" StayFi:WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Terminus 118-2 Password: Terminus1 Location: Shares with unit 118-2"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ' Wood  
', NULL, NULL, '25th', NULL, 'EXTRA CODES
As of Feb 26, 2026:
Street Lockbox Code: 2460
Street door Code: 2460
Room Lockbox Code (right when you enter the street door to the left) : 4087
Cleaning Storage Cabinet Code: 819 
Black door to the mailbox code: 6019 
Master Code:  0714

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Breaker panel: Behind the front door, labeled

PARKING/DRIVEWAY
Please note that Jackson Avenue Lofts no longer provides free parking. The previous parking passes are no longer working, and we''ve had reports of guests getting towed. We''ve also removed the "free parking" amenity from these listings. Alternative Paid Parking Nearby:
 
If you''re at Jackson Avenue Lofts, you can use the Old City Public Parking Lot at:
298 E Jackson Ave, Knoxville, TN 37915


Trash Can Location
-Place all trash in trash cans located on the left side of the building (beside Kefi Restaurant).
'),
('85yyf2kjz', 'Karim Boghani 112-3', 'live', 'key', 'normal', 'none', true, '112 East Jackson Ave, Unit #3, Knoxville, TN 37915', '112 E Jackson Ave #3, Knoxville, TN 37915, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 3, 1, NULL, NULL, 1, 4, NULL, 1, NULL, 10, 6, 'B Account ', NULL, '95292', '208954', NULL, 'AIRBNB LINK: https://airbnb.com/h/elegant-old-city-loft  VRBO LINK: https://www.vrbo.com/2657807  BOOKING LINK: http://www.booking.com/Share-hPpCDm  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070965  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/95292  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1QvtL-_toYLOUAsZE5o3zY06BxUZf55y5HpEBaBfypUE/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1NR6_n9aeyDntOZt9Pi_yusas41krTDZc  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQxremxqS42JesARAC/overview ', '5901', 'Knox Storage - 6', '5624', '2953', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: 112-3 AirBnB Password: Terminus1 Location: 2nd bedroom on the left"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ' Wood  
', NULL, NULL, '25th', NULL, 'EXTRA CODES
Cleaning Storage Cabinet Code: 819
Master Code:  5624  

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Breaker panel is behind the 2nd bedroom door on the left.

PARKING/DRIVEWAY
- Please note that Jackson Avenue Lofts no longer provides free parking. The previous parking passes are no longer working, and we''ve had reports of guests getting towed. We''ve also removed the "free parking" amenity from these listings. Alternative Paid Parking Nearby:

If you''re at Jackson Avenue Lofts, you can use the Old City Public Parking Lot at:

298 E Jackson Ave, Knoxville, TN 37915


Trash Can Location
-Place all trash in trash cans located on the left side of the building (beside Kefi Restaurant).
'),
('85yyf2kjh', 'Justin Bailey 6829', 'live', 'junior', 'normal', 'none', true, '6829 Clinton Hwy, Knoxville, TN 37921', '6829 Clinton Hwy, Knoxville, TN 37921, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 1, 1, NULL, NULL, 1, NULL, NULL, 1, NULL, 2, NULL, 'KnoxStaytion Account', NULL, '187612', '506146', NULL, 'AIRBNB LINK: https://airbnb.com/h/airplane-filling-station  VRBO LINK: https://www.vrbo.com/3712540  BOOKING LINK: https://www.booking.com/hotel/us/airplane-filling-station-unique-stay-in-knoxville.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/187612  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1st39N4Ftmqbic6MK8d74ZHKp83XRcpgmZiWW6_AJwM8/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1KFqGsJM9y8wuvXOzMOCZc_dOUHXhSImN  GOOGLE LINK: ', '5900', 'Knox Storage - 10', '9927', '1297', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: CBCI-242E Password: bored1835borrow"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master Code: 9927

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Please Note: This property is located on Clinton Highway, so you will hear noise from the road. Sound machines are provided.  
- Please note: There are public paid Electric Vehicle chargers throughout downtown Knoxville, and there is not a free one available at the property. We recommend searching for close by charging stations, or you may check the nearest one located at 520 State Street or 4515 Clinton Hwy.
PARKING/DRIVEWAY
--1 parking spot 
- gravel lot 
-No RV/Trailer 

Trash Can Location
-
'),
('85yyf2kjc', 'Julie Michala 338-101', 'live', 'junior', 'none', 'none', true, '338 Shooting Star Loop, Unit #101, Townsend, TN 37882', '338 Shooting Star Loop #101, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '79561', '134512', NULL, 'AIRBNB LINK: https://airbnb.com/h/moderncades-cove  VRBO LINK: https://www.vrbo.com/2075067  BOOKING LINK: http://www.booking.com/Share-lfzkc5  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063864  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/79561  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1TUZPGEKeapq-Sxj2Fm784IonDU6Fyyf3k45b9A76DP0/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1dV0rnnXEZWJcIp8Cphg7A001hA9Bhj-q  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQxoLQ5bvDvZtsEAI%3D/overview ', '8300', 'Blessed - 40', ' 5287', '3484', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Wifi Name: Sugarlands101guest Wifi Password: Havenguest101"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', '86dwuh61h', 'Master code: 5287
Roku TV Pin: 0294

EXTRA CODES
 May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June is: #9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467   

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-• The community pool is open from Memorial Day weekend to Labor Day weekend 
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.
No code or pass needed

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.


PARKING/DRIVEWAY
-"Parking passes are required to be displayed on dashboard and are located inside the condo in cabinet to the left of the microwave above the oven. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles. 
-There is no RV or trailer parking per the HOA. 
-Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility. Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved."""""""

Trash Can Location
-If you need to take the trash out during your stay, there are bear-proof trash bins as you head towards the construction exit on the left
'),
('85yyf2kj1', 'Josef Wankerl 1030', 'live', 'normal', 'none', 'none', true, '1030 Heiden Cir, Gatlinburg, TN 37738', '1030 Heiden Cir, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 3, 3, NULL, NULL, 2, 1, 2, 1, 1, 10, 6, 'Main Account', NULL, '83165', '134558', NULL, 'AIRBNB LINK: https://airbnb.com/h/bear-view-chalet VRBO LINK: https://www.vrbo.com/2298653 BOOKING LINK: http://www.booking.com/Share-2NvI4I MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063880 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/83165 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1IgVg6F-Gcx570BenqAtLntnWkMD3K-lWgUTTPLrFKmo/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/19sVMNcW3RDCYPXzdx-1LjP5-EVbdmkId GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ1t_rrIqIkaNsEAI%3D/overview ', '6299', NULL, '4723', '3585', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: WiFi Name: Bear View Chalet Password: ober&unter+bar"', NULL, NULL, NULL, 'Valley Pest Co', NULL, NULL, NULL, NULL, 'Wood    
', NULL, NULL, '15th', '86dwufgw9', 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-Community Pools:https://chaletvillageownersclub.com/
Guests have access to the community pool! This house is in the Chalet Village 
- guests have access to 3 clubhouses. Chalet Village Office Address: 1319 south baden drive 
Contact: Ken with Chalet Village - 865-436-4440 
Pools are open Friday of Memorial Day Weekend thru Labor Day. Pool Hours are 9am to 9pm. Passes in property. 
***Please Note: Lost passes will result in the guest being required to pay a $75 fee. 
South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays. North Pool is located at 705 Village Loop Road. Closed on Wednesdays. Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesdays.  
>BBQ push light is out, but the guests can use a kitchen lighter to light it up.  

PARKING/DRIVEWAY
-If you are facing the property, the parking garage is to the left underneath the building right next to the property, called the Overlook. Your parking spot is straight back, second to last on the right side. Labeled RH102. 
The parking is right through the property! There’s a pull-off that’s specific to this cabin. Enough for about 3-4 small vehicles!

Trash Can Location
-Bear proof trash cans right outside the cabin
'),
('85yyf2khp', 'John Bryan 4144', 'live', 'key', 'none', 'none', true, '4144 Chamberlain Ln, Sevierville, TN  37862', '4144 Chamberlain Ln, Sevierville, TN 37862, USA', 'Townsend', 'Summer Mathews', 'Thomas Hampton', 5, 4, NULL, 4, NULL, 4, 1, 1, 1, 14, 8, 'Main Account', NULL, '146019', '402074', NULL, 'AIRBNB LINK:  https://airbnb.com/h/grands-mountain-house  VRBO LINK: https://www.vrbo.com/3345421    BOOKING LINK: https://www.booking.com/hotel/us/grands-mountain-house-new-build-w-private-pool.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40203471  DIRECT BOOKING SITE LINE: https://stay.havenvacationrentals.com/listings/146019    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1stsEacXyizuVLysBGqaUthwc_kefe_xjVt_0UUJzLew/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1oSQna30ItoZFYi4lbmsTPKEAmthHrfe6  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQobaNrKb95tR9EAI%3D/overview ', '2331', NULL, '5333', '5610', 'StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest   Direct WIFI WiFi Network: Haven House Rentals Guest Main Password: 41Chamberlain44', NULL, NULL, NULL, NULL, 'Precison Pools ', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, '
As of Feb 12, 2026:
WiFi Name: Haven House Rentals Guest Main
WiFi Password: 41Chamberlain44

 

AS of Jan 15, 2026:
 The seasonal community pool at Honeysuckle is open from Memorial Day weekend through Labor Day weekend, and day passes are only $5 per person. The pool is very close to the house. The day pass also includes a fishing permit for their private catch-and-release pond, which is open year-round.
  

As of Jan 8, 2026:
Yale Code: 5610
Lockbox Code: 2331

UPDATE: JUNE 12, 2025
New WIFI details: Direct WIFI Network: CBCI-6996 Password: create4603cover

EXTRA CODES
Pool Room Mechanical Room: Coded Deadbolt 3701 
Special Codes: 
Pool Door Code: 9155
Lockbox Code: 0301

QUIRKS AND ODDITIES
-EV Charger located off the front porch and is a 220 volt with a Tesla adapter

ADDITIONAL INFORMATION
-Any major issues at the property, the owner would like to be kept in the loop to help assist in bring resolution quickly for guests. Please let the account manager know (Summer M) by tagging him on the work order any time there''s a major issue (think water/plumbing related issue or internet/major amenity issue) so the owner can be informed and help as needed.

-4WD may be necessary in the winter 
-Guests will be responsible for bringing their own charcoal and firewood.   

PARKING/DRIVEWAY
-5 parking spots 
- Sloped entry that flattens out along the front porch. 
-No RV/Trailer  

Trash Can Location
-Two Bear Proof trash cans located in the parking area 
'),
('85yyf2khm', 'Joey Henshaw 2420', 'live', 'normal', 'low', 'none', true, '2420 Breezy Ridge Dr, Sevierville, TN 37876', '2420 Breezy Ridge Dr, Sevierville, TN 37876, USA', 'East Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 2, 1, NULL, 1, 1, 1, 6, 4, 'Superhost Account', NULL, '130957', '340638', NULL, 'AIRBNB LINK: https://airbnb.com/h/shining-starr   VRBO LINK: https://www.vrbo.com/3317592   BOOKING LINK: https://www.booking.com/hotel/us/a-shining-starr-beautiful-mtn-views-hot-tub.html?lang=xu    MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40199391  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/130957    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1LNujLvdjM7m_dD8ozQ6iRcO8e-jurcv2Zw057Z5JBJU/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1GbzQBIGDR85Yn9In0xMripwxK-c1V-b2    GOOGLE LINK: https://www.google.com/travel/hotels/entitcay/CgoQif2Z88ucotNZEAI%3D/overview ', '8802', NULL, '5333', '7628', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: A shining star Wifi Password: ashiningstarr"', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '--3 available spots 
-Steeply Sloped, paved 
-RV/trailers not allowed


', NULL, '25th', '86dxbjkj1', 'QUIRKS AND ODDITIES
-EV charge  kWh (max energy): It has up to 11.5 kW / 48 amp output, depending on Tesla model and breaker size.

ADDITIONAL INFORMATION
-Guests are responsible for providing their own charcoal 
-***4WD or AWD is necessary in winter months.
-The road is steep and curved at times.

Trash Can Location
-Bear proof trashcans are located to the right of the driveway

Starr Crest Resort
HOA Rules (pool rules, quiet hours, etc)
The Resort Pool opens Memorial Day Weekend and closes after Labor Day.
No Code is needed for the community pool.
The pool is at the base of the mountain and visible from the main road leading up to the cabin. The hours are 9:00 am to dusk; it opens this weekend and is open from Memorial Day weekend through Labor Day. Of course, it is swim at your own risk.

Code is required

  

'),
('85yyf2khb', 'Jessica Jarboe 4159', 'live', 'junior', 'none', 'none', true, '4159 Spring Creek Way, Sevierville, TN 37876', '4159 Spg Creek Way, Sevierville, TN 37876, USA', 'East Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 2, 1, 1, NULL, 1, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '182772', '494932', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-mist-cabin  VRBO LINK: https://www.vrbo.com/3559051  BOOKING LINK: https://www.booking.com/hotel/us/mountain-mist-secluded-cabin-mtn-view-hot-tub.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/182772   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1jO4YuviR1jDS_IRrWDJ9sgPrgdumVCQa9Q0Y_y4dJW8/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1onPnfktarmwVUxvdcFDCiEs1ZidBrEJ0 ', '4798', 'Blessed - 4', '5333', '2101', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi Network name: Almost Heaven Network password : FlyingAlpacas$139  "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-IMPORTANT NOTE: 
-4WD is necessary in winter months for inclimate weather 

PARKING/DRIVEWAY
-
 - 3  parking spots - Steep, winding, one way road. 
- No RV/Trailer. 
PLEASE NOTE: -4WD is necessary in winter months for inclimate weather 

Trash Can Location
-Bear proof trashcans in the driveway

'),
('85yyf2kh7', 'Jay Hwang 936', 'live', 'top', 'none', 'none', true, '936 Falcon View Way, Sevierville, TN 37862', '936 Falcon View Way, Sevierville, TN 37862, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 3, 2, NULL, 3, 1, NULL, NULL, 1, 1, 8, 4, 'Main Account', NULL, '111312', '255636', NULL, 'AIRBNB LINK: https://airbnb.com/h/sunset-in-the-smokies  VRBO LINK: https://www.vrbo.com/2863793?unitId=3435830  BOOKING LINK: https://www.booking.com/hotel/us/sunset-in-the-smokies-hot-tub-and-game-room.html?lang=xu  MARRIOTT LINK:  https://homes-and-villas.marriott.com/en/properties/40100215   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/111312   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Fz6jjkqR1cNusFBKYe1VQw-MoJbPGAemY4qVLpy9KG8/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1lVs2Pe0bAphYRdNZIhFKUx1_WMIdEP2e  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ9-iRiZy09tOQARAC/overview ', '0301', NULL, '5333', '2762', '"Direct WIFI: Username: sunsetview1 PW: Falconview936 Company: Hollernet No StayFi"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-16 steps to the lower level

PARKING/DRIVEWAY
-2+
 No RV or Trailer paved downhill.

Trash Can Location
-Bear Proof Cans in the front yard to the right of the house
'),
('85yyf2kh4', 'Jay Hwang 920', 'live', 'top', 'none', 'none', true, '920 Falcon View Way, Sevierville, TN 37862', '920 Falcon View Way, Sevierville, TN 37862, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 3, 2, NULL, 2, NULL, NULL, 4, 1, 1, 8, 4, 'Main Account', NULL, '111957', '258783', NULL, 'AIRBNB LINK: https://airbnb.com/h/falcons-lodge VRBO LINK: https://www.vrbo.com/2865704?unitId=3437741  BOOKING LINK: https://www.booking.com/hotel/us/falcons-lodge-mtn-view-hot-tub-and-pool-table.html?lang=xu  MARRIOTT LINK:  https://homes-and-villas.marriott.com/en/properties/40100419  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/111957    GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1wM69qsePHIFBhSvyDZzGnoMg9ycAUPSIqcVhRcSDPlY/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1iOipO1KS-tkDtrouUiypPPbKALadH4YX  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQqpeFiuK-kKuHARAC/overview ', '3582', NULL, '4829', '3322', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Falconviewlodge  PW: 920FalconView! Company: Starlink ', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Code: 2589
Master code: 4829

QUIRKS AND ODDITIES
- Mini-split unit in the bedroom upstairs is controlled by the thermostat and does not have a remote. When the top light is on it’s in cool mode, and when the bottom light is on it’s in heat.  
You just press the button in the picture to switch modes between a/c and heat.  There are pics on the GLD and in DACK.
ADDITIONAL INFORMATION
- Road leading a steep down hill and driveway is narrow and can fit 2 cars blocked in. 
How to operate GAS fireplace: https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING/DRIVEWAY
-2 No RV or Trailer  Small and narrow parking. 
For bigger cars I would say bring one (ex. Suburbans or Trucks).

Trash Can Location
-Bear Proof Trash Cans in the Driveway

Fire Pit (How to operate) 
-Turn the timer and the valve on. The gas safety timer should be on. If it''s not, reset the timer so the gas will flow to the grill and the fire pit. 




'),
('85yyf2kh1', 'Jay Hwang 3708', 'live', 'top', 'none', 'none', false, ' 3708 Tilda Hilltop Way, Sevierville, TN 37862', '3708 Tilda Hilltop Way, Pigeon Forge, TN 37862, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 6, 7, 1, 6, 2, 3, NULL, 1, 1, 17, 10, 'Main Account', NULL, '146815', '403684', NULL, 'AIRBNB LINK: https://airbnb.com/h/serenity-hillside-haven   VRBO LINK:  https://www.vrbo.com/3298964   BOOKING LINK: https://www.booking.com/hotel/us/serenity-at-hillside-haven-breathtaking-views.html?lang=xu   MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/146815   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1L3vNwj-gjyA_TJytEaHkJQLWsapw1WCiW5zcdfMT4Yk/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1eQ_zk5-X51R1hflfh_HiwG0DZ0T1w-6p  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ4YPz8uj1v8lGEAI%3D/overview ', '8915', 'Blessed - 27', '5333', '5333', '"StayFi:  WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI:  WiFi Network: Top of The Smokies Password: password  "', NULL, NULL, NULL, 'Valley Pest co', 'Berry', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Pool Room: 2025
EXTRA CODES
Owner Code: 6072 
Vendor Code: 1469 
Master Code: 4396

QUIRKS AND ODDITIES
-Hollernet is the internet provider. There is no online portal. Owner advised us to call Paul at Hollernet 865-773-2457 if there are any issues. Haven can call Hollernet and provide property address and owner name (Jin Hwang) to help troubleshoot. 

ADDITIONAL INFORMATION
-Cabin Community Amenities: Club House, picnic area  


PARKING/DRIVEWAY
-4 parking spots 
-Flat shared driveway stretching along the road 
-No RV/trailer

Trash Can Location
-2 Bear proof cages in front entrance to property 
'),
('85yyf2kgx', 'Jana Baumann 2613', 'live', 'normal', 'none', 'none', true, '2613 Raccoon Hollow Way, Sevierville, TN 37862', '2613 Raccoon Hollow Way, Sevierville, TN 37862, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 3, 3, NULL, 3, NULL, NULL, NULL, 1, 1, 6, 4, 'Main Account', NULL, '122943', '315610', NULL, 'AIRBNB LINK: https://airbnb.com/h/honey-bear-hollow VRBO LINK: https://www.vrbo.com/3010992 BOOKING LINK: https://www.booking.com/hotel/us/honey-bear-hollow-hot-tub-fire-place-game-room.html?lang=xu MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40131071 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/122943 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/19H9OGPi1yH5ZW7PP_M3dEHhYyDls00ctJeC6unrwfbM/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1weQHMbrqEG4VjJCAzD_PfcrsQo03upgs GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQwf-c7pq98dlSEAI%3D/overview ', '8354', NULL, '5333', '6135', '"StayFi:  WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI:  Network name: Buckaboo Network password: Meaningoflife42"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'EXTRA CODES
Lock owner code: 1776 
Owner closet code: 1776

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
-How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be
Pet-Friendly listing.
Note: For emergency where guests are stuck due to snowy or icy roads. They can use the emergency supplies to help tide them over at the cabin until conditions improve. So If there should ever be an emergency where guests are stuck, let them know where the supplies are and how to access them.  
-Supplies for Emergency bin is located in the room with the water tanks in the basement. We will have instructions in the bin to take the collapsible snow shovel, kitty litter  (to put in the trunk of a car to add weight and help provide traction on icy roads), hand warmers pack, emergency blankets, some emergency  food, a jug of emergency water and a  battery operated lanterns, with them if they try to leave the cabin on snowy or icy roads just in case they get stuck.  

PARKING/DRIVEWAY
-4 parking spots

Trash Can Location
-Bear proof trashcans located to the left of the driveway
'),
('85yyf2kge', 'Natasha Ross 2808', 'live', 'junior', 'none', 'on_the_market', true, '2808 Willa View Drive, Pigeon Forge, TN 37863', '2808 Willa View Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Thomas Hampton', 2, 1, NULL, NULL, 3, NULL, NULL, 1, 1, 6, 4, 'Main Account', 'Haven', '78824', '134506', NULL, 'AIRBNB LINK: https://airbnb.com/h/cozy-smoky-mountain VRBO LINK: https://www.vrbo.com/1982023 BOOKING LINK: http://www.booking.com/Share-IWx8gy MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063874 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/78824 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/171GGIDCIygDTf1hRFbms-YU6XoT6VavB5mRKE3CAQcI/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/18My0uDa0JQtALcwuP_3HG1n0y4ro4RW9 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQi4OpmrKcmsgbEAI%3D/overview to Network: SpectrumSetup-OD Password: geniusparade857', '3966', NULL, '2951', '8122', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct Wifi: Network: SpectrumSetup-OD Password: geniusparade857', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'EXTRA CODES
Breaker box code 123
Master Code: 2951

QUIRKS AND ODDITIES
bathroom breaker trips easily, reset the breaker and code is 123 for the lock on the breaker box outside on the back of the house

ADDITIONAL INFORMATION
-Hot Tub ETA: Unknown 
- WiFi router is in Draper 2808, above the washer and dryer

PARKING/DRIVEWAY
-2 Parking Spots

Trash Can Location
-There is a dumpster right as you pull into the driveway.
'),
('85yyf2kfu', 'Hali Hoag 435', 'live', 'junior', 'low', 'none', true, '435 E Springdale Ave, Knoxville, TN 37917', '435 E Springdale Ave, Knoxville, TN 37917, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 2, NULL, 2, NULL, 1, NULL, 1, 1, 6, 4, 'KnoxStaytion Account', 'KnoxStaytion', '142770', '394057', NULL, 'AIRBNB LINK: https://airbnb.com/h/blue-valley-inn  VRBO LINK: https://www.vrbo.com/3253856   BOOKING LINK: https://www.booking.com/hotel/us/blue-valley-inn-hot-tub-spacious-play-area.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40214276  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/142770  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15VTb7BaaA-E6ncIvHX4QBDzswmK9OsiFHLwdtOoSzos/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1WLL_DbxraXCAhk5yf31OstiepxZF6rJo GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQzOKXnqDfjqqPARAC/overview ', '5663', 'Blessed - 34', '5333', '1740', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network:Blue Valley Password: Knoxlove435 "', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Electric

', '3 spots
 There is a paved parking area in front of the house
No RV/Trailer

', 'Strict', '25th', NULL, 'EXTRA CODES
Alarm code: 5586

QUIRKS AND ODDITIES
--The fireplace has 5 buttons. On the far right is the power button, it turns the fireplace on and off. To the left of that is the temperature button, it controls the temp of the fireplace. To the left of that is the fire lights button, it controls the brightness of the lights. To the left of that is the wood lights button, it controls the brightness of the wood. To the left of that is the timer button, it controls the timer on the fireplace. -You can connect to the sound system in the bathrooms through bluetooth. Make sure the panel is on and connect to the network titled:  
ADDITIONAL INFORMATION
--Guests are responsible for bringing their own firewood 
-The streaming services available on the property''s Smart TVs require the guests''s own personal login. Please Remember to log out upon checkout! 
-Closest Electric Vehicle Charging Station, 1404 Woodbine Ave, Knoxville, TN 37917 
PARKING/DRIVEWAY
 -3 parking spots 
-There is a paved parking area in front of the house 
-No/RV Trailer  
Trash Can Location
- City Trash Can outside in front of the house

Lock box code: 0301
Lock box located on the front porch behind the column furthest from the door.
Kids Clubhouse :123456
Code for gate on side by the road: 2357
Code for gate on side near driveway: 6355

Fire Alaram code : 5586

'),
('85yyf2kfq', 'Gregg VanHorn 4783', 'live', 'junior', 'none', 'none', true, '4783 Nebo Rd, Walland, TN 37886', '4783 Nebo Rd, Walland, TN 37886, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 4, 2, NULL, 2, 2, 1, 4, 1, NULL, 15, 8, 'Main Account', NULL, '113999', '266038', NULL, 'AIRBNB LINK: https://airbnb.com/h/quietside-cabin VRBO LINK: https://www.vrbo.com/2886635?unitId=3458672  BOOKING LINK: https://www.booking.com/hotel/us/quietside-cabin-grill-fire-pit-fireplace.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40102961  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/113999  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1voesYHzoD4FgjNl4cLMaEUBYP64u7hx9G_qo27vJyTA/edit#  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1dF5rpx2V21UfyV6X-fmhwimwPW0_aHLi  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ5d_fqLr3g6HAARAC/overview ', '4763', NULL, '3460', '1654', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Wifi Network: Spectrum Setup Wifi Password: lazystate475"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'EXTRA CODES
Storage Closet in the Downstairs Bedroom: 4783
Main door code: 8191

QUIRKS AND ODDITIES
-
ADDITIONAL INFORMATION
--Guests are responsible for providing their own Firewood & Pack-N-Play Linens.  
-16 Steps to Upper Level 
-14 Steps to Lower Level
PARKING/DRIVEWAY
-6 Spots 
There is a carport! 
No RV or Trailer 
About half a mile windy, steep, drive to a paved, flat driveway 
The directions to the property are correct. Please note that the cabin can not be seen from the road.
Trash Can Location
-There are three trash cans at the very end of the driveway.
'),
('85yyf2kfh', 'Vicki Allbert 410-2003', 'live', 'junior', 'none', 'on_the_market', true, '410 Big Bear Way #2003, Pigeon Forge, TN 37863', '410 Big Bear Wy #2003, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 2, 1, NULL, NULL, 1, NULL, 6, 4, 'Main Account', 'Haven', '105239', '239655', NULL, 'AIRBNB LINK: https://airbnb.com/h/big-bear-condo VRBO LINK: https://www.vrbo.com/2766254 BOOKING LINK: http://www.booking.com/Share-Zrbz55 MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40086884 DIRECT BOOKING SITE LINK: https://homes-and-villas.marriott.com/en/properties/40086884  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1c_Nk9RRLFdsLSlgjYnxxGxaalorVY7gFKhSCkJ17fg8/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/16bAghHkkWeqMl-N1UgkziCrglC-mhT44 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ5_KF-rrh8eRQEAI%3D/overview ', '3268', NULL, ' 4573', '3353', '"StayFi:  WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI:  Network: BB2003 Password: ResortNet"', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2 parking spots

', 'Strict', NULL, '86dwv9nn2', 'EXTRA CODES
Fitness Center: Should be unlocked (if not 9876) Game Room: 3151 (NEW)
Indoor Pool 4262

Fridge has an ice maker 


QUIRKS AND ODDITIES
-


ADDITIONAL INFORMATION
-15 steps to the front entrance, 0 steps to the back entrance

Seasonal Outdoor Pool:
Located at the resort’s entrance. First left turn. 
Hours of operation 10am - 10pm. 
Pull up on the knob and push gently. 

Please follow the community pool rules: 
1. Please take note: There is NO Lifeguard on Duty.
2. Pets are not allowed in the pool areas.
3. Please no glass or breakable containers in the pool areas.

A code is required


Trash Can Location
-Community Dumpster is located at the exit.
'),
('85yyf2kfc', 'Florin Pavel 650', 'live', 'key', 'none', 'none', true, '650 Ivy Rd, Gatlinburg, TN 37738', '650 Ivy Rd, Gatlinburg, TN 37738, USA', 'East Gatlinburg', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 1, 2, NULL, 4, 1, 1, 12, 7, 'Main Account', NULL, '173994', '467087', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-nature-retreat  VRBO LINK: https://www.vrbo.com/3476313  BOOKING LINK: https://www.booking.com/hotel/us/mountain-nature-retreat-hot-tub-sauna-game-room.html?lang=xu  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/173994 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Uc8lujHiuAmVVgUZ96u2BKHuffBBs0JwyqpdIKM2tNU/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1UCHx0fvdAZ-8mSbK4bMn0fG_OhuWLq8g  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQkd6Ozsq5zqEtEAI%3D/overview ', '1398 or 0301', 'Blessed - 78', '8437', '4117', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest   Direct WIFI: Network name: SpectrumSetup-93 Network password: prosezone749 "', NULL, NULL, NULL, 'Not yet', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Owner has own guy for lawn care.

As of Nov 21, 2025: 
Vendor: Spectrum
Account Number: 8316400380158430
Primary Phone Number: 773-954-6768
PIN: 1819 

Master Code: 8437

QUIRKS AND ODDITIES
-The wall switch to the right of kitchen faucet must be turned in for the dishwasher to run. The power to the dishwasher is tied to that switch. 


ADDITIONAL INFORMATION
-Guests can have access to the garage to access the Sauna. Please do not lose the garage door opener.   
-Guests cannot use the charcoal grill inside the garage on the lower level, please move it onto concrete patio. 
-No pets allowed.


PARKING/DRIVEWAY
-5 parking spots 
-There is a wraparound driveway. Guests should pull in to the right hand side of the loop to the front door 
-No RV/Trailer 


Trash Can Location

There are bear proof bins located out front along the driveway near the basketball goal
'),
('85yyf2kfa', 'Erin Thrasher 379', 'live', 'junior', 'none', 'none', true, '379 Mountain Lake Way, Dandridge, TN 37725', '379 Mountain Lake Way, Dandridge, TN 37725, USA', 'Dandridge', 'Summer Mathews', 'Ailyn Regidor', 4, 2, NULL, 2, 1, NULL, 2, 1, 1, 10, 4, 'Main Account', NULL, '101822', '228497', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-lookout-lodge  VRBO LINK: https://www.vrbo.com/2711855  BOOKING LINK: http://www.booking.com/Share-irNNvX  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070933  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/101822  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1V3T8xluoGD58zDi0k5pXCgupskTrOd_kGDwM2e0Qg0w/edit    OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1QFmujK1RKCzYv_Q_9gKElMrrSh_5vYZ9  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ78e0mti_kYcfEAI%3D/overview ', '0301', 'Blessed - 44/54', '3849', '9518', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: WiFi Network: Lost Cove Look Out WiFi Password: lakefun379$$!"', 'Ecobee', NULL, NULL, 'A + B Termite + Pest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'EXTRA CODES
Garage Door Code is 2955 (DO NOT provide to guest or vendors unless AM authorizes) 
Master code:  3849

QUIRKS AND ODDITIES
-DOCK Information: This dock is private and not a community dock... it is just for the renters. To operate the water slide, simply turn the black dial on the motor to ON and pull the chord, like a lawn mower. Then, turn the dial back to OFF when you''re done. It takes regular gasoline to operate and one gallon should run for a quite a while. It''s a little home grown, but it''s tons of fun! (video how to in owner profile)


How to Change Mode on Hot Tub
https://youtu.be/VJVpf6B8l84

Douglas Lake Water Level
http://www.douglaslake.info/Level/

ADDITIONAL INFORMATION

-


PARKING/DRIVEWAY
-6 Parking Spots
- No RV or Trailer parking.

Trash Can Location
Trash cans are located inside the closet by the front door. No bear proof
'),
('85yyf2kf7', 'Eric Adams 814', 'live', 'normal', 'none', 'none', true, '814 Ski View Ln, Pigeon Forge, TN 37876', '814 Ski View Ln, Pigeon Forge, TN 37876, USA', 'East Gatlinburg', 'Regina Shrout', 'Ailyn Regidor', 3, 2, NULL, 1, 2, 1, NULL, 1, 1, 8, 4, 'Main Account', NULL, '125166', '320680', NULL, NULL, '9252', 'Blessed - 48', '8308', '8308', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI : Network name: Sunset View Network password: 814SkiViewLane"', 'Ecobee', NULL, NULL, 'Bug Busters Pest Control', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'AS of October 3, 2025: 
- This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

EXTRA CODES
Digital keypad programming code: 759065 
Digital codes: 6584, 1531 
Owners closet and breaker outside: 8920 
Crawl Space: 2086
Thermostat PIN: 9876

QUIRKS AND ODDITIES
-Thermostat has a PIN. The guest can adjust the thermostat. 


ADDITIONAL INFORMATION
-How to operate GAS fireplace: https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be


PARKING/DRIVEWAY-
-3 parking spots -No RV or Trailer 
-Paved, Flat, semi circle drivewat.


Trash Can Location
To the right of the house if you''re looking at the house
'),
('85yyf2kev', 'Earl Hodges 513-4', 'live', 'normal', 'normal', 'none', true, '513 McCarter Rd, Unit 4S, Gatlinburg, TN 37738', '513 McCarter Rd #4s, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '170188', '459638', NULL, 'AIRBNB LINK: https://airbnb.com/h/convenient-gatlinburg-condo  VRBO LINK:  https://www.vrbo.com/3461911  BOOKING LINK: https://www.booking.com/hotel/us/convenient-gatlinburg-condo.html?lang=xu  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/170188  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1mMLe-0VN1rPx724kstbZXosKuU2l2ZKqUjqCJ4GtlQI/edit#  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/106KmrM3d51zhvtbRkM10kT6bodmIq44A GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQp5yLnPLyq4bbARAC/overview  ', '4724', NULL, '8573', '9681', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest   Direct WIFI: Network information: SpectrumSetup-9A Network password: chillysquirrel162"', NULL, NULL, NULL, NULL, 'NO', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master Code: 8573

QUIRKS AND ODDITIES
-


ADDITIONAL INFORMATION

-HOA Contact Info: 
MidTown Condominium HOA 
Angie Singletary 228-239-3812


PARKING/DRIVEWAY-
-2 parking spots 
-  parking lot by building 
-No RV /Trailer 

Trash Can Location
There is a dumpster located in the small parking lot just down the steps from the main entrance and elevators. 
'),
('85yyf2ker', 'Earl Hodges 513-3', 'live', 'normal', 'normal', 'none', true, '513 McCarter Rd , Unit 3S, Gatlinburg, TN 37738', '513 McCarter Rd #3s, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '170187', '459637', NULL, 'AIRBNB LINK:  https://airbnb.com/h/skyline-sanctuary  VRBO LINK: https://www.vrbo.com/3465460  BOOKING LINK: https://www.booking.com/hotel/us/skyline-sanctuary-wrap-around-deck.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40269574  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/170187  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1RZwVg7OhOsP4dy-Uumwbbv2M3A8DbaSkCnN69ABp-pg/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1vPrKQtJLw2_6pcxmiJqL6hIZe6z1H5zS?ths=true  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQxszYydKfyNrTARAC/overview ', '2795', NULL, '9842', '3102', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest  Direct Wi-Fi Network: SpectrumSetup-9A  Password: chillysquirrel162 ', NULL, NULL, NULL, NULL, 'NO', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'Master Code: 9842

QUIRKS AND ODDITIES

-

ADDITIONAL INFORMATION

-HOA Contact Info:
MidTown Condominium HOA
Angie Singletary 228-239-3812

PARKING/DRIVEWAY

-2 parking spots
-  parking lot by building
-No RV /Trailer

Trash Can Location

There is a dumpster located in the small parking lot just down the steps from the main entrance and elevators. 

-
'),
('85yyf2kep', 'Earl Hodges 513-1', 'live', 'normal', 'normal', 'none', true, '513 McCarter Rd,  Unit 1S, Gatlinburg, TN 37738', '513 McCarter Rd #1s, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 1, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '169738', '456168', NULL, 'AIRBNB LINK: https://airbnb.com/h/snowbird-sanctuary-cabin   VRBO LINK: https://www.vrbo.com/3514394    BOOKING LINK: https://www.booking.com/hotel/us/snowbird-sanctuary-center-of-gatlinburg.en-gb.html  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40241631   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/169738   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1zDg5Qu0MQo0yu0PRLCfKx2r-R2-e6OiqE2_cQAN5BYI/edit#    OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1SZeS6ZMdYpuG7x_fy8EPX_SAY7G1r9tn?ths=true GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQi5j48eSp4p2KARAC/overview', '0301', NULL, '9631', '3872', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest   Direct WIFI: Network name: SpectrumSetup-FD Network password: phoneyard704 "', NULL, NULL, NULL, NULL, 'NO', NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION

-HOA Contact Info:
MidTown Condominium HOA 
Angie Singletary 228-239-3812 

PARKING/DRIVEWAY

-2 parking spots
parking lot by building
-No RV /Trailer

Trash Can Location

There is a dumpster located in the small parking lot just down the steps from the main entrance and elevators. 

The router is located in a basket in the master bedroom.

'),
('85yyf2kem', 'Dylan Robinson 3746', 'live', 'key', 'none', 'none', true, '3746 Heritage Hills Dr , Pigeon Forge, TN 37863', '3746 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 2, 2, NULL, 1, 1, 14, 4, 'Main Account', NULL, '173935', '442276', NULL, 'AIRBNB LINK: https://airbnb.com/h/timber-pine-lodge  VRBO LINK: https://www.vrbo.com/3540574 BOOKING LINK: https://www.booking.com/hotel/us/timber-pine-lodge-indoor-pool-hot-tub.en-gb.html    MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40251175  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/173935  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1QtXLFQdn6Zfok9aZfgzwBTGlX0MG2xsLFD0MabIfRXw/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1pQckSrbfZZM1_4yrEQdfN1q-g-r2_X1W GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ4_y3jZjC5PjjARAC/overview ', '7516', NULL, '5333', '5414', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Networkd Name: Dylan-2046 Password: Sampson20"', 'Ecobee', NULL, NULL, NULL, 'Precision Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh5jm', 'EXTRA CODES
Pool Door Code: 1975

QUIRKS AND ODDITIES
-If you need to call into Spectrum, the account is technically a business account. You need to be asked to transferred to the business department for assistance. Business name is "Haven Vacation Rentals"
ADDITIONAL INFORMATION

PARKING/DRIVEWAY

Trash Can Location
'),
('85yyf2kej', 'Dylan Robinson 3742', 'live', 'key', 'none', 'none', true, '3742 Heritage Hills Dr , Pigeon Forge, TN 37863', '3742 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 1, 3, NULL, 1, 1, 8, 4, 'Main Account', NULL, '173889', '442275', NULL, 'AIRBNB LINK: https://airbnb.com/h/wildwood-retreat-cabin  VRBO LINK: https://www.vrbo.com/3540573  BOOKING LINK: https://www.booking.com/hotel/us/wildwood-retreat-indoor-pool-hot-tub-game-area.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/173889  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Ek__BQpvH9w9XwjZbgSzBgooe1W5Xah9Z1Hb5YKJVOc/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1lBzCIUwdjGGBUeDn8Et5LMzynDK-UgVu  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQm6Gt_c-8-M5REAI%3D/overview ', '0301', NULL, '5333', '7430', '"StayfiWiFi Name: Haven Vacation Rentals Guest  WiFi Password: havenguest Direct WIFI Network Name: Dylan-2042  Password: Sampson20 New: SpectrumSetup-21 Password:Weeklyhall390"', 'Ecobee', NULL, NULL, NULL, 'Precision Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh5jm', 'EXTRA CODES
Pool Door Code: 1234
Pool Lockbox Code: 0301

Update as of Oct 26. - If fixed pls delete
Pool Door Code will not work.
Use the lockbox code 0301 to get the key to access the pool.

QUIRKS AND ODDITIES
--If you need to call into Spectrum, the account is technically a business account. You need to be asked to transferred to the business department for assistance. Business name is "Haven Vacation Rentals"


ADDITIONAL INFORMATION

-


PARKING/DRIVEWAY-


Trash Can Location'),
('85yyf2kef', 'Dylan Robinson 3741', 'live', 'key', 'none', 'none', true, '3741 Heritage Hills Dr, Pigeon Forge, TN 37863', '3741 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 1, 3, NULL, 1, 1, 14, 8, 'Main Account', NULL, '112729', '261196', NULL, 'AIRBNB LINK: https://airbnb.com/h/sweet-tea-timber  VRBO LINK: https://www.vrbo.com/2923705?unitId=3495745  BOOKING LINK: https://www.booking.com/hotel/us/sweet-tea-timber-indoor-pool-hot-tub.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40114606  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/112729  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1b8Eu00J1UOCNxl05pmKRKxlQhdbbMXJXcMbkjzRRA6s/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1PQkqRUKCbYeYyYUdy2DapFCzvzcgE2Va  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQwN-VlsyPk990EAI%3D/overview   ', '2993', 'Blessed - 66/81', '6759 or 1643 or 0742', '1207', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Wifi Name: SpectrumSetup-3C Wifi Password: swiftgate711"', 'Ecobee', NULL, NULL, 'Valley Pest co', 'Precision Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh5jm', 'As of December 2, 2025: 
New wifi login credentials: 
Wifi Network: SpectrumSetup-2F
Wifi Password: yearhonor347

EXTRA CODES
Pool Door Code: 1975
New Master Code: 6759

QUIRKS AND ODDITIES
-If you need to call into Spectrum, the account is technically a business account. You need to be asked to transferred to the business department for assistance. Business name is "Haven Vacation Rentals"

ADDITIONAL INFORMATION

-

PARKING/DRIVEWAY

-- 3 spots
- No RV or Trailer
- Paved - Flat

Trash Can Location
-Bear-proof in the driveway


'),
('85yyf2ked', 'Dylan Robinson 3738', 'live', 'key', 'none', 'none', true, ' 3738 Heritage Hills Drive, Pigeon Forge, TN  ', '3738 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 2, 2, NULL, 1, 1, 14, 8, 'Superhost Account', NULL, '139943', '381435', NULL, 'AIRBNB LINK: https://airbnb.com/h/timber-haven-hideaway   VRBO LINK: https://www.vrbo.com/3283707   BOOKING LINK: https://www.booking.com/hotel/us/timber-haven-hideaway-view-pool-game-room.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40193159  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/139943   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Wo_UmBWk2vyjS5VgbPPMqRiayAvOjlWYQquhfOseXB0/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1iw3ztjsGvy-fYlFnGKCMvGUVuOXfX0Zb   GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQq9KhzNzxhMZgEAI%3D/overview a', '3465', NULL, '9734', '9675', '"Direct Wifi Wifi Network: MySpectrumWiFia8-5G Password: quickowl913 "', 'Ecobee', NULL, NULL, 'Valley Pest Co', 'Precision Pool Services', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh5jm', 'EXTRA CODES
Pool Room Code: 3756 Pool 
Lockbox Code: 1998 (NOT FOR GUEST) 
-located on front porch, if looking at front door, turn around and it is the Upper lockbox -All pool room keys and pool thermostat keys were placed in this lockbox
Master Code: 9734

QUIRKS AND ODDITIES
-If you need to call into Spectrum, the account is technically a business account. You need to be asked to transferred to the business department for assistance. Business name is "Haven Vacation Rentals"

ADDITIONAL INFORMATION

-

PARKING/DRIVEWAY
"-3 parking spots 
-a flat paved section at the front of the cabin 
-No RV/Trailer allowed 
 "
-

Trash Can Location
Two bear proof cans located in the driveway
'),
('85yyf2kea', 'Dylan Robinson 3734', 'live', 'key', 'none', 'none', true, '3734 Heritage Hills Drive, Pigeon Forge, TN  ', '3734 Heritage Hills Dr, Pigeon Forge, TN 37863, USA', 'SW Parkway', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 2, 2, NULL, 1, 1, 14, 8, 'Superhost Account', NULL, '139937', '381434', NULL, 'AIRBNB LINK: https://airbnb.com/h/honeycomb-hollow-cabin   VRBO LINK: https://www.vrbo.com/3283706   BOOKING LINK: https://www.booking.com/hotel/us/honeycomb-hollow-view-hot-tub-pool-game-room.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40193161  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/139937   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1IVO73ODGoyHAKTWEAE5sm8sodDU40iYSdJ0UOnenATo/edit   OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1gY5WHM4PvfmmSRJJwCAZgii4l0TpbY5A   GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQhu2N1PHN-4KJARAC/overview', '5367', NULL, '5333', '5080', '"StayFi WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI Network name: Dylan-2023 Password: Sampson20 "', 'Ecobee', NULL, NULL, 'Valley Pest Co', 'Precision Pool Services', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh5jm', 'EXTRA CODES
Pool Door Code: 3028 
Pool Lockbox Code: 1998 
-located on front porch, if looking at front door, turn around and it is the lower lockbox -All pool room keys and thermostat keys placed in this lockbox

QUIRKS AND ODDITIES
-If you need to call into Spectrum, the account is technically a business account. You need to be asked to transferred to the business department for assistance. Business name is "Haven Vacation Rentals"

ADDITIONAL INFORMATION

-Please note that the hot tub and pool takes around 6 hours to heat up. So depending on what time the property was cleaned, your hot tub or pool may not be hot upon arrival.

Per Dylan
There are 2 bedrooms on the main floor but there are some steps to enter the property. I’m honestly not exactly sure on the depth of the pool but I believe it’s 4-5ft.



PARKING/DRIVEWAY

--3 parking spots 
-a flat paved section at the front of the cabin 
-No RV/Trailer allowed 


Trash Can Location
Two bear proof cans located in the driveway'),
('85yyf2ke8', 'Dylan Robinson 3115', 'live', 'normal', 'normal', 'none', true, '3115 Bellevue St, Knoxville, TN 37917', '3115 Bellevue St, Knoxville, TN 37917, USA', 'Knoxville', 'Summer Mathews', 'Ailyn Regidor', 3, 2, NULL, NULL, 3, 2, NULL, 1, NULL, 9, 4, 'KnoxStaytion Account', NULL, '84251', '135919', NULL, 'AIRBNB LINK: https://airbnb.com/h/1940s-bungalow VRBO LINK: https://www.vrbo.com/2298662 BOOKING LINK: http://www.booking.com/Share-xr4FW7 MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058281 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84251 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Fg7gWuaTRHBAeDevmldoE6y2RbAL834t7707EiOUthw/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1YFl8Hne18QnztWL5Dz0Qtq3cRAnXP1KR GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQqNH66rjQmJ7kARAC/overview ', '3596', 'Knox Storage - 8', '5141', '4310', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Wifi Name: Loft 1003 Wifi Password: airbnb 1003"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'As of Feb 25, 2026:
Updated the listing from new memory foam to air mattress

QUIRKS AND ODDITIES
-- The second bathroom/utility room has a very small shower; Ladies might prefer to use the main bathroom''s shower
- Guest has access to the entire house minus a couple of closets and the basement
Master Code: 5141

ADDITIONAL INFORMATION

-- The trash can is right outside the house, by the back door.
-The neighbor takes the trash down to the curb on trash day. Guests don''t have to worry about trash day.
-There are about 8-10 steps in the back entrance and maybe 3 steps at the front.

PARKING/DRIVEWAY
--Driveway is flat and paved
-Driveway can fit at least 3 cars.
-

Trash Can Location
--There are trash bins right outside the back door!
'),
('85yyf2ke1', 'Dylan Robinson 116-204', 'live', 'normal', 'normal', 'none', true, '116 S Gay St, Unit #204, Knoxville, TN 37902', '116 S Gay St #204, Knoxville, TN 37902, USA', 'Knoxville', 'Summer Mathews', 'Ailyn Regidor', 1, 1, NULL, NULL, 3, NULL, NULL, 1, NULL, 6, 4, 'KnoxStaytion Account', NULL, '84257', '135925', NULL, 'AIRBNB LINK: https://airbnb.com/h/sunnyloft-view VRBO LINK: https://www.vrbo.com/2298668 BOOKING LINK: No listing link for guest. Status is Closed/Not bookable. MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051713 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84257 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1LSrtVrAEHTKi6fcYfKar58hf3HtGTfb86P9xX7-RSCc/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1AkF4lxZ6R9QpvmaShBZG-yraKN3h9E_P GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQipq_75Xm1NHwARAC/overview ', '0', 'Knox Storage - 7', '1058', '9586', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Wifi Name: Linksys4812 Wifi Password: 2gk9yv46uv Has xfinity connection. No issues received from other guests working."', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 
Master code: 1058

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION

-- 2.5 minute walk to Market Square
- Shared WiFi with Robinson 203 (where the router is located)

PARKING/DRIVEWAY

-- Sterchi List - $50 fee for lost parking passes
- Parking is 3 blocks away from the building

Trash Can Location

If you''re facing the elevators, there''s a trash chute behind the door to the right.
'),
('85yyf2kdz', 'Dylan Robinson 116-203', 'live', 'normal', 'normal', 'none', true, '116 S Gay St, Unit #203, Knoxville, TN 37902', '116 S Gay St #203, Knoxville, TN 37902, USA', 'Knoxville', 'Summer Mathews', 'Ailyn Regidor', 2, 1, NULL, NULL, 4, NULL, NULL, 1, NULL, 8, 4, 'KnoxStaytion Account', NULL, '84250', '135918', NULL, 'AIRBNB LINK: https://airbnb.com/h/cityloft-view VRBO LINK: https://www.vrbo.com/2298659 BOOKING LINK: http://www.booking.com/Share-4guIfL MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051715 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84250 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1LXmEgXTA9fzpVN2CUISjy5qvffMEklforrd-llLt9vQ/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1cRtUzcoIXC-sSdnpGecHPJZzRrbeKHsB GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ7vb9zbi92-DoARAC/overview ', '0', 'Knox Storage - 3', '9798', '9798', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Wifi Name: Linksys48128 Wifi Password: 2gk9yv46uv"', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 
Master Code:  9798

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
- 2.5 minute walk to Market Square
-

PARKING/DRIVEWAY

-- Sterchi List - $50 fee for lost parking passes
- Parking is 3 blocks away from the building

Trash Can Location
If you''re facing the elevators, there''s a trash chute behind the door to the right.
'),
('85yyf2kdx', 'Dylan Robinson 116-106', 'live', 'normal', 'normal', 'none', true, '116 S Gay St, Unit #106, Knoxville, TN 37902', '116 S Gay St #106, Knoxville, TN 37902, USA', 'Knoxville', 'Summer Mathews', 'Ailyn Regidor', 2, 1, NULL, NULL, 4, NULL, NULL, 1, NULL, 8, 4, 'KnoxStaytion Account', NULL, '84254', '135922', NULL, 'AIRBNB LINK: https://airbnb.com/h/modernloft-view VRBO LINK: https://www.vrbo.com/2298665 BOOKING LINK: http://www.booking.com/Share-sWsehQq MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051711 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84254 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1KxvsZrHYryDrDjocoKTAZ37UkxicniE-5FOnCn-HGAU/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1LSyTrmoOV8q41pbNsotteFGLc-rphFGV GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQsovLqIXDh849EAI%3D/overview', '0', 'Knox Storage - 5', '0016', '9797', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest  Direct WIFI Wifi Name: theknoxongay Wifi Password: Sterchi@206 "', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'As of Dec 22, 2025:
For gym code, AM should contact the HOA - Terminus Real Estate. 

EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632# 

QUIRKS AND ODDITIES

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 


ADDITIONAL INFORMATION
--- Sofa bed has 2 legs behind zippers that need to be extended when using as a bed, but it is very easy to lay down or set back up as a couch.
-The trash shoot is located through the door next to the elevator
-The gym is located on level L
-There is a cover on the thermostat that needs to be opened to change the temperature - Floor one is ground level.


PARKING/DRIVEWAY
-- Sterchi List - Parking pass and parking recommendation on the check-in message
-

Trash Can Location
If you''re facing the elevators, there''s a trash chute behind the door to the right.
'),
('85yyf2kdt', 'Donnie Riddle 223-203', 'live', 'junior', 'none', 'none', true, '223 Bishop Cap Circle, Unit #203, Townsend, TN. 37882', '223 Bishop Cap Cir #203, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '96375', '211615', NULL, 'AIRBNB LINK: https://airbnb.com/h/abrams-retreat  VRBO LINK: https://www.vrbo.com/2650094   BOOKING LINK: http://www.booking.com/Share-Z8SSZA  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070953  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/96375  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tIpB_CaTXWYDCQDrYyLxIVP99bvukHugFWHnM26UrFg/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1Tz3MTbohO9f10_zV2xzKtPF3ce7vZmc4  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQnN_9jJWlx5T4ARAC/overview ', '8682', 'Blessed - 61', '6914', '3219', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest  Direct WIFI: Network: ATTeTUunI2 Password: qcpj#2r4jwed"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh61h', 'EXTRA CODES
May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June is: 9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467   
Master Code:  6914

QUIRKS AND ODDITIES
-- Fridge is very hard to open
- Blinds are a pull down and up method - no string necessary

Your gps will try to take you to the construction entrance. If the gate is open feel free to use it. If the gate is closed, instead of turning right onto Bishop Cap Cir when the gps tells you to, you will need to pass that turn and take the next turn on your right. This road will also be Bishop Cap Cir.

ADDITIONAL INFORMATION
-- The community pool is open from Memorial Day weekend to Labor Day weekend.
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.
- There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.


PARKING/DRIVEWAY
-Parking passes are required to be displayed on dashboard and are located inside the condo in the cabinet to the left of the fridge. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles. There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility. Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved.
-

Trash Can Location
If you need to take the trash out during your stay, there are bear proof trash bins as you head towards the construction exit on the left.'),
('85yyf2kdq', 'Donnie Rath 748', 'live', 'junior', 'none', 'none', true, '748 Golf View Blvd, Pigeon Forge, TN 37863', '748 Golf View Blvd, Pigeon Forge, TN 37863, USA', 'East Parkway', 'Katie Work', 'Ailyn Regidor', NULL, 2, NULL, NULL, 2, NULL, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '90024', '185030', NULL, 'AIRBNB LINK: https://airbnb.com/h/stairway-2-heaven  VRBO LINK: https://www.vrbo.com/2541706  BOOKING LINK: http://www.booking.com/Share-zD0W56  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063866  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/90024  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1zs1nv8MXihxP0Xin8y3abcVzqeB6u70ENnoASNQJ6IU/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/16O96cjTIA8Dqhdf0eOKwwcclDbN8dn81  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQwriQ74qh3_pHEAI%3D/overview ', '7830', 'Blessed - 59', '9217', '4326', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest  Direct WIFI: WiFi Name: GolfView_748 WiFi Password: Welcome1"', NULL, NULL, NULL, 'All About Bugs', NULL, NULL, NULL, NULL, NULL, NULL, 'Flexible ', '15th', '86dww8wdn', 'EXTRA CODES
HOA Maintenance code: 7760
Master code: 9217

QUIRKS AND ODDITIES
-35 steps on outside stairs. Cable Box issues need to be resolved with HOA. Jimmy is the HOA maintenance contact for this place (865)-282-7760

ADDITIONAL INFORMATION
-Community: outdoor pool, hot tub, kitchen and picnic area. No code needed to access.
Address: 718 Golf View Blvd
Hours: 9am to 10:30pm
Community: indoor pool, sauna. No code needed to access.
Donnie Rath 748
Hours: 9am to 10:30pm"

From the entrance of Dollywood Ln, turn right at the split and drive up the hill. Then keep going straight until on the right you see a sign for the indoor pool and “Golf View Resort” - a white building with 2 parking spots to the right.
Hours: 9am to 10:30pm

PARKING/DRIVEWAY

-- 2 (This is a shared parking space between the 2 cabins. Our guests are only permitted 2 parking spaces.)
- No trailers, No RV’S
- Inclined parking, but driving to the property is easily accessible!

-

Trash Can Location

No bear proof, dumpster is located past the pool
'),
('85yyf2kde', 'David Holland 1645', 'live', 'junior', 'none', 'none', true, '1645 S Mountain View Rd, Sevierville, TN 37876', '1645 S Mountain View Rd, Sevierville, TN 37876, USA', 'NW Parkway', 'Katie Work', 'Ailyn Regidor', 1, 1, NULL, 1, NULL, 1, NULL, 1, 1, 4, NULL, 'Main Account', NULL, '85745', '147394', NULL, 'AIRBNB LINK: https://airbnb.com/h/romantic-mountain VRBO LINK: https://www.vrbo.com/2416836 BOOKING LINK: http://www.booking.com/Share-i6oHYJ MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058275 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/85745 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Q9CYzsTwTIADwIuq8ICfxW_u49vtg_byD8CypI8ScJs/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1KsTaV4xMaaI8HrGMOn-9k8Xi3aPs2Xkc GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ29yUo__wpZzjARAC/overview ', '2341', 'Blessed - 62', '5333', '8435', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI : Network: motof823 Password: 87n8f38v6c"', NULL, NULL, NULL, 'All About Bugs', NULL, NULL, 'sevier Co propane', NULL, 'Gas
', NULL, NULL, '15th', NULL, 'QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION

-- Gas fireplace is turned off in the Summer

How to operate GAS fireplace: 
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

PARKING/DRIVEWAY

3-4 vehicles in loop driveway
-

Trash Can Location

big trash can on the back screened-in porch.
'),
('85yyf2kd7', 'Craig Sims 196', 'live', 'normal', 'none', 'none', true, '196 Cold Springs Trce, Townsend, TN 37882', '196 Cold Springs Trce, Townsend, TN 37882, USA', 'Townsend', 'Summer Mathews', 'Ailyn Regidor', 4, 4, NULL, 3, 2, NULL, 1, 1, NULL, 11, 6, 'Main Account', NULL, '153098', '419161', NULL, 'AIRBNB LINK: https://airbnb.com/h/the-peaceful-perch   VRBO LINK: https://www.vrbo.com/3436663   BOOKING LINK: https://www.booking.com/hotel/us/the-peaceful-perch-fireplace-community-amenities.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40219581  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/153098   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/17z5kyRAn9wrN9V948urekd3ofBhXDffsSpguNa9u4Fg/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/134dBbByTcbreiXVORW7w0Oa9yD_XNaAA?ths=true   GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ2973marZt9sKEAI%3D/overview ', '2218', 'Blessed - 14', '9046', '6008', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: Peaceful Perch Password: John16:33 "', NULL, NULL, NULL, 'Arrow Exterminators', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'As of Mar 3, 2026:
New pest control company: Arrow Exterminators
Zachary Kirby, 8654535860 with Arrow Exterminators

As of Feb 26,2026:
Per Wild Laurel Golf Course: 
"golf is open to the public for a greens fee, which includes a cart.  As well, the clubhouse is open to the public (bar and food).  But the pool and fitness center are by membership only."

As of Nov 18, 2025:
Laurel Valley is a beautiful, gated golf course community on the edge of the Great Smoky Mountains National Park in Townsend, Tennessee. Its 1400 acres provide spacious home sites with some of the best views in East Tennessee. Laurel Valley was established on November 12, 1987.
The only available entrance for visitors, renters, deliveries and contractors is through the Gate House.
The LVPOA Gate House address for GPS directions is:
495 Laurel Valley Rd, Townsend, TN 37882-3701
The trash compactor is located at 637 Laurel Rd
The compactor must be activated in order to compress our waste into the smallest space possible. All users should deposit their waste in the compactor and then push the “start” (green) button on the pole adjacent to the pump. If not executed the trash will pile up in the small space at the front of the compactor and give the impression that the compactor is full. Instructions for this process are shown above the switches.

As of Nov 3, 2025:
Owner added Tv w/o cable in master bedroom.

EXTRA CODES
Community Gate Code: 40718
Master Code: 9046

QUIRKS AND ODDITIES
-the washer/dryer makes a strange and loud noise however it does not impact the operation of the machines. DO NOT send maint. for this issues

ADDITIONAL INFORMATION

-Community Amenities:
Laurel Valley Club:
Pool, Fitness Center, Clubhouse, Restaurant, Wild Laurel Golf Course

Contact Info:
Laurel Valley
Laurel Valley HOA
president@laurelvalley.org
262-745-4233

The LVPOA Gatehouse address for GPS direction is: 
495 Laurel Valley Road,
Townsend, TN 37882-3701



PARKING/DRIVEWAY

--4 parking spots
-There are two driveways, Guests should primarily park in-NO RV/Trailer 


Trash Can Location
-There is a garbage compactor near the entrance/guard shack 

'),
('85yyf2kd3', 'Corby Leach 1547', 'live', 'normal', 'none', 'none', true, '1547 Majestic Mountain Dr, Sevierville, TN 37876', '1547 Majestic Mountain Dr, Sevierville, TN 37876, USA', 'East Parkway', 'Summer Mathews', 'Ailyn Regidor', 4, 3, NULL, 3, 3, 3, 1, 1, 1, 17, 10, 'Main Account', NULL, '166224', '446242', NULL, 'AIRBNB LINK: https://airbnb.com/h/above-it-all-cabin    VRBO LINK: https://www.vrbo.com/3436665   BOOKING LINK: https://www.booking.com/hotel/us/above-it-all-mtn-view-hot-tub-game-theater-room.html?lang=xu   MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40219583  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/166224   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/15js_pydcn4BNjphja2BqElqwoLJgrBi6qkkYWEaSh9I/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1RSfAsEPpBCSn8EzE2N08ey6Vur2ey9NE?ths=true   GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQg6rGyM7ggbGUARAC/overview ', '8563', NULL, '5333', '8692', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network: AboveItAll Password: Majestic1547 "', NULL, NULL, NULL, 'Johnson Pest Control', NULL, 'Brad Whaley', NULL, NULL, NULL, NULL, NULL, '25th', NULL, 'As of Sep 4, 2025:
Please note that their propane provider is Sevier County Propane 865-453-7877. Their customer ID is LEACOR. 

QUIRKS AND ODDITIES
-Thermostat has a Date code, add date code with 1234 and that’ll be your password

ADDITIONAL INFORMATION

-Guests are responsible for providing their own charcoal 
4WD will be necessary in the winter for the steep paved drive up 


PARKING/DRIVEWAY
-5 parking spots
-  a wide and flat paved area 
-No RV /Trailer

Trash Can Location
-4 bear proof cans in the parking area'),
('85yyf2kcy', 'Chuane Li 1483', 'live', 'normal', 'none', 'none', true, '1483 Honey Oaks Way, Sevierville, TN 37876', '1483 Honey Oaks Way, Sevierville, TN 37876, USA', 'NW Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 1, 1, 2, 1, 1, 6, 4, 'Main Account', NULL, '84093', '135022', NULL, 'AIRBNB LINK: https://airbnb.com/h/bearclaw-cove   VRBO LINK: https://www.vrbo.com/2334080  BOOKING LINK: http://www.booking.com/Share-qG33gM  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40059205  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84093  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1kgJ5Iwwr-m7FVqza_X-a0wJXWHVV2_nox_VSIGgccJw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1d400HMF96oIw1L6-1GFPDoBB52SnplZk  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQte3HwJ7PgbQDEAI%3D/overview ', '5373', 'Blessed -50', '4418', '6217', '"StayFi: Wifi Name: Haven Vacation Rentals Guest  Wifi Password: havenguest Direct WIFI: Wifi Name: BearClawCove  Password: goofystate103', NULL, NULL, NULL, 'All About Bugs', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'EXTRA CODES
Crawl space lockbox code: 0301

QUIRKS AND ODDITIES
-Spectrum Login: chuane_li@hotmail.com             Password: Honeyoaks1483 

ADDITIONAL INFORMATION

-PET FRIENDLY
- Pets are not allowed on the furniture, must be potty trained, and must be crated when left at the property alone
- there are lights on the back porch that operate using the power from the solar panels attached to the roof. The remote for these lights should be on the top of the mantle in the living room.

PARKING/DRIVEWAY
- 3 Parking Spots, Steep Paved Driveway
- Covered parking
-

Trash Can Location

There are trash bins right outside the cabin.
'),
('85yyf2kcm', 'Chris Shotwell 326-106', 'live', 'junior', 'none', 'none', true, '326 Shooting Star Loop (Leconte Bldg),  Unit #106 , Townsend, TN 37882', '326 Shooting Star Loop #106, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, NULL, 2, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '175713', '473078', NULL, 'AIRBNB LINK: https://airbnb.com/h/elegant-end-condo  VRBO LINK:  https://www.vrbo.com/3519778  BOOKING LINK: https://www.booking.com/hotel/us/elegant-end-condo-fireplace-community-amenities.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/175713  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1s-baEHp2N6NAO_DnS0uBSfznm4pZlLNzqP5WVVBWmJ8/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1CauzIijtexzPR7cGC1TQngaRBky6XO96 GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ7s2VpJmD1MsgEAI%3D/overview ', '1320', 'Blessed - 39', '5333', '8321', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest  Direct WIFI WiFi Network: xfsetup-b848 Password :field5424course"', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', '86dwuh61h', 'BUILDING NAME: MT. LECONTE

EXTRA CODES
 May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June 2025 Gate Code is #9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467   

NO PARKING PASS NEEDED
https://app.breezeway.io/task/71203404 - FOR REFERENCE

ADDITIONAL INFORMATION

--The community pool is open from 9am - 8pm Memorial Day weekend to Labor Day weekend.
-There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.
- PER THE HOA, THERE IS A $500 FINE FOR NOISE COMPLAINTS! THIS FINE WILL BE IMPOSED ON GUESTS WHO RECEIVE A NOISE COMPLAINT. 
- There are permanent residents who live in the condos. Please be mindful and respectful of them. THEY WILL CONTACT US IF THEY OBSERVE RULE VIOLATIONS.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.

PARKING/DRIVEWAY

-"Parking passes are required to be displayed on dashboard and are located inside the condo in top right drawer of the kitchen island. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles.
There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.
Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved."

Trash Can Location
The dumpsters are located to the left of the road right before the exit.  
'),
('85yyf2kc9', 'Lisa Collier 333', 'live', 'junior', 'none', 'under_contract', true, '333 Black Mash Hollow Rd, Townsend, TN 37882', '333 Black Mash Hollow Rd, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Thomas Hampton', 2, 1, NULL, NULL, 2, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '91281', '191963', NULL, 'AIRBNB LINK: https://airbnb.com/h/bearyrelaxingcabin VRBO LINK: https://www.vrbo.com/2544118 BOOKING LINK: http://www.booking.com/Share-xZtb02 MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058273 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/91281 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1e1y1F1zxtzcSeAyAe_mrTxB9XzrKBt8F1GvS6lP0taQ/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/11ooHsRiDtuL6iWX0rZyMNouaW55XHE6y GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ98LjmMXMvK9uEAI%3D/overview ', '1897', 'Blessed - 70', '1983', '8816Owner Code: 1002 ', 'StayFi Wifi Name: Haven Vacation Rentals Guest Wifi Password: havenguest  Direct Wifi WiFi name: BearyTownsend WiFi password: WelcomeBears!37882', 'Ecobee', NULL, NULL, 'All About Bugs', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'EXTRA CODES
Crawlspace Code: 003
Master Code: 1983
Lockbox code: 0301
Thermostat code: 1245

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION
- 2 steps to front door
- Location of guest cleaning supplies: Next to the washer/Dryer
-There is a large trashcan inside the house to put extra trash. It is 30gallon so should not fill up during a stay. If it does fill up the guests could take their garbage the 0.7 miles to a dumpster at the gas station across 321.
- The breaker is located outside adjacent to the parking lot.
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be


PARKING/DRIVEWAY
2 parking spots on flat, gravel parking lot. 
No RV or Trailer Parking.

Trash Can Location
No bear proof bins. Large bin is located inside the cabin for all guests. If it does fill up, guests can take their garbage the 0.7 miles to a dumpster at the gas station across 321.

'),
('85yyf2kc6', 'Chad Williams 326-104', 'live', 'normal', 'none', 'none', true, '326 Shooting Star Loop, Unit #104, Townsend, TN 37882', '326 Shooting Star Loop #104, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Thomas Hampton', 2, 2, NULL, 1, 1, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '82620', '134536', NULL, 'AIRBNB LINK: https://airbnb.com/h/gorgeous-cades  VRBO LINK: https://www.vrbo.com/2248063  BOOKING LINK: http://www.booking.com/Share-vzPcIF  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063862  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/82620 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1TYQMFVOr8HIyrElo8Bdy8FtKXh9f1xfv0zR6gkOBaFg/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1UEocp5Qc3HzAoprNJfAXfqmXbnkQTWxW  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQhOva9YGVvMQMEAI%3D/overview ', 'New Code: 6638 Old Code: 8887', 'Blessed - 39', '2748', '6638', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Name: C&C104 Wifi Password: Cadescove104"', NULL, NULL, NULL, 'Foothills Pest Control', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh61h', 'EXTRA CODES
 
May/June 2026 Gate Code is #9406 
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June is: #9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467   
Master Code: 2748

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION
-• The community pool is open from Memorial Day weekend to Labor Day weekend
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.

PARKING/DRIVEWAY
-Parking passes are required to be displayed on dashboard and are located inside the condo in the cabinet to the right of the fridge. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles.
There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.
Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved.

Trash Can Location
-If you need to take the trash out during your stay, there are bear proof trash bins as you head towards the construction exit on the left
'),
('85yyf2kc4', 'Chad Williams 223-202', 'live', 'normal', 'none', 'none', true, '223 Bishop Cap Cir #202, Townsend, TN 37882', '223 Bishop Cap Cir #202, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Thomas Hampton', 2, 2, NULL, 1, 1, NULL, NULL, 1, NULL, 4, NULL, 'Main Account', NULL, '82621', '134539', NULL, 'AIRBNB LINK: https://airbnb.com/h/elegant-cades  VRBO LINK: https://www.vrbo.com/2248064  BOOKING LINK: http://www.booking.com/Share-H0M0zZ  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058271  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/82621  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1tVx1DRIT887NFK0rL63lZ5XOc7MqCzeMRy2dPS26pxI/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1mhywgsue6Tglkunl8HSfe5sjNBzDbfm0  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ3rmk_6yviN9iEAI%3D/overview', '5405', NULL, '5817', '5753', '"StayFi: Wifi Name: Haven Vacation Rentals Guest Wifi Password: havenguest Router is in the master bedroom closet Direct WIFI: Wifi Name: CCR202 Wifi Password: Abrams202"', NULL, NULL, NULL, 'Foothills Pest Control', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh61h', 'EXTRA CODES
 May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June 2025 Gate Code is #9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406                             
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467   

Abrams Building Unit 202


QUIRKS AND ODDITIES


ADDITIONAL INFORMATION
• The community pool is open from Memorial Day weekend to Labor Day weekend.
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.


PARKING/DRIVEWAY
Parking passes are required to be displayed on dashboard and are located inside the condo in the cabinet to the left of the fridge. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles.
There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.
Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved.

Trash Can Location

If you need to take the trash out during your stay, there are bear proof trash bins as you head towards the construction exit on the left
'),
('85yyf2kbt', 'Carl Chadwell 116-206', 'live', 'junior', 'normal', 'none', true, '116 S Gay St, Unit #206, Knoxville, TN 37902', '116 S Gay St #206, Knoxville, TN 37902, USA', 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 2, 1, NULL, NULL, 4, NULL, NULL, 1, NULL, 8, 4, 'KnoxStaytion Account', NULL, '84248', '135916', NULL, 'AIRBNB LINK: https://airbnb.com/h/historic-sterchi-loft VRBO LINK: https://www.vrbo.com/2298656 BOOKING LINK: http://www.booking.com/Share-bciMMW MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051705 DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84248 GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1fVC1JiQPt_B7VZeDSP0jCfVL6NLSGP5jb6BNvfv5pr8/edit OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/1GLT-uoRt7WHhVSk2cYkBXD3m8c-7BwaX GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQpbjg3f7f1YQWEAI%3D/overview ', 'None ', 'Knox Storage - 4', '5327', '#N/A', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI Wifi Name: theknoxongay Wifi Password: Sterchi@206 "', 'Ecobee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', '86dwuh56r', 'EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632#

Parking is now managed by Park Tenn. Follow the instructions here: https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

The gym is on Level L, through the double doors, and immediately to your left. There''s a lock to the fitness center and the code is 1929


QUIRKS AND ODDITIES


ADDITIONAL INFORMATION


PARKING/DRIVEWAY
- $50 charge for loss or taken parking passes
- Sterchi List
Trash Can Location
-If you''re facing the elevators, there''s a trash chute behind the door to the right.'),
('85yyf2kbn', 'Candace Morton 1276', 'live', 'key', 'none', 'none', true, '1276 Smithwood Rd , Sevierville, TN 37862', '1276 Smithwood Rd, Sevierville, TN 37862, USA', 'East Parkway', 'Summer Mathews', 'Thomas Hampton', 5, 4, NULL, 1, 2, 1, 4, 1, 1, 12, 7, 'Main Account', NULL, '194974', '521519', NULL, 'AIRBNB LINK: https://airbnb.com/h/mountain-breeze-home VRBO LINK: https://www.vrbo.com/3705064  BOOKING LINK: https://www.booking.com/hotel/us/mountain-breeze-private-pool-hot-tub-games.en-gb.html  MARRIOTT LINK: Not pushed yet!  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/194974  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/13DC1KQWXIdBQ058nDt34X0_SVMux97fnluBVV0PnS9Q/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1tgOcFCc8C2SFxZei8gI0XMNGe8bBDNU6  GOOGLE LINK: ', '1904', NULL, '9153', '8345', '"StayFi WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI WiFi Network:SpectrumSetup-22 Password: funnyship030 "', NULL, NULL, NULL, NULL, 'Berry Maintenance', NULL, NULL, NULL, 'Gas  
', NULL, NULL, '15th', NULL, 'QUIRKS AND ODDITIES


ADDITIONAL INFORMATION


PARKING/DRIVEWAY
-8 parking spot 
-Large, Paved, Driveway 
-No RV/Trailer 
- The pool is available from Memorial Day  - Labor Day.

Trash Can Location

'),
('85yyf2kbe', 'Brian Hopp 7646', 'live', 'junior', 'normal', 'none', true, '7646 E Lamar Alexander Pkwy, Townsend, TN 37882', '7646 E Lamar Alexander Pkwy, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 3, 2, NULL, 1, 1, NULL, 2, 1, NULL, 6, 4, 'Superhost Account', NULL, '93532', '203979', NULL, 'AIRBNB LINK: https://airbnb.com/h/evergreen-getaway  VRBO LINK: https://www.vrbo.com/2568808  BOOKING LINK: http://www.booking.com/Share-WG0AFD  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40060123  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/93532  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1IilftxsZpJ7qOGPBJ-Iwi7KIP7_V4uhnwHBLfEIy2zw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1vX3Cj8Qz8-ctpunSrxPity8LvcfuPTse  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQnrLGu4OBv8h4EAI%3D/overview ', '6589', 'Blessed - 38', '2583', '4747', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: Evergreen Getaway Password: evergreenguest"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, ' Wood  
', NULL, NULL, '15th', NULL, 'As of Sep 18, 2025: 
- This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

EXTRA CODE
Basement Access Code: 2500
Master Code: 2583

QUIRKS AND ODDITIES
-The fan switch must be on before remotes work.

ADDITIONAL INFORMATION
-Gravel, uphill into a loop. Not shared with neighbors. - Steps to front door : 4 (single level home, back door has one flight of stairs leading to the side of house)

PARKING/DRIVEWAY
-5 Spots (PDM: 8 possible don’t advertise but if asked it’s possible)
RV and Trailer allowed


Trash Can Location
Right corner of deck

'),
('85yyf2kbc', 'Brian Hopp 649', 'live', 'junior', 'normal', 'none', true, '649 Red Bud Ln, Gatlinburg, TN 37738', '649 Red Bud Ln, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Katie Work', 'Ailyn Regidor', 4, 3, NULL, 5, NULL, NULL, 2, 1, 1, 12, 6, 'B Account ', NULL, '93319', '202482', NULL, 'AIRBNB LINK: https://airbnb.com/h/city-hideaway  VRBO LINK: https://www.vrbo.com/2585150?unitId=3155500  BOOKING LINK: https://www.booking.com/hotel/us/city-hideaway-hot-tub-fireplace-grill.html?lang=xu  MARRIOTT LINK: REJECTED Status. DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/93319  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Uniqgnmm7puDMj8gyQKUMuo5nZFDpvYknWIftpGSuUk/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1f5WaAE0CoRTjFIOtl1kH9mOWWVtZxgCa  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ7dLRiZT1xrp3EAI%3D/overview  ', '8350 / 0301', 'Blessed - 35', '2936', '4233', '"StayFi: Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Name: TP-Link_6310_5G Password: 28657729 Wifi router is to the left of TV in living room next to couch"', 'Ecobee', NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'As of Sep 17, 2025:
This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

QUIRKS AND ODDITIES
-

ADDITIONAL INFORMATION
- Blacktop, flat driveway
- 2 breaker boxes in Garage and 1 in the bedroom downstairs - all labeled
- # of steps to the front door : 1
- Hot Water valve in Garage. Water shut off valve at the end of driveway on the right side facing street (next to a tree)
-handle in the upstairs toilet: The guest must make sure the handle is back to in the upright position after they flush so the toilet doesn''t run. This only happens occasionally, but the guest should be aware.

PARKING/DRIVEWAY
6 spots Lots of Parking! RV and Trailer accessible. (PDM: 9 possible don’t advertise but if asked it’s possible)

Trash Can Location
Next to the driveway entrance - bear proof!

'),
('85yyf2kba', 'Brian Hopp 3163', 'live', 'junior', 'normal', 'none', true, '3163 Whaley Trail Lane, Sevierville, TN 37862', '3163 Whaleys Trail Way, Sevierville, TN 37862, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 3, 2, NULL, 2, NULL, 1, NULL, 1, 1, 7, 4, 'B Account ', NULL, '118217', '287743', NULL, 'AIRBNB LINK: https://airbnb.com/h/hop-on-inn  VRBO LINK: https://www.vrbo.com/2974987?unitId=3547027  BOOKING LINK: https://www.booking.com/hotel/us/hopp-on-inn-secluded-3br-home.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40113429   DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/118217  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1qFDjuikz7g-gn67yD2w2GGGkmVffJwYw0GwoBML8XqA/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/0/folders/1MEP1B8AznatogfhNwItMlEIeAreHk6lx  GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQzOanveuT-54XEAI%3D/overview ', '5268', NULL, '2586', '2724', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi name: Tennessee Wifi password: Smokeymountains"', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', NULL, 'As of Sep 17, 2025:
This is a pet-friendly property. There will be a fee of $75.00 per pet. Please note that no pets should be over 75 lbs and we only allow a maximum of 2 dogs. Pets must be kenneled when not supervised, and must be housebroken.  Pets are not allowed on furniture. Please note that the pet fee must be paid before booking. 

QUIRKS AND ODDITIES
-Please do not put food in the sink. There is no garbage disposal.

ADDITIONAL INFORMATION
-Paved for the most part. Paved road leading to a gravel driveway (flat) top of driveway is paved though.

PARKING/DRIVEWAY
-2 parking spots
-No RV or Trailer

Trash Can Location
Bear Proof Trash Cans
'),
('85yyf2kb7', 'Brian Albaum 442', 'live', 'normal', 'none', 'none', true, '442 Hideaway Ridge, Sevierville, TN 37862', '442 Hideaway Ridge Cir, Sevierville, TN 37862, USA', 'East Parkway', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 1, NULL, NULL, 1, 1, 4, 2, 'Main Account', NULL, '109599', '251746', NULL, 'AIRBNB LINK: https://airbnb.com/h/fishin-n-wishin  VRBO LINK: https://www.vrbo.com/2840379  BOOKING LINK: http://www.booking.com/Share-rMbV8T  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40098539  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/109599   GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1JUy-ZP0RUzTZfkAz4JxhzV-mL3Otf-1dSgdfa27e6LE/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1deDvP1-1ouTj0_TxJWjDdvFPdL06oL0c  GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgoQ57KUv5uM5fImEAI%3D/overview ', '3701', NULL, '0217', ' 4320', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Network: What is the WiFi Password? Password: k?7G@n2e5b"', NULL, NULL, NULL, 'Valley Pest co', 'N/A', NULL, NULL, NULL, 'Gas  
', NULL, NULL, '15th', NULL, 'As of Dec 9, 2025:
Per owner: We do not have exterior security cameras on property. 

As of Dec 2, 2025: 
Max number of guests is 4
No sleeper sofa

UPDATE: Sevierville Sewer Plant for the E-1 Grinder Pump - 865-868-2524

EXTRA CODES
Owner Closet: 2073 ***Please Note: Guests will not have access to the garage.

QUIRKS AND ODDITIES
-*Please Note - Haven is not responsible for stocking the pond. If the stock becomes low please inform our Guest Messaging Team, and we will contact those responsible. We will be unable to give an ETA for when the pond will be restocked, and there will be no refunds given to those inconvenienced by a low stock due to it being out of our control. Please know we are trying our best to get it stocked as soon as possible. T
-HVAC UNIT IS UNDER WARRANTY WITH AMBIENT. BRAND NEW UNIT JUNE 2024
-HOT TUB IS NEW AS WELL - CONTACT OWNER FOR WARRANTY CLAIMS

ADDITIONAL INFORMATION
-PET FRIENDLY
- 2 floors in the property
- 1 Step to the front door
- 1 Flight (14 Steps) to the upper level. 1 outside flight to lower level were washing machine is
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be


PARKING/DRIVEWAY
-- 2 spots
- No RV or Trailer
- No 4WD is Necessary - Paved, flat driveway

Trash Can Location
- City of Sevierville can on the driveway. The Trash needs to be out on the street between 6 pm Monday and 6 am Tuesday, for pickup on Tuesday morning.
'),
('85yyf2kb5', 'Brett Dickinson 338-203', 'live', 'junior', 'none', 'none', true, '338 Shooting Star Loop, Unit #203, Townsend, TN 37882', '338 Shooting Star Loop #203, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 2, NULL, 1, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '83048', '134550', NULL, 'AIRBNB LINK: https://airbnb.com/h/cozy-cade-coves-condo  VRBO LINK: https://www.vrbo.com/2256784  BOOKING LINK: http://www.booking.com/Share-Uhvy3uW  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40058293  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/83048  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1ysttX0eclyMUbdzdMt3dNF3S-sy-ZDOxhFGqUnf41vA/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1sWT4bMvmQhZZjPSRpsZmVL1hUcCHPGbg  GOOGLE LINK:  https://www.google.com/travel/hotels/entity/CgsQt_ruwtf36Nf5ARAC/overview', '5976 or 0301 (this worked)', 'Blessed - 57', '6371 or 4915', '3147', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest DIRECT Wifi Name: Sugarland203 Wifi Password: 04CedarP@@', 'Ecobee', NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh61h', 'EXTRA CODES
 May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June is: 9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621 
January/February 2024 Gate Code #9467

QUIRKS AND ODDITIES
-Deadbolt on porch door is not working, we are aware but it isn''t an issue since the handle lock still works per Lauren.

ADDITIONAL INFORMATION
-• The community pool is open from Memorial Day weekend to Labor Day weekend. 
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.
• All parking is right at the unit ***Community Grill : gas/propane.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.

PARKING/DRIVEWAY

-Parking passes are required to be displayed on dashboard and are located in the cabinet to the left of the microwave and above the oven. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles.
There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.
Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved."""""""

Trash Can Location

If you need to take the trash out during your stay, there are bear proof trash bins as you head towards the construction exit on the left
'),
('85yyf2kb3', 'Brendan Smith 4386', 'live', 'normal', 'none', 'none', true, '4386 Chamberlain Ln, Sevierville, TN 37862', '4386 Chamberlain Ln, Sevierville, TN 37862, USA', 'Townsend', 'Summer Mathews', 'Ailyn Regidor', 3, 3, NULL, 1, 2, 1, NULL, 1, 1, 12, 7, 'Main Account', NULL, '96720', '212786', NULL, 'AIRBNB LINK: https://airbnb.com/h/bella-yani  VRBO LINK: https://www.vrbo.com/2632237  BOOKING LINK: http://www.booking.com/Share-XEXdhe  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40070951  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/96720  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1p4tKSu-4YBg8AmkO6zGI-xiCNwVgfQEQnlFW4WyZBcw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/15p8BGNlrjbEgL6Prsq48SWosME11zmoV  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQzsOsvP-k_N8dEAI%3D/overview  ', '7010', 'Blessed - 47', '5333', '9897', '"StayFi: WiFi Name: Haven Vacation Rentals Guest Password: havenguest Direct WIFI: Network: bellayani Password: Vrpcabinfever "', NULL, NULL, NULL, 'Valley Pest co', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'As of Mar 23, 2026: 
Charcoal grill was removed from the listing. 

EXTRA CODES
Downstairs owner''s closet: 1015 (owner changed 7/14) 
Owner PIN for Xfinity 1210

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION


PARKING/DRIVEWAY
-3 Spots 
-No RV or Trailer Parking
Trash Can Location
Bear-proof cans at the end of the driveway
'),
('85yyf2kb0', 'Brad Spurgin 1410', 'live', 'junior', 'none', 'none', true, '1410 Little Cove Church Rd, Sevierville, TN 37862', '1410 Little Cove Church Rd, Sevierville, TN 37862, USA', 'SW Parkway', 'Regina Shrout', 'Ailyn Regidor', 2, 1, NULL, NULL, 1, 1, 2, 1, 1, 6, 4, 'Main Account', NULL, '89008', '171895', NULL, 'AIRBNB LINK: https://airbnb.com/h/papa-b3ar  VRBO LINK: https://www.vrbo.com/2541705  BOOKING LINK: http://www.booking.com/Share-rHvlOO  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40063860  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/89008  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1XyGAmxOqQwMgMEVwkvEAjaRtgQmdyysau0n1NU7fkMo/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1CkV23YDfugWbBQlrngOvD4LIKdEM1Mh5  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQidiDnPPIoKCZARAC/overview ', '9030', 'Blessed - 21', '6704', '2617', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: WiFi Name:: vsat-24g9039E4 WiFi Password: pknr36aep2o6aiq2"', NULL, NULL, NULL, 'Russel''s', NULL, NULL, NULL, NULL, 'Gas
', NULL, NULL, '15th', NULL, 'QUIRKS AND ODDITIES
No cell service

ADDITIONAL INFORMATION
- Steep, Paved Driveway, will be tricky in ice - 9 Steps to the front door
How to operate GAS fireplace:
https://www.youtube.com/watch?v=CvL_fAFRIW8&feature=youtu.be

Pet Friendly
2 max $75 each and max of 50 pounds
PARKING/DRIVEWAY
2 Parking Spots
Yes, it will fit! The driveway is on a somewhat steep hill, though the top in front of the house is flat. It may be somewhat difficult to turn around with a trailer.

Trash Can Location
No bear proof, 1 large trash can in driveway
'),
('85yyf2kaw', 'Brad Johnson 116-207', 'live', 'junior', 'normal', 'on_the_market', true, '116 S Gay St. Unit #207, Knoxville, TN 37902', NULL, 'Knoxville', 'Regina Shrout', 'Ailyn Regidor', 3, 2, NULL, NULL, 4, NULL, NULL, 1, NULL, 8, 4, 'KnoxStaytion Account', NULL, '84255', '135923', NULL, 'AIRBNB LINK: https://airbnb.com/h/sunny-sterchi  VRBO LINK: https://www.vrbo.com/2298666 BOOKING LINK: No listing link for guest. Status is Closed/Not bookable. MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40051713  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/84257  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1Aft2f0xuoZDyUgvuMOMxx1RxrSrOp2wl0vIA8O9GUE8/edit  OWNER PROFILE FOLDER: https://docs.google.com/document/d/1Aft2f0xuoZDyUgvuMOMxx1RxrSrOp2wl0vIA8O9GUE8/edit  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQyYyi2Zvx56flARAC/overview ', '0', 'Knox Storage - 2', ' 0890', '7905', ' "StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI:WiFi network: Linksys207 WiFi password: knoxbnb4me', 'Nest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwuh56r', 'EXTRA CODES
  
Sterchi Bldg changed door codes starting December 3, 2025
 Front door 8569 Back door 8569#
    
Sterchi Bldg changed door codes starting June 3, 2025
Front door 1323  Back door 1323#

Sterchi Bldg changed door codes starting Dec. 19 2024
Front door 0622    Back door 0622#

Sterchi Bldg changed door codes starting Sept. 19, 2024
Front door 0801    Back door 0801#

Sterchi Bldg changed door codes starting February 8, 2024 
Front door 4632    Back door 4632#
Master: 0890

Parking is now managed by Park Tenn. Follow the instructions here: 
https://havenvacationrentals.slack.com/archives/C0229JAFR36/p1755532819915799 

QUIRKS AND ODDITIES


ADDITIONAL INFORMATION


PARKING/DRIVEWAY
- Sterchi List 
- $50 charge for loss or taken parking passes

Trash Can Location
If you''re facing the elevators, there''s a trash chute behind the door to the right.'),
('85yyf2kag', 'Barbara Dorr 229-203', 'live', 'junior', 'none', 'none', true, '229 Bishops Cap Cir,. #203, Townsend, TN 37882', '229 Bishop Cap Cir, Townsend, TN 37882, USA', 'Townsend', 'Katie Work', 'Ailyn Regidor', 2, 2, NULL, 1, 2, NULL, NULL, 1, NULL, 6, 4, 'Main Account', NULL, '111417', '256218', NULL, 'AIRBNB LINK: https://airbnb.com/h/charming-cades-cove-condo  VRBO LINK: https://www.vrbo.com/2873095  BOOKING LINK: http://www.booking.com/Share-PfgnWe  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40101343    DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/111417  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/12G3otriodxNat_3o-OWAkJt6bztVDLNmXzQqfjH9COI/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1D_Qac2mkIiGIvzdOQP-jjBEVfYm-j-Ux  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQzbHhqorf6rxXEAI%3D/overview ', '0301', NULL, '2541', '9134', '"StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Wifi Network: smokies229-203 Wifi Password: incorrect"', NULL, NULL, NULL, 'Valley Pest', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '25th', '86dwuh61h', 'The property is in Metcalf building, which is on the front of the whole building. They can drive around the circle until they see that!

EXTRA CODES
 May/June Gate Code is #9406
March/April 2026 Gate Code is #9621
January/February 2026 Gate Code is #9467
November/December 2025 Gate Code is #9229
September/October 2025 Gate Code is #9542
July/August 2025 Gate Code is #9325
May/June 2025 Gat Code: #9173
March/April 2025 Gate Code is #9064
January/February 2025 gate code is: #9394
November/December gate code is: #9013
September/October 2024 Gate Code: #9704 
July/August 2024 gate code: #9501
May/June Gate Code #9406
March/April 2024 Gate Code #9621
January/February 2024 Gate Code #9467
Master code:  2541

QUIRKS AND ODDITIES
- To open the laundry door please pull the handle up.

ADDITIONAL INFORMATION
- The community pool is open from Memorial Day weekend to Labor Day weekend.
- The pool hours are 9am to 9pm and are strictly enforced by the neighborhood. Please follow all rules posted on the signs in the pool area. This community pool is shared by vacationers and long term residents of the neighborhood, and cared for by residents of the community who appreciate your respect and help in maintaining their community! Thank you.
- There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility.

Pool Opening Announcement:
The pool will officially open on May 06, 2024.

Pool Usage Hours:
Renters and owners are allowed to use the pool from 12:00 noon to 8:30 PM daily.

Closing Time Protocol:
At 8:30 PM, the pool will be promptly locked. Please ensure all pool users are aware of this closing time and exit the pool area before it is locked.


PARKING/DRIVEWAY
Parking passes are required to be displayed on dashboard and are located inside the condo in the cabinet to the right of the kitchen sink/window. Must be returned upon check-out or we will charge $50. There are not assigned parking spots at the condos, so you could easily find places for your vehicles! Parking for up to 2 vehicles. There is no RV or trailer parking per the HOA. Renters can park their trailers across the street for only $5 per day by calling & making reservations with Wolfe Creek Rentals. You need to state you are parking at the Townsend Facility. Wolf Creek Rentals Contact number: 828-735-0039The spaces will vary day by day. Driveway and parking lot are paved.

Trailer parking: Little River Campground - around $10
Scotty’s Bike Rentals is who replaced Wolfe creek. But they just rent the space, the campground owns all of the property. This is their number I called +1 (865) 738-3665

Trash Can Location
If you need to take the trash out during your stay, there are bear proof trash bins as you head towards the construction exit on the left.
'),
('85yyf2kab', 'Ashley May 2935', 'live', 'key', 'none', 'none', true, '2935 Redtail Rd, Sevierville, TN 37862', '2935 Redtail Rd, Sevierville, TN 37862, USA', 'Townsend', 'Summer Mathews', 'Thomas Hampton', 5, 3, NULL, 1, 3, 4, NULL, 1, 1, 14, 8, 'Main Account', 'Haven', '92158', '197772', NULL, 'AIRBNB LINK: https://airbnb.com/h/endless-mountain-views  VRBO LINK: https://www.vrbo.com/2575184  BOOKING LINK:  MARRIOTT LINK: Marriott listing is REJECTED (No listing link for guest) DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/92158  GREEN LIGHT DOC LINK:    OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1jFzpwS-6eKrquf1ZIGaVu-4Jrc8IYpZ4  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQj52dxYTA59NWEAI%3D/overview', '8414', 'Blessed - 12', '5333', '5561', 'Network Name: Redtail Retreat Wifi Password: 2935smokies FYI. Owner''s wifi provider does not support StayFi, so we do not use the Haven network here.', 'Ecobee', NULL, NULL, NULL, 'N/A', NULL, NULL, NULL, 'Gas
', NULL, NULL, '15th', NULL, 'As of Nov 2, 2025:
HVAC Vendor: Airserve since this is geothermal

EXTRA CODES
Garage Door Code: 1469 Or 14690?

QUIRKS AND ODDITIES
Extremely steep paved driveway
Well location: Under the cabin. Go around the backside and there is a door.
Property does have water storage tanks. Installed by Aquaclear
ADDITIONAL INFORMATION
Due to potential fire hazards, please do not shoot off fireworks on the property.
FYI. Owner''s wifi provider does not support StayFi, so we do not use the Haven network here.

PARKING/DRIVEWAY
- 2 parking spots in the garage, and 1 outside of the garage. 

- There is a grassy flat area at the top of the driveway where guests can park up to 2-3 more cars.

Trash Can Location
There will be two large trash bins in the Garage for guests to put their excess trash



'),
('85yyf2ka9', 'Ashley May 1619', 'live', 'key', 'none', 'none', true, '1619 Jed Tr, #10, Sevierville, TN 37862', '1619 J E D Trail #10, Sevierville, TN 37862, USA', 'East Parkway', 'Summer Mathews', 'Thomas Hampton', 2, 2, NULL, 1, 2, NULL, 3, 1, 1, 8, 4, 'Main Account', NULL, '142112', '391784', NULL, 'AIRBNB LINK: https://airbnb.com/h/home-sweet-hideaway  VRBO LINK: https://www.vrbo.com/3234991  BOOKING LINK: https://www.booking.com/hotel/us/home-sweet-hideaway-retreat-near-pigeon-forge.html?lang=xu  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40209942  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/142112  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1gTAHNsflary0ezyHt43yHUiJ4IPljGmzPQyu4G2XEmw/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/folders/10KJJbF7iL_Pd3b9GIRf71LWgbl3I-6ub?ths=true    GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgoQ37Om4_OFn-oLEAI%3D/overview ', '2918', NULL, '5333', '2724', 'Wifi Log In from " StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest " Network name: TennesseeLivin Network password: JedTrail1619', NULL, NULL, NULL, NULL, 'N/A', NULL, NULL, NULL, 'Gas
', NULL, NULL, '15th', NULL, 'As of Jan 19, 2026:
ROKU PIN: 9876 is the PIN
The email associated with the account is info@fmrepartners.com

QUIRKS AND ODDITIES
-
ADDITIONAL INFORMATION
-Guests are responsible for providing their own charcoal. 
-4WD May be necessary in Winter months. 


PARKING/DRIVEWAY
-2 parking spots 
-There is street parking along the side of cabin, guests should park facing the cabin 
-No RV/Trailer 

Trash Can Location

There are two bear proof trash cans located at the front of the property on the right hand side of the porch when looking at front door 
'),
('85yyf2k9h', 'Cheryl Draper 723', 'live', 'top', 'none', 'none', true, '723 Wiley Oakley Dr, Gatlinburg, TN 37738', '723 Wiley Oakley Dr, Gatlinburg, TN 37738, USA', 'West Gatlinburg', 'Summer Mathews', 'Thomas Hampton', 4, 4, NULL, 3, 1, NULL, 2, 1, 1, 12, 7, 'Main Account', NULL, '94762', '207256', NULL, 'AIRBNB LINK: https://airbnb.com/h/sky-ridge  VRBO LINK: https://www.vrbo.com/2590830  BOOKING LINK: http://www.booking.com/Share-PlYRUB  MARRIOTT LINK: https://homes-and-villas.marriott.com/en/properties/40065982  DIRECT BOOKING SITE LINK: https://stay.havenvacationrentals.com/listings/94762  GREEN LIGHT DOC LINK: https://docs.google.com/document/d/1IR1dc9rXDVytFZjIZotc9Ugq3ySMy3v0pv6a-tYXvZU/edit  OWNER PROFILE FOLDER: https://drive.google.com/drive/u/1/folders/1fOfT0dmnf78HazE-KyAQrREBpha70iOa  GOOGLE LINK: https://www.google.com/travel/hotels/entity/CgsQ8tz34Ku78fCSARAC/overview ', '5876', 'Blessed - 28', '5333', '1123', 'StayFi: WiFi Name: Haven Vacation Rentals Guest WiFi Password: havenguest Direct WIFI: Network: ATTgcHdD78  Password: xm#a68ph39gy', NULL, NULL, NULL, 'All About Bugs', 'Integrity Pools', NULL, NULL, NULL, NULL, NULL, NULL, '15th', '86dwufgw9', 'Update as of July 30,2025: 
- Please note that the couch in the living room no longer reclines.

EXTRA CODES
Master Code: 

Lawn care: once per quarter


New Wifi: 
Network: ATTgcHdD78
Password: xm#a68ph39gy

QUIRKS AND ODDITIES
**Please Note: There is a home building construction in the area.   -Very Windy, uphill road for the last mile and a half leading to the property.  

ADDITIONAL INFORMATION
Community Pools:https://chaletvillageownersclub.com/Guests have access to the community pool! This house is in the Chalet Village - guests have access to 3 clubhouses. Chalet Village Office Address: 1319 south baden drive Contact: Ken with Chalet Village - 865-436-4440 Pools are open Friday of Memorial Day Weekend thru Labor Day. Pool Hours are 9am to 9pm. Passes in property. ***Please Note: Lost passes will result in the guest being required to pay a $75 fee. South Baden Pool is located at 1319 South Baden Drive. Closed on Tuesdays. North Pool is located at 705 Village Loop Road. Closed on Wednesdays. Upper Alpine Pool is located at 1151 Upper Alpine Road. Closed on Tuesdays and Wednesday

PARKING/DRIVEWAY
4 parking spots on a gravel driveway.  No RV or Trailer Parking per HOA

Trash Can Location

Bear-proof trash cans are located at the bottom of the driveway.

');
