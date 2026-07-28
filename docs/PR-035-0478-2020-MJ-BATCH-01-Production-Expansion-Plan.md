# PR-035 0478 Production Expansion Batch 02 Implementation Plan

## 1. PR Overview

**PR ID**

PR-035

**Title**

0478-2020-MJ-BATCH-01 Production Expansion

**Objective**

将 PR-033 Multi-Year Expansion Preparation 中已经验证通过的下一批 0478
数据发布到 Production。

本 PR 延续 PR-034 的发布模式：

    Validated Staging Artifacts

    ↓

    Production Publish

    ↓

    Production Verification

    ↓

    Regression Check

本 PR 不修改 Parser，不修改 Canonical Model，不修改 Staging Pipeline。

------------------------------------------------------------------------

# 2. Scope

## Included

发布范围：

  Year   Session   Component
  ------ --------- -----------
  2020   M/J       11
  2020   M/J       12

对应：

    0478-2020-MJ-11
    0478-2020-MJ-12

------------------------------------------------------------------------

## Excluded

以下内容不属于 PR-035：

-   0478-2020 其他 component
-   2021 remaining components
-   2022 expansion
-   2023 republish
-   9618 expansion
-   9709 Mathematics support
-   Parser architecture changes
-   Canonical Model changes
-   Response Area Pipeline changes

------------------------------------------------------------------------

# 3. Input Source

PR-035 输入来自：

    PR-033 Multi-Year Expansion Preparation

以及：

    PR-034 Production Expansion Pattern

要求：

每个 artifact 必须满足：

    PDF exists

    +

    Staging exists

    +

    Validation PASS

    +

    Completeness PASS

    +

    READY_TO_PUBLISH

------------------------------------------------------------------------

# 4. Architecture Boundary

当前数据流：

    PDF

    ↓

    Parser

    ↓

    Canonical Model

    ↓

    Staging

    ↓

    Production

PR-035 只执行：

    Staging

    ↓

    Production

禁止修改：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question
-   Marks Validation
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

PR-035：

    productionWrite = true

允许新增：

    0478-2020-MJ-11-QP
    0478-2020-MJ-11-MS

    0478-2020-MJ-12-QP
    0478-2020-MJ-12-MS

禁止：

-   修改已有 production record
-   覆盖 PR-027 / PR-028 / PR-034 数据
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

-   staging hash unchanged
-   batch identity correct
-   pairing relationship correct

------------------------------------------------------------------------

# 8. Regression Requirements

必须执行：

## Historical Regression

    Phase 1

    20 / 20 PASS

    Phase 2

    120 / 120 PASS

------------------------------------------------------------------------

## Issue Resolution Regression

保持：

    PR-030 PASS

    Response Area Mapping

    PR-031 PASS

    Legacy Glyph Classification

    PR-032 PASS

    Mark Sum Validation

------------------------------------------------------------------------

# 9. Expected Production Change

预计新增：

## Papers

    +4

包括：

    QP11
    MS11
    QP12
    MS12

------------------------------------------------------------------------

其他数量：

根据 staging 实际内容生成。

必须通过：

-   question count verification
-   leaf question verification
-   response area verification
-   mark scheme verification

------------------------------------------------------------------------

# 10. Frontend Verification

发布后验证：

    Question Finder

    Knowledge Checklist

    Mark Scheme Search

    AI Retrieval

    Open Original Question

    QP-MS Correspondence

全部：

    PASS

------------------------------------------------------------------------

# 11. Completion Criteria

PR-035 完成条件：

    Production Write Success

    +

    Integrity Check PASS

    +

    Frontend Verification PASS

    +

    Regression PASS

------------------------------------------------------------------------

# 12. Follow-up Plan

PR-035 完成后：

进入下一阶段：

    0478 Remaining Multi-Year Expansion

后续候选：

    2021 remaining components

    2022 components

继续保持：

    Small Batch

    ↓

    Validation

    ↓

    Publish

    ↓

    Regression

避免一次性扩大 production 变更范围。
