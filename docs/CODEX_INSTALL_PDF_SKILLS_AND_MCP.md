# Codex 执行文档：安装 PDF Skills 与 MCP

> **用途**：让 Codex 在当前项目中安装并配置 PDF 处理相关的 Skills 与 MCP，同时建立 Cambridge Past Paper 专用工作流。  
> **目标项目**：CAIE Computer Science Paper Checklist  
> **执行原则**：先检查、后安装；优先项目级配置；不得直接批量重跑全部 PDF；安装完成后必须用一组 QP/MS golden fixture 验证。

---

## 1. 最终目标

完成以下配置：

### MCP

1. **Docling MCP**
   - 用途：PDF 结构化转换、reading order、表格和文档结构提取。
   - 运行方式：本地 STDIO。
   - 推荐作为结构解析主工具。

2. **pdf-mcp**
   - 用途：按页读取、搜索、渲染 PDF，避免把整份 PDF 塞入上下文。
   - 推荐作为调试、复核和页面定位工具。

### 项目依赖

3. **PyMuPDF**
   - 用途：页面坐标、text block、页面渲染、question crop。
   - 它是项目 Python 依赖，不是必须通过 MCP 使用。

4. **PyMuPDF4LLM**
   - 用途：生成 Markdown/JSON 对照结果。
   - 作为辅助解析器和 benchmark，不作为唯一数据源。

### Codex Skills

5. `cambridge-pastpaper-ingestion`
   - 约束 PDF 批量处理工作流。

6. `review-pdf-ingestion`
   - 强制 Codex 将 JSON 与原始 PDF 页面逐项对照。

---

# 2. 执行前要求

Codex 开始前必须：

1. 阅读当前仓库的：
   - `AGENTS.md`
   - `README.md`
   - `package.json`
   - Python 依赖文件
   - `.codex/config.toml`
   - `.agents/skills`
2. 检查操作系统、CPU 架构、Python、Node.js、Codex CLI 和 `uv`。
3. 不修改：
   - 登录逻辑
   - session
   - billing
   - Stripe
   - 无关前端
4. 不把 API key 写入 Git。
5. 不把本地绝对路径写入正式题库数据。
6. 不处理全部 PDF，直到 golden fixture 测试通过。
7. 每条安装命令执行后检查 exit code。
8. 如果某工具已安装，优先复用，不重复安装。

---

# 3. 让 Codex 执行的总 Prompt

将下面整段交给 Codex：

```text
请在当前 repository 中完成 PDF Skills 与 MCP 的安装和配置。

执行方式必须遵守以下要求：

1. 先检查当前操作系统、Python、uv、Codex CLI、项目结构和现有 MCP 配置。
2. 在修改前列出：
   - 计划安装的组件
   - 计划修改的文件
   - 是否需要系统级依赖
   - 是否存在与当前项目冲突的依赖
3. 优先使用项目级配置：
   - MCP 优先写入 .codex/config.toml
   - Skills 写入 .agents/skills
   - Python 项目依赖写入现有依赖管理文件
4. 安装并配置：
   - Docling MCP
   - pdf-mcp
   - PyMuPDF
   - PyMuPDF4LLM
5. 创建两个 Codex skills：
   - cambridge-pastpaper-ingestion
   - review-pdf-ingestion
6. 不要安装来源不明的 MCP。
7. 不要使用 sudo pip install。
8. 不要未经确认删除或覆盖现有 MCP 配置。
9. 不要立即批量处理全部 PDF。
10. 完成后：
    - 验证 MCP 是否可启动
    - 运行 codex mcp list
    - 检查 skills 是否被 Codex 识别
    - 用 1 组 QP/MS 文件执行小规模测试
    - 输出安装结果、验证结果、修改文件、未完成内容和回滚方法

如果当前 Codex CLI 不支持某条命令，请根据 codex mcp --help 和官方配置格式调整，不要猜测。
```

---

# 4. 环境检查

Codex 应先执行：

```bash
pwd
uname -a
python3 --version
node --version
codex --version
codex mcp --help
command -v uv || true
command -v uvx || true
command -v python3 || true
command -v codex || true
```

检查现有配置：

