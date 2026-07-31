# PR-06C Promotion Gate Validator Contract Limitation Report

Status: `BLOCKED`

Owner: Repository maintainers

Created at: `2026-07-31T09:08:33Z`

Authoritative scope: NONE

Related documents:

- [Approved promotion contract](../pr-06c/PR06C_PROMOTION_CONTRACT.md)
- [Approved schema proposal](../pr-06c/PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Approved human review](../pr-06c/PR06C_HUMAN_REVIEW.md)
- [Machine-readable limitation report](pr06c-promotion-gate-validator-contract-limitation-report.json)

Task: `PR06C_PROMOTION_GATE_VALIDATOR_IMPLEMENTATION`

Result: `BLOCKED_PR06C_PROMOTION_GATE_VALIDATOR_CONTRACT_LIMITATION`

Base SHA: `bcb0c5a4ec112dcacf82ae9338d6f81f3f952584`

Base source: merged PR #10 on `origin/main`

Branch: `codex/pr-06c-promotion-gate-validator`

Validated implementation SHA: `NOT_STARTED`

Final PR head SHA: `PENDING`

Generated at: `2026-07-31T09:08:33Z`

Tests cases: `90`

Tests passed: `90`

Tests failed: `0`

Blocking findings: `7`

Baselined findings: `15`

Validator implementation files: `0`

Validation fixture files: `0`

Changed files: `3`

Files deleted: `0`

Files renamed: `0`

Files moved: `0`

Line additions: `383`

Line deletions: `0`

Human review decision: `PENDING`

## Outcome

The Promotion Gate Validator cannot be implemented without inventing contract
semantics that the approved PR-06C documents do not define. The implementation
plan explicitly requires the executor to stop, document the limitation, and
return it for contract review rather than silently modify the contract.

No validator, fixture manifest, authority manifest, artifact, or promotion
command was created.

## Audit Method

The audit started from the clean merge commit for PR #10 and searched all
tracked merged files for:

- an artifact-schema path or schema registry;
- an allowed artifact-schema registry;
- a record-collection selector;
- a stable-ID selector;
- Update schema/scope approval data;
- validation-evidence schema or freshness rules;
- role-owned artifact path boundaries.

The only matches were descriptive requirements in the approved PR-06C
contract. No executable or machine-readable definition exists elsewhere in
`origin/main`.

## Blocking Findings

### `PR06C-LIMIT-001` — Artifact schema cannot be resolved

Severity: `P0`

The manifest records `artifactSchemaId`, `artifactSchemaVersion`, and
`artifactSchemaSha256`, but it does not record an artifact-schema path and the
repository has no schema registry. A validator cannot locate the schema bytes
whose RFC 8785 hash it must reproduce.

Required contract repair:

- define a versioned schema registry keyed by schema ID and version; or
- add a normalized repository-relative `artifactSchemaPath` with exact
  ownership and resolution rules.

### `PR06C-LIMIT-002` — Allowed artifact schemas are undefined

Severity: `P0`

The contract requires unknown artifact schemas to block, but it defines no
allowed schema IDs, versions, or hashes. Accepting any self-declared schema
would defeat fail-closed validation; rejecting all schemas would make PASS
impossible.

Required contract repair:

- freeze an explicit allowlist or registry of supported artifact schemas.

### `PR06C-LIMIT-003` — Record collection extraction is undefined

Severity: `P0`

The contract requires `recordCount` to reproduce from the schema-defined record
collection, but it provides no JSON Pointer, schema annotation, or fixed
artifact envelope that identifies the collection.

Required contract repair:

- define a fixed artifact record path; or
- define a required schema annotation that resolves to exactly one collection.

### `PR06C-LIMIT-004` — Stable-ID extraction is undefined

Severity: `P0`

The stable-ID canonicalization defines sorting and hashing after IDs are
extracted, but it does not define which field or JSON Pointer supplies one
stable ID per record.

Required contract repair:

- define a fixed stable-ID field/path and its allowed JSON type; or
- define a required schema annotation with unambiguous extraction semantics.

### `PR06C-LIMIT-005` — Update approval semantics are not representable

Severity: `P0`

The contract allows Current Production schema or scope to differ from the
Promotion Target only with explicit human approval. Eligibility validation
requires Target review state `PENDING`, and the manifest has no field that
records requested or approved schema/scope differences. A validator cannot
decide whether an Update difference is allowed.

Required contract repair:

- define separate pre-review and post-review validator modes; and
- add a canonical difference request plus approval binding, or require all
  schema/scope changes to block in the pre-review gate.

### `PR06C-LIMIT-006` — Validation evidence semantics are incomplete

Severity: `P0`

The manifest records an evidence path and SHA-256, but the contract defines no
evidence schema, required result binding, artifact identity binding, source
commit binding, or freshness rule. Hashing arbitrary bytes cannot prove that
Candidate validation evidence is complete or current.

Required contract repair:

- freeze a versioned validation-evidence schema;
- bind evidence to artifact SHA-256, schema identity, scope, source commit, and
  validator version;
- define deterministic freshness or supersession rules.

### `PR06C-LIMIT-007` — Role-owned artifact paths are undefined

Severity: `P1`

The contract requires `artifactPath` and `evidencePath` to be role-owned, but
it defines no allowed prefixes or cross-role reference rules. A validator
cannot distinguish a valid role-owned reference from ambiguous or shared
ownership.

Required contract repair:

- freeze allowed artifact and evidence path prefixes for Candidate, Current
  Production, and Promotion Target;
- define whether cross-role references are prohibited or explicitly allowed.

## Rules That Are Implementable

The following approved rules are sufficiently defined but cannot form a
complete PASS gate while the P0 findings remain:

- manifest schema version and exact known-field checks;
- exact role and manifest-path checks;
- Bootstrap/Update Current Production presence rules;
- Candidate-to-Target direct field equality;
- artifact byte size and SHA-256 checks;
- supported syllabus allowlist checks;
- UTF-8 stable-ID and scope canonical serialization after extraction;
- RFC 8785 schema canonicalization after schema resolution;
- review and execution metadata phase checks;
- normalized repository-relative path traversal checks.

Implementing only this subset would produce a misleading partial validator and
is therefore prohibited.

## Safety Evidence

Production changes: `0`

Candidate changes: `0`

Promotion Target changes: `0`

Authority manifest changes: `0`

Artifact changes: `0`

Parser changes: `0`

Frontend changes: `0`

Runtime behavior changes: `0`

PDF or corpus changes: `0`

Promotion execution: `0`

Deployment actions: `0`

## Required Human Contract Review

Review decision: `PENDING`

The next authorized phase is a contract repair, not validator implementation.
Human review must approve resolutions for all seven findings and publish
machine-readable schema, extraction, evidence, approval, and ownership rules.
Only after that repair is merged may validator implementation resume.
