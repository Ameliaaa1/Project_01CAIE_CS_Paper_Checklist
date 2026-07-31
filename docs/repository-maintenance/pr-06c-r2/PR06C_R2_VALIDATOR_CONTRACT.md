# PR-06C-R2 Validator Contract v3

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Promotion contract maintainers

Created at: `2026-07-31T09:37:22Z`

Authoritative scope: NONE

Related documents:

- [Contract completion report](PR06C_R2_CONTRACT_COMPLETION_REPORT.md)
- [Limitation closure matrix](PR06C_R2_LIMITATION_CLOSURE_MATRIX.md)
- [Human review](PR06C_R2_HUMAN_REVIEW.md)
- [Prior limitation report](../pr-06c-validator/PR06C_PROMOTION_GATE_VALIDATOR_CONTRACT_LIMITATION_REPORT.md)

## Machine Authority Proposal

Contract version 3 is defined by these proposed contract files. They remain
outside the active-authority registry until human approval:

- `contracts/promotion/promotion-validator-contract-v3.json`
- `contracts/promotion/schema-registry-v1.json`
- `contracts/promotion/schemas/promotion-manifest-v3.schema.json`
- `contracts/promotion/schemas/question-corpus-v1.schema.json`
- `contracts/promotion/schemas/promotion-validation-evidence-v1.schema.json`
- `contracts/promotion/schemas/update-difference-request-v1.schema.json`
- `contracts/promotion/schemas/update-approval-v1.schema.json`

The JSON contract is normative. This document explains it without replacing
its machine-readable values.

## Schema Resolution and Allowlist

The exact registry path is
`contracts/promotion/schema-registry-v1.json`. The contract binds its exact
byte SHA-256. Registry entries are keyed by `(schemaId, version)`; duplicate
keys, duplicate paths, missing files, or RFC 8785 canonical-hash mismatches
block.

The only allowed artifact schema is:

| ID | Version | Exact path |
| --- | ---: | --- |
| `paperlens-question-corpus-records` | 1 | `contracts/promotion/schemas/question-corpus-v1.schema.json` |

An artifact manifest must match the registered ID, version, path, and
canonical SHA-256. Self-declared or unregistered schemas block.

## Artifact and Record Extraction

The artifact is a JSON object with exactly two envelope fields:
`schemaVersion: 1` and `records`. `records` is selected by JSON Pointer
`/records`, must be one non-empty array, and is the only record collection.

`recordCount` is the JSON array length. A missing collection, additional
candidate collection, empty collection, invalid record, or non-array value
blocks.

Each record supplies:

- stable ID at relative JSON Pointer `/stableId`;
- syllabus at relative JSON Pointer `/syllabus`.

Stable IDs are non-empty JSON strings. No trimming, case folding, Unicode
normalization, or other transformation is allowed. Duplicate exact strings
block. IDs are sorted by unsigned UTF-8 byte order, serialized as one compact
JSON array plus one LF byte, and SHA-256 hashed.

The supported scope is the sorted unique set of observed record syllabi and
must equal the manifest scope exactly. Only `0478` and `9618` are allowed.

## Update Difference and Approval

Every Update requires a difference request, even when schema and scope are
unchanged. It binds the Current Production, Candidate, and Promotion Target
artifact SHA-256 values, source commit, schema from/to identities, and exact
scope set difference.

Validation has two explicit phases:

1. Pre-review validates the request and returns
   `READY_FOR_HUMAN_REVIEW`. Target review remains `PENDING`; approval evidence
   must be absent.
2. Post-review requires an approval document with `APPROVE`, reviewer, UTC
   timestamp, request path/hash/ID, all three artifact hashes, source commit,
   and booleans that exactly match detected schema and scope changes.

An unrequested difference, an approval for a difference that is not present,
`REJECT`, stale binding, or changed request blocks. Difference detection is
not promotion execution.

## Validation Evidence

Evidence uses schema `paperlens-promotion-validation-evidence` version 1 and
binds all of:

- validator ID, version, and contract version;
- role, manifest path, and manifest hash;
- full artifact identity, size, hashes, and record count;
- schema ID, version, path, and canonical hash;
- sorted syllabus scope and scope hash;
- source commit and validation phase.

Evidence has no wall-clock expiry. It becomes stale immediately if any binding
differs, if its validator version is not allowed, or if the manifest no longer
references its exact path and byte hash. Evidence `generatedAt` must equal the
manifest `validatedAt`.

Supersession is optional but deterministic: the prior evidence must exist and
match its recorded hash; role, phase, and artifact ID remain equal; the new
timestamp is strictly later; cycles and self-reference block.

## Role-Owned Paths

| Role | Manifest | Artifact prefix | Evidence prefix |
| --- | --- | --- | --- |
| Candidate | `promotion/candidate/manifest.json` | `promotion/candidate/artifacts/` | `promotion/candidate/evidence/` |
| Current Production | `promotion/production/manifest.json` | `promotion/production/artifacts/` | `promotion/production/evidence/` |
| Promotion Target | `promotion/target/manifest.json` | `promotion/target/artifacts/` | `promotion/target/evidence/` |

Cross-role artifact and evidence references block. Paths must use `/`, be
repository-relative, contain no empty, dot, parent, backslash, or NUL segment,
resolve inside the checkout, and traverse no symlink. `.git/`, `data/`,
`docs/`, `generated/`, `public/`, and `node_modules/` are forbidden authority
prefixes.

## Safety Boundary

The future validator defaults to read-only. Evidence is emitted to stdout or a
caller-selected path outside all authority prefixes. Authority writes,
Production writes, promotion execution, and deployment actions are prohibited.

This phase creates contract definitions only. It creates no validator,
fixture, manifest, artifact, or promotion result.
