# PR-028 Production Expansion Runbook

## Expansion Order

1. Phase A: 0478, 2023 May-June, all available components.
2. Phase B: 0478, 2020-2023.
3. Phase C: add supported syllabus 9618.
4. Phase D: migrate all supported PDFs only after A-C pass.

9709 is not supported and must not be counted as a gap, failure, or publish candidate.

## Plan Phase A

```bash
npm run pdf:production-expansion
```

The planner scans QP/MS pairs, approved Phase2 staging artifacts, and existing production identities. A pair can be:

- `ELIGIBLE`: both staging artifacts exist and production identity is unused.
- `ALREADY_PUBLISHED`: the stable QP/MS identity already exists.
- `BLOCKED`: the pair lacks approved staging artifacts.

No production write occurs during planning.

## Execute A Batch

```bash
npm run pdf:production-expansion -- --confirm --batch-id=PR028-0478-2023-MJ
```

Execution is allowed only when every Phase A pair is either eligible or already published. Eligible pairs are written to an isolated transaction store first. The production store is atomically replaced only after all pair gates and post-write checks pass.

## Roll Back A Batch

```bash
npm run pdf:production-expansion -- --rollback --batch-id=PR028-0478-2023-MJ
```

Rollback removes only child batches, papers, questions, response areas, mark-scheme entries, pairings, and metadata owned by the exact expansion batch. It never clears the production store.

## Required Checks

Each pair re-reads staging JSON and must pass validation, canonical completeness, publish gate, supported-syllabus, document-role, pairing, identity, source-trace, count, and frontend capability checks.

Every expansion must retain Phase1 `20/20`, Phase2 `120/120`, and empty architecture, document-role, and text-quality regression arrays.

## Current Phase A State

- Component 12: already published by PR-027.
- Components 11, 13, 21, 22, 23: blocked until QP/MS staging pairs are admitted through the controlled Phase2 workflow.
- Full production migration remains disabled.
