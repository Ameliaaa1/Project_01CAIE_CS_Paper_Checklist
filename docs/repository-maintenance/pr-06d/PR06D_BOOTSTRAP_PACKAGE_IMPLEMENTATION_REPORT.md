# PR-06D Bootstrap Package Generation and Dry-Run Report

Status: `APPROVED`

Owner: Promotion package maintainers

Created at: `2026-08-11T11:35:35Z`

Authoritative scope: Candidate and Promotion Target review package only; no Current Production authority

Related documents:

- [Contract-to-package traceability](PR06D_CONTRACT_TO_PACKAGE_TRACEABILITY.md)
- [Human review worksheet](PR06D_HUMAN_REVIEW.md)
- [Machine implementation report](pr06d-bootstrap-package-report.json)
- [Test execution report](pr06d-test-execution-report.json)
- [Safety audit](pr06d-safety-audit.json)
- [Candidate manifest](../../../promotion/candidate/manifest.json)
- [Promotion Target manifest](../../../promotion/target/manifest.json)
- [Dry-run report](../../../promotion/target/evidence/pr06d-dry-run-report.json)
- [Package hash inventory](../../../promotion/target/evidence/pr06d-package-hash-report.json)

Result: `PASS_PR06D_FIRST_REAL_BOOTSTRAP_PACKAGE_HUMAN_REVIEW`

Frozen implementation and package commit: `f7b090c41099a5f3eb428c8d66c350bb62cb69cf`

## Package identity

- Promotion ID: `pr06d-bootstrap-c1da2430cecd-56d59d2b79e9`
- Source path: `generated/production-question-index.json`
- Source commit: `c1da2430cecd1135d7c8388cc20b0829661eb81c`
- Source exact-byte SHA-256: `a95f5c5f5ff6b0bd5d54eadca275873c58947dca1705d75aeaf307d2eb130632`
- Candidate/Target artifact SHA-256: `56d59d2b79e93bd851226742676c28327e7aa0ecd45abc545bae0026b665f87e`
- Candidate manifest SHA-256: `c57a7ab167d2236a9b195d46795a85cfdea2cbba3144d741d9378282de52d489`
- Target manifest SHA-256: `143ddeb596a62da6788e1a6f9de696a79a8415b31752e7292a218b7a61dd0725`
- Record count: `1690`
- Supported syllabi: `0478`, `9618`

The source file already carries the historical label `PRODUCTION_CANONICAL`.
That label identifies the validated input dataset; it does not create PR-06D
Current Production authority. Under Contract v4, Current Production authority
exists only at `promotion/production/manifest.json`, which remains absent.

## Workflow outcome

The generator verifies that the exact source bytes exist at the declared Git
commit, transforms the source deterministically, rejects duplicate stable IDs,
and builds hash-bound Candidate and Promotion Target manifests and evidence.
The Target binds a session-specific remote-history capture and remains in
`READY_FOR_HUMAN_REVIEW` with review decision `PENDING`.

Candidate validation returned `PASS`. Bootstrap pre-review validation returned
`READY_FOR_HUMAN_REVIEW`. Both validator results retained
`promotionAuthorized=false` and `promotionExecuted=false`. A replay using the
same source, timestamp, Promotion ID, and runtime capture reproduced all nine
core generated files with zero hash drift.

The approval simulation is explicitly non-authoritative: no approval evidence
was created, no execution authority was granted, and no Production path was
written.

## Session freshness

Runtime remote-history evidence is valid only for this Promotion session and
the captured `origin/main` boundary. If `main` advances before PR-06E, the
Promotion Target runtime evidence and its dependent Target bindings must be
regenerated and reviewed. Historical Candidate provenance must not be replaced
by runtime evidence.

## Safety

- Current Production manifest created: `false`
- Production write: `false`
- Promotion executed: `false`
- Deployment executed: `false`
- Database migration: `false`
- Parser/frontend/question source mutation: `false`

This package passed human review for its frozen Package Identity. It is not
`PRODUCTION_ACTIVE` and does not authorize PR-06E execution.
