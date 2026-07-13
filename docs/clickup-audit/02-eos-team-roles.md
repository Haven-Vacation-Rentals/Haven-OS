# Space: EOS (49715281)

Space-level custom fields: (none)

Note on method: `clickup_filter_tasks` with `order_by=updated, reverse=true` returns OLDEST-first; samples below were re-pulled with `reverse=false` (newest-first). "Open tasks" excludes closed-type statuses but INCLUDES done-type statuses ("done", "not finished"), which ClickUp treats as not-closed; rocks archives therefore show large "open" counts even though the work is finished.

## Folder: Level 10 Meetings (90060023418)

Folder-level custom fields: (none)

Common pattern: every L10 list models the EOS Level-10 weekly meeting. Statuses are used as CATEGORIES, not workflow: the standing agenda items ("Segue", "Scorecard", "Rock Review", "Headlines", "To-Do List", "IDS", "Conclude") live permanently in an "agenda pg 189-197" status; raised issues sit in "private issues list"; action items go to "7 day to do list" (and 14/21-day variants); completed to-dos go to "done" then "complete" (closed). A shared list-level field "Progress (automatic_progress)" appears on most lists.

### List: Level 10 Meeting (Template) (900300940712)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~8 | Sample: "Place Holder" (7 day to do list), "Segue- 5 Minutes" (agenda), "Scorecard- 5 Minutes" (agenda), "Rock Review- 5 Minutes" (agenda), "Customer/Employee Headlines- 5 Minutes" (agenda)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-02-23)
- Notes: Master template copied to create each department L10 list. Agenda tasks carry descriptions referencing Traction book page numbers.

### List: Maintenance Lvl 10 Meeting (900600699269)
- Statuses: 7 day to do list → monthly agenda pg 189-197 → private issues list → weekly agenda → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~15 | Sample (newest): "Work with GM about repeat tasks" (done), "Talk and Work with Christian about what seems to be going on with WO" (done), "Tag Creation for tasks created to accounts and general task from FII" (done), "Scorecard - 5 min" (weekly agenda), "Employee Headlines - 5 min" (weekly agenda)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-07-19)
- Notes: Unique twist: separate "weekly agenda" and "monthly agenda" status groups.

### List: Sales Team Level 10 Meeting (901701750173)
- Statuses: 7 day to do list → 21 day to do → 14 day to do → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~13 | Sample (newest): "Finish phone scripts" (7 day to do list), "come up with a q4 sales goal" (done), "IDS - Training ... 35 minutes" (agenda), "Sales books to read" (7 day to do list), "Create two Looms of rent shifting from different competitors" (done)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: DEAD (last update ~2024-10-30)

### List: Guest Experience Level 10 Meeting (Guest Comm) (900600749045)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~45 | Sample (newest): "Segue- 5 Minutes" (agenda), "Improve HostAI's Score" (7 day to do list), "Ensure we're using proper tags in Escalation CU" (done), "Add to the troubleshooting section for Locks" (done), "We need walkthrough videos of all our properties" (done)
- In use: assignees y, due dates y, priorities y (low/high), tags n
- Activity: STALE (last update ~2026-03-05)
- Notes: Extra standing agenda task "Show and Tell". Bulk of tasks are 2023-era done to-dos never closed.

### List: Finance L10 (900600749328)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → done → to do(done-type) → in progress(done-type) → complete(closed)
- Custom fields: Progress (automatic_progress); Department (drop_down) [Haven, Leadership Team, Cleaning, Revenue, Guest Communications, Onboarding, Sales, Maintenance, Runner/Support, Dispatch, Owner Relations, Tendwell, Finance, Stillwater]
- Open tasks: ~66 | Sample (newest): "Annual linen fees on July statements" (private issues list), "What are we doing right now on the balance sheet?" (private issues list), "Filling out PDFs for Knox taxes" (private issues list), "Let's check financials on an archived listing in Hostaway" (private issues list), "Do we know how to get the charges from ramp into the sheet yet" (private issues list)
- In use: assignees y, due dates y, priorities y (urgent/high), tags n
- Activity: ACTIVE (last update ~2026-07-11)
- Notes: One of only two truly live L10s. Oddity: "to do" and "in progress" were configured as done-type statuses. Heavy running issues list (owner payouts, P&L, Ramp/Divvy transition, taxes). Carries the Department dropdown (14 options) that also appears in rocks lists.

