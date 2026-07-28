# Phase 7 Cross-Syllabus Expansion Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 7
```

**Title**

``` text
Cross-Syllabus Expansion
```

**Objective**

在 9618 Production Expansion 完成并冻结后，进入新的 syllabus 扩展阶段。

Phase 6 已完成：

``` text
9618 Coverage:
118 / 118

Source:
COMPLETE

Staging:
COMPLETE

Production:
COMPLETE

Blocked:
0

Regression:
PASS
```

Phase 7 不修改已冻结的 9618 production。

目标：

``` text
New Syllabus Onboarding
        ↓
Source Inventory Setup
        ↓
Document Profile Validation
        ↓
Parser Compatibility Check
        ↓
Staging Expansion
        ↓
Production Expansion
```

------------------------------------------------------------------------

# 2. Current Frozen State

9618 当前状态：

``` text
sourcePairs = 118

stagingPairs = 118

publishedPairs = 118

blockedPairs = 0
```

必须保持：

``` text
9618 production unchanged
9618 parser behavior unchanged
9618 canonical model unchanged
9618 regression status unchanged
```

------------------------------------------------------------------------

# 3. Phase Boundary

Phase 7 是扩展阶段。

允许：

``` text
add new syllabus

add new source inventory

add new fixtures

add new validation coverage
```

禁止：

``` text
rewrite stable parser architecture

modify 9618 production data

weaken validation rules

remove regression checks
```

------------------------------------------------------------------------

# 4. Expansion Strategy

Phase 7 不直接同时接入所有 syllabus。

采用：

``` text
One Syllabus
        ↓
Pilot Validation
        ↓
Production Expansion
        ↓
Closure
        ↓
Next Syllabus
```

------------------------------------------------------------------------

# 5. Recommended Phase 7 Structure

## Phase 7-A

``` text
0478 Final Closure
```

目标：

确认：

``` text
0478 source coverage

0478 staging coverage

0478 production state

0478 regression state
```

生成：

``` text
0478 final closure report
```

------------------------------------------------------------------------

## Phase 7-B

``` text
New Syllabus Onboarding
```

目标：

接入新的 CAIE syllabus。

例如：

``` text
New syllabus:
TBD
```

流程：

``` text
Source Inventory

↓

Document Role Detection

↓

Parser Compatibility Test

↓

Canonical Mapping

↓

Staging Validation

↓

Production Pilot
```

------------------------------------------------------------------------

## Phase 7-C

``` text
Generalized Parser Coverage Expansion
```

目标：

提高系统对于不同 CAIE 文档格式的适应能力。

包括：

-   layout variation
-   footer variation
-   mark scheme variation
-   response area variation

------------------------------------------------------------------------

# 6. New Syllabus Onboarding Requirements

每个新 syllabus 必须建立：

``` text
Document Profile

Source Inventory

Golden Fixtures

Validation Rules

Regression Fixtures
```

------------------------------------------------------------------------

# 7. Source Inventory Requirements

新增 syllabus 前必须确认：

``` text
sourceFilesComplete

qpFilesAvailable

msFilesAvailable

duplicateSourceCheckComplete
```

禁止：

``` text
source incomplete
then force staging generation
```

------------------------------------------------------------------------

# 8. Document Profile Requirements

每个 syllabus 必须确认：

``` text
syllabus

component structure

session format

document roles

question paper pattern

mark scheme pattern
```

------------------------------------------------------------------------

# 9. Parser Compatibility Review

新 syllabus 必须验证：

``` text
PDF extraction

region classification

question split

leaf question detection

mark extraction

response area detection
```

------------------------------------------------------------------------

# 10. Canonical Model Compatibility

必须保持：

``` text
Question Model

Leaf Question Model

Response Area Model

Mark Scheme Model

Source Trace Model

Pairing Model
```

兼容。

禁止：

``` text
new syllabus specific database fork
```

------------------------------------------------------------------------

# 11. Staging Expansion Flow

标准流程：

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

Human Review

↓

Production Candidate
```

------------------------------------------------------------------------

# 12. Production Expansion Gate

只有：

``` text
validationStatus = PASS

completenessStatus = PASS

canonicalPublishable = true

P0 = 0

P1 = 0
```

才允许：

``` text
production publish
```

------------------------------------------------------------------------

# 13. Regression Requirements

任何新 syllabus 扩展必须保持：

``` text
9618 regression PASS

0478 regression PASS

fullNpmTest PASS

prismaValidate PASS
```

并确认：

``` text
architectureFailures = []

documentRoleRegressions = []
```

------------------------------------------------------------------------

# 14. Stable Module Protection

以下模块默认冻结：

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

如果需要修改：

必须：

``` text
create isolated PR

add regression fixture

prove no regression
```

------------------------------------------------------------------------

# 15. Deliverables

每个 syllabus expansion 必须输出：

## Source Report

``` text
<syllabus>-source-inventory-report.json
```

## Staging Report

``` text
<syllabus>-staging-expansion-report.json
```

## Production Report

``` text
<syllabus>-production-expansion-report.json
```

## Closure Report

``` text
<syllabus>-final-closure-report.json
```

------------------------------------------------------------------------

# 16. Success Criteria

新 syllabus 完成：

``` text
source coverage complete

staging coverage complete

production coverage complete

pair verification PASS

frontend verification PASS

regression PASS

integrity checks PASS
```

------------------------------------------------------------------------

# 17. Failure Conditions

出现：

``` text
source conflict

duplicate source unresolved

parser regression

canonical mismatch

production mutation

validation bypass

hidden blocker
```

必须停止扩展。

------------------------------------------------------------------------

# 18. Recommended Next Implementation

建议下一步：

``` text
Phase 7-A
0478 Final Closure
```

原因：

0478 已经存在 production pilot 和 expansion 历史。

优先完成 0478 closure，可以形成：

``` text
9618 complete lifecycle
+
0478 complete lifecycle
```

之后再进入新的 syllabus onboarding。

------------------------------------------------------------------------

# 19. Roadmap

``` text
Phase 1
9618 Initial Production Validation
✅ COMPLETE

↓

Phase 2
Duplicate Source Cleanup
✅ COMPLETE

↓

Phase 3
Missing Staging Expansion
✅ COMPLETE

↓

Phase 4
Final Coverage Re-Audit
✅ COMPLETE

↓

Phase 5
Blocked Pair Investigation
✅ COMPLETE

↓

Phase 6
9618 Final Production Closure
✅ COMPLETE

↓

Phase 7
Cross-Syllabus Expansion
CURRENT
```

------------------------------------------------------------------------

# 20. Definition of Done

Phase 7 完成：

``` text
new syllabus successfully onboarded

source inventory verified

parser compatibility verified

canonical compatibility verified

staging validated

production expanded

frontend verified

regression maintained

existing syllabus unchanged
```

------------------------------------------------------------------------

# 21. Final Rule

Phase 7 的核心原则：

``` text
Expand capability
without destabilizing existing production
```

9618 已冻结。

任何新的扩展必须证明：

``` text
new data added

old data unchanged

architecture stable

regression preserved
```
