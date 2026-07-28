# Phase 7-C-C Mark Scheme Generalization

## Failure pattern

Mark Scheme header recognition named IGCSE explicitly, and bracketed identifiers can resemble mark tokens.

## Design

- Recognize Cambridge IGCSE, O Level, and International AS & A Level headers.
- Keep mark extraction layout-aware.
- Exclude array indexes and consecutive bracketed identifiers from mark sums.
- Retain detailed source traces for extracted Mark Scheme entries.

## Protection

No marks rule is weakened; ambiguous identifiers are excluded only when structural context identifies them as data indexes.
