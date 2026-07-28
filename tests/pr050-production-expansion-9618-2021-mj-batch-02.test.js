const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr050-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["41", "42"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `9618_s21_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `9618_s21_ms_${component}.staging.json`)
}));
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2021-MJ-41-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR050-9618-2021-MJ-BATCH-02",
    syllabus: "9618",
    year: 2021,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 44,
    responseAreaDelta: 38,
    markEntryDelta: 20,
    pairingDelta: 2
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 3, leafQuestionCount: 19, responseAreaCount: 19, markSchemeEntryCount: 10 },
    { paperCount: 2, questionCount: 3, leafQuestionCount: 19, responseAreaCount: 19, markSchemeEntryCount: 10 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  const after = readProductionStore(storePath);
  assert.deepEqual(after.papers.slice(-4).map((paper) => paper.id), [
    "9618-2021-MJ-41-QP",
    "9618-2021-MJ-41-MS",
    "9618-2021-MJ-42-QP",
    "9618-2021-MJ-42-MS"
  ]);
  for (const pairingKey of blockedPairingKeys) {
    assert(!after.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR050-9618-2021-MJ-BATCH-02")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "9618" && paper.year === 2021 && ["41", "42"].includes(paper.component) && paper.session === "M/J").map((paper) => paper.id).sort(),
    ["9618-2021-MJ-41-MS", "9618-2021-MJ-41-QP", "9618-2021-MJ-42-MS", "9618-2021-MJ-42-QP"]
  );
  for (const pairingKey of blockedPairingKeys) {
    assert(!production.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
