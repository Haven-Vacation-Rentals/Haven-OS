/**
 * POST /api/agents/sync-tools
 *
 * Pushes the Haven OS custom tools + system prompt to the configured
 * HavenOS Managed Agent. Gated to HR admins (Jack's role).
 *
 * Call manually with a signed-in admin session:
 *
 *   curl -X POST https://haven-os-five.vercel.app/api/agents/sync-tools \
 *     -H "Cookie: ..."
 *
 * Or trigger from the /agents page once we wire a button in.
 *
 * Safe to re-run; it replaces the tool list + system prompt each time.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isHrAdmin } from "@/lib/hr/actions";
import {
  toolSchemasForAnthropic,
  HAVEN_OS_SYSTEM_PROMPT,
} from "@/lib/agents/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const admin = await isHrAdmin(user.email ?? null);
  if (!admin) {
    return NextResponse.json(
      { error: "Requires HR admin" },
      { status: 403 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const agentId = process.env.ANTHROPIC_AGENT_ID?.trim();
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY or ANTHROPIC_AGENT_ID missing" },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: any = await (client.beta.agents as any).retrieve(agentId);
    const customTools = toolSchemasForAnthropic().map((t) => ({
      type: "custom" as const,
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated: any = await (client.beta.agents as any).update(agentId, {
      version: current.version,
      system: HAVEN_OS_SYSTEM_PROMPT,
      tools: [{ type: "agent_toolset_20260401" }, ...customTools],
    });

    return NextResponse.json({
      ok: true,
      agent_id: updated.id,
      name: updated.name,
      previous_version: current.version,
      new_version: updated.version,
      custom_tool_count: customTools.length,
      tool_names: customTools.map((t) => t.name),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.error ?? null;
    return NextResponse.json(
      { error: message, detail },
      { status: 500 },
    );
  }
}
