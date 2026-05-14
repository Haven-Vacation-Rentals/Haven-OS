# Haven OS — MCP Server

Haven OS exposes a hosted **Model Context Protocol** endpoint so Claude
(claude.ai or Claude Code) can read and write into the parts of the
operating system Jack & the team use most: **Tasks**, **Lost Items**,
and the **Content Studio / GTM content tracker**.

The endpoint speaks MCP over Streamable HTTP / JSON-RPC 2.0. There is no
local proxy or stdio bridge — Claude connects directly over HTTPS, with
a Personal Access Token (PAT) used as the bearer credential.

- **Endpoint:** `https://www.havenvros.com/api/mcp`
- **Auth:** `Authorization: Bearer hvn_pat_…`
- **Transport:** Streamable HTTP (JSON-RPC 2.0 POST)

## Connecting from Claude

### claude.ai (remote MCP)

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
| `list_content_spaces`         | `content:read`    | List Content Studio spaces (parents of topics).                               |
| `list_content_ideas`          | `content:read`    | List Content Studio topics, filterable by `space_id` and `stage`.             |
| `create_content_idea`         | `content:write`   | Add a topic to a Content Studio space (defaults to stage=`idea`).             |
| `update_content_status`       | `content:write`   | Move a topic through `idea → in_progress → draft → complete`.                 |

Every tool ships with a full JSON Schema for its arguments, so Claude
gets type information, enum values, and field descriptions inline.

## Scopes

Scopes match the existing `/api/v1` system:

- `platform:full` satisfies any scope check (broadest grant).
- `tasks:read` / `tasks:write` — Tasks tools.
- `lost-items:read` / `lost-items:write` — Lost Items tools.
- `content:read` / `content:write` — Content Studio tools.
- `me:read` — `get_me`.

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
  Settings → Personal Access Tokens.
- **`-32002 Token missing required scope`** — the token doesn't carry
  the scope the tool needs. Edit it in Settings and retry.
- **`Tool returned isError: true`** — the protocol call succeeded but
  the underlying operation failed (e.g. "Task not found", "You don't
  have edit access"). The error message is in the `text` content block.
