# PR-038A Canonical Mark Coverage Diagnostic Severity Alignment Plan

## 1. Overview

**Suggested PR ID**

PR-038A

**Title**

Canonical Mark Coverage Diagnostic Severity Alignment

**Objective**

解决 `0478_s21_qp_13.staging.json` 中 diagnostic severity 与 aggregate issue counts 之间的语义不一致。

当前现象：

```text
run.p2_issue_count = 0
```

但：

```text
canonicalCompletenessGate.issues
```

中存在：

```json
{
  "severity": "P2",
  "code": "CANONICAL_MARK_COVERAGE_INCOMPLETE",
  "message": "Leaf mark is absent under an existing staging rule that permits null marks."
}
```

同时该 artifact 仍然：

```text
validationStatus = PASS
completenessStatus = PASS
markCoverage = PASS
publishable = true
publishStatus = READY_TO_PUBLISH
```

这造成 reporting semantics 不一致。

---

## 2. Root Cause

现有 completeness logic 允许特定 leaf question 的 mark 为 `null`。

因此：

```text
Null mark permitted by existing rule
```

不会导致：

```text
markCoverage FAIL
```

也不会阻塞：

```text
READY_TO_PUBLISH
```

但 diagnostic issue 仍被赋予：

```text
severity = P2
```

于是出现：

```text
P2 diagnostic exists

but

P2 aggregate count = 0

and

completeness gate = PASS
```

根本问题是：

```text
Diagnostic severity classification
```

与：

```text
Validation / completeness / publish semantics
```

没有完全对齐。

---

## 3. Selected Solution: Option 1

采用 Option 1：

```text
将允许 null mark 的 CANONICAL_MARK_COVERAGE_INCOMPLETE
从 P2 降级为非阻塞 diagnostic severity
```

推荐优先使用：

```text
P3
```

如果现有系统支持更明确的非故障等级，也可以使用：

```text
INFO
```

或：

```text
WARNING
```

但本项目当前已有 P0 / P1 / P2 / P3 分类体系，因此建议：

```text
severity = P3
```

---

## 4. Scope

### Included

仅修改：

```text
CANONICAL_MARK_COVERAGE_INCOMPLETE
```

在以下条件同时成立时的 severity：

```text
Leaf mark is null

AND

Existing staging rule explicitly permits null marks

AND

markCoverage remains PASS
```

目标结果：

```text
severity: P3
```

---

### Excluded

不要修改：

- Question Parser
- Question Split
- Stable Question ID
- Mark extraction logic
- Marks Validation core
- Response Area Pipeline
- TEXT QUALITY Pipeline
- Mark Scheme Parser
- Canonical Model structure
- Production data

不要改变：

```text
validationStatus
completenessStatus
publishStatus
publishable
```

---

## 5. Required Behavior

对于合法允许的 null mark：

```text
markCoverage = PASS
```

diagnostic：

```text
code = CANONICAL_MARK_COVERAGE_INCOMPLETE
severity = P3
```

aggregate counts：

```text
p0_issue_count = 0
p1_issue_count = 0
p2_issue_count = 0
```

允许存在：

```text
P3 diagnostic
```

且：

```text
READY_TO_PUBLISH
```

保持不变。

---

## 6. Guard Condition

不能把所有：

```text
CANONICAL_MARK_COVERAGE_INCOMPLETE
```

无条件降级为 P3。

必须区分：

### Allowed Null Mark

```text
Existing staging rule explicitly permits null
```

结果：

```text
P3
```

### Real Missing Mark Defect

如果：

```text
Mark should exist

but parser failed to extract it
```

则仍然必须保留：

```text
P2 or stronger blocking classification
```

具体 severity 继续遵守现有 validation rules。

---

## 7. Minimal-Change Implementation

推荐最小修改：

```text
Locate diagnostic creation point

↓

Check whether missing mark is allowed by existing null-mark rule

↓

If allowed:
    severity = P3

Else:
    keep current blocking severity
```

不要重写 completeness gate。

不要重构 marks pipeline。

不要改变 stable parser behavior。

---

## 8. Regression Tests

至少新增以下测试。

### Test 1: Allowed Null Mark

输入：

```text
Leaf mark = null
Existing rule permits null
```

期望：

```text
markCoverage = PASS
diagnostic code = CANONICAL_MARK_COVERAGE_INCOMPLETE
diagnostic severity = P3
p2_issue_count = 0
publishable = true
READY_TO_PUBLISH
```

---

### Test 2: Real Missing Mark Defect

输入：

```text
Leaf mark missing
No existing rule permits null
```

期望：

```text
Do not downgrade to P3
```

保持现有 blocking semantics。

---

### Test 3: PR-038 Fixture

固定：

```text
0478_s21_qp_13.staging.json
```

重新生成后确认：

```text
validationStatus = PASS
completenessStatus = PASS
markCoverage = PASS
publishStatus = READY_TO_PUBLISH
p2_issue_count = 0
```

且相关 diagnostic：

```text
severity = P3
```

---

## 9. Full Regression Requirements

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

## 10. Production Safety

本修复不得写入 Production。

要求：

```text
productionWrite = false
```

验证：

```text
production store hash unchanged
```

---

## 11. Completion Criteria

完成条件：

```text
Allowed null-mark diagnostic severity aligned to P3

+

P2 aggregate count remains accurate

+

No publish behavior change

+

No parser behavior change

+

Regression PASS

+

Production unchanged
```

---

## 12. Final Target State

修复后语义应统一为：

```text
Allowed null mark
→ P3 diagnostic
→ markCoverage PASS
→ completeness PASS
→ READY_TO_PUBLISH
```

真实 mark extraction failure：

```text
Unexpected missing mark
→ keep blocking severity
→ normal validation/completeness rules apply
```
