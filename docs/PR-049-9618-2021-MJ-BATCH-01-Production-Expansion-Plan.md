# PR-049 9618-2021-MJ-BATCH-01 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-049

**Title**

9618-2021-MJ-BATCH-01 Production Expansion

**Objective**

将 PR-048 / PR-048A 已确认的第一批 strict eligible 9618 paper pairs 发布到 Production。

目标范围：

```text
9618-2021-MJ-12
9618-2021-MJ-22
```

本 PR 执行：

```text
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

```text
productionWrite = true
```

---

## 2. Preconditions

PR-048 已确认：

```text
sourcePairs = 118
completeSourcePairs = 117
stagingPairs = 25
eligibleUnpublishedPairs = 16
blockedPairs = 9
missingStagingPairs = 92
incompleteSourcePairs = 1
publishedPairs = 0
```

PR-048A 已修复：

```text
decision = "9618 Production Expansion Batch 01"
productionWrite = true
```

推荐下一批固定为：

```text
PR049-9618-2021-MJ-BATCH-01
```

范围：

```text
9618-2021-MJ-12
9618-2021-MJ-22
```

---

## 3. Scope

### Included

本次只发布：

```text
9618-2021-MJ-12-QP
9618-2021-MJ-12-MS

9618-2021-MJ-22-QP
9618-2021-MJ-22-MS
```

---

### Excluded

以下内容不属于 PR-049：

- 9618-2021-MJ-11
- 9618-2021-MJ-13
- 9618-2021-MJ-21
- 9618-2021-MJ-23
- 9618-2021-MJ-31 / 32 / 33
- 9618-2021-MJ-41 / 42 / 43
- O/N session
- 2022 / 2023 / 2024 / 2025 expansion
- staging generation
- blocker resolution
- duplicate source cleanup
- missing MS repair
- Parser redesign
- Canonical Model redesign
- Response Area Pipeline redesign
- TEXT QUALITY Pipeline redesign
- Production schema redesign
- 0478 changes
- 9709 support

---

## 4. Architecture Boundary

保持现有稳定架构：

```text
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

PR-049 只执行：

```text
Validated Staging
↓
Production
```

禁止重新设计 parser、canonical model 或 stable pipelines。

---

## 5. Preflight Validation

发布前必须再次检查以下 staging artifacts：

```text
9618_s21_qp_12.staging.json
9618_s21_ms_12.staging.json

9618_s21_qp_22.staging.json
9618_s21_ms_22.staging.json
```

每个 artifact 必须满足：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH

P0 = 0
P1 = 0
P2 = 0
```

任何一个条件失败：

```text
STOP
```

禁止 Production Write。

---

## 6. Strict Eligibility Gate

继续保持 PR-040 之后的严格规则。

只有同时满足：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
P2 = 0
```

才允许：

```text
publishEligibility = YES
```

禁止：

```text
WARN
BLOCKED
FAIL
```

进入 Production。

---

## 7. Pair-Level Eligibility Review

### 9618-2021-MJ-12

必须确认：

```text
QP staging exists
MS staging exists

QP validationStatus = PASS
MS validationStatus = PASS

QP completenessStatus = PASS
MS completenessStatus = PASS

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

QP P0/P1/P2 = 0
MS P0/P1/P2 = 0
```

---

### 9618-2021-MJ-22

必须确认：

```text
QP staging exists
MS staging exists

QP validationStatus = PASS
MS validationStatus = PASS

QP completenessStatus = PASS
MS completenessStatus = PASS

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

QP P0/P1/P2 = 0
MS P0/P1/P2 = 0
```

---

## 8. Completeness Gate Requirements

必须全部 PASS：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

QP 和 MS 都必须满足对应 completeness gate。

---

## 9. Production Write Strategy

PR-049：

```text
productionWrite = true
```

只允许新增：

```text
9618-2021-MJ-12-QP
9618-2021-MJ-12-MS

9618-2021-MJ-22-QP
9618-2021-MJ-22-MS
```

禁止：

- 修改已有 0478 records
- 修改已有 Production records
- 覆盖已有 paper IDs
- 修改 staging artifacts
- 修改 unrelated 9618 data
- 顺手 publish 其他 eligible pairs

---

## 10. Duplicate and Partial Conflict Protection

发布前必须检查：

```text
alreadyPublished
```

如果两个 pair 已完整存在：

```text
NO_CHANGES
```

如果出现：

```text
QP exists
MS missing
```

或：

```text
MS exists
QP missing
```

或：

```text
pairing exists
but one paper missing
```

则必须：

```text
STOP
```

并报告：

