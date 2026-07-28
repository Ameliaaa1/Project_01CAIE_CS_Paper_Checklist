# PR-024_Back_Matter_Detection_Investigation_Solution

## PR Title

Back Matter Detection Investigation

------------------------------------------------------------------------

## 1. Objective

解决 Phase 2 ingestion 中剩余的：

`BACK_MATTER_INCLUDED`

问题。

目标：

调查并修复 Question Paper 中 Appendix / Candidate Information / Back
Matter 被错误进入 Canonical Text 的问题。

------------------------------------------------------------------------

## 2. Current Status

Current Phase 2:

    Total PDFs: 120
    Success: 119
    Failed: 1
    Success Rate: 99.17%

Remaining failure:

    BACK_MATTER_INCLUDED: 1

本 PR 只处理 BACK_MATTER_INCLUDED。

------------------------------------------------------------------------

## 3. Affected Document

File:

    0478_m21_qp_12.pdf

Metadata:

    Syllabus: 0478
    Session: 2021 March
    Component: 12
    Document Role: question_paper

Failure stage:

    validation

------------------------------------------------------------------------

## 4. Root Cause Investigation

当前问题链路：

    PDF
     |
     v
    Page Classification
     |
     v
    Question Extraction
     |
     v
    Canonical Text Builder
     |
     v
    Back Matter Included
     |
     v
    Validation Failure

需要定位：

-   Page Classification 是否错误
-   Question Boundary 是否扩展过长
-   Legacy layout 是否缺少 back matter detection

------------------------------------------------------------------------

## 5. Scope

允许修改：

-   Page Classification
-   Back Matter Detection
-   Regression Fixture

禁止修改：

-   Question Split
-   Stable Question ID
-   Parent/Leaf Model
-   Mark Extraction
-   PR-022 Barcode Classification
-   PR-025 Boundary Detection
-   Canonical Schema

------------------------------------------------------------------------

## 6. Implementation Plan

### Step 1: Debug Page Classification

输出：

-   page number
-   page role
-   extracted text
-   classification decision

------------------------------------------------------------------------

### Step 2: Identify Contaminated Text

确认哪些内容进入：

    Q2
    Q2-B

但实际属于：

-   appendix
-   instruction
-   candidate information

------------------------------------------------------------------------

### Step 3: Add Back Matter Detection Rule

规则必须基于：

    page position
    +
    layout
    +
    heading pattern
    +
    text structure

不要使用全局删除规则。

------------------------------------------------------------------------

### Step 4: Verify Canonical Text

确认 Back Matter 不进入：

    canonicalText

------------------------------------------------------------------------

## 7. Golden Fixture

新增：

    0478_m21_qp_12.pdf

保存：

-   page classification output
-   boundary output
-   canonical text result
-   validation result

------------------------------------------------------------------------

## 8. Regression Test

Before:

    BACK_MATTER_INCLUDED = FAIL

After:

    BACK_MATTER_INCLUDED = PASS

同时保证：

-   question count unchanged
-   leaf question count unchanged
-   marks unchanged

------------------------------------------------------------------------

## 9. Validation

重新运行 Phase 2 ingestion。

Expected:

    failedCount = 0

保持：

    architectureFailures = []
    documentRoleRegressions = []
    textQualityRegressions = []

------------------------------------------------------------------------

## 10. Acceptance Criteria

完成条件：

-   0478_m21_qp_12.pdf PASS
-   BACK_MATTER_INCLUDED = 0
-   Golden Fixture added
-   Regression Test added
-   No new validation failures

保持：

-   PR-020 unchanged
-   PR-022 unchanged
-   PR-025 unchanged
-   Canonical Model unchanged

------------------------------------------------------------------------

## Final Decision

执行：

    Minimal Back Matter Detection Enhancement

禁止：

    Pipeline Rewrite

禁止：

    Question Parser Rewrite

PR-024 唯一目标：

修复 Back Matter 进入 Question Text 的问题。

END
