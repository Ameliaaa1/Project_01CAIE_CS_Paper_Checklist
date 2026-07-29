# PR-010A Question Text Normalization Contract and Migration

## 1. Objective

解决 PR-009 完成后出现的 Question Rendering Contract 数据问题：

结构标签同时存在于 metadata 和 question text，导致 frontend 重复渲染。

错误示例：

``` text
Metadata:
label = "a"

Question Text:
"(a) Give one input device..."
```

Frontend:

``` text
(a)

(a) Give one input device...
```

目标：

``` text
Structural Label = Metadata

Question Text = Pure Content
```

------------------------------------------------------------------------

## 2. Root Cause

当前 Canonical Question 数据：

``` json
{
  "label": "a",
  "text": "(a) Give one input device."
}
```

同一个结构信息出现两次：

-   label metadata
-   text prefix

Frontend 根据 Contract 渲染两者，因此产生重复。

------------------------------------------------------------------------

## 3. Scope

覆盖：

-   (a), (b), (c)
-   (i), (ii), (iii)
-   (A), (B), (C)
-   nested labels such as (a)(i)

------------------------------------------------------------------------

## 4. Data Contract

Before:

``` json
{
  "partId": "a",
  "label": "a",
  "text": "(a) Give one input device."
}
```

After:

``` json
{
  "partId": "a",
  "label": "a",
  "text": "Give one input device."
}
```

规则：

    Structural Label = Metadata
    Question Text = Content only

------------------------------------------------------------------------

## 5. Modification Location

修改位置：

    Parser

    ↓

    Question Text Normalization Layer

    ↓

    Canonical Question Model

    ↓

    Production Data

    ↓

    Frontend

禁止：

-   frontend replace
-   CSS hide label
-   PDF viewer modification

------------------------------------------------------------------------

## 6. Normalization Rules

### Rule 1

只删除文本开头的结构标签。

例如：

Input:

    (a) Explain binary numbers.

Output:

    Explain binary numbers.

------------------------------------------------------------------------

### Rule 2

保留正文中的类似内容。

Input:

    The variable (a) is stored in memory.

Output:

    The variable (a) is stored in memory.

------------------------------------------------------------------------

### Rule 3

只允许 prefix matching。

推荐：

``` regex
^(\([a-z]\)|\([ivx]+\)|\([A-Z]\))\s*
```

禁止：

``` javascript
replaceAll("(a)", "")
```

------------------------------------------------------------------------

## 7. Migration Workflow

### Step 1

Backup current production question data。

### Step 2

运行 normalization script。

输入：

    Current Canonical Question Data

输出：

    Normalized Canonical Question Data

### Step 3

生成：

    output/maintenance/pr010-normalization-diff.json

格式：

``` json
{
  "modifiedQuestions": [],
  "removedLabels": [],
  "unexpectedChanges": []
}
```

### Step 4

Contract Validation:

    duplicateLabelsDetected = 0

    textStartsWithStructuralLabel = 0

    renderedLabelsDuplicated = 0

### Step 5

重新生成：

-   Server Index
-   Browser Index

并验证 hash。

------------------------------------------------------------------------

## 8. Regression Tests

### Case 1

Input:

    (a) Give one input device.

Expected:

    label = a

    text = Give one input device.

------------------------------------------------------------------------

### Case 2

Input:

    (i) Convert the binary numbers.

Expected:

    label = i

    text = Convert the binary numbers.

------------------------------------------------------------------------

### Case 3

Input:

    The variable (a) is stored.

Expected:

    UNCHANGED

------------------------------------------------------------------------

## 9. Acceptance Criteria

完成后：

    duplicate structural labels = 0

    question text contains no leading labels

    stable IDs unchanged

    mark scheme mapping unchanged

    frontend renderer unchanged

    0478 regression PASS

    9618 regression PASS

------------------------------------------------------------------------

## 10. Codex Execution Prompt

``` text
Implement PR-010A Question Text Normalization Contract.

Goal:
Remove duplicated structural labels from canonical question text.

Do not modify:
- Frontend renderer
- PDF viewer
- Stable Question IDs
- Mark Scheme mapping

Tasks:
1. Add canonical question text normalization stage.
2. Remove only leading structural labels.
3. Preserve labels inside normal content.
4. Generate normalization diff report.
5. Run contract validation.
6. Rebuild indexes.

Generate:
output/maintenance/pr010-normalization-diff.json

Acceptance:
- No duplicate rendered labels.
- Question text contains pure content.
- No regression in 0478 and 9618.
```

------------------------------------------------------------------------

## 11. Final Architecture

    PDF

    ↓

    Parser

    ↓

    Question Text Normalization

    ↓

    Canonical Question Model

    ↓

    Production Data

    ↓

    Question Rendering Contract

    ↓

    Frontend

最终：

    Structural Labels = Metadata

    Question Text = Content
