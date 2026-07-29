# PR-009 Frontend Migration to Question Rendering Contract

## 1. PR Identity

``` text
PR-009
Frontend Migration to Production Question Rendering Contract
```

------------------------------------------------------------------------

# 2. Background

当前 CAIE 项目已经完成：

``` text
PDF Parsing

↓

Canonical Model

↓

Staging Validation

↓

Production Pipeline

↓

Release Verification
```

Production 数据链已经稳定。

当前问题：

网站前端仍可能存在旧的数据读取逻辑：

``` text
Old Flow:

PDF

↓

Frontend Extraction / Text Processing

↓

UI Rendering
```

这种架构会导致：

-   前端重复解析 PDF；
-   前端重新切割 question；
-   前端重新判断 parent/child；
-   前端重新清理文本；
-   前端产生与 Production 数据不一致的结果。

新的目标：

``` text
New Flow:

Production Canonical Data

↓

Question Rendering Contract

↓

Frontend Components

↓

Website UI
```

------------------------------------------------------------------------

# 3. Objective

让网站完全消费已经验证过的 Production 数据。

目标：

-   Frontend 不再解析 PDF；
-   Frontend 不再修复文本；
-   Frontend 不再推断题目结构；
-   Frontend 只负责展示。

------------------------------------------------------------------------

# 4. Scope

本 PR 只处理：

## Data Source Migration

包括：

-   Question Viewer
-   Question Finder
-   Practice Mode
-   Mark Scheme Viewer
-   Search
-   Knowledge Checklist

的数据来源迁移。

------------------------------------------------------------------------

禁止修改：

-   PDF Parser
-   Canonical Model
-   Question Split
-   Stable Question ID
-   Parent/Child Ownership
-   Response Area Pipeline
-   Mark Scheme Parser

------------------------------------------------------------------------

# 5. PR Breakdown

本阶段拆分：

``` text
PR-009A

Frontend Data Source Audit


↓

PR-009B

Question Viewer Migration


↓

PR-009C

Mark Scheme Viewer Migration


↓

PR-009D

Practice/Search Migration


↓

PR-009E

Remove Legacy PDF Processing Path
```

------------------------------------------------------------------------

# PR-009A --- Frontend Data Source Audit

## Objective

确认网站目前所有 PDF/question 数据入口。

------------------------------------------------------------------------

检查：

``` text
frontend/

app.js

components/

question viewer

practice mode

search

mark scheme
```

------------------------------------------------------------------------

输出：

``` text
output/maintenance/frontend-data-source-audit.json
```

记录：

``` json
{
  "legacyPdfDependency": [],
  "productionDataConsumers": [],
  "migrationRequired": []
}
```

------------------------------------------------------------------------

# PR-009B --- Question Viewer Migration

## Objective

Question Viewer 使用：

``` text
Production Question Object
```

替代：

``` text
Raw PDF Text
```

------------------------------------------------------------------------

旧逻辑：

``` text
PDF

↓

Extract Text

↓

Split Question

↓

Render
```

删除。

------------------------------------------------------------------------

新逻辑：

``` text
Question ID

↓

Production Index

↓

Canonical Question

↓

Render
```

------------------------------------------------------------------------

Frontend 不允许：

-   split "(a)";
-   remove footer;
-   detect marks;
-   clean glyph;
-   detect response area.

这些属于 Parser。

------------------------------------------------------------------------

# PR-009C --- Mark Scheme Viewer Migration

## Objective

Mark Scheme Viewer 使用：

``` text
Mark Scheme Reference
```

获取答案。

------------------------------------------------------------------------

流程：

``` text
Question ID

↓

Mark Scheme ID

↓

Production Mark Scheme Data

↓

Render
```

------------------------------------------------------------------------

禁止：

Frontend 自己：

-   搜索 PDF；
-   匹配页码；
-   解析答案文本。

------------------------------------------------------------------------

# PR-009D --- Practice/Search Migration

迁移：

## Question Finder

使用：

``` text
Question Index

↓

Question Object
```

------------------------------------------------------------------------

## Practice Mode

使用：

``` text
Stable Question ID

↓

Canonical Question
```

------------------------------------------------------------------------

## Search

使用：

Production Index。

禁止：

扫描 PDF 文件。

------------------------------------------------------------------------

# PR-009E --- Remove Legacy PDF Processing Path

## Objective

删除旧路径。

删除：

-   frontend PDF extraction;
-   frontend text cleaning;
-   frontend question splitting;
-   frontend answer matching.

------------------------------------------------------------------------

最终：

``` text
PDF Viewer

=
查看原始 PDF


Question Viewer

=
显示 Canonical Data
```

两个职责分离。

------------------------------------------------------------------------

# 6. Question Rendering Contract Requirements

Frontend 必须遵守：

## Parent / Child

输入：

``` json
{
 "parentText":"",
 "children":[]
}
```

Frontend 不修改结构。

------------------------------------------------------------------------

## Sub Question

输入：

``` text
Q1

(a)

(b)

(c)
```

保持：

-   顺序；
-   层级；
-   ID。

------------------------------------------------------------------------

## Response Area

Response Area：

只展示在：

``` text
response_area component
```

不能进入：

``` text
question_text
```

------------------------------------------------------------------------

# 7. Regression Requirements

迁移后必须验证：

## Question Rendering

检查：

-   a/b/c 换行；
-   nested question；
-   parent context；
-   图片题。

------------------------------------------------------------------------

## Mark Scheme

检查：

-   question ID mapping；
-   answer display。

------------------------------------------------------------------------

## Search

检查：

-   syllabus filter；
-   year filter；
-   component filter。

------------------------------------------------------------------------

# 8. Acceptance Criteria

PR-009 完成：

``` text
Frontend reads Production Data

=

true
```

并满足：

``` text
No frontend PDF parsing

No frontend question splitting

No frontend text repair

Question Viewer PASS

Mark Scheme Viewer PASS

Practice Mode PASS

Search PASS
```

------------------------------------------------------------------------

# 9. Codex Execution Prompt

``` text
Implement PR-009 Frontend Migration to Question Rendering Contract.

Current state:
Production data pipeline is stable.

Goal:
Migrate website frontend to consume Production Canonical Data.

Do not modify:
- Parser
- Canonical Model
- Stable IDs
- Ownership Logic
- Response Area Pipeline

Tasks:

1. Audit frontend data sources.
2. Identify legacy PDF parsing paths.
3. Migrate Question Viewer to Production Question Objects.
4. Migrate Mark Scheme Viewer to Production references.
5. Migrate Search and Practice Mode.
6. Remove duplicated frontend text processing.

Generate:
output/maintenance/frontend-data-source-audit.json

Acceptance:
- Frontend does not parse PDFs.
- Frontend does not modify question structure.
- Rendering follows Question Rendering Contract.
- No regression in 0478 and 9618.
```

------------------------------------------------------------------------

# 10. Final Decision

PR-009 的目标不是增加功能。

目标：

让网站真正连接已经完成验证的数据生产系统。

完成后：

``` text
Parser

↓

Production Data

↓

Frontend
```

形成完整稳定链路。

后续：

-   AI Search
-   Knowledge Graph
-   Recommendation
-   Learning Analytics

再建立新的产品开发 Cycle。
