# Past Paper JSON 解析问题专项解决方案

> **适用对象**：`0478_s25_qp_12.pdf` 及同类 Cambridge Question Paper JSON  
> **目标**：修复当前 JSON 中 leaf question 页码、父子 ID、上下文、文本清洗、视觉题标记和 confidence 等系统性问题，使其可以作为 MVP 的正式数据源。  
> **优先级**：先修 QP 结构化，再接 Mark Scheme 和 Knowledge Point Mapping。  
> **建议执行者**：Codex + 项目开发人员  
> **版本**：v1.0

---

# 1. 当前状态

当前 JSON 已完成：

- Paper metadata 提取
- 相对路径保存
- pageType 初步分类
- OCR 判断
- 大题识别
- leaf question 拆分
- marks 提取
- confidence breakdown
- reviewStatus

但仍存在以下阻塞生产导入的问题：

| 问题 | 当前表现 | 优先级 |
|---|---|---|
| 大题 pageEnd 错误 | Q1 被标记为 2–4，实际应为 2–3 | P0 |
| leaf question 页码错误 | 所有 leaf 继承整个 parent 页码 | P0 |
| parentQuestionId 无效 | 指向不存在的 `Q1-Q1`、`Q3-Q3-b` | P0 |
| question ID 重复 | `Q1-Q1-a` 重复包含题号 | P0 |
| leaf 缺少上下文 | `2(b)(i)` 缺少 3072 bytes | P0 |
| 乱码残留 | `È Å ¶ , ,` 等进入 text | P0 |
| confidence 过高 | 结构错误仍标为 AUTO_CANDIDATE | P0 |
| visual 标记误判 | 页面有视觉元素时，页内多题全部标 true | P1 |
| barcode 未清理 | `* 0000800000002 *` 进入 preview | P1 |
| 混合页面无法表达 | 第12页同时有题目与版权内容 | P1 |
| textQuality 字段歧义 | 两层 characters 含义不同 | P1 |

---

# 2. 修复目标

完成后必须满足：

1. 每个 top-level question 的 `pageStart/pageEnd` 正确。
2. 每个 leaf question 独立计算页码。
3. 每个 `parentQuestionId` 指向真实存在的记录。
4. question ID 无重复片段，且跨批次稳定。
5. leaf question 带有完成作答所需的 parent context。
6. `displayText` 不包含 barcode、乱码、页眉、页脚、Working space 和版权内容。
7. `hasVisualContent` 按 question bounding box 判断。
8. 结构校验失败时禁止 `AUTO_CANDIDATE`。
9. 所有 marks 可完成 leaf → parent → paper 三层校验。
10. 当前样本成为 golden fixture，后续 parser 变更必须通过回归测试。

---

# 3. 推荐数据结构

## 3.1 Paper

```json
{
  "id": "0478-2025-MJ-12-QP",
  "paperGroupId": "0478-2025-MJ-12",
  "subjectCode": "0478",
  "year": 2025,
  "session": "MJ",
  "documentRole": "question_paper",
  "component": "12",
  "paperNumber": "1",
  "variant": "2",
  "storageKey": "pastpaper/caie-igcse-0478/2025-May-June/0478_s25_qp_12.pdf",
  "fileHash": "...",
  "schemaVersion": "1.0.0",
  "parserVersion": "0.4.0"
}
```

## 3.2 Page

```json
{
  "id": "0478-2025-MJ-12-QP-P12",
  "paperId": "0478-2025-MJ-12-QP",
  "pageNumber": 12,
  "pageType": "mixed",
  "rawText": "...",
  "normalizedText": "...",
  "displayText": "...",
  "imagePath": "rendered/0478-2025-MJ-12-QP/page-012.webp",
  "requiresOcr": false,
  "hasVisualContent": false,
  "containsBackMatter": true,
  "contentRegions": [
    {
      "type": "question_content",
      "yTop": 842,
      "yBottom": 530
    },
    {
      "type": "back_matter",
      "yTop": 520,
      "yBottom": 0
    }
  ],
  "textQuality": {
    "rawCharacterCount": 2963,
    "normalizedCharacterCount": 238,
    "alphaNumericRatio": 0.777,
    "suspiciousGlyphCount": 0
  }
}
```

