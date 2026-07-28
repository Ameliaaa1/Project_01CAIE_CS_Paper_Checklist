const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase5-9618-blocked-pair-investigation-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "Phase-5-9618-Blocked-Pair-Investigation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, true);
assert.equal(report.scope.pairCount, 13);
assert.equal(report.investigationResults.length, 13);
assert(report.investigationResults.every((pair) => pair.rootCause.category && pair.rootCause.affectedLayer));
assert(report.investigationResults.every((pair) => pair.validationAfter.qp.status === "PASS"));
assert(report.investigationResults.every((pair) => pair.validationAfter.ms.status === "PASS"));
assert(report.investigationResults.every((pair) => pair.strictEligibilityAfter === true));
assert(report.investigationResults.every((pair) => pair.productionPublished === true));
assert(report.investigationResults.every((pair) => pair.pairVerification === "PASS"));
assert.deepEqual(report.unresolvedPairs, []);
assert.equal(report.coverageAfter.sourcePairs, 118);
assert.equal(report.coverageAfter.completeSourcePairs, 118);
assert.equal(report.coverageAfter.stagingPairs, 118);
assert.equal(report.coverageAfter.publishedPairs, 118);
assert.equal(report.coverageAfter.blockedPairs, 0);
assert.equal(report.coverageAfter.eligibleUnpublishedPairs, 0);
assert.equal(report.coverageAfter.partialProductionConflicts, 0);
assert.equal(report.batches.length, 4);
assert(report.batches.every((batch) => batch.status === "PASS" && batch.deltasMatch));
assert(report.integrity.existingProductionRecordsUnchanged);
assert(report.integrity.unrelatedStagingUnchanged);
assert(report.integrity.sourceAssets.unchanged);
assert(report.integrity.parserDuringExecution.unchanged);
assert(report.integrity.canonicalDuringExecution.unchanged);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(report.next.phaseId, "Phase 6");

for (const batch of ["a", "b", "c", "d"]) {
  const batchPath = path.join(rootDir, "output", "production-expansion", "phase5-9618", `phase5-${batch}-blocked-pair-investigation-report.json`);
  const batchReport = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  assert.equal(batchReport.status, "PASS");
  assert(batchReport.targetPairs.length > 0);
  assert(batchReport.investigationResults.every((pair) => pair.strictEligibilityAfter));
}
