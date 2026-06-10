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

## Project Structure

- `index.html` - app markup
- `styles.css` - responsive UI
- `app.js` - browser UI with API-backed analysis/search and local fallback
- `server.js` - Node HTTP server, static hosting, analysis/search/export API
- `package.json` - app scripts
- `assets/study-workspace.png` - generated hero visual
