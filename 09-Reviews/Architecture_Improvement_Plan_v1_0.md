# Architecture Improvement Plan (AIP)
**Body:** Architecture Review Board (ARB), Phase 2
**Input:** Architecture Assessment Report v0.3 (approved)
**Scope of this document:** Planning only. No handbook files modified. No implementation code. No new documentation chapters authored — this plan specifies *what* to write and *why*, not the finished prose.
**Posture:** Improve, don't redesign. Every recommendation below is additive to the existing 14-Volume structure, the Constitution's 10 principles, and the RFC→ADR chain. Nothing here proposes discarding a Final ADR or an Approved Volume's core decisions.

---

## 0. How This Plan Is Organized

Sections 1–11 map directly to the eleven deliverables requested. Every item carries a priority (**High** = blocks safe continuation past Core Runtime/Provider Platform/Tool SDK codegen; **Medium** = should land before v0.1 exits scope into Enterprise/Cloud; **Low** = correct to plan now, correct to defer execution). Priorities are derived from the same load-bearing logic as the Assessment Report: Tool SDK is the attack surface, Provider Platform is the abstraction the whole Constitution leans on, and Core Runtime is what everything else depends on — gaps touching those three outrank everything else by construction, not by preference.

---

## 1. Architecture Improvement Roadmap

| Priority | Improvement | Why this tier |
|---|---|---|
| **High** | Populate `04-Schemas/` starting with Volume 2, 4, 7 | Unblocks CI-validated contracts for the three Volumes code generation touches first |
| **High** | Author the Tool SDK threat model (new RFC, Section 6) | Tool SDK is the actual attack surface; ADR-0004/0005 currently rest on no documented threat analysis |
| **High** | Add sequence diagrams for the task lifecycle, provider failover, and approval-gate round-trip | Zero exist today; Core Runtime codegen sessions currently have no multi-actor timing reference |
| **High** | Secrets storage & credential lifecycle design (new RFC + ADR) | Volume 4/11 assume credentials are handled safely but never say how or where |
| Medium | Identity & Authentication domain design (new Volume, Section 2) | Volume 10's RBAC model has no identity source; this is load-bearing for Volume 10, not for v0.1 CLI |
| Medium | Audit log immutability mechanism (new ADR) | Compliance export (Volume 10) is not credible without it, but Volume 10 is already post-v0.1 |
| Medium | Plugin trust/sandboxing model (extends Volume 8) | Needed before any third-party plugin runs untrusted code, not before first-party CLI ships |
| Medium | Disaster recovery & backup strategy (new RFC, extends Volume 6/11) | Needed before production deployment, not before local/dev use |
| Low | Marketplace, Billing, Licensing domains | Named in the original objective's ambition, not in the v0.1 exit criteria — correct to scope now, wrong to build before v0.1 CLI proves the core loop |
| Low | Multi-region / data residency design | Depends on Volume 11 being unfrozen, which is itself correctly gated post-v0.1 |

This ordering deliberately does not resequence Volumes 1–14's own roadmap (Volume 2 → 3/4 → 7 → 5 → 6 → 8/9 → gated 10/11/12). It inserts checkpoints inside that sequence rather than reordering it, per the Assessment Report's Section 6.

---

## 2. Missing Volumes

Two new Volumes are justified by load-bearing gaps found in Section 4 of the Assessment Report. Two more candidate domains (Marketplace, Billing) are evaluated and **not** recommended as standalone Volumes yet — reasoning given below, since the instruction is to determine necessity, not default to "yes."

### Volume 15: Identity & Access Foundation — **recommended, Medium priority**

**Why a Volume and not just an RFC:** Volume 10's RBAC model (RFC-0012) assumes an authenticated identity exists but never defines where that identity comes from. That's not a single decision (RFC-sized); it's a module with its own contract, lifecycle, and security surface — the same reasoning that made Tool SDK its own Volume rather than a Core Runtime chapter.

