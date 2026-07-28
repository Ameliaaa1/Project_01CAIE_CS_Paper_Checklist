const assert = require("node:assert/strict");
const path = require("node:path");
const { prepareSyllabusExpansion, selectRecommendedBatch } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pair = {
  syllabus: "9618",
  year: 2021,
  session: "M/J",
  sessionCode: "MJ",
  component: "12",
  pairingKey: "9618-2021-MJ-12"
};

assert.equal(selectRecommendedBatch([pair], [], []).productionWrite, true);
assert.equal(selectRecommendedBatch([pair], [], [], Array(13).fill(pair), 7).batchId, "PR056-9618-2021-MJ-BATCH-08");
assert.deepEqual(selectRecommendedBatch([], [pair], []), {
  decision: "9618 Missing Staging Generation Batch 01",
  pairCount: 0,
  pairingKeys: [],
  productionWrite: false
});
assert.deepEqual(selectRecommendedBatch([], [], [pair]), {
  decision: "Issue Resolution PR",
  pairCount: 0,
  pairingKeys: [],
  productionWrite: false
});
assert.deepEqual(selectRecommendedBatch([], [], []), {
  decision: "STOP_NO_USABLE_SOURCE_PAIRS",
  pairCount: 0,
  pairingKeys: [],
  productionWrite: false
});

const report = prepareSyllabusExpansion({
  syllabus: "9618",
  generatedFor: "PR-048-9618-Production-Expansion-Preparation-Plan",
  pdfRoot: path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  stagingDir: path.join(rootDir, "output", "phase2", "staging"),
  storePath: path.join(rootDir, "output", "production", "production-store.json")
});

assert.equal(report.productionWrite, false);
assert.equal(report.recommendedNextBatch.productionWrite, false);
assert.equal(report.recommendedNextBatch.decision, "STOP_NO_USABLE_SOURCE_PAIRS");
assert.deepEqual(report.recommendedNextBatch.pairingKeys, []);
assert.equal(report.productionIntegrity.unchanged, true);
assert.deepEqual(new Set(Object.values(report.productionIntegrity.deltas)), new Set([0]));
