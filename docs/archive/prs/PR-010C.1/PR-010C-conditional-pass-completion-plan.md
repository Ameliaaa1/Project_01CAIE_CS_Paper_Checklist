# PR-010C.1 Canonical Question Boundary Contract Completion Plan

## 1. Purpose

本文件用于将当前 **PR-010C: CONDITIONAL PASS** 推进到 **PR-010C: PASS**。

当前 PR-010C 已经完成正确的架构方向：

- 在 Canonical text serialization 之前定义唯一 span ownership；
- 使用 geometry-first visual order，而不是直接依赖 extraction `globalOrder`；
- 将 structural labels 和 mark allocations 定义为 metadata；
- 对 topology mismatch、ownership ambiguity 和 source-trace 缺失保持 fail-closed；
- 保持 Question、Child、Parent、Mark Scheme 和 Response Area identity 稳定。

但是，当前 `PR-010C-canonical-question-boundary-contract.md` 仍然只是原则级摘要，缺少足以让实现、测试、审计和后续迁移都使用同一解释的精确定义。

因此本阶段只完成：

```text
Contract Specification
+
Contract Schema
+
Contract Validator Interface
+
Contract-Level Regression Tests
```

本阶段不修复 PR-010D 的剩余数据问题，不执行 topology reconciliation，也不写入 Production。

---

## 2. Current Status

当前 Contract 已实现以下能力：

```json
{
  "geometryFirstOrder": true,
  "structuralLabelNormalizationCaseInsensitive": true,
  "markAllocationSeparation": true,
  "failClosedTopologyGate": true
}
```

当前 candidate validation 仍为：

```json
{
  "contractFailures": 34,
  "markTextPollution": 6,
  "structuralLabelPollution": 0,
  "highConfidenceChildTextLeakage": 6,
  "unresolvedTopologyAllocationTokens": 2,
  "topologyMismatchPapers": 31,
  "status": "BLOCKED"
}
```

这些数字不属于 PR-010C 的修复目标。

它们证明 Contract 已经能够阻止不合格 candidate。PR-010C 的任务是确保这个 Contract 本身：

- 定义完整；
- 结果确定；
- 输出可审计；
- 不依赖开发者临时解释；
- 可以作为 PR-010D、PR-010E 和 Production gate 的唯一规范。

---

## 3. Scope

### 3.1 Included

本阶段允许修改：

```text
docs/PR-010C-canonical-question-boundary-contract.md
src/ingestion/canonicalQuestionBoundaryContract.js
src/ingestion/questionRenderingContract.js
tests/*canonical-boundary-contract*.test.js
schemas/*canonical-boundary*.schema.json
scripts/pr010c-contract-validation.js
```

仅限以下职责：

- 补全 Contract 规范；
- 固化 validator 输入与输出；
- 固化 issue object schema；
- 增加确定性测试；
- 增加 contract completeness report；
- 为现有 34 个 failure 输出结构化证据，但不在本阶段修复它们。

---

### 3.2 Excluded

本阶段禁止：

- 修改 `questionSlicer` 的 child reconstruction 结果；
- 修改 PDF geometry reconstruction 行为；
- 修复 6 个 mark pollution；
- 修复 6 个 child leakage；
- 处理 2 个 unresolved allocation tokens；
- 处理 31 份 topology mismatch paper；
- 创建 alias map；
- 修改 Stable IDs；
- 写入 `output/production/production-store.json`；
- 重建正式 Frontend index；
- 修改 Frontend 或 CSS；
- 放宽 fail-closed 条件。

如果 Contract 补全导致现有 candidate 的 failure 分类更精确，允许 issue code 或 evidence 结构发生变化；但不得通过降低验证标准让 candidate 变成 PASS。

---

## 4. Required Contract Specification

更新后的 Contract 文档必须至少包含以下章节。

---

### 4.1 Contract Version

将 Contract 版本提升为：

```text
CANONICAL_QUESTION_BOUNDARY_CONTRACT
version: 1.1.0
```

