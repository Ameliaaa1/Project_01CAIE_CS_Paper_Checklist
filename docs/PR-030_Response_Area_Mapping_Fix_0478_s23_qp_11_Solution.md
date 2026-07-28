# PR-030_Response_Area_Mapping_Fix_0478_s23_qp_11_Solution

## PR Title

Response Area Mapping Fix for 0478_s23_qp_11

------------------------------------------------------------------------

## 1. Background

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

Current stage:

``` text
Issue Resolution Round 2
```

------------------------------------------------------------------------

## 2. Problem

PR-028 Production Expansion detected:

``` text
0478-2023-MJ-11
```

blocked by:

``` text
RESPONSE_AREA_MAPPING_INCOMPLETE
```

Observed:

``` text
Required Response Areas:
32

Detected Response Areas:
31
```

Coverage:

``` text
31 / 32 = 0.9688
```

One response area is missing from the Canonical response area output.

------------------------------------------------------------------------

## 3. Root Cause Investigation

Response Area pipeline:

``` text
PDF
 |
 v
PDF Extraction
 |
 v
Span Extraction
 |
 v
Region Classification
 |
 v
Response Area Detection
 |
 v
Staging Mapper
 |
 v
response_areas_json
 |
 v
Canonical Completeness Gate
```

Investigation must determine whether the missing response area is caused
by:

-   span extraction
-   region classification
-   response area detection
-   staging mapping

Do not modify the final JSON manually.

------------------------------------------------------------------------

## 4. Objective

Fix only:

``` text
0478_s23_qp_11
```

so that:

``` text
RESPONSE_AREA_MAPPING_INCOMPLETE
```

becomes:

``` text
RESPONSE_AREA_COVERAGE_PASS
```

------------------------------------------------------------------------

## 5. Scope

Allowed:

-   Response Area Detection fix
-   Response Area Mapping fix
-   Legacy PDF layout handling
-   Golden Fixture
-   Regression Test

Forbidden:

-   Question Parser changes
-   Question Split changes
-   Stable Question ID changes
-   Parent / Leaf Model changes
-   Marks Validation changes
-   TEXT Quality Pipeline redesign
-   Canonical Schema changes
-   Document Role Router changes
-   Completeness Gate rule changes
-   Production Expansion logic changes

------------------------------------------------------------------------

## 6. Debug Workflow

Follow:

``` text
PDF
 |
 v
Extracted Spans
 |
 v
Region Classification
 |
 v
Detected Response Areas
 |
 v
Mapped Response Areas
 |
 v
Canonical response_areas_json
```

Check:

1.  Does the missing response area exist in PDF?
2.  Was a span generated?
3.  Was the region classified correctly?
4.  Was it mapped to the correct question?

------------------------------------------------------------------------

## 7. Fix Strategy

Preferred order:

### Option 1

Fix legacy layout handling.

Example:

``` text
specific PDF layout
        |
        v
correct response area mapping
```

### Option 2

Add component/year specific handling only if the layout has no reusable
pattern.

Do not globally relax detection thresholds.

------------------------------------------------------------------------

## 8. Golden Fixture

Add:

``` text
0478_s23_qp_11
```

Expected:

``` json
{
  "responseAreaRequired": 32,
  "responseAreaDetected": 32,
  "coverage": 1.0,
  "status": "PASS"
}
```

------------------------------------------------------------------------

## 9. Regression Requirements

Must keep:

``` text
Phase 1:
20 / 20 PASS

Phase 2:
120 / 120 PASS
```

Production Pilot:

``` text
0478-2023-MJ-12
PASS
```

Verify:

-   no duplicated response areas
-   no orphan response areas
-   no question mapping regression

------------------------------------------------------------------------

## 10. Acceptance Criteria

PR-030 complete when:

-   0478_s23_qp_11 staging regenerated
-   Response Area coverage reaches 100%
-   Completeness Gate PASS
-   publishable = true
-   Golden Fixture added
-   Regression Test added
-   Existing stable modules unchanged

------------------------------------------------------------------------

## 11. Next Step

After PR-030:

Rerun:

``` text
PR028-0478-2023-MJ
```

Expected:

Before:

``` text
ELIGIBLE: 2
BLOCKED: 3
```

After:

``` text
ELIGIBLE: 3
BLOCKED: 2
```

Then continue:

``` text
PR-031 Suspicious Glyph Investigation

PR-032 Mark Sum Validation Investigation
```

------------------------------------------------------------------------

## Final Decision

This PR addresses:

``` text
One missing response area mapping
```

It does not represent:

-   Parser architecture failure
-   Canonical model failure
-   Production failure

Principles:

``` text
One PR One Problem

Minimal Change Principle

No Stable Module Regression
```

END
