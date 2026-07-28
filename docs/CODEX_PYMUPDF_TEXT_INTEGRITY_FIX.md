# PyMuPDF 专项解决方案：修复 Footer Glyph 与 Text Quality Metric 不一致

> **目标问题**：最终 `normalizedText` / `displayText` 仍含 `ċ、ĥ、ą、ģ、ī` 等异常字符，但 `normalizedSuspiciousGlyphCount` 一直为 `0`。  
> **工具**：PyMuPDF  
> **模式**：Golden Fixture + Staging-first  
> **优先级**：P0

---

## 1. 问题定义

当前数据存在矛盾：

```json
{
  "normalizedSuspiciousGlyphCount": 0,
  "normalizedText": "... ċñ ğ đ Ć μ ¹ě ...",
  "displayText": "... ċñ ğ đ Ć μ ¹ě ..."
}
```

这说明：

1. 最终字符串仍包含错误 glyph；
2. metric 没有基于最终字符串重新计算；
3. footer / barcode text block 仍进入正文；
4. validator 只相信保存的 metric，没有独立复算。

本轮不要继续增加字符黑名单。应在 **PyMuPDF text block / span 层** 修复。

---

## 2. 正确数据流

```text
PDF
→ PyMuPDF rawdict
→ Block / Line / Span
→ Region Classification
→ 排除 footer / barcode / margin
→ 生成 normalizedText
→ 生成 displayText
→ 对最终字符串计算 metrics
→ 写入 staging
→ 从 staging 重新读取
→ Validator 独立复算
→ Publish Gate
```

禁止：

```text
整页字符串
→ replace 几个字符
→ 写 suspiciousGlyphCount = 0
```

---

## 3. 建立 PDF Inspector

创建：

```text
tools/pdf_inspector/
├── inspect_page.py
├── classify_regions.py
└── render_debug.py
```

### `inspect_page.py`

```python
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pymupdf


def span_text(span: dict[str, Any]) -> str:
    if "text" in span:
        return str(span["text"])

    return "".join(
        str(char.get("c", ""))
        for char in span.get("chars", [])
    )


def inspect_page(
    pdf_path: Path,
    page_number: int,
    output_path: Path,
) -> None:
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    with pymupdf.open(pdf_path) as document:
        if page_number < 1 or page_number > document.page_count:
            raise ValueError(
                f"page_number must be 1-{document.page_count}"
            )

        page = document[page_number - 1]
        raw = page.get_text("rawdict", sort=True)

        result: dict[str, Any] = {
            "pageNumber": page_number,
            "width": page.rect.width,
            "height": page.rect.height,
            "blocks": [],
        }

        for block_index, block in enumerate(raw.get("blocks", [])):
            if block.get("type") != 0:
                continue

            block_record = {
                "blockIndex": block_index,
                "bbox": block.get("bbox"),
                "lines": [],
            }

            for line_index, line in enumerate(block.get("lines", [])):
                line_record = {
                    "lineIndex": line_index,
                    "bbox": line.get("bbox"),
                    "spans": [],
                }

                for span_index, span in enumerate(line.get("spans", [])):
                    line_record["spans"].append({
                        "spanIndex": span_index,
                        "text": span_text(span),
                        "font": span.get("font"),
                        "size": span.get("size"),
                        "bbox": span.get("bbox"),
                        "flags": span.get("flags"),
                        "color": span.get("color"),
                    })

                block_record["lines"].append(line_record)

            result["blocks"].append(block_record)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--page", type=int, required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    inspect_page(
        Path(args.pdf),
        args.page,
        Path(args.output),
    )


if __name__ == "__main__":
    main()
```

运行：

```bash
python tools/pdf_inspector/inspect_page.py   --pdf public/textbook_syllabus/pastpaper/caie-igcse-0478/2025-May-June/0478_s25_qp_12.pdf   --page 5   --output debug/0478-s25-12/page-005-spans.json
```

