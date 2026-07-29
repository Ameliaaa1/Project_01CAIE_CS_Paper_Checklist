# Document Move Plan

Status: `PASS_DOCUMENT_ARCHIVE_MOVE_PLAN_READY_FOR_EXECUTION`

PR-02A-R2 applies the recorded human decisions and freezes the PR-02B execution set. No project file was moved, restored, deleted, or renamed in this task. The JSON plan remains authoritative for per-file SHA-256, source, target, approval, and reference fields.

## Frozen counts

- Approved untracked moves for PR-02B: 15
- Planned tracked moves: 0
- Approved existing archive copies kept NO_MOVE: 4
- Tracked/modified/deleted sources approved NO_MOVE: 70
- Protected exclusions kept NO_MOVE: 24
- Total NO_MOVE records: 98
- Actual moved files: 0
- Target collisions: 0
- Active 9709 data paths: 0
- Pending human-review decisions: 0

## Execution rules

Only records with `moveMethod = MOVE_UNTRACKED_IN_PR02B`, `approvalStatus = APPROVED`, and `publicPrivateClass = PUBLIC_SAFE` may move in PR-02B. The source path and SHA-256 must match immediately before execution; target paths must remain unique case-insensitively. Every other record is frozen as `NO_MOVE` with target `NONE` and action `NO_MOVE_NO_REFERENCE_REWRITE`.

## Per-file frozen plan