## 3.3 Leaf Question

```json
{
  "id": "0478-2025-MJ-12-Q2-B-I",
  "paperId": "0478-2025-MJ-12-QP",
  "parentQuestionId": "0478-2025-MJ-12-Q2",
  "questionNumber": "2(b)(i)",
  "sectionPath": ["2", "b", "i"],
  "depth": 2,
  "isLeaf": true,
  "contextText": "The size of the image file is 3072 bytes.",
  "questionText": "Give the size of the image file in kibibytes (KiB).",
  "displayText": "The size of the image file is 3072 bytes.\n(i) Give the size of the image file in kibibytes (KiB). [1]",
  "pageStart": 4,
  "pageEnd": 4,
  "marks": 1,
  "hasVisualContent": false,
  "visualType": null,
  "questionImagePath": null,
  "confidence": {
    "marker": 0.98,
    "boundary": 0.98,
    "text": 0.97,
    "marks": 0.99,
    "layout": 0.95,
    "structure": 0.98,
    "overall": 0.97
  },
  "issues": [],
  "reviewStatus": "AUTO_CANDIDATE"
}
```

---

# 4. 解决方案一：修复 top-level question 页码

## 4.1 问题原因

当前逻辑大概率为：

```text
当前题 pageEnd = 下一题 marker 所在页
```

因此：

```text
Q1 → 2–4
Q2 → 4–6
Q3 → 6–9
Q4 → 9–10
```

但下一道题所在页不等于上一道题实际结束页。

## 4.2 正确方案

所有 text block 必须有：

```ts
type TextBlock = {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  readingOrder: number;
  globalOrder: number;
  text: string;
};
```

每个 question marker 保存 `globalOrder`。

```ts
const startOrder = currentQuestion.marker.globalOrder;
const endOrder = nextQuestion
  ? nextQuestion.marker.globalOrder
  : documentContentEndOrder;

const assignedBlocks = blocks.filter(
  block =>
    block.globalOrder >= startOrder &&
    block.globalOrder < endOrder &&
    block.regionType !== "header" &&
    block.regionType !== "footer" &&
    block.regionType !== "barcode" &&
    block.regionType !== "back_matter"
);

const pageStart = Math.min(...assignedBlocks.map(b => b.pageNumber));
const pageEnd = Math.max(...assignedBlocks.map(b => b.pageNumber));
```

## 4.3 当前样本预期

```text
Q1: 2–3
Q2: 4–5
Q3: 6–8
Q4: 9–9
Q5: 10–12
```

Q5 的第12页仍包含 `5(c)(ii)`，所以 Q5 可以结束于第12页，但必须在版权内容开始前截断。

---

# 5. 解决方案二：leaf question 独立边界

## 5.1 问题原因

当前所有 leaf question 直接继承 parent：

```ts
leaf.pageStart = parent.pageStart;
leaf.pageEnd = parent.pageEnd;
```

## 5.2 正确方案

每个 leaf question 都有自己的 start marker、end marker、assigned blocks 和 page range。

```ts
function assignLeafRange(
  leafStart: Marker,
  nextLeafStart: Marker | undefined,
  parentEndOrder: number,
  blocks: TextBlock[]
) {
  const endOrder = nextLeafStart?.globalOrder ?? parentEndOrder;

  const leafBlocks = blocks.filter(
    block =>
      block.globalOrder >= leafStart.globalOrder &&
      block.globalOrder < endOrder
  );

  return {
    pageStart: Math.min(...leafBlocks.map(b => b.pageNumber)),
    pageEnd: Math.max(...leafBlocks.map(b => b.pageNumber)),
    blocks: leafBlocks
  };
}
```

## 5.3 当前样本预期页码

