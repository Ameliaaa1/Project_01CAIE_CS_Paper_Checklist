# PR-06C Source-of-Truth Audit

Task: `PR06C-R1-PROMOTION-TARGET-MODEL-CONTRACT-REPAIR`

Status: `APPROVED`

Result: `PASS_PR06C_SOURCE_OF_TRUTH_CONTRACT_HUMAN_REVIEW`

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

Generated at: `2026-07-31T08:41:16Z`

Tests cases: `90`

Tests passed: `90`

Tests failed: `0`

Blocking findings: `0`

Baselined findings: `15`

Changed files: `8`

Files deleted: `0`

Files renamed: `0`

Files moved: `0`

Line additions: `992`

Line deletions: `0`

Human review decision: `APPROVE`

Human reviewer: `Amelia Cai`

Human reviewed at: `2026-07-31T08:41:16Z`

## Outcome

The R1 audit repairs the incomplete two-role model without inventing current
authority. `origin/main` has no Candidate, Current Production, or Promotion
Target authority manifest. The repaired contract freezes three independent
future roles and exact paths while keeping all inactive until human approval:

- Candidate: `promotion/candidate/manifest.json`
- Current Production: `promotion/production/manifest.json`
- Promotion Target: `promotion/target/manifest.json`

All locations are `PROPOSED_PENDING_HUMAN_APPROVAL`. No manifest is created in
this phase.

Candidate and Promotion Target must have the same content identity. Current
Production is only a baseline: it must be absent for Bootstrap, must exist for
Update, and is not required to equal the future target.

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
| Promotion Target manifests | 0 |

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
5. Candidate cannot be compared directly to Current Production as
   required-equal content because that would reject valid upgrades.
6. Bootstrap and Update require opposite Current Production presence rules.
7. Candidate must instead match a separate Promotion Target identity.
8. A future manifest must identify an artifact by content, stable identifiers,
   schema, supported scope, and source commit.
9. Stable-ID, scope, and schema hashes require frozen ordering, duplicate,
   encoding, empty-value, and exact-byte rules.

## Safety Boundary

Production changes: 0

Candidate changes: 0

Promotion Target changes: 0

PDF changes: 0

Parser changes: 0

Frontend changes: 0

Runtime behavior changes: 0

Contract evidence changes: 7

Validation registry changes: 1

Promotion execution: 0

## Next Gate

Human review approved the three-role authority model, Bootstrap/Update rules,
schema proposal version 2, exhaustive field matrix, canonical hash rules, and
approval boundary. After this PR is merged, a separate phase may implement the
read-only Promotion Gate Validator. No implementation or promotion execution
is authorized before merge.
