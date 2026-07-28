const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const fixturePath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf");

(() => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping Phase 2 batch ingestion test because the sample PDF is not present.");
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-phase2-"));
  const manifestPath = path.join(tempDir, "manifest.json");
  const reportPath = path.join(tempDir, "report.json");
  const stagingDir = path.join(tempDir, "staging");
  const logDir = path.join(tempDir, "logs");
  const relativeFixture = path.relative(rootDir, fixturePath);
  fs.writeFileSync(manifestPath, JSON.stringify([{
    id: "phase2-test-001",
    file: relativeFixture,
    syllabus: "0478",
    year: 2025,
    session: "May-June",
    component: "12",
    expectedRole: "question_paper",
    phase1Regression: true,
    purpose: "Phase 2 dry-run structure test"
  }], null, 2));

  const result = spawnSync("npm", [
    "run",
    "pdf:phase2-batch",
    "--",
    "--dry-run",
    "--manifest", manifestPath,
    "--report", reportPath,
    "--staging-dir", stagingDir,
    "--log-dir", logDir
  ], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.equal(report.phase, "Phase 2");
  assert.equal(report.productionWrite, false);
  assert.equal(report.totalFiles, 1);
  assert.equal(report.skippedCount, 1);
  assert.equal(report.groupStats.bySyllabus["0478"].total, 1);
  assert.equal(report.groupStats.byDocumentRole.question_paper.total, 1);
  assert.equal(report.phase2Analysis.successRate, 0);
  assert.deepEqual(report.phase2Analysis.datasetGaps, []);
  assert(fs.existsSync(path.join(logDir, "0478_s25_qp_12.log")));
})();
