# PR-034 0478 Production Expansion Batch 01 Implementation Plan

## 1. PR Overview

**PR ID**

PR-034

**Title**

0478 Production Expansion Batch 01

**Objective**

将 PR-033 Multi-Year Expansion Preparation
中已经验证通过的最小生产扩展批次正式发布到 Production。

本 PR 不进行 Parser 修改，不进行 Canonical Model 修改，不进行 Staging
Pipeline 修改。

唯一目标：

    Validated Staging Artifacts

    ↓

    Production Publish

    ↓

    Production Regression Verification

------------------------------------------------------------------------

# 2. Scope

## Included

本次发布范围：

  Year   Session   Component
  ------ --------- -----------
  2021   M/J       11
  2021   M/J       12

对应：

    0478-2021-MJ-11
    0478-2021-MJ-12

------------------------------------------------------------------------

## Excluded

以下内容不属于 PR-034：

-   新增 syllabus
-   支持 9709 Mathematics
-   Parser 重构
-   Question Split 修改
-   Mark Scheme Parser 修改
-   Response Area Pipeline 修改
-   TEXT QUALITY Pipeline 修改
-   大规模 multi-year publish

------------------------------------------------------------------------

# 3. Input Source

PR-034 输入来自 PR-033 输出。

PR-033 已确认：

    expectedPairs: 24

    eligiblePairs: 8

    recommendedBatch:

    year: 2021

    components:
    - 11
    - 12

选择原因：

-   QP PDF 存在
-   MS PDF 存在
-   QP staging PASS
-   MS staging PASS
-   completeness checks PASS
-   未发布
-   productionWrite=false 已验证

------------------------------------------------------------------------

# 4. Current Architecture Boundary

保持：

    PDF

    ↓

    Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Production

PR-034 只操作：

    Staging

    ↓

    Production

禁止修改：

-   Parser Layer
-   Canonical Model
-   Validation Rules

------------------------------------------------------------------------

# 5. Pre-Publish Validation

发布前必须确认：

## Question Paper

检查：

-   validationStatus = PASS
-   completenessStatus = PASS
-   documentRole = question_paper
-   publishStatus = READY_TO_PUBLISH

## Mark Scheme

检查：

-   validationStatus = PASS
-   completenessStatus = PASS
-   documentRole = mark_scheme
-   publishStatus = READY_TO_PUBLISH

## Completeness Gate

必须全部 PASS：

    questionCoverage
    leafCoverage
    markCoverage
    responseAreaCoverage
    sourceTraceCoverage
    canonicalStructureCompleteness

------------------------------------------------------------------------

# 6. Production Update Strategy

PR-034 必须保持：

    productionWrite = true

仅允许新增：

    0478-2021-MJ-11
    0478-2021-MJ-12

禁止：

-   overwrite existing papers
-   modify 2023 production data
-   update unrelated records

------------------------------------------------------------------------

# 7. Regression Requirements

Production 更新后必须执行：

## Existing Regression

确认：

    Phase 1

    20 / 20 PASS

    Phase 2

    120 / 120 PASS

------------------------------------------------------------------------

## Historical Fix Verification

必须保持：

    PR-030 PASS

    Response Area Mapping

    PR-031 PASS

    Legacy Glyph Classification

    PR-032 PASS

    Mark Sum Validation

------------------------------------------------------------------------

# 8. Production Integrity Check

发布前：

保存：

    production-store-before.sha256

发布后：

保存：

    production-store-after.sha256

验证：

新增数据符合预期。

检查：

-   existing production records unchanged
-   published count increased only by target batch
-   no unexpected mutation

------------------------------------------------------------------------

# 9. Expected Result

成功后：

Production:

新增：

    0478-2021-MJ-11

    0478-2021-MJ-12

保持：

    Parser:
    unchanged

    Canonical:
    unchanged

    Staging:
    unchanged

------------------------------------------------------------------------

# 10. Follow-up Plan

PR-034 完成后：

进入下一阶段：

    PR-035

    0478 Remaining Eligible Expansion

候选：

    0478-2020-MJ-11
    0478-2020-MJ-12
    0478-2020-MJ-13
    0478-2020-MJ-21
    0478-2020-MJ-22
    0478-2020-MJ-23

但必须：

-   分 batch
-   每次 production regression
-   保持 production safety

不要一次性扩大发布范围。
