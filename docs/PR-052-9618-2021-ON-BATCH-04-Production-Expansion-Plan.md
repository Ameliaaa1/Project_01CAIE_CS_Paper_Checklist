# PR-052 9618-2021-ON-BATCH-04 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-052

**Title**

9618-2021-ON-BATCH-04 Production Expansion

**Objective**

将 PR-051 完成后重新生成的 preparation report 中确认的下一批 strict
eligible 9618 paper pairs 发布到 Production。

目标范围：

``` text
9618-2021-ON-13
9618-2021-ON-21
```

执行流程：

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

本 PR：

``` text
productionWrite = true
```

------------------------------------------------------------------------

## 2. Preconditions

PR-051 已完成：

``` text
status = PASS
productionWrite = true
```

已发布：

``` text
9618-2021-ON-11
9618-2021-ON-12
```

PR-051 后重新生成的 preparation report 确认：

``` text
PR052-9618-2021-ON-BATCH-04
```

范围：

``` text
9618-2021-ON-13
9618-2021-ON-21
```

选择规则：

``` text
Smallest safe same-year/session batch
from strict eligible unpublished pairs
```

------------------------------------------------------------------------

## 3. Scope

### Included

仅允许发布：

``` text
9618-2021-ON-13-QP
9618-2021-ON-13-MS

9618-2021-ON-21-QP
9618-2021-ON-21-MS
```

------------------------------------------------------------------------

### Excluded

本 PR 不包含：

-   9618-2021-ON-22
-   9618-2021-ON-23
-   9618-2024-ON-12
-   其他 year/session/component
-   blocker 修复
-   missing source 修复
-   duplicate source cleanup
-   parser redesign
-   canonical model redesign
-   response area pipeline redesign
-   TEXT QUALITY pipeline redesign
-   0478 修改
-   9709 support

------------------------------------------------------------------------

## 4. Architecture Boundary

保持当前稳定架构：

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

PR-052 只允许：

``` text
Validated Staging
↓
Production
```

禁止修改：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline

------------------------------------------------------------------------

## 5. Preflight Validation

发布前检查：

``` text
9618_w21_qp_13.staging.json
9618_w21_ms_13.staging.json

9618_w21_qp_21.staging.json
9618_w21_ms_21.staging.json
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

任意失败：

``` text
STOP
```

禁止 Production Write。

------------------------------------------------------------------------

## 6. Pair-Level Eligibility

### 9618-2021-ON-13

必须确认：

``` text
QP exists
MS exists

QP validationStatus = PASS
MS validationStatus = PASS

QP completenessStatus = PASS
MS completenessStatus = PASS

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

P0/P1/P2 = 0
```

------------------------------------------------------------------------

### 9618-2021-ON-21

必须确认：

``` text
QP exists
MS exists

QP validationStatus = PASS
MS validationStatus = PASS

QP completenessStatus = PASS
MS completenessStatus = PASS

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

P0/P1/P2 = 0
```

------------------------------------------------------------------------

## 7. Production Write Strategy

PR-052：

``` text
productionWrite = true
```

只允许新增：

``` text
9618-2021-ON-13-QP
9618-2021-ON-13-MS

9618-2021-ON-21-QP
9618-2021-ON-21-MS
```

禁止：

-   修改已有 Production records
-   覆盖已有 paper IDs
-   发布其他 eligible pairs
-   修改 staging
-   修改 stable modules

------------------------------------------------------------------------

## 8. Expected Production Delta

固定：

``` text
paperDelta = 4
pairingDelta = 2
```

以下从 staging 实际计算：

``` text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markSchemeEntryDelta
```

要求：

``` text
Actual = Expected
```

------------------------------------------------------------------------

## 9. Duplicate and Partial Conflict Protection

发布前检查：

``` text
alreadyPublished
partialProductionConflict
```

发现：

``` text
QP exists but MS missing

OR

MS exists but QP missing
```

必须：

``` text
STOP
```

------------------------------------------------------------------------

## 10. Pair Verification

每个 component 验证：

``` text
paperCount = 2
questionCount = expected from staging
leafQuestionCount = expected from staging
responseAreaCount = expected from staging
markSchemeEntryCount = expected from staging

sourceTraceAvailable = true
pairingLinked = true
```

------------------------------------------------------------------------

## 11. Source Identity Verification

新增必须准确：

``` text
9618-2021-ON-13-QP
9618-2021-ON-13-MS
9618-2021-ON-21-QP
9618-2021-ON-21-MS
```

检查：

``` text
year = 2021
session = O/N
```

禁止错误：

``` text
M/J
wrong component
wrong year
```

------------------------------------------------------------------------

## 12. Blocked Pair Protection

当前 blocked pairs：

``` text
9
```

必须验证：

``` text
all blocked pairing keys remain unpublished
```

测试必须遍历完整 blocked list。

------------------------------------------------------------------------

## 13. Production Integrity Verification

发布前保存：

``` text
production-store-before.json
production-store-before.sha256
```

发布后保存：

``` text
production-store-after.json
production-store-after.sha256
```

必须满足：

``` text
productionHashChanged = true
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
```

------------------------------------------------------------------------

## 14. Existing Records Protection

执行实际 diff：

``` text
existing batches changed = 0
existing papers changed = 0
existing questions changed = 0
existing response areas changed = 0
existing mark scheme entries changed = 0
existing pairings changed = 0
existing expansion batches changed = 0
```

禁止仅硬编码结果。

------------------------------------------------------------------------

## 15. Frontend Verification

必须验证：

``` text
Question Finder PASS
Knowledge Checklist PASS
Mark Scheme Search PASS
AI Retrieval PASS
Open Original Question PASS
QP-MS Correspondence PASS
```

------------------------------------------------------------------------

## 16. Regression Requirements

保持：

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
PR-051 PASS
```

以及：

``` text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

------------------------------------------------------------------------

## 17. Completion Criteria

PR-052 完成：

``` text
Preflight PASS

+

Strict Eligibility PASS

+

Production Publish PASS

+

Pair Verification PASS

+

Source Identity PASS

+

Integrity PASS

+

Frontend Verification PASS

+

Regression PASS
```

------------------------------------------------------------------------

## 18. Follow-up Direction

PR-052 PASS 后：

重新运行 9618 preparation inventory。

下一批必须由新的 preparation report 决定。

禁止提前指定：

``` text
year
session
component
```

继续保持：

``` text
One PR
=
One Goal
```
