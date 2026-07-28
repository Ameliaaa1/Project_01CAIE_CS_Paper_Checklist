# PR-043 0478-2022-MJ-BATCH-01 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-043

**Title**

0478-2022-MJ-BATCH-01 Production Expansion

**Objective**

将 PR-042 已成功生成并验证通过的两个 eligible paper pairs 发布到
Production。

目标范围：

``` text
0478-2022-MJ-11
0478-2022-MJ-12
```

本 PR 只执行：

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

------------------------------------------------------------------------

## 2. Preconditions

PR-042 已确认：

``` text
generated = 4
validationPass = 4
completenessPass = 4
readyToPublish = 4
P0 = 0
P1 = 0
P2 = 0
strictBatchPassGate = PASS
legalMultiplicationSign = PASS
productionWrite = false
```

当前 eligible unpublished pairs：

``` text
0478-2022-MJ-11
0478-2022-MJ-12
```

------------------------------------------------------------------------

## 3. Scope

### Included

本次发布：

``` text
0478-2022-MJ-11-QP
0478-2022-MJ-11-MS
0478-2022-MJ-12-QP
0478-2022-MJ-12-MS
```

### Excluded

以下内容不属于 PR-043：

-   2022 M/J 13
-   2022 M/J 21
-   2022 M/J 22
-   2022 M/J 23
-   2022 later staging generation
-   9618 expansion
-   9709 Mathematics support
-   Parser changes
-   Canonical Model changes
-   Response Area Pipeline changes
-   TEXT QUALITY Pipeline changes
-   Mark extraction redesign
-   Production schema redesign

------------------------------------------------------------------------

## 4. Architecture Boundary

保持现有稳定架构：

``` text
PDF
↓
Parser
↓
Canonical Model
↓
Staging
↓
Production
```

PR-043 只执行：

``` text
Staging
↓
Production
```

禁止重新设计或修改稳定 parser / canonical logic，除非出现真实
supported-syllabus blocker。

------------------------------------------------------------------------

## 5. Preflight Validation

发布前必须再次检查以下 4 个 staging artifacts：

``` text
0478_s22_qp_11.staging.json
0478_s22_ms_11.staging.json
0478_s22_qp_12.staging.json
0478_s22_ms_12.staging.json
```

每个 artifact 必须满足：

``` text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
P2 = 0
```

任何一个条件失败：

``` text
STOP
```

禁止 Production Write。

------------------------------------------------------------------------

## 6. Completeness Gate Requirements

必须全部 PASS：

``` text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

------------------------------------------------------------------------

## 7. Expected Staging Counts

PR-042 已确认：

### Component 11 QP

``` text
pageCount = 12
questionCount = 12
leafQuestionCount = 27
responseAreaCoverage = 27 / 27
```

### Component 11 MS

``` text
pageCount = 13
markSchemeEntryCount = 7
```

### Component 12 QP

``` text
pageCount = 12
questionCount = 8
leafQuestionCount = 21
responseAreaCoverage = 21 / 21
```

### Component 12 MS

``` text
pageCount = 13
markSchemeEntryCount = 10
```

PR-043 发布前必须确认 staging 数据没有发生意外变化。

------------------------------------------------------------------------

## 8. Known Valid Diagnostics

必须保持 PR-038A 之后的 diagnostic semantics。

### Allowed Null Mark

如果：

``` text
Leaf mark is null
AND
Existing staging rule explicitly permits null marks
```

则允许：

``` text
severity = P3
```

同时必须保持：

``` text
markCoverage = PASS
completeness = PASS
publishable = true
READY_TO_PUBLISH
```

P3 diagnostic 不阻塞本次 Production Publish。

------------------------------------------------------------------------

## 9. Strict Batch PASS Gate

继续保持 PR-040 修复后的严格规则。

只有 artifact 同时满足：

``` text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
P2 = 0
```

才能：

``` text
status = PASS
```

禁止 WARN / BLOCKED artifact 被错误聚合成 PASS。

------------------------------------------------------------------------

## 10. TEXT QUALITY Regression

必须保持：

``` text
PR-031 PASS
```

以及合法乘号：

``` text
U+00D7
×
```

必须：

``` text
not suspicious
```

不能重新触发：

``` text
SUSPICIOUS_GLYPHS_REMAIN
```

------------------------------------------------------------------------

## 11. Production Write Strategy

PR-043：

``` text
productionWrite = true
```

只允许新增：

``` text
0478-2022-MJ-11-QP
0478-2022-MJ-11-MS
0478-2022-MJ-12-QP
0478-2022-MJ-12-MS
```

禁止：

-   修改已有 production records
-   覆盖已有 paper IDs
-   修改 staging artifacts
-   修改 unrelated production data
-   修改此前 PR 已发布数据

------------------------------------------------------------------------

## 12. Duplicate and Partial Conflict Protection

发布前必须检查：

``` text
alreadyPublished
```

如果两个 pair 都已完整存在：

``` text
NO_CHANGES
```

如果出现 partial identity conflict，例如：

``` text
QP exists
MS missing
```

或：

``` text
MS exists
QP missing
```

则必须中止：

``` text
partial production identity conflict
```

禁止继续写入。

------------------------------------------------------------------------

## 13. Expected Production Delta

固定新增：

``` text
paperDelta = 4
pairingDelta = 2
```

其他 delta 必须从 staging 实际内容推导并验证：

``` text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

