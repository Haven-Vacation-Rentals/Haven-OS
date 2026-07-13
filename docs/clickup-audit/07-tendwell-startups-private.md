# ClickUp Workspace Audit — Tendwell Cleaning Co. / Starting Up Start Ups / Dylan's Private
Auditor pass 07 | Audit date: 2026-07-13 | Read-only. Open-task samples via filter_tasks (subtasks=false, include_closed=false, order_by=updated desc, page 0; page cap = 100 → "100+").
Note: no custom fields are defined at space or folder level in any of these three spaces — all fields below are list-level.

# Space: Tendwell Cleaning Co. (90171107722)
Space-level custom fields: none.
Space-inherited status set (used by lists that don't define their own): haven → self managers → complete (closed). This odd default appears on Recurring Tasks, Onboarding Linens, Property List Tendwell, EOS/List, Finance/List, Sales/List — "haven" vs "self managers" is used to split Haven-managed vs self-managed properties/work.

## Folder: SOP + Procedure (90172436018)
Folder-level custom fields: none.

### List: SOP List (901704872207)
- Statuses: live → pending review → to do → complete (closed)
- Custom fields: Tags (labels) [Ops, Finance, Onboarding, Cleaning]; SOP Strength (drop_down) [Complete, Pending Final Review, In Progress, Don't Do, Missing]
- Open tasks: ~11 | Sample (most recently updated): "need an onboarding process" (live), "Linen Inventory" (to do), "Update Photos on Hostaway (HA)" (live), "Reschedule Solo Air-Filter Tasks to Match Upcoming Clean Dates" (live), "New Cleaner Onboarding Process" (live)
- In use: assignees y (Nina Ocampo on 1), due dates n, priorities n, tags n (label field used instead)
- Activity: STALE (last update ~2026-01-29)
- Notes: SOP knowledge base — task descriptions hold full SOP text (Purpose/Procedure/FAQ template). Covers Ramp spending, invoicing, Breezeway checks, cleaner comms, Hospitality Depot orders, property onboarding. Rebuild as a document/SOP library rather than tasks.

### List: Recurring Tasks (901705459604)
- Statuses: haven → self managers → complete (closed) [space-inherited]
- Custom fields: none
- Open tasks: ~8 | Sample: "Complete outstanding Bill.com card tasks" (haven), "Complete outstanding ramp card tasks" (haven), "Complete weekly scorecard for Tendwell and Stillwater" (haven), "Track cleaning and Maintenance check" (haven), "Invoicing & QuickBooks" (haven)
- In use: assignees y (all → Nina Ocampo), due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-10-08)
- Notes: VA/ops recurring checklist (end-of-month invoicing, vendor monitoring, on/offboarding tracking). All 8 sit in "haven" status.

## Folder: Sales + Onboarding (90172482586)
Folder-level custom fields: none (but Pipeline and Tendwell Onboarding share identical field IDs — same field set duplicated across both lists).

### List: Pipeline (901704830915)
- Statuses: new leads → move to onboarding (closed)
- Custom fields: Bathroom Count (number); Onboarding Clean Date (date); Bedroom Count (drop_down) [1,2,3,4,5,6,7,8,9,10+]; Potential Cleaning Fee (number); Listing (url)
- Open tasks: ~1 | Sample: "Kristen Cannon 428" (new leads)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-03)
- Notes: Lead-intake pipeline; task name convention = "Owner Name + property number". Two-status kanban (lead → onboarding).

### List: Tendwell Onboarding (901704831337)
- Statuses: new leads → move to onboarding (closed)
- Custom fields: identical to Pipeline (same field IDs): Bathroom Count (number), Onboarding Clean Date (date), Bedroom Count (drop_down 1–10+), Potential Cleaning Fee (number), Listing (url)
- Open tasks: ~2 | Sample: "Template" (new leads), "Jason hyre 568" (new leads)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-03)
- Notes: Contains a "Template" task — used as a copy-source for onboarding records.

