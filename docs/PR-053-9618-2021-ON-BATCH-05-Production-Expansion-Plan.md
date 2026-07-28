# PR-053 9618-2021-ON-BATCH-05 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-053

**Title**

9618-2021-ON-BATCH-05 Production Expansion

**Objective**

将 PR-052 完成后重新生成的 preparation report 中确认的下一批 strict
eligible 9618 paper pairs 发布到 Production。

目标范围：

``` text
9618-2021-ON-23
9618-2021-ON-31
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

PR-052 已完成：

``` text
status = PASS
productionWrite = true
```

已发布：

``` text
9618-2021-ON-11
9618-2021-ON-12
9618-2021-ON-13
9618-2021-ON-21
```

PR-052 后重新生成 preparation inventory。

下一批选择：

``` text
PR053-9618-2021-ON-BATCH-05
```

范围：

``` text
9618-2021-ON-23
9618-2021-ON-31
```

选择原则：

``` text
Smallest safe same-year/session batch
from strict eligible unpublished pairs
```

------------------------------------------------------------------------

## 3. Scope

### Included

只允许发布：

``` text
9618-2021-ON-23-QP
9618-2021-ON-23-MS

9618-2021-ON-31-QP
9618-2021-ON-31-MS
```

------------------------------------------------------------------------

### Excluded

本 PR 不包含：

-   9618-2021-ON-22
-   9618-2021-ON-32
-   9618-2021-ON-33
-   9618-2024-ON-12
-   其他 year/session/component
-   blocker 修复
-   missing source 修复
-   duplicate cleanup
-   parser redesign
-   canonical model redesign
-   response area pipeline redesign
-   TEXT QUALITY pipeline redesign
-   0478 修改
-   9709 support

------------------------------------------------------------------------

## 4. Architecture Boundary

保持：

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

PR-053 只执行：

``` text
Validated Staging
↓
Production
```

禁止修改稳定模块：

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

检查：

``` text
9618_w21_qp_23.staging.json
9618_w21_ms_23.staging.json

9618_w21_qp_31.staging.json
9618_w21_ms_31.staging.json
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

任何失败：

``` text
STOP
```

禁止 Production Write。

------------------------------------------------------------------------

## 6. Pair-Level Eligibility

### 9618-2021-ON-23

确认：

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

### 9618-2021-ON-31

确认：

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

PR-053:

``` text
productionWrite = true
```

只允许新增：

``` text
9618-2021-ON-23-QP
9618-2021-ON-23-MS

9618-2021-ON-31-QP
9618-2021-ON-31-MS
```

禁止：

-   修改已有 Production records
-   覆盖已有 paper IDs
-   发布其他 eligible pairs
-   修改 staging artifacts
-   修改稳定 parser 模块

------------------------------------------------------------------------

## 8. Expected Production Delta

固定：

``` text
paperDelta = 4
pairingDelta = 2
```

以下必须从 staging 计算：

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

新增：

``` text
9618-2021-ON-23-QP
9618-2021-ON-23-MS

9618-2021-ON-31-QP
9618-2021-ON-31-MS
```

检查：

``` text
year = 2021
session = O/N
```

禁止：

``` text
wrong year
wrong session
wrong component
```

------------------------------------------------------------------------

## 12. Blocked Pair Protection

当前 blocked pairs 必须保持 unpublished。

验证：

``` text
all blocked pairing keys remain absent from Production
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

要求：

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

------------------------------------------------------------------------

## 15. Frontend Verification

验证：

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
PR-052 PASS
```

同时：

``` text
Phase 1 = 20/20 PASS
Phase 2 = 120/120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

------------------------------------------------------------------------

## 17. Completion Criteria

PR-053 完成：

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

PR-053 PASS 后：

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
