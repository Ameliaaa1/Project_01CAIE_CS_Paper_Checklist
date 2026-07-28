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

## Run

```bash
npm start
```

Then open http://localhost:3000.

Question Finder, Practice Mode, checklist examples, and mark-scheme display consume the generated production canonical index. The website reports a missing index instead of falling back to PDF parsing or a second question bank.

## Website Data Boundary

The parser pipeline is the only layer that understands source PDFs. Build the website index from the production store with:

```bash
npm run build:question-index
```

This writes `generated/production-question-index.json` for the server and `public/assets/question-index.json` for the browser. Source PDFs remain static original references addressed through each question's `sourceReferences`; the website does not extract PDF text, detect questions, or crop mark-scheme regions.

Run the migration audit and create its debug JSON with:

```bash
npm run website:pdf-dependency-migration
```

## Ingestion Framework

The first ingestion pass is intentionally split into two layers:

- `src/ingestion/*` contains the project framework for scanning PDF directories, parsing CAIE filenames, computing SHA-256 hashes, grouping QP/MS/PM files, and returning structured run reports.
- Actual PDF page extraction, question slicing, mark-scheme parsing, OCR decisions, and database upserts remain isolated behind a PDF adapter boundary.

This keeps the basic project framework usable without coupling it to the fragile PDF layout work.

Dry-run scan:

```bash
npm run ingest:papers -- --dir public/textbook_syllabus/pastpaper --dry-run
```

Useful filters:

```bash
npm run ingest:papers -- --subject 0478 --role qp --dry-run
```

## User Database

Production account data uses PostgreSQL through Prisma. The production app no longer uses `data/users.json` or Redis/KV as the primary user database.

Main tables are defined in `prisma/schema.prisma`:

- `User` and `UserCredential` for account profile and PBKDF2 password hash metadata
- `Session` for hashed server-side session tokens
- `Purchase` for Stripe checkout and paid access state
- `QuestionSearch` for Question Finder free-search usage and search history
- `QuestionAttempt` for future answer grading history
- `PasswordResetToken` and `EmailVerificationToken` for future email flows

Local tests can still use `DATA_DIR` as a non-production fallback store. Treat `data/users.json` only as legacy data or local test data.

Production requires:

- `DATABASE_URL` - PostgreSQL connection string from Neon, Supabase Postgres, or Vercel Postgres
- `SESSION_SECRET` - at least 32 characters
- `STRIPE_SECRET_KEY` - Stripe secret API key used to create Checkout Sessions
- `STRIPE_PRICE_ID` - Stripe Price ID for PaperLens lifetime access
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint signing secret
- `OPENAI_API_KEY` - OpenAI API key used by Question Finder answer grading
- `OPENAI_GRADING_MODEL` - optional model override for answer grading; defaults to `gpt-4.1-mini`
- `PUBLIC_BASE_URL` or `APP_BASE_URL` - public origin used for Stripe success and cancel URLs

Redis/KV is optional and should only be used for rate limiting, cache, short-lived tokens, or legacy migration input:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `PAPERLENS_USERS_KEY` - old Redis key to read during migration; defaults to `paperlens:users`

### Prisma Commands

```bash
npm install
npm run db:generate
npm run db:migrate
```

For production deploys:

```bash
npm run db:deploy
npm run build
```

### Legacy User Migration

Dry run first:

```bash
DATA_DIR=/path/to/legacy/data npm run migrate:users:dry-run
```

Then migrate into Postgres:

```bash
DATABASE_URL="postgres://..." DATA_DIR=/path/to/legacy/data npm run migrate:users
```

To migrate from the old Redis/KV whole-users key, set the Upstash/KV variables and `PAPERLENS_USERS_KEY`. The script preserves legacy `id`, normalized `email`, names, PBKDF2 hash/salt, purchased state, and Question Finder searches. Duplicate emails are reported and not silently overwritten.

## Vercel Deployment

This repository includes `vercel.json` and `api/index.js` so Vercel serves the static site files directly and routes `/api/*` requests to the Node serverless function.

For GitHub-based Preview deployments, push a branch to GitHub and let the Vercel GitHub integration create the Preview deployment. Do not run `vercel --prod` for Preview checks.

### GitHub Push Checklist

- Run `git status --short` and review every changed file before pushing.
- Confirm `.env`, `.env.*`, `.vercel/`, `node_modules/`, `.tmp_papers/`, `data/users.json`, and `data/checkout-sessions.json` are untracked and ignored.
- Run `npm test`.
- Run `npm run build:question-index`.
- Commit the generated `generated/production-question-index.json` and `public/assets/question-index.json` updates when production canonical content has changed.
- Push a feature branch, not the production branch, when you want a Vercel Preview.
- Open a GitHub pull request and wait for the Vercel deployment check.

### Vercel GitHub Integration Checklist

- Import this GitHub repository in Vercel.
- Use the project root as the Vercel root directory.
- Use the Node.js runtime with `api/index.js` as configured in `vercel.json`.
- Keep the build command as `npm run build`; it runs `prisma generate` and rebuilds the generated question index.
- Set required environment variables in Vercel for Preview and Production as appropriate.
- Create a PostgreSQL database with Neon, Supabase Postgres, or Vercel Postgres, then set `DATABASE_URL`.
- Run `npm run db:deploy` against the production database before or during release.
- Add Stripe environment variables before testing paid checkout.
- Add Redis/KV variables only if you want distributed rate limiting or need to run legacy Redis migration.
- Keep production domains attached only to Production deployments.

### Production Verification

After deployment:

- Open `/api/health` and confirm `{ "ok": true }`.
- Register a new account and confirm the response includes a public user with `purchased: false`.
- Log out, log back in, and confirm `/api/auth/session` returns the current user.
- Start a Stripe Checkout session, complete payment in Stripe test mode, and confirm the signed webhook changes `/api/billing/status` to `paid`.
- Run two unique Question Finder searches as an unpaid user and confirm the third unique search is blocked.

Add `paperlens.eu.cc` as the production domain in Vercel, then point the domain's DNS to Vercel from Cloudflare.

After pushing a branch, get the Preview URL from the GitHub pull request's Vercel check, from Vercel's automatic PR comment if enabled, or from the deployment list in the Vercel dashboard.

## Project Structure

- `index.html` - app markup
- `styles.css` - responsive UI
- `app.js` - browser UI backed by the production canonical question index
- `server.js` - Node HTTP server, static hosting, production-backed search, and canonical-text export API
- `src/server/*.js` - Prisma-backed user, auth, session, purchase, and Question Finder data access
- `src/ingestion/*.js` - ingestion framework utilities; PDF extraction is isolated behind an adapter
- `prisma/schema.prisma` - production PostgreSQL schema
- `package.json` - app scripts
- `assets/study-workspace.png` - generated hero visual
- `data/*.example.json` - safe user database schema examples
