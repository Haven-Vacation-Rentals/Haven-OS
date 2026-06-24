/**
 * Haven OS — Paid Advertising (Content Studio) server actions.
 *
 * App-native CRUD over content_spaces, content_topics, and
 * content_articles. Each topic is an ad idea on the Kanban; its article
 * carries the ad script (body) plus a creative brief (hook, primary
 * text, CTA, format, budget).
 *
 * This is a project space, not a blog: there is no SEO/GEO scoring,
 * research log, agent chat, or WordPress publishing. (The underlying
 * scorecard/publish tables remain in the schema for history but are not
 * surfaced.)
 *
 * All client-callable mutations return { ok, data } | { ok, error }.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminOrAbove } from "@/lib/auth/permissions";
import {
  mapLegacyStage,
  type AdChannel,
  type ContentArticle,
  type ContentArticleVersion,
  type ContentAgentRole,
  type ContentAssignee,
  type ContentPriority,
  type ContentSpace,
  type ContentTopic,
  type ContentTopicStage,
  type Result,
  type TopicWithArticle,
} from "./types";
import { countWords, readingTimeMin } from "./util";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

const CONTENT_PATH = "/content";

function rowToSpace(r: Record<string, unknown>): ContentSpace {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string,
  };
}

function rowToTopic(r: Record<string, unknown>): ContentTopic {
  return {
    id: r.id as string,
    space_id: r.space_id as string,
    title: r.title as string,
    working_title: (r.working_title as string | null) ?? null,
    channel: (r.channel as AdChannel | null) ?? "meta",
    stage: mapLegacyStage(r.stage as string | null),
    priority: r.priority as ContentPriority,
    target_keyword: (r.target_keyword as string | null) ?? null,
    secondary_keywords: (r.secondary_keywords as string[] | null) ?? [],
    audience: (r.audience as string | null) ?? null,
    angle: (r.angle as string | null) ?? null,
    hypothesis: (r.hypothesis as string | null) ?? null,
    due_date: (r.due_date as string | null) ?? null,
    publish_target: (r.publish_target as string | null) ?? null,
    owner_id: (r.owner_id as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

function rowToArticle(r: Record<string, unknown>): ContentArticle {
  return {
    id: r.id as string,
    topic_id: r.topic_id as string,
    title: (r.title as string) ?? "",
    meta_description: (r.meta_description as string) ?? "",
    slug: (r.slug as string | null) ?? null,
    hero_image_url: (r.hero_image_url as string | null) ?? null,
    body_md: (r.body_md as string) ?? "",
    outline_md: (r.outline_md as string) ?? "",
    brief_md: (r.brief_md as string) ?? "",
    hook: (r.hook as string) ?? "",
    primary_text: (r.primary_text as string) ?? "",
    cta: (r.cta as string) ?? "",
    ad_format: (r.ad_format as string) ?? "",
    budget: (r.budget as string) ?? "",
    word_count: (r.word_count as number) ?? 0,
    reading_time_min: (r.reading_time_min as number) ?? 0,
    seo_score: (r.seo_score as number | null) ?? null,
    geo_score: (r.geo_score as number | null) ?? null,
    wp_post_id: (r.wp_post_id as string | null) ?? null,
    wp_draft_url: (r.wp_draft_url as string | null) ?? null,
    last_publish_status: null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

export async function getDefaultSpace(): Promise<ContentSpace | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_spaces")
    .select("*")
    .eq("slug", "paid-advertising")
    .maybeSingle();
  return data ? rowToSpace(data) : null;
}

export async function listSpaces(): Promise<ContentSpace[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("content_spaces")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map(rowToSpace);
}

// ---------------------------------------------------------------------------
// Assignees
// ---------------------------------------------------------------------------

function rowToAssignee(r: Record<string, unknown>): ContentAssignee {
  return {
    id: r.id as string,
    full_name: (r.full_name as string | null) ?? null,
    email: (r.email as string) ?? "",
    avatar_url: (r.avatar_url as string | null) ?? null,
  };
}

async function fetchAssigneeMap(
  ids: string[],
): Promise<Record<string, ContentAssignee>> {
  if (ids.length === 0) return {};
  const supabase = await db();
  const unique = Array.from(new Set(ids));
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", unique);
  const map: Record<string, ContentAssignee> = {};
  for (const row of data ?? []) {
    const a = rowToAssignee(row as Record<string, unknown>);
    map[a.id] = a;
  }
  return map;
}

/**
 * People who can own an ad card. Pulled from profiles — any signed-in
 * app user can own a card. Sorted by name; missing names fall back to
 * email so the picker stays readable.
 */
