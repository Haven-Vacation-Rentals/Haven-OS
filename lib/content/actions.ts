/**
 * Haven OS — Content Studio server actions.
 *
 * Owns the full CRUD over content_topics, content_articles, research,
 * scorecards, agent messages, and publish jobs. ClickUp is no longer
 * involved — this module is the source of truth for the workflow.
 *
 * All client-callable mutations return { ok, data } | { ok, error }.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminOrAbove } from "@/lib/auth/permissions";
import {
  type ContentArticle,
  type ContentArticleVersion,
  type ContentAgentMessage,
  type ContentAgentRole,
  type ContentAgentSuggestion,
  type ContentCheck,
  type ContentGeoCheck,
  type ContentPillar,
  type ContentPriority,
  type ContentPublishJob,
  type ContentPublishStatus,
  type ContentResearchSource,
  type ContentSeoCheck,
  type ContentSpace,
  type ContentTopic,
  type ContentTopicStage,
  type Result,
  type TopicWithArticle,
} from "./types";
import { countWords, readingTimeMin, runGeoChecks, runSeoChecks } from "./scoring";
import { runLocalAgent } from "./agent-prompt";
import {
  createWordPressDraft,
  markdownToHtml,
  readWpEnv,
} from "./wordpress";
import {
  detectIntent,
  deriveTopicSeed,
  generateLocalTopicIdeas,
  normalizeDraftBody,
  parseTopicDraft,
  type TopicDraft,
  type TopicIdea,
} from "./topic-intent";
import { applyFullSeoOptimization } from "./agent-prompt";

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
    pillar: r.pillar as ContentPillar,
    stage: r.stage as ContentTopicStage,
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
    word_count: (r.word_count as number) ?? 0,
    reading_time_min: (r.reading_time_min as number) ?? 0,
    seo_score: (r.seo_score as number | null) ?? null,
    geo_score: (r.geo_score as number | null) ?? null,
    wp_post_id: (r.wp_post_id as string | null) ?? null,
    wp_draft_url: (r.wp_draft_url as string | null) ?? null,
    last_publish_status:
      (r.last_publish_status as ContentPublishStatus | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

function rowToResearch(r: Record<string, unknown>): ContentResearchSource {
  return {
    id: r.id as string,
    topic_id: r.topic_id as string,
    url: (r.url as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    publisher: (r.publisher as string | null) ?? null,
    published_on: (r.published_on as string | null) ?? null,
    finding: r.finding as string,
    data_point: (r.data_point as string | null) ?? null,
    is_verified: !!r.is_verified,
    added_by: (r.added_by as string | null) ?? null,
    created_at: r.created_at as string,
  };
}

function rowToAgentMessage(r: Record<string, unknown>): ContentAgentMessage {
  return {
    id: r.id as string,
    article_id: r.article_id as string,
    role: r.role as ContentAgentRole,
    content: r.content as string,
    suggestion:
      (r.suggestion as ContentAgentSuggestion | null) ?? null,
    applied: !!r.applied,
    author_id: (r.author_id as string | null) ?? null,
    created_at: r.created_at as string,
  };
}

function rowToPublishJob(r: Record<string, unknown>): ContentPublishJob {
  return {
    id: r.id as string,
    article_id: r.article_id as string,
    status: r.status as ContentPublishStatus,
    target: (r.target as string) ?? "wordpress",
    attempt: (r.attempt as number) ?? 0,
    result: (r.result as Record<string, unknown>) ?? {},
    error_message: (r.error_message as string | null) ?? null,
    wp_post_id: (r.wp_post_id as string | null) ?? null,
    wp_draft_url: (r.wp_draft_url as string | null) ?? null,
    requested_by: (r.requested_by as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

function rowToSeoCheck(r: Record<string, unknown>): ContentSeoCheck {
  return {
    id: r.id as string,
    article_id: r.article_id as string,
    score: r.score as number,
    checks: (r.checks as ContentCheck[]) ?? [],
    created_at: r.created_at as string,
  };
}

function rowToGeoCheck(r: Record<string, unknown>): ContentGeoCheck {
  return {
    id: r.id as string,
    article_id: r.article_id as string,
    score: r.score as number,
    checks: (r.checks as ContentCheck[]) ?? [],
    created_at: r.created_at as string,
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
    .eq("slug", "haven-homeowner-blog")
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
// Topics
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

  return topics.map((row) => {
    const t = rowToTopic(row as Record<string, unknown>);
    return { ...t, article: articles[t.id] ?? null };
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
  return {
    ...topic,
    article: articleRow ? rowToArticle(articleRow) : null,
  };
}

export type CreateTopicInput = {
  space_id: string;
  title: string;
  pillar?: ContentPillar;
  priority?: ContentPriority;
  target_keyword?: string;
  secondary_keywords?: string[];
  angle?: string;
  hypothesis?: string;
  due_date?: string | null;
  publish_target?: string | null;
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
        pillar: input.pillar ?? "market_data",
        priority: input.priority ?? "medium",
        target_keyword: input.target_keyword ?? null,
        secondary_keywords: input.secondary_keywords ?? [],
        angle: input.angle ?? null,
        hypothesis: input.hypothesis ?? null,
        due_date: input.due_date ?? null,
        publish_target: input.publish_target ?? null,
        created_by: userId,
        owner_id: userId,
      })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    const topic = rowToTopic(data);

    // Seed an empty article so the workspace opens cleanly.
    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title: input.title,
      brief_md: "",
      outline_md: "",
      body_md: "",
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return { ok: true, data: full ?? { ...topic, article: null } };
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
  pillar: ContentPillar;
  stage: ContentTopicStage;
  priority: ContentPriority;
  target_keyword: string | null;
  secondary_keywords: string[];
  angle: string | null;
  hypothesis: string | null;
  due_date: string | null;
  publish_target: string | null;
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
    : { ok: false, error: "Failed to archive topic" };
}

export async function setTopicStage(
  topicId: string,
  stage: ContentTopicStage,
): Promise<Result<ContentTopic>> {
  return updateTopic(topicId, { stage });
}

// ---------------------------------------------------------------------------
// Articles
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
  meta_description: string;
  slug: string | null;
  hero_image_url: string | null;
  body_md: string;
  outline_md: string;
  brief_md: string;
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
// Research
// ---------------------------------------------------------------------------

export async function listResearch(topicId: string): Promise<ContentResearchSource[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_research_sources")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToResearch);
}

export type CreateResearchInput = {
  topic_id: string;
  finding: string;
  url?: string;
  title?: string;
  publisher?: string;
  data_point?: string;
  published_on?: string | null;
  is_verified?: boolean;
};

export async function createResearch(
  input: CreateResearchInput,
): Promise<Result<ContentResearchSource>> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();
    const { data, error } = await supabase
      .from("content_research_sources")
      .insert({
        topic_id: input.topic_id,
        finding: input.finding,
        url: input.url ?? null,
        title: input.title ?? null,
        publisher: input.publisher ?? null,
        data_point: input.data_point ?? null,
        published_on: input.published_on ?? null,
        is_verified: input.is_verified ?? false,
        added_by: userId,
      })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: rowToResearch(data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteResearch(id: string): Promise<Result<true>> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();
    const { error } = await supabase
      .from("content_research_sources")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export async function runArticleScorers(articleId: string): Promise<
  Result<{ seo: ContentSeoCheck; geo: ContentGeoCheck }>
> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();
    const article = await getArticle(articleId);
    if (!article) return { ok: false, error: "Article not found" };

    const { data: topicRow } = await supabase
      .from("content_topics")
      .select("*")
      .eq("id", article.topic_id)
      .maybeSingle();
    if (!topicRow) return { ok: false, error: "Topic not found" };
    const topic = rowToTopic(topicRow);

    const sources = await listResearch(article.topic_id);

    const seo = runSeoChecks({ article, topic, sources });
    const geo = runGeoChecks({ article, topic, sources });

    const { data: seoRow, error: seoErr } = await supabase
      .from("content_seo_checks")
      .insert({ article_id: articleId, score: seo.score, checks: seo.checks })
      .select("*")
      .single();
    if (seoErr) return { ok: false, error: seoErr.message };

    const { data: geoRow, error: geoErr } = await supabase
      .from("content_geo_checks")
      .insert({ article_id: articleId, score: geo.score, checks: geo.checks })
      .select("*")
      .single();
    if (geoErr) return { ok: false, error: geoErr.message };

    await supabase
      .from("content_articles")
      .update({ seo_score: seo.score, geo_score: geo.score })
      .eq("id", articleId);

    revalidatePath(CONTENT_PATH, "layout");
    return {
      ok: true,
      data: {
        seo: rowToSeoCheck(seoRow),
        geo: rowToGeoCheck(geoRow),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getLatestScores(articleId: string): Promise<{
  seo: ContentSeoCheck | null;
  geo: ContentGeoCheck | null;
}> {
  const supabase = await db();
  const [{ data: seo }, { data: geo }] = await Promise.all([
    supabase
      .from("content_seo_checks")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("content_geo_checks")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    seo: seo ? rowToSeoCheck(seo) : null,
    geo: geo ? rowToGeoCheck(geo) : null,
  };
}

// ---------------------------------------------------------------------------
// Agent chat
// ---------------------------------------------------------------------------

export async function listAgentMessages(
  articleId: string,
): Promise<ContentAgentMessage[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_agent_messages")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(rowToAgentMessage);
}

async function insertAgentMessage(
  articleId: string,
  role: ContentAgentRole,
  content: string,
  suggestion: ContentAgentSuggestion | null,
  authorId: string | null,
): Promise<ContentAgentMessage | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_agent_messages")
    .insert({
      article_id: articleId,
      role,
      content,
      suggestion,
      author_id: authorId,
    })
    .select("*")
    .single();
  return data ? rowToAgentMessage(data) : null;
}

export async function sendAgentPrompt(input: {
  article_id: string;
  prompt: string;
}): Promise<
  Result<{ user_message: ContentAgentMessage; agent_message: ContentAgentMessage }>
> {
  try {
    const userId = await requireAdminOrAbove();
    const article = await getArticle(input.article_id);
    if (!article) return { ok: false, error: "Article not found" };

    const supabase = await db();
    const { data: topicRow } = await supabase
      .from("content_topics")
      .select("*")
      .eq("id", article.topic_id)
      .maybeSingle();
    if (!topicRow) return { ok: false, error: "Topic not found" };
    const topic = rowToTopic(topicRow);
    const sources = await listResearch(article.topic_id);

    const userMessage = await insertAgentMessage(
      article.id,
      "user",
      input.prompt,
      null,
      userId,
    );
    if (!userMessage) return { ok: false, error: "Failed to record prompt" };

    // Local fallback. The managed agent dispatcher would replace this.
    const reply = runLocalAgent({
      prompt: input.prompt,
      article,
      topic,
      sources,
    });

    const agentMessage = await insertAgentMessage(
      article.id,
      "agent",
      reply.message,
      reply.suggestion,
      null,
    );
    if (!agentMessage)
      return { ok: false, error: "Failed to record agent reply" };

    revalidatePath(CONTENT_PATH, "layout");
    return {
      ok: true,
      data: { user_message: userMessage, agent_message: agentMessage },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function applyAgentSuggestion(
  messageId: string,
): Promise<Result<ContentArticle>> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();
    const { data: msgRow } = await supabase
      .from("content_agent_messages")
      .select("*")
      .eq("id", messageId)
      .maybeSingle();
    if (!msgRow) return { ok: false, error: "Message not found" };
    const message = rowToAgentMessage(msgRow);
    if (!message.suggestion)
      return { ok: false, error: "Message has no suggestion to apply" };

    const article = await getArticle(message.article_id);
    if (!article) return { ok: false, error: "Article not found" };

    const patch: UpdateArticleInput = {};
    const sug = message.suggestion;
    switch (sug.kind) {
      case "set_title":
        patch.title = sug.title;
        break;
      case "set_meta":
        patch.meta_description = sug.meta_description;
        break;
      case "replace_body":
        patch.body_md = sug.body_md;
        break;
      case "append_section":
        patch.body_md =
          article.body_md.trimEnd() +
          "\n\n## " +
          sug.heading +
          "\n\n" +
          sug.body_md +
          "\n";
        break;
      case "rewrite_paragraph":
        patch.body_md = article.body_md.includes(sug.before)
          ? article.body_md.replace(sug.before, sug.after)
          : article.body_md;
        break;
      case "note":
        return { ok: false, error: "Note suggestions are not applied" };
    }

    const updated = await updateArticle(message.article_id, patch, {
      source: "agent",
      note: `Applied suggestion ${sug.kind}`,
    });
    if (!updated.ok) return updated;

    await supabase
      .from("content_agent_messages")
      .update({ applied: true })
      .eq("id", messageId);

    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: updated.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Publish jobs (WordPress draft only)
// ---------------------------------------------------------------------------

export async function listPublishJobs(
  articleId: string,
): Promise<ContentPublishJob[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("content_publish_jobs")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToPublishJob);
}

export async function queueWordPressDraft(
  articleId: string,
): Promise<Result<ContentPublishJob>> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();

    const article = await getArticle(articleId);
    if (!article) return { ok: false, error: "Article not found" };

    const env = readWpEnv();
    const initialStatus: ContentPublishStatus = env
      ? "in_progress"
      : "credentials_missing";

    const { data: jobRow, error } = await supabase
      .from("content_publish_jobs")
      .insert({
        article_id: articleId,
        status: initialStatus,
        target: "wordpress",
        attempt: 1,
        requested_by: userId,
      })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    let job = rowToPublishJob(jobRow);

    if (!env) {
      await supabase
        .from("content_articles")
        .update({ last_publish_status: "credentials_missing" })
        .eq("id", articleId);
      revalidatePath(CONTENT_PATH, "layout");
      return { ok: true, data: job };
    }

    // Execute synchronously — the action is admin-only and explicit.
    const html = markdownToHtml(article.body_md);
    const wpResult = await createWordPressDraft({
      title: article.title,
      content: html,
      excerpt: article.meta_description,
      slug: article.slug ?? undefined,
    });

    if (wpResult.ok) {
      const { data: updated } = await supabase
        .from("content_publish_jobs")
        .update({
          status: "completed",
          wp_post_id: wpResult.post_id,
          wp_draft_url: wpResult.draft_url,
          result: { post_id: wpResult.post_id },
        })
        .eq("id", job.id)
        .select("*")
        .single();
      if (updated) job = rowToPublishJob(updated);

      await supabase
        .from("content_articles")
        .update({
          wp_post_id: wpResult.post_id,
          wp_draft_url: wpResult.draft_url,
          last_publish_status: "completed",
        })
        .eq("id", articleId);

      // Move the topic forward.
      await supabase
        .from("content_topics")
        .update({ stage: "wordpress_draft" })
        .eq("id", article.topic_id);
    } else {
      const status: ContentPublishStatus =
        wpResult.reason === "credentials_missing"
          ? "credentials_missing"
          : "blocked";
      const { data: updated } = await supabase
        .from("content_publish_jobs")
        .update({
          status,
          error_message: wpResult.error,
          result: { reason: wpResult.reason },
        })
        .eq("id", job.id)
        .select("*")
        .single();
      if (updated) job = rowToPublishJob(updated);

      await supabase
        .from("content_articles")
        .update({ last_publish_status: status })
        .eq("id", articleId);
    }

    revalidatePath(CONTENT_PATH, "layout");
    return { ok: true, data: job };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type WordPressEnvStatus = {
  configured: boolean;
  url: string | null;
};

export async function getWordPressEnvStatus(): Promise<WordPressEnvStatus> {
  const env = readWpEnv();
  return {
    configured: !!env,
    url: env?.url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Conversational topic creation + research
// ---------------------------------------------------------------------------

/**
 * One-shot result for the chat box on /content. The UI renders one of:
 *   - kind: "created" → render link to the new topic
 *   - kind: "ideas"   → render list with one-click "Add to backlog"
 *   - kind: "message" → render a chat-style assistant reply
 */
