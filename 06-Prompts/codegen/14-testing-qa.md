# Codegen Prompt — Volume 14: Testing & QA Strategy

**Trigger condition:** Start the lint/dependency-boundary tooling (Ch. 3) as early as the
Volume 2 (Core Runtime) session — it has nothing to check yet, but the earlier the CI
scaffolding exists, the earlier violations get caught. The golden-set evaluation tooling
(Ch. 2) is only meaningful once Volume 3 (Agent Platform) exists.

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-14.md`
**Implements:** RFC-0018, RFC-0019, ADR-0009
**Package target:** `tooling/` (CI config, lint rules), `packages/eval/` (golden-set runner)
**Depends on:** conceptually all packages (this is the CI/QA layer, not a runtime dependency)

---

## Non-negotiable constraints

1. **Dependency-direction lint (FR-2):** a CI rule that fails the build if any
   `packages/*` imports a higher-numbered Volume's package, per Volume 1, Ch. 3's table —
   this must be an actual enforced lint rule, not a documented convention people are
   trusted to follow.
2. **Vendor-import lint (Constitution Principle 3):** a CI rule that fails the build if
   any file outside `packages/provider-sdk/providers/*` imports a vendor LLM SDK.
3. **Contract-test-presence check (ADR-0009):** CI (or a pre-merge script) verifies a
   `08-Examples/<volume-slug>/contract.test.ts` file exists for every Volume that defines
   an interface — this is the automatable form of "no Volume Approved without a contract
   test template."
4. **Golden-set runner (Ch. 2) is manually triggered, not run on every commit** (NFR-1) —
   do not wire it into the default CI pipeline; provide an explicit
   `pnpm run eval:golden-set` command instead.
5. **Deployment portability check (Ch. 4):** a scheduled (not per-commit) CI job that runs
   `docker-compose up` against the self-hosted stack and asserts it becomes healthy —
   only meaningful once Volume 11 exists, but the CI job definition can be scaffolded now.

## What to generate

1. `tooling/eslint-rules/no-cross-volume-import.js` — custom lint rule for constraint #1.
2. `tooling/eslint-rules/no-vendor-sdk-outside-providers.js` — custom lint rule for #2.
3. `tooling/scripts/check-contract-tests.ts` — script for constraint #3, runnable in CI.
4. `packages/eval/src/golden-set-runner.ts` — `GoldenSetCase`/`GoldenSetResult` types
   (Volume 14, Ch. 7) plus a runner that executes each case against a live agent and
   scores it against its rubric (Ch. 2) — rubric-based pass/fail, not exact string match.
5. `.github/workflows/ci.yml` (or equivalent) wiring lint + contract tests + the
   contract-test-presence check into required-on-merge checks, and the deployment
   portability check into a weekly scheduled job (Ch. 3 table).

## Tests you must also generate

For the lint rules themselves: fixture files that should fail each rule, plus fixture
files that should pass, asserting the rule catches exactly the violation it's meant to.

## Explicitly out of scope

Do not make golden-set evaluation run on every commit. Do not implement the actual golden
set's goal content in this session beyond the one worked example already in Volume 14,
Ch. 8 — expanding the golden set is an ongoing content task, not a one-time codegen task.

## Definition of done

- [ ] Both lint rules catch their target violation on a fixture and pass on clean code
- [ ] Contract-test-presence check correctly flags a Volume missing its template
- [ ] Golden-set runner executes the Ch. 8 worked example end-to-end and produces a scored result
- [ ] CI pipeline wires everything with golden-set and portability checks correctly kept
      out of the per-commit required path
