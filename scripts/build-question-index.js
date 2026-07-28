#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { loadProductionQuestionEntries, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const outputPath = path.join(rootDir, "generated", "production-question-index.json");
const publicOutputPath = path.join(rootDir, "public", "assets", "question-index.json");
const websiteSyllabusIds = new Set(["caie-igcse-0478", "caie-as-a-level-9618"]);
const websiteSubjectCodes = new Set(["0478", "9618"]);

function main() {
  if (!fs.existsSync(storePath)) throw new Error("Production canonical store is required to build the website question index.");
  const store = readProductionStore(storePath);
  const entries = loadProductionQuestionEntries(storePath)
    .filter((entry) => websiteSyllabusIds.has(entry.syllabusId));
  if (!entries.length) throw new Error("Production canonical store contains no website question entries.");
  const websitePapers = store.papers.filter((paper) => websiteSubjectCodes.has(String(paper.syllabus)));
  const websitePaperIds = new Set(websitePapers.map((paper) => paper.id));
  const payload = {
    schemaVersion: "2.0",
    dataSource: "PRODUCTION_CANONICAL",
    productionStoreSha256: sha256File(storePath),
    productionUpdatedAt: store.updatedAt || null,
    papers: websitePapers.length,
    questions: entries.length,
    markSchemeEntries: store.markSchemeEntries.filter((entry) => websitePaperIds.has(entry.paperId)).length,
    entries
  };
  writeJson(outputPath, payload, true);
  writeJson(publicOutputPath, payload, false);
  process.stdout.write(`Wrote ${entries.length} production canonical questions to ${path.relative(rootDir, outputPath)}\n`);
  process.stdout.write(`Wrote browser production index to ${path.relative(rootDir, publicOutputPath)}\n`);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeJson(filePath, value, pretty) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}

main();
