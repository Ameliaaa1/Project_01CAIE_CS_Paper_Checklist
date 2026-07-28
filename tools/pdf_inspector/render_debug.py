from __future__ import annotations

import argparse
import json
from pathlib import Path

import pymupdf


def render_debug(pdf_path: Path, inspect_json_path: Path, output_path: Path) -> None:
    data = json.loads(inspect_json_path.read_text(encoding="utf-8"))
    page_number = int(data["pageNumber"])

    with pymupdf.open(pdf_path) as document:
        page = document[page_number - 1]
        for block in data.get("blocks", []):
            bbox = block.get("bbox")
            if not bbox:
                continue
            rect = pymupdf.Rect(*bbox)
            page.draw_rect(rect, color=(1, 0, 0), width=0.8)
            page.insert_text((rect.x0, max(8, rect.y0 - 2)), str(block["blockIndex"]), fontsize=7, color=(1, 0, 0))
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(output_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--inspect-json", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    render_debug(Path(args.pdf), Path(args.inspect_json), Path(args.output))


if __name__ == "__main__":
    main()
