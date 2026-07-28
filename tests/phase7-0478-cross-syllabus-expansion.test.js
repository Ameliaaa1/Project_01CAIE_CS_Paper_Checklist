const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "0478-final-closure-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "Phase-7-Cross-Syllabus-Expansion-Plan");
assert.equal(report.phaseId, "Phase 7-A");
assert.equal(report.status, "PASS");
assert.equal(report.closureDecision, "FULL_PASS");
assert.deepEqual(report.coverage, {
  sourcePairs: 98,
  completeSourcePairs: 98,
  incompleteSourcePairs: 0,
  duplicateSourceCount: 0,
  stagingPairs: 98,
  stagingPartialPairs: 0,
  stagingMissingPairs: 0,
  missingStagingPairs: 0,
  publishedPairs: 98,
  blockedPairs: 0,
  eligibleUnpublishedPairs: 0,
  partialProductionConflicts: 0
});
assert.equal(report.sourceInventory.status, "PASS");
assert.equal(report.documentProfileValidation.status, "PASS");
assert.equal(report.parserCompatibility.status, "PASS");
assert.equal(report.canonicalCompatibility.status, "PASS");
assert.equal(report.stagingExpansion.stagingArtifactsAddedInPhase7, 96);
assert.equal(report.productionExpansion.publishedPairsAddedInPhase7, 74);
assert.equal(report.pairVerification.status, "PASS");
assert.equal(report.pairVerification.verifiedPairCount, 98);
assert.deepEqual(report.pairVerification.failures, []);
assert.equal(report.frontendVerification.status, "PASS");
assert(Object.values(report.frontendVerification.checks).every((status) => status === "PASS"));
assert.equal(report.frozen9618Integrity.unchanged, true);
assert.equal(report.parserIntegrity.unchanged, true);
assert.equal(report.canonicalIntegrity.unchanged, true);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.deepEqual(report.remainingIssues, []);
assert(Object.values(report.closureChecks).every(Boolean));
assert.equal(report.next.phaseId, "Phase 7-B");
