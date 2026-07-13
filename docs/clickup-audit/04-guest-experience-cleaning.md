# ClickUp Audit — Guest Experience + Haven Cleaning (audited 2026-07-13)

Method notes: `clickup_filter_tasks` with order_by=updated, reverse=false returns newest-first (reverse=true is oldest-first). Open-task counts are from page 0 (page size 100), so 100 = "100+". Last-update dates verified by fetching the top task's `date_updated` for each list. Activity: ACTIVE ≤90d, STALE 90d–1yr, DEAD >1yr or empty.

Workspace-wide observation: a bulk update touched many dormant tasks on 2025-07-24 (identical `date_updated` across lists), so 2025-07-24 timestamps may overstate real activity.

---

# Space: Guest Experience (90030348935)

Space-level custom fields: (none)

## Folder: Guest Communications (90030933387)
Folder-level custom fields: (none)
Folder status group `cat_90030933387` (inherited by Pet Fee Tracker and Left Item Tracker): to review → reconciliated → complete.

### List: Guest Communications Task List (900601916406)
- Statuses: recurring → to do → company tickets → onboarding → offboarding → done (done) → complete (closed)
- Custom fields: Progress of Task (automatic_progress), Department (drop_down) [Haven; Leadership Team; Cleaning; Revenue; Guest Communications; Onboarding; Sales; Maintenance; Runner/Support; Dispatch; Owner Relations; Tendwell; Finance; Stillwater], SOPs (short_text)
- Open tasks: ~25 | Sample: "Monthly Stayfi Check (and collect emails on all properties)" (recurring), "Follow up with Lodo" (recurring, x2 dup), "Weekday Morning Shift Marriott Inquiry Check" (done), "Weekday Morning Shift New Reviews Check" (done)
- In use: assignees y, due dates y, priorities y (nearly all urgent — automation escalates priority at start/due date), tags n
- Activity: ACTIVE (last update 2026-07-13)
- Notes: Standard "department task list" template shared with Dispatch/Cleaning (long list description documents the template: recurring/onboarding/offboarding/company-tickets flow, tasks pushed from "Onboarding Properties", "Offboarding Properties", "Company Tickets" lists; priority auto-escalation automation). Mostly recurring shift-checklist tasks (missed-message checks, review checks, pet fee daily check, unpaid reservation check). One stray "Test" task.

### List: Long-Stay Guests (901702425198)
- Statuses: Open → Closed
- Custom fields: Check-in date (date), Check-out date (date), Listing (short_text), Number of nights (short_text), Checked In Already (checkbox), Touch Up Message Sent (checkbox), Deep Clean Created / Message Sent to Cleaners (checkbox), Maintenance/Runner Check Task Created (checkbox)
- Open tasks: ~12 | Sample: "Stacey Poirier" (Open), "Dale Landeen" (Open), "ZACHARY KASPEROVICH" (Open), "Linda Grosskopf" (Open), "Aritra Moulick" (Open)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-04)
- Notes: One task per long-stay guest; checkbox fields are a mid-stay service workflow checklist (touch-up message, deep clean, maintenance check). Data model = guest + stay dates + service checkboxes.

