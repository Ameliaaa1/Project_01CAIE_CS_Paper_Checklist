# PR-010B Investigation Expansion Plan

# Child Reconstruction Integrity Audit

## Objective

当前已发现单个案例：

    0478/12/O/N/23 Q5

存在：

-   Child question 内容错位；
-   子题整体向后偏移；
-   Mark allocation 混入 Question Text；
-   Frontend 展示错误内容。

当前不能直接修复单个案例。

目标：

对整个 Production 数据进行扫描，确认：

1.  该问题影响范围；
2.  是否存在统一错误模式；
3.  确定真正需要修改的模块；
4.  避免针对单个题目的局部修复。

------------------------------------------------------------------------

# Current Understanding

当前问题表现：

PDF:

    (a) Give one benefit...
    (b) Give one drawback...
    (c) Describe sample resolution...
    (d) Identify compression method...

Canonical / Production:

    (a) Give drawback...
    (b) Describe sample resolution...
    (c) Compression question...
    (d) Remaining text...

表现为：

    child[i] = source child[i+1]

存在整体偏移。

------------------------------------------------------------------------

# Important Decision

当前阶段：

不要修改代码。

不要修复单个 question。

先执行：

    Production Child Boundary Audit

原因：

单个案例不能代表所有错误类型。

如果直接修改：

-   Question Split
-   Child Parser
-   Mark Extraction

可能修复一个模式，同时破坏其他题型。

------------------------------------------------------------------------

# Audit Scope

扫描：

    Production Dataset

覆盖：

-   0478 Computer Science
-   9618 Computer Science

------------------------------------------------------------------------

# Audit Objectives

## 1. Child Ordering Audit

检查：

Source:

    (a)
    (b)
    (c)

Canonical:

    (a)
    (b)
    (c)

必须一致。

检测：

-   子题顺序变化；
-   子题编号缺失；
-   子题整体偏移。

------------------------------------------------------------------------

## 2. Child Text Leakage Detection

检查：

一个 child 是否包含后续 child 内容。

Example:

Incorrect:

    (a)

    Give benefit.

    Give drawback.

Expected:

    (a)

    Give benefit.

输出：

-   affected question ID
-   child ID
-   leaked content

------------------------------------------------------------------------

## 3. Mark Allocation Pollution Audit

检测 Question Text 是否包含：

    [1]
    [2]
    [3]

或者：

    one [1]
    two [2]

错误：

    text:
    Give one benefit [1]

正确：

    text:
    Give one benefit

    marks:
    1

------------------------------------------------------------------------

## 4. Structural Label Pollution Audit

检测：

Question Text 中是否包含：

    (a)
    (b)
    (i)
    (ii)

结构标签。

正确：

    label:
    a

    text:
    Give one benefit

------------------------------------------------------------------------

## 5. Parent / Child Ownership Audit

检查：

Parent:

是否包含 child 内容。

Child:

是否包含 parent preamble。

------------------------------------------------------------------------

# Required Codex Investigation Output

生成：

    pr010b-child-boundary-audit-report.json

格式：

``` json
{
  "summary": {
    "totalQuestions": 0,
    "affectedQuestions": 0
  },

  "categories": [
    {
      "type": "CHILD_OFFSET",
      "count": 0,
      "examples": []
    },
    {
      "type": "MARK_TEXT_POLLUTION",
      "count": 0,
      "examples": []
    },
    {
      "type": "STRUCTURAL_LABEL_POLLUTION",
      "count": 0,
      "examples": []
    }
  ]
}
```

------------------------------------------------------------------------

# After Audit Decision

根据 audit 结果决定修复范围。

## Case 1

如果主要问题：

    CHILD_OFFSET

则修：

    Child Reconstruction Boundary Logic

------------------------------------------------------------------------

## Case 2

如果多个模块产生问题：

需要建立：

    Canonical Question Boundary Contract

------------------------------------------------------------------------

## Case 3

如果只有历史 Production 数据：

执行：

    Production Data Migration Repair

------------------------------------------------------------------------

# Regression Requirements

修复后必须验证：

## Data Stability

保持：

-   Question ID
-   Child ID
-   Parent ID
-   Mark Scheme ID
-   Response Area ID

不变。

## Rendering Stability

验证：

-   Question text 正确；
-   Child 顺序正确；
-   Marks 独立显示；
-   Parent context 正确。

------------------------------------------------------------------------

# Deliverables

必须生成：

    pr010b-child-boundary-audit-report.json

    pr010b-child-boundary-audit-summary.md

------------------------------------------------------------------------

# Completion Criteria

PR-010B Investigation Expansion 完成条件：

1.  找出所有受影响题目；
2.  分类错误模式；
3.  确认统一 root cause；
4.  决定最终修复范围。

当前阶段禁止：

    直接修改 Parser
    直接修改 Frontend
    直接修改 CSS

先获得完整数据分布，再进行工程修复。
