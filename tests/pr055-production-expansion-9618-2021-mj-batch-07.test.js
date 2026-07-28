const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr055-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = [{
  component: "43",
  qpStagingPath: path.join(stagingDir, "9618_s21_qp_43.staging.json"),
  msStagingPath: path.join(stagingDir, "9618_s21_ms_43.staging.json")
}];
const expectedFileHashes = {
  "9618-2021-MJ-43-QP": "3b6d4cba62aed1aef8ba6ad69c8bf90f31be5a760c1d9af53c9866c61ff7a9a3",
  "9618-2021-MJ-43-MS": "fbc3be2699a9a33a4241cf35c3f69fa921b064206dfe4ad3be2d1d0e5cc3fd0a"
};
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2021-MJ-43-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR055-9618-2021-MJ-BATCH-07",
    syllabus: "9618",
    year: 2021,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 2,
    questionDelta: 22,
    responseAreaDelta: 19,
    markEntryDelta: 10,
    pairingDelta: 1
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 3, leafQuestionCount: 19, responseAreaCount: 19, markSchemeEntryCount: 10 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  verifyPublishedScope(readProductionStore(storePath));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR055-9618-2021-MJ-BATCH-07")) {
  verifyPublishedScope(production);
}

function verifyPublishedScope(store) {
  assert.deepEqual(store.papers.filter((paper) => expectedFileHashes[paper.id]).map((paper) => paper.id), ["9618-2021-MJ-43-QP", "9618-2021-MJ-43-MS"]);
  for (const [paperId, fileHash] of Object.entries(expectedFileHashes)) {
    assert.equal(store.papers.find((paper) => paper.id === paperId)?.fileHash, fileHash, `${paperId} must use the validated staging source.`);
  }
  for (const pairingKey of blockedPairingKeys) {
    assert(!store.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
