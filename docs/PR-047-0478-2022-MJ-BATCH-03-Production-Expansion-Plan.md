# PR-047 0478-2022-MJ-BATCH-03 Production Expansion Plan

## 1. PR Overview

**PR ID:** PR-047

**Title:** 0478-2022-MJ-BATCH-03 Production Expansion

**Objective**

将 PR-046 已成功生成并验证通过的最后两个 2022 May/June eligible paper pairs 发布到 Production：

```text
0478-2022-MJ-22
0478-2022-MJ-23
```

流程：

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

PR-046 已确认：

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

当前状态：

```text
stagingPairs = 24
publishedPairs = 22
eligibleUnpublishedPairs = 2
missingStagingPairs = 0
```

---

## 3. Scope

### Included

```text
0478-2022-MJ-22-QP
0478-2022-MJ-22-MS
0478-2022-MJ-23-QP
0478-2022-MJ-23-MS
```

### Excluded

- 2020 / 2021 / 2023 production changes
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

PR-047 只执行：

```text
Staging
↓
Production
```

禁止重新设计或修改稳定 parser / canonical logic，除非出现真实 supported-syllabus blocker。

---

## 5. Preflight Validation

发布前必须再次检查：

```text
0478_s22_qp_22.staging.json
0478_s22_ms_22.staging.json
0478_s22_qp_23.staging.json
0478_s22_ms_23.staging.json
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

### Component 22 QP

```text
pageCount = 12
questionCount = 5
leafQuestionCount = 16
responseAreaCoverage = 16 / 16
```

### Component 22 MS

```text
pageCount = 12
markSchemeEntryCount = 5
```

### Component 23 QP

```text
pageCount = 12
questionCount = 6
leafQuestionCount = 13
responseAreaCoverage = 13 / 13
```

### Component 23 MS

```text
pageCount = 13
markSchemeEntryCount = 8
```

---

## 8. Question Aggregation Review

PR-046 已确认：

### QP22

```text
aggregatedQuestionIds = []
canonicalStructureCompleteness = PASS
```

### QP23

```text
0478-2022-MJ-23-Q2
0478-2022-MJ-23-Q3
0478-2022-MJ-23-Q5
```

要求继续保持：

```text
canonicalStructureCompleteness = PASS
```

并确认：

- canonical question count 稳定
- canonical leaf count 稳定
- response areas 正确
- mark totals 有效
- source trace 可用
- pair publishability 不受影响

---

## 9. PR-044 Aggregation Regression

必须继续保护：

```text
0478-2022-MJ-13-Q8
```

正确状态：

```text
rawInstances = 2
canonicalRecords = 1
mergedResponseAreas = 6
responseAreaStatus = PRESENT
MISSING_RESPONSE_AREAS absent
```

不能因为执行 PR-047 Production Publish 而重新出现历史 aggregation false positive。

---

## 10. Diagnostic Severity Rules

保持 PR-038A 规则。

### Allowed Null Mark

```text
severity = P3
markCoverage = PASS
completeness = PASS
publishable = true
READY_TO_PUBLISH
```

### Real Missing Required Mark

```text
CANONICAL_REQUIRED_MARK_MISSING
severity = P0
markCoverage = FAIL
publishable = false
```

不得降级。

---

## 11. Strict Batch PASS Gate

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

保持：

```text
PR-031 PASS
```

合法乘号：

```text
U+00D7
×
```

必须：

```text
not suspicious
```

---

## 13. Production Write Strategy

PR-047：

```text
productionWrite = true
```

只允许新增：

```text
0478-2022-MJ-22-QP
0478-2022-MJ-22-MS
0478-2022-MJ-23-QP
0478-2022-MJ-23-MS
```

禁止：

- 修改已有 production records
- 覆盖已有 paper IDs
- 修改 staging artifacts
- 修改 unrelated production data
- 修改此前 PR 已发布数据

---

## 14. Duplicate and Partial Conflict Protection

如果两个 pair 都已完整存在：

```text
NO_CHANGES
```

如果出现：

```text
QP exists / MS missing
```

或：

```text
MS exists / QP missing
```

必须中止：

```text
partial production identity conflict
```

---

## 15. Expected Production Delta

固定新增：

```text
paperDelta = 4
pairingDelta = 2
```

其他 delta 从 staging 实际内容推导并验证：

```text
questionDelta
topLevelQuestionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

Actual 与 Expected 必须完全一致。

---

## 16. Pair-Level Verification

### Component 22

```text
paperCount = expected
questionCount = 5
leafQuestionCount = 16
responseAreaCount = expected
markSchemeEntryCount = 5
sourceTraceAvailable = true
pairingLinked = true
```

### Component 23

```text
paperCount = expected
questionCount = 6
leafQuestionCount = 13
responseAreaCount = expected
markSchemeEntryCount = 8
sourceTraceAvailable = true
pairingLinked = true
```

---

## 17. Frontend Verification

必须全部 PASS：

```text
Question Finder
Knowledge Checklist
Mark Scheme Search
AI Retrieval
Open Original Question
QP-MS Correspondence
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
production-store-after.json
production-store-after.sha256
```

必须验证：

```text
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
productionHashChanged = true
```

并确认：

```text
production-store-after.json
```

与实际 Production store 完全一致。

---

## 19. Regression Requirements

必须保持：

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
```

以及：

```text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 20. Completion Criteria

PR-047 完成条件：

```text
Preflight PASS
+
Production Write PASS
+
Pair Verification PASS
+
Aggregation Regression PASS
+
Integrity PASS
+
Frontend Verification PASS
+
Regression PASS
```

---

## 21. Expected Coverage After PR-047

如果成功：

```text
publishedPairs:
22 → 24
```

```text
eligibleUnpublishedPairs:
2 → 0
```

```text
missingStagingPairs:
0
```

2022 Production coverage：

```text
11
12
13
21
22
23
```

此时：

```text
2022 M/J Production coverage = COMPLETE
```

---

## 22. Final 0478 May/June Coverage

如果 PR-047 PASS：

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

因此：

```text
0478 May/June 2020–2023
Production Expansion = COMPLETE
```

---

## 23. Post-Completion Verification

PR-047 完成后建议生成最终汇总报告：

```text
0478-2020-2023-MJ-Production-Expansion-Completion-Report.json
```

至少包含：

```text
expectedPairs = 24
stagingPairs = 24
publishedPairs = 24
eligibleUnpublishedPairs = 0
missingStagingPairs = 0
```

并确认：

```text
2020 complete
2021 complete
2022 complete
2023 complete
```

---

## 24. Follow-up Direction

PR-047 完成后，不再继续创建 0478 May/June 2020–2023 production expansion PR。

后续新阶段应单独定义，例如：

```text
9618 Production Expansion
```

或：

```text
Additional sessions / years expansion
```

或：

```text
Production audit / completion report
```

继续保持：

```text
One PR
=
One Goal
```
