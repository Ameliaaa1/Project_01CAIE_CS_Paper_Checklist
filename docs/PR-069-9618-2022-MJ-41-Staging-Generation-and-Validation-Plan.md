# PR-069 9618-2022-MJ-41 Staging Generation and Validation Plan

## 1. PR Overview

**PR ID**

```text
PR-069
```

**Title**

```text
9618-2022-MJ-41 Staging Generation and Validation
```

**Objective**

基于 PR-068 已恢复完成的 source pair：

```text
9618-2022-MJ-41
```

生成对应 QP / MS staging，并执行完整 validation、completeness、canonical publishability 与 source trace verification。

本 PR 只负责：

- Generate QP staging
- Generate MS staging
- Run validation
- Verify completeness
- Verify source trace
- Verify canonical publishability
- Determine strict eligibility

本 PR 不执行：

- Production Write
- Production Publication
- Parser Refactor
- Canonical Model Redesign
- Validation Rule Change
- Duplicate Source Cleanup
- Missing Staging Expansion for other pairs

---

## 2. Current Project Status

PR-068 已完成并通过。

当前 source 状态：

```text
pairingKey = 9618-2022-MJ-41

sourcePairStatus = COMPLETE
stagingStatus = STAGING_MISSING
coverageStatus = MISSING_STAGING
```

Inventory after PR-068：

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

目标文件：

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

---

## 4. PR Goal

执行：

```text
Recovered Source Pair
        ↓
QP Parser
        ↓
QP Canonical Model
        ↓
QP Staging
        ↓
QP Validation
        ↓

Recovered Source Pair
        ↓
MS Parser
        ↓
MS Canonical Model
        ↓
MS Staging
        ↓
MS Validation
        ↓

Pair Completeness Verification
        ↓
Eligibility Decision
```

---

## 5. Source Preconditions

在 staging generation 前必须确认：

```text
9618_s22_qp_41.pdf exists
9618_s22_ms_41.pdf exists
```

并验证：

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

---

## 6. Expected Staging Files

建议生成：

```text
output/phase2/staging/9618_s22_qp_41.staging.json
output/phase2/staging/9618_s22_ms_41.staging.json
```

实际路径必须遵循现有项目 staging convention。

不要修改其他 staging artifact。

---

## 7. QP Staging Requirements

QP staging 必须验证：

```text
documentRole = question_paper
validationStatus
completenessStatus
canonicalPublishable
publishStatus
severityCounts
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

## 8. MS Staging Requirements

MS staging 必须验证：

```text
documentRole = mark_scheme
validationStatus
completenessStatus
canonicalPublishable
publishStatus
severityCounts
questionCoverage
leafCoverage
markCoverage
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

## 9. Preflight Validation

QP 和 MS 必须分别输出：

```text
validationStatus
completenessStatus
canonicalPublishable
publishStatus
severityCounts
issueCodes
failedChecks
```

Strict eligible 最低要求：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH

P0 = 0
P1 = 0
```

如果任意条件不满足：

```text
do not classify as eligible
```

---

## 10. Completeness Checks

必须检查：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

QP 与 MS 都应输出完整结果。

不得只记录：

```text
status = PASS
```

而缺少具体 completeness evidence。

---

## 11. Pair Verification

必须确认：

```text
qpStagingAvailable = true
msStagingAvailable = true
stagingPairComplete = true
```

并验证：

```text
pairingKey = 9618-2022-MJ-41
```

同时检查：

```text
sourceTraceAvailable = true
qpMsCorrespondence = PASS
```

---

## 12. Strict Eligibility Decision

如果 QP 与 MS 均满足：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
sourceTraceAvailable = true
```

则：

```text
strictEligible = true
```

否则：

```text
strictEligible = false
```

必须列出 blocker。

---

## 13. Parser Boundary

本 PR 默认：

```text
parserModified = false
```

只有出现明确 parser defect evidence 时，才允许提出独立后续 PR。

禁止在 PR-069 中：

```text
silently patch parser
silently weaken validation
silently modify canonical mapping
```

如果发现问题：

```text
investigate
classify
report
stop
```

---

## 14. Stable Modules Freeze

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

## 15. Production Boundary

必须：

```text
productionWrite = false
```

禁止：

```text
add production papers
add production questions
add production response areas
add production mark scheme entries
add production pairing
```

Production hash 必须保持不变：

```text
beforeSha256 == afterSha256
```

---

## 16. Staging Mutation Boundary

本 PR 允许新增：

```text
9618_s22_qp_41.staging.json
9618_s22_ms_41.staging.json
```

除此之外：

