# PR-058 9618-2025-O/N Batch-10 Production Expansion Plan

## 1. PR Overview

**PR ID**

```text
PR-058
```

**Batch ID**

```text
PR058-9618-2025-ON-BATCH-10
```

**Objective**

继续执行 9618 syllabus 的 Production Expansion。

本 PR 仅处理当前最后一个 strict eligible unpublished pair：

```text
9618-2025-ON-42
```

本 PR 不修改 Parser，不修改 Canonical Model，不修改 Staging Pipeline，不重新设计任何已有稳定架构。

---

## 2. Current Project Status

当前已完成并通过：

- PR-049 9618-2021-MJ-BATCH-01
- PR-050 9618-2021-MJ-BATCH-02
- PR-051 9618-2021-ON-BATCH-03
- PR-052 9618-2021-ON-BATCH-04
- PR-053 9618-2021-ON-BATCH-05
- PR-054 9618-2021-ON-BATCH-06
- PR-055 9618-2021-MJ-BATCH-07
- PR-056 9618-2023-MJ-BATCH-08
- PR-057 9618-2025-MJ-BATCH-09

PR-057 完成后：

```text
publishedPairs = 15
eligibleUnpublishedPairs = 1
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

根据 PR-057 report 的 `next` 字段，下一批应为：

```text
9618-2025-ON-42
```

---

## 3. Scope

### Syllabus

```text
9618
```

### Year

```text
2025
```

### Session

```text
O/N
```

### Component

```text
42
```

### Pairing Key

```text
9618-2025-ON-42
```

对应：

```text
9618-2025-ON-42-QP
9618-2025-ON-42-MS
```

---

## 4. PR Goal

目标是将已经通过 staging validation 的 QP/MS pair 安全写入 Production。

执行路径：

```text
Staging
   ↓
Preflight Validation
   ↓
Production Write
   ↓
Pair Verification
   ↓
Frontend Verification
   ↓
Integrity Verification
   ↓
Regression Verification
   ↓
Coverage Completion Check
```

---

## 5. Preflight Requirements

在执行 Production Write 前，必须确认以下条件全部成立。

### Question Paper

必须满足：

```text
documentRole = question_paper
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
```

### Mark Scheme

必须满足：

```text
documentRole = mark_scheme
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
```

### Completeness Checks

以下全部必须为 PASS：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

### Production Conflict Check

必须确认：

```text
alreadyPublished = false
partialProductionConflict = false
```

如果发现 partial production conflict，本 PR 必须停止 production write，并拆分独立 investigation PR。

禁止在本 PR 中顺手修复。

---

## 6. Stable Modules

以下模块已经稳定，禁止无理由修改：

- Question Split
- Stable Question ID
- Parent / Leaf Question Model
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- TEXT QUALITY Pipeline
- Response Area Pipeline
- Document Role Router
- Mark Scheme Pipeline

本 PR 唯一目标是：

```text
Publish 9618-2025-ON-42 safely
```

禁止为了完成最后一个 eligible pair 而：

- 修改 parser
- 重构 canonical model
- 修改 response area pipeline
- 修改 text quality pipeline
- 调整稳定 question splitting 逻辑
- 合并 blocked item cleanup

---

## 7. Production Write

目标写入：

```text
9618-2025-ON-42-QP
9618-2025-ON-42-MS
```

固定预期：

```text
paperDelta = 2
pairingDelta = 1
batchDelta = 1
expansionBatchDelta = 1
```

以下数量必须根据 staging 数据动态确定：

```text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

禁止手工猜测或硬编码未经 staging verification 确认的数量。

---

## 8. Pair Verification

Production Write 后必须检查：

```text
paperCount
questionCount
leafQuestionCount
responseAreaCount
markSchemeEntryCount
```

要求：

```text
actualCounts == expectedCounts
```

同时必须确认：

```text
sourceTraceAvailable = true
pairingLinked = true
```

不得存在：

- missing QP
- missing MS
- broken pairing
- duplicate paper
- missing source trace
- count drift
- partial publication

---

## 9. Frontend Verification

必须验证：

```text
questionFinder
knowledgeChecklist
markSchemeSearch
aiRetrieval
openOriginalQuestion
qpMsCorrespondence
```

全部必须：

```text
PASS
```

新增 pair 不得影响现有 frontend 行为。

---

## 10. Integrity Verification

必须记录 Production Store 写入前后的 hash：

```text
beforeSha256
afterSha256
```

预期：

```text
productionHashChanged = true
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
```

Existing Record Changes 必须全部为 0：

```text
batches = 0
papers = 0
questions = 0
responseAreas = 0
markSchemeEntries = 0
pairings = 0
expansionBatches = 0
```

这里的要求是：

- 允许新增 PR-058 scope 内的数据
- 不允许修改任何旧 production record
- 不允许修改 staging artifacts

---

## 11. Regression Verification

至少执行并确认：

```text
PR-030 PASS
PR-031 PASS
PR-032 PASS
PR-048 PASS
PR-049 PASS
PR-050 PASS
PR-051 PASS
PR-052 PASS
PR-053 PASS
PR-054 PASS
PR-055 PASS
PR-056 PASS
PR-057 PASS
```

