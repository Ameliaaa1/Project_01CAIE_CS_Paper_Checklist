# Minimal User Approval

Current secret-review status: `PASS_SECRET_REVIEW_LOCAL_ONLY_NO_EXPOSURE_EVIDENCE`

Only the following unrelated repository-organization decisions remain. No per-file review is requested.

## 1. PDF strategy

- [ ] A — Keep all 484 deployment PDFs in GitHub/Vercel indefinitely.
- [ ] B — Recommended: keep them now, then run a separate external-storage migration and remove them only after online verification.

## 2. Large JSON private backup

The main repository is public and no private remote is configured.

- [ ] Approve creation/use of a separate private GitHub backup repository and private Release for the 25 unique JSON blobs.

Until approved and configured: `BLOCKED_PRIVATE_REMOTE_REQUIRED`.

## Secret review closure

`.env.local` is classified as `EXPECTED_LOCAL_VERCEL_OIDC_CREDENTIAL`. It is ignored, local-only, untracked, unstaged, and has no exposure evidence. `BLOCKED_SECRET_REMEDIATION_REQUIRED` is cleared; no proactive rotation or `npx vercel dev` run is required for Repository File Organization.
