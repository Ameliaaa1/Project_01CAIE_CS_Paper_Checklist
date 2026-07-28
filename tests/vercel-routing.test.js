const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const rootDir = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(rootDir, "vercel.json"), "utf8"));

assert.equal(fs.existsSync(path.join(rootDir, "app.js")), false, "root app.js must not exist; Vercel may treat it as a server entrypoint");
assert.equal(fs.existsSync(path.join(rootDir, "assets", "paperlens-data.js")), false, "shared browser data must live under public/");

for (const pathname of [
  "app.js",
  "styles.css",
  "checkout.js",
  "auth.js",
  "auth.css",
  "assets/paperlens-data.js",
  "assets/question-index.json",
  "assets/study-workspace.png",
  "textbook_syllabus/pastpaper/caie-igcse-0478/2025-March/0478_m25_qp_12.pdf",
  "textbook_syllabus/pastpaper/caie-as-a-level-9618/2025 May June/9618_s25_qp_11.pdf",
  "index.html",
  "checkout.html"
]) {
  assert.equal(fs.existsSync(path.join(rootDir, "public", pathname)), true, `public/${pathname} should exist for Vercel static serving`);
}

assert.deepEqual(config.rewrites, [{ source: "/api/(.*)", destination: "/api/index.js" }], "only /api/* should rewrite to the serverless entrypoint");
assert.equal(config.routes, undefined, "do not use broad routes that could capture static assets");
assert.equal(config.builds, undefined, "do not use legacy builds that could promote root browser files to functions");

const includeFiles = config.functions?.["api/index.js"]?.includeFiles || "";
assert.match(includeFiles, /public\/assets\/paperlens-data\.js/, "serverless bundle should include server-safe shared data");
assert.doesNotMatch(includeFiles, /(^|[,{}])app\.js($|[,{}])/, "serverless bundle must not include browser app.js");
