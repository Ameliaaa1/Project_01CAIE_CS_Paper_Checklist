# File Classification Decision Log

Snapshot: 2026-07-28T13:22:11.278Z

Status: `PASS_FILE_INVENTORY_READY_FOR_HUMAN_REVIEW`

No move, deletion, compression, Release upload, or bulk project-file commit was performed.

## KEEP_ACTIVE (1116)

- 690 — Current candidate or audit-chain evidence; retain until a human proves supersession and closure.
- 245 — Active source, test, schema, configuration, or operational script.
- 97 — Audit-chain evidence retained conservatively.
- 66 — Authoritative production/runtime index role; no move or deletion is allowed in PR-01.
- 18 — Runtime/static/generated data path may be consumed by the application; retain until reference checks are reviewed.

## CONSOLIDATE_AND_ARCHIVE (11453)

- 7927 — Historical generated evidence should be indexed before any later archive action.
- 3526 — Historical PR/phase material should be indexed and archived without destroying the original.

## ARCHIVE_AS_GITHUB_RELEASE_ASSET (46)

- 46 — Large evidence/debug artifact is unsuitable for normal Git; secret/copyright review is required before release upload.

## DELETE_AFTER_VERIFIED_BACKUP (6578)

- 52 — Editor/OS/cache/runtime output; backed up and normally regenerable.
- 6526 — Installed dependency artifact reproducible from package lock; safety backup exists.

## REVIEW_REQUIRED (1135)

- 24 — Potential credential/private-data signal; retain locally and review before any upload.
- 135 — Deprecated 9709 scope; keep out of the active repository and require a human archival/deletion decision.
- 13 — Role or supersession cannot be proven automatically; retain for human review.
- 475 — Runtime log may contain unique audit evidence or sensitive data; retain until human review proves reproducibility and safe handling.
- 488 — Past-paper PDF may have copyright/public-repository constraints; retain without upload or deletion.

All deletion candidates now contain an explicit replacement/non-project relationship. Logs are retained as `REVIEW_REQUIRED` rather than assumed reproducible.

File-level reasons, replacements, archive destinations, references, roles, and evidence fields are in `file-inventory.json`.