export async function listContentAssignees(): Promise<ContentAssignee[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToAssignee);
}

// ---------------------------------------------------------------------------
// Topics (ad cards)
// ---------------------------------------------------------------------------

export async function listTopics(spaceId: string): Promise<TopicWithArticle[]> {
  const supabase = await db();
  const { data: topics, error } = await supabase
    .from("content_topics")
    .select("*")
    .eq("space_id", spaceId)
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error || !topics) return [];

  const ids = topics.map((t) => t.id as string);
  const articles: Record<string, ContentArticle> = {};
  if (ids.length > 0) {
    const { data: articleRows } = await supabase
      .from("content_articles")
      .select("*")
      .in("topic_id", ids);
    for (const row of articleRows ?? []) {
      const a = rowToArticle(row as Record<string, unknown>);
      articles[a.topic_id] = a;
    }
  }

  const ownerIds = topics
    .map((t) => (t.owner_id as string | null) ?? null)
    .filter((v): v is string => !!v);
  const owners = await fetchAssigneeMap(ownerIds);

  return topics.map((row) => {
    const t = rowToTopic(row as Record<string, unknown>);
    return {
      ...t,
      article: articles[t.id] ?? null,
      owner: t.owner_id ? owners[t.owner_id] ?? null : null,
    };
  });
}

export async function getTopic(topicId: string): Promise<TopicWithArticle | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();
  if (!data) return null;
  const topic = rowToTopic(data);
  const { data: articleRow } = await supabase
    .from("content_articles")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();
  const owners = topic.owner_id ? await fetchAssigneeMap([topic.owner_id]) : {};
  return {
    ...topic,
    article: articleRow ? rowToArticle(articleRow) : null,
    owner: topic.owner_id ? owners[topic.owner_id] ?? null : null,
  };
}

export type CreateTopicInput = {
  space_id: string;
  title: string;
  channel?: AdChannel;
  priority?: ContentPriority;
  angle?: string;
  hypothesis?: string;
  ad_format?: string;
  budget?: string;
  hook?: string;
  due_date?: string | null;
  publish_target?: string | null;
  owner_id?: string | null;
};

