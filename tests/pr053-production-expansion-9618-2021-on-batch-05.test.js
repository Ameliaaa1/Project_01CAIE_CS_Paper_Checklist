const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr053-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["23", "31"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `9618_w21_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `9618_w21_ms_${component}.staging.json`)
}));
const blockedPairingKeys = [];

if (!before.papers.some((paper) => paper.id === "9618-2021-ON-23-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR053-9618-2021-ON-BATCH-05",
    syllabus: "9618",
    year: 2021,
    session: "O/N",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 66,
    responseAreaDelta: 279,
    markEntryDelta: 50,
    pairingDelta: 2
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 6, leafQuestionCount: 21, responseAreaCount: 152, markSchemeEntryCount: 22 },
    { paperCount: 2, questionCount: 10, leafQuestionCount: 30, responseAreaCount: 127, markSchemeEntryCount: 28 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  const after = readProductionStore(storePath);
  assert.deepEqual(after.papers.slice(-4).map((paper) => paper.id), [
    "9618-2021-ON-23-QP",
    "9618-2021-ON-23-MS",
    "9618-2021-ON-31-QP",
    "9618-2021-ON-31-MS"
  ]);
  for (const pairingKey of blockedPairingKeys) {
    assert(!after.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR053-9618-2021-ON-BATCH-05")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "9618" && paper.year === 2021 && paper.session === "O/N" && ["23", "31"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["9618-2021-ON-23-MS", "9618-2021-ON-23-QP", "9618-2021-ON-31-MS", "9618-2021-ON-31-QP"]
  );
  for (const pairingKey of blockedPairingKeys) {
    assert(!production.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)), `${pairingKey} must remain unpublished.`);
  }
}
