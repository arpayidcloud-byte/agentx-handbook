# Architecture Assessment Report
**Subject:** AI Company Architecture Handbook v0.3 ("agentx")
**Reviewer role:** Chief Systems Architect / Technical Director
**Date:** 2026-07-13
**Corpus reviewed:** 00-Governance (3 docs), 01-Volumes (14 volumes), 02-RFC (20), 03-ADR (10), 04-Schemas, 05-Templates, 06-Prompts (system prompt + 13 codegen prompts), 07-Diagrams, 08-Examples — 4,643 lines total.
**Status:** Assessment only. No files modified. No code generated. Awaiting Project Owner approval before any further action.

---

## 1. Executive Summary

This handbook is unusually disciplined for a pre-implementation, solo-operator specification set. It has a real Constitution with enforceable principles, a consistent 12-section template applied across all 14 Volumes, a working RFC → ADR traceability chain (every Final ADR cites the RFC it implements; every RFC cites the Volume it belongs to), and a codegen workflow designed around a genuine constraint (Google AI Studio has no session memory). That combination — governance, traceability, and a realistic generation workflow — is the part most AI-assisted projects skip, and it's present here.

The gap is not rigor of *process*; it's coverage of *content* the process hasn't been pointed at yet. Three folders (`04-Schemas`, `07-Diagrams`, most of `08-Examples`) are conventions without contents. Several categories a 10-year enterprise platform needs — threat modeling, encryption/key management, disaster recovery, API deprecation policy, licensing/legal, sequence diagrams of the actual runtime flows — are absent, not deferred-with-reasoning like the genuinely-deferred items (multi-tenancy, cloud topology). And the ADRs/RFCs, while well-formed, are template-short (15–20 lines each): they record a decision and a one-line consequence, not the alternatives-weighing rigor the Volumes themselves demonstrate.

None of this blocks continuing. It defines what "Volume 15+" and the next RFC batch should be before Core Runtime code generation goes very far.

---

## 2. Architecture Maturity Score

Scored against what a Google/Microsoft/Linux-Foundation-style architecture board would expect at "specification frozen, pre-code" stage — not against a shipped product.

| Dimension | Score (0–5) | Basis |
|---|---|---|
| Governance & decision traceability | 4.5 | Constitution → Volume → RFC → ADR chain is real and cross-referenced, not decorative. Amendment process is defined. |
| Specification completeness (per-Volume) | 3.5 | All 14 Volumes fill every template section with substantive content — no empty headings found. But several sections (Risks, Trade-offs) are consistently thinner than Requirements/Interfaces. |
| Interface/contract rigor | 2.5 | TypeScript interfaces exist per Volume, but `04-Schemas` (the machine-validatable version) is 0% populated — contracts are currently human-trust-only. |
| Diagramming | 2.0 | Every Volume has 1–2 flowchart/state diagrams. **Zero sequence diagrams exist anywhere in the corpus**, despite being explicitly requested in your own output format and despite several flows (approval gate round-trip, provider failover, plugin invocation) being inherently sequential/multi-actor. |
| Security architecture | 2.5 | Security & Isolation is mandatory per-Volume and non-empty everywhere — genuinely good discipline. But no threat model, no encryption-at-rest statement, no secrets-rotation policy, no key management design exist anywhere. |
| Testing/QA strategy | 3.0 | Volume 14 + ADR-0009 correctly gate Approval on a contract-test template. Only 1 of 14 Volumes (Volume 2) actually has one populated. |
| Enterprise readiness (RBAC, tenancy, compliance) | 3.0 | Volume 10 has a real design (RLS + Prisma extension, RBAC model). No compliance framework mapping (SOC2/ISO27001/GDPR data-handling), no data residency, no audit-export format specified beyond "compliance export" as a chapter title. |
| Operability (observability, SRE, DR) | 2.0 | Volume 13 exists and ADR-0008 makes a real decision (no push alerting in v0.1). No disaster recovery, backup/restore, or RPO/RTO targets anywhere. |
| Extensibility / plugin governance | 3.0 | Volume 8 + RFC-0009 define extension points and a manifest. No plugin marketplace trust model (signing, sandboxing guarantees, review process, revocation) despite the prompt's stated ambition to include a Marketplace. |
| Provider-agnosticism (actual, not aspirational) | 4.0 | Constitution Principle 3 + Volume 4's normalized interface + ADR-0003's "two working adapters required" is a genuinely strong forcing function — this is the one area that would likely survive an actual Google/Microsoft review unmodified. |

**Composite: ~3.0 / 5.0 — "Solid specification skeleton, selectively deep, several load-bearing gaps before code generation should proceed past Core Runtime + Provider Platform."**

