# Phase 1 9618-2022-MJ-41 Staging + Validation + Production Plan

## 1. Phase Overview

**Phase ID**

```text
Phase 1
```

**Title**

```text
9618-2022-MJ-41 Staging + Validation + Production
```

**Objective**

基于 PR-068 已恢复完成的 source pair：

```text
9618-2022-MJ-41
```

在同一个阶段内完成：

```text
Staging Generation
        ↓
Validation
        ↓
Completeness Verification
        ↓
Strict Eligibility Gate
        ↓
Production Publication
        ↓
Pair Verification
        ↓
Frontend Verification
        ↓
Integrity Verification
        ↓
Coverage Recalculation
```

本阶段可以将原本计划中的：

```text
PR-069 Staging Generation and Validation
+
PR-070 Production Expansion
```

合并为一个完整执行阶段。

但是必须保留严格 gate：

```text
Only publish if strictEligible = true
```

不得因为合并阶段而绕过 validation。

---

## 2. Current Project Status

PR-068 已完成并通过。

当前 target pair：

```text
9618-2022-MJ-41
```

Source 状态：

```text
sourcePairStatus = COMPLETE
stagingStatus = STAGING_MISSING
coverageStatus = MISSING_STAGING
productionPublished = false
```

当前 source inventory：

```text
totalPdfFiles = 267
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
missingQpFiles = []
missingMsFiles = []
orphanQpFiles = []
orphanMsFiles = []
```

目标 source files：

```text
QP:
9618_s22_qp_41.pdf

MS:
9618_s22_ms_41.pdf
```

---

## 3. Scope

### Pairing Key

```text
9618-2022-MJ-41
```

### Syllabus

```text
9618
```

### Year

```text
2022
```

### Session

```text
M/J
```

### Component

```text
41
```

### Documents

```text
9618-2022-MJ-41-QP
9618-2022-MJ-41-MS
```

本阶段只处理这一个 pair。

---

## 4. Out of Scope

本阶段不处理：

```text
9618-2021-ON-41 duplicate source cleanup
other missing staging pairs
parser refactor
canonical redesign
validation architecture changes
unrelated production expansion
new syllabus support
```

禁止扩大 scope。

---

## 5. Phase Goal

本阶段必须完成：

1. 验证 source preconditions。
2. 生成 QP staging。
3. 生成 MS staging。
4. 执行完整 validation。
5. 执行 completeness verification。
6. 验证 source trace。
7. 判断 strict eligibility。
8. 只有 strict eligible 时才允许 production write。
9. 发布 QP/MS。
10. 创建 pairing。
11. 验证 expected vs actual deltas。
12. 验证 frontend。
13. 验证 integrity。
14. 重算 coverage。
15. 输出下一阶段建议。

---

## 6. Execution Flow

```text
Source Preconditions
        ↓
QP/MS Staging Generation
        ↓
QP Validation
        ↓
MS Validation
        ↓
Pair Completeness Verification
        ↓
Strict Eligibility Gate
        ↓
        ├── FAIL → Stop Production Write
        │
        └── PASS → Production Write
                         ↓
                  Pair Verification
                         ↓
                  Frontend Verification
                         ↓
                  Integrity Verification
                         ↓
                  Coverage Recalculation
```

---

## 7. Source Preconditions

必须确认：

```text
9618_s22_qp_41.pdf exists
9618_s22_ms_41.pdf exists
```

并确认：

```text
sourcePairStatus = COMPLETE
```

MS identity 必须继续满足：

```text
syllabus = 9618
component = 41
sessionCode = s22
year = 2022
session = M/J
documentRole = MARK_SCHEME
maximumMark = 75
printedPages = 34
```

建议继续记录：

```text
sha256 = 203cc5900d90e14ce40e48b2d9943d762a5d2ae25c8f38c51221ed27bc8cceb6
```

如果 source identity 不一致：

```text
STOP
```

不得生成 staging。

---

## 8. Staging Generation

Expected staging artifacts：

```text
output/phase2/staging/9618_s22_qp_41.staging.json
output/phase2/staging/9618_s22_ms_41.staging.json
```

