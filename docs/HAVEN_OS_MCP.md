# Haven OS — MCP Server

Haven OS exposes a hosted **Model Context Protocol** endpoint so Claude
(claude.ai or Claude Code) can read and write into the parts of the
operating system Jack & the team use most: **Tasks**, **Lost Items**,
and **Paid Advertising** (the paid-ads project tracker).

The endpoint speaks MCP over Streamable HTTP / JSON-RPC 2.0. There is no
local proxy or stdio bridge — Claude connects directly over HTTPS, with
a Personal Access Token (PAT) used as the bearer credential.

- **Endpoint:** `https://www.havenvros.com/api/mcp`
- **Auth:** `Authorization: Bearer hvn_pat_…` (PAT)
  *or* OAuth 2.0 + PKCE (`Authorization: Bearer hvn_mcp_…`,
  issued via `/api/mcp/oauth/*` — Claude's "Add custom connector"
  flow uses this automatically)
- **Transport:** Streamable HTTP (JSON-RPC 2.0 POST)

## Connecting from Claude

### Claude (web + mobile) — recommended, OAuth flow

The simplest path. Claude does the OAuth + PKCE handshake itself; no
token to paste.

1. In Claude (web), open **Settings → Connectors → Add custom
   connector**.
2. Enter the URL `https://www.havenvros.com/api/mcp`.
3. Claude pops open Haven OS. Sign in with your Haven Google account if
   prompted, then approve the requested scopes on the
   `/mcp/consent` screen.
4. You're done — Claude (web *and* mobile, on the same Claude account)
   can now use the Haven OS tool set.

Behind the scenes Claude calls these endpoints:

- `GET  /.well-known/oauth-authorization-server` — server metadata
- `GET  /.well-known/oauth-protected-resource` — resource metadata
- `POST /api/mcp/oauth/register` — dynamic client registration (public client, no secret)
- `GET  /api/mcp/oauth/authorize` — auth code w/ PKCE S256
- `POST /api/mcp/oauth/token` — exchange code → access (1h) + refresh (30d)
- `POST /api/mcp/oauth/revoke` — RFC 7009 revocation

Access tokens use the `hvn_mcp_…` prefix to distinguish them from PATs;
both are accepted on `/api/mcp` and share the same scope catalog.

You can revoke an approved connector anytime from **Settings →
Personal Access Tokens** under "Claude Connector (MCP)".

### claude.ai (remote MCP) — legacy PAT path

1. In Haven OS, open **Settings → Personal Access Tokens** and mint a
   token. Either grant `platform:full` (broad) or the narrow set the
   integration actually needs:
   - `tasks:read`, `tasks:write`
   - `lost-items:read`, `lost-items:write`
   - `content:read`, `content:write`
   - `me:read` (always recommended — lets Claude verify identity)
2. Copy the raw token (`hvn_pat_…`). It is shown only once.
3. In Claude, add a custom remote MCP connector:
   - **URL:** `https://www.havenvros.com/api/mcp`
   - **Auth:** Bearer token; paste the PAT.
4. Claude will call `initialize` + `tools/list` and surface the Haven
   tool set. Try: *"What's on my Haven task list this week?"*

### Claude Code (CLI)

`claude mcp add` accepts a hosted Streamable HTTP server with a custom
header:

```bash
claude mcp add \
  --transport streamable-http \
  --header "Authorization: Bearer hvn_pat_…" \
  haven https://www.havenvros.com/api/mcp
```

You can also drop this into `~/.claude/mcp.json` (or the per-project
equivalent):

```json
{
  "mcpServers": {
    "haven": {
      "type": "streamable-http",
      "url": "https://www.havenvros.com/api/mcp",
      "headers": {
        "Authorization": "Bearer hvn_pat_REPLACE_ME"
      }
    }
  }
}
```

For local development, swap the URL for
`http://localhost:3000/api/mcp` and use a PAT minted against the dev
database.

## Tools

Each tool runs as the PAT's owner — the same user/list/space
permissions that gate the UI apply here. The token cannot do anything
its owner cannot.