This is not a low score for the stage this project is at. It is a score that says: the *scaffolding* for a 10-year platform is sound; the *content* that would let it survive contact with production, compliance, and a real plugin ecosystem is roughly 40% written.

---

## 3. What's Genuinely Strong (don't refactor these)

- **The Constitution is enforceable, not aspirational.** Each of the 10 principles has a stated Enforcement mechanism (CI lint, CODEOWNERS, a required Volume subsection). This is rarer than it sounds — most "constitutions" in AI-generated projects are prose with no teeth.
- **RFC-0001 → ADR-0003 (provider abstraction)** is the one decision chain in the corpus with real alternatives analysis (direct-per-vendor vs. normalized interface vs. prompt-string-only), and the ADR adds a falsifiable requirement (two working adapters, not one) rather than just restating the RFC.
- **ADR-0001 (at-least-once delivery)** correctly identifies the actual trade-off (transactional outbox cost vs. no evidence of a duplicate-event problem yet) instead of defaulting to the "more correct" exactly-once design nobody has justified needing.
- **The dependency table (Volume 1, Ch. 3) with a "no lower Volume depends on a higher one" rule** is a real architectural constraint, and Volume 12 explicitly self-limits to "composition only, no new primitives" to keep it enforceable — that's the kind of discipline that prevents scope creep in year 3–4 of a project, which is exactly when it usually happens.
- **Recognizing the Google-AI-Studio-has-no-memory constraint and designing `06-Prompts/codegen/` around it** (one self-contained prompt per Volume, explicit run-order table with parallelizable sessions) is a real engineering decision, not boilerplate.

---

## 4. Gap Analysis

### 4.1 Missing specifications
- **Threat model.** No STRIDE/attack-surface analysis anywhere, despite Tool SDK executing shell commands and filesystem writes on the user's behalf (Volume 7) — this is the single highest-value missing document given what the platform actually does.
- **Data classification & encryption.** No statement of what's encrypted at rest, in transit assumptions, or how provider API keys / user secrets are stored (Volume 4 mentions "no credentials in Event Bus payloads" but not where credentials *are* stored or how rotated).
- **API/interface versioning & deprecation policy.** SemVer is named (Volume 1, Ch. 6) but there's no policy for how long a deprecated Tool/Agent/Provider interface stays callable, or how consumers are notified.
- **Disaster recovery / backup.** Volume 6 owns the durable schema (audit log, cost log) but has no backup cadence, RPO/RTO, or restore procedure.
- **Licensing.** No stated license for the platform itself, and no plugin-marketplace licensing/IP model, despite the marketplace being named in your original objective.
- **Rate limiting & abuse handling** beyond a single passing mention in Volume 2 — no design for what happens when a provider rate-limits mid-task-graph, or when a plugin misbehaves at scale.

