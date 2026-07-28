# Phase 7-C-B Question Parsing Generalization

## Failure pattern

Top-level question detection accepted only bare numeric labels even though CAIE layouts can use Q1 or Question 1, and nested references need a reusable interpretation.

## Design

- Recognize 1, Q1, Question 1, Q1(a), and Q1(b)(i) through one structural parser.
- Preserve existing stable IDs and parent/leaf splitting.
- Continue rejecting pseudocode line numbers using font and source-line context.

## Protection

Question boundaries, marks, and stable IDs are checked against 0478, 9618, and 9709 real PDFs.
