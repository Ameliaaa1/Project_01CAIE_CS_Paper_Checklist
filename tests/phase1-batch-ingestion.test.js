const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const fixturePath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf");

if (!fs.existsSync(fixturePath)) {
  console.warn("Skipping Phase 1 batch ingestion test because the sample PDF is not present.");
  process.exit(0);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-phase1-"));
try {
  const manifestPath = path.join(tempDir, "manifest.json");
  const reportPath = path.join(tempDir, "phase1-ingestion-report.json");
  const stagingDir = path.join(tempDir, "staging");
  const logDir = path.join(tempDir, "logs");
  fs.writeFileSync(manifestPath, `${JSON.stringify([{
    file: path.relative(rootDir, fixturePath),
    expectedRole: "question_paper",
    purpose: "dry-run test fixture"
  }], null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    path.join(rootDir, "scripts", "phase1-batch-ingestion.js"),
    `--manifest=${manifestPath}`,
    `--report=${reportPath}`,
    `--staging-dir=${stagingDir}`,
    `--log-dir=${logDir}`,
    "--dry-run"
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert.equal(report.productionWrite, false);
  assert.equal(report.totalFiles, 1);
  assert.equal(report.skippedCount, 1);
  assert.equal(report.results[0].status, "SKIPPED");
  assert.equal(fs.existsSync(path.join(logDir, "0478_s25_qp_12.log")), true);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
