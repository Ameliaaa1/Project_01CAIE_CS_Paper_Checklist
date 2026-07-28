# Phase 3 9618 Missing Staging Expansion by Batch Plan

## 1. Phase Overview

**Phase ID**

```text
Phase 3
```

**Title**

```text
9618 Missing Staging Expansion by Batch
```

**Objective**

基于 Phase 2 完成后的最新 authoritative state，对当前剩余：

```text
missingStagingPairs = 92
```

的 9618 source pairs 进行分批：

```text
Staging Generation
        ↓
Validation
        ↓
Completeness Verification
        ↓
Eligibility Classification
        ↓
Publish Strict Eligible Pairs
        ↓
Record Blocked / Investigation Cases
        ↓
Coverage Recalculation
```

本 Phase 不允许一次性处理全部 92 个 pair。

必须按：

```text
Year
+
Session
```

分 batch 执行。

---

## 2. Current Project Status

Phase 2 已完成并通过。

当前 source 状态：

```text
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
duplicateSourceCount = 0
```

当前 production / coverage 状态：

```text
stagingPairs = 26
stagingPartialPairs = 0
stagingMissingPairs = 92

publishedPairs = 26
eligibleUnpublishedPairs = 0

missingStagingPairs = 92
blockedPairs = 0
partialProductionConflicts = 0
```

说明：

```text
Source completeness = CLOSED
Duplicate source cleanup = CLOSED
Current remaining work = Missing staging expansion
```

---

## 3. Phase Goal

Phase 3 的目标：

```text
Convert missing staging pairs
        ↓
into
        ↓
STAGING_COMPLETE
or
BLOCKED_WITH_EVIDENCE
or
NEEDS_INVESTIGATION
```

并且：

```text
Publish only strict eligible pairs
```

Phase 3 最终不要求：

```text
all pairs must PASS
```

但要求：

```text
all processed pairs must be correctly classified
```

---

## 4. Batch Strategy

建议按 year + session 分 batch。

### Batch A

```text
2022 M/J
```

### Batch B

```text
2022 O/N
```

### Batch C

```text
2023 M/J
```

### Batch D

```text
2023 O/N
```

### Batch E

```text
2024 M/J
```

### Batch F

```text
2024 O/N
```

### Batch G

```text
2025 M/J
```

### Batch H

```text
2025 O/N
```

另外：

```text
9618-2021-ON-42
```

可以单独并入最先执行的小型补充 batch，或作为：

```text
Batch 0
```

独立处理。

---

## 5. Recommended Batch Order

推荐顺序：

```text
Batch 0
9618-2021-ON-42

Batch 1
2022 M/J

Batch 2
2022 O/N

Batch 3
2023 M/J

Batch 4
2023 O/N

Batch 5
2024 M/J

Batch 6
2024 O/N

Batch 7
2025 M/J

Batch 8
2025 O/N
```

原因：

```text
先处理唯一残留的 2021 missing staging pair
再按年份顺序推进
```

这样 coverage progression 更清晰。

---

## 6. Batch Scope Rule

每个 batch 只能处理：

```text
一个明确 year/session 范围
```

禁止：

```text
2022 M/J + 2024 O/N
```

这种跨年份跨 session 混合 batch。

Batch 必须记录：

```text
year
session
pairCount
pairingKeys
sourcePairStatus
```

---

## 7. Source Preconditions

每个 pair 在 staging generation 前必须满足：

```text
sourcePairStatus = COMPLETE
QP source exists
MS source exists
```

如果 source 不完整：

```text
do not generate staging
```

分类：

```text
INCOMPLETE_SOURCE
```

但根据 Phase 2 后状态，当前 expected：

```text
incompleteSourcePairs = 0
```

---

## 8. Staging Generation Requirements

每个 pair 生成：

```text
QP staging
MS staging
```

Expected convention：

```text
output/phase2/staging/<qp>.staging.json
output/phase2/staging/<ms>.staging.json
```

每个 batch 必须记录：

```text
added
modified
deleted
unrelatedChanges
```

Expected：

```text
modified = 0
deleted = 0
unrelatedChanges = []
```

除当前 batch 新增 staging artifacts 外，不允许其他 staging mutation。

---

## 9. QP Validation Requirements

每个 QP 必须输出：