| Leaf Question | pageStart | pageEnd |
|---|---:|---:|
| 1(a)–1(d) | 2 | 2 |
| 1(e)–1(g) | 3 | 3 |
| 2(a)–2(c)(ii) | 4 | 4 |
| 2(d) | 5 | 5 |
| 3(a)–3(b)(i) | 6 | 6 |
| 3(b)(ii)–3(c)(ii) | 7 | 7 |
| 3(c)(iii) | 8 | 8 |
| 4(a)–4(b) | 9 | 9 |
| 5(a)–5(b)(ii) | 10 | 10 |
| 5(b)(iii)–5(c)(i) | 11 | 11 |
| 5(c)(ii) | 12 | 12 |

该表必须进入 golden fixture 测试。

---

# 6. 解决方案三：稳定 ID 和父子关系

## 6.1 当前错误

```text
0478-s-25-12-Q1-Q1-a
0478-s-25-12-Q3-Q3-b-ii
```

并且 parent record 不存在。

## 6.2 ID 规范

```ts
paperGroupId = "0478-2025-MJ-12";
paperId = "0478-2025-MJ-12-QP";

topLevelQuestionId = `${paperGroupId}-Q${topLevel}`;
leafQuestionId = `${paperGroupId}-Q${normalizedPath}`;
```

示例：

```text
0478-2025-MJ-12-Q1
0478-2025-MJ-12-Q1-A
0478-2025-MJ-12-Q3-B-I
0478-2025-MJ-12-Q5-C-II
```

## 6.3 MVP 父子结构

MVP 建议只持久化 top-level question 和 leaf question，不强制建立 `Q3-B` 中间实体。

```json
{
  "id": "0478-2025-MJ-12-Q3-B-II",
  "parentQuestionId": "0478-2025-MJ-12-Q3",
  "sectionPath": ["3", "b", "ii"]
}
```

出现 `MISSING_PARENT_QUESTION` 时禁止自动发布。

---

# 7. 解决方案四：parent context inheritance

## 7.1 问题

当前 `2(b)(i)` 缺少：

```text
The size of the image file is 3072 bytes.
```

## 7.2 文本字段

每个 leaf question 保存：

```text
contextText
questionText
displayText
searchText
```

示例：

```json
{
  "contextText": "The size of the image file is 3072 bytes.",
  "questionText": "Give the size of the image file in kibibytes (KiB).",
  "displayText": "The size of the image file is 3072 bytes.\n(i) Give the size of the image file in kibibytes (KiB). [1]",
  "searchText": "image file size 3072 bytes kibibytes KiB"
}
```

Leaf context 来源：

1. top-level stem
2. 当前 `(a)/(b)/(c)` parent stem
3. 当前 `(i)/(ii)` 自身文本

但不要无限复制整道大题。

---

# 8. 解决方案五：文本清洗

## 8.1 三层文本

必须分开：

```text
rawText
normalizedText
displayText
```

### rawText

- 原始提取
- 永不覆盖
- 仅用于调试

### normalizedText

删除：

- 重复页眉页脚
- barcode
- 异常控制字符
- OCR replacement characters
- 重复答题线
- back matter

保留：

- 题号
- 选项
- 二进制
- 数学符号
- marks

### displayText

在 normalizedText 基础上进一步删除：

- `Working space`
- 纯作答占位内容
- 无意义孤立数字
- 页面装饰

## 8.2 Barcode 清洗

```ts
const BARCODE_PATTERNS = [
  /^\*\s*\d{10,16}\s*\*$/gm,
  /^\*\s*(?:\d\s*){8,16}\*$/gm
];
```

## 8.3 乱码检测

不能只检测 `�`。

```ts
const suspiciousChars = /[¬¦¤ªºµ¶·¸¿À-Þ]/g;
```

再结合字体、坐标、页边缘位置、多页重复频率和单词结构，删除：

```text
È Å ¶ , ,
¬Wz> 4mHuOªE
```

---

# 9. 解决方案六：视觉题检测

## 9.1 当前错误

当前可能使用：

```ts
leaf.hasVisualContent = page.hasVisualContent;
```

## 9.2 正确方案

先识别视觉区域：