版本规则：

- PATCH：只修改文档、message 或非语义字段；
- MINOR：新增兼容 issue code、owner type 或 evidence field；
- MAJOR：改变 ownership、boundary 或 publishability 语义。

每份 validation report 必须记录：

```json
{
  "contract": "CANONICAL_QUESTION_BOUNDARY_CONTRACT",
  "contractVersion": "1.1.0"
}
```

---

### 4.2 Source Span Schema

每个进入 Contract 的 source span 必须具有明确 schema：

```json
{
  "spanId": "string",
  "page": 1,
  "blockIndex": 0,
  "lineIndex": 0,
  "spanIndex": 0,
  "text": "string",
  "bbox": {
    "x0": 0,
    "y0": 0,
    "x1": 0,
    "y1": 0
  },
  "globalOrder": 0,
  "visualOrder": 0
}
```

必须明确：

- `spanId` 在一次 parse 内唯一；
- `bbox` 使用现有 PDF extraction coordinate system；
- `globalOrder` 只作证据；
- `visualOrder` 才能参与 ownership；
- 缺少 bbox 的 semantic span 必须进入 ambiguity 或 fallback path，不能静默假设顺序。

---

### 4.3 Owner Types

定义唯一 owner enum：

```text
PARENT_PREAMBLE
CHILD_QUESTION
NESTED_CHILD_QUESTION
RESPONSE_AREA
MARK_ALLOCATION
NEXT_TOP_LEVEL_QUESTION
EXCLUDED_PAGE_MATERIAL
UNRESOLVED
```

每个 source span 必须：

```text
exactly one owner
```

禁止：

- owner 为空；
- 同一 span 同时属于两个 child；
- label token 同时进入 semantic text；
- mark token 同时进入 semantic text；
- next-question span 保留在当前 child。

---

### 4.4 Owner Precedence

当同一个 span 同时匹配多个分类器时，必须使用固定优先级：

```text
1. EXCLUDED_PAGE_MATERIAL
2. NEXT_TOP_LEVEL_QUESTION
3. STRUCTURAL_ANCHOR_METADATA
4. MARK_ALLOCATION
5. RESPONSE_AREA
6. CHILD_QUESTION / NESTED_CHILD_QUESTION
7. PARENT_PREAMBLE
8. UNRESOLVED
```

说明：

- `STRUCTURAL_ANCHOR_METADATA` 是分类状态，不是最终 semantic owner；
- anchor 本身不进入 `questionText`；
- `UNRESOLVED` 必须阻止 publish。

不得由函数调用顺序隐式决定优先级。

---

### 4.5 Visual Line Grouping

不得使用没有文档说明的 magic number。

页面级 line grouping 使用 page-local span height：

```text
medianSpanHeight = 当前页面非空文本 span 高度中位数
```

两个 span 被视为同一视觉行，必须满足以下任一条件：

```text
verticalOverlapRatio >= 0.50
```

或：

```text
abs(centerY1 - centerY2) <= 0.35 * medianSpanHeight
```

并且：

```text
page 相同
```

实现中的常量必须集中定义：

```js
LINE_VERTICAL_OVERLAP_MIN = 0.50
LINE_CENTER_DISTANCE_FACTOR = 0.35
```

禁止散落在多个模块。

如果项目现有 fixture 证明上述阈值不适用于实际 coordinate scale，可以调整，但必须：

- 在 Contract 文档记录最终值；
- 在 report 中记录使用值；
- 添加导致调整的真实 PDF fixture；
- 保持重新运行结果确定。

---

### 4.6 Visual Order Tie-Break

视觉行内排序必须按以下顺序：

```text
1. x0 ascending
2. x1 ascending
3. blockIndex ascending
4. lineIndex ascending
5. spanIndex ascending
6. spanId lexical ascending
```

视觉行之间排序：

```text
1. page ascending
2. line top coordinate ascending
3. leftmost x0 ascending
4. first span original index ascending
```

任何 tie-break 都必须显式记录，不能依赖 JavaScript object insertion order。

