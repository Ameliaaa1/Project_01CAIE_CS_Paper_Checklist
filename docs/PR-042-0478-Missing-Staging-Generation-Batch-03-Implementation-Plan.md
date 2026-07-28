# PR-042 0478 Missing Staging Generation Batch 03 Implementation Plan

## 1. PR Overview

**PR ID**

PR-042

**Title**

0478 Missing Staging Generation Batch 03

**Objective**

为 2022 May/June 的首批 0478 paper pairs 生成 staging artifacts，并验证它们是否达到后续 Production Publish 的资格。

本 PR 不直接写入 Production。

本 PR 唯一目标：

```text
Existing PDFs

↓

Parser / Canonical Pipeline

↓

Generate Staging Artifacts

↓

Validation

↓

Completeness Gate

↓

Eligibility Decision
```

---

# 2. Scope

## Included

本次仅处理：

| Year | Session | Component |
|---|---|---|
| 2022 | M/J | 11 |
| 2022 | M/J | 12 |

对应：

```text
0478-2022-MJ-11
0478-2022-MJ-12
```

需要生成：

```text
0478_s22_qp_11.staging.json
0478_s22_ms_11.staging.json

0478_s22_qp_12.staging.json
0478_s22_ms_12.staging.json
```

---

## Excluded

以下内容不属于 PR-042：

- Production publish
- 2022 M/J 13
- 2022 M/J 21
- 2022 M/J 22
- 2022 M/J 23
- 9618 expansion
- 9709 Mathematics support
- Parser 重构
- Canonical Model 重构
- TEXT QUALITY Pipeline 重构
- Response Area Pipeline 重构
- Mark extraction redesign
- Production schema redesign

---

# 3. Current State

PR-041 完成后：

```text
publishedPairs = 18

eligibleUnpublishedPairs = 0

missingStagingPairs = 6
```

当前完整 Production coverage：

```text
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

当前缺失 staging：

```text
2022 M/J:
11
12
13
21
22
23
```

本 PR 只处理最小 batch：

```text
2022 M/J 11
2022 M/J 12
```

---

# 4. Architecture Boundary

保持现有稳定架构：

```text
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

PR-042 只执行：

```text
PDF

↓

Parser

↓

Canonical Model

↓

Staging
```

禁止执行：

```text
Staging

↓

Production
```

因此：

```text
productionWrite = false
```

---

# 5. Stable Modules

以下模块禁止无理由修改：

- Question Split
- Stable Question ID
- Parent / Leaf Question
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- Document Role Router
- Mark Scheme Pipeline
- TEXT QUALITY Pipeline
- Response Area Pipeline
- Canonical Structure rules
- Production write logic

如果 staging generation 暴露问题，必须先区分：

```text
Real parser defect

vs

Expected document variation

vs

Validation false positive

vs

Existing permitted staging rule

vs

New 2022 document-layout variation
```

不要直接重构稳定模块。

---

# 6. Input Validation

生成 staging 前必须确认：

## Component 11

```text
QP PDF exists
MS PDF exists
```

## Component 12

```text
QP PDF exists
MS PDF exists
```

---

## Expected Document Roles

Question Paper：

```text
documentRole = question_paper
```

Mark Scheme：

```text
documentRole = mark_scheme
```

---

# 7. Staging Generation

为以下 4 个 artifacts 生成 staging：

```text
0478_s22_qp_11.staging.json
0478_s22_ms_11.staging.json

0478_s22_qp_12.staging.json
0478_s22_ms_12.staging.json
```

每个 artifact 必须保留：

- source trace
- parser version
- file hash
- document role
- validation result
- completeness result
- publish status
- issue counts
- response area coverage
- mark scheme entry count
- canonical completeness checks

---

# 8. Validation Requirements

每个 staging artifact 必须检查：

## Core Validation

```text
validationStatus = PASS
```

---

## Completeness Gate

必须检查：

```text
questionCoverage

leafCoverage

markCoverage

responseAreaCoverage

sourceTraceCoverage

canonicalStructureCompleteness
```

目标：

```text
all PASS
```

---

## Publish Status

通过后：

```text
publishStatus = READY_TO_PUBLISH
```

任何 artifact 如果出现：

```text
WARN

BLOCKED

FAIL
```

都不得计入 PASS，也不得进入 Production Publish。

---

# 9. Strict Batch PASS Gate

继续保持 PR-040 修复后的严格规则。

只有 artifact 同时满足：

```text
validationStatus = PASS

publishStatus = READY_TO_PUBLISH

P0 = 0

P1 = 0

P2 = 0
```

才能：

```text
status = PASS
```

禁止：

```text
WARN / BLOCKED artifact
```

