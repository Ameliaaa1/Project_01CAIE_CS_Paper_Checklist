# PR-063 9618-2021-M/J Previously Blocked Pair Production Expansion Plan

## 1. PR Overview

**PR ID**

```text
PR-063
```

**Title**

```text
9618-2021-M/J Previously Blocked Pair Production Expansion
```

**Objective**

发布 PR-061 与 PR-062 修复后已经解除 blocker、且当前处于 strict eligible unpublished 状态的 2021 May/June pairs。

本 PR 仅处理以下 7 个 pairing keys：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-21
9618-2021-MJ-23
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
```

本 PR 不处理：

```text
9618-2021-ON-22
9618-2024-ON-12
```

这两个 pair 留给后续独立 production expansion PR。

---

## 2. Current Project Status

PR-062 已完成并通过。

PR-062 后：

```text
blockedPairs = 0
eligibleUnpublishedPairs = 9
partialProductionConflicts = 0
```

当前 9 个 eligible unpublished pairs：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-21
9618-2021-MJ-23
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
9618-2021-ON-22
9618-2024-ON-12
```

为了继续遵守：

```text
One PR
One Goal
Small Batch
Minimal Change
Avoid Regression
```

PR-063 只处理 2021 M/J 的 7 个 pair。

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

### Components

```text
11
13
21
23
31
32
33
```

### Pair Count

```text
7
```

---

## 4. Pairing Keys

本 PR scope：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-21
9618-2021-MJ-23
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
```

对应 QP/MS：

```text
9618-2021-MJ-11-QP
9618-2021-MJ-11-MS

9618-2021-MJ-13-QP
9618-2021-MJ-13-MS

9618-2021-MJ-21-QP
9618-2021-MJ-21-MS

9618-2021-MJ-23-QP
9618-2021-MJ-23-MS

9618-2021-MJ-31-QP
9618-2021-MJ-31-MS

9618-2021-MJ-32-QP
9618-2021-MJ-32-MS

9618-2021-MJ-33-QP
9618-2021-MJ-33-MS
```

---

## 5. Why These Pairs Are Now Eligible

PR-060 investigation identified all blockers as:

```text
A_VALIDATION_FALSE_POSITIVE
```

PR-061 fixed:

```text
CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE
```

Affected:

```text
9618-2021-MJ-21
9618-2021-MJ-23
```

PR-062 revalidated stale `×` diagnostics for:

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
```

Current expected eligibility:

```text
QP validationStatus = PASS
MS validationStatus = PASS

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

QP P0 = 0
QP P1 = 0
MS P0 = 0
MS P1 = 0
```

---

## 6. PR Goal

执行：

```text
Staging
   ↓
Preflight Validation
   ↓
Production Conflict Check
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
Coverage Recalculation
```

---

## 7. Preflight Requirements

