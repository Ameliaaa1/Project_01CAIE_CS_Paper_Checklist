# PR-029_Generate_Missing_Production_Expansion_Staging_Coverage_Explanation

## PR Title

Generate Missing Production Expansion Staging Coverage

------------------------------------------------------------------------

# 1. Background

当前项目状态：

``` text
Architecture Stabilization
        ↓
Phase 1 Validation
        ↓
Phase 2 Validation
        ↓
Issue Resolution
        ↓
Canonical Completeness Gate
        ↓
Production Pilot
        ↓
Production Expansion Infrastructure
```

当前已完成：

-   PR-020 Mark Scheme Document Profile Separation
-   PR-022 Legacy Mark Scheme Barcode Region Classification Support
-   PR-023 Mark Sum Validation Investigation
-   PR-024 Back Matter Detection Investigation
-   PR-025 Question Marker Boundary Detection
-   PR-026 Canonical Completeness Gate
-   PR-027 Production Pilot
-   PR-028 Production Expansion Strategy

当前状态：

``` text
Phase 1:
20 / 20 PASS

Phase 2:
120 / 120 PASS

Production Pilot:
PASS

Production Expansion Infrastructure:
PASS
```

------------------------------------------------------------------------

# 2. Current Problem

PR-028 已成功建立 Production Expansion workflow。

但是 Phase A 执行被阻塞：

``` text
Batch:
PR028-0478-2023-MJ

Scope:

0478
2023
May-June

Components:

11
12
13
21
22
23
```

当前结果：

``` text
ELIGIBLE: 0

ALREADY_PUBLISHED: 1

BLOCKED: 5
```

已经发布：

``` text
0478-2023-MJ-12
```

剩余：

``` text
0478-2023-MJ-11
0478-2023-MJ-13
0478-2023-MJ-21
0478-2023-MJ-22
0478-2023-MJ-23
```

阻塞原因：

``` text
MISSING_STAGING_PAIR
```

------------------------------------------------------------------------

# 3. Root Cause

问题不是：

-   Parser failure
-   Canonical failure
-   Production migration failure
-   Publish Gate failure

Root Cause：

``` text
Required Phase A staging artifacts do not exist.
```

当前缺少：

``` text
Question Paper Staging

+

Mark Scheme Staging
```

例如：

``` text
0478_s23_qp_11.staging.json
0478_s23_ms_11.staging.json
```

等。

------------------------------------------------------------------------

# 4. Objective

PR-029 唯一目标：

生成 PR-028 Phase A 所需的完整 staging coverage。

目标：

将：

``` text
MISSING_STAGING_PAIR
```

转化为：

``` text
ELIGIBLE FOR PRODUCTION EXPANSION
```

------------------------------------------------------------------------

# 5. Scope

## Allowed Changes

允许：

-   运行已有 ingestion workflow
-   生成缺失 staging JSON
-   执行 existing validation
-   执行 Canonical Completeness Gate
-   生成 staging coverage report
-   更新 expansion candidate list

------------------------------------------------------------------------

## Forbidden Changes

禁止：

-   修改 Parser
-   修改 PDF extraction
-   修改 Question Split
-   修改 Stable Question ID
-   修改 Parent / Leaf Model
-   修改 Marks Validation
-   修改 TEXT Quality Pipeline
-   修改 Response Area Pipeline
-   修改 Document Role Router
-   修改 Canonical Schema
-   修改 Production Write Logic

如果发现解析问题：

必须创建新的 Parser PR。

------------------------------------------------------------------------

# 6. Target Dataset

PR-029 只处理：

``` text
Syllabus:
0478

Year:
2023

Session:
May-June
```

Components:

``` text
11
13
21
22
23
```

不处理：

-   9618
-   多年份扩展
-   Full Production Migration
-   9709

------------------------------------------------------------------------

# 7. Execution Workflow

正确流程：

``` text
Source PDF

↓

Existing Parser

↓

Canonical Generation

↓

Staging JSON

↓

Validation

↓

Canonical Completeness Gate

↓

Expansion Candidate
```

禁止：

直接创建 Production 数据。

------------------------------------------------------------------------

# 8. Validation Requirements

每一个新的 QP/MS Pair 必须满足：

## Document Role

确认：

``` text
QP = Question Paper

MS = Mark Scheme
```

------------------------------------------------------------------------

## Question Coverage

检查：

-   question count
-   question id
-   page range

------------------------------------------------------------------------

## Leaf Coverage

检查：

-   parent relation
-   leaf id
-   section path

------------------------------------------------------------------------

## Mark Coverage

检查：

-   mark entries
-   question mapping

------------------------------------------------------------------------

## Response Area Coverage

检查：

-   required response areas
-   detected response areas

------------------------------------------------------------------------

## Source Trace Coverage

检查：

-   source file
-   page
-   span reference

------------------------------------------------------------------------

# 9. Expected Output

PR-029 完成后：

生成：

``` text
staging coverage report
```

示例：

``` json
{
  "batchId": "PR028-0478-2023-MJ",
  "components": [
    {
      "component": "11",
      "status": "READY"
    },
    {
      "component": "13",
      "status": "READY"
    }
  ],
  "eligibleCount": 5,
  "blockedCount": 0
}
```

------------------------------------------------------------------------

# 10. Acceptance Criteria

PR-029 完成条件：

-   Component 11 staging pair generated
-   Component 13 staging pair generated
-   Component 21 staging pair generated
-   Component 22 staging pair generated
-   Component 23 staging pair generated

并且：

每个 Pair：

``` text
QP staging PASS

MS staging PASS

Completeness Gate PASS
```

最终：

``` text
ELIGIBLE >= 5
```

------------------------------------------------------------------------

# 11. Regression Requirements

必须保持：

``` text
Phase 1:
20 / 20 PASS
```

保持。

``` text
Phase 2:
120 / 120 PASS
```

保持。

同时：

``` text
architectureFailures = []

documentRoleRegressions = []

textQualityRegressions = []
```

保持。

------------------------------------------------------------------------

# 12. Out of Scope

PR-029 不做：

-   Production write
-   Batch migration
-   Full Production expansion
-   New syllabus
-   Parser optimization
-   Database optimization

------------------------------------------------------------------------

# 13. Next Step After PR-029

PR-029 完成后：

重新运行：

``` text
PR028-0478-2023-MJ
```

预期：

当前：

``` text
ELIGIBLE:0
ALREADY_PUBLISHED:1
BLOCKED:5
```

变为：

``` text
ELIGIBLE:5
ALREADY_PUBLISHED:1
BLOCKED:0
```

之后进入：

``` text
Production Expansion Write
```

------------------------------------------------------------------------

# Final Decision

当前项目状态：

``` text
Parser:
Stable

Validation:
Stable

Completeness:
Stable

Production Pilot:
Complete

Expansion Infrastructure:
Complete

Staging Coverage:
Missing
```

下一步：

``` text
PR-029

Generate Missing Production Expansion Staging Coverage
```

唯一目标：

``` text
补齐 Production Expansion 所需 staging 数据，
不修改任何稳定模块。
```

END
