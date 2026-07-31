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

## Inventory Classification

| Artifact | Current classification | Authority status | Reason |
| --- | --- | --- | --- |
| `promotion/candidate/manifest.json` | Future Candidate authority | `PROPOSED_PENDING_HUMAN_APPROVAL` | Exact manifest-first boundary selected by this design |
| `promotion/production/manifest.json` | Future Production authority | `PROPOSED_PENDING_HUMAN_APPROVAL` | Exact manifest-first boundary selected by this design |
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

## Production Ownership Proposal

Exact path: `promotion/production/manifest.json`

Owner: Production artifact maintainers

Lifecycle:

```text
PRODUCTION_CURRENT
-> SUPERSEDED
```

Only a separately authorized promotion execution may create or replace this
manifest. The validation phase must treat it as read-only.

## Supported Scope

The future model permits only syllabus identities `0478` and `9618`. It rejects
`9709` and any unregistered syllabus. Current repository inventory contains
only 0478 tracked PDF and generated-index coverage; this does not waive the
contract requirement for explicit supported scope in each manifest.

## Authority Activation

The proposed paths become design authority only after human approval and merge.
They do not become artifact authority until a later controlled phase creates
valid manifests backed by real artifacts and evidence.
