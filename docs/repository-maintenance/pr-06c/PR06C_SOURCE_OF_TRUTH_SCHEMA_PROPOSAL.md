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

Candidate and Production manifests use the same versioned identity envelope:

```json
{
  "schemaVersion": 1,
  "authorityClass": "candidate",
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
    "reviewDecision": "PENDING",
    "reviewer": null,
    "reviewedAt": null,
    "promotionId": null
  }
}
```

Production uses `authorityClass: "production"` and
`lifecycleState: "PRODUCTION_CURRENT"`. Fields are not optional merely because
the payload currently happens to be empty.

## Identity Fields

The following define the promoted content identity:

- `artifact.artifactId`
- `artifact.artifactVersion`
- `artifact.sizeBytes`
- `artifact.sha256`
- `artifact.recordCount`
- `artifact.stableIdSetSha256`
- `scope.supportedSyllabi`
- `scope.scopeSha256`
- `schema.artifactSchemaId`
- `schema.artifactSchemaVersion`
- `schema.artifactSchemaSha256`

`artifactPath` locates bytes but does not define their identity.

## Validation Requirements

1. JSON parses and contains only the supported schema version.
2. Paths are repository-relative, normalized, and cannot escape the checkout.
3. Referenced artifact and evidence files exist.
4. Recorded sizes and SHA-256 values match current bytes.
5. Record count and stable-ID set hash reproduce from the artifact.
6. Supported syllabus values are unique, sorted, and a subset of 0478/9618.
7. `9709` or any other syllabus blocks.
8. Source commit is a full Git SHA reachable from the reviewed branch.
9. Candidate validation result is PASS before promotion review.
10. Production manifest mutation is outside the validator's authority.

## Schema Ownership Boundary

Schema changes require a separate reviewed contract change. A validator must
fail closed on unknown versions; it must not infer or silently upgrade fields.
