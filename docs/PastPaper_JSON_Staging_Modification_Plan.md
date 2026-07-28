# Past Paper JSON Staging 修改方案（MVP）

> 本文档仅包含当前版本需要修改的问题。
>
> **已解决的问题不再修改。**
>
> **忽略版权相关问题。**
>
> **重复问题已合并，不重复列出。**

------------------------------------------------------------------------

# 修改目标

当前 Parser 已能够：

-   稳定解析 Question
-   拆分 Leaf Question
-   建立 Stable ID
-   建立 Parent 关系
-   完成 Marks Validation
-   建立 Staging Pipeline

下一轮仅完善 Staging 流程和数据一致性，不重构 Parser。

------------------------------------------------------------------------

# P0-1 修复 Response Area 落库

## 问题

Parser 已识别 `responseAreas`，但
`staging_questions.response_areas_json` 未保存。

## 修改要求

-   修复 mapper。
-   将 `responseAreas` 写入 staging。
-   增加一致性校验：
    -   Parser 有 responseAreas；
    -   Staging 必须同步存在。

## 验收

-   `response_areas_json` 不为空。
-   Q3(b)(i) 可恢复所有 `[BLANK_n]`。

------------------------------------------------------------------------

# P0-2 重构 Validation Engine

## 问题

当前 Validation 直接输出 PASS，没有真正检查 staging 数据。

## 修改要求

建立独立 Validator：

Parser → Staging → Validator → Issues → Publish Status

不得由 Parser 自己决定 PASS。

## 验收

-   Validator 独立运行。
-   Issues 根据 staging 数据生成。
-   Publish Status 来源于 Validator。

------------------------------------------------------------------------

# P0-3 重构 Publish Gate

## 问题

当前 Parser 完成即 READY_TO_PUBLISH。

## 修改要求

增加独立 Publish Gate。

至少检查：

-   Validation
-   Assets
-   Response Areas
-   Admin Review

全部通过后才允许 Publish。

## 验收

Publish 必须经过独立 Gate。

------------------------------------------------------------------------

# P1-1 Footer 清洗（统一处理）

## 问题

Page Display Text 保留 Footer 和乱码。

## 修改要求

建立 Footer Region Detector。

统一过滤：

-   Paper Code
-   Turn Over
-   Footer Barcode
-   Footer Glyph

## 验收

Page Display Text 不再出现：

-   0478/12/M/J/25
-   Footer Glyph
-   Footer Barcode

------------------------------------------------------------------------

# P1-2 修正 Suspicious Glyph Metric

## 问题

Metric 与最终字符串不一致。

## 修改要求

在生成最终 normalizedText 后重新统计：

normalizedText → suspiciousGlyphCount

不要统计 Raw Text。

## 验收

Metric 与最终字符串保持一致。

------------------------------------------------------------------------

# P1-3 修正 Cover Region 类型

## 问题

第一页 Region 类型仍为 question_content。

## 修改要求

改为：

-   cover_metadata
-   instructions
-   barcode

## 验收

Cover Page 不参与 Question Index。

------------------------------------------------------------------------

# P1-4 增加 Page Image

## 修改要求

保存：

-   page-001.webp
-   page-002.webp
-   ...

用于：

-   Review UI
-   OCR Debug
-   Bounding Box Overlay

------------------------------------------------------------------------

# P2-1 Context 精简（暂缓）

目前 Context 可正常工作。

正式版建议拆分：

-   globalContext
-   partContext
-   questionText

MVP 暂不修改。

------------------------------------------------------------------------

# P2-2 Confidence 优化（暂缓）

目前保持现状。

后续根据：

-   Layout
-   OCR
-   Validation
-   Assets

重新计算。

------------------------------------------------------------------------

# 下一轮 PR

## PR1

Response Area Mapper

------------------------------------------------------------------------

## PR2

Independent Validator

------------------------------------------------------------------------

## PR3

Publish Gate

------------------------------------------------------------------------

## PR4

Footer Cleaner

------------------------------------------------------------------------

## PR5

Suspicious Glyph Metric

------------------------------------------------------------------------

## PR6

Page Image Generation

------------------------------------------------------------------------

# 不需要继续修改

以下内容已经满足 MVP：

-   Stable ID
-   Parent Question
-   Question Boundary
-   Leaf Boundary
-   Marks Validation
-   Binary Operand
-   Negative Number
-   Fill Blank Detection
-   Visual Asset
-   Back Matter 截断（版权问题忽略）

------------------------------------------------------------------------

# MVP 完成标准

-   Response Area 正确落库
-   Validator 独立运行
-   Publish Gate 独立控制
-   Footer 清洗完成
-   Suspicious Glyph 指标正确
-   Page Image 已生成

完成以上内容后，可进入下一阶段（Mark Scheme 对齐、Knowledge Point
Mapping、Search Index）。
