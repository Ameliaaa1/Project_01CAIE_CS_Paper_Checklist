const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr041-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["22", "23"].map((component) => ({
  component,
  qpStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s21_qp_${component}.staging.json`),
  msStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s21_ms_${component}.staging.json`)
}));

if (!before.papers.some((paper) => paper.id === "0478-2021-MJ-22-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR041-0478-2021-MJ-BATCH-03",
    syllabus: "0478",
    year: 2021,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 37,
    responseAreaDelta: 292,
    markEntryDelta: 17,
    pairingDelta: 2
  });
  assert(report.pairs.every((pair) => pair.verification.status === "PASS"));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches.some((batch) => batch.id === "PR041-0478-2021-MJ-BATCH-03")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "0478" && paper.year === 2021 && paper.session === "M/J" && ["22", "23"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["0478-2021-MJ-22-MS", "0478-2021-MJ-22-QP", "0478-2021-MJ-23-MS", "0478-2021-MJ-23-QP"]
  );
}
