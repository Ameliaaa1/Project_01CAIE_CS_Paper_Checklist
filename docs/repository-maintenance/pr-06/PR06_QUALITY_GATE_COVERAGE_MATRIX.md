# PR-06 Quality Gate Coverage Matrix

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-30T07:09:43Z`

Authoritative scope: NONE

Related documents:

- [PR-06 scope audit](PR06_REPOSITORY_QUALITY_GATE_SCOPE_AUDIT.md)
- [PR-06 human review](PR06_HUMAN_REVIEW.md)
- [Machine-readable coverage matrix](pr06-quality-gate-coverage-matrix.json)
- [Documentation Index](../../DOCUMENTATION_INDEX.md)

## Scope

This matrix classifies the quality gates present at base commit
`11ce82001efb633c1697356c1a510fc0c5034245`. It does not activate a new gate,
modify an audited implementation, or treat archived evidence as a current
control. The machine-readable matrix is the complete per-entry record; the
tables below present the same decision facts for human review.

Discovered entrypoints: `26`

Classified entrypoints: `26`

Unclassified entrypoints: `0`

Required domains: `15`

Domains covered: `15`

## Coverage Summary

| Current status | Count |
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
| **Total** | **26** |

| Risk | Count |
| --- | ---: |
| `P0` | 7 |
| `P1` | 15 |
| `P2` | 4 |
| `P3` | 0 |
| **Total** | **26** |

## Decision Matrix

| Gate ID | Domain / subdomain | Purpose | Current status | Risk | Proposed PR |
| --- | --- | --- | --- | --- | --- |
| `QG-DOC-001` | Documentation Governance / full and changed validation | Metadata, links, authority, evidence, protected history, and baseline rules | `COVERED_STRICT` | P2 | None; retain |
| `QG-DOC-002` | Documentation Governance / evidence lifecycle | Immutable historical bytes and evolvable active authority | `COVERED_STRICT` | P2 | None; complete R1 review |
| `QG-RUNTIME-001` | Application Runtime Entry / server import | Server module import without listener startup | `COVERED_PARTIAL` | P2 | PR-06F |
| `QG-RUNTIME-002` | Application Runtime Entry / browser data load | Browser script order and shared-data global | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-RUNTIME-003` | Application Runtime Entry / static access | Protected-path denial and public asset access | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-DEPLOY-001` | Deployment and Routing / Vercel routing | Static placement and narrow API rewrite | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-DEPLOY-002` | Deployment and Routing / local smoke | Representative local public, API, protected, and PDF routes | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-DEPLOY-003` | Deployment and Routing / production config | Fail closed on missing/weak configuration | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-AUTH-001` | Authentication, Session and Billing / session | Guest, signup, session, forgery, and logout paths | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-BILLING-001` | Authentication, Session and Billing / billing config | Fail closed when Stripe configuration is absent | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-BILLING-002` | Authentication, Session and Billing / webhook | Mock checkout and signature paths | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-AUTH-002` | Authentication, Session and Billing / CSRF and rate limit | Trusted origin and local rate-limit enforcement | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-INDEX-001` | Question Index Build / build and freshness | Build index and establish freshness | `MUTATING_CHECK_NOT_SAFE_FOR_CI` | P1 | PR-06D |
| `QG-INGEST-001` | Parser and Ingestion / PDF-to-question | Split, IDs, ownership, marks, geometry, roles, and trace | `HISTORICAL_EVIDENCE_ONLY` | P0 | PR-06B |
| `QG-CANONICAL-001` | Canonical Completeness / topology and trace | Canonical presence, identity, topology, references, and serialization | `HISTORICAL_EVIDENCE_ONLY` | P0 | PR-06B |
| `QG-STAGING-001` | Staging Boundary / validation-before-promotion | Prevent bypass and stale or unreviewed manifests | `NO_ACTIVE_GATE` | P0 | PR-06B |
| `QG-CANDIDATE-001` | Candidate Integrity / promotion readiness | Candidate schema, identity, blockers, review, and scope | `NO_ACTIVE_GATE` | P0 | PR-06C |
| `QG-PRODUCTION-001` | Production Integrity / identity and rollback | Production integrity, release identity, hashes, and rollback | `NO_ACTIVE_GATE` | P0 | PR-06C |
| `QG-MARKSCHEME-001` | Mark Scheme Boundary / QP-to-MS alignment | Mark-scheme pipeline and QP stable-ID alignment | `HISTORICAL_EVIDENCE_ONLY` | P1 | PR-06B |
| `QG-PDF-001` | PDF and Source Asset Integrity / tracked PDFs | Existence, hashes, duplicates, corruption, pages, and references | `NO_ACTIVE_GATE` | P1 | PR-06E |
| `QG-FRONTEND-001` | Frontend Data Contract / rendering and search | Browser/API shape, numbering, children, PDF access, and search | `COVERED_PARTIAL` | P1 | PR-06F |
| `QG-HYGIENE-001` | Generated and Runtime Data Hygiene / generated output | Prevent stale or unexpected generated index bytes | `MUTATING_CHECK_NOT_SAFE_FOR_CI` | P1 | PR-06D |
| `QG-HYGIENE-002` | Generated and Runtime Data Hygiene / runtime and secrets | Contain stores, environment files, dependencies, and local paths | `COVERED_MANUAL` | P0 | PR-06A |
| `QG-SAFETY-001` | Repository Safety Boundary / change governance | Backup, protected evidence, PR scope, review, and merge policy | `COVERED_MANUAL` | P2 | PR-06A |
| `QG-SYLLABUS-001` | Repository Safety Boundary / syllabus | Allow 0478/9618 and reject deprecated 9709 | `HISTORICAL_EVIDENCE_ONLY` | P0 | PR-06C |
| `QG-ENTRYPOINT-001` | Application Runtime Entry / serverless API | Serverless adapter and narrow routing behavior | `COVERED_PARTIAL` | P1 | PR-06F |

