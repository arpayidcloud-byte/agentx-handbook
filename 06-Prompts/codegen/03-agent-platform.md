# Codegen Prompt — Volume 3: Agent Platform

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-03.md`, plus the already-generated
`packages/shared/core-runtime` (for its `Decomposer`, `Task`, `AgentRole`-adjacent types)
**Implements:** RFC-0004, RFC-0005, ADR-0002
**Package target:** `packages/agent/agent-platform/`
**Depends on:** `packages/shared/core-runtime` only (implements its `Decomposer` interface)

---

## Your role for this session

Implement Volume 3 exactly as specified. This package implements Core Runtime's
`Decomposer` interface and defines the 4 fixed v0.1 agents. Do not add a 5th agent role —
per ADR-0002, that requires a new RFC, not a codegen decision.

## Non-negotiable constraints

1. Exactly 4 `AgentRole` values: `"coding" | "review" | "test" | "security"` (ADR-0002).
   Do not add more even if it seems convenient.
2. Review Agent and Security Agent must not have any write-capable tool category in their
   `allowedToolCategories` (Volume 3, FR-3) — enforce this in the registry, not just by
   documentation comment.
3. `LlmDecomposer` output MUST be schema-validated before returning to Core Runtime
   (RFC-0004); invalid output throws a retryable error, never passes through silently.
4. Agents are stateless — no module-level or instance-level mutable state persists
   between `run()` calls (Volume 3, NFR-2). All state comes from the `TaskContext`
   parameter.
5. This package imports `packages/shared/core-runtime` only. It does NOT import
   `packages/provider/provider-sdk` or `packages/shared/tool-sdk` directly — those are consumed via
   interfaces passed in at construction time (dependency injection), since Provider
   Platform and Tool SDK are implemented in separate later sessions.

## What to generate

1. `src/agent-registry.ts` — `AgentDefinition`, `AgentRegistry` (Volume 3, Ch. 3), with
   the 4 v0.1 agents' static config (tool categories per Ch. 2 table).
2. `src/decomposer.ts` — `LlmDecomposer implements Decomposer` (Volume 3, Ch. 4), taking
   a `Provider`-shaped dependency injected via constructor (interface only — do not
   import a concrete Provider Platform implementation).
3. `src/prompt-builder.ts` — the 3-layer prompt construction (Volume 3, Ch. 5): role
   prompt + Constitution excerpt + task context, in that fixed order, as one shared
   function all agents call (do not duplicate this logic per-agent).
4. `src/agents/{coding,review,test,security}.ts` — one file per agent implementing the
   `Agent` interface (Volume 3, Ch. 7), each declaring its role and delegating tool calls
   to an injected Tool SDK interface (not a concrete import).
5. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-03-agent-platform/contract.test.ts` covering:
- FR-1: an agent attempting a tool call outside its `allowedToolCategories` is rejected
  (mock the Tool SDK dependency to assert this)
- FR-2: `LlmDecomposer` rejects malformed JSON from the mocked provider
- FR-3: Review Agent and Security Agent's registry entries contain zero write categories

## Explicitly out of scope for this session

Do not implement Provider Platform or Tool SDK — inject mock/interface stand-ins and note
where the real implementation will be wired in (Volume 4 and Volume 7 sessions).

## Definition of done

- [ ] All 4 agents registered with correct tool restrictions
- [ ] Decomposer schema-validates and is unit-testable without a live LLM call
- [ ] Contract tests pass
- [ ] No direct import of provider-sdk or tool-sdk concrete implementations
