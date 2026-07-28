# PR-068 9618-2022-MJ-41 Source Recovery Preparation Plan

## 1. PR Overview

**PR ID**

``` text
PR-068
```

**Title**

``` text
9618-2022-MJ-41 Source Recovery Preparation
```

**Objective**

基于 PR-067 的调查结果，为缺失的官方 Mark Scheme：

``` text
9618_s22_ms_41.pdf
```

执行 source recovery preparation。

目标 pair：

``` text
9618-2022-MJ-41
```

本 PR 的核心目标是：

``` text
Acquire or prepare acquisition of the correct official source file,
verify identity and integrity,
place it into the correct source location,
and update source inventory evidence.
```

本 PR 不执行：

-   Staging Generation
-   Production Write
-   Production Publication
-   Parser Modification
-   Canonical Model Modification
-   Validation Rule Modification
-   Duplicate Source Cleanup
-   Missing Staging Expansion

------------------------------------------------------------------------

## 2. Current Project Status

PR-067 已完成并通过。

调查结论：

``` text
pairingKey = 9618-2022-MJ-41
rootCause = LOCAL_SOURCE_OMISSION
classification = SOURCE_RECOVERED
recoveryState = LOCATED_NOT_INGESTED
sourceAcquisitionRequired = true
incompleteStatusMaintained = true
```

当前本地状态：

``` text
QP present = true
MS present = false
```

已有：

``` text
9618_s22_qp_41.pdf
```

缺失：

``` text
9618_s22_ms_41.pdf
```

------------------------------------------------------------------------

## 3. Official Source Evidence

PR-067 已确认 Cambridge 官方存在对应 Mark Scheme。

Document identity：

``` text
Qualification:
Cambridge International AS & A Level

Subject:
Computer Science

Syllabus/Component:
9618/41

Paper:
Paper 41 Computer Science

Session:
May/June 2022

Document Role:
MARK_SCHEME

Publication Status:
Published

Maximum Mark:
75

Printed Pages:
34

Copyright Holder:
UCLES

Copyright Year:
2022
```

因此：

``` text
CAMBRIDGE_SOURCE_UNAVAILABLE = false
```

问题不是 source 不存在，而是本地 repository 尚未拥有正确文件。

------------------------------------------------------------------------

## 4. Scope

### Target Pair

``` text
9618-2022-MJ-41
```

### Expected QP

``` text
9618_s22_qp_41.pdf
```

### Expected MS

``` text
9618_s22_ms_41.pdf
```

### Expected Source Directory

``` text
public/textbook_syllabus/pastpaper/caie-as-a-level-9618/2022 May June/
```

------------------------------------------------------------------------

## 5. PR Goal

本 PR 必须完成：

1.  获取正确官方 Mark Scheme。
2.  验证文件身份。
3.  验证文件不是其他 session/component 的替代品。
4.  验证文件可读。
5.  验证 PDF metadata 与目标一致。
6.  将文件放入正确目录。
7.  重新运行 inventory scan。
8.  确认 source completeness 状态变化。
9.  输出 source recovery report。

------------------------------------------------------------------------

## 6. Acquisition Rules

只能接受：

``` text
official source
or
trusted source with verifiable document identity
```

优先：

``` text
Cambridge School Support Hub
Cambridge Assessment Archive Service
official Cambridge document delivery
```

禁止：

``` text
copy 9618_w21_ms_41.pdf
rename unrelated MS
use another year/session/component
create placeholder
create empty PDF
fabricate source
```

------------------------------------------------------------------------

## 7. Identity Verification Requirements

恢复后的文件必须验证：

``` text
syllabus = 9618
sessionCode = s22
year = 2022
session = M/J
documentRole = MARK_SCHEME
component = 41
```

Expected filename：

``` text
9618_s22_ms_41.pdf
```

Expected identity：

``` text
9618/41
May/June 2022
Mark Scheme
```

------------------------------------------------------------------------

## 8. PDF Validation Requirements

必须验证：

``` text
file exists
file is readable
file is PDF
file is not empty
file opens successfully
page count > 0
```

建议检查：

``` text
printedPages = 34
maximumMark = 75
```

这些字段用于 identity cross-check，不应作为唯一判断依据。

------------------------------------------------------------------------

## 9. Source Traceability

必须记录：

``` text
sourceOrigin
acquisitionChannel
acquisitionDate
originalFilename
repositoryFilename
sha256
fileSize
pageCount
documentIdentity
```

建议 report 中包含：

``` text
sourceEvidence
identityVerification
integrityVerification
inventoryBefore
inventoryAfter
```

------------------------------------------------------------------------

## 10. Inventory Before State

PR-067 / PR-066 baseline：

``` text
totalPdfFiles = 266
sourcePairs = 118
completeSourcePairs = 117
incompleteSourcePairs = 1
```

唯一 incomplete：

``` text
9618-2022-MJ-41
```

Missing MS：

``` text
9618_s22_ms_41.pdf
```

------------------------------------------------------------------------

## 11. Expected Inventory After State

