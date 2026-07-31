# PR-06C Source-of-Truth Contract Human Review

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Source-of-truth audit](PR06C_SOURCE_OF_TRUTH_AUDIT.md)
- [Authority classification](PR06C_AUTHORITY_CLASSIFICATION.md)
- [Schema proposal](PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Promotion contract](PR06C_PROMOTION_CONTRACT.md)
- [Risk assessment](PR06C_RISK_ASSESSMENT.md)

## Decision

Human review decision: `PENDING`

Design blocker count: `0`

Implementation authorization: `NOT_AUTHORIZED`

## Review Checklist

- [ ] Candidate, Current Production, and Promotion Target are three independent
  roles.
- [ ] Current Candidate, Current Production, and Promotion Target authority are
  correctly recorded as absent.
- [ ] Proposed Candidate path is exactly
  `promotion/candidate/manifest.json`.
- [ ] Proposed Current Production path is exactly
  `promotion/production/manifest.json`.
- [ ] Proposed Promotion Target path is exactly
  `promotion/target/manifest.json`.
- [ ] Candidate identity is compared with Promotion Target, never required to
  equal Current Production.
- [ ] Bootstrap requires Current Production to be absent.
- [ ] Update requires a valid Current Production baseline and permits approved
  content upgrades.
- [ ] Generated index, delivery data, PDFs, runtime data, and historical
  evidence remain non-authoritative.
- [ ] Every manifest field has exactly one classification.
- [ ] Stable-ID, scope, and schema hashes have reproducible exact-byte rules.
- [ ] 0478 and 9618 are the only allowed syllabus identities.
- [ ] Missing required manifests, role ambiguity, unknown fields, and any 9709
  scope fail closed.
- [ ] Validation, authorization, and execution remain distinct.
- [ ] Production, Candidate, Promotion Target, PDF, parser, frontend, and
  runtime changes are all zero.
- [ ] No promotion validator or promotion execution was started.

## Approval Format

```text
PASS_PR06C_SOURCE_OF_TRUTH_CONTRACT_HUMAN_REVIEW
Reviewer: Amelia Cai
Review UTC timestamp: YYYY-MM-DDTHH:mm:ssZ
Decision: APPROVE
Approved Candidate manifest: promotion/candidate/manifest.json
Approved Current Production manifest: promotion/production/manifest.json
Approved Promotion Target manifest: promotion/target/manifest.json
Approved promotion modes: bootstrap, update
Approved manifest proposal version: 2
Approved implementation phase: PR-06C Promotion Gate Validator
```

Until that decision is recorded, the proposal has no current artifact
authority and promotion-gate implementation remains blocked.
