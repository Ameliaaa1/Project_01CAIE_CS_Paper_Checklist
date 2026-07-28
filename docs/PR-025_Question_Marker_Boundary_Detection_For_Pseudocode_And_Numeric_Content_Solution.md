# PR-025_Question_Marker_Boundary_Detection_For_Pseudocode_And_Numeric_Content_Solution

## PR Title

Question Marker Boundary Detection for Pseudocode and Numeric Content

------------------------------------------------------------------------

# 1. Objective

解决 Phase 2 ingestion 中剩余的：

    MARK_SUM_MISMATCH

问题。

本 PR 针对：

    0478_s20_qp_22.pdf

中的：

    0478-2020-MJ-22-QP-Q18

进行最小范围修复。

目标：

修复 Question Boundary Detection 错误导致的：

    Question Split
            |
            v
    Leaf Question Generation
            |
            v
    Mark Sum Validation Failure

问题。

------------------------------------------------------------------------

# 2. Current Status

Phase 2 current result:

    Total PDFs: 120

    Success: 118

    Failed: 2

    Success Rate: 98.33%

Remaining issues:

    MARK_SUM_MISMATCH: 1

    BACK_MATTER_INCLUDED: 1

本 PR 只处理：

    MARK_SUM_MISMATCH

不处理：

    BACK_MATTER_INCLUDED

------------------------------------------------------------------------

# 3. Affected Document

File:

    0478_s20_qp_22.pdf

Question:

    0478-2020-MJ-22-QP-Q18

Current validation:

    Parent marks: 22

    Leaf sum: 18

    Validation: FAIL

------------------------------------------------------------------------

# 4. Root Cause Analysis

## Confirmed Root Cause

问题不是：

-   Mark Extraction
-   Canonical Marks
-   Validation Rule

问题发生在：

    Question Marker Detection
            |
            v
    Question Boundary Detection
            |
            v
    Leaf Question Generation

------------------------------------------------------------------------

# 5. Failure Flow

Current:

    PDF

    ↓

    Span Extraction

    ↓

    Question Marker Detection

    ↓

    Incorrect boundary detection

    ↓

    Question text over-merged

    ↓

    Leaf question missing

    ↓

    Parent marks != leaf marks

    ↓

    MARK_SUM_MISMATCH

------------------------------------------------------------------------

# 6. Evidence

Affected Q18 当前包含异常文本：

    OUTPUT "There are..."

    ...

    This flowchart...

    ...

    Arrays are data structures...

    ...

    A database table...

说明：

多个独立题目内容被错误合并到同一个 question boundary。

结果：

Q18:

    declared marks = 22

但是：

    generated leaf marks = 18

------------------------------------------------------------------------

# 7. Suspected Trigger

Legacy question paper layout 中：

pseudocode / algorithm / table 内容包含大量数字。

例如：

    Line number

    Array index

    Table value

    Step number

    Mark value

当前 parser 可能错误认为：

    numeric token
    +
    text pattern

代表：

    question marker

导致：

错误 split 或错误 merge。

------------------------------------------------------------------------

# 8. Scope

## Allowed Changes

只允许修改：

    Question Marker Detection

或者：

    Question Boundary Detection

允许：

-   增加 marker context validation
-   增加 numeric token filtering
-   增加 pseudocode-aware boundary rule
-   增加 regression fixture

------------------------------------------------------------------------

# 9. Out of Scope

禁止修改：

## Mark Extraction

保持：

    mark parsing logic

------------------------------------------------------------------------

## Canonical Model

禁止修改：

-   Question
-   Leaf Question
-   Response Area
-   Mark Scheme
-   Source Trace

------------------------------------------------------------------------

## Validation Rule

不要：

降低 validation strictness。

Validation 当前行为正确。

------------------------------------------------------------------------

## TEXT Quality Pipeline

禁止修改：

    PyMuPDF rawdict

    ↓

    Span

    ↓

    Region Classification

    ↓

    Canonical Text Builder

------------------------------------------------------------------------

## PR-022 Barcode Fix

禁止修改：

    Barcode Region Classification

------------------------------------------------------------------------

# 10. Implementation Plan

## Step 1: Add Boundary Debug

针对：

    0478_s20_qp_22.pdf
    Q18

输出：

-   detected markers
-   rejected markers
-   boundary decision
-   source span

Example:

``` json
{
  "token": "4",
  "location": "pseudocode",
  "detectedAs": "question_marker",
  "decision": "rejected"
}
```

------------------------------------------------------------------------

# Step 2: Add Context Validation

Question marker 必须满足：

多个条件：

    token pattern

    +

    layout position

    +

    font/layout signal

    +

    surrounding text context

不能仅根据数字判断。

------------------------------------------------------------------------

# Step 3: Add Pseudocode Protection

对于：

-   pseudocode block
-   algorithm block
-   flowchart text
-   table content

禁止：

numeric token 直接触发 question boundary。

------------------------------------------------------------------------

# Step 4: Verify Leaf Generation

修复后确认：

Q18:

    parent marks = leaf marks

Expected:

    22 = 22

------------------------------------------------------------------------

# 11. Golden Fixture

新增：

    0478_s20_qp_22.pdf

保存：

-   question boundary output
-   leaf question structure
-   marks
-   validation result

------------------------------------------------------------------------

# 12. Regression Test

Before:

    0478_s20_qp_22.pdf

    MARK_SUM_MISMATCH = FAIL

After:

    0478_s20_qp_22.pdf

    MARK_SUM_MISMATCH = PASS

同时验证：

-   Question Split unchanged
-   Stable Question ID unchanged
-   Parent/Leaf model unchanged

------------------------------------------------------------------------

# 13. Validation

重新运行：

Phase 2:

    120 PDFs

Expected:

    MARK_SUM_MISMATCH = 0

保持：

    architectureFailures = []

    documentRoleRegressions = []

    textQualityRegressions = []

------------------------------------------------------------------------

# 14. Risk Assessment

## Medium Risk

原因：

Question Boundary 是核心解析模块。

但是：

修改范围限制为：

    marker detection only

------------------------------------------------------------------------

## Mitigation

必须：

-   增加 fixture
-   增加 regression test
-   不改变稳定 question split 行为

------------------------------------------------------------------------

# 15. Acceptance Criteria

完成条件：

\[ \] 0478_s20_qp_22.pdf PASS

\[ \] Q18 marks validation PASS

\[ \] Golden Fixture added

\[ \] Regression Test added

\[ \] No new MARK_SUM_MISMATCH

保持：

\[ \] PR-020 不受影响

\[ \] PR-022 不受影响

\[ \] Canonical Model 不变

------------------------------------------------------------------------

# Final Decision

执行：

    Minimal Question Boundary Detection Fix

禁止：

    Parser Rewrite

禁止：

    Validation Relaxation

PR-025 唯一目标：

修复 pseudocode / numeric content 导致的 Question Boundary Detection
错误。

END
