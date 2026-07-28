# Codex Staging 方案：Past Paper JSON 安全修复与分阶段导入

> **适用文件**：`0478_s25_qp_12.pdf` 及其当前生成的 JSON  
> **目标**：在不污染 production 数据的前提下，修复文本缺失、版权残片、填空结构丢失、confidence 虚高等问题，并通过 staging 流程完成验证、人工审核和后续发布。  
> **执行对象**：Codex  
> **模式**：Staging-first  
> **版本**：v1.0

---

# 1. 核心原则

本轮不得直接修改 production 数据，也不得将当前 JSON 直接写入正式 `questions`、`mark_points` 或 `question_knowledge_points` 表。

必须采用：

```text
Raw PDF
→ Parser Output
→ Staging Tables
→ Automated Validation
→ Golden Fixture Review
→ Manual Review
→ Publish
→ Production Tables
```

所有 parser 输出先进入 staging。

只有满足全部发布条件后，才允许由明确的 publish 操作写入 production。

---

# 2. 当前 JSON 的关键问题

当前结构、ID、页码和 marks 已基本修复，但仍存在以下阻塞上线的问题：

| 问题 | 示例 | 等级 |
|---|---|---|
| 二进制操作数被清洗删除 | Q1(e) 变成 `binary numbers and are stored` | P0 |
| 填空位置丢失 | Q3(b)(i) 中的空格没有 `[BLANK_n]` | P0 |
| 版权内容仍进入题目 | Q5(c)(ii) 混入 publisher / Cambridge 文本 | P0 |
| suspicious glyph 检测后未清除 | 页面 preview 仍含异常字符 | P1 |
| confidence 虚高 | 损坏题目仍为 `0.98 / AUTO_CANDIDATE` | P0 |
| 搜索文本破坏负号 | `–22` 变成 `22` | P1 |
| crop 仅保存路径 | 未确认文件真实生成 | P1 |
| mixed page 区域重叠 | 第12页 question/back matter 坐标冲突 | P1 |

因此当前状态必须为：

```text
BLOCK_PRODUCTION_IMPORT
```

---

# 3. Staging 架构

## 3.1 数据流

```text
PDF
 ↓
PDF Extractor
 ↓
Parser
 ↓
staging_documents
 ↓
staging_pages
 ↓
staging_questions
 ↓
staging_assets
 ↓
staging_issues
 ↓
Automated Validator
 ↓
Admin Review
 ↓
Publish Service
 ↓
Production Tables
```

## 3.2 禁止行为

Codex 不得：

- 直接写入 production questions；
- 自动删除已发布数据；
- 批量处理全部 PDF；
- 在 validation 失败时继续 publish；
- 通过手工修改输出 JSON 掩盖 parser bug；
- 将 `AUTO_CANDIDATE` 当作已发布状态；
- 覆盖 raw extraction；
- 跳过 golden fixture；
- 修改 auth、session、billing 或无关前端。

---

# 4. Staging 数据表

如果当前项目已有数据库，请优先增加 staging schema 或 staging 前缀表。

## 4.1 staging_ingestion_runs

```sql
CREATE TABLE staging_ingestion_runs (
  id TEXT PRIMARY KEY,
  source_file TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  total_pages INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_leaf_questions INTEGER DEFAULT 0,
  p0_issue_count INTEGER DEFAULT 0,
  p1_issue_count INTEGER DEFAULT 0,
  p2_issue_count INTEGER DEFAULT 0,
  publish_status TEXT NOT NULL DEFAULT 'BLOCKED',
  summary_json TEXT
);
```

推荐状态：

```text
PENDING
EXTRACTING
PARSING
VALIDATING
NEEDS_REVIEW
READY_TO_PUBLISH
PUBLISHED
FAILED
```

---

## 4.2 staging_papers

```sql
CREATE TABLE staging_papers (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL,
  paper_group_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  session TEXT NOT NULL,
  component TEXT NOT NULL,
  document_role TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  FOREIGN KEY (ingestion_run_id)
    REFERENCES staging_ingestion_runs(id)
);
```

---

## 4.3 staging_pages

