# Documentation Archive Topology

Status: `FROZEN_FOR_HUMAN_REVIEW`

## Purpose

This topology separates current authoritative entry points from historical PR, Phase, solution, review, and continuation-prompt material. PR-02A defines paths only; it performs no move, deletion, rename, restoration, or archive operation.

## Target tree

```text
docs/
|-- current/
|   |-- README.md
|   |-- PROJECT_STATUS.md
|   `-- CURRENT_DOCUMENT_INDEX.md
|-- architecture/
|-- contracts/
|-- runbooks/
|-- decisions/
|-- pr-history/
|   |-- README.md
|   `-- PR_INDEX.md
|-- archive/
|   |-- README.md
|   |-- prs/<PR-ID>/
|   |-- phases/<PHASE-ID>/
|   |-- solutions/
|   |-- reviews/
|   |-- continuation-prompts/
|   `-- obsolete-syllabus-scope/
`-- repository-maintenance/
```

## Directory responsibilities

- `current/`: current, authoritative navigation only; no historical copies.
- `architecture/`, `contracts/`, `runbooks/`, `decisions/`: current maintained documents with explicit ownership.
- `pr-history/`: compact PR indexes, not complete evidence payloads.
- `archive/prs/<PR-ID>/`: historical public-safe PR documents with confirmed identity.
- `archive/phases/<PHASE-ID>/`: historical public-safe Phase documents without a PR identity.
- `archive/solutions/`: historical solutions with proven non-current role.
- `archive/reviews/`: approved public-safe historical reviews; Human Review remains protected by default.
- `archive/continuation-prompts/`: approved public-safe prompts that are no longer active.
- `archive/obsolete-syllabus-scope/`: already isolated obsolete-scope material; it is not moved again by default.
- `repository-maintenance/`: immutable inventory, override, verification, and governance reports; never a move source in PR-02B.

## Admission rules

A future move requires a `docs/**/*.md|txt` source, effective action `CONSOLIDATE_AND_ARCHIVE`, confirmed identity and historical role, public-safe classification, current-main source presence with matching SHA-256, a unique allowed target, and explicit human approval. Tracked sources use `git mv`. Untracked sources remain deferred until a public/private decision. Ignored sources remain local/private unless overridden. Deleted sources are never restored without separate authority.

## Exclusions

PDF, JSON evidence, ZIP, images, logs, repository-maintenance full reports, Production, Candidate, Human Review, release gates, rollback, post-write validation, manifests/hashes, regression or golden fixtures, current contracts, active runbooks, supported-syllabus scope, and the current Question Rendering Contract cannot enter the move set. Active 9709 data paths must remain zero.

## Public/private boundary

Public archive material must contain no secret, private URL, local absolute path, restricted PDF content, full private inventory, `.env.local` content, token/key/password, or unnecessary internal inventory. Untracked material is `REVIEW_REQUIRED`; ignored material is `LOCAL_ONLY`; complete maintenance reports remain private-backup/local artifacts.

## Naming and collision rules

Targets retain the PR/Phase identity and source semantics. Case-insensitive target uniqueness is mandatory. `(1)`/`(2)` are converted only to an explicit `variant-N` recommendation after review. Different SHA-256 values may never share a target. No random suffix is permitted.
