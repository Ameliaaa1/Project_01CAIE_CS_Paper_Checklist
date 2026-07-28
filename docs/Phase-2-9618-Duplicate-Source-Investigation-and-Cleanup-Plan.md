# Phase 2 9618 Duplicate Source Investigation + Cleanup Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 2
```

**Title**

``` text
9618 Duplicate Source Investigation + Cleanup
```

**Objective**

处理 Phase 1 完成后发现的唯一 source quality 问题：

``` text
duplicateSources
```

目标：

``` text
9618-2021-ON-41
```

当前发现存在两个疑似重复 Mark Scheme 文件：

``` text
2021 Oct Nov/9618_w21_ms_41.pdf

2022 May June/9618_w21_ms_41.pdf
```

本 Phase 目标：

-   调查 duplicate source 根因
-   比较两个文件身份
-   确认 canonical source
-   清理错误或重复 source
-   更新 source inventory
-   验证没有引入 regression

------------------------------------------------------------------------

# 2. Current Project Status

Phase 1 已完成并通过。

当前状态：

``` text
publishedPairs = 26
eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0

sourcePairs = 118
completeSourcePairs = 118
incompleteSourcePairs = 0
```

当前没有：

``` text
source missing
production blocker
parser blocker
validation blocker
```

剩余 source quality issue：

``` text
duplicateSources = 1
```

------------------------------------------------------------------------

# 3. Target Scope

## Target Pair

``` text
9618-2021-ON-41
```

## Expected Identity

``` text
Syllabus:
9618

Year:
2021

Session:
O/N

Component:
41

Document Role:
MARK_SCHEME
```

------------------------------------------------------------------------

# 4. Known Duplicate Evidence

当前检测到：

## Candidate A

路径：

``` text
2021 Oct Nov/9618_w21_ms_41.pdf
```

Expected:

``` text
9618-2021-ON-41-MS
```

------------------------------------------------------------------------

## Candidate B

路径：

``` text
2022 May June/9618_w21_ms_41.pdf
```

文件名：

``` text
9618_w21_ms_41.pdf
```

但是目录 session/year：

``` text
2022 May June
```

存在 session mapping ambiguity。

------------------------------------------------------------------------

# 5. Phase Goal

必须回答：

``` text
两个文件是否相同？

哪个文件属于正确 source pair？

是否存在错误归档？

是否需要删除重复文件？

删除后 inventory 是否正确？
```

------------------------------------------------------------------------

# 6. Investigation Flow

执行流程：

``` text
Duplicate Detection
        ↓
File Metadata Comparison
        ↓
SHA256 Comparison
        ↓
PDF Content Comparison
        ↓
Document Identity Verification
        ↓
Determine Canonical Source
        ↓
Cleanup Duplicate
        ↓
Inventory Re-Audit
```

------------------------------------------------------------------------

# 7. File Identity Verification

两个候选文件必须检查：

``` text
filename
path
sha256
fileSize
pageCount
pdfMetadata
firstPageText
documentRole
syllabus
year
session
component
```

------------------------------------------------------------------------

# 8. SHA256 Comparison

必须计算：

``` text
sha256(candidateA)

sha256(candidateB)
```

情况分类：

## Case A

Hash 相同：

``` text
sameFile = true
```

说明：

两个路径引用同一个内容。

下一步：

确认 canonical location。

------------------------------------------------------------------------

## Case B

Hash 不同：

``` text
sameFile = false
```

需要进一步比较：

-   metadata
-   first page
-   document identity
-   content difference

------------------------------------------------------------------------

# 9. Document Identity Rules

Canonical source 必须满足：

``` text
syllabus = 9618

component = 41

sessionCode = w21

year = 2021

session = O/N

documentRole = MARK_SCHEME
```

禁止：

``` text
只看文件名
只看 component
只看目录
```

文件路径不能替代 document identity。

------------------------------------------------------------------------

# 10. Cleanup Decision Rules

## Scenario A

两个文件完全一致：

处理：

``` text
retain canonical source
remove duplicate copy
```

要求：

记录：

``` text
removedPath
retainedPath
sha256
reason
```

------------------------------------------------------------------------

## Scenario B

一个文件 identity 正确，一个错误：

处理：

``` text
retain correct source
remove misplaced source
```

必须保存 evidence。

------------------------------------------------------------------------

## Scenario C

两个文件内容不同：

禁止直接删除。

进入：

``` text
SOURCE_CONFLICT
```

需要独立 investigation。

------------------------------------------------------------------------

# 11. Cleanup Boundary

本 Phase 允许：

``` text
remove confirmed duplicate source
update source inventory
```

本 Phase 禁止：

``` text
modify parser