实际路径必须遵循现有项目 convention。

本阶段允许新增：

```text
9618_s22_qp_41.staging.json
9618_s22_ms_41.staging.json
```

除此之外：

```text
unrelated staging artifacts unchanged
```

必须记录：

```text
added
modified
deleted
unrelatedChanges
```

Expected：

```text
added = 2
modified = 0
deleted = 0
unrelatedChanges = []
```

---

## 9. QP Validation Requirements

QP staging 必须输出：

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

同时检查：

```text
stableQuestionIds
parentLeafRelationships
marks
responseAreas
sourceTrace
```

---

## 10. MS Validation Requirements

MS staging 必须输出：

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

同时检查：

```text
markSchemeEntries
question linking
leaf linking
sourceTrace
```

---

## 11. Strict Eligibility Gate

只有当 QP 与 MS 均满足以下条件时：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH

P0 = 0
P1 = 0

sourceTraceAvailable = true
stagingPairComplete = true
```

才允许：

```text
strictEligible = true
```

否则：

```text
strictEligible = false
productionWrite = false
```

必须列出 blocker。

严禁：

```text
force publish
skip validation
weaken validation rule
edit staging status manually
hide issue codes
```

---

## 12. Production Preconditions

在 production write 前必须确认：

```text
strictEligible = true
alreadyPublished = false
partialProductionConflict = false
```

如果出现：

```text
QP already published
MS already published
only one role published
existing broken pairing
partial production state
```

必须：

```text
STOP PRODUCTION WRITE
```

不要在本阶段顺手修 production conflict。

---

## 13. Production Write Expectations

固定预期：

```text
papers = 2
pairings = 1
batches = 1
expansionBatches = 1
```

以下数量必须从实际 staging 动态计算：

```text
questionRecords
topLevelQuestions
leafQuestions
responseAreas
markSchemeEntries
```

必须记录：

```text
expectedDeltas
actualDeltas
deltasMatch
```

要求：

```text
expectedDeltas == actualDeltas
```

禁止猜数字。

---

## 14. Pair-Level Verification

Production write 后必须验证：

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

不得出现：

```text
missing QP
missing MS
broken pairing
duplicate paper
count drift
missing source trace
partial publication
```

---

## 15. Frontend Verification

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

## 16. Production Integrity

必须记录 production store 写入前后 hash：

```text
beforeSha256
afterSha256
```

如果完成 production write：

```text
productionHashChanged = true
```

同时必须：

```text
existingRecordsUnchanged = true
```

Existing record changes 必须全部为 0：

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
允许新增当前 target pair
禁止修改旧 production records
```

---

## 17. Source Asset Integrity

PR-068 已完成 source recovery。

本阶段 source assets 必须：

```text
unchanged = true
```

尤其：

```text
9618_s22_qp_41.pdf unchanged
9618_s22_ms_41.pdf unchanged
```

---

## 18. Parser and Canonical Boundary

默认：

```text
parserModified = false
canonicalModified = false
```

如果 staging generation 暴露明确 parser defect：

```text
stop
investigate
classify
create isolated follow-up PR
```

不要在本阶段偷偷修 parser。

同样禁止：

```text
canonical redesign
validation rule weakening
pairing logic modification
```

---

## 19. Stable Modules Freeze

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

## 20. Coverage Expectations

当前：

```text
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
```

如果 staging generation 成功：

```text
stagingPairs = previous + 1
stagingMissingPairs = previous - 1
missingStagingPairs = previous - 1
```

如果 strict eligible 且 production publication 成功：

```text
publishedPairs = previous + 1
eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0
```

最终以实际：

```text
coverageAfter
```

为准。

不得硬编码。

---

## 21. Regression Requirements

至少确认：

