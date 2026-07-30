"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { parseArgs } = require("../scripts/validate-documentation");
const { IMPLEMENTED_RULES, RULES } = require("../scripts/documentation-validation/constants");
const { parseHeadings, parseLinks } = require("../scripts/documentation-validation/markdown");
const { validateRepository } = require("../scripts/documentation-validation/validator");

const repositoryRoot = path.resolve(__dirname, "..");
const fixturesRoot = path.join(__dirname, "fixtures", "documentation-validation");
const tests = [];
const testedRules = new Set();
const categoryCounts = new Map();
let passed = 0;

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function writeFiles(root, files) {
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content, "utf8");
  }
}

function initGitRepository(root) {
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Documentation Validator Test"]);
  git(root, ["config", "user.email", "validator-test@example.invalid"]);
  git(root, ["commit", "--allow-empty", "-qm", "anchor"]);
  return git(root, ["rev-parse", "HEAD"]);
}

function commitAll(root, message) {
  git(root, ["add", "--all"]);
  git(root, ["commit", "--allow-empty", "-qm", message]);
  return git(root, ["rev-parse", "HEAD"]);
}

function hashTree(root) {
  const rows = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
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

function replaceBaseCommit(files, baseCommit) {
  return Object.fromEntries(Object.entries(files).map(([file, content]) => [
    file,
    content.replaceAll('"baseCommit":"fixture"', `"baseCommit":"${baseCommit}"`)
      .replaceAll("__BASE_COMMIT__", baseCommit),
  ]));
}

function createRepository(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "doc-validator-full-"));
  const anchor = initGitRepository(root);
  writeFiles(root, replaceBaseCommit(files, anchor));
  commitAll(root, "fixture");
  return { root, anchor };
}

function createChangedRepository(baseFiles, mutate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "doc-validator-changed-"));
  const anchor = initGitRepository(root);
  writeFiles(root, replaceBaseCommit(baseFiles, anchor));
  const base = commitAll(root, "base");
  mutate(root, { anchor, base });
  commitAll(root, "change");
  return { root, anchor, base };
}

function materialize(name) {
  const spec = JSON.parse(fs.readFileSync(path.join(fixturesRoot, name, "fixture.json"), "utf8"));
  return createRepository(spec.files).root;
}

function withRepository(repository, callback) {
  try {
    const before = hashTree(repository.root);
    const result = callback(repository);
    assert.strictEqual(hashTree(repository.root), before, "validator modified fixture bytes");
    return result;
  } finally {
    fs.rmSync(repository.root, { recursive: true, force: true });
  }
}

function runFixture(name) {
  const root = materialize(name);
  return withRepository({ root }, ({ root: fixtureRoot }) =>
    validateRepository({ root: fixtureRoot, mode: "full" }));
}

function runFiles(files) {
  return withRepository(createRepository(files), ({ root }) =>
    validateRepository({ root, mode: "full" }));
}

function runChanged(baseFiles, mutate) {
  return withRepository(createChangedRepository(baseFiles, mutate), ({ root, base }) =>
    validateRepository({ root, mode: "changed", base }));
}

function register(name, category, callback) {
  tests.push({ name, category, callback });
}

function assertResult(result, exitCode, expectedResult) {
  assert.strictEqual(result.exitCode, exitCode);
  assert.strictEqual(result.result, expectedResult);
}

function assertFinding(result, ruleId) {
  assertResult(result, 1, "BLOCKED_DOCUMENTATION_VALIDATION");
  assert(result.findings.some((finding) => finding.ruleId === ruleId
    && finding.severity === "ERROR"), `missing ${ruleId}`);
  testedRules.add(ruleId);
}

function assertFixtureRule(fixture, ruleId) {
  assertFinding(runFixture(fixture), ruleId);
}

function validDocument(title = "Example", status = "VALIDATED", scope = "NONE", body = "") {
  return `# ${title}\n\nStatus: \`${status}\`\n\nOwner: Test\n\nCreated at: \`2026-01-01T00:00:00Z\`\n\nAuthoritative scope: ${scope}\n\nRelated documents:\n\n${body}`;
}

