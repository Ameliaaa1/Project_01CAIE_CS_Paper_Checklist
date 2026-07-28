# PR-036 0478-2020-MJ-BATCH-02 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-036

**Title**

0478-2020-MJ-BATCH-02 Production Expansion

**Objective**

将 PR-033 Multi-Year Expansion Preparation 中已经验证通过的下一批 0478
数据发布到 Production。

本 PR 延续：

-   PR-034 Production Expansion Batch 01
-   PR-035 Production Expansion Batch 01

采用相同发布流程：

    Validated Staging Artifacts

    ↓

    Preflight Validation

    ↓

    Production Publish

    ↓

    Integrity Verification

    ↓

    Regression Check

本 PR 不修改 Parser，不修改 Canonical Model，不修改 Staging Pipeline。

------------------------------------------------------------------------

# 2. Scope

## Included

本次发布范围：

  Year   Session   Component
  ------ --------- -----------
  2020   M/J       13
  2020   M/J       21

对应：

    0478-2020-MJ-13
    0478-2020-MJ-21

------------------------------------------------------------------------

## Excluded

以下内容不属于 PR-036：

-   0478-2020 其他 component
-   2021 remaining expansion
-   2022 expansion
-   9618 expansion
-   9709 Mathematics support
-   Parser architecture changes
-   Canonical Model changes
-   Response Area Pipeline changes
-   TEXT QUALITY Pipeline changes

------------------------------------------------------------------------

# 3. Input Source

PR-036 输入来自：

    PR-033 Multi-Year Expansion Preparation

要求：

每个 component 必须已经满足：

    PDF available

    +

    Staging artifact exists

    +

    Validation PASS

    +

    Completeness PASS

    +

    READY_TO_PUBLISH

------------------------------------------------------------------------

# 4. Architecture Boundary

当前稳定架构：

    PDF

    ↓

    Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Production

PR-036 只执行：

    Staging

    ↓

    Production

禁止修改：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline

------------------------------------------------------------------------

# 5. Preflight Validation

发布前检查：

## Question Paper

必须：

    documentRole = question_paper

    validationStatus = PASS

    completenessStatus = PASS

    publishStatus = READY_TO_PUBLISH

------------------------------------------------------------------------

## Mark Scheme

必须：

    documentRole = mark_scheme

    validationStatus = PASS

    completenessStatus = PASS

    publishStatus = READY_TO_PUBLISH

------------------------------------------------------------------------

## Completeness Gate

全部 PASS：

    questionCoverage

    leafCoverage

    markCoverage

    responseAreaCoverage

    sourceTraceCoverage

    canonicalStructureCompleteness

------------------------------------------------------------------------

# 6. Production Write Strategy

PR-036：

    productionWrite = true

允许新增：

    0478-2020-MJ-13-QP
    0478-2020-MJ-13-MS

    0478-2020-MJ-21-QP
    0478-2020-MJ-21-MS

禁止：

-   修改已有 production records
-   覆盖 PR-027 / PR-028 / PR-034 / PR-035 数据
-   修改 staging artifact

------------------------------------------------------------------------

# 7. Integrity Verification

发布前：

保存：

    production-store-before.sha256

发布后：

保存：

    production-store-after.sha256

验证：

    existingRecordsUnchanged = true

同时确认：

-   production snapshot 正确保存
-   staging hash unchanged
-   batch identity 正确
-   QP-MS pairing 正确

------------------------------------------------------------------------

# 8. Regression Requirements

必须执行：

## Existing Regression

    Phase 1

    20 / 20 PASS

    Phase 2

    120 / 120 PASS

------------------------------------------------------------------------

## Historical Fix Regression

保持：

    PR-030 PASS

    Response Area Mapping

    PR-031 PASS

    Legacy Glyph Classification

    PR-032 PASS

    Mark Sum Validation

------------------------------------------------------------------------

## Production Verification

检查：

    Question Finder

    Knowledge Checklist

    Mark Scheme Search

    AI Retrieval

    Open Original Question

    QP-MS Correspondence

全部：

    PASS

------------------------------------------------------------------------

# 9. Expected Production Change

预计新增：

## Papers

    +4

包括：

    QP13
    MS13

    QP21
    MS21

其他变化：

根据 staging 实际内容验证：

-   question records
-   leaf questions
-   response areas
-   mark scheme entries
-   pairings

------------------------------------------------------------------------

# 10. Implementation Notes

PR-036 使用参数化 production expansion script。

执行时必须明确：

    batchId

    year

    components

    productionWrite confirmation

避免依赖默认值。

发布前先执行：

    preflight only

确认：

    READY_TO_PUBLISH

之后再执行：

    --confirm

------------------------------------------------------------------------

# 11. Completion Criteria

PR-036 完成条件：

    Production Write Success

    +

    Integrity Check PASS

    +

    Frontend Verification PASS

    +

    Regression PASS

------------------------------------------------------------------------

# 12. Follow-up Plan

PR-036 完成后：

进入：

    0478 Remaining Multi-Year Expansion

下一批继续根据：

-   staging completeness
-   validation status
-   production coverage

选择最小风险 batch。

保持：

    Small Batch

    ↓

    Validation

    ↓

    Publish

    ↓

    Regression

不要一次扩大 production 变更范围。
