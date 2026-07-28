# PR-048A Recommended Next Batch Production Write Semantics Alignment Plan

## 1. PR Overview

**PR ID:** PR-048A

**Title:** Recommended Next Batch Production Write Semantics Alignment

**Objective**

修复 PR-048 中 `recommendedNextBatch` 的执行语义冲突。

当前：

```text
decision = "9618 Production Expansion Batch 01"
productionWrite = false
```

目标：

```text
decision = "9618 Production Expansion Batch 01"
productionWrite = true
```

本 PR 只修 recommendation metadata，不执行实际 Production publish。

---

## 2. Scope

### Included

仅修改 `selectRecommendedBatch(...)` 中：

```text
eligiblePairs.length > 0
```

对应的 Production Expansion recommendation branch。

### Excluded

- PR-049 Production publish
- 9618 staging generation
- 9618 blocker resolution
- Parser changes
- Canonical Model redesign
- Production schema changes
- Response Area changes
- TEXT QUALITY changes
- 0478 changes
- 9709 support

---

## 3. Root Cause

PR-048 正确识别：

```text
eligibleUnpublishedPairs > 0
```

并正确推荐：

```text
9618 Production Expansion Batch 01
```

但 recommendation metadata 中：

```text
productionWrite = false
```

导致：

```text
decision says publish
metadata says do not write
```

这是 next-step execution metadata inconsistency。

---

## 4. Severity

```text
P2
```

原因：

```text
不会污染当前 Production

但会误导后续自动化或 PR 计划生成

并导致 PR-049 execution semantics 不一致
```

---

## 5. Required Fix

### Before

```javascript
productionWrite: false
```

### After

```javascript
productionWrite: true
```

仅限 Production Expansion recommendation branch。

---

## 6. Branch Semantics

### Case A: Eligible Unpublished Exists

```text
decision = Production Expansion
productionWrite = true
```

### Case B: Missing Staging Exists

```text
decision = Missing Staging Generation
productionWrite = false
```

### Case C: Blocked Pairs Exist

```text
decision = Issue Resolution PR
productionWrite = false
```

### Case D: No Usable Source Pairs

```text
decision = STOP_NO_USABLE_SOURCE_PAIRS
productionWrite = false
```

---

## 7. Required Test Update

PR-048 test 当前期待：

```javascript
productionWrite: false
```

必须更新为：

```javascript
productionWrite: true
```

完整推荐对象应保持：

```json
{
  "decision": "9618 Production Expansion Batch 01",
  "batchId": "PR049-9618-2021-MJ-BATCH-01",
  "rationale": "Smallest safe same-year/session batch from strict eligible unpublished pairs.",
  "year": 2021,
  "session": "M/J",
  "components": ["12", "22"],
  "pairCount": 2,
  "pairingKeys": [
    "9618-2021-MJ-12",
    "9618-2021-MJ-22"
  ],
  "productionWrite": true
}
```

---

## 8. Additional Regression Tests

建议增加 branch semantics tests：

```text
eligiblePairs > 0
→ productionWrite = true
```

```text
eligiblePairs = 0
missingStagingPairs > 0
→ productionWrite = false
```

```text
blockedPairs > 0
and no higher-priority branch applies
→ productionWrite = false
```

```text
no usable pairs
→ productionWrite = false
```

---

## 9. Production Safety

本 PR 自身不执行 publish。

因此 PR-048A 实际运行时：

```text
productionWrite = false
```

注意区分：

```text
Current PR execution:
productionWrite = false
```

和：

```text
recommendedNextBatch metadata:
productionWrite = true
```

前者代表：

```text
PR-048A 不写 Production
```

后者代表：

```text
推荐的 PR-049 是 Production Expansion
```

---

## 10. Production Integrity

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

所有 delta 必须为：

```text
papers = 0
questionRecords = 0
responseAreas = 0
markSchemeEntries = 0
pairings = 0
batches = 0
expansionBatches = 0
```

---

## 11. Regression Requirements

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
PR-047 PASS
PR-048 PASS
```

以及：

```text
Phase 1 = 20 / 20 PASS
Phase 2 = 120 / 120 PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 12. Completion Criteria

PR-048A 完成条件：

```text
Production Expansion recommendation
has productionWrite = true

+

Non-production recommendation branches
remain productionWrite = false

+

PR-048 report regenerated

+

Recommended batch remains:
PR049-9618-2021-MJ-BATCH-01

+

Scope remains:
9618-2021-MJ-12
9618-2021-MJ-22

+

Production unchanged

+

Regression PASS
```

---

## 13. Follow-up Plan

PR-048A PASS 后进入：

```text
PR-049
9618-2021-MJ-BATCH-01 Production Expansion
```

范围：

```text
9618-2021-MJ-12
9618-2021-MJ-22
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

PR-049：

```text
productionWrite = true
```

继续保持：

```text
One PR
=
One Goal
```
