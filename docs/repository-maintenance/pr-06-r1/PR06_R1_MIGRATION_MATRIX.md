# PR-06-R1 Evidence Lifecycle Migration Matrix

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-30T08:38:25Z`

Authoritative scope: NONE

Related documents:

- [R1 lifecycle report](PR06_R1_ACTIVE_EVIDENCE_LIFECYCLE_REPORT.md)
- [R1 human review](PR06_R1_HUMAN_REVIEW.md)
- [PR-06 quality gate matrix](../pr-06/PR06_QUALITY_GATE_COVERAGE_MATRIX.md)

## Migration Rule

PR-05 used one unclassified hash list for both immutable history and evolving
authority. R1 does not edit that historical JSON. The current lifecycle
registry identifies it as an approved legacy mixed-evidence source and resolves
each old entry through exact active paths or prefixes. All newly authored
evidence entries must contain `evidenceClass` explicitly.

| Path | Old classification | New classification | Reason | Validation method |
| --- | --- | --- | --- | --- |
| `.github/workflows/documentation-validation.yml` | unclassified hash snapshot | `active-authority` | Current CI wiring must evolve | Current workflow review and CI execution |
| `docs/AUTHORITATIVE_DOCUMENT_MAP.md` | unclassified hash snapshot | `active-authority` | Current authority map | Metadata, links, authority consistency, CI |
| `docs/DOCUMENTATION_INDEX.md` | unclassified hash snapshot | `active-authority` | Current navigation must evolve | Metadata, links, authority consistency, CI |
| `docs/DOCUMENTATION_VALIDATION.md` | unclassified hash snapshot | `active-authority` | Current operational authority | Metadata, links, rules, CI |
| `docs/documentation-validation-baseline.json` | unclassified hash snapshot | `active-authority` | Reviewed but evolvable baseline | Baseline schema and regression governance |
| `docs/repository-maintenance/pr-05/PR05_DOCUMENTATION_VALIDATION_REPORT.md` | unclassified hash snapshot | `historical` | Frozen PR-05 audit record | Existence, size, SHA-256 |
| `package.json` | unclassified hash snapshot | `active-authority` | Current executable script authority | JSON parse, scripts, npm test, CI |
| `scripts/documentation-validation/constants.js` | unclassified hash snapshot | `active-authority` | Current validator rule registry | Rule closure tests and CI |
| `scripts/documentation-validation/format-results.js` | unclassified hash snapshot | `active-authority` | Current validator formatter | Tests and CI |
| `scripts/documentation-validation/markdown.js` | unclassified hash snapshot | `active-authority` | Current Markdown parser | Tests and CI |
| `scripts/documentation-validation/validator.js` | unclassified hash snapshot | `active-authority` | Current validator implementation | 90 tests, full/changed validation, CI |
| `scripts/validate-documentation.js` | unclassified hash snapshot | `active-authority` | Current CLI entrypoint | CLI error tests, full/changed validation, CI |
| `tests/documentation-validation.test.js` | unclassified hash snapshot | `active-authority` | Current regression suite | Test execution and rule closure |
| `tests/fixtures/documentation-validation/absolute-local-path/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/archive-authority-target/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/baseline-path-missing/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/baseline-regression/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/baseline-stale/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/broken-anchor/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/broken-link/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/code-fence/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/duplicate-authority/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/evidence-pair-mismatch/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/invalid-status/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/legacy-baselined/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/malformed-json/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/missing-authority-target/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/missing-metadata/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/pass-as-lifecycle-status/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/protected-file-change/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/self-hash/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/stale-hash/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |
| `tests/fixtures/documentation-validation/valid/fixture.json` | unclassified hash snapshot | `active-authority` | Current regression fixture | Fixture test and read-only hash guard |

## Totals

Legacy PR-05 entries: `33`

Migrated to `active-authority`: `32`

Migrated to `historical`: `1`

Additionally, the PR-05 machine-readable report is registered as historical
because it cannot hash itself. Its original size and SHA-256 are stored in the
lifecycle registry.