### List: Leadership L10 Meeting (900600020461)
- Statuses: 7 day to do list → 14 day to do list → 21 day to do list → agenda pg 189-197 → private issues list → done → done q1 → done q2 → done q3 → complete(closed)
- Custom fields: Progress - Jack (drop_down) [Working on it, Need to get to it, Finish Line]; Progress (automatic_progress)
- Open tasks: 100+ (full page) | Sample (newest): "Brooklyns message about the cleaners taking stuff..." (private issues list), "Knoxville Cleaning" (private issues list), "Tendwell Cleaners getting inventory from our packaged stuff" (private issues list), "Should we take on self managers?" (private issues list), "Make sure SCED bill is paid and deposit is returned for tendwell" (private issues list)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: STALE (last update ~2025-11-11)
- Notes: The original/parent L10 list (its status IDs are the ancestors of all other L10 lists). Quarterly "done q1/q2/q3" archive statuses. Person-specific dropdown "Progress - Jack".

### List: Onboarding L10 Meeting (901002663406)
- Statuses: 7 day to do list → 21 day to do → 14 day to do → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: (none)
- Open tasks: ~13 | Sample (newest): "...dates on due dates on the onboarding recurring task list" (done), "can update where a property is on the onboarding task" (done), "Have kim start sending wishlist requests again" (done), "Order couch for Karim" (done), "Send Kim new job description" (done)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: DEAD (last update ~2024-01-30)

### List: Revenue L10 (901702966554)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~17 | Sample (newest): "\"measure luck\" Dreamweaver" (private issues list), "Make SOP on Unit Group vs Market Occ% Comparison" (done), "Update Scorecard Email Report in KeyData" (done), "Create SOP for changing photos every day for the first 30 days (150k+)" (done), "Get Dennis to CC Noeline on Sales Handoff" (done)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: STALE (last update ~2025-12-30)

### List: Owner Relations L10 Meeting (901703151846)
- Statuses: 7 day to do list → 21 day to do → 14 day to do → agenda pg 189-197 → private issues list → not paid → partial payment → paid → done → complete(closed)
- Custom fields: (none)
- Open tasks: ~36 | Sample (newest): "Tracking YoY % against market for the offer" (private issues list), "Explaining Safely to Owners" (7 day to do list), "Gift Basket to New Owners - Process" (7 day to do list), "Lawn vendors" (7 day to do list), "Build SOP and workflow to include SuiteOp Opportunities" (7 day to do list)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: STALE (last update ~2026-01-15)
- Notes: Anomalous payment-tracking statuses (not paid / partial payment / paid) grafted onto a meeting list.

### List: Guest Experience Level 10 Meeting (Cleaning) (901704450121)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~6 | Sample: only the 6 standing agenda tasks (Rock Review, Segue, Conclude, Headlines, To-Do List, Scorecard - all in "agenda pg 189-197")
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (created ~2025-03-28, never used beyond agenda skeleton)

### List: Dylan/Jo/Christine L10 (901704556801)
- Statuses: 7 day to do list → 21 day to do → 14 day to do → agenda pg 189-197 → private issues list → longer term issues list → done → complete(closed)
- Custom fields: (none)
- Open tasks: ~75 | Sample (newest): "It seems like the emails from the main email aren't flowing into slack anymore" (private issues list), "I want to be tagged in all missed cleans. Tag Mike as well" (private issues list), "Vanessa didn't know if a clean was ready..." (private issues list), "We told this guest at 2 p.m. on Friday..." (private issues list), "6 hours without answering the guest" (7 day to do list)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: ACTIVE (last update ~2026-07-13, today)
- Notes: THE current operating meeting list (Dylan/Jo/Christine). Adds a "longer term issues list" status. Content is dominated by Trellis/Havey (HavenOS AI) rollout issues — including a task "What all is everyone using Clickup for. We may move away from it and just us the HavenOS". Highest-value list in the space for replication.

## Folder: 2022 (135027069)

Folder-level custom fields: (none)

### List: Q4 Rocks (381289828)
- Statuses: to do → finance → owner realtions[sic] → onboarding → sales → revenue team → guest messaging → maintenance → dispatch → cleaning → q4 company rocks → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: ~28 | Activity: DEAD (Q4 2022 archive)
- Notes: Oldest rocks format: one status per DEPARTMENT (statuses used as swim-lanes for whose rock it is) plus "q4 company rocks" for company-level rocks. Tasks are quarterly goal statements (e.g. "End Q4 with 190 properties...", "Get Q4s average star rating to 4.75").

## Folder: 2023 (135120084)