```ts
type VisualRegion = {
  pageNumber: number;
  type: "table" | "diagram" | "tick_box" | "image" | "other";
  bbox: BoundingBox;
};
```

再判断是否和 question bbox 相交：

```ts
leaf.hasVisualContent = visualRegions.some(region =>
  region.pageNumber === leaf.pageNumber &&
  intersectionRatio(region.bbox, leaf.bbox) >= 0.1
);
```

## 9.3 当前样本预期

| Question | hasVisualContent | visualType |
|---|---|---|
| 2(a) | true | tick_box |
| 2(b)(i) | false | null |
| 2(c)(ii) | false | null |
| 2(d) | false | null |
| 4(a) | true | table |
| 4(b) | false | null |
| 5(c)(i) | true | diagram |
| 5(c)(ii) | false | null |

视觉题必须生成 `questionImagePath`。

---

# 10. 解决方案七：第12页混合内容

第12页同时包含 Question 5(c)(ii) 和版权说明。

推荐：

```json
{
  "pageType": "mixed",
  "containsBackMatter": true
}
```

检测第一个 back matter block：

```ts
const backMatterStart = blocks.find(block =>
  /Permission to reproduce items/i.test(block.text)
);
```

Q5(c)(ii) 只能获取该 block 之前的内容。

---

# 11. 解决方案八：Confidence 和 Review Status

增加 `structure` 维度：

```json
{
  "marker": 0.95,
  "boundary": 0.55,
  "text": 0.72,
  "marks": 0.98,
  "layout": 0.75,
  "structure": 0.40,
  "overall": 0.69
}
```

自动扣分：

```ts
if (missingParentEntity) structure -= 0.50;
if (leafUsesParentFullPageRange) boundary -= 0.35;
if (containsSuspiciousGlyphs) text -= 0.20;
if (missingRequiredContext) text -= 0.30;
if (visualQuestionWithoutCrop) layout -= 0.25;
if (markSumMismatch) marks -= 0.60;
if (containsBackMatter) text -= 0.50;
```

发布门槛：

```ts
if (hasP0Issue) {
  reviewStatus = "BLOCKED";
} else if (overall >= 0.90) {
  reviewStatus = "AUTO_CANDIDATE";
} else if (overall >= 0.75) {
  reviewStatus = "NEEDS_REVIEW";
} else {
  reviewStatus = "BLOCKED";
}
```

---

# 12. Marks 三层校验

```text
Leaf → Parent
Parent → Paper
QP → MS
```

输出：

```json
{
  "markValidation": {
    "declared": 13,
    "leafSum": 13,
    "valid": true
  }
}
```

任何一层失败，进入 review queue。

---

# 13. Golden Fixture

```text
test-fixtures/
└── 0478-2025-MJ-12/
    ├── source/
    │   └── 0478_s25_qp_12.pdf
    ├── expected/
    │   ├── paper.json
    │   ├── pages.json
    │   ├── questions.json
    │   └── leaf-pages.json
    └── snapshots/
        ├── Q4-A.webp
        └── Q5-C-I.webp
```

必须覆盖：

```text
paper metadata
top-level page ranges
leaf page ranges
stable IDs
parent existence
context inheritance
marks validation
barcode removal
suspicious glyph removal
mixed page handling
visual flags
question crop
review status
```

---

# 14. 推荐代码模块

```text
src/server/pdf/
├── metadata-parser.ts
├── page-extractor.ts
├── page-classifier.ts
├── text-cleaner.ts
├── barcode-filter.ts
├── corrupt-glyph-detector.ts
├── block-order.ts
├── question-marker-parser.ts
├── question-boundary.ts
├── leaf-question-parser.ts
├── context-builder.ts
├── visual-region-detector.ts
├── question-cropper.ts
├── confidence-scorer.ts
├── validator.ts
└── types.ts
```

---

# 15. Codex 实施顺序

每个阶段独立提交 PR。

## PR 1：ID 与结构校验

- 新 stable ID
- parentQuestionId 修复
- parent existence validator
- schemaVersion / parserVersion

## PR 2：Top-level 与 leaf 边界

