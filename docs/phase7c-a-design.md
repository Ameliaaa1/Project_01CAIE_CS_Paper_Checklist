# Phase 7-C-A Document Structure Generalization

## Failure pattern

Document routing depended on an exact underscore filename and an explicit QP/MS role.

## Design

- Normalize CAIE separators, session aliases, and role aliases before parsing.
- Resolve document role from explicit metadata, filename, and document text in priority order.
- Report conflicting signals instead of silently changing role.
- Keep the existing QUESTION_PAPER, MARK_SCHEME, and GENERIC_DOCUMENT profiles.

## Protection

No canonical schema or production record is changed. Existing exact filenames remain canonical.