```text
documentRole
validationStatus
completenessStatus
canonicalPublishable
publishStatus
severityCounts
issueCodes
failedChecks
```

并验证：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

---

## 10. MS Validation Requirements

每个 MS 必须输出：

```text
documentRole
validationStatus
completenessStatus
canonicalPublishable
publishStatus
severityCounts
issueCodes
failedChecks
```

并验证：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

---

## 11. Classification Rules

每个 pair 必须分类为以下之一。

### A. STRICT_ELIGIBLE

满足：

```text
QP validationStatus = PASS
MS validationStatus = PASS

QP completenessStatus = PASS
MS completenessStatus = PASS

QP canonicalPublishable = true
MS canonicalPublishable = true

QP publishStatus = READY_TO_PUBLISH
MS publishStatus = READY_TO_PUBLISH

QP P0 = 0
QP P1 = 0

MS P0 = 0
MS P1 = 0

sourceTraceAvailable = true
stagingPairComplete = true
```

---

### B. BLOCKED

存在：

```text
P0 > 0
or
P1 > 0
```

必须记录：

```text
issueCodes
failedChecks
evidence
rootCauseCategory
```

---

### C. NEEDS_INVESTIGATION

例如：

```text
unexpected parser output
count anomaly
source identity inconsistency
canonical mapping anomaly
unknown validation drift
```

不要自动修复。

---

## 12. Strict Eligibility Gate

只有：

```text
classification = STRICT_ELIGIBLE
```

才允许 production write。

否则：

```text
productionWrite = false
```

禁止：

```text
force publish
weaken validation
manually edit staging status
hide blockers
```

---

## 13. Production Expansion Within Each Batch

对 strict eligible pairs：

执行：

```text
Production Preflight
        ↓
alreadyPublished check
        ↓
partialProductionConflict check
        ↓
Production Write
        ↓
Expected vs Actual Delta Verification
```

必须确认：

```text
alreadyPublished = false
partialProductionConflict = false
```

---

## 14. Production Delta Requirements

每个 batch 必须记录：

```text
expectedDeltas
actualDeltas
deltasMatch
```

固定维度：

```text
papers
questionRecords
topLevelQuestions
leafQuestions
responseAreas
markSchemeEntries
pairings
batches
expansionBatches
```

必须满足：

```text
expectedDeltas == actualDeltas
```

---

## 15. Pair Verification

每个 published pair 必须验证：

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

要求：

```text
actualCounts == expectedCounts
```

---

## 16. Frontend Verification

每个 published pair 至少检查：

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

## 17. Existing Production Integrity

每个 batch 必须证明：

```text
existingRecordsUnchanged = true
```

Existing record changes：

```text
batches = 0
papers = 0
questions = 0
responseAreas = 0
markSchemeEntries = 0
pairings = 0
expansionBatches = 0
```

允许新增当前 batch scope 数据。

禁止修改旧 production record。

---

## 18. Source Asset Integrity

Phase 3 默认：

```text
sourceAssets unchanged
```

禁止：

```text
download new source
delete source
rename source
move source
```

如果发现 source 问题：

```text
stop
classify
create isolated source investigation
```

---

## 19. Parser and Canonical Boundary

默认：

```text
parserModified = false
canonicalModified = false
```

如果发现 parser defect evidence：

```text
do not fix inside batch
```

处理：

```text
investigate
classify
create isolated parser-fix PR
```

禁止：

```text
silent parser patch
silent canonical patch
silent validation weakening
```

---

## 20. Stable Modules Freeze

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
- Question Paper Pipeline
- Mark Scheme Pipeline
- Pairing Logic

---

## 21. Coverage Recalculation

每个 batch 后必须重算：

```text
sourcePairs
completeSourcePairs
incompleteSourcePairs

stagingPairs
stagingPartialPairs
stagingMissingPairs
missingStagingPairs

publishedPairs
eligibleUnpublishedPairs
blockedPairs
partialProductionConflicts
```

禁止只更新 production count，不更新 coverage。

---

## 22. Batch Success Criteria

每个 batch PASS 条件：

```text
source preconditions verified

staging generation completed

every pair classified

strict eligible pairs published

blocked pairs preserved with evidence

needs-investigation pairs preserved with evidence

expectedDeltas == actualDeltas

existing production records unchanged

source assets unchanged

unrelated staging unchanged

parser unchanged

canonical unchanged

full regression PASS
```

