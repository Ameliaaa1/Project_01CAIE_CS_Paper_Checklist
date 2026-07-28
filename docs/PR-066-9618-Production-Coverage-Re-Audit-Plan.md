# PR-066 9618 Production Coverage Re-Audit Plan

## 1. PR Overview

**PR ID**

```text
PR-066
```

**Title**

```text
9618 Production Coverage Re-Audit
```

**Objective**

在 PR-061 至 PR-065 完成 blocked pair 修复、staging revalidation 与 production expansion 后，重新建立 9618 当前 authoritative coverage baseline。

本 PR 只负责：

- 重新计算 coverage
- 验证 production 状态
- 验证 strict eligible unpublished 是否为 0
- 验证 blocked pairs 是否为 0
- 验证 partial production conflicts 是否为 0
- 重新列出 incomplete source
- 重新列出 missing staging
- 重新列出 duplicate source
- 分类剩余工作
- 输出最终 coverage audit report

本 PR 不执行：

- Production Write
- Parser Fix
- Canonical Model Fix
- Validation Rule Fix
- Staging Regeneration
- Missing Source Download
- Duplicate Source Cleanup
- Missing Staging Generation
- Production Cleanup

---

## 2. Current Project Status

PR-065 已完成并通过。

PR-065 后当前状态：

```text
sourcePairs = 118
completeSourcePairs = 117

stagingPairs = 25
stagingPartialPairs = 0
stagingMissingPairs = 93

publishedPairs = 25
eligibleUnpublishedPairs = 0

missingStagingPairs = 92
blockedPairs = 0
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

关键状态：

```text
eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0
```

说明：

```text
Strict eligible 9618 production expansion = COMPLETE
Previously blocked eligible expansion = COMPLETE
```

但 coverage closure 尚未完成，因为仍存在：

```text
incompleteSourcePairs = 1
missingStagingPairs = 92
stagingMissingPairs = 93
```

以及已知 duplicate source ambiguity。

---

## 3. PR Scope

### Syllabus

```text
9618
```

### Operation

```text
Production Coverage Re-Audit
```

### Production Write

```text
false
```

### Audit Only

```text
true
```

---

## 4. Audit Principles

必须遵守：

```text
Audit only
No production write
No parser modification
No canonical modification
No validation rule modification
No staging mutation
No source asset mutation
No hidden auto-fix
```

本 PR 只能：

- inspect
- recalculate
- classify
- report
- recommend next isolated PR

不能：

- fix
- publish
- regenerate
- delete
- rename
- move
- download

---

## 5. Primary Audit Goal

本 PR 必须回答：

```text
What source pairs exist?
What source pairs are complete?
What staging exists?
What production data is published?
Are any eligible unpublished pairs left?
Are any blocked pairs left?
Are there any partial production conflicts?
What source incompleteness remains?
What staging gaps remain?
What duplicate source ambiguity remains?
What should be handled next?
```

---

## 6. Source Inventory Audit

必须重新验证：

```text
totalPdfFiles
totalQpPdfs
totalMsPdfs
otherPdfCount

totalPairs
completeSourcePairs
incompleteSourcePairs
```

并列出：

```text
missingQpFiles
missingMsFiles
orphanQpFiles
orphanMsFiles
duplicateSources
```

当前已知 baseline：

```text
totalPdfFiles = 266
totalQpPdfs = 118
totalMsPdfs = 118
otherPdfCount = 30