### List: Onboarding Linens (901704831602)
- Statuses: haven → self managers → complete (closed) [space-inherited]
- Custom fields (all number unless noted): Number of Full Bathrooms; Number of Half Bathrooms; Baby Cribs; Any baby cribs? (duplicate); Pool/HT Towels; Queen Comforters; Dish Towels; Kitchen Towels; Queen Flat; Queen Fitted; Queen Bed Bug Casings; Queen Beds; King Beds; Full/Double Beds; Wash Cloths; Hand Towels; Bath Towels; Bath Mats; Standard Pillow Cases
- Open tasks: ~2 | Sample: "Test_Ruth" (haven), "Lewis Earnst 932" (haven)
- In use: assignees n, due dates y, priorities n, tags n
- Activity: DEAD (last update ~2025-07-02, just over 1 year)
- Notes: Fed by a ClickUp Form (task_type=form_response) — a per-property linen order sheet. Referenced from Property List Tendwell via a "Linen Order" relationship field. Two near-duplicate crib fields ("Baby Cribs" / "Any baby cribs?").

## Folder: HR (90172486762)
Folder-level custom fields: none.

### List: Cleaner List (901704841598)
- Statuses: current employees → in progress → complete (closed)
- Custom fields: Start Date (date); Copy of Insurance (attachment); Email Address (short_text); Phone Number (phone); Rate (currency USD); Background Check (checkbox); Properties (list_relationship → Property List Tendwell 901704798832, inverse of its "Cleaner" field)
- Open tasks: ~5 | Sample: "Yeimi Cruz", "Dafny Cruz", "Oniel Portillo", "Norma Portillo", "Jordan Lynde" (all current employees)
- In use: assignees y (Jordan Lynde as record owner), due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-21, just over 1 year)
- Notes: Cleaner/contractor roster (1 record per person) with pay rate, insurance doc, background-check flag, and a two-way relation to properties they clean. One record created by ClickBot (automation).

## Folder: EOS (90172529610)
Folder-level custom fields: none. (EOS = Entrepreneurial Operating System / Traction framework: L10 meetings + quarterly Rocks.)

### List: List (901704948928)
- Statuses: haven → self managers → complete (closed) [space-inherited]
- Custom fields: none
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty)
- Notes: Default placeholder list, never used.

### List: TwellL10 (901704690119)
- Statuses: to do list → 21 day to do → 14 day to do → agenda pg 189-197 → private issues list → not paid → partial payment → paid → done → complete (closed)
- Custom fields: none
- Open tasks: ~11 | Sample: "The Sprint" (to do list, due 2026-04-30, assigned Jack Zoppa + Jordan Lynde), "how do we incentivize cleaners to take care of our linens" (private issues list), "Testimonials" (to do list), "List" (private issues list), "Rock Review- 5 Minutes" (agenda pg 189-197)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: STALE (last update ~2026-03-05)
- Notes: Weekly EOS Level-10 meeting board. Statuses are a grab-bag: standing agenda items (Segue/Scorecard/Headlines/Rock Review/IDS/Conclude with time boxes), an issues list, and leftover payment statuses (not paid/partial/paid) that don't fit the meeting purpose. Agenda tasks link EOS Worldwide toolbox PDFs.

### List: Q3 Rocks 2025 (901704948934)
- Statuses: rocks → not finished (done) → done (done) → complete (closed)
- Custom fields: Department (drop_down) [Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater]; Progress (automatic_progress, tracks subtasks+checklists+assigned comments)
- Open tasks: ~5 (all in done-type "done" status, not yet closed) | Sample: "Explore another roll-up post 30 properties", "Have folder position", "Get a facility + operational set-up", "Figure out exact costs (per turn, per bed, linens, consumables, etc...)", "Increase to 40 properties"
- In use: assignees y (Jack Zoppa, Jordan Lynde), due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-09-17)
- Notes: Quarterly EOS Rocks. Department dropdown + automatic Progress field is the shared Rocks template (same field IDs reused on Q4 2025 and Q1 2026).