---

## 4. Block 分类

统一类型：

```python
from dataclasses import dataclass
from enum import StrEnum


class RegionType(StrEnum):
    QUESTION_CONTENT = "question_content"
    FOOTER = "footer"
    HEADER = "header"
    BARCODE = "barcode"
    MARGIN = "margin"
    RESPONSE_AREA = "response_area"
    VISUAL = "visual"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class SpanRecord:
    text: str
    font: str
    size: float
    bbox: tuple[float, float, float, float]
    page_number: int
```

---

## 5. Footer Detector

不要只靠字符。使用：

1. 页面位置；
2. 已知模式；
3. 字体；
4. 跨页重复。

```python
import re


PAPER_CODE_PATTERN = re.compile(
    r"\b\d{4}/\d{2}/[A-Z]/[A-Z]/\d{2}\b",
    re.IGNORECASE,
)

BARCODE_PATTERN = re.compile(
    r"^\*\s*(?:\d\s*){8,16}\*$"
)

KNOWN_MARGIN_TEXT = (
    "do not write in this margin",
)

KNOWN_FOOTER_TEXT = (
    "turn over",
)

SUSPICIOUS_LATIN_EXTENDED = re.compile(
    r"[ċĥąģīóāĕõåĬĊÝþĠÐØÑĀĆĒĎ]"
)


def suspicious_character_count(text: str) -> int:
    return len(SUSPICIOUS_LATIN_EXTENDED.findall(text))


def is_near_footer(
    bbox: tuple[float, float, float, float],
    page_height: float,
) -> bool:
    _, y0, _, _ = bbox
    return y0 >= page_height * 0.80
```

`μ` 不应单独删除，因为在科学题中可能合法。

---

## 6. 跨页重复检测

```python
from collections import Counter
import re


def normalize_repeated_block(text: str) -> str:
    text = re.sub(r"\d+", "<N>", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def collect_repeated_footer_keys(
    pages: list[list[SpanRecord]],
    page_heights: list[float],
) -> set[str]:
    keys: list[str] = []

    for page_spans, page_height in zip(
        pages,
        page_heights,
        strict=True,
    ):
        for span in page_spans:
            if is_near_footer(span.bbox, page_height):
                key = normalize_repeated_block(span.text)
                if key:
                    keys.append(key)

    counts = Counter(keys)

    return {
        key
        for key, count in counts.items()
        if count >= 2
    }
```

---

## 7. 先过滤，再生成文本

```python
def build_page_texts(
    spans: list[SpanRecord],
    page_height: float,
    repeated_footer_keys: set[str],
) -> tuple[str, str, list[SpanRecord]]:
    kept: list[SpanRecord] = []

    for span in spans:
        normalized = " ".join(span.text.lower().split())
        repeated_key = normalize_repeated_block(span.text)

        if BARCODE_PATTERN.search(span.text):
            continue

        if any(
            margin_text in normalized
            for margin_text in KNOWN_MARGIN_TEXT
        ):
            continue

        known_footer = (
            PAPER_CODE_PATTERN.search(span.text) is not None
            or any(
                item in normalized
                for item in KNOWN_FOOTER_TEXT
            )
        )

        suspicious_footer = (
            is_near_footer(span.bbox, page_height)
            and (
                known_footer
                or repeated_key in repeated_footer_keys
                or suspicious_character_count(span.text) >= 2
            )
        )

        if suspicious_footer:
            continue

        kept.append(span)

    kept.sort(
        key=lambda span: (
            round(span.bbox[1], 1),
            round(span.bbox[0], 1),
        )
    )

    normalized_text = normalize_text(
        " ".join(span.text for span in kept)
    )

    display_text = build_display_text(normalized_text)

    return normalized_text, display_text, kept
```

不要误删：

- `01100101`
- `01110000`
- `-22`
- `✓`
- 合法的 `μ`

---

## 8. Metrics 必须最后计算

