const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { stagingArtifactEligibility, suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr046-staging-generation-report.json");
const expected = {
  "qp-22": { role: "question_paper", questions: 5, leaves: 16, requiredAreas: 16, entries: 0 },
  "ms-22": { role: "mark_scheme", questions: 0, leaves: 0, requiredAreas: 0, entries: 5 },
  "qp-23": { role: "question_paper", questions: 6, leaves: 13, requiredAreas: 13, entries: 0 },
  "ms-23": { role: "mark_scheme", questions: 0, leaves: 0, requiredAreas: 0, entries: 8 }
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

const qp13 = JSON.parse(fs.readFileSync(path.join(stagingDir, "0478_s22_qp_13.staging.json"), "utf8"));
const q8 = qp13.questions.find((question) => question.id === "0478-2022-MJ-13-Q8");
assert.equal(q8.response_area_status, "PRESENT");
assert.equal(q8.response_areas_json.length, 6);
assert.equal(q8.raw_json.aggregationDebug.mergedDuplicateQuestionRecord, true);
assert(!qp13.validation.issues.some((issue) => issue.code === "MISSING_RESPONSE_AREAS"));

const qp23 = JSON.parse(fs.readFileSync(path.join(stagingDir, "0478_s22_qp_23.staging.json"), "utf8"));
assert.deepEqual(
  qp23.run.summary_json.questionAggregationDiagnostics.map((entry) => entry.questionId),
  ["0478-2022-MJ-23-Q2", "0478-2022-MJ-23-Q3", "0478-2022-MJ-23-Q5"]
);

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
assert.equal(report.productionWrite, false);
assert.equal(report.totalFiles, 4);
assert.equal(report.successCount, 4);
assert.equal(report.failedCount, 0);
assert.equal(report.skippedCount, 0);
assert(report.results.every((result) => result.status === "PASS"));