totalPairs = 118
completeSourcePairs = 117
incompleteSourcePairs = 1
```

如果数字发生变化，必须给出具体原因。

---

## 7. Known Incomplete Source

当前已知：

```text
9618-2022-MJ-41
```

状态：

```text
missingQp = false
missingMs = true
```

Known orphan QP：

```text
2022 May June/9618_s22_qp_41.pdf
```

PR-066 只验证并报告。

禁止：

```text
download missing MS
copy substitute PDF
guess source
modify pairing logic
```

---

## 8. Duplicate Source Audit

当前已知 duplicate source ambiguity：

```text
9618-2021-ON-41
```

QP：

```text
2021 Oct Nov/9618_w21_qp_41.pdf
```

MS appears twice：

```text
2021 Oct Nov/9618_w21_ms_41.pdf
2022 May June/9618_w21_ms_41.pdf
```

PR-066 必须重新确认该 ambiguity 是否仍存在。

禁止：

```text
delete duplicate
rename files
move files
choose winner
change inventory logic
```

只能：

```text
detect
classify
report
recommend isolated cleanup PR
```

---

## 9. Source Pair Completeness Audit

每个 9618 pairing key 必须分类为：

```text
COMPLETE
INCOMPLETE
```

Expected baseline：

```text
COMPLETE = 117
INCOMPLETE = 1
```

唯一 expected incomplete：

```text
9618-2022-MJ-41
```

如果不是，必须列出 drift。

---

## 10. Staging Coverage Audit

必须重新计算：

```text
stagingPairs
stagingPartialPairs
stagingMissingPairs
missingStagingPairs
```

当前 baseline：

```text
stagingPairs = 25
stagingPartialPairs = 0
stagingMissingPairs = 93
missingStagingPairs = 92
```

每个 pair 必须至少分类为：

```text
STAGING_COMPLETE
STAGING_PARTIAL
STAGING_MISSING
```

进一步建议分类：

```text
NOT_YET_PROCESSED
INCOMPLETE_SOURCE
BLOCKED
OTHER
```

注意：

```text
Missing staging != Parser regression
```

除非有直接证据。

---

## 11. Production Coverage Audit

必须重新验证：

```text
publishedPairs
eligibleUnpublishedPairs
blockedPairs
partialProductionConflicts
```

Expected：

```text
publishedPairs = 25
eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0
```

Published pair 必须满足：

```text
QP published = true
MS published = true
pairingLinked = true
```

不得只凭 production count 判断 published。

---

## 12. Eligible Unpublished Audit

必须严格重新计算 strict eligible unpublished pairs。

Eligibility 条件：

```text
complete source pair
AND
staging complete
AND
QP validationStatus = PASS
AND
MS validationStatus = PASS
AND
QP completenessStatus = PASS
AND
MS completenessStatus = PASS
AND
QP canonicalPublishable = true
AND
MS canonicalPublishable = true
AND
QP P0 = 0
AND
QP P1 = 0
AND
MS P0 = 0
AND
MS P1 = 0
AND
not already published
AND
no partial production conflict
```

Expected：

```text
eligibleUnpublishedPairs = 0
```

如果：

```text
eligibleUnpublishedPairs > 0
```

则必须：

- 列出 pairing keys
- 解释为什么尚未 publish
- 不得将 audit 标记为 fully closed

---

## 13. Blocked Pair Audit

Expected：

```text
blockedPairs = 0
```

必须确认 PR-061 与 PR-062 修复后的 previously blocked pairs 当前都没有重新进入 blocked 状态。

至少验证：

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

Expected：

```text
blocked = false
```

如果任意重新 blocked，必须列出 blocker。

---

## 14. Partial Production Conflict Audit

Expected：

```text
partialProductionConflicts = 0
```

必须检测：

```text
QP published but MS missing
MS published but QP missing
pairing exists but paper incomplete
duplicate production paper
broken pairing link
```

如果：

```text
partialProductionConflicts > 0
```

PR-066 不应标记为 PASS。

必须建议独立 investigation PR。

---

## 15. Production State Verification

Expected production baseline after PR-065：

```text
papers = 98
questionRecords = 1448
topLevelQuestions = 375
leafQuestions = 1139
responseAreas = 5610
markSchemeEntries = 863
pairings = 49
batches = 49
expansionBatches = 23
```

必须重新读取 actual production state 并比较。

如果 mismatch：

```text
expected != actual
```

必须解释 drift。

不要自动修复。

---

## 16. Published Pair Verification

必须验证全部 published pairs：

```text
paperCount = 2
sourceTraceAvailable = true
pairingLinked = true
```

并检查：

```text
QP present
MS present
no duplicate paper IDs
no orphan production records
```

可以输出：

```text
publishedPairVerificationSummary
```

以及异常列表。

---

## 17. Frontend Coverage Verification

Audit 应至少确认现有 production coverage 不破坏：

```text
questionFinder
knowledgeChecklist
markSchemeSearch
aiRetrieval
openOriginalQuestion
qpMsCorrespondence
```

Expected：

```text
PASS
```

如果只抽样，必须明确：

```text
sampled
```

如果全量，记录：

```text
fullCoverageVerification = true
```

---

## 18. Integrity Requirements

PR-066 是 audit-only。

因此必须满足：

### Production

```text
beforeSha256 == afterSha256
unchanged = true
```

### Staging

```text
before == after
unchanged = true
```

### Source Assets

```text
before == after
unchanged = true
```

如果任意发生 mutation：

```text
status != PASS
```

---

## 19. Stable Modules

以下模块全部冻结：

- Question Split
- Stable Question ID
- Parent / Leaf Question Model
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- TEXT QUALITY Pipeline
- Response Area Pipeline
- Document Role Router
- Question Paper Pipeline
- Mark Scheme Pipeline

PR-066 不允许修改任何 stable module。

---

## 20. Regression Requirements

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
PR-064 PASS
PR-065 PASS
```

同时：

```text
architectureFailures = []
documentRoleRegressions = []

phase1 = PASS (20/20)
phase2 = PASS (120/120)

fullNpmTest = PASS
prismaValidate = PASS
```

专项 glyph regression：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 21. Required Classification Summary

最终 audit 必须输出 classification summary。

建议分类：

