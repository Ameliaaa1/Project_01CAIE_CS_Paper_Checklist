const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { evaluateCanonicalCompleteness, evaluatePublishGate, runCanonicalCompletenessGate } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const fixtures = [
  "output/phase2/staging/0478_s25_qp_12.staging.json",
  "output/phase2/staging/0478_s25_ms_12.staging.json",
  "output/phase2/staging/9618_s25_qp_11.staging.json",
  "output/phase2/staging/9618_s25_ms_11.staging.json"
].map((file) => path.join(rootDir, file));

(() => {
  if (!fixtures.every((fixture) => fs.existsSync(fixture))) {
    console.warn("Skipping PR-026 canonical completeness test because golden staging fixtures are not present.");
    return;
  }

  fixtures.forEach((fixture) => {
    const report = runCanonicalCompletenessGate(fixture);
    assert.equal(report.status, "PASS", `${path.basename(fixture)}: ${JSON.stringify(report.issues)}`);
    assert.equal(report.publishable, true);
    assert.deepEqual(Object.values(report.checks), ["PASS", "PASS", "PASS", "PASS", "PASS", "PASS"]);
  });

  const base = JSON.parse(fs.readFileSync(fixtures[0], "utf8"));
  const cases = [
    {
      code: "CANONICAL_QUESTION_COVERAGE_INCOMPLETE",
      damage(staging) { staging.questions.find((question) => !question.is_leaf).id = null; }
    },
    {
      code: "CANONICAL_SOURCE_TRACE_MISSING",
      damage(staging) { staging.run.source_file = null; }
    },
    {
      code: "CANONICAL_INVALID_PARENT_REFERENCE",
      damage(staging) { staging.questions.find((question) => question.is_leaf).parent_question_id = "missing-parent"; }
    },
    {
      code: "CANONICAL_REQUIRED_MARK_MISSING",
      damage(staging) { staging.questions.find((question) => !question.is_leaf).marks = null; }
    },
    {
      code: "CANONICAL_INVALID_PAGE_RANGE",
      damage(staging) {
        const question = staging.questions.find((candidate) => !candidate.is_leaf);
        question.page_start = question.page_end + 1;
      }
    },
    {
      code: "CANONICAL_RESPONSE_AREA_REQUIRED_MISSING",
      damage(staging) {
        const leaf = staging.questions.find((question) => question.is_leaf && Number(question.marks) > 0);
        leaf.response_area_status = "MISSING";
        leaf.response_areas_json = [];
      }
    },
    {
      code: "CANONICAL_DUPLICATE_LEAF_ID",
      damage(staging) {
        const leaves = staging.questions.filter((question) => question.is_leaf);
        leaves[1].id = leaves[0].id;
      }
    }
  ];

  cases.forEach(({ code, damage }) => {
    const staging = structuredClone(base);
    damage(staging);
    const report = evaluateCanonicalCompleteness(staging);
    assert.equal(report.status, "FAIL", code);
    assert.equal(report.publishable, false, code);
    assert(report.issues.some((issue) => issue.code === code), `${code}: ${JSON.stringify(report.issues)}`);
  });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-pr026-"));
  const stagingPath = path.join(tempDir, "artifact.staging.json");
  fs.writeFileSync(stagingPath, `${JSON.stringify(base, null, 2)}\n`);
  assert.equal(runCanonicalCompletenessGate(stagingPath).publishable, true);
  const diskDamaged = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  diskDamaged.run.source_file = null;
  fs.writeFileSync(stagingPath, `${JSON.stringify(diskDamaged, null, 2)}\n`);
  const rereadReport = runCanonicalCompletenessGate(stagingPath);
  assert.equal(rereadReport.publishable, false);
  assert(rereadReport.issues.some((issue) => issue.code === "CANONICAL_SOURCE_TRACE_MISSING"));

  const withoutCompleteness = structuredClone(base);
  delete withoutCompleteness.run.summary_json.canonicalCompletenessGate;
  const blockedGate = evaluatePublishGate(withoutCompleteness);
  assert.equal(blockedGate.publishStatus, "BLOCKED");
  assert(blockedGate.blockedReasons.includes("CANONICAL_COMPLETENESS_GATE_PASS"));

  const withCompleteness = structuredClone(base);
  withCompleteness.run.summary_json.canonicalCompletenessGate = evaluateCanonicalCompleteness(withCompleteness);
  assert(evaluatePublishGate(withCompleteness).checks.some((check) => check.code === "CANONICAL_COMPLETENESS_GATE_PASS" && check.passed));
})();