## Entrypoints, Commands, and Mutability

| Gate ID | Entrypoint | Command | Files read | Files written | Mutability |
| --- | --- | --- | --- | --- | --- |
| `QG-DOC-001` | validator, its tests, documentation workflow | `test:documentation-validation`; full/changed validation | README, docs, Git metadata | None | `READ_ONLY` |
| `QG-DOC-002` | lifecycle registry, validator, lifecycle tests | documentation tests and full/changed validation | lifecycle classes, historical bytes, active paths | None | `READ_ONLY` |
| `QG-RUNTIME-001` | server-entrypoint test; server | `test:server-entrypoint` | server | None | `READ_ONLY` |
| `QG-RUNTIME-002` | browser-data test; browser scripts | `test:browser-data-load` | browser data and app scripts | None | `READ_ONLY` |
| `QG-RUNTIME-003` | static-access test; server | `test:static-access` | server and public assets | None | `READ_ONLY` |
| `QG-DEPLOY-001` | Vercel routing test; Vercel config | `test:vercel-routing` | config and public paths | None | `READ_ONLY` |
| `QG-DEPLOY-002` | deployment-smoke test; server | `test:deployment-smoke` | server, public files, generated index | None | `READ_ONLY` |
| `QG-DEPLOY-003` | production-config test; server | `test:production-config` | server | None | `READ_ONLY` |
| `QG-AUTH-001` | auth-session test; server | `test:auth-session` | server and index | OS temporary DATA_DIR | `WRITES_RUNTIME_DATA` |
| `QG-BILLING-001` | billing-config test; server | `test:billing-config` | server | OS temporary DATA_DIR | `WRITES_RUNTIME_DATA` |
| `QG-BILLING-002` | billing-webhook test; server | `test:billing-webhook` | server | OS temporary DATA_DIR | `WRITES_RUNTIME_DATA` |
| `QG-AUTH-002` | rate-CSRF test; server | `test:rate-csrf` | server | OS temporary DATA_DIR | `WRITES_RUNTIME_DATA` |
| `QG-INDEX-001` | index builder; generated index | `build:question-index` (`NOT_RUN`) | all tracked past-paper PDFs | generated index | `WRITES_GENERATED_ARTIFACT` |
| `QG-INGEST-001` | archived full-corpus plan | None current | Historical parser inputs described by evidence | None in audit | `READ_ONLY` |
| `QG-CANONICAL-001` | archived canonical validation plan | None current | Historical canonical inputs described by evidence | None in audit | `READ_ONLY` |
| `QG-STAGING-001` | PR-02A protected inventory | None current | Historical staging inventory | None | `READ_ONLY` |
| `QG-CANDIDATE-001` | PR-02A protected inventory | None current | Historical Candidate inventory | None | `READ_ONLY` |
| `QG-PRODUCTION-001` | PR-02A protected inventory | None current | Historical Production and rollback inventory | None | `READ_ONLY` |
| `QG-MARKSCHEME-001` | PR-02A PR reconciliation | None current | Historical mark-scheme references | None | `READ_ONLY` |
| `QG-PDF-001` | tracked past-paper directory | None current (`NOT_RUN`) | 196 tracked PDFs | None | `READ_ONLY` |
| `QG-FRONTEND-001` | browser/auth tests; app; server | browser and auth tests | app, data, server, index | OS temporary DATA_DIR | `WRITES_RUNTIME_DATA` |
| `QG-HYGIENE-001` | builder; index; ignore rules | `build:question-index` (`NOT_RUN`) | PDFs and ignore rules | generated index | `WRITES_GENERATED_ARTIFACT` |
| `QG-HYGIENE-002` | ignore rules; auth test; server | manual `git status --short --ignored` | ignore rules, server, worktree metadata | Runtime stores outside audit | `WRITES_RUNTIME_DATA` |
| `QG-SAFETY-001` | backup evidence; lifecycle policy; workflow | `git diff --check`; name-status review | Git history, baseline, policy | None | `READ_ONLY` |
| `QG-SYLLABUS-001` | PR-02A topology and exclusion evidence | None current | Historical active-scope inventory | None | `READ_ONLY` |
| `QG-ENTRYPOINT-001` | API adapter; entrypoint/routing tests | server-entrypoint and routing tests | API adapter, server, Vercel config | None | `READ_ONLY` |

