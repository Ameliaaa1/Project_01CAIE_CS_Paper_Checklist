# PR-06D Post-Merge Read-Only Verification Report

Status: `APPROVED`

Result: `PASS_PR06D_POST_MERGE_READ_ONLY_VERIFICATION_HUMAN_REVIEW`

Owner: Promotion package maintainers

Created at: `2026-08-11T12:20:54Z`

Authoritative scope: Verification of the merged PR-06D package and safety boundary only; no Promotion execution authority

Related documents:

- [Human review worksheet](PR06D_POST_MERGE_HUMAN_REVIEW.md)
- [Git history report](pr06d-post-merge-git-history-report.json)
- [Package integrity report](pr06d-post-merge-package-integrity-report.json)
- [Contract validation report](pr06d-post-merge-contract-validation-report.json)
- [Safety report](pr06d-post-merge-safety-report.json)
- [Approved PR-06D review](../pr-06d/PR06D_HUMAN_REVIEW.md)

## Merged boundary

- Repository: `Ameliaaa1/Project_01CAIE_CS_Paper_Checklist`
- Verified branch source: `origin/main`
- Merge commit: `2ecbf7a3ffc08d7e1bff7a579a2a903e70a6ae1d`
- Merge parents: `c1da2430cecd1135d7c8388cc20b0829661eb81c`, `4b1fdaae4701b6763e0bc3f585a2835132622932`
- PR-06D package commit, approval commit, and final PR head are all ancestors of the merge commit.
- Local HEAD, local `origin/main`, and live remote `refs/heads/main` were identical during verification.
- Verification clone was non-shallow and clean before checks.

## Package integrity

- Approved Package Identity: `pr06d-bootstrap-c1da2430cecd-56d59d2b79e9`
- Candidate manifest SHA-256: `c57a7ab167d2236a9b195d46795a85cfdea2cbba3144d741d9378282de52d489`
- Target manifest SHA-256: `143ddeb596a62da6788e1a6f9de696a79a8415b31752e7292a218b7a61dd0725`
- Candidate/Target artifact SHA-256: `56d59d2b79e93bd851226742676c28327e7aa0ecd45abc545bae0026b665f87e`
- Package inventory: `10` files checked, `0` mismatches
- Deterministic replay: `9` core files compared, `0` drift

The Candidate history remains valid and Candidate validation returns `PASS`.
No Candidate or Target package byte was changed during verification.

## Runtime evidence freshness

The Target runtime capture binds `c1da2430cecd1135d7c8388cc20b0829661eb81c`,
while merged main is `2ecbf7a3ffc08d7e1bff7a579a2a903e70a6ae1d`.
Bootstrap pre-review therefore returns `BLOCK` with
`REMOTE_HISTORY_REF_MISMATCH`. This is the required fail-closed outcome.

The stale capture was not reused, refreshed, or replaced. PR-06E must obtain a
fresh runtime Promotion capture and a new human review before any execution.

## Contract and validation

- Contract version: `4`
- Schemas compiled: `9`
- Dependency cycles: `0`
- Manifest/evidence projection bindings: `PASS`
- Full project test chain: `PASS`
- Documentation validation tests: `90/90`
- Promotion validator tests: `75/75`
- Bootstrap package tests: `12/12`
- Full documentation validation: `0` blocking findings, `15` baselined INFO findings

## Safety conclusion

```text
productionManifestCreated=false
productionWrite=false
promotionExecuted=false
deploymentExecuted=false
repositoryMutation=0
candidateMutation=0
targetMutation=0
```

Human review approved this merged-state verification at the frozen commit. It
does not authorize PR-06E, Production authority, or stale runtime capture use.
