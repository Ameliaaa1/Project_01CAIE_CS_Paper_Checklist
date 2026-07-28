# Phase 6 9618 Final Production Closure Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 6
```

**Title**

``` text
9618 Final Production Closure
```

**Objective**

完成 9618 syllabus production expansion 的最终关闭审计。

Phase 6 不再处理 blocker 修复。

Phase 5 已完成：

``` text
blockedPairs:
13 → 0

publishedPairs:
105 → 118
```

Phase 6 目标：

``` text
Final Production Snapshot
        ↓
Final Coverage Verification
        ↓
Production Integrity Check
        ↓
Regression Freeze
        ↓
Frontend Verification
        ↓
Generate Closure Decision
```

------------------------------------------------------------------------

# 2. Current Authoritative State

Phase 5 完成后：

``` text
sourcePairs = 118

completeSourcePairs = 118

stagingPairs = 118

publishedPairs = 118

blockedPairs = 0

eligibleUnpublishedPairs = 0

missingStagingPairs = 0

partialProductionConflicts = 0
```

最终目标：

``` text
9618 Production Coverage = COMPLETE
```

------------------------------------------------------------------------

# 3. Phase Boundary

Phase 6:

``` text
productionWrite = false
generateStaging = false
modifyParser = false
modifyCanonical = false
modifyValidationRules = false
```

Phase 6 是：

``` text
CLOSURE AUDIT ONLY
```

禁止：

-   新增 production 数据
-   修改 parser
-   修改 canonical model
-   放宽 validation gate
-   修复新的 blocker

如果发现问题：

必须创建新的 isolated PR。

------------------------------------------------------------------------

# 4. Final Coverage Audit

必须确认：

## Source

``` text
sourcePairs = 118

completeSourcePairs = 118

incompleteSourcePairs = 0

duplicateSourceCount = 0
```

------------------------------------------------------------------------

## Staging

``` text
stagingPairs = 118

stagingPartialPairs = 0

stagingMissingPairs = 0

missingStagingPairs = 0
```

------------------------------------------------------------------------

## Production

``` text
publishedPairs = 118

blockedPairs = 0

eligibleUnpublishedPairs = 0

partialProductionConflicts = 0
```

最终关系：

``` text
sourcePairs
=
stagingPairs
=
publishedPairs
=
118
```

------------------------------------------------------------------------

# 5. Phase 5 Reconciliation

验证 Phase 5:

Before:

``` text
publishedPairs = 105

blockedPairs = 13
```

After:

``` text
publishedPairs = 118

blockedPairs = 0
```

Expected delta:

``` text
publishedPairs delta = +13
```

必须确认：

``` text
resolvedPairs = publishedPairsAdded
```

------------------------------------------------------------------------

# 6. Production Snapshot

生成最终 production snapshot。

必须记录：

``` text
papers

questionRecords

topLevelQuestions

leafQuestions

responseAreas

markSchemeEntries

pairings

batches

expansionBatches
```

输出：

``` text
productionSnapshot
```

------------------------------------------------------------------------

# 7. Production Integrity Validation

Phase 6 必须确认：

## Existing Records

``` text
existingProductionRecordsUnchanged = true
```

------------------------------------------------------------------------

## Unexpected Mutation

必须：

``` text
unexpectedProductionChanges = []
```

------------------------------------------------------------------------

## Hash Verification

记录：

``` text
productionBeforeSha256

productionAfterSha256
```

要求：

``` text
unchanged = true
```

------------------------------------------------------------------------

# 8. Source Integrity Freeze

确认：

``` text
sourceAssetsBeforeSha256

sourceAssetsAfterSha256
```

要求：

``` text
unchanged = true
```

禁止：

-   PDF 替换
-   source 文件修改
-   文件重命名

------------------------------------------------------------------------

# 9. Parser Stability Freeze

Phase 5 修改涉及：

``` text
INLINE_REFERENCE_AND_TABLE_INDEX_AMBIGUITY
```

因此 Phase 6 必须增加 targeted regression。

检查：

``` text
Question Split

Leaf Question Detection

Mark Extraction

Mark Sum Validation

Response Area Mapping

Mark Scheme Pairing
```

要求：

``` text
PASS
```

同时：

``` text
parserModified = false
```

------------------------------------------------------------------------

# 10. Canonical Stability Freeze

确认：

``` text
canonicalModified = false
```

验证：

``` text
Question Model

Leaf Question Model

Response Area Model

Mark Scheme Model

Source Trace
```

要求：

``` text
all PASS
```

------------------------------------------------------------------------

# 11. Frontend Verification

最终检查：

``` text
Question Finder

Knowledge Checklist

Mark Scheme Search

AI Retrieval

Open Original Question

QP/MS Correspondence
```

要求：

``` text
frontendVerification = PASS
```

------------------------------------------------------------------------

# 12. Regression Requirements

必须通过：

``` text
Phase 1 Regression

Phase 2 Regression

Phase 3 Regression

Phase 4 Audit

Phase 5 Investigation Regression
```

测试：

``` text
fullNpmTest = PASS

prismaValidate = PASS
```

架构：

``` text
architectureFailures = []

documentRoleRegressions = []
```

------------------------------------------------------------------------

# 13. Final Closure Report

生成：

``` text
phase6-9618-final-production-closure-report.json
```

必须包含：

``` text
phaseId

status

closureDecision

finalCoverage

productionSnapshot

sourceIntegrity

stagingIntegrity

productionIntegrity

parserIntegrity

canonicalIntegrity

frontendVerification

regression

remainingIssues

next
```

------------------------------------------------------------------------

# 14. Closure Decision Logic

## FULL_PASS

条件：

``` text
sourcePairs = 118

stagingPairs = 118

publishedPairs = 118

blockedPairs = 0

eligibleUnpublishedPairs = 0

partialProductionConflicts = 0

all regression PASS

all integrity checks PASS
```

结果：

``` text
closureDecision = FULL_PASS
```

------------------------------------------------------------------------

## BLOCKED

任意：

``` text
missing staging

production mismatch

hidden blocker

parser regression

canonical regression

frontend regression
```

结果：

``` text
closureDecision = BLOCKED
```

------------------------------------------------------------------------

# 15. Expected Final State

``` text
sourcePairs:
118

completeSourcePairs:
118

stagingPairs:
118

publishedPairs:
118

blockedPairs:
0

eligibleUnpublishedPairs:
0

partialProductionConflicts:
0
```

------------------------------------------------------------------------

# 16. Definition of Done

Phase 6 完成：

``` text
9618 coverage frozen

all source verified

all staging verified

all production records verified

all 118 pairs published

blockedPairs = 0

production integrity verified

source integrity verified

parser frozen

canonical frozen

frontend verified

regression passed

closure report generated
```

------------------------------------------------------------------------

# 17. Roadmap Completion

``` text
Phase 1
9618 Initial Production Validation
✅ COMPLETE

↓

Phase 2
Duplicate Source Investigation
✅ COMPLETE

↓

Phase 3
Missing Staging Expansion
✅ COMPLETE

↓

Phase 4
Final Coverage Re-Audit
✅ COMPLETE

↓

Phase 5
Blocked Pair Investigation
✅ COMPLETE

↓

Phase 6
9618 Final Production Closure
CURRENT
```

------------------------------------------------------------------------

# 18. After Phase 6

9618 production expansion officially closed.

后续进入：

``` text
Phase 7
Cross-Syllabus Expansion
```

例如：

-   additional years
-   additional sessions
-   additional CAIE syllabus

不应继续修改 9618 已冻结 pipeline。