```sql
CREATE TABLE staging_pages (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  page_type TEXT NOT NULL,
  raw_text TEXT,
  normalized_text TEXT,
  display_text TEXT,
  requires_ocr INTEGER NOT NULL DEFAULT 0,
  has_visual_content INTEGER NOT NULL DEFAULT 0,
  contains_back_matter INTEGER NOT NULL DEFAULT 0,
  content_regions_json TEXT,
  text_quality_json TEXT,
  page_image_key TEXT,
  validation_status TEXT NOT NULL,
  FOREIGN KEY (ingestion_run_id)
    REFERENCES staging_ingestion_runs(id)
);
```

---

## 4.4 staging_questions

```sql
CREATE TABLE staging_questions (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  parent_question_id TEXT,
  question_number TEXT NOT NULL,
  section_path_json TEXT NOT NULL,
  depth INTEGER NOT NULL,
  is_leaf INTEGER NOT NULL,
  context_text TEXT,
  question_text TEXT,
  display_text TEXT,
  search_text TEXT,
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  marks INTEGER,
  bbox_json TEXT,
  has_visual_content INTEGER NOT NULL DEFAULT 0,
  visual_type TEXT,
  question_image_key TEXT,
  question_image_hash TEXT,
  confidence_json TEXT,
  review_status TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  FOREIGN KEY (ingestion_run_id)
    REFERENCES staging_ingestion_runs(id)
);
```

---

## 4.5 staging_issues

```sql
CREATE TABLE staging_issues (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL,
  paper_id TEXT,
  question_id TEXT,
  page_number INTEGER,
  severity TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  observed_json TEXT,
  expected_json TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  resolution_note TEXT,
  FOREIGN KEY (ingestion_run_id)
    REFERENCES staging_ingestion_runs(id)
);
```

---

## 4.6 staging_review_actions

```sql
CREATE TABLE staging_review_actions (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reviewer TEXT,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (ingestion_run_id)
    REFERENCES staging_ingestion_runs(id)
);
```

---

# 5. 发布状态模型

区分三个概念：

## 5.1 Parser reviewStatus

```text
AUTO_CANDIDATE
NEEDS_REVIEW
BLOCKED
```

表示 parser 对单条记录的判断。

## 5.2 Staging validationStatus

```text
PASS
WARN
FAIL
```

表示自动验证结果。

## 5.3 Publish status

```text
BLOCKED
READY_TO_PUBLISH
PUBLISHED
```

表示整次 ingestion run 是否允许发布。

不得因为单条记录是 `AUTO_CANDIDATE` 就跳过整批 validation。

---

# 6. 本轮必须修复的四个 P0 问题

# 6.1 Q1(e)：保护二进制操作数

## 当前错误

```text
The 8-bit binary numbers and are stored in RAM.
```

## 根因

清洗器把分散的数字 text blocks 当作：

- barcode；
- page decoration；
- answer line；
- 孤立数字。

## 修复

增加 layout-aware numeric reconstruction。

```ts
function normalizeNumericBlock(text: string): string {
  const compact = text.replace(/\s+/g, "");

  if (/^[01]{4,}$/.test(compact)) {
    return compact;
  }

  if (/^[0-9A-Fa-f]{2,}$/.test(compact)) {
    return compact.toUpperCase();
  }

  return text;
}
```

将同一水平行或垂直计算区域中的数字 block 组合：

```ts
const operands = groupCalculationBlocks(blocks);

if (operands.length >= 2) {
  questionText = injectOperands(questionText, operands);
}
```

Q1(e) 预期：

```text
The 8-bit binary numbers 01100101 and 01110000 are stored in RAM.
...
01100101
+ 01110000
[3]
```

新增 issue：

```text
MISSING_BINARY_OPERANDS
```

检测：

```ts
if (/binary numbers\s+and\s+are stored/i.test(displayText)) {
  addIssue("P0", "MISSING_BINARY_OPERANDS");
}
```

---

# 6.2 Q3(b)(i)：保留填空位置

## 当前错误

```text
A compiler translates the at once before it.
```

## 修复

识别：

- 连续点线；
- 长空白；
- 方框；
- 同一行异常 gap；
- answer-area bbox。

转换为：

```text
[BLANK_1]
[BLANK_2]
```

推荐结构：

```json
{
  "responseAreas": [
    {
      "id": "blank-1",
      "type": "inline_blank",
      "pageNumber": 6,
      "bbox": {
        "xMin": 220,
        "yMin": 330,
        "xMax": 310,
        "yMax": 350
      }
    }
  ]
}
```

