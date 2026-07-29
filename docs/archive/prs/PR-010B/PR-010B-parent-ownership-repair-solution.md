# PR-010B Parent Ownership Repair Solution Plan

## Objective

修复 Question Rendering Contract 阶段发现的 Parent Ownership Conflict。

当前问题不是：

-   PR-010A Question Text Normalization
-   Frontend Rendering
-   Rendering Validator

根因位于 Canonical Parent Ownership 数据生成阶段。

目标：

修复 Parent Question Reconstruction 和 Parent Ownership
Classification，使 Production 数据能够通过 Rendering Contract Semantic
Validation。

------------------------------------------------------------------------

# Issue Summary

Affected Question:

    0478/12/O/N/23 Q5

Canonical ID:

    0478-2023-ON-12-Q5

Current behavior:

    Production
        |
        v
    Question Rendering Contract
        |
        v
    Parent Ownership Validation FAIL
        |
        v
    Rendering Contract BLOCKED
        |
        v
    Frontend displays unavailable

------------------------------------------------------------------------

# Root Cause

## Confirmed Cause

Parent Question Context in Canonical Model does not match the original
source parent context.

Validation failure:

    parentOwnershipValid = false

Reason:

    SOURCE_AND_CANONICAL_PARENT_DISAGREE

------------------------------------------------------------------------

## Current Incorrect State

Canonical Parent:

    5 of their recording.
    Give benefit of using a higher sample rate...

Expected Source Parent:

    A band is recording their new song.
    They need to consider the sample rate and resolution
    of their recording.

The canonical parent starts from a child-question boundary instead of
preserving the shared question preamble.

------------------------------------------------------------------------

# PR-010B Scope

## Included

Only modify:

-   Parent ownership reconstruction logic
-   Parent preamble applicability classification
-   Canonical parent assignment logic

------------------------------------------------------------------------

## Excluded

Do NOT modify:

-   PDF parser
-   Question splitting algorithm
-   Stable Question ID
-   Child ID generation
-   Frontend rendering
-   Rendering Contract validation rules
-   PR-010A text normalization

Reason:

The validation system correctly blocks invalid ownership data. The issue
is upstream canonical ownership generation.

------------------------------------------------------------------------

# Proposed Fix

## Step 1: Review Parent Preamble Classification

Target area:

    parentPreambleApplicability

Investigate:

-   How source preamble spans are detected
-   How canonical parent text is reconstructed
-   How child boundaries affect parent ownership

Required behavior:

Parent context must include:

-   common introduction
-   shared scenario
-   context before child labels
-   ownership region covering all child questions

------------------------------------------------------------------------

# Step 2: Repair Parent Reconstruction

Current behavior:

Parent text may begin after the first child marker.

Example:

Incorrect:

    5 of their recording.
    Give benefit...

Expected:

    A band is recording their new song.
    They need to consider the sample rate...

The reconstruction process must preserve the complete parent preamble
before assigning child ownership.

------------------------------------------------------------------------

# Step 3: Preserve Child Ownership

Expected hierarchy:

    Q5

    ├── Q5(a)
    ├── Q5(b)
    ├── Q5(c)
    └── Q5(d)

Requirements:

-   All children remain attached to the same parent.
-   Stable IDs remain unchanged.
-   Mark scheme mappings remain unchanged.

------------------------------------------------------------------------

# Regression Tests

## Parent Context Test

Verify:

Input source:

    A band is recording their new song.
    They need to consider the sample rate...

Expected:

    parentOwnershipValid = true

------------------------------------------------------------------------

## Child Boundary Test

Verify:

Children:

    Q5(a)
    Q5(b)
    Q5(c)
    Q5(d)

must remain separate.

No child text should leak into parent text.

------------------------------------------------------------------------

## Conflict Detection Test

Keep existing fail-closed behavior.

If source and canonical ownership cannot be reconciled:

    status = CONFLICT

Do not bypass validation.

------------------------------------------------------------------------

# Validation Requirements

After repair:

## Rendering Contract

Expected:

    renderingContractStatus = PASS

## Ownership

Expected:

    parentOwnershipValid = true

## Stability

Must remain unchanged:

-   Question count
-   Child count
-   Stable IDs
-   Mark Scheme mapping
-   Response Area mapping

------------------------------------------------------------------------

# Deliverables

Create:

    pr010b-parent-ownership-debug-report.json

    pr010b-parent-ownership-regression.test.js

    pr010b-production-verification.json

------------------------------------------------------------------------

# Completion Criteria

PR-010B is complete when:

1.  Parent ownership conflict is resolved.
2.  Rendering Contract passes.
3.  Frontend can render the affected question.
4.  No changes are introduced to stable architecture.

Final principle:

    Invalid canonical ownership
            |
            v
    Blocked rendering
            |
            v
    Repair ownership source data

Do not weaken validation to hide incorrect canonical data.
