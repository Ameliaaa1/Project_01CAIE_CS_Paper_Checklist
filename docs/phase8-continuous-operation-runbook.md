# Phase 8 Continuous Operation Runbook

## Required sequence

1. Collect source PDFs.
2. Verify the document profile.
3. Run parser processing.
4. Generate canonical data.
5. Build and validate staging.
6. Run cross-syllabus regression.
7. Evaluate strict production eligibility.
8. Publish only when the gate returns ELIGIBLE.
9. Generate ingestion, validation, regression, and production-change reports.

Direct PDF-to-production writes are prohibited.

## Strict production gate

Publishing requires validation PASS, completeness PASS, canonical publishable=true, P0=0, P1=0, and regression PASS. Any missing or failed condition returns DO_NOT_PUBLISH.

## Change governance

Before a production write, create verified production, canonical, and source snapshots. Every change record must contain change ID, timestamp, reason, affected pairs, before and after snapshots, validation result, and rollback point.

Rollback remains a separate explicitly authorized operation. Routine monitoring and preflight commands are read-only.

## Commands

```bash
npm run pdf:phase8-continuous-operation
DATABASE_URL='postgresql://paperlens:paperlens@localhost:5432/paperlens' npx prisma validate
npm test
```

Operational artifacts are written under `output/continuous-operation/` using project-relative paths.
