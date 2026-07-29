# Documentation Standard

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-29T15:44:08Z`

Authoritative scope: Proposed repository-wide naming, metadata, linking, and
evidence-format standard. These candidate bytes become authoritative only
after human approval is recorded in the same bytes and GitHub PR #7 is merged
into the default branch.

Related documents:

- [Document Lifecycle Policy](DOCUMENT_LIFECYCLE_POLICY.md)
- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Authoritative Document Map](AUTHORITATIVE_DOCUMENT_MAP.md)

## Purpose

This standard makes documentation identity and evidence semantics predictable.
It is prospective: immutable archive content and frozen maintenance evidence
are not renamed or rewritten merely to match a newer convention.

## File Naming

### Long-lived documentation

Use `UPPER_SNAKE_CASE.md` for current standards, policies, indexes, and
authority maps:

```text
DOCUMENTATION_INDEX.md
DOCUMENTATION_STANDARD.md
DOCUMENT_LIFECYCLE_POLICY.md
AUTHORITATIVE_DOCUMENT_MAP.md
```

`README.md` is an allowed ecosystem-standard exception.

### Maintenance phase documents

Use `PR{NN}_{PURPOSE}_{TYPE}.md` for human-readable phase material:

```text
PR04_DOCUMENT_STANDARDIZATION_AUDIT.md
PR04_HUMAN_REVIEW.md
PR04_POST_MERGE_VERIFICATION.md
```

The filename uses `PR04` for stable sorting. The title and prose use the
canonical phase identifier `PR-04`. Suffixes must identify the document role,
such as `PLAN`, `AUDIT`, `REPORT`, `REVIEW`, `VERIFICATION`, or `INDEX`.

Use lowercase kebab-case for the paired machine-readable report:

```text
pr04-document-standardization-audit.json
```

### PR and stage identifiers

Canonical prose forms are:

```text
PR-04
PR-04A
PR-04B
PR-04-R1
```

Do not use `PR_04`, `pr04`, `phase04`, or another spelling as the phase
identifier in prose. Filename forms defined above remain valid.

### Forbidden ambiguous names

Do not create names such as:

```text
final.md
final2.md
latest.md
new-plan.md
fixed.md
debug-copy.md
report-final-final.md
```

Names must encode stable purpose and document type, not a temporary opinion
about recency.

### Legacy and immutable exceptions

- Files under `docs/archive/` retain their existing names.
- Completed audit evidence whose hash or historical identity depends on its
  path is not renamed without a separately approved migration.
- A naming deviation in protected evidence is recorded as
  `PROTECTED_NO_CHANGE`, not silently “fixed”.

## Required Metadata

New long-lived Markdown documents must declare near the top:

```text
Status: `DRAFT`
Owner: <owner>
Created at: <UTC ISO 8601>
Authoritative scope: <subject or NONE>
Related documents: <links>
```

Maintenance reports may additionally declare a phase result, but phase result
and lifecycle status must be separate fields:

```text
Status: `READY_FOR_HUMAN_REVIEW`
Result: `PASS_EXAMPLE_VALIDATION`
```

`PASS_*` is never a lifecycle status.

## Markdown and JSON Pairing

A report with a machine-readable counterpart uses:

```text
PR04_EXAMPLE_REPORT.md
pr04-example-report.json
```

The pair must agree on:

- phase or task identifier;
- lifecycle status;
- phase result;
- base SHA and relevant head SHA;
- final `generatedAt`;
- counts and validation outcomes.

The JSON report must name every protected file it hashes. It must not hash
itself.

## Evidence Generation

Use this order:

1. Complete and freeze standards or business documents.
2. Complete and freeze the Markdown report.
3. Compute byte size and SHA-256 from the frozen files.
4. Generate the JSON report last.
5. Parse JSON and re-verify every recorded hash.
6. Do not edit a hashed file without regenerating downstream evidence.

### Time fields

All timestamps use UTC ISO 8601.

- `initialAuditGeneratedAt`: first inventory or audit observation.
- `generatedAt`: final evidence generation after content is frozen.
- `reviewedAt`: human decision time.
- `mergedAt`: GitHub merge time.
- `verifiedAt`: post-merge verification time.

Final evidence must not retain a `generatedAt` earlier than the content it
describes.

### Validation result fields

Use `PASS`, `PASS_n_OF_n`, `PENDING`, `NOT_RUN`, or `BLOCKED` only when their
meaning is explicit. A PASS value may be written only after the corresponding
check executes successfully.

## Links and Navigation

- Use repository-relative links for tracked documents.
- Do not embed local absolute filesystem paths.
- A new authoritative document must be linked from
  `DOCUMENTATION_INDEX.md` and assigned in
  `AUTHORITATIVE_DOCUMENT_MAP.md` in the same PR.
- Local Markdown links and target anchors must be validated before review.
- Archived documents may be linked for history, never described as current
  implementation authority.

## Conditional Activation

A policy may declare `Status: CURRENT` in its final reviewed PR bytes when the
same document also declares an `Effective upon merge` condition. The document
is not authoritative merely because it exists on a feature branch. Authority
begins only when the named PR is merged into the default branch.

The approval record and activation condition must be present in the same final
reviewed bytes. A post-merge process must not be required to rewrite
`READY_FOR_HUMAN_REVIEW` into `CURRENT`.

## Change Control

Changes to this standard require:

1. a scoped PR;
2. link, authority, JSON, hash, and Git-boundary validation;
3. human review;
4. synchronized updates to the lifecycle policy or authority map when their
   semantics change.

Existing documents are not retroactively rewritten by this policy-freeze PR.
Approved metadata or naming work must occur in a later, independently bounded
execution phase.
