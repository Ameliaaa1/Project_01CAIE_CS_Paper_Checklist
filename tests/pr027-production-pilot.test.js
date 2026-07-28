const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishProductionPilot, readProductionStore, rollbackProductionPilot } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const qpStagingPath = path.join(rootDir, "output", "phase2", "staging", "0478_s23_qp_12.staging.json");
const msStagingPath = path.join(rootDir, "output", "phase2", "staging", "0478_s23_ms_12.staging.json");

(() => {
  if (!fs.existsSync(qpStagingPath) || !fs.existsSync(msStagingPath)) {
    console.warn("Skipping PR-027 production pilot test because staging fixtures are not present.");
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr027-"));
  const storePath = path.join(tempDir, "production-store.json");
  const options = { rootDir, storePath, qpStagingPath, msStagingPath, pilotBatchId: "PR027-TEST-0478-2023-MJ-12" };
  const report = publishProductionPilot(options);

  assert.equal(report.status, "PASS");
  assert.equal(report.productionWrite, true);
  assert.equal(report.publishGate, "PASS");
  assert.equal(report.pairing.pairingStatus, "PASS");
  assert.deepEqual(report.productionVerification.counts, {
    paperCount: 2,
    questionCount: 10,
    leafQuestionCount: 31,
    responseAreaCount: 112,
    markSchemeEntryCount: 7
  });
  assert.deepEqual(Object.values(report.frontendVerification), ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS"]);

  const store = readProductionStore(storePath);
  assert.equal(store.batches.length, 1);
  assert.equal(store.papers.length, 2);
  assert.throws(() => publishProductionPilot(options), /Duplicate production identity conflict/);

  const rollback = rollbackProductionPilot({ storePath, pilotBatchId: options.pilotBatchId });
  assert.equal(rollback.status, "ROLLED_BACK");
  const rolledBack = readProductionStore(storePath);
  assert.equal(rolledBack.batches.length, 0);
  assert.equal(rolledBack.papers.length, 0);
  assert.equal(rolledBack.questions.length, 0);

  assert.throws(() => publishProductionPilot({ ...options, failAfterWrite: true }), /Injected failure/);
  const restored = readProductionStore(storePath);
  assert.equal(restored.batches.length, 0);
  assert.equal(restored.papers.length, 0);
})();
