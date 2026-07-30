# PR-06-R1 Active Evidence Lifecycle Report

Task: `PR-06-R1`

Status: `READY_FOR_HUMAN_REVIEW`

Result: `READY_PR06_R1_FINAL_DIFF_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-30T08:38:25Z`

Authoritative scope: NONE

Related documents:

- [Migration matrix](PR06_R1_MIGRATION_MATRIX.md)
- [Human review](PR06_R1_HUMAN_REVIEW.md)
- [R1A governance hardening](../pr-06-r1a/PR06_R1A_EVIDENCE_LIFECYCLE_GOVERNANCE_REPORT.md)
- [Machine-readable report](pr06-r1-active-evidence-lifecycle-report.json)
- [PR-06 audit](../pr-06/PR06_REPOSITORY_QUALITY_GATE_SCOPE_AUDIT.md)

Base SHA: `11ce82001efb633c1697356c1a510fc0c5034245`

Validated implementation SHA: `95c7e5756c85cc295522f7a02a223caa3835fd23`

Final PR head SHA: `PENDING`

Initial audit generated at: `2026-07-30T08:38:25Z`

Generated at: `2026-07-30T10:16:05Z`

Tests cases: `90`

Tests passed: `90`

Tests failed: `0`

Blocking findings: `0`

Baselined findings: `15`

Changed files: `25`

Files deleted: `0`

Files renamed: `0`

Files moved: `0`

Line additions: `2066`

Line deletions: `25`

Human review decision: `PENDING`

## Result

R1 separates historical evidence from active authority without changing the
PR-05 historical report bytes. Historical entries retain existence, size, and
SHA-256 enforcement. Active authority paths use current repository validation,
tests, and CI and no longer fail solely because a prior report recorded an old
snapshot hash.

## Implementation

- Added lifecycle classes `historical` and `active-authority`.
- Added a current lifecycle registry with exact active paths/prefixes, the one
  approved legacy mixed-evidence source, and two protected PR-05 records.
- Restricted legacy class inference to protected historical manifests and the
  explicitly registered PR-05 source.
- Added rule IDs for missing class, invalid class, and class conflict.
- Made historical schema require size and SHA-256; active schema requires an
  explicitly registered path and ignores old snapshot size/hash values.
- Added active-authority evidence counts to validator results.

## Tests

| Required case | Result |
| --- | --- |
| Historical evidence modified | `PASS_BLOCKED_DOC_EVIDENCE_004` |
| Active validator modified and current validation passes | `PASS` |
| Missing `evidenceClass` | `PASS_BLOCKED_DOC_EVIDENCE_009` |
| Invalid `evidenceClass` | `PASS_BLOCKED_DOC_EVIDENCE_010` |
| Active file marked historical | `PASS_BLOCKED_DOC_EVIDENCE_011` |
| Full suite | `PASS_90_OF_90` |
| Rule registry closure | `PASS_49_OF_49` |

## Migration

The PR-05 evidence list contains 33 entries: 32 current authority sources and
one historical Markdown report. The PR-05 JSON report is separately registered
as historical because self-hashing is prohibited. The migration matrix records
the old classification, new classification, reason, and validation method for
every entry.

## PR-06 Coverage Recalculation

| Measure | Result |
| --- | ---: |
| Discovered | 26 |
| Classified | 26 |
| Unclassified | 0 |
| `COVERED_STRICT` | 2 |
| `COVERED_PARTIAL` | 12 |
| `COVERED_MANUAL` | 2 |
| `HISTORICAL_EVIDENCE_ONLY` | 4 |
| `MUTATING_CHECK_NOT_SAFE_FOR_CI` | 2 |
| `NO_ACTIVE_GATE` | 4 |
| P0 / P1 / P2 / P3 | 7 / 15 / 4 / 0 |

The recommended first implementation remains PR-06C, but its status is
`WAITING_FOR_PR06-R1A_HUMAN_REVIEW`.

R1A removes unrestricted protected-manifest inference, registers five exact
legacy sources, compares lifecycle registries in changed mode, and rejects
snapshot fields on explicit active-authority entries.

## Scope Boundary

Allowed validator implementation/config files: 3

Allowed validator test/fixture files: 10

PR-06, R1, and R1A maintenance evidence files: 12

Workflow changes: 0

`package.json` changes: 0

Production changes: 0

Candidate changes: 0

PDF changes: 0

Parser runtime changes: 0

Question-data changes: 0

Frontend behavior changes: 0

PR-05 historical files changed: 0

## Human Review

Human review is `PENDING`. This report does not approve the repair, mark PR #9
ready, merge it, or authorize PR-06C.
