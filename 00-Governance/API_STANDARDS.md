# API Standards — agentx Platform

> **Version:** 1.0 | **Status:** Active | **Last Updated:** 2025-07-10  
> **Owner:** Platform Team  
> **References:** Volume 01 Ch. 5 (Conventions), Volume 02 (Core Runtime Events)

---

## 1. REST Conventions

### 1.1 URL Structure

All API endpoints are prefixed with the versioned path:

```
/api/v1/{resource}
```

Resource names are **plural kebab-case**:

| Pattern | Example |
|---------|---------|
| `/api/v1/tasks` | Task collection |
| `/api/v1/tasks/{id}` | Single task resource |
| `/api/v1/tasks/{id}/subtasks` | Nested sub-resource |
| `/api/v1/providers` | Provider collection |
| `/api/v1/agents/roles` | Agent role enumeration |
| `/api/v1/audit/events` | Audit event query |

### 1.2 HTTP Methods

| Method | Usage | Idempotent | Safe |
|--------|-------|------------|------|
| `GET` | Read resource or collection | Yes | Yes |
| `POST` | Create resource, trigger action | No | No |
| `PUT` | Full resource replacement | Yes | No |
| `PATCH` | Partial resource update | No | No |
| `DELETE` | Remove resource | Yes | No |

### 1.3 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200 OK` | Successful read or update | GET, PUT, PATCH responses |
| `201 Created` | Resource created | POST responses with `Location` header |
| `202 Accepted` | Accepted for async processing | Task submission, long-running operations |
| `204 No Content` | Successful deletion | DELETE responses |
| `400 Bad Request` | Validation error | Invalid input, missing required fields |
| `401 Unauthorized` | Missing or invalid authentication | Missing/expired token |
| `403 Forbidden` | Insufficient permissions | RBAC denial |
| `404 Not Found` | Resource does not exist | Invalid ID, wrong path |
| `409 Conflict` | State conflict | Duplicate resource, invalid state transition |
| `422 Unprocessable Entity` | Semantic validation failure | Business rule violation |
| `429 Too Many Requests` | Rate limited | See `Retry-After` header |
| `500 Internal Server Error` | Unexpected server error | Unhandled exception |
| `503 Service Unavailable` | Temporary outage | Maintenance, dependent service down |

---

## 2. Error Envelope

All error responses use a consistent JSON envelope:

```json
{
  "code": "TASK_NOT_FOUND",
  "message": "Task with ID 'abc-123' does not exist.",
  "details": [
    {
      "field": "id",
      "issue": "No task found with the provided identifier."
    }
  ],
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Machine-readable error code in UPPER_SNAKE_CASE |
| `message` | `string` | Yes | Human-readable error description |
| `details` | `array` | No | Array of `{field, issue}` objects for validation errors |
| `traceId` | `string` | Yes | Distributed trace ID from request context |

Error codes follow the pattern: `{RESOURCE}_{ERROR_TYPE}` (e.g., `TASK_INVALID_STATE`, `PROVIDER_UNAVAILABLE`).

---

## 3. Pagination

All list endpoints use **cursor-based pagination**:

### Request
```
GET /api/v1/tasks?cursor=eyJpZCI6ImFiYy0xMjMifQ&limit=20
```

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `cursor` | `string` | — | — | Base64-encoded cursor from previous response |
| `limit` | `integer` | 20 | 100 | Number of items per page |

### Response
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6eHl6LTc4OX0=",
    "prevCursor": null,
    "hasMore": true,
    "totalCount": 142
  }
}
```

Cursor encoding: Base64(JSON `{ "id": "<last_item_id>", "createdAt": "<iso>" }`). Decoding must validate the payload structure.

---

## 4. Versioning

### URL Path Versioning
API version is in the URL path: `/api/v1/`, `/api/v2/`.

### Version Lifecycle
- **Current:** Fully supported, receives new features.
- **Deprecated:** Supported for 6 months, returns `Deprecation` header.
- **Sunset:** Returns `410 Gone` after deprecation period.

### Breaking Changes
Any change requiring a client update is a breaking change and requires a new API version. Breaking changes include:
- Removing or renaming a field
- Changing a field type
- Adding a new required field
- Changing an error code

### Non-Breaking Changes
- Adding a new optional field
- Adding a new endpoint
- Adding a new enum value (with backward compatibility)

---

## 5. Rate Limiting

### Headers (included in every response)

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait before retrying (on 429) |

### Default Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Authenticated user | 100 req | 1 minute |
| Unauthenticated | 10 req | 1 minute |
| Task submission | 10 req | 1 minute |
| Provider status check | 30 req | 1 minute |

---

## 6. Request/Response Logging Standards

### What to Log
- Request method, path, status code, latency, traceId
- User ID (if authenticated), tenant ID (v1.0)
- Error response body (with secrets masked)

### What NOT to Log
- Request/response bodies (unless explicitly enabled for debugging)
- Authorization headers
- Any field matching secret patterns (`*key*`, `*token*`, `*secret*`, `*password*`)

### Log Format
```json
{
  "timestamp": "2025-07-10T12:00:00.000Z",
  "level": "info",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/tasks",
  "statusCode": 201,
  "latencyMs": 45,
  "userId": "user-123"
}
```

### Structured Logger
All logging uses the NestJS `Logger` service with structured JSON output. Correlation is via `traceId` propagated from the `X-Trace-Id` request header.

---

## 7. Future Considerations

### 7.1 GraphQL (Planned v2.0)
- Schema-first design with code generation.
- Queries for complex reads (task graph traversal, audit queries).
- Mutations follow the same authorization model as REST.
- Subscription support for real-time events via WebSocket.

### 7.2 WebSocket (Planned v1.0)
- Real-time task state updates and audit events.
- Protocol: Socket.IO over WebSocket with TLS.
- Authentication via JWT in handshake.
- Events follow the `EventEnvelope` schema (04-Schemas/volume-02).
- Channel naming: `task:{taskId}:events`, `audit:{traceId}:events`.

---

## 8. References

| Document | Relevance |
|----------|-----------|
| Volume 01 Ch. 5 | REST conventions and coding standards |
| Volume 02 Ch. 4 | Event envelope and event bus topics |
| 04-Schemas/volume-02 | Machine-validatable event schemas |
| SECURITY_STANDARDS | Authentication, RBAC, and rate limiting |
| API_STANDARDS | This document |