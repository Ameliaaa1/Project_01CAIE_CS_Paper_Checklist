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

Content roles are also distinct:

```text
CANDIDATE
!= CURRENT_PRODUCTION_BASELINE
!= PROMOTION_TARGET_ROLE
```

Candidate and Promotion Target must represent the same content identity.
Current Production is compared as a baseline and may legitimately differ
during Update.

## Promotion Modes

### Bootstrap

Bootstrap applies only when Current Production authority is absent.

```text
Candidate
-> read-only validation
-> Promotion Target with identical content identity
-> human approval
-> separately authorized initial Production write
```

Bootstrap blocks if a Current Production manifest or authority artifact exists.
The validator does not create the initial Production manifest.

### Update

Update applies only when Current Production authority exists.

```text
Current Production baseline
+
Candidate
-> read-only validation
-> Promotion Target with Candidate content identity
-> human approval
-> separately authorized atomic Production replacement
```

Current Production must validate before it is used as a baseline, but its
artifact version, bytes, record set, and supported scope may differ from the
Promotion Target. A later execution must preserve rollback evidence and mark
the prior baseline superseded.

## Candidate-to-Target Comparison

| Field group | Rule |
| --- | --- |
| Manifest and artifact type | Supported and compatible |
| Artifact identity fields | Exact equality |
| Derived size/count/hash fields | Independently reproduce, then exact equality |
| Supported syllabus set | Exact equality; non-empty subset of 0478/9618 |
| Artifact schema identity | Exact equality |
| Provenance source commit | Exact equality |
| Role, lifecycle, path, validation time/evidence | May differ only as classified by the schema proposal |
| Approval/execution metadata | Must remain pending or null until its authorized phase |

## Current-to-Target Comparison

| Mode | Rule |
| --- | --- |
| Bootstrap | Current Production must be absent |
| Update | Current Production must exist and validate as a supported baseline |
| Update content | Target content identity may differ; exact equality is not required |
| Update compatibility | Artifact ID and supported manifest schema stay fixed; artifact schema or scope changes require explicit human approval |
| Update no-op | Target content identity equal to Current Production blocks |
| Both modes | Current Production remains byte-for-byte read-only during validation and review |

## PASS Rules

| Rule | Requirement |
| --- | --- |
| `PR06C-SOT-001` | Exact Candidate manifest exists and validates |
| `PR06C-SOT-002` | Exact Promotion Target manifest exists and validates |
| `PR06C-SOT-003` | Promotion mode is exactly Bootstrap or Update and its Current Production presence rule passes |
| `PR06C-SOT-004` | Every referenced authority artifact exists and matches its recorded size and SHA-256 |
| `PR06C-SOT-005` | Candidate and Target artifact identity and schema identity match exactly |
| `PR06C-SOT-006` | Stable-ID, scope, and schema hashes reproduce under the frozen canonicalization rules |
| `PR06C-SOT-007` | Supported scope is non-empty, contains only 0478/9618, and excludes 9709 |
| `PR06C-SOT-008` | Update baseline validates; Bootstrap baseline is absent |
| `PR06C-SOT-009` | Candidate validation evidence exists, is current, and matches its recorded hash |
| `PR06C-SOT-010` | Every manifest field is classified and no forbidden or unknown field/change is present |
| `PR06C-SOT-011` | Validation is read-only and leaves Candidate, Current Production, Target, and repository bytes unchanged |
| `PR06C-SOT-012` | Review decision remains PENDING and execution metadata remains null during eligibility validation |

All rules must pass for `PROMOTION_TARGET_VALIDATION_PASS`. That result proves
eligibility only and leaves promotion authorization PENDING.

## BLOCK Rules

Block on any of:

- missing Candidate or Promotion Target manifest;
- Current Production present in Bootstrap or absent in Update;
- unregistered, extra, ambiguous, or inferred authority;
- unknown manifest or artifact schema;
- artifact identity, size, or hash mismatch;
- unsupported syllabus or any 9709 scope;
- duplicate, missing, or changed stable identifier;
- non-reproducible stable-ID, scope, or schema hash;
- missing, stale, or mismatched validation evidence;
- Candidate-to-Target content difference;
- unapproved Update schema or scope change;
- Update target identical to Current Production;
- unknown or multiply classified manifest field;
- unresolved source commit;
- Candidate, Current Production, or Promotion Target mutation during validation;
- deployment credentials, deployment action, or Production write attempt.

## Approval Boundary

Human approval records reviewer, UTC timestamp, decision, blocker count, exact
Candidate and Target identity, promotion mode, Current Production baseline
identity or explicit absence, and approved schema/scope differences. Approval
may authorize a later execution plan; it does not execute promotion.

## Current Result

Current Candidate manifest: `MISSING_BY_DESIGN`

Current Production manifest: `ABSENT_OBSERVED`

Current Promotion Target manifest: `MISSING_BY_DESIGN`

Current promotion validation: `NOT_IMPLEMENTED`

Current promotion authorization: `NOT_AUTHORIZED`

Current promotion execution: `NOT_STARTED`