Folder-level custom fields: (none)
Representative custom fields (checked on Q1 Rocks 2023; same shared fields): Department (drop_down) [same 14 options as Finance L10]; Progress (automatic_progress, complete_on=3 variant)

Rocks-format note (2023 onward): statuses simplified to rocks → not finished(done-type) → done(done-type) → complete(closed); the department is expressed via the Department dropdown instead of statuses.

### List: Q1 Rocks 2023 (901700448209)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~46 (all in done-type statuses) | Activity: DEAD
### List: Q2 Rocks 2023 (901700448258)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~64 | Activity: DEAD
### List: Q3 Rocks 2023 (901700448262)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~34 | Activity: DEAD
### List: Q4 Rocks 2023 (901700448270)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~52 (a few still in "rocks"/"not finished") | Activity: DEAD
- Notes: Assignees + due dates used; occasional priorities. Includes meta-task "Transfer Rock Data, Start new Rock list for Q1".

## Folder: 2024 (90101394571)

Folder-level custom fields: (none)
Representative custom fields (checked on Q1 Rocks 2024): Department (drop_down) [same 14 options]; Progress (automatic_progress, complete_on=3 variant)

### List: Q1 Rocks 2024 (901700447653)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~46 | Activity: DEAD
### List: Q2 Rocks 2024 (901702061403)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~53 | Activity: DEAD
### List: Q3 Rocks 2024 (901702686849)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~42 | Activity: DEAD
### List: Q4 Rocks 2024 (901702818670)
- Statuses: rocks → not finished → done → complete(closed)
- Open tasks: ~35 | Activity: DEAD
- Notes: Rocks are per-person/department quarterly goals with assignees and quarter-end due dates.

## Folder: 2025 (90171966740)

Folder-level custom fields: (none)
All four lists share: Statuses rocks → not finished(done) → done(done) → complete(closed); Custom fields Department (drop_down, same 14 options) + Progress (automatic_progress).

### List: Q1 Rocks 2025 (901703611761)
- Open tasks: ~27 | Sample (newest): "Create marketing plan for Blue Ridge" (rocks), "Eliminate Incomplete Divvy Transactions" (not finished), "20 Leadership Inspections" (not finished), "Develop Company 1099 Process" (not finished), "Create new sales process for Blue Ridge" (done)
- In use: assignees y, due dates y (quarter-end), priorities n, tags n
- Activity: DEAD (last update ~2025-05-05)
- Notes: Blue Ridge market expansion rocks appear here.

### List: Q2 Rocks 2025 (901704423530) [name has trailing space]
- Open tasks: ~28 | Sample (newest): "Ensure Seasonal Thermostat Switch for Pools" (done), "Improve Runner Task Efficiency" (done), "Create training ... HostAI" (done), "Manage dialpad number in HostAI" (done), "Create process to get property specific info into HostAI during onboarding" (done)
- In use: assignees y, due dates y, priorities n, tags n
- Activity: DEAD/borderline (last update ~2025-07-07, just over 1 year)
- Notes: Includes Tendwell (cleaning company) startup rocks, Trust Accounting switch, "Start Insurance Program".

### List: Q3 Rocks 2025 (901704948495) [trailing space]
- Open tasks: ~23 | Sample (newest): "Fully transition from OpenPhone to Conduit" (done), "Ensure Fall Pest Control is scheduled" (done), "Ensure all fireplaces ... serviced" (done), "Ensure 100% of properties have at least 75% of required information entered" (done), "Achieve a 55% automation rate on Conduit" (done)
- In use: assignees y, due dates sparse, priorities n, tags n
- Activity: STALE (last update ~2025-10-09)

### List: Q4 Rocks 2025 (901705449290)
- Open tasks: ~19 | Sample (newest): "Finalize and implement Conduit communication plans" (done), "Secure at least one reliable backup vendor (Renew4U)" (not finished), "Audit and confirm PDM vendor assignments" (not finished), "Implement daily check-in verification" (not finished), "Integrate all cleaning invoices directly into ClickUp" (not finished)
- In use: assignees y, due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-01-08)

## Folder: 2026 (90174660441)

Folder-level custom fields: (none)
All four lists share the same rocks/not finished/done/complete statuses and Department + Progress fields as 2025.

