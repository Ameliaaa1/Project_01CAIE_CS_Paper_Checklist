const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr049-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["12", "22"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `9618_s21_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `9618_s21_ms_${component}.staging.json`)
}));

if (!before.papers.some((paper) => paper.id === "9618-2021-MJ-12-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR049-9618-2021-MJ-BATCH-01",
    syllabus: "9618",
    year: 2021,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 64,
    responseAreaDelta: 247,
    markEntryDelta: 48,
    pairingDelta: 2
  });
  assert.deepEqual(report.pairs.map((pair) => pair.verification.counts), [
    { paperCount: 2, questionCount: 8, leafQuestionCount: 28, responseAreaCount: 98, markSchemeEntryCount: 26 },
    { paperCount: 2, questionCount: 8, leafQuestionCount: 22, responseAreaCount: 149, markSchemeEntryCount: 22 }
  ]);
  assert(report.pairs.every((pair) => pair.verification.sourceTraceAvailable && pair.verification.pairingLinked));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
  const after = readProductionStore(storePath);
  assert.deepEqual(after.papers.slice(-4).map((paper) => paper.id), [
    "9618-2021-MJ-12-QP",
    "9618-2021-MJ-12-MS",
    "9618-2021-MJ-22-QP",
    "9618-2021-MJ-22-MS"
  ]);
  assert(!after.papers.some((paper) => paper.id.startsWith("9618-2021-MJ-11-")));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches?.some((batch) => batch.id === "PR049-9618-2021-MJ-BATCH-01")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "9618" && paper.year === 2021 && paper.session === "M/J" && ["12", "22"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["9618-2021-MJ-12-MS", "9618-2021-MJ-12-QP", "9618-2021-MJ-22-MS", "9618-2021-MJ-22-QP"]
  );
}
