const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr064-9618-2021-on-previously-blocked-production-expansion-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const production = readProductionStore(storePath);

assert.equal(report.generatedFor, "PR-064-9618-2021-ON-Previously-Blocked-Pair-Production-Expansion-Plan");
assert.equal(report.batchId, "PR064-9618-2021-ON-PREVIOUSLY-BLOCKED");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, true);
assert.equal(report.previouslyBlocked, true);
assert.deepEqual(report.resolvedBy, ["PR-062"]);
assert.deepEqual(report.scope, { syllabus: "9618", year: 2021, session: "O/N", components: ["22"] });
assert.equal(report.preflight.length, 1);
assert.equal(report.preflight[0].status, "PASS");
for (const role of [report.preflight[0].qp, report.preflight[0].ms]) {
  assert.equal(role.validationStatus, "PASS");
  assert.equal(role.completenessStatus, "PASS");
  assert.equal(role.canonicalPublishable, true);
  assert.equal(role.publishStatus, "READY_TO_PUBLISH");
  assert.equal(role.severityCounts.P0, 0);
  assert.equal(role.severityCounts.P1, 0);
  assert(Object.values(role.completenessChecks).every((status) => status === "PASS"));
}
assert.equal(report.alreadyPublished, false);
assert.equal(report.partialProductionConflict, false);
assert.deepEqual(report.expectedDeltas, {
  papers: 2,
  questionRecords: 30,
  topLevelQuestions: 6,
  leafQuestions: 24,
  responseAreas: 176,
  markSchemeEntries: 24,
  pairings: 1,
  batches: 1,
  expansionBatches: 1
});
assert.equal(report.publication.deltasMatch, true);
assert.deepEqual(report.publication.actualDeltas, report.expectedDeltas);
assert.equal(report.pairVerification.length, 1);
assert.equal(report.pairVerification[0].status, "PASS");
assert.deepEqual(report.pairVerification[0].verification.counts, report.pairVerification[0].verification.expectedCounts);
assert.equal(report.pairVerification[0].verification.counts.paperCount, 2);
assert.equal(report.pairVerification[0].verification.sourceTraceAvailable, true);
assert.equal(report.pairVerification[0].verification.pairingLinked, true);
assert(Object.values(report.frontendVerification).every((status) => status === "PASS"));
assert.equal(report.integrity.productionHashChanged, true);
assert.equal(report.integrity.existingRecordsUnchanged, true);
assert(Object.values(report.integrity.existingRecordChanges).every((count) => count === 0));
assert.equal(report.integrity.stagingArtifactsUnchanged, true);
assert.deepEqual(report.coverageAfter, {
  sourcePairs: 118,
  completeSourcePairs: 117,
  stagingPairs: 25,
  stagingPartialPairs: 0,
  stagingMissingPairs: 93,
  publishedPairs: 24,
  eligibleUnpublishedPairs: 1,
  missingStagingPairs: 92,
  blockedPairs: 0,
  incompleteSourcePairs: 1,
  partialProductionConflicts: 0
});
assert.equal(report.next.proposedPr, "PR-065");
assert.deepEqual(report.next.pairingKeys, ["9618-2024-ON-12"]);
assert.equal(report.regression.pr063, "PASS");
assert.equal(report.regression.legalMultiplicationResolutionContexts, "PASS");
assert.equal(report.regression.otherSuspiciousGlyphsRemainDetected, "PASS");
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);

assert(production.papers.some((paper) => paper.id === "9618-2021-ON-22-QP"));
assert(production.papers.some((paper) => paper.id === "9618-2021-ON-22-MS"));
assert(production.pairings.some((pairing) => pairing.pairingKey === "9618-2021-ON-22"));
