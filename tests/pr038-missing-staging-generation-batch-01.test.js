const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { stagingArtifactEligibility } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const artifacts = ["13", "21"].flatMap((component) => [
  { component, role: "question_paper", file: path.join(stagingDir, `0478_s21_qp_${component}.staging.json`) },
  { component, role: "mark_scheme", file: path.join(stagingDir, `0478_s21_ms_${component}.staging.json`) }
]);

assert.equal(artifacts.length, 4);
artifacts.forEach(({ role, file }) => {
  assert(fs.existsSync(file), `${path.basename(file)} must exist.`);
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  const completeness = staging.run.summary_json.canonicalCompletenessGate;
  assert.equal(staging.papers[0].document_role, role);
  assert.equal(staging.validation.status, "PASS");
  assert.equal(completeness.status, "PASS");
  assert.equal(completeness.publishable, true);
  assert(Object.values(completeness.checks).every((status) => status === "PASS"));
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH");
  assert.equal(staging.run.p0_issue_count, 0);
  assert.equal(staging.run.p1_issue_count, 0);
  assert.equal(staging.run.p2_issue_count, 0);
  assert(staging.papers[0].file_hash);
  assert(staging.papers[0].parser_version);
  assert.equal(stagingArtifactEligibility(file, role).eligible, true);
});

const qp13 = JSON.parse(fs.readFileSync(path.join(stagingDir, "0478_s21_qp_13.staging.json"), "utf8"));
const qp21 = JSON.parse(fs.readFileSync(path.join(stagingDir, "0478_s21_qp_21.staging.json"), "utf8"));
assert.deepEqual(qp13.run.summary_json.canonicalCompletenessGate.summary.responseAreaCoverage, { required: 23, present: 23, ratio: 1 });
assert.deepEqual(qp21.run.summary_json.canonicalCompletenessGate.summary.responseAreaCoverage, { required: 15, present: 15, ratio: 1 });
