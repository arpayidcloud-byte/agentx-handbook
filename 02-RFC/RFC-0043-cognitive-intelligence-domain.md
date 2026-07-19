# RFC-0043: Cognitive Intelligence Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime), Volume 3 (Agent Platform)

## Problem Statement

The Agentx monorepo contains a `packages/cognitive/` domain with 4 packages (cognitive-contracts, cognitive-kernel, cognitive-learning, autonomous-cognition) totaling ~106 source files. These packages were implemented without a preceding Volume, RFC, or ADR, violating Principle 1 (Architecture First).

## Context

The cognitive domain provides AI-native intelligence capabilities beyond simple orchestration:

- **cognitive-contracts**: Core interfaces and contracts for cognitive engines (ICognitiveEngine, GoalQuery, SessionMetadata)
- **cognitive-kernel**: Master Cognitive Intelligence Kernel (CIK) — orchestrates reasoning, learning, and goal execution with lifecycle management, session checkpointing, and budget tracking
- **cognitive-learning**: Adaptive learning engine that tracks session outcomes, adjusts strategies, and maintains learning state across sessions
- **autonomous-cognition**: Autonomous goal execution — self-directed planning, resource allocation, and execution without human-in-the-loop for each step

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

## Alternatives Considered

### Alternative 1: Remove the packages
Reject — the packages contain substantial logic (106 source files) and represent a coherent capability domain.

### Alternative 2: Create a new Volume (Volume 17)
Reject — cognitive intelligence is an internal capability of the runtime, not a standalone platform module. It fits under Volume 2.

## Consequences

- **Positive**: Brings the repo into compliance with Principle 1
- **Positive**: Establishes clear dependency boundaries for cognitive packages
- **Negative**: Adds documentation overhead for an internal subsystem
- **Neutral**: No breaking changes to existing code
