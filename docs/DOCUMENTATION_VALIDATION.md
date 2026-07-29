# Documentation Validation

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-29T16:58:45Z`

Authoritative scope: Proposed operational authority for repository
documentation validation. It becomes current only after PR-05 human approval
and merge.

Related documents:

- [Documentation Standard](DOCUMENTATION_STANDARD.md)
- [Document Lifecycle Policy](DOCUMENT_LIFECYCLE_POLICY.md)
- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Authoritative Document Map](AUTHORITATIVE_DOCUMENT_MAP.md)
- [Reviewed validation baseline](documentation-validation-baseline.json)

## Purpose

The documentation validator converts the PR-03 and PR-04 audit checks into a
deterministic, read-only repository gate. It validates current documentation
strictly while preserving reviewed historical evidence through an exact-path
baseline.

## Commands

```bash
npm run test:documentation-validation
npm run validate:docs
npm run validate:docs:changed -- --base origin/main
```

Direct CLI forms:

```bash
node scripts/validate-documentation.js --mode full
node scripts/validate-documentation.js --mode changed --base origin/main
node scripts/validate-documentation.js --format json
node scripts/validate-documentation.js --json-output /tmp/documentation-validation.json
node scripts/validate-documentation.js --help
```

The default mode is `full`, the default output is text, and no file is
written. `--json-output` is the only explicit output-writing option. There is
no fix, rewrite, approval, or baseline-update mode.

## Modes

### Full

Full mode validates:

- every strict current Markdown or JSON document;
- all reviewed baseline paths;
- protected and archive bytes;
- authority assignments;
- internal links and anchors;
- evidence pairs, manifests, sizes, and SHA-256 values.

### Changed

Changed mode requires a resolvable `--base` and reads
`git diff --name-status <base>...HEAD`. New or modified documents are strict,
even when their previous form had a legacy baseline entry. Protected or
archived changes block the run.

An absent or invalid base returns exit code 2 and
`BLOCKED_DOCUMENTATION_VALIDATION_BASE_UNRESOLVED`.

## Exit Codes

| Code | Meaning |
| ---: | --- |
| 0 | Validation passed |
| 1 | One or more validation findings block the run |
| 2 | Usage, base resolution, configuration, or execution error |

## Stable Rule Families

| Prefix | Scope |
| --- | --- |
| `DOC-NAME-*` | File naming |
| `DOC-META-*` | Required top metadata |
| `DOC-LIFECYCLE-*` | Status and approval semantics |
| `DOC-LINK-*` | Targets, anchors, and local paths |
| `DOC-AUTH-*` | Authority map integrity |
| `DOC-EVIDENCE-*` | Pair, JSON, size, and hash evidence |
| `DOC-PROTECTED-*` | Immutable evidence and archive boundaries |
| `DOC-BASELINE-*` | Reviewed legacy-deviation governance |

Every finding includes a stable rule ID, severity, path, location, expected
value, actual value, and baseline status.

## Baseline Governance

The baseline is [documentation-validation-baseline.json](documentation-validation-baseline.json).
Each entry:

- names one exact repository-relative path;
- declares one classification;
- lists only reviewed rule IDs;
- records a reason and PR-04 source finding;
- records byte size and SHA-256 for protected or archived evidence.

Directory globs and wildcard exemptions are forbidden. A changed document
cannot use its legacy entry to bypass strict validation. The validator never
adds, removes, or updates baseline entries.

Baseline changes require an independently reviewed governance decision. A
fixed legacy violation should be removed explicitly rather than silently
retained.

## Link and Anchor Rules

The parser supports ATX headings, inline links, reference-style links, URL
encoding, relative paths, duplicate heading slugs, and repository anchors.
Fenced code blocks are excluded from link parsing. HTTP and HTTPS links are
not fetched; CI has no network-validation dependency.

## Evidence and Hash Rules

Hashes are computed from raw bytes with SHA-256. The validator does not trim,
normalize line endings, or reserialize JSON before hashing. Evidence JSON
must not hash itself and must use
`SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE`.

Historical pairs are preserved by their reviewed bytes and manifests. New
pairs declare their Markdown report explicitly and must agree on task,
status, result, base SHA, and generated time.

## CI Behavior

The documentation workflow uses `contents: read`, installs from the committed
lockfile, and runs:

- fixture and regression tests;
- full validation;
- changed validation for pull requests;
- the existing project test entrypoint.

CI never commits reports, updates the baseline, comments on a PR, checks
external link availability, or uses repository secrets.

## Failure Handling

Use the rule ID and path in the finding to correct the source. Do not weaken a
rule, broaden the baseline, edit archive evidence, or change a PASS field to
hide a failure. If a historical exception genuinely requires revision, stop
and obtain an explicit baseline-governance review.

Automation reports validation facts only. It cannot grant human approval or
write Reviewer or reviewedAt metadata.
