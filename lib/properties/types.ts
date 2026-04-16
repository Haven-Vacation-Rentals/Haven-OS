/**
 * Properties module types. Mirror the Supabase schema. Core business data
 * for Haven's rental portfolio.
 */

export type PropertyStatus =
  | "live"
  | "onboarding"
  | "paused"
  | "offboarding"
  | "offboarded";

export type PropertyTier = "top" | "key" | "normal" | "junior" | "low";

export type PropertyPriority = "high" | "normal" | "low" | "none";

export type PropertySalesStatus =
  | "on_the_market"
  | "under_contract"
  | "sold"
  | "none";

export interface Property {
  id: string;
  external_id: string | null;

  // Identity
  name: string;
  status: PropertyStatus;
  tier: PropertyTier | null;
  priority: PropertyPriority;
  sales_status: PropertySalesStatus;
  currently_hosting: boolean;

  // Location
  address: string | null;
  address_map: string | null;
  region: string | null;

  // Team
  account_manager: string | null;
  revenue_manager: string | null;

  // Counts
  bedroom_count: number | null;
  bathroom_count_full: number | null;
  bathroom_count_half: number | null;
  king_beds: number | null;
  queen_beds: number | null;
  full_beds: number | null;
  twin_beds: number | null;
  kitchen_count: number | null;
  indoor_pool_hot_tub: number | null;
  max_guests: number | null;
  extra_guest_fee_threshold: number | null;

  // Platforms / IDs
  airbnb_account: string | null;
  airbnb_listing_account: string | null;
  hostaway_id: string | null;
  breezeway_id: string | null;
  listing_link: string | null;
  platform_links: string | null;

  // Access & codes
  lockbox: string | null;
  key_box_location: string | null;
  master_code: string | null;
  locks_and_codes: string | null;
  wifi_login: string | null;
  thermostat: string | null;

  // Services
  cleaning_vendor_id: string | null;
  pest_control_vendor_id: string | null;
  pool_vendor_id: string | null;
  cleaning_fee: number | null;
  cleaner_pay: number | null;
  pest_control_notes: string | null;
  pool_vendor_notes: string | null;
  lawn_care: string | null;
  gas_company: string | null;
  water_source: string | null;

  // Misc
  fireplace: string | null;
  parking: string | null;
  cancellation_policy: string | null;
  pay_date: string | null;
  hoa_community: string | null;
  offboarding_date: string | null;
  notes: string | null;

  // Audit
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type PropertyFilter = {
  search?: string;
  status?: PropertyStatus | "all";
  tier?: PropertyTier | "all";
  region?: string | "all";
  account_manager?: string | "all";
  airbnb_account?: string | "all";
};

export type PropertyUpdateInput = Partial<
  Omit<Property, "id" | "created_at" | "updated_at">
>;