### List: Q4 Rocks 2025 (901705450785)
- Statuses: rocks → not finished (done) → done (done) → complete (closed)
- Custom fields: same shared fields as Q3 Rocks 2025 (Department drop_down 14 options; Progress automatic_progress)
- Open tasks: ~3 | Sample: "Long Term Vision for Tendwell" (rocks), "Identify consumable ordering system" (rocks), "Consolidate Vendors to Tendwell, Knoxville, and Blessed" (rocks)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-09-17 — created at quarter planning, never worked in ClickUp)
- Notes: Same Rocks template as Q3.

### List: Q1 2026 (901708397959)
- Statuses: rocks → not finished (done) → done (done) → complete (closed)
- Custom fields: same shared Rocks fields (Department; Progress)
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty — shell created for the quarter, never populated)

## Folder: Finance (90172540939)
Folder-level custom fields: none.

### List: List (901704979759)
- Statuses: haven → self managers → complete (closed) [space-inherited]
- Custom fields: none
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty placeholder)

### List: Invoicing + History (901704979784)
- Statuses: new invoice → disputing → invoice not paid (done) → complete (closed)
- Custom fields: Date Paid (date); Invoice Amount (short_text, AI-autofill field with prompt "Provide the total amount billed in the invoice."); Amount (currency USD)
- Open tasks: 100+ (full page cap; likely several hundred) | Sample (newest): "Home Team Vacation Rentals, LLC received your invoice #1127" (new invoice), "...invoice #1128" (new invoice), "...invoice #1129" (new invoice), "...invoice #1130" (new invoice), "...invoice #1131" (new invoice)
- In use: assignees y (every task auto-assigned Jordan Lynde + Jack Zoppa), due dates y (auto-set), priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-10; new items land continuously)
- Notes: Email-to-ClickUp inbox. An email integration dumps EVERYTHING from a billing mailbox in as "new invoice": QuickBooks/BILL invoice notifications (invoice numbers 001→1134 visible), payment confirmations from Home Team Vacation Rentals LLC, bank-account alerts, IRS 1099 acceptances, marketing spam, verification codes — and at least one apparent phishing/BEC email ("Overdue Invoice# 602558 from PointB Consultant" asking for ACH payment, plus similar KANTAR/Equinx/Exco "overdue invoice" mails). Almost nothing is triaged out of "new invoice". For HavenOS: rebuild as an ingest inbox + real invoice records (number, counterparty, amount, date paid, status), with filtering — do not replicate 1:1.

## Folder: Sales (90175899545)
Folder-level custom fields: none.

### List: List (901710092672)
- Statuses: haven → self managers → complete (closed) [space-inherited]
- Custom fields: none
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty placeholder)

### List: Warm List (901710092683)
- Statuses: new leads → hyper pursuit → verbal + c nego → closed deals (done) → lost deals (done) → complete (closed)
- Custom fields: Lead Source (drop_down) [Jack/Jordan LinkedIn, META Ads, Google SEO, Word Of Mouth, Realtor]; Number Of Properties (number); Deal Value (currency USD)
- Open tasks: ~1 | Sample: "David Greene Portfolio" (new leads)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-01-23)
- Notes: Proper B2B sales pipeline shape (stages + source + deal size) — newer than the Sales + Onboarding "Pipeline" list and supersedes it, but barely populated.

## (space root)