生成 displayText：

```text
A compiler translates the [BLANK_1] at once before [BLANK_2] it.
```

新增 issue：

```text
MISSING_RESPONSE_AREAS
```

检测：

```ts
if (
  questionLooksLikeFillBlank &&
  responseAreas.length === 0
) {
  addIssue("P0", "MISSING_RESPONSE_AREAS");
}
```

---

# 6.3 Q5(c)(ii)：截断版权内容

## 当前错误

题目文本中仍含：

```text
publisher will be pleased...
cambridgeinternational.org...
```

## 修复

第 12 页必须按 block 边界拆分，而不是只存 page-level type。

统一坐标规范：

```text
原点：页面左上角
yMin < yMax
```

每个区域：

```json
{
  "type": "question_content",
  "yMin": 60,
  "yMax": 280
}
```

```json
{
  "type": "back_matter",
  "yMin": 300,
  "yMax": 800
}
```

区域不得重叠。

定位第一个 back matter block：

```ts
const firstBackMatterOrder = pageBlocks
  .filter(block => isBackMatter(block.text))
  .map(block => block.globalOrder)
  .sort((a, b) => a - b)[0];
```

构建 Q5(c)(ii) 时：

```ts
const usableBlocks = assignedBlocks.filter(
  block =>
    firstBackMatterOrder === undefined ||
    block.globalOrder < firstBackMatterOrder
);
```

新增 issue：

```text
BACK_MATTER_INCLUDED
MIXED_PAGE_REGION_OVERLAP
```

测试：

```ts
expect(q5cii.displayText)
  .not.toContain("publisher will be pleased");

expect(q5cii.searchText)
  .not.toContain("cambridgeinternational");
```

---

# 6.4 Confidence 必须依赖验证

## 当前错误

损坏题目仍然：

```json
{
  "overall": 0.98,
  "reviewStatus": "AUTO_CANDIDATE"
}
```

## 修复

新增硬性发布规则：

```ts
const hasP0 = issues.some(issue => issue.severity === "P0");

if (hasP0) {
  reviewStatus = "BLOCKED";
  overall = Math.min(overall, 0.69);
}
```

扣分规则：

```ts
if (missingBinaryOperands) text -= 0.60;
if (missingResponseAreas) layout -= 0.50;
if (backMatterIncluded) text -= 0.60;
if (mixedPageRegionOverlap) boundary -= 0.35;
if (visualCropMissing) layout -= 0.40;
if (normalizedSuspiciousGlyphs > 0) text -= 0.20;
```

任何以下 issue 出现，强制 BLOCKED：

```text
MISSING_BINARY_OPERANDS
MISSING_RESPONSE_AREAS
BACK_MATTER_INCLUDED
MISSING_PARENT_QUESTION
QUESTION_PAGE_RANGE_INVALID
MARK_SUM_MISMATCH
VISUAL_CROP_MISSING
```

---

# 7. 文本分层

必须保留：

```text
rawText
normalizedText
displayText
searchText
```

## rawText

原始提取，永不修改。

## normalizedText

保留题目语义和有效符号，删除：

- barcode；
- footer；
- header；
- corrupt glyph；
- copyright；
- answer lines，但保留 `[BLANK_n]`。

## displayText

用于用户展示，保留：

- 数字；
- 运算符；
- 填空占位符；
- 选项；
- marks；
- 必要上下文。

## searchText

用于全文搜索，不得破坏数学语义。

例如：

```ts
searchText = displayText
  .replace(/[–—−]/g, "-")
  .toLowerCase();
```

`–22` 必须保留为：

```text
-22
```

---

# 8. Suspicious Glyph 处理

当前已检测到 suspicious glyph，但仍留在 preview。

必须记录：

```json
{
  "rawSuspiciousGlyphCount": 40,
  "normalizedSuspiciousGlyphCount": 0
}
```

只有 normalized 层为 0 才可 PASS。

规则：

```ts
if (normalizedSuspiciousGlyphCount > 0) {
  addIssue("P1", "SUSPICIOUS_GLYPHS_REMAIN");
}
```

不要删除合法字符：

- `✓`
- `–`
- `×`
- `μ`
- 数学运算符
- Unicode 引号

