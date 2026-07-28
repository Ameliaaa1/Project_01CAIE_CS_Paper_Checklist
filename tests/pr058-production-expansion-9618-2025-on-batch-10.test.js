const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr058-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = [{
  component: "42",
  qpStagingPath: path.join(stagingDir, "9618_w25_qp_42.staging.json"),
  msStagingPath: path.join(stagingDir, "9618_w25_ms_42.staging.json")
}];
const expectedFileHashes = {
  "9618-2025-ON-42-QP": "42bae8891b7d9269f16fbf6630828b760ac1c585230e99040c88019d95f60a66",
  "9618-2025-ON-42-MS": "5bfdaabc0844334ff8b1109a3347e1b26b7ba632e43f2de31b6afec2f148d2ab"
};
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2025-ON-42-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR058-9618-2025-ON-BATCH-10",
    syllabus: "9618",
    year: 2025,
    session: "O/N",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 2,
    questionDelta: 24,
    responseAreaDelta: 21,
    markEntryDelta: 37,
    pairingDelta: 1
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 3, leafQuestionCount: 21, responseAreaCount: 21, markSchemeEntryCount: 37 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  const published = readProductionStore(storePath);
  assert.equal(published.papers.length, before.papers.length + 2);
  assert.equal(published.questions.length, before.questions.length + 24);
  assert.equal(published.responseAreas.length, before.responseAreas.length + 21);
  assert.equal(published.markSchemeEntries.length, before.markSchemeEntries.length + 37);
  assert.equal(published.pairings.length, before.pairings.length + 1);
  verifyPublishedScope(published);
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR058-9618-2025-ON-BATCH-10")) {
  verifyPublishedScope(production);
}

function verifyPublishedScope(store) {
  assert.deepEqual(store.papers.filter((paper) => expectedFileHashes[paper.id]).map((paper) => paper.id), ["9618-2025-ON-42-QP", "9618-2025-ON-42-MS"]);
  for (const [paperId, fileHash] of Object.entries(expectedFileHashes)) {
    assert.equal(store.papers.find((paper) => paper.id === paperId)?.fileHash, fileHash, `${paperId} must use the validated staging source.`);
  }
  for (const pairingKey of blockedPairingKeys) {
    assert(!store.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
