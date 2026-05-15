/**
 * Haven OS — Model Context Protocol (MCP) endpoint.
 *
 * Single HTTPS endpoint that speaks MCP over Streamable HTTP / JSON-RPC 2.0,
 * so Claude (claude.ai or Claude Code) can use Haven OS tools without local
 * proxies. Authentication: same Personal Access Token system as /api/v1.
 *
 *   POST /api/mcp        — JSON-RPC requests + notifications
 *   GET  /api/mcp        — capability probe / SSE (we return a 405 hint;
 *                          Streamable HTTP clients use POST for everything)
 *
 * Auth: `Authorization: Bearer <hvn_pat_…>` (Personal Access Token)
 *       or `Authorization: Bearer <hvn_mcp_…>` (OAuth access token,
 *       issued via the dynamic-client-registration + PKCE flow under
 *       /api/mcp/oauth/*). The same scope catalog applies to both.
 *
 * Every successful tool call is logged to `api_access_logs` against the
 * token owner, just like /api/v1.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { logApiAccess } from "@/lib/api-tokens/auth";
import { authenticateMcpRequest } from "@/lib/mcp/auth-bearer";
import {
  dispatchMcp,
  MCP_SUPPORTED_PROTOCOL_VERSIONS,
} from "@/lib/mcp/server";
import {
  JSON_RPC_ERRORS,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "@/lib/mcp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// CORS — Claude.ai's remote MCP client opens the connection from the
// browser, so we need to allow it via CORS. We mirror the request's Origin
// when present (rather than `*`) so browsers will send the
// Authorization header.
//
// `Mcp-Session-Id` and `MCP-Protocol-Version` are part of the Streamable
// HTTP transport handshake and must be both accepted on requests and
// exposed on responses so Claude's browser-side connector can read them.
// ---------------------------------------------------------------------------

const ALLOWED_HEADERS =
  "Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID";
const EXPOSED_HEADERS =
  "Mcp-Session-Id, MCP-Session-Id, MCP-Protocol-Version, WWW-Authenticate";

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = corsHeaders(req);
  const accept = req.headers.get("accept") ?? "";

  // Per MCP Streamable HTTP spec: GET is used by clients to open a
  // server-initiated SSE stream. We don't push server-initiated messages,
  // so we explicitly return 405 — clients fall back to POST-only mode.
  if (accept.includes("text/event-stream")) {
    return new NextResponse(null, {
      status: 405,
      headers: { ...cors, Allow: "POST, OPTIONS" },
    });
  }

  // Human / curl probe — friendly hint.
  return NextResponse.json(
    {
      server: "haven-os-mcp",
      transport: "streamable-http",
      protocolVersions: MCP_SUPPORTED_PROTOCOL_VERSIONS,
      message:
        "POST JSON-RPC 2.0 requests to this URL with `Authorization: Bearer <hvn_pat_…>`. See /docs/HAVEN_OS_MCP.md.",
    },
    { headers: cors },
  );
}

// Allow clients to explicitly terminate a session. We're stateless, so
// just acknowledge.
export async function DELETE(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);

  // Validate MCP-Protocol-Version header (spec: 2025-06-18 §Transports).
  // If the client supplies one and we don't speak it, RFC says 400.
  // Missing header → treat as 2025-03-26 default.
  const clientProtocol = req.headers.get("mcp-protocol-version");
  if (
    clientProtocol &&
    !(MCP_SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(clientProtocol)
  ) {
    return jsonRpcResponse(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: JSON_RPC_ERRORS.invalidRequest,
          message: `Unsupported MCP-Protocol-Version: ${clientProtocol}`,
        },
      },
      400,
      cors,
    );
  }

  const auth = await authenticateMcpRequest(req);
  if (!auth.ok) {
    // authenticateMcpRequest already returns a 401 with the right
    // WWW-Authenticate hint pointing at /.well-known.
    const errRes = auth.response;
    for (const [k, v] of Object.entries(cors)) errRes.headers.set(k, v);
    return errRes;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonRpcResponse(
      { jsonrpc: "2.0", id: null, error: { code: JSON_RPC_ERRORS.parseError, message: "Invalid JSON" } },
      400,
      cors,
    );
  }

  // JSON-RPC 2.0 allows a batch — array of requests. Handle both shapes.
  const isBatch = Array.isArray(body);
  const requests = (isBatch ? body : [body]) as JsonRpcRequest[];
  if (requests.length === 0) {
    return jsonRpcResponse(
      { jsonrpc: "2.0", id: null, error: { code: JSON_RPC_ERRORS.invalidRequest, message: "Empty batch" } },
      400,
      cors,
    );
  }

  const responses: JsonRpcResponse[] = [];
  let isInitialize = false;
  for (const r of requests) {
    if (!r || typeof r !== "object" || r.jsonrpc !== "2.0" || typeof r.method !== "string") {
      responses.push({
        jsonrpc: "2.0",
        id: (r && typeof r === "object" && "id" in r ? (r as JsonRpcRequest).id : null) ?? null,
        error: { code: JSON_RPC_ERRORS.invalidRequest, message: "Invalid JSON-RPC request" },
      });
      continue;
    }
    if (r.method === "initialize") isInitialize = true;

    const res = await dispatchMcp(r, auth.ctx);
    if (res) responses.push(res);

    // Audit per-request — surface the JSON-RPC method (or tool name) so the
    // access log distinguishes individual MCP calls.
    const statusCode = res && "error" in res ? 400 : 200;
    const toolName =
      r.method === "tools/call" && r.params
        ? (r.params as { name?: string } | undefined)?.name
        : undefined;
    const auditPath = toolName ? `/api/mcp/${toolName}` : `/api/mcp`;
    const auditMethod = `MCP:${r.method}`;
    logApiAccess(req, auth.ctx, statusCode, {
      method: auditMethod,
      path: auditPath,
    }).catch(() => {});
  }

  // Per the Streamable HTTP spec, the server must return 202 Accepted with
  // no body for notification-only / response-only POST bodies. (Some
  // clients — Claude included — send `notifications/initialized` as a bare
  // POST and may treat a JSON-RPC reply as a protocol violation.)
  if (responses.length === 0) {
    return new NextResponse(null, { status: 202, headers: cors });
  }

  const responseHeaders: Record<string, string> = { ...cors };

  // Issue an Mcp-Session-Id on initialize. We're stateless so any opaque
  // UUID works — clients echo it back on subsequent requests but we don't
  // validate it. Returning one helps clients that branch on whether the
  // server declared a session (Claude's connector does).
  if (isInitialize) {
    const sid =
      req.headers.get("mcp-session-id") ??
      req.headers.get("Mcp-Session-Id") ??
      randomUUID();
    responseHeaders["Mcp-Session-Id"] = sid;
  }

  const payload: unknown = isBatch ? responses : responses[0];
  return jsonRpcResponse(payload, 200, responseHeaders);
}

function jsonRpcResponse(
  payload: unknown,
  status: number,
  headers: Record<string, string>,
): NextResponse {
  return NextResponse.json(payload, { status, headers });
}