```bash
test -f ~/.codex/config.toml && cat ~/.codex/config.toml || true
test -f .codex/config.toml && cat .codex/config.toml || true
find .agents/skills -maxdepth 3 -type f 2>/dev/null || true
```

如果仓库已经存在 Python 虚拟环境或依赖管理方式，优先使用现有方案。

---

# 5. 安装 uv

如果系统已有 `uv` 和 `uvx`，跳过本节。

## macOS，优先 Homebrew

```bash
brew install uv
```

验证：

```bash
uv --version
uvx --version
```

如果 Homebrew 不存在，不要直接假设安装方式。先向用户报告，或使用 Astral 官方安装方式并明确说明将修改用户环境。

---

# 6. 安装 Docling MCP

Docling MCP 官方 STDIO 启动命令：

```bash
uvx --from docling-mcp docling-mcp-server --transport stdio
```

本项目优先使用本地转换模式，避免依赖外部 Docling Serve。

## 6.1 先验证可启动

```bash
DOCLING_CONVERSION_MODE=local \
uvx --from 'docling-mcp[local]' \
docling-mcp-server --transport stdio --help
```

如果 `uvx` 对 extra 的解析在当前版本中失败，则建立独立环境：

```bash
uv venv .venv-docling
source .venv-docling/bin/activate
uv pip install 'docling-mcp[local]'
docling-mcp-server --help
deactivate
```

不得在没有验证的情况下把错误命令写入 Codex 配置。

## 6.2 添加到 Codex

优先执行：

```bash
codex mcp add docling \
  --env DOCLING_CONVERSION_MODE=local \
  -- uvx --from 'docling-mcp[local]' \
  docling-mcp-server --transport stdio
```

然后验证：

```bash
codex mcp list
```

如果命令行方式无法正确保存带 extra 的参数，则在项目级 `.codex/config.toml` 中配置：

```toml
[mcp_servers.docling]
command = "uvx"
args = [
  "--from",
  "docling-mcp[local]",
  "docling-mcp-server",
  "--transport",
  "stdio"
]
startup_timeout_sec = 120
tool_timeout_sec = 300
enabled = true

[mcp_servers.docling.env]
DOCLING_CONVERSION_MODE = "local"
```

注意：

- 首次运行可能下载模型，启动时间明显更长。
- 不要将 `required = true` 写入首版配置，避免 Docling 启动失败时阻止 Codex 整体启动。
- 如项目机器资源不足，先报告，不要擅自切换到未知云服务。

---

# 7. 安装 pdf-mcp

## 7.1 推荐使用 uvx 隔离运行

先验证：

```bash
uvx pdf-mcp --help
```

添加到 Codex：

```bash
codex mcp add pdf-mcp -- uvx pdf-mcp
```

验证：

```bash
codex mcp list
```

项目级 `.codex/config.toml` 等价配置：

```toml
[mcp_servers.pdf-mcp]
command = "uvx"
args = ["pdf-mcp"]
startup_timeout_sec = 60
tool_timeout_sec = 180
enabled = true
```

## 7.2 可选功能

不要默认安装全部 extras。按需要选择。

多栏 PDF 支持：

```bash
uvx --from 'pdf-mcp[multicolumn]' pdf-mcp --help
```

语义搜索：

```bash
uvx --from 'pdf-mcp[semantic]' pdf-mcp --help
```

本项目第一阶段建议只使用基础版。Cambridge 试卷主要依赖精确题号和坐标，不需要先把一切都升级成向量搜索，好像没有 embedding 计算机就不会工作一样。

## 7.3 OCR

当前文本型 PDF 不需要默认 OCR。

只有扫描 PDF 才安装系统 Tesseract：

```bash
brew install tesseract
```

OCR 必须作为 fallback，不能默认处理所有页面。

---

# 8. 安装项目 Python 依赖

先检查仓库当前 Python 依赖管理方式：

```bash
find . -maxdepth 3 \
  \( -name pyproject.toml -o -name requirements.txt -o -name uv.lock \) \
  -print
```

## 使用 pyproject.toml / uv 的项目

```bash
uv add pymupdf pymupdf4llm
```

