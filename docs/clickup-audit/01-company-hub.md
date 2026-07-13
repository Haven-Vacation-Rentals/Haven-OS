# Space: Company Hub (90060262487)
Space-level custom fields: none defined at space level.

Audit date: 2026-07-13. Method notes: this ClickUp MCP's `clickup_filter_tasks` with `order_by=updated, reverse=true` returns ASCENDING order (most recently updated last); verified via `date_updated` spot checks. Task counts are open tasks only (subtasks excluded, closed excluded). "Last update" dates come from `date_updated` spot checks of the most recently updated task in each list.

Recurring shared fields (defined once, reused across lists — treat as one field in HavenOS):
- **Department** (drop_down, id 74a98f1d) [Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater] — appears on Company Tickets, Haven Core Processes, Company SOP List, Skills/Agent Training, Trellis Implementation Plan.
- **SOP Strength** (drop_down, id 8f42d1a4) [Complete, Pending Final Review, In Progress, Don't Do, Missing] — appears on Company SOP List and Support Team SOPs.

## Folder: (space root)
Folder-level custom fields: n/a.

### List: Company Tickets (900201016545)
- Statuses: to do → in progress → done → complete (closed)
- Custom fields: Ai Test (text, AI-config: bullet summary from activity/24h), Created By (users), Department (drop_down, shared — see above)
- Open tasks: ~31 | Sample (most recently updated): "Sales & Hotel tax incorrect on b.com across many listings." (to do), "Mike Training Plan" (to do), "Review properties that have onboarding in past 6 months that may have a builders warranty" (to do), "Ideas for Lodo's Tool" (to do), "Renew all of our business license in this folder. Look at previous years licenses" (to do)
- In use: assignees y, due dates y, priorities y (mostly high), tags n
- Activity: ACTIVE (last update ~2026-07-11)
- Notes: Cross-department ticket router. Long list description documents the operating model: Department dropdown + automation pushes tasks into department lists; automations raise priority to high on start date and urgent on due date; status must stay "Company Tickets" (sic — actual open status is "to do") until done; priority rules (urgent=due 1-2d, high=1wk, normal=1-3wk, low=3wk+). Multi-assignee tasks common.

### List: Software Feature Request List (901002807083)
- Statuses (statuses = target vendor, not workflow): hostaway → clickup → breezeway → keydata → conduit → suiteop → pricelabs → complete (closed)
- Custom fields: none
- Open tasks: ~52 | Sample (most recently updated): "Add Lock Code & Lockbox Information Fields to Property Details" (hostaway), "any way to pull in the name of the person ai is messaging on Airbnb when it's not the booking guest?..." (hostaway), "SuitOp to replace breezeway for Maintenance" (suiteop), "SuitOp to replace breezeway for cleaning" (suiteop), "AI to analyze cleaner photos for cleanliness and for match to reference photo" (suiteop)
- In use: assignees n, due dates n, priorities partial (~1/3 of tasks), tags n
- Activity: STALE (last update ~2026-02-21)
- Notes: Backlog of feature requests to third-party vendors (Hostaway, Breezeway, SuiteOp, Conduit, PriceLabs, KeyData, ClickUp). Status field is used as a category (which product), not a workflow — a taxonomy to preserve in HavenOS as a "vendor" attribute.

### List: Haven Core Processes (901002884036)
- Statuses: core process → complete (closed)
- Custom fields: Department (shared)
- Open tasks: 8 | Sample: "Account Management Processes", "Cleaning Process", "Property Care Process", "Guest Experience Process", "Onboarding Process" (all "core process"; remaining: Revenue Management, Sales, Finance)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-10-29)
- Notes: Doc-like directory: one task per core business process, definition lives in task description (e.g. Finance Process = "Monthly Close of Financials"). Reference material, not work tracking.