### List: Property List Tendwell (901704798832)
- Statuses: haven → self managers → complete (closed) [space-inherited; "haven" = Haven-managed property]
- Custom fields: Address (short_text); Address for Map (location); Listing Link (url); Bedroom Count (number); Bathroom Count (number); Cleaning Fee (currency USD); Cleaner Pay (currency USD); Launder Cost (currency USD); Trash Cost (currency USD); Consumable Cost (currency USD); Inspection Cost (currency USD); Profit (formula: Cleaning Fee − Cleaner Pay − Launder − Trash − Consumable − Inspection); Margin (formula: Profit / Cleaning Fee); Profit Percentage (formula, broken — return type null); Percentage 100 multi field (currency, apparent leftover/misnamed); Cleaner (list_relationship → Cleaner List 901704841598); Linen Order (list_relationship → Onboarding Linens 901704831602); Account Manager (drop_down) [Amanda Catron, Katie Work, Lily Bryant Macon, Regina Shrout, Summer Mathews, Jordan Lynde, Andrea Morris, Offboarded, Jordan - Offboarding, Summer - Offboarding, Haven Expenses, MISC, Lily - Offboarding, Regina - Offboarding, Katie - Offboarding]; Airbnb Account (drop_down) [Main Account, KnoxStaytion Account, Superhost Account, B Account, Roach Account, Tammy Account, Slabaugh Account, StaySimpli Account, Jordan Account]; Tag (labels) [Stillwater]
- Open tasks: ~17 | Sample: "Andrew and Taylor 228" (haven), "Nancy Nguyen 2832" (haven), "Daryl Nelson 159" (haven), "Mark Urban 2123" (haven), "Josh Heuser 2646" (haven)
- In use: assignees n, due dates n, priorities n, tags n (label field defined but sample untagged)
- Activity: STALE (last update ~2026-01-06)
- Notes: THE core Tendwell data table: one task per property ("Owner Name + street/unit number"), full per-clean unit economics (fee, cleaner pay, laundering/trash/consumable/inspection costs, computed Profit and Margin), plus relations to assigned Cleaner and Linen Order. Account Manager options double as offboarding state (the "X - Offboarding"/"Offboarded" options) — model that as a separate lifecycle field in HavenOS. This is the highest-value list to replicate for the Tendwell section.

# Space: Starting Up Start Ups (90171100758)
Space-level custom fields: none. Space default statuses: to do → in progress → complete (closed).
Purpose: incubation space for new sister ventures (Tendwell launch, "Luxe" premium management brand, Stillwater). Everything here is launch-era (mid-2025) and effectively retired — Tendwell graduated to its own space.

## (space root)

### List: List (901704713501)
- Statuses: to do → in progress → complete (closed)
- Custom fields: none
- Open tasks: ~1 | Sample: "Ordnering Onboarding linens" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-04)
- Notes: Single how-to note pointing at the Tendwell Onboarding Linens form list.

### List: General (901704641344)
- Statuses: to do → in progress → complete (closed)
- Custom fields: none
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty)

### List: Tendwell Launch List (901704669401)
- Statuses: to do → in progress → done (done) → complete (closed)
- Custom fields: none
- Open tasks: ~18 (10 "to do", 8 "done") | Sample: "SOP for Onboarding New Properties" (to do), "Create a pay strutcure" (to do), "Search for a head cleaner who is bi-lingual and responsible" (to do), "Find a storage solution" (to do), "Find a consumables solution" (to do)
- In use: assignees y (Jack Zoppa, Jordan Lynde), due dates y (on completed items), priorities n, tags n
- Activity: DEAD (last update ~2025-06-17, just over 1 year)
- Notes: The original checklist used to launch Tendwell (entity/lawyer, branding, hiring SOP, laundry/storage/consumables, first properties). Historical value only.

### List: Luxe Management (901704669423)
- Statuses: to do → in progress → complete (closed)
- Custom fields: none
- Open tasks: ~7 | Sample: "Once we land on a name need to make sure we add it as DBA for Haven" (to do), "Conduit setup" (in progress), "Sandbox for Lux Management" (to do), "Should we have a tiered offering..." (to do), "Marketing differentiation?..." (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-23, just over 1 year)
- Notes: Idea backlog for a premium/luxury property-management brand (naming, DBA under Haven, tiered offering, VTO). Never progressed.

