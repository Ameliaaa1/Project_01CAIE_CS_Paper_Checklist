# PR History Index

Status: `CURRENT_PR_HISTORY_NAVIGATION`

This index maps the repository-maintenance lifecycle from PR-00 through
PR-02B. “Main merge commit” is `N/A` when a phase intentionally remained on a
backup branch or was represented on `main` only by a later compact summary.

| Phase | Date | Purpose | Status | Main merge commit | Primary evidence |
| --- | --- | --- | --- | --- | --- |
| PR-00 | 2026-07-28 | Rescue local large objects, sanitize unpushed history, and recover a pushable backup boundary | `PASS_REMOTE_BACKUP_RECOVERED` | N/A — preserved at backup ref `26e6e13` | [Remote Backup Summary](repository-maintenance/public/REMOTE_BACKUP_SUMMARY.md) |
| PR-01 | 2026-07-28 | Inventory, hash, reference-analyze, duplicate-analyze, and classify repository files | `PASS_FILE_INVENTORY_READY_FOR_HUMAN_REVIEW` | N/A — full inventory retained on safety refs | [File Inventory Summary](repository-maintenance/public/FILE_INVENTORY_SUMMARY.md) |
| PR-01A | 2026-07-29 | Apply human decisions and publish a compact, secret-safe inventory decision boundary | `PASS_CLEAN_REPORT_BOUNDARY_READY_FOR_PR` | `23f2d147d38e44417a55f28ede8d2bd66a71e01b` (GitHub PR #1) | [File Decision Summary](repository-maintenance/public/FILE_DECISION_SUMMARY.md), [Secret Review Summary](repository-maintenance/public/SECRET_REVIEW_SUMMARY.md) |
| PR-01B | 2026-07-29 | Verify the private backup repository and release assets for full reports and large JSON evidence | `PASS_PRIVATE_BACKUP_REPOSITORY_AND_RELEASE_VERIFIED` | `99159cf24a1baa56a9eb964d41daff555f322b87` (GitHub PR #2) | [Private Backup Verification](repository-maintenance/public/PRIVATE_BACKUP_VERIFICATION.md) |
| PR-02A | 2026-07-29 | Freeze documentation archive topology, human decisions, move plan, exclusions, and reference policy | `PASS_DOCUMENT_ARCHIVE_MOVE_PLAN_READY_FOR_EXECUTION` | `f70320efce833fff843e5994433b23f6be203ec3` (GitHub PR #3) | [Document Move Plan](repository-maintenance/pr-02a/DOCUMENT_MOVE_PLAN.md), [Human Review](repository-maintenance/pr-02a/PR02A_HUMAN_REVIEW.md) |
| PR-02B | 2026-07-29 | Execute 15 approved untracked historical-document transfers and verify post-merge closure | `PASS_PR02B_R4_READ_ONLY_TERMINATION_CONFIRMED` | Execution: `c18f74919bd78d38bee0ff2d53ac422a2443da6b` (GitHub PR #4); closure: `72dea261c2e82f2b88c3a4b36ffe2256bc210658` (GitHub PR #5) | [Execution Report](repository-maintenance/pr-02b/PR02B_EXECUTION_REPORT.md), [Post-Merge Verification](repository-maintenance/pr-02b/PR02B_POST_MERGE_VERIFICATION_REPORT.md) |

## Phase Relationships

```text
PR-00 pushability recovery
  └── PR-01 inventory and classification
      ├── PR-01A human decisions and compact public boundary
      └── PR-01B private full-evidence backup
          └── PR-02A archive topology and frozen move plan
              └── PR-02B approved execution and post-merge closure
                  └── PR-03 documentation index reconstruction
```

## Related Navigation

- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Archive Index](ARCHIVE_INDEX.md)
- [Authoritative Document Map](AUTHORITATIVE_DOCUMENT_MAP.md)

This page is the authority for lifecycle navigation, not for the detailed
claims inside each phase. Follow the primary evidence links for those claims.
