# PR-026_Canonical_Completeness_Gate_Foundation_Explanation

## PR Title

Canonical Completeness Gate Foundation

------------------------------------------------------------------------

## 1. Background

当前项目已经完成：

-   PR-020 Mark Scheme Document Profile Separation
-   PR-022 Legacy Mark Scheme Barcode Region Classification Support
-   PR-023 Mark Sum Validation Investigation
-   PR-025 Question Marker Boundary Detection for Pseudocode and Numeric
    Content
-   PR-024 Back Matter Detection Investigation

Phase 2 最终结果：

``` text
Total PDFs: 120
Success: 120
Failed: 0
Success Rate: 100%
```

当前已确认：

``` text
architectureFailures = []
documentRoleRegressions = []
textQualityRegressions = []
```

因此，当前项目不再处于 Parser Debugging 阶段。

下一阶段应进入：

``` text
Canonical Completeness Gate
```

目标：

判断已经生成的 Canonical Data 是否完整到足以进入 Production。

------------------------------------------------------------------------

## 2. Current Architecture

当前整体架构：

``` text
PDF
 |
 v
Parser
 |
 v
Canonical Model
 |
 v
Staging
 |
 v
Production
 |
 v
Frontend
```

PR-026 将在现有链路中增加：

``` text
PDF
 |
 v
Parser
 |
 v
Canonical Model
 |
 v
Staging
 |
 v
Existing Validation
 |
 v
Canonical Completeness Gate
 |
 v
Publish Gate
 |
 v
Production
```

PR-026 不重新设计 Parser。

------------------------------------------------------------------------

## 3. Objective

PR-026 唯一目标：

``` text
判断 Canonical Data 是否完整到允许进入 Production
```

核心原则：

``` text
Parser PASS
```

不等于：

``` text
Production Ready
```

任何关键 Completeness Check 失败：

``` text
publishable = false
```

禁止进入 Production。

------------------------------------------------------------------------

## 4. Scope

### Allowed Changes

允许：

-   新增 Canonical Completeness Gate
-   新增独立 completeness validation logic
-   新增 staging re-read workflow
-   新增 issue codes
-   新增 Golden Fixtures
-   新增 Regression Tests
-   新增 Gate report

### Forbidden Changes

禁止修改：

-   Question Split
-   Stable Question ID
-   Parent / Leaf Question Model
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT Quality Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Canonical Schema

------------------------------------------------------------------------

## 5. Gate Input Rule

Gate 必须重新读取已经写入磁盘的 Staging JSON。

禁止：

``` text
Parser in-memory object
```

作为 Gate 的直接输入。

正确流程：

``` text
Parser
 |
 v
Write Staging JSON
 |
 v
Canonical Completeness Gate
 |
 v
Re-read Staging JSON from disk
 |
 v
Evaluate Completeness
```

原因：

避免：

``` text
Parser Memory != Actual Staging Artifact
```

导致 Validation 失真。

------------------------------------------------------------------------

## 6. Core Completeness Checks

PR-026 第一版只包含六类检查。

### 6.1 Question Coverage

检查：

``` text
questionCount > 0
```

每个 Question 必须有：

-   id
-   questionNumber
-   pageStart
-   pageEnd

建议 issue code：

``` text
CANONICAL_QUESTION_COVERAGE_INCOMPLETE
```

### 6.2 Leaf Coverage

检查：

-   parent question 是否存在
-   leaf question 是否正确关联 parent
-   sectionPath 是否合理
-   不允许 orphan leaf
-   不允许 child 指向不存在 parent

建议 issue codes：

``` text
CANONICAL_LEAF_COVERAGE_INCOMPLETE
CANONICAL_ORPHAN_LEAF
CANONICAL_INVALID_PARENT_REFERENCE
```

Gate 只验证结果，不重新设计 Question Split。

### 6.3 Mark Coverage

检查：

-   declared marks
-   leaf marks
-   existing mark validation status

对于 required marks：

``` text
marks != null
```

除非既有规则明确允许为空。

建议 issue codes：

``` text
CANONICAL_MARK_COVERAGE_INCOMPLETE
CANONICAL_REQUIRED_MARK_MISSING
```

### 6.4 Response Area Coverage

不要要求：

``` text
Every leaf must have response area
```

部分题型可能属于：

-   diagram
-   table
-   visual response
-   coding
-   special layout

第一版采用：

``` text
coverage-based evaluation
```

建议 issue codes：

``` text
CANONICAL_RESPONSE_AREA_COVERAGE_LOW
CANONICAL_RESPONSE_AREA_REQUIRED_MISSING
```

### 6.5 Source Trace Coverage

至少检查：

-   source file
-   page number
-   source block/span reference

建议 issue codes：

``` text
CANONICAL_SOURCE_TRACE_MISSING
CANONICAL_SOURCE_TRACE_INVALID
```

### 6.6 Canonical Structure Completeness

检查：

-   Question ID unique
-   Leaf ID unique
-   Parent ID valid
-   sectionPath valid
-   pageStart \<= pageEnd
-   entity relationship consistent

建议 issue codes：

``` text
CANONICAL_DUPLICATE_QUESTION_ID
CANONICAL_DUPLICATE_LEAF_ID
CANONICAL_INVALID_PAGE_RANGE
CANONICAL_STRUCTURE_INCONSISTENT
```

------------------------------------------------------------------------

## 7. Gate Severity Levels

### P0

必须阻止 Publish。

例如：

-   missing question ID
-   broken parent-child relationship
-   invalid source trace
-   impossible page range
-   required marks missing
-   canonical structure corruption

### P1