| ID | Source | SHA-256 | Inventory status | PR/Phase ID | Target | Method | Approval |
|---|---|---|---|---|---|---|---|
| `PR02A-MOVE-0001` | `docs/CODEX_PYMUPDF_TEXT_INTEGRITY_FIX.md` | `c0ec437db1e200920dbbd3a36179bcb0a6b4591858604b6754cc730acef1fd0a` | tracked | `REVIEW_REQUIRED` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0002` | `docs/PR-009-Frontend-Migration-to-Question-Rendering-Contract-Solution.md` | `a3ffd31e0f6d11d51727cf584680e4be1382f185d9b6d7a3b4b5f2eafe88e86f` | untracked | `PR-009` | `docs/archive/prs/PR-009/PR-009-Frontend-Migration-to-Question-Rendering-Contract-Solution.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0003` | `docs/PR-010A-Question-Text-Normalization-Contract-and-Migration-Solution.md` | `5f16af3055d0d0fd6d957c498ca2c76a4a0b64cd9217abd127ff81fc5bde4353` | untracked | `PR-010A` | `docs/archive/prs/PR-010A/PR-010A-Question-Text-Normalization-Contract-and-Migration-Solution.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0004` | `docs/PR-010B-child-boundary-audit-investigation-plan.md` | `02f483ff8107dacedaa4ca4aa0d2499c20310d48403428d61955dd2ad1ad6f18` | untracked | `PR-010B` | `docs/archive/prs/PR-010B/PR-010B-child-boundary-audit-investigation-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0005` | `docs/PR-010B-parent-ownership-repair-solution.md` | `fe8c202b576ffac9adfc6a75b2cc326fcb6c9a705e2729cf847af1dc4e7bce5d` | untracked | `PR-010B` | `docs/archive/prs/PR-010B/PR-010B-parent-ownership-repair-solution.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0006` | `docs/PR-010C-conditional-pass-completion-plan.md` | `5f78aa4ec6a606274daca103505b5b56418e8ef9f7226b59c38c9e188735f8cc` | untracked | `PR-010C.1` | `docs/archive/prs/PR-010C.1/PR-010C-conditional-pass-completion-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0007` | `docs/PR-010C.2-validation-evidence-completion-plan.md` | `95d60f803b9897665a922fe2f17fb7966ff6c7f0ed0be50097adcf7f8f514fee` | untracked | `PR-010C.2` | `docs/archive/prs/PR-010C.2/PR-010C.2-validation-evidence-completion-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0008` | `docs/PR-010C.3-actual-validator-issue-evidence-repair-plan.md` | `46904f8f76f2578e025347f776e6f5d553f0dbbc33453c51d65876970ec9df87` | untracked | `PR-010C.3` | `docs/archive/prs/PR-010C.3/PR-010C.3-actual-validator-issue-evidence-repair-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0009` | `docs/PR-010C.3A-2-canonical-ownership-capture-and-validator-wiring-plan.md` | `523e29bf1625738304e8477f6c31e8ebb263da055ea15e44ef4a2118f3197ac1` | untracked | `PR-010C.3A-2` | `docs/archive/prs/PR-010C.3A-2/PR-010C.3A-2-canonical-ownership-capture-and-validator-wiring-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0010` | `docs/PR-010C.3A-2A-0-single-pdf-ownership-runtime-integration-project-plan.md` | `6b459f6d572608430152e0e67cd68dd67f85ff7f1dbae5ce703e8c535285a694` | untracked | `PR-010C.3A-2A-0` | `docs/archive/prs/PR-010C.3A-2A-0/PR-010C.3A-2A-0-single-pdf-ownership-runtime-integration-project-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0011` | `docs/PR-010C.3A-2A-0S-ownership-artifact-dto-compaction-and-streaming-serialization-plan.md` | `59b517d70d1432ae7497b5531b4c65cd58e16fd9851c32a9375ecaea7c197f4c` | untracked | `PR-010C.3A-2A-0S` | `docs/archive/prs/PR-010C.3A-2A-0S/PR-010C.3A-2A-0S-ownership-artifact-dto-compaction-and-streaming-serialization-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0012` | `docs/PR-010C.3A-2A-0V-visual-line-geometry-and-vertical-margin-isolation-repair.md` | `b143a0c4c9110746e7832fadf86e508bf57e9c71852c154d7cd96248e07f3f2e` | untracked | `PR-010C.3A-2A-0V` | `docs/archive/prs/PR-010C.3A-2A-0V/PR-010C.3A-2A-0V-visual-line-geometry-and-vertical-margin-isolation-repair.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0013` | `docs/PR-010C.3A-2A-1-full-corpus-ownership-integration-and-evidence-capture-project-plan.md` | `56b10322aaa7804b4f60b02958c26e222ae108b60478fe2510ce421281771d29` | untracked | `PR-010C.3A-2A-1` | `docs/archive/prs/PR-010C.3A-2A-1/PR-010C.3A-2A-1-full-corpus-ownership-integration-and-evidence-capture-project-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0014` | `docs/PR-010C.3A-2A-1A-three-known-fixture-pdf-ownership-integration-test.md` | `839fa79ecb912109006573cf37775103c8e126cab1c867fabdd5598f8424cd3c` | untracked | `PR-010C.3A-2A-1A` | `docs/archive/prs/PR-010C.3A-2A-1A/PR-010C.3A-2A-1A-three-known-fixture-pdf-ownership-integration-test.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0015` | `docs/PR-010C.3A-2A-2A-canonical-boundary-validator-wiring-and-full-corpus-contract-validation.md` | `c2b200122439cb0466e9311db3bdd92aa4019c12cc18095e25679ccce2b01401` | untracked | `PR-010C.3A-2A-2A` | `docs/archive/prs/PR-010C.3A-2A-2A/PR-010C.3A-2A-2A-canonical-boundary-validator-wiring-and-full-corpus-contract-validation.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0016` | `docs/PR-010C.3A-2A-canonical-ownership-model-construction-project-plan.md` | `cad6478afbc9196ee64d223c3f9695e8aed9f787d5844146fe7e5de4a6abfbc1` | untracked | `PR-010C.3A-2A` | `docs/archive/prs/PR-010C.3A-2A/PR-010C.3A-2A-canonical-ownership-model-construction-project-plan.md` | MOVE_UNTRACKED_IN_PR02B | APPROVED |
| `PR02A-MOVE-0017` | `docs/PR-018_Barcode_Pollution_Metric_Consistency_Solution.md` | `e403f29aae46ff435816cadd545aa4d72c16b11b5ae9ea10e7bdc8a01962b59a` | tracked | `PR-018` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0018` | `docs/PR-021_Barcode_Region_Classification_Edge_Case_Fix_Solution.md` | `442395993667125b360180b09b88dc667a6f4b25f731ea390004495d4b7d3213` | tracked | `PR-021` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0019` | `docs/PR-021_Question_Paper_Response_Area_Mapping_Root_Cause_Analysis_Solution.md` | `1fb95421d7ac27c6351d97bf0cf4b0fc2b258f72d2fac77fc19f0e4130c7261e` | tracked | `PR-021` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0020` | `docs/PR-022_Legacy_Mark_Scheme_Barcode_Region_Classification_Support_Solution.md` | `bbadc2474ba46b8275e86d368b063156431e5673d0d76a4ac247df4a3870cae0` | tracked | `PR-022` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0021` | `docs/PR-023_Mark_Sum_Validation_Investigation_Solution.md` | `b30a9767615fda2e596eb0599b40ea417625005061ad060cbd8f3e05f23977ec` | tracked | `PR-023` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0022` | `docs/PR-024_Back_Matter_Detection_Investigation_Solution.md` | `7e818673c393fa89d63ab4469752f6a448c8d4a8abfde5f51619e34b201244a1` | tracked | `PR-024` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0023` | `docs/PR-025_Question_Marker_Boundary_Detection_For_Pseudocode_And_Numeric_Content_Solution.md` | `f3335ce29a3b579405e3a820b72bce32d3dd0c96671fc5fbeaaa167d2ce3a253` | tracked | `PR-025` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0024` | `docs/PR-026_Canonical_Completeness_Gate_Foundation_Explanation.md` | `12b919e05889a93b8217e6ed3bce2311dccf0e823b9d591847e9c1b82ca2f583` | deleted | `PR-026` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0025` | `docs/PR-027_Production_Pilot_Explanation.md` | `c8f45bb28971f20527cf66192f120f1bcd187f760ad646136c25bcdbfbdbd240` | deleted | `PR-027` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0026` | `docs/PR-028_Production_Expansion_Strategy_Explanation.md` | `18143c62679d50b48ac46b933de7560d05ceaa07c1910bc585fad12a00a47b06` | deleted | `PR-028` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0027` | `docs/PR-029_Generate_Missing_Production_Expansion_Staging_Coverage_Explanation.md` | `21d3adf6b0f0447101f8e5d8075ad5c24e77137d5ae4efc1f5f44f0a100a75db` | deleted | `PR-029` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0028` | `docs/PR-030_Response_Area_Mapping_Fix_0478_s23_qp_11_Solution.md` | `d43a276e42776e8b489e55dcfab052a5aa6b58b1fce1974d0ebc5f46142acf21` | tracked | `PR-030` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0029` | `docs/PR-031_Legacy_Text_Glyph_Classification_Investigation_Solution.md` | `f97aa6384db1e3d84dca9e1befad59caed17f719a027ce1e40307c1204c80330` | tracked | `PR-031` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0030` | `docs/PR-032_Mark_Sum_Validation_Investigation_Solution.md` | `bd2c83a76336e0496a80e9061ce5c98ee789ccb22a8542f3344a1803ad75c997` | tracked | `PR-032` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0031` | `docs/PR-034-0478-Production-Expansion-Batch-01-Implementation-Plan.md` | `18445939f889cefe0c1c60a287d6e3fb5cb131d71ba9e9874ff8acec07ce73ec` | deleted | `PR-034` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0032` | `docs/PR-035-0478-2020-MJ-BATCH-01-Production-Expansion-Plan.md` | `992171da2cf447de6e19bb73827848926d2c3392bedd60c9e56b3a8c66e0a414` | deleted | `PR-035` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0033` | `docs/PR-036-0478-2020-MJ-BATCH-02-Production-Expansion-Plan.md` | `8a99f552a78d8a1f471646085f88b805ccc6276eda5c211d593e0faad65b3e02` | deleted | `PR-036` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0034` | `docs/PR-037-0478-2020-MJ-BATCH-03-Production-Expansion-Plan.md` | `292d33673d1ab4118779d09cb3a00038f5bbb4be85cd48e76df8b5bee0d1b92d` | deleted | `PR-037` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0035` | `docs/PR-038-0478-Missing-Staging-Generation-Batch-01-Implementation-Plan.md` | `57ea05500d4943506f50c4ecbddc89cccdeec002a4acc1ad68fe0ab54dd1efba` | deleted | `PR-038` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0036` | `docs/PR-038A-Canonical-Mark-Coverage-Diagnostic-Severity-Alignment-Plan.md` | `9049715ebf02cfb2714802529eec8b53860655c8c16ee897a297d2b10b029072` | tracked | `PR-038A` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0037` | `docs/PR-039-0478-2021-MJ-BATCH-02-Production-Expansion-Plan.md` | `7e7400e935011284ff87a83cb0e966fcf1100235c24ada2fa77a55370d9bdb19` | deleted | `PR-039` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0038` | `docs/PR-040-0478-Missing-Staging-Generation-Batch-02-Implementation-Plan.md` | `e3bed244dc37f7447bd59ceab24d4ee212fe4cfb382ac9bf97303bdd5b303d9c` | deleted | `PR-040` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0039` | `docs/PR-041-0478-2021-MJ-BATCH-03-Production-Expansion-Plan.md` | `2425de2aef7c3aa441c1a36ed063d9525055c645eecd433173c8efe3f730e65f` | deleted | `PR-041` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0040` | `docs/PR-042-0478-Missing-Staging-Generation-Batch-03-Implementation-Plan.md` | `725bbc8db910bdf5b67526dcf8f249db9ababfc9772ee4bb0a7d9afa90200908` | deleted | `PR-042` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0041` | `docs/PR-043-0478-2022-MJ-BATCH-01-Production-Expansion-Plan.md` | `5677022d760dd81289763a78624c74cbcde70cd7e1a13ea2861bf73175cb289c` | deleted | `PR-043` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0042` | `docs/PR-044-0478-Missing-Staging-Generation-Batch-04-Implementation-Plan.md` | `8bce5595db2a95f2fb5e142a1d301b589f1c6ec6a4cd97260084f1a4a060883f` | deleted | `PR-044` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0043` | `docs/PR-045-0478-2022-MJ-BATCH-02-Production-Expansion-Plan.md` | `a814f8cdba2311d64e250445137f84a7e1a7d85d828f01cb15b06c342ba1e7a0` | deleted | `PR-045` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0044` | `docs/PR-046-0478-Missing-Staging-Generation-Batch-05-Implementation-Plan.md` | `2ef6cfeb623f761a580aa23b759eef3462d6ede3efc2bfb649102ad15eb5042c` | deleted | `PR-046` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0045` | `docs/PR-047-0478-2022-MJ-BATCH-03-Production-Expansion-Plan.md` | `fff896b71638cfd1e77812e502584cc6845494e84438b50c0181c9626c114a50` | deleted | `PR-047` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0046` | `docs/PR-048-9618-Production-Expansion-Preparation-Plan.md` | `da95b85f1e207bb1d88959892c244491bad930b3c0b57bb4cfacfb3814d28f4f` | deleted | `PR-048` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0047` | `docs/PR-048A-Recommended-Next-Batch-Production-Write-Semantics-Alignment-Plan.md` | `6461062344c308b17cc8ca73db36ece00cb788f4387d45f98d36a458ea1ebed5` | deleted | `PR-048A` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0048` | `docs/PR-049-9618-2021-MJ-BATCH-01-Production-Expansion-Plan.md` | `15460a09bd5667e645638cea57391d30d95120bbff990aecf84ee7730f26ab9f` | deleted | `PR-049` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0049` | `docs/PR-050-9618-2021-MJ-BATCH-02-Production-Expansion-Plan.md` | `30f670b36a42c90ea1c9d154a083323380cf1d85fad946ffaf62e55ebe209164` | deleted | `PR-050` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0050` | `docs/PR-051-9618-2021-ON-BATCH-03-Production-Expansion-Plan.md` | `d7c4f6d0c4fb783eb38c5f849ade4a0e203a6c38d843b1e489b7b71e1a3e6350` | deleted | `PR-051` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0051` | `docs/PR-052-9618-2021-ON-BATCH-04-Production-Expansion-Plan.md` | `3b0c912cbc43c928a5f0976112bcd1b7a3ab0f2fcdb1cd283301d0abf04b2803` | deleted | `PR-052` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0052` | `docs/PR-053-9618-2021-ON-BATCH-05-Production-Expansion-Plan.md` | `f90dba369a38dab4c74ec0e117ecdf758f44ff2c05484a61b2f2ff7e90992e6b` | deleted | `PR-053` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0053` | `docs/PR-054-9618-2021-ON-BATCH-06-Production-Expansion-Plan.md` | `e97b05cc90ac3842ea84128a33ccbd46261f1834b969cf752bfec626a5622538` | deleted | `PR-054` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0054` | `docs/PR-055-9618-2021-MJ-BATCH-07-Production-Expansion-Plan.md` | `1a68db22e7fffca7876ac706e398ffabcf0cc9a38c8b2c8723f0f435fefcf928` | deleted | `PR-055` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0055` | `docs/PR-056-9618-2023-MJ-BATCH-08-Production-Expansion-Plan.md` | `a710ffb6a4e2ff2ee9dac154db9baa4e14bfdd72d4d9a5eedd40251614f4891c` | deleted | `PR-056` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0056` | `docs/PR-057-9618-2025-MJ-BATCH-09-Production-Expansion-Plan.md` | `7616c98f89538c3a5adac91dbc09551b812301cd1899cc43a7cd3e53323c06ce` | deleted | `PR-057` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0057` | `docs/PR-058-9618-2025-ON-BATCH-10-Production-Expansion-Plan.md` | `062e4fcbb025d2e983989106347fb12a0095b436586d0583133924868d943384` | deleted | `PR-058` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0058` | `docs/PR-059-9618-Production-Coverage-Audit-Plan.md` | `176bf86ad7e0b9a3e4ac751baf2eed1dd05b74d13e8355e69177c0576c67429f` | tracked | `PR-059` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0059` | `docs/PR-066-9618-Production-Coverage-Re-Audit-Plan.md` | `80f9611e62491b56a528ec1aa3c701aaf06699e4089fb761cc4e5f3bd4a4f27a` | tracked | `PR-066` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0060` | `docs/PR-067-9618-Incomplete-Source-Investigation-Plan.md` | `51b7fddfe11a13c1b241e409482e8a77ba55430ac60e49563981cdf85f425080` | tracked | `PR-067` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0061` | `docs/PR-068-9618-2022-MJ-41-Source-Recovery-Preparation-Plan.md` | `87fce7f2d67e51589ef22fd9ef1c465935e179d297bd19f27b75a7fa92adcd9f` | tracked | `PR-068` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0062` | `docs/PR028_Production_Expansion_Runbook.md` | `2f3890ff7c38416129a6bdd7647ecb09677bee0cfbb1b6bfefa3219110b52d74` | deleted | `PR-028` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0063` | `docs/PastPaper_JSON_Staging_Modification_Plan.md` | `0380d830384256845c86a9ba54682e0e30ff8835a617ac41008fcb8c2671917b` | tracked | `REVIEW_REQUIRED` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0064` | `docs/PastPaper_JSON问题专项解决方案.md` | `c43808c19a60d3fdcc31b3eac206905afc194901115dde8c12dbdb8da75591b3` | tracked | `REVIEW_REQUIRED` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0065` | `docs/PastPaper_PDF解析与题库结构化解决方案.md` | `8ca53ba10d47c735192eac7f0278a81d9c81a1bcc9dd3332f18aac2fe8978fd9` | tracked | `REVIEW_REQUIRED` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0066` | `docs/Phase-2-9618-Duplicate-Source-Investigation-and-Cleanup-Plan.md` | `c6e82d16dc93fd0da6e678ec4c327179cb4f72365d17305c5e9f69f64baa6952` | tracked | `PHASE-2` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0067` | `docs/Phase-4-9618-Final-Coverage-Re-Audit-and-Stability-Validation-Plan.md` | `2fc309f500ad97c497f8997d9083b342f1172a36f8f889265623a9e3b97c05fb` | tracked | `PHASE-4` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0068` | `docs/Phase-5-9618-Blocked-Pair-Investigation-Plan.md` | `cf61cf2924b9f02fbfa1f9169198f574f73e697fe7a6ba9a523cc1b554192ce6` | tracked | `PHASE-5` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0069` | `docs/Phase-6-9618-Final-Production-Closure-Plan.md` | `b059d5920ba2382666667d5ef5ef022e60a51c1106d51f67260bbc83829ea669` | tracked | `PHASE-6` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0070` | `docs/Phase-7B-New-Syllabus-Onboarding-Plan.md` | `fe1be2688d0275f4eed11d0b11fa52eec2db0bfc35e35b466393865ce28dbda6` | deleted | `PHASE-7-B` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0071` | `docs/Phase-7C-Generalized-Parser-Coverage-Expansion-Plan.md` | `feff9540826775aa33895e40141dff8e3deccb34bafd943cde962e4de204f99e` | deleted | `PHASE-7-C` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0072` | `docs/Phase-8-Continuous-Operation-Plan.md` | `2de7a1ebaf4251efd84df28858979ab8fbace22cfd468020c0eea522d9d332c7` | deleted | `PHASE-8` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0073` | `docs/Phase-8-Long-Term-Data-Quality-Improvement-Plan-v2.md` | `ecec4fc4bd9cdd625b7e97bf5af0e2945b24b2b403ed358213aa234313e17c1f` | deleted | `PHASE-8` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0074` | `docs/Phase1_PDF_Batch_Ingestion_Validation.md` | `305f63bed52bc5f4683b4b81d99fad10144e8ae5eb9246dd98bcd3b78fec9b69` | deleted | `PHASE-1` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0075` | `docs/Phase2_PDF_Batch_Ingestion_Expansion.md` | `12d50a6b83e0933552358cd0594999b708ddb88b1acc7c264a276e9c8d86973e` | deleted | `PHASE-2` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0076` | `docs/archive/obsolete-syllabus-scope/PR-026_Canonical_Completeness_Gate_Foundation_Explanation.md` | `12b919e05889a93b8217e6ed3bce2311dccf0e823b9d591847e9c1b82ca2f583` | untracked | `PR-026` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0077` | `docs/archive/obsolete-syllabus-scope/PR-029_Generate_Missing_Production_Expansion_Staging_Coverage_Explanation.md` | `21d3adf6b0f0447101f8e5d8075ad5c24e77137d5ae4efc1f5f44f0a100a75db` | untracked | `PR-029` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0078` | `docs/archive/obsolete-syllabus-scope/PR-034-0478-Production-Expansion-Batch-01-Implementation-Plan.md` | `18445939f889cefe0c1c60a287d6e3fb5cb131d71ba9e9874ff8acec07ce73ec` | untracked | `PR-034` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0079` | `docs/archive/obsolete-syllabus-scope/PR-035-0478-2020-MJ-BATCH-01-Production-Expansion-Plan.md` | `992171da2cf447de6e19bb73827848926d2c3392bedd60c9e56b3a8c66e0a414` | untracked | `PR-035` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0080` | `docs/archive/obsolete-syllabus-scope/PR-036-0478-2020-MJ-BATCH-02-Production-Expansion-Plan.md` | `8a99f552a78d8a1f471646085f88b805ccc6276eda5c211d593e0faad65b3e02` | untracked | `PR-036` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0081` | `docs/archive/obsolete-syllabus-scope/PR-037-0478-2020-MJ-BATCH-03-Production-Expansion-Plan.md` | `292d33673d1ab4118779d09cb3a00038f5bbb4be85cd48e76df8b5bee0d1b92d` | untracked | `PR-037` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0082` | `docs/archive/obsolete-syllabus-scope/PR-038-0478-Missing-Staging-Generation-Batch-01-Implementation-Plan.md` | `57ea05500d4943506f50c4ecbddc89cccdeec002a4acc1ad68fe0ab54dd1efba` | untracked | `PR-038` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0083` | `docs/archive/obsolete-syllabus-scope/PR-039-0478-2021-MJ-BATCH-02-Production-Expansion-Plan.md` | `7e7400e935011284ff87a83cb0e966fcf1100235c24ada2fa77a55370d9bdb19` | untracked | `PR-039` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0084` | `docs/archive/obsolete-syllabus-scope/PR-040-0478-Missing-Staging-Generation-Batch-02-Implementation-Plan.md` | `e3bed244dc37f7447bd59ceab24d4ee212fe4cfb382ac9bf97303bdd5b303d9c` | untracked | `PR-040` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0085` | `docs/archive/obsolete-syllabus-scope/PR-041-0478-2021-MJ-BATCH-03-Production-Expansion-Plan.md` | `2425de2aef7c3aa441c1a36ed063d9525055c645eecd433173c8efe3f730e65f` | untracked | `PR-041` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0086` | `docs/archive/obsolete-syllabus-scope/PR-042-0478-Missing-Staging-Generation-Batch-03-Implementation-Plan.md` | `725bbc8db910bdf5b67526dcf8f249db9ababfc9772ee4bb0a7d9afa90200908` | untracked | `PR-042` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0087` | `docs/archive/obsolete-syllabus-scope/PR-043-0478-2022-MJ-BATCH-01-Production-Expansion-Plan.md` | `5677022d760dd81289763a78624c74cbcde70cd7e1a13ea2861bf73175cb289c` | untracked | `PR-043` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0088` | `docs/archive/obsolete-syllabus-scope/PR-044-0478-Missing-Staging-Generation-Batch-04-Implementation-Plan.md` | `8bce5595db2a95f2fb5e142a1d301b589f1c6ec6a4cd97260084f1a4a060883f` | untracked | `PR-044` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0089` | `docs/archive/obsolete-syllabus-scope/PR-045-0478-2022-MJ-BATCH-02-Production-Expansion-Plan.md` | `a814f8cdba2311d64e250445137f84a7e1a7d85d828f01cb15b06c342ba1e7a0` | untracked | `PR-045` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0090` | `docs/archive/obsolete-syllabus-scope/PR-046-0478-Missing-Staging-Generation-Batch-05-Implementation-Plan.md` | `2ef6cfeb623f761a580aa23b759eef3462d6ede3efc2bfb649102ad15eb5042c` | untracked | `PR-046` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0091` | `docs/archive/obsolete-syllabus-scope/PR-047-0478-2022-MJ-BATCH-03-Production-Expansion-Plan.md` | `fff896b71638cfd1e77812e502584cc6845494e84438b50c0181c9626c114a50` | untracked | `PR-047` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0092` | `docs/archive/obsolete-syllabus-scope/PR-048-9618-Production-Expansion-Preparation-Plan.md` | `da95b85f1e207bb1d88959892c244491bad930b3c0b57bb4cfacfb3814d28f4f` | untracked | `PR-048` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0093` | `docs/archive/obsolete-syllabus-scope/PR-048A-Recommended-Next-Batch-Production-Write-Semantics-Alignment-Plan.md` | `6461062344c308b17cc8ca73db36ece00cb788f4387d45f98d36a458ea1ebed5` | untracked | `PR-048A` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0094` | `docs/archive/obsolete-syllabus-scope/PR-049-9618-2021-MJ-BATCH-01-Production-Expansion-Plan.md` | `15460a09bd5667e645638cea57391d30d95120bbff990aecf84ee7730f26ab9f` | untracked | `PR-049` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0095` | `docs/archive/obsolete-syllabus-scope/PR-050-9618-2021-MJ-BATCH-02-Production-Expansion-Plan.md` | `30f670b36a42c90ea1c9d154a083323380cf1d85fad946ffaf62e55ebe209164` | untracked | `PR-050` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0096` | `docs/archive/obsolete-syllabus-scope/PR-051-9618-2021-ON-BATCH-03-Production-Expansion-Plan.md` | `d7c4f6d0c4fb783eb38c5f849ade4a0e203a6c38d843b1e489b7b71e1a3e6350` | untracked | `PR-051` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0097` | `docs/archive/obsolete-syllabus-scope/PR-052-9618-2021-ON-BATCH-04-Production-Expansion-Plan.md` | `3b0c912cbc43c928a5f0976112bcd1b7a3ab0f2fcdb1cd283301d0abf04b2803` | untracked | `PR-052` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0098` | `docs/archive/obsolete-syllabus-scope/PR-053-9618-2021-ON-BATCH-05-Production-Expansion-Plan.md` | `f90dba369a38dab4c74ec0e117ecdf758f44ff2c05484a61b2f2ff7e90992e6b` | untracked | `PR-053` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0099` | `docs/archive/obsolete-syllabus-scope/PR-054-9618-2021-ON-BATCH-06-Production-Expansion-Plan.md` | `e97b05cc90ac3842ea84128a33ccbd46261f1834b969cf752bfec626a5622538` | untracked | `PR-054` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0100` | `docs/archive/obsolete-syllabus-scope/PR-055-9618-2021-MJ-BATCH-07-Production-Expansion-Plan.md` | `1a68db22e7fffca7876ac706e398ffabcf0cc9a38c8b2c8723f0f435fefcf928` | untracked | `PR-055` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0101` | `docs/archive/obsolete-syllabus-scope/PR-056-9618-2023-MJ-BATCH-08-Production-Expansion-Plan.md` | `a710ffb6a4e2ff2ee9dac154db9baa4e14bfdd72d4d9a5eedd40251614f4891c` | untracked | `PR-056` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0102` | `docs/archive/obsolete-syllabus-scope/PR-057-9618-2025-MJ-BATCH-09-Production-Expansion-Plan.md` | `7616c98f89538c3a5adac91dbc09551b812301cd1899cc43a7cd3e53323c06ce` | untracked | `PR-057` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0103` | `docs/archive/obsolete-syllabus-scope/PR-058-9618-2025-ON-BATCH-10-Production-Expansion-Plan.md` | `062e4fcbb025d2e983989106347fb12a0095b436586d0583133924868d943384` | untracked | `PR-058` | `NONE` | NO_MOVE | EXCLUDED_PROTECTED |
| `PR02A-MOVE-0104` | `docs/mvp-ingestion-pipeline.md` | `995e50ef528ad53662843275213114942775abd609fbfd76dfe455d511d8b46c` | tracked | `REVIEW_REQUIRED` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0105` | `docs/phase7c-a-design.md` | `a9cd1f94a9d4a13e1f8dda7eafa6a6691d4f923464372a37fc963d9337f3c57e` | tracked | `PHASE-7-C-A` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0106` | `docs/phase7c-b-design.md` | `8ce39367205c8b6a0e1b8f3793d0a42dac4290aadf27c85ca98238faeff705ad` | modified | `PHASE-7C-B` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0107` | `docs/phase7c-c-design.md` | `599aa4d3d3c600dae473363acc8f0631d04275aa16fe62b101466d44cea93c54` | tracked | `PHASE-7-C-C` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0108` | `docs/phase7c-d-design.md` | `3a580f3833dc0018b8dae608978d5e388f1ab87f7fb280f055266dbb7635cf65` | tracked | `PHASE-7-C-D` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0109` | `docs/phase7c-e-design.md` | `2e7cb6e507867cd94a18ada88b5fa46efd24dd060e25740815cb7e44f7bef301` | modified | `PHASE-7C-E` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0110` | `docs/phase8-a-design.md` | `eda5e59217f3bf308a809937b18001e0e1d9424faaacb4c90bf1fc31594b7f89` | tracked | `PHASE-8-A` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0111` | `docs/phase8-b-design.md` | `a8aa78f5eab701561bc8dacfb38e002c5e889bf1bf24069df451473cc0900b4e` | tracked | `PHASE-8-B` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0112` | `docs/phase8-c-design.md` | `e8049355765077660e5645a78f3f9d88164fd0d72826e96b559039c78713dc50` | tracked | `PHASE-8-C` | `NONE` | NO_MOVE | APPROVED |
| `PR02A-MOVE-0113` | `docs/phase8-d-design.md` | `e641d9c5382eefd7320d4b38f903c1b48ad2b2b6e32314a84a5159137a03f15a` | tracked | `PHASE-8-D` | `NONE` | NO_MOVE | APPROVED |
