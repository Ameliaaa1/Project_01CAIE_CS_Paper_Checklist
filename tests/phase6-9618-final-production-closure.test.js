const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase6-9618-final-production-closure-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "Phase-6-9618-Final-Production-Closure-Plan");
assert.equal(report.phaseId, "Phase 6");
assert.equal(report.status, "PASS");
assert.equal(report.closureDecision, "FULL_PASS");
assert.equal(report.auditOnly, true);
assert.equal(report.productionWrite, false);
assert.equal(report.generateStaging, false);
assert.deepEqual(report.finalCoverage, {
  sourcePairs: 118,
  completeSourcePairs: 118,
  incompleteSourcePairs: 0,
  duplicateSourceCount: 0,
  stagingPairs: 118,
  stagingPartialPairs: 0,
  stagingMissingPairs: 0,
  missingStagingPairs: 0,
  publishedPairs: 118,
  blockedPairs: 0,
  eligibleUnpublishedPairs: 0,
  partialProductionConflicts: 0
});
assert.equal(report.phase5Reconciliation.status, "PASS");
assert.equal(report.phase5Reconciliation.publishedPairsAdded, 13);
assert.equal(report.phase5Reconciliation.resolvedPairCount, 13);
assert.equal(report.productionSnapshot.pairings >= 118, true);
assert.equal(report.pairVerification.status, "PASS");
assert.equal(report.pairVerification.verifiedPairCount, 118);
assert.deepEqual(report.pairVerification.failures, []);
assert.equal(report.parserTargetedRegression.status, "PASS");
assert.equal(report.parserTargetedRegression.fixtures.length, 6);
assert(report.parserTargetedRegression.fixtures.every((fixture) => fixture.status === "PASS"));
assert.equal(report.canonicalIntegrity.status, "PASS");
assert(Object.values(report.canonicalIntegrity.models).every((status) => status === "PASS"));
assert.equal(report.frontendVerification.status, "PASS");
assert(Object.values(report.frontendVerification.checks).every((status) => status === "PASS"));
for (const key of ["sourceIntegrity", "stagingIntegrity", "productionIntegrity", "parserIntegrity"]) {
  assert.equal(report[key].unchanged, true);
}
assert.equal(report.productionIntegrity.existingProductionRecordsUnchanged, true);
assert.deepEqual(report.productionIntegrity.unexpectedProductionChanges, []);
assert.deepEqual(report.stagingIntegrity.added, []);
assert.deepEqual(report.stagingIntegrity.modified, []);
assert.deepEqual(report.stagingIntegrity.deleted, []);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.deepEqual(report.remainingIssues, []);
assert(Object.values(report.closureChecks).every(Boolean));
assert.equal(report.next.phaseId, "Phase 7");