function baseline(anchor, entries = [], authority = {}) {
  return `${JSON.stringify({
    schemaVersion: 1,
    authority: { approvedBy: "Fixture review", baseCommit: anchor, ...authority },
    entries,
  })}\n`;
}

function evidenceLifecycle(overrides = {}) {
  return `${JSON.stringify({
    schemaVersion: 1,
    legacyMixedEvidenceSources: [],
    activeAuthorityPaths: [],
    activeAuthorityPrefixes: [],
    historicalEvidence: [],
    ...overrides,
  })}\n`;
}

function historicalLifecycleEntry(file, content) {
  const bytes = Buffer.from(content);
  return {
    path: file,
    evidenceClass: "historical",
    sizeBytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

function legacyEntry(file = "README.md", rules = ["DOC-META-001"]) {
  return {
    path: file,
    classification: "LEGACY_BASELINED",
    rules,
    reason: "Fixture",
    sourceFinding: "FIXTURE",
  };
}

function protectedEntry(file, content, classification = "PROTECTED_IMMUTABLE") {
  const bytes = Buffer.from(content);
  return {
    path: file,
    classification,
    rules: [],
    reason: "Fixture",
    sourceFinding: "FIXTURE",
    sizeBytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

function evidenceMarkdown(values = {}) {
  const data = {
    task: "PR-05", status: "READY_FOR_HUMAN_REVIEW", result: "PASS_FIXTURE",
    baseSha: "a".repeat(40), validatedImplementationSha: "b".repeat(40),
    finalPrHeadSha: "PENDING", generatedAt: "2026-01-01T00:00:01Z",
    cases: 2, passed: 2, failed: 0, blocking: 0, baselined: 0,
    changedFiles: 2, deleted: 0, renamed: 0, moved: 0, additions: 10, deletions: 0,
    decision: "PENDING", ...values,
  };
  return `# Fixture Report\n\nTask: \`${data.task}\`\n\nStatus: \`${data.status}\`\n\nResult: \`${data.result}\`\n\nOwner: Test\n\nCreated at: \`2026-01-01T00:00:00Z\`\n\nAuthoritative scope: NONE\n\nRelated documents:\n\nBase SHA: \`${data.baseSha}\`\n\nValidated implementation SHA: \`${data.validatedImplementationSha}\`\n\nFinal PR head SHA: \`${data.finalPrHeadSha}\`\n\nGenerated at: \`${data.generatedAt}\`\n\nTests cases: \`${data.cases}\`\n\nTests passed: \`${data.passed}\`\n\nTests failed: \`${data.failed}\`\n\nBlocking findings: \`${data.blocking}\`\n\nBaselined findings: \`${data.baselined}\`\n\nChanged files: \`${data.changedFiles}\`\n\nFiles deleted: \`${data.deleted}\`\n\nFiles renamed: \`${data.renamed}\`\n\nFiles moved: \`${data.moved}\`\n\nLine additions: \`${data.additions}\`\n\nLine deletions: \`${data.deletions}\`\n\nHuman review decision: \`${data.decision}\`\n`;
}

function evidenceJson(overrides = {}) {
  const data = {
    task: "PR-05",
    status: "READY_FOR_HUMAN_REVIEW",
    result: "PASS_FIXTURE",
    baseSha: "a".repeat(40),
    validatedImplementationSha: "b".repeat(40),
    finalPrHeadSha: null,
    generatedAt: "2026-01-01T00:00:01Z",
    markdownReport: "docs/repository-maintenance/pr-05/PR05_FIXTURE_REPORT.md",
    validation: {
      fullMode: "PASS", changedMode: "PASS", links: "PASS", authority: "PASS",
      evidencePairs: "PASS", protectedEvidence: "PASS", baseline: "PASS",
      gitDiffCheck: "PASS", readOnlyDefault: "PASS",
    },
    tests: { cases: 2, passed: 2, failed: 0 },
    summary: { blockingFindings: 0, baselinedFindings: 0 },
    gitBoundary: {
      changedFiles: 2, filesDeleted: 0, filesRenamed: 0, filesMoved: 0,
      lineAdditions: 10, lineDeletions: 0,
    },
    evidenceFiles: [],
    selfHash: "SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE",
    humanReview: { required: true, decision: "PENDING", reviewer: null, reviewedAt: null },
    ...overrides,
  };
  return data;
}

function pairFiles(json, markdownValues = {}) {
  return {
    "docs/repository-maintenance/pr-05/PR05_FIXTURE_REPORT.md": evidenceMarkdown(markdownValues),
    "docs/repository-maintenance/pr-05/pr05-fixture-report.json": `${JSON.stringify(json)}\n`,
  };
}

const fixtureHashBefore = hashTree(fixturesRoot);

register("valid fixture passes", "regression", () => {
  assertResult(runFixture("valid"), 0, "PASS_DOCUMENTATION_VALIDATION");
});
register("invalid lifecycle status blocks", "regression", () => assertFixtureRule("invalid-status", RULES.LIFECYCLE_INVALID));
register("PASS lifecycle status blocks", "regression", () => assertFixtureRule("pass-as-lifecycle-status", RULES.LIFECYCLE_PASS_STATUS));
for (const [key, rule] of [
  ["status", RULES.META_STATUS], ["owner", RULES.META_OWNER], ["created", RULES.META_CREATED_AT],
  ["authority", RULES.META_AUTHORITY], ["related", RULES.META_RELATED],
]) register(`missing metadata ${key} blocks`, "regression", () => assertFixtureRule("missing-metadata", rule));
register("broken relative link blocks", "regression", () => assertFixtureRule("broken-link", RULES.LINK_MISSING));
register("broken anchor blocks", "regression", () => assertFixtureRule("broken-anchor", RULES.LINK_ANCHOR));
register("code-fence pseudo-link is ignored", "regression", () => {
  const result = runFixture("code-fence");
  assertResult(result, 0, "PASS_DOCUMENTATION_VALIDATION");
  assert.strictEqual(result.summary.linksChecked, 0);
});
register("absolute local path blocks", "regression", () => assertFixtureRule("absolute-local-path", RULES.LINK_ABSOLUTE));
register("duplicate authority subject blocks", "regression", () => assertFixtureRule("duplicate-authority", RULES.AUTH_DUPLICATE));
register("missing authority target blocks", "regression", () => assertFixtureRule("missing-authority-target", RULES.AUTH_TARGET_MISSING));
register("archive authority target blocks", "regression", () => assertFixtureRule("archive-authority-target", RULES.AUTH_ARCHIVE));
register("malformed JSON blocks", "regression", () => assertFixtureRule("malformed-json", RULES.EVIDENCE_JSON_PARSE));
register("evidence pair mismatch blocks", "evidence", () => assertFixtureRule("evidence-pair-mismatch", RULES.EVIDENCE_PAIR_MISMATCH));
register("stale recorded hash blocks", "evidence", () => assertFixtureRule("stale-hash", RULES.EVIDENCE_HASH));
register("JSON self-hash blocks", "evidence", () => assertFixtureRule("self-hash", RULES.EVIDENCE_SELF_HASH));
register("modified historical evidence blocks", "evidence-lifecycle", () =>
  assertFixtureRule("historical-evidence-modified", RULES.EVIDENCE_HASH));
register("modified active authority passes when current validation passes", "evidence-lifecycle", () =>
  assertResult(runFixture("active-authority-modified"), 0, "PASS_DOCUMENTATION_VALIDATION"));
register("missing evidenceClass blocks", "evidence-lifecycle", () =>
  assertFixtureRule("missing-evidence-class", RULES.EVIDENCE_CLASS_MISSING));
register("invalid evidenceClass blocks", "evidence-lifecycle", () =>
  assertFixtureRule("invalid-evidence-class", RULES.EVIDENCE_CLASS_INVALID));
register("active authority marked historical blocks", "evidence-lifecycle", () =>
  assertFixtureRule("active-marked-historical", RULES.EVIDENCE_CLASS_CONFLICT));
register("registered legacy source inference passes", "evidence-lifecycle-governance", () =>
  assertResult(runFixture("registered-legacy-inference"), 0, "PASS_DOCUMENTATION_VALIDATION"));
register("historical lifecycle entry deletion blocks", "evidence-lifecycle-governance", () => {
  const content = "frozen\n";
  const result = runChanged({
    "docs/HISTORICAL.txt": content,
    "scripts/documentation-validation/evidence-lifecycle.json": evidenceLifecycle({
      historicalEvidence: [historicalLifecycleEntry("docs/HISTORICAL.txt", content)],
    }),
  }, (root) => fs.writeFileSync(
    path.join(root, "scripts/documentation-validation/evidence-lifecycle.json"),
    evidenceLifecycle(),
  ));
  assertFinding(result, RULES.EVIDENCE_HISTORICAL_REMOVED);
});
register("historical classification downgrade blocks", "evidence-lifecycle-governance", () => {
  const content = "frozen\n";
  const target = "docs/HISTORICAL.txt";
  const result = runChanged({
    [target]: content,
    "scripts/documentation-validation/evidence-lifecycle.json": evidenceLifecycle({
      historicalEvidence: [historicalLifecycleEntry(target, content)],
    }),
  }, (root) => fs.writeFileSync(
    path.join(root, "scripts/documentation-validation/evidence-lifecycle.json"),
    evidenceLifecycle({ activeAuthorityPaths: [target] }),
  ));
  assertFinding(result, RULES.EVIDENCE_HISTORICAL_WEAKENED);
});
register("active authority prefix expansion blocks", "evidence-lifecycle-governance", () => {
  const result = runChanged({
    "scripts/documentation-validation/evidence-lifecycle.json": evidenceLifecycle(),
  }, (root) => fs.writeFileSync(
    path.join(root, "scripts/documentation-validation/evidence-lifecycle.json"),
    evidenceLifecycle({ activeAuthorityPrefixes: ["scripts/new-authority/"] }),
  ));
  assertFinding(result, RULES.EVIDENCE_ACTIVE_BOUNDARY_BROADENED);
});
register("legacy inference source expansion blocks", "evidence-lifecycle-governance", () => {
  const result = runChanged({
    "scripts/documentation-validation/evidence-lifecycle.json": evidenceLifecycle(),
  }, (root) => fs.writeFileSync(
    path.join(root, "scripts/documentation-validation/evidence-lifecycle.json"),
    evidenceLifecycle({ legacyMixedEvidenceSources: ["docs/new-legacy.json"] }),
  ));
  assertFinding(result, RULES.EVIDENCE_LEGACY_SOURCE_EXPANDED);
});
register("active authority immutable snapshot fields block", "evidence-lifecycle-governance", () =>
  assertFixtureRule("active-authority-snapshot-fields", RULES.EVIDENCE_ACTIVE_SNAPSHOT_FIELDS));
register("baseline regression blocks", "baseline", () => assertFixtureRule("baseline-regression", RULES.META_OWNER));
register("fixed violation still in baseline blocks", "baseline", () => assertFixtureRule("baseline-stale", RULES.BASELINE_STALE));
register("unchanged legacy baseline passes with findings", "baseline", () => {
  const result = runFixture("legacy-baselined");
  assertResult(result, 0, "PASS_DOCUMENTATION_VALIDATION");
  assert.strictEqual(result.summary.baselinedFindings, 5);
});
register("protected bytes mismatch blocks", "baseline", () => assertFixtureRule("protected-file-change", RULES.PROTECTED_HASH));
register("missing baseline path blocks", "baseline", () => assertFixtureRule("baseline-path-missing", RULES.BASELINE_PATH));
register("duplicate heading slugs are deterministic", "regression", () => {
  assert.deepStrictEqual([...parseHeadings("# Repeat\n# Repeat\n")], ["repeat", "repeat-1"]);
});
register("reference links parse outside fences", "regression", () => {
  const links = parseLinks("[A](a.md)\n[B][b]\n[b]: b.md\n```\n[C](c.md)\n```");
  assert.deepStrictEqual(links.map((link) => link.destination), ["a.md", "b.md"]);
});
register("validator is read-only by default", "regression", () => {
  const repository = createRepository({ "docs/EXAMPLE.md": validDocument() });
  withRepository(repository, ({ root }) => {
    assertResult(validateRepository({ root, mode: "full" }), 0, "PASS_DOCUMENTATION_VALIDATION");
  });
});
register("forbidden mutation option is rejected", "structured-error", () => {
  assert.throws(() => parseArgs(["--fix"]), /Forbidden option/);
});
register("unknown CLI option is rejected", "structured-error", () => {
  assert.throws(() => parseArgs(["--unknown"]), /Unknown option/);
});

register("long-lived filename rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/not-valid.md": validDocument(),
}), RULES.NAME_LONG_LIVED));
register("maintenance Markdown filename rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/repository-maintenance/pr-05/not-valid.md": validDocument(),
}), RULES.NAME_MAINTENANCE_MD));
register("paired JSON filename rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/repository-maintenance/pr-05/Not_Valid.json": "{}\n",
}), RULES.NAME_PAIRED_JSON));
register("ambiguous filename rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/final.md": validDocument(),
}), RULES.NAME_AMBIGUOUS));
register("superseded metadata rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/EXAMPLE.md": validDocument("Example", "SUPERSEDED"),
}), RULES.LIFECYCLE_SUPERSEDED));
register("approval metadata rule executes", "rule-closure", () => assertFinding(runFiles({
  "docs/EXAMPLE.md": `${validDocument()}\nApproval: \`APPROVED_BY_HUMAN_REVIEW\`\n`,
}), RULES.LIFECYCLE_APPROVAL));
register("CURRENT authority must be navigated", "rule-closure", () => assertFinding(runFiles({
  "docs/CURRENT_DOC.md": validDocument("Current", "CURRENT", "Test authority"),
  "docs/DOCUMENTATION_INDEX.md": validDocument("Index"),
  "docs/AUTHORITATIVE_DOCUMENT_MAP.md": validDocument("Map"),
}), RULES.LIFECYCLE_AUTHORITY_SYNC));
register("archive cannot be labelled current authority", "rule-closure", () => assertFinding(runFiles({
  "docs/EXAMPLE.md": validDocument("Example", "VALIDATED", "NONE", "[Current authority](archive/OLD.md)\n"),
  "docs/archive/OLD.md": "# Old\n",
}), RULES.LINK_ARCHIVE_CURRENT));
register("authority target state blocks", "rule-closure", () => assertFinding(runFiles({
  "docs/AUTHORITATIVE_DOCUMENT_MAP.md": `${validDocument("Map")}\n| Information subject | Current authority | State |\n| --- | --- | --- |\n| Test | [Draft](DRAFT.md) | current |\n`,
  "docs/DRAFT.md": validDocument("Draft", "DRAFT"),
}), RULES.AUTH_TARGET_STATE));
register("missing evidence target blocks", "evidence", () => assertFinding(runFiles({
  "docs/missing-target.json": `${JSON.stringify({ files: [{ path: "docs/MISSING.md", evidenceClass: "historical", sizeBytes: 1, sha256: "0".repeat(64) }] })}\n`,
}), RULES.EVIDENCE_PAIR_MISSING));
register("evidence size mismatch blocks", "evidence", () => assertFinding(runFiles({
  "docs/TARGET.md": "x",
  "docs/size.json": `${JSON.stringify({ files: [{ path: "docs/TARGET.md", evidenceClass: "historical", sizeBytes: 2, sha256: crypto.createHash("sha256").update("x").digest("hex") }] })}\n`,
}), RULES.EVIDENCE_SIZE));

