# PR-022_Legacy_Mark_Scheme_Barcode_Region_Classification_Support_Solution

## PR Title

Legacy Mark Scheme Barcode Region Classification Support

------------------------------------------------------------------------

## 1. Objective

解决 Phase 2 ingestion 中出现的：

`BARCODE_TEXT_PRESENT`

问题。

目标：

修复旧年份 CAIE Mark Scheme PDF 中 barcode / control text 被错误进入
Canonical Text 的问题。

本 PR 只处理：

PDF Layout Compatibility → Region Classification → Barcode Exclusion

不涉及系统架构调整。

------------------------------------------------------------------------

## 2. Current Status

Phase 2 Batch Test:

-   Total PDFs: 120
-   Success: 109
-   Failed: 11
-   Success Rate: 90.83%

当前架构状态：

-   Document Role Router: PASS
-   Question Paper Pipeline: PASS
-   Mark Scheme Pipeline: PASS
-   TEXT Quality Pipeline: PASS
-   Response Area Pipeline: PASS

未发现：

-   architectureFailures
-   documentRoleRegressions

------------------------------------------------------------------------

## 3. Issue Description

错误：

`BARCODE_TEXT_PRESENT`

数量：

7

集中：

-   syllabus: 0478
-   year: 2019
-   documentRole: mark_scheme

Affected PDFs:

-   0478_m19_ms_22.pdf
-   0478_s19_ms_21.pdf
-   0478_s19_ms_22.pdf
-   0478_s19_ms_23.pdf
-   0478_w19_ms_21.pdf
-   0478_w19_ms_22.pdf
-   0478_w19_ms_23.pdf

------------------------------------------------------------------------

## 4. Root Cause Analysis

确认：

问题不是：

-   Canonical Model
-   Question Parser
-   Mark Scheme Parser
-   Document Role Router
-   TEXT Quality Architecture

失败位置：

    Span Extraction
            |
            v
    Region Classification
            |
            v
    Canonical Text Builder

当前流程：

    PDF
     |
     v
    PyMuPDF rawdict
     |
     v
    Span extraction
     |
     v
    Region Classification
     |
     v
    Barcode span incorrectly classified as normal text
     |
     v
    Canonical Text
     |
     v
    Validation Failure

预期：

    PDF
     |
     v
    Span extraction
     |
     v
    Region Classification
     |
     v
    BARCODE_REGION
     |
     v
    Excluded
     |
     v
    Canonical Text
     |
     v
    Validation PASS

------------------------------------------------------------------------

## 5. Scope

### Allowed Changes

允许修改：

### Region Classification

增加 legacy Mark Scheme barcode 识别规则。

### Barcode Detection

增加针对旧版 PDF layout 的检测：

-   footer/header location
-   bbox position
-   repeated control text
-   abnormal alphanumeric pattern
-   font/layout signal

------------------------------------------------------------------------

## 6. Out of Scope

禁止修改：

### Question Split

保持稳定：

Q1\
Q1(a)\
Q1(b)\
Q2(c)(ii)

### Stable Question ID

保持稳定。

### Parent / Leaf Question Model

保持稳定。

### Canonical Schema

禁止修改：

-   Question
-   Leaf Question
-   Response Area
-   Mark Scheme
-   Source Trace

### TEXT Quality Architecture

禁止重构：

    PyMuPDF rawdict
            |
            v
    Span
            |
            v
    Region Classification
            |
            v
    Canonical Text Builder
            |
            v
    Metric

只允许增强 Region Classification。

------------------------------------------------------------------------

## 7. Implementation Plan

### Step 1: Add Debug Instrumentation

针对失败 PDF 输出：

-   span text
-   bbox
-   page number
-   font information
-   classification result

用于确认误分类模式。

------------------------------------------------------------------------

### Step 2: Add Legacy Barcode Rule

规则：

    Existing Classification
            |
            v
    Legacy Barcode Detection
            |
            v
    BARCODE_REGION

不要全局删除 suspicious text。

必须结合：

-   documentRole
-   location
-   text pattern
-   layout

------------------------------------------------------------------------

### Step 3: Verify Canonical Text Exclusion

确认：

BARCODE_REGION

不会进入：

    canonicalText

------------------------------------------------------------------------

### Step 4: Add Golden Fixtures

新增：

-   0478_m19_ms_22.pdf
-   0478_s19_ms_21.pdf
-   0478_s19_ms_22.pdf
-   0478_s19_ms_23.pdf
-   0478_w19_ms_21.pdf
-   0478_w19_ms_22.pdf
-   0478_w19_ms_23.pdf

------------------------------------------------------------------------

## 8. Regression Test

要求：

Before:

    BARCODE_TEXT_PRESENT = FAIL

After:

    BARCODE_TEXT_PRESENT = PASS

同时保证：

-   questionCount unchanged
-   markSchemeEntryCount unchanged
-   canonical schema unchanged

------------------------------------------------------------------------

## 9. Validation

Target Regression:

7 PDFs:

Expected:

    7 PASS
    0 BARCODE_TEXT_PRESENT

Phase 2 Regression:

重新运行 120 PDFs。

要求：

    architectureFailures = []

    documentRoleRegressions = []

    No new P0

------------------------------------------------------------------------

## 10. Risk

风险等级：

Low

原因：

修改点：

    Region Classification

不会影响：

-   Parser Schema
-   Database
-   Frontend
-   Stable Question Pipeline

主要风险：

过度过滤正常文本。

避免：

不要使用：

    delete suspicious text

必须使用组合条件：

    documentRole
    +
    location
    +
    pattern
    +
    layout

------------------------------------------------------------------------

## 11. Acceptance Criteria

完成条件：

-   Legacy barcode 不进入 Canonical Text
-   BARCODE_TEXT_PRESENT 消失
-   Golden Fixture 添加
-   Regression Test 添加
-   Phase2 batch 无新增失败

保持：

-   Question Split 不变
-   Stable Question ID 不变
-   Parent/Leaf Model 不变
-   Response Area Pipeline 不变
-   Document Role Router 不变

------------------------------------------------------------------------

## Final Decision

执行：

Minimal Region Classification Enhancement

禁止：

Pipeline Rewrite

禁止：

Canonical Model Change

PR-022 唯一目标：

解决 Legacy Mark Scheme Barcode Region Classification 问题。
