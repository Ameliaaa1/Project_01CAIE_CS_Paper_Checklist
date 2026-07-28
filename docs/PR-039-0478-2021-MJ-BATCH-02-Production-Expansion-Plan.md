# PR-039 0478-2021-MJ-BATCH-02 Production Expansion Plan

## 1. PR Overview

**PR ID**

PR-039

**Title**

0478-2021-MJ-BATCH-02 Production Expansion

**Objective**

将 PR-038 已成功生成并验证通过的两个 eligible paper pairs 发布到 Production。

目标范围：

```text
0478-2021-MJ-13
0478-2021-MJ-21
```

本 PR 只执行：

```text
Validated Staging

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

PR-038 已确认：

```text
generatedArtifacts = 4
validationPass = 4
completenessPass = 4
publishReady = 4
eligiblePairs = 2
failures = 0
productionWrite = false
```

当前 eligible unpublished pairs：

```text
0478-2021-MJ-13
0478-2021-MJ-21
```

---

## 3. Scope

### Included

发布：

```text
0478-2021-MJ-13-QP
0478-2021-MJ-13-MS

0478-2021-MJ-21-QP
0478-2021-MJ-21-MS
```

---

### Excluded

不处理：

- 2021 M/J 22
- 2021 M/J 23
- 2022 staging generation
- 2022 production publish
- 9618 expansion
- 9709 Mathematics
- Parser changes
- Canonical Model changes
- Response Area changes
- TEXT QUALITY changes

---

## 4. Architecture Boundary

现有稳定架构：

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

PR-039 只执行：

```text
Staging
↓
Production
```

禁止重新运行或修改稳定 parser logic，除非发现真实 supported-syllabus blocker。

---

## 5. Preflight Validation

发布前必须再次确认 4 个 artifact：

```text
0478_s21_qp_13.staging.json
0478_s21_ms_13.staging.json
0478_s21_qp_21.staging.json
0478_s21_ms_21.staging.json
```

每个 artifact 必须满足：

```text
validationStatus = PASS
completenessStatus = PASS
publishable = true
publishStatus = READY_TO_PUBLISH
```

---

## 6. Completeness Checks

必须全部 PASS：

```text
questionCoverage
leafCoverage
markCoverage
responseAreaCoverage
sourceTraceCoverage
canonicalStructureCompleteness
```

Response Area 至少保持：

```text
0478-2021-MJ-13-QP
required = 23
present = 23
ratio = 1
```

```text
0478-2021-MJ-21-QP
required = 15
present = 15
ratio = 1
```

---

## 7. Production Write Strategy

PR-039：

```text
productionWrite = true
```

只允许新增目标 batch 数据。

禁止：

- 修改已发布 records
- 覆盖现有 paper IDs
- 修改 staging artifacts
- 修改 unrelated production data

---

## 8. Duplicate and Partial Conflict Protection

发布前检查：

```text
alreadyPublished
```

如果两个 pair 都已完整存在：

```text
NO_CHANGES
```

如果出现半发布状态，例如：

```text
QP exists
MS missing
```

必须中止：

```text
partial production identity conflict
```

不得继续写入。

---

## 9. Expected Production Delta

固定新增：

```text
paperDelta = 4
pairingDelta = 2
```

其他 delta 应根据 staging 实际内容生成并验证，包括：

```text
questionDelta
leafQuestionDelta
responseAreaDelta
markEntryDelta
```

实际值必须与 expected values 完全一致。

---

## 10. Pair-Level Verification

### Component 13

必须检查：

```text
paperCount = expected
questionCount = expected
leafQuestionCount = expected
responseAreaCount = expected
markSchemeEntryCount = expected
sourceTraceAvailable = true
pairingLinked = true
```

### Component 21

执行相同验证。

---

## 11. Frontend Verification

发布后必须验证：

```text
Question Finder
Knowledge Checklist
Mark Scheme Search
AI Retrieval
Open Original Question
QP-MS Correspondence
```

全部要求：

```text
PASS
```

---

## 12. Integrity Verification

发布前保存：

```text
production-store-before.json
production-store-before.sha256
```

发布后保存：

```text
production-store-after.sha256
```

验证：

```text
existingRecordsUnchanged = true
stagingArtifactsUnchanged = true
```

---

## 13. Regression Requirements

必须保持：

```text
Phase 1
20 / 20 PASS
```

```text
Phase 2
120 / 120 PASS
```

历史修复：

```text
PR-030 PASS
PR-031 PASS
PR-032 PASS
```

以及：

```text
fullNpmTest PASS
prismaValidate PASS
```

---

## 14. Completion Criteria

PR-039 完成条件：

```text
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

---

## 15. Expected Coverage After PR-039

如果成功：

```text
publishedPairs:
14 → 16
```

新增完成：

```text
2021 M/J:
13
21
```

当前 2021 coverage 变为：

```text
11
12
13
21
```

剩余：

```text
22
23
```

---

## 16. Follow-up Plan

PR-039 完成后，不要直接发布 2021 M/J 22、23，因为当前它们仍属于 missing staging。

下一阶段应为：

```text
PR-040
0478 Missing Staging Generation Batch 02
```

范围：

```text
0478-2021-MJ-22
0478-2021-MJ-23
```

流程：

```text
Generate Staging
↓
Validation
↓
Completeness Gate
↓
Eligibility Decision
```

通过后再进入下一次 Production Expansion。
