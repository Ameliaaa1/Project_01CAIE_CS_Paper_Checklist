# PR-019 Solution Proposal

# Response Area Mapping Integrity and Publish Gate Correction

## Objective

This PR addresses the new P0 issue discovered after the resolution of:

    TEXT_QUALITY_METRIC_INCONSISTENT

The previous text quality pipeline is considered PASS.

The current blocking issue is:

    RESPONSE_AREA_MAPPING_INCOMPLETE

The goal of this PR is to ensure:

    PDF Answer Areas
            ↓
    Parser Detection
            ↓
    Question Association
            ↓
    Staging response_areas_json
            ↓
    Validator Coverage Check
            ↓
    Publish Gate

is reliable.

------------------------------------------------------------------------

# Non-Goals

This PR must NOT modify:

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question generation
-   Marks extraction
-   Question Boundary detection
-   Canonical Text Builder
-   TEXT_QUALITY_METRIC logic
-   Barcode filtering logic

The current stable pipeline must remain unchanged.

------------------------------------------------------------------------

# Background

The previous P0:

    TEXT_QUALITY_METRIC_INCONSISTENT

has been resolved.

Current validation shows:

-   normalizedText is clean
-   displayText is clean
-   Barcode glyphs are excluded
-   Footer content is excluded
-   Suspicious glyph metrics are consistent

However, Publish Gate currently reports:

    RESPONSE_AREAS_STAGED = PASS
    READY_TO_PUBLISH

while actual staging data shows:

    27 Leaf Questions

    Only 1 question contains response_areas_json

    26 questions contain empty response areas

This means the Publish Gate validates the existence of the response area
pipeline, not the correctness of response area coverage.

------------------------------------------------------------------------

# Root Cause

Current flow:

    Answer Line Detection

    ↓

    Page Level Regions

    ↓

    Response Area Extraction

    ↓

    Staging

    ↓

    Publish Validation

is incomplete.

The missing step is:

    Response Area

    ↓

    Question Ownership Mapping

Current behavior:

    Parser detects answer lines

    ↓

    Answer lines are stored/excluded at page level

    ↓

    No reliable association with Leaf Question

    ↓

    response_areas_json remains empty

    ↓

    Publish Gate incorrectly passes

------------------------------------------------------------------------

# Required Changes

## 1. Introduce Response Area Coverage Model

Each Leaf Question must contain:

``` json
{
  "questionId": "0478-2025-MJ-12-Q2-D",
  "responseAreas": [],
  "responseAreaStatus": "MISSING"
}
```

Possible states:

``` text
PRESENT
MISSING
NOT_REQUIRED
UNKNOWN
```

Do not use empty arrays as a successful state.

------------------------------------------------------------------------

# 2. Improve Answer Line Classification Priority

Current issue:

Answer lines near the bottom of the page can be classified as Footer
because of page position.

Incorrect:

    if y > threshold:
        FOOTER

Required priority:

    BARCODE

    ↓

    ANSWER_LINE

    ↓

    MARGIN

    ↓

    EXPLICIT FOOTER TOKEN

    ↓

    HEADER

    ↓

    QUESTION_CONTENT

Answer line detection must happen before position-based footer
detection.

------------------------------------------------------------------------

# 3. Answer Area Detection

Detect response areas using:

-   dotted lines
-   blank response boxes
-   working areas
-   mark indicators

Examples:

    ........................................ [3]

should produce:

``` json
{
  "type": "answer_line",
  "marks": 3,
  "bbox": []
}
```

The answer area itself should not enter Canonical Text.

------------------------------------------------------------------------

# 4. Question Association Algorithm

Answer areas must be assigned to Leaf Questions.

Association priority:

## Rule 1

Use vertical position.

Example:

    Question text

    ↓

    Answer area

    ↓

    Next question

The answer area belongs to the previous question.

------------------------------------------------------------------------

## Rule 2

Use Question Boundary.

Do not associate response areas across:

    Q2

    ↓

    Q3

boundaries.

