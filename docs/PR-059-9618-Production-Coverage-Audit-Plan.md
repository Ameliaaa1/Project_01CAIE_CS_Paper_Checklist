# PR-059 9618 Production Coverage Audit Plan

## 1. PR Overview

**PR ID**

```text
PR-059
```

**Objective**

对当前 9618 Production Expansion 状态执行完整 Coverage Audit。

本 PR 只负责：

- 汇总事实
- 验证 coverage 状态
- 分类 remaining items
- 输出最终 audit report

本 PR 不执行：

- Production Write
- Parser Fix
- Staging Regeneration
- Blocked Pair 修复
- Incomplete Source 补全
- Missing Staging 补建
- Duplicate Source Cleanup
- 架构重构

---

## 2. Current Project Status

当前 strict eligible 9618 Production Expansion 已完成。

PR-058 完成后：

```text
sourcePairs = 118
completeSourcePairs = 117
stagingPairs = 25
stagingPartialPairs = 0
stagingMissingPairs = 93
publishedPairs = 16
eligibleUnpublishedPairs = 0
missingStagingPairs = 92
blockedPairs = 9
incompleteSourcePairs = 1
partialProductionConflicts = 0
```

关键状态：

```text
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```

因此：

```text
Strict Eligible 9618 Production Expansion
= COMPLETE
```

下一步不再创建新的 production expansion batch。

---

## 3. PR Scope

本 PR scope：

```text
Syllabus: 9618
Operation: Coverage Audit
Production Write: false
```

Audit 范围：

- Source Inventory
- Source Pair Completeness
- Staging Coverage
- Production Coverage
- Eligible Unpublished Coverage
- Blocked Pair Classification
- Incomplete Source Classification
- Missing Staging Classification
- Partial Production Conflict Verification
- Final Coverage Summary

---

## 4. Primary Goal

验证并明确：

```text
What exists?
What is complete?
What is staged?
What is published?
What is blocked?
What is incomplete?
What is missing?
What requires follow-up?
```

最终输出一个可信的 9618 coverage baseline。

---

## 5. Audit Principles

必须遵守：

```text
Audit only
No production write
No parser modification
No staging mutation
No asset mutation
No hidden auto-fix
```

任何问题只能：

```text
Detect
Classify
Report
Recommend next isolated PR
```

不得在 PR-059 内直接修复。

---

## 6. Source Inventory Audit

必须验证：

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

要求：

- 不把 instruction paper 当作 QP/MS pair
- 不把 duplicate source 自动删除
- 不把 incomplete source 当 parser regression

---

## 7. Source Pair Completeness Audit

每个 9618 pairing key 必须分类为：

```text
COMPLETE
INCOMPLETE
```

其中：

### COMPLETE

```text
QP exists
MS exists
```

### INCOMPLETE

例如：

```text
QP exists
MS missing
```

或：

```text
QP missing
MS exists
```

必须输出完整 pairing key 列表。

---

## 8. Staging Coverage Audit

必须统计：

```text
stagingPairs
stagingPartialPairs
stagingMissingPairs
missingStagingPairs
```

并明确区分：

### STAGING_COMPLETE

```text
QP staging exists
MS staging exists
```

### STAGING_PARTIAL

例如：

```text
QP staging exists
MS staging missing
```

### STAGING_MISSING

```text
QP staging missing
MS staging missing
```

禁止把 missing staging 自动判定为 parser bug。

---

## 9. Production Coverage Audit

必须统计：

```text
publishedPairs
unpublishedPairs
partialProductionConflicts
```

并验证：

### Published Pair

```text
QP published
MS published
pairing linked
```

### Partial Production Conflict

例如：

```text
QP published
MS missing
```

或：

```text
MS published
QP missing
```

当前预期：

```text
partialProductionConflicts = 0
```

如果不为 0：

```text
Audit status must not be PASS
```

必须升级为独立 investigation PR。

---

## 10. Eligible Unpublished Audit

必须重新计算 strict eligible unpublished pairs。

严格条件至少包括：

```text
sourcePairStatus = COMPLETE
stagingStatus = STAGING_COMPLETE
QP validationStatus = PASS
MS validationStatus = PASS
QP completenessStatus = PASS
MS completenessStatus = PASS
QP canonicalPublishable = true
MS canonicalPublishable = true
QP P0 = 0
QP P1 = 0
MS P0 = 0
MS P1 = 0
not already published
no partial production conflict
```

当前预期：

```text
eligibleUnpublishedPairs = 0
```

如果 audit 后不为 0：

必须输出 pairing keys，并说明：

```text
Production Expansion is not actually complete.
```

---

## 11. Blocked Pair Audit

必须列出全部 blocked pairs。

每个 blocked pair 至少输出：

```text
pairingKey
year
session
component
qpStatus
msStatus
blockers
severityCounts
```

Blocker 示例：

```text
VALIDATION_NOT_PASS
PUBLISH_NOT_READY
UNRESOLVED_P1
MISSING_STAGING
INCOMPLETE_SOURCE
```

必须明确：

```text
Blocked != Regression
Blocked != Parser Bug
```

只有存在明确 root cause evidence 时，才能进一步归类为 parser issue。

---

## 12. Incomplete Source Audit

必须列出全部 incomplete source pairs。

至少输出：