---

### 4.7 Structural Anchor Grammar

Contract 必须定义支持的 anchor grammar：

```text
Top-level:
1
2
10

Alphabetic:
(a)
(b)
(A)
(B)

Roman:
(i)
(ii)
(ix)
(I)
(II)
(IX)

Printed combined reference:
5(a)
5(b)(ii)
```

必须区分：

- 页面上的独立结构标签；
- 正文中的自然语言引用，例如 `part (b)`；
- program code、array index 或数学表达式中的括号；
- 大写 Roman marker；
- OCR 或 PDF extraction 拆分后的 marker token。

只有满足 geometry、line position 和 hierarchy context 的 marker 才能成为 structural anchor。

不得仅用全局 regex 删除正文中的所有 `(a)`、`(i)`。

---

### 4.8 Hierarchy State Machine

定义以下层级：

```text
LEVEL_0 = top-level question
LEVEL_1 = alphabetic child
LEVEL_2 = Roman nested child
LEVEL_3 = deeper supported nested child
```

状态转换至少包含：

```text
Q → A
A → A
A → I
I → I
I → A
A → Q
I → Q
```

规则：

- 同级 anchor 终止前一个同级 owner；
- 更高层 anchor 终止所有更低层 owner；
- 更低层 anchor 创建 nested owner；
- 不允许在没有 parent anchor 的情况下创建 nested child；
- 非法跳级进入 `AMBIGUOUS_SPAN_OWNERSHIP`；
- hierarchy path 必须可序列化，例如：

```json
{
  "questionNumber": "5",
  "sectionPath": ["b", "ii"]
}
```

---

### 4.9 Child Boundary Termination

每个 child 必须在以下最早事件前终止：

```text
next sibling anchor
next ancestor-level anchor
next top-level question anchor
explicit section boundary
paper end
```

必须明确：

- mark allocation 不延长 semantic boundary；
- response area 可以属于当前 child，但不进入 `questionText`；
- 跨页 continuation 只有在下一页没有 successor anchor 时继续；
- footer、page number、copyright、blank instruction 不能延长 child；
- next top-level question introduction 不得进入当前最后一个 child。

---

### 4.10 Mark Allocation Classification

Mark allocation 必须同时满足：

```text
token pattern
+
geometry position
+
existing marks evidence or allocation context
```

支持形式：

```text
[1]
[2]
[10]
one [1]
two [2]
three [3]
```

但必须区分：

- 真实 mark allocation；
- 正文中的数组索引；
- pseudocode 中的方括号；
- SQL 或 programming syntax；
- table cell content；
- blank placeholder，例如 `[BLANK_1]`。

最低规则：

```text
[BLANK_n] 永远不是 mark allocation
```

普通 `[n]` 只有在以下情形才能移出 semantic text：

- 位于 question prompt 末端或右侧 allocation 区域；
- 与 canonical `marks` 一致；
- 不属于 code/table/response-area owner；
- source trace 可以定位该 token。

不满足时进入：

```text
AMBIGUOUS_SPAN_OWNERSHIP
```

不得为了消除 pollution 统计直接删除。

---

### 4.11 Excluded Page Material

Contract 必须明确 excluded material：

```text
page number
copyright/footer text
turn-over instruction
blank page instruction
exam header repeated content
administrative barcode or candidate field label
```

每个 excluded span 必须保留 source trace 和 exclusion reason：

```json
{
  "ownerType": "EXCLUDED_PAGE_MATERIAL",
  "exclusionCode": "PAGE_FOOTER"
}
```

不得仅从最终 text 中消失而没有证据。

---

### 4.12 Ambiguity Policy

以下情况必须 fail-closed：

- 缺失 bbox；
- 两个 anchor 几何位置冲突；
- hierarchy 非法跳级；
- mark allocation 与 code token 无法区分；
- semantic span 无 owner；
- topology 变化未决；
- source trace 不完整；
- owner confidence 低于项目设定阈值。

统一输出：