------------------------------------------------------------------------

## Rule 3

Use Marks Token

Example:

    ................................ [3]

The mark value can help validate ownership.

------------------------------------------------------------------------

# 5. Response Area Validator

Replace current validation:

Incorrect:

``` javascript
questions.every(
 q => Array.isArray(q.responseAreas)
)
```

because:

``` javascript
[]
```

passes.

Required validation:

``` javascript
for each leaf question:

if question requires response area:

    responseAreas.length > 0

else:

    allow NOT_REQUIRED
```

------------------------------------------------------------------------

# 6. Publish Gate Update

Current:

    RESPONSE_AREAS_STAGED = true

is insufficient.

Replace with:

    RESPONSE_AREA_COVERAGE_VALID

Validation:

    All required leaf questions have response areas

    AND

    No detected answer area is orphaned

    AND

    No answer area is incorrectly classified as footer

Failure:

    BLOCKED

with:

``` json
{
  "code": "RESPONSE_AREA_MAPPING_INCOMPLETE",
  "severity": "P0"
}
```

------------------------------------------------------------------------

# 7. Approval Model Separation

Current problem:

    codex-golden-fixture

can become:

    ADMIN_REVIEW_APPROVED

This mixes automated validation with human review.

Required separation:

``` json
{
  "approvalType": "AUTOMATED_FIXTURE_VALIDATION"
}
```

and:

``` json
{
  "approvalType": "HUMAN_ADMIN_REVIEW"
}
```

Rules:

    AUTOMATED_FIXTURE_VALIDATION

    !=

    HUMAN_ADMIN_REVIEW

Automated tests cannot unlock production publishing.

------------------------------------------------------------------------

# 8. Source Trace Enhancement

Current:

``` json
{
  "page":5,
  "blockIndex":10
}
```

should eventually support:

``` json
{
  "page":5,
  "blockIndex":10,
  "lineIndex":0,
  "spanIndex":0,
  "includedText":"[3]"
}
```

Reason:

One block may contain:

    Answer Line

    +

    Marks

Block level trace is insufficient for debugging.

------------------------------------------------------------------------

# Golden Fixture

Use:

    0478_s25_qp_12.pdf

Required tests:

------------------------------------------------------------------------

## Test 1

All detected answer lines must have ownership.

Expected:

    orphanAnswerAreas = 0

------------------------------------------------------------------------

## Test 2

Leaf Question Coverage

Expected:

    requiredQuestionsWithMissingResponseArea = 0

------------------------------------------------------------------------

## Test 3

Footer Separation

Answer lines near page bottom must not become Footer.

Expected:

    answer_line classified correctly

------------------------------------------------------------------------

## Test 4

Publish Gate

Before fix:

    READY_TO_PUBLISH

incorrect.

After fix:

    BLOCKED

until coverage passes.

------------------------------------------------------------------------

# Regression Requirements

Verify unchanged:

    Question Count = 5

    Leaf Question Count = 27

    Total Marks = 75

Verify:

-   Question IDs unchanged
-   Marks unchanged
-   Canonical Text unchanged
-   Text Quality Metrics unchanged

------------------------------------------------------------------------

# Risk Assessment

## Low Risk

Reason:

This PR only changes:

-   response area mapping
-   response coverage validation
-   publish conditions

No changes to:

-   parser question extraction
-   text normalization
-   identifiers
-   scoring information

------------------------------------------------------------------------

# Success Criteria

This PR is complete when:

1.  Every required Leaf Question has correct response_areas_json.
2.  No answer area is silently dropped.
3.  No answer line is classified as footer because of page position.
4.  RESPONSE_AREAS_STAGED checks coverage, not field existence.
5.  Publish Gate blocks incomplete response mapping.
6.  Automated fixture approval cannot replace human review.
7.  Existing stable parser outputs remain identical.

Final state:

    TEXT PIPELINE: PASS

    RESPONSE AREA PIPELINE: PASS

    PUBLISH: READY_TO_PUBLISH