modify canonical model

modify validation rules

modify production

modify staging

change pairing logic
```

------------------------------------------------------------------------

# 12. Production Boundary

Production 必须保持：

``` text
unchanged = true
```

禁止：

``` text
delete production records
republish papers
modify pairings
```

原因：

duplicate source 属于 source layer 问题。

------------------------------------------------------------------------

# 13. Staging Boundary

Staging 必须保持：

``` text
unchanged = true
```

禁止：

``` text
regenerate staging
modify staging JSON
delete staging artifact
```

------------------------------------------------------------------------

# 14. Stable Modules Freeze

以下模块保持冻结：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline
-   Pairing Logic

------------------------------------------------------------------------

# 15. Source Integrity Requirements

Cleanup 前：

记录：

``` text
sourceInventoryBefore
duplicateCandidatesBefore
sha256Before
```

Cleanup 后：

记录：

``` text
sourceInventoryAfter
duplicateCandidatesAfter
removedFiles
remainingFiles
sha256After
```

必须证明：

``` text
only intended duplicate source changed
```

------------------------------------------------------------------------

# 16. Expected Coverage Change

Before:

``` text
duplicateSources = 1
```

After:

目标：

``` text
duplicateSources = 0
```

同时保持：

``` text
sourcePairs = 118

completeSourcePairs = 118

incompleteSourcePairs = 0
```

------------------------------------------------------------------------

# 17. Required Deliverables

生成：

``` text
phase2-9618-duplicate-source-cleanup-report.json
```

至少包含：

``` text
generatedFor

status

targetPair

duplicateCandidates

fileComparison

hashComparison

identityVerification

canonicalDecision

cleanupAction

sourceChanges

inventoryBefore

inventoryAfter

productionIntegrity

stagingIntegrity

regression

next
```

------------------------------------------------------------------------

# 18. Regression Requirements

必须保持：

``` text
Phase 1 PASS
```

同时：

``` text
architectureFailures = []

documentRoleRegressions = []

phase1 = PASS
phase2 = PASS

fullNpmTest = PASS

prismaValidate = PASS
```

------------------------------------------------------------------------

# 19. Failure Conditions

以下情况失败：

## A. 删除错误 source

``` text
canonical source removed
```

------------------------------------------------------------------------

## B. 未验证 identity

例如：

``` text
only filename comparison
```

------------------------------------------------------------------------

## C. Production Mutation

``` text
production changed
```

------------------------------------------------------------------------

## D. Staging Mutation

``` text
staging changed
```

------------------------------------------------------------------------

## E. Parser / Canonical Mutation

``` text
parser changed

canonical changed
```

------------------------------------------------------------------------

## F. Unexplained Inventory Drift

例如：

``` text
unexpected source count change
unexpected pair removal
```

------------------------------------------------------------------------

# 20. Success Criteria

Phase 2 PASS：

``` text
duplicate source investigated

root cause identified

canonical source confirmed

cleanup completed if required

duplicateSources = 0

sourcePairs unchanged

completeSourcePairs unchanged

production unchanged

staging unchanged

parser unchanged

canonical unchanged

regression PASS
```

------------------------------------------------------------------------

# 21. Next Step Decision

## Outcome A

Duplicate resolved：

进入：

``` text
Phase 3
9618 Missing Staging Expansion by Batch
```

------------------------------------------------------------------------

## Outcome B

发现 source conflict：

进入：

``` text
Independent Source Conflict Investigation
```

不要继续 cleanup。

------------------------------------------------------------------------

# 22. Recommended Roadmap

``` text
Phase 1
9618-2022-MJ-41 Staging + Validation + Production
        ↓
Phase 2
9618 Duplicate Source Investigation + Cleanup
        ↓
Phase 3
9618 Missing Staging Expansion by Batch
        ↓
Phase 4
Final Coverage Re-Audit + Stability Validation
```

------------------------------------------------------------------------

# 23. Final Definition of Done

``` text
9618-2021-ON-41 duplicate source status confirmed

canonical source identified

cleanup evidence recorded

source inventory updated

duplicateSources resolved

production unchanged

staging unchanged

parser unchanged

canonical unchanged

regression PASS

next phase clearly defined
```