应基于：

- 字体；
- 坐标；
- 重复模式；
- 单词结构；
- 页面边缘区域；

而不是只用一个粗暴 Unicode 正则把所有非 ASCII 字符送去数字坟场。

---

# 9. Visual Crop Staging

当：

```text
hasVisualContent = true
```

必须先生成 crop 并验证文件存在。

staging 中保存：

```json
{
  "questionImage": {
    "storageKey": "staging/rendered/0478-2025-MJ-12-QP/Q4-A.webp",
    "status": "generated",
    "contentHash": "...",
    "width": 948,
    "height": 970,
    "sourcePages": [9]
  }
}
```

验证：

```ts
if (hasVisualContent && !cropExists) {
  addIssue("P0", "VISUAL_CROP_MISSING");
}
```

production 发布时，将 staging asset 复制或 promote 到 production storage key。

---

# 10. Staging Validation Pipeline

依次运行：

```text
Schema Validation
→ ID Validation
→ Parent Validation
→ Page Boundary Validation
→ Text Integrity Validation
→ Marks Validation
→ Visual Asset Validation
→ Back Matter Validation
→ Confidence Consistency Validation
→ Publish Gate
```

## 10.1 Schema Validation

检查所有 required fields。

## 10.2 ID Validation

检查：

- ID 唯一；
- ID 格式；
- paperId 一致；
- parentQuestionId 存在。

## 10.3 Boundary Validation

检查：

- leaf page range 在 parent 范围内；
- bbox 在 page 范围内；
- mixed page 区域不重叠。

## 10.4 Text Integrity Validation

检测：

```text
binary numbers and are stored
translates the at once
publisher will be pleased
cambridgeinternational.org
```

也需要通用规则，而不是只写死当前题目。

## 10.5 Marks Validation

```text
leaf sum = parent marks
parent sum = paper total
```

## 10.6 Asset Validation

检查 crop 文件：

- 存在；
- 非零大小；
- 可解码；
- hash 已记录。

## 10.7 Confidence Validation

若有 P0 issue：

```text
reviewStatus != AUTO_CANDIDATE
```

---

# 11. Publish Gate

只有满足以下全部条件：

```text
p0_issue_count = 0
all parent IDs valid
all question ranges valid
all mark validations valid
all required crops exist
normalized suspicious glyph count = 0 或已人工确认
no back matter in question text
no missing numeric operands
no missing response areas
all golden tests pass
admin approval exists
```

才允许：

```text
publish_status = READY_TO_PUBLISH
```

发布必须是独立命令：

```bash
npm run pdf:publish-staging -- --run-id=<RUN_ID>
```

禁止 ingestion 命令自动 publish。

---

# 12. Publish Service

发布过程必须事务化。

伪代码：

```ts
await db.transaction(async tx => {
  const run = await stagingRepo.getRun(runId, tx);

  assertReadyToPublish(run);

  await productionRepo.upsertPaper(run.paper, tx);
  await productionRepo.replaceQuestions(run.paper.id, run.questions, tx);
  await assetService.promoteAssets(run.assets);
  await stagingRepo.markPublished(runId, tx);
});
```

如果任一步失败：

```text
rollback DB transaction
不标记 PUBLISHED
保留 staging 数据
```

---

# 13. Admin Review

管理员审核页面至少显示：

```text
左侧：PDF 页或 crop
中间：raw / normalized / display text
右侧：issues、confidence、marks、ID、page range
```

操作：

```text
Approve
Edit
Reject
Re-run parser
Resolve issue
Block file
```

人工修改不得覆盖 raw parser output。

应保存：

```text
parser_output
review_override
published_output
```

---

# 14. Golden Fixture

将当前 PDF 作为 golden fixture。

目录：

```text
test-fixtures/0478-2025-MJ-12/
├── source/
│   └── 0478_s25_qp_12.pdf
├── expected/
│   ├── paper.json
│   ├── page-ranges.json
│   ├── questions.json
│   ├── response-areas.json
│   └── validation.json
└── crops/
    ├── Q1-E.webp
    ├── Q2-A.webp
    ├── Q3-B-I.webp
    ├── Q4-A.webp
    └── Q5-C-I.webp
```

必须测试：

