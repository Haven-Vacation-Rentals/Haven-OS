# Audit: Sales, Revenue, Marketing spaces
Auditor notes: audited 2026-07-13, read-only. "Open tasks" = tasks returned with include_closed=false (ClickUp done-type statuses ARE included; only closed-type are excluded). Task counts of 100 mean a full page came back ("100+"). Last-update dates verified via the most recently updated task's date_updated.

# Space: Sales (54238901)
Space-level custom fields: (none)
Space default statuses (inherited by lists without their own): to do → in progress → overdue → done → done & hide (closed)

## Folder: Offers/Marketing (90172654244)
Folder-level custom fields: (none)
Folder-level statuses shared by all 3 lists: ideas → in progress → filming | editing → to post → done → done & hide (closed)

### List: Content Calendar (901705458811)
- Statuses: ideas → in progress → filming | editing → to post → done → done & hide (closed)
- Custom fields (content pipeline data model):
  - Month (Going Live) (drop_down) [October, November, December]
  - Content Type (drop_down) [VIDEO, BLOG, AGENT CONTENT, META ADS, NEWSLETTER, POST, REEL]
  - Platform (drop_down) [MAIN SITE, LANDING PAGE CONTENT, EMAIL, FACEBOOK, INSTAGRAM, LINKEDIN]
- One record = one piece of marketing content to produce/publish (typed by Content Type, targeted at a Platform, scheduled by go-live month).
- Open tasks: ~1 | Sample: "StayFi" (in progress)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-11)
- Notes: Month dropdown only has Oct/Nov/Dec (built for a Q4 push, never extended). Nearly all content has been completed/closed; only 1 open item.

### List: Blog Projects (901711279362)
- Statuses: (inherited folder statuses) ideas → in progress → filming | editing → to post → done → done & hide (closed)
- Custom fields: (none)
- Open tasks: ~17 | Sample (most recent first): "Week 15: Summer 2026 Booking Pace in the Smokies" (done), "Week 12: 5 Amenity Upgrades That Actually Increase Your Nightly Rate" (in progress), "Week 13: What Sevier County's STR Regulations Mean for Cabin Owners in 2026" (in progress), "Week 11: Smokies vs. Coastal Markets" (in progress), "Week 17: Dynamic Pricing Mistakes That Cost Smoky Mountain Owners Revenue" (ideas)
- In use: assignees n, due dates y, priorities y (normal/high), tags n
- Activity: ACTIVE (last update ~2026-05-12)
- Notes: Weekly SEO blog series ("Week 1"–"Week 17"). Each task description is a full editorial brief (content pillar, key points, target length, CTA, SEO keywords). Created mostly by Jack Zoppa. Done tasks are left in "done" rather than closed.

### List: The Nightly Rate — Newsletter (901711292720)
- Statuses: (inherited folder statuses) ideas → in progress → filming | editing → to post → done → done & hide (closed)
- Custom fields: (none)
- One record = one newsletter issue/topic idea for "The Nightly Rate", Haven's weekly newsletter for STR investors and operators (per list description).
- Open tasks: ~10 | Sample: "The Real Cost of Switching Management Companies" (ideas), "Why 70% Occupancy Beats 90% Occupancy" (ideas), "What I Learned Scaling to Hundreds of Properties" (ideas), "The Self-Manager Trap (And How to Escape It)" (ideas), "How We Vertically Integrated (And Why It Changed Everything)" (ideas)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-02-23)
- Notes: Pure topic backlog — all 10 tasks sit in "ideas" with a 1-2 sentence topic brief in the description; no scheduling/ownership metadata at all. Pipeline never progressed past ideation in ClickUp.

## (space root)