```text
PR-066 PASS
PR-067 PASS
PR-068 PASS
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

专项 glyph regression：

```text
legalMultiplicationResolutionContexts = PASS
otherSuspiciousGlyphsRemainDetected = PASS
linkedListNullPointerContext = PASS
unrelatedNullPointerGlyphRemainsSuspicious = PASS
```

---

## 22. Required Deliverables

建议生成：

### Execution Report

```text
phase1-9618-2022-mj-41-staging-validation-production-report.json
```

### Regression Test

```text
phase1-9618-2022-mj-41-staging-validation-production.test.js
```

### Staging Artifacts

```text
9618_s22_qp_41.staging.json
9618_s22_ms_41.staging.json
```

### Updated Production Store

仅在：

```text
strictEligible = true
```

时允许更新。

---

## 23. Report Requirements

最终 report 至少包含：

```text
generatedFor
status
phaseId
targetPair
sourcePreconditions
stagingGeneration
qpValidation
msValidation
pairVerification
strictEligibility
productionPreflight
expectedDeltas
actualDeltas
publication
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

建议额外记录：

```text
sourceRecoveredBy = PR-068
```

---

## 24. Success Criteria

Phase 1 PASS 条件：

```text
source preconditions PASS

QP staging generated
MS staging generated

QP validation PASS
MS validation PASS

completeness PASS
source trace PASS

strictEligible = true

production preflight PASS
productionWrite = true

expectedDeltas == actualDeltas

pair verification PASS
frontend verification PASS

existing production records unchanged
source assets unchanged
unrelated staging unchanged

parser unchanged
canonical unchanged

full regression PASS
```

---

## 25. Failure Conditions

### A. Source precondition failure

```text
QP missing
MS missing
wrong identity
```

### B. Staging failure

```text
QP staging missing
MS staging missing
unrelated staging mutated
```

### C. Validation blocker

```text
P0 > 0
or
P1 > 0
```

则：

```text
strictEligible = false
productionWrite = false
```

### D. Production conflict

```text
partialProductionConflict = true
```

### E. Count mismatch

```text
expectedDeltas != actualDeltas
```

### F. Existing record mutation

```text
existingRecordsUnchanged = false
```

### G. Parser/canonical mutation

```text
parser changed
canonical changed
```

### H. Regression

```text
architectureFailures != []
documentRoleRegressions != []
fullNpmTest != PASS
```

---

## 26. Decision Logic

### Outcome A: Full Success

如果：

```text
strictEligible = true
productionWrite = true
deltasMatch = true
```

则 Phase 1 完成。

下一步进入：

```text
Phase 2
9618 Duplicate Source Investigation + Cleanup
```

目标：

```text
9618-2021-ON-41
```

---

### Outcome B: Validation Blocked

如果：

```text
strictEligible = false
```

则：

```text
do not publish
```

保留：

```text
issueCodes
failedChecks
severityCounts
evidence
```

然后创建独立 investigation/fix。

---

### Outcome C: Parser Defect Evidence

如果发现明确 parser defect：

```text
do not fix inside Phase 1
```

建立独立 parser-fix PR。

---

## 27. Phase Roadmap

建议路线：

```text
Phase 1
9618-2022-MJ-41
Staging + Validation + Production
        ↓
Phase 2
Duplicate Source Investigation + Cleanup
        ↓
Phase 3
Missing Staging Expansion by Batch
        ↓
Phase 4
Final Coverage Re-Audit + Stability Validation
```

---

## 28. Minimal Change Rule

如果出现问题：

1. 先检查 source identity。
2. 再检查 parser output。
3. 再检查 canonical mapping。
4. 再检查 validation result。
5. 再检查 production preflight。
6. 不绕过 blocker。
7. 不修改 stable modules。
8. 不扩大 scope。
9. 一个问题一个修复点。

---

## 29. Final Definition of Done

Phase 1 完成标准：

```text
9618-2022-MJ-41 source verified
QP staging generated
MS staging generated
validation PASS
completeness PASS
source trace PASS
strict eligibility PASS
production publication PASS
QP/MS pairing linked
expected and actual deltas match
frontend verification PASS
existing records unchanged
source assets unchanged
unrelated staging unchanged
parser unchanged
canonical unchanged
full regression PASS
coverage recalculated
next phase clearly defined
```
