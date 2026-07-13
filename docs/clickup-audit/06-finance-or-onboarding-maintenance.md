# ClickUp Workspace Audit — Finance / Owner Relations / Onboarding Team / Maintenance / Exterior Property Maintenance / Insurance
Audit date: 2026-07-13. Read-only. Method note: `clickup_filter_tasks` with order_by=updated and reverse=false returns most-recently-updated first (reverse=true was verified to return oldest-first, contrary to the briefed procedure); last-update dates were confirmed by fetching the top task's `date_updated`.

# Space: Finance (54284436)
Space-level custom fields: (none)

## Folder: Owner Payout Items (90050851922)
Folder-level custom fields: (none)

### List: Request to Pay Owner (900501555881)
- Statuses: urgent → high priority → medium priority → low priority → done (done-type) → don't use (closed)
- Custom fields: Amount To Be Paid by Guest (currency USD, 2 dp)
- Open tasks: 2 | Sample: "Gregg Bolton 1607" (done), "John Young 2512" (done)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-06-26)
- Notes: One record = a one-off payout owed to an owner (task name = owner name + property number; description holds the reason, e.g. "Refund of Lawn Care Charge", "Owner Payout Differential"). Statuses are priority buckets (space-default status set), not workflow stages. Only 2 records ever, both June 2023 — abandoned.

## (space root)

### List: Finance Task List (900602029895)
- Statuses: recurring → to do → company tickets → onboarding → offboarding → complete (closed)
- Custom fields: Department (drop_down: Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater), SOPs (short_text)
- Open tasks: ~59 | Sample: "Taxes for Municipalities to be paid (Online)" (recurring), "Remote Payroll 2" (recurring), "Stateside Payroll 2" (recurring), "Add credits to the file after owner statement creation…" (recurring), "Hold Jessica Slabaugh Payout" (recurring)
- In use: assignees y, due dates y, priorities y (mostly urgent — automation escalates priority at start/due date), tags y (monthly, weekly, payroll, bill.com, quickbooks, owner statement, sop to review, etc.)
- Activity: ACTIVE (last update ~2026-04-17)
- Notes: Department task-list template instance (same pattern exists per department). Long list description documents the model: statuses distinguish task origin (recurring vs pushed from "Onboarding Properties" / "Offboarding Properties" / "Company Tickets" lists); automations auto-assign Department dropdown and escalate priority; "done" reserved for onboarding/offboarding tasks so they stay visible in source lists. Backbone of recurring finance ops (payroll, owner payouts on 13th/25th, tax filings, closing books, reconciliations).

### List: Chargeback (901704016556)
- Statuses: urgent → high priority → medium priority → low priority → done → don't use (closed) [space-default set]
- Custom fields: (none)
- Open tasks: 0 (also 0 including closed) | Sample: n/a
- In use: n/a
- Activity: DEAD (completely empty)
- Notes: Empty shell list; chargeback work is actually handled as a recurring task ("Check and Clear Stripe Chargeback/Disputes") on Finance Task List.

### List: Damage Protection Fee Claims (901708334664)
- Statuses: reported → more info needed → approved → paid/added to os → denied (done-type) → added to our books (closed)
- Custom fields: Slack Link (short_text); SuiteOp Damage Waiver Purchased (drop_down: No, Yes); Estimated Payout (currency USD); Damage Protection Fee Charged on Booking? (drop_down: Yes, No); Incident Date (date) — appears TWICE as date type plus once as short_text (3 duplicate fields); Guest Name (short_text, duplicated x2); Days Available (short_text); Aircover/B.com Claim Filled (drop_down: Yes, No, Not Yet); Link to Slack Post (url); AirCover/Booking.com Claim Filed (drop_down: "Yes ", "No ") + another duplicate as short_text with AI-fill prompt ("Yes and No"); Property Name (short_text, duplicated x2)
- Open tasks: ~76 | Sample: "Guest smoked inside the home… $500 penalty…" (approved), "Excessive trash left behind requiring additional cleaning." (more info needed), "Stained linens requiring replacement" (more info needed), "Damaged lake float" (more info needed), "Broken TV - looks like it was punched or elbowed" (paid/added to os)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: ACTIVE (last update 2026-07-13 — same day as audit)
- Notes: KEY WORKFLOW LIST. One record = a damage/extra-cleaning claim against a guest's damage-protection fee: task name is a free-text incident description, custom fields capture property, guest, incident date, whether the damage-protection fee/SuiteOp waiver was in place, whether an OTA (AirCover/Booking.com) claim was filed, estimated payout, and Slack evidence link. Uses a custom task type "Claim" (custom_item_id 1001). Looks form/automation-fed (no assignees, uniform shape, some near-duplicate records from cleaner reports). Heavy field duplication (Incident Date x3, Guest Name x2, Property Name x2, AirCover claim x3 incl. one AI field) — needs consolidation in HavenOS. Status flow = claim adjudication pipeline ending in owner-statement payout ("paid/added to os") or books entry.

