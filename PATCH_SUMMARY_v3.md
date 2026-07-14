# PATCH_SUMMARY_v3.md — Citation Correction Patch

**Version:** AI Company Architecture Handbook v1.0 (patched)
**Date:** 2026-07-14
**Type:** Documentation-consistency patch only. No architectural changes, no new
Volumes/RFCs/ADRs, no scope changes.

---

## Issue — Incorrect ADR Citations in THREAT_MODEL.md Header

**Problem:** `00-Governance/THREAT_MODEL.md`'s reference line cited two ADRs with
descriptions that did not match their actual content:

- Cited "ADR-0011 (Append-Only Audit)" — but ADR-0011 is actually
  *"Lightweight Threat Model Required Before Tool SDK Code Generation."* The ADR that
  actually defines append-only audit enforcement is **ADR-0014**
  ("Audit Log Append-Only Enforcement via Database Triggers").
- Cited "ADR-0005 (Provider Failover)" — but ADR-0005 is actually
  *"Conservative Destructive Classification for fs.write."* No ADR in the corpus is
  titled or scoped as "Provider Failover."

This is a citation/reference error only. It does not affect the STRIDE analysis content,
the trust-boundary diagram, or any decision recorded elsewhere in the corpus.

**Fix:** Corrected the reference line to cite the ADRs that actually match each topic:

```diff
- **References:** RFC-0021 (Security Architecture), ADR-0011 (Append-Only Audit),
-   ADR-0004 (Tool Sandboxing), ADR-0005 (Provider Failover)
+ **References:** RFC-0021 (Security Architecture), ADR-0014 (Append-Only Audit),
+   ADR-0004 (Fail-Closed Permission Checks), ADR-0005 (Conservative Destructive
+   Classification for fs.write)
```

ADR-0004's description was also tightened from the informal "Tool Sandboxing" to its
actual decision title, "Fail-Closed Permission Checks," for accuracy.

### Files Modified

| File | Reason |
|---|---|
| `00-Governance/THREAT_MODEL.md` | Reference line corrected to cite ADR-0014 (not ADR-0011) for append-only audit, and to accurately describe ADR-0004 and ADR-0005. |

### Files Added

| File | Reason |
|---|---|
| `PATCH_SUMMARY_v3.md` | This record. |

## Scope Confirmation

- No architectural changes.
- No new Volumes, RFCs, or ADRs.
- No feature or capability added.
- No schema files modified.
- Single-line citation correction in one governance document.
