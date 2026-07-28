const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr054-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["32", "41"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `9618_w21_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `9618_w21_ms_${component}.staging.json`)
}));
const expectedFileHashes = {
  "9618-2021-ON-32-QP": "62e4197f425687a37eaaa42b4c3b352d4f7283487926daae63db22eb562c44eb",
  "9618-2021-ON-32-MS": "9693adc317c301d898d7d894fd45586bf5f92d18b630bc77221fbe34de6c0fb5",
  "9618-2021-ON-41-QP": "cdcc1cc5e36b3a597824c7410e77ba2d91a2619f8e51968fa9966dd85c7a8b8f",
  "9618-2021-ON-41-MS": "f95f8e857df8a51e9fffe6f9011ac74ce446eb243084580db30b8deff0ea37ec"
};
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2021-ON-32-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR054-9618-2021-ON-BATCH-06",
    syllabus: "9618",
    year: 2021,
    session: "O/N",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 62,
    responseAreaDelta: 148,
    markEntryDelta: 61,
    pairingDelta: 2
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 10, leafQuestionCount: 30, responseAreaCount: 127, markSchemeEntryCount: 28 },
    { paperCount: 2, questionCount: 3, leafQuestionCount: 20, responseAreaCount: 21, markSchemeEntryCount: 33 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  verifyPublishedScope(readProductionStore(storePath));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR054-9618-2021-ON-BATCH-06")) {
  verifyPublishedScope(production);
}

function verifyPublishedScope(store) {
  assert.deepEqual(store.papers.filter((paper) => expectedFileHashes[paper.id]).map((paper) => paper.id), [
    "9618-2021-ON-32-QP",
    "9618-2021-ON-32-MS",
    "9618-2021-ON-41-QP",
    "9618-2021-ON-41-MS"
  ]);
  for (const [paperId, fileHash] of Object.entries(expectedFileHashes)) {
    assert.equal(store.papers.find((paper) => paper.id === paperId)?.fileHash, fileHash, `${paperId} must use the validated staging source.`);
  }
  for (const pairingKey of blockedPairingKeys) {
    assert(!store.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