### List: Q1 Rocks 2026 (901708397741)
- Open tasks: ~9 | Sample (newest): "Close Out Backlog Tasks" (rocks), "Reduce Unnecessary Dispatches / Lessen Duplicate Tasks" (rocks), "Hire and Train New Dispatch" (rocks), "Zero Missed Cleans" (rocks), "Cleaning Quality Consistency" (rocks)
- In use: assignees y (multi-assignee), due dates n, priorities n, tags n
- Activity: STALE (last update ~2026-03-08)
- Notes: Only 9 rocks, all still in "rocks" status, all guest-experience/cleaning/dispatch focused (Jonathan/Christine/Tanya/Regine team). No 2026 rocks marked done — rocks tracking in ClickUp appears to have wound down mid-2026.

### List: "Q2 Rocks 2025 " (901708397681) — MISNAMED, inside 2026 folder
### List: "Q3 Rocks 2025 " (901708397802) — MISNAMED
### List: "Q4 Rocks 2025" (901708397716) — MISNAMED
- Open tasks: ~28 / ~23 / ~19 respectively
- Activity: STALE — every task in all three lists was created in a single batch ~2025-12-10 and never touched since.
- FLAG (what they actually contain): these are verbatim DUPLICATE COPIES of the 2025 folder's Q2/Q3/Q4 Rocks lists (identical task names, e.g. "Start Luxury Brand + Cleaning Company", "Complete migration from Dialpad to Conduit", "Haven Christmas Video"; new task IDs, many statuses reset to "rocks"). The 2026 folder was evidently created by duplicating the 2025 folder in Dec 2025; only the Q1 list was renamed to 2026 and given real content. The three clones contain NO 2026 rocks and are redundant with the 2025 folder — recommend treating them as template debris, not data to migrate.

## Folder: Quarterly and Annual Meetings (90060096558)

Folder-level custom fields: (none)

### List: Quarterly Whole Team Meeting (900600044567)
- Statuses: to do → 2023 → 2024 → complete(closed)
- Custom fields: (none)
- Open tasks: ~7 | Sample: "Q3 Whole Team Meeting" (2024), "Q2 Whole Team Meeting" (2024), "Q1 Whole Team Meeting" (2024), "Q4 Whole Team Meeting" (2023), "Q3 Whole Team Meeting" (2023)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2024-06-21)
- Notes: One task per quarterly all-hands; statuses used as YEAR archive buckets. Task descriptions are the full meeting run-of-show scripts (speaker-by-speaker: Dylan/Jack/Andrew/Jordan/Thomas). The Q3-2024 task documents the PM-department/bookkeeper layoffs decision.

### List: Quarterly LT Meeting (900600182815)
- Statuses: agenda pg 180-183 → high priority issue → medium priority issue → low priority issue → resolved issue(closed)
- Custom fields: (none)
- Open tasks: ~7 | Sample: "Establish Next Quarter's Rocks", "Review Previous Quarter", "Review the V/TO (.5 to 2 hours)", "Next steps", "Conclude", "Tackle Key Issues (1 to 4 hours)", "Segue" (all in agenda status)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-12-12)
- Notes: Static EOS quarterly-meeting agenda (Traction pgs 180-183) plus issue-priority statuses that were never populated.

### List: Annual LT+ Meeting (900600200392)
- Statuses: agenda pg 184-188 → high priority issue → medium priority issue → low priority issue → resolved issue(closed)
- Custom fields: (none)
- Open tasks: ~7 | Sample: "Do a SWOT Analysis" (high priority issue), "These are not correct. Pull from book. These are the quarterly. Segue" (agenda), "Tackle key issues", "Establish next quarter's rocks", "Review the V/TO"
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-04-03)
- Notes: Agenda copied from the quarterly list; a task literally says the agenda items are wrong and should be re-pulled from the book (pgs 184-188 annual format). Never fixed.

## Folder: Visionary/Integrator (90170408956)

Folder-level custom fields: (none)

### List: V/I Weekly Same Page Meeting Agenda (901700671608)
- Statuses: 7 day to do list → agenda pg 189-197 → private issues list → big picture issues → done → complete(closed)
- Custom fields: Progress (automatic_progress)
- Open tasks: 100+ (full page) | Sample: [redacted — confidential leadership/personnel items; structure verified, content deliberately omitted from this committed audit]
- In use: assignees rare, due dates rare, priorities rare (1 urgent), tags n
- Activity: ACTIVE (last update ~2026-07-11)
- Notes: Dylan (Visionary) <> Integrator weekly same-page meeting; one of the 3 truly active lists in the space alongside Finance L10 and Dylan/Jo/Christine L10. Adds a "big picture issues" status for long-horizon items (bonuses, cohosting idea, facility search, brokerage). Contains highly sensitive strategic and compensation content (details deliberately omitted from this committed audit). Must be leadership-restricted in HavenOS.

