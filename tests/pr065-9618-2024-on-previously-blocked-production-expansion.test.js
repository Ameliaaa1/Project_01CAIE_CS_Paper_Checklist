const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr065-9618-2024-on-previously-blocked-production-expansion-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const production = readProductionStore(storePath);

assert.equal(report.generatedFor, "PR-065-9618-2024-ON-Previously-Blocked-Pair-Production-Expansion-Plan");
assert.equal(report.batchId, "PR065-9618-2024-ON-PREVIOUSLY-BLOCKED");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, true);
assert.equal(report.previouslyBlocked, true);
assert.deepEqual(report.resolvedBy, ["PR-062"]);
assert.deepEqual(report.scope, { syllabus: "9618", year: 2024, session: "O/N", components: ["12"] });
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
  questionRecords: 35,
  topLevelQuestions: 9,
  leafQuestions: 26,
  responseAreas: 132,
  markSchemeEntries: 26,
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
  publishedPairs: 25,
  eligibleUnpublishedPairs: 0,
  missingStagingPairs: 92,
  blockedPairs: 0,
  incompleteSourcePairs: 1,
  partialProductionConflicts: 0
});
assert.equal(report.next.proposedPr, "PR-066");
assert.equal(report.next.decision, "9618 Production Coverage Re-Audit");
assert.deepEqual(report.next.pairingKeys, []);
assert.equal(report.next.productionWrite, false);
assert.equal(report.regression.pr064, "PASS");
assert.equal(report.regression.legalMultiplicationResolutionContexts, "PASS");
assert.equal(report.regression.otherSuspiciousGlyphsRemainDetected, "PASS");
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);

assert(production.papers.some((paper) => paper.id === "9618-2024-ON-12-QP"));
assert(production.papers.some((paper) => paper.id === "9618-2024-ON-12-MS"));
assert(production.pairings.some((pairing) => pairing.pairingKey === "9618-2024-ON-12"));