```python
def calculate_text_quality(
    raw_text: str,
    normalized_text: str,
    display_text: str,
) -> dict[str, int]:
    return {
        "rawCharacterCount": len(raw_text),
        "normalizedCharacterCount": len(normalized_text),
        "displayCharacterCount": len(display_text),
        "rawSuspiciousGlyphCount":
            suspicious_character_count(raw_text),
        "normalizedSuspiciousGlyphCount":
            suspicious_character_count(normalized_text),
        "displaySuspiciousGlyphCount":
            suspicious_character_count(display_text),
    }
```

禁止：

```text
先统计
→ 后续再修改字符串
```

---

## 9. Staging Writer 只接受 Canonical Page

```python
from dataclasses import dataclass


@dataclass
class CanonicalPage:
    page_number: int
    raw_text: str
    normalized_text: str
    display_text: str
    text_quality: dict
    kept_spans: list[SpanRecord]
    excluded_spans: list[SpanRecord]
```

Writer 不得重新拼接文字，也不得再次清洗。

---

## 10. 独立 Validator

写入 staging 后重新读取：

```python
def validate_page(page: dict) -> list[dict]:
    issues: list[dict] = []

    actual_normalized_count = suspicious_character_count(
        page["normalized_text"]
    )

    stored_normalized_count = page[
        "text_quality_json"
    ]["normalizedSuspiciousGlyphCount"]

    if actual_normalized_count != stored_normalized_count:
        issues.append({
            "severity": "P0",
            "code": "TEXT_QUALITY_METRIC_INCONSISTENT",
            "pageNumber": page["page_number"],
            "observed": {
                "stored": stored_normalized_count,
                "recomputed": actual_normalized_count,
            },
        })

    actual_display_count = suspicious_character_count(
        page["display_text"]
    )

    if actual_display_count > 0:
        issues.append({
            "severity": "P1",
            "code": "SUSPICIOUS_GLYPHS_REMAIN",
            "pageNumber": page["page_number"],
            "count": actual_display_count,
        })

    return issues
```

重复页面问题应聚合为一个 paper-level issue，并列出 `affectedPages`。

---

## 11. Publish Gate

```python
PUBLISH_BLOCKING_CODES = {
    "TEXT_QUALITY_METRIC_INCONSISTENT",
}


def determine_publish_status(
    issues: list[dict],
) -> str:
    has_blocking_issue = any(
        issue["code"] in PUBLISH_BLOCKING_CODES
        or issue["severity"] == "P0"
        for issue in issues
    )

    return (
        "BLOCKED"
        if has_blocking_issue
        else "READY_TO_PUBLISH"
    )
```

Validator 必须验证 staging 重载后的内容。

---

## 12. Golden Fixture 测试

至少添加：

```python
def test_page_5_footer_glyphs_removed(result):
    page = result.page(5)

    assert "ċñ" not in page.display_text
    assert "¹ě" not in page.display_text
    assert "0478/12/M/J/25" not in page.display_text
    assert "[Turn over]" not in page.display_text

    assert (
        page.text_quality[
            "displaySuspiciousGlyphCount"
        ]
        == 0
    )
```

```python
def test_metrics_match_final_strings(result):
    for page in result.pages:
        assert (
            suspicious_character_count(
                page.normalized_text
            )
            ==
            page.text_quality[
                "normalizedSuspiciousGlyphCount"
            ]
        )

        assert (
            suspicious_character_count(
                page.display_text
            )
            ==
            page.text_quality[
                "displaySuspiciousGlyphCount"
            ]
        )
```

```python
def test_valid_symbols_preserved(result):
    page_3 = result.page(3)
    page_4 = result.page(4)

    assert "01100101" in page_3.display_text
    assert "01110000" in page_3.display_text
    assert "-22" in page_3.search_text
    assert "✓" in page_4.display_text
```

---

## 13. Codex 分 PR 实施顺序

### PR 1：PDF Inspector

