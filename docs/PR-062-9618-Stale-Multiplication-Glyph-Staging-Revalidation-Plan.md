# PR-062 9618 Stale Multiplication-Glyph Staging Revalidation Plan

## 1. PR Overview

**PR ID**

```text
PR-062
```

**Title**

```text
9618 Stale Multiplication-Glyph Staging Revalidation
```

**Objective**

处理 PR-060 中识别出的 `STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC` 问题。

本 PR 只重新验证和更新旧 staging artifacts 中残留的合法 `×` suspicious glyph diagnostic。

本 PR 不修改：

- Parser
- Canonical Model
- Question Split
- Response Area Pipeline
- Mark Scheme Pipeline
- Production Store
- Source Assets
- `Ø` null-pointer validation rule

---

## 2. Current Project Status

PR-061 已完成：

```text
9618 Legal Null-Pointer Glyph Validation Rule Fix
```

PR-061 结果：

```text
status = PASS
productionWrite = false
```

已解决：

```text
CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE
```

涉及：

```text
9618-2021-MJ-21
9618-2021-MJ-23
```

这两个 QP 已经从：

```text
validationStatus = WARN
publishStatus = BLOCKED
P1 > 0
```

变为：

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P1 = 0
```

PR-061 没有处理 `×` stale diagnostic，因此下一步进入 PR-062。

---

## 3. Root Cause

PR-060 已确认：

7 个 blocked pair 的问题不是 parser 错误，也不是 canonical mapping 错误。

这些 pair 中的 `×` 符号是合法的：

- multiplication symbol
- screen resolution separator
- calculation notation

例如：

```text
1024 × 512
1280 × 800
2560 × 1600
```

当前 classifier 重新计算时：

```text
currentRecomputedSuspiciousCount = 0
```

但旧 staging artifact 中仍保留：

```text
storedSuspiciousCount > 0
SUSPICIOUS_GLYPHS_REMAIN
CANONICAL_TEXT_CLEAN failed
```

因此 root cause 是：

```text
STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC
```

不是：

```text
Parser Issue
Canonical Mapping Issue
Data Quality Issue
Human Review Required
```

---

## 4. Affected Scope

本 PR 只处理以下 7 个 pairing keys：

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
9618-2021-ON-22
9618-2024-ON-12
```

---

## 5. Affected Documents

### 9618-2021-MJ-11

Affected:

```text
QP
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2021-MJ-13

Affected:

```text
QP
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2021-MJ-31

Affected:

```text
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2021-MJ-32

Affected:

```text
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2021-MJ-33

Affected:

```text
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2021-ON-22

Affected:

```text
MS
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

### 9618-2024-ON-12

Affected:

```text
QP
```

Reason:

```text
stored × suspicious diagnostic is stale
current classifier recomputes zero suspicious glyphs
```

---

## 6. PR Goal

Goal:

```text
Regenerate and revalidate only the affected staging artifacts whose stored × diagnostic disagrees with the current classifier.
```

Expected result:

```text
SUSPICIOUS_GLYPHS_REMAIN removed
CANONICAL_TEXT_CLEAN PASS
validationStatus PASS
publishStatus READY_TO_PUBLISH
P1 = 0
```

Only for the affected documents listed in this plan.

---

## 7. Explicit Non-Goals

This PR must not:

```text
Modify parser
Modify canonical model
Modify question split
Modify response area pipeline
Modify mark scheme parser
Modify source assets
Write production
Publish newly eligible pairs
Change Ø validation rule
Add broad glyph allowlist
Regenerate unrelated staging artifacts
```

---

## 8. Minimal Change Requirement

This PR should be a revalidation/regeneration PR, not a code-design PR.

Allowed:

```text
Regenerate affected staging artifacts using current classifier
Update stale diagnostic fields
Rerun validation
Confirm affected documents become PASS
```

Not allowed:

```text
Broad validation rule change
Parser refactor
Canonical text builder change
Global glyph suppression
Production expansion
```

---

## 9. Affected Artifact List

Expected affected staging artifacts:

```text
output/phase2/staging/9618_s21_qp_11.staging.json
output/phase2/staging/9618_s21_ms_11.staging.json

output/phase2/staging/9618_s21_qp_13.staging.json
output/phase2/staging/9618_s21_ms_13.staging.json

output/phase2/staging/9618_s21_ms_31.staging.json
output/phase2/staging/9618_s21_ms_32.staging.json
output/phase2/staging/9618_s21_ms_33.staging.json

output/phase2/staging/9618_w21_ms_22.staging.json

output/phase2/staging/9618_w24_qp_12.staging.json
```

Total expected changed staging artifacts:

```text
9
```

No other staging artifacts should change.

---

## 10. Before State Requirements

Before revalidation, affected documents may show:

```text
validationStatus = WARN
publishStatus = BLOCKED
issueCodes includes SUSPICIOUS_GLYPHS_REMAIN
failedChecks includes CANONICAL_TEXT_CLEAN
storedSuspiciousCount > 0
currentRecomputedSuspiciousCount = 0
```

This mismatch is exactly the stale diagnostic.

---

## 11. After State Requirements

After revalidation, affected documents should show:

