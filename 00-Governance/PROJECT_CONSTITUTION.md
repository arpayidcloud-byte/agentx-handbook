# Project Constitution

**Status:** Ratified (Approved, 2026-07-12)
**Applies to:** All Volumes, RFCs, ADRs, and generated code in this repository
**Amendment process:** Any change to a principle below requires an RFC in `02-RFC/`, review by the Chief Architect role, and an ADR recording the decision.

## Purpose

This document is the supreme governing artifact of the project. Every Volume, RFC, ADR,
and eventually every line of generated code must be traceable back to one or more of the
principles below. If a proposal conflicts with a principle, the proposal must either be
rejected, amended, or the principle itself must be amended via RFC — silent violation is
not permitted.

---

## 1. Architecture First

**Statement:** No component is implemented before its architecture is specified in a Volume.

**Rationale:** The project is built with AI-assisted code generation (Google AI Studio /
Gemini as implementation team, Claude Code as Chief Architect). LLM-driven implementation
without a locked specification tends to drift, re-invent interfaces per session, and
produce inconsistent module boundaries. A written architecture is the contract that keeps
independently-generated code compatible across sessions and across tools.

**Enforcement:**
- Every Volume must reach `Status: Approved — Architecture` (see ADR-0009) before any RFC
  referencing it may leave Draft.
- Every RFC must reach `Status: Accepted` before any ADR implementing it may be written.
- Code generation prompts (see `06-Prompts/`) must cite the Volume/RFC/ADR they implement.

---

## 2. Specification First

**Statement:** A feature is not "started" until it has Objectives, Scope, Requirements, and
Acceptance Criteria written down.

**Rationale:** Distinguishes this from Architecture First: Architecture First governs
*system structure*; Specification First governs *individual feature intent*. This prevents
"vibe-coded" features whose success criteria only exist in the requester's head.

**Enforcement:** A feature request lacking Acceptance Criteria is returned to Draft, not
implemented.

---

## 3. Provider Agnostic

**Statement:** No core module may hard-depend on a specific LLM provider's SDK, API shape,
or proprietary tool-calling format.

**Rationale:** The platform orchestrates multiple providers (Claude, Gemini, GPT-family,
local models). A provider outage, pricing change, or capability shift must not require
rewriting the orchestrator. All provider access goes through the Provider Platform
(Volume 4) behind a normalized interface.

**Enforcement:**
- Core packages may depend on `@platform/provider-sdk` (internal abstraction) only.
- Any direct import of a vendor SDK outside `packages/providers/*` fails CI lint.

---

## 4. Plugin First

**Statement:** New capability is added via plugins wherever possible, not by modifying core.

**Rationale:** Keeps the "Small Stable Core" principle (Principle 10) enforceable. Agents,
tools, and integrations are the parts of the system that change fastest; the orchestration
kernel should change the least.

**Enforcement:** Core package `CODEOWNERS` requires architecture sign-off for any PR; plugin
packages do not.

---

## 5. Event Driven

**Statement:** Cross-module communication happens via typed events on a message bus
(BullMQ-backed in v0.1), not direct synchronous method calls across module boundaries.

**Rationale:** Multi-agent workflows are inherently asynchronous (an agent may take minutes,
require human approval, or retry). Synchronous coupling between Orchestrator, Agents, and
Tools would make timeouts, retries, and human-in-the-loop approval gates unmanageable.

**Enforcement:** Inter-module calls that are not through the Event Bus (Volume 2) or an
explicitly-documented synchronous exception in an ADR are flagged in architecture review.

---

## 6. Testable by Default

**Statement:** Every interface defined in a Volume ships with a contract test template in
`08-Examples/` before implementation begins.

**Rationale:** AI-generated implementations regress silently across regeneration cycles.
Contract tests are the guardrail that lets a Volume's interface be re-implemented by a
different tool (e.g., Google AI Studio in one session, hand-written code in another)
without breaking the rest of the system.

**Enforcement:** A Volume reaches `Approved — Architecture` on the strength of its
specification content alone. A Volume is not marked `Approved — Implementation-Gated`
until its Interfaces section has a corresponding contract-test template in `08-Examples/`
(see ADR-0009).

---

## 7. Security by Design

**Statement:** Authn/authz, tenant isolation, secrets handling, and audit logging are
specified in the same Volume as the feature they protect — never retrofitted.

**Rationale:** Direct lesson from prior project work (multi-tenancy audits done elsewhere):
isolation and RBAC gaps found *after* implementation are expensive and risky to fix.
Security must be a first-class section of every Volume's Requirements, not a separate
afterthought phase.

**Enforcement:** A Volume's Requirements section must include a "Security & Isolation"
subsection; its absence blocks approval.

---

## 8. Documentation Required

**Statement:** No RFC is Accepted and no ADR is Final without updating the Volume(s) it
affects in the same change set.

**Rationale:** Documentation that lags implementation becomes fiction. Since this project's
explicit workflow is documentation-before-code, letting docs drift defeats the entire
premise of the handbook.

**Enforcement:** PR template (see Recommended Additions below) requires a
"Volumes updated" checklist entry.

---

## 9. No Vendor Lock-in

**Statement:** Data formats, storage schemas, and orchestration state must be exportable to
open formats (JSON/YAML/SQL) without dependency on a single cloud vendor's proprietary
managed service as the *only* implementation path.

**Rationale:** Independent-developer context and cost sensitivity matter more here than at
a funded startup. A managed service can be *used*, but the system must degrade gracefully
to self-hosted Postgres/Redis equivalents.

**Enforcement:** Volume 11 (Cloud Platform) must document a self-hosted fallback for every
managed service it recommends.

---

## 10. Small Stable Core

**Statement:** The orchestration kernel (Volume 2: Core Runtime) targets near-zero breaking
changes after v0.1. Growth happens in Agent Platform, Plugin Platform, and Provider
Platform — not in the core.

**Rationale:** Mirrors the project's own scoped v0.1 target (3–4 agents, single-provider
default). A stable core is what allows the agent/plugin ecosystem to expand later without
forcing a rewrite of already-generated code.

**Enforcement:** Any RFC proposing a breaking change to Core Runtime's public interface
requires unanimous sign-off recorded in an ADR with a major version bump.

---

## Roles Referenced Throughout This Handbook

| Role | Held by (current) | Responsibility |
|---|---|---|
| Chief Architect | Claude (Claude Code / this handbook) | Owns Volumes, RFCs, ADRs, architecture review |
| Implementation Team | Google AI Studio (Gemini) | Generates code from approved specifications |
| Architecture Advisor | ChatGPT (optional, per README) | Secondary review / alternative perspective |
| Project Owner | Arpayid | Final approval authority on all specifications |

## Definition of "Approved"

A Volume, RFC, or ADR is **Approved** only when:
1. All template sections are filled with substantive content (no empty headings).
2. It does not conflict with any Constitution principle, or the conflict is resolved via
   an amendment RFC first.
3. The Project Owner has explicitly signed off in writing (chat, commit message, or PR
   approval).

Until then, its status is `Draft` and it must not be cited as authority by any other
document.

For Volumes specifically, this definition produces `Approved — Architecture` status.
Volumes gain the additional `Approved — Implementation-Gated` status only once the
contract-test criterion in ADR-0009 is also met.
