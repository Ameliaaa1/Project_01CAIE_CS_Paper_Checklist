# Past Paper PDF 解析与题库结构化解决方案

> **版本**：v1.0\
> **目标**：近期 MVP

------------------------------------------------------------------------

# 1. 文档目标

本方案用于解决当前 Past Paper PDF
批量解析精度不足的问题，并将现有原型升级为可支撑 MVP 的结构化题库系统。

设计目标：

-   稳定解析 Question Paper
-   稳定解析 Mark Scheme
-   精准映射 Knowledge Point
-   支持大量 PDF 增量更新
-   保留人工审核能力
-   正常运行时绝不重新解析 PDF

------------------------------------------------------------------------

# 2. 当前问题

  问题                    严重程度
  ----------------------- ----------
  Question pageEnd 错误   P0
  最后一题包含版权页      P0
  OCR 判断错误            P0
  PDF 乱码未清洗          P0
  只解析到大题            P0
  表格图形丢失            P0
  confidence 无意义       P1
  使用本地绝对路径        P1

------------------------------------------------------------------------

# 3. MVP 范围

第一版建议：

-   一个 syllabus（0478）
-   3--5 年 Past Paper
-   Question Paper + Mark Scheme
-   文本层 PDF
-   Leaf Question 级别解析
-   Knowledge Point 查询
-   Mark Scheme 查看
-   Admin Review

暂不支持：

-   OCR 全覆盖
-   任意 PDF
-   AI 自动批改
-   多考试局

------------------------------------------------------------------------

# 4. 系统架构

``` text
PDF
 ↓
PDF Scanner
 ↓
Page Extractor
 ↓
Question Parser
 ↓
Mark Scheme Parser
 ↓
Validation
 ↓
Database
 ↓
Knowledge Point Matcher
 ↓
API
 ↓
Frontend
```

正常用户请求：

``` text
Checklist
→ Knowledge Point
→ API
→ Database
→ Question
→ Mark Points
```

------------------------------------------------------------------------

# 5. 数据模型

## Paper

``` json
{
  "id":"0478-2025-MJ-12-QP",
  "paperGroupId":"0478-2025-MJ-12",
  "fileHash":"..."
}
```

## Page

``` json
{
  "pageNumber":4,
  "pageType":"question_content",
  "rawText":"...",
  "normalizedText":"..."
}
```

## Question

``` json
{
  "id":"0478-2025-MJ-12-Q3-B-II",
  "parentQuestionId":"...",
  "isLeaf":true,
  "marks":4
}
```

## Mark Point

``` json
{
  "questionId":"...",
  "sequence":1,
  "marks":1
}
```

------------------------------------------------------------------------

# 6. 解决方案

## 6.1 修复 pageEnd

不要使用：

``` text
下一题所在页
=
上一题结束页
```

应该根据 text block 实际归属计算：

``` text
pageEnd=max(questionBlocks.pageNumber)
```

------------------------------------------------------------------------

## 6.2 Page Type

新增：

``` text
cover
question_content
blank
back_matter
unknown
```

Question Parser 仅处理：

``` text
question_content
```

------------------------------------------------------------------------

## 6.3 OCR

OCR 与图形完全分离：

``` text
requiresOcr

hasVisualContent
```

建议：

``` text
字符太少
或
文本质量低
才 OCR
```

------------------------------------------------------------------------

## 6.4 文本清洗

保留：

``` text
rawText

normalizedText

displayText
```

displayText：

-   去乱码
-   去页眉页脚
-   去 Working Space
-   保留题目内容

------------------------------------------------------------------------

## 6.5 Leaf Question

必须拆分：

``` text
Q3
├──Q3(a)
├──Q3(b)
│  ├──Q3(b)(i)
│  └──Q3(b)(ii)
```

Knowledge Point 默认绑定：

``` text
isLeaf=true
```

------------------------------------------------------------------------

## 6.6 Visual Question

对于：

-   table
-   flowchart
-   diagram

保存：

``` text
question crop
```

MVP 不强制重建 HTML。

------------------------------------------------------------------------

## 6.7 Confidence

建议：

``` text
marker

boundary

text

marks

layout

overall
```

发布策略：

``` text
>=0.90 自动候选

0.75~0.89 人工审核

<0.75 不公开
```

------------------------------------------------------------------------

# 7. Mark Scheme

独立 Parser：

``` text
Table

Question

Answer

Marks

Guidance
```

输出：

``` text
Question

↓

Mark Points
```

------------------------------------------------------------------------

# 8. 数据库

核心表：

``` text
papers

pages

questions

mark_points

knowledge_points

question_knowledge_points

parsing_issues

review_actions
```

------------------------------------------------------------------------

# 9. API

``` http
GET /api/knowledge-points/:id/questions

GET /api/questions/:id

GET /api/questions/:id/mark-points

GET /api/questions/:id/source

GET /api/admin/review-items
```

------------------------------------------------------------------------

# 10. 实施路线

## Phase 0

冻结范围

## Phase 1

修复当前 Parser

## Phase 2

Leaf Question

## Phase 3

Mark Scheme Parser

## Phase 4

Knowledge Point Mapping

## Phase 5

API

## Phase 6

Frontend

## Phase 7

QA

------------------------------------------------------------------------

# 11. MVP 验收

-   一个 syllabus
-   300\~500 leaf questions
-   90% 有 mark scheme
-   pageEnd 正确
-   无版权页
-   无乱码
-   无运行时 PDF 解析
-   支持 Admin Review

------------------------------------------------------------------------

# 12. 推荐开发顺序

1.  修 pageEnd
2.  修 OCR
3.  修文本清洗
4.  建立稳定 ID
5.  Leaf Question
6.  Question Crop
7.  Mark Scheme
8.  Knowledge Point
9.  API
10. Frontend

------------------------------------------------------------------------

# 13. 总结

当前 JSON 已达到 **Ingestion Prototype**
水平，但距离生产可用仍有明显差距。

建议不要继续批量解析更多 PDF，而是先将当前样本修复为 **Golden
Fixture**：

-   页码正确
-   无版权页
-   无乱码
-   小问完整
-   Visual Question 保留 crop
-   Mark Scheme 正确关联

之后再扩大到完整题库。
