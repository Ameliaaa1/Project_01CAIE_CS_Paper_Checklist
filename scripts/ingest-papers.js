#!/usr/bin/env node

const path = require("node:path");
const { runIngestion } = require("../src/ingestion");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.dir) {
    options.dir = path.join(__dirname, "..", "public", "textbook_syllabus", "pastpaper");
  }

  const result = await runIngestion(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseArgs(args) {
  const options = { dryRun: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--dir") {
      options.dir = args[index + 1];
      index += 1;
    } else if (arg === "--subject") {
      options.subject = args[index + 1];
      index += 1;
    } else if (arg === "--role") {
      options.role = args[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  process.stdout.write([
    "Usage: npm run ingest:papers -- [options]",
    "",
    "Options:",
    "  --dir <path>       PDF root directory",
    "  --subject <code>   Filter by subject code, for example 0478",
    "  --role <role>      Filter by qp, ms, or pm",
    "  --dry-run          Scan and report without invoking PDF processing",
    ""
  ].join("\n"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
