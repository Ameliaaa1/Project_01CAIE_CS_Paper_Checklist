# PR-06C-R3 Contract V4 and Validator Implementation Report

Task: `PR06C-R3-R2-PROMOTION-SESSION-REMOTE-HISTORY-BOUNDARY-REPAIR`

Status: `APPROVED`

Result: `PASS_PR06C_R3_R2_PROMOTION_SESSION_REMOTE_HISTORY_BOUNDARY_HUMAN_REVIEW`

Owner: Promotion contract maintainers

Created at: `2026-08-01T07:33:34Z`

Authoritative scope: NONE

Related documents:

- [Contract-to-code traceability](PR06C_R3_CONTRACT_TO_CODE_TRACEABILITY.md)
- [Human review worksheet](PR06C_R3_HUMAN_REVIEW.md)
- [Machine implementation report](pr06c-r3-validator-implementation-report.json)
- [Constructibility report](pr06c-r3-constructibility-report.json)
- [Test execution report](pr06c-r3-test-execution-report.json)
- [Mutation audit](pr06c-r3-mutation-audit.json)
- [Output-path audit](pr06c-r3-output-path-audit.json)
- [Git boundary report](pr06c-r3-git-boundary-report.json)
- [Contract hash manifest](pr06c-r3-contract-hash-manifest.json)

Base SHA: `f65ab65525a9011b91823ff61520257a8460852f`

Validated implementation SHA: `aa7efe68aa0d66b23e02dab6d1d63bf5f1959f0e`

Final PR head SHA: `dd9af4685d45e1f817ef4ede6c30b0f99ba4d41b`

Generated at: `2026-08-01T07:33:34Z`

Tests cases: `165`

Tests passed: `165`

Tests failed: `0`

Blocking findings: `0`

Baselined findings: `15`

Human review decision: `APPROVE`

Reviewer: `Amelia Cai`

Review UTC timestamp: `2026-08-11T10:42:22Z`

Approved commit: `dd9af4685d45e1f817ef4ede6c30b0f99ba4d41b`

## Outcome

Contract v4 removes the v3 circular byte-hash dependency. Evidence binds the
exact manifest bytes. The manifest binds the RFC 8785 canonical evidence
projection identified by `paperlens-evidence-binding-v1`; the only excluded
pointer is `/manifest/sha256`. Additional or missing exclusions block.

The constructibility verifier compiled all nine registry schemas and proved
the dependency graph has zero cycles. It constructed schema-valid synthetic
Artifact, Manifest, and Evidence values and reproduced both bindings.

## Validator

The validator provides strict UTF-8 JSON parsing, approved-boundary loading,
schema and generator registry resolution, safe path resolution, artifact and
stable-ID inspection, scope validation, remote identity and historical
Manifest provenance reachability, lifecycle-transition validation, safe
Production-absence inspection, Target-bound Promotion session remote-history
evidence, Bootstrap and Update gates, evidence and approval binding, stdout
reporting, and create-new JSON output below `reports/promotion-validator/`.

All successful outcomes explicitly keep `promotionAuthorized` and
`promotionExecuted` false.

## Safety

Representative PASS and BLOCK executions changed zero bytes. The only tested
write creates a new JSON report below the approved report prefix; overwrite,
escape, symlink, authority, Production, promotion, and deployment actions are
blocked or absent.

No real Candidate, Current Production, or Promotion Target manifest is
included. Test fixtures are synthetic specifications materialized only in
temporary Git repositories.

The checked-in `REMOTE_HISTORY_CAPTURE_V1` is immutable historical review
evidence only. Persistent manifests bind `MANIFEST_PROVENANCE` evidence and do
not require future `origin/main` equality. Runtime captures are generated per
Promotion session, carry `RUNTIME_PROMOTION` plus the exact `promotionId`, and
are bound only through Promotion Target metadata. A session validates current
remote history and reachability of every participating role without rewriting
historical Production or Candidate manifests.
