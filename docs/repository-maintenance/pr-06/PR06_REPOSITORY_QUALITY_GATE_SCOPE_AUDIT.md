# PR-06 Repository Quality Gate Scope Audit

Task: `PR-06`

Status: `READY_FOR_HUMAN_REVIEW`

Result: `READY_PR06_REPOSITORY_QUALITY_GATE_SCOPE_AUDIT_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-30T07:09:43Z`

Authoritative scope: NONE

Related documents:

- [Quality gate coverage matrix](PR06_QUALITY_GATE_COVERAGE_MATRIX.md)
- [Machine-readable coverage matrix](pr06-quality-gate-coverage-matrix.json)
- [Human review worksheet](PR06_HUMAN_REVIEW.md)
- [Machine-readable audit](pr06-repository-quality-gate-scope-audit.json)
- [Documentation Index](../../DOCUMENTATION_INDEX.md)

Base SHA: `11ce82001efb633c1697356c1a510fc0c5034245`

Validated implementation SHA: `11ce82001efb633c1697356c1a510fc0c5034245`

Final PR head SHA: `PENDING`

Initial audit generated at: `2026-07-30T07:09:43Z`

Generated at: `2026-07-30T08:03:45Z`

Tests cases: `79`

Tests passed: `79`

Tests failed: `0`

Blocking findings: `0`

Baselined findings: `15`

Changed files: `5`

Files deleted: `0`

Files renamed: `0`

Files moved: `0`

Line additions: `900`

Line deletions: `0`

Human review decision: `PENDING`

## Outcome

PR-06 classifies 25 discovered gate entrypoints across all 15 required quality
domains. All 25 are classified, mutability is resolved, and no entrypoint is
left unknown. The audit changes documentation evidence only; it does not add,
change, execute, or activate a product-data quality gate.

The sole `COVERED_STRICT` entry is documentation governance. Twelve local or
mocked product checks are `COVERED_PARTIAL`, two repository processes are
`COVERED_MANUAL`, four entries rely only on historical evidence, two generated
index entries are mutating and not safe as current CI checks, and four required
boundaries have no active gate.

## Baseline and Discovery

| Fact | Result |
| --- | --- |
| Required base | `11ce82001efb633c1697356c1a510fc0c5034245` |
| Branch base matched `origin/main` | `PASS` |
| Tracked files | 307 |
| Package scripts | 18 |
| Test entrypoints in `npm test` | 11 |
| Tracked script files | 6 |
| GitHub Actions workflows | 1 |
| Tracked PDFs | 196 |
| Current tracked parser/canonical/staging/Candidate/Production trees | 0 |
| Discovered entrypoints | 25 |
| Classified entrypoints | 25 |
| Unclassified entrypoints | 0 |

The dirty primary workspace was not used. Discovery and validation occurred in
the isolated worktree on branch
`docs/pr-06-repository-quality-gate-scope-audit`.

## Classification

| Coverage status | Count |
| --- | ---: |
| `COVERED_STRICT` | 1 |
| `COVERED_PARTIAL` | 12 |
| `COVERED_MANUAL` | 2 |
| `SCRIPT_EXISTS_NOT_GATED` | 0 |
| `HISTORICAL_EVIDENCE_ONLY` | 4 |
| `MUTATING_CHECK_NOT_SAFE_FOR_CI` | 2 |
| `NO_ACTIVE_GATE` | 4 |
| `NOT_APPLICABLE` | 0 |
| `BLOCKED_UNKNOWN` | 0 |
| **Classified** | **25** |

| Risk level | Count |
| --- | ---: |
| P0 | 7 |
| P1 | 15 |
| P2 | 3 |
| P3 | 0 |
| **Classified** | **25** |

| Mutability | Count |
| --- | ---: |
| `READ_ONLY` | 17 |
| `WRITES_RUNTIME_DATA` | 6 |
| `WRITES_GENERATED_ARTIFACT` | 2 |
| `WRITES_CANDIDATE_DATA` | 0 |
| `WRITES_PRODUCTION_DATA` | 0 |
| `UNKNOWN_MUTABILITY` | 0 |

Read-only entries: `17`

Mutating entries: `8`

Not-run entries: `10`

The runtime-writing tests use a unique OS temporary `DATA_DIR` and remove it.
They passed without changing repository bytes. The generated-index builder was
not run because it writes a tracked artifact and embeds wall-clock time.

## Current CI Gates

The one workflow uses `contents: read`, runs `npm ci`, documentation validator
tests, full documentation validation, changed-mode documentation validation on
pull requests, and the full `npm test` chain.

This wiring means the 11 package test entrypoints execute in Actions. It does
not elevate their product-domain coverage to strict: the deployment checks are
local, browser execution is simulated, provider paths are mocked, data tests
are not full-corpus, and no Candidate/Production promotion boundary is wired.

## Dynamic Validation

