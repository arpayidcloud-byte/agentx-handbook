# Audit Log Write Path — Sequence Diagram

> **Related:** Volume 06 — Memory Engine (Ch. 3–4), ADR-0011  
> **Actors:** Event Source, Event Bus, Memory Engine, Audit Writer, PostgreSQL

This diagram shows how domain events flow through the system and are persisted as immutable audit entries.

```mermaid
sequenceDiagram
    participant Src as Event Source<br/>(Orchestrator / Agent / Tool SDK)
    participant Bus as Event Bus<br/>(BullMQ / Redis)
    participant ME as Memory Engine
    participant AW as Audit Writer
    participant PG as PostgreSQL

    Src->>Bus: Publish EventEnvelope<br/>{ id, topic, timestamp, traceId, payload, sourceModule }
    Note over Bus: Event stored in Redis stream

    Bus-->>ME: Consume event (subscriber)
    ME->>ME: Validate envelope schema (04-Schemas/volume-02)
    ME->>ME: Extract traceId, topic, timestamp

    ME->>AW: Write audit entry
    AW->>AW: Generate audit ID (UUID)
    AW->>AW: Enrich with metadata (userId, tenantId v1.0)
    AW->>AW: Serialize payload as JSONB

    AW->>PG: INSERT INTO audit_events<br/>(id, topic, trace_id, payload, source_module, created_at)
    Note over PG: Append-only table<br/>No UPDATE, no DELETE

    PG-->>AW: Row persisted
    AW-->>ME: Audit confirmation
    ME->>ME: Emit processing acknowledgment

    ME->>Bus: ACK event
    Note over Bus: Event removed from pending

    Note over PG: Query path (read-only):<br/>SELECT * FROM audit_events<br/>WHERE trace_id = ?<br/>ORDER BY created_at ASC
```

**Key flows illustrated:**
- Event published to BullMQ-backed event bus
- Memory Engine consumes and validates against JSON Schema
- Audit Writer enriches and persists to PostgreSQL
- Append-only enforcement (no UPDATE/DELETE on audit_events table)
- At-least-once delivery with explicit ACK
- Read-only query path for audit trail retrieval