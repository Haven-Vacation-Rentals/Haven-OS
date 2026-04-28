/**
 * Haven OS — Content Studio types.
 *
 * The Content Studio is an app-native space (not ClickUp-backed). It owns
 * the entire editorial workflow: topic backlog, research, briefs,
 * outlines, drafts, SEO/GEO scoring, agent chat, and the WordPress
 * publish queue.
 */

export type ContentPillar =
  | "market_data"
  | "revenue_strategy"
  | "operations"
  | "industry_insights"
  | "haven_performance";

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

export const PILLAR_LABELS: Record<ContentPillar, string> = {
  market_data: "Market Data & Trends",
  revenue_strategy: "Revenue Strategy",
  operations: "Operations & Guest Experience",
  industry_insights: "Industry Insights",
  haven_performance: "Haven Performance & Case Studies",
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
  pillar: ContentPillar;
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
  body_md: string;
  outline_md: string;
  brief_md: string;
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

export interface TopicWithArticle extends ContentTopic {
  article: ContentArticle | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
