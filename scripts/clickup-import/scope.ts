/**
 * ClickUp → HavenOS import scope.
 *
 * Every list id in the workspace with its migration verdict, transcribed from
 * docs/clickup-audit/README.md (triage tables + "Decisions locked") and the
 * per-space audit files 01–08. Where the README does not name a list, the
 * verdict follows the numbered audit file's activity/characterization
 * (content-bearing history → archive; dead shells / test data / template
 * debris / superseded → skip) — those entries carry a `note`.
 *
 * Verdicts:
 *   migrate — live system; import fully into /work.
 *   merge   — belongs in an existing HavenOS module (properties/HR/onboarding/
 *             knowledge/operations/content). STILL IMPORTED INTO /work in this
 *             phase; `mergeTarget` flags it so Phase 3 can move it. Nothing is
 *             written to properties/hr/... tables by this importer.
 *   archive — import read-only history: the list and its tasks get archived_at.
 *   skip    — excluded from extract and load entirely (dead/test/empty).
 */

// --- Types ---------------------------------------------------------------------

export type Verdict = "migrate" | "merge" | "archive" | "skip";

/** Where a MERGE list is destined in a later phase (Phase 3 module merges). */
export type MergeTarget =
  | "properties" // /properties (PDM; external_id already aligned)
  | "knowledge" // DB-backed knowledge base (SOPs)
  | "hr" // /hr candidates/employees/policies
  | "hr_roles" // /hr role profiles (Job Descriptions content)
  | "onboarding" // /onboarding
  | "operations_lost_items" // /operations/lost-items
  | "operations_reviews" // /operations/reviews
  | "content" // /content (Content Studio)
  | "tendwell_properties"; // fold into Property List Tendwell

export interface ListScope {
  id: string;
  name: string;
  verdict: Verdict;
  mergeTarget?: MergeTarget;
  /**
   * Imported with lists.type = 'private' so HavenOS's list-access fallback
   * hides it from non-members until real grants are configured (Phase 3).
   */
  restricted?: boolean;
  note?: string;
}

export interface SpaceScope {
  id: string;
  name: string;
  note?: string;
  lists: ListScope[];
}

// --- Global import constants -----------------------------------------------------

export const CLICKUP_TEAM_ID = "30988835";

/**
 * Passwords-vault lists (Company Hub → Passwords folder + Dylan's Private →
 * My Passwords). They ARE imported (Decisions locked #6: migrate into a
 * restricted vault — credential values live in task custom fields), but
 * PHASE 3 MUST GATE ACCESS TO THESE LISTS BEFORE LAUNCH: until per-list
 * grants restrict them to the four admins (or narrower), they hold plaintext
 * credentials. The importer sets lists.type='private' as a stopgap, which is
 * NOT sufficient on its own — do not launch without real access gating.
 */
export const RESTRICTED_LIST_IDS: ReadonlySet<string> = new Set([
  "901702733521", // Dylan's (Passwords folder)
  "901702143237", // Finance Passwords
  "901702143250", // Accounts + Sales Passwords
  "901702143255", // Purchasing Passwords
  "901702143259", // Shared-Haven Stateside
  "901703148476", // Revenue Passwords
  "901702143265", // Shared-Shared-Software + Products We Use
  "901702141313", // My Passwords (Dylan's Private space)
]);

/**
 * Global roles at provisioning (Decisions locked #4/#5): all 56 members get
 * accounts; these four become admin (never downgrading an existing
 * super_admin); everyone else is 'user'.
 */
export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  "dylan@havenvacationrentals.com",
  "jack@havenvacationrentals.com",
  "jo@havenvacationrentals.com",
  "jonathanf@havenvacationrentals.com",
]);

export const HAVEN_EMAIL_DOMAIN = "havenvacationrentals.com";

/**
 * Comments require a NOT NULL author; when the original ClickUp author has no
 * HavenOS profile the row is attributed to this profile with the real author
 * preserved in comments.import_meta {creator_name, creator_email}.
 */
export const IMPORT_FALLBACK_AUTHOR_EMAIL = "dylan@havenvacationrentals.com";

export const IMPORT_CONFIG = {
  /** Closed-status ClickUp tasks ("done & hide") get archived_at on import. */
  archiveClosedTasks: true,
  /** Supabase Storage bucket for downloaded attachments. */
  attachmentsBucket: "task-attachments",
  /** Earliest date for the time-entries sweep (workspace began ~2021). */
  timeEntriesStart: "2021-01-01T00:00:00Z",
} as const;

// --- The triage ------------------------------------------------------------------