### List: Safely Properties & Fees (901708915580)
- Statuses: active on safely → to activate on safely → to add fees → opted out (done-type) → closed/offboarded (closed)
- Custom fields: Linen Fee Added [Airbnb (15.5%↑)] (currency USD); Direct (currency USD); Airbnb (15.5%↑) (currency USD); Marriott (currency USD); Booking.com (currency USD); VRBO (currency USD); Current Cleaning Fee (currency USD); Hostaway ID (short_text)
- Open tasks: 100+ (full page) | Sample: "Annie Wang 904" (to activate on safely), "Jeff Albaum 215" (to activate on safely), "Jeff Winberry 2627" (to activate on safely), "Daniel Shepherd 1931" (to activate on safely), "Raman Gurai 1118" (to activate on safely)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-01-06)
- Notes: TRACKER/ROSTER list. One record = a property (owner name + unit number) being enrolled in Safely damage-protection; fields hold the per-channel damage-protection fee amounts (Direct/Airbnb/Marriott/Booking.com/VRBO), current cleaning fee, added linen fee, and Hostaway listing ID. Status = enrollment state. Bulk-created early Jan 2026, largely untouched since.

### List: 2025 clean up (901712283314)
- Statuses: urgent → high priority → medium priority → low priority → done → don't use (closed) [space-default set]
- Custom fields: (none)
- Open tasks: 3 | Sample: "June - Dec 2025 referral fee moved from revenue to expense" (high priority), "We showed income for Jessica S in 2024 that we ended up not collecting…" (high priority), "July - Dec 2025 Compare all revenue items from QBO and Hostaway and Manual owner statements" (high priority)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-03-26)
- Notes: Ad-hoc year-end bookkeeping cleanup punch list (QBO/Hostaway reconciliation items). Likely one-off; no data model.

# Space: Owner Relations (54285553)
Space-level custom fields: Last Day with Haven (short_text)

## (space root)

### List: Offboarding Properties (900600755484)
- Statuses: offboarding → done (done-type) → do not use (closed)
- Custom fields: Property Guest is moved to (labels: 25 options — competitor PMs Avada, Bear Tracts, Bear Camp, Beyond Expectations, AvantStay, Compass Properties, StaySimpli, Cabins4You, Cabins USA, American Patriot, Timber Tops, Auntie Belham's, Summit Cabin Rentals, Mt Laurel Chalets, Peak Season, Grand Welcome, EdenCrest, Jackson Mountain Homes/Vtrips, Colonial Properties, Short Term Coop, plus outcomes Self Managing, Selling, Long Term Rental, Other PM, and one stray property label); Created By (users, multi); Old Dont Use OffB Department (drop_down, legacy: Owner Relations, Cleaning, Maintenance, Finance + Revenue, Guest Communications, Dispatch, Onboarding, Sale); Old Don't Use Department Responsibility (drop_down, legacy: Accounts, Guest Messaging, Cleaning, Maintenance, Finance, Dispatch); Department (drop_down, shared 14-option company set — see Finance Task List); Related SOPs (tasks relation); OFFBOARDING DATE (date); SOPs (short_text); [space] Last Day with Haven (short_text)
- Open tasks: 100+ (full page; includes many "done"-status records kept visible) | Sample: "Catherine Nelms 1274" (offboarding), "Jamie Braddy 810" (offboarding), "Lindsey Smith 2833" (offboarding), "Mike Nahom 622" (offboarding), "Greg Forderhase 1354" (offboarding)
- In use: assignees y, due dates y (due date = last day of Haven management), priorities y (urgent), tags y (property-nickname tags + per-step tags like "offboard vendors…", "export reservations from hostaway…")
- Activity: ACTIVE (last update ~2026-07-03)
- Notes: KEY WORKFLOW LIST. One record = a property leaving Haven management (task name = owner + unit). A "Property Offboarding Task" template auto-applies on creation (subtasks per offboarding step), automations push department-tagged subtasks into each department's task list. "Property Guest is moved to" tracks where the owner went (competitor/self-manage/sold/LTR). Legacy "Old Don't Use" department dropdowns still present.

### List: OR Onboarding List (900601999994)
- Statuses: to do → in progress → overdue → done (done-type) → done & hide (closed) [space-default set]
- Custom fields: Completion (automatic_progress, subtask tracking); [space] Last Day with Haven
- Open tasks: 1 | Sample: "Earl Hodges" (done)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-09-04)
- Notes: Legacy hand-off list ("Accounts Onboarding" template auto-applied per new property passed from onboarding to accounts). Superseded; only one residual task.