```text
all unrelated staging artifacts unchanged
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

如果现有流程会覆盖同名文件，则必须明确记录 expected before/after。

---

## 17. Source Asset Integrity

PR-068 已完成 source recovery。

PR-069 中 source assets 必须：

```text
unchanged = true
```

尤其：

```text
9618_s22_qp_41.pdf unchanged
9618_s22_ms_41.pdf unchanged
```

建议保存 SHA256。

---

## 18. Canonical and Parser Integrity

必须验证：

```text
parser unchanged
canonical unchanged
```

如果发生变化：

```text
PR-069 != PASS
```

除非该变化属于明确批准的新 scope，但当前 plan 不允许。

---

## 19. Expected Coverage Change

PR-068 后：

```text
completeSourcePairs = 118
incompleteSourcePairs = 0
```

当前目标 pair：

```text
source complete
staging missing
not published
```

如果 PR-069 成功生成完整 staging：

理论上：

```text
stagingPairs = previous + 1
stagingMissingPairs = previous - 1
missingStagingPairs = previous - 1
```

如果同时 strict eligible：

```text
eligibleUnpublishedPairs = previous + 1
```

但最终必须以实际 coverage recalculation 为准。

禁止硬编码。

---

## 20. Frontend Verification

PR-069 不做 production write。

因此 frontend production behavior 不应改变。

至少确认：

```text
questionFinder = PASS
knowledgeChecklist = PASS
markSchemeSearch = PASS
aiRetrieval = PASS
openOriginalQuestion = PASS
qpMsCorrespondence = PASS
```

可以执行 regression verification，确认现有 production 不受影响。

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

### Staging Report

建议：

```text
pr069-9618-2022-mj-41-staging-generation-validation-report.json
```

### Regression Test

建议：

```text
pr069-9618-2022-mj-41-staging-generation-validation.test.js
```

### Staging Artifacts

Expected：

```text
9618_s22_qp_41.staging.json
9618_s22_ms_41.staging.json
```

---

## 23. Report Requirements

最终 report 至少包含：

```text
generatedFor
status
productionWrite
targetPair
sourcePreconditions
stagingGeneration
qpValidation
msValidation
pairVerification
strictEligibility
stagingChanges
coverageBefore
coverageAfter
integrity
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

PR-069 PASS 条件：

```text
status = PASS
productionWrite = false

QP staging generated
MS staging generated

QP validation complete
MS validation complete

pair staging complete
source trace preserved

parser unchanged
canonical unchanged
production unchanged
source assets unchanged

unrelated staging unchanged

full regression PASS
```

如果最终：

```text
strictEligible = true
```

则下一步进入独立 production expansion PR。

---

## 25. Failure Conditions

### A. Missing staging artifact

```text
QP staging missing
or
MS staging missing
```

### B. Hidden parser modification

```text
parser changed
```

### C. Hidden canonical modification

```text
canonical changed
```

### D. Production mutation

```text
productionWrite = true
```

或 production hash 改变。

### E. Source mutation

```text
source assets changed
```

### F. Unrelated staging mutation

```text
unrelatedChanges != []
```

### G. Validation blocker

如果：

```text
P0 > 0
or
P1 > 0
```

则不能 classify 为 eligible。

但如果 blocker 被正确检测、报告且没有被绕过，PR-069 可以根据 investigation scope 判定为 PASS 或 NEEDS_FOLLOW_UP，具体应由 report 明确区分。

---

## 26. Next Step Decision Logic

### Outcome A: Strict Eligible

如果：

```text
strictEligible = true
```

下一步：

```text
PR-070
9618-2022-MJ-41 Production Expansion
```

目标：

```text
publish QP
publish MS
create pairing
verify counts
verify frontend
verify integrity
```

---

### Outcome B: Validation Blocked

如果：

```text
strictEligible = false
```

且存在：

```text
P0 > 0
or
P1 > 0
```

则：

```text
do not publish
```

下一步进入独立 investigation PR。

---

### Outcome C: Parser Defect Evidence

如果有明确 parser defect：

```text
create isolated parser-fix PR
```

不要在 PR-069 内修复。

---

## 27. Post-PR-069 Roadmap

推荐：

```text
PR-069
Staging Generation and Validation
   ↓
If eligible:
PR-070 Production Expansion
   ↓
Coverage Re-Audit
   ↓
Duplicate Source Cleanup Investigation
   ↓
Missing Staging Expansion Planning
```

---

## 28. Minimal Change Rule

如果出现问题：

1. 先检查 source identity。
2. 再检查 parser output。
3. 再检查 canonical mapping。
4. 再检查 validation result。
5. 不绕过 blocker。
6. 不修改 stable modules。
7. 不扩大 scope。
8. 一个问题一个 PR。

---

## 29. Final Definition of Done

PR-069 完成标准：

```text
9618-2022-MJ-41 QP staging generated
9618-2022-MJ-41 MS staging generated
validation completed
completeness verified
source trace verified
pair staging completeness verified
strict eligibility determined
production unchanged
source assets unchanged
parser unchanged
canonical unchanged
unrelated staging unchanged
full regression PASS
next step derived from actual result
```
