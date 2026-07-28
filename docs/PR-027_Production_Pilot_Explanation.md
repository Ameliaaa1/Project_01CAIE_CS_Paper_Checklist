# PR-027_Production_Pilot_Explanation

## PR Title

Production Pilot for 0478 2023 May-June Component 12

------------------------------------------------------------------------

## 1. Background

当前项目已经完成：

-   PR-020 Mark Scheme Document Profile Separation
-   PR-022 Legacy Mark Scheme Barcode Region Classification Support
-   PR-023 Mark Sum Validation Investigation
-   PR-025 Question Marker Boundary Detection for Pseudocode and Numeric
    Content
-   PR-024 Back Matter Detection Investigation
-   PR-026 Canonical Completeness Gate Foundation

当前验证状态：

``` text
Phase 1:
20 / 20 PASS

Phase 2:
120 / 120 PASS

Success Rate:
100%
```

同时：

``` text
architectureFailures = []
documentRoleRegressions = []
textQualityRegressions = []
datasetGaps = []
```

Canonical Completeness Gate 已完成。

因此，下一步应进入：

``` text
Production Pilot
```

------------------------------------------------------------------------

## 2. Objective

PR-027 唯一目标：

``` text
将一组已经通过 Parser、Staging Validation 和 Canonical Completeness Gate 的 QP/MS Pair
安全写入 Production，并完成 End-to-End Frontend 验证。
```

本 PR 不进行 Full Production。

本 PR 只验证：

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
Frontend
```

是否完整可用。

------------------------------------------------------------------------

## 3. Pilot Dataset

推荐 Pilot：

``` text
Syllabus:
0478

Year:
2023

Session:
May-June

Component:
12
```

文件：

``` text
0478_s23_qp_12.pdf
0478_s23_ms_12.pdf
```

原因：

-   QP / MS 成对
-   Phase 1 已通过
-   Phase 2 已通过
-   Document Role Router 已验证
-   Question Paper Pipeline 已验证
-   Mark Scheme Pipeline 已验证
-   TEXT Quality Pipeline 已验证
-   Response Area Pipeline 已验证
-   Staging Workflow 已验证

------------------------------------------------------------------------

## 4. Scope

### Allowed Changes

允许：

-   新增 Production Pilot runner
-   新增 Publish Gate integration
-   新增 Production write path
-   新增 Production transaction / rollback
-   新增 Pilot verification report
-   新增 Frontend smoke verification
-   新增 QP/MS pairing verification
-   新增 production-specific regression fixture

### Forbidden Changes

禁止修改：

-   Parser
-   Question Split
-   Stable Question ID
-   Parent / Leaf Model
-   Marks Validation
-   Binary Operand Preservation
-   Negative Number Preservation
-   TEXT Quality Pipeline
-   Response Area Pipeline
-   Document Role Router
-   Canonical Schema
-   PR-026 completeness rules

------------------------------------------------------------------------

## 5. Required Preconditions

Production write 之前，必须全部满足：

``` text
Parser status = PASS
Staging validation = PASS
Canonical Completeness Gate = PASS
publishable = true
```

如果任何一项失败：

``` text
Production write = BLOCKED
```

禁止绕过。

------------------------------------------------------------------------

## 6. Publish Gate

建议流程：

``` text
Staging JSON
 |
 v
Re-read from disk
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

Publish Gate 必须检查：

-   staging artifact exists
-   validation PASS
-   completeness status PASS
-   publishable = true
-   correct documentRole
-   supported syllabus only
-   no unresolved P0
-   no duplicate production identity conflict

------------------------------------------------------------------------

## 7. Supported Syllabus Rule

当前只支持：

``` text
0478
9618
```

必须明确：

``` text
9709
```

不参与：

-   Production Pilot
-   Dataset Gap
-   Completeness failure
-   Publish eligibility

------------------------------------------------------------------------

## 8. Production Identity

写入 Production 前，必须定义稳定唯一身份。

建议至少使用：

``` text
syllabus
year
session
component
documentRole
```

例如：

``` text
0478-2023-MJ-12-QP
0478-2023-MJ-12-MS
```

禁止：

-   同一 document identity 重复插入
-   silently overwrite
-   生成随机 production identity

------------------------------------------------------------------------

## 9. Production Write Strategy

建议采用：

``` text
Atomic Transaction
```

流程：

``` text
BEGIN TRANSACTION

write paper
write questions
write leaf questions
write response areas
write mark scheme entries
write source traces
write pairing metadata

validate inserted state

COMMIT
```

任何一步失败：

``` text
ROLLBACK
```

禁止部分写入。

------------------------------------------------------------------------

## 10. QP / MS Pairing Verification

Pilot 必须验证：

``` text
0478_s23_qp_12
        |
        v
matches
        |
        v
0478_s23_ms_12
```

至少检查：

-   syllabus
-   year
-   session
-   component
-   role complement
-   expected pairing key

建议输出：

``` json
{
  "pairingStatus": "PASS",
  "questionPaperId": "0478-2023-MJ-12-QP",
  "markSchemeId": "0478-2023-MJ-12-MS"
}
```

------------------------------------------------------------------------

## 11. Production Verification

写入后重新读取 Production。

禁止只相信 write response。

