# Phase 2 PDF Batch Ingestion Expansion

## 1. Overview

## Purpose

Phase 2 is the second validation stage of the CAIE Past Paper Parser
ingestion pipeline.

Phase 1 verified that the current architecture can correctly process a
small representative dataset.

Phase 2 expands the dataset size to evaluate:

-   parser stability at larger scale
-   PDF layout diversity
-   syllabus coverage
-   year/session variation
-   hidden extraction issues

The objective is not to make all PDFs production ready.

The objective is to collect large-scale staging data and discover
remaining edge cases.

------------------------------------------------------------------------

# 2. Current Status

Phase 1 completed successfully.

Dataset:

    20 PDFs

Result:

    20 PASS

    0 FAIL

    0 P0

    0 P1

    0 P2

Validated:

-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline
-   TEXT Quality Pipeline
-   Response Area Pipeline
-   Staging Workflow

Current architecture:

    PDF

    ↓

    Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Validation

is stable.

------------------------------------------------------------------------

# 3. Phase 2 Goals

## Goal 1: Increase Dataset Coverage

Expand from:

    20 PDFs

to:

    100-200 PDFs

The dataset should represent real CAIE usage scenarios.

------------------------------------------------------------------------

## Goal 2: Discover Layout Variations

CAIE PDFs vary by:

-   year
-   examination session
-   syllabus
-   component
-   paper variant

Phase 2 should identify:

-   unseen layouts
-   unusual formatting
-   missing regions
-   extraction inconsistencies

------------------------------------------------------------------------

## Goal 3: Validate Multi-Syllabus Support

Phase 2 must include:

## 0478

IGCSE Computer Science

## 9618

AS/A Level Computer Science

## 9709

Mathematics

Purpose:

Confirm that the architecture is not overfitted to one syllabus.

------------------------------------------------------------------------

## Goal 4: Build Production Readiness Evidence

Phase 2 should answer:

-   How stable is the parser?
-   What failure patterns remain?
-   Which validation rules are missing?
-   What requires future PRs?

------------------------------------------------------------------------

# 4. Scope

## Allowed Changes

Phase 2 may include:

    Batch ingestion scripts

    Manifest expansion

    Logging improvements

    Report generation improvements

    Dataset management

------------------------------------------------------------------------

## Forbidden Changes

Do NOT modify:

    Question Split

    Stable Question ID

    Parent / Leaf Question

    TEXT QUALITY Pipeline

    Response Area Pipeline

    Document Role Router

    Mark Scheme Architecture

    Canonical Schema

    Production Database

If failures appear:

Record them.

Do not immediately patch the parser.

------------------------------------------------------------------------

# 5. Dataset Strategy

Phase 2 should not randomly process files.

Use controlled manifests.

Example:

    staging-manifest-phase2.json

The manifest should define:

-   file path
-   syllabus
-   year
-   session
-   component
-   expected document role

------------------------------------------------------------------------

# 6. Dataset Size

Target:

    100-200 PDFs

Recommended distribution:

## 0478 Dataset

Target:

    50-80 PDFs

Coverage:

-   2019-2025
-   May/June
-   Oct/Nov
-   different variants

Include:

-   Question Papers
-   Mark Schemes

------------------------------------------------------------------------

## 9618 Dataset

Target:

    30-50 PDFs

Coverage:

-   AS/A Level papers
-   different components
-   different years

------------------------------------------------------------------------

## 9709 Dataset

Target:

    20-50 PDFs

Coverage:

-   Mathematics papers
-   different components
-   different sessions

------------------------------------------------------------------------

# 7. Execution Workflow

Continue using:

    PDF

    ↓

    Existing Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Validation Report

Production remains disabled.

------------------------------------------------------------------------

# 8. Batch Execution Requirements

## Independent Processing

Each PDF must run independently.

Example:

    PDF A

    PASS


    PDF B

    FAIL


    PDF C

    PASS

One failure must not stop the batch.

------------------------------------------------------------------------

# 9. Required Reports

Generate:

    phase2-ingestion-report.json

Required information:

## Summary

Example:

``` json
{
 "totalFiles":150,
 "successCount":145,
 "failedCount":5
}
```

------------------------------------------------------------------------

## Group Statistics

Report by:

-   syllabus
-   year
-   session
-   document role

Example:

``` json
{
 "0478":{
   "success":70,
   "failed":2
 }
}
```

------------------------------------------------------------------------

# 10. Failure Classification

Every failure must include:

    filename

    syllabus

    document role

    processing stage

    error code

    severity

    suspected root cause

Example:

``` json
{
 "file":"0478_xxx.pdf",
 "stage":"region_classification",
 "issue":"UNKNOWN_REGION",
 "severity":"P1"
}
```

------------------------------------------------------------------------

# 11. Logging

Maintain:

    logs/phase2/

Each PDF:

    filename.log

Include:

    start time

    end time

    parser version

    document role

    staging id

    validation result

    issues

------------------------------------------------------------------------

# 12. Regression Requirements

Phase 1 dataset must remain included.

Do not replace it.

Regression set:

    Phase 1 fixtures

    +

    New Phase 2 fixtures

Future parser changes must pass:

    Phase 1

    +

    Phase 2

------------------------------------------------------------------------

# 13. Success Criteria

Phase 2 is complete when:

## Dataset

-   100-200 PDFs processed
-   Multiple syllabus included
-   Multiple years included
-   Multiple sessions included

## Stability

-   No architecture failures
-   No document role regression
-   No TEXT Quality regression

## Analysis

A report exists containing:

-   total processed files
-   success rate
-   failure categories
-   recommended future PRs

------------------------------------------------------------------------

# 14. Expected Outcome

Phase 2 should produce:

## Known Stable Areas

Example:

    Question Split

    Document Role Router

    TEXT Quality

    Response Area

## Remaining Risk Areas

Example:

    Rare PDF Layout

    Special Region Classification

    Unusual Mark Scheme Format

These findings will guide future targeted PRs.

------------------------------------------------------------------------

# 15. Development Principle

Phase 2 is a validation and discovery stage.

Do not optimize for:

    100% immediate success

Optimize for:

    accurate understanding of failure patterns

Every failure should become evidence for a future isolated PR.

Do not turn Phase 2 into a large uncontrolled parser rewrite.

------------------------------------------------------------------------

# Final Pipeline Goal

    Large-scale Staging Validation

    ↓

    Failure Analysis

    ↓

    Targeted PRs

    ↓

    Canonical Completeness Gate

    ↓

    Production Ingestion

The system should evolve through controlled improvements, not emergency
fixes.
