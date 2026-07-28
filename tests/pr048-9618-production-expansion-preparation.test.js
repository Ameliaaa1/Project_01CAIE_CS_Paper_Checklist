const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const hashBefore = sha256(storePath);
const report = prepareSyllabusExpansion({
  syllabus: "9618",
  generatedFor: "PR-048-9618-Production-Expansion-Preparation-Plan",
  pdfRoot: path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  stagingDir: path.join(rootDir, "output", "phase2", "staging"),
  storePath
});

assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.deepEqual(report.inventory.years, [2021, 2022, 2023, 2024, 2025]);
assert.deepEqual(report.inventory.sessions, ["M/J", "O/N"]);
assert.deepEqual(report.inventory.components, ["11", "12", "13", "21", "22", "23", "31", "32", "33", "41", "42", "43"]);
assert.equal(report.inventory.totalPdfFiles, 266);
assert.equal(report.inventory.totalQpPdfs, 118);
assert.equal(report.inventory.totalMsPdfs, 118);
assert.equal(report.inventory.otherPdfCount, 30);
assert(report.inventory.otherPdfFiles.every((file) => /_in_\d{2}\.pdf$/.test(file)));
assert.equal(report.inventory.totalPairs, 118);
assert.equal(report.inventory.completeSourcePairs, 118);
assert.deepEqual(report.inventory.missingMsFiles, []);
assert.deepEqual(report.inventory.duplicateSources, []);
assert.deepEqual(report.coverage, {
  sourcePairs: 118,
  completeSourcePairs: 118,
  stagingPairs: 118,
  stagingPartialPairs: 0,
  stagingMissingPairs: 0,
  publishedPairs: 118,
  eligibleUnpublishedPairs: 0,
  missingStagingPairs: 0,
  blockedPairs: 0,
  incompleteSourcePairs: 0,
  partialProductionConflicts: 0
});
assert(report.eligibleUnpublishedPairs.every((pair) => pair.publishEligibility === "YES"));
assert(report.eligibleUnpublishedPairs.every((pair) => pair.qp.severityCounts.P0 === 0 && pair.qp.severityCounts.P1 === 0 && pair.qp.severityCounts.P2 === 0));
assert.deepEqual(report.eligibleUnpublishedPairs, []);
assert.deepEqual(report.blockedPairs, []);
assert(report.blockedPairs.every((pair) => pair.blockers.length > 0));
assert.deepEqual(report.recommendedNextBatch, {
  decision: "STOP_NO_USABLE_SOURCE_PAIRS",
  pairCount: 0,
  pairingKeys: [],
  productionWrite: false
});
assert.equal(report.productionIntegrity.unchanged, true);
assert.deepEqual(new Set(Object.values(report.productionIntegrity.deltas)), new Set([0]));
assert.equal(sha256(storePath), hashBefore);
assert(!report.coverageMatrix.some((pair) => pair.syllabus === "9709"));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