必须验证：

-   paper record exists
-   question count correct
-   leaf count correct
-   response areas present
-   mark scheme entries present
-   source trace available
-   QP/MS pair linked

建议：

``` text
Write
 |
 v
Re-read Production
 |
 v
Compare against Staging
```

------------------------------------------------------------------------

## 12. Data Count Verification

至少验证：

### Question Paper

``` text
questionCount
leafQuestionCount
responseAreaCount
```

### Mark Scheme

``` text
markSchemeEntryCount
```

不得出现：

``` text
Staging count != Production count
```

如果出现：

``` text
Pilot FAIL
Rollback required
```

------------------------------------------------------------------------

## 13. Frontend Verification

Production Pilot 完成后，必须验证前端。

至少检查：

### Question Finder

确认：

-   题目可搜索
-   Question ID 正确
-   question text 正确
-   leaf structure 正确

### Knowledge Checklist

确认：

-   production question 能正常进入 checklist
-   不出现 duplicate
-   不出现 orphan question

### Mark Scheme Search

确认：

-   Mark Scheme 可检索
-   与对应 QP 关联正确

### AI Retrieval

确认：

-   AI retrieval 使用 production data
-   可返回正确 question context
-   source trace 可用

### Open Original Question

确认：

-   能打开原始 PDF
-   跳转/定位逻辑正常
-   不离开当前用户流程

### QP/MS Correspondence

确认：

``` text
QP question
 |
 v
correct MS entry
```

------------------------------------------------------------------------

## 14. Pilot Report

建议生成：

``` text
output/production-pilot/pr027-production-pilot-report.json
```

包含：

``` json
{
  "pilot": "0478-2023-MJ-12",
  "status": "PASS",
  "productionWrite": true,
  "publishGate": "PASS",
  "qp": {
    "status": "PASS"
  },
  "ms": {
    "status": "PASS"
  },
  "pairing": "PASS",
  "productionVerification": "PASS",
  "frontendVerification": {
    "questionFinder": "PASS",
    "knowledgeChecklist": "PASS",
    "markSchemeSearch": "PASS",
    "aiRetrieval": "PASS",
    "openOriginalQuestion": "PASS",
    "qpMsCorrespondence": "PASS"
  },
  "issues": []
}
```

------------------------------------------------------------------------

## 15. Failure Handling

任何以下情况发生：

``` text
Publish Gate FAIL
Production transaction FAIL
Count mismatch
Pairing mismatch
Frontend critical failure
Unexpected duplicate
Source trace missing
```

必须：

``` text
Pilot FAIL
```

并根据 write state：

``` text
ROLLBACK
```

或：

``` text
Delete Pilot Dataset
```

禁止继续扩大 Production scope。

------------------------------------------------------------------------

## 16. Rollback Strategy

必须支持：

``` text
Remove exact Pilot dataset only
```

例如：

``` text
0478-2023-MJ-12-QP
0478-2023-MJ-12-MS
```

禁止：

``` text
wipe entire Production
```

建议 rollback key：

``` text
pilotBatchId
```

例如：

``` text
PR027-0478-2023-MJ-12
```

------------------------------------------------------------------------

## 17. Regression Requirements

PR-027 必须保证：

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

Canonical Completeness Gate 继续：

``` text
PASS
```

------------------------------------------------------------------------

## 18. Acceptance Criteria

PR-027 完成条件：

-   0478_s23_qp_12 passes Publish Gate
-   0478_s23_ms_12 passes Publish Gate
-   Production write succeeds
-   Production write is atomic
-   Production re-read matches Staging
-   QP/MS pairing verified
-   Question counts match
-   Leaf counts match
-   Response area counts match
-   Mark scheme entry counts match
-   Source trace available
-   Question Finder works
-   Knowledge Checklist works
-   Mark Scheme Search works
-   AI Retrieval works
-   Open Original Question works
-   QP/MS correspondence works
-   Rollback path tested
-   Phase 1 unchanged
-   Phase 2 unchanged
-   Stable modules unchanged

------------------------------------------------------------------------

## 19. Out of Scope

PR-027 不做：

-   Full Production
-   All PDF migration
-   New syllabus support
-   9709 support
-   Parser refactor
-   Canonical schema migration
-   Frontend redesign
-   Bulk ingestion expansion

------------------------------------------------------------------------

## 20. Next Step After PR-027

如果 Pilot PASS：

下一步进入：

``` text
Production Expansion Plan
```

建议顺序：

``` text
Step 1:
Expand same syllabus / same year

Step 2:
Expand same syllabus / multiple years

Step 3:
Add 9618 production batch

Step 4:
Full Production migration
```

不要：

``` text
120 PDFs
 |
 v
全部直接写入 Production
```

------------------------------------------------------------------------

## Final Decision

当前状态：

``` text
Phase 1 Complete
Phase 2 Complete
Issue Resolution Complete
Canonical Completeness Gate Complete
```

下一步：

``` text
PR-027
Production Pilot for 0478 2023 May-June Component 12
```

唯一目标：

``` text
验证一组通过所有 Gate 的 QP/MS Pair
能否安全进入 Production 并在 Frontend 正常工作。
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
Canonical Completeness Gate rules unchanged
```

END
