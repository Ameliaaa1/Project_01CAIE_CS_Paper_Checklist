# Phase 8-A Quality Monitoring

## Design

Build one read-only dashboard from source inventory, staging artifacts, production identities, validation findings, regression results, and parser failures.

Metrics are ratios with explicit numerators and denominators. A syllabus is healthy only when source, staging, and production coverage are complete and incomplete, blocked, eligible-unpublished, and duplicate counts are zero.

## Guardrails

Monitoring never writes staging or production data. Missing data remains visible and cannot be converted into a passing ratio.
