const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const targetStems = [
  "9618_s21_qp_11",
  "9618_s21_ms_11",
  "9618_s21_qp_13",
  "9618_s21_ms_13",
  "9618_s21_ms_31",
  "9618_s21_ms_32",
  "9618_s21_ms_33",
  "9618_w21_ms_22",
  "9618_w24_qp_12"
];

assert.equal(suspiciousCharacterCount("The image resolution is 1024 × 512 pixels."), 0);
assert.equal(suspiciousCharacterCount("The screen resolution is 1280 × 800 pixels."), 0);
assert.equal(suspiciousCharacterCount("The monitor resolution is 2560 × 1600 pixels."), 0);
assert.equal(suspiciousCharacterCount("Calculate 3 × 11."), 0);
assert.equal(suspiciousCharacterCount("Unexpected extracted glyph Î."), 1);

const linkedListContext = "An ADT linked list contains A C D E Ø and the free list is Ø. Explain how a node is added.";
assert.equal(suspiciousCharacterCount(linkedListContext), 0);
assert.equal(suspiciousCharacterCount("An unrelated label contains Ø."), 1);

for (const stem of targetStems) {
  const stagingPath = path.join(rootDir, "output", "phase2", "staging", `${stem}.staging.json`);
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  const multiplicationPages = staging.pages.filter((page) => page.display_text.includes("×"));
  assert(multiplicationPages.length > 0, `${stem} must preserve its source-backed multiplication glyph.`);
  assert.equal(staging.validation.status, "PASS", `${stem} validation must pass.`);
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH", `${stem} must be ready.`);
  assert.equal(staging.run.p0_issue_count, 0);
  assert.equal(staging.run.p1_issue_count, 0);
  assert.deepEqual(staging.validation.issues, []);
  assert(multiplicationPages.every((page) => page.text_quality_json.normalizedSuspiciousGlyphCount === 0));
  assert(multiplicationPages.every((page) => page.text_quality_json.displaySuspiciousGlyphCount === 0));
  assert(multiplicationPages.every((page) => suspiciousCharacterCount(page.display_text) === 0));
  assert.equal(staging.run.summary_json.canonicalCompletenessGate.status, "PASS");
  assert(Object.values(staging.run.summary_json.canonicalCompletenessGate.checks).every((status) => status === "PASS"));
}

const reportPath = path.join(rootDir, "output", "production-expansion", "pr062-9618-stale-multiplication-glyph-revalidation-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(report.generatedFor, "PR-062-9618-Stale-Multiplication-Glyph-Staging-Revalidation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.validationResults.length, 9);
assert(report.validationResults.every((result) => result.after.validationStatus === "PASS"));
assert(report.validationResults.every((result) => result.after.publishStatus === "READY_TO_PUBLISH"));
assert(report.validationResults.every((result) => result.after.p1 === 0));
assert.equal(report.integrity.production.unchanged, true);
assert.equal(report.integrity.sourceAssets.unchanged, true);
assert.equal(report.integrity.staging.unrelatedArtifactsUnchanged, true);
assert.deepEqual(report.integrity.staging.actualChangedArtifacts, report.integrity.staging.allowedChangedArtifacts);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.equal(report.next.proposedPr, "PR-063");
