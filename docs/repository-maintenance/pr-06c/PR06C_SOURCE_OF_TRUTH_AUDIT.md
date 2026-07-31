# PR-06C Source-of-Truth Audit

Task: `PR-06C-SOURCE-OF-TRUTH-CONTRACT`

Status: `READY_FOR_HUMAN_REVIEW`

Result: `READY_PR06C_SOURCE_OF_TRUTH_CONTRACT_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Authority classification](PR06C_AUTHORITY_CLASSIFICATION.md)
- [Schema proposal](PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Promotion contract](PR06C_PROMOTION_CONTRACT.md)
- [Risk assessment](PR06C_RISK_ASSESSMENT.md)
- [Human review](PR06C_HUMAN_REVIEW.md)
- [Machine-readable report](pr06c-source-of-truth-contract-report.json)

Base SHA: `12f10e88842ba736888db5f00ed6ae5334874d4d`

Validated implementation SHA: `PENDING`

Final PR head SHA: `PENDING`

Initial audit generated at: `2026-07-31T01:46:17Z`

Generated at: `2026-07-31T06:47:34Z`

Tests cases: `90`

Tests passed: `90`

Tests failed: `0`

Blocking findings: `0`

Baselined findings: `15`

Changed files: `8`

Files deleted: `0`

Files renamed: `0`

Files moved: `0`

Line additions: `692`

Line deletions: `0`

Human review decision: `PENDING`

## Outcome

The audit resolves the design ambiguity without inventing a current
Candidate/Production pair. `origin/main` has no Candidate authority manifest
and no Production authority manifest. The contract therefore freezes two
future, exact manifest locations while keeping both inactive until human
approval:

- Candidate: `promotion/candidate/manifest.json`
- Production: `promotion/production/manifest.json`

Both locations are `PROPOSED_PENDING_HUMAN_APPROVAL`. Neither file is created
in this phase.

## Repository Baseline

| Measure | Observed |
| --- | ---: |
| Tracked files | 329 |
| Tracked PDFs | 196 |
| Tracked generated files | 1 |
| Tracked public files | 207 |
| Runtime/data entry files | 4 |
| Validation/workflow files | 44 |
| Deployment configuration files | 3 |
| Candidate manifests | 0 |
| Production manifests | 0 |

The 196 tracked PDFs all have `0478` filenames. The current generated question
index contains 95 papers and 833 entries, all with syllabus identity
`caie-igcse-0478`. This is repository inventory evidence, not a declaration
that the index is Candidate authority.

## Current Artifacts

| Path or class | Evidence | Classification |
| --- | --- | --- |
| `public/textbook_syllabus/pastpaper/**/*.pdf` | Inputs read by the index builder; 196 tracked PDFs | Source input, not Candidate |
| `generated/question-index.json` | Written by `npm run build:question-index`; includes wall-clock `generatedAt` | Generated derivative |
| `public/assets/paperlens-data.js` | Loaded by browser, server, and build script | Frontend/server delivery artifact |
| `data/*.json` | Ignored runtime user, checkout, and purchase data | Private runtime data |
| `docs/repository-maintenance/**` | Audit and lifecycle evidence | Historical or maintenance evidence |
| Vercel config and environment variables | Deployment configuration, not corpus identity | Deployment boundary |

## Evidence-Based Decisions

1. `generated/question-index.json` cannot be Candidate authority because the
   repository documents it as generated output and its builder embeds time.
2. `public/assets/paperlens-data.js` cannot be Production authority because it
   is application delivery data with a different structure and ownership.
3. Archived plans cannot establish current authority; the archive index
   expressly forbids that inference.
4. Dirty or untracked files in another worktree are not evidence for
   `origin/main` authority and were excluded.
5. A future manifest must identify an artifact by content, stable identifiers,
   schema, supported scope, and source commit.

## Safety Boundary

Production changes: 0

Candidate changes: 0

PDF changes: 0

Parser changes: 0

Frontend changes: 0

Runtime behavior changes: 0

Historical evidence changes: 0

Promotion execution: 0

## Next Gate

Human review must approve the exact authority paths, schema proposal, equality
rules, allowed-difference matrix, and approval boundary. Only then may a
separate phase implement a read-only promotion validator.