### List: Escalation (900301690725)
- Statuses: escalation → complete (closed)
- Custom fields: Conduit Message Link (url), Resolved (checkbox), Platform (drop_down) [Google; AirBnB; VRBO; Direct Booking; Marriott; Booking.com; Whimstay], Assign (users), Property the guest is moved to (labels, ~428 options = full property directory "Owner Name + unit#"), Issue (labels, 58 options) [Appliance; Charge Fail; Fireplace; Hot Tub (Cleaning); Hot Tub (Maintenance); Hot Water Issue; HVAC; Leak; Listing Accuracy; Lost Item; Missed Clean; Other; Other Cleaning Issues; Other Maintenance; Parking Pass; Pest; Phone Call Request; Pool; Post Stay Feedback; Power Outage; Property Access Issue; Refund Request; Septic; Wifi/TV; Trash; Cancelation; Mattress; Early check-in Request; Age Requirement; mold; Additional guest request; Third-Party booking; No Water Running; Driveway/Road Issue; Request to replace items; Salt&Pepper/Condiments Request; water smell; firepit; clogged toilet; cleaning feedback; Parking Situation; Discounted Rate; Pet Fee; SuiteOp Portal; Scratches/Dents; Comfortability; Shower; Stained Sheets; Cleaning Feedback Form; Unit Door; Amenity; Pre-Stay Cancelation; Payment Concern; Incorrect Info on SuiteOp; Reschedule Request; washer; Arcade&GameTables; wifi], Check In (date), Check Out (date), Link to Slack Post (url), James Urban 2635 (short_text — stray/junk field), Reservation Status (drop_down) [Pre Stay; Mid Stay; Post Stay; Inquiry], Link to BW/Trellis (url), Guest Issue (list_relationship)
- Open tasks: 100+ | Sample: "Charge fail for 'Deni Pifer' [2026-08-09 to 2026-08-15] for Listing 'Leigh Burch 116-103 (KCity)' 102072" (escalation, x2 dup), "Charge fail for 'Anthony Neu' ... 'Stephanie Bowersock 658 (SCounty)'" (escalation, x3 dup), plus occasional manual guest-name tasks ("Taylor Smith" tagged `lost item`, "Annika Glavan" tagged `trash`)
- In use: assignees n, due dates n, priorities n, tags y (occasional: lost item, trash)
- Activity: ACTIVE (last update ~2026-07-10; new charge-fail tasks arriving continuously)
- Notes: The core guest-issue escalation queue. Currently flooded by auto-created tasks from Hostaway "charge fail" notification emails (task description = raw Hostaway email; heavy duplication — same charge fail creates 2-8 tasks; even a "Learn more about our updated Terms of Service" email leaked in). Issue taxonomy + Reservation Status + property directory labels ARE the escalation data model. Links out to Slack, Conduit, and Breezeway/Trellis.

### List: Transferred Guests (901702930092)
- Statuses: to review → wok in progress [sic] → complete (closed)
- Custom fields: Reservation ID-Original Booking (short_text — exists TWICE, once with trailing space), Conduit Message Link (url) AND Conduit Message Link (short_text) (duplicate name, two types), Reservation ID-New Booking (short_text), Original Property (short_text), Property Guest is moved to (labels, 25 options = other property managers/exits) [Avada; Bear Tracts; Bear Camp; Beyond Expectations; AvantStay; Compass Properties; StaySimpli; Cabins4You; Cabins USA; American Patriot; Timber Tops; Auntie Belham's; Summit Cabin Rentals; Mt Laurel Chalets; Peak Season; Grand Welcome; EdenCrest; Jackson Mountain Homes / Vtrips; Colonial Properties; Short Term Coop; Self Managing; Selling; Long Term Rental; Other PM; Walter Franey 2170], Property the guest is moved to (labels, 428 property options — shared field with Escalation), Date They Are Transferred (date), Check In (date), Check Out (date), Booking Platform (drop_down) [Airbnb; VRBO; Booking.com; Marriott; Google; Direct Booking; Whimstay; Hopper]
- Open tasks: ~4 | Sample: "Kim Stuart", "Austin Fugate", "Carolina Tercero Varela", "Olivia Ferguson" (all to review)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-05-27)
- Notes: Tracks guests relocated to a different unit (internal 428-property labels field) or to an external PM (25-option field). Several duplicated/legacy fields — needs schema cleanup when replicating.

### List: SuiteOp Reviews Less Than 5 Stars (901704667028)
- Statuses: reviews → in progress → overdue → done (done) → done & hide (closed)
- Custom fields: Rating Left by the Guest (emoji/rating, 4 stars max, ⭐), Conduit Message Thread of the Guest (short_text), Review Left by the Guest (text), Property the guest is moved to (labels, 428 — shared field), Issue (labels, 58 — shared with Escalation), Guest Name (short_text), Property Name (list_relationship), Recommendations (text)
- Open tasks: 0 (100+ closed) | Recent closed sample: "J Kirby Brown", "James Dawahare", "Jessica Chambers", "Stephanie Thomas", "Julie Hess" (all done & hide)
- In use (closed sample): assignees y, due dates y (single bulk date), priorities occasional, tags y ("not processed")
- Activity: DEAD (entire list bulk-closed 2025-04-21, most tagged "not processed"; no activity since)
- Notes: Form-fed review triage per list description ("Guest Messaging manually fills out the review form daily", assign to account manager, due 1 week, overdue automation). Retired ~April 2025.

