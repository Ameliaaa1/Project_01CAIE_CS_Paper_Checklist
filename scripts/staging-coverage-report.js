#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { generateStagingCoverageReport } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-expansion", "pr029-staging-coverage-report.json"));
const report = generateStagingCoverageReport({
  batchId: "PR028-0478-2023-MJ",
  stagingDir: argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging")
});
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.blockedCount > 0) process.exitCode = 2;

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
