# Codegen Prompt — Volume 2: Core Runtime

**Use in:** Google AI Studio (Implementation Team role, per Constitution role table)
**Paste alongside this prompt:** the full text of `01-Volumes/Volume-02.md`
**Implements:** RFC-0001 (n/a here), RFC-0002, RFC-0003, ADR-0001
**Package target:** `packages/shared/core-runtime/`
**Depends on:** nothing (lowest-level implementation package — no other `packages/*` import allowed)

---

## Your role for this session

You are the Implementation Team. Claude (Chief Architect) has produced and the Project
Owner has Approved the attached Volume 2 specification. Your job is to generate
production-quality TypeScript implementing it **exactly as specified** — do not invent
new architecture, do not add features not in the spec, do not skip the Security &
Isolation requirements.

## Non-negotiable constraints (from the Constitution, quoted for this session)

1. **Provider Agnostic (Principle 3):** this package must import zero vendor SDKs.
2. **Event Driven (Principle 5):** every Task state transition publishes an event — no
   silent transitions.
3. **Small Stable Core (Principle 10):** this package imports nothing from
   `packages/agent/agent-platform`, `packages/provider/provider-sdk`, or any other higher-numbered
   Volume's package. Where Volume 2 needs behavior from those Volumes (decomposition,
   persistence), implement it as an interface *in this package* that those packages will
   implement later — never as a direct import.

## What to generate

1. `src/task.ts` — the `Task` type and the state machine (Volume 2, Ch. 1) as a pure,
   testable function set (e.g. `canTransition(from, to): boolean`, `transition(task,
   newState): Task`), throwing on invalid transitions.
2. `src/event-bus.ts` — `EventBus` interface (Volume 2, Ch. 7) plus a BullMQ/Redis-backed
   implementation satisfying at-least-once delivery (ADR-0001). Every published event must
   carry `id`, `traceId`, `occurredAt`.
3. `src/scheduler.ts` — `Scheduler` interface plus implementation: `enqueue`, `pause`,
   `resume` (Volume 2, Ch. 5 / FR-3), respecting `maxParallelAgents` config default of 2
   and single active task graph default (Volume 2, Ch. 3).
4. `src/decomposer.ts` — the `Decomposer` interface only (no implementation — Volume 3
   implements this).
5. `src/persistence.ts` — the `Persistence` interface only (no implementation — Volume 6
   implements this).
6. `src/index.ts` — package entrypoint exporting all of the above.

## Tests you must also generate

Fill in the contract test template at `08-Examples/volume-02-core-runtime/contract.test.ts`
(attach that file too) with a real, running implementation of every `it(...)` stub in it.
Add additional tests as needed to cover:
- FR-1 (exactly one valid current state at all times, concurrent-write safety)
- FR-2 (every transition publishes an event)
- FR-3 (pause/resume primitive)
- NFR-1 (deterministic scheduling order for independent tasks)
- ADR-0001 (duplicate event.id delivered twice → side effect happens once)

## Explicitly out of scope for this session

Do not implement Agent Platform, Provider Platform, or Memory Engine even partially — if
you find yourself writing decomposition logic or a database query, stop; that belongs to
a later session (Volume 3 / Volume 6 prompts in this same `codegen/` folder).

## Definition of done for this session

- [ ] All files above exist under `packages/shared/core-runtime/src/`
- [ ] Contract test file passes
- [ ] No import from any other `packages/*` folder
- [ ] No vendor LLM SDK import anywhere in this package
