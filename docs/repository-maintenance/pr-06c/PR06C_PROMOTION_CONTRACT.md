# PR-06C Promotion Contract

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Source-of-truth audit](PR06C_SOURCE_OF_TRUTH_AUDIT.md)
- [Authority classification](PR06C_AUTHORITY_CLASSIFICATION.md)
- [Schema proposal](PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Risk assessment](PR06C_RISK_ASSESSMENT.md)
- [Human review](PR06C_HUMAN_REVIEW.md)

## State Separation

```text
VALIDATION_COMPLETED
!= PROMOTION_AUTHORIZED
!= PROMOTION_EXECUTED
```

A PASS from a future validator proves eligibility only. Human review is
required before authorization. Execution requires a later, separately approved
write phase.

## Required Equality

Candidate and proposed Production identity must match for:

| Field | Rule |
| --- | --- |
| Artifact ID | Exact equality |
| Artifact version | Exact equality |
| Artifact SHA-256 | Exact equality |
| Artifact size | Exact equality |
| Record count | Exact equality |
| Stable-ID set hash | Exact equality |
| Supported syllabus set | Exact equality; only 0478/9618 |
| Scope hash | Exact equality |
| Artifact schema ID/version/hash | Exact equality |

## Allowed Differences

| Field | Allowed difference |
| --- | --- |
| `authorityClass` | Candidate versus Production |
| `lifecycleState` | Candidate review state versus `PRODUCTION_CURRENT` |
| `artifactPath` | Candidate and Production storage locations may differ |
| `provenance.generatedAt` | Time of each manifest creation |
| `validation.validatedAt` | Time of each validation |
| `promotion.reviewDecision` | Candidate may move from PENDING to APPROVE |
| Reviewer and review timestamp | Added only by human review |
| Promotion ID | Added only by an authorized execution |

Allowed metadata must never change the content identity fields.

## PASS Rules

| Rule | Requirement |
| --- | --- |
| `PR06C-SOT-001` | Exact Candidate manifest exists and validates |
| `PR06C-SOT-002` | Exact Production manifest exists and validates |
| `PR06C-SOT-003` | Both referenced artifacts exist and match size/hash |
| `PR06C-SOT-004` | Artifact schema identity matches |
| `PR06C-SOT-005` | Supported scope matches and excludes 9709 |
| `PR06C-SOT-006` | Stable identifier set and record count match |
| `PR06C-SOT-007` | Candidate validation evidence exists and matches hash |
| `PR06C-SOT-008` | No forbidden difference is present |
| `PR06C-SOT-009` | Validation is read-only and leaves repository bytes unchanged |

All rules must pass for `CANDIDATE_VALIDATION_PASS`. That result still leaves
promotion review as PENDING.

## BLOCK Rules

Block on any of:

- missing or extra authority manifest;
- unknown manifest or artifact schema;
- artifact identity, size, or hash mismatch;
- unsupported syllabus or any 9709 scope;
- duplicate, missing, or changed stable identifier;
- missing, stale, or mismatched validation evidence;
- unapproved content difference;
- unresolved source commit;
- Production or Candidate mutation during validation;
- deployment credentials, deployment action, or Production write attempt.

## Approval Boundary

Human approval records reviewer, UTC timestamp, decision, blocker count, exact
candidate identity, and approved promotion scope. Approval may authorize a
later execution plan; it does not execute promotion.

## Current Result

Current Candidate manifest: `MISSING_BY_DESIGN`

Current Production manifest: `MISSING_BY_DESIGN`

Current promotion validation: `NOT_IMPLEMENTED`

Current promotion authorization: `NOT_AUTHORIZED`

Current promotion execution: `NOT_STARTED`
