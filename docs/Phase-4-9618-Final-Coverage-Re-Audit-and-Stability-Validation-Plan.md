# Phase 4 Final Coverage Re-Audit + Stability Validation Plan

## 1. Phase Overview

**Phase ID**

```text
Phase 4
```

**Title**

```text
Final Coverage Re-Audit + Stability Validation
```

**Objective**

对 9618 数据管线执行最终 coverage re-audit 和 stability validation。

本阶段不新增 source，不生成新的 staging，不执行 production write。

核心目标：

```text
Verify authoritative final coverage
        ↓
Verify source completeness
        ↓
Verify staging completeness
        ↓
Verify publication correctness
        ↓
Verify 13 blocked pairs
        ↓
Verify 79 Phase 3 publications
        ↓
Verify 9 batch delta evidence
        ↓
Verify production integrity
        ↓
Verify parser / canonical stability
        ↓
Verify regression
        ↓
Produce final closure decision
```

---

## 2. Current Authoritative State

Phase 3 已完成并通过。

当前 authoritative state：

```text
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0

stagingPairs = 118
stagingPartialPairs = 0
stagingMissingPairs = 0
missingStagingPairs = 0

publishedPairs = 105
eligibleUnpublishedPairs = 0
blockedPairs = 13
partialProductionConflicts = 0

duplicateSourceCount = 0
```

Phase 3 处理结果：

```text
processedPairs = 92
strictEligiblePairs = 79
blockedPairs = 13
needsInvestigationPairs = 0
```

Phase 3 staging additions：

```text
stagingArtifactsAdded = 184
```

理论对应：

```text
92 pairs × 2 artifacts = 184
```

---

## 3. Phase Boundary

Phase 4 必须：

```text
productionWrite = false
generateStaging = false
modifySourceAssets = false
modifyParser = false
modifyCanonical = false
modifyValidationRules = false
modifyPairingLogic = false
```

本阶段是：

```text
AUDIT ONLY
+
STABILITY VALIDATION
```

不是 cleanup PR。

---

## 4. Required Final Audit Dimensions

必须审计：

1. Source inventory
2. Source completeness
3. Duplicate source state
4. Staging coverage
5. Publication coverage
6. Blocked pair state
7. Strict eligible pair publication
8. Batch delta evidence
9. Pair verification
10. Frontend verification
11. Production integrity
12. Existing record preservation
13. Source asset integrity
14. Parser integrity
15. Canonical integrity
16. Stable module integrity
17. Regression status
18. Final closure readiness

---

## 5. Source Inventory Re-Audit

必须确认：

```text
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
duplicateSourceCount = 0
```

同时：

```text
missingQpFiles = []
missingMsFiles = []
orphanQpFiles = []
orphanMsFiles = []
duplicateSources = []
```

如果任意字段不满足：

```text
FINAL_CLOSURE = BLOCKED
```

---

## 6. Staging Coverage Re-Audit

必须确认：

```text
stagingPairs = 118
stagingPartialPairs = 0
stagingMissingPairs = 0
missingStagingPairs = 0
```

必须验证每个 complete source pair：

```text
QP staging exists
MS staging exists
```

禁止只依赖 aggregate count。

应输出：

```text
pairingKeysVerified = 118
missingStagingPairingKeys = []
partialStagingPairingKeys = []
```

---

## 7. Publication Coverage Re-Audit

必须确认：

```text
publishedPairs = 105
eligibleUnpublishedPairs = 0
blockedPairs = 13
partialProductionConflicts = 0
```

数学一致性：

```text
105 published
+
13 blocked
=
118 complete staging pairs
```

必须验证：

```text
105 + 13 = 118
```

并且：

```text
no pair unclassified
no hidden eligible unpublished pair
no hidden partial production conflict
```

---

## 8. Phase 3 Publication Reconciliation

Phase 3 前：

```text
publishedPairs = 26
```

Phase 3 后：

```text
publishedPairs = 105
```

Expected delta：

```text
105 - 26 = 79
```

必须确认：

```text
strictEligiblePairs = 79
publishedPairsAdded = 79
```

Expected：

```text
strictEligiblePairs == publishedPairsAdded
```

---

## 9. Phase 3 Staging Reconciliation

Phase 3 前：

```text
stagingPairs = 26
```

Phase 3 后：

```text
stagingPairs = 118
```

Expected delta：

```text
118 - 26 = 92
```

必须确认：

```text
processedPairs = 92
stagingPairsAdded = 92
stagingArtifactsAdded = 184
```

Expected：

```text
92 pairs × 2 artifacts = 184
```

---

## 10. Batch Audit

Phase 3 一共：

```text
batchCount = 9
```

必须审计：

```text
PHASE3-9618-BATCH-00
PHASE3-9618-BATCH-01
PHASE3-9618-BATCH-02
PHASE3-9618-BATCH-03
PHASE3-9618-BATCH-04
PHASE3-9618-BATCH-05
PHASE3-9618-BATCH-06
PHASE3-9618-BATCH-07
PHASE3-9618-BATCH-08
```

每个 batch 必须确认：