- 导出 rawdict；
- 保存 font / bbox；
- 生成 debug 图片。

### PR 2：Block Classifier

- footer；
- barcode；
- margin；
- repeated footer detection。

### PR 3：Canonical Text Builder

- 先过滤 block；
- 后生成 normalized/display text；
- 保留合法数字和符号。

### PR 4：Final Metrics

- 在最终字符串后计算；
- 增加 `displaySuspiciousGlyphCount`。

### PR 5：Independent Validator

- staging 写入后重新加载；
- validator 独立复算；
- 聚合重复 issues。

### PR 6：Publish Gate

- P0 强制 `BLOCKED`；
- 不再信任 parser 自报 count。

### PR 7：Golden Fixture

- page 5 fixture；
- 页面 2–11 footer regression；
- 合法符号保护测试。

---

## 14. 可直接交给 Codex 的 Prompt

```text
请使用已经安装的 PyMuPDF，修复 Past Paper ingestion 中
TEXT_QUALITY_METRIC_INCONSISTENT 问题。

问题表现：

- normalizedText / displayText 中仍包含
  ċ、ĥ、ą、ģ、ī 等 footer glyph；
- normalizedSuspiciousGlyphCount 却一直为 0；
- staging validation 和 publish gate 因此错误通过。

本轮只修这一条数据链，不修改 Question ID、Leaf Question、
Marks、Mark Scheme、Knowledge Point、Auth、Session、Billing 或无关前端。

必须按以下顺序：

1. 使用 page.get_text("rawdict", sort=True) 导出 page 5 的
   block、line、span、font、bbox、size。
2. 生成 page 5 block debug 图片。
3. 确认异常 glyph 所在 block 的字体、坐标和跨页重复情况。
4. 实现 block-level footer / barcode / margin classification。
5. 先排除不合格 block，再生成 normalizedText 和 displayText。
6. 不得通过字符黑名单误删 01100101、01110000、-22、✓ 或合法 μ。
7. 对最终 normalizedText 和 displayText 重新计算 metrics。
8. 将 displaySuspiciousGlyphCount 写入 canonical page 和 staging。
9. staging 写入完成后重新加载 persisted rows。
10. Validator 独立重算，并比较 stored count 和 recomputed count。
11. 重复页面问题聚合为一个 paper-level issue，列出 affectedPages。
12. TEXT_QUALITY_METRIC_INCONSISTENT 必须阻止 publish。
13. 将 0478_s25_qp_12.pdf 建为 golden fixture。
14. 添加页面 2–11 footer 清理测试和合法符号保护测试。
15. 不直接修改导出的 JSON 来伪造修复。

完成后报告：

- 根因
- 异常 span 的 font / bbox / page
- 修改文件
- block 分类规则
- 修复前后 page 5 文本
- stored / recomputed metrics
- golden tests
- staging validation
- publish status
- 仍未解决的边缘情况
```

---

## 15. 验收标准

```text
Page 2–11 displayText 不含 footer glyph
Page 2–11 displayText 不含 paper code
Page 2–11 displayText 不含 [Turn over]
normalized metric = 对 normalizedText 的重新计算结果
display metric = 对 displayText 的重新计算结果
01100101 保留
01110000 保留
-22 保留
✓ 保留
合法 μ 不被无条件删除
Validator 从 staging 重载后运行
TEXT_QUALITY_METRIC_INCONSISTENT 数量 = 0
Publish Gate 不再依赖 parser 自报 count
Golden fixture 全部通过
```

---

## 16. 边界

PyMuPDF 负责提供：

```text
文本
字体
坐标
页面
block
span
```

项目代码负责判断：

```text
哪些 block 是正文
哪些 block 是 footer
哪些字符在当前上下文中合法
哪些结果可以发布
```

PyMuPDF 不会自动理解 Cambridge 试卷。它只是终于把证据交出来，不必再让 Codex 对着乱码进行玄学推理。
