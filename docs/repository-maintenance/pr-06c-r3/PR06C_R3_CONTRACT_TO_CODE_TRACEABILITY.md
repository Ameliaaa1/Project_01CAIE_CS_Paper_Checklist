# PR-06C-R3 Contract-to-Code Traceability

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Promotion contract maintainers

Created at: `2026-07-31T12:33:23Z`

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
| Schema registry and strict compilation | `loadBoundary`, `schemaValidator` | eight-schema constructibility gate |
| Artifact, stable IDs, scope, `0478`/`9618`, block `9709` | `inspectArtifact` | positive artifact, duplicate ID, unsupported syllabus |
| Repository origin, complete history, approved ref reachability | `validateProvenance` | correct/wrong/missing origin, shallow repo, missing ref, checkout mismatch |
| Six role/lifecycle pairs, declared transitions, and four evidence phases | `validateRole`, `validateLifecycleTransition`, `validateEvidence` | Candidate, Production, Target pre/post, invalid transition |
| Target pre/post intent dispatches full Bootstrap or Update gate | `validateRepository`, `validateBootstrap`, `validateUpdate` | both modes pre-review and post-review |
| Full-SHA existence, reachability, checkout equality, generator registry | `validateProvenance` | valid provenance, unknown generator, checkout mismatch |
| Exact manifest hash and evidence projection binding | `validateEvidence` | constructibility, manifest mismatch, projection mismatch |
| Freshness and supersession | `validateEvidence`, `validateSupersession` | stale binding, valid chain, cycle |
| Bootstrap pre/post review | `validateBootstrap` | valid pre/post and Production-present block |
| Update request and approval bindings | `validateUpdate` | valid pre/post and bound approval mismatch |
| Stdout and create-new report only | CLI and `writeReport` | stdout, create-new, overwrite, escape |
| Read-only default and no execution authority | `validateRepository` result contract | PASS/BLOCK zero-byte mutation proof |

Every listed contract rule has implementation and executable test evidence.
No rule is supplied by fixture convention alone.
