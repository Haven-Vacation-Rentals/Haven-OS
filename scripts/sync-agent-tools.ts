/**
 * Push Haven OS custom tools + system prompt to the HavenOS Managed Agent.
 *
 * Reads ANTHROPIC_API_KEY and ANTHROPIC_AGENT_ID from process.env
 * (same as the app).
 *
 * Usage:
 *   npx tsx scripts/sync-agent-tools.ts
 *
 * Safe to re-run; it replaces the tools + system prompt each time.
 * Built-in tools (bash, text_editor, web_search, web_fetch) are preserved
 * by including the agent_toolset_20260401 entry alongside the custom tools.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  toolSchemasForAnthropic,
  HAVEN_OS_SYSTEM_PROMPT,
} from "../lib/agents/tools";

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const agentId = process.env.ANTHROPIC_AGENT_ID?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  if (!agentId) throw new Error("ANTHROPIC_AGENT_ID missing");

  const client = new Anthropic({ apiKey });

  // Step 1: retrieve current agent to get version number.
  console.log(`Retrieving agent ${agentId}…`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const current: any = await (client.beta.agents as any).retrieve(agentId);
  console.log(`  name=${current.name} model=${JSON.stringify(current.model)} version=${current.version}`);

  const customTools = toolSchemasForAnthropic().map((t) => ({
    type: "custom" as const,
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  console.log(`Syncing ${customTools.length} custom tools…`);

  // Step 2: update the agent with system prompt + tool list.
  // Preserve built-in agent toolset (bash, text_editor, web_search, web_fetch)
  // alongside our custom tools.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated: any = await (client.beta.agents as any).update(agentId, {
    version: current.version,
    system: HAVEN_OS_SYSTEM_PROMPT,
    tools: [{ type: "agent_toolset_20260401" }, ...customTools],
  });

  console.log(
    `Done. Agent is now version ${updated.version}. Custom tools: ${customTools.length}`,
  );
  console.log("Tool names:", customTools.map((t) => t.name).join(", "));
}

main().catch((err) => {
  console.error("Sync failed:", err?.message ?? err);
  if (err?.error) console.error("Error detail:", JSON.stringify(err.error, null, 2));
  process.exit(1);
});
