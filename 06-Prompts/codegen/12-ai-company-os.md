# Codegen Prompt — Volume 12: AI Company OS

**Status: DO NOT RUN YET, AND DO NOT RUN WITHOUT RE-CONFIRMATION.** This is the most
speculative Volume in the handbook (see Volume 12's own Risks section and Acceptance
Criteria, which explicitly asks the Project Owner to reconfirm demand before any
implementation effort starts). Trigger condition: Volume 11 Definition of Done met, AND a
fresh, explicit Project Owner confirmation that this scope is still wanted — an old
Approval is not sufficient on its own for this Volume given how far it sits from the
v0.1 critical path.

**Use in:** Google AI Studio (Implementation Team role), once triggered
**Paste alongside this prompt:** `01-Volumes/Volume-12.md`
**Implements:** RFC-0015, RFC-0016
**Package target:** new `packages/ai-company-os/` (composition layer only)
**Depends on:** all prior packages — introduces no new execution primitive

---

## Non-negotiable constraints (when this session runs)

1. **Composition-only (RFC-0015 / FR-1 / NFR-1):** this package must not reimplement or
   parallel Core Runtime's Scheduler or Workflow Engine's TaskGraph. If a feature seems to
   need a new execution primitive, STOP and flag it for a new RFC against Volume 2 or
   Volume 5 instead of building it here.
2. Budget enforcement is advisory (queue + warn), not a hard cutoff (RFC-0016) — do not
   silently upgrade this to a hard block.
3. Portfolio views are RBAC-scoped per Volume 10 — a Developer role must not see data
   outside their assigned projects.

## Explicitly out of scope until triggered

No code should be generated from this file until both trigger conditions above are met.