默认阻止 Production Pilot，允许 Human Review。

例如：

-   suspicious response area coverage
-   unusual leaf coverage
-   low-confidence source trace

### P2

提醒，但不阻止 Publish。

例如：

-   metadata quality warning
-   non-critical formatting anomaly

------------------------------------------------------------------------

## 8. Gate Output Format

建议输出：

``` json
{
  "status": "PASS",
  "publishable": true,
  "checks": {
    "questionCoverage": "PASS",
    "leafCoverage": "PASS",
    "markCoverage": "PASS",
    "responseAreaCoverage": "PASS",
    "sourceTraceCoverage": "PASS",
    "canonicalStructureCompleteness": "PASS"
  },
  "issues": []
}
```

失败示例：

``` json
{
  "status": "FAIL",
  "publishable": false,
  "checks": {
    "questionCoverage": "PASS",
    "leafCoverage": "FAIL",
    "markCoverage": "PASS",
    "responseAreaCoverage": "WARN",
    "sourceTraceCoverage": "PASS",
    "canonicalStructureCompleteness": "FAIL"
  },
  "issues": [
    {
      "severity": "P0",
      "code": "CANONICAL_LEAF_COVERAGE_INCOMPLETE",
      "questionId": "0478-2025-MJ-12-Q3"
    }
  ]
}
```

------------------------------------------------------------------------

## 9. Publish Rule

第一版建议：

``` text
P0 exists
    |
    v
publishable = false
```

对于 P1：

``` text
Human Review Required
```

对于 P2：

``` text
Publish Allowed
```

不要让所有 Warning 都变成 P0。

------------------------------------------------------------------------

## 10. Implementation Plan

### Step 1

新增独立 Gate runner。

输入：

``` text
staging JSON path
```

输出：

``` text
completeness gate report
```

### Step 2

实现 Question Coverage。

### Step 3

实现 Leaf Coverage。

### Step 4

实现 Mark Coverage。

### Step 5

实现 Response Area Coverage。

### Step 6

实现 Source Trace Coverage。

### Step 7

实现 Canonical Structure Completeness。

### Step 8

统一生成：

``` text
status
publishable
checks
issues
```

### Step 9

接入 Publish Gate。

但 PR-026 不执行 Production write。

------------------------------------------------------------------------

## 11. Golden Fixtures

建议 Positive Fixtures：

``` text
0478_s25_qp_12
0478_s25_ms_12
9618_s25_qp_11
9618_s25_ms_11
```

Expected：

``` text
Canonical Completeness Gate = PASS
publishable = true
```

------------------------------------------------------------------------

## 12. Negative Synthetic Fixtures

必须增加：

### Fixture 1

missing question ID

Expected：

``` text
P0
publishable = false
```

### Fixture 2

missing source trace

Expected：

``` text
P0
publishable = false
```

### Fixture 3

broken parent reference

Expected：

``` text
P0
publishable = false
```

### Fixture 4

required marks missing

Expected：

``` text
P0
publishable = false
```

### Fixture 5

invalid page range

Expected：

``` text
P0
publishable = false
```

不要修改真实 PDF fixture 来制造失败。

使用 synthetic staging fixture。

------------------------------------------------------------------------

## 13. Regression Requirements

PR-026 必须保证：

``` text
Phase 1:
20 / 20 PASS
```

保持。

``` text
Phase 2:
120 / 120 PASS
```

保持。

同时：

``` text
architectureFailures = []
documentRoleRegressions = []
textQualityRegressions = []
```

保持。

------------------------------------------------------------------------

## 14. Acceptance Criteria

PR-026 完成条件：

-   Canonical Completeness Gate implemented
-   Gate re-reads Staging JSON from disk
-   Question Coverage check implemented
-   Leaf Coverage check implemented
-   Mark Coverage check implemented
-   Response Area Coverage check implemented
-   Source Trace Coverage check implemented
-   Canonical Structure check implemented
-   Golden Fixtures added
-   Negative Synthetic Fixtures added
-   Regression Tests added
-   Phase 1 unchanged
-   Phase 2 unchanged
-   No stable module modified

------------------------------------------------------------------------

## 15. Out of Scope

PR-026 不做：

-   Parser redesign
-   Production write
-   Frontend changes
-   Full Production migration
-   New syllabus support
-   9709 support
-   Randomly adding more PDFs

当前支持仍然只有：

``` text
0478
9618
```

9709 不作为 Dataset Gap。

------------------------------------------------------------------------

## 16. Next Step After PR-026

PR-026 完成后进入：

``` text
Production Pilot
```

推荐 Pilot：

``` text
0478
2023 May-June
Question Paper 12
+
Mark Scheme 12
```

流程：

``` text
Staging
 |
 v
Canonical Completeness Gate
 |
 v
Publish Gate
 |
 v
Production
 |
 v
Frontend Verification
```

Frontend 验证：

-   Question Finder
-   Knowledge Checklist
-   Mark Scheme Search
-   AI Retrieval
-   Open Original Question
-   QP/MS correspondence

------------------------------------------------------------------------

## Final Decision

当前真实项目状态：

``` text
Phase 1 Complete
Phase 2 Complete
Issue Resolution Complete
```

下一步：

``` text
PR-026
Canonical Completeness Gate Foundation
```

唯一目标：

``` text
阻止不完整 Canonical Data 进入 Production
```

保持：

``` text
Parser unchanged
Question Split unchanged
Stable Question ID unchanged
Parent/Leaf model unchanged
Marks Validation unchanged
TEXT Quality pipeline unchanged
Response Area pipeline unchanged
Document Role Router unchanged
```

END