```json
{
  "status": "REVIEW_REQUIRED",
  "canonicalPublishable": false,
  "issueCodes": [
    "AMBIGUOUS_SPAN_OWNERSHIP"
  ]
}
```

不得自动把 ambiguity span 归给前一个 child。

---

## 5. Issue Object Schema

所有 blocking 和 warning issue 必须使用同一结构：

```json
{
  "issueId": "string",
  "code": "MARK_ALLOCATION_IN_TEXT",
  "severity": "BLOCKING",
  "paperId": "string",
  "questionId": "string",
  "childId": "string|null",
  "ownerPath": ["b", "ii"],
  "message": "string",
  "failedInvariant": "string",
  "sourceSpanIds": ["string"],
  "sourceEvidence": {
    "page": 1,
    "bbox": null,
    "text": "string"
  },
  "candidateEvidence": {
    "questionText": "string",
    "marks": 1
  },
  "detectedBy": "string",
  "responsibleStage": "CONTRACT_VALIDATION",
  "publishBlocking": true
}
```

要求：

- `code` 必须来自固定 enum；
- `failedInvariant` 必须引用 Contract section；
- 每个 issue 至少有 source 或 candidate evidence；
- `childId` 不适用时为 `null`；
- 不允许只有 count，没有 issue details；
- 同一个根因不得因为不同统计器重复生成无法关联的 issue。

---

## 6. Issue Code Registry

Contract 文档必须为每个 code 定义：

- 触发条件；
- severity；
- publish behavior；
- 必需 evidence；
- 示例；
- owner responsibility。

至少包含：

```text
CHILD_SPAN_OVERLAP
CHILD_SUCCESSOR_LEAKAGE
NEXT_QUESTION_LEAKAGE
MARK_ALLOCATION_IN_TEXT
STRUCTURAL_LABEL_IN_TEXT
UNOWNED_SEMANTIC_SPAN
AMBIGUOUS_SPAN_OWNERSHIP
TOPOLOGY_CHANGE_UNREVIEWED
SOURCE_TRACE_INCOMPLETE
INVALID_HIERARCHY_TRANSITION
DUPLICATE_SPAN_OWNER
EXCLUDED_MATERIAL_IN_TEXT
```

Contract 可以新增 code，但不能删除现有 blocking 语义。

---

## 7. Validator Input Schema

Validator 输入至少为：

```json
{
  "contractVersion": "1.1.0",
  "paper": {},
  "sourceSpans": [],
  "visualLines": [],
  "anchors": [],
  "ownershipAssignments": [],
  "canonicalQuestion": {},
  "topologyState": {}
}
```

必须验证：

- 必填字段；
- ID 唯一性；
- visual order 单调性；
- span ownership 完整性；
- owner path 合法性；
- semantic text 与 owned spans 一致；
- mark、label 和 response area 分离；
- topology publishability；
- source trace 完整性。

---

## 8. Validator Output Schema

Validator 输出必须为：

```json
{
  "contract": "CANONICAL_QUESTION_BOUNDARY_CONTRACT",
  "contractVersion": "1.1.0",
  "status": "PASS|BLOCKED|REVIEW_REQUIRED",
  "canonicalPublishable": false,
  "summary": {
    "blockingIssues": 0,
    "warningIssues": 0
  },
  "checks": {
    "singleOwnerValid": true,
    "visualOrderValid": true,
    "hierarchyValid": true,
    "childBoundariesValid": true,
    "marksSeparated": true,
    "labelsSeparated": true,
    "responseAreasSeparated": true,
    "nextQuestionIsolationValid": true,
    "sourceTraceComplete": true,
    "topologyReviewed": true
  },
  "issues": []
}
```

状态规则：

```text
PASS:
blockingIssues = 0
canonicalPublishable = true

BLOCKED:
存在确定的 blocking violation
canonicalPublishable = false

REVIEW_REQUIRED:
存在 ambiguity 或 topology unresolved
canonicalPublishable = false
```

---

## 9. Required Tests

新增或补全：

