# Personal Access Tokens & the Haven OS API

Personal Access Tokens (PATs) are how external agents, scripts, and
automations authenticate to Haven OS. Each token belongs to a real
Haven user; every API call is attributed to that user and is gated by
the same role, list/space access, and HR grants the user has in the
app.

> The older shared `HAVEN_LOST_ITEMS_API_KEY` still works for the
> Lost Items intake form. PATs are the preferred path for everything
> else — and for new Lost Items integrations — because every action is
> attributed and revocable per agent.

## Creating a token

1. Sign in to Haven OS.
2. Go to **Settings → Personal Access Tokens**.
3. Click **New token**.
4. Pick a memorable name (e.g. `zapier`, `lost-items-bot`), an optional
   expiration date, and the scopes you want.
5. Copy the raw token. **It is only shown once** — Haven OS stores a
   sha256 hash, not the plaintext.

The token format is:

```
hvn_pat_<43 base64url chars of randomness>
```

## Calling the API

Pass the token as a Bearer token in the `Authorization` header:

```bash
curl -s https://app.haven-os.example.com/api/v1/me \
  -H "Authorization: Bearer hvn_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

All API responses are JSON. Errors look like:

```json
{ "error": "Token missing required scope: tasks:write" }
```

## Scopes

Scopes let you mint tokens that are narrower than your own permissions.
A token can never do something its owner can't do — scopes only
restrict further.

| Scope               | What it allows                                                                  |
| ------------------- | ------------------------------------------------------------------------------- |
| `platform:full`     | All scopes below. The default for "give my agent broad access" tokens.          |
| `me:read`           | Read your profile and the token's effective scopes.                              |
| `tasks:read`        | Read your assigned tasks; read tasks in lists you can see.                       |
| `tasks:write`       | Create / update / complete tasks in lists where you have edit access.            |
| `work:read`         | List spaces / lists visible to you.                                              |
| `work:write`        | Reserved for future endpoints (create spaces / lists). Currently unused.         |
| `lost-items:read`   | List and view Lost Items cases.                                                  |
| `lost-items:write`  | Create / update / comment / set status on Lost Items cases.                      |
| `properties:read`   | List Haven properties.                                                           |
| `properties:write`  | Create / update properties — admin role still required.                          |
| `content:read`      | List Content Studio spaces, topics, and articles.                                |
| `content:write`     | Create or update topics in Content Studio.                                       |
| `hr:read`           | Read HR data — only honored if you already have an HR access grant.              |

`platform:full` satisfies any scope check. Each scope check follows
the rule:

```
hasScope(ctx, requested) := ctx.scopes.includes("platform:full")
                          || ctx.scopes.includes(requested)
```

## Endpoints (v1)

All endpoints live under `/api/v1`. Every endpoint requires a valid
PAT in the Authorization header.

### Profile

| Method | Path           | Scope     | Notes                                |
| ------ | -------------- | --------- | ------------------------------------ |
| `GET`  | `/api/v1/me`   | `me:read` | Actor profile + token scope summary. |

### My tasks

| Method | Path                            | Scope          | Notes                                                |
| ------ | ------------------------------- | -------------- | ---------------------------------------------------- |
| `GET`  | `/api/v1/me/tasks`              | `tasks:read`   | Tasks assigned to the actor. Filter `?status=open\|done\|all`. |
| `POST` | `/api/v1/me/tasks`              | `tasks:write`  | Create a task on the actor's personal "My Tasks" list. |
| `GET`  | `/api/v1/tasks/[id]`            | `tasks:read`   | Read any task the actor can see.                     |
| `PATCH`| `/api/v1/tasks/[id]`            | `tasks:write`  | Update a task; pass `completed: true` to close it.   |

### Work / Project Management

| Method | Path                                       | Scope         | Notes                                          |
| ------ | ------------------------------------------ | ------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/work/spaces`                       | `work:read`   | Spaces visible to the actor.                   |
| `GET`  | `/api/v1/work/lists?space_id=<uuid>`        | `work:read`   | Lists, optionally filtered to one space.       |
| `GET`  | `/api/v1/work/lists/[id]/tasks`             | `tasks:read`  | Tasks in a list. Honors list/space ACL.        |
| `POST` | `/api/v1/work/lists/[id]/tasks`             | `tasks:write` | Create a task in a list (editor required).     |

### Lost Items

