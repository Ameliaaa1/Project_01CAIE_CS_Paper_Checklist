"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { parseArgs } = require("../scripts/validate-documentation");
const { parseHeadings, parseLinks } = require("../scripts/documentation-validation/markdown");
const { validateRepository } = require("../scripts/documentation-validation/validator");

const repositoryRoot = path.resolve(__dirname, "..");
const fixturesRoot = path.join(__dirname, "fixtures", "documentation-validation");
let passed = 0;

function hashTree(root) {
  const rows = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else {
        rows.push([
          path.relative(root, absolute).split(path.sep).join("/"),
          crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex"),
        ]);
      }
    }
  }
  walk(root);
  return JSON.stringify(rows);
}

function materialize(name) {
  const spec = JSON.parse(fs.readFileSync(path.join(fixturesRoot, name, "fixture.json"), "utf8"));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `doc-validator-${name}-`));
  for (const [relative, content] of Object.entries(spec.files)) {
    const absolute = path.join(root, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content, "utf8");
  }
  return root;
}

function run(name) {
  const root = materialize(name);
  try {
    return validateRepository({ root, mode: "full" });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function test(name, callback) {
  try {
    callback();
    passed += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

function assertRule(fixture, ruleId) {
  const result = run(fixture);
  assert.strictEqual(result.exitCode, 1);
  assert(result.findings.some((finding) => finding.ruleId === ruleId && finding.severity === "ERROR"));
}

const fixtureHashBefore = hashTree(fixturesRoot);

test("valid fixture passes", () => {
  const result = run("valid");
  assert.strictEqual(result.exitCode, 0);
});
test("invalid lifecycle status blocks", () => assertRule("invalid-status", "DOC-LIFECYCLE-001"));
test("PASS lifecycle status blocks", () => assertRule("pass-as-lifecycle-status", "DOC-LIFECYCLE-002"));
test("missing metadata blocks", () => assertRule("missing-metadata", "DOC-META-001"));
test("broken relative link blocks", () => assertRule("broken-link", "DOC-LINK-001"));
test("broken anchor blocks", () => assertRule("broken-anchor", "DOC-LINK-002"));
test("code-fence pseudo-link is ignored", () => {
  const result = run("code-fence");
  assert.strictEqual(result.exitCode, 0);
  assert.strictEqual(result.summary.linksChecked, 0);
});
test("absolute local path blocks", () => assertRule("absolute-local-path", "DOC-LINK-003"));
test("duplicate authority subject blocks", () => assertRule("duplicate-authority", "DOC-AUTH-001"));
test("missing authority target blocks", () => assertRule("missing-authority-target", "DOC-AUTH-002"));
test("archive authority target blocks", () => assertRule("archive-authority-target", "DOC-AUTH-003"));
test("malformed JSON blocks", () => assertRule("malformed-json", "DOC-EVIDENCE-006"));
test("evidence pair mismatch blocks", () => assertRule("evidence-pair-mismatch", "DOC-EVIDENCE-002"));
test("stale recorded hash blocks", () => assertRule("stale-hash", "DOC-EVIDENCE-004"));
test("JSON self-hash blocks", () => assertRule("self-hash", "DOC-EVIDENCE-005"));
test("baseline regression blocks", () => assertRule("baseline-regression", "DOC-META-002"));
test("unchanged legacy baseline passes with findings", () => {
  const result = run("legacy-baselined");
  assert.strictEqual(result.exitCode, 0);
  assert.strictEqual(result.summary.baselinedFindings, 5);
});
test("protected bytes mismatch blocks", () => assertRule("protected-file-change", "DOC-PROTECTED-002"));
test("missing baseline path blocks", () => assertRule("baseline-path-missing", "DOC-BASELINE-002"));
test("duplicate heading slugs are deterministic", () => {
  const headings = parseHeadings("# Repeat\n# Repeat\n");
  assert.deepStrictEqual([...headings], ["repeat", "repeat-1"]);
});
test("reference and inline links parse outside fences", () => {
  const links = parseLinks("[A](a.md)\n[B][b]\n[b]: b.md\n```\n[C](c.md)\n```");
  assert.deepStrictEqual(links.map((link) => link.destination), ["a.md", "b.md"]);
});
test("changed mode without base returns exit 2", () => {
  const root = materialize("valid");
  try {
    const result = validateRepository({ root, mode: "changed" });
    assert.strictEqual(result.exitCode, 2);
    assert.strictEqual(result.result, "BLOCKED_DOCUMENTATION_VALIDATION_BASE_UNRESOLVED");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("result ordering is deterministic", () => {
  assert.strictEqual(JSON.stringify(run("missing-metadata")), JSON.stringify(run("missing-metadata")));
});
test("validator is read-only by default", () => {
  const root = materialize("valid");
  try {
    const before = hashTree(root);
    validateRepository({ root, mode: "full" });
    assert.strictEqual(hashTree(root), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("forbidden mutation option is rejected", () => {
  assert.throws(() => parseArgs(["--fix"]), /Forbidden option/);
});

assert.strictEqual(hashTree(fixturesRoot), fixtureHashBefore, "source fixtures were modified");
assert.strictEqual(passed, 25);
process.stdout.write(`PASS documentation-validation tests: ${passed}/25\n`);