### List: Project L.C (901702190545)
- Statuses: to do → in progress → overdue → done → done & hide (closed) [space-default set]
- Custom fields: [space] Last Day with Haven only
- Open tasks: 0 (0 including closed)
- Activity: DEAD (empty)
- Notes: Empty shell.

### List: OR Training (901701581858)
- Statuses: to do → in progress → overdue → done → done & hide (closed) [space-default set]
- Custom fields: [space] Last Day with Haven only
- Open tasks: 1 | Sample: "Template" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-01-29)
- Notes: Contains only a "Template" task; abandoned training checklist list.

### List: Weekly Inspection Report & Audit (901702240196)
- Statuses: to do → in progress → for manager review → manager reviewed (done-type) → complete (closed)
- Custom fields: Total # of Inspection (number); PTO? (checkbox); CO-Assignee (short_text); Task Title (drop_down: PM Normal Inspection, PM Mini Inspection, Pre-Owner Stay Walkthrough, Go no Go Template); [space] Last Day with Haven
- Open tasks: 11 | Sample: "June 9 - June 15" (manager reviewed), "June 2 - June 8" (manager reviewed), "May 26 - June 1" (manager reviewed), "May 19 - May 25" (manager reviewed), "May 12 - May 18" (manager reviewed)
- In use: assignees y, due dates n, priorities n, tags y (month tags)
- Activity: DEAD (last update ~2024-06-21)
- Notes: WORKFLOW LIST (defunct). One record = a week of property-manager inspections (task name = week range, e.g. "June 9 - June 15"); manager sign-off flow via "for manager review"/"manager reviewed". All records Mar–Jun 2024; process abandoned mid-2024.

### List: OR Task List (900602029903)
- Statuses: recurring → todo → company tickets → offboarding → or onboarding list → onboarding → inspections this week → done (done-type) → complete (closed)
- Custom fields: Created By (users); Old Dont Use OffB Department (legacy drop_down); Department (shared 14-option drop_down); Related SOPs (tasks relation); SOPs (short_text); [space] Last Day with Haven
- Open tasks: ~22 | Sample: "Daily Listing Suspension Check" (recurring), "Yearly Pool Pass Check" (recurring), "Bi yearly Check for HostAI Knowledge Base" (recurring), "Quarterly Check Airbnb SuperHost Status" (recurring), "Listing Optimization/ Suggestions" (todo)
- In use: assignees y, due dates y, priorities y (urgent/high), tags n
- Activity: ACTIVE (last update ~2026-07-13, driven by "Daily Listing Suspension Check" recurring task; most other items are 2024-era leftovers)
- Notes: Owner Relations instance of the standard department task-list template (same model as Finance Task List, plus an "inspections this week" status). Contains per-person "X's Recurring Tasks" umbrella tasks.

