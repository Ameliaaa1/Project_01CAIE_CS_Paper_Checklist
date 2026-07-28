# PR-021 Barcode Region Classification Edge Case Fix

## PR Information

**PR ID**

PR-021

**Title**

Barcode Region Classification Edge Case Fix

## Objective

Fix the Phase 1 ingestion failure:

    BARCODE_TEXT_PRESENT

found in:

    0478_w23_ms_23.pdf

The goal is to prevent barcode or control text from entering Canonical
Text.

This PR is a small edge-case fix.

It does not redesign the TEXT QUALITY pipeline.

------------------------------------------------------------------------

# 1. Background

Phase 1 batch ingestion result:

    20 PDFs processed

    19 PASS

    1 FAIL

The only failure:

    0478_w23_ms_23.pdf

Failure:

    BARCODE_TEXT_PRESENT

Current stable components:

-   PyMuPDF rawdict extraction
-   Span extraction
-   Region Classification architecture
-   Canonical Text Builder
-   Text Quality Validation

remain unchanged.

------------------------------------------------------------------------

# 2. Root Cause Hypothesis

The previous TEXT QUALITY issue was:

    Barcode

    ↓

    Canonical Text

    ↓

    Metric inconsistency

This has already been fixed.

The current failure is different.

The likely issue:

A special PDF layout contains barcode/control spans that are not
classified as:

    BARCODE

before entering Canonical Text.

Expected:

    PDF

    ↓

    Raw Span

    ↓

    Region Classification

    ↓

    BARCODE

    ↓

    Excluded

Current suspected behavior:

    PDF

    ↓

    Raw Span

    ↓

    Unknown / Footer / Other Region

    ↓

    Canonical Text

    ↓

    Validation Failure

------------------------------------------------------------------------

# 3. Scope

## Allowed Changes

This PR may modify:

    Barcode region detection

    Region classification rules

    Barcode-related regression tests

    Golden Fixtures

------------------------------------------------------------------------

## Forbidden Changes

Do not modify:

    Question Split

    Stable Question ID

    Parent / Leaf Question

    Response Area Pipeline

    Document Role Router

    Mark Scheme Pipeline

    Canonical Schema

    Publish Gate Architecture

Do not rewrite:

    TEXT QUALITY Pipeline

The existing pipeline remains the foundation.

------------------------------------------------------------------------

# 4. Investigation Steps

## Step 1

Inspect raw PDF spans from:

    0478_w23_ms_23.pdf

Using:

    page.get_text("rawdict")

Identify:

-   page number
-   block index
-   line index
-   span index
-   text
-   bounding box

------------------------------------------------------------------------

## Step 2

Compare region classification result.

Expected:

    BARCODE

If classified as:

    UNKNOWN

    FOOTER

    VISUAL

    MARGIN

this is the bug location.

------------------------------------------------------------------------

# 5. Implementation Strategy

## Minimal Fix

Add or refine barcode classification rule.

Example:

Before:

    span

    ↓

    generic region classifier

After:

    span

    ↓

    barcode detector

    ↓

    BARCODE region

    ↓

    exclude from canonical text

------------------------------------------------------------------------

# 6. Do Not Add Broad Text Filters

Do NOT solve this by:

-   deleting suspicious characters
-   removing all short text
-   removing footer-like text globally

Reason:

Barcode filtering belongs to:

    Region Classification

not:

    Text Cleaning

Broad text removal may delete valid:

-   question numbers
-   marks
-   symbols
-   technical terms

------------------------------------------------------------------------

# 7. Regression Tests

Add fixture:

    0478_w23_ms_23.pdf

Required test:

## Barcode Exclusion Test

Input:

    PDF spans

Expected:

Barcode spans:

    regionType = BARCODE

and:

    not included in normalizedText

------------------------------------------------------------------------

# 8. Validation

After implementation rerun:

Phase 1 regression set:

    20 PDFs

Expected:

    BARCODE_TEXT_PRESENT = 0

All previously passing PDFs must remain PASS.

------------------------------------------------------------------------

# 9. Success Criteria

PR-021 is complete when:

-   0478_w23_ms_23.pdf passes validation
-   Barcode text does not enter Canonical Text
-   TEXT QUALITY metrics remain correct
-   Existing Question Paper pipeline remains unchanged
-   Existing Mark Scheme pipeline remains unchanged
-   Regression suite passes

------------------------------------------------------------------------

# Final Principle

This PR fixes one PDF layout edge case.

The objective is not to redesign text processing.

The correct repair location is:

    Span

    ↓

    Region Classification

    ↓

    Canonical Text Inclusion

not:

    Canonical Text

    ↓

    Text Cleaning

Small targeted fixes preserve the stability already achieved by the
Phase 1 pipeline.
