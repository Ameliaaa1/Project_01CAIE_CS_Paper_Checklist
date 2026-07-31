# PR-06C-R2-R1 Validator Contract Boundary

Task: `PR06C-R2-R1-VALIDATOR-CONTRACT-BOUNDARY-CLOSURE`

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Promotion contract maintainers

Created at: `2026-07-31T10:21:29Z`

Authoritative scope: NONE

Related documents:

- [Completion report](PR06C_R2_R1_BOUNDARY_CLOSURE_REPORT.md)
- [Human review](PR06C_R2_R1_HUMAN_REVIEW.md)
- [Git boundary report](pr06c-r2-r1-git-boundary-report.json)
- [Contract hash manifest](pr06c-r2-r1-contract-hash-manifest.json)
- [Schema validation](pr06c-r2-r1-schema-validation-report.json)

## Closed Boundary Rules

Contract v3 revision 1 freezes six allowed role/lifecycle pairs and four
evidence-phase mappings. Any unlisted pair blocks. Validation evidence now
binds the manifest lifecycle state as well as its role, path, and hash.

Candidate and current-production manifests carry no promotion metadata or
execution authority. Promotion-target pre-review manifests require a pending
decision and no approval evidence. Post-review manifests require approval,
reviewer, UTC timestamp, approval bytes, and the correct phase outcome.

Bootstrap and update both require human approval before execution. Bootstrap
uses its own approval schema and has no production baseline or difference
request. Update always binds the current production hash, difference request,
candidate/target identity, and post-review approval.

## Provenance

`sourceCommit` is a lowercase full SHA, must resolve to a commit, must be an
ancestor of the approved `origin/main` history, and must match both the
manifest provenance and validation execution checkout. Missing shallow-clone
history blocks instead of weakening reachability.

Generator identity is the exact `(id, version)` lookup in the hash-bound
generator registry. Unknown or unimplemented generators block manifest
creation. R2-R1 defines no generator implementation.

## Parsing and Output

All JSON inputs require strict UTF-8 without a BOM, duplicate keys, comments,
trailing commas, non-finite values, precision loss, or trailing values. Schema
hashes use RFC 8785 canonical bytes.

Validator output defaults to stdout. Optional file output may create a new
`.json` only below `reports/promotion-validator/`; overwrite, symlinks,
authority paths, source/configuration paths, production paths, promotion
execution, and deployment remain prohibited.

## Git Evidence Semantics

The machine report separates the total PR diff from the R2-R1 phase delta.
The repository report records the immutable phase-input HEAD. The final PR
head is verified externally after push because embedding a commit SHA inside
that commit would be self-referential and cannot be truthful.