### List: Guest Relations Refund (901711193309)
- Statuses: to review → work in progress → complete (closed)
- Custom fields: Reservation ID-Original Booking (short_text, trailing-space name), Cleaning Fee Refund (no $ sign) (short_text), Check-in date (date, shared), Why was this refund given? (drop_down) [HVAC Issue; Hot Tub Issue; Pool Issue; Cleaning Issue; Other Maintenance Issue; Beyond Our Control/Weather; Overall Satisfaction], Property the guest is moved to (labels, 428 — shared), Check In (date), Refund Amount Source (drop_down) [Base Rate; Cleaning Fee; Base Rate & Cleaning Fee], Base Rate Refund (no $ sign) (short_text — exists TWICE, trailing-space dup), What is the total amount refunded? (currency USD), Check Out (date), What platform was this refund issued on? (drop_down) [AirBNB; VRBO; Booking.com; Marriott; Direct Booking Website; Google; Whimstay; Hopper]
- Open tasks: 100+ (all "to review") | Sample: "Sharon Joseph", "Randy Crews", "Kevin and Laurie Oakley", "Larry Everett", "Michael Headrington"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update 2026-07-13, new entries daily)
- Notes: Refund ledger — question-style field names strongly suggest a ClickUp Form intake. Task per refunded guest; reason/source/platform/amount are the data model. Duplicate guest entries occur (same guest 2-3x). Nothing ever moves past "to review" — used as a log, not a workflow.

### List: Instacart Order Tracking (901712666412)
- Statuses: for tracking → reconciliated → complete (closed)
- Custom fields: Items Ordered (short_text), Order Date (date), Property Name (short_text)
- Open tasks: 100+ (all "for tracking") | Sample: "Hair Dryer", "Broom", "AA batteries", "broom", "New Coffee Maker (Drip/Regular)"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-12)
- Notes: Purchase log for guest-facing supply orders (task name = items; fields = items/date/property) awaiting reconciliation. Minimal 3-field data model.

### List: Pet Fee Tracker (901713607185)
- Statuses (inherited from folder): to review → reconciliated → complete (closed)
- Custom fields: Slack Link (short_text), Slack/Airbnb/Hostaway Link (short_text), Check-in date (date), Check-out date (date), Check In (date — third date field, shared with Escalation), Platform (drop_down #1) [Google; AirBnB; VRBO; Direct Booking; Marriott; Booking.com; Whimstay], Platform (drop_down #2) [Airbnb; VRBO; Booking.com; Marriot; Direct Booking; Google], Platform (drop_down #3, shared w/ Left Item Tracker) [Airbnb; VRBO; Booking.com; Marriott; Direct Booking; Whimstay; Google; Hopper], Cleaners (drop_down) [BLESSED; EASYBNB; ELAINY; ELITE CABIN; MADERS; TENDWELL; TURNOVER; OGLES; ADAM], Number of Pets (number), Comment (short_text), Guest Name (short_text), Property Name (short_text), Pet Fee Amount (short_text) AND Pet Fee Amount (currency USD) — duplicate, Payment Status (drop_down) [PAID; NOT PAID; NA]
- Open tasks: ~33 (all "to review") | Sample: "Dylan Robinson 3738", "Brian Hopp 649", "John Bryan 4144", "Lionel Li 1113", "Matthew Long 1363"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-07)
- Notes: Task name = property; tracks unpaid pet fees per reservation. THREE duplicate "Platform" dropdowns and duplicate Pet Fee Amount (text vs currency) — consolidate in HavenOS. Cleaners dropdown mirrors the cleaning-vendor roster.

### List: Left Item Tracker (901713608727)
- Statuses (inherited from folder): to review → reconciliated → complete (closed)
- Custom fields: Slack Link (short_text), Check-in date (date), Check-out date (date), Cleaners (drop_down) [BLESSED; EASYBNB; ELAINY; ELITE CABIN; MADERS; TENDWELL; TURNOVER; OGLES; ADAM], Comment (short_text), Guest Name (short_text), Platform (drop_down) [Airbnb; VRBO; Booking.com; Marriott; Direct Booking; Whimstay; Google; Hopper], Amount To Be Paid by Guest (currency USD) AND Amount To Be Paid by Guest (short_text) — duplicate, Payment Status (drop_down) [PAID; NOT PAID; NA]
- Open tasks: ~13 (all "to review") | Sample: "Raman Gurai 1118", "Amit Chowdhary 770", "Lou and Elva Romano 25", "David Sussman 3759", "Brian Hopp 649"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-07)
- Notes: Lost-and-found return-shipping charge tracker; task descriptions carry amount/payment status text (automation-written). Same schema family as Pet Fee Tracker (shared field IDs).

