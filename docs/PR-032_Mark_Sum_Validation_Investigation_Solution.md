# PR-032_Mark_Sum_Validation_Investigation_Solution

## PR Title

Mark Sum Validation Investigation for 0478_s23_qp_22

------------------------------------------------------------------------

# 1. Background

Current project status:

``` text
Phase 1 Validation
PASS

Phase 2 Validation
PASS

Canonical Completeness Gate
PASS

Production Pilot
PASS

Production Expansion Infrastructure
PASS
```

Completed:

``` text
PR-030 Response Area Mapping Fix
PASS

PR-031 Legacy Text Glyph Classification
PASS
```

Remaining Production Expansion blocker:

``` text
0478-2023-MJ-22
```

------------------------------------------------------------------------

# 2. Current Problem

PR-028 Production Expansion detected:

``` text
0478-2023-MJ-22
```

Status:

``` text
BLOCKED
```

Reason:

``` text
MARK_SUM_MISMATCH
```

This prevents the component from becoming:

``` text
ELIGIBLE
```

------------------------------------------------------------------------

# 3. Important Constraint

This PR is an investigation first.

Do not directly modify:

-   Mark Parser
-   Validation Rules
-   Canonical Marks Model

until the actual failure location is confirmed.

The objective is:

``` text
Find Root Cause

↓

Minimal Fix

↓

Regression
```

------------------------------------------------------------------------

# 4. Possible Root Causes

The mismatch may come from three locations.

## Case A: Mark Extraction Error

PDF contains correct marks:

``` text
Question PDF

[4]
[5]
[6]
```

but parser extracts incorrect values.

Pipeline:

``` text
PDF

↓

Mark Extraction

↓

Wrong Canonical Marks
```

------------------------------------------------------------------------

## Case B: Question Aggregation Error

Individual marks are extracted correctly.

However:

``` text
Leaf Questions

↓

Parent Question Aggregation

↓

Total Marks
```

produces incorrect sum.

------------------------------------------------------------------------

## Case C: Validation Rule Issue

Parser output is correct.

The validation assumption does not match a special paper layout.

Example:

-   optional questions
-   special mark display
-   legacy formatting

------------------------------------------------------------------------

# 5. PR Objective

PR-032 only addresses:

``` text
0478_s23_qp_22

MARK_SUM_MISMATCH
```

Goal:

Identify whether the failure exists in:

``` text
Extraction

Aggregation

Validation
```

and apply the smallest possible correction.

------------------------------------------------------------------------

# 6. Scope

## Allowed Changes

Allowed:

-   Add mark extraction debug logging
-   Add mark trace information
-   Add investigation fixture
-   Fix confirmed mark extraction issue
-   Fix confirmed aggregation issue
-   Add regression tests

------------------------------------------------------------------------

## Forbidden Changes

Do not modify:

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question architecture
-   Response Area Pipeline
-   TEXT Quality Pipeline
-   Document Role Router
-   Canonical Schema
-   Production Expansion Logic

Do not:

-   Disable mark validation
-   Reduce validation threshold globally
-   Ignore mismatches

------------------------------------------------------------------------

# 7. Investigation Pipeline

Follow:

``` text
PDF

↓

Question Extraction

↓

Leaf Question Detection

↓

Mark Extraction

↓

Canonical Marks

↓

Mark Aggregation

↓

Validation
```

Every stage must be compared.

------------------------------------------------------------------------

# 8. Debug Requirements

For 0478_s23_qp_22 record:

## PDF Level

Capture:

-   displayed total mark
-   question mark labels
-   page location

------------------------------------------------------------------------

## Extraction Level

Capture:

Example:

``` json
{
  "question": "Q3(a)",
  "extractedMark": 2,
  "sourcePage": 4
}
```

------------------------------------------------------------------------

## Canonical Level

Compare:

``` text
Leaf Question Marks

+

Parent Question Marks

=

Expected Total
```

------------------------------------------------------------------------

# 9. Fix Strategy

Priority order:

## Option 1

Fix incorrect extraction.

Example:

``` text
[5]

incorrectly parsed as:

0
```

------------------------------------------------------------------------

## Option 2

Fix aggregation.

Example:

``` text
Leaf marks correct

Parent sum incorrect
```

------------------------------------------------------------------------

## Option 3

Fix validation rule.

Only if:

Parser output matches PDF.

------------------------------------------------------------------------

Do not implement a workaround before identifying the source.

------------------------------------------------------------------------

# 10. Golden Fixture

Add:

``` text
0478_s23_qp_22
```

Expected fixture:

``` json
{
  "markValidationStatus": "PASS",
  "expectedTotalMarks": "...",
  "calculatedTotalMarks": "...",
  "mismatch": false
}
```

------------------------------------------------------------------------

# 11. Regression Requirements

Must maintain:

Phase 1:

``` text
20 / 20 PASS
```

Phase 2:

``` text
120 / 120 PASS
```

Existing fixes:

``` text
PR-030 Response Area
PASS

PR-031 Glyph Classification
PASS
```

No regression allowed.

------------------------------------------------------------------------

# 12. Acceptance Criteria

PR-032 completed when:

-   Root Cause identified
-   Mark mismatch fixed
-   Golden Fixture added
-   Regression Test added
-   0478_s23_qp_22 validation PASS
-   Canonical Completeness Gate PASS
-   Production Expansion eligibility restored

------------------------------------------------------------------------

# 13. Expected Production Expansion Result

Current:

``` text
Component 22

BLOCKED
```

After:

``` text
Component 22

ELIGIBLE
```

Then:

``` text
PR028 Production Expansion
```

should reach:

``` text
ELIGIBLE:5

ALREADY_PUBLISHED:1

BLOCKED:0
```

------------------------------------------------------------------------

# Final Decision

PR-032 is a targeted mark validation investigation.

It is not:

-   Parser rewrite
-   Architecture change
-   Schema change

Execution principle:

``` text
Investigate First

Minimal Fix

Regression Test

Resume Production Expansion
```

END
