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


def extract_text_blocks(pdf_path: Path) -> dict[str, Any]:
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    pages: list[dict[str, Any]] = []
    with pymupdf.open(pdf_path) as document:
        for page_index, page in enumerate(document, start=1):
            raw = page.get_text("rawdict", sort=True)
            spans: list[dict[str, Any]] = []
            for block_index, block in enumerate(raw.get("blocks", [])):
                if block.get("type") != 0:
                    continue
                for line_index, line in enumerate(block.get("lines", [])):
                    for span_index, span in enumerate(line.get("spans", [])):
                        text = span_text(span).strip()
                        if not text:
                            continue
                        spans.append({
                            "text": text,
                            "font": span.get("font"),
                            "size": span.get("size"),
                            "bbox": span.get("bbox"),
                            "blockIndex": block_index,
                            "lineIndex": line_index,
                            "spanIndex": span_index,
                        })
            pages.append({
                "pageNumber": page_index,
                "width": page.rect.width,
                "height": page.rect.height,
                "spans": spans,
            })
    return {"pageCount": len(pages), "pages": pages}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    args = parser.parse_args()
    print(json.dumps(extract_text_blocks(Path(args.pdf)), ensure_ascii=False))


if __name__ == "__main__":
    main()
