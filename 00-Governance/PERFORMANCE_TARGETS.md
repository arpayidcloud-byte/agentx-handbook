# Performance & Scalability Targets

**Status:** Draft — proposed to close Engineering Execution Program Risk R1 (formerly R2
in v1.0 EEP: "Target performa/skalabilitas tidak pernah ditulis") and unblock the
Performance Review Gate (EEP §8), which cannot honestly be passed without this document.
**Owner:** Security/Platform Working Group (proposed — needs Project Owner ratification)
**Applies to:** Volume 2 (Core Runtime), Volume 4 (Provider Platform), Volume 5 (Workflow
Engine), Volume 6 (Memory Engine), Volume 13 (Observability & SRE)

---

## 1. Why This Document Exists

The Architecture Assessment Report and the Engineering Execution Program both flagged the
same gap: every Volume references performance-sensitive paths (task scheduling, event bus
throughput, provider latency, audit log writes) but none of them commit to a number. A
metric with no target is unfalsifiable — Volume 13's `p95` dashboards can show any value
and nothing will ever fail a review. This document proposes the missing numbers so the
Performance Review Gate (EEP §8) has something concrete to check against.

These are **proposed starting targets for v0.1**, sized for the single-operator CLI
deployment target (Volume 1), not enterprise multi-tenant load. They are deliberately
conservative and meant to be tightened with real measurement once Volume 2 has a working
implementation — not treated as permanent ceilings.

## 2. Core Runtime (Volume 2)

| Metric | Target (v0.1) | Rationale |
|---|---|---|
| Task state transition latency (`task.duration_ms` per transition, not total task time) | p95 < 200ms | Local Postgres write + event publish; no network hop to an external service in this step |
| Event bus publish→handler dispatch latency | p95 < 100ms | BullMQ-backed bus (Constitution Principle 5); single-node Redis |
| Scheduler `enqueue()` call | p95 < 50ms | Should not block the caller; heavy work happens after enqueue, not during |
| Max concurrent in-flight tasks (v0.1) | 50 | Single-operator CLI scope (Volume 1); not a multi-tenant target |

## 3. Provider Platform (Volume 4)

| Metric | Target (v0.1) | Rationale |
|---|---|---|
| Provider adapter overhead (normalization, not the LLM call itself) | p95 < 30ms | This is the abstraction-layer tax Constitution Principle 3 imposes; must stay negligible relative to actual LLM latency (seconds) |
| Provider failover detection-to-retry time | p95 < 2s | Per RFC and the `provider-failover.md` sequence diagram; slower than this makes failover indistinguishable from a hang to the operator |
| Cost/token accounting write | p95 < 20ms, non-blocking | Must not sit on the critical path of returning a completion to the caller |

## 4. Workflow Engine (Volume 5) & Approval Gates

| Metric | Target (v0.1) | Rationale |
|---|---|---|
| Approval-gate round trip (tool call paused → operator notified) | p95 < 500ms | Per `approval-gate-round-trip.md` sequence diagram; this is a human-facing wait, so it should feel immediate even though the human's own response time dominates overall latency |
| Task graph rollback (RFC-0038) execution time | p95 < 5s for graphs ≤ 50 nodes | No existing target in RFC-0038; proposed here to be revisited once realistic graph sizes are observed |

## 5. Memory Engine / Audit Log (Volume 6)

| Metric | Target (v0.1) | Rationale |
|---|---|---|
| Audit log write (append-only, per ADR-0014 trigger enforcement) | p95 < 50ms | Every tool call and secret access writes here (Volume 16 FR-4); if this is slow, it becomes the platform's bottleneck by construction |
| Audit log write durability | Must complete (fsync-confirmed) before the originating action is considered committed | Non-negotiable per ADR-0014's append-only guarantee — an audit entry that can be lost is not an audit entry |

## 6. Secrets & Key Management (Volume 16)

| Metric | Target (v0.1) | Rationale |
|---|---|---|
| `SecretStore.get()` (env/file backend) | p95 < 10ms | In-process or local-disk read; no network hop at v0.1 |
| `CredentialResolver.resolve()` cache hit | p95 < 1ms | In-memory cache per Volume 16 Ch. 2 |
| `CredentialResolver.resolve()` cache miss | p95 < 15ms (v0.1 backends) | Falls through to `SecretStore.get()` |
| Rotation cache invalidation (FR-3) | Must complete before new value is stored (ordering guarantee, not a latency number) | FR-3 is a correctness requirement, not a speed one — recorded here so it isn't lost between the functional spec and the performance gate |

## 7. What This Document Does NOT Cover

- **Enterprise-scale multi-tenant targets** (Volume 10, 11) — deliberately out of scope for
  v0.1; should be a follow-up RFC once real usage data exists from v0.1 operation.
- **LLM provider response latency itself** — that's determined by the third-party
  provider, not this platform, and is out of the platform's control.
- **Absolute cost/token budget targets** — a business/product decision, not an
  architecture one; belongs in a future RFC if the Project Owner wants one.

## 8. How These Numbers Should Be Used

Per EEP §8 (Performance Review Gate): any PR touching Core Runtime, Event Bus, or
Scheduler must state which of the above targets its change is measured against, and CI
should eventually enforce these via the same instrumentation Volume 13 already defines
(`task.duration_ms`, `provider.latency_ms`). Until that instrumentation exists in working
code, this document at minimum gives reviewers a number to reason about instead of none.

## 9. Status & Next Step

This is a **proposal**, not yet an ADR. Per Constitution Principle 1, formalizing these
numbers as binding targets requires an RFC + ADR, consistent with how ADR-0013 formalized
the Alternatives-section requirement. Recommended next step: an RFC that either ratifies
these numbers or revises them, then an ADR recording the decision — at which point this
document's status can move from Draft to the ADR's authority.