```text
PUBLISHED
ELIGIBLE_UNPUBLISHED
BLOCKED
INCOMPLETE_SOURCE
MISSING_STAGING
PARTIAL_PRODUCTION_CONFLICT
DUPLICATE_SOURCE
```

每个 pairing key 建议包含：

```text
primaryClassification
secondaryFlags
```

例如：

```text
pairingKey = 9618-2022-MJ-41
primaryClassification = INCOMPLETE_SOURCE
secondaryFlags = [MISSING_STAGING]
```

避免一个 pair 被多个互相冲突的 primary class 重复统计。

---

## 22. Required Deliverables

### Audit Report

建议：

```text
pr066-9618-production-coverage-reaudit-report.json
```

至少包含：

```text
generatedFor
status
productionWrite
auditOnly
scope
inventory
sourcePairCompleteness
stagingCoverage
productionCoverage
publishedPairs
eligibleUnpublishedPairs
blockedPairs
incompleteSourcePairs
missingStagingPairs
duplicateSources
partialProductionConflicts
productionState
classificationSummary
integrity
regression
recommendedNextSteps
next
```

---

## 23. Success Criteria

PR-066 PASS 条件：

```text
status = PASS
productionWrite = false
auditOnly = true

eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0

production state matches expected baseline
published pair verification PASS

production unchanged
staging unchanged
source assets unchanged

architectureFailures = []
documentRoleRegressions = []

phase1 = PASS
phase2 = PASS
fullNpmTest = PASS
prismaValidate = PASS
```

注意：

以下不自动导致 PR-066 FAIL：

```text
incompleteSourcePairs > 0
missingStagingPairs > 0
duplicateSources > 0
```

前提是它们被正确检测、分类和报告。

---

## 24. Failure Conditions

### A. Eligible unpublished drift

```text
eligibleUnpublishedPairs > 0
```

且无法合理解释。

### B. Blocked pair regression

```text
blockedPairs > 0
```

尤其是 PR-061 / PR-062 已修复 pair 重新 blocked。

### C. Partial production conflicts

```text
partialProductionConflicts > 0
```

### D. Production state mismatch

例如：

```text
missing published paper
broken pairing
unexpected duplicate
count drift
```

### E. Audit mutation

```text
production changed
staging changed
source assets changed
```

### F. Regression failure

```text
architectureFailures != []
documentRoleRegressions != []
fullNpmTest != PASS
```

---

## 25. Recommended Next-Step Decision Logic

PR-066 完成后，不要提前假设下一 PR。

根据实际 findings 决定。

### Option A: Incomplete Source Investigation

如果优先处理：

```text
9618-2022-MJ-41
```

则下一 PR 可以是：

```text
PR-067
9618 Incomplete Source Investigation
```

---

### Option B: Duplicate Source Cleanup

如果优先处理：

```text
9618-2021-ON-41
```

则下一 PR 可以是：

```text
PR-067
9618 Duplicate Source Cleanup Investigation
```

---

### Option C: Missing Staging Expansion Planning

如果准备扩大 staging coverage：

```text
missingStagingPairs = 92
```

则下一 PR 可以是：

```text
PR-067
9618 Missing Staging Expansion Planning
```

---

### Option D: Final Production Stability Validation

只有在明确接受 remaining source/staging gaps 作为非 production blocker 时，才考虑：

```text
Final Production Stability Validation
```

不要跳过 audit findings。

---

## 26. Post-PR-066 Roadmap

建议总体路线：

```text
PR-066
Production Coverage Re-Audit
   ↓
Choose next isolated category
   ↓
Incomplete Source Investigation
or
Duplicate Source Cleanup
or
Missing Staging Expansion Planning
   ↓
Coverage Re-Audit if state changes
   ↓
Final Production Stability Validation
```

不要在 audit 中同时修三类问题。

---

## 27. Minimal Change Rule

如果 PR-066 发现问题：

1. 记录 evidence。
2. 分类 root cause。
3. 不在 PR-066 内修复。
4. 不修改 stable modules。
5. 不扩大 scope。
6. 一个问题一个 PR。
7. 修复后重新跑 regression。
8. 状态变化后重新建立 authoritative coverage baseline。

---

## 28. Final Definition of Done

PR-066 完成标准：

```text
source inventory recalculated
source pair completeness verified
staging coverage recalculated
published coverage verified
eligible unpublished recalculated
blocked pairs verified
partial production conflicts verified
incomplete source listed
missing staging classified
duplicate sources listed
production state verified
published pair integrity verified
frontend coverage verified
production unchanged
staging unchanged
source assets unchanged
full regression PASS
remaining work classified
next step derived from actual findings
```

Expected final state if PR-066 PASS:

```text
Strict eligible production expansion = COMPLETE
Previously blocked expansion = COMPLETE
Production coverage baseline = ESTABLISHED
Remaining work = CLASSIFIED
```