禁止手工猜测。

Actual 与 Expected 必须完全一致。

------------------------------------------------------------------------

## 14. Pair-Level Verification

### Component 11

必须检查：

``` text
paperCount = expected
questionCount = 12
leafQuestionCount = 27
responseAreaCount = expected
markSchemeEntryCount = 7
sourceTraceAvailable = true
pairingLinked = true
```

### Component 12

必须检查：

``` text
paperCount = expected
questionCount = 8
leafQuestionCount = 21
responseAreaCount = expected
markSchemeEntryCount = 10
sourceTraceAvailable = true
pairingLinked = true
```

------------------------------------------------------------------------

## 15. Frontend Verification

发布后必须验证：

``` text
Question Finder
Knowledge Checklist
Mark Scheme Search
AI Retrieval
Open Original Question
QP-MS Correspondence
```

全部：

``` text
PASS
```

------------------------------------------------------------------------

## 16. Integrity Verification

发布前保存：

``` text
production-store-before.json
production-store-before.sha256
```

发布后保存：

``` text
production-store-after.sha256
```

必须验证：

``` text
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
productionHashChanged = true
```

因为本次是合法 Production Write。

------------------------------------------------------------------------

## 17. Regression Requirements

必须保持：

### Historical Validation

``` text
Phase 1
20 / 20 PASS
```

``` text
Phase 2
120 / 120 PASS
```

### Historical Fixes

``` text
PR-030 PASS
Response Area Mapping
```

``` text
PR-031 PASS
Legacy Glyph Classification
```

``` text
PR-032 PASS
Mark Sum Validation
```

``` text
PR-038A PASS
Canonical Mark Coverage Diagnostic Severity Alignment
```

``` text
PR-040 PASS
Strict Batch PASS Gate
+
Legal Multiplication Sign
```

### Full Validation

``` text
fullNpmTest PASS
prismaValidate PASS
```

------------------------------------------------------------------------

## 18. Completion Criteria

PR-043 完成条件：

``` text
Preflight PASS
+
Production Write PASS
+
Pair Verification PASS
+
Integrity PASS
+
Frontend Verification PASS
+
Regression PASS
```

------------------------------------------------------------------------

## 19. Expected Coverage After PR-043

如果成功：

``` text
publishedPairs:
18 → 20
```

``` text
eligibleUnpublishedPairs:
2 → 0
```

2022 Production coverage：

``` text
11
12
```

2022 仍缺 staging：

``` text
13
21
22
23
```

整体 Production coverage：

``` text
2020 M/J:
11
12
13
21
22
23

2021 M/J:
11
12
13
21
22
23

2022 M/J:
11
12

2023 M/J:
11
12
13
21
22
23
```

------------------------------------------------------------------------

## 20. Follow-up Plan

PR-043 完成后，进入：

``` text
PR-044
0478 Missing Staging Generation Batch 04
```

建议范围：

``` text
0478-2022-MJ-13
0478-2022-MJ-21
```

流程：

``` text
PDF
↓
Parser / Canonical
↓
Generate Staging
↓
Validation
↓
Completeness Gate
↓
Eligibility Decision
```

继续保持：

``` text
productionWrite = false
```

以及：

``` text
One PR
=
One Goal
```