### List: Stillwater Property List (901704936509)
- Statuses: to do → in progress → complete (closed)
- Custom fields: subset of Property List Tendwell, sharing most field IDs: Address for Map (location); Listing Link (url); Bedroom Count (number); Bathroom Count (number); Cleaning Fee (currency USD); Cleaner Pay (currency USD); Launder Cost (currency USD); Trash Cost (currency USD); Consumable Cost (currency USD); Inspection Cost (currency USD); Percentage 100 multi field (currency); Cleaner (list_relationship → Cleaner List 901704841598, separate field ID from Tendwell's); Linen Order (list_relationship → Onboarding Linens 901704831602, separate field ID). No Profit/Margin formulas, no Account Manager/Airbnb Account dropdowns, no Address short_text.
- Open tasks: ~1 | Sample: "John Timmerman 2534" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-06-24, just over 1 year)
- Notes: Stillwater = self-manager/property brand tracked with the same unit-economics schema. Its one property ("John Timmerman 2534") also exists in Property List Tendwell, and Tendwell's Property List has a "Stillwater" label option — in HavenOS, fold Stillwater into the main property table with a brand/segment attribute rather than a separate list.

# Space: Dylan's Private (54281760)
Space-level custom fields: none. Space default statuses: to do → in progress → done & hide (closed).

## (space root)

### List: Dylan's To Do List (192134591)
- Statuses: to do → in progress → done & hide (closed)
- Custom fields: Old Dont Use OffB Department (drop_down) [Owner Relations, Cleaning, Maintenance, Finance + Revenue, Guest Communications, Dispatch, Onboarding, Sale]; Old Don't Use Department Responsibility (drop_down) [Accounts, Guest Messaging, Cleaning, Maintenance, Finance, Dispatch] — both explicitly named "Old Don't Use": deprecated, do not migrate.
- Open tasks: 100+ (page cap hit) | Sample (newest): "Reduce Clickup to 3 seats and switch to monthly..." (to do, urgent, due 2026-07-10); [remaining sample items redacted — personal/personnel content]
- In use: assignees y (occasional, e.g. Jo Leona), due dates y (some), priorities y (heavy: urgent/high/normal/low), tags n
- Activity: ACTIVE (last update 2026-07-13 — today)
- Notes: Dylan's personal GTD inbox, the most active list in these three spaces. Mix of business ops (Trellis/HavenOS/Breezeway/SuiteOp work, finance follow-ups, property fixes) and personal items. Several near-duplicate tasks (same text captured twice). Notably contains "Reduce Clickup to 3 seats and switch to monthly" — the ClickUp exit this audit supports. Priorities are the main triage mechanism; statuses barely used beyond "to do".

### List: My Passwords (901702141313) — CREDENTIAL STORE (restricted capture)
- Statuses: to do → in progress → done & hide (closed)
- Custom fields: Website (url)
- Entry count: NOT RETRIEVED — the permission layer (correctly) blocked task enumeration on this list because even a count query materializes entry names. No task names, descriptions, or field values were fetched or recorded.
- Activity: not assessed (would require reading entries)
- Notes: Structure = one task per credential with a Website URL field; secrets presumably in task name/description. MUST NOT be migrated into HavenOS as plain records — replace with a real secrets manager (1Password/Bitwarden) and delete from ClickUp.

# Cross-space observations
- Relationship graph to preserve in HavenOS (Tendwell section): Property List Tendwell ←(Cleaner)→ Cleaner List; Property List Tendwell ←(Linen Order)→ Onboarding Linens (form-fed); Stillwater Property List points at the same two targets with duplicate relationship fields.
- Shared/duplicated field IDs across lists (Pipeline = Tendwell Onboarding; Rocks Q3/Q4/Q1; Property List ∩ Stillwater) indicate fields were created once and re-added — HavenOS should define them once as shared property/rock schemas.
- Activity summary: ACTIVE = Invoicing + History, Dylan's To Do List. STALE = SOP List, Recurring Tasks, TwellL10, Q3/Q4 Rocks 2025, Warm List, Property List Tendwell. Everything else DEAD/empty (mostly launch-era mid-2025).
- Data-quality flags: Invoicing + History contains probable phishing/BEC emails ingested as tasks; Onboarding Linens has duplicate crib fields and test records ("Test_Ruth"); Property List "Profit Percentage" formula is broken (null return type); Account Manager dropdown mixes people with lifecycle states.
