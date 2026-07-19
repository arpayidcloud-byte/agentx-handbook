# RFC-0048: Developer Platform Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 9 (CLI Platform), Volume 10 (Enterprise Platform)

## Problem Statement

`packages/platform/developer-platform` (18 source files, 77 tests) implements SDK management, developer portal, API explorer, marketplace, and release management. Not mapped to any Volume. Violates Principle 1.

## Context

This is the "developer experience" layer — everything external developers need to build on Agentx.
The package was developed as the backend for the developer portal prototype (Q2 2026) and provides
both API endpoints and a CLI engine used by the Volume 9 CLI.

### Subsystem Details

- **SDK management** (~3 files): Register, version, and deprecate SDKs across languages (TypeScript,
  Python, Go). Each SDK version tracks compatibility ranges (min/max Agentx server version). Deprecation
  triggers notifications to registered developer projects.
- **API specification** (~2 files): Create API specs from annotated route handlers, generate OpenAPI 3.1
  documents, and generate client code stubs in TypeScript and Python. Uses a codegen pipeline
  (spec → OpenAPI → client templates).
- **CLI engine** (~2 files): Registration and execution of CLI commands with argument parsing, help
  generation, and plugin-extensible command registry. The Volume 9 CLI delegates command dispatch
  to this engine.
- **Developer projects** (~2 files): Manage developer projects and associated accounts. Each project
  has an owner, API keys (with rotation support), and usage quotas.
- **Package registry** (~3 files): Publish and version packages across 5 types (SDK, Plugin, Extension,
  Agent, Workflow). Semantic versioning enforced. Supports pre-release tags and deprecation markers.
- **Artifact registry** (~2 files): Upload and manage build artifacts (binaries, bundles) with checksum
  verification and configurable retention policies.
- **Release management** (~1 file): Publish and archive releases. A release bundles package versions
  with release notes and a changelog.
- **Documentation engine** (~1 file): Create and organize documentation pages with versioned content
  and search indexing.
- **Example repository** (~1 file): Manage code examples by language, linked to documentation pages.

### Key Dependencies
- Depends on `shared/core-runtime` for event bus and task scheduler.
- Depends on `shared/secrets` for API key encryption at rest.
- Must NOT depend on `agent-platform`, `workflow-engine`, or `runtime/*` — it is an external-facing
  surface, not an internal runtime consumer.

## Proposed Decision

Classify as part of Volume 9 (CLI Platform) with overlap into Volume 10 (Enterprise Platform). The developer platform is the external-facing surface of the CLI and enterprise offerings.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `shared/secrets`
- Must NOT depend on: `agent-platform`, `workflow-engine`, `runtime/*`, or higher packages
- Volume 9 and 10 packages may depend on developer-platform

## Implementation Notes

No code changes required. The following steps are needed:

1. Add `volume: 9` to `developer-platform` package.json metadata (primary assignment).
2. Update the package README to reference this RFC and the dependency rules.
3. Add the package to the Volume 9 section of the architecture-sdk package registry.
4. Document the cross-cutting nature in Volume 10's scope section (developer-platform serves
   enterprise users but is governed by Volume 9).

## Testing Strategy

1. **Dependency isolation test**: Assert via architecture-sdk that `developer-platform` does not
   import from `agent-platform`, `workflow-engine`, or `runtime/*`.
2. **SDK lifecycle test**: Verify SDK registration, versioning, and deprecation flows via existing
   integration tests (`packages/platform/developer-platform/src/__tests__/sdk/`).
3. **CLI engine test**: Verify command registration and dispatch via the 77 existing unit tests
   to confirm no regressions after metadata changes.

## Alternatives Considered

## Alternative 1: Assign solely to Volume 10 (Enterprise Platform)
Govern developer-platform entirely under Volume 10.
**Trade-offs**: Enterprise users are a major consumer, but CLI users (Volume 9) also depend on
the developer-platform's SDK management and CLI engine. Assigning solely to Vol 10 would require
Vol 9 to reach "up" to Vol 10 for CLI command infrastructure, violating the layering principle.
**Decision**: Partial — primary assignment to Vol 9, with documented overlap to Vol 10.

## Alternative 2: Remove the package
Delete the package and re-implement under Volume governance.
**Trade-offs**: Clean process compliance but destroys 18 source files with 77 passing tests —
active, tested code that is the backend for the developer portal prototype.
**Decision**: Rejected — the package has proven value and active test coverage.

## Consequences

- **Positive**: Maps developer platform to existing Volumes
- **Positive**: Prevents developer-platform from depending on internal runtime packages
- **Positive**: Enables Volume 9 to define CLI-related contract tests that developer-platform must satisfy
- **Neutral**: No code changes required