同时必须保证：

```text
architectureFailures = []
documentRoleRegressions = []
phase1 = PASS
phase2 = PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 12. Blocked Items Must Remain Unpublished

当前 blocked pairs 不属于 PR-058。

PR-058 不得顺带发布任何 blocked pair。

以下问题全部不属于本 PR：

- validation WARN
- unresolved P1
- missing staging
- incomplete source pair
- duplicate source cleanup
- asset inventory cleanup
- parser architecture redesign
- 9709 syllabus

9709 当前不受支持，因此不得作为：

- bug
- regression
- architecture failure
- test failure

---

## 13. Coverage Completion Check

PR-058 是当前最后一个 strict eligible unpublished pair。

PR-058 成功后，理论上应达到：

```text
eligibleUnpublishedPairs = 0
```

必须检查：

```text
coverageAfter.eligibleUnpublishedPairs
```

成功条件：

```text
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```

但以下状态仍可能存在：

```text
blockedPairs > 0
incompleteSourcePairs > 0
missingStagingPairs > 0
```

这些不代表 PR-058 失败。

它们属于后续独立阶段：

```text
9618 Coverage Audit
Blocked / Incomplete Item Cleanup
Final Production Stability Validation
```

---

## 14. Required Deliverables

PR-058 完成后至少生成：

### Production Expansion Report

建议文件名：

```text
pr058-9618-2025-on-batch-10-report.json
```

### Regression Test

建议文件名：

```text
pr058-production-expansion-9618-2025-on-batch-10.test.js
```

### Production Store

确认已写入：

```text
9618-2025-ON-42-QP
9618-2025-ON-42-MS
```

---

## 15. Report Requirements

最终 JSON report 至少应包含：

```text
generatedFor
batchId
status
scope
preflight
alreadyPublished
partialProductionConflict
expectedDeltas
result
publication
pairVerification
frontendVerification
integrity
productionState
coverageAfter
next
regression
```

特别注意：

如果 strict eligible production expansion 已完成：

```text
coverageAfter.eligibleUnpublishedPairs = 0
```

此时 `next` 不应继续指向新的 eligible production batch。

建议下一步转为：

```text
9618 Coverage Audit
```

---

## 16. Success Criteria

PR-058 只有在以下条件全部满足时才能判定 PASS：

```text
status = PASS
productionWrite = true
preflight = PASS
pairVerification = PASS
frontendVerification = PASS
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
architectureFailures = []
documentRoleRegressions = []
fullNpmTest = PASS
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```

---

## 17. Failure Handling

如果出现 failure，先进行分类。

### Parser Regression

只有存在明确证据显示 parser 输出错误时，才进入 parser investigation。

### Data Issue

例如：

- source PDF 缺失
- source PDF 重复
- source asset 路径异常

### Staging Issue

例如：

- staging artifact 缺失
- validation 未通过
- canonical publishability 不满足要求

### Production Conflict

例如：

- 只有 QP 已发布
- 只有 MS 已发布
- pairing 已存在但 paper 缺失

### Unsupported Syllabus

9709 不属于当前支持范围。

不得把 9709 作为 bug 或 regression。

---

## 18. Minimal Change Rule

如果 PR-058 出现问题：

1. 先定位 Root Cause。
2. 判断是否真的需要代码修改。
3. 优先最小 patch。
4. 不修改无关稳定模块。
5. 不重构。
6. 不扩大 PR scope。
7. 一个 PR 只解决一个目标。
8. 修复后必须重新跑 regression。

---

## 19. Next Step After PR-058

如果 PR-058 PASS 且：

```text
eligibleUnpublishedPairs = 0
```

则 strict eligible 9618 Production Expansion 完成。

下一阶段：

```text
PR-058 PASS
   ↓
9618 Coverage Audit
   ↓
确认 published / blocked / incomplete / missing staging 状态
   ↓
Blocked / Incomplete Item Cleanup
   ↓
Final Production Stability Validation
   ↓
0478 stable
9618 stable
```

不要直接进入新 syllabus。

先完成 9618 coverage closure 和 final stability validation。

---

## 20. Suggested Next PR After PR-058

如果 PR-058 PASS，建议下一 PR 不再是 production expansion batch，而是：

```text
PR-059
9618 Production Coverage Audit
```

目标：

- 汇总 source pairs
- 汇总 staging pairs
- 汇总 published pairs
- 列出 blocked pairs
- 列出 incomplete source pairs
- 列出 missing staging pairs
- 验证 partial production conflicts = 0
- 验证 eligible unpublished pairs = 0
- 输出最终 coverage report

禁止在 Coverage Audit PR 中同时修复 blocked items。

Audit 只负责确认事实和分类。

---

## 21. Final Definition of Done

PR-058 完成标准：

```text
9618-2025-ON-42 successfully published
QP and MS both present
pairing linked
source trace preserved
expected deltas equal actual deltas
frontend verification PASS
existing records unchanged
staging artifacts unchanged
full regression PASS
no architecture regression
no document role regression
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```
