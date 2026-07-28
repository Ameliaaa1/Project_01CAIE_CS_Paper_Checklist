# Phase 1 PDF Batch Ingestion Validation

## 1. Overview

## Purpose

Phase 1 is the first large-scale validation stage of the CAIE Past Paper
Parser ingestion pipeline.

The objective is not to improve parser accuracy or modify existing
parsing logic.

The objective is to verify that the current architecture can process
different CAIE PDF formats consistently and generate reliable Staging
outputs.

The workflow covered in Phase 1:

    PDF

    ↓

    Existing Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Validation Report

Production publishing is explicitly excluded.

------------------------------------------------------------------------

# 2. Background

The current CAIE parsing system supports:

-   Question Paper parsing
-   Mark Scheme parsing
-   Document Role Detection
-   Document Profile Routing
-   Canonical Data Generation
-   Staging Validation

Current document profiles:

    QUESTION_PAPER

    MARK_SCHEME

Each document type has its own processing and validation rules.

------------------------------------------------------------------------

# 3. Phase 1 Goals

Phase 1 has five goals.

## Goal 1: Verify PDF Pipeline Stability

Confirm that representative CAIE PDFs can successfully pass through:

    PDF

    ↓

    Parser

    ↓

    Canonical Model

    ↓

    Staging

------------------------------------------------------------------------

## Goal 2: Verify Document Role Separation

Confirm that:

Question Paper PDFs are identified as:

    question_paper

Mark Scheme PDFs are identified as:

    mark_scheme

Incorrect role detection should be recorded as a failure.

------------------------------------------------------------------------

## Goal 3: Collect Real PDF Layout Variations

CAIE PDFs are not identical.

Different years, sessions, components, and subjects may contain
different layouts.

Phase 1 collects:

-   layout differences
-   extraction failures
-   classification problems
-   validation issues

These findings will guide future PRs.

------------------------------------------------------------------------

## Goal 4: Validate Staging Workflow

Confirm:

-   staging records are generated correctly
-   validation results are stored
-   logs are available
-   failures are traceable

------------------------------------------------------------------------

## Goal 5: Establish Regression Dataset

The Phase 1 PDF set will become the first controlled regression dataset.

Future parser changes must be tested against this dataset.

------------------------------------------------------------------------

# 4. Non-Goals

Phase 1 does NOT include:

## Parser Improvements

Do not modify:

-   PDF extraction
-   span extraction
-   region classifier
-   question parser
-   mark scheme parser

------------------------------------------------------------------------

## Schema Changes

Do not redesign:

-   Question model
-   Leaf Question model
-   Mark Scheme model
-   Source Trace model

------------------------------------------------------------------------

## Validation Changes

Do not modify:

-   existing validation rules
-   Publish Gate
-   Production rules

------------------------------------------------------------------------

## Production Publishing

Phase 1 stops at:

    Staging

No data should be written into:

    Production Database

------------------------------------------------------------------------

# 5. Dataset Strategy

Phase 1 should not scan all PDFs automatically.

Use an explicit manifest.

Example:

    staging-manifest-phase1.json

The manifest defines:

-   PDF path
-   expected document role
-   test coverage purpose

------------------------------------------------------------------------

# 6. Dataset Requirements

The first dataset should contain approximately:

    20 PDFs

The dataset should cover:

## Question Papers

Include:

-   different years
-   different sessions
-   different variants

Examples:

    0478_s23_qp_12.pdf

    0478_s25_qp_12.pdf

    0478_w25_qp_11.pdf

------------------------------------------------------------------------

## Mark Schemes

Include:

-   different years
-   different sessions
-   different subjects

Examples:

    0478_s23_ms_12.pdf

    0478_w25_ms_11.pdf

Also include samples from:

    9618

    9709

Purpose:

Verify that the architecture works beyond a single syllabus.

------------------------------------------------------------------------

# 7. Batch Execution Requirements

## Independent Processing

Each PDF must be processed independently.

Example:

    PDF A
    PASS

    PDF B
    FAIL

    PDF C
    PASS

One failure must not terminate the entire batch.

------------------------------------------------------------------------

## Required Output

Each PDF should generate:

-   staging output
-   validation result
-   execution log

------------------------------------------------------------------------

# 8. Manifest Requirements

Example:

``` json
[
  {
    "file": "path/to/file.pdf",
    "expectedRole": "question_paper"
  },
  {
    "file": "path/to/file.pdf",
    "expectedRole": "mark_scheme"
  }
]
```

The manifest is the source of truth for Phase 1 execution.

------------------------------------------------------------------------

# 9. Validation Requirements

Each processed PDF should verify:

## Document Role

Expected:

    manifest.expectedRole
    =
    parser.documentRole

------------------------------------------------------------------------

## Staging Generation

Verify:

-   staging record exists
-   parser output is stored
-   validation result exists

------------------------------------------------------------------------

## Failure Recording

Every failure must include:

-   PDF filename
-   processing stage
-   error message
-   severity
-   suspected root cause

------------------------------------------------------------------------

# 10. Reporting

After completion generate:

    phase1-ingestion-report.json

Example:

``` json
{
  "totalFiles":20,
  "successCount":18,
  "failedCount":2,
  "failures":[]
}
```

The report is used for:

-   parser evaluation
-   regression planning
-   future PR prioritization

------------------------------------------------------------------------

# 11. Logging

Each PDF should have an independent log.

Example:

    logs/phase1/

    0478_s23_qp_12.log

    0478_s23_ms_12.log

Logs should include:

-   filename
-   start time
-   end time
-   parser version
-   document role
-   staging ID
-   validation status
-   errors

------------------------------------------------------------------------

# 12. Expected Phase 1 Result

Successful completion means:

-   representative PDFs processed
-   Question Paper and Mark Scheme routing verified
-   Staging workflow validated
-   failures collected
-   regression dataset established

It does NOT mean:

-   all PDFs are production ready
-   all parser issues are fixed
-   all canonical validation is complete

------------------------------------------------------------------------

# 13. Next Phase

After Phase 1:

Review collected failures.

Possible future PRs:

## PR-021

Mark Scheme Canonical Extraction Hardening

Possible scope:

-   mark extraction completeness
-   answer segmentation
-   mark allocation validation

## Future

Canonical Completeness Gate

Purpose:

Prevent structurally incomplete data from reaching production.

------------------------------------------------------------------------

# Final Principle

Phase 1 is a data collection and stability validation phase.

Do not fix individual PDF failures during this phase.

Collect evidence first.

Then design targeted fixes based on real failure patterns.