for (const [name, entry] of [
  ["evidence-entry-missing-path", { evidenceClass: "historical", sizeBytes: 0, sha256: "0".repeat(64) }],
  ["evidence-entry-missing-size", { path: "docs/X.md", evidenceClass: "historical", sha256: "0".repeat(64) }],
  ["evidence-entry-missing-sha", { path: "docs/X.md", evidenceClass: "historical", sizeBytes: 0 }],
  ["evidence-entry-invalid-size", { path: "docs/X.md", evidenceClass: "historical", sizeBytes: "0", sha256: "0".repeat(64) }],
  ["evidence-entry-invalid-sha", { path: "docs/X.md", evidenceClass: "historical", sizeBytes: 0, sha256: "INVALID" }],
]) register(name, "evidence", () => assertFinding(runFiles({
  [`docs/${name}.json`]: `${JSON.stringify({ files: [entry] })}\n`,
}), RULES.EVIDENCE_ENTRY_MALFORMED));
register("missing self-hash marker blocks", "evidence", () => assertFinding(runFiles({
  "docs/missing-self.json": `${JSON.stringify({ evidenceFiles: [] })}\n`,
}), RULES.EVIDENCE_SELF_HASH));
register("invalid self-hash marker blocks", "evidence", () => assertFinding(runFiles({
  "docs/invalid-self.json": `${JSON.stringify({ evidenceFiles: [], selfHash: "INVALID" })}\n`,
}), RULES.EVIDENCE_SELF_HASH));