- globalOrder
- assigned blocks
- top-level page range
- leaf page range

## PR 3：文本清洗

- raw / normalized / display
- barcode removal
- corrupt glyph detection
- Working space cleanup
- back matter cutoff

## PR 4：Context inheritance

- top-level stem
- part stem
- leaf own text
- displayText / searchText

## PR 5：Visual detection 与 crop

- question bbox
- visual region intersection
- visual type
- crop output

## PR 6：Confidence 与 review status

- structure dimension
- issue-based deduction
- P0 blocking rule
- mark validation

## PR 7：Golden regression

- fixture
- expected JSON
- snapshot tests
- CI

---

# 16. 建议 Issue Codes

```text
QUESTION_PAGE_RANGE_INVALID
LEAF_PAGE_RANGE_INHERITED
MISSING_PARENT_QUESTION
DUPLICATED_QUESTION_PATH
MISSING_PARENT_CONTEXT
SUSPICIOUS_GLYPHS
BARCODE_TEXT_PRESENT
BACK_MATTER_INCLUDED
VISUAL_FLAG_OVERPROPAGATED
VISUAL_CROP_MISSING
MARK_SUM_MISMATCH
MIXED_PAGE_UNHANDLED
CONFIDENCE_INCONSISTENT
AUTO_CANDIDATE_WITH_P0
```

---

# 17. MVP 导入闸门

只有同时满足以下条件，JSON 才可写入正式 questions 表：

```text
✓ 所有 parentQuestionId 存在
✓ 所有 leaf page range 通过校验
✓ parent marks = leaf sum
✓ paper marks = parent sum
✓ displayText 无 barcode
✓ displayText 无 suspicious glyphs
✓ displayText 无 back matter
✓ 视觉题存在 crop
✓ 必要 parent context 已继承
✓ 无 P0 issue
✓ parserVersion 已记录
```

未通过的文件写入 staging tables，进入 admin review，不得公开。

---

# 18. Codex 可直接执行的 Prompt

```text
请针对当前 0478_s25_qp_12.pdf 的解析 JSON，按照 docs/pastpaper-json-fix-plan.md 实施修复。

本轮只处理 Question Paper JSON，不要接入 Mark Scheme、embedding 或 Knowledge Point Mapping。

必须按以下顺序：

1. 修复 stable ID 和 parentQuestionId。
2. 建立 text block globalOrder。
3. 根据实际 assigned blocks 修复 top-level pageStart/pageEnd。
4. 为每个 leaf question 独立计算 pageStart/pageEnd。
5. 实现 contextText、questionText、displayText 和 searchText。
6. 清理 barcode、异常 glyph、Working space 和 back matter。
7. 按 question bbox 与 visual region 的交集计算 hasVisualContent。
8. 为 4(a) 和 5(c)(i) 生成 question crop。
9. 重构 confidence 和 reviewStatus，任何 P0 issue 都必须 BLOCKED。
10. 将该 PDF 建为 golden fixture，并添加回归测试。

不要：
- 批量处理全部 PDF；
- 修改 auth、session、billing 或无关前端；
- 仅修改 JSON 输出而不修复 parser；
- 伪造测试通过；
- 创建不存在的 parent entity；
- 将 parent 页码复制给 leaf；
- 在结构错误时标记 AUTO_CANDIDATE。

完成后报告：
- 修改文件
- 数据结构变化
- 修复前后对比
- golden test 结果
- 仍未解决的问题
- 是否允许 production import
```

---

# 19. 最终验收

```text
Paper metadata                 PASS
Top-level page ranges          PASS
Leaf page ranges               PASS
Stable IDs                     PASS
Parent references              PASS
Context inheritance            PASS
Text cleaning                  PASS
Marks validation               PASS
Visual flags                   PASS
Question crops                 PASS
Confidence consistency         PASS
Production import              ALLOWED
```

在达到以上状态前，不建议继续全量处理 Past Paper。批量运行一个仍有系统性边界错误的 parser，只会把一份 bug 扩展成一个数据集。人类把这种行为叫“规模化”，数据库一般称它为“周末加班”。
