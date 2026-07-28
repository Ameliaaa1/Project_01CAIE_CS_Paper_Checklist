# PR-028_Production_Expansion_Strategy_Explanation

## PR Title

Production Expansion Strategy After Successful Production Pilot

------------------------------------------------------------------------

# 1. Current Project Status

当前项目已经完成：

``` text
Architecture Stabilization
        ↓
Phase 1 Validation
        ↓
Phase 2 Large Scale Validation
        ↓
Issue Resolution
        ↓
Canonical Completeness Gate
        ↓
Production Pilot
```

当前状态：

``` text
Phase 1:
20 / 20 PASS

Phase 2:
120 / 120 PASS

Production Pilot:
PASS
```

已验证：

-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline
-   TEXT Quality Pipeline
-   Response Area Pipeline
-   Canonical Completeness Gate
-   Publish Gate
-   Production Write
-   Frontend End-to-End Flow

当前 Production Pilot：

``` text
0478-2023-MJ-12
```

已经成功进入 Production。

------------------------------------------------------------------------

# 2. PR-028 Objective

PR-028 的唯一目标：

建立从：

``` text
Single Production Pilot
```

到：

``` text
Controlled Production Expansion
```

的安全扩展流程。

本 PR 不进行：

-   Parser 修改
-   Canonical Schema 修改
-   Question Model 修改
-   Frontend 重构

重点：

``` text
Data Publishing Infrastructure
```

------------------------------------------------------------------------

# 3. Scope

## Included

允许：

-   Production batch planning
-   Production migration strategy
-   Dataset prioritization
-   Batch ingestion workflow
-   Migration validation
-   Production monitoring
-   Rollback strategy improvement
-   Expansion report generation

------------------------------------------------------------------------

## Forbidden

禁止修改：

-   PDF Parser
-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT Quality Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Canonical Completeness Gate Rules

如果发现 Parser 问题：

必须单独创建新的 PR。

------------------------------------------------------------------------

# 4. Expansion Strategy

不要：

``` text
120 PDFs
        ↓
直接全部 Production
```

采用：

``` text
Pilot
 ↓
Controlled Batch
 ↓
Expanded Batch
 ↓
Full Production
```

------------------------------------------------------------------------

# 5. Production Expansion Phases

## Phase A

## Expand Same Syllabus Same Period

目标：

验证同一 syllabus 下批量扩展。

范围：

``` text
0478
2023
May-June
All Components
```

检查：

-   QP/MS pairing
-   Question coverage
-   Mark coverage
-   Response Area coverage
-   Frontend search

------------------------------------------------------------------------

## Phase B

## Expand Same Syllabus Multi-Year

范围：

``` text
0478
2020-2023
```

目标：

验证：

-   年份变化
-   PDF layout variation
-   Historical template compatibility

------------------------------------------------------------------------

## Phase C

## Add Second Supported Syllabus

加入：

``` text
9618
```

验证：

-   不同 syllabus structure
-   不同 question pattern
-   Mark Scheme compatibility

------------------------------------------------------------------------

## Phase D

## Full Production Migration

条件：

所有前置阶段 PASS。

之后：

执行：

``` text
Supported PDFs
        ↓
Production Migration
```

------------------------------------------------------------------------

# 6. Production Batch Workflow

标准流程：

``` text
Select Dataset
        ↓
Parser Validation
        ↓
Staging Generation
        ↓
Canonical Completeness Gate
        ↓
Publish Gate
        ↓
Production Transaction
        ↓
Production Verification
        ↓
Frontend Smoke Test
        ↓
Batch Approval
```

任何一步失败：

``` text
Batch BLOCKED
```

禁止进入 Production。

------------------------------------------------------------------------

# 7. Batch Identity

每次 Production migration 必须具有：

``` text
batchId
```

格式：

``` text
PR028-0478-2023-MJ
```

必须记录：

-   syllabus
-   year
-   session
-   component range
-   migration timestamp
-   validation result

------------------------------------------------------------------------

# 8. Production Verification Requirements

每个 batch 必须验证：

## Paper Level

检查：

-   paper exists
-   documentRole correct
-   fileHash exists
-   sourceTrace exists

------------------------------------------------------------------------

## Question Level

检查：

-   question count
-   leaf question count
-   stable question ID
-   parent-child relation

------------------------------------------------------------------------

## Mark Scheme Level

检查：

-   mark entry count
-   question mapping
-   QP/MS correspondence

------------------------------------------------------------------------

## Response Area Level

检查：

-   required response areas
-   existing response areas
-   coverage ratio

------------------------------------------------------------------------

# 9. Monitoring Requirements

Production Expansion 后增加：

## Data Quality Metrics

记录：

-   ingestion success rate
-   validation failure rate
-   completeness failure rate
-   rollback count

------------------------------------------------------------------------

## Dataset Metrics

记录：

-   total papers
-   total questions
-   total leaf questions
-   total response areas
-   total mark entries

------------------------------------------------------------------------

# 10. Rollback Strategy

必须支持：

## Batch Rollback

例如：

``` text
PR028-0478-2023-MJ
```

删除：

-   papers
-   questions
-   response areas
-   mark schemes
-   related metadata

------------------------------------------------------------------------

禁止：

``` text
delete all production
```

------------------------------------------------------------------------

# 11. Regression Requirements

任何 Production Expansion 必须保持：

``` text
Phase 1:
20 / 20 PASS
```

以及：

``` text
Phase 2:
120 / 120 PASS
```

同时：

``` text
architectureFailures=[]

documentRoleRegressions=[]

textQualityRegressions=[]
```

------------------------------------------------------------------------

# 12. Acceptance Criteria

PR-028 完成条件：

-   Production expansion workflow documented
-   Batch migration workflow implemented
-   Batch identity implemented
-   Rollback tested
-   Validation gate integrated
-   Production verification automated
-   Monitoring report generated
-   Existing regression unchanged
-   Stable modules unchanged

------------------------------------------------------------------------

# 13. Out of Scope

PR-028 不做：

-   Parser improvement
-   New syllabus support
-   9709 support
-   AI model optimization
-   Frontend redesign
-   Database redesign

------------------------------------------------------------------------

# 14. Future Optimization

未来可能单独建立：

## PR-029 Production Scale Optimization

可能内容：

-   Source Trace storage optimization
-   Production indexing
-   Search performance
-   Large dataset monitoring

但当前不执行。

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

Pilot:
Successful
```

下一阶段：

``` text
PR-028

Production Expansion Strategy
```

核心目标：

``` text
从单个成功 Pilot
安全扩展到可控 Production 数据规模。
```

保持：

``` text
Minimal Change Principle

No Parser Rewrite

No Architecture Rewrite

No Stable Module Regression
```

END
