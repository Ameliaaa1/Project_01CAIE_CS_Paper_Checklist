# PR-045 0478-2022-MJ-BATCH-02 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-045

**Title**

0478-2022-MJ-BATCH-02 Production Expansion

**Objective**

将 PR-044 已成功生成并验证通过的两个 eligible paper pairs 发布到 Production。

目标范围：

```text
0478-2022-MJ-13
0478-2022-MJ-21
```

本 PR 只执行：

```text
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

---

## 2. Preconditions

PR-044 已确认：

```text
generated = 4
validationPass = 4
completenessPass = 4
readyToPublish = 4
P0 = 0
P1 = 0
P2 = 0
strictBatchPassGate = PASS
legalMultiplicationSign = PASS
productionWrite = false
```

当前 eligible unpublished pairs：

```text
0478-2022-MJ-13
0478-2022-MJ-21
```

PR-044 还修复了：

```text
0478-2022-MJ-13-Q8
MISSING_RESPONSE_AREAS false positive after aggregation
```

该修复必须在 PR-045 中保持稳定。

---

## 3. Scope

### Included

本次发布：

```text
0478-2022-MJ-13-QP
0478-2022-MJ-13-MS

0478-2022-MJ-21-QP
0478-2022-MJ-21-MS
```

### Excluded

以下内容不属于 PR-045：

- 2022 M/J 22
- 2022 M/J 23
- 2022 later staging generation
- 9618 expansion
- 9709 Mathematics support
- Parser changes
- Canonical Model redesign
- Response Area Pipeline redesign
- TEXT QUALITY Pipeline redesign
- Mark extraction redesign
- Production schema redesign

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

PR-045 只执行：

```text
Staging
↓
Production
```

禁止重新设计或修改稳定 parser / canonical logic，除非出现真实 supported-syllabus blocker。

---

## 5. Preflight Validation

发布前必须再次检查以下 4 个 staging artifacts：

```text
0478_s22_qp_13.staging.json
0478_s22_ms_13.staging.json

0478_s22_qp_21.staging.json
0478_s22_ms_21.staging.json
```

每个 artifact 必须满足：

```text
validationStatus = PASS
completenessStatus = PASS
canonicalPublishable = true
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
P2 = 0
```

任何一个条件失败：

```text
STOP
```

禁止 Production Write。

---

## 6. Completeness Gate Requirements

必须全部 PASS：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

---

## 7. Expected Staging Counts

PR-044 已确认：

### Component 13 QP

```text
pageCount = 12
questionCount = 8
leafQuestionCount = 24
responseAreaCoverage = 24 / 24
```

### Component 13 MS

```text
pageCount = 13
markSchemeEntryCount = 7
```

### Component 21 QP

```text
pageCount = 12
questionCount = 6
leafQuestionCount = 14
responseAreaCoverage = 13 / 13
```

### Component 21 MS

```text
pageCount = 13
markSchemeEntryCount = 9
```

PR-045 发布前必须确认 staging 数据没有发生意外变化。

---

## 8. PR-044 Q8 Aggregation Regression

必须特别检查：

```text
0478-2022-MJ-13-Q8
```

已知正确状态：

```text
rawInstances = 2
canonicalRecords = 1
mergedResponseAreas = 6
responseAreaStatus = PRESENT
```

必须保持：

```text
MISSING_RESPONSE_AREAS absent
```

并确认：

```text
response_area_status = PRESENT
response_areas_json.length = 6
mergedDuplicateQuestionRecord = true
sourceCount = 2
```

禁止重新出现：

```text
MISSING_RESPONSE_AREAS
```

只因为 raw parent instance 本身没有 response areas。

判定必须基于：

```text
Canonical merged record
```

而不是：

```text
Individual raw instance
```

---

## 9. Question Aggregation Review

必须再次检查：

### QP13

```text
0478-2022-MJ-13-Q8
```

### QP21

```text
0478-2022-MJ-21-Q2
0478-2022-MJ-21-Q3
```

要求：

```text
canonicalStructureCompleteness = PASS
```

并确认：

- canonical question count 稳定
- canonical leaf count 稳定
- mark totals 有效
- response areas 正确
- source trace 可用

不要因为 raw instance count 与 canonical count 不同就直接判定 defect。

---

## 10. Known Valid Diagnostics

必须保持 PR-038A 之后的 diagnostic semantics。

### Allowed Null Mark

如果：

```text
Leaf mark is null

AND

