# PR-061 9618 Legal Null-Pointer Glyph Validation Rule Fix Plan

## 1. PR Overview

**PR ID**

```text
PR-061
```

**Title**

```text
9618 Legal Null-Pointer Glyph Validation Rule Fix
```

**Objective**

修复 9618 linked-list context 中合法 `Ø` null-pointer notation 被错误识别为 suspicious glyph 的 validation false positive。

本 PR 只处理以下两个 pair：

```text
9618-2021-MJ-21
9618-2021-MJ-23
```

本 PR 不处理：

- `×` multiplication glyph stale diagnostics
- PR-062 staging revalidation scope
- Parser modification
- Canonical Model modification
- Question Split changes
- Production write
- Unrelated glyph allowlisting

---

## 2. Current Project Status

PR-060 Blocked Pair Investigation 已完成并通过。

调查结果：

```text
reviewedPairs = 9

A_VALIDATION_FALSE_POSITIVE = 9
B_PARSER_ISSUE = 0
C_CANONICAL_MAPPING_ISSUE = 0
D_DATA_QUALITY_ISSUE = 0
E_HUMAN_REVIEW_REQUIRED = 0
```

其中两个 pair 属于：

```text
CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE
```

Pairing keys：

```text
9618-2021-MJ-21
9618-2021-MJ-23
```

其余 7 个 `×` stale diagnostic case 不属于本 PR。

---

## 3. Root Cause

两个 affected QP 中：

```text
Ø
```

出现在 linked-list diagram 中，用于表示 null pointer / null link。

现状：

```text
rawTextPreservesSymbols = true
normalizedTextPreservesSymbols = true
displayTextPreservesSymbols = true
canonicalMapping = correct
parserOutput = correct
```

但当前 text-quality validator 仍将：

```text
Ø
```

计入 suspicious glyph。

因此：

```text
Root Cause Category:
Validation False Positive
```

更具体：

```text
CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE
```

---

## 4. Affected Scope

### Pair 1

```text
9618-2021-MJ-21
```

Affected document：

```text
QP
```

Affected page：

```text
16
```

Observed symbol：

```text
Ø
```

Observed count：

```text
2
```

---

### Pair 2

```text
9618-2021-MJ-23
```

Affected document：

```text
QP
```

Affected page：

```text
16
```

Observed symbol：

```text
Ø
```

Observed count：

```text
2
```

---

## 5. Evidence Summary

Source-backed context：

```text
The following diagram represents an Abstract Data Type (ADT) for a linked list.

A C D E Ø

The free list is as follows:

Ø
```

该符号在这里表示：

```text
null pointer
```

不是：

- PDF corruption
- encoding corruption
- parser corruption
- OCR noise
- random glyph substitution

---

## 6. PR Goal

本 PR 目标：

```text
Make the text-quality validator recognize source-backed Ø null-pointer notation in linked-list context.
```

目标结果：

```text
currentRecomputedSuspiciousCount = 0
```

仅针对明确满足 linked-list null-pointer context 的 case。

---

## 7. Minimal Change Requirement

必须优先采用最小修改。

允许：

```text
targeted validation-rule adjustment
focused context detection
focused fixture
affected staging regeneration
```

禁止：

```text
global Ø allowlist
global suspicious-glyph suppression
parser change
canonical change
question split change
text extraction redesign
```

---

## 8. Validation Rule Design Requirement

不能简单写成：

```text
if symbol == "Ø":
    safe
```

因为这样会让所有 `Ø` 全部 bypass suspicious-glyph detection。

必须要求 context-valid。

建议最低条件至少包含：

```text
symbol = Ø
AND
document context indicates linked-list / free-list / pointer notation
```

可以考虑：

```text
linked list
free list
pointer
node
ADT
```

但不要为了命中这两个 fixture 而写过拟合规则。

---

## 9. False-Negative Protection

必须增加 negative fixture。

例如：

```text
Ø
```

出现在无关上下文时，仍应保持 suspicious。

目标：

```text
Context-valid Ø
→ allowed

Unrelated Ø
→ still suspicious
```

---

## 10. Parser Boundary

PR-060 已证明：

```text
PARSER_OUTPUT_CORRECT
```

所以本 PR 不允许修改：

- PDF extraction
- span extraction
- region classification
- question parsing
- mark scheme parsing
- response area detection

任何 parser change 都属于 scope violation。

---

## 11. Canonical Boundary

PR-060 已证明：

```text
CANONICAL_MAPPING_CORRECT
```

所以本 PR 不允许修改：

- Canonical Question model
- Leaf Question model
- Source Trace
- Response Area mapping
- Canonical Text Builder

---

## 12. Stable Modules

以下模块保持冻结：

- Question Split
- Stable Question ID
- Parent / Leaf Question
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- Response Area Pipeline
- Document Role Router
- Mark Scheme Pipeline

本 PR 仅允许修改：