### List: Other Cleaning Extra Charges (901714550864)
- Statuses: to review → in progress → completed (closed)
- Custom fields: Payment Status (drop_down A) [Paid; Pending; Failed] AND Payment Status (drop_down B, shared) [PAID; NOT PAID; NA] — duplicate, Slack Link (short_text), Invoice Date (date), Cleaners (drop_down) [BLESSED; EASYBNB; ELAINY; ELITE CABIN; MADERS; TENDWELL; TURNOVER; OGLES; ADAM], Notes (text), Check-out date (date), Check Out (date) — duplicate, Charge Date (date), Cleaner (drop_down, unconfigured placeholder) [Option 1; Option 2], Comment (short_text), Guest Name (short_text), Charge Type (AI-categorized drop_down, prompt "Categorize the type of extra charge for cleaning.") [Standard Charge; Deep Cleaning Charge; Urgent Service Charge; Additional Supplies Charge; Travel Fee], Charge Amount (currency USD), Property Name (short_text), Online Jobs profile (url — stray), 
- Open tasks: ~14 | Sample: "Extra Cleaning fee" (to review), "Trip Fee" (to review), "Trip fee: Additional Services Required: 118-3 Linen delivery..." (to review), "Extra Cleaning (reason not specied)" (to review), "( $25 + $25) charge. Excessive Trash Pick-up + Trip Fee" (to review, high)
- In use: assignees n, due dates n, priorities y (normal/high/urgent), tags n
- Activity: ACTIVE (last update ~2026-07-01)
- Notes: Uses a custom task type ("Item"). Charge Type is an AI auto-categorization field. Several stray/duplicate fields (unconfigured "Cleaner", "Online Jobs profile").

## Folder: Dispatch (90031092983)
Folder-level custom fields: Platform Links From: (short_text) — inherited by every list in this folder.
Folder status group `cat_90031092983` (inherited by Major Amenity Issues, Internal Team Contact Information, Severe Ladybug Infestation): in progress → done (done) → complete (closed).

### List: Dispatch Task List (900601916383)
- Statuses: recurring → to do → company tickets → onboarding → offboarding → done (done) → complete (closed)
- Custom fields: Department (drop_down, shared 14 options), Platform Links From: (folder), SOPs (list_relationship → Company SOP List 900301513938), SOPs (short_text, shared)
- Open tasks: 100+ (most in "done" but not closed) | Sample: "Update Pool Thermostat Settings (November to HEAT, May to COOL)" (recurring), "Runner Scheduling" (recurring), "Yale Lock Check (Battery and Status)" (recurring), "Send out 2pm alert message to cleaners" (recurring), "Weekend Assigning of Unassigned Task in Breezeway" (recurring)
- In use: assignees y, due dates y, priorities y (urgent), tags n
- Activity: ACTIVE (last update ~2026-05-02)
- Notes: Same department-task-list template as Guest Communications Task List. Recurring dispatch ops: Breezeway task assignment/QC, Yale lock battery checks, invoice upload/check, runner scheduling. Large residue of done-but-unclosed recurring instances back to 2023.

### List: Invoice System (901002391617)
- Statuses: invoice queue → bill.com updated (whaley property management only) → push to dext → push to divvy (cams) → do not pay (done) → complete (closed)
- Custom fields: INVOICE # (short_text), Vendor (list_relationship → Vendor Contacts List 900200822104), Breezeway Link (url), Invoice link (url), Platform Links From: (folder), Project/Subbed Out Issue (list_relationship → "Project Management + Subbed Out Issues List" 900101727880), Price (currency USD)
- Open tasks: ~73 | Sample: "David Sussman 3759" (invoice queue), "Cheryl Draper 723" (invoice queue), "Ricardo Robles 1254" (invoice queue), "Corby Leach 1547" (invoice queue), "Erica Sadler 1625" (invoice queue)
- In use: assignees partial (Camille Erese on processed items), due dates y, priorities n, tags n
- Activity: ACTIVE (last update 2026-07-13; batches added daily)
- Notes: Central maintenance-invoice pipeline. Task name = property; statuses encode the accounting routing (Dext vs Divvy vs bill.com). Relationships to the Vendor directory and Project/Subbed-Out issues are key foreign keys for HavenOS. "do not pay" is a done-type parking status with old disputed invoices.