## Folder: Annual Reviews (90171959119)
- Empty folder: no lists.

## (space root) — EOS root lists

### List: Company Issues List (900600023428)
- Statuses: new → finance → accounts → onboarding → sales → revenue team → guest messaging → maintenance → dispatch → cleaning → leadership team → vto/big issues (future) → done → complete(closed)
- Custom fields: Department (drop_down, same 14 options); Progress (automatic_progress)
- Open tasks: ~82 | Sample (newest): "New Owner Onboarding (Josh)" (onboarding), "GLD to Breezeway Conversation" (guest messaging), "Leigh Burch maintenance" (accounts), "Jason Potts" (done), "Update from Thomas with projections" (done)
- In use: assignees sparse, due dates sparse, priorities sparse, tags n
- Activity: DEAD/borderline (last update ~2025-06-17)
- Notes: The EOS company-wide issues list; statuses are department swim-lanes (same scheme as 2022 Q4 Rocks) plus "vto/big issues (future)" as the long-term parking lot. Content spans 2022-2025; largely superseded by per-meeting private issues lists.

### List: old Accountability Chart (900602104074)
- Statuses: to do → complete(closed)
- Custom fields: (none)
- Open tasks: ~1 | Sample: "Maintenance Manager / Ensure properties are maintained to defined Haven standard / Define, communicate and train... / Monitor and ensure department profitability (P&L) / Mike" (to do)
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-11-03)
- Notes: EOS Accountability Chart. Tasks represent SEATS: name = role + roll-up of ~5 seat responsibilities + seat-holder name (text concatenated, likely originating from a whiteboard shape). Only one stray seat task remains in the list; the chart itself evidently lives in a ClickUp Whiteboard view attached to the list.

### List: Vision/Traction Organizer (387158846)
- Statuses: to do → marketing strategy → 10 year target → 3 year picture → core focus → core values → complete(closed)
- Custom fields: (none)
- Open tasks: 0 (0 even including closed + subtasks — empty)
- Activity: DEAD (no tasks)
- Notes: Core EOS V/TO artifact. Statuses were configured as the V/TO SECTIONS (core values, core focus, 10-year target, 3-year picture, marketing strategy) but no tasks were ever stored; the actual V/TO content lives elsewhere (doc/whiteboard). Replicate as a structured document in HavenOS, not a task list.

### List: EOS Implementation Instructions (900600044472)
- Statuses: areas of eos → high priority issue → medium priority issue → low priority issue → resolved issue(closed)
- Custom fields: (none)
- Open tasks: ~4 | Sample: "Level 10 Meetings", "Scorecards", "Rocks- Traction Pgs 170-175", "Issues" (all "areas of eos")
- Activity: DEAD (2023)
- Notes: Reference list — one task per EOS discipline with implementation instructions/Traction page pointers.

### List: Dylan's EOS Notes (900600177926)
- Statuses (inherited space defaults): new issue → high priority issue → medium priority issue → low priority issue → resolved issue(closed)
- Custom fields: (none)
- Open tasks: ~1 | Sample: "Traction" (high priority issue)
- Activity: DEAD (2022-era)
- Notes: Personal book-notes list. Also reveals the EOS SPACE DEFAULT statuses (new/high/medium/low priority issue → resolved issue).

### List: New Haven (901002563764)
- Statuses: to do → complete(closed)
- Custom fields: (none)
- Open tasks: 0 (1 closed task: "Dylan")
- Activity: DEAD
- Notes: Another accountability/org chart iteration ("New Haven" restructure); content presumably whiteboard-based, only a root "Dylan" node task remains (closed).

### List: The Haven Acc Chat (901002884048)
- Statuses: to do → complete(closed)
- Custom fields: (none)
- Open tasks: ~1 | Sample: "Sr. Manager, Owner Relations / Andrew" (to do)
- Activity: DEAD
- Notes: [sic "Acc Chat" = Accountability Chart]. Same seat-card pattern.

### List: Acc chart, new (901702598950)
- Statuses: to do → complete(closed)
- Custom fields: (none)
- Open tasks: ~1 (+1 closed "Dylan") | Sample: "Sr. Manager, Owner Relations / Andrew" (to do)
- Activity: DEAD (last update ~2024-06-04)