```text
status = PASS

pairCount matches pairingKeys length

STRICT_ELIGIBLE
+
BLOCKED
+
NEEDS_INVESTIGATION
=
pairCount
```

---

## 11. Required Batch Delta Verification

这是 Phase 4 的重点补充验证。

Phase 3 aggregate report 没有顶层汇总：

```text
expectedDeltas
actualDeltas
deltasMatch
```

因此 Phase 4 必须逐个审计 9 个 batch report。

每个 batch 必须确认：

```text
expectedDeltas exists
actualDeltas exists
deltasMatch = true
```

审计维度：

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

最终汇总：

```text
batchDeltaAudit = PASS
batchesWithDeltaMismatch = []
batchesMissingDeltaEvidence = []
```

如果任何 batch：

```text
deltasMatch != true
```

则：

```text
FINAL_CLOSURE = BLOCKED
```

---

## 12. Blocked Pair Re-Audit

最终必须确认 13 个 blocked pairs：

```text
9618-2022-ON-31
9618-2022-ON-32
9618-2022-ON-33

9618-2023-MJ-41
9618-2023-MJ-43

9618-2023-ON-42

9618-2024-ON-21
9618-2024-ON-23
9618-2024-ON-31
9618-2024-ON-33

9618-2025-MJ-13
9618-2025-MJ-21

9618-2025-ON-23
```

必须确认：

```text
classification = BLOCKED
productionPublished = false
partialProductionConflict = false
blockerEvidenceAvailable = true
```

每个 blocked pair 必须有：

```text
issueCodes
failedChecks
severityCounts
rootCauseCategory
QP state
MS state
```

---

## 13. Blocked Pair Safety Gate

必须验证：

```text
none of the 13 blocked pairs were published
```

输出：

```text
blockedPairsPublishedByMistake = []
```

任何错误 publication：

```text
FINAL_CLOSURE = BLOCKED
```

---

## 14. Strict Eligible Publication Re-Audit

必须确认 Phase 3 的 79 个 strict eligible pairs：

```text
all published successfully
```

输出：

```text
strictEligibleCount = 79
strictEligiblePublishedCount = 79
strictEligibleUnpublished = []
```

要求：

```text
eligibleUnpublishedPairs = 0
```

---

## 15. Pair Verification Audit

对所有 published pairs：

必须验证：

```text
QP published
MS published
pairingLinked = true
sourceTraceAvailable = true
```

并确认：

```text
no duplicate production paper
no missing role
no broken pairing
no partial publication
```

输出：

```text
pairVerificationFailures = []
```

---

## 16. Frontend Stability Validation

至少验证：

```text
questionFinder
knowledgeChecklist
markSchemeSearch
aiRetrieval
openOriginalQuestion
qpMsCorrespondence
```

要求：

```text
all PASS
```

必须验证已有 production 行为没有 regression。

---

## 17. Production Integrity

Phase 4 开始前记录：

```text
productionBeforeSha256
```

Phase 4 完成后记录：

```text
productionAfterSha256
```

必须：

```text
productionBeforeSha256 == productionAfterSha256
productionWrite = false
```

如果改变：

```text
FINAL_CLOSURE = BLOCKED
```

---

## 18. Existing Production Record Preservation

必须验证：

```text
existingRecordsUnchanged = true
```

Expected changes：

```text
batches = 0
papers = 0
questions = 0
responseAreas = 0
markSchemeEntries = 0
pairings = 0
expansionBatches = 0
```

Phase 4 不允许任何 production mutation。

---

## 19. Source Asset Integrity

必须记录：

```text
sourceAssetsBeforeSha256
sourceAssetsAfterSha256
```

要求：

```text
unchanged = true
```

同时：

```text
unexpectedPdfAssetChanges = []
```

---

## 20. Staging Integrity

Phase 4 不生成新 staging。

必须：

```text
stagingBeforeSha256 == stagingAfterSha256
```

并确认：

```text
added = []
modified = []
deleted = []
```

---

## 21. Parser Integrity

必须：

```text
parserBeforeSha256 == parserAfterSha256
parserModified = false
```

---

## 22. Canonical Integrity

必须：

```text
canonicalBeforeSha256 == canonicalAfterSha256
canonicalModified = false
```

---

## 23. Stable Modules Freeze

以下模块必须保持冻结：

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

Expected：

```text
all modified flags = false
```

---

## 24. Regression Requirements

必须确认：

```text
Phase 1 PASS
Phase 2 PASS
Phase 3 PASS
```

同时：

```text
phase1 = PASS (20/20)
phase2 = PASS (120/120)

fullNpmTest = PASS
prismaValidate = PASS

architectureFailures = []
documentRoleRegressions = []
```

专项 regression：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 25. Required Deliverables

建议生成：

### Final Audit Report

```text
phase4-9618-final-coverage-reaudit-stability-report.json
```

### Final Audit Test

```text
phase4-9618-final-coverage-reaudit-stability.test.js
```

---

## 26. Final Report Requirements

最终 report 至少包含：

