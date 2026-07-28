# PR-00 Remote Backup Verification

Status: `PENDING_REMOTE_VERIFICATION`

## Intended remote references

- Branch: `backup/pre-file-organization-2026-07-28-r1`
- Annotated tag: `pre-file-organization-2026-07-28-r1`

The references must point to the final PR-00 recovery commit. This report may be marked successful only after both remote references are queried again and their peeled commit SHA matches the local target.

## Required checks

- [ ] Local branch exists.
- [ ] Local annotated tag exists.
- [ ] Remote branch exists.
- [ ] Remote annotated tag exists.
- [ ] Remote branch SHA matches the local final target.
- [ ] Remote peeled tag SHA matches the local final target.
- [ ] Push completed without force.
- [ ] `git fsck --full` completed.
- [ ] `git diff --check` completed.
- [ ] No reachable blob is at or above 100,000,000 bytes.
- [ ] No `9709` path is reachable from the new backup history.
- [ ] Safety copy remains recoverable.