### List: DR Warm Lead Pipeline (350893530)  — CRM
- Statuses (pipeline stages): new leads → hyper pursuit → verbal + c negotiation → long term nurture → warm leads → property search → closed + passed (done) → lost sale (dennis) (done) → bad leads (done) → andy old -need to sift (done) → andy old leads sifted (done) → andy passed to onboarding (done) → poor leads (closed)
- One record = one property-OWNER lead (a person who owns/is buying an STR property that Haven wants to sign for management). Subtasks = individual properties when a lead has multiple. Comments = interaction log. Due date = next contact date.
- Custom fields (full data model):
  - In Person Meeting? (checkbox)
  - Assign (users, multi)
  - Lead Source (drop_down) [SEO/Google, Realtor Referral, Owner Referral, Vendor Referral, FB Group, Bigger Pockets, Builder Referral, Personal Referral, Other, Unknown, Micheal Ogle, Saw signs, Vintory, Cold Call, Meta]
  - Owner Tier (drop_down) [Top ($50k+ commissions), Key ($24k–49.9k), Normal ($11k–23.9k), Junior ($0–10.9k)]
  - Gross Rent (short_text)
  - SA Signed (checkbox — service agreement signed)
  - Next Steps (labels) [First call, Follow up email, Second call, Call to close, Value Add Text, Check in text, Schedule Closing call text, Sign Contract, Decision]
  - Property Count (short_text)
  - First Guest Date (date)
  - Notable Highlights (labels) [Pool, View, New Build, Modern Design, Average, Large, Condo, Downtown]
  - Realtor Referrals (list_relationship → Referral List 901002469975)
  - Pipedrive? (checkbox — suggests a past/parallel Pipedrive migration)
  - Label (labels) [Lost Sale, Potential Investor, Property Search, Currently Building, Old Clients]
