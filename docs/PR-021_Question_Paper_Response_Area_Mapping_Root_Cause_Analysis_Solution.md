# PR-021 Question Paper Response Area Mapping Root Cause Analysis Solution

## PR Information

**PR ID:** PR-021

**Title:** Question Paper Response Area Mapping Root Cause Analysis

## Objective

Resolve Phase 1 ingestion failures related to Question Paper processing.

Main issues:

-   RESPONSE_AREA_MAPPING_INCOMPLETE
-   DUPLICATE_ID

This PR is not a parser rewrite. The goal is to identify and fix the
minimum broken link in the existing pipeline.

# 1. Phase 1 Findings

Phase 1 processed:

    20 PDFs

Result:

    Success: 10
    Failed: 10

Failure distribution:

-   Question Paper: 9 failures
-   Mark Scheme: 1 failure

Main failure types:

    RESPONSE_AREA_MAPPING_INCOMPLETE

    DUPLICATE_ID

# 2. Root Cause Analysis

## Issue A: Response Area Mapping

Expected pipeline:

    Question Parser

    ↓

    Leaf Question

    ↓

    Response Area Detection

    ↓

    Response Area Mapping

    ↓

    Validation

Current failures indicate that question extraction and response area
extraction may work individually, but the relationship between them is
incomplete.

Investigation must check:

    Response Area Detection

    ↓

    response_areas_json

    ↓

    Leaf Question Mapping

    ↓

    Validation

Do not immediately modify Response Area extraction.

Possible causes:

1.  Response area exists but is not mapped to the correct leaf question.

2.  Validation requires response areas for question types that do not
    contain candidate response areas.

# 3. Issue B: Duplicate ID

Example:

    Duplicate question id:
    0478-2023-MJ-12-Q1

Stable Question ID is already a stable component.

Do not modify ID generation first.

Investigate:

    PDF Extraction

    ↓

    Question Parsing

    ↓

    Canonical Model Construction

    ↓

    Aggregation

Possible causes:

-   Same question emitted by multiple parsing paths.
-   Duplicate created during canonical aggregation.

# 4. Scope

## Allowed

Modify only:

    Response Area Mapping Logic

    Response Area Mapping Debugging

    Question Aggregation Debugging

    Duplicate Detection Logging

    Regression Tests

## Forbidden

Do not modify:

    Question Split

    Stable Question ID Algorithm

    Parent / Leaf Question Model

    TEXT QUALITY Pipeline

    Document Role Router

    Mark Scheme Pipeline

    Production Database

# 5. Required Debug Output

## Response Area Debug

For every failed question output:

``` json
{
  "questionId":"Q3(a)",
  "leafQuestionExists":true,
  "responseAreasDetected":2,
  "mappedResponseAreas":0,
  "sourceTrace":[]
}
```

## Duplicate ID Debug

When duplicate occurs:

``` json
{
  "questionId":"0478-2023-MJ-12-Q1",
  "instances":2,
  "sources":[]
}
```

# 6. Regression Tests

Add fixtures:

    0478_s23_qp_12.pdf

    0478_s25_qp_12.pdf

    0478_w25_qp_11.pdf

Required tests:

-   Leaf Question to Response Area mapping
-   Duplicate stable ID detection

# 7. Implementation Order

## Step 1

Add diagnostics only.

Do not change behavior.

## Step 2

Run failing Phase 1 PDFs again.

## Step 3

Identify the exact failure layer.

## Step 4

Apply minimal fix.

## Step 5

Run regression tests.

# 8. Success Criteria

PR-021 is complete when:

-   Response Area mapping failures are resolved or correctly classified.
-   Stable Question IDs remain unchanged.
-   No duplicate IDs are produced.
-   Existing stable modules remain PASS.

Stable modules:

    TEXT QUALITY

    Question Split

    Leaf Question

    Marks Validation

    Document Role Router

# Final Principle

The goal is not to improve all Question Paper parsing.

The goal is to repair the exact broken connections:

    Leaf Question

    ↓

    Response Area Mapping

and:

    Question Extraction

    ↓

    Canonical ID Aggregation

with the smallest possible change.