All command sources are either `package.json`, the current workflow, or the
explicit manual audit procedure. Every listed repository entrypoint exists at
the audited base. Commands marked `NOT_RUN` have a reason in the
machine-readable matrix.

## Wiring and Contract Facts

`QG-DOC-001` and `QG-DOC-002` are in package scripts, `npm test`, and GitHub
Actions; they have failure-path tests, full and changed modes, deterministic
read-only output, a baseline or lifecycle registry, and explicit exit codes.

The 12 `COVERED_PARTIAL` rows are in package scripts and `npm test`, and are
therefore invoked by the current workflow. They do not have full-corpus or
changed-mode coverage for their product domains. Runtime-store tests write only
to an OS temporary `DATA_DIR`, then remove it. They are not read-only at the
process level even though they leave repository bytes unchanged.

The four historical-only rows and four no-active-gate rows are not wired to
package scripts, `npm test`, or Actions. They have no current exit-code
contract, full-corpus claim, changed mode, or deterministic-output claim.
Human review is required.

The two generated-index rows share one mutating command. The builder writes
`generated/question-index.json` and embeds `new Date().toISOString()`. It was
not executed during PR-06, so determinism and freshness are not claimed.

## Evidence and Limitations

- Documentation: current validator, 84-test suite, lifecycle registry,
  workflow, and unchanged PR-05 report.
- Runtime/deployment/security: 10 focused test files plus the serverless entry
  adapter. These are local or mocked checks, not deployed-environment proof.
- Parser/Canonical: immutable archived plans describe intended and historical
  checks; current tracked parser and canonical implementations are absent.
- Staging/Candidate/Production/Mark Scheme: PR-02A inventories retain paths and
  relationships, but no active executable gate exists on current `main`.
- PDF: 196 tracked source PDFs exist; the local deployment smoke samples one.
- Syllabus: supported scope is 0478 and 9618 and deprecated scope is 9709.
  Historical evidence records active 9709 paths as zero; no current automated
  gate prevents re-entry.
- Repository safety: backup and lifecycle evidence plus manual Git-boundary
  review exist, but external branch-protection state is not repository code.

## Required Field Closure

For every `gateId`, the paired JSON records `domain`, `subdomain`, `purpose`,
`entrypoint`, `command`, `filesRead`, `filesWritten`, `mutability`,
`currentStatus`, `inPackageScripts`, `inNpmTest`, `inGitHubActions`,
`failurePathTested`, `fullCorpusCoverage`, `changedModeCoverage`,
`deterministicOutput`, `exitCodeContract`, `baselineUsed`,
`humanReviewRequired`, `currentEvidence`, `knownLimitations`, `riskLevel`,
`recommendedNextAction`, `proposedImplementationPR`, `scopeOwner`, and
`reviewStatus`. It also records execution disposition and the reason for every
command not run.

## Frozen Recommendation

Recommended first implementation target:
`Candidate-to-Production Promotion Gate` (`PR-06C`).

Dependency status: `WAITING_FOR_PR06-R1_HUMAN_REVIEW`.

It addresses Candidate, Production, and syllabus P0 gaps at the required
pre-promotion boundary. The implementation must remain one bounded,
read-only gate and must not start until human review explicitly approves the
target.
