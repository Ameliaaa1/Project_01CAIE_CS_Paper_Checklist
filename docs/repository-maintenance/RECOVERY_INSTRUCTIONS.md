# PR-00 Recovery Instructions

## Complete filesystem recovery

The complete pre-rewrite repository is stored at:

`/Users/amelia/Desktop/Workspace/workspace/Project_01CAIE_CS_Paper_Checklist_safety_backup_2026-07-28`

This directory is a standalone copy containing the original `.git` directory and the complete working tree, including ignored and untracked files. Do not delete it until the repository organization phase has completed and its own recovery gate has passed.

## Original local history

The rejected original commit is:

`37de7eee98e1a9087f65e3441992a011b45ba339`

It is retained under local-only invalid-history references:

- Branch: `local-invalid/pre-file-organization-2026-07-28`
- Tag: `local-invalid-pre-file-organization-2026-07-28`

These references must not be pushed because their history contains GitHub-incompatible large blobs and deprecated `9709` content.

## Recover one removed object

Use the `blob` and `sha256` fields in `large-object-inventory.json` to identify the required object. Read or export it from the safety-copy repository, then verify its SHA-256 against the inventory before using it.

## Recover the whole pre-rewrite state

1. Stop all writes to the active repository.
2. Preserve the active repository under a new name.
3. Copy the safety backup to a new recovery directory.
4. Verify the recovered HEAD is `37de7eee98e1a9087f65e3441992a011b45ba339`.
5. Compare `git status --porcelain` with the pre-rewrite worktree inventory.
6. Verify sampled files and large blobs against their recorded SHA-256 values.

Never force-push the invalid history to GitHub.
