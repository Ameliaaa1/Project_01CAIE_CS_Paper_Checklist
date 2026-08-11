# Authoritative Document Map

Status: `CURRENT`

Owner: Repository maintainers

Created at: `2026-07-29T14:50:58Z`

Authoritative scope: Assignment of one authoritative source to each tracked
documentation subject.

Related documents:

- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Documentation Standard](DOCUMENTATION_STANDARD.md)
- [Document Lifecycle Policy](DOCUMENT_LIFECYCLE_POLICY.md)

This map assigns one authoritative source to each information subject. A
historical or archive document may provide context, but it does not override
the authority named here.

| Information subject | Authoritative source | Role |
| --- | --- | --- |
| Project identity, current capabilities, startup, deployment, and project structure | [README](../README.md) | Current active documentation |
| Executable npm commands and dependency declarations | [package.json](../package.json) | Machine-readable development authority |
| Documentation navigation and classification | [Documentation Index](DOCUMENTATION_INDEX.md) | Primary documentation entry |
| Repository-maintenance lifecycle navigation | [PR History Index](PR_HISTORY_INDEX.md) | Completed-phase navigation authority |
| Archived historical document navigation | [Archive Index](ARCHIVE_INDEX.md) | Archive navigation authority |
| Documentation authority ownership | This document | Authority-assignment source |
| Documentation naming, metadata, linking, and evidence format | [Documentation Standard](DOCUMENTATION_STANDARD.md) | Current policy authority; effective upon merge of GitHub PR #7 |
| Document lifecycle, status transitions, authority changes, and mutability | [Document Lifecycle Policy](DOCUMENT_LIFECYCLE_POLICY.md) | Current lifecycle authority; effective upon merge of GitHub PR #7 |
| Documentation validation commands, rule IDs, and baseline governance | [Documentation Validation](DOCUMENTATION_VALIDATION.md) | Approved operational authority; effective when GitHub PR #8 merges |
| Pushability rescue and public remote backup boundary | [Remote Backup Summary](repository-maintenance/public/REMOTE_BACKUP_SUMMARY.md) | PR-00 summary authority |
| Repository inventory snapshot and original classifications | [File Inventory Summary](repository-maintenance/public/FILE_INVENTORY_SUMMARY.md) | PR-01 public inventory authority |
| Applied file decisions and protected/deferred counts | [File Decision Summary](repository-maintenance/public/FILE_DECISION_SUMMARY.md) | PR-01A decision authority |
| Secret-review public conclusion | [Secret Review Summary](repository-maintenance/public/SECRET_REVIEW_SUMMARY.md) | PR-01A secret-review authority |
| Private report and large-object backup verification | [Private Backup Verification](repository-maintenance/public/PRIVATE_BACKUP_VERIFICATION.md) | PR-01B verification authority |
| Approved documentation move set and frozen execution rules | [Document Move Plan](repository-maintenance/pr-02a/DOCUMENT_MOVE_PLAN.md) | PR-02A execution-plan authority |
| PR-02A human approvals | [PR-02A Human Review](repository-maintenance/pr-02a/PR02A_HUMAN_REVIEW.md) | Human-decision authority |
| PR-02B archive execution outcome | [PR-02B Execution Report](repository-maintenance/pr-02b/PR02B_EXECUTION_REPORT.md) | Execution authority |
| PR-02B post-merge archive verification | [PR-02B Post-Merge Verification Report](repository-maintenance/pr-02b/PR02B_POST_MERGE_VERIFICATION_REPORT.md) | Merged-state verification authority |
| PR-03 index reconstruction validation | [PR-03 Documentation Index Report](repository-maintenance/pr-03/PR03_DOCUMENTATION_INDEX_REPORT.md) | Index-reconstruction evidence authority |
| PR-06D Bootstrap package generation and dry-run review outcome | [PR-06D Bootstrap Package Implementation Report](repository-maintenance/pr-06d/PR06D_BOOTSTRAP_PACKAGE_IMPLEMENTATION_REPORT.md) | Candidate and Promotion Target review-package evidence authority; no Current Production authority |
| PR-06D merged-state package integrity and safety outcome | [PR-06D Post-Merge Read-Only Verification Report](repository-maintenance/pr-06d-post-merge/PR06D_POST_MERGE_READ_ONLY_VERIFICATION_REPORT.md) | Post-merge verification evidence authority; no Promotion execution authority |

## Authority Rules

1. A source is authoritative only for the subject in its row.
2. Machine-readable configuration is authoritative for executable behavior
   when prose and configuration differ.
3. Completed plans and reports retain their recorded status but do not define
   current product behavior.
4. Files under `docs/archive/` are immutable historical evidence.
5. A later PR may change authority only by updating this map and all affected
   navigation in the same reviewed change.
6. A source marked `CURRENT` with an `Effective upon merge` condition is not
   active authority until the named PR reaches the merged state on the default
   branch.

## Known Documentation Gaps

- No dedicated current architecture guide is tracked; the README project
  structure remains authoritative.
- No dedicated development guide is tracked; README workflows and
  `package.json` scripts remain authoritative.

These are explicit gaps, not invitations to use archived plans as current
authority. A later reviewed change may introduce dedicated architecture or
development documentation without changing historical evidence.
