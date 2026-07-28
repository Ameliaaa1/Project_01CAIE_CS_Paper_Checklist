#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { publishProductionPilot, rollbackProductionPilot } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pilotBatchId = argValue("--pilot-batch-id") || "PR027-0478-2023-MJ-12";
const storePath = path.resolve(argValue("--store") || path.join(rootDir, "output", "production", "production-store.json"));
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-pilot", "pr027-production-pilot-report.json"));

if (process.argv.includes("--rollback")) {
  const result = rollbackProductionPilot({ storePath, pilotBatchId });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(0);
}
if (!process.argv.includes("--confirm")) throw new Error("Production Pilot requires --confirm.");

const report = publishProductionPilot({
  rootDir,
  pilotBatchId,
  storePath,
  qpStagingPath: argValue("--qp") || path.join(rootDir, "output", "phase2", "staging", "0478_s23_qp_12.staging.json"),
  msStagingPath: argValue("--ms") || path.join(rootDir, "output", "phase2", "staging", "0478_s23_ms_12.staging.json")
});
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
