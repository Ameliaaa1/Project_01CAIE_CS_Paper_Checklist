const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase1-9618-2022-mj-41-staging-validation-production-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const production = readProductionStore(path.join(rootDir, "output", "production", "production-store.json"));

assert.equal(report.generatedFor, "Phase-1-9618-2022-MJ-41-Staging-Validation-Production-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.phaseId, "Phase 1");
assert.equal(report.sourcePreconditions.status, "PASS");
assert.equal(report.stagingGeneration.status, "PASS");
assert.equal(report.qpValidation.validationStatus, "PASS");
assert.equal(report.msValidation.validationStatus, "PASS");
assert.equal(report.qpValidation.completenessStatus, "PASS");
assert.equal(report.msValidation.completenessStatus, "PASS");
assert.equal(report.strictEligibility.eligible, true);
assert.deepEqual(report.strictEligibility.blockers, []);
assert.equal(report.productionPreflight.status, "PASS");
assert.equal(report.productionPreflight.alreadyPublished, false);
assert.equal(report.productionPreflight.partialProductionConflict, false);
assert.deepEqual(report.expectedDeltas, {
  papers: 2,
  questionRecords: 26,
  topLevelQuestions: 3,
  leafQuestions: 23,
  responseAreas: 23,
  markSchemeEntries: 24,
  pairings: 1,
  batches: 1,
  expansionBatches: 1
});
assert.deepEqual(report.actualDeltas, report.expectedDeltas);
assert.equal(report.deltasMatch, true);
assert.equal(report.publication.status, "PASS");
assert.equal(report.publication.productionWrite, true);
assert.equal(report.pairVerification.status, "PASS");
assert.deepEqual(report.pairVerification.verification.counts, report.pairVerification.verification.expectedCounts);
assert.equal(report.pairVerification.verification.counts.paperCount, 2);
assert.equal(report.pairVerification.verification.sourceTraceAvailable, true);
assert.equal(report.pairVerification.verification.pairingLinked, true);
assert(Object.values(report.frontendVerification).every((status) => status === "PASS"));
assert.equal(report.integrity.production.productionHashChanged, true);
assert.equal(report.integrity.existingRecordsUnchanged, true);
assert(Object.values(report.integrity.existingRecordChanges).every((count) => count === 0));
assert.equal(report.integrity.stagingArtifactsUnchanged, true);
for (const key of ["sourceAssets", "qpSource", "msSource", "parser", "canonical"]) assert.equal(report.integrity[key].unchanged, true);
assert.equal(report.coverageAfter.publishedPairs, report.coverageBefore.publishedPairs + 1);
assert.equal(report.coverageAfter.eligibleUnpublishedPairs, 0);
assert.equal(report.coverageAfter.blockedPairs, 0);
assert.equal(report.coverageAfter.partialProductionConflicts, 0);
assert.equal(report.next.phaseId, "Phase 2");
assert.deepEqual(report.next.pairingKeys, ["9618-2021-ON-41"]);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);

assert(production.papers.some((paper) => paper.id === "9618-2022-MJ-41-QP"));
assert(production.papers.some((paper) => paper.id === "9618-2022-MJ-41-MS"));
assert(production.pairings.some((pairing) => pairing.pairingKey === "9618-2022-MJ-41"));