export async function createTopic(
  input: CreateTopicInput,
): Promise<Result<TopicWithArticle>> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();
    const { data, error } = await supabase
      .from("content_topics")
      .insert({
        space_id: input.space_id,
        title: input.title,
        channel: input.channel ?? "meta",
        priority: input.priority ?? "medium",
        angle: input.angle ?? null,
        hypothesis: input.hypothesis ?? null,
        due_date: input.due_date ?? null,
        publish_target: input.publish_target ?? null,
        created_by: userId,
        owner_id:
          input.owner_id === undefined ? userId : input.owner_id,
      })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    const topic = rowToTopic(data);

    // Seed an empty script + brief so the workspace opens cleanly.
    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title: input.title,
      body_md: "",
      hook: input.hook ?? "",
      ad_format: input.ad_format ?? "",
      budget: input.budget ?? "",
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return {
      ok: true,
      data: full ?? { ...topic, article: null, owner: null },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export type UpdateTopicInput = Partial<{
  title: string;
  working_title: string | null;
  channel: AdChannel;
  stage: ContentTopicStage;
  priority: ContentPriority;
  angle: string | null;
  hypothesis: string | null;
  due_date: string | null;
  publish_target: string | null;
  owner_id: string | null;
}>;

export async function updateTopic(
  topicId: string,
  patch: UpdateTopicInput,
): Promise<Result<ContentTopic>> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();
    const { data, error } = await supabase
      .from("content_topics")
      .update(patch)
      .eq("id", topicId)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: rowToTopic(data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function archiveTopic(topicId: string): Promise<Result<true>> {
  return (
    (await updateTopic(topicId, { stage: "archived" })) as Result<unknown>
  ).ok
    ? { ok: true, data: true }
    : { ok: false, error: "Failed to archive ad" };
}

export async function setTopicStage(
  topicId: string,
  stage: ContentTopicStage,
): Promise<Result<ContentTopic>> {
  return updateTopic(topicId, { stage });
}

/**
 * Reassign an ad card. `null` clears the owner so the card shows up in
 * "Needs owner" filters. Profile id must already exist in the profiles
 * table; the FK on content_topics.owner_id enforces that.
 */
export async function setTopicOwner(
  topicId: string,
  ownerId: string | null,
): Promise<Result<ContentTopic>> {
  return updateTopic(topicId, { owner_id: ownerId });
}

/**
 * Hard-delete an ad card and everything attached to it (article,
 * versions all cascade via the FK on content_articles -> topic_id).
 */
export async function deleteTopic(topicId: string): Promise<Result<true>> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();
    const { error } = await supabase
      .from("content_topics")
      .delete()
      .eq("id", topicId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Articles (the ad script + creative brief)
// ---------------------------------------------------------------------------

export async function getArticleByTopic(
  topicId: string,
): Promise<ContentArticle | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_articles")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();
  return data ? rowToArticle(data) : null;
}

export async function getArticle(articleId: string): Promise<ContentArticle | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_articles")
    .select("*")
    .eq("id", articleId)
    .maybeSingle();
  return data ? rowToArticle(data) : null;
}

export type UpdateArticleInput = Partial<{
  title: string;
  body_md: string;
  hook: string;
  primary_text: string;
  cta: string;
  ad_format: string;
  budget: string;
}>;

async function persistVersion(
  articleId: string,
  source: ContentAgentRole,
  note: string | null,
  userId: string | null,
): Promise<void> {
  const supabase = await db();
  const article = await getArticle(articleId);
  if (!article) return;
  const { data: latest } = await supabase
    .from("content_article_versions")
    .select("version_number")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = ((latest?.version_number as number | undefined) ?? 0) + 1;
  await supabase.from("content_article_versions").insert({
    article_id: articleId,
    version_number: next,
    title: article.title,
    meta_description: article.meta_description,
    body_md: article.body_md,
    source,
    note,
    created_by: userId,
  });
}

export async function updateArticle(
  articleId: string,
  patch: UpdateArticleInput,
  options: { source?: ContentAgentRole; note?: string } = {},
): Promise<Result<ContentArticle>> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();

    const computed: Record<string, unknown> = { ...patch };
    if (typeof patch.body_md === "string") {
      const wc = countWords(patch.body_md);
      computed.word_count = wc;
      computed.reading_time_min = readingTimeMin(wc);
    }

    const { data, error } = await supabase
      .from("content_articles")
      .update(computed)
      .eq("id", articleId)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };

    await persistVersion(
      articleId,
      options.source ?? "user",
      options.note ?? null,
      userId,
    );

    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: rowToArticle(data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listArticleVersions(
  articleId: string,
): Promise<ContentArticleVersion[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("content_article_versions")
    .select("*")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    article_id: r.article_id as string,
    version_number: r.version_number as number,
    title: (r.title as string) ?? "",
    meta_description: (r.meta_description as string) ?? "",
    body_md: (r.body_md as string) ?? "",
    source: r.source as ContentAgentRole,
    note: (r.note as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
    created_at: r.created_at as string,
  }));
}

// ---------------------------------------------------------------------------
// Import an existing script
// ---------------------------------------------------------------------------

/**
 * Derive a short working title from a pasted script: the first heading,
 * else the first non-empty line, capped so it stays card-friendly.
 */
function deriveTitle(body: string): string {
  for (const raw of body.split("\n")) {
    const line = raw.replace(/^#{1,6}\s+/, "").trim();
    if (line) return line.length > 80 ? `${line.slice(0, 77)}...` : line;
  }
  return "Untitled ad";
}

/**
 * Paste an existing ad script (markdown or plain text). Creates a card
 * in the Draft column and seeds the script body so the workspace opens
 * with the content ready to customize.
 */
export async function createTopicFromPastedDraft(input: {
  space_id: string;
  body: string;
  title_hint?: string | null;
}): Promise<
  Result<{ topic: TopicWithArticle; title: string; word_count: number }>
> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();

    const body = (input.body ?? "").trim();
    if (!body || countWords(body) < 10) {
      return {
        ok: false,
        error: "The pasted script is too short to import. Paste at least a few lines.",
      };
    }

    const title = (input.title_hint?.trim() || deriveTitle(body)).slice(0, 120);

    // Strip a leading H1 if present — the card title carries it.
    let working = body;
    const h1Match = /^#\s+(.+)\n+/.exec(working);
    if (h1Match) {
      working = working.slice(h1Match[0].length).trimStart();
    }
    const wc = countWords(working);

    const { data: topicRow, error: topicErr } = await supabase
      .from("content_topics")
      .insert({
        space_id: input.space_id,
        title,
        channel: "meta",
        priority: "medium",
        stage: "draft",
        created_by: userId,
        owner_id: userId,
      })
      .select("*")
      .single();
    if (topicErr) return { ok: false, error: topicErr.message };
    const topic = rowToTopic(topicRow);

    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title,
      body_md: working,
      word_count: wc,
      reading_time_min: readingTimeMin(wc),
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return {
      ok: true,
      data: {
        topic: full ?? { ...topic, article: null, owner: null },
        title,
        word_count: wc,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