- Open tasks: 100+ (majority in done-type "closed + passed") | Sample (most recently updated): "Cecil Gibson" (long term nurture), "Rebecca Pentecost" (warm leads), "Shelly Wright" (warm leads), "Ryan Moody" (warm leads), "Jonathan New" (warm leads)
- In use: assignees y (Dennis Rimshaw primary; also Jordan Lynde, Jake Taylor, Cadie McKinney), due dates y (many auto-set; a batch of "warm leads" all due 2026-07-13), priorities y (normal/urgent), tags y ("hot leads", "realtor jennie ooten", "josh clark")
- Activity: ACTIVE (last update 2026-07-13 — likely automation touching warm leads' due dates)
- Notes: Long list description documents an OLDER status scheme (New Lead / Follow Up Call / FUP Email / Sales Pursuit / Close to Onboarding / Warm Lead FUP Later / Old Client) plus automations (due date +1 day on creation; 6-month Lost Sale → Warm Lead recycling; due-date-driven moves). Actual configured statuses have diverged from that doc. "andy old..." statuses are legacy-migration buckets. Description template captures Email/Phone/Address/General Comments.

### List: JZ Cold Sales Pipeline (901704198600)  — CRM
- Statuses (pipeline stages): new leads → hyper pursuit → verbal + c negotiation → long term nurture → warm leads → cold leads → closed + passed (done) → lost sale (dennis) (done) → bad leads (done) → andy old -need to sift (done) → andy old leads sifted (done) → andy passed to onboarding (done) → meeting booked (done) → don't use (closed)
- One record = one property-owner lead (same model as DR pipeline, but sourced cold — cold calls, Vintory, web forms). Task description template captures email, phone, property address, # properties, current listing links, "biggest problem to solve".
- Custom fields: same shared fields as DR Warm Lead Pipeline (In Person Meeting?, Assign, Lead Source [same 15 options], Owner Tier [Top/Key/Normal/Junior], Gross Rent, SA Signed, Next Steps [same 9 labels], Property Count, First Guest Date, Notable Highlights [same 8 labels], Label [same 5 labels], Realtor Referrals (list_relationship → Referral List 901002469975 — separate field id from DR's)) PLUS three contact fields not on DR:
  - Address (short_text)
  - Phone Number (phone)
  - Email (email)
- Open tasks: 100+ | Sample (most recently updated): "Austin Phillips" (warm leads), "Terri Peplow NF 10/17/22" (warm leads), "Margerat Mclure" (warm leads), "Jennifer" (bad leads), "Jamie Braddy" (closed + passed)
- In use: assignees y (Dennis Rimshaw), due dates y (bulk warm-lead follow-up dates, many 2026-07-13), priorities y (normal/urgent), tags y ("hot leads", "star chase", "vintory", "realtor jennie ooten")
- Activity: ACTIVE (last update ~2026-07-10)
- Notes: Same copy-pasted list description as DR pipeline (statuses documented ≠ statuses configured). Closed status is literally named "don't use". Bulk of records are dormant warm/bad leads dating back to 2022-2023 lead names with "NF"/"DP" shorthand in titles.

### List: Sales Task List (900602028472)
- Statuses: recurring → todo → company tickets → onboarding → offboarding → done (done) → complete (closed)
- Custom fields (shared company-wide task-list fields):
  - Department (drop_down) [Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater]
  - SOPs (short_text)
- Open tasks: ~4 | Sample: "Visit any properties that are still being built (TOP clients)" (recurring), "Clickup" (recurring), "Check DailPad" (recurring), "Check Sales Inbox" (recurring)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-10-19)
- Notes: Instance of the standard per-department "Task List" template (fed by Onboarding Properties / Offboarding Properties / Company Tickets lists, priority-escalation automations). Abandoned for Sales.

### List: Referral List (901002469975)  — CRM
- Statuses (contact type, not a flow): builder → vendor → owner/client → realtor → outbound sent to blake → done (done) → done & hide (closed)
- One record = one referral SOURCE (a realtor, builder, vendor, or existing owner/client who refers leads to Haven). Back-linked from both sales pipelines' "Realtor Referrals" relationship fields, which show the leads each referrer sent.
- Custom fields:
  - Lead Source (drop_down) [same shared 15 options as pipelines]
  - Owner Tier (drop_down) [Top, Key, Normal, Junior] (shared field)
  - Property Count (short_text) (shared)
  - Notable Highlights (labels) [Pool, View, New Build, Modern Design, Average, Large, Condo, Downtown] (shared)
  - Monthly Connection (labels) [Monthly Connection] — flag for a monthly touch cadence
  - Email (email)
  - Phone # (short_text)
- Open tasks: ~8 | Sample: "Anthony Townsend" (outbound sent to blake), "Alana Myers (Builder contact)" (builder), "Joe Ogle" (builder), "Brian (Evergreen Design & Construction, LLC)" (builder), "Travis Ogle" (builder)
- In use: assignees y (Dennis Rimshaw on some), due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-03-04)
- Notes: Statuses are used as a category taxonomy (record type), not a pipeline. Several pipeline fields (Owner Tier, Property Count, Notable Highlights) appear here only because they're shared field definitions — they aren't meaningful for a referrer record.

### List: FAQ's and Objections (901002527489)
- Statuses: (space defaults) to do → in progress → overdue → done → done & hide (closed)
- Custom fields: (none)
- Open tasks: ~5 | Sample: "I just need to make some calls and i'll let you know" (to do), "I want to wait a couple months and keep bookings" (to do), "20% is to expensive" (to do), "Linen Fee" (to do), "What does the 20% cover?" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-01-06)
- Notes: Knowledge base, not a workflow — each task = a sales objection/FAQ with the scripted rebuttal in the description ("Dennis can use this info to help in sales calls"). Statuses meaningless here. In HavenOS this maps to a reference-content collection, not tasks.

### List: Call Log (901002823984)
- Statuses: (space defaults) to do → in progress → overdue → done → done & hide (closed)
- Custom fields: (none)
- Open tasks: 0 (also 0 with closed included — completely empty)
- In use: n/a
- Activity: DEAD (empty; no tasks ever, or fully purged)
- Notes: Empty shell. Despite the name, there is no call-record data model here; call summaries live as comments on pipeline lead tasks instead.

