# PR-06-R1 Human Review

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-30T08:38:25Z`

Authoritative scope: NONE

Related documents:

- [R1 lifecycle report](PR06_R1_ACTIVE_EVIDENCE_LIFECYCLE_REPORT.md)
- [R1 migration matrix](PR06_R1_MIGRATION_MATRIX.md)
- [Machine-readable R1 report](pr06-r1-active-evidence-lifecycle-report.json)
- [R1A human review](../pr-06-r1a/PR06_R1A_HUMAN_REVIEW.md)

## Decision

Human review decision: `PENDING`

Approved first implementation target: `PENDING`

Approved implementation PR: `PENDING`

PR-06C status: `WAITING_FOR_PR06-R1A_HUMAN_REVIEW`

## Required Review

- [ ] PR-05 report Markdown and JSON bytes are unchanged from `origin/main`.
- [ ] Historical evidence still blocks on missing file, size, or SHA-256.
- [ ] Active authority is validated by current rules/tests/CI, not stale hashes.
- [ ] Only registered legacy sources can omit `evidenceClass`.
- [ ] New missing and invalid `evidenceClass` values block.
- [ ] Active authority marked `historical` blocks.
- [ ] The migration matrix covers all 33 PR-05 evidence entries.
- [ ] Validator tests pass 90/90 and rule closure passes 49/49.
- [ ] Full and changed documentation validation pass.
- [ ] No Production, Candidate, PDF, parser runtime, question-data, frontend,
  package, workflow, or PR-05 historical file changed.
- [ ] PR-06C has not started.

## Samples

| Class | Sample | Expected | Review |
| --- | --- | --- | --- |
| Historical | PR-05 Markdown report | Size/hash enforced | `PENDING` |
| Active authority | `docs/DOCUMENTATION_INDEX.md` | Current validation, no stale snapshot block | `PENDING` |
| Missing class | `missing-evidence-class` fixture | `DOC-EVIDENCE-009` | `PENDING` |
| Invalid class | `invalid-evidence-class` fixture | `DOC-EVIDENCE-010` | `PENDING` |
| Class conflict | `active-marked-historical` fixture | `DOC-EVIDENCE-011` | `PENDING` |

## Approval Format

```text
PASS_PR06_R1_ACTIVE_DOCUMENTATION_EVIDENCE_LIFECYCLE_HUMAN_REVIEW
Reviewer: Amelia Cai
Decision: APPROVE
Approved first implementation target: <exact target or NONE>
Approved implementation PR: <exact PR label or NONE>
```

Until a human records that decision, PR #9 remains Draft and PR-06C remains
blocked.
