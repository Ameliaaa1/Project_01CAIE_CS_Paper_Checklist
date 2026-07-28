from __future__ import annotations

import re
from collections import Counter
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


PAPER_CODE_PATTERN = re.compile(r"\b\d{4}/\d{2}/[A-Z]/[A-Z]/\d{2}\b", re.IGNORECASE)
BARCODE_PATTERN = re.compile(r"^\*\s*(?:\d\s*){8,16}\*$")
KNOWN_MARGIN_TEXT = ("do not write in this margin",)
KNOWN_FOOTER_TEXT = ("turn over",)
SUSPICIOUS_LATIN_EXTENDED = re.compile(r"[\u00c0-\u024f]")


def suspicious_character_count(text: str) -> int:
    return len(SUSPICIOUS_LATIN_EXTENDED.findall(text or ""))


def is_near_footer(bbox: tuple[float, float, float, float], page_height: float) -> bool:
    _, y0, _, _ = bbox
    return y0 >= page_height * 0.80


def normalize_repeated_block(text: str) -> str:
    text = re.sub(r"\d+", "<N>", text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def collect_repeated_footer_keys(pages: list[list[SpanRecord]], page_heights: list[float]) -> set[str]:
    keys: list[str] = []
    for page_spans, page_height in zip(pages, page_heights, strict=True):
        for span in page_spans:
            if is_near_footer(span.bbox, page_height):
                key = normalize_repeated_block(span.text)
                if key:
                    keys.append(key)
    counts = Counter(keys)
    return {key for key, count in counts.items() if count >= 2}
