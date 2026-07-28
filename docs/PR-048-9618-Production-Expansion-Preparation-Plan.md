# PR-048 9618 Production Expansion Preparation Plan

## 1. PR Overview

**PR ID**

PR-048

**Title**

9618 Production Expansion Preparation

**Objective**

在不写入 Production 的前提下，对当前仓库中的 9618 Computer Science 数据进行完整 inventory、coverage assessment、staging readiness review 和 production eligibility analysis。

本 PR 不生成大规模 Production 数据。

本 PR 不直接 publish。

本 PR 唯一目标：

```text
Inventory Existing 9618 Assets
↓
Assess PDF Coverage
↓
Assess Staging Coverage
↓
Assess Production Coverage
↓
Identify Missing / Eligible / Blocked Pairs
↓
Select Smallest Safe Next Batch
```

因此：

```text
productionWrite = false
```

---

## 2. Why PR-048 Is the Correct Next Step

0478 May/June 2020–2023 已经完成：

```text
expectedPairs = 24
stagingPairs = 24
publishedPairs = 24
eligibleUnpublishedPairs = 0
missingStagingPairs = 0
remainingProductionExpansionWork = 0
```

因此不得继续创建新的 0478 M/J production expansion PR。

下一阶段应开启独立 Epic：

```text
9618 Computer Science Production Expansion
```

但在真正发布之前，必须先知道：

```text
仓库里到底有哪些 9618 PDFs
哪些已有 staging
哪些已经 publish
哪些 READY_TO_PUBLISH
哪些缺 staging
哪些存在 blocker
```

不能在 coverage 未知时直接开始 publish。

---

## 3. Scope

### Included

本 PR 只处理：

```text
9618 Computer Science
```

执行：

- 9618 PDF inventory
- 9618 paper pair discovery
- QP / MS pairing validation
- staging coverage discovery
- production coverage discovery
- eligibility analysis
- blocked pair analysis
- missing staging analysis
- duplicate / partial production identity detection
- recommended next batch selection
- regression verification

---

### Excluded

以下内容不属于 PR-048：

- Production publish
- Large-scale staging generation
- Parser redesign
- Canonical Model redesign
- TEXT QUALITY Pipeline redesign
- Response Area Pipeline redesign
- Mark Scheme Pipeline redesign
- 0478 May/June expansion changes
- 9709 Mathematics support
- Frontend feature redesign
- Database schema redesign

---

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

PR-048 只执行：

```text
Inventory
+
Read Existing Staging
+
Read Existing Production
+
Eligibility Analysis
```

禁止：

```text
Production Write
```

因此：

```text
productionWrite = false
```

---

## 5. Supported Syllabus Boundary

当前 supported syllabuses：

```text
0478 Computer Science
9618 Computer Science
```

明确不属于当前 supported scope：

```text
9709 Mathematics
```

因此：

```text
9709 absence
!=
bug
```

不得因为缺少 9709 syllabus 或 paper data 创建 blocker。

---

## 6. Inventory Requirements

需要扫描并输出 9618 inventory。

至少统计：

```text
totalQpPdfs
totalMsPdfs
totalPairs
years
sessions
components
missingQpFiles
missingMsFiles
orphanQpFiles
orphanMsFiles
```

每个 pair 建议使用 canonical identity：

```text
9618-YEAR-SESSION-COMPONENT
```

例如：

```text
9618-2023-MJ-11
```

具体年份、session、component 不得猜测，必须从实际文件 inventory 中生成。

---

## 7. Pair Discovery Rules

每个 pair 必须明确：

```text
QP exists
MS exists
```

完整 pair：

```text
QP + MS
```

不完整 pair：

```text
QP only
```

或：

```text
MS only
```

必须分类为：

```text
INCOMPLETE_SOURCE_PAIR
```

不得直接进入 staging generation 或 Production publish。

---

## 8. Staging Coverage Analysis

对于每个完整 9618 pair，检查：

```text
QP staging exists
MS staging exists
```

分类：

```text
STAGING_COMPLETE
```

```text
STAGING_PARTIAL
```

```text
STAGING_MISSING
```

如果 staging complete，还必须检查：

```text
validationStatus
completenessStatus
canonicalPublishable
publishStatus
P0
P1
P2
```

---

## 9. Eligibility Classification

每个 pair 必须分类为以下一种：

### Already Published

```text
ALREADY_PUBLISHED
```

条件：

```text
QP in Production
MS in Production
pairing linked
```

### Eligible Unpublished

```text
ELIGIBLE_UNPUBLISHED
```

条件：

```text
QP staging exists
MS staging exists

validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH

P0 = 0
P1 = 0
P2 = 0
```

### Missing Staging

```text
MISSING_STAGING
```

条件：

```text
source pair complete
but staging incomplete or absent
```

### Blocked

```text
BLOCKED
```

条件：

```text
P0 > 0
or
P1 > 0
or
P2 > 0
or
validation FAIL
or
completeness FAIL
or
publishStatus != READY_TO_PUBLISH
```

