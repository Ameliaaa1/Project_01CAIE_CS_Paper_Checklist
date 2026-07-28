const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr047-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["22", "23"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `0478_s22_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `0478_s22_ms_${component}.staging.json`)
}));

const qp23 = JSON.parse(fs.readFileSync(pairs[1].qpStagingPath, "utf8"));
assert.deepEqual(
  qp23.run.summary_json.questionAggregationDiagnostics.map((entry) => entry.questionId),
  ["0478-2022-MJ-23-Q2", "0478-2022-MJ-23-Q3", "0478-2022-MJ-23-Q5"]
);

const qp13 = JSON.parse(fs.readFileSync(path.join(stagingDir, "0478_s22_qp_13.staging.json"), "utf8"));
const q8 = qp13.questions.find((question) => question.id === "0478-2022-MJ-13-Q8");
assert.equal(q8.response_area_status, "PRESENT");
assert.equal(q8.response_areas_json.length, 6);
assert(!qp13.validation.issues.some((issue) => issue.code === "MISSING_RESPONSE_AREAS"));

if (!before.papers.some((paper) => paper.id === "0478-2022-MJ-22-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR047-0478-2022-MJ-BATCH-03",
    syllabus: "0478",
    year: 2022,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 37,
    responseAreaDelta: 227,
    markEntryDelta: 13,
    pairingDelta: 2
  });
  assert(report.pairs.every((pair) => pair.verification.status === "PASS"));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches.some((batch) => batch.id === "PR047-0478-2022-MJ-BATCH-03")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "0478" && paper.year === 2022 && paper.session === "M/J" && ["22", "23"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["0478-2022-MJ-22-MS", "0478-2022-MJ-22-QP", "0478-2022-MJ-23-MS", "0478-2022-MJ-23-QP"]
  );
}
