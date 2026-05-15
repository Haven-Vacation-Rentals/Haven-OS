/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414) for the Haven
 * OS MCP endpoint.
 *
 * Claude (claude.ai mobile / desktop custom connectors) fetches this
 * URL to discover where to send dynamic client registration requests,
 * the authorize / token / revoke endpoints, and which PKCE methods
 * and scopes the server supports.
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
      issuer: origin,
      authorization_endpoint: `${origin}/api/mcp/oauth/authorize`,
      token_endpoint: `${origin}/api/mcp/oauth/token`,
      registration_endpoint: `${origin}/api/mcp/oauth/register`,
      revocation_endpoint: `${origin}/api/mcp/oauth/revoke`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      revocation_endpoint_auth_methods_supported: ["none"],
      scopes_supported: MCP_OAUTH_SCOPES,
      service_documentation: `${origin}/docs/HAVEN_OS_MCP.md`,
    },
    { headers: corsHeaders() },
  );
}