如果 source recovery 成功，理论上应：

``` text
totalPdfFiles = 267
sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
missingMsFiles = []
```

但最终必须以实际 inventory scan 为准。

不要硬编码成功状态。

------------------------------------------------------------------------

## 12. Duplicate Source Boundary

当前存在已知 duplicate source ambiguity：

``` text
9618-2021-ON-41
```

涉及：

``` text
2021 Oct Nov/9618_w21_ms_41.pdf
2022 May June/9618_w21_ms_41.pdf
```

本 PR 不处理 duplicate source。

禁止：

``` text
delete
rename
move
choose winner
```

只允许确保新恢复的：

``` text
9618_s22_ms_41.pdf
```

不会被错误混同为：

``` text
9618_w21_ms_41.pdf
```

------------------------------------------------------------------------

## 13. Stable Modules Freeze

以下模块保持冻结：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline
-   Pairing Logic

本 PR 不允许修改：

``` text
Parser
Canonical Model
Validation Rule
Staging Pipeline
Production Logic
```

------------------------------------------------------------------------

## 14. Integrity Requirements

### Production

必须保持：

``` text
unchanged = true
```

### Staging

必须保持：

``` text
unchanged = true
```

### Parser

必须保持：

``` text
unchanged = true
```

### Canonical

必须保持：

``` text
unchanged = true
```

### Source Assets

允许的唯一变化：

``` text
add:
9618_s22_ms_41.pdf
```

除该文件外，不允许其他 source asset 变化。

------------------------------------------------------------------------

## 15. Required Deliverables

### Recovery Report

建议：

``` text
pr068-9618-2022-mj-41-source-recovery-report.json
```

至少包含：

``` text
generatedFor
status
productionWrite
targetPair
acquisition
sourceEvidence
identityVerification
integrityVerification
sourceChanges
inventoryBefore
inventoryAfter
remainingIncompleteSources
duplicateSources
stableModules
regression
next
```

------------------------------------------------------------------------

## 16. Success Criteria

PR-068 PASS 条件：

``` text
correct official 9618_s22_ms_41.pdf acquired
document identity verified
file readable
file hash recorded
only intended source asset changed

completeSourcePairs = 118
incompleteSourcePairs = 0

production unchanged
staging unchanged
parser unchanged
canonical unchanged
```

------------------------------------------------------------------------

## 17. Failure Conditions

以下情况必须失败：

### A. Wrong Document

``` text
wrong syllabus
wrong year
wrong session
wrong component
wrong role
```

### B. Substitute File

``` text
using 9618_w21_ms_41.pdf
```

或任何 unrelated MS。

### C. Placeholder

``` text
empty PDF
fake PDF
generated placeholder
```

### D. Unexpected Mutation

``` text
production changed
staging changed
parser changed
canonical changed
unrelated source assets changed
```

### E. Inventory Drift

恢复后出现：

``` text
unexpected duplicate
unexpected orphan
unexpected source count mismatch
```

且未解释。

------------------------------------------------------------------------

## 18. Regression Requirements

必须至少保持：

``` text
PR-066 PASS
PR-067 PASS
```

同时：

``` text
phase1 = PASS (20/20)
phase2 = PASS (120/120)
fullNpmTest = PASS
prismaValidate = PASS

architectureFailures = []
documentRoleRegressions = []
```

------------------------------------------------------------------------

## 19. Next Step After PR-068

如果 PR-068 成功且：

``` text
completeSourcePairs = 118
incompleteSourcePairs = 0
```

下一步不应直接 publish。

建议进入：

``` text
PR-069
9618-2022-MJ-41 Staging Generation and Validation
```

目标：

``` text
Generate QP/MS staging
Run validation
Verify canonical completeness
Verify source traces
Determine eligibility
```

PR-069 不应执行 production write。

------------------------------------------------------------------------

## 20. Follow-up Roadmap

推荐路线：

``` text
PR-068
Source Recovery
   ↓
PR-069
Staging Generation and Validation
   ↓
Review
   ↓
Production Expansion PR if eligible
   ↓
Duplicate Source Cleanup Investigation
   ↓
Missing Staging Expansion Planning
   ↓
Coverage Re-Audit
```

不要把 source recovery、staging generation 和 production publication
塞进一个 PR。

------------------------------------------------------------------------

## 21. Minimal Change Rule

如果 PR-068 出现问题：

1.  先检查 source identity。
2.  再检查 acquisition channel。
3.  再检查 file integrity。
4.  不修改 parser。
5.  不修改 canonical model。
6.  不修改 pairing logic。
7.  不扩大 scope。
8.  不使用替代文件绕过缺失。

------------------------------------------------------------------------

## 22. Final Definition of Done

PR-068 完成标准：

``` text
correct official 9618_s22_ms_41.pdf acquired
document identity confirmed
file integrity confirmed
file placed in correct directory
source inventory recalculated
incomplete source status updated
only intended source asset changed
production unchanged
staging unchanged
parser unchanged
canonical unchanged
next staging-generation PR clearly defined
```
