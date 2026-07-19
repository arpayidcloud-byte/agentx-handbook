# RFC-0048: Developer Platform Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 9 (CLI Platform), Volume 10 (Enterprise Platform)

## Problem Statement

`packages/platform/developer-platform` (18 source files, 77 tests) implements SDK management, developer portal, API explorer, marketplace, and release management. Not mapped to any Volume. Violates Principle 1.

## Context

The developer-platform package provides:
- **SDK management**: Register, version, deprecate SDKs across languages (TypeScript, Python, Go)
- **API specification**: Create API specs, generate OpenAPI documents, generate client code
- **CLI engine**: Register and execute CLI commands
- **Developer projects**: Manage developer projects and accounts
- **Package registry**: Publish and version packages (SDK, Plugin, Extension, Agent, Workflow types)
- **Artifact registry**: Upload and manage build artifacts
- **Release management**: Publish and archive releases
- **Documentation engine**: Create and organize documentation pages
- **Example repository**: Manage code examples by language

This is the "developer experience" layer — everything external developers need to build on Agentx.

## Proposed Decision

Classify as part of Volume 9 (CLI Platform) with overlap into Volume 10 (Enterprise Platform). The developer platform is the external-facing surface of the CLI and enterprise offerings.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `shared/secrets`
- Must NOT depend on: `agent-platform`, `workflow-engine`, `runtime/*`, or higher packages
- Volume 9 and 10 packages may depend on developer-platform

## Alternatives Considered

### Alternative 1: Part of Volume 10 (Enterprise)
Partial — developer platform serves both CLI users (Vol 9) and enterprise users (Vol 10).

### Alternative 2: Remove
Reject — 18 source files with 77 passing tests. Active, tested code.

## Consequences

- **Positive**: Maps developer platform to existing Volumes
- **Positive**: Prevents developer-platform from depending on internal runtime packages
- **Neutral**: No code changes required
