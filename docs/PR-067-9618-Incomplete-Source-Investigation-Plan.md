# PR-067 9618 Incomplete Source Investigation Plan

## 1. PR Overview

**PR ID**

``` text
PR-067
```

**Title**

``` text
9618 Incomplete Source Investigation
```

**Objective**

调查 PR-066 Production Coverage Re-Audit 发现的唯一 incomplete source
pair：

``` text
9618-2022-MJ-41
```

本 PR 目标：

-   确认 source completeness root cause
-   验证缺失 Mark Scheme 的真实状态
-   建立 source evidence
-   决定后续处理路径

本 PR 不执行：

-   Production Write
-   Parser 修改
-   Canonical Model 修改
-   Validation Rule 修改
-   Staging Generation
-   Production Publication
-   Duplicate Cleanup

------------------------------------------------------------------------

## 2. Current Status

PR-066 后：

``` text
sourcePairs = 118
completeSourcePairs = 117
incompleteSourcePairs = 1

publishedPairs = 25
eligibleUnpublishedPairs = 0
blockedPairs = 0
partialProductionConflicts = 0
```

当前唯一 source completeness blocker：

``` text
9618-2022-MJ-41
```

------------------------------------------------------------------------

## 3. Problem Statement

当前检测结果：

``` text
missingQp = false
missingMs = true
```

已有：

``` text
9618_s22_qp_41.pdf
```

缺少：

``` text
9618_s22_ms_41.pdf
```

当前分类：

``` text
INCOMPLETE_SOURCE
```

不是：

``` text
Parser Failure
Validation Failure
Production Failure
```

------------------------------------------------------------------------

## 4. Scope

### Target Pair

``` text
9618-2022-MJ-41
```

### Session

``` text
M/J
```

### Year

``` text
2022
```

### Component

``` text
41
```

------------------------------------------------------------------------

## 5. Investigation Goals

必须回答：

1.  Source 文件是否真的缺失？
2.  文件命名是否存在异常？
3.  是否存在替代命名？
4.  是否存在 session/component mapping 错误？
5.  是否属于 Cambridge source availability 问题？
6.  是否需要单独 source acquisition？
7.  是否应该保持 incomplete 状态？

------------------------------------------------------------------------

## 6. Investigation Steps

### Step 1: Source Directory Audit

检查：

``` text
2022 May June/
```

寻找：

``` text
9618_*_ms_41.pdf
```

检查：

-   文件名
-   session code
-   year code
-   component code

------------------------------------------------------------------------

### Step 2: Naming Pattern Validation

验证标准：

QP:

``` text
9618_s22_qp_41.pdf
```

对应 MS:

``` text
9618_s22_ms_41.pdf
```

确认是否存在：

-   typo
-   alternate naming
-   archive naming

------------------------------------------------------------------------

### Step 3: Inventory Cross Check

确认：

``` text
missingMsFiles
orphanQpFiles
duplicateSources
```

保持一致。

------------------------------------------------------------------------

### Step 4: External Source Evidence

如果 source directory 中不存在：

需要记录：

-   source availability
-   acquisition result
-   unavailable evidence

禁止：

``` text
guess missing file
create empty placeholder
copy unrelated MS
```

------------------------------------------------------------------------

## 7. Stable Modules Freeze

以下模块禁止修改：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline

本 PR 不涉及 parser。

------------------------------------------------------------------------

## 8. Expected Outcomes

### Outcome A

找到正确 MS：

状态：

``` text
SOURCE_RECOVERED
```

下一步：

独立 PR：

``` text
PR-068
9618-2022-MJ-41 Source Recovery Preparation
```

------------------------------------------------------------------------

### Outcome B

确认不存在：

状态：

``` text
SOURCE_UNAVAILABLE_CONFIRMED
```

保持：

``` text
incompleteSourcePairs = 1
```

记录 evidence。

------------------------------------------------------------------------

### Outcome C

发现 mapping issue：

状态：

``` text
SOURCE_MAPPING_ERROR
```

建立新的 investigation PR。

------------------------------------------------------------------------

## 9. Deliverables

需要生成：

``` text
pr067-9618-incomplete-source-investigation-report.json
```

至少包含：

``` text
generatedFor
status
targetPair
sourceEvidence
directoryScan
missingFiles
alternateMatches
rootCause
classification
recommendedNextStep
```

------------------------------------------------------------------------

## 10. Integrity Requirements

本 PR：

``` text
productionWrite = false
```

必须：

``` text
production unchanged
staging unchanged
canonical unchanged
parser unchanged
source assets unchanged
```

如果需要添加 source 文件：

必须进入新的 PR。

------------------------------------------------------------------------

## 11. Regression Requirements

必须保持：

``` text
architectureFailures = []
documentRoleRegressions = []
```

确认：

``` text
phase1 PASS
phase2 PASS
fullNpmTest PASS
prismaValidate PASS
```

------------------------------------------------------------------------

## 12. Failure Conditions

以下情况失败：

-   修改 parser 解决 source 问题
-   创建伪造 MS 文件
-   修改 production 状态
-   修改 pairing logic
-   未保存 evidence
-   未说明 root cause

------------------------------------------------------------------------

## 13. Success Criteria

PR-067 PASS：

``` text
9618-2022-MJ-41 investigated

root cause identified

source status classified

evidence recorded

no production mutation

no staging mutation

no parser modification

next action clearly defined
```

------------------------------------------------------------------------

## 14. Next Roadmap

推荐路线：

``` text
PR-067
Incomplete Source Investigation
        |
        v
PR-068
Source Recovery or Source Availability Decision
        |
        v
PR-069
Duplicate Source Cleanup Investigation
        |
        v
PR-070
Missing Staging Expansion Planning
        |
        v
Final Coverage Re-Audit
```

------------------------------------------------------------------------

## Final Definition of Done

``` text
9618-2022-MJ-41 source status understood
Root cause classified
Evidence preserved
No production impact
No regression introduced
Next PR determined
```
