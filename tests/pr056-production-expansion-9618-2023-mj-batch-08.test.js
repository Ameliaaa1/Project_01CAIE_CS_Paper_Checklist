const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr056-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = [{
  component: "11",
  qpStagingPath: path.join(stagingDir, "9618_s23_qp_11.staging.json"),
  msStagingPath: path.join(stagingDir, "9618_s23_ms_11.staging.json")
}];
const expectedFileHashes = {
  "9618-2023-MJ-11-QP": "547b5fef50d13125e25642bef9a06c8e96b63e27a742b045043543a87b3c0843",
  "9618-2023-MJ-11-MS": "9955c377d09a08b7def28b097d0f1a2247d7097b30d59b525eaf73805055898c"
};
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2023-MJ-11-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR056-9618-2023-MJ-BATCH-08",
    syllabus: "9618",
    year: 2023,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 2,
    questionDelta: 34,
    responseAreaDelta: 127,
    markEntryDelta: 30,
    pairingDelta: 1
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 6, leafQuestionCount: 29, responseAreaCount: 127, markSchemeEntryCount: 30 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  verifyPublishedScope(readProductionStore(storePath));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR056-9618-2023-MJ-BATCH-08")) {
  verifyPublishedScope(production);
}

function verifyPublishedScope(store) {
  assert.deepEqual(store.papers.filter((paper) => expectedFileHashes[paper.id]).map((paper) => paper.id), ["9618-2023-MJ-11-QP", "9618-2023-MJ-11-MS"]);
  for (const [paperId, fileHash] of Object.entries(expectedFileHashes)) {
    assert.equal(store.papers.find((paper) => paper.id === paperId)?.fileHash, fileHash, `${paperId} must use the validated staging source.`);
  }
  for (const pairingKey of blockedPairingKeys) {
    assert(!store.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
