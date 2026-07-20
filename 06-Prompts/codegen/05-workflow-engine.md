# Codegen Prompt — Volume 5: Workflow Engine

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-05.md`
**Implements:** RFC-0007
**Package target:** `packages/workflow/workflow-engine/`
**Depends on:** `packages/shared/core-runtime`, `packages/agent/agent-platform`, `packages/shared/tool-sdk`

---

## Your role for this session

Implement task graph construction and the graph-level (policy) approval gate layer, which
is additive to — and must never bypass — Tool SDK's per-call gates (already implemented in
the previous session).

## Non-negotiable constraints

1. `buildGraph` MUST reject cyclic dependency graphs and dangling `dependsOn` references
   before any scheduling begins (FR-1).
2. Retry-with-feedback loops MUST be capped at a configurable value, default 2 (Ch. 3),
   and MUST escalate to the operator (not silently fail) when the cap is reached (FR-2).
3. `WorkflowPolicy` gates are evaluated independently of Tool SDK's destructive
   classification (FR-3) — a node can require policy approval even with zero destructive
   tool calls.
4. This package must not reimplement or duplicate Tool SDK's permission/sandbox logic —
   it only adds a coarser policy layer on top, per RFC-0007's stated separation of
   concerns.

## What to generate

1. `src/task-graph.ts` — `TaskGraph`, `buildGraph()` with cycle/dangling-reference
   validation (Ch. 1).
2. `src/policy.ts` — `WorkflowPolicy` interface plus the default v0.1 policy: gate before
   any `git.write`-categorized node (Ch. 2 example).
3. `src/router.ts` — conditional branching / retry-with-feedback routing (Ch. 3),
   including the retry-cap-then-escalate behavior.
4. `src/graph-executor.ts` — orchestrates handing eligible nodes to
   `core-runtime`'s Scheduler respecting `maxParallelAgents` (Ch. 4).
5. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-05-workflow-engine/contract.test.ts`:
- FR-1: a cyclic graph is rejected before any node is scheduled
- FR-2: retry loop hits the cap and escalates (does not loop forever, does not silently fail)
- FR-3: a policy gate fires on a non-destructive node when policy says so

## Explicitly out of scope

Do not implement Memory Engine (Volume 6) — `TaskContext` retrieval used by routing
decisions should be injected via the `Persistence` interface from core-runtime, not a
concrete database call.

## Definition of done

- [ ] Cycle/dangling-reference rejection works
- [ ] Retry cap + escalation implemented and tested
- [ ] Policy gate layer demonstrably independent of Tool SDK's own gating
