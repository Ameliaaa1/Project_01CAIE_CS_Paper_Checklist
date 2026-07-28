#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { assertReadyToPublish, runCanonicalCompletenessGate } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const defaultStagingPath = path.join(rootDir, "output", "ingestion-samples", "0478_s25_qp_12.staging.json");

function main() {
  const runIdArg = process.argv.find((arg) => arg.startsWith("--run-id="));
  const confirm = process.argv.includes("--confirm");
  const stagingPath = path.resolve(argValue("--staging") || defaultStagingPath);
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  staging.run.summary_json.canonicalCompletenessGate = runCanonicalCompletenessGate(stagingPath);
  const expectedRunId = runIdArg ? runIdArg.slice("--run-id=".length) : staging.run.id;
  if (staging.run.id !== expectedRunId) throw new Error(`Run id not found: ${expectedRunId}`);
  assertReadyToPublish(staging);
  if (!confirm) {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      publishStatus: staging.run.publish_status,
      productionWrite: false,
      message: "Staging run is ready. Re-run with --confirm to publish in a future production implementation."
    }, null, 2)}\n`);
    return;
  }
  throw new Error("Production publish is intentionally not implemented in this staging-first pass.");
}

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

main();
