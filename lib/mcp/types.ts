/**
 * Minimal MCP (Model Context Protocol) types used by the Haven OS server.
 *
 * We implement the protocol directly over JSON-RPC 2.0 rather than pulling
 * in `@modelcontextprotocol/sdk` — the surface we need (initialize, tools/list,
 * tools/call) is small, and avoiding the dep keeps the Next.js bundle lean.
 *
 * Protocol reference: https://modelcontextprotocol.io
 */

import type { ApiAuthContext } from "@/lib/api-tokens/auth";
import type { ApiScope } from "@/lib/api-tokens/types";

// ---------------------------------------------------------------------------
// JSON-RPC 2.0
// ---------------------------------------------------------------------------

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: string | number | null;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export const JSON_RPC_ERRORS = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalError: -32603,
  // App-defined
  unauthorized: -32001,
  forbidden: -32002,
  notFound: -32004,
} as const;

// ---------------------------------------------------------------------------
// MCP tool shape
// ---------------------------------------------------------------------------

/**
 * A JSON Schema (Draft 2020-12 / OpenAPI 3.1 compatible subset). Kept as
 * `Record<string, unknown>` since MCP just forwards this to the client.
 */
export type JsonSchema = Record<string, unknown>;

export interface McpToolCallResult {
  /** Free-form structured payload (for programmatic clients). */
  data?: unknown;
  /** Human-readable text that Claude can show / reason over. */
  text?: string;
  /** If true, the call failed but the protocol succeeded — surfaced as `isError`. */
  isError?: boolean;
}

export interface McpTool {
  name: string;
  title?: string;
  description: string;
  scope: ApiScope;
  inputSchema: JsonSchema;
  handler: (
    args: Record<string, unknown>,
    ctx: ApiAuthContext,
  ) => Promise<McpToolCallResult>;
}

export interface McpToolListing {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}
