# Codegen Prompt — Volume 11: Cloud Platform

**Status: DO NOT RUN YET.** Sequenced after Volume 10 (needs the tenant model before
deployment topology makes sense). Trigger condition: Volume 10 Definition of Done met,
Project Owner requests deployment/scaling work.

**Use in:** Google AI Studio (Implementation Team role), once triggered
**Paste alongside this prompt:** `01-Volumes/Volume-11.md`
**Implements:** RFC-0013, RFC-0014, ADR-0007
**Package target:** `docker-compose.yml`, deployment configs, no new `packages/*` code
**Depends on:** all prior packages (infrastructure/deployment layer, not application code)

---

## Non-negotiable constraints (when this session runs)

1. **Every managed service recommended must ship with a working self-hosted fallback in
   the same delivery** (ADR-0007 / RFC-0013) — do not produce a managed-only deployment
   guide and call the fallback "documented later."
2. v0.1-topology default is single-node (RFC-0014) — do not design a multi-service
   split in this session unless the Project Owner has explicitly provided real usage/load
   data justifying it (Volume 11 Trade-offs section).
3. Secrets strategy must reuse Volume 4's `CredentialResolver` seam — do not introduce a
   new secret-handling code path at the deployment layer.

## Mandatory check before this Volume's Definition of Done

Per Volume 14's Deployment Portability Check (Ch. 4): verify `docker-compose up` brings
up a fully working self-hosted stack (Postgres + Redis + app), not just that the
managed-service path works. This check should be wired into CI at the same time this
Volume is implemented, not left as a follow-up.

## Explicitly out of scope until triggered

No code/config should be generated from this file until the trigger condition above is
met.