### List: Haven Team Org Chart (901704296145)
- Statuses: to do → complete(closed)
- Custom fields: (none)
- Open tasks: 0 (1 closed task "Dylan", created ~2025-03-03)
- Activity: DEAD
- Notes: Most recent org-chart iteration (Mar 2025). Pattern across all 5 chart lists (old Accountability Chart → New Haven → The Haven Acc Chat → Acc chart, new → Haven Team Org Chart): each is a successive redraw of the EOS Accountability Chart, kept as a whiteboard with at most 1-2 leftover seat tasks ("Dylan" root node, seat cards naming role + responsibilities + person). For HavenOS, model these as org-chart nodes (seat, responsibilities, person), not tasks.

---

# Space: Haven Team Roles (48529678)

Space-level custom fields: (none). Space default statuses: to do → complete(closed).

## (space root)

### List: Job Descriptions / Roles Lists (193780650)
- Statuses: to do → up next → in progress → updated(done) → complete(closed)
- Custom fields: (none)
- Open tasks: ~28 | Sample: "Cadie Davenport" (to do), "Jack Zoppa" (to do), "Ethan Sexton" (up next), "Noah Cormany" (up next), "Alyssa Woods" (up next) — one task per employee
- In use: assignees n, due dates n, priorities n, tags n
- Activity: DEAD (last update ~2023-03-07; tasks created Jul 2022)
- Notes: Tasks represent PEOPLE; each task description is that person's full formal job description (Title, Overview, Duties bullet list, % Duties Breakout, Proactive Outputs, Meetings, Inputs, "You know if you are winning" success criteria, Career Progression/Training, Reminders — verified on Cadie Davenport = "Property Onboarding Project Coordinator"). Statuses track the doc's review state (to do / up next / in progress / updated). Roster is the 2022 team, heavily out of date, but the DOCUMENT TEMPLATE is a strong model for HavenOS role profiles.

### List: Org Chart (375031112)
- Statuses: to do → complete(closed) (space defaults)
- Custom fields: (none)
- Open tasks: 0 (1 closed task "Dylan", 2022-era)
- In use: n/a
- Activity: DEAD
- Notes: Company org chart; like the EOS-space accountability charts, the chart lives in a whiteboard view with only a leftover root node task ("Dylan").

### List: Shift Org Chart (387064732) [name has trailing space]
- Statuses: to do → complete(closed) (space defaults)
- Custom fields: (none)
- Open tasks: 0 (1 closed task "Dylan", 2022-era)
- In use: n/a
- Activity: DEAD
- Notes: Variant org chart showing shift coverage; same whiteboard-with-one-task pattern.

---

# Cross-cutting summary for HavenOS replication

1. ACTIVE lists in these two spaces (as of 2026-07-13): only three — Finance L10 (900600749328), Dylan/Jo/Christine L10 (901704556801), and V/I Weekly Same Page Meeting Agenda (901700671608), all updated within the last ~2 days. Everything else is STALE or DEAD.
2. The reusable L10 meeting data model: standing agenda items (static tasks in an "agenda" status), a running "private issues list", time-boxed to-do statuses (7/14/21-day), done → complete. Statuses are used as categories/sections, not a workflow pipeline.
3. Rocks data model (2023+): one list per quarter, tasks = rocks with assignee + quarter-end due date, statuses rocks → not finished/done → complete, Department dropdown (14 depts incl. Tendwell/Stillwater subsidiaries) + auto Progress field. Shared field IDs: Department 74a98f1d-609f-43e3-8826-c453c5e1f715; Progress 8d85c655-... (rocks variant) / 657c3be7-... (L10 variant); Progress - Jack 63623118-... (Leadership L10 only).
4. Anomalies to flag: three lists inside the 2026 folder still named "Q2/Q3/Q4 Rocks 2025" are Dec-2025 duplicates of the 2025 lists (template debris, no 2026 content); Finance L10 has "to do"/"in progress" configured as done-type statuses; Owner Relations L10 has payment statuses (not paid/partial/paid) in a meeting list; Annual LT+ Meeting agenda is flagged wrong by its own task; tags are used NOWHERE in either space.
5. Org/accountability charts and the V/TO are whiteboard/doc artifacts, not task data — the lists are near-empty shells. Model seats (role + responsibilities + person) and V/TO sections as first-class structures in HavenOS; the Job Descriptions list provides the full role-profile template.
6. Sensitivity: V/I Weekly list contains confidential strategy and compensation discussions (omitted here); Dylan/Jo/Christine L10 documents the ClickUp→HavenOS (Trellis/Havey) migration intent, including "What all is everyone using Clickup for. We may move away from it and just us the HavenOS".
