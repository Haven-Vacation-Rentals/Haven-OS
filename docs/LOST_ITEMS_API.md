# Lost Items API

External-agent endpoints for the Operations → Lost Items tracker. Lets
trusted partners (cleaning vendors, third-party trackers, future sync
targets) create and update cases without a Haven user account.

## Authentication

All endpoints require a shared API key:

```
x-haven-api-key: <HAVEN_LOST_ITEMS_API_KEY>
```

(or `Authorization: Bearer <key>`.)

When `HAVEN_LOST_ITEMS_API_KEY` is unset on the server, the endpoints
return `503` — the API never accepts anonymous writes. Generate a key
with `openssl rand -hex 32` and add it to Vercel under
**Settings → Environment Variables → Production + Preview**.

## Workflow

Cases move through this fixed pipeline:

```
pending_pickup → picked_up → delivered → completed
```

`failed` is a terminal state for cases that can't be recovered (guest
never claimed, item lost in transit, duplicate, etc.). Status transitions
auto-stamp the matching milestone timestamp (`picked_up →
pickup_completed_at`, `delivered → delivered_at`, `completed →
completed_at`). You can also pass any timestamp explicitly to override.

## Endpoints

### `POST /api/lost-items` — create or upsert

```json
{
  "item_description": "Black iPhone 15",
  "found_location": "left bedroom nightstand",
  "property_name": "Riverbend Lodge",
  "guest_name": "Jane Smith",
  "guest_email": "jane@example.com",
  "guest_phone": "+1-555-1234",
  "slack_thread_url": "https://haven.slack.com/archives/C123/p1700000000",
  "conversation_url": "https://app.hostaway.com/conversations/9921",
  "follow_up_date": "2026-05-01",
  "cleaning_vendor": "Smoky Mountain Cleaners",
  "external_source": "breezeway",
  "external_id": "BZ-9921",
  "external_url": "https://app.breezeway.io/jobs/9921",
  "notes": "Guest requested overnight FedEx, will pay shipping."
}
```

- `item_description` is required. Everything else is optional.
- Pass `property_id` (Haven UUID) when known; otherwise pass
  `property_name` and the API resolves it case-insensitively.
- Provide `external_source` + `external_id` to make POSTs idempotent —
  a second call with the same pair returns the existing case instead of
  duplicating it.
- `source` defaults to `external_agent` when posted via this API.
- `status` defaults to `pending_pickup`.

Response:

```json
{
  "ok": true,
  "case": { "id": "...", "case_number": "LI-001023", "status": "pending_pickup", ... },
  "url": "https://os.havenvacationrentals.com/operations/lost-items/<id>"
}
```

### `GET /api/lost-items` — list

Query params: `status`, `external_source`, `limit` (max 200).

### `GET /api/lost-items/:id` — read one

`:id` accepts the Haven UUID **or** the human case number (`LI-001023`).

### `PATCH /api/lost-items/:id` — update

Common patch bodies:

```json
{ "status": "picked_up" }
{ "status": "delivered", "shipping_carrier": "USPS", "shipping_tracking": "9400..." }
{ "status": "completed", "notes": "Guest confirmed receipt." }
{ "status": "failed", "notes": "Guest never responded after 6 weeks." }
{ "slack_thread_url": "https://haven.slack.com/archives/C123/p1700000123" }
```

Patchable fields: `status`, `pickup_scheduled_at`, `pickup_completed_at`,
`shipping_carrier`, `shipping_tracking`, `shipped_at`, `delivered_at`,
`return_method` (`shipped|guest_pickup|in_person|other`),
`cleaning_vendor`, `follow_up_date`, `notes`, `external_url`,
`slack_thread_url`, `conversation_url`.

Optional header `x-haven-source: <label>` is recorded on the activity
event so the Haven team can see which partner made the change.

### `POST /api/lost-items/:id?action=comment` — add a comment

```json
{ "body": "Vendor confirmed pickup, item is in their van." }
```

The comment lands in the case's activity feed with `actor_label =
external:<x-haven-source or "api">`. Use this to keep the team in the
loop from external systems.

## Stable identifiers

Cases expose two stable IDs:

- `id` — Haven UUID, immutable.
- `case_number` — short human-readable (`LI-001023`), generated on
  insert. Safe to share with guests / vendors.

For future bi-directional sync, partners should also store
`(external_source, external_id, external_url)` — Haven uses these to
resolve their identifiers back to our cases.
