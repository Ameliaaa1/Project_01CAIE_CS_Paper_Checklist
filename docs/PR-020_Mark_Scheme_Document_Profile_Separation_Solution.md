# PR-020 Mark Scheme Document Profile Separation Solution

## PR Information

**PR ID**

PR-020

**Title**

Mark Scheme Document Profile Separation

**Objective**

Separate Mark Scheme processing from Question Paper processing while
preserving all stable Question Paper modules.

------------------------------------------------------------------------

# 1. Root Cause Analysis

## Current Problem

The parser correctly detects:

``` json
{
  "documentRole": "mark_scheme"
}
```

However, downstream processing still uses Question Paper assumptions.

Current flow:

    PDF
     |
    Document Role Detection
     |
    Generic Region Classification
     |
    Question Paper Validation Rules
     |
    Publish Gate

The system has document role metadata, but the execution pipeline is not
role-aware.

The current implementation is therefore only document tagging, not
document profile separation.

------------------------------------------------------------------------

# 2. Confirmed Issues

## P0 - Publish Gate Validation Profile Leakage

### Problem

Mark Scheme documents are incorrectly passing Question Paper validation
rules.

Example:

    RESPONSE_AREA_COVERAGE_VALID

is still evaluated for Mark Scheme documents.

Mark Scheme documents do not contain candidate response areas.

### Risk

A structurally incorrect Mark Scheme can reach production because
irrelevant validators return PASS.

### Required Fix

Publish Gate must load validation rules based on document role.

Example:

``` json
{
  "documentRole": "mark_scheme",
  "validationProfile": "MARK_SCHEME"
}
```

------------------------------------------------------------------------

# 3. Required Architecture Change

## New Flow

    PDF

    ↓

    Document Role Detection

    ↓

    Document Profile Router

            |
            |
            +----------------+
            |                |
            v                v

    QUESTION_PAPER      MARK_SCHEME

            |                |

    QP Pipeline        MS Pipeline

            |                |

    QP Validation      MS Validation

            |                |

            +------- Publish Gate

------------------------------------------------------------------------

# 4. Scope

## Allowed Changes

The following modules may be modified:

    Document Role Router

    Mark Scheme Validation Profile

    Mark Scheme Region Classification

    Publish Gate Rule Selection

    Canonical Schema Extension

------------------------------------------------------------------------

## Forbidden Changes

Do not modify:

    Question Split

    Stable Question ID

    Parent / Leaf Question Model

    QP Marks Extraction

    QP Response Area Pipeline

    TEXT QUALITY Pipeline

These modules are already stable.

------------------------------------------------------------------------

# 5. Implementation Plan

## Step 1 - Add Document Profile Router

Create:

    DocumentProfile

Example:

``` json
{
  "role": "mark_scheme",
  "parserProfile": "MARK_SCHEME",
  "validationProfile": "MARK_SCHEME"
}
```

The router decides which parser and validator profile should run.

------------------------------------------------------------------------

# Step 2 - Separate Region Classification

## Current Incorrect Behavior

Mark Scheme pages:

``` json
{
  "type": "question_content"
}
```

This is incorrect.

------------------------------------------------------------------------

## Required Behavior

Mark Scheme regions:

    MARK_SCHEME_HEADER

    MARKING_INSTRUCTION

    QUESTION_NUMBER

    ANSWER

    MARK_COLUMN

    ANNOTATION

    FOOTER

Question Paper regions remain unchanged.

------------------------------------------------------------------------

# Step 3 - Create Mark Scheme Validation Profile

Create:

    MARK_SCHEME_VALIDATION_PROFILE

Required checks:

    DOCUMENT_ROLE_VALID

    TEXT_QUALITY_VALID

    MARK_SCHEME_REGION_VALID

    ANSWER_STRUCTURE_VALID

    MARK_ALLOCATION_VALID

    SOURCE_TRACE_VALID

Remove:

    RESPONSE_AREA_COVERAGE

    QUESTION_CONTENT_COVERAGE

from Mark Scheme validation.

------------------------------------------------------------------------

# Step 4 - Update Publish Gate

Current behavior:

    Run all validators

Required behavior:

    Document Role

    ↓

    Validation Profile

    ↓

    Applicable Validators Only

Example:

``` json
{
 "documentRole":"mark_scheme",
 "checks":[
   "TEXT_QUALITY_VALID",
   "MARK_SCHEME_STRUCTURE_VALID",
   "SOURCE_TRACE_VALID"
 ]
}
```

------------------------------------------------------------------------

# 6. Canonical Model Extension

## Current Limitation

Mark Scheme content is flattened into text.

Example:

    Question Answer Marks

becomes one text block.

This loses table relationships.

------------------------------------------------------------------------

## Required Extension

Add Mark Scheme entities without changing Question entities.

Example:

``` json
{
 "markSchemeEntries":[
   {
    "questionId":"7",
    "answerText":[
      "Serial"
    ],
    "marks":1,
    "annotations":[]
   }
 ]
}
```

------------------------------------------------------------------------

# 7. Source Trace Improvement

## Current

``` json
{
 "page":14,
 "blockIndex":6
}
```

is insufficient.

------------------------------------------------------------------------

## Required

Minimum:

``` json
{
 "page":14,
 "blockIndex":6,
 "lineIndex":4,
 "spanIndex":0,
 "text":"Serial"
}
```

Purpose:

-   debugging
-   human review
-   parser regression analysis

------------------------------------------------------------------------

# 8. Golden Fixtures

Add:

    fixtures/

    0478_w25_ms_11/

Required tests:

------------------------------------------------------------------------

## Test 1 - Document Role

Expected:

``` json
{
 "documentRole":"mark_scheme"
}
```

------------------------------------------------------------------------

## Test 2 - Region Classification

Expected:

No:

    QUESTION_CONTENT
    RESPONSE_AREA

Allowed:

    ANSWER
    MARK_COLUMN
    MARKING_INSTRUCTION

------------------------------------------------------------------------

## Test 3 - Validation Profile

Expected:

Mark Scheme does not execute:

    RESPONSE_AREA_COVERAGE

------------------------------------------------------------------------

## Test 4 - Publish Gate

Expected:

Invalid Mark Scheme structure blocks publishing.

------------------------------------------------------------------------

# 9. Execution Order

Codex implementation order:

## Phase 1

Implement:

-   Document Profile Router
-   Validation Profile Routing
-   Publish Gate separation

Do not touch extraction.

------------------------------------------------------------------------

## Phase 2

Implement:

-   Mark Scheme Region Classification

------------------------------------------------------------------------

## Phase 3

Implement:

-   Mark Scheme Canonical Extraction

------------------------------------------------------------------------

# 10. Regression Requirements

After implementation verify:

## Question Paper

0478_s25_qp_12.pdf

Must remain:

PASS

No changes allowed in:

-   Question IDs
-   Leaf Questions
-   Response Areas
-   Marks Validation

------------------------------------------------------------------------

## Mark Scheme

0478_w25_ms_11.pdf

Expected:

    documentRole = mark_scheme

    validationProfile = MARK_SCHEME

    responseAreaValidation = skipped

    publishGate = profile aware

------------------------------------------------------------------------

# Final Decision

Current PR-020 implementation direction is correct, but incomplete.

The immediate fix is not a full Mark Scheme parser rewrite.

The required change is:

**Convert documentRole metadata into a real document-profile-aware
execution pipeline.**

Only after this separation is stable should Mark Scheme answer
extraction be implemented.
