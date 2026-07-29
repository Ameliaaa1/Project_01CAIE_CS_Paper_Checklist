# Archive Plan

This is a decision draft only. PR-01 performed no move, deletion, compression, or upload.

## Proposed sequence for a later approved task

1. Human-review every `REVIEW_REQUIRED` item.
2. Freeze authoritative Production, current candidate, human review, release gate, rollback, and post-write validation paths.
3. Verify exact duplicates and all direct/dynamic references.
4. Build Release manifests for approved large evidence only after secret/copyright review.
5. Archive historical PR documents with `git mv` and preserve an index.
6. Delete only approved, backed-up, reproducible items with a deletion manifest.

## Candidate counts

- DELETE_AFTER_VERIFIED_BACKUP: 6578
- CONSOLIDATE_AND_ARCHIVE: 11453
- ARCHIVE_AS_GITHUB_RELEASE_ASSET: 46

- Delete candidates with explicit replacement/non-project relationship: 6578
- Delete candidates without explicit replacement/non-project relationship: 0

## Large Release-asset candidates

- 345148239 bytes — `output/continuous-operation/snapshots/production-store-94393fbfcd3f0028fa506033ed60358fba24ed995e0b27bf59916150b9a51478.json` — SHA-256 `94393fbfcd3f0028fa506033ed60358fba24ed995e0b27bf59916150b9a51478`
- 345148239 bytes — `output/quality-governance/snapshots/production-store-94393fbfcd3f0028fa506033ed60358fba24ed995e0b27bf59916150b9a51478.json` — SHA-256 `94393fbfcd3f0028fa506033ed60358fba24ed995e0b27bf59916150b9a51478`
- 337016686 bytes — `output/continuous-operation/snapshots/production-store-06e4ac1acd625d2c92a04eb0b7e5fb495a1a10b1573ef367585a4328fef6e656.json` — SHA-256 `06e4ac1acd625d2c92a04eb0b7e5fb495a1a10b1573ef367585a4328fef6e656`
- 337016686 bytes — `output/quality-governance/snapshots/production-store-06e4ac1acd625d2c92a04eb0b7e5fb495a1a10b1573ef367585a4328fef6e656.json` — SHA-256 `06e4ac1acd625d2c92a04eb0b7e5fb495a1a10b1573ef367585a4328fef6e656`
- 336743370 bytes — `output/continuous-operation/snapshots/production-store-e3562ac2e49bf55f17b930c6c8e75f67c9bbb399c257e19e0839cc084940948d.json` — SHA-256 `e3562ac2e49bf55f17b930c6c8e75f67c9bbb399c257e19e0839cc084940948d`
- 336743370 bytes — `output/quality-governance/snapshots/production-store-e3562ac2e49bf55f17b930c6c8e75f67c9bbb399c257e19e0839cc084940948d.json` — SHA-256 `e3562ac2e49bf55f17b930c6c8e75f67c9bbb399c257e19e0839cc084940948d`
- 335552542 bytes — `output/continuous-operation/snapshots/production-store-68ba3c11e1db3912bce641a28fcdc236f78aae8dd080866a31b1fd1ff0ea31f1.json` — SHA-256 `68ba3c11e1db3912bce641a28fcdc236f78aae8dd080866a31b1fd1ff0ea31f1`
- 335552542 bytes — `output/quality-governance/snapshots/production-store-68ba3c11e1db3912bce641a28fcdc236f78aae8dd080866a31b1fd1ff0ea31f1.json` — SHA-256 `68ba3c11e1db3912bce641a28fcdc236f78aae8dd080866a31b1fd1ff0ea31f1`
- 237463313 bytes — `debug/phase5-9618/batch-d-2/production-store-after.json` — SHA-256 `e6a92bf486f7140e7282621d7c11228413dd9ddf3d54a89df09bdf702b3ffbd7`
- 237463313 bytes — `debug/phase7-0478/phase7-0478-2019-fm-batch-01/production-store-before.json` — SHA-256 `e6a92bf486f7140e7282621d7c11228413dd9ddf3d54a89df09bdf702b3ffbd7`
- 235992480 bytes — `debug/phase5-9618/batch-d-1/production-store-after.json` — SHA-256 `9e4458496734f42a0f2b6898197152d5dbf7e059c97342618ead101c65ea70a1`
- 235992480 bytes — `debug/phase5-9618/batch-d-2/production-store-before.json` — SHA-256 `9e4458496734f42a0f2b6898197152d5dbf7e059c97342618ead101c65ea70a1`
- 233571290 bytes — `debug/phase5-9618/batch-c-3/production-store-after.json` — SHA-256 `579f87757cb9c881e578b177caf8cee59ba06f7fd97b5a3040b9ade824af8ee6`
- 233571290 bytes — `debug/phase5-9618/batch-d-1/production-store-before.json` — SHA-256 `579f87757cb9c881e578b177caf8cee59ba06f7fd97b5a3040b9ade824af8ee6`
- 231594409 bytes — `debug/phase5-9618/batch-c-2/production-store-after.json` — SHA-256 `35725d74d0c66f754daf362dcd75462f944e20c8316f9384e33b11e7b1121f42`
- 231594409 bytes — `debug/phase5-9618/batch-c-3/production-store-before.json` — SHA-256 `35725d74d0c66f754daf362dcd75462f944e20c8316f9384e33b11e7b1121f42`
- 230139574 bytes — `debug/phase5-9618/batch-c-1/production-store-after.json` — SHA-256 `4a49e2d3d9b232c17f16dfb941e053cd568c28af8c1d5ec6cb471b18f8b7a719`
- 230139574 bytes — `debug/phase5-9618/batch-c-2/production-store-before.json` — SHA-256 `4a49e2d3d9b232c17f16dfb941e053cd568c28af8c1d5ec6cb471b18f8b7a719`
- 224455547 bytes — `debug/phase5-9618/batch-b-1/production-store-after.json` — SHA-256 `58a843986cabd3a3588408b612e3fc862b319027c95a8a4e506b1f0556b43162`
- 224455547 bytes — `debug/phase5-9618/batch-c-1/production-store-before.json` — SHA-256 `58a843986cabd3a3588408b612e3fc862b319027c95a8a4e506b1f0556b43162`
- 219920861 bytes — `debug/phase5-9618/batch-a-1/production-store-after.json` — SHA-256 `4130236b147089b5d161357b537171f7ec9a359ede574a6715a2db99133cd120`
- 219920861 bytes — `debug/phase5-9618/batch-b-1/production-store-before.json` — SHA-256 `4130236b147089b5d161357b537171f7ec9a359ede574a6715a2db99133cd120`
- 215245325 bytes — `debug/phase3-9618/batch-08/production-store-after.json` — SHA-256 `8c05502ba0c7bd387b956c962d1419169bd2fb52f2fe4985f7d9fd5a730b1e9e`
- 215245325 bytes — `debug/phase5-9618/batch-a-1/production-store-before.json` — SHA-256 `8c05502ba0c7bd387b956c962d1419169bd2fb52f2fe4985f7d9fd5a730b1e9e`
- 196036992 bytes — `debug/phase3-9618/batch-07/production-store-after.json` — SHA-256 `82c0e9d2295aff61511f9e52947dc3a422b5c0000a97b98826a376621e49b26c`
- 196036992 bytes — `debug/phase3-9618/batch-08/production-store-before.json` — SHA-256 `82c0e9d2295aff61511f9e52947dc3a422b5c0000a97b98826a376621e49b26c`
- 179764544 bytes — `debug/phase3-9618/batch-06/production-store-after.json` — SHA-256 `4e96b4726a9bd8b2c421395e542fc56d5f45ab01ac44ce94226f51d039e22e0a`
- 179764544 bytes — `debug/phase3-9618/batch-07/production-store-before.json` — SHA-256 `4e96b4726a9bd8b2c421395e542fc56d5f45ab01ac44ce94226f51d039e22e0a`
- 165132251 bytes — `debug/phase3-9618/batch-05/production-store-after.json` — SHA-256 `6a37b92ae34360fa8f0d855e29991a7c27b9a2a781e50cb07e64da0281c405c1`
- 165132251 bytes — `debug/phase3-9618/batch-06/production-store-before.json` — SHA-256 `6a37b92ae34360fa8f0d855e29991a7c27b9a2a781e50cb07e64da0281c405c1`
- 143440446 bytes — `debug/phase3-9618/batch-04/production-store-after.json` — SHA-256 `522100ecbfdea6fe650682b9b615edc4bd8feb67af976bc3823decc9c6f279c6`
- 143440446 bytes — `debug/phase3-9618/batch-05/production-store-before.json` — SHA-256 `522100ecbfdea6fe650682b9b615edc4bd8feb67af976bc3823decc9c6f279c6`
- 124359373 bytes — `debug/phase3-9618/batch-03/production-store-after.json` — SHA-256 `899cab849b40fc75ea09747c04e9d0ca2f87656b0bada800096ae71face6bb52`
- 124359373 bytes — `debug/phase3-9618/batch-04/production-store-before.json` — SHA-256 `899cab849b40fc75ea09747c04e9d0ca2f87656b0bada800096ae71face6bb52`
- 109070634 bytes — `debug/phase3-9618/batch-02/production-store-after.json` — SHA-256 `21fdff205bfd107d461b60f3ea5713cbf1a5eef69c150a43f5b12b7caf2ba88d`
- 109070634 bytes — `debug/phase3-9618/batch-03/production-store-before.json` — SHA-256 `21fdff205bfd107d461b60f3ea5713cbf1a5eef69c150a43f5b12b7caf2ba88d`
- 92069087 bytes — `debug/phase3-9618/batch-01/production-store-after.json` — SHA-256 `71cf9a4f1ea3f6ecfa5706912c4736918a8877e664d8578690a4b709296f2489`
- 92069087 bytes — `debug/phase3-9618/batch-02/production-store-before.json` — SHA-256 `71cf9a4f1ea3f6ecfa5706912c4736918a8877e664d8578690a4b709296f2489`
- 75012406 bytes — `debug/phase3-9618/batch-00/production-store-after.json` — SHA-256 `8141f91127e802f404d4b633dcb2d064ce601a8b9518519616cf55687b5b3325`
- 75012406 bytes — `debug/phase3-9618/batch-01/production-store-before.json` — SHA-256 `8141f91127e802f404d4b633dcb2d064ce601a8b9518519616cf55687b5b3325`
- 74608353 bytes — `artifacts/r2.6-r3-r2-r1-r1/runtime/s1-served-identity-revalidation.json` — SHA-256 `9a867bdbbaa5e8281b8932f05aa30785ba3233465abd4f21ec46823346107cc2`
- 74607637 bytes — `artifacts/r2.6-r3-r2-r1-r1/runtime/served-asset-identity.json` — SHA-256 `7af30abfe17d2bbc5fdeda9c84b8a7b4c9f275898a2b1f17888fdde0f3a837a3`
- 72822623 bytes — `debug/phase1-9618-2022-mj-41-production/production-store-after.json` — SHA-256 `de1d4e0e5f46936f09a074ae6c0d2c5c88280c9f823f570a1e037044c00af676`
- 72822623 bytes — `debug/phase3-9618/batch-00/production-store-before.json` — SHA-256 `de1d4e0e5f46936f09a074ae6c0d2c5c88280c9f823f570a1e037044c00af676`
- 70829774 bytes — `debug/phase1-9618-2022-mj-41-production/production-store-before.json` — SHA-256 `09fe6bf2a7bd501efcbe4f15265b38919b2a607cca684121a568d4be3c87d517`
- 54381263 bytes — `output/maintenance/parent-child-response-ownership-repair.staging.json` — SHA-256 `2f4db2ed5c9230b6bc62c2970f0446d9f2d2cc73dd08ea03f885c5ebb1bc99b4`
