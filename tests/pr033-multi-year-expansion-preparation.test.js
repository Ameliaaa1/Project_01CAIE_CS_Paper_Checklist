const assert = require("node:assert/strict");
const path = require("node:path");
const { prepareMultiYearExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const report = prepareMultiYearExpansion({
  pdfRoot: path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478"),
  stagingDir: path.join(rootDir, "output", "phase2", "staging"),
  storePath: path.join(rootDir, "output", "production", "production-store.json")
});

assert.equal(report.productionWrite, false);
assert.deepEqual(report.summary, {
  expectedPairs: 24,
  availablePairs: 24,
  stagingPairs: 24,
  eligiblePairs: 0,
  alreadyPublishedPairs: 24,
  blockedPairs: 0,
  missingStagingPairs: 0
});
assert.equal(report.coverageMatrix.length, 24);
assert.deepEqual(report.expansionCandidates.map((entry) => entry.pairingKey), []);
assert(report.expansionCandidates.every((entry) => entry.qp.validationStatus === "PASS" && entry.ms.validationStatus === "PASS"));
assert(report.expansionCandidates.every((entry) => Object.values(entry.qp.completenessChecks).every((status) => status === "PASS")));
assert.deepEqual(report.recommendedBatch, {
  batchId: null,
  rationale: "No eligible unpublished candidates.",
  year: null,
  components: [],
  pairCount: 0,
  pairingKeys: [],
  productionWrite: false
});
assert.equal(report.missingArtifacts.filter((entry) => entry.year === 2021).length, 0);
assert.equal(report.missingArtifacts.filter((entry) => entry.year === 2022).length, 0);
