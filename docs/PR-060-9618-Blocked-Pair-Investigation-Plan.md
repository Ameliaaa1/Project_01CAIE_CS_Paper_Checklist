# PR-060 9618 Blocked Pair Investigation Plan

## 1. PR Overview

**PR ID**

``` text
PR-060
```

**Objective**

针对 PR-059 Coverage Audit 中发现的 blocked pairs 进行 Root Cause
Investigation。

本 PR 只负责：

-   调查 blocked 原因
-   分类问题来源
-   判断是否需要后续修复 PR
-   输出 investigation report

本 PR 不执行：

-   Production Write
-   发布 blocked pair
-   修改 Parser
-   修改 Canonical Model
-   修改 Staging Pipeline
-   批量解除 Block
-   修改 Validation Rule

------------------------------------------------------------------------

## 2. Current Status

PR-059 完成后：

``` text
9618 Production Expansion = COMPLETE

eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```

当前 remaining items：

``` text
blockedPairs = 9
incompleteSourcePairs = 1
missingStagingPairs = 92
```

本 PR 仅处理：

``` text
blockedPairs = 9
```

------------------------------------------------------------------------

## 3. Blocked Pair Scope

当前 blocked pairs：

``` text
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

这些 pair 当前：

``` text
published = false
pairingLinked = false
```

禁止直接 publish。

------------------------------------------------------------------------

## 4. Investigation Goal

目标：

回答：

``` text
Why are these pairs blocked?
```

必须确定：

-   P1 来源
-   是否真实错误
-   是否 validation false positive
-   是否 parser 输出问题
-   是否 canonical mapping 问题
-   是否需要人工 review

------------------------------------------------------------------------

## 5. Investigation Principles

必须遵守：

``` text
Investigate only
No mutation
No production write
No hidden fix
```

不要在 investigation 中直接：

-   改规则
-   改 parser
-   改数据
-   标记 PASS

先确认 root cause。

------------------------------------------------------------------------

## 6. Investigation Workflow

执行流程：

``` text
Blocked Pair
      ↓
Review Validation Failure
      ↓
Identify P1 Source
      ↓
Check Parser Output
      ↓
Check Canonical Representation
      ↓
Determine Root Cause
      ↓
Create Follow-up Fix PR if needed
```

------------------------------------------------------------------------

## 7. Root Cause Categories

每个 blocked pair 必须归类。

### Category A: Validation False Positive

特点：

-   Parser output 正确
-   Canonical 数据正确
-   Validation rule 误判

处理：

创建独立 validation fix PR。

------------------------------------------------------------------------

### Category B: Parser Issue

特点：

-   PDF extraction 错误
-   Span extraction 错误
-   Region classification 错误
-   Question parsing 错误

处理：

创建 parser investigation/fix PR。

------------------------------------------------------------------------

### Category C: Canonical Mapping Issue

特点：

-   Parser 输出正确
-   Canonical model 转换错误

处理：

创建 canonical mapping fix PR。

------------------------------------------------------------------------

### Category D: Data Quality Issue

特点：

-   Source PDF 异常
-   PDF 内容异常
-   文件版本问题

处理：

创建 source/data cleanup PR。

------------------------------------------------------------------------

### Category E: Human Review Required

特点：

-   自动规则无法判断
-   需要确认 Cambridge 原始内容

处理：

记录人工 review。

------------------------------------------------------------------------

## 8. Stable Modules

以下模块保持冻结：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline
-   Document Role Router

除非 investigation 明确证明问题来自这些模块，否则禁止修改。

------------------------------------------------------------------------

## 9. Required Investigation Data

每个 blocked pair 至少记录：

``` text
pairingKey
qpStatus
msStatus
validationWarnings
severityCounts
failedChecks
parserEvidence
canonicalEvidence
rootCauseCategory
recommendedAction
```

------------------------------------------------------------------------

## 10. P1 Investigation Rules

当前 blocked 主要原因：

``` text
P1 unresolved
```

必须明确：

P1 是：

-   真正用户可见错误
-   数据完整性问题
-   质量规则误判

不能仅因为存在 P1 就直接修复。

------------------------------------------------------------------------

## 11. Regression Requirements

如果后续需要修复：

必须保持：

``` text
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
```

同时：

``` text
architectureFailures = []
documentRoleRegressions = []
```

------------------------------------------------------------------------

## 12. Deliverables

本 PR 输出：

``` text
pr060-9618-blocked-pair-investigation-report.json
```

至少包含：

``` text
generatedFor
status
blockedPairsReviewed
investigationResults
rootCauseSummary
recommendedFixPRs
regression
```

------------------------------------------------------------------------

## 13. Success Criteria

PR-060 PASS 条件：

``` text
all blocked pairs reviewed
each pair has root cause classification
no hidden fixes applied
no production write
recommended next actions defined
regression unchanged
```

------------------------------------------------------------------------

## 14. Failure Conditions

以下情况判定失败：

-   未完成全部 blocked pair review
-   直接修改 production
-   未确认 root cause 就修改代码
-   把 blocked 错误标记为 regression
-   修改稳定模块但没有证据

------------------------------------------------------------------------

## 15. Next Step After PR-060

根据 investigation 结果拆分：

可能：

``` text
PR-061 Validation Rule Fix
```

或：

``` text
PR-061 Parser Fix
```

或：

``` text
PR-061 Data Cleanup
```

或：

``` text
No Fix Required
```

不要将多个 root cause 混入一个 PR。

------------------------------------------------------------------------

## 16. Final Definition of Done

PR-060 完成标准：

``` text
9 blocked pairs investigated
root causes classified
follow-up actions identified
production unchanged
staging unchanged
stable modules unchanged
regression preserved
investigation report generated
```
