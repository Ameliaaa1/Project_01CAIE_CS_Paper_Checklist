const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { restoreProductionSnapshot } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, [path.join(rootDir, "scripts", "phase8-long-term-data-quality-improvement.js")], {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 32
});
assert.equal(result.status, 0, result.stderr || result.stdout);

const report = JSON.parse(fs.readFileSync(path.join(rootDir, "output", "quality-governance", "phase8-long-term-data-quality-improvement-report.json"), "utf8"));
assert.equal(report.status, "PASS");
assert.equal(report.phaseStatus, "COMPLETE");
assert.equal(report.completionDecision, "FULL_PASS");
assert.equal(report.productionWrite, false);
assert(Object.values(report.subphases).every((phase) => phase.status === "PASS"));
assert.equal(report.dashboard.status, "PASS");
assert.equal(report.integrity.production.unchanged, true);
assert.equal(report.integrity.canonical.unchanged, true);
assert.deepEqual(report.architectureFailures, []);
assert.deepEqual(report.remainingIssues, []);
assert(Object.values(report.completionChecks).every(Boolean));
assert.throws(() => restoreProductionSnapshot(report.subphases.E.snapshot, path.join(rootDir, "output", "production", "production-store.json")), /allowWrite=true/);
for (const key of ["A", "B", "C", "D", "E"]) {
  assert(fs.existsSync(report.deliverables.subphases[key].designPath));
  assert(fs.existsSync(report.deliverables.subphases[key].implementationPath));
  assert(fs.existsSync(report.deliverables.subphases[key].regressionPath));
}
