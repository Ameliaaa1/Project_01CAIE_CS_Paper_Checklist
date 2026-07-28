# Phase 8-C Parser Observability

## Design

Record a versioned decision trace for representative PDF spans:

1. Original page/block/line/span, text, font, size, and bounding box.
2. Region classification and evidence.
3. Include/exclude decision.
4. Transformation input and output.
5. Canonical destination when included.

Excluded barcode, footer, margin, answer-line, and noise spans remain inspectable while staying outside canonical text.