| Method | Path                                       | Scope                | Notes                                          |
| ------ | ------------------------------------------ | -------------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/lost-items`                       | `lost-items:read`    | List cases; filters: `status`, `external_source`, `limit`. |
| `POST` | `/api/v1/lost-items`                       | `lost-items:write`   | Create or upsert via `external_source`+`external_id`. |
| `GET`  | `/api/v1/lost-items/[id]`                  | `lost-items:read`    | Accepts uuid or `case_number` (e.g. `LI-0042`). |
| `PATCH`| `/api/v1/lost-items/[id]`                  | `lost-items:write`   | Update; setting `status` stamps the milestone. |
| `GET`  | `/api/v1/lost-items/[id]/comments`         | `lost-items:read`    | List events (status changes, comments, etc.). |
| `POST` | `/api/v1/lost-items/[id]/comments`         | `lost-items:write`   | Add a comment as the token owner.              |

### Properties

| Method | Path                            | Scope                | Notes                              |
| ------ | ------------------------------- | -------------------- | ---------------------------------- |
| `GET`  | `/api/v1/properties`            | `properties:read`    | Non-archived by default.           |
| `POST` | `/api/v1/properties`            | `properties:write`   | Admin-or-above only.               |
| `GET`  | `/api/v1/properties/[id]`       | `properties:read`    |                                    |
| `PATCH`| `/api/v1/properties/[id]`       | `properties:write`   | Admin-or-above only.               |

### Content Studio

| Method | Path                                | Scope             | Notes                              |
| ------ | ----------------------------------- | ----------------- | ---------------------------------- |
| `GET`  | `/api/v1/content/spaces`            | `content:read`    | Content Studio spaces.             |
| `GET`  | `/api/v1/content/topics?space_id=…` | `content:read`    | Topics, optional space filter.     |
| `POST` | `/api/v1/content/topics`            | `content:write`   | Create a topic in a space.         |

### HR

| Method | Path                            | Scope       | Notes                                          |
| ------ | ------------------------------- | ----------- | ---------------------------------------------- |
| `GET`  | `/api/v1/hr/employees`          | `hr:read`   | Employees the actor can see (super_admin or grant). |

### Non-goals (intentionally not exposed)

- Settings pages: roles, departments, HR admin grants, board admins.
- Listing or revoking PATs over the API (use the Settings UI).
- Hostaway property sync, scoring, agents/co-pilot endpoints.

## Examples

### Create a Lost Items case

```bash
curl -s -X POST https://app.haven-os.example.com/api/v1/lost-items \
  -H "Authorization: Bearer hvn_pat_..." \
  -H "Content-Type: application/json" \
  -d '{
    "item_description": "Black Patagonia jacket",
    "found_location": "Living room couch",
    "property_name": "Smoky Hideaway",
    "guest_name": "Alice",
    "guest_email": "alice@example.com",
    "external_source": "ops-bot",
    "external_id": "abc-123"
  }'
```

### Mark a task done

```bash
curl -s -X PATCH https://app.haven-os.example.com/api/v1/tasks/<task-id> \
  -H "Authorization: Bearer hvn_pat_..." \
  -H "Content-Type: application/json" \
  -d '{ "completed": true }'
```

## Security model

- **Hashing.** Tokens are stored as `sha256(token)` hex. Raw secrets are
  never persisted; the API hashes the incoming bearer and looks up the
  token row by hash.
- **No service-role for partners.** External agents authenticate via
  PATs only. `SUPABASE_SERVICE_ROLE_KEY` stays inside Haven OS — it is
  never sent to any external system.
- **Permission inheritance.** A PAT does not grant new permissions.
  Every API endpoint runs the same role / space / list / HR-grant
  checks the app uses, scoped to the token owner.
- **Revocation.** Revoking a token in Settings stops it working
  immediately. Super admins can also revoke any user's token.
- **Audit.** Each authenticated request is logged to
  `api_access_logs` with the token id, actor, method, path, status,
  user-agent, and a sha256-truncated IP hash. Owners and super admins
  can read the log via Supabase.
- **Rotation.** Set an `expires_at` when you create the token. We
  recommend rotating tokens used by long-lived integrations every 90
  days.

## MCP (Claude integration)

The same PATs authenticate the Haven OS MCP server at `/api/mcp`. The
MCP endpoint exposes curated tools — not raw SQL — that wrap the same
operations as `/api/v1`, with the same scope and permission rules.

See [`docs/HAVEN_OS_MCP.md`](HAVEN_OS_MCP.md) for the tool catalog and
how to wire Claude up.
