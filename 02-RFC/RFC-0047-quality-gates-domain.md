# RFC-0047: Quality Gates Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 14 (Testing & QA Strategy)

## Problem Statement

`packages/quality/` contains 2 packages (architecture-sdk, production-quality) with ~44 source files implementing quality validation and gates. Maps to Volume 14 but was implemented without explicit RFC. Violates Principle 1.

## Context

- **architecture-sdk**: Architecture freeze validation — dependency map analysis, compatibility matrix, package registry, version freeze enforcement, developer validation. Ensures the architecture doesn't drift from the approved specification.
- **production-quality**: Production readiness gates — code coverage validation, mutation testing validation, branch protection rules, snapshot validation, race condition detection, timeout validation, resource leak detection. Ensures code meets quality bar before deployment.

These packages implement the quality infrastructure referenced in Volume 14 (Testing & QA Strategy).

## Proposed Decision

Formally assign to Volume 14 (Testing & QA Strategy). These packages are the implementation of the quality strategy defined in that Volume.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `runtime/runtime-adapters`
- Must NOT depend on: `agent-platform`, `workflow-engine`, or higher packages
- CI pipeline may invoke quality packages directly

## Alternatives Considered

### Alternative 1: New Volume (Volume 17)
Reject — Volume 14 already covers Testing & QA. These packages are its implementation.

### Alternative 2: Remove
Reject — 44 source files with concrete validation logic. Directly supports CI quality gates.

## Consequences

- **Positive**: Links implementation to Volume 14 explicitly
- **Positive**: Clarifies that quality checks are infrastructure, not product features
- **Neutral**: No code changes required
