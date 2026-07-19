# RFC-0044: Distributed Cognition Domain

**Status:** Proposed
**Author:** Chief Architect
**Created:** 2026-07-19
**Depends on:** Volume 2 (Core Runtime), Volume 11 (Cloud Platform)

## Problem Statement

`packages/distributed/distributed-cognition` (55 source files) implements multi-node distributed execution without architectural specification. Violates Principle 1.

## Context

The distributed-cognition package (55 source files) provides infrastructure for running Agentx as a
distributed system — multiple nodes cooperating on large engineering goals. It was initially developed
to support the horizontal-scaling proof-of-concept in Q2 2026.

### Subsystem Details

- **Node discovery & health** (~10 files): Automatic discovery of Agentx nodes via mDNS on local
  networks and a configurable seed-list for cloud deployments. Health monitoring uses a gossip protocol
  with a 5-second heartbeat interval. Each node publishes its capabilities (supported agent types,
  available tool set) to a shared capability registry backed by the event bus.
- **Cluster coordination** (~15 files): Consensus via a simplified Raft implementation (leader election
  with log replication for scheduling decisions). Distributed scheduling assigns tasks to nodes based on
  affinity rules (data locality, GPU availability) and current load. Resource allocation tracks CPU,
  memory, and token-budget quotas per node.
- **Task distribution** (~12 files): Cross-node task dispatching with configurable strategies (round-robin,
  least-loaded, affinity-first). Failure recovery re-dispatches tasks to healthy nodes when a heartbeat
  is missed for 3 consecutive intervals. Supports idempotent task execution via deduplication keys.
- **Collaboration** (~10 files): Cross-node memory synchronization (eventual consistency with
  conflict-free replicated data types for counters and sets). Knowledge replication propagates learned
  patterns across nodes with configurable consistency levels.
- **Governance** (~8 files): Integrity validation via checksums on replicated state, version
  compatibility checks (nodes refuse to cluster with incompatible protocol versions), and audit trails
  for all cross-node operations persisted to the event bus.

### Key Dependencies
- Depends on `shared/core-runtime` for the event bus (used for gossip and task dispatch).
- Depends on `shared/shared` for common type definitions.
- Must NOT be imported by any Volume 1–10 package; it is purely infrastructure.

## Proposed Decision

Classify as part of Volume 11 (Cloud Platform). Distributed cognition is deployment infrastructure, not core runtime logic.

### Dependency Rules
- May depend on: `shared/core-runtime`, `shared/shared`, `runtime/*`
- Must NOT be depended on by: any Volume 1-10 package
- Only Volume 11+ packages may import distributed-cognition

## Implementation Notes

No code changes required. The following housekeeping steps are needed:

1. Add `volume: 11` to the `distributed-cognition` package.json metadata.
2. Update the package README to reference this RFC and the dependency rules.
3. Add the package to the Volume 11 section of the architecture-sdk package registry.
4. Ensure CI does not run distributed-cognition integration tests in the default single-node
   configuration — gate them behind a `DISTRIBUTED=true` environment flag.

## Testing Strategy

1. **Dependency isolation test**: Add an architecture-sdk contract test asserting no Volume 1–10
   package imports from `packages/distributed/distributed-cognition`.
2. **Cluster smoke test**: Run the existing distributed integration tests with a 3-node local
   cluster (Docker Compose) to verify consensus and task distribution still work.
3. **Version compatibility test**: Verify that nodes with different protocol versions refuse to
   cluster (existing governance test in `packages/distributed/distributed-cognition/src/__tests__/governance/`).

## Alternatives Considered

## Alternative 1: New standalone Volume (Volume 17)
Create a standalone "Volume 17: Distributed Systems" to govern the package.
**Trade-offs**: Full governance independence and clear ownership, but distributed execution is a
deployment concern, not a product module. It would create a Volume with no external API surface.
**Decision**: Rejected — distributed cognition is infrastructure best governed by the Cloud Platform volume.

## Alternative 2: Remove the package
Remove the 55 source files and re-implement under Volume governance.
**Trade-offs**: Clean process compliance but destroys substantial distributed systems logic
(Raft consensus, CRDT-based sync, gossip protocol) and blocks the horizontal scaling roadmap.
**Decision**: Rejected — the package has real value and is referenced by the scaling roadmap.

## Consequences

- **Positive**: Clarifies that distributed features are opt-in infrastructure
- **Positive**: Prevents core packages from accidentally depending on distributed features
- **Positive**: Enables Volume 11 to define deployment topology rules that reference distributed-cognition
- **Negative**: None significant