## 尚无 Python 项目环境

建议创建专用工具目录，而不是污染 Node 主项目：

```bash
mkdir -p tools/pdf-pipeline
cd tools/pdf-pipeline
uv init
uv add pymupdf pymupdf4llm
```

不要运行：

```bash
sudo pip install ...
```

也不要不加说明地使用全局 `pip install`。

验证：

```bash
uv run python - <<'PY'
import pymupdf
import pymupdf4llm

print("PyMuPDF:", pymupdf.VersionBind)
print("PyMuPDF4LLM import: OK")
PY
```

---

# 9. 创建 Skill：cambridge-pastpaper-ingestion

创建目录：

```bash
mkdir -p .agents/skills/cambridge-pastpaper-ingestion
```

创建 `.agents/skills/cambridge-pastpaper-ingestion/SKILL.md`：

```md
---
name: cambridge-pastpaper-ingestion
description: Process Cambridge CAIE Question Paper and Mark Scheme PDFs into validated page, question, leaf-question, crop, and mark-point records. Use for PDF ingestion, parser fixes, QP/MS linking, page boundaries, marks validation, and batch preprocessing. Do not use for unrelated PDFs or ordinary document summaries.
---

# Cambridge Past Paper Ingestion

## Purpose

Convert Cambridge Question Paper and Mark Scheme PDFs into validated structured data for the syllabus checklist application.

## Required tool strategy

Use tools in this order:

1. PyMuPDF for page coordinates, text blocks, page rendering, and crops.
2. Docling MCP for semantic structure, tables, and reading-order comparison.
3. pdf-mcp for targeted page reading, search, rendering, and manual investigation.
4. Project-specific Cambridge parsers for IDs, question hierarchy, marks, QP/MS linking, and knowledge-point mapping.

Never treat a generic MCP output as the final production record.

## Mandatory workflow

1. Start with one approved golden QP/MS pair.
2. Parse filename metadata.
3. Calculate SHA-256.
4. Extract every page with text blocks and coordinates.
5. Render every page.
6. Classify pages:
   - cover
   - question_content
   - blank
   - back_matter
   - mixed
7. Detect top-level questions.
8. Detect leaf questions:
   - (a)
   - (b)
   - (i)
   - (ii)
9. Compute each leaf question page range independently.
10. Preserve parent context required to answer the leaf question.
11. Extract marks.
12. Validate:
    - leaf marks sum to parent marks
    - parent marks sum to paper total
13. Detect visual regions by intersection with the question bounding box.
14. Generate question crops for tables, diagrams, tick boxes, flowcharts, and other layout-dependent questions.
15. Parse the matching mark scheme.
16. Link QP and MS using paperGroupId and normalized question number.
17. Emit confidence breakdown and issue codes.
18. Run golden fixture tests.
19. Stop if the golden fixture fails.
20. Only after approval, process a small batch.

## Prohibited behavior

- Do not calculate pageEnd from the next question page number alone.
- Do not copy a parent page range to every leaf question.
- Do not create parentQuestionId values unless the parent record exists.
- Do not omit parent context needed to answer a leaf question.
- Do not classify visual content at page level and copy it to every question.
- Do not mark a page as OCR-required merely because it contains a diagram or table.
- Do not place barcode, footer glyphs, answer lines, or copyright text into displayText.
- Do not overwrite rawText.
- Do not mark records AUTO_CANDIDATE when structural validation fails.
- Do not process the entire PDF collection before golden tests pass.
- Do not modify authentication, billing, sessions, or unrelated frontend files.

## Required text layers

Preserve:

- rawText
- normalizedText
- displayText
- contextText
- questionText

## Required confidence dimensions

- marker
- boundary
- text
- marks
- layout
- structure
- overall

## Required output report

Report:

- files discovered
- files processed
- files skipped
- file failures
- page classifications
- OCR candidates
- top-level question count
- leaf question count
- mark validation results
- visual question count
- crop count
- suspicious glyph count
- parsing issues by code
- golden tests passed/failed
```

---

# 10. 创建 Skill：review-pdf-ingestion

创建目录：

```bash
mkdir -p .agents/skills/review-pdf-ingestion
```

