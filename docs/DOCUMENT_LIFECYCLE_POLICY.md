# Document Lifecycle Policy

Status: `CURRENT`

Approval: `APPROVED_BY_HUMAN_REVIEW`

Effective upon merge: `GitHub PR #7`

Reviewer: `Amelia Cai`

Reviewed at: `2026-07-29T16:30:48Z`

Owner: Repository maintainers

Created at: `2026-07-29T15:44:08Z`

Authoritative scope: Repository-wide document lifecycle, status,
authority-transition, and mutability policy. These bytes become authoritative
only when GitHub PR #7 is merged into the default branch.

Related documents:

- [Documentation Standard](DOCUMENTATION_STANDARD.md)
- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Authoritative Document Map](AUTHORITATIVE_DOCUMENT_MAP.md)
- [Archive Index](ARCHIVE_INDEX.md)

## Purpose

This policy separates document lifecycle state from phase execution results
and defines when documents may change, become authoritative, or freeze.

## Allowed Lifecycle States

| Status | Meaning | Modification rule |
| --- | --- | --- |
| `DRAFT` | Work has not completed automated validation | Freely editable within scope |
| `VALIDATED` | Automated checks passed; no human approval yet | Editable; checks must be rerun |
| `READY_FOR_HUMAN_REVIEW` | Evidence is ready for a human decision | Only review-driven corrections |
| `APPROVED` | Human approved the plan or decision | Frozen except approved correction |
| `CURRENT` | Current authoritative documentation | Update only through a reviewed PR |
| `SUPERSEDED` | Replaced by a newer authority | Historical correction only |
| `HISTORICAL` | Completed phase record retained for traceability | Normally frozen |
| `ARCHIVED` | Material is held in the archive | No in-place modification |
| `IMMUTABLE_EVIDENCE` | Audit evidence whose bytes are protected | No modification |
| `BLOCKED` | An unresolved issue prevents progression | Only blocker-resolution edits |

`DONE`, `FINAL`, `OLD`, and `PASS_*` are not lifecycle states. `PASS_*` values
are phase or validation results and must be stored separately.

## Lifecycle

```text
DRAFT
  → VALIDATED
  → READY_FOR_HUMAN_REVIEW
  → APPROVED
  → CURRENT
  → SUPERSEDED
  → HISTORICAL or ARCHIVED
```

Not every report becomes `CURRENT`. Completed execution reports commonly move
from `READY_FOR_HUMAN_REVIEW` or `APPROVED` to `HISTORICAL` or
`IMMUTABLE_EVIDENCE`.

An atomic activation path is also allowed:

```text
READY_FOR_HUMAN_REVIEW
  → human approval recorded
  → CURRENT effective upon merge
```

Automation cannot initiate this path or grant its human approval.

## Transition Authority

| Transition | Who or what authorizes it | Required evidence |
| --- | --- | --- |
| `DRAFT` → `VALIDATED` | Automated validation | Link, schema, authority, hash, and scope checks |
| `VALIDATED` → `READY_FOR_HUMAN_REVIEW` | Task owner after validation | Final generated evidence |
| `READY_FOR_HUMAN_REVIEW` → `APPROVED` | Human reviewer | Reviewer identity, decision, and `reviewedAt` |
| `APPROVED` → `CURRENT` | Human-approved merge | Updated index and authority map |
| `CURRENT` → `SUPERSEDED` | Human-approved replacement PR | Replacement path and commit or PR |
| `SUPERSEDED` → `HISTORICAL` or `ARCHIVED` | Human-approved retention decision | Archive or history index update |
| Any state → `BLOCKED` | Failed required gate | Explicit blocker and recovery condition |

Automation may validate facts but cannot grant human approval.

## Atomic Approval and Activation

A document may move from `READY_FOR_HUMAN_REVIEW` to a final reviewed
`CURRENT` state within the same PR when all of the following are recorded in
the final bytes:

1. the human approval decision;
2. reviewer identity;
3. `reviewedAt`;
4. the exact PR that activates the document;
5. an explicit statement that authority begins only after merge into the
   default branch.

Before merge, the feature-branch copy is approved final content but is not the
repository's active authority. After merge, no follow-up status rewrite is
required.

## Required Transition Metadata

When applicable, record:

- `owner`;
- `createdAt`;
- `generatedAt`;
- `reviewer`;
- `reviewedAt`;
- `supersededBy`;
- `supersededAt`;
- replacement path;
- replacement commit or PR;
- post-merge `verifiedAt`.

Missing metadata must not be invented. Record `PENDING`, `NOT_RUN`, or a
candidate finding until the fact exists.

## Authority Changes

An authority change is atomic. The same PR must:

1. create or approve the replacement document;
2. update `AUTHORITATIVE_DOCUMENT_MAP.md`;
3. update `DOCUMENTATION_INDEX.md`;
4. mark the old source `SUPERSEDED` when appropriate;
5. validate every affected link;
6. obtain human review.

The authority map must not point to a `DRAFT` document. A
`READY_FOR_HUMAN_REVIEW` policy may be listed as a proposed authority only
when its role is explicitly conditional on approval and merge.

## Mutability by Location

| Location or role | Expected lifecycle | Rule |
| --- | --- | --- |
| Root README and current indexes | `CURRENT` | Reviewed updates allowed |
| Proposed standards and plans | `DRAFT` through `APPROVED` | Follow review gates |
| Completed maintenance reports | `HISTORICAL` or `IMMUTABLE_EVIDENCE` | Preserve audit semantics |
| `docs/archive/` | `ARCHIVED` | Never edit in place |
| Hash manifests | `IMMUTABLE_EVIDENCE` after verification | Regenerate only with the protected evidence set |

Directory placement may imply protection for legacy material, but new
documents must also declare an explicit lifecycle status.

## Human Review Gate

Human review must verify:

- naming and status rules are internally consistent;
- validation results were actually executed;
- authority changes do not conflict;
- archive evidence remains immutable;
- rename and move candidates were not executed early;
- generated timestamps and hashes describe final bytes;
- the Git boundary contains only approved paths.

An approval decision records `APPROVED`; it must not be inferred from a green
automated check.

## Supersession

A superseded document must record:

```text
Status: `SUPERSEDED`
Superseded by: <repository-relative path>
Superseded at: <UTC ISO 8601>
Replacement commit or PR: <identifier>
```

Indexes must stop presenting it as current. Historical links may remain when
clearly labeled.

## Historical and Archive Handling

- Completed reports may remain where they are and become `HISTORICAL`.
- Moving a document into `docs/archive/` requires a separately approved
  execution plan.
- Archive content is never modified merely to add new metadata.
- Archive navigation belongs in `ARCHIVE_INDEX.md`.
- A live document may cite archive evidence for history, but not as current
  implementation guidance.

## Legacy Migration

PR-04 freezes policy; it does not rewrite legacy documents. Audit candidates
use:

```text
NO_ACTION
METADATA_ONLY
INDEX_UPDATE
AUTHORITY_REVIEW
RENAME_CANDIDATE
MOVE_CANDIDATE
CONTENT_REVIEW
PROTECTED_NO_CHANGE
```

Only human-approved candidates may enter a later execution phase. Protected
evidence retains its bytes and path. If approved execution candidates total
zero, skip the execution phase and proceed to documentation validation
automation.

## Post-Merge Verification

After a lifecycle-policy PR merges, verification is read-only:

- confirm PR state and merge commit;
- fetch and verify `origin/main`;
- confirm policy, index, authority, and evidence files;
- re-verify protected hashes;
- confirm no archive, code, PDF, Production, or Candidate changes;
- create no recursive closure report.
