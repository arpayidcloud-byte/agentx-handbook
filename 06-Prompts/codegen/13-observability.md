# Codegen Prompt — Volume 13: Observability & SRE

**Trigger condition:** Volume 6 (Memory Engine) Definition of Done met — can run any time
after that, in parallel with Volumes 7–9 if convenient; not gated behind full v0.1
completion the way Volumes 10–12 are, since this Volume derives entirely from existing
audit/cost data rather than adding new application behavior.

**Use in:** Google AI Studio (Implementation Team role)
**Paste alongside this prompt:** `01-Volumes/Volume-13.md`
**Implements:** RFC-0017
**Package target:** `packages/observability/`
**Depends on:** `packages/shared/memory-engine` only (queries existing `AuditEvent`/`CostRecord` data)

---

## Non-negotiable constraints

1. **No new infrastructure (NFR-1 / RFC-0017):** all metrics must be computable purely
   from existing `AuditEvent`/`CostRecord` tables. Do not stand up Prometheus, Grafana, or
   an OTel collector in this session — that is an explicitly deferred future RFC.
2. `traceId` presence MUST be validated as 100% of events (FR-2) — write a test that fails
   loudly if any event in the fixture data lacks one, since Volume 2's NFR-2 depends on
   this actually being true, not just assumed.
3. Structured JSON logs only; `debug` level never runs by default (Ch. 3); no credential
   ever appears in any log line at any level.
4. No push alerting (ADR-0008) — passive, CLI-surfaced warnings only.

## What to generate

1. `src/metrics.ts` — `MetricsQuery` interface + implementation deriving the 5 metrics in
   Ch. 1 from Memory Engine queries.
2. `src/trace.ts` — reconstructs a full trace from `AuditEvent` given a `traceId` (Ch. 2).
3. `src/logger.ts` — structured JSON logger with the mandatory fields (Ch. 3), a
   credential-scrubbing safeguard, and `debug` gated behind explicit config opt-in.
4. `src/index.ts` — exports.

## Tests you must also generate

Create `08-Examples/volume-13-observability/contract.test.ts`:
- FR-1: each of the 5 metrics computes correctly from fixture `AuditEvent`/`CostRecord` data
- FR-2: a fixture event missing `traceId` causes an assertion failure (proves the check
  actually works, not just exists)
- Security: logger never emits a string matching a credential pattern, even at `debug`
  level with a fixture payload that includes one

## Explicitly out of scope

No dedicated metrics/tracing service. No push alerting channel.

## Definition of done

- [ ] All 5 metrics computable and tested against fixture data
- [ ] Trace reconstruction works end-to-end for a multi-event `traceId`
- [ ] Credential-scrubbing test passes
