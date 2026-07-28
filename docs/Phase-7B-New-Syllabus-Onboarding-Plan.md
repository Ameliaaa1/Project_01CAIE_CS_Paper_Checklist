# Phase 7-B New Syllabus Onboarding Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 7-B
```

**Title**

``` text
New Syllabus Onboarding
```

## Objective

在完成：

``` text
0478 Final Closure
+
9618 Final Production Closure
```

之后，接入新的 CAIE syllabus。

Phase 7-B 的目标不是修改已有系统，而是验证当前架构是否具备跨 syllabus
扩展能力。

核心流程：

``` text
Select New Syllabus

↓

Document Profile Creation

↓

Source Inventory Validation

↓

Parser Compatibility Test

↓

Canonical Compatibility Test

↓

Staging Pilot

↓

Production Pilot

↓

Closure Decision
```

------------------------------------------------------------------------

# 2. Current Stable State

当前已完成：

``` text
0478
✅ CLOSED

9618
✅ CLOSED
```

稳定状态：

``` text
0478 production frozen

9618 production frozen

parser stable

canonical model stable

validation pipeline stable
```

Phase 7-B 必须保持：

``` text
existing syllabus unchanged
```

------------------------------------------------------------------------

# 3. Phase Boundary

Phase 7-B 允许：

``` text
add new syllabus

add new source inventory

create new document profile

add new fixtures

extend validation coverage
```

禁止：

``` text
rewrite parser architecture

create syllabus-specific database model

modify 0478 production

modify 9618 production

disable validation gate
```

------------------------------------------------------------------------

# 4. Syllabus Selection Requirement

在开始前必须确定：

``` text
targetSyllabus
```

记录：

``` text
syllabusCode

syllabusName

components

sessions

expectedDocumentTypes
```

例如：

``` text
9709 Mathematics

0620 Chemistry

other CAIE syllabus
```

注意：

未支持 syllabus 不代表系统错误。

必须经过正式 onboarding。

------------------------------------------------------------------------

# 5. Step 1 Document Profile Creation

每个新 syllabus 必须建立：

``` text
Document Profile
```

包含：

``` text
syllabus

component structure

paper format

question paper pattern

mark scheme pattern

document role rules
```

验证：

``` text
QP profile

MS profile

component mapping

session mapping
```

------------------------------------------------------------------------

# 6. Step 2 Source Inventory Validation

建立 source inventory：

必须确认：

``` text
sourceFilesComplete

qpFilesAvailable

msFilesAvailable

duplicateSourceCheckComplete
```

输出：

``` text
sourcePairs

completeSourcePairs

missingSources

duplicateSources
```

禁止：

``` text
source incomplete
then generate staging
```

------------------------------------------------------------------------

# 7. Step 3 Parser Compatibility Test

测试：

``` text
PDF Extraction

↓

Span Extraction

↓

Region Classification

↓

Question Parsing

↓

Mark Scheme Parsing

↓

Response Area Detection
```

重点验证：

``` text
question split

leaf question detection

mark extraction

response area mapping
```

------------------------------------------------------------------------

# 8. Step 4 Canonical Compatibility Test

确认新 syllabus 可以映射到：

``` text
Question Model

Leaf Question Model

Response Area Model

Mark Scheme Model

Source Trace Model

Pairing Model
```

禁止：

``` text
new syllabus specific canonical fork
```

------------------------------------------------------------------------

# 9. Step 5 Staging Pilot

Pilot 不直接大规模扩展。

建议：

``` text
5-10 pairs
```

流程：

``` text
PDF

↓

Parser

↓

Canonical

↓

Staging

↓

Validation

↓

Human Review
```

验证：

``` text
validationStatus = PASS

canonicalPublishable = true

P0 = 0

P1 = 0
```

------------------------------------------------------------------------

# 10. Step 6 Production Pilot

只有 staging pilot 成功后：

允许：

``` text
productionWrite = true
```

Production gate：

必须：

``` text
strictEligible = true
```

禁止：

``` text
manual insert

skip validation

force publish
```

------------------------------------------------------------------------

# 11. Regression Requirements

新 syllabus onboarding 必须验证：

已有：

``` text
0478 regression PASS

9618 regression PASS
```

保持：

``` text
fullNpmTest PASS

prismaValidate PASS
```

同时：

``` text
architectureFailures = []

documentRoleRegressions = []
```

------------------------------------------------------------------------

# 12. Stable Module Protection

以下模块继续冻结：

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

任何修改：

必须：

``` text
isolated PR

new regression fixture

before/after comparison
```

------------------------------------------------------------------------

# 13. Required Reports

Phase 7-B 必须生成：

## Source Report

``` text
<syllabus>-source-inventory-report.json
```

------------------------------------------------------------------------

## Document Profile Report

``` text
<syllabus>-document-profile-report.json
```

------------------------------------------------------------------------

## Parser Compatibility Report

``` text
<syllabus>-parser-compatibility-report.json
```

------------------------------------------------------------------------

## Staging Pilot Report

``` text
<syllabus>-staging-pilot-report.json
```

------------------------------------------------------------------------

## Production Pilot Report

``` text
<syllabus>-production-pilot-report.json
```

------------------------------------------------------------------------

# 14. Success Criteria

Phase 7-B 完成：

``` text
document profile created

source inventory complete

parser compatibility verified

canonical compatibility verified

staging pilot PASS

production pilot PASS

frontend verification PASS

regression PASS

existing syllabus unchanged
```

------------------------------------------------------------------------

# 15. Failure Conditions

必须停止：

``` text
parser regression

canonical mismatch

hidden source conflict

validation bypass

production mutation

existing syllabus regression
```

------------------------------------------------------------------------

# 16. Recommended Execution Strategy

不要一次扩展大量年份。

推荐：

``` text
Pilot:

1 session

1 component

5-10 pairs
```

成功后：

``` text
Batch Expansion

↓

Full Coverage

↓

Final Closure
```

------------------------------------------------------------------------

# 17. Phase 7-B Completion State

成功后：

状态：

``` text
New Syllabus
✅ ONBOARDED

Source
✅ COMPLETE

Staging
✅ COMPLETE

Production
✅ COMPLETE

Regression
✅ PASS
```

------------------------------------------------------------------------

# 18. Roadmap

``` text
Phase 1
9618 Initial Validation
✅

↓

Phase 2
Duplicate Cleanup
✅

↓

Phase 3
Staging Expansion
✅

↓

Phase 4
Coverage Audit
✅

↓

Phase 5
Blocked Investigation
✅

↓

Phase 6
9618 Closure
✅

↓

Phase 7-A
0478 Final Closure
✅

↓

Phase 7-B
New Syllabus Onboarding
CURRENT

↓

Phase 7-C
Generalized Parser Coverage Expansion

↓

Phase 8
Long-Term Data Quality Improvement
```

------------------------------------------------------------------------

# 19. Final Principle

Phase 7-B 的核心：

``` text
Add new syllabus capability
without changing trusted production behavior.
```

扩展新的数据范围，同时保持已有系统可信。