### List: Lead Pipeline (GA) (901702904076)  — CRM
- Statuses (pipeline stages): new leads → new lead fup call → new lead fup email → sales pursuit → warm leads → property search → currently building → commited and close → warm lead fup later → old clients → passed to onboarding (done) → lost sale (done) → bad leads (done) → don't use (closed)
- One record = one property-owner lead for a Georgia market expansion (same model as the other pipelines).
- Custom fields: subset of the shared pipeline fields:
  - In Person Meeting? (checkbox)
  - Lead Source (drop_down) [same shared 15 options]
  - Owner Tier (drop_down) [Top, Key, Normal, Junior]
  - Gross Rent (short_text)
  - SA Signed (checkbox)
  - Referrals (list_relationship → Referral List 901002469975)
  - Property Count (short_text)
  - First Guest Date (date)
  - Notable Highlights (labels) [same shared 8 labels]
- Open tasks: ~7 | Sample: "David Micallef" (new leads), "Josh Barth" (new leads), "Ednard Lauture" (new leads), "Chris Carlino" (new leads), "Ron Gamboa" (new leads)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-07-27)
- Notes: Statuses here are the closest match to the documented "canonical" pipeline scheme in the list descriptions. All 7 leads stuck in "new leads" with empty description templates — the GA expansion pipeline was abandoned at creation (~July 2024).

### List: Shut Down Scorecard (901705296866)
- Statuses: (space defaults) to do → in progress → overdue → done → done & hide (closed)
- One record = one salesperson's end-of-day ("shut down") scorecard, submitted via a ClickUp Form (task_type=form_response); task name = the date.
- Custom fields (the scorecard metrics):
  - What could you have personally done better today? (text)
  - Problems we are facing (text)
  - Leads Advanced (number)
  - Conversations had (number)
  - Contracts signed (number)
  - Hyper Pursuit Pipeline Value (GR) (currency USD)
  - Pipeline up to date? (checkbox)
- Open tasks: ~24 | Sample: "10/18/25" (to do), "10/17/25" (to do), "11/13/25" (to do), "11/12/25" (to do), "11/11/25" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-11-18)
- Notes: Daily habit ran Sept–Nov 2025 then stopped. All entries stay in "to do" (statuses unused). Good candidate for a structured daily-report form in HavenOS.

### List: Agent CRM (901705408378)  — CRM
- Statuses: agents → in progress → overdue → done → done & hide (closed)
- One record = one real-estate AGENT contact (realtor relationship directory for referral generation).
- Custom fields:
  - Broker (short_text — brokerage name)
  - Phone Number (phone)
  - Email (email)
  - Phone # (short_text — duplicate legacy phone field, shared with Referral List)
- Open tasks: ~35 | Sample: "Kelly White" (agents), "Jennie Ooten" (agents), "Irena Mccoy" (agents), "Jessica Potts" (agents), "Jared Drager" (agents)
- In use: assignees y (1 task), due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-09-12)
- Notes: Everything sits in the "agents" status — it's a flat contact directory, not a pipeline. Overlaps conceptually with Referral List (which also holds realtors); two competing realtor-contact stores exist.

# Space: Revenue (90171290493)
Space-level custom fields: (none)

## (space root)

### List: Revenue Strategy List (901703038278)
- Statuses (performance bands, not a flow): performing well → top performers → needs attention → Closed (closed)
- One record = one managed PROPERTY (named "Owner Name + unit number", e.g. "James Urban 3030"), bucketed by revenue performance. Per list description: MPI30 < 1.0 = Needs Attention (recurs daily, skips weekends), ≥ 1.0 = Performing Well, ≥ 1.8 = Top Performer (both recur twice weekly).
- Custom fields:
  - Owner Tier (drop_down) [Top, Key, Normal, Junior] (shared with Sales)
  - Yearly Gross Rent Goal (currency USD)
  - Bedroom Count (drop_down) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10+]
  - Account Manager (drop_down) [Amanda Catron, Katie Work, Lily Bryant Macon, Regina Shrout, Summer Mathews, Jordan Lynde, Andrea Morris, Offboarded, Jordan - Offboarding, Summer - Offboarding, Haven Expenses, MISC, Lily - Offboarding, Regina - Offboarding, Katie - Offboarding]
  - Airbnb Account (drop_down) [Main Account, KnoxStaytion Account, Superhost Account, B Account, Roach Account, Tammy Account, Slabaugh Account, StaySimpli Account, Jordan Account]
