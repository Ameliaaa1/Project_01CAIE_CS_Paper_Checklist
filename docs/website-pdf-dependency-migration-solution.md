# Website PDF Dependency Migration Solution

## 1. Background

当前 CAIE Past Paper Parser 项目已经完成 Phase 1-8，Parser Pipeline
已经成为 PDF 数据解析的唯一可信来源。

当前架构：

    PDF
     ↓
    Parser
     ↓
    Canonical Model
     ↓
    Staging Validation
     ↓
    Production Data
     ↓
    Website

但是早期网站开发过程中，部分功能可能直接依赖 PDF 文件进行：

-   PDF 文本读取
-   Question 提取
-   Mark Scheme 搜索
-   页面内容定位
-   OCR / PDF parsing

这种方式会导致网站层重复实现数据解析逻辑，并产生数据不一致风险。

本方案目标：

将网站中所有 PDF 内容依赖迁移到 Production Data 层，同时保留 PDF
作为用户查看原始文件的资源。

------------------------------------------------------------------------

# 2. Problem Definition

## Existing Risk

当前潜在问题：

    Website
     |
     |-- PDF Parsing
     |
     |-- PDF Extraction
     |
     |-- Question Detection
     |
    Parser Pipeline
     |
     |-- Question Detection
     |
     |-- Text Extraction

存在两个数据来源：

1.  Parser Pipeline
2.  Website 内部 PDF 逻辑

可能产生：

-   Question 内容不一致
-   Mark Scheme 不一致
-   Response Area 不一致
-   Regression 难以定位

------------------------------------------------------------------------

# 3. Target Architecture

迁移后：

    PDF Source

    ↓

    CAIE Parser Pipeline

    ↓

    Canonical Data

    ↓

    Production Data/API

    ↓

    Website

    ↓

    Frontend Display

网站职责：

-   数据查询
-   用户交互
-   页面展示
-   业务逻辑

Parser 职责：

-   PDF extraction
-   Question parsing
-   Mark Scheme parsing
-   Response Area detection

------------------------------------------------------------------------

# 4. Migration Scope

## 4.1 Remove Website PDF Parsing

需要检查：

-   PDF.js
-   pdf-lib
-   OCR library
-   text extraction code
-   question parsing logic
-   mark scheme parsing logic

目标：

删除网站内部 PDF 数据理解逻辑。

禁止：

    Frontend
     ↓
    PDF
     ↓
    Extract Text

------------------------------------------------------------------------

## 4.2 Question Display Migration

旧流程：

    User Request

    ↓

    Find PDF

    ↓

    Extract Question

    ↓

    Display

新流程：

    User Request

    ↓

    Question ID

    ↓

    Production API

    ↓

    Canonical Question Data

    ↓

    Display

------------------------------------------------------------------------

## 4.3 Mark Scheme Migration

旧流程：

    Search Keyword

    ↓

    Scan PDF Mark Scheme

新流程：

    Search Keyword

    ↓

    Production Mark Scheme Index

    ↓

    Return Result

------------------------------------------------------------------------

## 4.4 PDF Viewer Preservation

PDF 查看功能可以保留。

区别：

错误：

    PDF = Data Source

正确：

    Production Data = Data Source

    PDF = Original Reference

例如：

    Question

    sourceTrace:
    - paper
    - page
    - component

    ↓

    Open Original PDF

------------------------------------------------------------------------

# 5. Implementation Plan

## PR-Website-001

## Remove Direct PDF Parsing Dependency

目标：

移除网站内部 PDF parsing。

修改范围：

-   backend
-   frontend
-   utility functions

验证：

-   网站正常加载
-   API 返回正常
-   Question 页面正常展示

------------------------------------------------------------------------

## PR-Website-002

## Question Data Source Migration

目标：

所有 Question 内容来自 Production Data。

验证：

-   Question Finder
-   Practice Mode
-   Checklist

------------------------------------------------------------------------

## PR-Website-003

## Mark Scheme Data Migration

目标：

Mark Scheme 查询完全基于 Production Index。

验证：

-   keyword search
-   mark scheme display

------------------------------------------------------------------------

## PR-Website-004

## PDF Reference Layer Refactor

目标：

保留 PDF 查看能力。

修改：

PDF 仅由 sourceTrace 定位。

验证：

-   Open Original Question
-   Page location

------------------------------------------------------------------------

# 6. Codex Development Rules

后续网站开发必须遵守：

    CAIE Parser Pipeline is the single source of truth.

    Website must not:
    - parse PDF
    - extract PDF text
    - detect questions
    - detect marks
    - rebuild parser logic

    Website should:
    - query production data
    - use existing schema
    - report missing data

------------------------------------------------------------------------

# 7. Validation Requirements

每个 PR 必须验证：

## Functional

-   Question display PASS
-   Mark Scheme display PASS
-   Search PASS
-   PDF viewer PASS

## Data Integrity

确认：

    Website Question
    =
    Production Canonical Question

------------------------------------------------------------------------

## Regression

必须确认：

-   0478 unchanged
-   9618 unchanged
-   9709 unchanged
-   Existing user functions unchanged

------------------------------------------------------------------------

# 8. Rollback Strategy

如果迁移出现问题：

恢复：

-   previous API route
-   previous frontend component
-   previous data adapter

禁止：

回退到网站内部 PDF parsing。

------------------------------------------------------------------------

# 9. Final Objective

完成后：

    Parser Pipeline
            |
            |
    Production Data
            |
            |
    Website

成为唯一数据流。

网站不再理解 PDF 结构，只消费已经验证的数据。

这样可以保证：

-   数据一致性
-   更容易扩展 syllabus
-   更容易维护
-   降低 regression 风险