### List: AM Assistants Support Task List (901704320864)
- Statuses: to do → in progress → overdue → done → done & hide (closed) [space-default set]
- Custom fields: Department (shared 14-option drop_down); [space] Last Day with Haven
- Open tasks: 1 | Sample: "Who is ordering replacement items currently? I need this lamp shade at either 768 or 744 replaced." (done)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-03-12)
- Notes: Ad-hoc request inbox for account-manager assistants; barely used.

## Folder: Operations (109458919)
Folder-level custom fields: [space] Last Day with Haven only

### List: Pending Reviews (204357814)
- Statuses: pending review → complete (closed)
- Custom fields: Feedback (labels: Feedback to Guest Messaging/Cleaning/Onboarding/Maintenance/Accounts); Check-in date (date); Star Rating (number); Review Responded (checkbox); Process Errors (labels: Escalation Error(s), BW Task Creation Error(s), Cleaner Communication Error(s), Escalation Manager Error(s), Review Turn Off Error, Communication Error(s), Endorsements Error, Misc Procedure Error(s)); Check-out date (date); Issues (labels, 26 options: Maintenance, Cleaning, Communication, Phone Call, Bugs, Refund Request, Cancellation Request, Lost Item, Parking Pass, Charge Fail/Pre-Auth Fail, Airbnb Support Message, Post Stay Feedback, Recoup, General Question, Negative Review Threat, Age Requirement, trash pickup, Alterations, Propane Request, WIFI issues, General lack of supplies, TV issues, Door code issues, Temperature issues, Cancelation request, Power Outage); Listing (text); Review Contested (drop_down: No Violations, Pending, Removed, Rejected); Update Needed (labels: Haven Update, Guest Update); Hostaway Reservation ID (text); Feedback [second field, person-level] (labels: Feedback to Marshall, Feedback to Andrew, Feedback to Onboarding); [space] Last Day with Haven
- Open tasks: 100+ (full page, all "pending review") | Sample: "Angus Rutherford", "Jolene Little", "Michael Allen", "Amanda Jolley", "Ana Villanueva" (all pending review)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2022-10-10)
- Notes: Legacy 2022 guest-review triage tracker (task = guest name; description scaffold "HA Link / Slack Link / BW Link(s) / Context"). Predecessor of the Review Processing folder — rich taxonomy of issue/error labels worth mining for HavenOS enums, but the list itself is abandoned with 100+ never-closed records.

### List: Pool Cleaning Processing (901703290545)
- Statuses: to do → in progress → complete (closed)
- Custom fields: Location (text); [space] Last Day with Haven
- Open tasks: 5 | Sample: "Re: Pool Service Report for 3/2/2025" (to do), "Re: Pool Service Report for 1/19/2025" (to do), "Re: Pool Service Report for 12/2/2024" (to do, x2), "Re: Pool Service Report for 10/13/2024" (to do)
- In use: assignees n, due dates y, priorities n, tags n
- Activity: DEAD (last update ~2025-03-03)
- Notes: Email-ingestion list — vendor pool-service report emails (Skimmer/Precision Pool Services) auto-forwarded into tasks; "Pool Cleaning Report" template auto-applied. Defunct since March 2025.

## Folder: Review Processing (90170997342)
Folder-level custom fields: Rating Left by the Guest (emoji/rating, 1–4 stars, code_point 2b50); Property the guest is moved to (labels, 428 options = full owner+unit property roster, e.g. "Abe Draper 723" … "Yen Nguyen 413-306")

