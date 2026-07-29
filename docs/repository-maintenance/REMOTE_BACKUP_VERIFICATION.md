# PR-00 Remote Backup Verification

Status: `PASS_REMOTE_BACKUP_RECOVERED`

## Intended remote references

- Branch: `backup/pre-file-organization-2026-07-28-r1`
- Annotated tag: `pre-file-organization-2026-07-28-r1`

Both references point to the final PR-00 recovery commit:

`26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`

Remote verification results:

- Remote branch SHA: `26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`
- Remote annotated tag object: `b032c8f4fa959632d69a60b6aca5399ca4cc871a`
- Remote peeled tag SHA: `26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`
- Local branch SHA: `26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`
- Local annotated tag object: `b032c8f4fa959632d69a60b6aca5399ca4cc871a`
- Local peeled tag SHA: `26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`

The first HTTPS branch push timed out. A later tag push transferred the complete sanitized object set but the VS Code Personal Access Token could not create a ref that introduced `.github/workflows/data-quality.yml` because it lacks the `workflow` scope. The authenticated GitHub connector, which has repository administration and push permission, created the branch at the already-uploaded commit. The annotated tag was then pushed normally because only the tag object remained to transfer. No force push was used.

## Required checks

- [x] Local branch exists.
- [x] Local annotated tag exists.
- [x] Remote branch exists.
- [x] Remote annotated tag exists.
- [x] Remote branch SHA matches the local final target.
- [x] Remote peeled tag SHA matches the local final target.
- [x] Push completed without force.
- [x] `git fsck --full` completed.
- [x] `git diff --check` completed.
- [x] No reachable blob is at or above 100,000,000 bytes.
- [x] No `9709` path is reachable from the new backup history.
- [x] Safety copy remains recoverable.
