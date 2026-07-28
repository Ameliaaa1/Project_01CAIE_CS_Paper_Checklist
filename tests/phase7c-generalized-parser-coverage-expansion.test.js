const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, [path.join(rootDir, "scripts", "phase7c-generalized-parser-coverage-expansion.js")], {
  cwd: rootDir,
  encoding: "utf8"
});
assert.equal(result.status, 0, result.stderr || result.stdout);

const reportPath = path.join(rootDir, "output", "parser-coverage", "phase7c-generalized-parser-coverage-expansion-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(report.status, "PASS");
assert.equal(report.phaseStatus, "COMPLETE");
assert.equal(report.completionDecision, "FULL_PASS");
assert.equal(report.productionWrite, false);
assert(Object.values(report.subphases).every((phase) => phase.status === "PASS"));
assert.equal(report.integrity.production.unchanged, true);
assert.equal(report.integrity.canonical.unchanged, true);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.deepEqual(report.remainingIssues, []);
assert(Object.values(report.completionChecks).every(Boolean));
for (const key of ["A", "B", "C", "D", "E"]) {
  assert(fs.existsSync(report.deliverables.subphases[key].designPath));
  assert(fs.existsSync(report.deliverables.subphases[key].implementationPath));
  assert(fs.existsSync(report.deliverables.subphases[key].regressionPath));
}
