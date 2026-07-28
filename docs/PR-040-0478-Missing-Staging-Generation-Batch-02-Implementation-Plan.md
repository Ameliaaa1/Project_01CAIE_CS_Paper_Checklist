# PR-040 0478 Missing Staging Generation Batch 02 Implementation Plan

## 1. PR Overview

**PR ID**

PR-040

**Title**

0478 Missing Staging Generation Batch 02

**Objective**

为当前仍缺失 staging 的 0478 paper pairs 生成下一批 staging artifacts，并验证其是否达到后续 Production Publish 的资格。

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
| 2021 | M/J | 22 |
| 2021 | M/J | 23 |

对应：

```text
0478-2021-MJ-22
0478-2021-MJ-23
```

需要生成：

```text
0478_s21_qp_22.staging.json
0478_s21_ms_22.staging.json

0478_s21_qp_23.staging.json
0478_s21_ms_23.staging.json
```

---

## Excluded

以下内容不属于 PR-040：

- Production publish
- 2022 staging generation
- 2022 production expansion
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

当前已完成：

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
```

2021 M/J 仍缺：

```text
22
23
```

PR-040 只处理：

```text
0478-2021-MJ-22
0478-2021-MJ-23
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

PR-040 只执行：

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
- TEXT QUALITY Pipeline
- Response Area Pipeline
- Document Role Router
- Mark Scheme Pipeline
- Canonical Structure rules

如果 staging generation 暴露问题，必须先区分：

```text
Real parser defect

vs

Expected document variation

vs

Validation false positive

vs

Existing permitted staging rule
```

不要直接修改稳定模块。

---

# 6. Input Validation

生成 staging 前必须确认：

## Component 22

```text
QP PDF exists
MS PDF exists
```

## Component 23

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
0478_s21_qp_22.staging.json
0478_s21_ms_22.staging.json

0478_s21_qp_23.staging.json
0478_s21_ms_23.staging.json
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

如果任一 artifact 未通过：

禁止进入 Production Publish。

---

# 9. Diagnostic Severity Rules

必须保持 PR-038A 修复后的语义：

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
```

---

## Real Missing Required Mark

如果：

```text
Required mark should exist

but is missing
```

则不得降级。

应保持：

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

# 10. Failure Classification

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

# 11. Regression Requirements

完成 staging generation 后必须运行：

## Existing Validation

```text
Phase 1

20 / 20 PASS
```

```text
Phase 2

120 / 120 PASS
```

---

## Historical Issue Resolution

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

---

## Full Validation

保持：

```text
fullNpmTest PASS
prismaValidate PASS
```

---

# 12. Production Safety

确认：

```text
productionWrite = false
```

并验证：

```text
production store hash unchanged
```

同时保证：

```text
existing production records unchanged
```

---

# 13. Expected Result

理想结果：

```text
4 staging artifacts generated

4 validation PASS

4 completeness PASS

4 READY_TO_PUBLISH
```

对应：

```text
0478-2021-MJ-22
0478-2021-MJ-23
```

变成：

```text
eligible unpublished pairs
```

---

# 14. Completion Criteria

PR-040 完成条件：

```text
Staging Generation Complete

+

Validation Complete

+

Completeness Gate Complete

+

Regression PASS

+

Production Unchanged
```

---

# 15. Expected Coverage After PR-040

如果全部 PASS：

```text
2021 M/J:
11
12
13
21
22
23
```

此时 2021 M/J staging coverage 完整。

Production publish 仍需单独 PR 执行。

---

# 16. Follow-up Plan

如果 PR-040 全部 PASS：

进入：

```text
PR-041
0478-2021-MJ-BATCH-03 Production Expansion
```

范围：

```text
0478-2021-MJ-22
0478-2021-MJ-23
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

如果 PR-040 出现 failure：

不要发布。

先创建独立 issue-resolution PR：

```text
One PR

=

One Root Cause

=

One Minimal Fix
```

修复并重新生成 staging 后，再决定是否进入 PR-041。
