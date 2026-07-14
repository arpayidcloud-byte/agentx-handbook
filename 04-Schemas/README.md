# 04-Schemas

Machine-readable exports of the `interface`/`type` contracts defined across Volumes 2–14,
per Volume 1's Recommended Addition #5. Purpose: let the dependency table (Volume 1,
Ch. 3) and interface contracts (Constitution Principle 6) eventually be validated by
tooling instead of only by human review.

**Status:** Populated (v1.0) for Volume 2 (Core Runtime), Volume 4 (Provider Platform),
and Volume 7 (Tool SDK). Remaining Volumes (3, 5, 6, 8–16) are not yet populated and
follow the same convention below as their interfaces stabilize toward implementation.

## Convention (once populated)

One file per Volume, named `volume-NN.schema.json`, containing a JSON Schema or Zod-derived
export for every `interface`/`type` block in that Volume's Section 7 (Interfaces). Example
target for Volume 2:

```
04-Schemas/
  volume-02.schema.json   # Task, EventEnvelope, Scheduler, EventBus
  volume-03.schema.json   # AgentDefinition, AgentResult, Agent
  ...
```

Generation approach (proposed, not yet implemented): derive schemas directly from the
TypeScript source once packages exist, rather than hand-maintaining a second copy that can
drift from the real interfaces — hand-written schemas here would violate the same
"documentation lags implementation" risk flagged in Volume 1's Risks section.
