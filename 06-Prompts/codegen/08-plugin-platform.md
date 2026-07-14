# Codegen Prompt — Volume 8: Plugin Platform

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-08.md`
**Implements:** RFC-0009
**Package target:** `packages/plugin-sdk/`
**Depends on:** `packages/agent-platform`, `packages/tool-sdk`, `packages/provider-sdk` (registers into their registries — does not modify their internals)

---

## Your role for this session

Implement the plugin manifest, loader, and lifecycle state machine. This package must
never grant a plugin more trust than a built-in component — every check from Tool SDK
(previous session) applies identically to plugin-provided tools/agents.

## Non-negotiable constraints

1. FR-2: an agent-kind plugin manifest declaring an `AgentRole` that collides with the
   fixed v0.1 roster (`coding`, `review`, `test`, `security`) MUST be rejected at
   manifest-validation time, before any plugin code loads.
2. FR-1: the loader MUST validate the manifest schema before importing the plugin's
   `entryPoint` — never import first and validate after.
3. A tool-kind plugin's declared categories go through the same permission-review flow
   (Ch. 4) as any new built-in tool would — do not create a separate, lighter-weight path.
4. Enabling a plugin never grants access beyond what its manifest declared and the
   operator approved (NFR-1) — no default-allow fallback.

## What to generate

1. `src/manifest.ts` — `PluginManifest` schema + validator (Ch. 1).
2. `src/loader.ts` — validates manifest, then dynamically imports `entryPoint` only after
   validation passes (Ch. 1/FR-1).
3. `src/lifecycle.ts` — the state machine (Ch. 3): Installed → PendingReview → Enabled/
   Rejected → Disabled → Uninstalled.
4. `src/permission-review.ts` — surfaces declared categories for operator approval before
   a tool/agent-kind plugin can move to `Enabled` (Ch. 4).
5. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-08-plugin-platform/contract.test.ts`:
- FR-2: agent plugin manifest declaring `"coding"` (colliding role) is rejected
- FR-1: malformed manifest never results in `entryPoint` being imported (assert import
  function is not called)
- Lifecycle: a plugin cannot reach `Enabled` without passing through `PendingReview`

## Explicitly out of scope

Do not build a plugin marketplace/registry UI or remote plugin execution — both are
explicitly deferred beyond this Volume's v0.1 scope.

## Definition of done

- [ ] Manifest validation precedes code import, always
- [ ] Role-collision rejection works for agent-kind plugins
- [ ] Lifecycle state machine matches Ch. 3 exactly
