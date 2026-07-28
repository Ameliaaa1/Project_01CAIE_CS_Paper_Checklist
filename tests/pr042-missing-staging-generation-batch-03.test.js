const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { stagingArtifactEligibility, suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr042-staging-generation-report.json");
const expected = {
  "qp-11": { role: "question_paper", questions: 12, leaves: 27, requiredAreas: 27, entries: 0 },
  "ms-11": { role: "mark_scheme", questions: 0, leaves: 0, requiredAreas: 0, entries: 7 },
  "qp-12": { role: "question_paper", questions: 8, leaves: 21, requiredAreas: 21, entries: 0 },
  "ms-12": { role: "mark_scheme", questions: 0, leaves: 0, requiredAreas: 0, entries: 10 }
};

assert.equal(suspiciousCharacterCount("two marks × per mark point"), 0);

Object.entries(expected).forEach(([key, counts]) => {
  const [roleCode, component] = key.split("-");
  const file = path.join(stagingDir, `0478_s22_${roleCode}_${component}.staging.json`);
  assert(fs.existsSync(file), `${path.basename(file)} must exist.`);
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  const completeness = staging.run.summary_json.canonicalCompletenessGate;

  assert.equal(staging.papers[0].document_role, counts.role);
  assert.equal(staging.validation.status, "PASS");
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH");
  assert.equal(staging.run.p0_issue_count, 0);
  assert.equal(staging.run.p1_issue_count, 0);
  assert.equal(staging.run.p2_issue_count, 0);
  assert.equal(completeness.status, "PASS");
  assert.equal(completeness.publishable, true);
  assert(Object.values(completeness.checks).every((status) => status === "PASS"));
  assert.equal(completeness.summary.questionCount, counts.questions);
  assert.equal(completeness.summary.leafQuestionCount, counts.leaves);
  assert.deepEqual(completeness.summary.responseAreaCoverage, {
    required: counts.requiredAreas,
    present: counts.requiredAreas,
    ratio: 1
  });
  assert.equal(completeness.summary.markSchemeEntryCount, counts.entries);
  assert(staging.papers[0].file_hash);
  assert(staging.papers[0].parser_version);
  assert.equal(stagingArtifactEligibility(file, counts.role).eligible, true);
});

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(report.productionWrite, false);
assert.equal(report.totalFiles, 4);
assert.equal(report.successCount, 4);
assert.equal(report.failedCount, 0);
assert.equal(report.skippedCount, 0);
assert(report.results.every((result) => result.status === "PASS"));
