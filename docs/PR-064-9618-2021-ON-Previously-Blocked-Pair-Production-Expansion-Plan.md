# PR-064 9618-2021-O/N Previously Blocked Pair Production Expansion Plan

## 1. PR Overview

**PR ID**

```text
PR-064
```

**Title**

```text
9618-2021-O/N Previously Blocked Pair Production Expansion
```

**Objective**

发布此前因 stale legal multiplication-glyph diagnostic 被 blocked、并在 PR-062 中完成 staging revalidation 后已经成为 strict eligible unpublished 的 pair：

```text
9618-2021-ON-22
```

本 PR 只处理一个 pairing key。

本 PR 不处理：

```text
9618-2024-ON-12
```

该 pair 留给后续独立 production expansion PR。

---

## 2. Current Project Status

PR-063 已完成并通过。

PR-063 后：

```text
publishedPairs = 23
eligibleUnpublishedPairs = 2
blockedPairs = 0
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

当前 remaining eligible unpublished pairs：

```text
9618-2021-ON-22
9618-2024-ON-12
```

根据 PR-063 report 的 `next`：

```text
proposedPr = PR-064
decision = 9618-2021-O/N Previously Blocked Pair Production Expansion
pairCount = 1
pairingKeys = [9618-2021-ON-22]
```

因此 PR-064 只处理：

```text
9618-2021-ON-22
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
O/N
```

### Component

```text
22
```

### Pairing Key

```text
9618-2021-ON-22
```

对应：

```text
9618-2021-ON-22-QP
9618-2021-ON-22-MS
```

---

## 4. Why This Pair Is Now Eligible

PR-060 investigation 将该 pair 的 blocker 分类为：

```text
A_VALIDATION_FALSE_POSITIVE
```

Subtype：

```text
STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC
```

Affected document：

```text
9618-2021-ON-22-MS
```

原问题：

```text
SUSPICIOUS_GLYPHS_REMAIN
CANONICAL_TEXT_CLEAN failed
```

原因是合法的：

```text
1280 × 800
```

被旧 staging diagnostic 记录为 suspicious。

PR-062 完成后：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P1 = 0
storedSuspiciousCount = 0
currentRecomputedSuspiciousCount = 0
```

因此该 pair 现在可进入 production preflight。

---

## 5. PR Goal

执行流程：

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

## 6. Preflight Requirements

QP 必须满足：

```text
documentRole = question_paper
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
```

MS 必须满足：

```text
documentRole = mark_scheme
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

如果任意条件不满足：

```text
do not publish
```

不得强制绕过 blocker。

---

## 7. Production Conflict Check

必须确认：

```text
alreadyPublished = false
partialProductionConflict = false
```

如果发现：

```text
QP already published
MS already published
only one role published
pairing exists but paper incomplete
```

必须停止 production write。

不要在 PR-064 中顺手修复 production conflict。

---

## 8. Stable Modules

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

PR-064 不允许修改：

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
Publish 9618-2021-ON-22 safely.
```

---

## 9. Production Write Expectations

固定预期：

```text
paperDelta = 2
pairingDelta = 1
batchDelta = 1
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
reuse unrelated batch counts
```

---

## 10. Pair Verification

必须验证：

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

## 11. Frontend Verification

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

---

## 12. Integrity Verification

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

含义：

```text
允许新增 PR-064 scope 数据
禁止修改任何旧 production record
```

---

## 13. Staging Integrity

PR-064 不允许修改 staging。

必须确认：

```text
stagingArtifactsUnchanged = true
```

特别保护 PR-062 revalidated artifact：

```text
output/phase2/staging/9618_w21_ms_22.staging.json
```

PR-064 只能读取，不能再次修改。

---

## 14. Regression Verification

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
PR-063 PASS
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

专项 glyph regression 必须继续保持：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 15. Coverage Expectations

PR-063 后：

```text
publishedPairs = 23
eligibleUnpublishedPairs = 2
blockedPairs = 0
partialProductionConflicts = 0
```

如果 PR-064 成功发布：

```text
9618-2021-ON-22
```

理论上应变为：

```text
publishedPairs = 24
eligibleUnpublishedPairs = 1
blockedPairs = 0
partialProductionConflicts = 0
```

但最终必须以实际：

```text
coverageAfter
```

为准。

---

## 16. Remaining Eligible Pair After PR-064

理论上应剩：

```text
9618-2024-ON-12
```

不要在 PR-064 中发布。

建议下一步：

```text
PR-065
9618-2024-O/N Previously Blocked Pair Production Expansion
```

目标：

```text
9618-2024-ON-12
```

但最终 PR 编号和 scope 必须以 PR-064 report 的：

```text
next
coverageAfter
```

为准。

---

## 17. Required Deliverables

### Production Expansion Report

建议：

```text
pr064-9618-2021-on-previously-blocked-production-expansion-report.json
```

### Regression Test

建议：

```text
pr064-9618-2021-on-previously-blocked-production-expansion.test.js
```

### Production Store

必须包含：

```text
9618-2021-ON-22-QP
9618-2021-ON-22-MS
```

---

## 18. Report Requirements

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
resolvedBy = [PR-062]
```

---

## 19. Success Criteria

PR-064 PASS 条件：

```text
status = PASS
productionWrite = true

preflight PASS
pair verification PASS
frontend verification PASS

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

## 20. Failure Conditions

以下情况必须判定失败：

### A. Preflight failure

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

## 21. Minimal Change Rule

如果 PR-064 出现问题：

1. 先定位 root cause。
2. 判断是 data、staging、production conflict 还是 regression。
3. 没有直接证据时，不修改 parser。
4. 没有直接证据时，不修改 canonical model。
5. 不扩大 scope。
6. 一个问题一个独立 PR。
7. 修复后重新执行完整 regression。

---

## 22. Next Step After PR-064

如果 PR-064 PASS：

```text
PR-064
   ↓
Review Production Report
   ↓
Check coverageAfter
   ↓
PR-065
Publish 9618-2024-ON-12
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

因为：

```text
PR-061 changed validation behavior
PR-062 changed staging diagnostics
PR-063 changed production coverage
PR-064 will change production coverage again
```

需要新的 authoritative coverage baseline。

---

## 23. Final Definition of Done

PR-064 完成标准：

```text
9618-2021-ON-22 published
QP and MS both present
pairing linked
source trace preserved
expected deltas equal actual deltas
frontend verification PASS
existing records unchanged
staging unchanged
glyph regressions remain PASS
full regression PASS
blockedPairs remains 0
remaining eligible pair clearly identified
next step derived from actual coverageAfter
```
