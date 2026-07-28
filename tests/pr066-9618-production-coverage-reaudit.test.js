const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr066-9618-production-coverage-reaudit-report.json");
const productionHashBefore = sha256(storePath);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "PR-066-9618-Production-Coverage-Re-Audit-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.auditOnly, true);
assert.deepEqual(report.scope, { syllabus: "9618", operation: "Production Coverage Re-Audit" });
assert.deepEqual(report.inventorySummary, {
  totalPdfFiles: 266,
  totalQpPdfs: 118,
  totalMsPdfs: 118,
  otherPdfCount: 30,
  sourcePairs: 118,
  completeSourcePairs: 117,
  incompleteSourcePairs: 1
});
assert.equal(report.sourcePairCompleteness.complete.length, 117);
assert.deepEqual(report.sourcePairCompleteness.incomplete, ["9618-2022-MJ-41"]);
assert.equal(report.stagingCoverage.complete.length, 25);
assert.equal(report.stagingCoverage.partial.length, 0);
assert.equal(report.stagingCoverage.missing.length, 93);
assert.deepEqual(report.productionCoverage, {
  publishedPairs: 25,
  eligibleUnpublishedPairs: 0,
  blockedPairs: 0,
  partialProductionConflicts: 0
});
assert.equal(report.publishedPairs.length, 25);
assert.equal(report.eligibleUnpublishedPairs.length, 0);
assert.equal(report.blockedPairs.length, 0);
assert.equal(report.partialProductionConflicts.length, 0);
assert.equal(report.missingStagingPairs.length, 92);
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
assert.deepEqual(report.duplicateSources.map((entry) => [entry.pairingKey, entry.duplicateCount]), [["9618-2021-ON-41", 1]]);
assert.deepEqual(report.productionState, {
  expected: {
    papers: 98,
    questionRecords: 1448,
    topLevelQuestions: 375,
    leafQuestions: 1139,
    responseAreas: 5610,
    markSchemeEntries: 863,
    pairings: 49,
    batches: 49,
    expansionBatches: 23
  },
  actual: {
    papers: 98,
    questionRecords: 1448,
    topLevelQuestions: 375,
    leafQuestions: 1139,
    responseAreas: 5610,
    markSchemeEntries: 863,
    pairings: 49,
    batches: 49,
    expansionBatches: 23
  },
  matches: true
});
assert.equal(report.publishedPairVerification.status, "PASS");
assert.equal(report.publishedPairVerification.publishedPairCount, 25);
assert.equal(report.publishedPairVerification.verifiedPairCount, 25);
assert.equal(report.publishedPairVerification.pairs.length, 25);
assert(report.publishedPairVerification.pairs.every((pair) => pair.paperCount === 2 && pair.pairingLinked && pair.sourceTraceAvailable));
for (const key of ["duplicatePaperIds", "duplicatePairingKeys", "brokenPublishedPairs", "missingSourceTracePairs", "orphanProductionPapers"]) {
  assert.deepEqual(report.publishedPairVerification.anomalies[key], []);
}
assert.equal(report.frontendCoverageVerification.status, "PASS");
assert.equal(report.frontendCoverageVerification.fullCoverageVerification, true);
assert.equal(report.frontendCoverageVerification.pairCount, 25);
assert.equal(report.frontendCoverageVerification.pairs.length, 25);
assert(Object.values(report.frontendCoverageVerification.checks).every((status) => status === "PASS"));
assert(report.frontendCoverageVerification.pairs.every((pair) => Object.values(pair.checks).every((status) => status === "PASS")));
assert.equal(report.classificationSummary.records.length, 118);
assert.equal(report.classificationSummary.everyPairHasSinglePrimaryClassification, true);
assert.deepEqual(report.classificationSummary.counts, {
  PUBLISHED: 25,
  ELIGIBLE_UNPUBLISHED: 0,
  BLOCKED: 0,
  INCOMPLETE_SOURCE: 1,
  MISSING_STAGING: 92,
  PARTIAL_PRODUCTION_CONFLICT: 0,
  DUPLICATE_SOURCE: 1
});
assert(report.classificationSummary.records.find((record) => record.pairingKey === "9618-2021-ON-41").secondaryFlags.includes("DUPLICATE_SOURCE"));
assert(report.classificationSummary.records.find((record) => record.pairingKey === "9618-2022-MJ-41").secondaryFlags.includes("MISSING_STAGING"));
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert.equal(report.strictEligibleProductionExpansion, "COMPLETE");
assert.equal(report.previouslyBlockedExpansion, "COMPLETE");
assert.equal(report.coverageBaseline, "ESTABLISHED");
assert.equal(report.remainingWork, "CLASSIFIED");
assert.deepEqual(report.next, {
  proposedPr: "PR-067",
  decision: "9618 Incomplete Source Investigation",
  pairingKeys: ["9618-2022-MJ-41"],
  productionWrite: false,
  auditOnly: true
});
assert.equal(report.regression.pr030ThroughPr065, "PASS");
for (let pr = 30; pr <= 65; pr += 1) assert.equal(report.regression[`pr${String(pr).padStart(3, "0")}`], "PASS");
assert.equal(report.regression.legalMultiplicationResolutionContexts, "PASS");
assert.equal(report.regression.otherSuspiciousGlyphsRemainDetected, "PASS");
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(sha256(storePath), productionHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
