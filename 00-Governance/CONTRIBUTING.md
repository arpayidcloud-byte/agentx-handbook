# Contributing to This Handbook

Applies even for a solo operator — this is the enforceable form of Constitution
Principle 8 (Documentation Required), referenced from Volume 1's Recommended Addition #2.

## Before opening a PR (or committing directly, if solo)

1. **Which Volume(s) does this change touch?** Every code change must map to at least one
   Volume. If it doesn't, either the change is out of scope, or a Volume/RFC is missing
   and should be written first (Constitution Principle 1, Architecture First).
2. **Does this change contradict an approved Volume?** If yes, stop — write an RFC to
   amend the Volume first (Constitution amendment process). Do not let code silently
   diverge from documentation.
3. **Does this introduce a new interface?** If yes, a contract-test template must exist
   at `08-Examples/<volume-slug>/` before merge (Volume 14, ADR-0009).

## PR / commit checklist

- [ ] Volumes updated (list which ones) — or explicitly note "no Volume changes needed"
- [ ] RFC written/updated if this is a new design decision, not just an implementation
      of an already-Accepted RFC
- [ ] ADR written if a previously-open decision is now finalized, or if this change
      reverses a prior Final ADR (a reversal is a *new* ADR that supersedes the old one,
      never an edit to the old one)
- [ ] Contract test template exists for any new interface (Volume 14, Ch. 1)
- [ ] No cross-Volume dependency violation introduced (check against Volume 1, Ch. 3 table)
- [ ] No direct vendor SDK import outside `packages/provider-sdk/providers/*`
      (Constitution Principle 3)
- [ ] No credentials logged or included in Event Bus payloads (Volume 4 Ch. 3, Volume 9,
      Volume 13 Ch. 3)

## Document status changes

Only the Project Owner can move a Volume/RFC/ADR to `Approved`/`Accepted`/`Final`
(Constitution's "Definition of Approved"). Anyone can propose the move by completing the
document's own Acceptance Criteria section and requesting review.
