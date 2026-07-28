# Phase 7-C Generalized Parser Coverage Expansion Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 7-C
```

**Title**

``` text
Generalized Parser Coverage Expansion
```

## Objective

在完成：

``` text
9618 Final Closure

+

0478 Final Closure

+

9709 Final Closure
```

之后，进入 parser 泛化能力提升阶段。

Phase 7-C 的目标不是新增 syllabus 数据，而是提升系统对于不同 CAIE
文档结构的适应能力。

核心目标：

``` text
Current Stable Parser

↓

Identify Format Variations

↓

Improve Generalized Handling

↓

Add Regression Coverage

↓

Support Future Syllabus Expansion
```

------------------------------------------------------------------------

# 2. Current Stable State

当前已完成：

``` text
0478
✅ CLOSED

9618
✅ CLOSED

9709
✅ CLOSED
```

当前系统支持：

``` text
PDF

↓

Parser

↓

Canonical Model

↓

Staging

↓

Validation

↓

Production

↓

Frontend
```

------------------------------------------------------------------------

# 3. Phase Boundary

Phase 7-C 允许：

``` text
improve parser generalization

add parser diagnostics

add regression fixtures

improve document profile abstraction

improve validation coverage
```

禁止：

``` text
rewrite parser architecture

replace canonical model

modify frozen production data

create syllabus-specific hacks

weaken validation rules
```

------------------------------------------------------------------------

# 4. Main Goals

## Goal A

``` text
Reduce syllabus-specific logic
```

目标：

避免：

``` text
if syllabus == xxx
then special handling
```

增加：

``` text
generic document understanding
```

------------------------------------------------------------------------

## Goal B

``` text
Improve Layout Variation Handling
```

覆盖：

``` text
different question layouts

different mark scheme layouts

different response areas

different footer/header patterns
```

------------------------------------------------------------------------

## Goal C

``` text
Improve Future Onboarding Efficiency
```

目标：

降低新 syllabus 接入成本：

``` text
Document Profile

↓

Parser Compatibility

↓

Staging Validation
```

------------------------------------------------------------------------

# 5. Workstreams

## Phase 7-C-A Document Structure Generalization

目标：

增强：

``` text
Document Role Router

Question Paper Detection

Mark Scheme Detection
```

检查：

``` text
component variations

session variations

document naming variations
```

------------------------------------------------------------------------

## Phase 7-C-B Question Parsing Generalization

目标：

增强：

``` text
Question Split

Leaf Question Detection

Question Number Recognition
```

覆盖：

``` text
Q1

Q1(a)

Q1(b)(i)

Q2(c)(ii)
```

------------------------------------------------------------------------

## Phase 7-C-C Mark Scheme Generalization

目标：

增强：

``` text
Mark Extraction

Mark Group Detection

Identifier Handling
```

避免：

``` text
pseudocode identifier

array index

numeric reference
```

误判。

------------------------------------------------------------------------

## Phase 7-C-D Response Area Generalization

目标：

增强：

``` text
Response Area Detection

Region Classification

Layout Mapping
```

覆盖：

``` text
different answer spaces

tables

boxes

structured responses
```

------------------------------------------------------------------------

## Phase 7-C-E Regression Expansion

目标：

建立跨 syllabus regression。

增加：

``` text
0478 fixtures

9618 fixtures

9709 fixtures

future syllabus fixtures
```

------------------------------------------------------------------------

# 6. Stable Module Protection

以下模块继续保护：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT QUALITY Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Question Paper Pipeline
-   Mark Scheme Pipeline
-   Pairing Logic

任何修改必须：

``` text
isolated PR

new regression fixture

before/after comparison

no production regression
```

------------------------------------------------------------------------

# 7. Implementation Strategy

不要一次修改整个 parser。

采用：

``` text
Identify Failure Pattern

↓

Create Minimal Fix

↓

Add Regression

↓

Validate Existing Syllabus

↓

Merge
```

------------------------------------------------------------------------

# 8. Required Validation

每个 parser 改动必须验证：

``` text
0478 regression

9618 regression

9709 regression

fullNpmTest

prismaValidate
```

同时：

``` text
architectureFailures = []

documentRoleRegressions = []
```

------------------------------------------------------------------------

# 9. Required Reports

每个子阶段输出：

## Design Report

``` text
phase7c-<subphase>-design.md
```

## Implementation Report

``` text
phase7c-<subphase>-implementation-report.json
```

## Regression Report

``` text
phase7c-<subphase>-regression-report.json
```

------------------------------------------------------------------------

# 10. Success Criteria

Phase 7-C 完成：

``` text
parser generalization improved

syllabus-specific logic reduced

regression coverage expanded

existing production unchanged

future onboarding easier
```

------------------------------------------------------------------------

# 11. Failure Conditions

必须停止：

``` text
existing syllabus regression

production mutation

canonical inconsistency

validation bypass

hidden parser degradation
```

------------------------------------------------------------------------

# 12. Recommended Execution Order

推荐：

``` text
Phase 7-C-A
Document Structure Generalization

↓

Phase 7-C-B
Question Parsing Generalization

↓

Phase 7-C-C
Mark Scheme Generalization

↓

Phase 7-C-D
Response Area Generalization

↓

Phase 7-C-E
Regression Expansion
```

------------------------------------------------------------------------

# 13. Roadmap

``` text
Phase 1
9618 Initial Validation
✅

↓

Phase 6
9618 Final Closure
✅

↓

Phase 7-A
0478 Final Closure
✅

↓

Phase 7-B
9709 New Syllabus Onboarding
✅

↓

Phase 7-C
Generalized Parser Coverage Expansion
CURRENT

↓

Phase 8
Long-Term Data Quality Improvement
WAITING
```

------------------------------------------------------------------------

# 14. Definition of Done

Phase 7-C 完成：

``` text
parser handles broader document variations

new regression coverage added

existing syllabus remains stable

future syllabus onboarding cost reduced

architecture remains unchanged
```

------------------------------------------------------------------------

# Final Principle

``` text
Improve the parser's understanding.
Do not increase its exceptions.
```
