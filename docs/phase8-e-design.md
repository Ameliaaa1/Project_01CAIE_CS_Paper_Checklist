# Phase 8-E Production Governance

## Design

Create content-addressed, immutable snapshots outside the production store. Each snapshot has a manifest containing SHA-256, byte length, schema version, source timestamp, and record counts.

Provide a verified rollback preflight that is dry-run by default. The restore API refuses execution unless the caller passes explicit allowWrite=true and verifies the snapshot hash before and after restoration.

## Guardrails

Phase 8 only exercises snapshot creation and rollback preflight. It does not execute a production restore or mutate production data.