被错误聚合成：

```text
PASS
```

---

# 10. Diagnostic Severity Rules

必须保持 PR-038A 修复后的语义。

## Allowed Null Mark

如果：

```text
Leaf mark is null

AND

Existing staging rule explicitly permits null marks
```

则：

```text
severity = P3
```

同时保持：

```text
markCoverage = PASS

completeness = PASS

publishable = true

READY_TO_PUBLISH
```

---

## Real Missing Required Mark

如果：

```text
Required mark should exist

but is missing
```

则不得降级。

必须保持：

```text
CANONICAL_REQUIRED_MARK_MISSING

severity = P0
```

并：

```text
markCoverage = FAIL

publishable = false
```

---

# 11. TEXT QUALITY Regression

必须保持：

```text
PR-031 PASS
```

以及 PR-040 中已解决的合法乘号行为：

```text
U+00D7

×
```

必须：

```text
not suspicious
```

禁止重新触发：

```text
SUSPICIOUS_GLYPHS_REMAIN
```

对于 2022 新 PDF 中出现的新 glyph：

必须先判断：

```text
Valid mathematical / textual symbol

vs

Actual extraction corruption
```

不要无条件删除或替换。

---

# 12. Response Area Validation

Question Paper 必须检查：

```text
required response areas

present response areas

coverage ratio
```

要求：

```text
responseAreaCoverage = PASS
```

并输出：

```text
required

present

ratio
```

如果出现缺失：

必须先区分：

```text
Real response-area mapping defect

vs

Document layout variation

vs

Non-answer content incorrectly classified as leaf question
```

不要直接修改 Response Area Pipeline。

---

# 13. Failure Classification

如果出现失败，必须分类为：

```text
P0
Architecture or production corruption risk
```

```text
P1
Core parser / canonical correctness failure
```

```text
P2
Staging completeness or validation failure
```

```text
P3
Reporting / diagnostic / non-blocking issue
```

对于每个 failure 必须提供：

```text
Symptom

↓

Affected File

↓

Root Cause

↓

Minimal Fix

↓

Regression Risk
```

---

# 14. Regression Requirements

完成 staging generation 后必须运行：

## Historical Validation

```text
Phase 1

20 / 20 PASS
```

```text
Phase 2

120 / 120 PASS
```

---

## Historical Fixes

保持：

```text
PR-030 PASS
Response Area Mapping
```

```text
PR-031 PASS
Legacy Glyph Classification
```

```text
PR-032 PASS
Mark Sum Validation
```

```text
PR-038A PASS
Canonical Mark Coverage Diagnostic Severity Alignment
```

```text
PR-040 PASS
Strict Batch PASS Gate
+
Legal Multiplication Sign
```

---

## Full Validation

保持：

```text
fullNpmTest PASS

prismaValidate PASS
```

---

# 15. Production Safety

确认：

```text
productionWrite = false
```

发布前后验证：

```text
production store hash unchanged
```

并保证：

```text
existing production records unchanged
```

本 PR 禁止新增：

```text
papers

question records

response areas

mark scheme entries

pairings
```

到 Production。

---

# 16. Expected Result

理想结果：

```text
4 staging artifacts generated

4 validation PASS

4 completeness PASS

4 READY_TO_PUBLISH

P0 = 0

P1 = 0

P2 = 0
```

对应：

```text
0478-2022-MJ-11
0478-2022-MJ-12
```

变成：

```text
eligible unpublished pairs
```

---

# 17. Coverage After PR-042

如果全部 PASS：

```text
stagingPairs:
18 → 20
```

```text
eligibleUnpublishedPairs:
0 → 2
```

```text
missingStagingPairs:
6 → 4
```

2022 staging coverage：

```text
11
12
```

剩余：

```text
13
21
22
23
```

---

# 18. Completion Criteria

PR-042 完成条件：

```text
Staging Generation Complete

+

Validation Complete

+

Completeness Gate Complete

+

Strict PASS Gate Confirmed

+

Regression PASS

+

Production Unchanged
```

---

# 19. Follow-up Plan

如果 PR-042 全部 PASS：

进入：

```text
PR-043
0478-2022-MJ-BATCH-01 Production Expansion
```

范围：

```text
0478-2022-MJ-11
0478-2022-MJ-12
```

流程：

```text
Preflight

↓

Production Publish

↓

Integrity Verification

↓

Frontend Verification

↓

Regression
```

如果 PR-042 出现 failure：

不要发布。

先创建独立 issue-resolution PR：

```text
One PR

=

One Root Cause

=

One Minimal Fix
```

修复并重新生成 staging 后，再决定是否进入 PR-043。
