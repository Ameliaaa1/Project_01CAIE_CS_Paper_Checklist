#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { runCanonicalCompletenessGate } = require("../src/ingestion");

const stagingArg = argValue("--staging");
if (!stagingArg) throw new Error("--staging is required.");
const stagingPath = path.resolve(stagingArg);
const report = runCanonicalCompletenessGate(stagingPath);
const reportArg = argValue("--report");
if (reportArg) {
  const reportPath = path.resolve(reportArg);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.publishable) process.exitCode = 1;

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
