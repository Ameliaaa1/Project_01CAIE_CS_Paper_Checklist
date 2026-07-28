const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { evaluateCanonicalCompleteness, evaluatePublishGate } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const fixturePath = path.join(rootDir, "output", "phase2", "staging", "0478_s21_qp_13.staging.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const completeness = evaluateCanonicalCompleteness(fixture);
const allowedNull = completeness.issues.find((issue) =>
  issue.code === "CANONICAL_MARK_COVERAGE_INCOMPLETE" && issue.questionId === "0478-2021-MJ-13-Q10-A"
);

assert(allowedNull, "Allowed null-mark diagnostic must remain visible.");
assert.equal(allowedNull.severity, "P3");
assert.equal(completeness.checks.markCoverage, "PASS");
assert.equal(completeness.status, "PASS");
assert.equal(completeness.publishable, true);
assert.equal(fixture.run.p2_issue_count, 0);

const publishableFixture = structuredClone(fixture);
publishableFixture.run.summary_json.canonicalCompletenessGate = completeness;
assert.equal(evaluatePublishGate(publishableFixture).publishStatus, "READY_TO_PUBLISH");

const realDefect = structuredClone(fixture);
const requiredParent = realDefect.questions.find((question) => !question.is_leaf);
requiredParent.marks = null;
const defectReport = evaluateCanonicalCompleteness(realDefect);
const missingRequiredMark = defectReport.issues.find((issue) => issue.code === "CANONICAL_REQUIRED_MARK_MISSING" && issue.questionId === requiredParent.id);
assert(missingRequiredMark, "Unexpected missing parent mark must remain a blocking defect.");
assert.equal(missingRequiredMark.severity, "P0");
assert.notEqual(missingRequiredMark.severity, "P3");
assert.equal(defectReport.checks.markCoverage, "FAIL");
assert.equal(defectReport.publishable, false);
