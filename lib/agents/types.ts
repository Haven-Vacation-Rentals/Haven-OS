// Types used by the Managed Agents integration (client + UI).

export type AgentStreamEvent =
  | { type: "status"; status: string }
  | { type: "text"; text: string }
  | { type: "tool_use"; name: string; input: unknown }
  | { type: "tool_result"; output: string; isError?: boolean }
  | { type: "done" }
  | { type: "error"; message: string };
