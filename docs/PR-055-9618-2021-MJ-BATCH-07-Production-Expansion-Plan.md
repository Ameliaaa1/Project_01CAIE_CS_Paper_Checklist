# PR-055 9618-2021-M/J Batch-07 Production Expansion Plan

## 1. PR Overview

**PR ID**

```text
PR-055
```

**Batch ID**

```text
PR055-9618-2021-MJ-BATCH-07
```

**Objective**

继续执行 9618 syllabus 的 Production Expansion。

本 PR 只处理一个 production-ready pair：

```text
9618-2021-MJ-43
```

本 PR 不修改 Parser、不修改 Canonical Model、不修改 Staging Pipeline，不重新设计任何稳定模块。

---

## 2. Current Project Status

当前已完成并通过：

- PR-049 9618-2021-MJ-BATCH-01
- PR-050 9618-2021-MJ-BATCH-02
- PR-051 9618-2021-ON-BATCH-03
- PR-052 9618-2021-ON-BATCH-04
- PR-053 9618-2021-ON-BATCH-05
- PR-054 9618-2021-ON-BATCH-06

PR-054 完成后：

```text
publishedPairs = 12
eligibleUnpublishedPairs = 4
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

下一批根据 strict eligible unpublished pairs 选择：

```text
9618-2021-MJ-43
```

---

## 3. Scope

### Syllabus

```text
9618
```

### Year

```text
2021
```

### Session

```text
M/J
```

### Component

```text
43
```

### Pairing Key

```text
9618-2021-MJ-43
```

对应：

```text
9618-2021-MJ-43-QP
9618-2021-MJ-43-MS
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
Regression Test
```

---

## 5. Preflight Requirements

执行 Production Write 前，必须确认以下条件。

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

如果发现 partial production conflict，本 PR 必须停止 production write，并单独调查，不允许在本 PR 内顺手修复。

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

本 PR 目标仅为 Production Expansion。

禁止为了发布一个 pair 而修改 parser 或重构现有架构。

---

## 7. Production Write

目标写入：

```text
9618-2021-MJ-43-QP
9618-2021-MJ-43-MS
```

预期：

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

不得因为 Production Expansion 影响现有 frontend 行为。

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

这里的含义是：

- 允许新增本 PR scope 内的数据
- 不允许修改任何已有 production record

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
```

同时：

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

当前 blocked pairs 不属于 PR-055。

PR-055 不得顺带发布任何 blocked pair。

尤其需要保持：

```text
blockedPairs remain unpublished
```

不要在本 PR 中处理：

- validation WARN
- unresolved P1
- missing staging
- incomplete source pair
- duplicate source cleanup
- asset inventory cleanup
- 9709 syllabus

这些问题如需处理，必须拆分独立 investigation/fix PR。

---

## 13. Required Deliverables

PR-055 完成后至少生成：

### Production Expansion Report

建议文件名：

```text
pr055-9618-2021-mj-batch-07-report.json
```

### Regression Test

建议文件名：

```text
pr055-production-expansion-9618-2021-mj-batch-07.test.js
```

### Production Store

确认已写入：

```text
9618-2021-MJ-43-QP
9618-2021-MJ-43-MS
```

---

## 14. Report Requirements

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

---

## 15. Success Criteria

PR-055 只有在以下条件全部满足时才能判定 PASS：

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
```

---

## 16. Failure Handling

如果出现 failure，先分类：

### Parser Regression

只有明确证据显示 parser 产生错误时，才进入 parser investigation。

### Data Issue

例如 source PDF 缺失、重复或异常。

### Staging Issue

例如 staging artifact 缺失或 validation 未通过。

### Production Conflict

例如只存在 QP 或只存在 MS。

### Unsupported Syllabus

9709 不属于当前支持范围。

不得把 9709 作为：

- bug
- regression
- architecture failure
- test failure

---

## 17. Minimal Change Rule

如果 PR-055 出现问题：

1. 先定位 Root Cause。
2. 判断是否真的需要代码修改。
3. 优先最小 patch。
4. 不修改无关稳定模块。
5. 不重构。
6. 不扩大 PR scope。
7. 一个 PR 只解决一个目标。

---

## 18. Next Step After PR-055

如果 PR-055 PASS：

```text
PR-055
   ↓
Review Production Report
   ↓
继续处理 remaining eligible unpublished pairs
   ↓
完成 9618 Production Expansion
   ↓
9618 Coverage Audit
   ↓
Blocked / Incomplete Item Cleanup
   ↓
Final Production Stability Validation
```

下一批必须根据 PR-055 完成后的最新 `coverageAfter` 和 `next` 字段决定。

不要提前假设下一批 component。

---

## 19. Final Definition of Done

PR-055 完成标准：

```text
9618-2021-MJ-43 successfully published
QP and MS both present
pairing linked
source trace preserved
expected deltas equal actual deltas
frontend verification PASS
existing records unchanged
staging unchanged
full regression PASS
no architecture regression
no document role regression
```
