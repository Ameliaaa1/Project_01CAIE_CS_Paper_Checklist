const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr037-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["22", "23"].map((component) => ({
  component,
  qpStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s20_qp_${component}.staging.json`),
  msStagingPath: path.join(rootDir, "output", "phase2", "staging", `0478_s20_ms_${component}.staging.json`)
}));

if (!before.papers.some((paper) => paper.id === "0478-2020-MJ-22-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR037-0478-2020-MJ-BATCH-03",
    syllabus: "0478",
    year: 2020,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 35,
    responseAreaDelta: 297,
    markEntryDelta: 12,
    pairingDelta: 2
  });
  assert(report.pairs.every((pair) => pair.verification.status === "PASS"));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches.some((batch) => batch.id === "PR037-0478-2020-MJ-BATCH-03")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "0478" && paper.year === 2020 && paper.session === "M/J" && ["22", "23"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["0478-2020-MJ-22-MS", "0478-2020-MJ-22-QP", "0478-2020-MJ-23-MS", "0478-2020-MJ-23-QP"]
  );
}