### List: Major Amenity Issues (901705090392)
- Statuses (inherited from folder): in progress → done (done) → complete (closed)
- Custom fields: Date When Issue Was Reported (date), Issue (drop_down) [HVAC; Hot Tub; Pool/Pool Heater; Fireplace; Hot Water; Plumbing; Electrical; No Water/Water Smell; Roof Leak; Wifi; Gas Smell; Flooring; leak], Platform Links From: (folder), Link to Slack Post (url), Property Name (short_text, shared), Link to BW/Trellis (url)
- Open tasks: ~90 | Sample: "Mehrnaz Mortazavi 1909" (in progress), "Priya Dhawan 2534" (done), "Lindsey Burch 110-B" (in progress), "Terry Reeves 830" (in progress), "Earl Hodges 513-3" (in progress)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-05-04)
- Notes: Property-level major amenity outages (task = property). Issue dropdown is a cleaner subset of the Escalation taxonomy. Links to Slack + Breezeway/Trellis.

### List: Lawncare Task List (901702536412)
- Statuses: to do → in progress → done (done) → complete (closed)
- Custom fields: Lawn Care (short_text), Notes (text), Address (short_text) AND Address (text) — duplicate, Platform Links From: (folder), Schedule (date), Scheduling (short_text), Vendor (list_relationship → Vendor Contacts List), Price (currency USD)
- Open tasks: 100+ (all "to do") | Sample: "Steve Hoggle 1616", "Wayne Flatt 536", "Stephen Fu 2107", "Joey Henshaw 2420", "Abe Draper 723"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-10-22; tasks bulk-created 2024-05)
- Notes: One task per property with lawncare vendor/price/schedule — a property-attribute table frozen since 2024.

### List: Internal Team Contact Information (900601479299)
- Statuses (inherited from folder): in progress → done (done) → complete (closed)
- Custom fields: Notes (text), Department (drop_down, shared 14 options), Platform Links From: (folder), Contact Method (drop_down) [Open Phone; Slack; Submission Form], Phone # (short_text)
- Open tasks: ~19 | Sample: "Charles Enao", "Andrew Bryant", "David Bradford", "Jonathan Francisco", "Christine Tupas"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-07-24, likely bulk touch; created 2023)
- Notes: Employee contact directory (one task per person), not a workflow. Statuses meaningless ("in progress" = default).

### List: Severe Ladybug Infestation - 2024 Properties (901703555998)
- Statuses (inherited from folder): in progress → done (done) → complete (closed)
- Custom fields: Platform Links From: (folder only)
- Open tasks: ~11 | Sample: "Nathan Sukhia 843", "Nathan Jobe 4515", "Lionel Li 1113", "Eric Adams 814", "Scott Meyers 701"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE→DEAD (created Oct 2024; only the 2025-07-24 bulk touch since)
- Notes: One-off 2024 incident punch list of affected properties. Historical only.

### List: Vendor Contacts List (900200822104)
- Statuses: to do → active → non-active → done (done) → complete (closed)
- Custom fields: Contact # (phone), Capabilities (labels, 50 options) [Hot Tub; Pools; HVAC; Electrical; Fireplace; Handyman; Pressure Washing; Appliances; Landscaping; Theatres; Elevator; Fire Extinguisher; Fire Inspections; Gas Log Maintenance; Furniture; General Maintenance; Plumbing; PTAC; Mattress; Couches; Painting; Pest Control; Preventative Maintenance; Propane Tank Refills; Septic; Wildlife Control; Tree Removal; Video Games; Water Supply; Bear Cans; Roofing; RV's; Locksmith; Glass; Well; Flooring; General Contractor; City Govt Inspector; Staining; Remediations/Molds; Repair/Remodel; Swimspa; Lawn Care; Gutter Cleaning; wif [sic]; Coffee; Projectors; Linen; Hospitality Supplies; WiFi], Notes (text), Vendor Name (short_text), COI (PDF) (attachment), Days Available (short_text), How to book (text), Email (short_text), Vendor Rating (emoji, 5 stars ⭐), Platform Links From: (folder), Contact Method (short_text), Certificate of Insurance (text), Door Code (number)
- Open tasks: 100+ | Sample: "Power Pest Solutions" (to do), "Raymond's Pest Control" (to do), "Knox Pest Management @ 865-356-0465" (to do), "Yard Goat Lawncare" (to do), "Aaron Lowery" (to do)
- In use: assignees n, due dates n, priorities n, tags y ("weekend availability")
- Activity: ACTIVE (new vendors added July 2026)
- Notes: Master maintenance-vendor directory; status = lifecycle (active/non-active), star rating semantics documented in list description (5=top tier … 1=black listed). Referenced via list_relationship from Invoice System and Lawncare. This is a core HavenOS entity table.

