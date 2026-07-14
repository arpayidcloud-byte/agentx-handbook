# Codegen Prompt — Volume 9: CLI Platform

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-09.md`
**Implements:** RFC-0010
**Package target:** `apps/cli/`
**Depends on:** all of `packages/core-runtime`, `agent-platform`, `provider-sdk`,
`workflow-engine`, `memory-engine`, `tool-sdk`, `plugin-sdk`

---

## Your role for this session

This is the **v0.1 deliverable** — the primary user-facing surface (Volume 1's exit
criterion #3). Every other package generated in prior sessions is wired together here.

## Non-negotiable constraints

1. FR-1: `agentx submit "<goal>"` must support the full lifecycle end-to-end
   (submit → plan → execute → approve if needed → result) with no other command required
   for a goal that needs no approval.
2. FR-2 / NFR-1: approval prompts MUST show the concrete action about to be taken (the
   actual shell command, the actual file diff) — never an abstract "approve this step?"
   — and MUST NOT have any default action; the operator must type `a` or `r` explicitly.
   **Do not implement any timeout-based auto-approve or auto-reject** (RFC-0010) — a
   paused graph stays paused until an explicit `agentx approve`/`reject`.
3. FR-3: `agentx cost` and `agentx audit` are strictly read-only against Memory Engine —
   no write path from these commands.
4. Never print raw credentials, even in verbose/debug output (Security & Isolation
   section) — add an explicit test for this, not just a code review comment.
5. Config is project-local (`agentx.config.yaml`, checked into the repo), not a global
   user config file (Ch. 5).

## What to generate

1. `src/commands/submit.ts`, `status.ts`, `watch.ts`, `approve.ts`, `reject.ts`,
   `cost.ts`, `audit.ts`, `plugin.ts`, `config.ts` — one file per command (Ch. 1 table).
2. `src/approval-ui.ts` — the interactive approval prompt (Ch. 2), rendering the concrete
   action and requiring explicit `a`/`r` input.
3. `src/config.ts` — loads/validates `agentx.config.yaml` (Ch. 5 schema).
4. `src/index.ts` — CLI entrypoint wiring commands to the underlying packages.
5. `agentx.config.yaml` — example default config file at the repo root.

## Tests you must also generate

Create `08-Examples/volume-09-cli-platform/contract.test.ts`:
- FR-1: end-to-end no-approval-needed flow completes via `submit` alone (integration test
  against the real wired-together packages, using the Anthropic or Google test fixtures
  from the Volume 4 session)
- FR-2: approval prompt renders the concrete action, and no code path resolves an
  approval without explicit input
- Security: scan all CLI output paths (including `--verbose`) for credential substrings —
  assert none appear

## Explicitly out of scope

Do not build a web/GUI surface — that is Volume 10's console app, out of scope for v0.1
entirely.

## Definition of done — this also completes the v0.1 milestone

- [ ] All 9 commands implemented and wired to real packages (no more interface-only stubs
      anywhere in the dependency chain from Volume 2 through Volume 9)
- [ ] End-to-end flow (submit → watch → completed) demonstrably works
- [ ] End-to-end approval-gated flow (submit → approve → completed) demonstrably works
- [ ] All prior sessions' contract tests still pass against the fully wired system

**Once this session's Definition of Done is met, cross-check against Volume 1, Ch. 6's
v0.1 exit criteria (all 4 bullet points) before declaring v0.1 complete.**
