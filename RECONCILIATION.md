# RECONCILIATION — Canonical Decisions for Handbook↔Code Contradictions

**Status:** Working document (Phase 0 of the remediation plan)
**Date:** 2026-07-20
**Scope:** Records every known contradiction between the agentx-handbook and the
Agentx implementation, and fixes the **canonical** answer for each. Later phases edit
the Volumes / ADRs / code to match the decisions recorded here.

## Guiding rule

Architecture First: the handbook leads and the code follows — **except** where the code
has already made a correct, load-bearing choice that the handbook merely describes
inconsistently. In those cases the handbook is corrected to match the code. Each entry
below states which direction applies and why.

---

## R-01 — Provider SDK package path & scope

**Contradiction.** The handbook references the provider package three different ways:
- `@platform/provider-sdk` — `00-Governance/PROJECT_CONSTITUTION.md:60`
- `packages/providers/*` (plural) — `00-Governance/PROJECT_CONSTITUTION.md:61`
- `packages/provider-sdk` (no `provider/` parent) — most other docs
  (`Volume-04.md:65`, `Volume-08.md:60`, `06-Prompts/codegen/04-provider-platform.md:6`,
  `RFC-0001.md:12`, `CONTRIBUTING.md:27`, etc.)

**Verified code reality.** The package lives at `packages/provider/provider-sdk`, its
npm name is `@agentx/provider-sdk`, and vendor SDKs are confined to
`packages/provider/provider-sdk/src/providers/{anthropic,google}`. All sibling packages
use the `@agentx/*` scope (`native-providers`, `provider-qualification`,
`provider-release`, `vendor-certification`).

**Canonical decision (handbook follows code):**
- npm scope is **`@agentx/`**, never `@platform/`.
- Package name is **`@agentx/provider-sdk`**.
- On-disk path is **`packages/provider/provider-sdk`**.
- Vendor-SDK-import boundary is **`packages/provider/provider-sdk/src/providers/*`**.

**Handbook edits (Phase 1):** rewrite all three variants above to the canonical form,
including the two CI-lint boundary rules that currently name the wrong path
(`CONTRIBUTING.md:27`, `PROJECT_CONSTITUTION.md:61`, `14-testing-qa.md:23`).

---

## R-02 — Volume count: 12 vs 14 vs 16

