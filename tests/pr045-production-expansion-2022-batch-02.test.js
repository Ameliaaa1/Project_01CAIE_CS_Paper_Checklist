const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const currentStore = path.join(rootDir, "output", "production", "production-store.json");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr045-"));
const storePath = path.join(tempDir, "production-store.json");
fs.copyFileSync(currentStore, storePath);
const before = readProductionStore(storePath);
const pairs = ["13", "21"].map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `0478_s22_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `0478_s22_ms_${component}.staging.json`)
}));

const qp13 = JSON.parse(fs.readFileSync(pairs[0].qpStagingPath, "utf8"));
const q8 = qp13.questions.find((question) => question.id === "0478-2022-MJ-13-Q8");
assert(q8);
assert.equal(q8.response_area_status, "PRESENT");
assert.equal(q8.response_areas_json.length, 6);
assert.equal(q8.raw_json.aggregationDebug.mergedDuplicateQuestionRecord, true);
assert.equal(q8.raw_json.aggregationDebug.sourceCount, 2);
assert(!qp13.validation.issues.some((issue) => issue.code === "MISSING_RESPONSE_AREAS"));

if (!before.papers.some((paper) => paper.id === "0478-2022-MJ-13-QP")) {
  const report = publishProductionExpansion({
    rootDir,
    storePath,
    batchId: "PR045-0478-2022-MJ-BATCH-02",
    syllabus: "0478",
    year: 2022,
    session: "M/J",
    pairs
  });
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.verification, {
    paperDelta: 4,
    questionDelta: 49,
    responseAreaDelta: 226,
    markEntryDelta: 16,
    pairingDelta: 2
  });
  assert(report.pairs.every((pair) => pair.verification.status === "PASS"));
  assert(report.pairs.every((pair) => Object.values(pair.frontendVerification).every((status) => status === "PASS")));
}

const production = readProductionStore(currentStore);
if (production.expansionBatches.some((batch) => batch.id === "PR045-0478-2022-MJ-BATCH-02")) {
  assert.deepEqual(
    production.papers.filter((paper) => paper.syllabus === "0478" && paper.year === 2022 && paper.session === "M/J" && ["13", "21"].includes(paper.component)).map((paper) => paper.id).sort(),
    ["0478-2022-MJ-13-MS", "0478-2022-MJ-13-QP", "0478-2022-MJ-21-MS", "0478-2022-MJ-21-QP"]
  );
}
