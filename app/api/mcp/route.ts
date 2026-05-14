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
 * Auth: `Authorization: Bearer <hvn_pat_…>`
 *
 * Every successful tool call is logged to `api_access_logs` against the
 * token owner, just like /api/v1.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticatePat,
  logApiAccess,
} from "@/lib/api-tokens/auth";
import { dispatchMcp } from "@/lib/mcp/server";
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
// ---------------------------------------------------------------------------

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Session-Id",
    "Access-Control-Expose-Headers": "MCP-Session-Id",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  // Streamable HTTP MCP clients use POST. We expose GET to give humans a
  // friendly hint and to act as a liveness probe.
  return NextResponse.json(
    {
      server: "haven-os-mcp",
      transport: "streamable-http",
      message:
        "POST JSON-RPC 2.0 requests to this URL with `Authorization: Bearer <hvn_pat_…>`. See /docs/HAVEN_OS_MCP.md.",
    },
    { headers: corsHeaders(req) },
  );
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);

  const auth = await authenticatePat(req);
  if (!auth.ok) {
    // authenticatePat already returns a 401 with the right shape.
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
  for (const r of requests) {
    if (!r || typeof r !== "object" || r.jsonrpc !== "2.0" || typeof r.method !== "string") {
      responses.push({
        jsonrpc: "2.0",
        id: (r && typeof r === "object" && "id" in r ? (r as JsonRpcRequest).id : null) ?? null,
        error: { code: JSON_RPC_ERRORS.invalidRequest, message: "Invalid JSON-RPC request" },
      });
      continue;
    }
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

  const payload: unknown = isBatch ? responses : responses[0];
  return jsonRpcResponse(payload, 200, cors);
}

function jsonRpcResponse(
  payload: unknown,
  status: number,
  cors: Record<string, string>,
): NextResponse {
  return NextResponse.json(payload, { status, headers: cors });
}
