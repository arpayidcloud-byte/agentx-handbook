# 08-Examples

Contract-test templates per Volume, per ADR-0009 (Contract-Test-Template Required Before
Volume Approval) and Constitution Principle 6 (Testable by Default).

## Purpose

This directory is the tracked home for the executable contract tests that verify a
Volume's specification against its stated Functional Requirements and documented edge
cases. Populating a Volume's entry here is the sole prerequisite for that Volume moving
from **Approved — Architecture** to **Approved — Implementation-Gated** (see ADR-0009).

## Directory Convention

One subdirectory per Volume, named by Volume slug, containing at minimum a
`contract.test.ts` file:

```
08-Examples/
  volume-02-core-runtime/
    contract.test.ts
  volume-03-agent-platform/
    contract.test.ts
  volume-04-provider-platform/
    contract.test.ts
  ...
```

Each `contract.test.ts` covers, at minimum, its Volume's stated Functional Requirements
and documented edge cases, per ADR-0009.

## Current Status

**Fully populated (16 of 16 Volumes) — templates only, not verified implementations.**
Every Volume now has a contract-test template in this directory and a schema in
`04-Schemas/`. See `PATCH_SUMMARY_v6.md` for the full list and important caveats about
what "fully populated" does and does not mean here.

**These templates are NOT a basis for Approved — Implementation-Gated status for any
Volume.** Per ADR-0009 and the Constitution's Definition of Approved, that status also
requires explicit Project Owner sign-off — which has not occurred for any Volume. All 16
Volumes remain **Approved — Architecture** only. Each Volume's header now includes a
`Contract Test:` and `Schema:` line pointing to its new artifacts.

**None of these tests have ever been run against real code**, because no implementation
of any Volume exists in this repository. They are specifications expressed as test
syntax — a stronger, more precise form of specification than prose, but still a
specification, not evidence of working software. Two of the sixteen (Volume 1 and Volume
14) are meta-tests against this repository's own documentation structure and genuinely
execute and pass today; the other fourteen require real backend implementations to run
against and are written against declared, illustrative fixture functions
(`createXUnderTest()`) that do not yet exist.