```text
tests/pr010c-contract-schema.test.js
tests/pr010c-visual-line-grouping.test.js
tests/pr010c-visual-order-tiebreak.test.js
tests/pr010c-anchor-grammar.test.js
tests/pr010c-hierarchy-state-machine.test.js
tests/pr010c-mark-allocation-classification.test.js
tests/pr010c-excluded-material.test.js
tests/pr010c-ambiguity-fail-closed.test.js
tests/pr010c-issue-schema.test.js
tests/pr010c-validator-io-schema.test.js
tests/pr010c-deterministic-rerun.test.js
```

最低 fixture 覆盖：

- 0478 same-line `(a)` prompt；
- 9618 nested Roman child；
- uppercase `(IX)`；
- `[BLANK_1]` 不作为 mark；
- code 中 `[1]` 不作为 mark；
- terminal `[2]` 作为 allocation；
- next top-level question isolation；
- missing bbox；
- illegal hierarchy transition；
- duplicate span owner；
- excluded footer；
- unresolved topology。

---

## 10. Determinism Requirement

相同 source input 连续运行两次，以下内容必须完全一致：

```text
visual line membership
visual order
anchor sequence
owner assignment
issue codes
issue ordering
validator status
canonicalPublishable
```

除 `generatedAt` 外，两个 JSON report 必须 deep-equal。

Issue 排序规则：

```text
paperId
questionId
childId
page
sourceSpanIds[0]
code
```

---

## 11. Required Deliverables

完成后必须生成：

```text
docs/PR-010C-canonical-question-boundary-contract.md

schemas/canonical-question-boundary-contract-input.schema.json
schemas/canonical-question-boundary-contract-output.schema.json
schemas/canonical-question-boundary-issue.schema.json

pr010c-contract-completeness-report.json
pr010c-contract-validation-report.json
pr010c-contract-determinism-report.json
```

`pr010c-contract-completeness-report.json` 至少包含：

```json
{
  "contractVersion": "1.1.0",
  "documentationComplete": true,
  "inputSchemaValid": true,
  "outputSchemaValid": true,
  "issueSchemaValid": true,
  "issueRegistryComplete": true,
  "geometryRulesDocumented": true,
  "hierarchyRulesDocumented": true,
  "ambiguityRulesDocumented": true,
  "deterministicRerun": true,
  "productionWrite": false,
  "status": "PASS"
}
```

---

## 12. PR-010C Acceptance Criteria

PR-010C 可以从 `CONDITIONAL PASS` 升级为 `PASS`，必须同时满足：

1. Contract version 更新为 `1.1.0`；
2. source span、owner、issue、validator input/output 均有正式 schema；
3. visual line tolerance 和 tie-break 有明确规则；
4. hierarchy state machine 有完整转换规则；
5. mark allocation classification 不会误删 `[BLANK_n]`、code 或 table content；
6. excluded page material 有 reason 和 source trace；
7. 所有 issue code 有 trigger、severity、evidence 和 publish behavior；
8. ambiguity 必须 fail-closed；
9. 相同输入重复运行结果确定；
10. Contract report 不再只提供 `contractFailures: 34`，而是同时提供结构化 `issues[]`；
11. Production、Frontend 和 Stable IDs 没有变化；
12. candidate 可以继续保持 `BLOCKED`，因为剩余数据修复属于 PR-010D；
13. 不得通过降低 Contract 标准获得 PASS。

---

## 13. Explicit Stage Boundary

PR-010C 完成后，允许进入：

```text
PR-010D.1 Residual Contract Failure Investigation
```

但 PR-010C 本身不得处理：

```text
34 contract failures
6 mark pollution
6 child leakage
2 unresolved allocation tokens
31 topology mismatch papers
```

本阶段的完成定义是：

```text
The contract is complete, deterministic and auditable.
```

不是：

```text
The candidate data already passes the contract.
```

先把规则写清楚，再修数据。否则每修一次规则就跟着移动一次，项目会非常勤奋地原地踏步。
