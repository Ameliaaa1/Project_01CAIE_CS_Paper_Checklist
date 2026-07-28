# PR-054 9618-2021-O/N Batch-06 Production Expansion Plan

## 1. PR Overview

**PR ID**

    PR-054

**Objective**

继续执行 9618 syllabus production expansion。

本 PR 不修改 parser，不修改 canonical model，不修改 staging pipeline。

目标：

将已经通过 preflight validation 的 production-ready 数据安全写入
Production。

------------------------------------------------------------------------

## 2. Current Project Status

当前已完成：

-   PR-049 9618-2021-MJ-BATCH-01
-   PR-050 9618-2021-MJ-BATCH-02
-   PR-053 9618-2021-ON-BATCH-05

当前 production state:

-   9618 production expansion 持续推进
-   Existing published records 保持稳定
-   Regression suite 已通过

------------------------------------------------------------------------

## 3. Scope

本 PR 目标范围：

Syllabus:

    9618

Year:

    2021

Session:

    O/N

Components:

    32
    41

对应：

    9618-2021-ON-32
    9618-2021-ON-41

------------------------------------------------------------------------

## 4. Objective

完成：

PDF

↓

Parser

↓

Canonical Model

↓

Staging

↓

Production

验证：

-   Question Paper
-   Mark Scheme
-   Question records
-   Leaf questions
-   Response Areas
-   Mark Scheme Entries
-   Source Trace
-   QP/MS pairing

------------------------------------------------------------------------

## 5. Preflight Requirements

执行 production write 前必须满足：

### Question Paper

必须：

-   validationStatus = PASS
-   completenessStatus = PASS
-   canonicalPublishable = true
-   P0 = 0
-   P1 = 0

### Mark Scheme

必须：

-   validationStatus = PASS
-   completenessStatus = PASS
-   canonicalPublishable = true
-   P0 = 0
-   P1 = 0

### Completeness Checks

全部 PASS：

-   questionCoverage
-   leafCoverage
-   markCoverage
-   responseAreaCoverage
-   sourceTraceCoverage
-   canonicalStructureCompleteness

------------------------------------------------------------------------

## 6. Production Safety Rules

本 PR 必须保持：

### 不修改稳定模块

禁止：

-   Question Split 修改
-   Question ID 修改
-   Parent/Leaf Model 修改
-   Response Area Pipeline 修改
-   TEXT QUALITY Pipeline 修改
-   Mark Validation 修改

### 不处理其他问题

以下问题不属于 PR-054：

-   9709 syllabus
-   缺失 source PDF
-   duplicate asset cleanup
-   parser architecture redesign

------------------------------------------------------------------------

## 7. Expected Production Delta

PR 执行后需要记录：

``` json
{
  "paperDelta": 4,
  "questionDelta": "<actual>",
  "responseAreaDelta": "<actual>",
  "markEntryDelta": "<actual>",
  "pairingDelta": 2
}
```

实际数量必须来自 staging verification。

禁止提前修改 production store。

------------------------------------------------------------------------

## 8. Regression Verification

执行：

-   PR-030 Response Area Regression
-   PR-031 Glyph Normalization Regression
-   PR-032 Mark Validation Regression
-   Existing Production Expansion Tests
-   Full npm test

必须保证：

    architectureFailures = []
    documentRoleRegressions = []

------------------------------------------------------------------------

## 9. Integrity Verification

Production 写入后检查：

Existing records:

必须：

    unchanged = true

验证：

-   papers
-   questions
-   responseAreas
-   markSchemeEntries
-   pairings
-   batches

不得出现：

-   old record modification
-   duplicate production entry
-   broken pairing

------------------------------------------------------------------------

## 10. Frontend Verification

必须验证：

-   Question Finder
-   Knowledge Checklist
-   Mark Scheme Search
-   AI Retrieval
-   Open Original Question
-   QP/MS Correspondence

全部：

    PASS

------------------------------------------------------------------------

## 11. Deliverables

PR-054 完成后需要生成：

1.  Production Expansion Report

格式：

    pr054-9618-2021-on-batch-06-report.json

2.  Regression Test

格式：

    pr054-production-expansion-9618-2021-on-batch-06.test.js

3.  Review Summary

包含：

-   Scope
-   Validation Result
-   Production Delta
-   Integrity Check
-   Regression Result
-   Final Decision

------------------------------------------------------------------------

## 12. Success Criteria

PR-054 通过标准：

    status = PASS

    productionWrite = true

    frontendVerification = PASS

    integrityCheck = PASS

    regression = PASS

------------------------------------------------------------------------

## 13. Next Step After PR-054

如果 PR-054 PASS：

继续处理：

-   remaining eligible unpublished 9618 pairs

流程保持：

Production Expansion

↓

Review

↓

Next Batch

↓

Coverage Completion
