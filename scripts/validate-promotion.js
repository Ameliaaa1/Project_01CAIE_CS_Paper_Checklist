#!/usr/bin/env node
"use strict";

const path = require("path");
const { validateRepository, writeReport } = require("./promotion-validator/validator");

function usage() {
  return "Usage: node scripts/validate-promotion.js --intent <intent> [--root <path>] [--json-output reports/promotion-validator/<new-file>.json]";
}

function parseArgs(argv) {
  const options = { root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { help: true };
    if (["--intent", "--root", "--json-output"].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      index += 1;
      if (arg === "--intent") options.intent = value;
      if (arg === "--root") options.root = path.resolve(value);
      if (arg === "--json-output") options.jsonOutput = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (!options.intent) throw new Error("--intent is required");
  return options;
}

function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`${error.message}\n${usage()}\n`); process.exitCode = 2; return; }
  if (options.help) { process.stdout.write(`${usage()}\n`); return; }
  let report = validateRepository(options);
  if (options.jsonOutput) {
    try { writeReport(options.root, options.jsonOutput, report); }
    catch (error) {
      report = { ...report, result: "BLOCK", exitCode: 1, findings: [{ code: error.code || "REPORT_WRITE_FAILED", severity: "BLOCK", message: error.message, path: options.jsonOutput }] };
    }
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.exitCode;
}

if (require.main === module) main();
module.exports = { main, parseArgs, usage };