export type StudioChatResult =
  | {
      kind: "created";
      topic: TopicWithArticle;
      draft: TopicDraft;
      message: string;
    }
  | {
      kind: "imported";
      topic: TopicWithArticle;
      draft: TopicDraft;
      message: string;
      word_count: number;
    }
  | {
      kind: "ideas";
      ideas: TopicIdea[];
      message: string;
    }
  | {
      kind: "needs_target";
      reason: "optimize_seo";
      message: string;
    }
  | {
      kind: "message";
      message: string;
    };

/**
 * Tool: create_topic_from_conversation
 *
 * Build a topic + seeded article from a free-form Jack message and
 * persist it. Brief and key-points are written into the article's
 * brief_md so the workspace opens with usable scaffolding.
 */
export async function createTopicFromConversation(input: {
  space_id: string;
  message: string;
}): Promise<Result<{ topic: TopicWithArticle; draft: TopicDraft }>> {
  try {
    const userId = await requireAdminOrAbove();
    const draft = parseTopicDraft(input.message);
    const supabase = await db();

    const { data: topicRow, error: topicErr } = await supabase
      .from("content_topics")
      .insert({
        space_id: input.space_id,
        title: draft.title,
        pillar: draft.pillar,
        priority: draft.priority,
        target_keyword: draft.target_keyword,
        secondary_keywords: draft.secondary_keywords,
        angle: draft.angle,
        hypothesis: draft.hypothesis,
        created_by: userId,
        owner_id: userId,
      })
      .select("*")
      .single();
    if (topicErr) return { ok: false, error: topicErr.message };
    const topic = rowToTopic(topicRow);

    const briefMd = buildBriefMarkdown(draft);
    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title: draft.title,
      brief_md: briefMd,
      outline_md: "",
      body_md: "",
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return {
      ok: true,
      data: {
        topic: full ?? { ...topic, article: null },
        draft,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tool: create_topic_from_pasted_draft
 *
 * Jack pastes an existing draft (markdown or plain text). We derive a
 * topic skeleton from the draft (title, pillar, keyword, etc.), persist
 * it, and seed the article with the pasted body so the right-hand
 * canvas opens with rich post content immediately.
 */
export async function createTopicFromPastedDraft(input: {
  space_id: string;
  body: string;
  title_hint?: string | null;
}): Promise<
  Result<{ topic: TopicWithArticle; draft: TopicDraft; word_count: number }>
> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();

    const body = normalizeDraftBody(input.body);
    if (!body || countWords(body) < 20) {
      return {
        ok: false,
        error: "The pasted draft is too short to import. Paste at least a few sentences.",
      };
    }

    const seed = (input.title_hint?.trim() || deriveTopicSeed(body)).trim();
    const draft = parseTopicDraft(seed);

    // Strip a leading H1 if present — the topic title carries it.
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
        title: draft.title,
        pillar: draft.pillar,
        priority: draft.priority,
        target_keyword: draft.target_keyword,
        secondary_keywords: draft.secondary_keywords,
        angle: draft.angle,
        hypothesis: draft.hypothesis,
        stage: "draft",
        created_by: userId,
        owner_id: userId,
      })
      .select("*")
      .single();
    if (topicErr) return { ok: false, error: topicErr.message };
    const topic = rowToTopic(topicRow);

    const briefMd = buildBriefMarkdown(draft);
    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title: draft.title,
      brief_md: briefMd,
      outline_md: "",
      body_md: working,
      word_count: wc,
      reading_time_min: readingTimeMin(wc),
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return {
      ok: true,
      data: {
        topic: full ?? { ...topic, article: null },
        draft,
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

/**
 * Tool: optimize_article_seo
 *
 * Apply an opinionated SEO/GEO pass to an existing article (mutates
 * title, meta, body in-place via updateArticle, and re-runs the
 * scorers). Returns before/after scores plus a summary of changes.
 */
export async function optimizeArticleSeo(input: {
  article_id: string;
}): Promise<
  Result<{
    article: ContentArticle;
    seo: ContentSeoCheck;
    geo: ContentGeoCheck;
    summary: string[];
    before: { seo: number | null; geo: number | null };
    after: { seo: number; geo: number };
  }>
> {
  try {
    await requireAdminOrAbove();
    const supabase = await db();

    const article = await getArticle(input.article_id);
    if (!article) return { ok: false, error: "Article not found" };

    const { data: topicRow } = await supabase
      .from("content_topics")
      .select("*")
      .eq("id", article.topic_id)
      .maybeSingle();
    if (!topicRow) return { ok: false, error: "Topic not found" };
    const topic = rowToTopic(topicRow);
    const sources = await listResearch(article.topic_id);

    const before = { seo: article.seo_score, geo: article.geo_score };

    const optimized = applyFullSeoOptimization({ article, topic });

    const updateRes = await updateArticle(
      article.id,
      {
        title: optimized.title,
        meta_description: optimized.meta_description,
        body_md: optimized.body_md,
      },
      { source: "agent", note: "Applied full SEO optimization pass" },
    );
    if (!updateRes.ok) return { ok: false, error: updateRes.error };

    const updatedArticle = updateRes.data;

    // Re-run scorers against the freshly optimized article.
    const seo = runSeoChecks({ article: updatedArticle, topic, sources });
    const geo = runGeoChecks({ article: updatedArticle, topic, sources });

    const { data: seoRow } = await supabase
      .from("content_seo_checks")
      .insert({ article_id: article.id, score: seo.score, checks: seo.checks })
      .select("*")
      .single();
    const { data: geoRow } = await supabase
      .from("content_geo_checks")
      .insert({ article_id: article.id, score: geo.score, checks: geo.checks })
      .select("*")
      .single();

    await supabase
      .from("content_articles")
      .update({ seo_score: seo.score, geo_score: geo.score })
      .eq("id", article.id);

    // Move topic to "optimize" if it isn't past it yet.
    if (
      ["idea", "research", "brief", "outline", "draft"].includes(topic.stage)
    ) {
      await supabase
        .from("content_topics")
        .update({ stage: "optimize" })
        .eq("id", topic.id);
    }

    revalidatePath(CONTENT_PATH, "layout");

    return {
      ok: true,
      data: {
        article: { ...updatedArticle, seo_score: seo.score, geo_score: geo.score },
        seo: seoRow ? rowToSeoCheck(seoRow) : { id: "_", article_id: article.id, score: seo.score, checks: seo.checks, created_at: new Date().toISOString() },
        geo: geoRow ? rowToGeoCheck(geoRow) : { id: "_", article_id: article.id, score: geo.score, checks: geo.checks, created_at: new Date().toISOString() },
        summary: optimized.summary,
        before,
        after: { seo: seo.score, geo: geo.score },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tool: generate_topic_ideas
 *
 * Returns N seasonally-shaped Smoky Mountain homeowner blog ideas. The
 * implementation is a deterministic local generator today; a managed
 * agent with web search can be plugged in here later without changing
 * the call sites.
 */
export async function generateTopicIdeas(input: {
  count?: number;
}): Promise<Result<{ ideas: TopicIdea[] }>> {
  try {
    await requireAdminOrAbove();
    const ideas = generateLocalTopicIdeas({ count: input.count });
    return { ok: true, data: { ideas } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tool: add_suggested_topic_to_backlog
 *
 * One-click promote a generated idea to a real topic + seeded article.
 */
export async function addSuggestedTopicToBacklog(input: {
  space_id: string;
  idea: TopicIdea;
}): Promise<Result<TopicWithArticle>> {
  try {
    const userId = await requireAdminOrAbove();
    const supabase = await db();
    const { idea } = input;

    const { data, error } = await supabase
      .from("content_topics")
      .insert({
        space_id: input.space_id,
        title: idea.title,
        pillar: idea.pillar,
        priority: idea.priority,
        target_keyword: idea.target_keyword,
        secondary_keywords: idea.secondary_keywords,
        angle: idea.angle,
        hypothesis: idea.hypothesis,
        created_by: userId,
        owner_id: userId,
      })
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    const topic = rowToTopic(data);

    await supabase.from("content_articles").insert({
      topic_id: topic.id,
      title: idea.title,
      brief_md: buildBriefMarkdown(idea),
      outline_md: "",
      body_md: "",
    });

    revalidatePath(CONTENT_PATH, "layout");
    const full = await getTopic(topic.id);
    return { ok: true, data: full ?? { ...topic, article: null } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Studio-level chat dispatcher (separate from the per-article agent
 * chat). Routes a free-form Jack message to the right capability:
 *   - topic creation intent      → createTopicFromConversation
 *   - research / ideation intent → generateTopicIdeas
 *   - otherwise                  → instructional reply
 *
 * This is the entry point the UI calls. The agent prompt + tool list
 * lives in `agent-prompt.ts`; this dispatcher is the local fallback.
 */
export async function runStudioChat(input: {
  space_id: string;
  message: string;
}): Promise<Result<StudioChatResult>> {
  try {
    await requireAdminOrAbove();
    const intent = detectIntent(input.message);

    if (intent.kind === "paste_draft") {
      const imported = await createTopicFromPastedDraft({
        space_id: input.space_id,
        body: intent.body,
      });
      if (!imported.ok) return imported;
      return {
        ok: true,
        data: {
          kind: "imported",
          topic: imported.data.topic,
          draft: imported.data.draft,
          word_count: imported.data.word_count,
          message: `Imported your draft as "${imported.data.draft.title}" (${imported.data.word_count} words). It's parsed into the post canvas on the right. Open it to optimize for SEO with one click.`,
        },
      };
    }

    if (intent.kind === "optimize_seo") {
      // Studio-level chat doesn't have a single article context; the
      // SEO pass needs to run inside the article workspace. Tell Jack
      // to open a topic and re-run the action there.
      return {
        ok: true,
        data: {
          kind: "needs_target",
          reason: "optimize_seo",
          message:
            "Open the topic you want to optimize and I'll run a full SEO pass on it from the article workspace. Or paste your draft here and I'll import it first.",
        },
      };
    }

    if (intent.kind === "create_topic") {
      const created = await createTopicFromConversation({
        space_id: input.space_id,
        message: input.message,
      });
      if (!created.ok) return created;
      return {
        ok: true,
        data: {
          kind: "created",
          topic: created.data.topic,
          draft: created.data.draft,
          message: `Added "${created.data.draft.title}" to the backlog as ${created.data.draft.pillar.replaceAll("_", " ")}. Brief and key points are pre-filled — open the workspace to refine.`,
        },
      };
    }

    if (intent.kind === "generate_ideas") {
      const result = await generateTopicIdeas({ count: intent.count });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          kind: "ideas",
          ideas: result.data.ideas,
          message: `Pulled ${result.data.ideas.length} ideas tuned to the current season. One click adds any of them to the backlog.`,
        },
      };
    }

    return {
      ok: true,
      data: {
        kind: "message",
        message:
          'Tell me what to write about, paste a draft, or ask me to research ideas. Examples: "write about gap nights in Pigeon Forge", "research ideas for May", or paste a draft you already have and I\'ll import it.',
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function buildBriefMarkdown(draft: TopicDraft | TopicIdea): string {
  const lines: string[] = [];
  lines.push("## Brief");
  lines.push("");
  lines.push(draft.brief);
  lines.push("");
  lines.push("## Angle");
  lines.push("");
  lines.push(draft.angle);
  lines.push("");
  lines.push("## Hypothesis");
  lines.push("");
  lines.push(draft.hypothesis);
  lines.push("");
  if (draft.key_points.length > 0) {
    lines.push("## Key points to cover");
    lines.push("");
    for (const point of draft.key_points) {
      lines.push(`- ${point}`);
    }
    lines.push("");
  }
  lines.push("## Keywords");
  lines.push("");
  lines.push(`- Primary: ${draft.target_keyword}`);
  if (draft.secondary_keywords.length > 0) {
    lines.push(`- Secondary: ${draft.secondary_keywords.join(", ")}`);
  }
  return lines.join("\n");
}