### 4.2 Missing diagrams
- **Zero sequence diagrams in the entire corpus**, despite this being in your required output format. Concrete candidates that need one before Core Runtime code generation:
  - Task submission → decomposition → agent dispatch → approval gate → tool execution → result composition (the platform's core loop, currently only described in prose across Volumes 1, 2, 3, 5, 7).
  - Provider failover (what actually happens, in order, when the primary provider errors mid-call).
  - Plugin registration and invocation lifecycle (Volume 8 has a flowchart of extension points, not a sequence of a plugin call).
- **No error/failure-path diagrams** — every diagram found shows the happy path.

### 4.3 Missing engineering standards
- No coding standard / lint config reference beyond "ESLint, tsconfig base" named once in Volume 1's repo layout — no stated style guide, commit convention, or branch strategy.
- No API design standard (REST/RPC conventions, error envelope shape) for any HTTP surface the Enterprise Console (Volume 10) or Cloud Platform (Volume 11) will eventually expose.
- No performance budget / SLO numbers anywhere (Volume 13 owns metrics collection but defines no targets to alert against — consistent with ADR-0008's "no push alerting in v0.1," but the gap will resurface the moment alerting is turned on with nothing to compare against).

### 4.4 Missing governance
- **No RFC/ADR quality bar.** Every RFC and ADR is 15–20 lines — Context/Decision/Consequences with almost no Alternatives section (RFC-0001 is the sole exception with a real Alternatives list). A 10-year project's decision record is only as useful as its "why not the other option" content; right now most of these would need to be re-litigated from scratch if revisited in 2029.
- **No deprecation/sunset process for Volumes themselves** — the status lifecycle (Draft → Approved → Superseded) exists, but nothing describes what happens to code already generated against a Volume that later gets superseded.
- **Single Project Owner as sole approval authority** (Constitution's Definition of Approved) is fine solo but has no documented succession/backup — worth flagging now rather than at year 3.

### 4.5 Missing SDK definitions
- **Plugin SDK (Volume 8)** defines extension points and a manifest (RFC-0009) but not a **trust/sandboxing model** — how is a third-party plugin prevented from doing what Tool SDK's fail-closed permission model (ADR-0004) is designed to prevent for first-party tools?
- **Tool SDK** has a destructive-action classification (ADR-0005) but no versioning story for the classification list itself — what happens when a new tool type is added; who re-certifies it as destructive or not?
- No **Agent SDK** for third parties to define *new* agent roles — Volume 3's roster is explicitly fixed for v0.1 (ADR-0002) with no documented path for how an external contributor would propose agent #5.

### 4.6 Missing workflows
- No explicit **incident response workflow** (who/what happens when an agent causes unintended damage despite approval gates).
- No **rollback workflow** for a task graph that partially executed before failing.
- No **provider onboarding workflow** — Volume 4 says "two adapters required" (ADR-0003) but not the process for adding a third.

### 4.7 Missing security controls
- No secrets rotation policy, no key management design (KMS/vault choice deferred entirely).
- No **audit log integrity** guarantee (append-only enforcement, tamper-evidence) — Volume 6 defines the audit log's schema but not its immutability guarantee.
- No **approval-gate bypass audit** — what's logged if an operator approves a destructive action; is that itself immutable and separately reviewable for compliance (Volume 10)?

### 4.8 Missing enterprise capabilities
- No compliance framework mapping (SOC2/ISO27001/GDPR) — "compliance export" is a chapter title in Volume 10 with only schema-level content, not a mapping to an actual standard.
- No data residency / multi-region story, which will matter the moment Volume 11 (Cloud Platform) is unfrozen.
- No SSO/SAML/OIDC mention for enterprise auth — Volume 10's RBAC model assumes an identity but doesn't specify how identity is established.

---

## 5. Suggested Repository Restructuring

The current structure is sound; these are additive, not a rewrite:

```
00-Governance/
  + THREAT_MODEL.md            (new — see RFC list below)
  + SECURITY_STANDARDS.md      (encryption, secrets, key mgmt — cross-Volume, doesn't belong to one Volume)
  + LICENSE.md
01-Volumes/
  Volume-15-Compliance-and-Data-Governance.md   (proposed — see below)
02-RFC/  03-ADR/            (no structural change — content gap, not folder gap)
04-Schemas/                 (populate per its own README convention — currently the single
                             highest-leverage empty folder: unlocks CI-validated contracts)
07-Diagrams/
  + sequence/                (new subfolder — house the sequence diagrams identified in 4.2
                              before they're exported as snapshots per the folder's stated purpose)
09-Runbooks/                 (new top-level — incident response, rollback, DR restore;
                              these are operational, not architectural, and don't belong in
                              a Volume's Requirements section per Volume 1's own conventions)
```

---

## 6. Suggested Roadmap Improvements

Your existing roadmap (README + Volume 1 Ch. 12) is: Volume 2 → 3/4 → 7 → 5 → 6 → 8/9. Recommend inserting two checkpoints rather than reordering it:

1. **Before Volume 2 code generation starts:** populate `04-Schemas/volume-02.schema.json` and the missing sequence diagram for the task lifecycle (4.2). Both are cheap now and expensive to retrofit once Gemini has generated code against prose-only interfaces.
2. **Before Volume 7 (Tool SDK) code generation starts:** write the threat model (5.1 below). Tool SDK is the platform's actual attack surface (shell exec, filesystem writes); everything else is comparatively low-risk to sequence-shuffle.
3. Everything else in the existing roadmap can proceed as planned — Volumes 10, 11, 12 remain correctly gated post-v0.1.

---

## 7. Suggested RFC List

| # | Title | Volume | Why now vs. later |
|---|---|---|---|
| RFC-0021 | Secrets Storage & Rotation Design | 4, 11 | Blocks any real provider credential handling |
| RFC-0022 | Threat Model & Trust Boundaries for Tool SDK | 7 | Highest-risk unaddressed area; should precede Volume 7 codegen |
| RFC-0023 | Plugin Sandboxing & Trust Model | 8 | Marketplace was in original objective; current design has no isolation guarantee |
| RFC-0024 | Audit Log Immutability Mechanism | 6 | Compliance export (Volume 10) is meaningless without this |
| RFC-0025 | API/Interface Deprecation Policy | 1 | Cross-cutting; belongs in Foundation per its own Ch. 5 convention |
| RFC-0026 | Disaster Recovery & Backup Strategy | 6, 11 | Needed before any production deployment, not before v0.1 dev use |
| RFC-0027 | Third-Party Agent Role Proposal Process | 3 | Fixed roster (ADR-0002) needs a documented amendment path, not just "via RFC" in the abstract |
| RFC-0028 | Compliance Framework Mapping (SOC2 baseline) | 10 | Can be scoped even while Volume 10 stays post-v0.1 |

## 8. Suggested ADR List

These are decisions the corpus is *implicitly* already making by omission — better to make them explicit:

| # | Title | Rationale |
|---|---|---|
| ADR-0011 | No Threat Model Required Before v0.1 CLI (or: reverse this) | Right now this is a silent decision, not a recorded one — Constitution Principle 1 says silent violation isn't permitted |
| ADR-0012 | Secrets Storage Mechanism for v0.1 (env vars vs. vault) | Volume 4/11 mention "no credentials logged" but never where they live |
| ADR-0013 | RFC/ADR Minimum Content Bar (require an Alternatives section) | Governance-of-governance; keeps future decisions re-litigable in 2029 |
| ADR-0014 | Audit Log Append-Only Enforcement Mechanism | Postgres-level (trigger/permissions) vs. application-level |

---

## 9. Top Architectural Risks

1. **Interface drift between prose (Volumes) and eventual code, with no CI-validatable contract.** `04-Schemas` being empty means Constitution Principle 6 ("Testable by Default") is currently aspirational for 13 of 14 Volumes. This is the single largest risk to the project's own stated premise.
2. **Tool SDK is the actual attack surface and has the least security depth relative to its risk.** ADR-0004 (fail-closed) and ADR-0005 (conservative destructive classification) are good decisions but sit on top of no threat model — you don't yet know if fail-closed defaults cover the actual attack surface, only that they cover the cases already thought of.
3. **Solo-Project-Owner bottleneck on Approval.** Every Volume, RFC, and ADR requires this one person's sign-off (Constitution's Definition of Approved) — realistic for now, but it's a single point of failure the Constitution itself doesn't acknowledge.
4. **RFC/ADR shallowness compounds over time.** Short decision records without alternatives analysis are fine at record #1–10; by #50 they stop functioning as institutional memory, which defeats Constitution Principle 8's entire purpose.

## 10. Top Scalability Risks

1. **BullMQ/Redis at-least-once delivery (ADR-0001) pushes all idempotency burden onto consumers**, and that burden is currently documented as a requirement, not verified by any populated contract test outside Volume 2 — as agent/plugin count grows, dedupe bugs become the most likely source of silent data corruption.
2. **Volume 6's schema has no stated partitioning/archival strategy** for the audit log and cost log, which are the two tables guaranteed to grow unboundedly with usage — this will matter well before Volume 11 (Cloud Platform) is unfrozen.
3. **No load/concurrency targets anywhere.** Volume 2's Scheduler has a pause/resume primitive but no stated target for concurrent task graphs, which makes it impossible to know today whether the BullMQ-backed design will need re-architecture at 10x or 100x current assumed scale.
4. **Provider Platform's cost-tracking (Volume 4) has no back-pressure design** for what happens when a provider's cost or rate limit is hit mid-multi-agent-workflow — only single-call failure handling is implied.

## 11. Long-Term Evolution Strategy (10-Year View)

- **Years 0–1 (current → v0.1):** Close the sequence-diagram and schema-population gaps before Core Runtime, Provider Platform, and Tool SDK are code-generated — these three are the load-bearing walls; everything else (Volumes 5, 6, 8, 9) can tolerate more iteration after code exists.
- **Years 1–2 (v0.1 → v1.0):** This is where RFC-0021–0026 above should land, gated by real usage data rather than authored speculatively — Volume 13's audit-derived metrics (RFC-0017) are the right mechanism to decide *when* threat model / DR / secrets-rotation work becomes urgent rather than theoretical.
- **Years 2–5 (Enterprise unlock, Volumes 10–11):** The Small Stable Core principle (Constitution #10) is the thing to protect hardest here — the existing "lower Volume never depends on higher" rule has held cleanly through 14 Volumes; the real test is whether Volume 10/11 implementation pressure tempts a violation (e.g., RBAC needing to reach back into Core Runtime). Recommend a standing ADR requirement: any such reach-back requires unanimous sign-off per Constitution Principle 10's existing enforcement clause — don't let Enterprise-Platform urgency erode it.
- **Years 5–10 (AI Company OS, Volume 12, and beyond):** Volume 12's own self-imposed constraint ("composition only, no new primitives") is the correct one and should outlive several rewrites of the modules below it — if it's ever violated, that's the signal the platform has quietly become something else, and it deserves a fresh Constitution review, not a Volume 12 patch.

---

## 12. Closing

No files have been modified. No implementation code has been generated. This assessment is a review artifact only.

Recommended next action, pending your approval: begin with **RFC-0022 (Threat Model & Trust Boundaries for Tool SDK)** and **`04-Schemas/volume-02.schema.json` population**, since both sit directly in front of the next codegen session (`02-core-runtime.md`) per your own run order.
