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

The front end still keeps a browser-side fallback for the checklist/search logic, so the original local-first behavior is preserved when possible.

## User Database

Locally, the server stores runtime user and checkout data in `data/users.json` and `data/checkout-sessions.json`.
Those files are intentionally ignored because they can contain emails, password hashes, salts, and purchase records.

On startup, `server.js` creates both runtime database files automatically when they are missing:

- `data/users.json` with `{ "users": [] }`
- `data/checkout-sessions.json` with `{ "sessions": [] }`

Safe schema examples are committed as:

- `data/users.example.json`
- `data/checkout-sessions.example.json`

For testing or deployment, set `DATA_DIR=/path/to/private/data` to keep production user data outside the repository checkout.

On Vercel, configure a persistent Redis/KV store and add these environment variables:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

The app also accepts the equivalent Upstash names:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Production also requires:

- `SESSION_SECRET` - at least 32 characters; used to sign server-side session cookies
- `STRIPE_SECRET_KEY` - Stripe secret API key used to create Checkout Sessions
- `STRIPE_PRICE_ID` - Stripe Price ID for PaperLens lifetime access
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint signing secret
- `PUBLIC_BASE_URL` or `APP_BASE_URL` - public origin used for Stripe success and cancel URLs

Without those production variables, Vercel can serve pages and static past papers, but account registration, login state, purchases, and Question Finder trial usage will not be stored persistently.

## Vercel Deployment

This repository includes `vercel.json` and `api/index.js` so Vercel serves the static site files directly and routes `/api/*` requests to the Node serverless function.

Deploy with:

```bash
npx vercel --prod
```

Add `paperlens.eu.cc` as the production domain in Vercel, then point the domain's DNS to Vercel from Cloudflare.

## Project Structure

- `index.html` - app markup
- `styles.css` - responsive UI
- `app.js` - browser UI with API-backed analysis/search and local fallback
- `server.js` - Node HTTP server, static hosting, analysis/search/export API
- `package.json` - app scripts
- `assets/study-workspace.png` - generated hero visual
- `data/*.example.json` - safe user database schema examples