```text
text-quality validation logic
focused validation fixtures/tests
affected staging artifacts if explicitly regenerated
```

---

## 13. Required Implementation Steps

### Step 1

定位当前 suspicious glyph classifier。

确认：

```text
Ø
```

当前为什么被识别为 suspicious。

---

### Step 2

增加 context-aware null-pointer recognition。

目标：

```text
linked-list context + Ø
→ legal
```

---

### Step 3

增加 focused tests。

至少覆盖：

```text
positive:
linked-list diagram with Ø
→ PASS

negative:
unrelated Ø
→ still suspicious
```

---

### Step 4

仅重新生成 affected staging artifacts：

```text
9618_s21_qp_21.staging.json
9618_s21_qp_23.staging.json
```

不要批量 regenerate unrelated staging。

---

### Step 5

重新验证：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P1 = 0
```

仅针对 affected QP。

---

## 14. Expected Artifact Changes

允许变化：

```text
affected QP staging artifacts only
```

不应变化：

```text
Production Store
Unrelated staging artifacts
Source assets
MS staging artifacts
Parser output logic
Canonical mapping logic
```

---

## 15. Integrity Requirements

必须记录：

### Production

```text
unchanged = true
```

### Source Assets

```text
unchanged = true
```

### Staging

允许：

```text
only affected QP staging artifacts change
```

必须验证其他 staging artifact hash 不变。

---

## 16. Required Regression Tests

至少新增：

```text
linked-list Ø valid context PASS
unrelated Ø remains suspicious PASS
```

并重新执行：

```text
PR-030 PASS
PR-031 PASS
PR-032 PASS
PR-048 PASS
PR-049 PASS
PR-050 PASS
PR-051 PASS
PR-052 PASS
PR-053 PASS
PR-054 PASS
PR-055 PASS
PR-056 PASS
PR-057 PASS
PR-058 PASS
PR-059 PASS
PR-060 PASS
```

同时：

```text
architectureFailures = []
documentRoleRegressions = []
phase1 = PASS
phase2 = PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 17. Expected Validation Result

### 9618-2021-MJ-21-QP

Before：

```text
validationStatus = WARN
publishStatus = BLOCKED
P1 > 0
```

After：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P1 = 0
```

---

### 9618-2021-MJ-23-QP

Before：

```text
validationStatus = WARN
publishStatus = BLOCKED
P1 > 0
```

After：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P1 = 0
```

---

## 18. Production Write Rule

本 PR：

```text
productionWrite = false
```

即使两个 pair 在修复后变成 eligible，也不要在 PR-061 中 publish。

发布动作必须放入后续独立 Production Expansion PR。

---

## 19. Required Deliverables

### Fix Report

建议：

```text
pr061-9618-null-pointer-glyph-validation-fix-report.json
```

### Regression Test

建议：

```text
pr061-9618-null-pointer-glyph-validation.test.js
```

### Updated Affected Staging Artifacts

仅：

```text
9618_s21_qp_21.staging.json
9618_s21_qp_23.staging.json
```

---

## 20. Report Requirements

最终 report 至少包含：

```text
generatedFor
status
productionWrite
scope
rootCause
implementation
affectedArtifacts
beforeState
afterState
validationResults
integrity
regression
next
```

---

## 21. Success Criteria

PR-061 PASS 条件：

```text
status = PASS
productionWrite = false

9618-2021-MJ-21-QP validationStatus = PASS
9618-2021-MJ-23-QP validationStatus = PASS

P1 = 0
publishStatus = READY_TO_PUBLISH

parser unchanged
canonical model unchanged
production unchanged
source assets unchanged

unrelated Ø remains suspicious
architectureFailures = []
documentRoleRegressions = []
fullNpmTest = PASS
```

---

## 22. Failure Conditions

以下情况必须判定失败：

### A. Global Ø Allowlisting

```text
all Ø symbols automatically treated as legal
```

### B. Scope Expansion

修改：

```text
parser
canonical model
question split
response area pipeline
```

### C. Regression

```text
unrelated Ø no longer detected
```

### D. Production Mutation

```text
productionWrite = true
```

### E. Unrelated Staging Mutation

修改了本 PR scope 之外的 staging artifacts。

---

## 23. Next Step After PR-061

如果 PR-061 PASS：

```text
PR-061
   ↓
Review
   ↓
PR-062
9618 Stale Multiplication-Glyph Staging Revalidation
```

PR-062 只处理：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
9618-2021-ON-22
9618-2024-ON-12
```

不要在 PR-061 中提前处理 `×` stale diagnostics。

---

## 24. Final Definition of Done

PR-061 完成标准：

```text
linked-list Ø null-pointer notation recognized correctly
only two affected QP staging artifacts regenerated
both blocked QPs become validation PASS
no global glyph allowlist introduced
parser unchanged
canonical model unchanged
production unchanged
source assets unchanged
focused positive and negative tests pass
full regression passes
```
