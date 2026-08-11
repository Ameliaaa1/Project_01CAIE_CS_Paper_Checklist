# PR-06C-R3 Human Review Worksheet

Status: `APPROVED`

Owner: Promotion contract maintainers

Created at: `2026-08-01T07:33:34Z`

Authoritative scope: NONE

Related documents:

- [Implementation report](PR06C_R3_CONTRACT_V4_AND_VALIDATOR_IMPLEMENTATION_REPORT.md)
- [Traceability](PR06C_R3_CONTRACT_TO_CODE_TRACEABILITY.md)

## Required Checks

- [ ] Contract v4 supersedes v3 without modifying v3 bytes.
- [ ] Projection profile excludes exactly `/manifest/sha256`.
- [ ] Artifact → projection → manifest → evidence construction has no cycle.
- [ ] All nine schemas compile in strict mode and registry hashes match.
- [ ] All six role/lifecycle pairs, transition endpoints, and four evidence phases are enforced.
- [ ] Candidate, Current Production, Target pre/post, Bootstrap, and Update paths are covered.
- [ ] `0478` and `9618` pass while `9709` blocks.
- [ ] Persistent manifests bind `MANIFEST_PROVENANCE`; future `origin/main` equality and checkout equality are not required.
- [ ] Promotion Target binds one `RUNTIME_PROMOTION` capture to its exact `promotionId`.
- [ ] Promotion session validation checks current tracking-ref equality and every participating role's source reachability.
- [ ] Production created at A remains byte-identical and validates when Update runs at B.
- [ ] Historical-as-runtime, runtime-as-history, old capture reuse, fake `origin/main`, session-ID drift, and unrelated role history all block.
- [ ] Bootstrap Production absence blocks present manifests, directory symlinks, and broken manifest symlinks.
- [ ] Fixtures remain non-authoritative and contain no real Production data.
- [ ] Reports cannot overwrite or escape the approved prefix.
- [ ] Authority, Production, promotion execution, and deployment mutations are zero.

## Finding Template

Finding ID:

Severity:

Affected contract rule:

Evidence:

Required correction:

Disposition:

## Decision

Reviewer: `Amelia Cai`

Review UTC timestamp: `2026-08-11T10:42:22Z`

Decision: `APPROVE`

Blocker count: `0`

Approved commit: `dd9af4685d45e1f817ef4ede6c30b0f99ba4d41b`

Suggested approval token:

`PASS_PR06C_R3_R2_PROMOTION_SESSION_REMOTE_HISTORY_BOUNDARY_HUMAN_REVIEW`

Approval does not authorize real manifests, promotion execution, Production
writes, generator production flow, or deployment.
