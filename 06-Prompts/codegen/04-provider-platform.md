# Codegen Prompt — Volume 4: Provider Platform

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-04.md`
**Implements:** RFC-0001, ADR-0003
**Package target:** `packages/provider/provider-sdk/`
**Depends on:** nothing (peer to core-runtime; imports no other internal package)

---

## Your role for this session

Implement the `Provider` interface and **two full vendor adapters** (Anthropic and
Google) exactly as specified in Volume 4. Per ADR-0003, a single adapter is explicitly
insufficient for this session to be considered done — it provides no proof the
abstraction actually holds.

## Non-negotiable constraints

1. Vendor SDK imports (`@anthropic-ai/sdk`, Google's SDK) are allowed **only** inside
   `packages/provider/provider-sdk/src/providers/anthropic/` and `.../src/providers/google/` respectively.
   Nowhere else in this package, and never in any other package.
2. Both adapters MUST implement the identical `Provider` interface (Volume 4, Ch. 1) and
   pass an identical contract test suite (Ch. 8 / ADR-0003).
3. Tool specs/calls crossing this package's boundary MUST be normalized
   (`NormalizedToolSpec`/`NormalizedToolCall`, Volume 4, Ch. 2) — never leak a
   vendor-specific tool-call shape to a caller.
4. Credentials are resolved only via `CredentialResolver` (Ch. 3), reading
   `PROVIDER_<ID>_API_KEY` env vars in v0.1. No other code path may read these env vars.
5. `usage.costUsd` is computed from a versioned pricing config file, not hardcoded
   per-call-site values (FR-3).

## What to generate

1. `src/provider.ts` — `Provider`, `CompletionRequest`, `CompletionResponse` interfaces.
2. `src/normalize.ts` — `NormalizedToolSpec`/`NormalizedToolCall` types and the
   translation helpers each adapter uses.
3. `src/credential-resolver.ts` — env-var-backed `CredentialResolver` implementation.
4. `src/pricing.ts` — versioned pricing table (config, not code constants) + cost
   calculation helper.
5. `src/providers/anthropic/index.ts` — full adapter.
6. `src/providers/google/index.ts` — full adapter.
7. `src/registry.ts` — resolves `DEFAULT_PROVIDER_ID` from config to the active adapter.
8. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-04-provider-platform/contract.test.ts`:
- A single parameterized test suite run against **both** adapters (Anthropic, Google)
  asserting they satisfy the `Provider` interface identically (ADR-0003) — use recorded
  fixtures/mocked HTTP responses, not live API calls, so tests are deterministic and
  cost-free to run repeatedly.
- Assert no credential string ever appears in a `CompletionResponse` or thrown error.
- Assert switching `DEFAULT_PROVIDER_ID` requires no code change outside this package
  (NFR-1) — can be demonstrated as a config-driven test, not a full external-package test.

## Explicitly out of scope

Do not implement Agent Platform or Tool SDK. Do not add a 3rd provider adapter in this
session — extend `NormalizedToolCall` only if the two required adapters reveal a genuine
gap (Volume 4 Risks section); otherwise keep scope to exactly two.

## Definition of done

- [ ] Both adapters pass the identical contract suite
- [ ] Vendor imports confined to their adapter subfolder
- [ ] No credential leakage in any output path
- [ ] Cost calculation driven by config, not hardcoded values