### List: 📋 Reviews Less Than 5 Stars (901701612400)
- Statuses: reviews → in progress → overdue → done (done-type) → done & hide (closed)
- Custom fields: [folder] Rating Left by the Guest (emoji 1–4⭐); Conduit Message Thread of the Guest (short_text); Review Left by the Guest (text); [folder] Property the guest is moved to (labels, 428 property options — appears misnamed/repurposed here); Issue (labels, 58 options: Appliance; Charge Fail; Fireplace; Hot Tub (Cleaning); Hot Tub (Maintenance); Hot Water Issue; HVAC; Leak; Listing Accuracy; Lost Item; Missed Clean; Other; Other Cleaning Issues; Other Maintenance; Parking Pass; Pest; Phone Call Request; Pool; Post Stay Feedback; Power Outage; Property Access Issue; Refund Request; Septic; Wifi/TV; Trash; Cancelation; Mattress; Early check-in Request; Age Requirement; mold; Additional guest request; Third-Party booking; No Water Running; Driveway/Road Issue; Request to replace items; Salt&Pepper/Condiments Request; water smell; firepit; clogged toilet; cleaning feedback; Parking Situation; Discounted Rate; Pet Fee; SuiteOp Portal; Scratches/Dents; Comfortability; Shower; Stained Sheets; Cleaning Feedback Form; Unit Door; Amenity; Pre-Stay Cancelation; Payment Concern; Incorrect Info on SuiteOp; Reschedule Request; washer; Arcade&GameTables; wifi); Guest Name (short_text); Property Name (list_relationship — relation to a properties list); Recommendations (text); [space] Last Day with Haven
- Open tasks: 100+ (full page) | Sample: "Joseph Day" (overdue), "Heather M" (overdue), "Jacqueline Sampson" (overdue), "Jeanne Rahe" (overdue), "Abigail S" (overdue)
- In use: assignees y (remote team pair), due dates y (1 week after intake), priorities y (urgent via automation), tags n
- Activity: ACTIVE (last update ~2026-06-28)
- Notes: KEY WORKFLOW LIST + FORM INTAKE. One record = a guest review under 5 stars (task = guest name). Per list description: Guest Messaging fills out "the review form" daily; a remote team member assigns to the account manager with a 1-week due date; automation flips overdue. Fields capture star rating, review text, categorized Issue labels, Conduit message thread link, property relation, and recommendations. Many records sit in "overdue".

## Folder: Owner Escalation (90171778523)
Folder-level custom fields: [space] Last Day with Haven only

### List: List (901703125174)
- Statuses: to do → in progress → overdue → done → done & hide (closed) [space-default set]
- Custom fields: [space] Last Day with Haven only
- Open tasks: 0 (0 including closed)
- Activity: DEAD (empty)
- Notes: Empty shell ("Owner Escalation" folder with a single unnamed "List").

# Space: Onboarding Team (54235860)
Space-level custom fields: (none)

## (space root)

### List: Onboarding Properties (217560370)
- Statuses: onboarding → owner relations onboarding → template → ownership → waiting for onboarding → ready to pass → n/a (done-type) → done (done-type) → no longer onboarding (done-type) → do not use (closed)
- Custom fields (many inherited from other scopes/legacy — 21 on tasks): Reservation Status (drop_down: Pre Stay, During Stay, Post Stay); Issues (labels, 38 options: Unit Door, Street Door, Gate Code, Appliance, Fireplace, Hot Tub (Maintenance), No Hot Water, No Water, HVAC, Leak, Pool, Power Outage, Septic Overflow, Other Maintenance, Missed Clean, Mold, Other Reported Cleaning Issues, Hot Tub (Cleaning), Trash Full (Upon Arrival), Dirty Sheets, Dirty Floors, Dust, Towels, Charge Fail, Pre Stay Cancellation, Mid Stay Cancellation, Moving Guest, Early Check In Request, Parking Pass, Refund Request, Post Stay Feedback, Negative Review Threatened, Phone Call Request, Listing Inaccuracy, Other Issue, task, wifi, Refrigerator); Notes (text); SOPs (tasks relation); Platform (drop_down: Airbnb, VRBO, Booking.com, Marriot, Direct Booking, Google); Official Start Date (date); Department (shared 14-option company drop_down); Category (labels: Maintenance, Check In); Link to SOP (short_text); Sub Category (labels: Hot Tub, Pool, HVAC, Unit Door, Street Door, Gate Code); Progress (automatic_progress, x2 duplicates); SOPs (list_relationship → Company SOP List 900301513938); SOPs (short_text). Also stray HR-template fields: Employment Type (drop_down: Regular Full-Time, Project-based, Contract-based, Part-Time, Commission-based); Work Email (email); Job Title (short_text); Work Phone (phone); Supervisor (users); Preferred Tag Name (short_text); Department [second HR variant] (drop_down: R&D, Sales, HR, Accounting/Finance, Marketing, Operations, Engineering)
- Open tasks: 100+ (full page; mostly "done"-status records kept visible; ~20 actively "onboarding") | Sample: "Kelly Armsworth 511" (onboarding), "Philip Graves 857" (onboarding), "Jason Riordan 3825" (onboarding), "Kelly Armsworth 3634" (onboarding), "Mike Householder 1646" (onboarding)
- In use: assignees partially, due dates n (on parent tasks), priorities n, tags y (property-nickname tag per task, "hybrid")
- Activity: ACTIVE (last update 2026-07-13 — same day as audit)
- Notes: KEY WORKFLOW LIST. One record = a property being onboarded (task = owner + unit; "New Property Onboarding Task" template auto-applies with department subtasks; department automations push subtasks to each department task list; priority auto-escalates at due date; "Key Dates" and "New Listing" tags feed calendar and listing-creation views). Status set models the pipeline incl. "ready to pass" (to Owner Relations) and "no longer onboarding" (lost). Also holds template tasks ("Template as of 4/22/26", "OWNER STAY RESERVATION FOR ONBOARDING TEAM") and "Change of Ownership" records. Custom-field surface is polluted by an HR/employee-onboarding template (Employment Type, Work Email, Job Title, Supervisor…) — ignore for the property data model.