### List: Vendor Survey List (901702955939)
- Statuses: to do → in progress → done (done) → complete (closed)
- Custom fields: Additional Comments (text), Communication (emoji 5⭐), Representative's Name (short_text), Support and Assistance (emoji 5⭐), Payment Process (emoji 5⭐), Platform Links From: (folder), Areas for Improvement (text), Professionalism (emoji 5⭐), Overall Satisfaction (emoji 5⭐)
- Open tasks: ~4 | Sample: "D & J Enterprises, Inc", "Cove Creek Plumbing LLC", "Mandy's Furniture Repair", "Renew 4 U Renovations" (all to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update 2024-09-27; tasks created by ClickBot)
- Notes: Form intake (ClickBot creator = ClickUp Form) for vendor satisfaction surveys; abandoned after 4 submissions in Sep-Oct 2024.

### List: Properties with Amenity Issues (901704427928)
- Statuses: ongoing issues → completed → in progress → done (done) → complete (closed)
- Custom fields: Breezeway Link (short_text), Issue (short_text), Listing Edited Back (checkbox), Guest Have Been Informed (checkbox), Platform Links From: (folder), Listing Have Been Updated (checkbox)
- Open tasks: 1 | Sample: "Leo Shum 4150" (ongoing issues)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2025-12-02)
- Notes: Tracks listing-copy updates while an amenity is broken (update listing → inform guests → edit back). Nearly empty; overlaps Major Amenity Issues.

### List: Ed Zorn 1531 (901706563419)
- Statuses: invoice queue → push to dext → push to divvy (jez) → do not pay (done) → complete (closed)
- Custom fields: Platform Links From: (folder only)
- Open tasks: 2 | Sample: "Krista Fontana 2779" (invoice queue), "Eric Adams 814" (invoice queue)
- In use: assignees n, due dates y, priorities n, tags n
- Activity: STALE (last update ~2025-10-23)
- Notes: A one-off clone of the Invoice System for a specific property/owner ("jez" divvy routing instead of "cams"). Oddity — likely obsolete.

## Folder: Miscellaneous Guest Comm (90060893925)
Folder-level custom fields: (none). No lists — empty folder.

## Folder: Miscellaneous Dispatch (90101379563)
Folder-level custom fields: (none)

### List: W9's 2023 (901000975263)
- Statuses: to do → added to tax software → added/wrong name → done (done) → "Open" (closed — misnamed closed status)
- Custom fields: (none)
- Open tasks: ~13 | Sample: "DBA Appalachian Landscaping (Gary Franklin)" (done), "Kenny Howard" (done), "R& M Plumbing" (done), "All Star" (to do), "Hylton Air" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (2023 tax-season artifact)
- Notes: One task per vendor W9 to enter into tax software. Historical only.

## Folder: Inventory Tracking (90170195594)
Folder-level custom fields: (none)

