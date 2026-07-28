from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pymupdf


def span_text(span: dict[str, Any]) -> str:
    if "text" in span:
        return str(span["text"])
    return "".join(str(char.get("c", "")) for char in span.get("chars", []))


def inspect_page(pdf_path: Path, page_number: int, output_path: Path) -> None:
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    with pymupdf.open(pdf_path) as document:
        if page_number < 1 or page_number > document.page_count:
            raise ValueError(f"page_number must be 1-{document.page_count}")

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
            block_record: dict[str, Any] = {
                "blockIndex": block_index,
                "bbox": block.get("bbox"),
                "lines": [],
            }
            for line_index, line in enumerate(block.get("lines", [])):
                line_record: dict[str, Any] = {
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
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--page", type=int, required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    inspect_page(Path(args.pdf), args.page, Path(args.output))


if __name__ == "__main__":
    main()
