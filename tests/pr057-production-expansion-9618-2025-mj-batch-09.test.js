const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr057-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = [{
  component: "11",
  qpStagingPath: path.join(stagingDir, "9618_s25_qp_11.staging.json"),
  msStagingPath: path.join(stagingDir, "9618_s25_ms_11.staging.json")
}];
const expectedFileHashes = {
  "9618-2025-MJ-11-QP": "bdf74d4f15c620bde7e6fe65f17828bc85c89490ebb9a1a337e2cd0596f4b39a",
  "9618-2025-MJ-11-MS": "8bf543ddd26e74224f40fd909152e300b9b711eb3644d7e8d07c1d5c3f07521b"
};
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2025-MJ-11-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR057-9618-2025-MJ-BATCH-09",
    syllabus: "9618",
    year: 2025,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 2,
    questionDelta: 36,
    responseAreaDelta: 117,
    markEntryDelta: 28,
    pairingDelta: 1
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 8, leafQuestionCount: 28, responseAreaCount: 117, markSchemeEntryCount: 28 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  verifyPublishedScope(readProductionStore(storePath));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR057-9618-2025-MJ-BATCH-09")) {
  verifyPublishedScope(production);
}

function verifyPublishedScope(store) {
  assert.deepEqual(store.papers.filter((paper) => expectedFileHashes[paper.id]).map((paper) => paper.id), ["9618-2025-MJ-11-QP", "9618-2025-MJ-11-MS"]);
  for (const [paperId, fileHash] of Object.entries(expectedFileHashes)) {
    assert.equal(store.papers.find((paper) => paper.id === paperId)?.fileHash, fileHash, `${paperId} must use the validated staging source.`);
  }
  for (const pairingKey of blockedPairingKeys) {
    assert(!store.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
