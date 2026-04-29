/**
 * GET  /api/v1/content/topics  — list topics, optionally filtered by space_id.
 * POST /api/v1/content/topics  — create a topic.
 */

import { NextResponse } from "next/server";
import {
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "content:read" }, async (req, ctx) => {
  const url = new URL(req.url);
  const spaceId = url.searchParams.get("space_id");
  let q = ctx.admin
    .from("content_topics")
    .select("*")
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (spaceId) q = q.eq("space_id", spaceId);
  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ topics: data ?? [] });
});

interface CreateTopicBody {
  space_id?: string;
  title?: string;
  pillar?: string;
  priority?: string;
  target_keyword?: string;
  secondary_keywords?: string[];
  due_date?: string | null;
  brief?: string | null;
}

export const POST = withApi({ scope: "content:write" }, async (req, ctx) => {
  const body = await readJson<CreateTopicBody>(req);
  if (!body) return jsonError(400, "Invalid JSON body");
  if (!body.space_id) return jsonError(400, "space_id is required");
  if (!body.title?.trim()) return jsonError(400, "title is required");

  const insert: Record<string, unknown> = {
    space_id: body.space_id,
    title: body.title.trim(),
    target_keyword: body.target_keyword ?? null,
    secondary_keywords: body.secondary_keywords ?? [],
    due_date: body.due_date ?? null,
    created_by: ctx.actor.id,
  };
  if (body.pillar) insert.pillar = body.pillar;
  if (body.priority) insert.priority = body.priority;

  const { data, error } = await ctx.admin
    .from("content_topics")
    .insert(insert)
    .select("*")
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ topic: data }, { status: 201 });
});
