# PR-041 0478-2021-MJ-BATCH-03 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-041

**Title**

0478-2021-MJ-BATCH-03 Production Expansion

**Objective**

将 PR-040 已成功生成并验证通过的两个 eligible paper pairs 发布到
Production。

目标范围：

``` text
0478-2021-MJ-22
0478-2021-MJ-23
```

本 PR 只执行：

``` text
Validated Staging

↓

Preflight Validation

↓

Production Publish

↓

Integrity Verification

↓

Frontend Verification

↓

Regression
```

------------------------------------------------------------------------

# 2. Preconditions

PR-040 已确认：

``` text
generated = 4

validationPass = 4

completenessPass = 4

readyToPublish = 4

p0Issues = 0

p1Issues = 0

p2Issues = 0

productionWrite = false
```

当前 eligible unpublished pairs：

``` text
0478-2021-MJ-22
0478-2021-MJ-23
```

------------------------------------------------------------------------

# 3. Scope

## Included

本次发布：

``` text
0478-2021-MJ-22-QP
0478-2021-MJ-22-MS

0478-2021-MJ-23-QP
0478-2021-MJ-23-MS
```

------------------------------------------------------------------------

## Excluded

以下内容不属于 PR-041：

-   2022 staging generation
-   2022 production expansion
-   9618 expansion
-   9709 Mathematics support
-   Parser changes
-   Canonical Model changes
-   Response Area Pipeline changes
-   TEXT QUALITY Pipeline changes
-   Mark extraction redesign
-   Production schema redesign

------------------------------------------------------------------------

# 4. Architecture Boundary

保持现有稳定架构：

``` text
PDF

↓

Parser

↓

Canonical Model

↓

Staging

↓

Production
```

PR-041 只执行：

``` text
Staging

↓

Production
```

禁止重新设计或修改稳定 parser / canonical logic，除非出现真实
supported-syllabus blocker。

------------------------------------------------------------------------

# 5. Preflight Validation

发布前必须再次检查以下 4 个 staging artifacts：

``` text
0478_s21_qp_22.staging.json
0478_s21_ms_22.staging.json

0478_s21_qp_23.staging.json
0478_s21_ms_23.staging.json
```

每个 artifact 必须满足：

``` text
validationStatus = PASS

completenessStatus = PASS

canonicalPublishable = true

publishStatus = READY_TO_PUBLISH

P0 = 0

P1 = 0

P2 = 0
```

任何一个条件失败：

``` text
STOP
```

禁止 Production Write。

------------------------------------------------------------------------

# 6. Completeness Gate Requirements

必须全部 PASS：

``` text
questionCoverage

leafCoverage

markCoverage

responseAreaCoverage

sourceTraceCoverage

canonicalStructureCompleteness
```

------------------------------------------------------------------------

# 7. Known Valid Diagnostics

必须保持 PR-038A 之后的 diagnostic semantics。

## Allowed Null Mark

如果：

``` text
Leaf mark is null

AND

Existing staging rule explicitly permits null marks
```

则允许：

``` text
severity = P3
```

同时必须保持：

``` text
markCoverage = PASS

completeness = PASS

publishable = true

READY_TO_PUBLISH
```

P3 diagnostic 不应阻塞本次 Production Publish。

------------------------------------------------------------------------

# 8. Response Area Verification

PR-040 已确认：

## Component 22 QP

``` text
required = 12

present = 12

ratio = 1
```

## Component 23 QP

``` text
required = 14

present = 14

ratio = 1
```

PR-041 发布前必须再次确认这些 coverage 数据没有变化。

------------------------------------------------------------------------

# 9. Production Write Strategy

PR-041：

``` text
productionWrite = true
```

只允许新增：

``` text
0478-2021-MJ-22-QP
0478-2021-MJ-22-MS

0478-2021-MJ-23-QP
0478-2021-MJ-23-MS
```

禁止：

-   修改已有 production records
-   覆盖已有 paper IDs
-   修改 staging artifacts
-   修改 unrelated production data
-   修改 PR-027 / PR-028 / PR-034 / PR-035 / PR-036 / PR-037 / PR-039
    已发布数据

------------------------------------------------------------------------

# 10. Duplicate and Partial Conflict Protection

发布前必须检查：

