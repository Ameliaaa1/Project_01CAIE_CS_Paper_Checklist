#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const syllabus = argValue("--syllabus") || "9618";
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr048-9618-production-expansion-preparation-report.json"));
const report = prepareSyllabusExpansion({
  syllabus,
  generatedFor: "PR-048-9618-Production-Expansion-Preparation-Plan",
  pdfRoot: argValue("--pdf-root") || path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  stagingDir: argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"),
  storePath: argValue("--store") || path.join(rootDir, "output", "production", "production-store.json")
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, productionWrite: report.productionWrite, inventory: report.inventory, coverage: report.coverage, recommendedNextBatch: report.recommendedNextBatch }, null, 2)}\n`);

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