```text
generatedFor
status
phaseId
auditOnly
productionWrite

sourceAudit
stagingAudit
publicationAudit

phase3Reconciliation
batchAudit
batchDeltaAudit

blockedPairAudit
strictEligiblePublicationAudit
pairVerificationAudit
frontendVerification

coverage

productionIntegrity
stagingIntegrity
sourceAssetIntegrity
parserIntegrity
canonicalIntegrity

stableModules
regression

closureDecision
remainingIssues
next
```

---

## 27. Required Coverage Output

最终必须输出：

```text
sourcePairs
completeSourcePairs
incompleteSourcePairs
duplicateSourceCount

stagingPairs
stagingPartialPairs
stagingMissingPairs
missingStagingPairs

publishedPairs
eligibleUnpublishedPairs
blockedPairs
partialProductionConflicts
```

Expected authoritative state：

```text
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
duplicateSourceCount = 0

stagingPairs = 118
stagingPartialPairs = 0
stagingMissingPairs = 0
missingStagingPairs = 0

publishedPairs = 105
eligibleUnpublishedPairs = 0
blockedPairs = 13
partialProductionConflicts = 0
```

---

## 28. Final Closure Decision Logic

### Outcome A: PASS WITH KNOWN BLOCKERS

如果：

```text
source complete
staging complete
eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
all batch deltas verified
production unchanged
staging unchanged
source unchanged
parser unchanged
canonical unchanged
regression PASS
```

同时：

```text
blockedPairs = 13
```

则：

```text
closureDecision = PASS_WITH_KNOWN_BLOCKERS
```

含义：

```text
Phase 4 completed
9618 coverage fully audited
13 blocked pairs intentionally remain unpublished
```

---

### Outcome B: FULL PASS

只有当：

```text
blockedPairs = 0
```

才可以：

```text
closureDecision = FULL_PASS
```

当前预期不应强求这个状态。

---

### Outcome C: BLOCKED

出现任意：

```text
missing staging
hidden eligible pair
partial production conflict
batch delta mismatch
blocked pair mistakenly published
source mutation
production mutation
parser mutation
canonical mutation
regression failure
```

则：

```text
closureDecision = BLOCKED
```

---

## 29. Remaining Issues Handling

当前 expected remaining issue：

```text
13 blocked pairs
```

Phase 4 不负责修复。

只负责：

```text
confirm
audit
preserve evidence
report
```

如果后续需要处理：

```text
create dedicated blocked-pair investigation phase
```

不要在 Phase 4 内修改 validation 或 parser。

---

## 30. Success Criteria

Phase 4 PASS 条件：

```text
118 source pairs verified

118 complete source pairs verified

0 incomplete source pairs

0 duplicate sources

118 staging pairs verified

0 missing staging pairs

105 published pairs verified

79 Phase 3 strict eligible publications reconciled

13 blocked pairs verified unpublished

0 eligible unpublished pairs

0 partial production conflicts

9 batch delta audits PASS

production unchanged

staging unchanged

source assets unchanged

parser unchanged

canonical unchanged

stable modules unchanged

frontend verification PASS

full regression PASS
```

---

## 31. Failure Conditions

### A. Coverage mismatch

```text
105 + 13 != 118
```

### B. Missing staging

```text
missingStagingPairs > 0
```

### C. Hidden eligible pair

```text
eligibleUnpublishedPairs > 0
```

### D. Partial conflict

```text
partialProductionConflicts > 0
```

### E. Blocked pair published

```text
blockedPairsPublishedByMistake != []
```

### F. Batch delta evidence missing

```text
batchesMissingDeltaEvidence != []
```

### G. Batch delta mismatch

```text
batchesWithDeltaMismatch != []
```

### H. Mutation

```text
production changed
staging changed
source changed
parser changed
canonical changed
```

### I. Regression failure

```text
architectureFailures != []
documentRoleRegressions != []
fullNpmTest != PASS
```

---

## 32. Final Definition of Done

Phase 4 完成标准：

```text
final source coverage verified

final staging coverage verified

final publication coverage verified

79 strict eligible publications reconciled

13 blocked pairs verified and preserved

all 9 batch delta evidence verified

no hidden eligible unpublished pairs

no partial production conflicts

production unchanged

staging unchanged

source assets unchanged

parser unchanged

canonical unchanged

stable modules unchanged

frontend stable

full regression PASS

final closure decision generated
```

---

## 33. Final Roadmap State

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
✅ COMPLETE

        ↓

Phase 4
Final Coverage Re-Audit + Stability Validation
⬅️ CURRENT
```

---

## 34. Expected Final Decision

如果所有审计项通过，推荐最终结论：

```text
Phase 4: PASS

closureDecision:
PASS_WITH_KNOWN_BLOCKERS

sourcePairs:
118

completeSourcePairs:
118

stagingPairs:
118

missingStagingPairs:
0

publishedPairs:
105

eligibleUnpublishedPairs:
0

blockedPairs:
13

partialProductionConflicts:
0

productionWrite:
false

regression:
PASS
```

这表示：

```text
9618 coverage expansion workflow completed
with 13 intentionally blocked pairs preserved for separate investigation
```
