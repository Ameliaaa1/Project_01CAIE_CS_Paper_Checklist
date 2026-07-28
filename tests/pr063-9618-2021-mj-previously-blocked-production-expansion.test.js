const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr063-9618-2021-mj-previously-blocked-production-expansion-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const production = readProductionStore(storePath);
const pairingKeys = [
  "9618-2021-MJ-11",
  "9618-2021-MJ-13",
  "9618-2021-MJ-21",
  "9618-2021-MJ-23",
  "9618-2021-MJ-31",
  "9618-2021-MJ-32",
  "9618-2021-MJ-33"
];

assert.equal(report.generatedFor, "PR-063-9618-2021-MJ-Previously-Blocked-Pair-Production-Expansion-Plan");
assert.equal(report.batchId, "PR063-9618-2021-MJ-PREVIOUSLY-BLOCKED");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, true);
assert.equal(report.previouslyBlocked, true);
assert.deepEqual(report.resolvedBy, ["PR-061", "PR-062"]);
assert.deepEqual(report.scope.components, ["11", "13", "21", "23", "31", "32", "33"]);
assert.equal(report.preflight.length, 7);
assert(report.preflight.every((pair) => pair.status === "PASS"));
assert(report.preflight.every((pair) => [pair.qp, pair.ms].every((role) => role.validationStatus === "PASS"
  && role.completenessStatus === "PASS"
  && role.canonicalPublishable === true
  && role.publishStatus === "READY_TO_PUBLISH"
  && role.severityCounts.P0 === 0
  && role.severityCounts.P1 === 0)));
assert.equal(report.alreadyPublished, false);
assert.equal(report.partialProductionConflict, false);
assert.deepEqual(report.expectedDeltas, {
  papers: 14,
  questionRecords: 234,
  topLevelQuestions: 57,
  leafQuestions: 184,
  responseAreas: 950,
  markSchemeEntries: 189,
  pairings: 7,
  batches: 7,
  expansionBatches: 1
});
assert.deepEqual(report.publication.actualDeltas, report.expectedDeltas);
assert.equal(report.pairVerification.length, 7);
assert(report.pairVerification.every((pair) => pair.status === "PASS"));
assert(report.pairVerification.every((pair) => pair.verification.counts.paperCount === 2));
assert(report.pairVerification.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
assert(report.pairVerification.every((pair) => JSON.stringify(pair.verification.counts) === JSON.stringify(pair.verification.expectedCounts)));
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
  publishedPairs: 23,
  eligibleUnpublishedPairs: 2,
  missingStagingPairs: 92,
  blockedPairs: 0,
  incompleteSourcePairs: 1,
  partialProductionConflicts: 0
});
assert.deepEqual(report.next.pairingKeys, ["9618-2021-ON-22"]);
assert.equal(report.next.proposedPr, "PR-064");
assert.equal(report.regression.legalMultiplicationResolutionContexts, "PASS");
assert.equal(report.regression.otherSuspiciousGlyphsRemainDetected, "PASS");
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);

for (const pairingKey of pairingKeys) {
  assert(production.papers.some((paper) => paper.id === `${pairingKey}-QP`));
  assert(production.papers.some((paper) => paper.id === `${pairingKey}-MS`));
  assert(production.pairings.some((pairing) => pairing.pairingKey === pairingKey));
}