```text
PARTIAL_PRODUCTION_CONFLICT
```

禁止继续写入。

---

## 11. Expected Production Delta

固定新增：

```text
paperDelta = 4
pairingDelta = 2
```

其他 delta 必须从 staging 实际内容推导：

```text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

禁止手工猜测。

必须验证：

```text
Actual
=
Expected
```

---

## 12. Pair-Level Verification

### Component 12

必须验证：

```text
paperCount = 2
questionCount = expected from staging
leafQuestionCount = expected from staging
responseAreaCount = expected from staging
markSchemeEntryCount = expected from staging
sourceTraceAvailable = true
pairingLinked = true
```

---

### Component 22

必须验证：

```text
paperCount = 2
questionCount = expected from staging
leafQuestionCount = expected from staging
responseAreaCount = expected from staging
markSchemeEntryCount = expected from staging
sourceTraceAvailable = true
pairingLinked = true
```

---

## 13. Source Identity Verification

必须确认 Production 中准确新增：

```text
9618-2021-MJ-12-QP
9618-2021-MJ-12-MS
9618-2021-MJ-22-QP
9618-2021-MJ-22-MS
```

禁止出现错误 year / session / component。

特别注意：

```text
M/J
```

不得错误写成：

```text
O/N
```

---

## 14. Frontend Verification

发布后必须验证：

```text
Question Finder
Knowledge Checklist
Mark Scheme Search
AI Retrieval
Open Original Question
QP-MS Correspondence
```

全部：

```text
PASS
```

---

## 15. Production Integrity Verification

发布前保存：

```text
production-store-before.json
production-store-before.sha256
```

发布后保存：

```text
production-store-after.json
production-store-after.sha256
```

必须验证：

```text
productionHashChanged = true
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
```

并确认：

```text
production-store-after.json
```

与实际 Production store 完全一致。

---

## 16. Existing Records Protection

建议实际做 record-by-record diff，而不是硬编码：

```text
existingRecordsUnchanged = true
```

至少检查：

```text
existing batches changed = 0
existing papers changed = 0
existing questions changed = 0
existing response areas changed = 0
existing mark scheme entries changed = 0
existing pairings changed = 0
```

---

## 17. 9618-Specific Source Issues Must Remain Out of Scope

PR-048 已发现：

```text
9618-2022-MJ-41
MS missing
```

以及：

```text
9618-2021-ON-41
duplicate MS source paths
```

这些不属于 PR-049。

不得：

- 补 MS
- 删除 duplicate source
- 修改 source inventory
- 把这些 issue 混入本次 Production publish

---

## 18. Blocked Pair Protection

当前 blocked pairs：

```text
9
```

PR-049 只允许发布 strict eligible pairs。

任何以下 pair 不得误发布：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-21
9618-2021-MJ-23
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
```

以及其他任何：

```text
status = BLOCKED
```

的 pair。

---

## 19. Regression Requirements

必须保持：

```text
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
```

以及：

```text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 20. Completion Criteria

PR-049 完成条件：

```text
Preflight PASS

+

Strict Eligibility PASS

+

Production Write PASS

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

---

## 21. Expected Coverage After PR-049

如果成功：

```text
publishedPairs:
0 → 2
```

```text
eligibleUnpublishedPairs:
16 → 14
```

其他状态预计保持：

```text
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

`missingStagingPairs` 是否变化取决于 preparation report 的重新分类逻辑，但本 PR 不生成 staging，因此不应因发布本身减少 source-side missing staging。

---

## 22. Required Output Report

建议生成：

```text
pr049-9618-2021-mj-batch-01-report.json
```

至少包含：

```text
generatedFor
batchId
status
scope
preflight
publication
pairVerification
frontendVerification
integrity
regression
coverageAfter
next
```

---

## 23. Recommended Test Coverage

测试至少覆盖：

```text
correct scope
exact paper IDs
strict eligibility
productionWrite = true
paperDelta = 4
pairingDelta = 2
actual counts = expected counts
source trace available
pairing linked
all frontend verification PASS
existing records unchanged
staging unchanged
blocked pairs not published
```

---

## 24. Follow-up Direction

PR-049 PASS 后，不应直接一次性发布剩余 14 个 eligible pairs。

继续按：

```text
One PR
=
One Goal
```

优先重新运行 9618 preparation inventory，并根据实际结果选择：

```text
next smallest safe same-year/session batch
```

可能进入：

```text
PR-050
9618 Production Expansion Batch 02
```

但具体 year / session / components 必须由 PR-049 后重新生成的 preparation report 决定。

禁止提前猜测。
