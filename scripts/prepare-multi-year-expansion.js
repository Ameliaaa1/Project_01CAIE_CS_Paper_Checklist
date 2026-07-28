#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { prepareMultiYearExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr033-multi-year-preparation-report.json"));
const report = prepareMultiYearExpansion({
  pdfRoot: argValue("--pdf-root") || path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478"),
  stagingDir: argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"),
  storePath: argValue("--store") || path.join(rootDir, "output", "production", "production-store.json")
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, ...report.summary, recommendedBatch: report.recommendedBatch }, null, 2)}\n`);

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
