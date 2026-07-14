# Codegen Prompt — Volume 6: Memory Engine

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-06.md`
**Implements:** RFC-0008
**Package target:** `packages/memory-engine/` + `prisma/schema.prisma`
**Depends on:** `packages/core-runtime` (implements its `Persistence` interface)

---

## Your role for this session

Implement Core Runtime's `Persistence` interface on PostgreSQL/Prisma, plus the
last-N + summary `TaskContext` retrieval strategy.

## Non-negotiable constraints

1. Schema MUST match Volume 6, Ch. 1 exactly: `Task`, `TaskGraph`, `AgentResult`,
   `AuditEvent`, `CostRecord` models with the fields specified there.
2. **Every write helper you generate must internally accept an implicit
   `tenantId: "default"` parameter**, even though multi-tenant enforcement (Volume 10) is
   not active yet. This is a deliberate forward-compatibility requirement (Volume 6
   Security & Isolation section) — do not write query helpers that assume a single global
   scope with no tenant parameter at all, since that makes the future Volume 10 RLS
   retrofit a rewrite instead of an addition.
3. `AuditEvent` writes are append-only — do not generate any update or delete function for
   this model.
4. `TaskContext` construction MUST bound its size: last-N `AgentResult`s (N configurable)
   plus a rolling summary — never full unbounded replay (FR-2).
5. All writes for a given state transition happen within a single Postgres transaction
   (NFR-1) — no "event published but not persisted" gap.

## What to generate

1. `prisma/schema.prisma` — the 5 models per Ch. 1, each with an (unused-but-present)
   `tenantId` field defaulted to `"default"` per constraint #2 above.
2. `src/persistence.ts` — `implements Persistence` from core-runtime: `saveTask`,
   `loadTaskContext`, `appendAuditEvent`.
3. `src/task-context.ts` — last-N + summary builder (Ch. 2); summarization should call an
   injected lightweight completion function (interface only, not a concrete Provider
   Platform import) so it can use a cheap/fast model tier per Volume 6 Risks section.
4. `src/audit-log.ts` — append-only writer, subscribing to Core Runtime's Event Bus and
   persisting every event verbatim (Ch. 3).
5. `src/cost-log.ts` — `CostRecord` writer subscribing to `provider.call_completed` (Ch. 4).
6. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-06-memory-engine/contract.test.ts`:
- FR-1: `Persistence` interface fully implemented, no method throws "not implemented"
- FR-2: `TaskContext` size stays bounded regardless of how many `AgentResult`s exist for
  a graph
- FR-3: attempt to update/delete an `AuditEvent` row is not exposed by any function in
  this package (a type-level or integration-level check)

## Explicitly out of scope

Do not implement Volume 10's tenant RLS policies in this session — only the schema-level
groundwork (constraint #2). Do not implement vector/semantic search (explicitly deferred
in Volume 6).

## Definition of done

- [ ] Schema matches Volume 6, Ch. 1 with the forward-compatible `tenantId` field
- [ ] `Persistence` fully implemented and passes core-runtime's existing contract tests
      against a real implementation (not just the interface-level tests from that session)
- [ ] Audit log is verifiably append-only