- **Governs:** Authentication (how an identity is established — SSO/SAML/OIDC for enterprise, local credential for solo/dev mode), session lifecycle, service-to-service identity (for Plugin Platform calling back into Core Runtime).
- **Depends on:** Volume 1, 2. **Depended on by:** Volume 9 (CLI auth), Volume 10 (RBAC needs this as its identity source), Volume 8 (plugin identity).
- **Position in the dependency table:** Between Volume 7 (Tool SDK) and Volume 8 (Plugin Platform) — plugins need an identity model to be scoped against; Volume 10's RBAC currently has no Volume to depend on for "what is a user," which is itself a gap in Volume 1's Chapter 3 module map.
- **Chapters to scope (not author):** 1. Authentication Modes (solo/dev vs. enterprise SSO) 2. Session & Token Lifecycle 3. Service Identity (plugin/agent-to-core calls) 4. Identity-to-RBAC Handoff Contract (the interface Volume 10 consumes).
- **Key interface it must export:** an `Identity` type Volume 10's RBAC model can consume without redefining — closes the exact gap flagged in Assessment Report §4.8.
- **Not in scope for this Volume:** the RBAC role/permission model itself (stays in Volume 10) — this Volume only establishes *who*, Volume 10 still owns *what they can do*.

### Volume 16: Secrets & Key Management — **recommended, High priority**

**Why a Volume and not just an RFC:** Secrets touch Provider Platform (API keys), Tool SDK (any credential a tool needs), Cloud Platform (KMS/vault choice), and CLI (local credential storage) — four existing Volumes reference "credentials" or "secrets" without a shared owner. Constitution Principle 4 (Plugin First) and Principle 9 (No Vendor Lock-in) both apply directly here (a KMS choice must have a self-hosted fallback per Principle 9), which is enough cross-cutting weight to justify a Volume rather than scattering the decision across four RFCs that would each reinvent it slightly differently.

- **Governs:** Secret storage backend (with the self-hosted-fallback requirement already established as a pattern by ADR-0007), rotation policy, secret-to-consumer distribution (how Provider Platform actually retrieves a credential at call time), audit of secret access.
- **Depends on:** Volume 1, 2, 4. **Depended on by:** Volume 4, 7, 9, 11.
- **Position in the dependency table:** Alongside Volume 6 (Memory Engine) — both are foundational persistence/state concerns Volumes 3–9 consume, not user-facing Volumes in their own right.
- **Chapters to scope:** 1. Secret Storage Backend & Self-Hosted Fallback 2. Rotation Policy 3. Runtime Retrieval Contract (interface Provider Platform Ch. 3 "Credential Resolution" should be revised to call) 4. Secret-Access Audit Trail.
- **Direct consequence for existing Volumes:** Volume 4 Chapter 3 ("Credential Resolution") currently describes resolution *behavior* with no backing store — once Volume 16 exists, Volume 4 Ch. 3 should be revised (via RFC, not silently) to cite Volume 16's retrieval contract instead of assuming it.

### Marketplace, Billing, Licensing — **evaluated, not recommended as Volumes yet**

These were named in the original project objective ("Marketplace... future AI technologies") and appear in the ARB prompt's example domain list. Recommendation: **do not create Volumes for these now.**

