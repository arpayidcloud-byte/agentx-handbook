# RFC-0046: Symbolic Reasoning Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime)

## Problem Statement

`packages/reasoning/` contains 2 packages (reasoning-algorithms, reasoning-framework) with ~50 source files implementing symbolic reasoning (forward/backward chaining, decision trees, hypothesis engines). No architectural specification exists. Violates Principle 1.

## Context

This is the "thinking" toolkit — agents use reasoning to make decisions based on rules, facts, and
evidence. The packages were developed as part of the decision-engine prototype (Q2 2026) and are
used by the cognitive-kernel as well as directly by specialist agents (coding, security review).

### Package Details

- **reasoning-algorithms** (~30 source files): Concrete reasoning algorithms including:
  - Forward chaining (data-driven): starts from known facts, applies rules to derive new facts
  - Backward chaining (goal-driven): starts from a goal, works backward to find supporting facts
  - Decision tree traversal with configurable split criteria (information gain, Gini)
  - Hypothesis generation and testing with Bayesian confidence scoring
  - Conflict resolution strategies (recency, specificity, priority-based)
  - Explanation generation — produces a human-readable chain of reasoning steps with confidence values
  All algorithms are stateless and pure; they accept input facts/rules and return results.
- **reasoning-framework** (~20 source files): Orchestration layer that composes algorithms into
  pipelines. Pipeline stages: `input → preprocess → reason → validate → checkpoint → output`.
  Manages pipeline state (`IDLE → RUNNING → AWAITING_VALIDATION → COMPLETED`), maintains an audit
  trail of every reasoning step (persisted to the event bus), and supports strategy selection
  (which algorithm to use based on input characteristics). Depends on `reasoning-algorithms` for
  the concrete implementations.

### Key Dependencies
- Both packages depend on `shared/core-runtime` for the event bus (audit trail emission).
- `reasoning-framework` depends on `reasoning-algorithms` for concrete algorithm implementations.
- `cognitive-kernel` (RFC-0043) may invoke reasoning pipelines but does so via the framework's
  public API, not by importing algorithms directly.

## Proposed Decision

Classify as a sub-system of Volume 2 (Core Runtime). Reasoning is a core runtime capability available to all agents.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`
- Must NOT depend on: `agent-platform`, `workflow-engine`, `cognitive-*`, or higher packages
- cognitive-kernel may depend on reasoning (it orchestrates reasoning as a sub-system)

## Implementation Notes

No code changes required. The following housekeeping steps are needed:

1. Add `volume: 2` to both `reasoning-algorithms` and `reasoning-framework` package.json metadata.
2. Update each package's README to reference this RFC and the dependency rules.
3. Add the packages to the Volume 2 section of the architecture-sdk package registry.
4. Document the public reasoning pipeline API (`ReasoningPipeline` class) in Volume 2's interfaces
   section with a cross-reference to this RFC.

## Testing Strategy

1. **Algorithm correctness tests**: Run the existing reasoning-algorithms unit tests (forward
   chaining, backward chaining, decision trees, hypothesis testing) to verify no regressions.
2. **Pipeline integration test**: Verify that `reasoning-framework` pipelines correctly compose
   algorithms and emit audit trail events on the event bus.
3. **Dependency isolation test**: Assert via architecture-sdk that `reasoning-algorithms` does not
   depend on `cognitive-*` packages and `reasoning-framework` depends only on `reasoning-algorithms`
   plus `shared/*`.

## Alternatives Considered

## Alternative 1: Classify as part of the cognitive domain (RFC-0043)
Group reasoning packages under the cognitive intelligence sub-system.
**Trade-offs**: Tighter integration with the cognitive kernel, but reasoning is a general-purpose
toolkit usable by any agent — not just the cognitive intelligence system. Coupling them would
prevent lightweight reasoning use cases (e.g., a security-review agent using decision trees) from
avoiding the cognitive-kernel overhead.
**Decision**: Rejected — reasoning is a core capability, not a cognitive-specific feature.

## Alternative 2: Remove the packages
Delete both packages and re-implement under Volume governance.
**Trade-offs**: Clean process compliance but destroys 50 source files with distinct algorithmic
implementations that are a core product differentiator.
**Decision**: Rejected — the algorithms represent significant IP and are actively used.

## Consequences

- **Positive**: Establishes reasoning as a first-class core capability
- **Positive**: Clear boundary between reasoning (algorithms) and cognitive (orchestration of intelligence)
- **Positive**: Enables specialist agents to use reasoning directly without cognitive-kernel overhead
- **Neutral**: No code changes required
