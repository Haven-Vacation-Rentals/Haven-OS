/**
 * Haven OS — Paid Advertising (Content Studio) types.
 *
 * An app-native project space for paid ads. Each card is an ad idea that
 * moves across a Kanban (Idea -> In Progress -> Draft -> Complete) while
 * the team writes and customizes the ad script and creative brief. Not a
 * blog: there is no SEO/GEO scoring or WordPress publishing here.
 */

/**
 * The channel a paid ad runs on. Replaces the old blog "pillar" axis.
 */
export type AdChannel =
  | "meta"
  | "google"
  | "tiktok"
  | "youtube"
  | "other";

/**
 * Creative format for an ad. Stored as free text on the article so the
 * list stays flexible, but these are the common picks offered in the UI.
 */
export const AD_FORMATS = [
  "Video (Reel)",
  "Video (Story)",
  "Static image",
  "Carousel",
  "UGC / Testimonial",
  "Search text",
] as const;

export type ContentTopicStage =
  | "idea"
  | "in_progress"
  | "draft"
  | "complete"
  | "archived";

/**
 * Legacy stages from the original Content Studio pipeline. Old rows or
 * old API payloads may still arrive carrying these values; map them to
 * the simplified four-stage pipeline before they hit the UI.
 */
export type LegacyContentTopicStage =
  | "research"
  | "brief"
  | "outline"
  | "optimize"
  | "review"
  | "wordpress_draft"
  | "published"
  | "monitor";

const LEGACY_STAGE_MAP: Record<LegacyContentTopicStage, ContentTopicStage> = {
  research: "in_progress",
  brief: "in_progress",
  outline: "in_progress",
  optimize: "in_progress",
  review: "complete",
  wordpress_draft: "complete",
  published: "complete",
  monitor: "complete",
};

export function mapLegacyStage(value: string | null | undefined): ContentTopicStage {
  if (!value) return "idea";
  if (value in LEGACY_STAGE_MAP) {
    return LEGACY_STAGE_MAP[value as LegacyContentTopicStage];
  }
  if (
    value === "idea" ||
    value === "in_progress" ||
    value === "draft" ||
    value === "complete" ||
    value === "archived"
  ) {
    return value;
  }
  return "idea";
}

export type ContentPriority = "low" | "medium" | "high" | "urgent";

export type ContentPublishStatus =
  | "pending"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "blocked"
  | "credentials_missing";

export type ContentAgentRole = "user" | "agent" | "system";

export const CHANNEL_LABELS: Record<AdChannel, string> = {
  meta: "Meta (FB / IG)",
  google: "Google",
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Other",
};

export const STAGE_LABELS: Record<ContentTopicStage, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  draft: "Draft",
  complete: "Complete",
  archived: "Archived",
};

export const STAGE_ORDER: ContentTopicStage[] = [
  "idea",
  "in_progress",
  "draft",
  "complete",
];

export const PRIORITY_LABELS: Record<ContentPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export interface ContentSpace {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ContentTopic {
  id: string;
  space_id: string;
  title: string;
  working_title: string | null;
  channel: AdChannel;
  stage: ContentTopicStage;
  priority: ContentPriority;
  target_keyword: string | null;
  secondary_keywords: string[];
  audience: string | null;
  angle: string | null;
  hypothesis: string | null;
  due_date: string | null;
  publish_target: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentArticle {
  id: string;
  topic_id: string;
  title: string;
  meta_description: string;
  slug: string | null;
  hero_image_url: string | null;
  /** The ad script — the main editor body. */
  body_md: string;
  outline_md: string;
  brief_md: string;
  /** Creative brief fields surfaced alongside the script. */
  hook: string;
  primary_text: string;
  cta: string;
  ad_format: string;
  budget: string;
  word_count: number;
  reading_time_min: number;
  seo_score: number | null;
  geo_score: number | null;
  wp_post_id: string | null;
  wp_draft_url: string | null;
  last_publish_status: ContentPublishStatus | null;
  created_at: string;
  updated_at: string;
}

export interface ContentArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  meta_description: string;
  body_md: string;
  source: ContentAgentRole;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ContentResearchSource {
  id: string;
  topic_id: string;
  url: string | null;
  title: string | null;
  publisher: string | null;
  published_on: string | null;
  finding: string;
  data_point: string | null;
  is_verified: boolean;
  added_by: string | null;
  created_at: string;
}

export type ContentCheckSeverity = "blocker" | "warning" | "info";

export interface ContentCheck {
  id: string;
  label: string;
  ok: boolean;
  severity: ContentCheckSeverity;
  hint?: string;
  detail?: string;
}

export interface ContentSeoCheck {
  id: string;
  article_id: string;
  score: number;
  checks: ContentCheck[];
  created_at: string;
}

export interface ContentGeoCheck {
  id: string;
  article_id: string;
  score: number;
  checks: ContentCheck[];
  created_at: string;
}

export interface ContentAgentMessage {
  id: string;
  article_id: string;
  role: ContentAgentRole;
  content: string;
  suggestion: ContentAgentSuggestion | null;
  applied: boolean;
  author_id: string | null;
  created_at: string;
}

export type ContentAgentSuggestion =
  | { kind: "replace_body"; body_md: string }
  | { kind: "set_title"; title: string }
  | { kind: "set_meta"; meta_description: string }
  | { kind: "append_section"; heading: string; body_md: string }
  | { kind: "rewrite_paragraph"; before: string; after: string }
  | { kind: "note"; text: string };

export interface ContentPublishJob {
  id: string;
  article_id: string;
  status: ContentPublishStatus;
  target: string;
  attempt: number;
  result: Record<string, unknown>;
  error_message: string | null;
  wp_post_id: string | null;
  wp_draft_url: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentAssignee {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface TopicWithArticle extends ContentTopic {
  article: ContentArticle | null;
  owner: ContentAssignee | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
