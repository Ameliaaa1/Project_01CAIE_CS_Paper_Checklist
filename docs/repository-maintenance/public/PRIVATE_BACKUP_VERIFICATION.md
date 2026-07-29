# PR-01B Private Backup Verification

Status: `PASS_PRIVATE_BACKUP_REPOSITORY_AND_RELEASE_VERIFIED`

## Private backup target

- Repository: `Ameliaaa1/caie-parser-private-backup` (private)
- Release tag: `repository-maintenance-backup-2026-07-29`
- Release URL: https://github.com/Ameliaaa1/caie-parser-private-backup/releases/tag/repository-maintenance-backup-2026-07-29
- Release state: published (`draft=false`)
- Published at: `2026-07-29T04:29:49Z`

## Frozen scope

- Full maintenance reports: 23 assets (47,168,296 bytes)
- Large JSON candidates: 46 copies deduplicated to 25 unique assets (4,614,979,019 bytes)
- Total: 48 assets (4,662,147,315 bytes)
- Largest asset: `LARGE_JSON_94393FBFCD3F` / `output-continuous-operation-snapshots-evidence-94393fbfcd3f.json` (345,148,239 bytes)

## Verification result

All 48 local assets passed size and SHA-256 verification before upload. The published private Release was then listed independently through the authenticated GitHub Asset API and contained exactly 48 uniquely named assets. Every remote asset reported `state=uploaded`, the expected byte size, and the expected GitHub server SHA-256 digest.

- `FULL_BYTE_READBACK_SHA256`: 20 assets were downloaded byte-for-byte and hashed locally after upload.
- `GITHUB_ASSET_API_SERVER_DIGEST`: 28 assets were read back through the authenticated Asset API and checked against GitHub's server-computed `sha256` digest.
- Final remote count, state, size, and digest gate: `PASS_48_OF_48`.
- The 23 original report SHA-256 values in `full-report-manifest.json` are unchanged.
- Every manifest entry now has a unique `artifactId`, a `format`, and its actual private Release asset URL.

The complete per-asset evidence is recorded in `private-backup-verification.json`. It includes artifact ID, format, size, SHA-256, private asset URL, verification method, and result without local absolute paths or secret material.

## Scope guardrails

- No secret value was read into or written to these reports.
- The safety backup was not modified.
- No local file was deleted.
- No project file was moved or archived.
- PR-02 was not started.
