const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generateStagingCoverageReport, planProductionExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const pdfDir = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2023-May-June");
const storePath = path.join(rootDir, "output", "production", "production-store.json");

(() => {
  const expectedFiles = ["11", "13", "21", "22", "23"].flatMap((component) => [
    path.join(stagingDir, `0478_s23_qp_${component}.staging.json`),
    path.join(stagingDir, `0478_s23_ms_${component}.staging.json`)
  ]);
  if (!expectedFiles.every((file) => fs.existsSync(file))) {
    console.warn("Skipping PR-029 staging coverage test because generated artifacts are not present.");
    return;
  }

  const coverage = generateStagingCoverageReport({ stagingDir, batchId: "PR028-0478-2023-MJ" });
  assert.equal(coverage.components.length, 5);
  assert.equal(coverage.eligibleCount, 5);
  assert.equal(coverage.blockedCount, 0);
  assert.deepEqual(coverage.components.filter((component) => component.status === "READY").map((component) => component.component), ["11", "13", "21", "22", "23"]);
  const component11 = coverage.components.find((component) => component.component === "11");
  assert.equal(component11.qp.completenessStatus, "PASS");
  assert.equal(component11.qp.responseAreaCoverage.required, 32);
  assert.equal(component11.qp.responseAreaCoverage.present, 32);
  const component21 = coverage.components.find((component) => component.component === "21");
  assert.equal(component21.qp.validationStatus, "PASS");
  assert.equal(component21.qp.completenessStatus, "PASS");
  assert(!component21.qp.issueCodes.includes("SUSPICIOUS_GLYPHS_REMAIN"));
  const component22 = coverage.components.find((component) => component.component === "22");
  assert.equal(component22.qp.validationStatus, "PASS");
  assert.equal(component22.qp.completenessStatus, "PASS");
  assert(!component22.qp.issueCodes.includes("MARK_SUM_MISMATCH"));
  coverage.components.forEach((component) => {
    assert.equal(component.qp.documentRole, "question_paper");
    assert.equal(component.ms.documentRole, "mark_scheme");
    assert.equal(component.ms.sourceTraceAvailable, true);
  });

  const plan = planProductionExpansion({ batchId: "PR028-0478-2023-MJ", storePath, stagingDir, pdfDir });
  assert.deepEqual(plan.summary, { ELIGIBLE: 0, ALREADY_PUBLISHED: 6, BLOCKED: 0 });
  assert.equal(plan.readyToExecute, false);
})();
