# Remote Backup Summary

Status: `PASS_REMOTE_BACKUP_RECOVERED`

## Recovery boundary

- Remote backup branch: `backup/pre-file-organization-2026-07-28-r1`
- Remote annotated tag: `pre-file-organization-2026-07-28-r1`
- Branch and peeled tag target: `26e6e13e7b911f4e07c8a2bcbb13d713c690a3f6`
- Force push used: No
- Reachable blobs at or above 100 MB in the sanitized history: 0
- Active 9709 paths in the sanitized history: 0

## Report boundary

- Full-report safety branch: `chore/repository-file-inventory-2026-07-28`
- Immutable-inventory restoration commit: `42aedd26408db1b0a827c4f6ba8eefa39247e0d3`
- Clean public-report base: `174be845167e343a00bd0c6407749c1fd971dfa4`
- Full reports represented by manifest: 23
- Private backup location: Pending

The full reports remain outside the public compact-report commit. They must not be removed from local or remote safety storage before a private backup repository is created and verified.
