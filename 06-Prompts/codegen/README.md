# Codegen Session Index

One self-contained prompt per Volume, for use in Google AI Studio (which has no
persistent project memory — always paste the referenced Volume file alongside the prompt
in a fresh session). Each file states its own non-negotiable constraints, drawn from the
Volume's Requirements plus the RFC/ADR that finalized the relevant decisions, so a session
does not need the rest of this handbook to stay in scope — only the one Volume file.

## Run order

| Order | Session | Trigger condition |
|---|---|---|
| 1 | `02-core-runtime.md` | None — first package, lowest-level |
| 2 | `03-agent-platform.md` | Session 1 done |
| 2 | `04-provider-platform.md` | Session 1 done (can run parallel to #2) |
| 4 | `07-tool-sdk.md` | Sessions 1–3 done |
| 5 | `05-workflow-engine.md` | Session 4 done |
| 6 | `06-memory-engine.md` | Session 1 done (can run earlier if convenient) |
| 7 | `08-plugin-platform.md` | Sessions 2–4 done |
| 8 | `13-observability.md` | Session 6 done (can run in parallel with 7–9) |
| 9 | `09-cli-platform.md` | All of sessions 1–8 done — **completes v0.1** |
| — | `14-testing-qa.md` | Lint scaffolding from session 1 onward; golden-set part needs session 2 |
| Gated | `10-enterprise-platform.md` | v0.1 complete + explicit Project Owner go-ahead |
| Gated | `11-cloud-platform.md` | Session 10 done |
| Gated | `12-ai-company-os.md` | Session 11 done + **fresh** Project Owner reconfirmation |

## Before running any session

1. Confirm the target Volume's status is `Approved` in `01-Volumes/`.
2. Paste the full Volume `.md` file into the AI Studio session alongside the prompt file.
3. After generation, run the contract test file the prompt asks for — a session is not
   done until its own Definition of Done checklist is satisfied.
4. Per `00-Governance/CONTRIBUTING.md`: note which Volume(s) this session's output maps
   to; if the generated code reveals the spec needs a change, write an RFC amendment
   before changing the code further, not after.
