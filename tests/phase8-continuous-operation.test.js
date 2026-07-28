const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { evaluateOperationalGate, validateIngestionWorkflow } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, [path.join(rootDir, "scripts", "phase8-continuous-operation.js")], {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 128
});
assert.equal(result.status, 0, result.stderr || result.stdout);

const report = JSON.parse(fs.readFileSync(path.join(rootDir, "output", "continuous-operation", "phase8-continuous-operation-report.json"), "utf8"));
assert.equal(report.status, "PASS");
assert.equal(report.phaseStatus, "COMPLETE");
assert.equal(report.completionDecision, "FULL_PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.workflow.status, "PASS");
assert.equal(report.qualityGate.summary.blocked, 0);
assert.equal(report.monitoring.status, "HEALTHY");
assert.equal(report.regression.status, "PASS");
assert.equal(report.integrity.production.unchanged, true);
assert.equal(report.integrity.canonical.unchanged, true);
assert.deepEqual(report.remainingIssues, []);
assert(Object.values(report.completionChecks).every(Boolean));
assert(Object.values(report.operationalReports).every((filePath) => !path.isAbsolute(filePath) && fs.existsSync(path.join(rootDir, filePath))));

const blocked = evaluateOperationalGate({ validationStatus: "PASS", completenessStatus: "PASS", canonicalPublishable: true, p0Count: 1, p1Count: 0, regression: "PASS" });
assert.equal(blocked.status, "DO_NOT_PUBLISH");
assert.equal(blocked.publishAllowed, false);
assert(validateIngestionWorkflow(["SOURCE_COLLECTION", "PRODUCTION_PUBLISH"]).status === "FAIL");