```text
pairingKey
missingQp
missingMs
orphanQp
orphanMs
```

当前已知存在：

```text
incompleteSourcePairs = 1
```

Audit 只确认事实。

不得：

- 自动下载 source
- 自动复制替代 PDF
- 自动改路径
- 自动猜测对应 MS/QP

---

## 13. Duplicate Source Audit

必须列出 duplicate source records。

至少输出：

```text
pairingKey
qpFiles
msFiles
duplicateCount
```

Audit 只负责记录：

```text
duplicate source exists
```

不要在 PR-059 内：

- 删除
- 重命名
- 移动
- 选定 winner
- 修改 inventory logic

Duplicate cleanup 必须拆独立 PR。

---

## 14. Missing Staging Audit

必须明确：

```text
missingStagingPairs
```

并按来源状态分类：

```text
complete source but no staging
incomplete source and no staging
blocked staging
not yet processed
```

不要把全部 missing staging 一概归为 failure。

---

## 15. Stable Modules

以下模块保持冻结：

- Question Split
- Stable Question ID
- Parent / Leaf Question
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- TEXT QUALITY Pipeline
- Response Area Pipeline
- Document Role Router
- Question Paper Pipeline
- Mark Scheme Pipeline

PR-059 不允许修改这些模块。

---

## 16. Regression Verification

Audit 完成后必须继续确认：

```text
architectureFailures = []
documentRoleRegressions = []
phase1 = PASS
phase2 = PASS
fullNpmTest = PASS
prismaValidate = PASS
```

建议同时验证历史关键 PR：

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
```

---

## 17. Audit Report Requirements

建议输出：

```text
pr059-9618-production-coverage-audit-report.json
```

至少包含：

```text
generatedFor
status
productionWrite
scope
inventory
coverage
publishedPairs
eligibleUnpublishedPairs
blockedPairs
incompleteSourcePairs
missingStagingPairs
duplicateSources
partialProductionConflicts
classificationSummary
recommendedNextSteps
regression
```

---

## 18. Classification Summary

建议最终统一输出：

```text
PUBLISHED
ELIGIBLE_UNPUBLISHED
BLOCKED
INCOMPLETE_SOURCE
MISSING_STAGING
PARTIAL_PRODUCTION_CONFLICT
DUPLICATE_SOURCE
```

每个 pairing key 应尽量有唯一主分类。

如果存在多个条件，应记录：

```text
primaryClassification
secondaryFlags
```

---

## 19. Audit Success Criteria

PR-059 判定 PASS 的建议条件：

```text
productionWrite = false
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
architectureFailures = []
documentRoleRegressions = []
fullNpmTest = PASS
phase1 = PASS
phase2 = PASS
```

注意：

以下存在时，不应自动导致 Audit FAIL：

```text
blockedPairs > 0
incompleteSourcePairs > 0
missingStagingPairs > 0
duplicateSources > 0
```

因为 Audit 的目标是识别和分类这些事实。

---

## 20. Failure Conditions

以下情况应使 PR-059 失败：

### A. Eligible pair 被错误遗漏

```text
eligibleUnpublishedPairs > 0
```

但之前被错误认为 production expansion complete。

### B. Partial production conflict

```text
partialProductionConflicts > 0
```

### C. Production state mismatch

例如：

```text
published pair count inconsistent
QP/MS pairing broken
duplicate production records
```

### D. Regression

```text
architectureFailures != []
documentRoleRegressions != []
phase1 FAIL
phase2 FAIL
fullNpmTest FAIL
```

---

## 21. Recommended Next-Step Classification

PR-059 完成后，根据 audit 结果决定后续 PR。

可能包括：

### Option A: Blocked Pair Investigation

```text
One PR
One blocker class
One root cause
```

### Option B: Incomplete Source Cleanup

处理 source 缺失问题。

### Option C: Duplicate Source Cleanup

处理重复 source asset。

### Option D: Missing Staging Expansion

对 complete source pairs 逐批生成 staging。

### Option E: Final Production Stability Validation

当 planned cleanup 完成后执行最终 stability pass。

---

## 22. Important Scope Boundary

PR-059 不能做：

```text
Audit + Fix
Audit + Parser Patch
Audit + Source Cleanup
Audit + Staging Generation
Audit + Production Write
```

必须保持：

```text
One PR
One Goal
```

本 PR 唯一目标：

```text
Establish the authoritative 9618 coverage baseline.
```

---

## 23. Final Definition of Done

PR-059 完成标准：

```text
9618 source inventory fully summarized
complete and incomplete source pairs classified
staging coverage summarized
published pairs verified
eligible unpublished pairs recalculated
blocked pairs listed
incomplete source pairs listed
missing staging pairs classified
duplicate sources listed
partial production conflicts verified
no production write performed
no stable module modified
regression suite passes
final audit report generated
```

---

## 24. Expected Next State

如果 PR-059 PASS：

```text
Strict eligible production expansion = COMPLETE
Coverage baseline = ESTABLISHED
Remaining work = CLASSIFIED
```

之后再按 audit 结果拆分：

```text
Blocked Investigation PR
Incomplete Source PR
Duplicate Source Cleanup PR
Missing Staging Expansion PR
Final Stability Validation PR
```

不要在 PR-059 内提前执行这些工作。