创建 `.agents/skills/review-pdf-ingestion/SKILL.md`：

```md
---
name: review-pdf-ingestion
description: Review generated Cambridge Past Paper parsing JSON against the source PDF and rendered pages. Use for parser QA, JSON review, boundary validation, visual-content checks, ID checks, marks checks, and release approval. Do not review JSON syntax alone.
---

# Review PDF Ingestion

## Core rule

Never approve generated JSON by reading the JSON alone.

Always compare it with:

1. the source PDF;
2. rendered page images;
3. extracted text blocks and coordinates;
4. the matching QP or MS record where applicable.

## Review order

1. File metadata
2. Stable paper ID
3. Page count
4. Page classification
5. OCR flags
6. Raw/normalized/display text separation
7. Top-level question boundaries
8. Leaf question boundaries
9. pageStart and pageEnd
10. Existing parent IDs
11. Parent context inheritance
12. Marks per leaf
13. Parent marks sum
14. Paper total marks
15. Visual-content flags
16. Question crops
17. Suspicious glyphs and barcode text
18. QP/MS question linking
19. Confidence calculation
20. Review status

## P0 failures

Mark as P0 when any of the following occurs:

- question content is missing;
- one question contains content from another question;
- leaf question lacks essential parent context;
- pageStart/pageEnd is incorrect;
- parentQuestionId points to a nonexistent record;
- marks do not match;
- copyright or back matter is included in question text;
- a visual question has no usable source crop;
- QP and MS are linked to different paper groups;
- structural failure is marked AUTO_CANDIDATE.

## Output format

For every issue report:

- severity
- record ID
- question number
- source page
- observed output
- expected output
- likely root cause
- exact recommended fix
- required regression test

Finish with one decision:

- APPROVE_FOR_GOLDEN_FIXTURE
- NEEDS_CHANGES
- BLOCK_PRODUCTION_IMPORT
```

---

# 11. 检查 Skill 是否被识别

Codex 的 repository skills 应位于：

```text
.agents/skills/<skill-name>/SKILL.md
```

检查：

```bash
find .agents/skills -maxdepth 2 -name SKILL.md -print
```

重新启动 Codex。如果 skills 未显示：

1. 确认从 repository 内启动 Codex；
2. 确认 YAML frontmatter 存在；
3. 确认 `name` 唯一；
4. 确认目录名和文件名正确；
5. 在 Codex 中运行 `/skills`。

---

# 12. 推荐的项目级 MCP 配置

最终 `.codex/config.toml` 建议包含：

```toml
[mcp_servers.docling]
command = "uvx"
args = [
  "--from",
  "docling-mcp[local]",
  "docling-mcp-server",
  "--transport",
  "stdio"
]
startup_timeout_sec = 120
tool_timeout_sec = 300
enabled = true
default_tools_approval_mode = "prompt"

[mcp_servers.docling.env]
DOCLING_CONVERSION_MODE = "local"

[mcp_servers.pdf-mcp]
command = "uvx"
args = ["pdf-mcp"]
startup_timeout_sec = 60
tool_timeout_sec = 180
enabled = true
default_tools_approval_mode = "prompt"
```

重要：

- 如果 `.codex/config.toml` 已存在，合并配置，不能覆盖整个文件。
- 项目必须被 Codex 标记为 trusted，项目级 MCP 才会生效。
- 第一次启动 Docling 可能较慢。
- 对写操作维持 `prompt`，不要无脑全部自动批准。

---

# 13. 验证 MCP

执行：

```bash
codex mcp list
```

预期至少看到：

```text
docling
pdf-mcp
```

分别检查启动命令：

```bash
uvx --from 'docling-mcp[local]' \
  docling-mcp-server --transport stdio --help

uvx pdf-mcp --help
```

在 Codex TUI 中：

```text
/mcp
```

确认两个 server 均被识别。

---

# 14. 最小测试

不得立即处理整个目录。

选择：

```text
1 份 Question Paper
1 份对应 Mark Scheme
```

建议测试命令或任务：

