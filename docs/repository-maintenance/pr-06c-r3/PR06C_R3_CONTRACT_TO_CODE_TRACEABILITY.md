# PR-06C-R3 Contract-to-Code Traceability

Status: `APPROVED`

Owner: Promotion contract maintainers

Created at: `2026-08-01T07:33:34Z`

Authoritative scope: NONE

Related documents:

- [Implementation report](PR06C_R3_CONTRACT_V4_AND_VALIDATOR_IMPLEMENTATION_REPORT.md)
- [Human review](PR06C_R3_HUMAN_REVIEW.md)

| Contract capability | Implementation | Test evidence |
| --- | --- | --- |
| Exact contract and registry hashes | `scripts/promotion-validator/validator.js` `loadBoundary` | contract drift and schema binding cases |
| Strict UTF-8 JSON, duplicate keys, BOM, trailing data, exact integers | `scripts/promotion-validator/strict-json.js` | eight strict-json cases |
| RFC 8785 canonical projection, one exclusion | `scripts/promotion-validator/hash.js` | constructibility and projection mutation cases |
| Repository-relative, role-owned, no-symlink paths | `scripts/promotion-validator/safe-path.js` | traversal, root symlink, broken symlink, report-boundary cases |
| Schema registry and strict compilation | `loadBoundary`, `schemaValidator` | nine-schema constructibility gate |
| Artifact, stable IDs, scope, `0478`/`9618`, block `9709` | `inspectArtifact` | positive artifact, duplicate ID, unsupported syllabus |
| Repository origin and complete history | `assertRepositoryIdentity` | correct/wrong/missing origin and shallow repository cases |
| Persistent Manifest history evidence | `validateManifestProvenance`, `loadManifestHistory` | historical A remains valid at B; hash, purpose, and reachability drift block |
| Promotion session runtime evidence | `captureRemoteHistory`, `validatePromotionRuntimeContext` | exact session ID, current tracking ref, every-role reachability, missing/old capture blocking |
| Evidence lifecycle separation | capture schema purposes and distinct Manifest/Target fields | runtime-as-history and history-as-runtime both block |
| Contract stability across main advancement | Contract rules and schema/hash manifest | A→B leaves Contract, validator, and contract hash manifest unchanged |
| Six role/lifecycle pairs, transition endpoints, and four evidence phases | `validateRole`, `validateLifecycleTransition`, `validateEvidence` | Candidate and Target source/final states, Production, invalid transition |
| Target pre/post intent dispatches full Bootstrap or Update gate | `validateRepository`, `validateBootstrap`, `validateUpdate` | both modes pre-review and post-review |
| Full-SHA existence, historical/session reachability, generator registry | both provenance paths | valid provenance, unknown generator, unrelated source history |
| Exact manifest hash and evidence projection binding | `validateEvidence` | constructibility, manifest mismatch, projection mismatch |
| Freshness and supersession | `validateEvidence`, `validateSupersession` | stale binding, valid chain, cycle |
| Bootstrap pre/post review and safe Production absence | `assertProductionAbsent`, `validateBootstrap` | absent/empty directory pass; present manifest, directory symlink, broken manifest symlink block |
| Update request and approval bindings | `validateUpdate` | valid pre/post and bound approval mismatch |
| Stdout and create-new report only | CLI and `writeReport` | stdout, create-new, overwrite, escape |
| Read-only default and no execution authority | `validateRepository` result contract | PASS/BLOCK zero-byte mutation proof |

Every listed contract rule has implementation and executable test evidence.
No rule is supplied by fixture convention alone.
