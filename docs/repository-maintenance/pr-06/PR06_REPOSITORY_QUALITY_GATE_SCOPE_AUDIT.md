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

## Outcome

PR-06-R1 classifies 26 discovered gate entrypoints across all 15 required
quality domains. All 26 are classified, mutability is resolved, and no entrypoint is
left unknown. The audit changes documentation evidence only; it does not add,
change, execute, or activate a product-data quality gate.

The two `COVERED_STRICT` entries cover documentation governance and explicit
evidence lifecycle semantics. Twelve local or
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
| Discovered entrypoints | 26 |
| Classified entrypoints | 26 |
| Unclassified entrypoints | 0 |

The dirty primary workspace was not used. Discovery and validation occurred in
the isolated worktree on branch
`docs/pr-06-repository-quality-gate-scope-audit`.

## Classification

| Coverage status | Count |
| --- | ---: |
| `COVERED_STRICT` | 2 |
| `COVERED_PARTIAL` | 12 |
| `COVERED_MANUAL` | 2 |
| `SCRIPT_EXISTS_NOT_GATED` | 0 |
| `HISTORICAL_EVIDENCE_ONLY` | 4 |
| `MUTATING_CHECK_NOT_SAFE_FOR_CI` | 2 |
| `NO_ACTIVE_GATE` | 4 |
| `NOT_APPLICABLE` | 0 |
| `BLOCKED_UNKNOWN` | 0 |
| **Classified** | **26** |

| Risk level | Count |
| --- | ---: |
| P0 | 7 |
| P1 | 15 |
| P2 | 4 |
| P3 | 0 |
| **Classified** | **26** |

| Mutability | Count |
| --- | ---: |
| `READ_ONLY` | 18 |
| `WRITES_RUNTIME_DATA` | 6 |
| `WRITES_GENERATED_ARTIFACT` | 2 |
| `WRITES_CANDIDATE_DATA` | 0 |
| `WRITES_PRODUCTION_DATA` | 0 |
| `UNKNOWN_MUTABILITY` | 0 |

Read-only entries: `18`

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
| `npm run test:documentation-validation` | temp fixtures outside worktree | `PASS_90_OF_90` |
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

Dependency status: `WAITING_FOR_PR06-R1A_HUMAN_REVIEW`.

The matrix supports the pre-audit hypothesis. PR-06C can protect Candidate,
Production, and syllabus P0 facts before promotion, remain read-only, avoid
parser changes and PDF reprocessing, and block unresolved review or scope
violations. PR-06C must not start until R1 human review completes and then the
PR-06 reviewer approves exactly one first target.

## Consistency Checks

| Check | Result |
| --- | --- |
| Discovered equals classified plus unclassified | `PASS_26_EQUALS_26_PLUS_0` |
| Coverage-status sum equals classified | `PASS_26_OF_26` |
| Risk sum equals classified | `PASS_26_OF_26` |
| Unique gate IDs | `PASS_26_OF_26` |
| Required domains represented | `PASS_15_OF_15` |
| Entrypoint paths exist | `PASS_ALL` |
| Commands have source evidence | `PASS_ALL` |
| Strict gates have failure tests and exit contracts | `PASS_2_OF_2` |
| Mutating entries identify written files | `PASS_8_OF_8` |
| P0 entries have owner and proposed PR | `PASS_7_OF_7` |
| Historical-only entries cite evidence | `PASS_4_OF_4` |
| Not-run entries have reasons | `PASS_10_OF_10` |
| Unknown mutability | `PASS_0` |
| Markdown and JSON counts | `PASS` |

## Git Boundary

Changed files: 25

Documentation-validator implementation/config files: 3

Documentation-validator test/fixture files: 10

Workflow changes: 0

`package.json` changes: 0

Archive changes: 0

Production changes: 0

Candidate changes: 0

PDF changes: 0

Files deleted, renamed, or moved: 0

The PR contains the five original PR-06 evidence files, four R1 files, three
R1A review/evidence files, three validator implementation/config files, and ten
validator test/fixture files. `docs/DOCUMENTATION_INDEX.md` remains unchanged. PR-05
historical report bytes remain unchanged while its active-authority targets are
no longer treated as permanently frozen snapshots.

## R1 Evidence Lifecycle Repair

`evidenceClass` accepts exactly `historical` or `active-authority`.
Historical entries require path, size, and SHA-256 and block on byte changes.
Active-authority entries require an explicitly registered active path and are
validated by current schema, links, rules, tests, and CI rather than stale
snapshot hashes. New entries without a class block. Only protected legacy
manifests and the explicitly registered PR-05 mixed-evidence source may infer a
migration class.

PR-05 report Markdown and JSON are registered as historical evidence with
their original sizes and hashes. Neither file is modified by R1.

R1A removes the generic protected-manifest inference bypass. Five exact legacy
sources are registered. Changed mode compares the base and current registry and
blocks historical removal or weakening, active boundary expansion, and legacy
source expansion. Explicit active-authority entries containing size/hash
snapshot fields also block.

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
