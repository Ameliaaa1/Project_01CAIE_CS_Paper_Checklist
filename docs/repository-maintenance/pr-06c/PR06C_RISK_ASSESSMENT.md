# PR-06C Source-of-Truth Risk Assessment

Status: `READY_FOR_HUMAN_REVIEW`

Owner: Repository maintainers

Created at: `2026-07-31T01:46:17Z`

Authoritative scope: NONE

Related documents:

- [Source-of-truth audit](PR06C_SOURCE_OF_TRUTH_AUDIT.md)
- [Schema proposal](PR06C_SOURCE_OF_TRUTH_SCHEMA_PROPOSAL.md)
- [Promotion contract](PR06C_PROMOTION_CONTRACT.md)

## Risks

| Risk | Severity | Control |
| --- | --- | --- |
| Existing derivative mistaken for Candidate | P0 | Exact manifest path; no inference |
| Delivery asset mistaken for Current Production | P0 | Exact Production manifest required |
| Candidate compared as identical to Current Production | P0 | Candidate equality applies only to Promotion Target |
| Bootstrap blocked by unconditional Production requirement | P0 | Mode-specific baseline absence rule |
| Update silently treated as Bootstrap | P0 | Exact mode plus baseline presence/hash binding |
| Promotion Target mistaken for active Production | P0 | Separate path, role, lifecycle, and owner |
| PASS interpreted as write authorization | P0 | Three distinct states and human gate |
| 9709 reintroduced | P0 | Supported-scope allowlist 0478/9618 |
| Hash calculated over unstable representation | P0 | Exact UTF-8 serialization and LF rules |
| Stable identifiers drift while counts match | P1 | Duplicate-rejecting canonical stable-ID set hash |
| Scope or schema hash differs by ordering | P1 | Frozen canonical ordering and serialization |
| Manifest field escapes comparison | P0 | Exhaustive single-category field matrix; unknown fields block |
| Unknown schema silently accepted | P1 | Version fail-closed |
| Dirty worktree data influences decision | P1 | Audit only isolated `origin/main` worktree |
| Historical plan treated as current | P1 | Archive excluded as architectural authority |
| Validation mutates any promotion role | P0 | Candidate/Current/Target before-and-after byte verification |
| Runtime secrets enter evidence | P0 | No credentials; manifests contain no secret values |

## Residual Risk

The repaired contract cannot prove a real promotion because no Candidate,
Current Production, or Promotion Target manifest exists. That is intentional.
Human approval resolves the model, not the data. The later validator must
include adversarial Bootstrap and Update fixtures for every BLOCK rule and
demonstrate repository byte stability.

## Stop Conditions

Stop immediately if a later phase:

- selects authority by filename similarity;
- reads unreviewed artifacts from another worktree;
- compares Candidate and Current Production as required-equal content;
- permits Bootstrap with Production present or Update with Production absent;
- accepts a field without exactly one classification;
- hashes an unordered, duplicate, locale-dependent, or self-referencing value;
- changes Candidate, Current Production, Promotion Target, PDFs, parser,
  frontend, or runtime;
- introduces deployment credentials or a Production command;
- reports PASS while Candidate or Promotion Target is missing.