export const SPACES: SpaceScope[] = [
  {
    id: "90060262487",
    name: "Company Hub",
    lists: [
      // (space root)
      { id: "900201016545", name: "Company Tickets", verdict: "migrate" },
      {
        id: "901002807083",
        name: "Software Feature Request List",
        verdict: "archive",
        note: "Not in README triage; stale vendor feature-request backlog (01) — keep as history.",
      },
      {
        id: "901002884036",
        name: "Haven Core Processes",
        verdict: "archive",
        note: "Not in README triage; dead but doc-like core-process definitions (01).",
      },
      {
        id: "192054723",
        name: "Quarterly Ideas",
        verdict: "skip",
        note: "Dead 2021–2023 idea parking lot, superseded (01).",
      },
      { id: "901704755811", name: "Property HOA/Community", verdict: "migrate" },
      {
        id: "900301513938",
        name: "Company SOP List",
        verdict: "merge",
        mergeTarget: "knowledge",
      },
      {
        id: "900102014742",
        name: "Property Detail Master",
        verdict: "merge",
        mergeTarget: "properties",
        restricted: true,
        note: "Access-code fields (Master Code, Locks + Codes, Lockbox, Wifi) are sensitive — restrict until field-level masking exists.",
      },
      {
        id: "901712126895",
        name: "Skills/Agent Training Idea List (Claude or Trellis)",
        verdict: "migrate",
      },
      { id: "901712325863", name: "Trellis Implementation Plan", verdict: "migrate" },
      // Folder: Support Team (90101339596) — README: ARCHIVE (agendas stale)
      { id: "901002581088", name: "Daily Touch Point Agenda", verdict: "archive" },
      {
        id: "901002490106",
        name: "List (Support Team)",
        verdict: "skip",
        note: "Empty placeholder.",
      },
      { id: "901002490122", name: "Support Team SOPs", verdict: "archive" },
      // Folder: Passwords (90171282862) — restricted vault, see RESTRICTED_LIST_IDS
      { id: "901702733521", name: "Dylan's (Passwords)", verdict: "migrate", restricted: true },
      { id: "901702143237", name: "Finance Passwords", verdict: "migrate", restricted: true },
      { id: "901702143250", name: "Accounts + Sales Passwords", verdict: "migrate", restricted: true },
      { id: "901702143255", name: "Purchasing Passwords", verdict: "migrate", restricted: true },
      { id: "901702143259", name: "Shared-Haven Stateside", verdict: "migrate", restricted: true },
      { id: "901703148476", name: "Revenue Passwords", verdict: "migrate", restricted: true },
      {
        id: "901702143265",
        name: "Shared-Shared-Software + Products We Use",
        verdict: "migrate",
        restricted: true,
      },
      // Folder: Leadership Projects (90171555284) — README: SKIP (dead)
      { id: "901702888421", name: "Next Market", verdict: "skip" },
      { id: "901702945099", name: "Top Owner Leadership Communication", verdict: "skip" },
      { id: "901703006835", name: "Thomas Checklist", verdict: "skip" },
    ],
  },
  {
    id: "49715281",
    name: "EOS",
    note: "README: three live lists MIGRATE (leadership-restricted); Rocks history ARCHIVE; 2026-folder Q2/Q3/Q4 2025 clones SKIP; org-chart/V-TO whiteboard shells SKIP.",
    lists: [
      // Folder: Level 10 Meetings (90060023418)
      {
        id: "900300940712",
        name: "Level 10 Meeting (Template)",
        verdict: "skip",
        note: "Dead master template (02).",
      },
      { id: "900600699269", name: "Maintenance Lvl 10 Meeting", verdict: "archive" },
      { id: "901701750173", name: "Sales Team Level 10 Meeting", verdict: "archive" },
      {
        id: "900600749045",
        name: "Guest Experience Level 10 Meeting (Guest Comm)",
        verdict: "archive",
      },
      { id: "900600749328", name: "Finance L10", verdict: "migrate", restricted: true },
      { id: "900600020461", name: "Leadership L10 Meeting", verdict: "archive", restricted: true },
      { id: "901002663406", name: "Onboarding L10 Meeting", verdict: "archive" },
      { id: "901702966554", name: "Revenue L10", verdict: "archive" },
      { id: "901703151846", name: "Owner Relations L10 Meeting", verdict: "archive" },
      {
        id: "901704450121",
        name: "Guest Experience Level 10 Meeting (Cleaning)",
        verdict: "skip",
        note: "Never used beyond agenda skeleton (02).",
      },
      {
        id: "901704556801",
        name: "Dylan/Jo/Christine L10",
        verdict: "migrate",
        restricted: true,
      },
      // Folder: 2022 (135027069)
      { id: "381289828", name: "Q4 Rocks (2022)", verdict: "archive" },
      // Folder: 2023 (135120084)
      { id: "901700448209", name: "Q1 Rocks 2023", verdict: "archive" },
      { id: "901700448258", name: "Q2 Rocks 2023", verdict: "archive" },
      { id: "901700448262", name: "Q3 Rocks 2023", verdict: "archive" },
      { id: "901700448270", name: "Q4 Rocks 2023", verdict: "archive" },
      // Folder: 2024 (90101394571)
      { id: "901700447653", name: "Q1 Rocks 2024", verdict: "archive" },
      { id: "901702061403", name: "Q2 Rocks 2024", verdict: "archive" },
      { id: "901702686849", name: "Q3 Rocks 2024", verdict: "archive" },
      { id: "901702818670", name: "Q4 Rocks 2024", verdict: "archive" },
      // Folder: 2025 (90171966740)
      { id: "901703611761", name: "Q1 Rocks 2025", verdict: "archive" },
      { id: "901704423530", name: "Q2 Rocks 2025", verdict: "archive" },
      { id: "901704948495", name: "Q3 Rocks 2025", verdict: "archive" },
      { id: "901705449290", name: "Q4 Rocks 2025", verdict: "archive" },
      // Folder: 2026 (90174660441)
      { id: "901708397741", name: "Q1 Rocks 2026", verdict: "migrate" },
      {
        id: "901708397681",
        name: "Q2 Rocks 2025 (clone in 2026 folder)",
        verdict: "skip",
        note: "Dec-2025 duplicate of the 2025 folder — template debris (README/02).",
      },
      {
        id: "901708397802",
        name: "Q3 Rocks 2025 (clone in 2026 folder)",
        verdict: "skip",
        note: "Template debris.",
      },
      {
        id: "901708397716",
        name: "Q4 Rocks 2025 (clone in 2026 folder)",
        verdict: "skip",
        note: "Template debris.",
      },
      // Folder: Quarterly and Annual Meetings (90060096558)
      {
        id: "900600044567",
        name: "Quarterly Whole Team Meeting",
        verdict: "archive",
        note: "Meeting run-of-show history (02).",
      },
      { id: "900600182815", name: "Quarterly LT Meeting", verdict: "skip" },
      { id: "900600200392", name: "Annual LT+ Meeting", verdict: "skip" },
      // Folder: Visionary/Integrator (90170408956)
      {
        id: "901700671608",
        name: "V/I Weekly Same Page Meeting Agenda",
        verdict: "migrate",
        restricted: true,
        note: "Confidential strategy/compensation content — leadership-restricted.",
      },
      // (space root)
      { id: "900600023428", name: "Company Issues List", verdict: "archive" },
      {
        id: "900602104074",
        name: "old Accountability Chart",
        verdict: "skip",
        note: "Whiteboard shell — model as org-chart data, not tasks (README).",
      },
      { id: "387158846", name: "Vision/Traction Organizer", verdict: "skip" },
      { id: "900600044472", name: "EOS Implementation Instructions", verdict: "skip" },
      { id: "900600177926", name: "Dylan's EOS Notes", verdict: "skip" },
      { id: "901002563764", name: "New Haven", verdict: "skip" },
      { id: "901002884048", name: "The Haven Acc Chat", verdict: "skip" },
      { id: "901702598950", name: "Acc chart, new", verdict: "skip" },
      { id: "901704296145", name: "Haven Team Org Chart", verdict: "skip" },
    ],
  },
  {
    id: "48529678",
    name: "Haven Team Roles",
    lists: [
      {
        id: "193780650",
        name: "Job Descriptions / Roles Lists",
        verdict: "merge",
        mergeTarget: "hr_roles",
        note: "Dead roster but complete role-profile templates — content feeds /hr roles (README).",
      },
      { id: "375031112", name: "Org Chart", verdict: "skip" },
      { id: "387064732", name: "Shift Org Chart", verdict: "skip" },
    ],
  },
  {
    id: "90080205379",
    name: "HR",
    note: "README: live HR lists MERGE into /hr; hiring-pipeline schema imported once, old pipelines ARCHIVE; empty form shells SKIP (rebuild as HavenOS forms); Team Surveys SKIP.",
    lists: [
      // (space root)
      {
        id: "901002646606",
        name: "Company Idea's List",
        verdict: "archive",
        note: "Not in README triage; dead company idea backlog (03).",
      },
      {
        id: "900602016167",
        name: "Company Forms & Templates Used",
        verdict: "archive",
        note: "Not in README triage; stale form/template registry (03).",
      },
      { id: "900601916391", name: "Recurring Tasks List", verdict: "skip", note: "Empty." },
      {
        id: "901702643057",
        name: "Payroll Requests",
        verdict: "skip",
        note: "Empty form shell — rebuild as a HavenOS form if wanted (README).",
      },
      { id: "901703847474", name: "Policies", verdict: "merge", mergeTarget: "hr", restricted: true },
      // Folder: Remote Team Hiring (108236831)
      {
        id: "901709709337",
        name: "Bookeeper 2026",
        verdict: "merge",
        mergeTarget: "hr",
        restricted: true,
      },
      { id: "901714912433", name: "Video Ad Editor", verdict: "skip", note: "Empty posting." },
      {
        id: "901710906637",
        name: "Onboarding Operations Assistant",
        verdict: "archive",
        restricted: true,
      },
      { id: "186187810", name: "Guest Experience (hiring)", verdict: "archive", restricted: true },
      {
        id: "901704834288",
        name: "Onboarding Specialist (remote)",
        verdict: "archive",
        restricted: true,
      },
      { id: "900301500923", name: "Dispatch (hiring)", verdict: "archive", restricted: true },
      {
        id: "901709765288",
        name: "Dispatcher (M-F 9AM to 5 PM)",
        verdict: "archive",
        restricted: true,
      },
      { id: "900600530959", name: "GE Call Position", verdict: "archive", restricted: true },
      { id: "140133871", name: "Revenue' (hiring)", verdict: "archive", restricted: true },
      { id: "140386612", name: "Bookkeeper (2022)", verdict: "archive", restricted: true },
      { id: "901703156178", name: "COO Executive Assistant", verdict: "archive", restricted: true },
      { id: "900500692945", name: "Project Manager (hiring)", verdict: "archive", restricted: true },
      {
        id: "901701460447",
        name: "Executive Assistant",
        verdict: "skip",
        note: "Corrupted status set ('trey', 'lauren & jason') — README data-hygiene: skip.",
      },
      { id: "901703566799", name: "Cleaning Coordinator", verdict: "archive", restricted: true },
      { id: "901700545999", name: "Guest Experience Manager", verdict: "archive", restricted: true },
      { id: "901702988108", name: "Revenue Manager (hiring)", verdict: "archive", restricted: true },
      { id: "901704693390", name: "Accountant", verdict: "archive", restricted: true },
      { id: "901704699878", name: "Lead Accountant", verdict: "archive", restricted: true },
      {
        id: "901703667574",
        name: "Account Management Assistant",
        verdict: "archive",
        restricted: true,
      },
      {
        id: "901705071579",
        name: "Bookkeeper 2025",
        verdict: "merge",
        mergeTarget: "hr",
        restricted: true,
      },
      { id: "901705074082", name: "Revenue Manager 25", verdict: "archive", restricted: true },
      {
        id: "901705216548",
        name: "EA / Ops (Jordan)",
        verdict: "archive",
        restricted: true,
        note: "Most evolved hiring workflow — schema model for HavenOS forms (03).",
      },
      { id: "901709765935", name: "Tendwell Ops Manager 26", verdict: "archive", restricted: true },
      // Folder: Stateside Hiring (90060368975)
      {
        id: "901704949213",
        name: "Owner Relations Account Manager",
        verdict: "archive",
        restricted: true,
      },
      { id: "900600915653", name: "Runner", verdict: "merge", mergeTarget: "hr", restricted: true },
      {
        id: "901702798708",
        name: "Onboarding Specialist (stateside)",
        verdict: "archive",
        restricted: true,
      },
      {
        id: "901002505279",
        name: "Account Manager Position",
        verdict: "archive",
        restricted: true,
      },
      // Folder: Onboarding/Offboarding (90060202353)
      {
        id: "900600399791",
        name: "Employee Onboarding",
        verdict: "merge",
        mergeTarget: "hr",
        restricted: true,
        note: "Template-automation list (doc 09 template C). Pay Rate field is sensitive.",
      },
      {
        id: "900600399815",
        name: "Employee Offboarding",
        verdict: "merge",
        mergeTarget: "hr",
        restricted: true,
        note: "Template-automation list (doc 09 template D).",
      },
      {
        id: "901701078843",
        name: "📋 Form (exit interview)",
        verdict: "skip",
        note: "Empty form shell — rebuild as a HavenOS form (README).",
      },
      // Folder: HR + Hiring (90172436016)
      { id: "901704683415", name: "Tendwell Application", verdict: "archive", restricted: true },
      {
        id: "901704792401",
        name: "Employee List (Tendwell)",
        verdict: "archive",
        note: "1 task; superseded by Tendwell Cleaner List (03).",
      },
      // Folder: New Employee Training (90060400044)
      {
        id: "900301996492",
        name: "📋 Dispatch Request Form",
        verdict: "skip",
        note: "Empty form shell (README).",
      },
      { id: "900600774260", name: "Orientation", verdict: "skip" },
      // Folder: Dispatch/Property Manager Training (90101367817)
      { id: "901002546863", name: "List (Dispatch/PM Training)", verdict: "skip", note: "Empty." },
      // Folder: HR Employee Log (90060482163)
      {
        id: "900600931977",
        name: "HR Employee List",
        verdict: "merge",
        mergeTarget: "hr",
        restricted: true,
        note: "Sensitive incident/personality data — HR-restricted.",
      },
      {
        id: "901701993166",
        name: "Quarterly Conversations + Performance Reviews",
        verdict: "archive",
        restricted: true,
        note: "Abandoned 2025; /hr has hr_performance_reviews for the rebuild.",
      },
      // Folder: Team Surveys (114238072) — README: SKIP (exists in /hr/surveys)
      { id: "192026972", name: "Stay Survey March 2022", verdict: "skip" },
      { id: "198140450", name: "Ideas (Team Surveys)", verdict: "skip" },
      {
        id: "900601859190",
        name: "Stay Survey July 2023",
        verdict: "skip",
        note: "Contents don't match schema (repurposed as scratch to-dos) (03).",
      },
    ],
  },
  {
    id: "90030348935",
    name: "Guest Experience",
    lists: [
      // Folder: Guest Communications (90030933387)
      { id: "900601916406", name: "Guest Communications Task List", verdict: "migrate" },
      {
        id: "901702425198",
        name: "Long-Stay Guests",
        verdict: "migrate",
        note: "Active tracker; covered by README's Guest Comm MIGRATE row.",
      },
      { id: "900301690725", name: "Escalation", verdict: "migrate" },
      {
        id: "901702930092",
        name: "Transferred Guests",
        verdict: "migrate",
        note: "Active tracker (04).",
      },
      { id: "901704667028", name: "SuiteOp Reviews Less Than 5 Stars", verdict: "skip" },
      { id: "901711193309", name: "Guest Relations Refund", verdict: "migrate" },
      { id: "901712666412", name: "Instacart Order Tracking", verdict: "migrate" },
      { id: "901713607185", name: "Pet Fee Tracker", verdict: "migrate" },
      {
        id: "901713608727",
        name: "Left Item Tracker",
        verdict: "merge",
        mergeTarget: "operations_lost_items",
      },
      { id: "901714550864", name: "Other Cleaning Extra Charges", verdict: "migrate" },
      // Folder: Dispatch (90031092983)
      { id: "900601916383", name: "Dispatch Task List", verdict: "migrate" },
      { id: "901002391617", name: "Invoice System", verdict: "migrate" },
      {
        id: "901705090392",
        name: "Major Amenity Issues",
        verdict: "migrate",
        note: "Active dispatch tracker (04).",
      },
      { id: "901702536412", name: "Lawncare Task List", verdict: "skip" },
      {
        id: "900601479299",
        name: "Internal Team Contact Information",
        verdict: "archive",
        note: "Not in README triage; stale contact directory (04).",
      },
      {
        id: "901703555998",
        name: "Severe Ladybug Infestation - 2024 Properties",
        verdict: "archive",
        note: "One-off 2024 incident punch list — history only (04).",
      },
      { id: "900200822104", name: "Vendor Contacts List", verdict: "migrate" },
      { id: "901702955939", name: "Vendor Survey List", verdict: "skip" },
      {
        id: "901704427928",
        name: "Properties with Amenity Issues",
        verdict: "archive",
        note: "Nearly empty; overlaps Major Amenity Issues (04).",
      },
      { id: "901706563419", name: "Ed Zorn 1531", verdict: "skip" },
      // Folder: Miscellaneous Dispatch (90101379563)
      { id: "901000975263", name: "W9's 2023 (Misc Dispatch)", verdict: "skip" },
      // Folder: Inventory Tracking (90170195594)
      { id: "901700359341", name: "Inventory Tracking List", verdict: "skip" },
    ],
  },
  {
    id: "44406029",
    name: "Haven Cleaning",
    lists: [
      { id: "900301229436", name: "Requests", verdict: "skip", note: "Never used." },
      { id: "900601916374", name: "Cleaning Task List", verdict: "migrate" },
      { id: "901002850180", name: "Linen Inventory", verdict: "archive" },
      { id: "901702882210", name: "📋Damaged Linen Form", verdict: "migrate" },
      { id: "901704477181", name: "Linen Count", verdict: "migrate" },
      { id: "901002939861", name: "Cleaning Vendors", verdict: "migrate" },
      { id: "901705077594", name: "Cleaning Invoice System", verdict: "migrate" },
    ],
  },
  {
    id: "54235860",
    name: "Onboarding Team",
    lists: [
      {
        id: "217560370",
        name: "Onboarding Properties",
        verdict: "merge",
        mergeTarget: "onboarding",
        note: "Template-automation list (doc 09 template A). Stray HR-template fields to ignore in Phase 3.",
      },
      { id: "900602029853", name: "Onboarding Task List", verdict: "migrate" },
      {
        id: "186563147",
        name: "Listings | Admin Tasks",
        verdict: "migrate",
        note: "20 person-named status buckets — needs remodel post-import (README).",
      },
      { id: "900201349508", name: "Onboarding SOPs", verdict: "merge", mergeTarget: "knowledge" },
      { id: "901704797378", name: "Guest Transfer List", verdict: "archive" },
    ],
  },
  {
    id: "54285553",
    name: "Owner Relations",
    lists: [
      {
        id: "900600755484",
        name: "Offboarding Properties",
        verdict: "migrate",
        note: "Template-automation list (doc 09 template B).",
      },
      { id: "900601999994", name: "OR Onboarding List", verdict: "skip", note: "Dead; 1 residual task." },
      { id: "901702190545", name: "Project L.C", verdict: "skip", note: "Empty." },
      { id: "901701581858", name: "OR Training", verdict: "skip" },
      {
        id: "901702240196",
        name: "Weekly Inspection Report & Audit",
        verdict: "archive",
        note: "Defunct 2024 inspection workflow — history.",
      },
      { id: "900602029903", name: "OR Task List", verdict: "migrate" },
      {
        id: "901704320864",
        name: "AM Assistants Support Task List",
        verdict: "skip",
        note: "Barely used (1 task).",
      },
      {
        id: "204357814",
        name: "Pending Reviews",
        verdict: "archive",
        note: "2022 legacy review triage — taxonomy/history only (06).",
      },
      { id: "901703290545", name: "Pool Cleaning Processing", verdict: "skip" },
      {
        id: "901701612400",
        name: "📋 Reviews Less Than 5 Stars",
        verdict: "merge",
        mergeTarget: "operations_reviews",
      },
      { id: "901703125174", name: "List (Owner Escalation)", verdict: "skip", note: "Empty." },
    ],
  },
  {
    id: "54284436",
    name: "Finance",
    lists: [
      { id: "900501555881", name: "Request to Pay Owner", verdict: "skip" },
      { id: "900602029895", name: "Finance Task List", verdict: "migrate", restricted: true },
      { id: "901704016556", name: "Chargeback", verdict: "skip", note: "Empty." },
      {
        id: "901708334664",
        name: "Damage Protection Fee Claims",
        verdict: "migrate",
        note: "Needs field dedupe (3× Incident Date etc.) — imported as-is, consolidate later.",
      },
      { id: "901708915580", name: "Safely Properties & Fees", verdict: "archive" },
      {
        id: "901712283314",
        name: "2025 clean up",
        verdict: "migrate",
        note: "Not in README triage; small open bookkeeping punch list from Mar 2026 (06) — keep live.",
      },
    ],
  },
  {
    id: "54284532",
    name: "Maintenance",
    note: "README: entirely dead — work moved to Breezeway. W-9/vendor lists hold sensitive tax/banking schemas; W-9 collection moved to Tax1099 → SKIP.",
    lists: [
      { id: "181149873", name: "Liability", verdict: "skip" },
      {
        id: "192042477",
        name: "Vendor Form",
        verdict: "skip",
        note: "Sensitive tax-ID/banking fields; superseded by Tax1099 (README: SKIP or restricted ARCHIVE — skipping).",
      },
      { id: "140195234", name: "W9 Information", verdict: "skip" },
      { id: "193402462", name: "W9's 2022", verdict: "skip" },
      { id: "387135267", name: "W9's 2023 (Maintenance)", verdict: "skip" },
      { id: "900602029822", name: "Maintenance Task List", verdict: "skip", note: "Empty." },
    ],
  },
  {
    id: "66052803",
    name: "Exterior Property Maintenance",
    note: "Entire space dead (06) — do not migrate.",
    lists: [
      { id: "228004697", name: "List (Exterior)", verdict: "skip", note: "Empty." },
      { id: "228004728", name: "Mowing Pictures", verdict: "skip" },
    ],
  },
  {
    id: "90170728865",
    name: "Insurance",
    note: "Decisions locked #2: rebuild the COI tracker. Data imported as the seed/history for the rebuilt renewals feature.",
    lists: [
      { id: "901701708402", name: "Clients (COI)", verdict: "migrate" },
      {
        id: "901702365180",
        name: "Cleaners (COI)",
        verdict: "migrate",
        note: "Lapsed since Apr 2025; imported for the rebuild.",
      },
    ],
  },
  {
    id: "54238901",
    name: "Sales",
    lists: [
      // Folder: Offers/Marketing (90172654244)
      {
        id: "901705458811",
        name: "Content Calendar",
        verdict: "migrate",
        mergeTarget: "content",
        note: "README: MIGRATE or MERGE into /content — imported to /work, flagged for /content.",
      },
      {
        id: "901711279362",
        name: "Blog Projects",
        verdict: "migrate",
        mergeTarget: "content",
      },
      {
        id: "901711292720",
        name: "The Nightly Rate — Newsletter",
        verdict: "archive",
        note: "README: Nightly Rate → ARCHIVE.",
      },
      // (space root)
      { id: "350893530", name: "DR Warm Lead Pipeline", verdict: "migrate" },
      { id: "901704198600", name: "JZ Cold Sales Pipeline", verdict: "migrate" },
      { id: "900602028472", name: "Sales Task List", verdict: "skip" },
      {
        id: "901002469975",
        name: "Referral List",
        verdict: "skip",
        note: "README: SKIP. Relationship values from the pipelines are kept raw in custom_fields JSON.",
      },
      {
        id: "901002527489",
        name: "FAQ's and Objections",
        verdict: "archive",
        note: "Not in README triage; sales objection/rebuttal knowledge content (05).",
      },
      { id: "901002823984", name: "Call Log", verdict: "skip", note: "Empty." },
      { id: "901702904076", name: "Lead Pipeline (GA)", verdict: "skip" },
      { id: "901705296866", name: "Shut Down Scorecard", verdict: "archive" },
      { id: "901705408378", name: "Agent CRM", verdict: "archive" },
    ],
  },
  {
    id: "90171290493",
    name: "Revenue",
    lists: [
      { id: "901703038278", name: "Revenue Strategy List", verdict: "migrate" },
      {
        id: "901702988468",
        name: "Revenue Task List",
        verdict: "migrate",
        note: "README: migrate; the ~45 leftover 2024 bookkeeping tasks come along as closed/archived history.",
      },
    ],
  },
  {
    id: "90171782384",
    name: "Marketing",
    note: "Empty scaffold, zero tasks ever → SKIP (README).",
    lists: [{ id: "901706633063", name: "List (Marketing)", verdict: "skip", note: "Empty." }],
  },
  {
    id: "90171107722",
    name: "Tendwell Cleaning Co.",
    note: "Decisions locked #3: in scope. README: Invoicing + Property List + Cleaner List MIGRATE into a restricted Tendwell space; Pipeline/EOS/SOP lists ARCHIVE.",
    lists: [
      // Folder: SOP + Procedure (90172436018)
      { id: "901704872207", name: "SOP List (Tendwell)", verdict: "archive", restricted: true },
      {
        id: "901705459604",
        name: "Recurring Tasks (Tendwell)",
        verdict: "archive",
        restricted: true,
        note: "Not in README triage; stale VA checklist (07).",
      },
      // Folder: Sales + Onboarding (90172482586)
      { id: "901704830915", name: "Pipeline (Tendwell)", verdict: "archive", restricted: true },
      { id: "901704831337", name: "Tendwell Onboarding", verdict: "archive", restricted: true },
      {
        id: "901704831602",
        name: "Onboarding Linens",
        verdict: "migrate",
        restricted: true,
        note: "Relationship target of Property List Tendwell ('Linen Order') — part of the Tendwell data graph.",
      },
      // Folder: HR (90172486762)
      { id: "901704841598", name: "Cleaner List", verdict: "migrate", restricted: true },
      // Folder: EOS (90172529610)
      { id: "901704948928", name: "List (Tendwell EOS)", verdict: "skip", note: "Empty." },
      { id: "901704690119", name: "TwellL10", verdict: "archive", restricted: true },
      { id: "901704948934", name: "Q3 Rocks 2025 (Tendwell)", verdict: "archive", restricted: true },
      { id: "901705450785", name: "Q4 Rocks 2025 (Tendwell)", verdict: "archive", restricted: true },
      { id: "901708397959", name: "Q1 2026 (Tendwell)", verdict: "skip", note: "Empty shell." },
      // Folder: Finance (90172540939)
      { id: "901704979759", name: "List (Tendwell Finance)", verdict: "skip", note: "Empty." },
      {
        id: "901704979784",
        name: "Invoicing + History",
        verdict: "migrate",
        restricted: true,
        note: "Email-ingested inbox with untriaged spam/phishing — imported as-is for now; rebuild as ingest + structured invoices (README says do NOT replicate 1:1 long-term).",
      },
      // Folder: Sales (90175899545)
      { id: "901710092672", name: "List (Tendwell Sales)", verdict: "skip", note: "Empty." },
      {
        id: "901710092683",
        name: "Warm List",
        verdict: "migrate",
        restricted: true,
        note: "Current Tendwell B2B pipeline; supersedes Pipeline (07).",
      },
      // (space root)
      { id: "901704798832", name: "Property List Tendwell", verdict: "migrate", restricted: true },
    ],
  },
  {
    id: "90171100758",
    name: "Starting Up Start Ups",
    note: "README: dead since mid-2025 → ARCHIVE launch checklist, fold Stillwater into the Tendwell property list.",
    lists: [
      { id: "901704713501", name: "List (Start Ups)", verdict: "skip", note: "Single how-to note." },
      { id: "901704641344", name: "General", verdict: "skip", note: "Empty." },
      { id: "901704669401", name: "Tendwell Launch List", verdict: "archive" },
      { id: "901704669423", name: "Luxe Management", verdict: "skip", note: "Dead idea backlog." },
      {
        id: "901704936509",
        name: "Stillwater Property List",
        verdict: "merge",
        mergeTarget: "tendwell_properties",
        note: "1 property; fold into Property List Tendwell (README).",
      },
    ],
  },
  {
    id: "90174283983",
    name: "Ai Workflows/Projects",
    note: "README: mostly stale experiments; ARCHIVE Books Sheet Automation as requirements history; SKIP the rest.",
    lists: [
      { id: "901711166109", name: "Haven Home Status — Product Tracker", verdict: "skip" },
      { id: "901711238255", name: "Books Sheet Automation", verdict: "archive" },
      { id: "901711230744", name: "List (AI PM)", verdict: "skip", note: "Empty." },
      { id: "901711255398", name: "AI Context Migrator — MVP", verdict: "skip" },
      { id: "901711457305", name: "Conduit Success Project", verdict: "skip" },
      { id: "901711939718", name: "Claude Skills Automation", verdict: "skip" },
      { id: "901711165884", name: "AI Ideas list", verdict: "skip" },
      {
        id: "901711410173",
        name: "Email Response Automation - Slack Integration",
        verdict: "skip",
      },
    ],
  },
  {
    id: "90174374723",
    name: "AI Knowledge Base Docs",
    note: "Real content lives in ClickUp Docs (not handled by this importer); the task list is a stub.",
    lists: [{ id: "901711326650", name: "List (AI KB)", verdict: "skip", note: "1 placeholder task." }],
  },
  {
    id: "90174544379",
    name: "Stay Automated",
    note: "README: Automation Buildouts (client delivery) MIGRATE; SKIP the rest.",
    lists: [
      { id: "901711633332", name: "Memory & Logs", verdict: "skip", note: "Empty." },
      { id: "901711633333", name: "Product R&D", verdict: "skip" },
      { id: "901711633329", name: "Newsletter (Stay Automated)", verdict: "skip" },
      { id: "901711643093", name: "Jack's LinkedIn", verdict: "skip" },
      { id: "901711643362", name: "Jonathan's LinkedIn", verdict: "skip" },
      { id: "901711633328", name: "Mission Control", verdict: "skip" },
      { id: "901711633330", name: "Automation Buildouts", verdict: "migrate" },
      { id: "901711633098", name: "List (Stay Automated root)", verdict: "skip" },
      { id: "901711633327", name: "Sales Pipeline (Stay Automated)", verdict: "skip" },
      { id: "901711653877", name: "Product Development", verdict: "skip" },
    ],
  },
  {
    id: "49124753",
    name: "Future Clickup Projects",
    note: "2021–22 ClickUp onboarding test data → SKIP entirely (README).",
    lists: [
      { id: "134153386", name: "Test List 1", verdict: "skip" },
      { id: "134153815", name: "Test List 2", verdict: "skip" },
      { id: "134106338", name: "Current Clients (template data)", verdict: "skip" },
      { id: "134106337", name: "Past Clients (template data)", verdict: "skip" },
      { id: "186197584", name: "Accounts & Opportunities (template data)", verdict: "skip" },
      { id: "169174367", name: "List (Sales CRM test)", verdict: "skip", note: "Empty." },
      { id: "186195937", name: "Test List (Sales CRM test)", verdict: "skip", note: "Empty." },
      { id: "186193876", name: "List (Death to Breezeway)", verdict: "skip" },
      {
        id: "186195107",
        name: "Automation Ideas (Dylan Ideas)",
        verdict: "skip",
        note: "README: optionally archive as requirements history — skipping per 'SKIP entirely'.",
      },
      { id: "186233587", name: "Thomas to do (Dylan Ideas)", verdict: "skip" },
      { id: "186196214", name: "List (Test GM)", verdict: "skip", note: "Empty." },
      { id: "134242379", name: "List 1 (Test Task Copy)", verdict: "skip" },
      { id: "134243136", name: "List 2 (Test Task Copy)", verdict: "skip", note: "Empty." },
      { id: "134243403", name: "List 1 (Test Dupe 2)", verdict: "skip" },
      { id: "134243406", name: "List 2 (Test Dupe 2)", verdict: "skip", note: "Empty." },
    ],
  },
  {
    id: "54281760",
    name: "Dylan's Private",
    lists: [
      {
        id: "192134591",
        name: "Dylan's To Do List",
        verdict: "migrate",
        restricted: true,
        note: "Personal GTD list — private to Dylan (README: migrate to a private personal list).",
      },
      {
        id: "901702141313",
        name: "My Passwords",
        verdict: "migrate",
        restricted: true,
        note: "Credential store — see RESTRICTED_LIST_IDS; long-term recommendation is a real secrets manager.",
      },
    ],
  },
];