```text
使用 cambridge-pastpaper-ingestion skill。

对 golden fixture 的 QP/MS 做以下工作：

1. 用 pdf-mcp 获取 page count 和页面信息。
2. 用 Docling MCP 转换为结构化文档。
3. 用 PyMuPDF 提取 text blocks 和 coordinates。
4. 比较三种结果。
5. 生成 top-level questions。
6. 生成 leaf questions。
7. 独立计算每个 leaf question 的 pageStart/pageEnd。
8. 保存 parent context。
9. 生成 visual question crops。
10. 解析 mark scheme mark points。
11. 验证 marks。
12. 输出 JSON。
13. 使用 review-pdf-ingestion skill 对照原 PDF 审核。
14. 不通过审核时停止，不处理其他文件。
```

---

# 15. 验收标准

安装验收：

- [ ] `codex mcp list` 能看到 Docling MCP
- [ ] `codex mcp list` 能看到 pdf-mcp
- [ ] Docling MCP 可启动
- [ ] pdf-mcp 可启动
- [ ] PyMuPDF 可 import
- [ ] PyMuPDF4LLM 可 import
- [ ] 两个 skills 可在 `/skills` 中看到

数据验收：

- [ ] paper metadata 正确
- [ ] 不含本地绝对路径
- [ ] pageType 正确
- [ ] leaf question 独立页码正确
- [ ] parentQuestionId 全部存在
- [ ] leaf question 保留必要父上下文
- [ ] marks 汇总正确
- [ ] barcode 和乱码不进入 displayText
- [ ] visual question 有 crop
- [ ] QP/MS linking 正确
- [ ] golden fixture tests 通过
- [ ] 结构错误不会被标记为 AUTO_CANDIDATE

---

# 16. 回滚方式

## 删除 MCP 配置

先查看 Codex 支持的删除命令：

```bash
codex mcp --help
```

如果支持：

```bash
codex mcp remove docling
codex mcp remove pdf-mcp
```

如果不支持，备份后从以下文件中删除对应配置块：

```text
.codex/config.toml
或
~/.codex/config.toml
```

## 删除 Skills

```bash
rm -rf .agents/skills/cambridge-pastpaper-ingestion
rm -rf .agents/skills/review-pdf-ingestion
```

执行前必须确认这些目录是本次任务创建的。

## 回滚项目依赖

使用当前依赖管理器删除：

```bash
uv remove pymupdf pymupdf4llm
```

不得手工修改 lockfile 而不重新生成。

---

# 17. Codex 最终报告格式

安装完成后，Codex 必须按此格式报告：

```md
## Environment

- OS:
- Python:
- uv:
- Codex:
- Repository:

## Installed

- Docling MCP:
- pdf-mcp:
- PyMuPDF:
- PyMuPDF4LLM:
- Skills:

## Modified files

- ...

## Verification

- codex mcp list:
- Docling startup:
- pdf-mcp startup:
- Skills detected:
- Golden fixture result:

## Known limitations

- ...

## Not completed

- ...

## Rollback

- ...
```

---

# 18. 官方来源

- Codex Skills：
  `https://developers.openai.com/codex/skills`
- Codex MCP：
  `https://developers.openai.com/codex/mcp`
- Docling MCP：
  `https://github.com/docling-project/docling-mcp`
- Docling：
  `https://github.com/docling-project/docling`
- pdf-mcp：
  `https://github.com/jztan/pdf-mcp`
- PyMuPDF：
  `https://github.com/pymupdf/pymupdf`
- PyMuPDF4LLM：
  `https://github.com/pymupdf/pymupdf4llm`

---

# 19. 最终限制

安装这些工具后，Codex 仍然不能跳过项目业务 parser。

以下逻辑必须继续由项目代码实现：

- Cambridge filename metadata
- stable paper ID
- leaf question hierarchy
- parent context inheritance
- question page boundaries
- marks validation
- visual-region intersection
- question crop
- QP/MS linking
- knowledge-point mapping
- confidence and review status

MCP 负责让 Codex获得更可靠的 PDF 结构和页面访问能力；Skill 负责让 Codex 别每次都临场发挥。至于业务规则，仍然得老老实实写代码和测试。工具名字再闪亮，也不会替人类把 schema 想清楚。