### List: Onboarding Task List (900602029853)
- Statuses: recurring → to do → company tickets → misc → onboarding → offboarding → done (done-type) → complete (closed)
- Custom fields: Department (shared 14-option drop_down); SOPs (short_text)
- Open tasks: ~81 | Sample: "Create tasks in Breezeway & Check completed tasks" (recurring), "Check calendars to make sure they are open/closed as needed" (recurring), "Send Onboarding Timeline" (recurring), "Check IPostal" (recurring), "Complete final checks for onboarded properties & pass owners to accounts" (recurring)
- In use: assignees y, due dates y, priorities y (urgent/high), tags n
- Activity: ACTIVE (last update ~2026-07-10)
- Notes: Onboarding instance of the standard department task-list template. ~9 live weekly recurring tasks; the other ~70 open items are 2024-era "done"-status leftovers never closed.

### List: Listings | Admin Tasks (186563147)
- Statuses (20 — status names abused as person/queue buckets): project tasks → justin weekly tasks → to do → listing recreation → andrea (assistant tasks) → push to haven dbs → time study tasks → then done-type: justing (admin tasks), est listing updates, project tasks, misc, kim (lead tasks), vrbo/marriott/b.com push, listing creation, old listings to remove, offboarding, add b.com bank details, for checking:, done → complete (closed)
- Custom fields: Do you have the requirements that we need (text); Requested By (users, multi) + Requested By (short_text duplicate); Account (drop_down: Haven Account, KnoxStaytion Account, Beta Account, Haven Superhost Account, Roach Account, Tammy Account); Update Request (drop_down: Listing Description, Photos, DACK Update, VRBO Update, Booking.com Update, Direct Booking Website Update, Gate Code Change, Hostaway Tag Changes, Multiple Changes, Misc); Adding amenities (text); Update guest count (text); Update bed count (text); DACK (text)
- Open tasks: ~45 | Sample: "OPT OUT - Guest Damage Protection Plan" (project tasks), "Owner Stay Check (Internal Listing Name, Owner stay dates and SS)" (project tasks), "Update Owner Profile sheet for Column Q, R, S" (andrea (assistant tasks)), "HYBRID LISTINGS" (project tasks), "Removing Onboarding Tag & Emoji for LIVE listings" (andrea (assistant tasks))
- In use: assignees y, due dates rare, priorities rare, tags n
- Activity: ACTIVE (last update ~2026-07-06)
- Notes: Listing-admin request/ops queue for the remote listings team (Kim/Justin/Andrea) — statuses used as personal work queues rather than a pipeline. "Update Request" + "Account" dropdowns look like an old listing-change request form. Mentions channel accounts (Airbnb Haven/Superhost/Beta/KnoxStaytion/Roach/Tammy).