- Reasoning: Volume 8 (Plugin Platform) already owns "third-party extension points," and a Marketplace is a *distribution and trust* layer on top of Plugin Platform, not a peer architectural concern — creating it now, before Volume 8's own trust model (Section 3 below) exists, would mean designing a storefront for a plugin system that can't yet say what's safe to list. This directly follows Constitution Principle 10 (Small Stable Core): don't grow the module map faster than the layer beneath it is solid.
- Billing and Licensing are gated behind Marketplace and Enterprise Platform both existing — recommend they become **RFCs under Volume 10 or 11** once those unfreeze, not new Volumes, unless usage reveals they need independent lifecycle (the same test Volume 13/14 passed when they were added in Volume 1's own Recommended Additions).
- This is the one place this plan intentionally declines to expand the module map, in the same spirit Volume 12 declined to introduce new primitives.

---

## 3. Missing Domains

Using the ARB prompt's own example list as a checklist against the current corpus:

| Domain | Currently exists? | Recommendation |
|---|---|---|
| Authentication / Identity | No | Volume 15 (Section 2, above) |
| Secrets | Partial (mentioned, not owned) | Volume 16 (Section 2, above) |
| Marketplace | No | Deliberately deferred (Section 2, above) |
| Collaboration (multi-user editing/comments on a task graph) | No | **Low priority RFC under Volume 9 or 12** — CLI's v0.1 is explicitly single-operator (Volume 9 Ch. objectives); real collaboration is an Enterprise Console (Volume 10) concern, not a new domain |
| Billing | No | Deliberately deferred (Section 2, above) |
| Notifications (approval-gate alerts beyond CLI prompt, e.g. Slack/email) | No | **Medium priority RFC under Volume 9** — ADR-0008 already decided "no push alerting in v0.1" for *system* alerts (Volume 13); operator-facing approval notifications are a distinct, smaller concern worth its own RFC rather than conflating with ADR-0008's scope |
| Feature Flags | No | **Low priority** — no evidence yet the project needs staged rollout; premature for a pre-v0.1 platform |
| Configuration Service | Partial (Volume 9 Ch. 5 "Configuration" covers CLI-local config only) | **Medium priority RFC** — once Volume 10/Enterprise exists, org-level config (vs. per-operator CLI config) needs a real owner; flag now, build later |
| Policy Engine | Partial (Volume 10 Ch. 3 "Policy Engine," advisory→enforced) | Already scoped inside Volume 10 — no new domain needed, but its RFC-0012 companion should be extended once Volume 15 (Identity) exists, since policy needs an identity to apply to |
| Search | No | **Low priority** — no current requirement (task/audit log retrieval is query-by-ID/date per Volume 6, not full-text search); revisit only if Volume 6's retrieval strategy (RFC-0008) proves insufficient |
| Analytics | Overlaps Volume 13 (Observability) | No new domain — Volume 13's metrics taxonomy already covers this; a separate Analytics domain would duplicate responsibility (flagged again in Section 8) |
| API Gateway | No | **Medium priority, gated to Volume 11** — only becomes real once Cloud Platform exposes any HTTP surface beyond the CLI talking to a local process; premature before that |
| Governance Services (tooling that enforces the Constitution/handbook conventions itself, e.g. a linter for "no empty headings") | No | **Low priority RFC under `00-Governance`** — Volume 1's own Risks section already flagged "module boundary table becomes stale" as a risk with a recommended CI check; this formalizes that into an actual governance-tooling RFC |

---

## 4. Missing Standards

| Standard | Priority | Owner (existing or proposed) |
|---|---|---|
| Security Standards (encryption at rest/in transit, key handling) | **High** | New `00-Governance/SECURITY_STANDARDS.md`, cross-cutting — no single Volume should own this since Provider, Tool SDK, Memory, and Cloud all need to cite the same rules |
| API Standards (error envelope shape, versioning/deprecation window) | **High** | Volume 1 Ch. 5 extension — this is a document-convention-shaped gap, consistent with how Volume 1 already owns conventions |
| Threat Modeling Standard (what STRIDE-style categories every Volume's Security & Isolation subsection must consider) | **High** | New `00-Governance/THREAT_MODELING_STANDARD.md`, referenced by Constitution Principle 7's existing enforcement clause |
| SDK Standards (what "shipping an SDK" requires — versioning, changelog, contract test coverage) | Medium | Extends Volume 14 (Testing & QA), since SDK quality bar is a testing-strategy concern, not a new standard type |
| Plugin Standards (manifest schema versioning, review/signing process) | Medium | Extends Volume 8 + RFC-0009, tied to the plugin trust model in Section 3 below |
| Release Standards (what "cutting a release" requires beyond SemVer already named in Volume 1 Ch. 6) | Medium | Volume 1 Ch. 6 extension |
| Cloud Standards (region strategy, managed-service evaluation criteria beyond the self-hosted-fallback rule ADR-0007 already sets) | Low (correctly gated to Volume 11) | Volume 11 extension |
| Prompt Standards (how agent system prompts are versioned/tested — distinct from `06-Prompts/` which governs *codegen* prompts, not *agent runtime* prompts) | Medium | **New gap, not previously flagged** — Volume 3 (Agent Platform) defines agent roles and tool access but not how each agent's own system prompt is authored, versioned, or regression-tested when a provider model changes. Recommend a new Volume 3 chapter, not a new Volume. |
| Documentation Standards (beyond the Volume/RFC/ADR templates already in `05-Templates/`) | Low | Already reasonably covered; only gap is the RFC/ADR minimum-content bar from ADR-0013 (Assessment Report §8) |
| Observability Standards (what "instrumented" means for a new module — required metrics/traces before a Volume can be Approved, analogous to ADR-0009's contract-test requirement) | Medium | New ADR extending Volume 13, modeled directly on ADR-0009's pattern |
| Workflow Standards (what makes a Task Graph pattern reusable/composable — Volume 5 defines task graphs but not a registry/pattern-library convention) | Low | Volume 5 extension, low urgency pre-v0.1 |

---

## 5. Missing Diagrams

Complete list, organized by what's genuinely missing vs. what exists in a different form:

**Entirely absent (High priority — none exist anywhere in the corpus):**
- Sequence diagrams — task submission → decomposition → dispatch → approval → execution → composition; provider failover; plugin invocation lifecycle; audit-log write path
- Trust boundary diagram — where does data cross from "operator-trusted" to "agent-controlled" to "tool-executed" to "external network" (directly needed for the Section 6 threat-model RFC)
- Threat model diagram (STRIDE-per-boundary or equivalent)
- Data flow diagram — where does a credential, a source-code file, or a task's goal string actually travel between modules (distinct from the module *dependency* diagram Volume 1 already has)

**Partially covered by existing flowcharts, but not to the depth requested:**
- C4 Container/Component diagrams — Volume 1's system context diagram is C4-Context-equivalent; no Container or Component level exists for any Volume. **Medium priority** — valuable once code exists to keep the diagram honest, lower value authored purely from specification.
- Deployment diagram — Volume 11 Ch. 1 has a topology description in prose/table form, not a rendered deployment diagram. **Low priority**, correctly gated with the rest of Volume 11.
- Network diagram (egress requirements, already partially named in Volume 1 Ch. 5's "Cloud Platform can enumerate egress requirements" note, but never rendered) — **Medium priority**, cheap to produce once Volume 16 (Secrets) clarifies what actually needs network egress.
- Interaction matrix (which Volume/module is allowed to call which other module, synchronously vs. via Event Bus) — Volume 1 Ch. 3's dependency table is close but conflates *architectural* dependency with *runtime call* permission (Constitution Principle 5 distinguishes these but no diagram shows it). **High priority** — this is cheap to produce from existing information and directly clarifies a real ambiguity.

**Activity/State diagrams:** Volume 2 already has a state diagram (task lifecycle) — this category is reasonably covered; the gap is *sequence*, not *state*.

---

## 6. Missing RFCs

| # | Purpose | Priority | Dependencies | Affected Volumes | Est. Complexity |
|---|---|---|---|---|---|
| RFC-0021 | Threat model & trust boundaries for Tool SDK | **High** | None (can start immediately) | 7, 1 | Medium — requires the trust-boundary diagram (Section 5) as a prerequisite artifact |
| RFC-0022 | Secrets storage backend & self-hosted fallback (feeds Volume 16) | **High** | ADR-0007's fallback pattern | 4, 16, 11 | Medium |
| RFC-0023 | Credential runtime retrieval contract (revises Volume 4 Ch. 3) | **High** | RFC-0022 | 4, 16 | Small — mostly interface definition |
| RFC-0024 | Audit log immutability mechanism | Medium | Volume 6's existing schema | 6, 10 | Small |
| RFC-0025 | Identity & Authentication modes (feeds Volume 15) | Medium | None | 15, 9, 10 | Large — enterprise SSO/OIDC design is genuinely substantial |
| RFC-0026 | Identity-to-RBAC handoff contract | Medium | RFC-0025 | 15, 10 | Small |
| RFC-0027 | Plugin sandboxing & trust model | Medium | RFC-0021 (shares threat-model methodology) | 8 | Large |
| RFC-0028 | Third-party agent role proposal process | Low | ADR-0002 (fixed roster) | 3 | Small |
| RFC-0029 | API/interface deprecation policy | Medium | None | 1 (Ch. 5/6 extension) | Small |
| RFC-0030 | Disaster recovery & backup strategy | Medium | None | 6, 11 | Medium |
| RFC-0031 | RFC/ADR minimum content bar (require Alternatives section) | Medium | None — governance-of-governance | 00-Governance | Small |
| RFC-0032 | Agent system prompt versioning & regression testing | Medium | None | 3, 14 | Medium |
| RFC-0033 | Observability instrumentation requirement for Volume Approval (mirrors ADR-0009's contract-test gate) | Medium | ADR-0009 as precedent | 13, 14, 1 | Small |
| RFC-0034 | Notification channel for approval gates beyond CLI prompt | Low | None | 9 | Small |
| RFC-0035 | Compliance framework mapping (SOC2 baseline) | Low (correctly gated post-v0.1) | RFC-0024 | 10 | Large |

---

## 7. Missing ADRs

Each of these records a decision the corpus is currently making *implicitly*, by omission — Constitution Principle 1 states silent violation isn't permitted, which is itself the justification for writing these down rather than leaving them unrecorded:

| # | Decision | Why it deserves its own ADR (not folded into another) |
|---|---|---|
| ADR-0011 | Whether a threat model is required before v0.1 CLI ships, or explicitly deferred | This is currently an unstated "no" by omission — Principle 1 requires it be either affirmed or reversed on the record, not left ambiguous |
| ADR-0012 | Secrets storage mechanism for v0.1 (env vars vs. vault, before Volume 16 is fully built) | v0.1 needs *some* interim answer even while Volume 16/RFC-0022 are in progress — an ADR bridges that gap explicitly rather than leaving Provider Platform's credential handling undefined in the meantime |
| ADR-0013 | RFC/ADR minimum content requirement (mandatory Alternatives section) | Implements RFC-0031; deserves its own ADR because it changes the Constitution's own Definition-of-Approved-adjacent process, which Constitution's amendment clause requires an ADR for |
| ADR-0014 | Audit log append-only enforcement mechanism (DB trigger vs. application-level) | A genuine architectural choice with real trade-offs (DB-level is stronger, application-level is more portable per Principle 9) — same shape as ADR-0001's delivery-guarantee decision |
| ADR-0015 | Interaction-matrix diagram becomes a required artifact for Volume Approval | Small process decision, but changes the Definition of Approved (Constitution), which per its own amendment clause needs an ADR, not just a convention note |
| ADR-0016 | Marketplace/Billing/Licensing explicitly out of scope until Volume 8's trust model exists | Records the Section 2 deferral decision on the record, rather than leaving "why isn't there a Marketplace Volume" unanswered for a future reviewer |

---

## 8. Cross-Volume Consistency Review

**Contradictions found:** None outright — this is a genuine strength of the corpus (the dependency table's "no lower Volume depends on a higher one" rule has held across all 14 Volumes on inspection).

**Duplicated or overlapping responsibility (soft conflicts, not contradictions):**
- **Volume 13 (Observability) vs. a hypothetical "Analytics" domain** — already resolved above (Section 3) by *not* creating a separate domain; flagged here as the review finding that produced that recommendation.
- **Volume 9 Ch. 5 (CLI Configuration) vs. Volume 10's eventual org-level config** — not a current conflict since Volume 10 hasn't specified org config yet, but this is exactly the kind of gap that produces a real conflict later if Volume 10 defines org config without an explicit note that it *extends* rather than *replaces* Volume 9 Ch. 5. Recommend Volume 10's future config chapter open with an explicit relationship statement, the same pattern Volume 10 Ch. 1 already uses for extending Volume 6's schema.
- **Volume 4 Ch. 3 (Credential Resolution) will become stale, not contradictory, once Volume 16 exists** — flagged in Section 2; this is a forward-looking consistency risk, not a present one.

**Misplaced responsibility:**
- **Volume 2's NFR-2 requires a `traceId`** but Volume 13 (not Volume 2) is what actually implements tracing. This is *correctly* placed per Volume 1's own convention (Volume 2 defines the requirement, Volume 13 the mechanism) — noted here only to confirm it was checked, not because it's wrong.
- **Volume 3's fixed agent roster (ADR-0002) and Volume 8's plugin extension points (RFC-0009)** currently have no stated relationship — can a plugin ever *add* an agent, or only tools? This is ambiguous enough to be a misplaced-responsibility risk: it's unclear whether "new agent roles" belongs to Volume 3 (via RFC-0028, Section 6) or Volume 8. **Recommend RFC-0028 explicitly settle this boundary**, not just "add a process" — the process needs to state which Volume owns it first.

**Restructuring recommendation:** None of the above rises to the level of moving content between existing Volumes. The dependency graph and module boundaries (Volume 1 Ch. 3) remain sound; the fixes are additive RFCs/ADRs, consistent with this plan's "improve, don't redesign" mandate.

---

## 9. Repository Evolution

Builds on, does not replace, the Assessment Report's Section 5 recommendation:

```
00-Governance/
  PROJECT_CONSTITUTION.md   (unchanged)
  GLOSSARY.md               (unchanged)
  CONTRIBUTING.md           (unchanged)
  + SECURITY_STANDARDS.md          (Section 4)
  + THREAT_MODELING_STANDARD.md    (Section 4)
  + API_STANDARDS.md               (Section 4, or fold into Volume 1 Ch. 5 — see note below)

01-Volumes/
  Volume-01 .. Volume-14   (unchanged)
  + Volume-15-Identity-and-Access-Foundation.md   (Section 2)
  + Volume-16-Secrets-and-Key-Management.md       (Section 2)

02-RFC/     (RFC-0021 through RFC-0035 land here as authored, per Section 6's priority order)
03-ADR/     (ADR-0011 through ADR-0016 land here, per Section 7)

04-Schemas/  (populate per its existing convention — Volume 2, 4, 7 first, matching Section 1's High-priority items)

07-Diagrams/
  + trust-boundaries/       (new subfolder — houses the trust boundary and threat model diagrams from Section 5)
  + sequence/                (already recommended in the Assessment Report; reaffirmed here)
  + interaction-matrix/      (new — the single High-priority diagram from Section 5 that's cheap to produce now)

09-Runbooks/  (already recommended in the Assessment Report — incident response, DR restore; unaffected by this plan)
```

**One open question flagged rather than decided:** whether `API_STANDARDS.md` belongs in `00-Governance/` as a new file or as an extension of Volume 1 Ch. 5 (which already owns "document conventions" — API conventions are arguably the same category of thing, just for runtime interfaces instead of documents). Recommend this be settled by a short RFC rather than this plan picking unilaterally, since it's exactly the kind of "which Volume owns this" question Section 8 flags as worth getting right the first time.

**No other structural changes recommended.** The existing 00–08 top-level structure has proven itself across 14 Volumes and 30 RFC/ADR-equivalent documents; the additions above extend it rather than reorganize it, consistent with "improve, don't redesign."

---

## 10. Enterprise Readiness Evaluation

| Capability | Current state | Gap | Closes via |
|---|---|---|---|
| Identity & Authentication | Not specified | No identity source for RBAC | Volume 15 |
| Authorization | Volume 10 RBAC model exists (RFC-0012) | Model is real but has no identity to bind to yet | Volume 15 → Volume 10 handoff (RFC-0026) |
| Multi-tenancy | Volume 10 has a real design (RLS + Prisma extension, ADR-0006) | Genuinely solid — no material gap found | — |
| Secrets Management | Mentioned, not owned | No storage backend, rotation, or retrieval contract | Volume 16 |
| Compliance (SOC2/ISO27001/GDPR) | "Compliance export" is a Volume 10 chapter title only | No framework mapping, no data-handling classification | RFC-0035 (correctly Low/gated) |
| Disaster Recovery | Absent | No backup cadence, RPO/RTO, restore procedure | RFC-0030 |
| Business Continuity | Absent | Single-Project-Owner approval bottleneck also unaddressed (Assessment Report §9) | Not a Volume-level fix — recommend a Constitution amendment RFC once the project has more than one maintainer, not before |
| Observability | Volume 13 is genuinely solid for its stage (real metrics taxonomy, tracing, a considered no-alerting decision in ADR-0008) | No instrumentation requirement gating Volume Approval | RFC-0033 |
| Scalability | No load/concurrency targets anywhere (Assessment Report §10) | Cannot currently state whether BullMQ/Postgres design holds at 10x | Not resolvable by documentation alone — recommend this become a Volume 13-tracked metric once real usage exists, per this plan's Section 11 v0.5 milestone below |
| High Availability | Not specified — Volume 11 Ch. 3 "Scaling Levers" exists but HA (failover, redundancy) is distinct from scaling | Gap, correctly gated to Volume 11 | Volume 11 extension, post-v0.1 |
| Upgrade Strategy | SemVer named (Volume 1 Ch. 6); no deprecation window | Gap | RFC-0029 |
| Version Compatibility | Same as above | Same as above | RFC-0029 |
| Plugin Compatibility | Manifest exists (RFC-0009); no versioning/compat policy for the manifest schema itself | Gap | Folds into the Plugin Standards item, Section 4 |
| Provider Compatibility | Strong — ADR-0003's two-adapter requirement is a real forcing function | No material gap found | — |

**Overall enterprise-readiness read:** the two areas that are genuinely strong (multi-tenancy, provider abstraction) are strong because they each had a real RFC→ADR decision chain with alternatives considered. The areas that are weak (identity, secrets, DR, compliance) are weak specifically because they never got that treatment — they're mentioned in passing inside other Volumes rather than owned. That pattern is the single clearest signal in this whole review: **quality here correlates directly with whether something got its own RFC, not with how important it sounds.** The improvement plan's priority ordering follows from that observation, not from the example domain list alone.

---

## 11. Long-Term Evolution Roadmap

Consistent with the Assessment Report's 10-year view, but broken into the version milestones requested. Each milestone lists the *architectural* event that defines it — not a feature list.

- **v0.5** — Core Runtime, Provider Platform, Tool SDK, Agent Platform code-generated and passing their contract tests (Volume 2, 4, 7, 3). Volume 15 and 16 (Identity, Secrets) exist as approved specifications even if not yet fully implemented, so Provider Platform's credential handling has a real contract to code against instead of ADR-0012's interim bridge decision. Sequence diagrams and the interaction-matrix diagram (Section 5) exist and are kept current, since this is when Core Runtime's actual call patterns stabilize enough to diagram truthfully.
- **v1.0** — Full v0.1 exit criteria met (Volume 1 Ch. 6) plus: threat model (RFC-0021) verified against real Tool SDK behavior, not just specified; `04-Schemas/` populated for all of Volumes 2–9; disaster recovery (RFC-0030) implemented and tested at least once via an actual restore drill. This is the first version where "would Google/Microsoft reject this" should get a genuinely defensible "no" for the core platform (Volumes 1–9) — Enterprise/Cloud/OS layers remain explicitly out of scope for that bar at this stage.
- **v2.0** — Volume 10 (Enterprise) and Volume 15 (Identity) fully implemented and integrated; first real multi-tenant deployment. Plugin trust model (RFC-0027) is load-bearing by now, since v2.0 is a reasonable point for third-party plugins to move from "extension points exist" to "extension points are safe to expose publicly." Compliance mapping (RFC-0035) becomes active work here, not before — matches the "close to zero before it's real usage-tested" philosophy this plan applies throughout.
- **v3.0** — Volume 11 (Cloud) fully implemented with HA and multi-region; API Gateway domain (Section 3) becomes real once there's a genuine external HTTP surface to govern. This is also the natural point to revisit Constitution Principle 10 (Small Stable Core) formally — three major versions of pressure on the core is exactly the scenario that section's "protect it hardest here" guidance in the Assessment Report was written for.
- **v5.0** — Volume 12 (AI Company OS) becomes real: multi-project, org-level orchestration. Per Volume 12's own self-imposed constraint, this version should introduce **zero new execution primitives** in Core Runtime — if v5.0 planning finds itself needing one, that's the signal (per the Assessment Report's closing guidance) that the platform has quietly become something else and needs a fresh Constitution review before proceeding, not a Volume 12 patch.
- **v10.0** — Not planned in architectural detail here — deliberately. Per Constitution Principle 1 (Architecture First), planning execution detail 10 versions out from a still-unimplemented v0.1 would itself be a violation of Specification First (Principle 2: a feature isn't started until it has real Acceptance Criteria, and nothing at v10.0 horizon can yet). What's committed at v10.0 is a **process guarantee**, not a feature set: the Constitution's 10 principles, the RFC→ADR chain, and the Small Stable Core discipline are the things this plan expects to still be true — everything built on top of them is expected to have been re-planned several times by then, correctly.

---

## Closing

No handbook files modified. No implementation code generated. No documentation chapters authored — Volumes 15 and 16 above are scoped (purpose, position, chapter list, key interface) but not written, consistent with this being a plan for what to build, not the build itself.

Recommended next action, pending your approval: begin with the **High-priority row of Section 1** — Tool SDK threat model (RFC-0021), `04-Schemas/` population for Volumes 2/4/7, the interaction-matrix and task-lifecycle sequence diagrams (Section 5), and the secrets bridge decision (ADR-0012) — since all four sit directly in front of continuing the existing `02-core-runtime.md` → `03-agent-platform.md`/`04-provider-platform.md` → `07-tool-sdk.md` codegen sequence.
