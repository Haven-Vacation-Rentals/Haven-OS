# Automations & Task Templates (from Dylan, 2026-07-13 + API reconstruction)

The ClickUp API exposes neither automation rules nor saved-template contents. Automations below were provided by Dylan directly; templates were reconstructed from (a) "Template" tasks stored inside the lists and (b) fresh automation-applied instances (subtasks created by ClickBot on new tasks) — the applied instance is the ground truth for what the automation currently produces.

## Confirmed automations to rebuild in HavenOS

### 1. Priority escalation by date
- **Where:** Dylan's To Do List (192134591) and (per Dylan, same logic) Company Tickets (900201016545).
- **Rules:** when a task's **start date arrives → set priority = High**; when its **due date arrives → set priority = Urgent**.
- **HavenOS implementation:** a scheduled job (cron/edge function) over `tasks` where `start_date <= now` / `due_date <= now` and priority below the target, scoped per-list via an `automation_rules` config. Generic enough to enable on any list.

### 2. Apply template on task created
- **Where:** Onboarding Properties (217560370), Offboarding Properties (900600755484), Employee Onboarding (900600399791), Employee Offboarding (900600399815).
- **Rule:** when a task is created in the list, ClickBot instantiates the saved template: a tree of subtasks with default assignees (and, on Employee Onboarding, default due dates ~1 week out).
- **HavenOS implementation:** `task_templates` (per-list, jsonb definition of the subtask tree + default assignees) + an on-create hook. Note HavenOS `/onboarding` already has `onboarding_task_templates` — property onboarding may use that module instead of a generic mechanism.

Additional automations observed during the audit (rebuild candidates, confirm exact triggers): Company Tickets department routing on status change; lead pipelines due-date automations; Insurance active→expired status flip on due date; Escalation/Invoice/Pool-report email-to-task ingestion; Employee Onboarding "First Name" field automation on hiring lists.

## Reconstructed templates

Default assignees reflect the current template config (they are staff roles, imported as user mappings). Third-level subtask trees exist where noted "(+N sub-items)"; the importer will capture those recursively from instances.

### A. Property Onboarding (applied to each new task in Onboarding Properties)
Parent description links to the "Onboarding Timeline" reference task. 29 top-level subtasks, in order:
1. Start Onboarding (+9 sub-items) — default: Kimberly Puntero
2. 1st Email to Owner Using "Sales Handoff Template" > Hubspot
3. Allocate Owner Linens (Send to Owner, Locked Closet, or Dispose)
4. Use Playbook in Hubspot to Document First Call Notes
5. After first call add Key Dates in the Template (here & throughout the property list) (+11 sub-items)
6. 2nd Email to Owner "Post First Call/Timeline Overview" > Hubspot
7. Send Clearing Invite — Justin Caperal, Andrea Rabino
8. Send Owner Tax1099 Request for W9 — Justin Caperal, Andrea Rabino
9. Primary Listing creation (+10 sub-items) — Kimberly Puntero
10. After GLD is complete, 3rd owner email "Post GLD Purchase List + Documents" < Hubspot
11. Owner approved action items (+4 sub-items)
12. Add the owner's contact info (email+phone) in the BW profile — Andrea Rabino
13. Set up appropriate vendors
14. Transfer guest (if applicable) — Kimberly Puntero, Justin Caperal
15. Input Photography Fee Into Owner Profile Worksheet — Andrea Rabino
16. Set Prices — Noeline Ramos
17. Primary Listing Check (+3 sub-items) — Kimberly Puntero
18. Secondary Listing Creation (+4 sub-items) — Kimberly Puntero
19. Secondary Listing Check — Kimberly Puntero
20. Upload pro photos to Airbnb & HA (+7 sub-items) — Justin Caperal, Andrea Rabino
21. Revenue Check (+2 sub-items) — Noeline Ramos
22. Open Calendar! — Kimberly Puntero
23. Send Owner "Calendar Open Email" < Hubspot
24. Create class in Divvy, Bill.com, & Dext
25. Final checks to pass Owner to Accounts
26. Send Owner "Onboarding Invoice + Payout Info" Email < Hubspot
27. Send Onboarding Invoice
28. Complete 30 Day Post-Open Check (+2 sub-items) — Kimberly Puntero
29. Send the onboarding-to-owner-relations package to CEO, COO, EA — Kimberly Puntero

