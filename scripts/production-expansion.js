#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { planProductionExpansion, productionMonitoringReport, publishProductionExpansion, rollbackProductionExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.resolve(argValue("--store") || path.join(rootDir, "output", "production", "production-store.json"));
const batchId = argValue("--batch-id") || "PR028-0478-2023-MJ";
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-expansion", "pr028-production-expansion-report.json"));
const plan = planProductionExpansion({
  batchId,
  storePath,
  stagingDir: argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"),
  pdfDir: argValue("--pdf-dir") || path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2023-May-June")
});

let result;
if (process.argv.includes("--rollback")) {
  result = rollbackProductionExpansion({ storePath, batchId });
} else if (process.argv.includes("--confirm")) {
  const eligible = plan.pairs.filter((pair) => pair.status === "ELIGIBLE");
  if (plan.pairs.some((pair) => pair.status === "BLOCKED")) throw new Error("Production expansion is blocked because one or more Phase A pairs lack approved staging artifacts.");
  result = eligible.length
    ? publishProductionExpansion({ rootDir, storePath, batchId, syllabus: "0478", year: 2023, session: "M/J", pairs: eligible })
    : { batchId, status: "NO_CHANGES", productionWrite: false, message: "No unpublished eligible pairs." };
} else {
  result = { ...plan, status: plan.readyToExecute ? "READY" : "BLOCKED" };
}

const report = { generatedFor: "PR-028_Production_Expansion_Strategy_Explanation", plan, result, monitoring: productionMonitoringReport(storePath), fullProduction: false };
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