### List: Inventory Tracking List (901700359341)
- Statuses (inherited from SPACE default group): to do → done (done) → complete (closed)
- Custom fields: (none)
- Open tasks: ~8 | Sample: "Portable AC #2", "Portable AC #1", "Mini-Fridge #4", "Mini-Fridge #3", "Mini-Fridge #2" (also Dehu #1/#2)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update 2023-12-04)
- Notes: Loaner-equipment register (portable ACs, mini-fridges, dehumidifiers) with no custom fields — despite being in the "pay special attention" tracker set, there is no data model here beyond task names; any detail lives in descriptions/comments. Do not confuse with the active Linen inventory lists in Haven Cleaning.

---

# Space: Haven Cleaning (44406029)

Space-level custom fields: (none)
Space default status group `proj_44406029`: to do → complete (used by Linen Inventory). All "root" lists actually live in hidden folders (ClickUp folderless-list containers).

### List: Requests (900301229436)
- Statuses: guest messaging → maintenance → accounts → sales/onboarding → finance → revenue → leadership team → done → complete (closed)
- Custom fields: Person Requesting (users)
- Open tasks: 0 (0 even including closed)
- In use: n/a
- Activity: DEAD (empty — structure only)
- Notes: Interdepartmental request router where status = destination department. Never used (or fully purged). The status-as-routing pattern is worth noting for HavenOS.

### List: Cleaning Task List (900601916374)
- Statuses: recurring → cleaning to do list → company tickets → onboarding → offboarding → done (done) → complete (closed)
- Custom fields: Assign (users), Department (drop_down, shared 14 options), SOPs (short_text, shared)
- Open tasks: ~24 | Sample: "Sending Weekly Cleaning Score" (recurring), "SuiteOp - Offboarded properties" (recurring), "Publish Invoices" (done), "Handle Aircover claims on Airbnb" (recurring), "AC FILTER UPDATE" (recurring)
- In use: assignees y, due dates y, priorities y (urgent/high/normal), tags n
- Activity: ACTIVE (last update ~2026-05-18)
- Notes: Cleaning department instance of the standard department-task-list template (list owner David Bradford). Recurring ops: linen inventory sheet updates, cleaner alerts, invoice itemization in Dext, Aircover claims, cleaning scorecard.

### List: Linen Inventory (901002850180)
- Statuses (space default): to do → complete (closed)
- Custom fields (all number): King Fitted Sheets, King Flat Sheets, King Top Sheets, King Comforter, King Pillowcases, Queen Fitted Sheets, Queen Flat Sheets, Queen Top Sheets, Queen Comforters, Queen Pillowcases
- Open tasks: 2 | Sample: "Tendwell" (to do), "Blessed" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update 2025-07-21)
- Notes: Current linen stock per cleaning company — one task per company, quantities in number fields. Only King/Queen fields (no Twin/towels — those live in the Damaged Linen Form / Linen Count schema).

### List: 📋Damaged Linen Form (901702882210)
- Statuses: reported damaged (open) → q3'24, q4'24, q1'25, q2'25, q3'25, q4 2025, q1'26 (ALL done-type — quarterly archive buckets) → complete (closed)
- Custom fields (23; shared field IDs with Linen Count): Cleaning Company (short_text), Today's Date (date), Order Date (date), and number fields: King Fitted Sheets, King Flat Sheets, King Top Sheets, King Comforter, King Pillowcases, Queen Fitted Sheets, Queen Flat Sheets, Queen Top Sheets, Queen Comforters, Twin Fitted Sheets, Twin Flat Sheets, Twin Top Sheets, Twin Comforters, Standard Pillowcases, Bath Towels, Hand Towels, Wash Clothes, Kitchen Towels, Hot Tub/Pool Towels, Bath Mats
- Open tasks: ~61 (6 in "reported damaged", rest parked in quarterly done-buckets) | Sample: "Form Submission - #2026-03-31T13:50:21-04:00" (reported damaged), "Form Submission - #2026-02-27..." (reported damaged), "Form Submission - #2026-02-17..." (reported damaged), "Form Submission - #2026-02-16..." (reported damaged), "Form Submission - #2026-02-10..." (reported damaged)
- In use: assignees y (auto-assigned Dara Tejada + Jonathan Francisco III; earlier Andrew Bryant), due dates n, priorities rare, tags n
- Activity: STALE/borderline-ACTIVE (last submission 2026-03-31, ~104 days ago; steady quarterly cadence since Aug 2024)
- Notes: Definite ClickUp Form intake (ClickBot creator, "Form Submission - #<timestamp>" names). Damaged-linen counts by type + cleaning company; statuses used as quarterly reporting buckets rather than workflow. This form's 23-field schema IS the linen data model.

