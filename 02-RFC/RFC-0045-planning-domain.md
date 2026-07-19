# RFC-0045: Planning & Goal Intelligence Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime), Volume 3 (Agent Platform)

## Problem Statement

`packages/planning/` contains 2 packages (planning-engine, goal-intelligence) with ~35+ source files that decompose high-level goals into executable plans. No architectural specification exists. Violates Principle 1.

## Context

These packages implement the "what to do" layer — before the workflow engine decides "how to do it."
They were developed during the goal-pipeline prototype sprint (Q2 2026) and are referenced by both
the agent platform (Volume 3) and the workflow engine (Volume 5).

### Package Details

- **planning-engine** (~22 source files): Takes a goal + context, produces an `ExecutionPlan` with
  ordered tasks, dependency graph, cost estimates (token budget), and risk scores. The core planning
  loop is: `analyze → decompose → estimate → validate`. Supports multiple planning strategies
  (sequential, parallel-fan-out, hierarchical) selectable per goal type. Plan validation checks for
  circular dependencies, unreachable goals, and budget overflow.
- **goal-intelligence** (~13 source files): Manages goal lifecycle (`QUEUED → PLANNING → EXECUTING →
  COMPLETED/FAILED`). Tracks state transitions with timestamps and reason codes. Provides goal
  querying via a typed API (`GoalQuery`) and emits lifecycle events on the event bus for downstream
  consumers (CLI status display, audit log). Persists goal state to the memory engine (Volume 6).

### Integration Points
- The workflow-engine (Volume 5) consumes `ExecutionPlan` output but imports only the contract types.
- The agent platform (Volume 3) spawns goals via `goal-intelligence` when decomposing user requests.
- Both packages depend on `shared/core-runtime` for the event bus and task scheduler primitives.

## Proposed Decision

Classify as a sub-system of Volume 3 (Agent Platform). Planning is the bridge between a human goal and the workflow engine's task graph.

```
Human Goal → goal-intelligence (lifecycle) → planning-engine (decomposition) → workflow-engine (execution)
```

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`
- Must NOT depend on: `workflow-engine`, `agent-platform`, or higher packages
- The workflow-engine may depend on planning-engine output (interfaces only)

## Implementation Notes

No code changes required. The following documentation updates are needed:

1. Add `volume: 3` to both `planning-engine` and `goal-intelligence` package.json metadata.
2. Update each package's README to reference this RFC and the dependency rules.
3. Add the packages to the Volume 3 section of the architecture-sdk package registry.
4. Document the `ExecutionPlan` interface contract between planning-engine and workflow-engine
   in Volume 5's interfaces section (add a cross-reference to this RFC).

## Testing Strategy

1. **Dependency direction test**: Assert that `planning-engine` and `goal-intelligence` do not
   import from `workflow-engine` or `agent-platform` (architecture-sdk contract test).
2. **Pipeline integration test**: Run the existing planning-engine tests to verify the
   analyze → decompose → estimate → validate loop produces valid `ExecutionPlan` output.
3. **Lifecycle test**: Verify goal state transitions in `goal-intelligence` fire correct events
   on the event bus (existing test coverage in `goal-intelligence/src/__tests__/lifecycle/`).

## Alternatives Considered

## Alternative 1: Merge into workflow-engine
Combine planning-engine and goal-intelligence into the workflow-engine package.
**Trade-offs**: Simpler package graph and fewer dependencies, but planning (what) and workflow
(how) are distinct concerns. Merging would couple strategy selection to execution mechanics and
make it harder to swap planning strategies independently.
**Decision**: Rejected — separation of concerns is critical for extensibility.

## Alternative 2: Remove the packages
Delete both packages and re-implement under Volume governance.
**Trade-offs**: Clean process compliance, but these packages are core to the product's value
proposition (goal → plan → execute pipeline) and blocking multiple downstream Volumes.
**Decision**: Rejected — the 35+ source files represent essential product functionality.

## Consequences

- **Positive**: Defines the goal → plan → workflow pipeline clearly
- **Positive**: Prevents circular dependencies between planning and workflow
- **Positive**: Enables Volume 3 to specify planning contract tests that Volume 5 can rely on
- **Neutral**: No code changes required