for (const [name, mutate] of [
  ["head-sha-mismatch", (json) => { json.validatedImplementationSha = "c".repeat(40); }],
  ["test-count-mismatch", (json) => { json.tests.cases = 3; json.tests.passed = 3; }],
  ["git-boundary-mismatch", (json) => { json.gitBoundary.changedFiles = 3; }],
  ["human-review-mismatch", (json) => { json.humanReview.decision = "APPROVE"; }],
]) register(name, "evidence", () => {
  const json = evidenceJson();
  mutate(json);
  assertFinding(runFiles(pairFiles(json)), RULES.EVIDENCE_PAIR_MISMATCH);
});

for (const [name, mutate, markdownValues] of [
  ["pass-without-validation", (json) => { delete json.validation; }, {}],
  ["pass-with-failed-tests", (json) => { json.tests.failed = 1; json.tests.passed = 1; }, { passed: 1, failed: 1 }],
  ["pass-with-test-count-mismatch", (json) => { json.tests.passed = 1; }, { passed: 1 }],
  ["pass-with-missing-required-gate", (json) => { delete json.validation.changedMode; }, {}],
  ["ready-status-with-approve", (json) => { json.humanReview.decision = "APPROVE"; }, { decision: "APPROVE" }],
  ["approved-status-with-pending", (json) => { json.status = "APPROVED"; }, { status: "APPROVED" }],
]) register(name, "pass-truthfulness", () => {
  const json = evidenceJson();
  mutate(json);
  assertFinding(runFiles(pairFiles(json, markdownValues)), RULES.EVIDENCE_FALSE_PASS);
});