**Contradiction.** ADR-0010 declares a **14-Volume** structure ("Handbook is now 14
Volumes; all cross-references in this delivery use the 14-Volume map"). ADR-0011 also
refers to "the 14-Volume handbook." But the repository physically contains **16** Volume
files (`Volume-01.md` … `Volume-16.md`), 16 schemas, and 16 example directories, and
ADR-0009 states "All 16 Volumes in the v1.0 handbook."

**Root cause.** Volume 15 (Identity & Access Foundation) and Volume 16 (Secrets & Key
Management) were added after ADR-0010 was written, introduced by ADR-0012 (secrets),
ADR-0015, and ADR-0016. ADR-0010 was never updated.

**Canonical decision:** the handbook is **16 Volumes**. ADR-0010's "14-Volume" claim is
**stale**.

**Handbook edits (Phase 1):**
- Mark ADR-0010 **Superseded** (by the 16-Volume reality; note Vol 15/16 additions).
- Fix ADR-0011's "14-Volume handbook" phrasing to "16-Volume."
- Confirm the Volume 1 dependency table reflects 16 Volumes.

---

## R-03 — Append-only audit log: which ADR owns it

**Contradiction (apparent).** An earlier review paired ADR-0011 and ADR-0014 as a
possible "split decision" about append-only audit logging.

**Verified reality.** They are different subjects:
- **ADR-0011** = *a lightweight threat model is required before Tool SDK (Volume 7) code
  generation.* Nothing to do with audit immutability.
- **ADR-0014** = *audit-log append-only enforcement via PostgreSQL BEFORE UPDATE/DELETE
  triggers + role permissions (RFC-0024).*

**Canonical decision:** **ADR-0014 is the sole append-only-audit decision.** There is no
duplication to reconcile. This entry exists to close the mis-pairing on the record.

**Code implication (Phase 2):** the real Postgres implementation must add the
append-only triggers + `REVOKE UPDATE, DELETE` per ADR-0014, plus the
`record_hash`/`previous_hash` chain per RFC-0024.

---

## R-04 — Persistence layer: spec vs dead artifacts

**Contradiction.** Volume 6 mandates Postgres-backed persistence and an append-only
audit log. The code ships `prisma/schema.prisma` (Task, AuditEvent with
`record_hash`/`previous_hash`, CostRecord, plus Vol 10 models) and a
`prisma/migrations/002_rls_tenant_isolation/migration.sql` — but **no package depends on
`@prisma/client` or `prisma`**, so `PrismaMemoryStore` is actually an in-memory `Map`,
and the RLS SQL is never applied. Migration numbering also starts at `002` (no `001`).

**Canonical decision (v0.1 target = REAL Postgres/Prisma):**
- Wire `@prisma/client` + `prisma` for real; generate the client.
- Add the missing baseline migration `001` before `002_rls`.
- Replace the in-memory store with a real Prisma-backed implementation.
- Enforce append-only + hash-chain per **R-03 / ADR-0014 / RFC-0024**.

**This is a code-side fix (Phase 2), not a handbook change.** Volume 6 already specifies
the correct target; the code must catch up.

---

## R-05 — ToolCategory: bare string vs typed union

**Contradiction.** Volume 3 references tool categories such as `shell.lint` and
`shell.exec.arbitrary` that are not part of the Volume 7 canonical ToolCategory set, and
the code treats ToolCategory as a bare `string` (with `as ToolCategory` casts).

**Canonical decision:** the **Volume 7 category set is canonical**; Volume 3's divergent
category names are corrected to it. In code, ToolCategory becomes a **typed union** (no
bare-string casts).

**Edits:** handbook Volume 3 (Phase 1); code `shared/tool-sdk` union (Phase 2).

---

## R-06 — RBAC role matrix

**Contradiction.** The Security Standards RBAC matrix is missing an `admin` role and does
not cleanly separate `agent` vs `operator` privileges; the code has a `rbac-roles.ts`
enum that is not wired into `RBACEngine`.

**Canonical decision:** RBAC matrix includes **`admin`**, and **`agent` vs `operator`**
are distinct least-privilege roles. Code wires `rbac-roles.ts` (named enum) into
`RBACEngine`.

**Edits:** handbook Security Standards (Phase 1); code RBAC wiring (Phase 2).

---

## R-07 — Dependency-direction violations (Vol 1 low→high)

**Contradiction.** Volume 1 mandates that lower-numbered packages must not depend on
higher-numbered ones. Volume 2 and Volume 3 contain references that violate this
direction.

**Canonical decision:** the **low→high dependency rule (Volume 1) is canonical**; Vol 2
and Vol 3 references are corrected so no lower Volume depends on a higher one.

**Edits:** handbook Volumes 2 & 3 (Phase 1).

---

## R-08 — Governance / certification claims vs reality

**Contradiction.** `CERTIFICATION.md` / `README.md` claim a "v1.0 CERTIFIED 5.0/5.0"
status, and RFC-0043 / RFC-0046 reference dependencies that do not exist in code.

**Canonical decision:** governance/certification claims are brought in line with the
post-reconciliation reality; phantom-dependency references in RFC-0043/0046 are
corrected. (Deferred to **Phase 5** after the substantive fixes land.)

---

## Decision summary

| ID | Topic | Canonical answer | Direction | Phase |
|----|-------|------------------|-----------|-------|
| R-01 | Provider path/scope | `@agentx/provider-sdk` @ `packages/provider/provider-sdk` | handbook ← code | 1 |
| R-02 | Volume count | 16 Volumes; ADR-0010 superseded | handbook fix | 1 |
| R-03 | Append-only audit | ADR-0014 only (ADR-0011 = threat model) | clarify | 1/2 |
| R-04 | Persistence | Real Postgres/Prisma; add migration 001 | code ← handbook | 2 |
| R-05 | ToolCategory | Volume 7 set canonical; typed union | both | 1/2 |
| R-06 | RBAC matrix | add `admin`; split `agent`/`operator` | both | 1/2 |
| R-07 | Dep direction | low→high (Volume 1) canonical | handbook fix | 1 |
| R-08 | Governance claims | align to reality | handbook fix | 5 |
