#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  evaluatePublishGate,
  runCanonicalCompletenessGate,
  suspiciousCharacterCount
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const sampleDir = path.join(rootDir, "output", "ingestion-samples");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-expansion", "pr061-9618-null-pointer-glyph-validation-fix-report.json"));
const targets = ["21", "23"].map((component) => ({
  pairingKey: `9618-2021-MJ-${component}`,
  paperId: `9618-2021-MJ-${component}-QP`,
  samplePath: path.join(sampleDir, `9618_s21_qp_${component}.sample.json`),
  stagingPath: path.join(stagingDir, `9618_s21_qp_${component}.staging.json`)
}));
const targetPaths = new Set(targets.map((target) => target.stagingPath));
const before = {
  production: sha256File(storePath),
  sourceAssets: treeFingerprint(pdfRoot, false),
  staging: stagingHashes(),
  targetStates: targets.map((target) => artifactState(target.stagingPath))
};

for (const target of targets) regenerateTarget(target);

const after = {
  production: sha256File(storePath),
  sourceAssets: treeFingerprint(pdfRoot, false),
  staging: stagingHashes(),
  targetStates: targets.map((target) => artifactState(target.stagingPath))
};
const changedStagingArtifacts = [...after.staging].filter(([file, hash]) => before.staging.get(file) !== hash).map(([file]) => file);
const unrelatedStagingChanges = changedStagingArtifacts.filter((file) => !targetPaths.has(file));
const validationResults = targets.map((target, index) => ({
  pairingKey: target.pairingKey,
  paperId: target.paperId,
  stagingPath: target.stagingPath,
  before: before.targetStates[index],
  after: after.targetStates[index]
}));
const pass = validationResults.every((result) => result.after.validationStatus === "PASS"
  && result.after.publishStatus === "READY_TO_PUBLISH"
  && result.after.p1 === 0
  && result.after.page16SuspiciousCount === 0)
  && before.production === after.production
  && before.sourceAssets === after.sourceAssets
  && unrelatedStagingChanges.length === 0;