### List: Onboarding SOPs (900201349508)
- Statuses: onboarding → pick department status → complete (closed)
- Custom fields: SOP Strength (drop_down: Complete, Pending Final Review, In Progress, Don't Do, Missing)
- Open tasks: ~49 | Sample: "Onboarding for Trellis" (onboarding), "Onboarding Listing Check" (onboarding), "Guidance on Splitting Payments for Joint Owners" (onboarding), "For Hybrid properties on Trellis" (onboarding), "Archive Listing on Hostaway for Offboarded properties" (onboarding)
- In use: assignees y (SOP owner), due dates y (recurring maintenance-check dates), priorities n, tags y (tool tags: hostaway, airbnb, suiteop, breezeway, clickup, bcom, vrbo, marriott, stayfi, dack, goody, etc.)
- Activity: ACTIVE (last update ~2026-06-18)
- Notes: SOP knowledge base — one task per SOP, full procedure text in description, "SOP Task Template" auto-applied. New SOPs reference Trellis (HavenOS-adjacent tooling) as of June 2026. Part of a company-wide SOP list pattern (relation to Company SOP List 900301513938).

### List: Guest Transfer List (901704797378)
- Statuses: to do → lost booking (done-type) → booked (closed)
- Custom fields: Paid In Full? (checkbox); Guest Arrival (date); Guest Phone (phone)
- Open tasks: 10 | Sample: "Rob Byun 2013" (to do), "Patrick Hurd 1825" (to do), "Carly Vanslembrouck 2501" (to do), "Andrew Crawford 1024" (to do), "Walter Franey 2170" (to do)
- In use: assignees rare, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-03-22)
- Notes: TRACKER. One record = a property (owner + unit) whose existing future reservations must be re-booked/transferred when the property onboards from a prior manager; guest contact/arrival/payment fields; terminal outcomes are "booked" or "lost booking".

# Space: Maintenance (54284532)
Space-level custom fields: (none)

## Folder: Vendors (114019693)
Folder-level custom fields: (none)

### List: Liability (181149873)
- Statuses: to do → done (done-type) → complete (closed) [space-default set]
- Custom fields: (none)
- Open tasks: 2 | Sample: "Silver's Tree Service" (to do), "Jorge Balderas" (done)
- In use: assignees partial, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2022-04-20)
- Notes: One record = a vendor's liability-insurance certificate (attachment on task). Abandoned 2022.

### List: Vendor Form (192042477)
- Statuses: to do → done → complete (closed) [space-default set]
- Custom fields (vendor intake — field names only, values not captured per instructions): TITLE (short_text); Vendor ID (short_text); ORGANIZATION TYPE (drop_down: Corporation, LLC, Individual, Partnership/Limited Partnership, Joint Venture, Non Profit); TAX EXEMPT? (drop_down: Yes, No); ALTERNATE NAME (if applicable/doing business as) (short_text); VENDOR ADDRESS (short_text); POINT OF CONTACT NAME (short_text); PHONE # (short_text); VENDOR WEBSITE (short_text); TAX ID (FEIN or SSN) (short_text — SENSITIVE); BANKING INFORMATION (short_text AND a duplicate text field — SENSITIVE); PAYMENT ADDRESS (if different) (short_text); ACCEPT PURCHASING CARD? (Y or N) (short_text); VENDOR EMAIL (email)
- Open tasks: 3 | Sample: "Mold Tox" (to do), "Godbey Clean LLC" (to do), "Barrington Landscaping" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2025-04-22, records created 2022)
- Notes: FORM-INTAKE LIST (all-caps field names = classic ClickUp Form). One record = a vendor W-9/payment-setup packet: legal entity info, tax ID, banking details, contacts. Contains sensitive tax/banking fields — HavenOS must treat as restricted data. Effectively superseded (W-9 collection later moved to Tax1099 per Onboarding lists).

### List: W9 Information (140195234)
- Statuses: to do → done → complete (closed) [space-default set]
- Custom fields: (none)
- Open tasks: 6 | Sample: "Keith Glass" (done), "Clinton Glass" (done), "Jorge Balderas" (done), "AV Custom Junk Hauling" (done), "Godbey Clean LLC" (done)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2022-04-16)
- Notes: One record = a vendor with W-9 PDF attached in description/attachments ("W9 attached"). No structured fields.

## (space root)

