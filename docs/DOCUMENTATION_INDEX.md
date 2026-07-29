# Documentation Index

Status: `CURRENT`

This page is the primary navigation entry for tracked project documentation.
It classifies documents by their present role; it does not change the status
or content of any referenced file.

## Active Documentation

| Entry | Purpose | Authority |
| --- | --- | --- |
| [Project README](../README.md) | Product overview, local startup, deployment configuration, and project structure | Authoritative current project entry |
| [Authoritative Document Map](AUTHORITATIVE_DOCUMENT_MAP.md) | Assigns one source of truth to each documentation subject | Authoritative ownership map |
| [Documentation Standard](DOCUMENTATION_STANDARD.md) | Proposed naming, metadata, link, and evidence-format rules | Becomes authoritative after PR-04 approval and merge |
| [Document Lifecycle Policy](DOCUMENT_LIFECYCLE_POLICY.md) | Proposed status, transition, authority, and mutability rules | Becomes authoritative after PR-04 approval and merge |

## Architecture Documentation

The repository does not currently contain a dedicated tracked architecture
guide. Until one is introduced through a reviewed change, the
[Project Structure section of the README](../README.md#project-structure) is
the authoritative high-level component map. Historical parser and canonical
model plans under `docs/archive/` are evidence, not current architecture.

## Development Documentation

| Entry | Purpose | Authority |
| --- | --- | --- |
| [Run instructions](../README.md#run) | Starting the application locally | Current operating instructions |
| [GitHub Push Checklist](../README.md#github-push-checklist) | Required checks before publishing a branch | Current contribution workflow |
| [Vercel GitHub Integration Checklist](../README.md#vercel-github-integration-checklist) | Preview and production deployment setup | Current deployment workflow |
| [package.json](../package.json) | Executable npm scripts and dependency declarations | Machine-readable script authority |

No separate development guide is currently tracked. The README and
`package.json` remain authoritative until PR-04 or a later reviewed change
creates one.

## Repository Maintenance

Use [PR History Index](PR_HISTORY_INDEX.md) for lifecycle navigation and the
following maintained evidence groups for detailed repository-governance
records:

- [Public maintenance summaries](repository-maintenance/public/)
- [PR-02A frozen archive plan](repository-maintenance/pr-02a/)
- [PR-02B execution and closure evidence](repository-maintenance/pr-02b/)
- [PR-03 reconstruction evidence](repository-maintenance/pr-03/)
- [PR-04 policy-freeze evidence](repository-maintenance/pr-04/)

Maintenance evidence describes completed governance work. It does not replace
the README for current product behavior.

## Historical Records

[PR History Index](PR_HISTORY_INDEX.md) maps PR-00 through PR-02B to purpose,
status, merge boundary, and retained evidence. Completed reports remain
historical evidence even when they live under `repository-maintenance/`.

## Archive

[Archive Index](ARCHIVE_INDEX.md) is the navigation authority for the 15
immutable historical PR documents under `docs/archive/prs/`. Archive material
is retained for traceability and must not be treated as current implementation
guidance without independent confirmation.

## Classification Rules

| Class | Meaning | Maintenance rule |
| --- | --- | --- |
| Active | Continuously used current guidance | Keep accurate with product changes |
| Architecture | Current component and ownership description | One declared authority per subject |
| Development | Current run, test, contribution, and deployment guidance | Prefer executable configuration where applicable |
| Maintenance | Repository-governance plans and verification evidence | Preserve status and audit semantics |
| Historical | Completed lifecycle records retained for traceability | Do not present as current requirements |
| Archive | Immutable historical material under `docs/archive/` | Navigate through `ARCHIVE_INDEX.md`; do not edit in place |

## Navigation Integrity

All local links in this index are validated by PR-03. If a target is moved in
a later approved phase, update the relevant index in the same change.
