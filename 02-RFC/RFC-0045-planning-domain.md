# RFC-0045: Planning & Goal Intelligence Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime), Volume 3 (Agent Platform)

## Problem Statement

`packages/planning/` contains 2 packages (planning-engine, goal-intelligence) with ~35+ source files that decompose high-level goals into executable plans. No architectural specification exists. Violates Principle 1.

## Context

- **planning-engine**: Takes a goal + context, produces an ExecutionPlan with ordered tasks, dependencies, cost estimates, risk scores. Core planning loop: analyze → decompose → estimate → validate.
- **goal-intelligence**: Manages goal lifecycle (QUEUED → PLANNING → EXECUTING → COMPLETED/FAILED), tracks goal state transitions, provides goal querying and metrics.

These packages implement the "what to do" layer — before the workflow engine decides "how to do it."

## Proposed Decision

Classify as a sub-system of Volume 3 (Agent Platform). Planning is the bridge between a human goal and the workflow engine's task graph.

```
Human Goal → goal-intelligence (lifecycle) → planning-engine (decomposition) → workflow-engine (execution)
```

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`
- Must NOT depend on: `workflow-engine`, `agent-platform`, or higher packages
- The workflow-engine may depend on planning-engine output (interfaces only)

## Alternatives Considered

### Alternative 1: Merge into workflow-engine
Reject — planning (what) and workflow (how) are distinct concerns. Separation allows different planning strategies.

### Alternative 2: Remove
Reject — core to the product's value proposition (goal → plan → execute).

## Consequences

- **Positive**: Defines the goal → plan → workflow pipeline clearly
- **Positive**: Prevents circular dependencies between planning and workflow
- **Neutral**: No code changes required
