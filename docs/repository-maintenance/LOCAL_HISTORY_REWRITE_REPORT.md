# PR-00 Local History Rewrite Report

## Scope

This task repairs only local history that never existed in any `origin` ref. It does not rewrite or force-push remote history and does not perform repository organization.

## Verified boundary

- Original local HEAD: `37de7eee98e1a9087f65e3441992a011b45ba339`
- Origin default-branch HEAD: `174be845167e343a00bd0c6407749c1fd971dfa4`
- Merge base: `174be845167e343a00bd0c6407749c1fd971dfa4`
- Local-only commits before repair: 1
- Original HEAD reachable from origin refs: No
- Large blobs reachable from origin history: 0

## Safety copy

- Location: `/Users/amelia/Desktop/Workspace/workspace/Project_01CAIE_CS_Paper_Checklist_safety_backup_2026-07-28`
- Includes `.git`, tracked files, modified files, deleted working-tree state, untracked files, ignored files, local branches, local tags, and `node_modules`.
- `node_modules` was included explicitly: approximately 403 MiB and 6,611 files at the pre-copy inventory.
- Source and backup contained 22,476 files after synchronization.
- A dry-run synchronization comparison reported zero differences.
- HEAD, branch, tag target, and sampled SHA-256 values matched.

## Rewrite method

The replacement tree was constructed with a separate temporary Git index. No checkout, hard reset, clean, stash, or force push was used.

The replacement commit preserves the intended local commit on top of `origin/main`, excluding:

- all `9709` paths;
- all blobs at or above 100,000,000 bytes;
- large debug/evidence/log blobs at or above 50,000,000 bytes.

The first sanitized replacement commit is:

`64f7fa31f105c3df3329322c6843e12fd238f5fd`

Its largest blob is 48,817,539 bytes. It contains zero `9709` paths and zero blobs at or above 100,000,000 bytes.

The complete removed-blob list, content SHA-256 values, paths, original commits, and ref reachability are recorded in:

- `large-object-inventory.json`
- `LARGE_OBJECT_INVENTORY.md`

The original objects remain recoverable from the complete safety copy and the renamed local-invalid references.

## Worktree protection

The authoritative pre-rewrite snapshot is:

- `pre-rewrite-worktree-inventory.json`
- `PRE_REWRITE_WORKTREE_INVENTORY.md`

The snapshot contains 11,298 entries: 389 unstaged tracked changes, 4,233 untracked files, and 6,676 ignored files. The report files themselves were created after the snapshot and are intentionally not self-inventoried.

## Status

Remote push and final worktree recovery verification are recorded separately in `REMOTE_BACKUP_VERIFICATION.md`.
