# PR-037 0478-2020-MJ-BATCH-03 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-037

**Title**

0478-2020-MJ-BATCH-03 Production Expansion

**Objective**

将 PR-033 Multi-Year Expansion Preparation 中已经验证通过的下一批 0478
数据发布到 Production。

本 PR 延续：

-   PR-034 Production Expansion Batch 01
-   PR-035 Production Expansion Batch 01
-   PR-036 Production Expansion Batch 02

采用相同流程：

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
  2020   M/J       22
  2020   M/J       23

对应：

    0478-2020-MJ-22
    0478-2020-MJ-23

------------------------------------------------------------------------

## Excluded

以下内容不属于 PR-037：

-   0478-2020 其他 component
-   2021 expansion
-   2022 expansion
-   9618 Computer Science expansion
-   9709 Mathematics support
-   Parser architecture changes
-   Canonical Model changes
-   Response Area Pipeline changes
-   TEXT QUALITY Pipeline changes

------------------------------------------------------------------------

# 3. Input Source

PR-037 输入来自：

    PR-033 Multi-Year Expansion Preparation

以及已验证的 production expansion workflow。

每个 artifact 必须满足：

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

PR-037 只执行：

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

发布前必须验证：

## Question Paper

要求：

    documentRole = question_paper

    validationStatus = PASS

    completenessStatus = PASS

    publishStatus = READY_TO_PUBLISH

------------------------------------------------------------------------

## Mark Scheme

要求：

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

PR-037：

    productionWrite = true

允许新增：

    0478-2020-MJ-22-QP
    0478-2020-MJ-22-MS

    0478-2020-MJ-23-QP
    0478-2020-MJ-23-MS

禁止：

-   修改已有 production records
-   覆盖 PR-027 / PR-028 / PR-034 / PR-035 / PR-036 数据
-   修改 staging artifact

------------------------------------------------------------------------

# 7. Integrity Verification

发布前保存：

    production-store-before.sha256

发布后保存：

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

## Frontend Verification

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

    QP22
    MS22

    QP23
    MS23

其他变化根据 staging 实际验证：

-   question records
-   leaf questions
-   response areas
-   mark scheme entries
-   pairings

------------------------------------------------------------------------

# 10. Completion Criteria

PR-037 完成条件：

    Production Write Success

    +

    Integrity Check PASS

    +

    Frontend Verification PASS

    +

    Regression PASS

------------------------------------------------------------------------

# 11. Current Expansion Status

完成 PR-037 后：

0478 May/June coverage:

    2023:
    11 12 13 21 22 23

    2021:
    11 12

    2020:
    11 12 13 21 22 23

2020 M/J 全 component 完成。

------------------------------------------------------------------------

# 12. Follow-up Plan

PR-037 完成后进入：

    0478 Remaining Multi-Year Expansion

下一阶段根据：

-   staging completeness
-   validation status
-   production coverage

选择下一批。

继续保持：

    Small Batch

    ↓

    Validation

    ↓

    Publish

    ↓

    Regression

避免扩大单次 production change 范围。