register("changed compliant document passes", "changed-mode", () => {
  const result = runChanged({ "docs/EXAMPLE.md": validDocument() }, (root) => {
    fs.appendFileSync(path.join(root, "docs/EXAMPLE.md"), "Updated body.\n");
  });
  assertResult(result, 0, "PASS_DOCUMENTATION_VALIDATION");
});
register("changed legacy document becomes strict", "changed-mode", () => {
  const result = runChanged({
    "README.md": "# Legacy\n",
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [legacyEntry("README.md", [
      RULES.META_STATUS, RULES.META_OWNER, RULES.META_CREATED_AT, RULES.META_AUTHORITY, RULES.META_RELATED,
    ])]),
  }, (root) => fs.appendFileSync(path.join(root, "README.md"), "Changed.\n"));
  assertFinding(result, RULES.META_STATUS);
  assert(result.findings.some((finding) => finding.ruleId === RULES.META_STATUS
    && finding.baselineStatus === "NOT_BASELINED"));
});
register("changed protected file blocks", "changed-mode", () => {
  const content = "# Protected\n";
  const result = runChanged({
    "docs/PROTECTED.md": content,
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [protectedEntry("docs/PROTECTED.md", content)]),
  }, (root) => fs.appendFileSync(path.join(root, "docs/PROTECTED.md"), "Changed.\n"));
  assertFinding(result, RULES.PROTECTED_HASH);
});
register("changed archived file blocks", "changed-mode", () => {
  const content = "# Archived\n";
  const result = runChanged({
    "docs/archive/OLD.md": content,
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [protectedEntry("docs/archive/OLD.md", content, "ARCHIVED")]),
  }, (root) => fs.appendFileSync(path.join(root, "docs/archive/OLD.md"), "Changed.\n"));
  assertFinding(result, RULES.PROTECTED_ARCHIVE_CHANGE);
});
register("deleted target with inbound link blocks", "changed-mode", () => {
  const result = runChanged({
    "docs/A.md": validDocument("A", "VALIDATED", "NONE", "[B](B.md)\n"),
    "docs/B.md": validDocument("B"),
  }, (root) => fs.unlinkSync(path.join(root, "docs/B.md")));
  assertFinding(result, RULES.LINK_DELETED_TARGET);
});
register("new authority document requires index and map", "changed-mode", () => {
  const result = runChanged({}, (root) => writeFiles(root, {
    "docs/NEW_AUTHORITY.md": validDocument("New Authority", "VALIDATED", "Fixture authority"),
  }));
  assertFinding(result, RULES.AUTH_SYNC);
});
register("protected rename blocks", "changed-mode", () => {
  const content = "# Protected\n";
  const result = runChanged({
    "docs/PROTECTED.md": content,
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [protectedEntry("docs/PROTECTED.md", content)]),
  }, (root) => git(root, ["mv", "docs/PROTECTED.md", "docs/RENAMED.md"]));
  assertFinding(result, RULES.PROTECTED_PATH);
});
register("changed mode without base is structured exit 2", "changed-mode", () => {
  const repository = createRepository({ "docs/EXAMPLE.md": validDocument() });
  withRepository(repository, ({ root }) => {
    const result = validateRepository({ root, mode: "changed" });
    assertResult(result, 2, "BLOCKED_DOCUMENTATION_VALIDATION_BASE_UNRESOLVED");
    assert.strictEqual(result.errorCode, "BASE_UNRESOLVED");
  });
});
register("changed baseline file blocks", "changed-mode", () => {
  const result = runChanged({
    "README.md": "# Legacy\n",
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [legacyEntry()]),
  }, (root) => {
    const file = path.join(root, "docs/documentation-validation-baseline.json");
    const json = JSON.parse(fs.readFileSync(file));
    json.entries[0].reason = "Changed reason";
    fs.writeFileSync(file, `${JSON.stringify(json)}\n`);
  });
  assertFinding(result, RULES.PROTECTED_BASELINE);
});
register("baseline exemption increase blocks", "changed-mode", () => {
  const result = runChanged({
    "README.md": "# Legacy\n",
    "docs/documentation-validation-baseline.json": baseline("__BASE_COMMIT__", [legacyEntry()]),
  }, (root) => {
    const file = path.join(root, "docs/documentation-validation-baseline.json");
    const json = JSON.parse(fs.readFileSync(file));
    json.entries[0].rules.push(RULES.META_OWNER);
    fs.writeFileSync(file, `${JSON.stringify(json)}\n`);
  });
  assertFinding(result, RULES.BASELINE_REGRESSION);
});

