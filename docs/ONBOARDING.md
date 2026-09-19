# Contributor Onboarding

Status: `VALIDATED`

Owner: Repository maintainers

Created at: `2026-09-18T07:38:50Z`

Authoritative scope: First-day setup and safe local contribution path

Related documents:

- [Contribution guide](../CONTRIBUTING.md)
- [Project README](../README.md)
- [Documentation Index](DOCUMENTATION_INDEX.md)
- [Documentation Validation](DOCUMENTATION_VALIDATION.md)

This guide is proposed collaboration guidance and becomes current after the collaboration-baseline PR is reviewed and merged.

## 1. Prepare the Repository

Clone the repository and create a feature branch:

```bash
git clone https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git
cd Project_01CAIE_CS_Paper_Checklist
git switch -c docs/my-change
```

Use Node.js 18 or newer. Install the committed dependency set with `npm ci`.

## 2. Run Locally

Start the local server with `npm start` and open `http://localhost:3000`. Local development can use the scoped JSON fallback when `DATABASE_URL` is absent. Do not put real credentials or personal data in local files.

## 3. Understand the Boundaries

- Static question, PDF, image, and search-index assets remain file-backed.
- PostgreSQL through Prisma is the approved dynamic-data boundary.
- Payment-provider runtime is reserved and disabled by default.
- Nothing in a contributor branch authorizes production migrations, writes, deployment, or payment activation.

## 4. Make and Validate a Change

Keep changes focused, inspect `git diff`, and run the relevant checks. The standard baseline is:

```bash
npm test
npm run build:question-index
npm run validate:docs
```

For documentation changes, verify every new local link and update the documentation index and authority map when a new source of truth is introduced.

## 5. Open the Pull Request

Push your branch, open a PR against `main`, complete the PR template, and wait for CI and Vercel Preview checks. Include test output, screenshots for UI changes, migration notes when relevant, and explicit notes for anything not run locally.

## Troubleshooting

If `git status` says the current directory is not a repository, run `pwd` and `cd` to the cloned project directory before using Git. If dependency installation or database checks need access not available locally, record the limitation in the PR instead of using production credentials.
