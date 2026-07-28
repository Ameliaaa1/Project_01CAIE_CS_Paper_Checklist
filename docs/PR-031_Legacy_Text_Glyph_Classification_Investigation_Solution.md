# PR-031_Legacy_Text_Glyph_Classification_Investigation_Solution

## PR Title

Legacy Text Glyph Classification Investigation for 0478_s23_qp_21

------------------------------------------------------------------------

# 1. Background

当前项目状态：

``` text
Phase 1 Validation
        PASS

Phase 2 Validation
        PASS

Canonical Completeness Gate
        PASS

Production Pilot
        PASS

Production Expansion Infrastructure
        PASS
```

当前进入：

``` text
Issue Resolution Round 2
```

已完成：

-   PR-030 Response Area Mapping Fix

剩余阻塞：

``` text
0478-2023-MJ-21
```

------------------------------------------------------------------------

# 2. Current Problem

PR-028 Production Expansion 检测：

``` text
0478-2023-MJ-21
```

状态：

``` text
BLOCKED
```

原因：

``` text
SUSPICIOUS_GLYPHS_REMAIN
```

该问题阻止：

``` text
Production Expansion Eligibility
```

------------------------------------------------------------------------

# 3. Important Constraint

该问题不是：

-   Parser Architecture Failure
-   Canonical Schema Failure
-   Production Failure

当前：

-   Question Parsing 正常
-   Canonical Structure 正常
-   Completeness Gate 可以通过

问题位于：

``` text
TEXT QUALITY Pipeline
```

------------------------------------------------------------------------

# 4. Current Pipeline

调查范围：

``` text
PDF

↓

PyMuPDF rawdict extraction

↓

Span extraction

↓

Glyph Classification

↓

Canonical Text Builder

↓

TEXT Quality Metrics

↓

Validation
```

目标：

找到 suspicious glyph 来源。

------------------------------------------------------------------------

# 5. PR-031 Objective

PR-031 唯一目标：

调查并修复：

``` text
SUSPICIOUS_GLYPHS_REMAIN
```

使：

``` text
0478_s23_qp_21
```

满足：

``` text
Text Quality Validation PASS
```

------------------------------------------------------------------------

# 6. Scope

## Allowed Changes

允许：

-   Legacy glyph classification rule 修正
-   特殊字符识别规则调整
-   Legacy PDF fixture 增加
-   TEXT quality regression test 增加
-   Glyph classification debug tooling

------------------------------------------------------------------------

## Forbidden Changes

禁止：

-   重写 PyMuPDF extraction
-   修改 Canonical Schema
-   修改 Question Parser
-   修改 Question Split
-   修改 Stable Question ID
-   删除 suspicious glyph metric
-   全局关闭 glyph validation
-   降低所有 PDF 的 quality threshold
-   修改 Production Expansion Logic

------------------------------------------------------------------------

# 7. Investigation Process

必须按照：

``` text
Raw PDF

↓

Raw Span

↓

Glyph Classification

↓

Normalized Text

↓

Suspicious Glyph Metric

↓

Validation Result
```

定位。

------------------------------------------------------------------------

# 8. Root Cause Investigation Checklist

## Step 1: Identify Suspicious Glyph

记录：

-   Unicode value
-   character representation
-   font
-   size
-   page number
-   span location

例如：

``` json
{
  "char": "...",
  "unicode": "...",
  "page": 3,
  "font": "..."
}
```

------------------------------------------------------------------------

## Step 2: Determine Glyph Type

判断：

该字符属于：

### Case A

真实异常：

例如：

-   OCR artifact
-   corrupted encoding
-   extraction noise

处理：

增加过滤规则。

------------------------------------------------------------------------

### Case B

合法 PDF 符号：

例如：

-   mathematical symbol
-   bullet
-   formatting marker
-   Cambridge template symbol

处理：

增加合法 glyph classification。

------------------------------------------------------------------------

### Case C

Extraction inconsistency

例如：

同一 PDF：

正常：

``` text
font A -> symbol
```

异常：

``` text
font B -> suspicious
```

处理：

增加 font/layout aware rule。

------------------------------------------------------------------------

# 9. Fix Strategy

优先：

## Option 1

修正 glyph classification。

例如：

``` text
Known Cambridge symbol

↓

classified as valid
```

------------------------------------------------------------------------

## Option 2

增加 legacy PDF layout handling。

仅针对：

``` text
0478_s23_qp_21
```

对应模板。

------------------------------------------------------------------------

禁止：

全局：

``` text
ignore all suspicious glyphs
```

原因：

可能隐藏：

-   OCR error
-   corrupted extraction
-   missing content

------------------------------------------------------------------------

# 10. Regression Fixture

必须增加：

``` text
0478_s23_qp_21
```

Expected:

``` json
{
  "textQualityStatus": "PASS",
  "suspiciousGlyphCount": 0,
  "normalizedSuspiciousGlyphCount": 0
}
```

------------------------------------------------------------------------

# 11. Regression Requirements

必须保持：

## Phase 1

``` text
20 / 20 PASS
```

------------------------------------------------------------------------

## Phase 2

``` text
120 / 120 PASS
```

------------------------------------------------------------------------

## Existing Production Pilot

保持：

``` text
0478-2023-MJ-12

PASS
```

------------------------------------------------------------------------

重点检查：

-   no text corruption
-   no removed valid symbols
-   no new suspicious glyph regression

------------------------------------------------------------------------

# 12. Acceptance Criteria

PR-031 完成条件：

-   Root Cause identified
-   Glyph classification rule fixed
-   0478_s23_qp_21 validation PASS
-   Suspicious glyph metric PASS
-   Golden Fixture added
-   Regression Test added
-   Phase 1 unchanged
-   Phase 2 unchanged
-   Stable modules unchanged

------------------------------------------------------------------------

# 13. After PR-031

重新运行：

``` text
PR028-0478-2023-MJ
```

预期：

当前：

``` text
Component 21:
BLOCKED
```

变为：

``` text
Component 21:
ELIGIBLE
```

当前：

``` text
ELIGIBLE:3
BLOCKED:2
```

变为：

``` text
ELIGIBLE:4
BLOCKED:1
```

之后继续：

``` text
PR-032
Mark Sum Validation Investigation
```

------------------------------------------------------------------------

# Final Decision

当前问题：

``` text
Legacy Text Glyph Classification Issue
```

处理原则：

``` text
Find Root Cause

↓

Minimal Classification Fix

↓

Regression

↓

Resume Production Expansion
```

保持：

``` text
One PR One Problem

Minimal Change Principle

No Stable Module Regression
```

END
