const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr034-"));
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["11", "12"].map((component) => ({
  component,
  qpStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s21_qp_${component}.staging.json`),
  msStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s21_ms_${component}.staging.json`)
}));

if (!before.papers.some((paper) => paper.id === "0478-2021-MJ-11-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR034-0478-2021-MJ-BATCH-01",
    syllabus: "0478",
    year: 2021,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 57,
    responseAreaDelta: 187,
    markEntryDelta: 44,
    pairingDelta: 2
  });
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
}

const production = readProductionStore(currentStore);
assert(production.expansionBatches.some((batch) => batch.id === "PR034-0478-2021-MJ-BATCH-01"));
assert.deepEqual(
  production.papers.filter((paper) => paper.syllabus === "0478" && paper.year === 2021 && paper.session === "M/J" && ["11", "12"].includes(paper.component)).map((paper) => paper.id).sort(),
  ["0478-2021-MJ-11-MS", "0478-2021-MJ-11-QP", "0478-2021-MJ-12-MS", "0478-2021-MJ-12-QP"]
);
