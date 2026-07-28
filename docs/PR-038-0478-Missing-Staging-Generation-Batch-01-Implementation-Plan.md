# PR-038 0478 Missing Staging Generation Batch 01 Implementation Plan

## 1. PR Overview

**PR ID:** PR-038

**Title:** 0478 Missing Staging Generation Batch 01

**Objective**

为当前缺失 staging 的 0478 paper pairs 生成下一批 staging artifacts，并验证其是否达到后续 Production Publish 的资格。

本 PR 不直接写入 Production。

唯一目标：

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

## 2. Scope

### Included

本次仅处理：

| Year | Session | Component |
|---|---|---|
| 2021 | M/J | 13 |
| 2021 | M/J | 21 |

对应：

```text
0478-2021-MJ-13
0478-2021-MJ-21
```

需要生成：

```text
0478_s21_qp_13.staging.json
0478_s21_ms_13.staging.json
0478_s21_qp_21.staging.json
0478_s21_ms_21.staging.json
```

### Excluded

以下内容不属于 PR-038：

- Production publish
- 2021 M/J 22、23
- 2022 staging generation
- 9618 expansion
- 9709 Mathematics support
- Parser 重构
- Canonical Model 重构
- TEXT QUALITY Pipeline 重构
- Response Area Pipeline 重构

## 3. Current State

PR-037 完成后：

```text
publishedPairs: 14
eligibleUnpublishedPairs: 0
missingStagingPairs: 10
```

其中缺失 staging：

```text
2021:
13
21
22
23

2022:
11
12
13
21
22
23
```

本 PR 只处理最小 batch：

```text
2021 M/J 13
2021 M/J 21
```

## 4. Architecture Boundary

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

PR-038 只执行：

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

## 5. Stable Modules

以下模块禁止无理由修改：

- Question Split
- Stable Question ID
- Parent / Leaf Question
- Marks Validation
- Binary Operand Preservation
- Negative Number Preservation
- TEXT QUALITY Pipeline
- Response Area Pipeline

如果 staging generation 暴露问题，必须先区分：

```text
Real parser defect
vs
Expected document variation
vs
Unsupported syllabus
vs
Validation false positive
```

不要直接修改稳定模块。

## 6. Input Validation

生成 staging 前必须确认：

### PDF Availability

Component 13：

```text
QP PDF exists
MS PDF exists
```

Component 21：

```text
QP PDF exists
MS PDF exists
```

### Expected Document Roles

Question Paper：

```text
documentRole = question_paper
```

Mark Scheme：

```text
documentRole = mark_scheme
```

## 7. Staging Generation

为以下 4 个 artifacts 生成 staging：

```text
0478_s21_qp_13.staging.json
0478_s21_ms_13.staging.json
0478_s21_qp_21.staging.json
0478_s21_ms_21.staging.json
```

每个 artifact 必须保留：

- source trace
- parser version
- file hash
- document role
- validation result
- completeness result
- publish status

## 8. Validation Requirements

每个 staging artifact 必须检查：

### Core Validation

```text
validationStatus = PASS
```

### Completeness Gate

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

### Publish Status

通过后：

```text
publishStatus = READY_TO_PUBLISH
```

如果任一 artifact 未通过，禁止进入 Production Publish。

## 9. Failure Classification

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
Reporting / naming / diagnostics issue
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

## 10. Regression Requirements

完成 staging generation 后必须运行：

### Existing Validation

```text
Phase 1
20 / 20 PASS
```

```text
Phase 2
120 / 120 PASS
```

### Historical Issue Resolution

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

### Production Safety

确认：

```text
productionWrite = false
```

并验证：

```text
production store hash unchanged
```

## 11. Expected Result

理想结果：

```text
4 staging artifacts generated
4 validation PASS
4 completeness PASS
4 READY_TO_PUBLISH
```

对应：

```text
0478-2021-MJ-13
0478-2021-MJ-21
```

变成：

```text
eligible unpublished pairs
```

## 12. Completion Criteria

PR-038 完成条件：

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

## 13. Follow-up Plan

如果 PR-038 全部 PASS：

进入：

```text
PR-039
0478-2021-MJ-BATCH-02 Production Expansion
```

范围：

```text
0478-2021-MJ-13
0478-2021-MJ-21
```

如果 PR-038 出现 failure：

不要发布。

先单独创建 issue-resolution PR：

```text
One PR
=
One Root Cause
=
One Minimal Fix
```

修复后重新生成 staging，再决定是否进入 PR-039。
