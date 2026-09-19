# Contributing to PaperLens

Status: `VALIDATED`

Owner: Repository maintainers

Created at: `2026-09-18T07:38:50Z`

Authoritative scope: Contribution workflow for code, documentation, tests, and review

Related documents:

- [Onboarding guide](docs/ONBOARDING.md)
- [Documentation Index](docs/DOCUMENTATION_INDEX.md)
- [Project README](README.md)

This guide is the proposed contribution baseline for the collaboration PR that
introduces it. It becomes current project guidance only after that PR is
reviewed and merged.

## Before You Start

- Read the [onboarding guide](docs/ONBOARDING.md) and the relevant README section.
- Confirm that your change is scoped to the repository and does not require production database, payment, or deployment access.
- Check `git status --short` before editing and keep unrelated user changes intact.

## Branches and Commits

- Work from a feature branch. Use `codex/`, `feature/`, `fix/`, or `docs/` as a short, descriptive prefix; never develop directly on `main`.
- Keep commits focused and explain the user-visible or governance outcome.
- Do not commit `.env`, `.env.*`, `.vercel/`, `node_modules/`, `.tmp_papers/`, local user data, generated secrets, or credentials.

## Local Checks

Run the checks relevant to the change before opening a pull request:

```bash
npm test
npm run build:question-index
npm run validate:docs
```

For a documentation-only change, at minimum run `npm run validate:docs` and the focused test command that covers the edited behavior. Report every command and its result in the pull request.

## Pull Requests

1. Push the feature branch and open a pull request against `main`.
2. Describe the problem, the scope, the validation evidence, and any deferred work or risks.
3. Link related issues or maintenance records when applicable.
4. Wait for required CI and Vercel Preview checks.
5. Request review from the owners listed in `.github/CODEOWNERS`.

Do not use `vercel --prod` for a Preview check. Production deployment, production database changes, payment-provider activation, and production writes require a separate explicit approval stage.

## Documentation Changes

New long-lived documentation must follow [`docs/DOCUMENTATION_STANDARD.md`](docs/DOCUMENTATION_STANDARD.md), be linked from [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md), and receive an authority-map entry when it defines a source of truth. Do not edit files in `docs/archive/` or frozen maintenance evidence as part of an ordinary feature PR.

## Review Expectations

Reviewers should check behavior, tests, documentation links, security and privacy boundaries, generated artifacts, and whether the change accidentally authorizes production operations. A passing CI run does not replace human review of scope or risk.