``` text
alreadyPublished
```

如果两个 pair 都已完整存在：

``` text
NO_CHANGES
```

如果出现 partial identity conflict，例如：

``` text
QP exists
MS missing
```

或：

``` text
MS exists
QP missing
```

则必须中止：

``` text
partial production identity conflict
```

禁止继续写入。

------------------------------------------------------------------------

# 11. Expected Production Delta

固定新增：

``` text
paperDelta = 4

pairingDelta = 2
```

其他 delta 必须从 staging 实际内容推导并验证：

``` text
questionDelta

topLevelQuestionDelta

leafQuestionDelta

responseAreaDelta

markEntryDelta
```

禁止手工猜测。

Actual 与 Expected 必须完全一致。

------------------------------------------------------------------------

# 12. Pair-Level Verification

## Component 22

必须检查：

``` text
paperCount = expected

questionCount = expected

leafQuestionCount = expected

responseAreaCount = expected

markSchemeEntryCount = expected

sourceTraceAvailable = true

pairingLinked = true
```

## Component 23

执行相同验证。

------------------------------------------------------------------------

# 13. Frontend Verification

发布后必须验证：

``` text
Question Finder

Knowledge Checklist

Mark Scheme Search

AI Retrieval

Open Original Question

QP-MS Correspondence
```

全部：

``` text
PASS
```

------------------------------------------------------------------------

# 14. Integrity Verification

发布前保存：

``` text
production-store-before.json

production-store-before.sha256
```

发布后保存：

``` text
production-store-after.sha256
```

必须验证：

``` text
existingRecordsUnchanged = true

stagingArtifactsUnchanged = true
```

同时确认：

``` text
production hash changed
```

因为本次是合法 Production Write。

------------------------------------------------------------------------

# 15. Regression Requirements

必须保持：

## Historical Validation

``` text
Phase 1

20 / 20 PASS
```

``` text
Phase 2

120 / 120 PASS
```

## Historical Fixes

``` text
PR-030 PASS
Response Area Mapping
```

``` text
PR-031 PASS
Legacy Glyph Classification
```

``` text
PR-032 PASS
Mark Sum Validation
```

``` text
PR-038A PASS
Canonical Mark Coverage Diagnostic Severity Alignment
```

## Full Validation

``` text
fullNpmTest PASS

prismaValidate PASS
```

------------------------------------------------------------------------

# 16. PR-040 Fix Regression

必须确认以下两个 PR-040 已解决问题保持稳定。

## Legal Multiplication Sign

``` text
U+00D7
×
```

必须：

``` text
not suspicious
```

不能重新触发：

``` text
SUSPICIOUS_GLYPHS_REMAIN
```

------------------------------------------------------------------------

## Strict Batch PASS Gate

Batch artifact 只有同时满足：

``` text
validationStatus = PASS

publishStatus = READY_TO_PUBLISH

P0 = 0

P1 = 0

P2 = 0
```

才能被计为：

``` text
PASS
```

禁止 WARN / BLOCKED artifact 被错误聚合成 PASS。

------------------------------------------------------------------------

# 17. Completion Criteria

PR-041 完成条件：

``` text
Preflight PASS

+

Production Write PASS

+

Pair Verification PASS

+

Integrity PASS

+

Frontend Verification PASS

+

Regression PASS
```

------------------------------------------------------------------------

# 18. Expected Coverage After PR-041

如果成功：

``` text
2021 M/J:
11
12
13
21
22
23
```

此时 2021 M/J 六个 component 全部进入 Production。

当前整体 Production coverage：

``` text
2020 M/J:
11
12
13
21
22
23

2021 M/J:
11
12
13
21
22
23

2023 M/J:
11
12
13
21
22
23
```

------------------------------------------------------------------------

# 19. Follow-up Plan

PR-041 完成后，进入：

``` text
PR-042
0478 Missing Staging Generation Batch 03
```

目标：

``` text
2022 M/J
```

建议继续使用小批次策略。

第一批候选：

``` text
0478-2022-MJ-11
0478-2022-MJ-12
```

流程：

``` text
PDF

↓

Parser / Canonical

↓

Generate Staging

↓

Validation

↓

Completeness Gate

↓

Eligibility Decision
```

继续保持：

``` text
One PR

=

One Goal
```
