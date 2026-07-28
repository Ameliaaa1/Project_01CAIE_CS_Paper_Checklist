# Phase 8-D Validation Intelligence

## Design

Expose three user-facing levels while retaining existing machine severities:

- P0 maps to Critical and blocks production.
- P1 maps to Warning and requires review.
- P2/P3/INFO map to Informational.

Every finding also receives a failure domain. Context-aware mark parsing continues to distinguish array indexes such as Array[5] from mark allocations such as [3].

## Guardrails

The mapping adds explanation and aggregation. It does not downgrade or bypass existing P0/P1 gates.