---

## 23. Batch Failure Conditions

### A. Unclassified Pair

```text
pair has no final classification
```

### B. Hidden Blocker

```text
P0/P1 exists but pair published
```

### C. Count Drift

```text
expectedDeltas != actualDeltas
```

### D. Existing Record Mutation

```text
existingRecordsUnchanged = false
```

### E. Source Mutation

```text
source assets changed
```

### F. Unrelated Staging Mutation

```text
unrelatedChanges != []
```

### G. Parser / Canonical Mutation

```text
parser changed
canonical changed
```

### H. Regression Failure

```text
architectureFailures != []
documentRoleRegressions != []
fullNpmTest != PASS
```

---

## 24. Regression Requirements

每个 batch 至少保持：

```text
Phase 1 PASS
Phase 2 PASS
```

并确认：

```text
phase1 = PASS (20/20)
phase2 = PASS (120/120)

fullNpmTest = PASS
prismaValidate = PASS

architectureFailures = []
documentRoleRegressions = []
```

专项 glyph regression：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 25. Suggested Deliverables

每个 batch 建议生成：

### Batch Report

```text
phase3-9618-missing-staging-batch-XX-report.json
```

### Batch Test

```text
phase3-9618-missing-staging-batch-XX.test.js
```

### Staging Artifacts

对应 batch 内所有 QP/MS。

---

## 26. Report Requirements

每个 batch report 至少包含：

```text
generatedFor
status
phaseId
batchId
scope
pairingKeys

sourcePreconditions

stagingGeneration

pairResults
classifications

strictEligiblePairs
blockedPairs
needsInvestigationPairs

productionPreflight
expectedDeltas
actualDeltas
deltasMatch

pairVerification
frontendVerification

stagingChanges
integrity

productionState
coverageBefore
coverageAfter

stableModules
regression
next
```

---

## 27. Recommended First Batch

推荐先处理：

```text
Phase 3 Batch 0
9618-2021-ON-42
```

原因：

```text
这是唯一剩余的 2021 missing staging pair
scope 最小
风险最低
可以验证 Phase 3 批处理流程本身
```

如果 Batch 0 PASS，再进入：

```text
2022 M/J
```

---

## 28. Phase 3 Completion Criteria

Phase 3 完成标准：

```text
all 92 missing staging pairs processed

every pair classified

all strict eligible pairs published

all blocked pairs preserved with evidence

all needs-investigation pairs preserved with evidence

missingStagingPairs reduced to 0
or
all remaining gaps explicitly justified

eligibleUnpublishedPairs = 0

partialProductionConflicts = 0

existing production records unchanged

source assets unchanged

parser unchanged

canonical unchanged

full regression PASS
```

---

## 29. Next Phase

Phase 3 完成后进入：

```text
Phase 4
Final Coverage Re-Audit + Stability Validation
```

目标：

```text
verify authoritative final coverage
verify no hidden eligible pairs
verify no blocked regression
verify no partial production conflicts
verify no source gaps
verify no duplicate source
verify production stability
verify full regression
```

---

## 30. Final Roadmap

```text
Phase 1
9618-2022-MJ-41
Staging + Validation + Production
✅ COMPLETE

        ↓

Phase 2
Duplicate Source Investigation + Cleanup
✅ COMPLETE

        ↓

Phase 3
Missing Staging Expansion by Batch
⬅️ CURRENT

        ↓

Phase 4
Final Coverage Re-Audit + Stability Validation
```

---

## 31. Minimal Change Rule

如果 batch 出现问题：

1. 先检查 source。
2. 再检查 parser output。
3. 再检查 canonical mapping。
4. 再检查 validation。
5. 不绕过 blocker。
6. 不修改 stable modules。
7. 不扩大 scope。
8. 一个问题一个独立修复点。
9. 修复后重新跑 regression。

---

## 32. Final Definition of Done

Phase 3 最终完成标准：

```text
92 missing staging pairs processed
all pairs classified
strict eligible pairs published
blocked pairs evidenced
investigation cases evidenced
coverage recalculated after every batch
existing records unchanged
source assets unchanged
parser unchanged
canonical unchanged
frontend verification PASS
full regression PASS
Phase 4 entry criteria satisfied
```
