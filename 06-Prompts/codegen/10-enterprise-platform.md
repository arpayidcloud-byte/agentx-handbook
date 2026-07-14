# Codegen Prompt — Volume 10: Enterprise Platform

**Status: DO NOT RUN YET.** Per Volume 1's roadmap and Volume 10's own header, this is
explicitly post-v0.1. Trigger condition to open this session: Volume 9's Definition of
Done is met AND the v0.1 exit criteria (Volume 1, Ch. 6) are confirmed complete AND the
Project Owner explicitly requests enterprise/multi-tenant work to begin.

**Use in:** Google AI Studio (Implementation Team role), once triggered
**Paste alongside this prompt:** `01-Volumes/Volume-10.md`
**Implements:** RFC-0011, RFC-0012, ADR-0006
**Package target:** extends `prisma/schema.prisma` (adds `tenantId` + RLS to every Volume 6
model), new `packages/enterprise-platform/`
**Depends on:** all v0.1 packages (extends Memory Engine's schema, wraps CLI's command
surface with RBAC)

---

## Non-negotiable constraints (when this session runs)

1. **Defense in depth is mandatory (ADR-0006):** both Postgres RLS AND a tenant-scoped
   Prisma client extension must be present. Neither alone satisfies this Volume — this is
   the direct fix for a real prior-project data-isolation bug and is non-negotiable.
2. Every model from Volume 6, Ch. 1 gets RLS enabled before this Volume's Definition of
   Done is met — no table may be left relying on application-layer filtering alone (FR-1).
3. RBAC checks fail closed: an unrecognized role has zero permissions (FR-2).
4. Policy Engine blocking decisions are logged to `AuditEvent` with the specific finding
   that triggered the block (FR-3).
5. Default policy: block only on `critical` security findings; `low`/`medium`/`high`
   remain advisory (Ch. 3) — do not silently make this stricter without a Project Owner
   confirmation, per the false-positive-lockout risk in Volume 10's Risks section.

## Mandatory test before this Volume's Definition of Done

A cross-tenant-read contract test per model: create data under tenant A, attempt to read
it under tenant B's context, assert an empty result (not an error masking a leak, an
actual empty/denied result) — required in `08-Examples/volume-10-enterprise-platform/`
before this Volume can be considered implemented, per ADR-0006's stated risk mitigation.

## Explicitly out of scope until triggered

No code should be generated from this file until the trigger condition above is met.