### List: Linen Count (901704477181)
- Statuses: current linen count (open) → complete (closed)
- Custom fields: identical 23-field schema as 📋Damaged Linen Form (same field IDs — shared/copied schema)
- Open tasks: 0 (19 complete) | Recent closed sample: "Form Submission - #2025-09-27..." , "Form Submission - #2025-08-21...", "Form Submission - #2025-04-14...", "Form Submission - #2025-08-01...", "Form Submission - #2025-04-07..."
- In use: assignees y, due dates n, priorities rare, tags n
- Activity: STALE (last close ~2026-02-05; submissions overlap heavily with Damaged Linen Form entries — several identical timestamps)
- Notes: Form-fed periodic linen count snapshots; many entries appear to be copies of Damaged Linen Form submissions. Everything archived to complete.

### List: Cleaning Vendors (901002939861)
- Statuses: available → active partner → old partner → cleaners to avoid → complete (closed)
- Custom fields: Owner (short_text), Assistant Managers (text), Email (short_text), Phone # (short_text, shared), Regions (short_text), Property Count (number), COI (PDF) (attachment), Copy of Insurance (attachment), Signed Cleaner SOW (attachment), Certificate of Insurance (text), Test Bed Calcuator (formula, returns null — broken/abandoned)
- Open tasks: ~19 | Sample: "Tendwell Cleaning" (active partner), "Hybrid" (available), "Blessed Cleaning" (active partner), "Hybrid (Moving Mountains)" (active partner), "Hybrid (SmokyMtnCabinGroup Wiwczaroski)" (active partner)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update 2026-07-13)
- Notes: Cleaning-company directory; status = partnership lifecycle (incl. "cleaners to avoid" blacklist). Attachment fields hold compliance docs (COI, SOW). Roster matches the "Cleaners" dropdown used across Guest Experience trackers — in HavenOS this should be one canonical entity.

### List: Cleaning Invoice System (901705077594)
- Statuses: invoice queue → push to divvy (aiza) → complete (closed)
- Custom fields: Invoice # (short_text), Vendor (short_text) AND Vendor (drop_down) [Adam Shaffer; Blessed; Knoxville Haven; Elite Cabin Care; Keep It Clean; Ogles; Tendwell; Teresa Mader; Turnover Pro; FnF; 4 Seasons Pools & Spas] — duplicate name, Invoice Link (url), Price (currency USD, same shared field as Dispatch Invoice System)
- Open tasks: 3 | Sample: "Adam Shaffer" (invoice queue), "Trenton Ogles" (invoice queue), "Blessed" (invoice queue)
- In use: assignees n, due dates y, priorities n, tags n
- Activity: ACTIVE (last update ~2026-06-23)
- Notes: Cleaning-side twin of the Dispatch Invoice System (simpler: one Divvy route). Vendor dropdown duplicates the Cleaning Vendors roster instead of using a relationship.

---

## Cross-cutting observations for HavenOS replication
1. Shared field IDs act as global entities: Department (14 depts), "Property the guest is moved to" (428-property directory), Issue (58-item taxonomy), Cleaners (9 cleaning companies), Payment Status (PAID/NOT PAID/NA), Price (currency), Check-in/Check-out dates. These recur across lists and should be normalized tables/enums.
2. Heavy duplicate-field debt: Pet Fee Tracker has 3 "Platform" dropdowns; amount fields exist as both short_text and currency in Pet Fee/Left Item/Refund lists; duplicated Address, Vendor, Payment Status, Reservation ID fields. HavenOS should pick one canonical field each.
3. Form-driven intake lists (ClickBot creators / question-style fields): 📋Damaged Linen Form, Linen Count, Vendor Survey List, SuiteOp Reviews, and likely Guest Relations Refund + Other Cleaning Extra Charges.
4. Automation-driven intake: Escalation receives Hostaway charge-fail emails (with rampant duplicates); Left Item Tracker descriptions are automation-written; department task lists auto-escalate priority.
5. Statuses are frequently used as categories/buckets, not workflow: quarterly buckets (Damaged Linen Form), accounting routes (Invoice Systems), department routing (Requests), vendor lifecycle (Vendor lists).
6. Dead/stale lists not worth migrating as live features: Lawncare Task List, Vendor Survey List, W9's 2023, Inventory Tracking List, SuiteOp Reviews, Severe Ladybug Infestation, Ed Zorn 1531, Requests (empty), Miscellaneous Guest Comm folder (empty).
