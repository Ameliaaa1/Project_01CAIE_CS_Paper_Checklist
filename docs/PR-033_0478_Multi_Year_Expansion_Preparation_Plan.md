# PR-033_0478_Multi_Year_Expansion_Preparation_Plan

## PR Title

0478 Multi-Year Production Expansion Preparation

------------------------------------------------------------------------

# 1. Current Project Status

Current completed milestones:

``` text
Architecture Stabilization
        PASS

Phase 1 Validation
        PASS

Phase 2 Validation
        PASS

Issue Resolution
        PASS

Production Pilot
        PASS

Production Expansion Phase A
        PASS
```

Completed production data:

``` text
Syllabus:
0478 Computer Science

Session:
2023 May/June

Components:
11
12
13
21
22
23
```

Production Expansion Phase A has successfully validated:

-   Production write workflow
-   Publish Gate
-   Rollback mechanism
-   Frontend verification
-   QP/MS linkage
-   Source Trace preservation

------------------------------------------------------------------------

# 2. Next Stage Objective

The next objective is:

``` text
Expand 0478 from single-year production data

↓

to controlled multi-year production coverage
```

This PR does NOT publish new production data.

This PR prepares:

-   dataset selection
-   staging coverage
-   validation planning
-   expansion eligibility

------------------------------------------------------------------------

# 3. Scope

## Target Dataset

Syllabus:

``` text
0478 Computer Science
```

Years:

``` text
2020
2021
2022
2023
```

Session:

``` text
May/June
```

The exact batch size must be determined after coverage analysis.

------------------------------------------------------------------------

# 4. Objective

PR-033 goals:

1.  Identify available 0478 multi-year PDFs.
2.  Generate coverage matrix.
3.  Verify staging availability.
4.  Identify missing artifacts.
5.  Prepare Production Expansion candidates.

------------------------------------------------------------------------

# 5. Dataset Coverage Matrix

Create:

``` text
0478

Year

Session

Component

Question Paper

Mark Scheme

Staging Status

Validation Status

Publish Eligibility
```

Example:

``` text
0478
2022
M/J
12

QP:
PASS

MS:
PASS

Completeness:
PASS

Eligible:
YES
```

------------------------------------------------------------------------

# 6. Required Validation Before Expansion

Every candidate must pass:

## Document Validation

Check:

``` text
Correct syllabus

Correct year

Correct session

Correct component

Correct document role
```

------------------------------------------------------------------------

## Canonical Validation

Required:

``` text
Question Coverage PASS

Leaf Coverage PASS

Mark Coverage PASS

Response Area Coverage PASS

Source Trace Coverage PASS

Canonical Structure Completeness PASS
```

------------------------------------------------------------------------

## Regression Validation

Must maintain:

``` text
Phase 1:

20/20 PASS
```

and:

``` text
Phase 2:

120/120 PASS
```

Existing fixes:

``` text
PR-030 PASS

PR-031 PASS

PR-032 PASS
```

must remain stable.

------------------------------------------------------------------------

# 7. Production Expansion Strategy

Do not:

``` text
All Years

↓

Production
```

Use:

``` text
Dataset Analysis

↓

Staging Generation

↓

Validation

↓

Eligibility Report

↓

Small Batch Production

↓

Verification
```

------------------------------------------------------------------------

# 8. Allowed Changes

Allowed:

-   Dataset configuration
-   Coverage report generation
-   Expansion planning scripts
-   Batch selection logic
-   Staging coverage verification
-   Regression fixtures

------------------------------------------------------------------------

# 9. Forbidden Changes

Do not modify:

-   PDF Parser architecture
-   Question Split logic
-   Stable Question ID
-   Parent / Leaf Model
-   Response Area Pipeline
-   TEXT Quality Pipeline
-   Mark Validation logic
-   Canonical Schema
-   Production Storage Model

If a parsing problem appears:

Create a separate PR.

------------------------------------------------------------------------

# 10. Expected Deliverables

PR-033 should produce:

## Coverage Report

Example:

``` json
{
  "syllabus":"0478",
  "years":[2020,2021,2022,2023],
  "availablePairs":0,
  "eligiblePairs":0,
  "blockedPairs":0
}
```

------------------------------------------------------------------------

## Expansion Candidate List

Including:

-   paper id
-   QP/MS pairing
-   validation status
-   completeness status
-   publish status

------------------------------------------------------------------------

# 11. Acceptance Criteria

PR-033 completed when:

-   Multi-year dataset inventory completed.
-   Coverage matrix generated.
-   Missing staging artifacts identified.
-   Eligible expansion candidates identified.
-   No Production data changed.
-   Existing regression remains PASS.

------------------------------------------------------------------------

# 12. After PR-033

Next step:

``` text
PR-034

0478 Multi-Year Production Expansion Execution
```

PR-034 will perform:

``` text
Eligible Staging

↓

Publish Gate

↓

Production Write

↓

Production Verification
```

------------------------------------------------------------------------

# Final Principle

Current project phase:

``` text
Single Production Success

↓

Controlled Production Scaling
```

Execution rule:

``` text
Measure First

Validate Second

Publish Third
```

Maintain:

``` text
Minimal Change Principle

One PR One Goal

No Stable Module Regression
```

END
