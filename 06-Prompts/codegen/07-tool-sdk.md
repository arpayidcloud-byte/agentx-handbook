# Codegen Prompt — Volume 7: Tool SDK

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-07.md`
**Implements:** RFC-0006, ADR-0004, ADR-0005
**Package target:** `packages/shared/tool-sdk/`
**Depends on:** `packages/shared/core-runtime` (for `Scheduler.pause/resume`), `packages/agent/agent-platform` (for `AgentRole` type only)

---

## Your role for this session

This package IS the security enforcement layer for agent actions. Treat every constraint
below as a hard requirement, not a suggestion — this directly implements Constitution
Principle 7 and closes a failure mode from prior project experience (relying on prompt
wording alone to keep an agent in scope).

## Non-negotiable constraints

1. **Fail-closed permission checks (ADR-0004):** every `Tool.execute()` call MUST pass
   through `PermissionChecker.isAllowed(agentRole, category)` first. A denied check throws
   before any I/O — no partial execution, no silent no-op.
2. **Conservative destructive classification (ADR-0005):** in this v0.1 implementation,
   classify **all** `fs.write` calls as destructive (approval-gated) regardless of
   new-file-vs-overwrite. Do not attempt to implement precise new-vs-overwrite detection
   in this session — that is an explicitly deferred future relaxation.
3. **Sandboxing (Volume 7, Ch. 5):** all `fs.*` tools MUST resolve paths using real path
   resolution (`fs.realpath` or equivalent) relative to `ToolCallContext.workingDirectory`
   and reject any path that escapes it, including via symlinks — string-prefix matching
   alone is NOT sufficient and will fail review.
4. **Shell allowlist:** `shell.build` only executes commands matching a configured
   allowlist; anything else must be treated as `shell.exec` (always destructive).
5. **No generic `http.request` tool** in this session (Volume 7, Ch. 5 — explicitly
   deferred).
6. Destructive calls MUST call `Scheduler.pause(taskId)` and there must be a real
   integration point for `task.approval_required` / `task.approval_resolved` — do not
   stub this as a TODO.

## What to generate

1. `src/tool.ts` — `Tool`, `ToolResult`, `ToolCallContext` interfaces (Ch. 1).
2. `src/registry.ts` — `ToolRegistry`, `ToolCategory` (Ch. 2).
3. `src/permission-checker.ts` — `PermissionChecker` implementation, fail-closed by
   default (Ch. 3).
4. `src/classification.ts` — destructive-action classification logic (Ch. 4),
   conservative default per ADR-0005.
5. `src/sandbox.ts` — filesystem jail with real path resolution + symlink escape
   detection (Ch. 5).
6. `src/tools/fs-read.ts`, `fs-write.ts`, `shell-build.ts`, `shell-exec.ts`,
   `git-read.ts`, `git-write.ts` — one file per built-in tool.
7. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-07-tool-sdk/contract.test.ts` covering, at minimum:
- FR-1: denied category throws before any execution occurs (assert no I/O side effect)
- FR-2: a destructive call pauses the task and does not execute until approval resolves
- FR-3: a sandbox violation (`../../etc/passwd`, or a symlink pointing outside
  `workingDirectory`) throws before any file I/O
- NFR-1: an ambiguous/edge-case classification defaults to destructive, never to safe

## Explicitly out of scope

Do not implement a generic HTTP tool. Do not build precise new-vs-overwrite detection for
`fs.write`. Do not build the CLI-side approval UI (that's Volume 9).

## Definition of done

- [ ] All 6 built-in tools implemented and registered
- [ ] Symlink/traversal sandbox escape is actually tested and blocked, not just documented
- [ ] Destructive gating integrates with real `Scheduler.pause/resume` from core-runtime
- [ ] Contract tests pass
