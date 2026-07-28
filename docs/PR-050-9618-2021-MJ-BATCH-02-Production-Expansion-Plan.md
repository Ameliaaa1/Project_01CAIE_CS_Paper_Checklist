# PR-050 9618-2021-MJ-BATCH-02 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-050

**Title**

9618-2021-MJ-BATCH-02 Production Expansion

**Objective**

将 PR-049 后重新生成的 preparation report 中确认的下一批 strict eligible 9618 paper pairs 发布到 Production。

目标范围：

```text
9618-2021-MJ-41
9618-2021-MJ-42
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

PR-049 已确认：

```text
status = PASS
productionWrite = true
```

已成功发布：

```text
9618-2021-MJ-12
9618-2021-MJ-22
```

PR-049 后重新生成的 preparation report 已确认下一批：

```text
PR050-9618-2021-MJ-BATCH-02
```

范围：

```text
9618-2021-MJ-41
9618-2021-MJ-42
```

并且：

```text
productionWrite = true
```

当前 9618 coverage：

```text
sourcePairs = 118
completeSourcePairs = 117
stagingPairs = 25
publishedPairs = 2
eligibleUnpublishedPairs = 14
missingStagingPairs = 92
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

---

## 3. Scope

### Included

本次只发布：

```text
9618-2021-MJ-41-QP
9618-2021-MJ-41-MS

9618-2021-MJ-42-QP
9618-2021-MJ-42-MS
```

---

### Excluded

以下内容不属于 PR-050：

- 9618-2021-MJ-43
- 9618-2021-MJ-11
- 9618-2021-MJ-13
- 9618-2021-MJ-21
- 9618-2021-MJ-23
- 9618-2021-MJ-31
- 9618-2021-MJ-32
- 9618-2021-MJ-33
- O/N session
- 2022 / 2023 / 2024 / 2025 expansion
- staging generation
- blocker resolution
- missing source repair
- duplicate source cleanup
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

PR-050 只执行：

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
9618_s21_qp_41.staging.json
9618_s21_ms_41.staging.json

9618_s21_qp_42.staging.json
9618_s21_ms_42.staging.json
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

### 9618-2021-MJ-41

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

### 9618-2021-MJ-42

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

QP 和 MS 必须分别满足对应 completeness gate。

---

## 9. Production Write Strategy

PR-050：

```text
productionWrite = true
```

只允许新增：

```text
9618-2021-MJ-41-QP
9618-2021-MJ-41-MS

9618-2021-MJ-42-QP
9618-2021-MJ-42-MS
```

禁止：

- 修改已有 0478 records
- 修改已有 9618 records
- 覆盖已有 paper IDs
- 修改 staging artifacts
- 修改 unrelated production data
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

### Component 41

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

### Component 42

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
9618-2021-MJ-41-QP
9618-2021-MJ-41-MS
9618-2021-MJ-42-QP
9618-2021-MJ-42-MS
```

禁止 year / session / component 错位。

特别确认：

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

必须做实际 record-by-record diff。

至少检查：

```text
existing batches changed = 0
existing papers changed = 0
existing questions changed = 0
existing response areas changed = 0
existing mark scheme entries changed = 0
existing pairings changed = 0
existing expansion batches changed = 0
```

禁止仅硬编码：

```text
existingRecordsUnchanged = true
```

---

## 17. Blocked Pair Protection

当前 blocked pairs：

```text
9
```

PR-050 只允许发布：

```text
9618-2021-MJ-41
9618-2021-MJ-42
```

任何：

```text
status = BLOCKED
```

的 pair 都不得误发布。

测试建议遍历全部 blocked pairing keys，而不是只检查其中一个。

---

## 18. Known 9618 Source Issues Remain Out of Scope

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

这些问题不属于 PR-050。

不得：

- 补 MS
- 删除 duplicate source
- 修改 source inventory
- 混入本次 Production publish

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
PR-049 PASS
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

PR-050 完成条件：

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

## 21. Expected Coverage After PR-050

如果成功：

```text
publishedPairs:
2 → 4
```

```text
eligibleUnpublishedPairs:
14 → 12
```

预计保持：

```text
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

本 PR 不生成 staging，因此：

```text
stagingPairs
```

不应因 Production publish 本身发生变化。

---

## 22. Required Output Report

建议生成：

```text
pr050-9618-2021-mj-batch-02-report.json
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
all blocked pairs remain unpublished
```

---

## 24. Follow-up Direction

PR-050 PASS 后，重新运行 9618 preparation inventory。

根据实际结果决定：

```text
PR-051
```

具体 year / session / components 必须由 PR-050 后重新生成的 preparation report 决定。

禁止提前猜测。

继续保持：

```text
One PR
=
One Goal
```
