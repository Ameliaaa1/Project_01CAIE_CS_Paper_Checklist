# PR-051 9618-2021-ON-BATCH-03 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-051

**Objective**

将 PR-050 后 preparation report 确认的下一批 9618 strict eligible paper
pairs 发布到 Production。

Target:

``` text
9618-2021-ON-11
9618-2021-ON-12
```

Execution:

``` text
Validated Staging
↓
Preflight Validation
↓
Production Publish
↓
Integrity Verification
↓
Frontend Verification
↓
Regression
```

Production write:

``` text
productionWrite = true
```

------------------------------------------------------------------------

## 2. Preconditions

Previous status:

``` text
PR-050 = PASS
```

Published:

``` text
9618-2021-MJ-41
9618-2021-MJ-42
```

Current next batch:

``` text
PR051-9618-2021-ON-BATCH-03
```

Scope:

``` text
9618-2021-ON-11
9618-2021-ON-12
```

------------------------------------------------------------------------

## 3. Scope

Included:

``` text
9618-2021-ON-11-QP
9618-2021-ON-11-MS

9618-2021-ON-12-QP
9618-2021-ON-12-MS
```

Excluded:

-   Other O/N components
-   M/J expansion
-   Future years
-   Blocked pairs
-   Parser redesign
-   Canonical Model redesign
-   Response Area Pipeline redesign
-   TEXT QUALITY Pipeline redesign
-   0478 changes
-   9709 support

------------------------------------------------------------------------

## 4. Preflight Validation

Required staging artifacts:

``` text
9618_w21_qp_11.staging.json
9618_w21_ms_11.staging.json

9618_w21_qp_12.staging.json
9618_w21_ms_12.staging.json
```

Each must satisfy:

``` text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH

P0 = 0
P1 = 0
P2 = 0
```

Failure condition:

``` text
STOP
```

------------------------------------------------------------------------

## 5. Production Write Rules

Only add:

``` text
9618-2021-ON-11-QP
9618-2021-ON-11-MS
9618-2021-ON-12-QP
9618-2021-ON-12-MS
```

Forbidden:

-   Modify existing Production records
-   Overwrite existing paper IDs
-   Publish unrelated pairs
-   Change stable parser modules

------------------------------------------------------------------------

## 6. Expected Delta

Fixed:

``` text
paperDelta = 4
pairingDelta = 2
```

Calculated from staging:

``` text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

Requirement:

``` text
Actual = Expected
```

------------------------------------------------------------------------

## 7. Pair Verification

For component 11 and 12:

``` text
paperCount = 2
questionCount = expected
leafQuestionCount = expected
responseAreaCount = expected
markSchemeEntryCount = expected

sourceTraceAvailable = true
pairingLinked = true
```

------------------------------------------------------------------------

## 8. Blocked Pair Protection

All blocked pairing keys must remain unpublished.

Verification:

``` text
all blocked pairs absent from Production
```

Do not only test one blocked pair.

------------------------------------------------------------------------

## 9. Production Integrity

Before:

``` text
production-store-before.json
production-store-before.sha256
```

After:

``` text
production-store-after.json
production-store-after.sha256
```

Required:

``` text
productionHashChanged = true
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
```

------------------------------------------------------------------------

## 10. Existing Records Diff

Must verify:

``` text
existing batches changed = 0
existing papers changed = 0
existing questions changed = 0
existing response areas changed = 0
existing mark scheme entries changed = 0
existing pairings changed = 0
existing expansion batches changed = 0
```

------------------------------------------------------------------------

## 11. Frontend Verification

Required:

``` text
Question Finder PASS
Knowledge Checklist PASS
Mark Scheme Search PASS
AI Retrieval PASS
Open Original Question PASS
QP-MS Correspondence PASS
```

------------------------------------------------------------------------

## 12. Regression Requirements

Maintain:

``` text
PR-030 PASS
PR-031 PASS
PR-032 PASS
PR-038A PASS
PR-040 PASS
PR-042 PASS
PR-044 PASS
PR-045 PASS
PR-046 PASS
PR-047 PASS
PR-048 PASS
PR-048A PASS
PR-049 PASS
PR-050 PASS
```

Also:

``` text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

------------------------------------------------------------------------

## 13. Completion Criteria

PR-051 complete when:

``` text
Preflight PASS

+
Strict Eligibility PASS

+
Production Publish PASS

+
Integrity PASS

+
Frontend Verification PASS

+
Regression PASS
```

------------------------------------------------------------------------

## 14. Follow-up

After PR-051:

Run 9618 preparation inventory again.

Next batch must be selected from the new preparation report.

Maintain:

``` text
One PR
=
One Goal
```