### List: Quarterly Ideas (192054723)
- Statuses (status = planning bucket): q1 → q2 → q3 → q4 → future → maybe one day → done & hide (closed)
- Custom fields: none at list level
- Open tasks: ~55 | Sample (most recently updated): "Once we are in a better state operationally... scorecard number... listings that need to be recreated due to poor reviews" (q3), "Connect w/ IG investment influencers that could promote our company" (q2), "Need a solid strategy on how to convert inquiries into bookings" (q4), "schedule 2-3 more SOP blitzs" (q4), "Jordan should walk a client or two completely through onboarding" (q1)
- In use: assignees rare (2/55), due dates n, priorities rare, tags n
- Activity: DEAD (last update ~2025-04-21, ~15 months ago)
- Notes: Leadership idea parking lot; statuses are quarter buckets rather than workflow. Oldest list in the space (task IDs date to ~2021-2023). Effectively superseded.

### List: Property HOA/Community (901704755811)
- Statuses: needs annual passes → annual passes updated → no annual requirement → do not use (closed)
- Custom fields: HOA Office (location), Amenities for Guests (text), Annual ToDo (short_text), HOA Contact (short_text), How Guests Access (pass needed?) (short_text), HOA Website (short_text)
- Open tasks: ~37 | Sample (most recently updated): "Pinecrest Townhomes/Ridgecrest Condominiums" (no annual requirement), "Timberlake Bay / Sanctuary Shores" (no annual requirement), "Gatlinburg Summit Condo Assn." (no annual requirement), "Douglas Lake Resort" (annual passes updated), "Ski View Mountain Resort" (annual passes updated)
- In use: assignees rare (1), due dates some (annual-pass renewal dates, e.g. 2026-04/05), priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-02; new HOAs still being added)
- Notes: CRM-like registry of HOAs/POAs/communities, one task per HOA. Target of the Property Detail Master "HOA/Community" list_relationship field. Duplicate entries exist ("Shagbark Property Owners Association" twice). One stray work task lives in it ("Confirm all Freddy contracts are signed").

