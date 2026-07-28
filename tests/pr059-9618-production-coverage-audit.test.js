const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const productionHashBefore = sha256(storePath);
const report = JSON.parse(fs.readFileSync(path.join(rootDir, "output", "production-expansion", "pr059-9618-production-coverage-audit-report.json"), "utf8"));

assert.equal(report.generatedFor, "PR-059-9618-Production-Coverage-Audit-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.deepEqual(report.scope, { syllabus: "9618", operation: "Coverage Audit" });
assert.deepEqual(report.coverage, {
  sourcePairs: 118,
  completeSourcePairs: 117,
  stagingPairs: 25,
  stagingPartialPairs: 0,
  stagingMissingPairs: 93,
  publishedPairs: 16,
  eligibleUnpublishedPairs: 0,
  missingStagingPairs: 92,
  blockedPairs: 9,
  incompleteSourcePairs: 1,
  partialProductionConflicts: 0,
  unpublishedPairs: 102
});
assert.equal(report.inventory.totalPdfFiles, 266);
assert.equal(report.inventory.totalQpPdfs, 118);
assert.equal(report.inventory.totalMsPdfs, 118);
assert.equal(report.inventory.otherPdfCount, 30);
assert.equal(report.sourcePairCompleteness.complete.length, 117);
assert.deepEqual(report.sourcePairCompleteness.incomplete, ["9618-2022-MJ-41"]);
assert.equal(report.stagingCoverage.complete.length, 25);
assert.equal(report.stagingCoverage.partial.length, 0);
assert.equal(report.stagingCoverage.missing.length, 93);
assert.equal(report.publishedPairs.length, 16);
assert.equal(report.eligibleUnpublishedPairs.length, 0);
assert.deepEqual(report.blockedPairs.map((pair) => pair.pairingKey), [
  "9618-2021-MJ-11",
  "9618-2021-MJ-13",
  "9618-2021-MJ-21",
  "9618-2021-MJ-23",
  "9618-2021-MJ-31",
  "9618-2021-MJ-32",
  "9618-2021-MJ-33",
  "9618-2021-ON-22",
  "9618-2024-ON-12"
]);
assert(report.blockedPairs.every((pair) => pair.blockers.length > 0 && pair.qpStatus && pair.msStatus && pair.severityCounts));
assert.deepEqual(report.incompleteSourcePairs, [{
  pairingKey: "9618-2022-MJ-41",
  year: 2022,
  session: "M/J",
  component: "41",
  missingQp: false,
  missingMs: true,
  orphanQp: [path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_qp_41.pdf")],
  orphanMs: [],
  stagingStatus: "STAGING_MISSING"
}]);
assert.equal(report.missingStagingPairs.length, 92);
assert.equal(report.missingStagingClassification.incompleteSourceAndNoStaging.length, 1);
assert.equal(report.missingStagingClassification.blockedStaging.length, 9);
assert.deepEqual(report.duplicateSources.map((entry) => [entry.pairingKey, entry.duplicateCount]), [["9618-2021-ON-41", 1]]);
assert.equal(report.partialProductionConflicts.length, 0);
assert.deepEqual(report.productionVerification, {
  status: "PASS",
  publishedPairCount: 16,
  duplicatePaperIds: [],
  duplicatePairingKeys: [],
  brokenPublishedPairs: []
});
assert.equal(report.classificationSummary.records.length, 118);
assert.equal(report.classificationSummary.everyPairHasSinglePrimaryClassification, true);
assert.deepEqual(report.classificationSummary.counts, {
  PUBLISHED: 16,
  ELIGIBLE_UNPUBLISHED: 0,
  BLOCKED: 9,
  INCOMPLETE_SOURCE: 1,
  MISSING_STAGING: 92,
  PARTIAL_PRODUCTION_CONFLICT: 0,
  DUPLICATE_SOURCE: 1
});
assert.equal(report.classificationSummary.records.find((record) => record.pairingKey === "9618-2021-ON-41").secondaryFlags.includes("DUPLICATE_SOURCE"), true);
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert.equal(report.auditPrinciples.productionWrite, false);
assert.equal(report.auditPrinciples.parserModified, false);
assert.equal(report.auditPrinciples.stagingMutated, false);
assert.equal(report.auditPrinciples.assetsMutated, false);
assert.equal(report.strictEligibleProductionExpansion, "COMPLETE");
assert.equal(report.coverageBaseline, "ESTABLISHED");
assert.equal(report.remainingWork, "CLASSIFIED");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(sha256(storePath), productionHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