// --- Lookup helpers --------------------------------------------------------------

const LIST_SCOPE_BY_ID: ReadonlyMap<string, ListScope> = new Map(
  SPACES.flatMap((s) => s.lists).map((l) => [l.id, l]),
);

const SPACE_SCOPE_BY_ID: ReadonlyMap<string, SpaceScope> = new Map(
  SPACES.map((s) => [s.id, s]),
);

export function listScope(listId: string): ListScope | undefined {
  return LIST_SCOPE_BY_ID.get(listId);
}

export function spaceScope(spaceId: string): SpaceScope | undefined {
  return SPACE_SCOPE_BY_ID.get(spaceId);
}

/**
 * Whether a list is included in extract/load by default. Lists that are not
 * in the config at all (created after the audit) are included with a warning
 * from the callers — only an explicit SKIP verdict excludes.
 */
export function isListIncluded(listId: string): boolean {
  return listScope(listId)?.verdict !== "skip";
}

/** ARCHIVE-verdict lists import read-only: list + tasks get archived_at. */
export function isArchivedOnImport(listId: string): boolean {
  return listScope(listId)?.verdict === "archive";
}

export function isRestrictedList(listId: string): boolean {
  return RESTRICTED_LIST_IDS.has(listId) || listScope(listId)?.restricted === true;
}

export function scopeCounts(): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { migrate: 0, merge: 0, archive: 0, skip: 0 };
  for (const space of SPACES) {
    for (const list of space.lists) counts[list.verdict]++;
  }
  return counts;
}
