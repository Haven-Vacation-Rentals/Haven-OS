/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728 draft) for /api/mcp.
 *
 * The 401 from /api/mcp points clients here via the WWW-Authenticate
 * `resource_metadata` parameter. Claude reads this document to find
 * the matching authorization server for the resource.
 */

import { NextRequest, NextResponse } from "next/server";
import { MCP_OAUTH_SCOPES } from "@/lib/mcp/oauth/scopes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Cache-Control": "public, max-age=300",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return NextResponse.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      bearer_methods_supported: ["header"],
      scopes_supported: MCP_OAUTH_SCOPES,
      resource_documentation: `${origin}/docs/HAVEN_OS_MCP.md`,
    },
    { headers: corsHeaders() },
  );
}
