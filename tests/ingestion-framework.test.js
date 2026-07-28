const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  parsePaperFilename,
  scanPaperDirectory,
  runIngestion
} = require("../src/ingestion");

(async () => {
  const parsed = parsePaperFilename("0478_m25_qp_12.pdf");
  assert.deepEqual(parsed, {
    subjectCode: "0478",
    year: 2025,
    yearCode: "25",
    sessionCode: "m",
    session: "F/M",
    role: "QP",
    roleCode: "qp",
    component: "12",
    paperNumber: "1",
    variant: "2",
    paperGroupId: "0478_m_25_12",
    normalizedName: "0478_m25_qp_12.pdf"
  });
  assert.equal(parsePaperFilename("not-a-caie-paper.pdf"), null);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-ingestion-"));
  try {
    fs.mkdirSync(path.join(tempDir, "nested"));
    fs.writeFileSync(path.join(tempDir, "0478_m25_qp_12.pdf"), "question paper");
    fs.writeFileSync(path.join(tempDir, "nested", "0478_m25_ms_12.pdf"), "mark scheme");
    fs.writeFileSync(path.join(tempDir, "bad_name.pdf"), "unknown");
    fs.writeFileSync(path.join(tempDir, "notes.txt"), "ignore");

    const scan = await scanPaperDirectory(tempDir);
    assert.equal(scan.papers.length, 2);
    assert.equal(scan.issues.length, 1);
    assert(scan.papers.every((paper) => paper.fileHash.length === 64));
    assert.deepEqual(scan.papers.map((paper) => paper.paperGroupId).sort(), ["0478_m_25_12", "0478_m_25_12"]);

    const result = await runIngestion({ dir: tempDir, dryRun: true, role: "qp" });
    assert.equal(result.ok, true);
    assert.equal(result.summary.scanned, 1);
    assert.deepEqual(result.summary.byRole, { QP: 1 });
    assert.equal(result.papers[0].status, "SCANNED");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
