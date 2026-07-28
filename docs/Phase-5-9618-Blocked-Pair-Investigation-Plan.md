# Phase 5 Blocked Pair Investigation Plan

## 1. Phase Overview

**Phase ID**

``` text
Phase 5
```

**Title**

``` text
9618 Blocked Pair Investigation
```

**Objective**

处理 Phase 4 最终审计确认的已知 blocker：

``` text
blockedPairs = 13
```

本阶段目标：

``` text
Investigate blockers
        ↓
Identify root cause
        ↓
Apply minimal isolated fix if required
        ↓
Re-run staging validation
        ↓
Re-evaluate strict eligibility
        ↓
Publish only eligible pairs
        ↓
Update coverage
```

本阶段不允许：

``` text
force publish
disable validation
modify unrelated stable modules
```

------------------------------------------------------------------------

# 2. Current State

Phase 4 已完成：

``` text
sourcePairs = 118
completeSourcePairs = 118

stagingPairs = 118
missingStagingPairs = 0

publishedPairs = 105
blockedPairs = 13

eligibleUnpublishedPairs = 0
partialProductionConflicts = 0
```

当前剩余问题：

``` text
13 blocked pairs
```

------------------------------------------------------------------------

# 3. Scope

Phase 5 只处理：

``` text
classification = BLOCKED
```

的 pair。

不处理：

``` text
already published pairs

completed staging pairs

source cleanup

new syllabus

parser redesign

canonical redesign
```

------------------------------------------------------------------------

# 4. Blocked Pair Categories

## Category A: Validation P0 Blockers

目标：

``` text
9618-2022-ON-31
9618-2022-ON-32
9618-2022-ON-33
```

典型状态：

``` text
validationStatus = FAIL

P0 > 0

publishStatus = BLOCKED
```

处理方向：

-   检查 validation failure
-   判断 parser issue 或 validation issue
-   修复后重新 validation

------------------------------------------------------------------------

## Category B: Mark Scheme Blockers

目标：

``` text
9618-2023-MJ-41
9618-2023-MJ-43
```

检查：

``` text
markSchemeEntries
mark mapping
question linking
mark count
source trace
```

------------------------------------------------------------------------

## Category C: Canonical / Completeness Blockers

目标：

``` text
9618-2024-ON-21
9618-2024-ON-23
9618-2024-ON-31
9618-2024-ON-33

9618-2025-MJ-21
9618-2025-ON-23
```

检查：

``` text
canonicalPublishable

completenessStatus

leaf question mapping

response area mapping

source trace
```

------------------------------------------------------------------------

## Category D: P1 Warning Blockers

目标：

``` text
9618-2023-ON-42
9618-2025-MJ-13
```

检查：

``` text
P1 issue

validation warning

publish gate
```

------------------------------------------------------------------------

# 5. Execution Strategy

禁止一次处理全部 13 个。

建议拆分：

``` text
Phase 5-A
P0 Validation Blockers

        ↓

Phase 5-B
Mark Scheme Blockers

        ↓

Phase 5-C
Canonical / Completeness Blockers

        ↓

Phase 5-D
P1 Blockers
```

------------------------------------------------------------------------

# 6. Investigation Flow

每个 blocked pair 必须执行：

``` text
Read blocker evidence
        ↓
Classify root cause
        ↓
Determine affected layer
        ↓
Apply minimal change
        ↓
Generate staging again if needed
        ↓
Run validation
        ↓
Check strict eligibility
        ↓
Publish if eligible
```

------------------------------------------------------------------------

# 7. Root Cause Classification

每个 blocker 必须归类：

``` text
SOURCE_ISSUE

PARSER_ISSUE

VALIDATION_RULE_ISSUE

CANONICAL_MAPPING_ISSUE

COMPLETENESS_ISSUE

DOCUMENT_LAYOUT_ISSUE

UNKNOWN
```

禁止：

``` text
fix without classification
```

------------------------------------------------------------------------

# 8. Minimal Change Rule

如果发现问题：

优先级：

``` text
1. Data issue

2. Parser localized fix

3. Validation rule correction

4. Canonical mapping fix
```

禁止：

``` text
rewrite parser

rewrite canonical model

remove validation gate
```

------------------------------------------------------------------------

# 9. Stable Modules Freeze

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

如果必须修改：

必须创建独立 PR。

------------------------------------------------------------------------

# 10. Re-validation Requirements

修复后必须重新执行：

``` text
QP validation

MS validation

Completeness validation

Canonical validation

Source trace validation
```

要求：

``` text
P0 = 0

P1 = 0

canonicalPublishable = true

publishStatus = READY_TO_PUBLISH
```

------------------------------------------------------------------------

# 11. Production Publication Gate

只有：

``` text
strictEligible = true
```

才允许：

``` text
productionWrite = true
```

禁止：

``` text
manual production insert

skip validation

override blocker
```

------------------------------------------------------------------------

# 12. Production Verification

新增 publication 必须验证：

``` text
expectedDeltas

actualDeltas

deltasMatch
```

检查：

``` text
papers

questions

leafQuestions

responseAreas

markSchemeEntries

pairings
```

要求：

``` text
expectedDeltas == actualDeltas
```

------------------------------------------------------------------------

# 13. Integrity Requirements

必须保持：

``` text
existing production records unchanged

unrelated staging unchanged

source assets unchanged
```

允许变化：

``` text
only current investigated pair
```

------------------------------------------------------------------------

# 14. Regression Requirements

每次 blocker 修复后：

必须通过：

``` text
Phase 1 regression

Phase 2 regression

Phase 3 regression

Phase 4 audit
```

并确认：

``` text
architectureFailures = []

documentRoleRegressions = []

fullNpmTest = PASS

prismaValidate = PASS
```

------------------------------------------------------------------------

# 15. Deliverables

每个 blocker batch 输出：

``` text
phase5-<batch>-blocked-pair-investigation-report.json
```

包含：

``` text
targetPairs

beforeState

blockerEvidence

rootCause

changes

validationAfter

strictEligibilityAfter

productionDelta

regression

next
```

------------------------------------------------------------------------

# 16. Success Criteria

单个 blocker 修复成功：

``` text
rootCause identified

minimal fix applied

validation PASS

strictEligible = true

production published

pair verification PASS
```

------------------------------------------------------------------------

# 17. Phase 5 Completion Criteria

Phase 5 完成：

``` text
all 13 blocked pairs investigated

each pair has root cause

resolved pairs published

unresolved pairs documented

no hidden blockers

no partial production conflicts

production integrity maintained

source integrity maintained

parser stability maintained

canonical stability maintained

regression PASS
```

------------------------------------------------------------------------

# 18. Final Closure Path

Phase 5 完成后：

进入：

``` text
Phase 6
9618 Final Production Closure
```

目标：

``` text
Generate final production closure report

Confirm final coverage

Confirm remaining exceptions

Freeze 9618 expansion
```

------------------------------------------------------------------------

# 19. Roadmap

\`\`\`text Phase 1 9618-2022-MJ-41 ✅ COMPLETE

↓

Phase 2 Duplicate Source Cleanup ✅ COMPLETE

↓

Phase 3 Missing Staging Expansion ✅ COMPLETE

↓

Phase 4 Final Coverage Re-Audit ✅ COMPLETE

↓

Phase 5 Blocked Pair Investigation CURRENT

↓

Phase 6 9618 Final Production Closure
