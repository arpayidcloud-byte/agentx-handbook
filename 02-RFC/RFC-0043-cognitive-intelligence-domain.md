# RFC-0043: Cognitive Intelligence Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime), Volume 3 (Agent Platform)

## Problem Statement

The Agentx monorepo contains a `packages/cognitive/` domain with 4 packages (cognitive-contracts, cognitive-kernel, cognitive-learning, autonomous-cognition) totaling ~106 source files. These packages were implemented without a preceding Volume, RFC, or ADR, violating Principle 1 (Architecture First).

## Context

The cognitive domain provides AI-native intelligence capabilities beyond simple orchestration.
These packages were committed to the monorepo as part of the initial intelligence prototype sprint
(Q2 2026) and have since accumulated significant logic, test coverage, and internal dependencies.

### Package Details

- **cognitive-contracts** (~12 source files): Core interfaces and contracts for cognitive engines,
  including `ICognitiveEngine`, `GoalQuery`, `SessionMetadata`, `CognitiveBudget`, and `LearningSnapshot`.
  All other cognitive packages import from this package; it has zero runtime dependencies beyond
  `shared/shared` type definitions.
- **cognitive-kernel** (~38 source files): Master Cognitive Intelligence Kernel (CIK) — orchestrates
  reasoning, learning, and goal execution with lifecycle management (`INIT → RUNNING → CHECKPOINT → COMPLETED`),
  session checkpointing (persisted via `shared/core-runtime` event bus), and budget tracking (token and
  wall-time limits). Depends on `cognitive-contracts` for all type definitions.
- **cognitive-learning** (~28 source files): Adaptive learning engine that tracks session outcomes,
  adjusts strategies via a multi-armed bandit approach, and maintains learning state across sessions
  using a file-backed store (JSON on local disk, extensible to PostgreSQL). Consumes checkpoint data
  emitted by `cognitive-kernel`.
- **autonomous-cognition** (~28 source files): Autonomous goal execution — self-directed planning,
  resource allocation, and execution without human-in-the-loop for each step. Uses the planning-engine
  output (interfaces only) and feeds results back to `cognitive-learning` for strategy adjustment.

### Key Dependencies
- All four packages depend on `shared/core-runtime` for the event bus and task scheduler.
- `cognitive-kernel` depends on `shared/secrets` for encrypted session state at rest.
- `autonomous-cognition` reads planning-engine output types but must not import the package directly.

## Proposed Decision

Formalize the cognitive domain as a sub-system of Volume 2 (Core Runtime). These packages implement the "thinking" layer that sits above the orchestration kernel:

```
Volume 2 (Core Runtime)
  └── Cognitive Intelligence (this RFC)
        ├── Contracts (interfaces)
        ├── Kernel (orchestration of cognition)
        ├── Learning (adaptive improvement)
        └── Autonomous (self-directed execution)
```

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `shared/secrets`
- Must NOT depend on: `agent-platform`, `workflow-engine`, or any higher-level package
- Lower-numbered Volumes must never depend on cognitive packages

## Implementation Notes

The formalization requires no code changes. The following documentation and configuration updates are needed:

1. Add a `volume: 2` field to each package's `package.json` metadata section to make the Volume
   assignment machine-readable for the architecture-sdk dependency checker.
2. Update the `packages/cognitive/README.md` to reference this RFC and the dependency rules above.
3. Add an entry to the package registry (maintained by `architecture-sdk`) mapping each cognitive
   package to its assigned Volume.
4. No changes to `tsconfig.json` paths or build pipeline — the existing monorepo structure already
   enforces the dependency graph via TypeScript project references.

## Testing Strategy

Verification that this RFC's decisions are upheld:

1. **Architecture SDK contract test**: Add a test case to `packages/quality/architecture-sdk` that
   asserts cognitive packages only import from `shared/core-runtime`, `shared/shared`, and
   `shared/secrets`. This test runs in CI on every PR.
2. **Dependency direction test**: Verify that no Volume 1–10 package (outside the cognitive domain)
   imports from `packages/cognitive/*`. The architecture-sdk compatibility matrix already checks this.
3. **Integration smoke test**: Run the existing cognitive-kernel integration tests
   (`packages/cognitive/cognitive-kernel/src/__tests__/integration/`) to confirm no regressions.

## Alternatives Considered

## Alternative 1: Remove the packages
Remove all four packages from the monorepo and re-implement under a Volume-governed process.
**Trade-offs**: Clean governance but destroys 106 source files of tested logic, blocks dependent
features, and delays the roadmap by an estimated 4–6 weeks.
**Decision**: Rejected — the packages represent a coherent capability domain with substantial value.

## Alternative 2: Create a new Volume (Volume 17)
Create a standalone "Volume 17: Cognitive Intelligence" with its own objectives, scope, and interfaces.
**Trade-offs**: Full governance compliance and clear ownership, but cognitive intelligence is an
internal runtime capability, not a user-facing platform module. A standalone Volume would imply
external consumers and a separate release cadence.
**Decision**: Rejected — it fits naturally under Volume 2 as an internal sub-system.

## Consequences

- **Positive**: Brings the repo into compliance with Principle 1
- **Positive**: Establishes clear dependency boundaries for cognitive packages
- **Positive**: Enables the architecture-sdk to automatically enforce the dependency rules in CI
- **Negative**: Adds documentation overhead for an internal subsystem
- **Neutral**: No breaking changes to existing code