register("baseline legacy inventory requires exact entry", "baseline", () => {
  const repository = createRepository({ "README.md": "# Legacy\n" });
  writeFiles(repository.root, {
    "docs/documentation-validation-baseline.json": baseline(repository.anchor, [], { legacyPaths: ["README.md"] }),
  });
  commitAll(repository.root, "add baseline");
  withRepository(repository, ({ root, anchor }) => {
    assertFinding(validateRepository({ root, mode: "full" }), RULES.BASELINE_NEW);
  });
});
register("baseline glob blocks", "baseline", () => {
  const repository = createRepository({ "docs/OLD.md": "# Old\n" });
  writeFiles(repository.root, {
    "docs/documentation-validation-baseline.json": baseline(repository.anchor, [legacyEntry("docs/*.md")]),
  });
  commitAll(repository.root, "add baseline");
  withRepository(repository, ({ root }) => {
    assertFinding(validateRepository({ root, mode: "full" }), RULES.BASELINE_GLOB);
  });
});
for (const [name, entries] of [
  ["baseline duplicate path", [legacyEntry(), legacyEntry()]],
  ["baseline unknown rule", [legacyEntry("README.md", ["DOC-UNKNOWN-999"])]],
  ["baseline duplicate rule", [legacyEntry("README.md", [RULES.META_STATUS, RULES.META_STATUS])]],
]) register(name, "baseline", () => {
  const repository = createRepository({ "README.md": "# Legacy\n" });
  writeFiles(repository.root, {
    "docs/documentation-validation-baseline.json": baseline(repository.anchor, entries),
  });
  commitAll(repository.root, "add baseline");
  withRepository(repository, ({ root }) => {
    assertFinding(validateRepository({ root, mode: "full" }), RULES.PROTECTED_BASELINE);
  });
});
for (const [name, content, errorCode] of [
  ["malformed baseline JSON", "{", "BASELINE_JSON_INVALID"],
  ["invalid baseline schema", JSON.stringify({ schemaVersion: 2, authority: {}, entries: [] }), "BASELINE_SCHEMA_INVALID"],
  ["missing baseline authority", JSON.stringify({ schemaVersion: 1, entries: [] }), "BASELINE_AUTHORITY_INVALID"],
  ["invalid baseline base commit", JSON.stringify({ schemaVersion: 1, authority: { approvedBy: "Fixture", baseCommit: "bad" }, entries: [] }), "BASELINE_BASE_COMMIT_INVALID"],
]) register(name, "structured-error", () => {
  const result = runFiles({ "docs/documentation-validation-baseline.json": `${content}\n` });
  assertResult(result, 2, "BLOCKED_DOCUMENTATION_VALIDATION_CONFIGURATION");
  assert.strictEqual(result.errorCode, errorCode);
});
register("unsupported mode is structured exit 2", "structured-error", () => {
  const repository = createRepository({});
  withRepository(repository, ({ root }) => {
    const result = validateRepository({ root, mode: "invalid" });
    assertResult(result, 2, "BLOCKED_DOCUMENTATION_VALIDATION_USAGE");
    assert.strictEqual(result.errorCode, "UNSUPPORTED_MODE");
  });
});
register("malformed percent-encoded link is structured finding", "structured-error", () => {
  assertFinding(runFiles({
    "docs/EXAMPLE.md": validDocument("Example", "VALIDATED", "NONE", "[Bad](BAD%ZZ.md)\n"),
  }), RULES.LINK_MISSING);
});

register("defined, implemented, and tested rule registries close", "rule-closure", () => {
  const defined = new Set(Object.values(RULES));
  assert.deepStrictEqual([...IMPLEMENTED_RULES].sort(), [...defined].sort());
  assert.deepStrictEqual([...testedRules].sort(), [...defined].sort());
});

for (const entry of tests) {
  try {
    entry.callback();
    passed += 1;
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) || 0) + 1);
  } catch (error) {
    error.message = `${entry.name}: ${error.message}`;
    throw error;
  }
}

assert.strictEqual(hashTree(fixturesRoot), fixtureHashBefore, "source fixtures were modified");
process.stdout.write(`${JSON.stringify({
  result: "PASS_DOCUMENTATION_VALIDATION_TESTS",
  passed,
  failed: 0,
  categories: Object.fromEntries([...categoryCounts].sort()),
  rulesDefined: Object.values(RULES).length,
  rulesImplemented: IMPLEMENTED_RULES.size,
  rulesTested: testedRules.size,
})}\n`);
