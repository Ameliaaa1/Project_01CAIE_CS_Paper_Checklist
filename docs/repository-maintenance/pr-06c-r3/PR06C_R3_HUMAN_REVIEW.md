# PR-06C-R3 Human Review Worksheet

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Promotion contract maintainers

Created at: `2026-08-01T06:02:59Z`

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
- [ ] Provenance checks verify exact `origin`, non-shallow history, approved ref, object type, reachability, and checkout equality.
- [ ] `REMOTE_HISTORY_CAPTURE_V1` binds the approved repository, `refs/heads/main`, and `f65ab65525a9011b91823ff61520257a8460852f`.
- [ ] Fake `origin/main`, missing capture evidence, repository mismatch, and capture SHA drift all block.
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

Reviewer: `PENDING`

Review UTC timestamp: `PENDING`

Decision: `PENDING`

Blocker count: `PENDING`

Suggested approval token:

`PASS_PR06C_R3_R1_REMOTE_HISTORY_BINDING_HUMAN_REVIEW`

Approval does not authorize real manifests, promotion execution, Production
writes, generator production flow, or deployment.