| Tool                          | Scope             | What it does                                                                  |
| ----------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `get_me`                      | `me:read`         | Return the authenticated user's profile + effective scopes.                   |
| `list_tasks`                  | `tasks:read`      | List the user's assigned tasks. Filter by `status` (`open`/`done`/`all`).     |
| `create_task`                 | `tasks:write`     | Create a task on the user's personal list, auto-assigned to the caller.       |
| `update_task_status`          | `tasks:write`     | Mark complete, change priority, update due date, or move status_id.           |
| `list_lost_items`             | `lost-items:read` | List Lost Items cases, optionally filtered by status.                         |
| `create_lost_item_case`       | `lost-items:write`| Open a new Lost Items case (item description, property, guest, photos).      |
| `update_lost_item_status`     | `lost-items:write`| Move a case through `pending_pickup → picked_up → delivered → completed`.    |
| `list_content_spaces`         | `content:read`    | List Paid Advertising spaces (parents of ad cards).                           |
| `list_content_ideas`          | `content:read`    | List Paid Advertising ad cards, filterable by `space_id` and `stage`.         |
| `create_content_idea`         | `content:write`   | Add an ad card to a Paid Advertising space (defaults to stage=`idea`).        |
| `update_content_status`       | `content:write`   | Move an ad through `idea → in_progress → draft → complete`.                   |

Every tool ships with a full JSON Schema for its arguments, so Claude
gets type information, enum values, and field descriptions inline.

## Scopes

Scopes match the existing `/api/v1` system:

- `platform:full` satisfies any scope check (broadest grant). PAT only;
  not selectable via the Claude OAuth consent screen.
- `tasks:read` / `tasks:write` — Tasks tools.
- `lost-items:read` / `lost-items:write` — Lost Items tools.
- `content:read` / `content:write` — Paid Advertising tools.
- `me:read` — `get_me`.

The Claude OAuth flow advertises and accepts only the granular
subset above (`me:read`, `tasks:*`, `lost-items:*`, `content:*`) so a
connector can never be issued the broad `platform:full` grant.

If a token lacks a tool's scope, that tool is hidden from `tools/list`
and `tools/call` returns `-32002 forbidden`. Calls never elevate the
actor's app-level role.

## Audit log

Every MCP call is written to `api_access_logs` with:

- `token_id`, `profile_id`
- `method` = `MCP:tools/call` (or `MCP:initialize`, etc.)
- `path` = `/api/mcp/<tool_name>` for tool calls, `/api/mcp` otherwise
- `status_code` (200 success, 400 for JSON-RPC errors)
- truncated user-agent, sha256-hashed IP

Use the existing `api_access_logs` views in Haven OS to inspect agent
activity per token.

## Protocol notes

- The server implements MCP `2025-03-26` over Streamable HTTP.
- Methods supported: `initialize`, `notifications/initialized`, `ping`,
  `tools/list`, `tools/call`.
- JSON-RPC 2.0 batching is supported.
- CORS is mirrored from the request `Origin`, with `Authorization` and
  `Content-Type` allowed — so the claude.ai browser-side client can
  reach the endpoint.
- No SSE / GET stream is currently implemented (Claude's Streamable
  HTTP transport works fine with plain POST request/response).

## Troubleshooting

- **`401 Missing Authorization bearer token`** — header not being
  forwarded. claude.ai stores the secret in connector config; Claude
  Code reads it from `mcp.json` or `--header`.
- **`401 Token expired` / `Token revoked`** — re-mint or unrevoke from
  Settings → Personal Access Tokens. For OAuth (`hvn_mcp_…`) tokens,
  Claude will refresh automatically as long as the refresh token is
  valid — if a 401 persists, remove and re-add the connector in
  Claude.
- **`WWW-Authenticate` header on 401** — `/api/mcp` always advertises
  the protected-resource metadata URL on 401 so MCP clients can
  bootstrap the OAuth flow without prior config.
- **`-32002 Token missing required scope`** — the token doesn't carry
  the scope the tool needs. Edit it in Settings and retry.
- **`Tool returned isError: true`** — the protocol call succeeded but
  the underlying operation failed (e.g. "Task not found", "You don't
  have edit access"). The error message is in the `text` content block.
