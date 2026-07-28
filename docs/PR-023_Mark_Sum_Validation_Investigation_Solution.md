# PR-023_Mark_Sum_Validation_Investigation_Solution

## PR Title

Mark Sum Validation Investigation

------------------------------------------------------------------------

# 1. Objective

调查并解决 Phase 2 ingestion 中出现的：

    MARK_SUM_MISMATCH

问题。

本 PR 的目标：

定位 Question Paper 中：

PDF ↓ Mark Extraction ↓ Canonical Marks ↓ Staging Validation

链路中的 Root Cause。

注意：

本 PR 首先执行 Investigation。

不要直接修改 Parser 或 Validation Rule。

------------------------------------------------------------------------

# 2. Current Status

Phase 2 current result:

    Total PDFs: 120

    Success: 116

    Failed: 4

    Success Rate: 96.67%

Current remaining failures:

    MARK_SUM_MISMATCH: 3

    BACK_MATTER_INCLUDED: 1

本 PR 只处理：

    MARK_SUM_MISMATCH

------------------------------------------------------------------------

# 3. Affected Documents

Affected files:

    0478_w19_qp_23.pdf

    0478_s20_qp_22.pdf

    9618_w21_qp_41.pdf

共同特征：

    documentRole = question_paper
    stage = validation

------------------------------------------------------------------------

# 4. Problem Description

当前 Validation 发现：

    Extracted marks != Expected total marks

导致：

    MARK_SUM_MISMATCH

失败位置：

    STAGING_VALIDATION

但是：

不要认为 Validation 是 Root Cause。

Validation 只是第一个发现问题的位置。

真实 Root Cause 可能位于：

    PDF Extraction

    ↓

    Question Parsing

    ↓

    Mark Extraction

    ↓

    Canonical Marks Generation

    ↓

    Validation

------------------------------------------------------------------------

# 5. Root Cause Investigation Plan

## Step 1: Collect Debug Information

针对三个失败 PDF 输出：

需要检查：

-   PDF page text
-   extracted marks
-   question IDs
-   leaf question marks
-   total calculated marks
-   expected marks
-   staging JSON

Example:

``` json
{
  "questionId": "Q1(a)",
  "extractedMark": 2,
  "expectedMark": 3,
  "sourcePage": 2
}
```

------------------------------------------------------------------------

# 6. Investigation Areas

## Area A: Mark Extraction Error

检查：

是否存在：

-   OCR/text extraction missing mark
-   mark box parsing failure
-   bracket mark loss
-   footer/header interference

Example:

PDF:

    (a) Explain the process [3]

是否正确生成：

    Q1(a).marks = 3

------------------------------------------------------------------------

## Area B: Question Split Interaction

确认：

Question Split 没有影响 mark association。

保持：

    Q1

    ↓

    Q1(a)

    ↓

    Q1(a)(ii)

检查：

mark 是否绑定正确 leaf question。

------------------------------------------------------------------------

## Area C: Canonical Marks Generation

检查：

Parser 输出：

↓

Canonical Model

↓

Staging JSON

过程中：

mark 是否丢失或变化。

------------------------------------------------------------------------

## Area D: Validation Rule

最后检查：

Validation 逻辑是否适用于特殊 PDF layout。

禁止：

看到 mismatch 就降低 validation strictness。

------------------------------------------------------------------------

# 7. Scope

## Allowed Changes

本 PR 允许：

-   增加 debug logging
-   增加 staging inspection tools
-   增加 golden fixture
-   增加 regression test
-   修复确认后的最小 parser/staging bug

------------------------------------------------------------------------

# 8. Out of Scope

禁止：

## 不修改 Question Split

保持稳定。

------------------------------------------------------------------------

## 不修改 Stable Question ID

保持稳定。

------------------------------------------------------------------------

## 不修改 Parent/Leaf Model

保持稳定。

------------------------------------------------------------------------

## 不修改 Document Role Router

PR-020 已验证。

------------------------------------------------------------------------

## 不修改 Barcode Region Classification

PR-022 已完成。

------------------------------------------------------------------------

## 不修改 Validation Rule

除非 Investigation 证明 validation 本身错误。

------------------------------------------------------------------------

# 9. Implementation Steps

## Step 1

生成三个失败 PDF 的完整 debug artifact：

包含：

-   raw extraction result
-   parsed questions
-   extracted marks
-   canonical marks
-   staging JSON

------------------------------------------------------------------------

## Step 2

逐文件比较：

Expected:

    PDF displayed marks

vs

    Canonical marks

vs

    Validation expected marks

------------------------------------------------------------------------

## Step 3

确定 Root Cause Category

只能归类为：

### Category 1

Parser extraction bug

或者：

### Category 2

Canonical mapping bug

或者：

### Category 3

Validation assumption bug

------------------------------------------------------------------------

## Step 4

根据 Root Cause 创建后续修复 PR。

如果：

Parser bug:

创建 parser fix PR

如果：

Canonical mapping bug:

创建 staging/canonical fix PR

如果：

Validation bug:

创建 validation fix PR

不要在 PR-023 内混合多个修改。

------------------------------------------------------------------------

# 10. Golden Fixture Requirements

新增三个 fixture:

    0478_w19_qp_23.pdf

    0478_s20_qp_22.pdf

    9618_w21_qp_41.pdf

保存：

-   expected total marks
-   extracted marks
-   question structure
-   validation result

------------------------------------------------------------------------

# 11. Regression Test

要求：

Before:

    MARK_SUM_MISMATCH = FAIL

After investigation:

需要确认：

    Root Cause identified

如果包含修复：

    MARK_SUM_MISMATCH = PASS

------------------------------------------------------------------------

# 12. Acceptance Criteria

PR-023 完成条件：

## Investigation

-   三个失败 PDF 完成 debug
-   Root Cause 明确
-   修复位置明确

## Safety

保持：

-   Question Split 不变
-   Question ID 不变
-   Canonical Schema 不变
-   Response Area Pipeline 不变
-   Document Role Router 不变

## Testing

完成：

-   Golden Fixture
-   Regression Test

------------------------------------------------------------------------

# 13. Final Decision

执行：

    Investigation First
    Minimal Fix Later

禁止：

    直接修改 parser

禁止：

    降低 validation 标准

禁止：

    重构 pipeline

PR-023 唯一目标：

找到 MARK_SUM_MISMATCH 的真实 Root Cause，并为后续最小修复提供依据。

END