Existing staging rule explicitly permits null marks
```

则允许：

```text
severity = P3
```

同时必须保持：

```text
markCoverage = PASS
completeness = PASS
publishable = true
READY_TO_PUBLISH
```

PR-044 中：

```text
0478-2022-MJ-21-Q2
```

存在合法：

```text
CANONICAL_MARK_COVERAGE_INCOMPLETE
severity = P3
```

该 diagnostic 不阻塞 Production Publish。

---

## 11. Strict Batch PASS Gate

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

禁止 WARN / BLOCKED artifact 被错误聚合成 PASS。

---

## 12. TEXT QUALITY Regression

必须保持：

```text
PR-031 PASS
```

以及合法乘号：

```text
U+00D7
×
```

必须：

```text
not suspicious
```

不能重新触发：

```text
SUSPICIOUS_GLYPHS_REMAIN
```

---

## 13. Production Write Strategy

PR-045：

```text
productionWrite = true
```

只允许新增：

```text
0478-2022-MJ-13-QP
0478-2022-MJ-13-MS

0478-2022-MJ-21-QP
0478-2022-MJ-21-MS
```

禁止：

- 修改已有 production records
- 覆盖已有 paper IDs
- 修改 staging artifacts
- 修改 unrelated production data
- 修改此前 PR 已发布数据

---

## 14. Duplicate and Partial Conflict Protection

发布前必须检查：

```text
alreadyPublished
```

如果两个 pair 都已完整存在：

```text
NO_CHANGES
```

如果出现 partial identity conflict，例如：

```text
QP exists
MS missing
```

或：

```text
MS exists
QP missing
```

则必须中止：

```text
partial production identity conflict
```

禁止继续写入。

---

## 15. Expected Production Delta

固定新增：

```text
paperDelta = 4
pairingDelta = 2
```

其他 delta 必须从 staging 实际内容推导并验证：

```text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

禁止手工猜测。

Actual 与 Expected 必须完全一致。

---

## 16. Pair-Level Verification

### Component 13

必须检查：

```text
paperCount = expected
questionCount = 8
leafQuestionCount = 24
responseAreaCount = expected
markSchemeEntryCount = 7
sourceTraceAvailable = true
pairingLinked = true
```

### Component 21

必须检查：

```text
paperCount = expected
questionCount = 6
leafQuestionCount = 14
responseAreaCount = expected
markSchemeEntryCount = 9
sourceTraceAvailable = true
pairingLinked = true
```

---

## 17. Frontend Verification

发布后必须验证：

```text
Question Finder
Knowledge Checklist
Mark Scheme Search
AI Retrieval
Open Original Question
QP-MS Correspondence
```

全部：

```text
PASS
```

---

## 18. Integrity Verification

发布前保存：

```text
production-store-before.json
production-store-before.sha256
```

发布后保存：

```text
production-store-after.sha256
```

必须验证：

```text
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
productionHashChanged = true
```

因为本次是合法 Production Write。

建议同时保存完整：

```text
production-store-after.json
```

以便后续独立审计。

---

## 19. Regression Requirements

必须保持：

### Historical Validation

```text
Phase 1
20 / 20 PASS
```

```text
Phase 2
120 / 120 PASS
```

### Historical Fixes

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

```text
PR-042 PASS
2022 M/J 11,12 Staging Generation
```

```text
PR-044 PASS
Q8 Aggregation Response-Area False Positive Fix
```

### Full Validation

```text
fullNpmTest PASS
prismaValidate PASS
```

---

## 20. Completion Criteria

PR-045 完成条件：

```text
Preflight PASS

+

Production Write PASS

+

Pair Verification PASS

+

Q8 Aggregation Regression PASS

+

Integrity PASS

+

Frontend Verification PASS

+

Regression PASS
```

---

## 21. Expected Coverage After PR-045

如果成功：

```text
publishedPairs:
20 → 22
```

```text
eligibleUnpublishedPairs:
2 → 0
```

2022 Production coverage：

```text
11
12
13
21
```

2022 仍缺 staging：

```text
22
23
```

整体 Production coverage：

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

2022 M/J:
11
12
13
21

2023 M/J:
11
12
13
21
22
23
```

---

## 22. Follow-up Plan

PR-045 完成后，进入：

```text
PR-046
0478 Missing Staging Generation Batch 05
```

建议范围：

```text
0478-2022-MJ-22
0478-2022-MJ-23
```

流程：

```text
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

```text
productionWrite = false
```

以及：

```text
One PR
=
One Goal
```
