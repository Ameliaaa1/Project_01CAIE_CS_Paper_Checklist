#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { buildStagingRun, evaluatePublishGate, runCanonicalCompletenessGate } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const defaultSamplePath = path.join(rootDir, "output", "ingestion-samples", "0478_s25_qp_12.sample.json");
const defaultOutputPath = path.join(rootDir, "output", "ingestion-samples", "0478_s25_qp_12.staging.json");

function main() {
  const approve = process.argv.includes("--approve-golden");
  const humanApproved = process.argv.includes("--human-admin-review");
  const humanReviewer = argValue("--human-reviewer");
  if (humanApproved && !humanReviewer) throw new Error("Human admin review requires --human-reviewer.");
  const samplePath = path.resolve(argValue("--sample") || defaultSamplePath);
  const outputPath = path.resolve(argValue("--output") || defaultOutputPath);
  const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  const staging = buildStagingRun(sample, {
    assetRoot: rootDir,
    adminApproved: approve,
    humanApproved,
    reviewer: approve ? "codex-golden-fixture" : null,
    humanReviewer
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(staging, null, 2)}\n`);
  const completeness = runCanonicalCompletenessGate(outputPath);
  staging.run.summary_json.canonicalCompletenessGate = completeness;
  const gate = evaluatePublishGate(staging);
  staging.run.summary_json.publishGate = gate;
  staging.run.publish_status = gate.publishStatus;
  staging.run.status = gate.publishStatus === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : "NEEDS_REVIEW";
  fs.writeFileSync(outputPath, `${JSON.stringify(staging, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    outputPath,
    runId: staging.run.id,
    status: staging.run.status,
    publishStatus: staging.run.publish_status,
    canonicalCompleteness: completeness,
    p0: staging.run.p0_issue_count,
    p1: staging.run.p1_issue_count,
    p2: staging.run.p2_issue_count,
    issues: staging.issues.map((issue) => [issue.severity, issue.code, issue.question_id || issue.page_number])
  }, null, 2)}\n`);
}

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

main();
