# PR-06C Source-of-Truth Schema Proposal

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Authority classification](PR06C_AUTHORITY_CLASSIFICATION.md)
- [Promotion contract](PR06C_PROMOTION_CONTRACT.md)
- [Risk assessment](PR06C_RISK_ASSESSMENT.md)

## Status

Schema state: `PROPOSED_PENDING_HUMAN_APPROVAL`

Schema owner: Promotion contract maintainers

No manifest instance or artifact payload is created in this phase.

## Common Manifest Shape

Candidate, Current Production, and Promotion Target use the same versioned
identity envelope. This repaired proposal is version 2:

```json
{
  "schemaVersion": 2,
  "authorityRole": "candidate",
  "lifecycleState": "CANDIDATE_VALIDATED",
  "artifact": {
    "artifactId": "paperlens-question-corpus",
    "artifactVersion": "reviewed-version",
    "artifactPath": "repository-relative/path.json",
    "sizeBytes": 0,
    "sha256": "64-lowercase-hex",
    "recordCount": 0,
    "stableIdSetSha256": "64-lowercase-hex"
  },
  "scope": {
    "supportedSyllabi": ["0478", "9618"],
    "scopeSha256": "64-lowercase-hex"
  },
  "schema": {
    "artifactSchemaId": "stable-schema-id",
    "artifactSchemaVersion": 1,
    "artifactSchemaSha256": "64-lowercase-hex"
  },
  "provenance": {
    "sourceCommit": "40-lowercase-hex",
    "generatedAt": "UTC ISO 8601",
    "generator": "stable-entrypoint"
  },
  "validation": {
    "result": "PASS",
    "validatedAt": "UTC ISO 8601",
    "evidencePath": "repository-relative/report.json",
    "evidenceSha256": "64-lowercase-hex"
  },
  "promotion": {
    "mode": null,
    "baselineProductionSha256": null,
    "reviewDecision": "PENDING",
    "reviewer": null,
    "reviewedAt": null,
    "promotionId": null
  }
}
```

Allowed `authorityRole` values and exact paths are:

- `candidate`: `promotion/candidate/manifest.json`
- `current-production`: `promotion/production/manifest.json`
- `promotion-target`: `promotion/target/manifest.json`

Current Production uses `PRODUCTION_CURRENT`. Promotion Target uses
`TARGET_VALIDATED` or `READY_FOR_HUMAN_REVIEW`. Fields are not optional merely
because a payload or baseline currently happens to be absent.

Candidate promotion metadata is entirely null. Promotion Target sets `mode`,
sets `baselineProductionSha256` only for Update, and keeps review/execution
fields pending or null until their authorized phases. Current Production
retains the approved metadata of the promotion that created it.

## Complete Field Classification

Each supported field has exactly one category. Unknown fields block.

| Field | Category | Validation rule |
| --- | --- | --- |
| `schemaVersion` | `FORBIDDEN_CHANGE` | Exactly 2 in every role; any other value blocks |
| `authorityRole` | `ALLOWED_DIFFERENCE` | Must match the exact manifest path and supported role |
| `lifecycleState` | `ALLOWED_DIFFERENCE` | Must be a state allowed for that role and phase |
| `artifact.artifactId` | `FORBIDDEN_CHANGE` | Exactly `paperlens-question-corpus` |
| `artifact.artifactVersion` | `IDENTITY_EQUAL` | Candidate equals Target; Current may differ in Update |
| `artifact.artifactPath` | `ALLOWED_DIFFERENCE` | Role-owned, normalized repository-relative path |
| `artifact.sizeBytes` | `DERIVED_FIELD` | Recomputed from exact artifact bytes |
| `artifact.sha256` | `DERIVED_FIELD` | SHA-256 of exact artifact bytes |
| `artifact.recordCount` | `DERIVED_FIELD` | Recomputed from schema-defined record collection |
| `artifact.stableIdSetSha256` | `DERIVED_FIELD` | Recomputed by the frozen stable-ID algorithm |
| `scope.supportedSyllabi` | `IDENTITY_EQUAL` | Candidate equals Target; Current may differ only with approval |
| `scope.scopeSha256` | `DERIVED_FIELD` | Recomputed by the frozen scope algorithm |
| `schema.artifactSchemaId` | `IDENTITY_EQUAL` | Candidate equals Target; Current change requires approval |
| `schema.artifactSchemaVersion` | `IDENTITY_EQUAL` | Candidate equals Target; Current change requires approval |
| `schema.artifactSchemaSha256` | `DERIVED_FIELD` | Recomputed by the frozen schema algorithm |
| `provenance.sourceCommit` | `IDENTITY_EQUAL` | Candidate equals Target; full reachable Git SHA |
| `provenance.generatedAt` | `ALLOWED_DIFFERENCE` | Role-local UTC timestamp |
| `provenance.generator` | `ALLOWED_DIFFERENCE` | Registered deterministic entrypoint for that role |
| `validation.result` | `ALLOWED_DIFFERENCE` | Must be PASS before Target review |
| `validation.validatedAt` | `ALLOWED_DIFFERENCE` | Role-local UTC timestamp |
| `validation.evidencePath` | `ALLOWED_DIFFERENCE` | Role-owned, normalized repository-relative path |
| `validation.evidenceSha256` | `DERIVED_FIELD` | SHA-256 of exact validation-evidence bytes |
| `promotion.mode` | `EXECUTION_METADATA` | Candidate null; Target `bootstrap` or `update`; retained by Current after execution |
| `promotion.baselineProductionSha256` | `EXECUTION_METADATA` | Candidate/Bootstrap null; Update Target exact Current artifact hash |
| `promotion.reviewDecision` | `EXECUTION_METADATA` | Candidate/Target PENDING until review; Current retains APPROVE |
| `promotion.reviewer` | `EXECUTION_METADATA` | Null until human review; retained by Current after execution |
| `promotion.reviewedAt` | `EXECUTION_METADATA` | Null until human review; retained by Current after execution |
| `promotion.promotionId` | `EXECUTION_METADATA` | Null until separately authorized execution; retained by Current afterward |

