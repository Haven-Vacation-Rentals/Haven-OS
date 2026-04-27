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

## Endpoints

### `POST /api/lost-items` — create or upsert

```json
{
  "item_description": "Black iPhone 15",
  "item_category": "electronics",
  "found_location": "left bedroom nightstand",
  "property_name": "Riverbend Lodge",
  "guest_name": "Jane Smith",
  "guest_email": "jane@example.com",
  "guest_phone": "+1-555-1234",
  "reservation_ref": "HMABC123",
  "priority": "high",
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

Response:

```json
{
  "ok": true,
  "case": { "id": "...", "case_number": "LI-001023", "status": "intake", ... },
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
{ "status": "in_transit", "shipping_carrier": "USPS", "shipping_tracking": "9400..." }
{ "status": "delivered", "delivered_at": "2026-04-30T18:00:00Z" }
{ "status": "completed", "notes": "Guest confirmed receipt." }
```

Status transitions auto-stamp the matching milestone timestamp
(`picked_up → pickup_completed_at`, `in_transit → shipped_at`,
`delivered → delivered_at`, `completed → completed_at`). You can also
pass any timestamp explicitly to override.

Optional header `x-haven-source: <label>` is recorded on the activity
event so the Haven team can see which partner made the change.

## Stable identifiers

Cases expose two stable IDs:

- `id` — Haven UUID, immutable.
- `case_number` — short human-readable (`LI-001023`), generated on
  insert. Safe to share with guests / vendors.

For future bi-directional sync, partners should also store
`(external_source, external_id, external_url)` — Haven uses these to
resolve their identifiers back to our cases.
