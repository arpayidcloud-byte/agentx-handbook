# RFC-0046: Symbolic Reasoning Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime)

## Problem Statement

`packages/reasoning/` contains 2 packages (reasoning-algorithms, reasoning-framework) with ~50 source files implementing symbolic reasoning (forward/backward chaining, decision trees, hypothesis engines). No architectural specification exists. Violates Principle 1.

## Context

- **reasoning-algorithms**: Concrete reasoning algorithms — forward chaining (data-driven), backward chaining (goal-driven), decision tree traversal, hypothesis generation/testing, confidence calculation, conflict resolution, explanation generation
- **reasoning-framework**: Orchestration layer — reasoning pipeline with stages (input → preprocess → reason → validate → checkpoint → output), pipeline state management, audit trail, strategy selection

This is the "thinking" toolkit — agents use reasoning to make decisions based on rules, facts, and evidence.

## Proposed Decision

Classify as a sub-system of Volume 2 (Core Runtime). Reasoning is a core runtime capability available to all agents.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`
- Must NOT depend on: `agent-platform`, `workflow-engine`, `cognitive-*`, or higher packages
- cognitive-kernel may depend on reasoning (it orchestrates reasoning as a sub-system)

## Alternatives Considered

### Alternative 1: Part of cognitive domain
Reject — reasoning is a general-purpose toolkit, not specific to cognitive intelligence. Any agent can use reasoning algorithms directly.

### Alternative 2: Remove
Reject — 50 source files with distinct algorithmic implementations. Core differentiator.

## Consequences

- **Positive**: Establishes reasoning as a first-class core capability
- **Positive**: Clear boundary between reasoning (algorithms) and cognitive (orchestration of intelligence)
- **Neutral**: No code changes required