`IDENTITY_EQUAL` means Candidate and Promotion Target are exactly equal.
`DERIVED_FIELD` means each role independently recomputes the value and
Candidate must still equal Target. `FORBIDDEN_CHANGE` is invariant across all
roles. `EXECUTION_METADATA` never establishes content identity and its
presence does not prove execution.

## Hash Canonicalization

All hashes use SHA-256 and lowercase hexadecimal output. Text inputs are UTF-8
without a byte-order mark. Duplicate JSON object keys, invalid UTF-8, CRLF,
non-string identifiers, or unpaired Unicode surrogates block before hashing.

### Stable-ID Set Hash

1. Read the schema-defined record collection.
2. Extract exactly one non-empty stable-ID string per record.
3. Reject missing, empty, non-string, or duplicate IDs.
4. Sort IDs by unsigned lexicographic comparison of their UTF-8 bytes.
5. JSON-escape each ID and serialize one compact JSON array with no spaces.
6. Append exactly one LF byte.
7. Hash those exact bytes.

The empty input serializes as `[]\n` for algorithm completeness, but an empty
artifact is prohibited and therefore blocks.

### Scope Hash

1. Reject duplicates, empty strings, and values outside `0478` and `9618`.
2. Sort syllabus strings by unsigned UTF-8 byte order.
3. Serialize exactly
   `{"supportedSyllabi":["0478","9618"]}\n`, with the actual sorted values and
   no spaces.
4. Hash those exact bytes.

An empty scope would serialize as `{"supportedSyllabi":[]}\n` but is prohibited
and blocks.

### Artifact Schema Hash

1. Parse the registered artifact schema as I-JSON; reject duplicate keys,
   non-finite numbers, and invalid Unicode.
2. Serialize it exactly with RFC 8785 JSON Canonicalization Scheme (JCS).
   JCS fixes object-key ordering, string escaping, number formatting, and
   UTF-8 encoding; array order remains schema-significant.
3. Hash the exact JCS bytes with no byte-order mark, prefix, suffix, or trailing
   LF.

An empty schema object canonicalizes as `{}` but is prohibited and blocks. The
schema hash never includes the manifest that records it, avoiding a
self-reference.

## Validation Requirements

1. JSON parses and contains only the supported schema version.
2. Paths are repository-relative, normalized, and cannot escape the checkout.
3. Referenced artifact and evidence files exist.
4. Recorded sizes and SHA-256 values match current bytes.
5. Record count and all derived hashes reproduce under the frozen algorithms.
6. Supported syllabus values are unique, sorted, and a subset of 0478/9618.
7. `9709` or any other syllabus blocks.
8. Source commit is a full Git SHA reachable from the reviewed branch.
9. Candidate and Promotion Target identity fields match exactly.
10. Bootstrap/Update Current Production presence rules pass.
11. Every field has one classification and unknown fields block.
12. Candidate, Current Production, and Target mutation are outside the
    validator's authority.

## Schema Ownership Boundary

Schema changes require a separate reviewed contract change. A validator must
fail closed on unknown versions; it must not infer or silently upgrade fields.
