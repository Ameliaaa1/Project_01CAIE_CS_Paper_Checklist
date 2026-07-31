# PR-06C Authority Classification

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Source-of-truth audit](PR06C_SOURCE_OF_TRUTH_AUDIT.md)
- [Schema proposal](PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Promotion contract](PR06C_PROMOTION_CONTRACT.md)
- [Human review](PR06C_HUMAN_REVIEW.md)

## Classification Rules

`CURRENT` means an authority exists and is active now.
`PROPOSED_PENDING_HUMAN_APPROVAL` means the path and role are frozen for review
but have no authority yet. Similarity, filename, or historical use is not
enough to assign authority.

The promotion model has three independent roles:

1. Candidate identifies validated proposed content.
2. Current Production identifies the active baseline, if one exists.
3. Promotion Target identifies the exact future Production identity submitted
   for approval.

Candidate and Promotion Target describe the same content identity. Current
Production is a baseline and is never required to equal either of them.

## Inventory Classification

| Artifact | Current classification | Authority status | Reason |
| --- | --- | --- | --- |
| `promotion/candidate/manifest.json` | Future Candidate authority | `PROPOSED_PENDING_HUMAN_APPROVAL` | Exact manifest-first boundary selected by this design |
| `promotion/production/manifest.json` | Future Current Production authority | `PROPOSED_PENDING_HUMAN_APPROVAL` | Read-only baseline for Update; absent during Bootstrap |
| `promotion/target/manifest.json` | Future Promotion Target authority | `PROPOSED_PENDING_HUMAN_APPROVAL` | Exact approved future Production identity; never the active baseline |
| `generated/question-index.json` | Generated derivative | `NOT_AUTHORITY` | Mutating builder output with wall-clock timestamp |
| `public/assets/paperlens-data.js` | Frontend/server delivery artifact | `NOT_AUTHORITY` | Runtime delivery data, not promotion identity |
| `public/textbook_syllabus/pastpaper/**/*.pdf` | Source input | `NOT_AUTHORITY` | Restricted source material and builder input |
| `data/*.json` | Private runtime data | `NOT_AUTHORITY` | Ignored mutable account and billing data |
| `docs/repository-maintenance/**` | Maintenance/historical evidence | `NOT_ARTIFACT_AUTHORITY` | Proves decisions but is not promoted corpus data |
| `.github/workflows/documentation-validation.yml` | Active validation configuration | `NOT_ARTIFACT_AUTHORITY` | Governs documentation checks only |
| `vercel.json`, `.vercelignore`, `api/index.js` | Deployment configuration | `NOT_ARTIFACT_AUTHORITY` | Controls delivery, not artifact identity |

## Candidate Ownership Proposal

Exact path: `promotion/candidate/manifest.json`

Owner: Candidate artifact maintainers

Lifecycle:

```text
DRAFT
-> CANDIDATE_VALIDATED
-> READY_FOR_PROMOTION_REVIEW
-> SUPERSEDED or PROMOTED
```

The manifest identifies one immutable candidate artifact. It does not contain
the artifact payload and cannot authorize a Production write.

## Current Production Ownership Proposal

Exact path: `promotion/production/manifest.json`

Owner: Production artifact maintainers

Lifecycle:

```text
ABSENT
-> PRODUCTION_CURRENT
-> SUPERSEDED

or

PRODUCTION_CURRENT
-> SUPERSEDED
```

Absence is valid only for Bootstrap. During Update, the manifest and referenced
artifact must exist and validate. Only a separately authorized promotion
execution may create or replace this manifest. Validation and review treat it
as read-only.

## Promotion Target Ownership Proposal

Exact path: `promotion/target/manifest.json`

Owner: Promotion contract maintainers

Lifecycle:

```text
DRAFT_TARGET
-> TARGET_VALIDATED
-> READY_FOR_HUMAN_REVIEW
-> APPROVED_FOR_EXECUTION
-> EXECUTED or SUPERSEDED
```

The target is constructed from the validated Candidate identity plus
non-content promotion metadata. It must not overwrite or masquerade as Current
Production. Approval authorizes only the exact target identity and a separate
execution plan.

## Promotion Modes

| Mode | Current Production | Candidate | Promotion Target | Result after separately authorized execution |
| --- | --- | --- | --- | --- |
| Bootstrap | Must be absent | Required and valid | Required; content identity equals Candidate | Target becomes initial Current Production |
| Update | Required and valid | Required and valid | Required; content identity equals Candidate | Target replaces Current Production; prior baseline becomes superseded |

A missing Current Production manifest in Update blocks. An existing Current
Production manifest in Bootstrap blocks. A no-op Update, where the target
content identity equals Current Production, also blocks because no replacement
is necessary.

## Artifact Boundary

Allowed authority payloads are immutable, schema-valid question-corpus
artifacts explicitly referenced by a valid role manifest. Their owner must be
the corresponding Candidate, Production, or Promotion contract maintainer, and
their size, SHA-256, record count, stable-ID set, syllabus scope, and artifact
schema must reproduce.

The following can never become authority by inference:

- generated indexes or caches;
- frontend/server delivery assets;
- source PDFs;
- private runtime or billing data;
- deployment configuration;
- audit, maintenance, or archived documents.

## Supported Scope

The future model permits only syllabus identities `0478` and `9618`. It rejects
`9709` and any unregistered syllabus. Current repository inventory contains
only 0478 tracked PDF and generated-index coverage; this does not waive the
contract requirement for explicit supported scope in each manifest.

## Authority Activation

The proposed paths become design authority only after human approval and merge.
They do not become artifact authority until a later controlled phase creates
valid manifests backed by real artifacts and evidence. This repair creates no
manifest and activates no Candidate, Current Production, or Promotion Target
authority.