每个 QP 和 MS 必须满足：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
```

Completeness checks 必须全部 PASS：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

如果任意 pair 不满足：

```text
do not publish that pair
```

不得通过跳过 validation、强制 publish 或修改 staging 状态来绕过 blocker。

---

## 8. Production Conflict Check

每个 pair 必须确认：

```text
alreadyPublished = false
partialProductionConflict = false
```

如果出现：

```text
QP published but MS missing
MS published but QP missing
pairing exists but paper incomplete
```

必须停止对应 pair 的 write。

不要在 PR-063 中顺手修复 production conflict。

---

## 9. Stable Modules

以下模块保持冻结：

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

PR-063 不允许修改：

```text
Parser
Canonical Model
Validation Rule
Staging Pipeline
Question Split
Response Area Logic
Glyph Logic
```

本 PR 唯一目标：

```text
Publish the 7 strict eligible 9618-2021-M/J pairs safely.
```

---

## 10. Production Write Expectations

固定预期：

```text
paperDelta = 14
pairingDelta = 7
batchDelta = 7
expansionBatchDelta = 1
```

以下数量必须根据 staging 动态计算：

```text
questionRecords
topLevelQuestions
leafQuestions
responseAreas
markSchemeEntries
```

禁止：

```text
guess counts
hardcode unverified counts
reuse old counts from blocked state without revalidation
```

---

## 11. Pair Verification Requirements

每个 pair 必须验证：

```text
paperCount = 2
sourceTraceAvailable = true
pairingLinked = true
```

并检查：

```text
questionCount
leafQuestionCount
responseAreaCount
markSchemeEntryCount
```

必须满足：

```text
actualCounts == expectedCounts
```

不得出现：

- missing QP
- missing MS
- broken pairing
- duplicate paper
- count drift
- missing source trace
- partial publication

---

## 12. Frontend Verification

必须检查：

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

建议按 pair 验证，同时输出整体 summary。

---

## 13. Integrity Verification

必须记录 Production Store 写入前后 hash：

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

这里的含义：

```text
允许新增 PR-063 scope 数据
禁止修改任何旧 production record
```

---

## 14. Staging Integrity

PR-063 不允许修改 staging。

必须确认：

```text
stagingArtifactsUnchanged = true
```

特别保护：

```text
PR-061 changed staging artifacts
PR-062 changed staging artifacts
```

这些已经验证后的 staging 文件在 PR-063 中只能读取，不能再修改。

---

## 15. Regression Verification

必须至少确认：

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
PR-058 PASS
PR-059 PASS
PR-060 PASS
PR-061 PASS
PR-062 PASS
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

专项 glyph regression 也必须继续 PASS：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 16. Coverage Expectations

PR-062 后：

```text
eligibleUnpublishedPairs = 9
blockedPairs = 0
```

如果 PR-063 成功发布 7 个 pair，则理论上：

```text
eligibleUnpublishedPairs = 2
publishedPairs = previous + 7
blockedPairs = 0
partialProductionConflicts = 0
```

但最终必须以 PR-063 实际：

```text
coverageAfter
```

为准。

---

## 17. Remaining Eligible Pairs After PR-063

理论上应剩：

```text
9618-2021-ON-22
9618-2024-ON-12
```

不要在 PR-063 中发布它们。

建议后续拆分：

```text
PR-064
9618-2021-O/N Previously Blocked Pair Production Expansion
```

目标：

```text
9618-2021-ON-22
```

之后：

```text
PR-065
9618-2024-O/N Previously Blocked Pair Production Expansion
```

目标：

```text
9618-2024-ON-12
```

但最终编号和 scope 应以 PR-063 的实际 `next` 为准。

---

## 18. Required Deliverables

### Production Expansion Report

建议：

```text
pr063-9618-2021-mj-previously-blocked-production-expansion-report.json
```

### Regression Test

建议：

```text
pr063-9618-2021-mj-previously-blocked-production-expansion.test.js
```

### Production Store

必须包含 7 个 scope 内 pair 的 QP/MS。

---

## 19. Report Requirements

最终 report 至少包含：

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

建议额外记录：

```text
previouslyBlocked = true
resolvedBy = [PR-061, PR-062]
```

---

## 20. Success Criteria

PR-063 PASS 条件：

```text
status = PASS
productionWrite = true

all 7 pairs preflight PASS
all 7 pairs production write PASS
all 7 pairs pair verification PASS
all frontend checks PASS

expectedDeltas == actualDeltas

existingRecordsUnchanged = true
stagingArtifactsUnchanged = true

blockedPairs = 0
partialProductionConflicts = 0

architectureFailures = []
documentRoleRegressions = []

fullNpmTest = PASS
prismaValidate = PASS
```

---

## 21. Failure Conditions

以下情况必须判定失败：

### A. Any pair fails preflight

```text
validationStatus != PASS
publishStatus != READY_TO_PUBLISH
P0 > 0
P1 > 0
```

### B. Production conflict

```text
partialProductionConflict = true
```

### C. Count mismatch

```text
expectedDeltas != actualDeltas
```

### D. Existing record mutation

```text
existingRecordsUnchanged = false
```

### E. Staging mutation

```text
stagingArtifactsUnchanged = false
```

### F. Regression

```text
architectureFailures != []
documentRoleRegressions != []
fullNpmTest != PASS
```

---

## 22. Minimal Change Rule

如果 PR-063 出现问题：

1. 先定位 root cause。
2. 判断是 data、staging、production conflict 还是 regression。
3. 不要修改 parser，除非有直接证据。
4. 不要修改 canonical model，除非有直接证据。
5. 不要扩大 scope。
6. 一个问题一个独立 PR。
7. 修复后重新跑完整 regression。

---

## 23. Next Step After PR-063

如果 PR-063 PASS：

```text
PR-063
   ↓
Review Production Report
   ↓
Check coverageAfter
   ↓
Publish remaining eligible pair(s) in separate small batches
   ↓
9618 Coverage Re-Audit
   ↓
Incomplete Source Investigation
   ↓
Missing Staging Expansion Planning
   ↓
Final Production Stability Validation
```

不要跳过 Coverage Re-Audit。

因为 PR-061 与 PR-062 改变了 blocked/eligible 状态，PR-063 又会改变 published/eligible 状态。

需要新的 authoritative coverage baseline。

---

## 24. Final Definition of Done

PR-063 完成标准：

```text
7 previously blocked 2021 M/J pairs published
14 papers added
7 pairings added
all expected and actual deltas match
all source traces preserved
all pairings linked
frontend verification PASS
existing records unchanged
staging unchanged
glyph regressions remain PASS
full regression PASS
blockedPairs remains 0
remaining eligible pairs clearly identified
next step derived from actual coverageAfter
```
