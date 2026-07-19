# RFC-0047: Quality Gates Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 14 (Testing & QA Strategy)

## Problem Statement

`packages/quality/` contains 2 packages (architecture-sdk, production-quality) with ~44 source files implementing quality validation and gates. Maps to Volume 14 but was implemented without explicit RFC. Violates Principle 1.

## Context

These packages implement the quality infrastructure referenced in Volume 14 (Testing & QA Strategy).
They were built during the CI-hardening sprint (Q2 2026) and are invoked by the CI pipeline on every
pull request. Without formal RFC documentation, their boundaries and dependency rules were unclear.

### Package Details

- **architecture-sdk** (~20 source files): Architecture freeze validation toolkit:
  - Dependency map analysis — scans `package.json` imports and verifies they match the approved
    dependency graph from the handbook Volumes
  - Compatibility matrix — checks that no package imports a higher-Volume package it shouldn't
  - Package registry — maintains a runtime catalog of all packages with their declared Volume assignment
  - Version freeze enforcement — prevents dependency version bumps that cross major version boundaries
    without explicit approval
  - Developer validation — provides a pre-commit hook that runs the same checks locally
  Outputs a structured report (JSON) with pass/fail per rule and actionable error messages.
- **production-quality** (~24 source files): Production readiness gates for CI:
  - Code coverage validation (configurable thresholds per package, default 80% line / 70% branch)
  - Mutation testing validation (Stryker integration, minimum mutation score 60%)
  - Branch protection rule enforcement (requires approvals, status checks)
  - Snapshot validation — detects unexpected changes to serialized data shapes
  - Race condition detection — runs concurrent test suites with TSAN-style instrumentation
  - Timeout validation — flags tests that exceed configurable time limits (default 30s unit, 120s integration)
  - Resource leak detection — monitors open handles (sockets, file descriptors) after test completion

### Key Dependencies
- Both packages depend on `shared/core-runtime` for event bus (report emission).
- `architecture-sdk` reads handbook metadata (Volume assignments) from `shared/shared` types.
- `production-quality` integrates with `runtime/runtime-adapters` for CI environment detection.

## Proposed Decision

Formally assign to Volume 14 (Testing & QA Strategy). These packages are the implementation of the quality strategy defined in that Volume.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `runtime/runtime-adapters`
- Must NOT depend on: `agent-platform`, `workflow-engine`, or higher packages
- CI pipeline may invoke quality packages directly

## Implementation Notes

No code changes required. The following steps are needed:

1. Add `volume: 14` to both `architecture-sdk` and `production-quality` package.json metadata.
2. Update each package's README to reference this RFC and the dependency rules.
3. Add the packages to the Volume 14 section of the architecture-sdk package registry (self-referencing
   is acceptable here — the registry is the source of truth for Volume assignments).
4. Ensure the CI pipeline configuration references these packages explicitly in the quality-gate
   stage, not just implicitly via `npm test`.

## Testing Strategy

1. **Self-validation test**: Run `architecture-sdk` against the handbook's own dependency rules to
   verify it correctly identifies all Volume assignments and flags violations.
2. **Gate threshold test**: Verify that `production-quality` correctly passes/fails based on
   configurable coverage and mutation score thresholds (existing tests in
   `packages/quality/production-quality/src/__tests__/gates/`).
3. **CI integration test**: Run a full CI pipeline with known-good and known-bad code to verify
   the quality gates block appropriately.

## Alternatives Considered

## Alternative 1: Create a new standalone Volume (Volume 17)
Create a "Volume 17: Quality Engineering" to govern these packages independently.
**Trade-offs**: Dedicated governance and clear ownership, but Volume 14 (Testing & QA Strategy)
already defines the quality strategy these packages implement. A separate Volume would create
redundancy and potential conflicts between the strategy (Vol 14) and implementation (Vol 17).
**Decision**: Rejected — Volume 14 is the natural home.

## Alternative 2: Remove the packages
Delete both packages and re-implement under Volume 14 governance.
**Trade-offs**: Clean process compliance but destroys 44 source files of concrete validation logic
that directly supports CI quality gates and is actively used by every PR.
**Decision**: Rejected — these packages are operational infrastructure, not speculative code.

## Consequences

- **Positive**: Links implementation to Volume 14 explicitly
- **Positive**: Clarifies that quality checks are infrastructure, not product features
- **Positive**: Enables Volume 14 to reference these packages as the canonical quality implementation
- **Neutral**: No code changes required
