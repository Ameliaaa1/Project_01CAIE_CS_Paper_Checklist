# PaperLens: CAIE Computer Science Checklist Generator

PaperLens is a full-stack local website for CAIE Computer Science revision planning.

It uses a maintained 2019-2025 CAIE IGCSE Computer Science 0478 past-paper and mark-scheme analysis corpus, then generates:

- Topic priority scores
- Syllabus-era coverage signals
- A focused revision checklist
- Original practice prompts
- Markdown, CSV, and JSON exports

## Important

Students do not upload past papers. This project stores source links and aggregate topic signals instead of reproducing official CAIE question-paper or mark-scheme text.

Primary source directory:

- https://pastpapers.papacambridge.com/papers/caie/igcse-computer-science-0478

## Documentation

See the [Documentation Index](docs/DOCUMENTATION_INDEX.md) for current
documentation navigation, repository-maintenance history, authoritative
sources, and archived records.

## Run

```bash
npm start
```

Then open http://localhost:3000.

The front end still keeps a browser-side fallback for the checklist/search logic, so the original local-first behavior is preserved when possible.

## Runtime Database Boundary

The approved dynamic-data schema uses PostgreSQL through Prisma for users,
credentials, sessions, purchases, question-search accounting, and the reserved
billing event ledger. Local development and tests retain an explicitly scoped
JSON fallback when `DATABASE_URL` is absent. Static question, PDF, image, and
search-index assets remain file-backed and are not stored in PostgreSQL.

The payment-provider schema is reserved, but payment-provider runtime is
deferred and disabled by default. No Stripe, Alipay, or WeChat Pay credentials
or activation steps are part of the current runtime configuration.

Production database creation, migration, runtime enablement, writes, and
deployment require their own later approval stages. This repository state does
not authorize any of those operations.

## Vercel Deployment

This repository includes `vercel.json` and `api/index.js` so Vercel serves the static site files directly and routes `/api/*` requests to the Node serverless function.

For GitHub-based Preview deployments, push a branch to GitHub and let the Vercel GitHub integration create the Preview deployment. Do not run `vercel --prod` for Preview checks.

### GitHub Push Checklist

- Run `git status --short` and review every changed file before pushing.
- Confirm `.env`, `.env.*`, `.vercel/`, `node_modules/`, `.tmp_papers/`, `data/users.json`, and `data/checkout-sessions.json` are untracked and ignored.
- Run `npm test`.
- Run `npm run build:question-index`.
- Confirm the canonical `generated/production-question-index.json` and browser
  asset mirror pass the deterministic index check.
- Push a feature branch, not the production branch, when you want a Vercel Preview.
- Open a GitHub pull request and wait for the Vercel deployment check.

### Vercel GitHub Integration Checklist

- Import this GitHub repository in Vercel.
- Use the project root as the Vercel root directory.
- Use the Node.js runtime with `api/index.js` as configured in `vercel.json`.
- Keep the build command as `npm run build` or leave Vercel's detected npm build command enabled.
- Set required environment variables in Vercel for Preview and Production as appropriate.
- Keep payment-provider runtime disabled unless a later stage explicitly
  authorizes and verifies a provider integration.
- Keep production domains attached only to Production deployments.

Add `paperlens.eu.cc` as the production domain in Vercel, then point the domain's DNS to Vercel from Cloudflare.

After pushing a branch, get the Preview URL from the GitHub pull request's Vercel check, from Vercel's automatic PR comment if enabled, or from the deployment list in the Vercel dashboard.

## Project Structure

- `index.html` - app markup
- `styles.css` - responsive UI
- `app.js` - browser UI with API-backed analysis/search and local fallback
- `server.js` - Node HTTP server, static hosting, analysis/search/export API
- `package.json` - app scripts
- `assets/study-workspace.png` - generated hero visual
- `data/*.example.json` - safe user database schema examples
