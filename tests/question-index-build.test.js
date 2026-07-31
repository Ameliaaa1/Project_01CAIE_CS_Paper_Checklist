"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { sha256, validateIndexes } = require("../scripts/build-question-index");

const root = path.resolve(__dirname, "..");
const canonicalPath = path.join(root, "generated", "production-question-index.json");
const browserPath = path.join(root, "public", "assets", "question-index.json");
const canonicalBefore = sha256(canonicalPath);
const browserBefore = sha256(browserPath);

const first = validateIndexes();
const second = validateIndexes();

assert.equal(first.status, "PASS_CANONICAL_INDEX_REPRODUCIBILITY");
assert.equal(first.sourceOfTruth, "generated/production-question-index.json");
assert.equal(first.semanticMirrorEqual, true);
assert.equal(first.writePerformed, false);
assert.deepEqual(second, first);
assert.equal(sha256(canonicalPath), canonicalBefore);
assert.equal(sha256(browserPath), browserBefore);
assert.equal(fs.existsSync(path.join(root, "generated", "question-index.json")), false);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "db-b1-index-build-"));
try {
  const valid = {
    schemaVersion: "2.0",
    dataSource: "PRODUCTION_CANONICAL",
    papers: 1,
    questions: 1,
    entries: [{ canonicalQuestionId: "fixture-Q1" }],
  };
  const fixtureCanonical = path.join(temp, "canonical.json");
  const fixtureBrowser = path.join(temp, "browser.json");
  fs.writeFileSync(fixtureCanonical, `${JSON.stringify(valid)}\n`);
  fs.writeFileSync(fixtureBrowser, `${JSON.stringify({ ...valid, questions: 2 })}\n`);
  assert.throws(
    () => validateIndexes({ canonicalPath: fixtureCanonical, browserPath: fixtureBrowser }),
    /count is inconsistent|semantic mirror/
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
