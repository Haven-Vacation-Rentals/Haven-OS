-- 0015_onboarding.sql
-- Property onboarding projects, tasks (recursive), checklists, and template seed.

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE onboarding_project_status AS ENUM (
    'onboarding',
    'owner_relations_onboarding',
    'ready_to_pass',
    'done',
    'no_longer_onboarding',
    'on_hold'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_task_status AS ENUM (
    'not_started',
    'in_progress',
    'blocked',
    'done',
    'na'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_department AS ENUM (
    'onboarding',
    'owner_relations',
    'revenue',
    'cleaning',
    'guest_comms',
    'finance',
    'dispatch',
    'sales',
    'maintenance',
    'runner',
    'leadership',
    'haven',
    'tendwell',
    'stillwater'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS onboarding_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_nickname text NOT NULL,
  owner_name text,
  owner_email text,
  owner_phone text,
  status onboarding_project_status NOT NULL DEFAULT 'onboarding',
  start_date date,
  target_open_date date,
  actual_open_date date,
  slack_channel text,
  owner_profile_folder_url text,
  notes text NOT NULL DEFAULT '',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_projects_status_idx
  ON onboarding_projects (status);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES onboarding_projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  template_key text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  department onboarding_department,
  status onboarding_task_status NOT NULL DEFAULT 'not_started',
  is_key_date boolean NOT NULL DEFAULT false,
  due_date date,
  completed_at timestamptz,
  completed_by text,
  assignee_email text,
  notes text NOT NULL DEFAULT '',
  order_index int NOT NULL DEFAULT 0,
  depth int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_tasks_project_idx
  ON onboarding_tasks (project_id, parent_task_id, order_index);
CREATE INDEX IF NOT EXISTS onboarding_tasks_project_dept_idx
  ON onboarding_tasks (project_id, department);
CREATE INDEX IF NOT EXISTS onboarding_tasks_project_status_idx
  ON onboarding_tasks (project_id, status);

CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  checked_by text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_checklist_items_task_idx
  ON onboarding_checklist_items (task_id, order_index);

CREATE TABLE IF NOT EXISTS onboarding_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  parent_template_key text REFERENCES onboarding_task_templates(template_key) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  title text NOT NULL,
  description text,
  department onboarding_department,
  is_key_date boolean NOT NULL DEFAULT false,
  order_index int NOT NULL DEFAULT 0,
  depth int NOT NULL DEFAULT 0,
  has_checklist boolean NOT NULL DEFAULT false,
  checklist_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_task_templates_parent_idx
  ON onboarding_task_templates (parent_template_key, order_index);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION touch_onboarding_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS onboarding_projects_touch ON onboarding_projects;
CREATE TRIGGER onboarding_projects_touch BEFORE UPDATE ON onboarding_projects
FOR EACH ROW EXECUTE FUNCTION touch_onboarding_updated_at();

DROP TRIGGER IF EXISTS onboarding_tasks_touch ON onboarding_tasks;
CREATE TRIGGER onboarding_tasks_touch BEFORE UPDATE ON onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION touch_onboarding_updated_at();

DROP TRIGGER IF EXISTS onboarding_checklist_items_touch ON onboarding_checklist_items;
CREATE TRIGGER onboarding_checklist_items_touch BEFORE UPDATE ON onboarding_checklist_items
FOR EACH ROW EXECUTE FUNCTION touch_onboarding_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE onboarding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_templates ENABLE ROW LEVEL SECURITY;

-- Read open to authed staff; write controlled via server actions (service role).
DROP POLICY IF EXISTS "onboarding_projects_read_authed" ON onboarding_projects;
CREATE POLICY "onboarding_projects_read_authed" ON onboarding_projects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "onboarding_tasks_read_authed" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks_read_authed" ON onboarding_tasks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "onboarding_checklist_items_read_authed" ON onboarding_checklist_items;
CREATE POLICY "onboarding_checklist_items_read_authed" ON onboarding_checklist_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "onboarding_task_templates_read_authed" ON onboarding_task_templates;
CREATE POLICY "onboarding_task_templates_read_authed" ON onboarding_task_templates
  FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- TEMPLATE SEED (from John Kuvshinikov 2948 live project)
-- =============================================================================

DELETE FROM onboarding_task_templates;

-- Seed template nodes from John Kuv 2948
INSERT INTO onboarding_task_templates (template_key, parent_template_key, title, description, department, is_key_date, order_index, depth, has_checklist, checklist_items) VALUES
  ('root', NULL, 'Start Onboarding', NULL, 'onboarding', false, 0, 0, false, '[]'::jsonb),
  ('root--tag-the-parent-task-all-subtasks-with-internal-listing-name', 'root', 'Tag the Parent Task & All SubTasks with Internal Listing Name', NULL, 'onboarding', false, 0, 1, false, '[]'::jsonb),
  ('root--create-slack-thread-titled-by-the-internal-listing-name-in-t', 'root', 'Create Slack thread titled by the internal listing name in the onboarding slack channel', NULL, 'onboarding', false, 1, 1, false, '[]'::jsonb),
  ('root--confirm-that-service-agreement-has-been-signed-if-not-assign', 'root', 'Confirm that service agreement has been signed. If not, assign to Dennis and change department to sales', NULL, 'onboarding', false, 2, 1, false, '[]'::jsonb),
  ('root--create-owner-profile-folder-green-light-doc', 'root', 'Create Owner Profile Folder + Green Light Doc', NULL, 'onboarding', false, 3, 1, false, '[]'::jsonb),
  ('root--add-owner-info-to-owner-profile-worksheet', 'root', 'Add Owner info to Owner Profile Worksheet', NULL, 'onboarding', false, 4, 1, false, '[]'::jsonb),
  ('root--save-pdf-copy-of-sa-in-owner-profile-google-folder-if-signed', 'root', 'Save pdf copy of SA in Owner Profile google folder (if signed)', NULL, 'onboarding', false, 5, 1, false, '[]'::jsonb),
  ('root--confirm-hubspot-template-has-been-filled-out', 'root', 'Confirm Hubspot Template has been filled out', NULL, 'onboarding', false, 6, 1, false, '[]'::jsonb),
  ('root--create-skeleton-listing', 'root', 'Create Skeleton Listing', NULL, 'onboarding', false, 7, 1, false, '[]'::jsonb),
  ('root--add-internal-listing-name-in-hubspot-contact-of-owner-under-', 'root', 'Add Internal Listing Name in Hubspot Contact of Owner under "Property Name"', NULL, NULL, false, 8, 1, false, '[]'::jsonb),
  ('root-2', NULL, '1st Email to Owner Using "Sales Handoff Template"> Hubspot', NULL, 'onboarding', false, 1, 0, false, '[]'::jsonb),
  ('root-3', NULL, 'Allocate Owner Linens (Send to Owner,Locked Closet, or Dispose)', NULL, NULL, false, 2, 0, false, '[]'::jsonb),
  ('root-4', NULL, 'Use Playbook in Hubspot to Document First Call Notes', NULL, NULL, false, 3, 0, false, '[]'::jsonb),
  ('root-5', NULL, 'After first call add Key Dates in the Template (here & throughout the property list)', NULL, 'onboarding', false, 4, 0, false, '[]'::jsonb),
  ('root-5--haven-full-access', 'root-5', 'Haven Full Access', NULL, 'onboarding', true, 0, 1, false, '[]'::jsonb),
  ('root-5--cleaning-fee-inspection', 'root-5', 'Cleaning Fee Inspection', NULL, 'cleaning', true, 1, 1, false, '[]'::jsonb),
  ('root-5--green-light-doc', 'root-5', 'Green Light Doc', 'Get first property visit date, comment it below, then change the Due Date on this task. Change Task to in progress', 'onboarding', true, 2, 1, false, '[]'::jsonb),
  ('root-5--green-light-doc--breezeway-information-gathering', 'root-5--green-light-doc', 'Breezeway information gathering', NULL, 'onboarding', true, 0, 2, false, '[]'::jsonb),
  ('root-5--green-light-doc--update-gld-pdm-bw-conduit', 'root-5--green-light-doc', 'Update GLD, PDM, BW, Conduit', NULL, 'onboarding', true, 1, 2, false, '[]'::jsonb),
  ('root-5--execute-owner-s-linen-plan', 'root-5', 'Execute Owner''s Linen Plan', NULL, 'onboarding', true, 3, 1, false, '[]'::jsonb),
  ('root-5--tech-stack-install', 'root-5', 'Tech Stack Install', 'If no wifi, change this task to Lock Only Install and create a new task for post wifi install called "Hub + Stayfi Install"', 'onboarding', true, 4, 1, true, '["After Tech Stack Install, connect lock to DACK / Smart Things", "Add Owner &amp; Vendor codes", "Update GLD : Yale lock has been installed, Lockbox code &amp; location, Owner Code, &amp; Vendor Code"]'::jsonb),
  ('root-5--tech-stack-install--update-to-pdm-bw-gld-conduit', 'root-5--tech-stack-install', 'Update to PDM, BW, GLD, Conduit', NULL, NULL, false, 0, 2, false, '[]'::jsonb),
  ('root-5--listing-creation', 'root-5', 'Listing Creation', 'Get dates for Listing to begin creation + Due date for completion. Go to linked task for Listing Creation, comment it there. GM Will manage tasks from there.', 'onboarding', true, 5, 1, false, '[]'::jsonb),
  ('root-5--initial-listing-check', 'root-5', 'Initial Listing Check', NULL, 'onboarding', true, 6, 1, false, '[]'::jsonb),
  ('root-5--deep-preguest-clean', 'root-5', 'Deep/PreGuest clean', 'Get date ranges for Andrew to schedule Deep Clean. Comment dates and tag Andrew

Once dates are posted, schedule deep clean and add Start/Finish Dates to this calendar. At the point of being scheduled, mark task "In Progress". Then, comment in the Property Specific Slack channel with the information of when the deep clean is scheduled is for', 'cleaning', true, 7, 1, false, '[]'::jsonb),
  ('root-5--pro-photos-taken-scheduled', 'root-5', 'Pro Photos Taken Scheduled', 'Schedule Pro Photos with photographer then change the Due Date on this task.', 'onboarding', true, 8, 1, false, '[]'::jsonb),
  ('root-5--go-no-go', 'root-5', 'Go no Go', 'Mission Control: set a due date for when the GNG will be done. Comment in Property Specific Slack Channel the date that it''s being done.

Accounts: embed property Specific Go No Go Checklist Doc as a view.', 'onboarding', true, 9, 1, false, '[]'::jsonb),
  ('root-5--schedule-tasks-created-to-breezeway', 'root-5', 'Schedule/tasks created to Breezeway', NULL, NULL, false, 10, 1, false, '[]'::jsonb),
  ('root-6', NULL, '2nd Email to Owner"Post First Call/Timeline Overview" > Hubspot', 'https://docs.google.com/document/d/1QMhZsbX2RurwNM8mhMM0jeUVZDwHzgdfv56V9IF0pK0/edit?usp=sharing', 'onboarding', false, 5, 0, false, '[]'::jsonb),
  ('root-7', NULL, 'Send Clearing Invite', NULL, NULL, false, 6, 0, false, '[]'::jsonb),
  ('root-8', NULL, 'Send Owner Tax1099 Request for W9', 'Purpose 
Collect owners W9 for Tax purposes
Procedure
Go into Tax1099
Login using the info in Clickup passwords
On the left hand column, go to People > Manage Recipient > Add Recipient
Click W9 request, in the Attention To Field write the owners Name, Then paste the email address in. Click Add.
Input Payment Info (highly recommend uploading a prepay balance so you don''t have to fill out the payment or deal with the receipts for each $1 payment
If it doesn''t charge you, it hasn''t been done fully. Sometimes it does this, idk why. Just search the owners name in the Recipients section. Then Click request W9
You will get an email once the form is submitted. Go back into Tax1099 and request a TIN Match. This verifies that the info they put in is correct.
You will get an email that it is complete. You will need to go into Tax1099 & search the owners name to see the result. 
If it is rejected, let the owner know that something they put in is incorrect & they will need to check it and resubmit another one. 

FAQs
Common questions people ask? 
Then we''ll write the answers to those common questions.', 'onboarding', false, 7, 0, false, '[]'::jsonb),
  ('root-9', NULL, 'Primary Listing creation', 'Mission Control: Post Listing Creation Start Date + Due Date. Tag Alyssa & GM team as needed.

Alyssa: Take Start Date + Due Date, input them on this task, move task to in progress and begin assigning creation parts to the team. Feel free to assign people as needed', 'onboarding', false, 8, 0, false, '[]'::jsonb),
  ('root-9--make-copy-of-https-docs-google-com-spreadsheets-d-1mrxasse2g', 'root-9', 'Make copy of https://docs.google.com/spreadsheets/d/1mrXaSSE2gE-mUCAPNOP2piHSwdpujWLv_wa6r-3LJt0/edit?usp=sharing and save link here', NULL, 'onboarding', false, 0, 1, false, '[]'::jsonb),
  ('root-9--delete-skeleton-listing', 'root-9', 'Delete Skeleton Listing', NULL, 'onboarding', false, 1, 1, false, '[]'::jsonb),
  ('root-9--airbnb-part-1', 'root-9', 'Airbnb part 1', NULL, 'onboarding', false, 2, 1, false, '[]'::jsonb),
  ('root-9--airbnb-part-2-push-to-hostaway', 'root-9', 'Airbnb part 2 (push to Hostaway)', NULL, 'onboarding', false, 3, 1, false, '[]'::jsonb),
  ('root-9--hostaway', 'root-9', 'Hostaway', 'Once Listing is in Hostaway, comment in Property Specific Slack channel that the listing is ready for pricing. Tag the Sr. Revenue Manager.', 'onboarding', false, 4, 1, false, '[]'::jsonb),
  ('root-9--pdm-duplicate-pdm-information-into-clickup-property-list-lin', 'root-9', 'PDM Duplicate PDM Information into Clickup Property List (Linked here)', NULL, 'onboarding', false, 5, 1, false, '[]'::jsonb),
  ('root-9--suiteop', 'root-9', 'SuiteOp', NULL, 'onboarding', false, 6, 1, false, '[]'::jsonb),
  ('root-9--breezeway', 'root-9', 'Breezeway', NULL, 'onboarding', false, 7, 1, false, '[]'::jsonb),
  ('root-9--property-element-gathering-gld-information-transfer', 'root-9', 'Property Element Gathering & GLD Information Transfer', NULL, 'onboarding', false, 8, 1, false, '[]'::jsonb),
  ('root-9--conduit', 'root-9', 'Conduit', NULL, NULL, false, 9, 1, false, '[]'::jsonb),
  ('root-10', NULL, 'After GLD is complete, 3rd owner email "Post GLD Purchase List + Documents"<Hubspot', NULL, NULL, false, 9, 0, false, '[]'::jsonb),
  ('root-11', NULL, 'Owner approved action items', NULL, 'onboarding', false, 10, 0, false, '[]'::jsonb),
  ('root-11--purchase-owner-approved-purchase-list-items', 'root-11', 'Purchase Owner approved "Purchase List" items.', 'Assign to Issa and include purchase list in the comments', 'onboarding', false, 0, 1, false, '[]'::jsonb),
  ('root-11--look-at-last-delivery-date-of-items-ordered-schedule-a-runne', 'root-11', 'Look at last delivery date of items ordered. Schedule a runner to pickup and deliver to the property in Breezeway. Schedule all other runner tasks on same day', NULL, 'onboarding', false, 1, 1, false, '[]'::jsonb),
  ('root-11--send-approved-maintenance-list-to-dispatch', 'root-11', 'Send Approved Maintenance List to Dispatch', 'Please also add task for Smart Thermostat Install if applicable', 'onboarding', false, 2, 1, false, '[]'::jsonb),
  ('root-11--install-haven-sign', 'root-11', 'Install Haven sign', NULL, 'onboarding', false, 3, 1, false, '[]'::jsonb),
  ('root-12', NULL, 'Add the owner''s contact info (email+phone number) in the BW profile during onboarding', NULL, NULL, false, 11, 0, false, '[]'::jsonb),
  ('root-13', NULL, 'Set up appropriate vendors', NULL, 'dispatch', false, 12, 0, true, '["Pest Control", "Lawncare (if applicable)", "Pool Service (if applicable)", "Water Filtration (if applicable)", "Propane Service (if applicable)"]'::jsonb),
  ('root-14', NULL, 'Transfer guest (if applicable)', 'Mark as done if no transfer guest
Fill out guest transfer tracker
Assign this task to Jack
Change the department to Guest Communications
Jack rebook transfer guests', 'onboarding', false, 13, 0, false, '[]'::jsonb),
  ('root-15', NULL, 'Input Photography Fee Into Owner Profile Worksheet', NULL, 'onboarding', false, 14, 0, false, '[]'::jsonb),
  ('root-16', NULL, 'Set Prices', 'Add gross rent projections given to owner, Owner notes or requests, Haven internal gross rent goal, & past performance to notes section of Pricelabs
Send comment in the Onboarding Property Specific Slack Thread letting us know it is done', 'revenue', false, 15, 0, false, '[]'::jsonb),
  ('root-17', NULL, 'Primary Listing Check', NULL, 'onboarding', false, 16, 0, false, '[]'::jsonb),
  ('root-17--onboarding-listing-check', 'root-17', 'Onboarding Listing Check', 'ACCOUNT MANAGER: ENSURE THE LISITNG LOOKS WONDERFUL. 
Make sure photos are arranged well and into rooms on Airbnb
Check Descriptions and Listing Content for errors 
AirBnB
*Listing Information
Hostaway
*Basic Info
*Additional Info
*Bed Types
*Channel Specific
*Media / Photos
*Amenities
*Address
*Tags
DACK
*Guidebooks, wifi, & codes
Breezeway
*Internal Listing Name and Emojis in BW property title
*Property Notes filled out', 'onboarding', false, 0, 1, true, '["Airbnb: Listing Details", "Hostaway: Basic Info, Additional Info, Bed Types, Channel Specifics, Amenities, Photos"]'::jsonb),
  ('root-17--guest-communications-dispatch-listing-check', 'root-17', 'Guest Communications & Dispatch Listing Check', '*Address
*Tags
*DACK
*Internal Listing Name and Emojis in BW property title
*Property Notes filled out', 'guest_comms', false, 1, 1, true, '["Confirm that DACK guidebook information is accurate", "Confirm Lock + Hub are uploaded into DACK and placed into Access section", "Confirm that all relevant secondary codes (Building, Gates, etc.) are put within DACK Access section", "Confirm the property has Messaging Group tag AND the property is checked off within the Messaging Group Hostaway profile", "Confirm Address in Hostaway is properly inputted and is flowing to DACK", "Property Notes Filled Out", "If applicable, confirm the transfer guest process is complete", "Internal Listing Name and Emojis in BW property title"]'::jsonb),
  ('root-17--finance-revenue-listing-check', 'root-17', 'Finance + Revenue Listing Check', '*Cleaning Fee
*Financial Settings
*Prices / Fees', 'finance', false, 2, 1, true, '["Check Financial Settings Tab in Hostaway", "Check Prices &amp; Fees in Hostaway", "Check Cleaning Fee"]'::jsonb),
  ('root-18', NULL, 'Secondary Listing Creation', NULL, 'onboarding', false, 17, 0, false, '[]'::jsonb),
  ('root-18--vrbo', 'root-18', 'Vrbo', NULL, 'onboarding', false, 0, 1, false, '[]'::jsonb),
  ('root-18--marriott', 'root-18', 'Marriott', NULL, 'onboarding', false, 1, 1, false, '[]'::jsonb),
  ('root-18--booking-com-including-bank-details', 'root-18', 'Booking.com (including bank details)', NULL, 'onboarding', false, 2, 1, false, '[]'::jsonb),
  ('root-18--direct-booking-site', 'root-18', 'Direct booking site', NULL, 'onboarding', false, 3, 1, false, '[]'::jsonb),
  ('root-19', NULL, 'Secondary Listing Check', NULL, 'onboarding', false, 18, 0, true, '["VRBO", "Booking.com", "Marriott", "Direct Booking Website (check order)"]'::jsonb),
  ('root-20', NULL, 'Upload pro photos to Airbnb & HA', 'https://docs.google.com/document/d/1GDTYHtrSEChTm66SQ7CrwffVmVsziXC3t_aHQ_CuCkk/edit?usp=sharing', 'owner_relations', false, 19, 0, false, '[]'::jsonb),
  ('root-20--upload-all-photos-to-professional-photography-folder-in-owne', 'root-20', 'Upload all photos to professional photography folder in owner profile', NULL, 'owner_relations', false, 0, 1, false, '[]'::jsonb),
  ('root-20--delete-all-temp-airbnb-hostaway-photos', 'root-20', 'Delete all temp Airbnb & Hostaway photos', NULL, 'owner_relations', false, 1, 1, false, '[]'::jsonb),
  ('root-20--upload-all-new-photos-onto-airbnb', 'root-20', 'Upload all new photos onto Airbnb', NULL, 'owner_relations', false, 2, 1, false, '[]'::jsonb),
  ('root-20--organize-them-based-on-the-layout-of-the-house', 'root-20', 'Organize them based on the layout of the house', NULL, 'owner_relations', false, 3, 1, false, '[]'::jsonb),
  ('root-20--tag-summer-kim-in-comment-for-approval-on-layout', 'root-20', 'Tag Summer & Kim in comment for approval on layout', NULL, 'owner_relations', false, 4, 1, false, '[]'::jsonb),
  ('root-20--upload-all-photos-to-hostaway-once-the-layout-is-approved', 'root-20', 'Upload all photos to Hostaway once the layout is approved', NULL, 'owner_relations', false, 5, 1, false, '[]'::jsonb),
  ('root-20--remove-pro-photos-coming-soon-from-all-platforms', 'root-20', 'Remove "pro photos coming soon" from all platforms', NULL, 'owner_relations', false, 6, 1, false, '[]'::jsonb),
  ('root-21', NULL, 'Revenue Check', NULL, 'revenue', false, 20, 0, false, '[]'::jsonb),
  ('root-21--48-hour-check', 'root-21', '48 Hour Check', NULL, 'revenue', false, 0, 1, false, '[]'::jsonb),
  ('root-21--7-day-check', 'root-21', '7 Day Check', NULL, 'revenue', false, 1, 1, false, '[]'::jsonb),
  ('root-22', NULL, 'Open Calendar!', NULL, 'onboarding', false, 21, 0, true, '["Block owner requested block dates", "Confirm all maintenance requested block dates have been set", "Confirm transfer guest dates are blocked (if applicable)", "Confirm pricing is done", "Confirm with Dispatch there are no outstanding maintenance items that must be done before guests stay"]'::jsonb),
  ('root-23', NULL, 'Send Owner "Calendar Open Email"<Hubspot', NULL, NULL, false, 22, 0, false, '[]'::jsonb),
  ('root-24', NULL, 'Create class in Divvy, Bill.com, & Dext', NULL, 'finance', false, 23, 0, false, '[]'::jsonb),
  ('root-25', NULL, 'Final checks to pass to Owner to Accounts', NULL, 'onboarding', false, 24, 0, true, '["Onboarding to Accounts Hubspot Note - https://docs.google.com/document/d/1RW_AJXhj_oRf-IYN4LvyHdVIzTEXjMyqEC9PVXxBU-o/edit", "&quot;About this Deal&quot; in Hubspot: Property Name, GRP,\u00a0 Haven Commission, Property Address, Tax Area Code, Date Haven Services Started (calendar open date), Property LLC", "Hubspot Contacts - Make sure they are all accurate", "Green Light Doc - fully filled out : Access Codes, Wifi, HOA, Community Amenities, Tax Code, Important Locations, PDM section, Utilities, Wifi account info, exploratory, etc.", "W9 - check in Tax1099", "Insurance - owner''s insurance policy w/Haven as additionally insured is in Owner Profile Folder", "Permits &amp; Licenses: City BL, County BL, Tourist Residency Permit, Knoxville STR Permit if needed", "Owner Profile Worksheet - fill out calendar open date, W9 name, LLC name, GRP, Commission, Payment Date, Etc.", "Check Listing - pro photos, description, bed count, pricing, etc.", "Breezeway - review completed tasks, view future tasks, remove onboarding tag &amp; emoji", "Google Drive - move folder from Pending Owners to Owner Profiles", "Purchase List Tracker - ensure everything has arrived &amp; delivered", "Transfer Guests - Ensure Transfer guests are squared away", "Sales Hand Off - Reread it to make sure nothing was missed"]'::jsonb),
  ('root-26', NULL, 'Send Owner "Onboarding Invoice + Payout Info" Email <Hubspot', NULL, 'onboarding', false, 25, 0, false, '[]'::jsonb),
  ('root-27', NULL, 'Send Onboarding Invoice', NULL, 'onboarding', false, 26, 0, false, '[]'::jsonb),
  ('root-28', NULL, 'Complete 30 Day Post-Open Check', NULL, 'onboarding', false, 27, 0, false, '[]'::jsonb),
  ('root-28--gm-evaluate-all-messaging-reviews-and-escalated-issues-for-p', 'root-28', 'GM - Evaluate all messaging, reviews, and escalated issues for pain points and missing information', NULL, 'guest_comms', false, 0, 1, false, '[]'::jsonb),
  ('root-28--ob-evaluate-all-reviews-gm-feedback-and-update-listing', 'root-28', 'OB - Evaluate all reviews, GM feedback, and update listing', NULL, 'onboarding', false, 1, 1, false, '[]'::jsonb),
  ('root-29', NULL, 'Send the onboarding to owner relations package to CEO, COO, EA', NULL, 'onboarding', false, 28, 0, false, '[]'::jsonb);

-- =============================================================================
-- WRITE POLICIES (authenticated users can read+write — app enforces admin gate)
-- =============================================================================

DROP POLICY IF EXISTS "onboarding_projects_auth_write" ON onboarding_projects;
CREATE POLICY "onboarding_projects_auth_write" ON onboarding_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "onboarding_tasks_auth_write" ON onboarding_tasks;
CREATE POLICY "onboarding_tasks_auth_write" ON onboarding_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "onboarding_checklist_items_auth_write" ON onboarding_checklist_items;
CREATE POLICY "onboarding_checklist_items_auth_write" ON onboarding_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "onboarding_task_templates_auth_write" ON onboarding_task_templates;
CREATE POLICY "onboarding_task_templates_auth_write" ON onboarding_task_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
