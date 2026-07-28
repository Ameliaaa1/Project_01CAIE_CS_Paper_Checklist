const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase3-9618-missing-staging-expansion-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const store = readProductionStore(path.join(rootDir, "output", "production", "production-store.json"));
const phase5Path = path.join(rootDir, "output", "production-expansion", "phase5-9618-blocked-pair-investigation-report.json");
const phase5Resolved = fs.existsSync(phase5Path)
  ? new Set(JSON.parse(fs.readFileSync(phase5Path, "utf8")).resolvedPairs || [])
  : new Set();

assert.equal(report.generatedFor, "Phase-3-9618-Missing-Staging-Expansion-by-Batch-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.phaseId, "Phase 3");
assert.equal(report.scope.initialMissingStagingPairCount, 92);
assert.equal(report.scope.batchCount, 9);
assert.equal(report.scope.pairingKeys.length, 92);
assert.equal(new Set(report.scope.pairingKeys).size, 92);
assert.equal(report.batches.length, 9);
assert(report.batches.every((batch) => batch.status === "PASS"));
assert.deepEqual(report.batches.map((batch) => batch.scope.pairCount), [1, 11, 12, 11, 12, 12, 11, 11, 11]);
assert.equal(report.classifications.length, 92);
assert.equal(report.totals.processedPairs, 92);
assert.equal(report.totals.stagingArtifactsAdded, 184);
assert.equal(report.totals.strictEligiblePairs + report.totals.blockedPairs + report.totals.needsInvestigationPairs, 92);
assert.equal(report.totals.publishedPairs, report.totals.strictEligiblePairs);
assert.equal(report.coverageBefore.missingStagingPairs, 92);
assert.equal(report.coverageAfter.missingStagingPairs, 0);
assert.equal(report.coverageAfter.stagingPairs, 118);
assert.equal(report.coverageAfter.eligibleUnpublishedPairs, 0);
assert.equal(report.coverageAfter.partialProductionConflicts, 0);
assert.equal(report.integrity.sourceAssets.unchanged, true);
assert.equal(report.integrity.parser.unchanged, true);
assert.equal(report.integrity.canonical.unchanged, true);
assert.equal(report.integrity.existingProductionRecordsPreservedAcrossBatches, true);
assert.equal(report.integrity.unrelatedStagingPreservedAcrossBatches, true);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(report.next.phaseId, "Phase 4");

for (const pairingKey of report.strictEligiblePairs) {
  assert(store.papers.some((paper) => paper.id === `${pairingKey}-QP`));
  assert(store.papers.some((paper) => paper.id === `${pairingKey}-MS`));
  assert(store.pairings.some((pairing) => pairing.pairingKey === pairingKey));
}
for (const pair of [...report.blockedPairs, ...report.needsInvestigationPairs]) {
  assert(pair.blockers.length > 0);
  assert(pair.issueCodes.length > 0);
  assert(pair.failedChecks.length > 0);
  assert(pair.rootCauseCategory);
  if (phase5Resolved.has(pair.pairingKey)) {
    assert(store.pairings.some((pairing) => pairing.pairingKey === pair.pairingKey));
  } else {
    assert(!store.pairings.some((pairing) => pairing.pairingKey === pair.pairingKey));
  }
}