### Partial Production Identity Conflict

```text
PARTIAL_PRODUCTION_CONFLICT
```

例如：

```text
QP exists in Production
MS missing
```

或：

```text
MS exists in Production
QP missing
```

必须作为 blocker。

---

## 10. Strict PASS Semantics

继续保持 PR-040 之后的严格规则。

只有 artifact 同时满足：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
P2 = 0
```

才能计入：

```text
PASS
```

禁止：

```text
WARN
BLOCKED
FAIL
```

被错误聚合成 PASS。

---

## 11. Diagnostic Severity Rules

保持 PR-038A 语义。

### Allowed Null Mark

如果现有 staging rule 明确允许 null：

```text
severity = P3
markCoverage = PASS
completeness = PASS
publishable = true
```

### Real Missing Required Mark

如果 required mark 缺失：

```text
CANONICAL_REQUIRED_MARK_MISSING
severity = P0
markCoverage = FAIL
publishable = false
```

不得降级。

---

## 12. Historical Regression Protection

PR-048 不应改变任何 stable module。

必须继续保持：

```text
PR-030 PASS
PR-031 PASS
PR-032 PASS
PR-038A PASS
PR-040 PASS
PR-042 PASS
PR-044 PASS
PR-045 PASS
PR-046 PASS
PR-047 PASS
```

以及：

```text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 13. Production Safety

PR-048：

```text
productionWrite = false
```

必须验证：

```text
production store hash before
=
production store hash after
```

并确认：

```text
existingRecordsUnchanged = true
```

不得新增：

```text
papers
question records
response areas
mark scheme entries
pairings
batches
expansion batches
```

---

## 14. Required Output Report

建议生成：

```text
pr048-9618-production-expansion-preparation-report.json
```

至少包括：

```text
generatedFor
status
productionWrite
scope
inventory
coverage
eligibleUnpublishedPairs
missingStagingPairs
blockedPairs
alreadyPublishedPairs
partialProductionConflicts
recommendedNextBatch
productionIntegrity
regression
```

---

## 15. Recommended Report Structure

示例结构：

```json
{
  "generatedFor": "PR-048-9618-Production-Expansion-Preparation-Plan",
  "status": "PASS",
  "productionWrite": false,
  "scope": {
    "syllabus": "9618"
  },
  "inventory": {
    "years": [],
    "sessions": [],
    "components": [],
    "totalPairs": 0
  },
  "coverage": {
    "stagingPairs": 0,
    "publishedPairs": 0,
    "eligibleUnpublishedPairs": 0,
    "missingStagingPairs": 0,
    "blockedPairs": 0,
    "partialProductionConflicts": 0
  },
  "recommendedNextBatch": null
}
```

所有数字必须来自实际 inventory。

禁止手工猜测。

---

## 16. Recommended Next Batch Selection

PR-048 完成后，需要从真实结果中选择下一批。

优先顺序：

```text
1. ELIGIBLE_UNPUBLISHED
2. Smallest complete safe batch
3. Same syllabus
4. Same year/session where possible
5. Prefer 2 pairs per batch
6. No blockers
7. No partial production conflicts
```

如果存在 eligible unpublished pairs：

下一 PR 应为：

```text
9618 Production Expansion
```

如果不存在 eligible unpublished pairs，但存在 complete source pairs：

下一 PR 应为：

```text
9618 Missing Staging Generation
```

如果存在 blocker：

先创建独立 issue-resolution PR。

---

## 17. Failure Classification

任何问题必须分类：

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

每个 issue 必须提供：

```text
Symptom
↓
Affected File / Pair
↓
Root Cause
↓
Minimal Fix
↓
Regression Risk
```

---

## 18. Completion Criteria

PR-048 完成条件：

```text
9618 Inventory Complete

+

Pair Discovery Complete

+

Staging Coverage Complete

+

Production Coverage Complete

+

Eligibility Classification Complete

+

Blocked Pair Analysis Complete

+

Recommended Next Batch Selected

+

Production Unchanged

+

Regression PASS
```

---

## 19. Expected Final Decision

PR-048 结束时必须给出明确决策：

### Case A

```text
eligibleUnpublishedPairs > 0
```

则下一步：

```text
9618 Production Expansion Batch 01
```

### Case B

```text
eligibleUnpublishedPairs = 0
and
missingStagingPairs > 0
```

则下一步：

```text
9618 Missing Staging Generation Batch 01
```

### Case C

```text
blockedPairs > 0
```

则：

```text
Issue Resolution PR
```

优先解决 blocker。

### Case D

```text
no usable source pairs
```

则停止 expansion，并输出 inventory limitation。

---

## 20. One PR One Goal

PR-048 只做：

```text
9618 Production Expansion Preparation
```

不要同时：

- publish Production
- 批量生成 staging
- 修改 parser
- 重构架构
- 引入 9709
- 扩展其他 session / syllabus

继续保持：

```text
One PR
=
One Goal
```
