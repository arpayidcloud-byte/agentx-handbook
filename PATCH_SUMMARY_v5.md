# PATCH_SUMMARY_v5.md — Gap-Closing Patch, Continued (Claude, July 2026)

**Version:** AI Company Architecture Handbook v1.0 (patched)
**Editor:** Claude (via chat session with Project Owner)
**Date:** 2026-07-14
**Purpose:** Continues PATCH_SUMMARY_v4.md's gap-closing work to Volume 4 (Provider
Platform) and Volume 7 (Tool SDK), per the Project Owner's request to proceed down the
critical path. Surfaced and fixed one real architectural inconsistency in the process.

---

## New: Contract-test templates for 2 more Volumes

| File | Covers |
|---|---|
| `08-Examples/volume-04-provider-platform/contract.test.ts` | Volume 4 FR-1, FR-2, FR-3 — run once per registered provider adapter (anthropic, google, openai, local) |
| `08-Examples/volume-07-tool-sdk/contract.test.ts` | Volume 7 FR-1, FR-2, FR-3, including the corrected `fs.write` destructive-classification behavior (see below) |

Combined with PATCH_SUMMARY_v4.md's work, **4 of 16 Volumes** now have contract-test
templates: Volume 2, Volume 4, Volume 7, Volume 16 — the full Volume 16 → Volume 2 →
{Volume 4, Volume 7} chain the EEP's dependency graph identifies as the critical path
root.

---

## Bug Found and Fixed: Volume 7 Ch. 4 Conflicted With ADR-0005

While writing the Volume 7 contract test, a genuine conflict surfaced between two
documents that are both supposed to be binding:

- **ADR-0005** (`Status: Final`) decides: *"v0.1 classifies all `fs.write` calls as
  destructive (approval-gated), regardless of new-vs-overwrite distinction."* Its Context
  explicitly rejects per-call precision as "more complex to implement correctly" and
  carrying a "risk of silent data loss" if misclassified.
- **Volume 7 Ch. 2's table** (before this patch) read: `fs.write` → *"Yes (delete), No
  (write-new — see Ch. 4 nuance)."*
- **Volume 7 Ch. 4** (before this patch) stated: *"`fs.write` creating a brand-new file is
  non-destructive; overwriting an existing one is destructive — the classification is
  evaluated per-call."*

Volume 7's text described exactly the per-call precision ADR-0005 considered and
explicitly rejected for v0.1. This is not a stylistic inconsistency — it's a real
contradiction between a binding ADR and the Volume that is supposed to implement it,
with direct security consequence: under the (wrong) Volume 7 text, a new-file write would
skip the approval gate entirely, which is the exact false-negative silent-write scenario
ADR-0005 was written to prevent.

### Fix Applied

- **Volume 7 Ch. 2's table** now reads: `fs.write` → *"Yes — v0.1 classifies ALL
  `fs.write` calls as destructive per ADR-0005, including new-file writes."*
- **Volume 7 Ch. 4** now states the ADR-0005 blanket rule explicitly, names it as a
  deliberate exception to the otherwise per-call (a)/(b)/(c) destructive criteria, and
  preserves ADR-0005's own framing that per-call precision is a documented *future*
  relaxation requiring its own superseding ADR — not the current v0.1 behavior.
- The new **Volume 7 contract test** asserts the corrected behavior directly: a
  new-file `fs.write` call now must trigger `Scheduler.pause()` and
  `task.approval_required`, same as an overwrite.

### Files Modified

| File | Reason |
|---|---|
| `01-Volumes/Volume-07.md` | Ch. 2 table and Ch. 4 text corrected to match ADR-0005's binding decision |

No changes were made to ADR-0005 itself — it was already correct; Volume 7 was the
document out of alignment with it.

---

## Status Notes Added (Not Status Changes)

Volume 4 and Volume 7 headers now include `Contract Test:` lines, same convention as
Volume 2 and 16 from the prior patch. **Their `Status:` lines remain unchanged** —
`Approved — Architecture`. As with the prior patch, this session does not claim
`Approved — Implementation-Gated` for either Volume; that requires Project Owner
sign-off this patch cannot supply.

`08-Examples/README.md` updated to reflect 4-of-16 population.

---

## What Remains Open

- **12 of 16 Volumes still have no contract-test template.** Next candidates by
  dependency order per EEP §4: Volume 3 (Agent Platform) and Volume 6 (Memory Engine),
  both direct dependents already unblocked by Volume 2/4/7's templates existing.
- **13 of 16 Volumes still have no JSON schema** (unchanged from v1.0 — only 2, 4, 7).
- **No real implementation exists to run any of these tests against.** All four contract
  tests remain specifications-as-tests, not verified behavior.
- **PERFORMANCE_TARGETS.md still does not cover Tool SDK execution latency** — noted
  explicitly in the new Volume 7 test's closing comment rather than silently omitted.
- All caveats from PATCH_SUMMARY_v4.md (no timeline/budget/headcount, no independent
  audit) remain unchanged.

## File Count Summary (this patch only)

- **Files added:** 3 (2 contract-test files, this summary)
- **Files modified:** 3 (`08-Examples/README.md`, `Volume-04.md` header,
  `Volume-07.md` header + Ch. 2/Ch. 4 body text)
- **Files with Status: line changed:** 0
- **Real architectural bug found and fixed:** 1 (Volume 7 / ADR-0005 conflict)