### B. Property Offboarding (applied to each new task in Offboarding Properties)
18 subtasks, in order (default assignees in parentheses):
1. Enter Last Day of Haven Management as Due Date and Block Calendar (Summer Mathews, Berna Thea Cruz-Magat, Regina Shrout)
2. Communicate "Offboarding Process" to owners and send Google form requesting feedback if unknown (same trio)
3. Breezeway — add offboarding emoji, create BW task for support team to uninstall Haven equipment (same trio)
4. Internally Communicate Dates (+5 sub-items) (same trio)
5. ASAP — transfer or cancel any reservations beyond our management date (subtask per reservation) (Christine Tupas)
6. Add offboarding month to Sales Forecast + Onboarding History Gsheet (Justin Caperal)
7. Offboard Vendors (recurring vendors, pool cleaning, etc.) (Regine Grace Ruales)
8. Schedule Supplies/Final Clean (sheets, towels, duvet covers) (Dara Tejada)
9. Change status on Airbnb to Unlisted on offboarding date (Ailyn Sonquipal, Berna Thea Cruz-Magat, Yen Maghirang)
10. Recoup payment processing fees from non-Airbnb reservations, withhold from owner payout (Jo Leona)
11. Export reservations from Hostaway into CSV, save in owner's Google folder (Ailyn/Berna/Yen)
12. Send final owner statement, move statement folder to "No Longer with Haven" (Regina Shrout)
13. Move owner profile to "No Longer with Haven" when management ends (Ailyn/Berna/Yen)
14. Remove listing from all platforms — as soon as no more booking opportunities (+5 sub-items) (Ailyn/Berna/Yen)
15. Remove listing from software — after last guest stay (+7 sub-items) (Ailyn/Berna/Yen)
16. Confirm all tasks completed and archive ClickUp list (Ailyn/Berna/Yen)
17. Notify Safely of offboarding if property is under Safely insurance (Ailyn/Berna/Yen)
18. Email Yale from JMs account to remove the property lock device (Jonathan Francisco III)

### C. Employee Onboarding (applied to each new task in Employee Onboarding)
Stored "Template" task (86dwyd1fp) + live instance. ~26 subtasks, each with a due date defaulted ~1 week from creation; many carry Loom training links:
ClickUp (Loom link) · PTO Tracker · Haven Email created + login shared · Haven Email signature · Send Welcome Email introducing their supervisor · Dotloop NDA (Loom) · Dotloop NDA signed · Loom · Gusto (+2 sub-items) · Google Drive (Loom) · Hostaway (Loom) · Breezeway (Loom) · Slack (Loom) · Divvy (Loom) · Last Pass (Loom) · Company Calendar & Team Meetings (Loom) · Farm Bureau Health Insurance email · Add Start Date to start-date gsheet · ClickUp / Company Hub Basics · ClickUp training assignment · Hubspot (if needed) · OpenPhone/Dialpad (if needed) · Complete Conduit Course · Add to relevant Slack Channels · Trellis (workforce/departments) · Quo · Ramp.
Note: the live automation output (e.g. Andrea Morriss instance) includes newer items (Last Pass, Trellis, Quo, Ramp) not present in the stored "Template" task — the applied instances are authoritative.

**Variant:** "Template for Accountants/Bookkeeper" (86dxq7gq4) = base template plus: Access to all Accounting Software (+7 sub-items) · Access to private Finance Passwords + privately assigned tasks · Go through Finance Task List and Finance SOPs · Add to all relevant Slack Channels.

### D. Employee Offboarding (applied to each new task in Employee Offboarding)
Stored "Template" task (86dxujp3u). 12 subtasks:
1. Delete Hostaway Account
2. Delete Breezeway Account
3. Delete ClickUp Account
4. Delete Slack Account
5. Deactivate and delete Divvy
6. Remove from Google Drive
7. Delete Loom account
8. Transfer ownership of all files to Dylan Robinson
9. Delete email
10. Remove from Gusto
11. Change login credentials on all OTAs (or force-logout all devices from the OTA side)
12. If applicable, delete accounts below (+4 sub-items)

## Migration note
These four lists' HavenOS equivalents get: the template stored as structured data, an on-create hook that instantiates it (subtasks + default assignees + relative due dates), and — for HavenOS itself — the Employee On/Offboarding templates should eventually gain "Create/Deactivate HavenOS account" steps replacing the ClickUp ones.