### List: Company SOP List (900301513938)
- Statuses (status = owning department): general → core processes → guest communications → dispatch → sales → onboarding → finance → revenue → maintenance → owner relations → cleaning → pick department status → complete (closed)
- Custom fields: Department (shared), SOP Strength (drop_down, shared) [Complete, Pending Final Review, In Progress, Don't Do, Missing], Related SOPs (tasks relationship)
- Open tasks: 200+ (two full pages of 100) | Sample (most recently updated): "Monitoring and Handling Offline & Low Battery Lock Devices in SuiteOp" (dispatch), "Yearly Pool Pass Check" (owner relations), "Guest Damage Claims – Multi-Channel" (general), "Handling Guest Access Issues (No Keys Present)" (guest communications), "Handling Manual ID Verification SuiteOp Notifications" (guest communications)
- In use: assignees y (SOP owner), due dates y (recurring "maintenance check" dates), priorities rare, tags y (heavy: software tags like hostaway, breezeway, slack, airbnb, quickbooks, hubspot, suiteop, "haven sop")
- Activity: ACTIVE (last update ~2026-06-24)
- Notes: The company knowledge base. Per list description: task name = SOP name, description = the SOP text, assignee = SOP owner, recurring due date = review cadence, status = owning department, SOP Strength = lifecycle state. Automation applies "SOP Task Template" to new tasks; other automations copy tasks to department lists (tasks are multi-homed — sampled tasks show hidden parent folders). Duplicates exist (e.g. "Listing Quality Assurance Audits" x2, "Amazon Ordering Process" x2). Highest-value list for HavenOS knowledge-base migration.

### List: Property Detail Master (900102014742)
- Statuses (property lifecycle): live → onboarding → offboarding → Closed (closed)
- Custom fields (~48 — the property schema):
  - Identity/links: Address (short_text), Address for Map (location), Region (labels) [West Gatlinburg, East Parkway, Pittman Center, #N/A, Knoxville, Townsend, SW Parkway, Dandridge, NW Parkway, East Gatlinburg, SE Parkway, Wears Valley/Little Cove], Listing Link (url), Platform Links (short_text), Hostaway ID (short_text), Breezeway ID (short_text)
  - Classification: Property Tier (labels) [Top, Key, Junior, Normal, Offboarding, Offboarded, #N/A, Low], Hybrid (drop_down Yes/No), Currently Hosting (checkbox), Property Sales Status (labels) [On the market, Under Contract], Cancellation Policy (drop_down) [Strict, Firm, Flexible, Moderate, + "or Non-Refundable" variants]
  - People: Account Manager (drop_down, 15 options incl. per-AM "Offboarding" variants, "Haven Expenses", "MISC"), Revenue Manager (drop_down) [Thomas Hampton, Ailyn Regidor]
  - Channel accounts: Airbnb Account (labels, 7 options: Haven, Haven BETA, Haven Roach, KnoxStaytion, Superhost, Haven StaySimpli, Jordan) AND a second "Airbnb Account " (drop_down, 9 options: Main/KnoxStaytion/Superhost/B/Roach/Tammy/Slabaugh/StaySimpli/Jordan) — duplicated field
  - Physical: Bedroom Count, Number of Full Bathrooms, Number of Half Bathrooms, King Beds, Queen Beds, Full/Double Beds, Twin Beds, Kitchen/Kitchenette, Indoor Pool/Hot Tub (all number), Fireplace (text), Parking/Driveway (text), Amenities-ish fields
  - Access: Master Code, Locks + Codes:, Lockbox, Key Box Location/Number, Wifi Log In (short_text) — SENSITIVE property-access data stored in plain custom fields
  - Vendors/utilities: Cleaning Vendor (list_relationship → Cleaning Vendors 901002939861), Pest Control (list_relationship → Vendor Contacts List 900200822104) plus duplicate Pest Control (short_text), Pool Vendor (list_relationship → Vendor Contacts List) plus duplicate Pool Vendor (short_text), Lawn Care (drop_down, 10 vendor options), Gas Company (drop_down, 9 options), Thermostat (drop_down) [Ecobee, Nest, Honeywell], Water source (short_text)
  - Financial: Cleaner Pay (currency USD), Haven CE Amount (Hostaway) (currency USD), Pay date (short_text), Number of Guest (Extra Guest Fee_) (short_text)
  - Lifecycle: OFFBOARDING DATE (date), Update guest count (text), HOA/Community (list_relationship → Property HOA/Community 901704755811)
- Open tasks: 200+ (two full pages; one task per property) | Sample (most recently updated): "Karen Wanamarta 3736" (live), "Ryan Pack 802" (live), "Jeff Keithley 371" (onboarding), "Ray Cooper 327" (onboarding), "Jason Riordan 3825" (onboarding)
- In use: assignees rare, due dates n, priorities rare, tags rare ("stillwater properties"), custom fields VERY heavily used (sampled task had 69 field values), watchers heavily used (16 on sampled task)
- Activity: ACTIVE (updated same day as audit, 2026-07-13)
- Notes: The master property database ("PDM") — the core entity table for HavenOS. Naming convention "Owner First Last + street/unit number". List description defines lifecycle: added at Onboarding → Active/Live (AM assigned, vendors/codes maintained by dispatch+accounts) → Offboarding (date set) → Closed by AM. Schema cleanup needed on migration: duplicate fields (2x Pest Control, 2x Pool Vendor, 2x Airbnb Account), free-text codes/wifi that belong in a secrets store.

### List: Skills/Agent Training Idea List (Claude or Trellis) (901712126895)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: Department (shared), Agent/System (drop_down) [Revven, Havey, Claude Cowork, Ownerly, Listingly, Financely]
- Open tasks: ~77 | Sample (most recently updated): " Combination of skills and workflow to handle Guest transfer bookings " (to do), "Skill for blacklisting guests" (to do), "Skill to weekly review all communication with owners by summer then suggest updates to Ownerly's instructions..." (to do), "Create a skill for Havey for adding unique things to a cleaning task..." (to do), " Create skill to analyze how quickly Vendors are getting back to us..." (to do)
- In use: assignees some (Jonathan Francisco III most common), due dates some (July 2026), priorities rare, tags n
- Activity: ACTIVE (last update ~2026-07-11; tasks being added daily)
- Notes: Backlog of AI-agent skill ideas mapped to named agents via Agent/System dropdown (Havey=ops/guest, Revven=revenue, Ownerly=owner comms, Financely=finance, Listingly=listings, Claude Cowork). Many near-duplicate entries (same idea entered twice, e.g. guest-transfer, blacklisting, chargeback skills) — appears ideas were bulk re-imported ~2026-07-11. Directly relevant to HavenOS roadmap.

### List: Trellis Implementation Plan (901712325863)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: Department (shared)
- Open tasks: ~8 | Sample (most recently updated): "Build dashboard to replace 'opportunities' section of SO. Live feed of recurring issues at properties" (to do), "Start automating some communication with vendors" (to do), "Move from conduit to trellis" (to do), "Figuring out what phone number/system to use (Quo vs Twilio in Trellis)" (done), "Clean Havey's Knowledge Base" (done)
- In use: assignees y (single owner: Jonathan Francisco III), due dates y (through 2026-08-30), priorities n, tags n
- Activity: ACTIVE (open items due July-Aug 2026; done items completed spring 2026). (Exact last-update spot check was blocked by a tool-permission false positive; classification based on due dates + list creation era.)
- Notes: Small migration checklist for moving from Conduit/Breezeway to Trellis (phone system, knowledge bases, Breezeway sync verification, vendor comm automation).

## Folder: Support Team (90101339596)
Folder-level custom fields: none.

### List: Daily Touch Point Agenda (901002581088)
- Statuses: agenda items in order → in progress → complete (closed)
- Custom fields: none
- Open tasks: 4 | Sample: "Share the refund list from the night before or the weekend..." , "Report any major guest Issues from night before...", "Share current reservations going poorly. (Always share the worst current reservation)", "Share Pre-Stay Evaluation with the team" (all "agenda items in order")
- In use: assignees some (agenda-item owner), due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-03-05; items created Sep-Oct 2023)
- Notes: Standing meeting agenda — tasks are recurring agenda line items for a daily support-team meeting, not work items. Maps to a "meeting template" concept in HavenOS, not a task list.

### List: List (901002490106)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: none
- Open tasks: 0
- In use: n/a
- Activity: DEAD (empty)
- Notes: Unnamed placeholder list ("List"), never used or fully emptied. Skip in migration.

### List: Support Team SOPs (901002490122)
- Statuses: support team → pick department status → complete (closed)
- Custom fields: SOP Strength (shared drop_down; same field as Company SOP List)
- Open tasks: 5 | Sample: "Completing Breezeway Tasks", "Filling out Support Team Hours", "Logging Divvy Transactions", "Following On Call Schedule", "Inventory Tracking (Runners)" (all "support team")
- In use: assignees n, due dates n, priorities n, tags y (breezeway, google docs, bill/divvy, google calendar)
- Activity: DEAD (last update ~2024-09-25)
- Notes: Departmental SOP list following the Company SOP List pattern (status IDs literally chain from the Company SOP List statuses, showing it was cloned from it). SOP text in descriptions with Purpose/Procedure/FAQs template. Superseded by the Company SOP List.

## Folder: Passwords (90171282862) — CREDENTIAL STORES (restricted recording: statuses, field names/types, entry counts only)
Folder-level custom fields (inherited by all 7 lists): Password (text), Last Updated (date), Website Custom Field (url), Username (short_text).
All 7 lists share the same folder-level status set: Open → Closed (closed).
Structure: one task per credential entry; Username/Password/URL/Last-Updated stored as custom field values. No task names, descriptions, or field values recorded per security rule.

### List: Dylan's (901702733521)
- Statuses: Open → Closed | Custom fields: folder set (Password, Last Updated, Website Custom Field, Username) | Entries: 3 | Notes: personal credential store.
### List: Finance Passwords (901702143237)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved — task-listing call was denied by the session permission classifier (credential-materialization guard), and retrying siblings would be the same denied action. Count must be taken from the ClickUp UI if needed.
### List: Accounts + Sales Passwords (901702143250)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved (same guard as above; not attempted after denial).
### List: Purchasing Passwords (901702143255)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved (same).
### List: Shared-Haven Stateside (901702143259)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved (same).
### List: Revenue Passwords (901703148476)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved (same).
### List: Shared-Shared-Software + Products We Use (901702143265)
- Statuses: Open → Closed | Custom fields: folder set | Entries: not retrieved (same).

Folder-level note: plaintext credentials in a ClickUp folder are a security liability; HavenOS should replace this whole folder with a proper secrets manager, migrating only the schema (name/username/password/url/last-updated), not this pattern.

## Folder: Leadership Projects (90171555284)
Folder-level custom fields: none.

### List: Next Market (901702888421)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: none
- Open tasks: ~18 (all "to do") | Sample (most recently updated): "Anything we want to do different in this market than we currently do since we are starting from scratch?", "Discuss doing business in new market with insurance company", "Discuss doing business in new market with attorney", "Call the government", "Important things for solidify that we should move into the market"
- In use: assignees y (Jack Zoppa, Jordan Lynde, Andrew Bryant, Thomas Hampton), due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-04-21, just over a year; created Jul-Aug 2024)
- Notes: Market-expansion planning checklist (legal, insurance, taxes, vendors, sales strategy, first client). Never progressed past "to do"; shelved project.

### List: Top Owner Leadership Communication (901702945099)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: Property Count (short_text)
- Open tasks: ~12 | Sample: "Tammy Navarre", "Ryan Gillespie", "Lily Philips", "James Urban", "Jay Hwang" (all "to do"; tasks are owner names)
- In use: assignees n, due dates rare (1), priorities n, tags n
- Activity: DEAD (last update ~2024-08-02)
- Notes: CRM-like list of top property owners for leadership outreach, with Property Count field. Duplicate entry (Lily Philips x2). Abandoned ~Aug 2024.

### List: Thomas Checklist (901703006835)
- Statuses (space-default chain): to do → in progress → done → supervisor checked (closed)
- Custom fields: none
- Open tasks: ~9 (all in "done", never closed) | Sample: "Finance SOP's identified and created", "Revenue SOP's identified and created", "Training meetings", "Revenue Manager fully trained on Thomas's role", "Aiza fully trained on Thomas's role"
- In use: assignees n, due dates y (Sep-Oct 2024), priorities n, tags n
- Activity: DEAD (last update ~2024-09-16)
- Notes: One-off knowledge-transfer/offboarding checklist for Thomas (revenue role) — SOPs written, staff cross-trained. Completed Sep 2024 but tasks left in "done" instead of closed.

## Space rollup
- ACTIVE (7): Company Tickets, Property HOA/Community, Company SOP List, Property Detail Master, Skills/Agent Training Idea List, Trellis Implementation Plan, (Passwords folder assumed in use — activity intentionally not measured).
- STALE (2): Software Feature Request List, Daily Touch Point Agenda.
- DEAD (6): Haven Core Processes, Quarterly Ideas, "List", Support Team SOPs, Next Market, Top Owner Leadership Communication, Thomas Checklist.
- Core entities for HavenOS: Property Detail Master (property table + ~48-field schema, relationships to Cleaning Vendors 901002939861, Vendor Contacts List 900200822104, Property HOA/Community 901704755811), Company SOP List (knowledge base with Department/SOP Strength taxonomy), Company Tickets (cross-dept ticketing with Department-routing automation).
- Anomalies: statuses widely used as categories (vendor names, departments, quarters, lifecycle) rather than workflows; duplicate custom fields on PDM; duplicate tasks in SOP/Skills/HOA/Top-Owner lists; property access codes and wifi passwords stored in plain custom fields outside the Passwords folder.