```text
Q1(e) 包含 01100101
Q1(e) 包含 01110000
Q3(b)(i) 包含 [BLANK_1]
Q5(c)(ii) 不含版权文本
Q1(g) searchText 保留 -22
visual crops 全部存在
所有 P0 issue = 0
```

---

# 15. Codex 分阶段实施

不要让 Codex 一次重写整个 parser。按以下 staging PR 执行。

## PR 1：Staging Schema

实现：

- staging tables；
- ingestion run；
- issue table；
- publish status；
- migration；
- repository。

不改 parser 逻辑。

---

## PR 2：Staging Writer

实现：

- parser 输出写入 staging；
- 禁止 production write；
- raw JSON 保留；
- ingestion summary；
- run ID。

---

## PR 3：Text Integrity

实现：

- binary operand preservation；
- minus normalization；
- suspicious glyph cleaning；
- back matter cutoff。

测试 Q1(e)、Q1(g)、Q5(c)(ii)。

---

## PR 4：Response Areas

实现：

- fill-in blank detection；
- `[BLANK_n]`；
- responseAreas；
- Q3(b)(i) crop。

---

## PR 5：Validation Engine

实现：

- P0/P1/P2 issues；
- confidence deductions；
- reviewStatus；
- publish gate。

---

## PR 6：Asset Validation

实现：

- crop generation；
- crop hash；
- file existence；
- staging asset path。

---

## PR 7：Admin Review

实现：

- staging review API；
- approve/edit/reject；
- review history；
- no raw overwrite。

---

## PR 8：Publish Service

实现：

- explicit publish command；
- transaction；
- asset promotion；
- rollback；
- publish log。

---

# 16. Codex 可直接执行的 Prompt

```text
请按照本文件实现 Past Paper JSON 的 staging-first 修复流程。

本轮目标不是直接发布数据，而是让当前
0478_s25_qp_12.pdf 的解析结果安全进入 staging，
通过自动校验和人工审核后再显式 publish。

必须完成：

1. 创建 staging ingestion run、papers、pages、questions、issues 和 review actions。
2. 修改现有 PDF ingestion，使其只写 staging，不写 production。
3. 保留 raw parser output。
4. 修复 Q1(e) 二进制操作数被清洗删除的问题。
5. 修复 Q3(b)(i) 填空位置丢失的问题，生成 [BLANK_n] 和 responseAreas。
6. 修复 Q5(c)(ii) 混入 back matter 的问题。
7. 保留 Q1(g) 的 -22。
8. 将 suspicious glyph 分为 raw 和 normalized 两层统计。
9. 建立 validation engine。
10. 有任何 P0 issue 时强制 BLOCKED。
11. 建立独立 publish gate 和 publish 命令。
12. 将当前 PDF 建为 golden fixture。
13. 不得自动处理全部 PDF。
14. 不得自动 publish。
15. 不得修改 auth、session、billing 或无关前端。

请按 PR 阶段执行，先完成：

PR 1：Staging Schema
PR 2：Staging Writer
PR 3：Text Integrity
PR 4：Response Areas
PR 5：Validation Engine

完成后停止，并报告：

- 修改文件
- migration
- staging 表
- parser 修复
- issues 输出
- golden tests
- 当前 ingestion run 状态
- 是否 READY_TO_PUBLISH
- 未完成的 PR
```

---

# 17. 验收标准

当前 PDF 在 staging 中必须达到：

```text
Paper metadata                  PASS
Stable IDs                      PASS
Top-level ranges                PASS
Leaf ranges                     PASS
Parent references               PASS
Marks validation                PASS
Q1(e) operands preserved        PASS
Q3(b)(i) blanks preserved       PASS
Q5(c)(ii) back matter removed   PASS
Q1(g) negative sign preserved   PASS
Suspicious glyph cleanup        PASS
Visual crops                    PASS
P0 issue count                  0
Publish status                  READY_TO_PUBLISH
```

未达到以上全部条件：

```text
Publish status = BLOCKED
```

---

# 18. 最终目标

这套 staging 方案的重点不是让 parser 从此永不犯错。那种幻想通常只在第一次 demo 前存活。

重点是：

```text
错误可以被检测
错误不会进入 production
错误可以被审核
错误可以被重新处理
错误修复后可以安全发布
```

这才是处理大量 Past Paper PDF 时可持续的工程方式。
