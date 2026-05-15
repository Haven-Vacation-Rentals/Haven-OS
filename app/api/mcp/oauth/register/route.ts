/**
 * Dynamic Client Registration (RFC 7591) for the MCP OAuth server.
 *
 * Claude's custom-connector flow uses this to mint a client_id on the
 * fly. We support public clients only (no secret), with PKCE
 * (S256) enforced at /authorize.
 *
 * Request:
 *   POST /api/mcp/oauth/register
 *   {
 *     "client_name": "Claude",
 *     "redirect_uris": ["https://claude.ai/api/oauth/callback"],
 *     "token_endpoint_auth_method": "none",
 *     "grant_types": ["authorization_code", "refresh_token"],
 *     "response_types": ["code"],
 *     "scope": "tasks:read tasks:write ..."
 *   }
 *
 * Response (201):
 *   {
 *     "client_id": "hvn_mcp_client_…",
 *     "client_id_issued_at": 1737000000,
 *     "token_endpoint_auth_method": "none",
 *     "redirect_uris": [...],
 *     "grant_types": [...],
 *     "response_types": ["code"],
 *     "scope": "...",
 *     "client_name": "Claude"
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { generateClientId } from "@/lib/mcp/oauth/secret";
import { insertClient } from "@/lib/mcp/oauth/store";
import { MCP_OAUTH_SCOPES, parseScopeParam } from "@/lib/mcp/oauth/scopes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface RegisterRequest {
  client_name?: string;
  redirect_uris?: unknown;
  token_endpoint_auth_method?: string;
  grant_types?: unknown;
  response_types?: unknown;
  scope?: string;
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders();

  let body: RegisterRequest;
  try {
    body = (await req.json()) as RegisterRequest;
  } catch {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "Invalid JSON" },
      { status: 400, headers: cors },
    );
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((s): s is string => typeof s === "string")
    : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: "At least one redirect_uri is required",
      },
      { status: 400, headers: cors },
    );
  }
  for (const uri of redirectUris) {
    if (!isAcceptableRedirectUri(uri)) {
      return NextResponse.json(
        {
          error: "invalid_redirect_uri",
          error_description: `Redirect URI must use https or be a localhost URI: ${uri}`,
        },
        { status: 400, headers: cors },
      );
    }
  }

  // We only issue public clients. Reject anything that asks for a
  // secret-based auth method.
  const authMethod = body.token_endpoint_auth_method ?? "none";
  if (authMethod !== "none") {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description:
          "Only public clients (token_endpoint_auth_method=\"none\") are supported",
      },
      { status: 400, headers: cors },
    );
  }

  // Filter the scope set against what the server supports.
  const scopes = parseScopeParam(body.scope);

  // Validate any explicit grant_types/response_types — must be the
  // subsets we support.
  if (Array.isArray(body.grant_types)) {
    for (const g of body.grant_types) {
      if (g !== "authorization_code" && g !== "refresh_token") {
        return NextResponse.json(
          {
            error: "invalid_client_metadata",
            error_description: `Unsupported grant_type: ${String(g)}`,
          },
          { status: 400, headers: cors },
        );
      }
    }
  }
  if (Array.isArray(body.response_types)) {
    for (const r of body.response_types) {
      if (r !== "code") {
        return NextResponse.json(
          {
            error: "invalid_client_metadata",
            error_description: `Unsupported response_type: ${String(r)}`,
          },
          { status: 400, headers: cors },
        );
      }
    }
  }

  const clientName =
    typeof body.client_name === "string"
      ? body.client_name.slice(0, 120)
      : null;
  const client_id = generateClientId();

  const row = await insertClient({
    client_id,
    client_name: clientName,
    redirect_uris: redirectUris,
    scopes,
  });
  if (!row) {
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "Failed to register client",
      },
      { status: 500, headers: cors },
    );
  }

  return NextResponse.json(
    {
      client_id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      token_endpoint_auth_method: "none",
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: scopes.join(" "),
      client_name: clientName,
      // Server-supported scope catalog as a hint to the client.
      supported_scopes: MCP_OAUTH_SCOPES,
    },
    { status: 201, headers: cors },
  );
}

function isAcceptableRedirectUri(uri: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return false;
  }
  if (parsed.protocol === "https:") return true;
  if (
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  ) {
    return true;
  }
  // Allow custom-scheme native redirects (e.g. claude://oauth/callback).
  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:" &&
    /^[a-z][a-z0-9+\-.]*:$/i.test(parsed.protocol)
  ) {
    return true;
  }
  return false;
}
