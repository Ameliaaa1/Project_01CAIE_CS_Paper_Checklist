const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  planProductionExpansion,
  productionMonitoringReport,
  publishProductionExpansion,
  readProductionStore,
  rollbackProductionExpansion
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const qpStagingPath = path.join(rootDir, "output", "phase2", "staging", "0478_s23_qp_12.staging.json");
const msStagingPath = path.join(rootDir, "output", "phase2", "staging", "0478_s23_ms_12.staging.json");
const pdfDir = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2023-May-June");

(() => {
  if (!fs.existsSync(qpStagingPath) || !fs.existsSync(msStagingPath)) {
    console.warn("Skipping PR-028 production expansion test because staging fixtures are not present.");
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr028-"));
  const storePath = path.join(tempDir, "production-store.json");
  const batchId = "PR028-0478-2023-MJ-TEST";
  const pair = { component: "12", qpStagingPath, msStagingPath };
  const report = publishProductionExpansion({ rootDir, storePath, batchId, syllabus: "0478", year: 2023, session: "M/J", pairs: [pair] });

  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.equal(report.verification.paperDelta, 2);
  assert.equal(report.verification.questionDelta, 40);
  assert.equal(report.verification.responseAreaDelta, 112);
  assert.equal(report.verification.markEntryDelta, 7);
  assert.equal(report.verification.pairingDelta, 1);
  const store = readProductionStore(storePath);
  assert.equal(store.expansionBatches.length, 1);
  assert.equal(store.expansionBatches[0].id, batchId);
  assert.throws(() => publishProductionExpansion({ rootDir, storePath, batchId, syllabus: "0478", year: 2023, session: "M/J", pairs: [pair] }), /Duplicate production expansion batch identity/);

  const rollback = rollbackProductionExpansion({ storePath, batchId });
  assert.equal(rollback.status, "ROLLED_BACK");
  const rolledBack = readProductionStore(storePath);
  assert.equal(rolledBack.papers.length, 0);
  assert.equal(rolledBack.questions.length, 0);
  assert.equal(rolledBack.expansionBatches.length, 0);

  assert.throws(
    () => publishProductionExpansion({ rootDir, storePath, batchId, syllabus: "0478", year: 2023, session: "M/J", pairs: [pair], failComponent: "12" }),
    /Injected failure/
  );
  assert.equal(readProductionStore(storePath).papers.length, 0);

  const productionStorePath = path.join(rootDir, "output", "production", "production-store.json");
  const plan = planProductionExpansion({ batchId: "PR028-0478-2023-MJ", storePath: productionStorePath, stagingDir: path.dirname(qpStagingPath), pdfDir });
  assert.equal(plan.pairs.length, 6);
  assert.equal(plan.summary.ALREADY_PUBLISHED, 6);
  assert.equal(plan.summary.ELIGIBLE, 0);
  assert.equal(plan.summary.BLOCKED, 0);
  assert.equal(plan.readyToExecute, false);

  const monitoring = productionMonitoringReport(productionStorePath, { attempts: 1, failures: 0, completenessFailures: 0, rollbackCount: 0 });
  assert.equal(monitoring.dataQualityMetrics.ingestionSuccessRate, 1);
  assert(monitoring.datasetMetrics.totalPapers >= 258);
  assert(monitoring.datasetMetrics.totalQuestions >= 980);
  assert(monitoring.datasetMetrics.totalLeafQuestions >= 3189);
})();