### List: W9's 2022 (193402462)
- Statuses: to do → added to tax software → added/wrong name → done (done-type) → Open (closed)
- Custom fields: (none)
- Open tasks: ~47 | Sample: "TN fumigations" (added to tax software), "Berry's Maintenane" (added to tax software), "Ricky Construction and Remodeling" (done), "Hartman Construction" (done), "Shield Services" (done)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-02-10)
- Notes: 2022 tax-season W-9 processing checklist — one record per vendor, statuses track entry into tax software (1099 prep). W-9 documents live as attachments; no structured tax fields on this list.

### List: W9's 2023 (387135267)
- Statuses: to do → done → complete (closed) [space-default set]
- Custom fields: (none)
- Open tasks: 2 | Sample: "Grasshopper LLC" (done), "Renowned Renovations" (done)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2022-12-13)
- Notes: Barely-used successor to W9's 2022; W-9 workflow evidently moved out of ClickUp (Tax1099).

### List: Maintenance Task List (900602029822)
- Statuses: recurring → todo → company tickets → onboarding → offboarding → done (done-type) → complete (closed)
- Custom fields: Department (shared 14-option drop_down); SOPs (short_text)
- Open tasks: 0 (0 including closed)
- Activity: DEAD (empty)
- Notes: Maintenance instance of the department task-list template, never populated — day-to-day maintenance work clearly lives in Breezeway, not ClickUp.

# Space: Exterior Property Maintenance (66052803)
Space-level custom fields: (none)

## (space root)

### List: List (228004697)
- Statuses: to do → complete (closed)
- Custom fields: (none)
- Open tasks: 0 (0 including closed)
- Activity: DEAD (empty)
- Notes: Empty unnamed shell list.

### List: Mowing Pictures (228004728)
- Statuses: to do → complete (closed)
- Custom fields: (none)
- Open tasks: 1 | Sample: "Mowing Follow-up Pictures" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2022-09-05)
- Notes: Single 2022 task, presumably a photo-attachment dump for mowing verification. Entire space is dead — do not migrate.

# Space: Insurance (90170728865)
Space-level custom fields: File/s (attachment); Address (location); Email (email)

## (space root)

### List: Clients (901701708402)
- Statuses: active → expired → updated document requested → canceled → complete (closed)
- Custom fields: [space] File/s (attachment — the policy/COI document); [space] Address (location); [space] Email (email)
- Open tasks: 100+ (full page; mostly "expired") | Sample: "Jerry Pegram" (expired), "Katrina Maloney" (expired), "Michael Nahom" (expired), "Mohan Thorat" (expired), "Jordan Sims" (expired)
- In use: assignees n, due dates y (due date = policy expiration date), priorities n, tags n
- Activity: ACTIVE-ish (last update ~2026-07-09, but the "update" is a ClickBot automation flipping status to "expired" on due date; little human upkeep — most records sit expired)
- Notes: KEY TRACKER. One record = a homeowner (client) insurance policy/COI: task = owner name, attachment = policy document, due date = expiration, automation (creator "ClickBot") flips active→expired at expiry; "updated document requested" tracks renewal chasing. Duplicate records per re-submission (e.g. Brad Rhorer x4). Likely fed by an insurance-upload form on the Haven website (Onboarding SOP "Send New Insurance Form Once website has been updated…" and admin task "Check Insurance through email or form for NEW owners").

### List: Cleaners (901702365180)
- Statuses: active → updated document requested → expired (done-type) → complete (closed)
- Custom fields: [space] File/s (attachment); Is Haven added as Additionally Insured? (drop_down, single option: Yes); [space] Address (location); [space] Email (email)
- Open tasks: 10 | Sample: "Dilcia Valladares Maradiaga (Dba Ruby Cleaning Services)" (expired), "EasyBnb LLC" (expired), "Blessed Cleaning" (expired), "Ogle Trenton" (expired), "MagiClean" (updated document requested)
- In use: assignees n, due dates y (expiration), priorities n, tags n
- Activity: DEAD (last update ~2025-04-11, automation-driven; all but one record expired)
- Notes: Same COI-tracking model as Clients but for cleaning vendors, plus an "Additionally Insured" flag. Effectively lapsed — no renewals processed in over a year.
