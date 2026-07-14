# PATCH_SUMMARY_v4.md — Gap-Closing Patch (Claude, July 2026)

**Version:** AI Company Architecture Handbook v1.0 (patched)
**Editor:** Claude (via chat session with Project Owner)
**Date:** 2026-07-14
**Purpose:** Close a subset of the gaps identified in review, with full disclosure of
what was and was not actually done — every file changed below was verified by direct
diff, the same way the "Grok maturation" claims in the earlier v1.1 zip were verified
false by direct diff.

---

## Self-Correction First

An earlier message in this review session claimed 5 RFCs (0029, 0036, 0039, 0040, 0041)
were "still pending / not yet written." This was **incorrect** and is corrected here:
all five exist in `02-RFC/` and are `Status: Accepted`. The error came from
misreading the Engineering Execution Program §7 (which lists these as RFCs the *EEP
document itself* identified as newly needed, relative to an earlier backlog draft) as
meaning they were absent from the final corpus, when in fact they were already written.
No file changes were needed to correct this — it was a error in the reviewer's
(Claude's) reasoning, not in the repository. Recorded here in the interest of the same
transparency being asked of the repository itself.

---

## What This Patch Actually Changed

### 1. Citation fix in THREAT_MODEL.md (carried over from PATCH_SUMMARY_v3.md)
Already applied in the prior patch in this session; unchanged here.

### 2. New: `00-Governance/PERFORMANCE_TARGETS.md`
Proposes concrete p95/latency/throughput targets for Core Runtime, Provider Platform,
Workflow Engine, Memory Engine/Audit Log, and Secrets & Key Management — closing the gap
the EEP's own Risk Register (R2) and Performance Review Gate (§8) flagged as unaddressed.

**Status of this fix: Draft, not ratified.** Per Constitution Principle 1, these numbers
becoming binding requires an RFC + ADR, same as any other architectural commitment. This
document proposes starting numbers; it does not itself constitute Project Owner approval.

### 3. New: Contract-test templates for 2 of 16 Volumes

| File | Covers |
|---|---|
| `08-Examples/volume-02-core-runtime/contract.test.ts` | Volume 2 FR-1, FR-2, FR-3 and their documented edge cases (concurrent transitions, failed event publish, pause/resume on invalid states) |
| `08-Examples/volume-16-secrets-and-key-management/contract.test.ts` | Volume 16 FR-1 through FR-5 with tests; FR-6 (irreversible key destruction) recorded as `.todo()` — a KeyProvider reference implementation does not yet exist to test against, so this is honestly marked incomplete rather than faked |

**Why these two:** EEP §4 (Dependency Graph) and §11 (Critical Path Analysis) identify
Volume 16 as gating Volume 2 (Core Runtime), which gates nearly every other workstream.
These are the two highest-leverage Volumes to de-risk first.

**These are templates written against the specification, not tests run against real
code** — because no implementation of Volume 2 or Volume 16 exists yet in this
repository. They will need real backend fixtures (`createSecretStoreUnderTest()`,
`createEventBusUnderTest()`, etc.) supplied once implementation begins. This is stated
explicitly in each file's header comment.

### 4. Status notes added (not status changes)

Volume 2 and Volume 16 headers now include a `Contract Test:` line pointing to the new
template files. **Their `Status:` line remains `Approved — Architecture`, unchanged.**

This patch does **not** claim `Approved — Implementation-Gated` for either Volume. Per
ADR-0009 and the Constitution's Definition of Approved, that status requires the Project
Owner's explicit written sign-off — which an AI-authored patch cannot supply on the
Project Owner's behalf. Claiming otherwise would repeat exactly the failure mode this
review session identified in the fabricated "Grok maturation" (PATCH_SUMMARY_v2.md in the
earlier v1.1 zip): a status claim unbacked by the authority the corpus's own governance
model requires.

`08-Examples/README.md` was updated to describe the 2-of-16 partial population accurately.

---

## What This Patch Does NOT Fix (explicitly, so it isn't mistaken for done)

- **14 of 16 Volumes still have no contract-test template.** Highest-leverage next
  candidates per the dependency graph: Volume 4 (Provider Platform) and Volume 7
  (Tool SDK), both direct dependents of Volume 2.
- **13 of 16 Volumes still have no JSON schema** in `04-Schemas/` (only Volumes 2, 4, 7
  are populated, unchanged from v1.0).
- **No actual implementation code exists anywhere in this repository.** The contract
  tests added here are specifications of correct behavior, not verified behavior — they
  cannot run until a real Volume 2 / Volume 16 implementation exists to import.
- **PERFORMANCE_TARGETS.md is a proposal, not a ratified ADR.** It has not been reviewed
  or approved by the Project Owner.
- **No independent human or third-party security audit was performed or added.** This
  patch, like the rest of the corpus's authorship, was produced by an AI session.
- **No project timeline, headcount, or budget estimates were added.** Still absent.

## File Count Summary

- **Files added:** 4 (`PERFORMANCE_TARGETS.md`, 2 contract-test files, this summary)
- **Files modified:** 3 (`08-Examples/README.md`, `Volume-02.md` header,
  `Volume-16-Secrets-and-Key-Management.md` header)
- **Files with Status: line changed:** 0 — no Volume's approval status was altered.
- **Schema files touched:** 0