The isolated worktree initially had no `node_modules`. The first project-test
attempt stopped at `tests/server-entrypoint.test.js` because `pdf-lib` was not
installed. This was an environment prerequisite failure, not a repository
quality result. `npm ci` installed the locked dependency set with zero reported
vulnerabilities and no tracked changes. The repeat then passed.

| Command | Mutability | Result |
| --- | --- | --- |
| `npm ci` | ignored dependency directory | `PASS`; prerequisite setup |
| `npm run test:documentation-validation` | temp fixtures outside worktree | `PASS_79_OF_79` |
| `npm run validate:docs` | read-only | `PASS` |
| `npm test` | temp runtime stores outside worktree | `PASS` after `npm ci` |
| `git diff --check` | read-only | `PASS` |
| `npm run build:question-index` | writes tracked generated artifact | `NOT_RUN_MUTATING_COMMAND` |
| PDF parse/OCR commands | unknown or data-writing | `NOT_RUN_PROHIBITED` |
| Candidate/Production commands | no current entrypoint; potentially data-writing | `NOT_RUN_PROHIBITED` |

## P0 Gaps and Bounded Follow-ups

| Gate | P0 reason | Owner | Proposed one-PR boundary |
| --- | --- | --- | --- |
| `QG-INGEST-001` | Current parser/ingestion gate absent | Parser and canonical maintainers | PR-06B |
| `QG-CANONICAL-001` | Canonical validation is historical only | Canonical model maintainers | PR-06B |
| `QG-STAGING-001` | No active validation-before-promotion boundary | Canonical and staging maintainers | PR-06B |
| `QG-CANDIDATE-001` | Candidate integrity not actively gated | Candidate and Production maintainers | PR-06C |
| `QG-PRODUCTION-001` | Production integrity and rollback not actively gated | Production maintainers | PR-06C |
| `QG-HYGIENE-002` | Runtime/secret containment remains manual | Repository maintainers | PR-06A |
| `QG-SYLLABUS-001` | No active 0478/9618 allow and 9709 reject rule | Candidate and Production maintainers | PR-06C |

Every P0 has an owner and one bounded proposed implementation PR. These labels
are planning boundaries only; none is created or authorized by PR-06.

## Syllabus Boundary

Supported active syllabus scope remains `0478` and `9618`. Deprecated and
non-target scope remains `9709`. PR-02A historical evidence records active
9709 data paths as zero, but there is no current automated gate that enforces
the boundary. `QG-SYLLABUS-001` is therefore
`HISTORICAL_EVIDENCE_ONLY`, risk P0, not a current PASS.

## Recommended First Implementation

Recommended first target:
`Candidate-to-Production Promotion Gate` (`PR-06C`).

The matrix supports the pre-audit hypothesis. PR-06C can protect Candidate,
Production, and syllabus P0 facts before promotion, remain read-only, avoid
parser changes and PDF reprocessing, and block unresolved review or scope
violations. Human review must approve exactly one target before any follow-up
work starts.

## Consistency Checks

| Check | Result |
| --- | --- |
| Discovered equals classified plus unclassified | `PASS_25_EQUALS_25_PLUS_0` |
| Coverage-status sum equals classified | `PASS_25_OF_25` |
| Risk sum equals classified | `PASS_25_OF_25` |
| Unique gate IDs | `PASS_25_OF_25` |
| Required domains represented | `PASS_15_OF_15` |
| Entrypoint paths exist | `PASS_ALL` |
| Commands have source evidence | `PASS_ALL` |
| Strict gates have failure tests and exit contracts | `PASS_1_OF_1` |
| Mutating entries identify written files | `PASS_8_OF_8` |
| P0 entries have owner and proposed PR | `PASS_7_OF_7` |
| Historical-only entries cite evidence | `PASS_4_OF_4` |
| Not-run entries have reasons | `PASS_10_OF_10` |
| Unknown mutability | `PASS_0` |
| Markdown and JSON counts | `PASS` |

## Git Boundary

Changed files: 5

Code changes: 0

Test changes: 0

Workflow changes: 0

`package.json` changes: 0

Archive changes: 0

Production changes: 0

Candidate changes: 0

PDF changes: 0

Files deleted, renamed, or moved: 0

All five changed files are new PR-06 maintenance evidence. The optional
`docs/DOCUMENTATION_INDEX.md` update was intentionally omitted because changing
it would invalidate the immutable PR-05 evidence hash for that active index.

## Evidence Generation

The matrix JSON was generated first, followed by the matrix Markdown, audit
Markdown, human review worksheet, and index update. Markdown is frozen before
hashes are computed. The audit JSON is generated last and excludes its own hash
with `SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE`.

## Human Review

Human review required: `true`

Human review decision: `PENDING`

Draft PR required: `true`

Auto-merge: `disabled`

No follow-up implementation phase is authorized until the review worksheet is
completed by a human reviewer.
