const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");

const linkedListContext = [
  "The following diagram represents an Abstract Data Type (ADT) for a linked list.",
  "A C D E Ø",
  "The free list is as follows: Ø",
  "Explain how a node is added to the list."
].join(" ");

assert.equal(suspiciousCharacterCount(linkedListContext), 0, "Source-backed linked-list null pointers must be legal.");
assert.equal(suspiciousCharacterCount("An unrelated label contains Ø."), 1, "Ø must not be globally allowlisted.");
assert.equal(suspiciousCharacterCount("A linked list is discussed, but this unrelated label is Ø."), 1, "One weak context signal must not bypass validation.");
assert.equal(suspiciousCharacterCount(`${linkedListContext} Î`), 1, "Context-valid Ø must not suppress other suspicious glyphs.");

for (const component of ["21", "23"]) {
  const stagingPath = path.join(rootDir, "output", "phase2", "staging", `9618_s21_qp_${component}.staging.json`);
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  const page16 = staging.pages.find((page) => page.page_number === 16);
  assert.equal(staging.validation.status, "PASS");
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH");
  assert.equal(staging.run.p1_issue_count, 0);
  assert.deepEqual(staging.validation.issues, []);
  assert.equal(page16.display_text.includes("Ø"), true);
  assert.equal(page16.text_quality_json.normalizedSuspiciousGlyphCount, 0);
  assert.equal(page16.text_quality_json.displaySuspiciousGlyphCount, 0);
  assert.equal(suspiciousCharacterCount(page16.display_text), 0);
  assert.equal(staging.run.summary_json.canonicalCompletenessGate.status, "PASS");
  assert(Object.values(staging.run.summary_json.canonicalCompletenessGate.checks).every((status) => status === "PASS"));
}

const report = JSON.parse(fs.readFileSync(path.join(rootDir, "output", "production-expansion", "pr061-9618-null-pointer-glyph-validation-fix-report.json"), "utf8"));
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.implementation.globalAllowlist, false);
assert.equal(report.implementation.parserChanged, false);
assert.equal(report.implementation.canonicalModelChanged, false);
assert.deepEqual(report.affectedArtifacts.unrelatedChanges, []);
assert.equal(report.integrity.production.unchanged, true);
assert.equal(report.integrity.sourceAssets.unchanged, true);
assert.equal(report.integrity.staging.unrelatedArtifactsUnchanged, true);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