- Open tasks: 100+ | Sample (most recently updated): "James Urban 3030" (top performers), "Andrea Cobrin 3008" (top performers), "Andrea Cobrin 3012" (top performers), "Chris Scarth 1091" (top performers), "Ed Zorn 212-163" (top performers)
- In use: assignees y (Noeline Ramos on the fresh 2026 batch, Ailyn Sonquipal on the older 2024 batch), due dates y (recurring review dates), priorities n, tags y ("offboarded")
- Activity: ACTIVE (last update ~2026-05-28; the entire portfolio appears re-seeded in May 2026)
- Notes: This is effectively Haven's property-portfolio revenue register. Two generations of records coexist: a Nov-2024 batch (many "needs attention", due dates 2024-11) and a fresh May-2026 batch. Property names echo lead names from the Sales pipelines (post-close continuity).

### List: Revenue Task List (901702988468)
- Statuses: recurring → to do → company tickets → onboarding → offboarding → done (done) → complete (closed)
- Custom fields: Department (drop_down) [same shared 14 options: Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater], SOPs (short_text) — same shared template fields as Sales Task List
- Open tasks: ~58 | Sample (most recently updated): "[Pricing Review] Natasha Ross 2808 (PF) - Check Late May/June" (recurring), "Alter Group Level Pricing on PriceLabs" (done), "Tracking Revenue Pacing" (recurring), "Review Underperforming listings Sheet based on booking rate" (recurring), "Update Responsive Gross Rent Sheet (Quarterly)" (recurring)
- In use: assignees y (Ailyn Sonquipal, Noeline Ramos; legacy batch Aiza Chavarria), due dates y, priorities y (urgent/high), tags n
- Activity: ACTIVE (last update ~2026-05-07)
- Notes: Two very different populations: (a) live revenue-management recurring work (PriceLabs pricing reviews, pacing tracking — the most recent task is an AI "Revenue Agent Deep-Dive" pricing recommendation awaiting approval, created by Noeline Ramos May 2026), and (b) ~45 finance/bookkeeping tasks (Pay Cleaners, QBO reconciliation, Divvy approvals, payroll) from Jul–Oct 2024 stranded in done-type status — finance work later moved elsewhere. Only ~13 tasks are genuinely current.

# Space: Marketing (90171782384)
Space-level custom fields: (none)

## (space root)

### List: List (901706633063)
- Statuses: backlog → planning → in progress → ready for review → approved (done) → rejected (done) → on hold (done) → done (closed)
- Custom fields: (none)
- Open tasks: 0 (0 including closed — completely empty)
- In use: n/a
- Activity: DEAD (empty, never used)
- Notes: Default-named placeholder list. The status set (backlog/planning/review/approved/rejected) suggests an intended content-approval workflow that never launched; actual marketing content work lives in Sales > Offers/Marketing folder instead.

# Cross-space observations for HavenOS modeling
- Shared custom-field definitions reused across lists (same field IDs): Lead Source, Owner Tier, Gross Rent, SA Signed, Next Steps, Property Count, First Guest Date, Notable Highlights, Label, In Person Meeting?, Department, SOPs, Email, Phone #. Model these once as global lead/property attributes.
- The lead CRM data model (person-lead with tier, source, gross rent, property count, next steps, SA-signed, relationship to referrers) is duplicated across 3 pipeline lists with drifting status schemes; only DR and JZ pipelines are alive. HavenOS should implement ONE lead entity with a pipeline-stage enum and an owning-rep field.
- Referral List ←→ pipelines are linked via list_relationship fields (three separate relationship field IDs all pointing at list 901002469975): a Lead has an optional Referrer.
- List descriptions document automations to replicate: due date = created+1 day for new leads; Lost Sale → Warm Lead after 6 months; Warm Lead FUP Later → Warm Lead on due date; task-list priority escalation at start/due dates.
- Statuses are frequently used as record CATEGORIES (Referral List, Agent CRM, Revenue Strategy List, Shut Down Scorecard) rather than workflow states.
