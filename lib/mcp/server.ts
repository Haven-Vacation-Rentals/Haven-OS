/**
 * MCP JSON-RPC dispatcher.
 *
 * Handles the small slice of the protocol Claude Code / claude.ai use over
 * Streamable HTTP:
 *
 *   - initialize          → handshake + capability advertisement
 *   - notifications/initialized → ignored ack
 *   - tools/list          → enumerate curated tools
 *   - tools/call          → run a tool, returning MCP content blocks
 *   - ping                → liveness
 *
 * Other methods reply with -32601 Method not found.
 */

import {
  JSON_RPC_ERRORS,
  type JsonRpcError,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type JsonRpcSuccess,
  type McpToolCallResult,
} from "./types";
import type { ApiAuthContext } from "@/lib/api-tokens/auth";
import { hasApiScope } from "@/lib/api-tokens/auth";
import { MCP_TOOLS, MCP_TOOLS_BY_NAME } from "./tools";

// Protocol versions we understand, newest first. We echo the client's
// requested version if it's in this list; otherwise we fall back to our
// newest supported version. Claude's connector currently negotiates one
// of these on initialize.
export const MCP_SUPPORTED_PROTOCOL_VERSIONS = [
  "2025-06-18",
  "2025-03-26",
] as const;
export const MCP_LATEST_PROTOCOL_VERSION = MCP_SUPPORTED_PROTOCOL_VERSIONS[0];

const SERVER_INFO = {
  name: "haven-os",
  title: "Haven OS",
  version: "1.0.0",
} as const;

function success(
  id: string | number | null | undefined,
  result: unknown,
): JsonRpcSuccess {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function failure(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

/**
 * Negotiate the protocol version off an `initialize` request. We accept the
 * client's requested version if we support it; otherwise we respond with our
 * newest supported version (per MCP spec — the client then decides whether
 * to proceed or abort).
 */
function negotiateProtocolVersion(params: unknown): string {
  const requested =
    params && typeof params === "object" && "protocolVersion" in params
      ? (params as { protocolVersion?: unknown }).protocolVersion
      : undefined;
  if (typeof requested === "string") {
    if ((MCP_SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)) {
      return requested;
    }
  }
  return MCP_LATEST_PROTOCOL_VERSION;
}

/**
 * Dispatch a single JSON-RPC request. Returns `null` for notifications
 * (no id) — MCP servers must not respond to notifications.
 */
export async function dispatchMcp(
  req: JsonRpcRequest,
  authCtx: ApiAuthContext,
): Promise<JsonRpcResponse | null> {
  const isNotification = req.id === undefined || req.id === null;

  // Notifications: don't reply. The only one we expect is
  // `notifications/initialized` from the client after handshake.
  if (isNotification) {
    return null;
  }

  switch (req.method) {
    case "initialize": {
      const protocolVersion = negotiateProtocolVersion(req.params);
      return success(req.id, {
        protocolVersion,
        capabilities: {
          // listChanged: true is the spec example and what Claude expects to
          // see — keeps the capability shape identical to the SDK default.
          tools: { listChanged: true },
        },
        serverInfo: SERVER_INFO,
        instructions:
          "Haven OS — internal operating system for Haven Vacation Rentals. Tools wrap Tasks, Lost Items, and Content Studio. Calls are scoped to the personal access token's owner; the token cannot do anything the owner cannot do.",
      });
    }

    case "ping":
      return success(req.id, {});

    case "tools/list":
      return success(req.id, {
        tools: MCP_TOOLS.filter((t) => hasApiScope(authCtx, t.scope)).map((t) => {
          // `title` was only added to the Tool shape in 2025-06-18. Emit it
          // alongside `name` + `description` + `inputSchema` — older clients
          // ignore unknown fields per JSON-RPC, newer ones use it for the
          // display label.
          const out: Record<string, unknown> = {
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          };
          if (t.title) out.title = t.title;
          return out;
        }),
      });

    case "tools/call": {
      const params =
        (req.params as { name?: string; arguments?: Record<string, unknown> } | undefined) ??
        {};
      const toolName = params.name;
      if (!toolName) {
        return failure(req.id, JSON_RPC_ERRORS.invalidParams, "Missing tool name");
      }
      const tool = MCP_TOOLS_BY_NAME[toolName];
      if (!tool) {
        return failure(
          req.id,
          JSON_RPC_ERRORS.notFound,
          `Unknown tool: ${toolName}`,
        );
      }
      if (!hasApiScope(authCtx, tool.scope)) {
        return failure(
          req.id,
          JSON_RPC_ERRORS.forbidden,
          `Token missing required scope: ${tool.scope}`,
        );
      }
      let result: McpToolCallResult;
      try {
        result = await tool.handler(params.arguments ?? {}, authCtx);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Tool execution failed";
        return success(req.id, toCallResult({ isError: true, text: message }));
      }
      return success(req.id, toCallResult(result));
    }

    case "notifications/initialized":
      // Defensive — clients should send this without an id, but if they
      // include one, ack with an empty result rather than error.
      return success(req.id, {});

    default:
      return failure(
        req.id,
        JSON_RPC_ERRORS.methodNotFound,
        `Method not found: ${req.method}`,
      );
  }
}

/**
 * MCP `tools/call` returns content blocks. We pack the human-readable
 * `text` into a text block, and stash structured `data` into the
 * (optional) structuredContent field — Claude reads either.
 */
function toCallResult(r: McpToolCallResult): Record<string, unknown> {
  const text =
    r.text ??
    (r.data !== undefined ? JSON.stringify(r.data, null, 2) : "");
  const content = [{ type: "text", text: text || "(no output)" }];
  const out: Record<string, unknown> = { content };
  if (r.isError) out.isError = true;
  if (r.data !== undefined) out.structuredContent = r.data;
  return out;
}