```text
validationStatus = PASS
publishStatus = READY_TO_PUBLISH
P0 = 0
P1 = 0
issueCodes = []
failedChecks = []
storedSuspiciousCount = 0
```

Completeness must remain:

```text
questionCoverage = PASS
leafCoverage = PASS
markCoverage = PASS
responseAreaCoverage = PASS
sourceTraceCoverage = PASS
canonicalStructureCompleteness = PASS
```

---

## 12. Integrity Requirements

### Production

Must remain unchanged:

```text
productionWrite = false
production unchanged = true
```

### Source Assets

Must remain unchanged:

```text
sourceAssets unchanged = true
```

### Staging

Only the 9 affected staging artifacts may change.

Must verify:

```text
actualChangedArtifacts == allowedChangedArtifacts
unrelatedArtifactsUnchanged = true
```

---

## 13. Regression Requirements

Must run and verify:

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
PR-061 PASS
```

Also:

```text
architectureFailures = []
documentRoleRegressions = []
phase1 = PASS
phase2 = PASS
fullNpmTest = PASS
prismaValidate = PASS
```

---

## 14. Specific Regression Checks

Must confirm:

### Legal ×

```text
1024 × 512
1280 × 800
2560 × 1600
```

are not suspicious in valid resolution/calculation contexts.

### Other suspicious glyphs

Other suspicious glyph detection remains active.

### Ø behavior from PR-061

Must remain stable:

```text
linked-list Ø context PASS
unrelated Ø remains suspicious
```

---

## 15. Production Write Rule

This PR:

```text
productionWrite = false
```

Even if affected pairs become eligible after this revalidation, do not publish them in PR-062.

Publishing must be handled by a later isolated production expansion PR.

---

## 16. Expected Result After PR-062

After PR-062, all 9 previously blocked pairs should be re-evaluated.

Expected:

```text
9618-2021-MJ-11 PASS
9618-2021-MJ-13 PASS
9618-2021-MJ-21 PASS
9618-2021-MJ-23 PASS
9618-2021-MJ-31 PASS
9618-2021-MJ-32 PASS
9618-2021-MJ-33 PASS
9618-2021-ON-22 PASS
9618-2024-ON-12 PASS
```

Note:

```text
MJ-21 and MJ-23 were fixed by PR-061.
PR-062 should preserve their PASS state.
```

---

## 17. Deliverables

### Revalidation Report

Suggested filename:

```text
pr062-9618-stale-multiplication-glyph-revalidation-report.json
```

### Regression Test

Suggested filename:

```text
pr062-9618-stale-multiplication-glyph-revalidation.test.js
```

### Updated Staging Artifacts

Only the allowed affected staging artifacts should change.

---

## 18. Report Requirements

Final report should include:

```text
generatedFor
status
productionWrite
scope
rootCause
affectedArtifacts
beforeState
afterState
validationResults
integrity
regression
remainingBlockedPairs
eligibleUnpublishedPairs
next
```

---

## 19. Success Criteria

PR-062 PASS conditions:

```text
status = PASS
productionWrite = false

All stale × diagnostics removed
All affected artifacts validationStatus = PASS
All affected artifacts publishStatus = READY_TO_PUBLISH
P1 = 0

Production unchanged
Source assets unchanged
Only allowed staging artifacts changed

Parser unchanged
Canonical model unchanged
Question split unchanged
Response area pipeline unchanged

PR-061 Ø behavior remains stable
fullNpmTest = PASS
architectureFailures = []
documentRoleRegressions = []
```

---

## 20. Failure Conditions

PR-062 must fail if:

### A. Production changes

```text
productionWrite = true
```

### B. Unrelated staging changes

```text
unrelatedArtifactsUnchanged = false
```

### C. Parser/canonical changes

Any parser or canonical model modification is out of scope.

### D. New glyph regression

Examples:

```text
unrelated Ø no longer suspicious
other suspicious glyphs no longer detected
legal × still flagged
```

### E. Remaining stale diagnostic

Any affected artifact still has:

```text
SUSPICIOUS_GLYPHS_REMAIN
CANONICAL_TEXT_CLEAN failed
P1 > 0
```

---

## 21. Next Step After PR-062

If PR-062 PASS, the formerly blocked pair set should become eligible for publication.

Next phase should be:

```text
PR-063
9618 Previously Blocked Pair Production Expansion
```

Potential scope:

```text
9618-2021-MJ-11
9618-2021-MJ-13
9618-2021-MJ-21
9618-2021-MJ-23
9618-2021-MJ-31
9618-2021-MJ-32
9618-2021-MJ-33
9618-2021-ON-22
9618-2024-ON-12
```

But the actual PR-063 scope must be based on PR-062 report output:

```text
eligibleUnpublishedPairs
remainingBlockedPairs
next
```

Do not assume all 9 are eligible until PR-062 confirms it.

---

## 22. Final Definition of Done

PR-062 is complete when:

```text
stale × diagnostics removed
only allowed staging artifacts changed
all affected documents validate PASS
no production write occurred
production store unchanged
source assets unchanged
parser unchanged
canonical model unchanged
PR-061 Ø behavior preserved
full regression passes
next production expansion candidates clearly listed
```
