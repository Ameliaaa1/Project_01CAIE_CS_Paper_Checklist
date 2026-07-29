#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { formatText } = require("./documentation-validation/format-results");
const { validateRepository } = require("./documentation-validation/validator");

function usage() {
  return [
    "Usage: node scripts/validate-documentation.js [options]",
    "",
    "Options:",
    "  --mode full|changed       Validation mode (default: full)",
    "  --base <git-ref>          Required for changed mode",
    "  --format text|json        Terminal output format (default: text)",
    "  --json-output <path>      Explicitly write the JSON result to this path",
    "  --help                    Show this help",
    "",
    "The validator is read-only unless --json-output is explicitly supplied.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = { mode: "full", format: "text" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { help: true };
    if (["--fix", "--rewrite", "--update-baseline", "--approve"].includes(arg)) {
      throw new Error(`Forbidden option: ${arg}`);
    }
    if (arg === "--mode" || arg === "--base" || arg === "--format" || arg === "--json-output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      index += 1;
      if (arg === "--mode") options.mode = value;
      if (arg === "--base") options.base = value;
      if (arg === "--format") options.format = value;
      if (arg === "--json-output") options.jsonOutput = value;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  if (!["text", "json"].includes(options.format)) {
    throw new Error(`Unsupported format: ${options.format}`);
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = validateRepository({
    root: process.cwd(),
    mode: options.mode,
    base: options.base,
  });
  const json = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(options.format === "json" ? json : formatText(result));
  if (options.jsonOutput) {
    const output = path.resolve(options.jsonOutput);
    fs.writeFileSync(output, json, "utf8");
  }
  process.exitCode = result.exitCode;
}

if (require.main === module) main();

module.exports = { main, parseArgs, usage };
