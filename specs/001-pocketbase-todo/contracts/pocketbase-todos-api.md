# API Contract: PocketBase Todos Collection

**Base URL (dev)**: `http://localhost:8080/api/collections/todos`
**Auth**: None (all rules are public `""`)

All endpoints return PocketBase's standard record format. Error responses follow PocketBase's standard error envelope: `{ code, message, data }`.

---

## List todos

```
GET /records?sort=-created&perPage=200
```

**Response 200**:
```json
{
  "page": 1,
  "perPage": 200,
  "totalItems": 3,
  "totalPages": 1,
  "items": [
    {
      "id": "abc123def456789",
      "collectionId": "...",
      "collectionName": "todos",
      "created": "2026-02-19 10:30:00.000Z",
      "updated": "2026-02-19 10:30:00.000Z",
      "title": "Buy milk",
      "completed": false
    }
  ]
}
```

**Angular call**: `pb.collection('todos').getList(1, 200, { sort: '-created' })`

---

## Create todo

```
POST /records
Content-Type: application/json

{ "title": "Buy milk", "completed": false }
```

**Validation**:
- `title`: required, non-empty after trim, max 200 characters (FR-003)
- `completed`: defaults to `false` if omitted

**Response 200**: Single record (see list item format above)

**Angular call**: `pb.collection('todos').create({ title, completed: false })`

---

## Toggle completion

```
PATCH /records/:id
Content-Type: application/json

{ "completed": true }
```

**Response 200**: Updated record

**Angular call**: `pb.collection('todos').update(id, { completed })`

---

## Delete todo

```
DELETE /records/:id
```

**Response 204**: No content

**Angular call**: `pb.collection('todos').delete(id)`

---

## Real-time subscription (SSE)

```
GET /api/realtime
```

The PocketBase JS SDK manages this connection internally via `subscribe()`. Not called directly.

**Angular call**:
```typescript
const unsubscribe = await pb.collection('todos').subscribe('*', (event) => {
  // event.action: 'create' | 'update' | 'delete'
  // event.record: RecordModel (full record)
});
```

**Unsubscribe**: Call the returned function. Angular service does this in `ngOnDestroy`.

---

## Error handling

| HTTP Status | Scenario | App behaviour |
|---|---|---|
| Network error / ECONNREFUSED | PocketBase unreachable on `load()` | Full-page error screen (FR backend-down) |
| 400 | Validation failure (empty/too-long title) | Inline validation message, no record created |
| 404 | Record deleted by another client before action | Ignore (realtime delete event will have already removed it from local state) |