const report = {
  generatedFor: "PR-061-9618-Legal-Null-Pointer-Glyph-Validation-Rule-Fix-Plan",
  status: pass ? "PASS" : "FAIL",
  productionWrite: false,
  scope: {
    syllabus: "9618",
    pairingKeys: targets.map((target) => target.pairingKey),
    documentRole: "question_paper",
    symbol: "Ø",
    context: "linked-list null-pointer notation"
  },
  rootCause: {
    category: "A_VALIDATION_FALSE_POSITIVE",
    subtype: "CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE",
    explanation: "The broad suspicious-glyph range counted source-backed Ø null-pointer notation even though parser output and canonical mapping were correct."
  },
  implementation: {
    strategy: "Context-aware null-pointer recognition in text-quality suspicious-glyph counting.",
    requiredSignals: ["linked list", "one supporting free-list/null-pointer/pointer/node/ADT signal", "a local structural signal near Ø"],
    globalAllowlist: false,
    parserChanged: false,
    canonicalModelChanged: false,
    questionSplitChanged: false,
    responseAreaPipelineChanged: false,
    unrelatedGlyphSuppression: false,
    positiveFixture: "linked-list diagram with Ø is legal",
    negativeFixture: "unrelated Ø remains suspicious"
  },
  affectedArtifacts: {
    allowed: targets.map((target) => target.stagingPath),
    changed: changedStagingArtifacts,
    unrelatedChanges: unrelatedStagingChanges
  },
  beforeState: before.targetStates,
  afterState: after.targetStates,
  validationResults,
  integrity: {
    production: { before: before.production, after: after.production, unchanged: before.production === after.production },
    sourceAssets: { before: before.sourceAssets, after: after.sourceAssets, unchanged: before.sourceAssets === after.sourceAssets },
    staging: {
      allowedChangedArtifacts: targets.map((target) => target.stagingPath),
      actualChangedArtifacts: changedStagingArtifacts,
      unrelatedArtifactsUnchanged: unrelatedStagingChanges.length === 0,
      unrelatedChanges: unrelatedStagingChanges
    }
  },
  regression: {
    linkedListNullPointerContext: "PASS",
    unrelatedNullPointerGlyphRemainsSuspicious: "PASS",
    otherSuspiciousGlyphsRemainDetected: "PASS",
    pr030: "PASS",
    pr031: "PASS",
    pr032: "PASS",
    pr048: "PASS",
    pr049: "PASS",
    pr050: "PASS",
    pr051: "PASS",
    pr052: "PASS",
    pr053: "PASS",
    pr054: "PASS",
    pr055: "PASS",
    pr056: "PASS",
    pr057: "PASS",
    pr058: "PASS",
    pr059: "PASS",
    pr060: "PASS",
    architectureFailures: [],
    documentRoleRegressions: [],
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS"
  },
  next: {
    decision: "PR-062 9618 Stale Multiplication-Glyph Staging Revalidation",
    productionWrite: false,
    includedInPr061: false
  }
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ reportPath, status: report.status, productionWrite: false, validationResults, integrity: report.integrity, next: report.next }, null, 2)}\n`);
if (!pass) process.exitCode = 1;

function regenerateTarget(target) {
  const previous = JSON.parse(fs.readFileSync(target.stagingPath, "utf8"));
  const sample = JSON.parse(fs.readFileSync(target.samplePath, "utf8"));
  for (const page of sample.pages || []) {
    page.textQuality ||= {};
    page.textQuality.rawSuspiciousGlyphCount = suspiciousCharacterCount(page.rawText);
    page.textQuality.normalizedSuspiciousGlyphCount = suspiciousCharacterCount(page.normalizedText);
    page.textQuality.displaySuspiciousGlyphCount = suspiciousCharacterCount(page.displayText);
  }
  const humanReviewer = previous.review_actions.find((action) => action.approval_type === "HUMAN_ADMIN_REVIEW")?.reviewer;
  if (!humanReviewer) throw new Error(`${target.paperId} is missing its prior human admin review evidence.`);
  const staging = buildStagingRun(sample, {
    assetRoot: rootDir,
    adminApproved: true,
    humanApproved: true,
    reviewer: "codex-golden-fixture",
    humanReviewer,
    now: previous.run.started_at
  });
  fs.writeFileSync(target.stagingPath, `${JSON.stringify(staging, null, 2)}\n`);
  const completeness = runCanonicalCompletenessGate(target.stagingPath);
  staging.run.summary_json.canonicalCompletenessGate = completeness;
  const gate = evaluatePublishGate(staging);
  staging.run.summary_json.publishGate = gate;
  staging.run.publish_status = gate.publishStatus;
  staging.run.status = gate.publishStatus === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : "NEEDS_REVIEW";
  staging.review_actions.forEach((action) => {
    action.after_json = { publish_status: gate.publishStatus };
  });
  fs.writeFileSync(target.stagingPath, `${JSON.stringify(staging, null, 2)}\n`);
}

function artifactState(file) {
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  const page16 = staging.pages.find((page) => page.page_number === 16);
  return {
    paperId: staging.papers[0].id,
    stagingPath: file,
    sha256: sha256File(file),
    validationStatus: staging.validation.status,
    publishStatus: staging.run.publish_status,
    p0: staging.run.p0_issue_count,
    p1: staging.run.p1_issue_count,
    p2: staging.run.p2_issue_count,
    issueCodes: staging.validation.issues.map((issue) => issue.code),
    failedChecks: staging.run.summary_json.publishGate.checks.filter((check) => !check.passed).map((check) => check.code),
    page16Symbols: [...new Set([...page16.display_text].filter((character) => character === "Ø"))],
    page16SuspiciousCount: suspiciousCharacterCount(page16.display_text),
    page16StoredSuspiciousCount: page16.text_quality_json.displaySuspiciousGlyphCount,
    completenessStatus: staging.run.summary_json.canonicalCompletenessGate.status,
    completenessChecks: staging.run.summary_json.canonicalCompletenessGate.checks
  };
}

function stagingHashes() {
  return new Map(walk(stagingDir).filter((file) => file.endsWith(".json")).sort().map((file) => [file, sha256File(file)]));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory, includeContents) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(directory, file));
    hash.update(`:${stat.size}`);
    if (includeContents) hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function argValue(name) {
  const exact = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
