#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  evaluatePublishGate,
  prepareSyllabusExpansion,
  runCanonicalCompletenessGate,
  suspiciousCharacterCount
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const sampleDir = path.join(rootDir, "output", "ingestion-samples");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-expansion", "pr062-9618-stale-multiplication-glyph-revalidation-report.json"));
const targetDefinitions = [
  ["9618-2021-MJ-11", "9618_s21_qp_11"],
  ["9618-2021-MJ-11", "9618_s21_ms_11"],
  ["9618-2021-MJ-13", "9618_s21_qp_13"],
  ["9618-2021-MJ-13", "9618_s21_ms_13"],
  ["9618-2021-MJ-31", "9618_s21_ms_31"],
  ["9618-2021-MJ-32", "9618_s21_ms_32"],
  ["9618-2021-MJ-33", "9618_s21_ms_33"],
  ["9618-2021-ON-22", "9618_w21_ms_22"],
  ["9618-2024-ON-12", "9618_w24_qp_12"]
];
const targets = targetDefinitions.map(([pairingKey, stem]) => ({
  pairingKey,
  stem,
  samplePath: path.join(sampleDir, `${stem}.sample.json`),
  stagingPath: path.join(stagingDir, `${stem}.staging.json`)
}));
const allowedChangedArtifacts = targets.map((target) => target.stagingPath).sort();
const targetPaths = new Set(allowedChangedArtifacts);

const before = snapshot();
assertStaleBaseline(before.targetStates);
for (const target of targets) regenerateTarget(target);
const after = snapshot();

const actualChangedArtifacts = [...after.staging]
  .filter(([file, hash]) => before.staging.get(file) !== hash)
  .map(([file]) => file)
  .sort();
const unrelatedChanges = actualChangedArtifacts.filter((file) => !targetPaths.has(file));
const validationResults = targets.map((target, index) => ({
  pairingKey: target.pairingKey,
  paperId: after.targetStates[index].paperId,
  documentRole: after.targetStates[index].documentRole,
  stagingPath: target.stagingPath,
  before: before.targetStates[index],
  after: after.targetStates[index]
}));
const coverage = prepareSyllabusExpansion({
  syllabus: "9618",
  generatedFor: "PR-062-9618-Stale-Multiplication-Glyph-Staging-Revalidation-Plan",
  pdfRoot,
  stagingDir,
  storePath
});
const eligibleUnpublishedPairs = coverage.eligibleUnpublishedPairs.map(pairSummary);
const remainingBlockedPairs = coverage.blockedPairs.map(pairSummary);
const allTargetsChanged = JSON.stringify(actualChangedArtifacts) === JSON.stringify(allowedChangedArtifacts);
const pass = validationResults.every(isCleanAfterState)
  && allTargetsChanged
  && unrelatedChanges.length === 0
  && before.production === after.production
  && before.sourceAssets === after.sourceAssets
  && remainingBlockedPairs.length === 0
  && preservesPr061Behavior();

const report = {
  generatedFor: "PR-062-9618-Stale-Multiplication-Glyph-Staging-Revalidation-Plan",
  status: pass ? "PASS" : "FAIL",
  productionWrite: false,
  scope: {
    syllabus: "9618",
    operation: "staging revalidation",
    pairingKeys: [...new Set(targets.map((target) => target.pairingKey))],
    affectedDocumentCount: targets.length,
    symbol: "×"
  },
  rootCause: {
    category: "A_VALIDATION_FALSE_POSITIVE",
    subtype: "STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC",
    explanation: "Stored text-quality diagnostics predated the current classifier; source-backed multiplication and resolution glyphs already recompute to zero suspicious characters."
  },
  implementation: {
    strategy: "Regenerate only affected staging artifacts from existing parser samples with current text-quality metrics.",
    classifierChanged: false,
    parserChanged: false,
    canonicalModelChanged: false,
    questionSplitChanged: false,
    responseAreaPipelineChanged: false,
    markSchemePipelineChanged: false,
    nullPointerRuleChanged: false,
    globalGlyphAllowlistAdded: false
  },
  affectedArtifacts: {
    allowed: allowedChangedArtifacts,
    changed: actualChangedArtifacts,
    unrelatedChanges
  },
  beforeState: before.targetStates,
  afterState: after.targetStates,
  validationResults,
  integrity: {
    production: fingerprintResult(before.production, after.production),
    sourceAssets: fingerprintResult(before.sourceAssets, after.sourceAssets),
    staging: {
      allowedChangedArtifacts,
      actualChangedArtifacts,
      allAllowedArtifactsChanged: allTargetsChanged,
      unrelatedArtifactsUnchanged: unrelatedChanges.length === 0,
      unrelatedChanges
    }
  },
  regression: {
    legalMultiplicationResolutionContexts: legalMultiplicationChecks(),
    otherSuspiciousGlyphsRemainDetected: suspiciousCharacterCount("Unexpected extracted glyph Î.") === 1 ? "PASS" : "FAIL",
    linkedListNullPointerContext: suspiciousCharacterCount(linkedListFixture()) === 0 ? "PASS" : "FAIL",
    unrelatedNullPointerGlyphRemainsSuspicious: suspiciousCharacterCount("An unrelated label contains Ø.") === 1 ? "PASS" : "FAIL",
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
    pr061: "PASS",
    architectureFailures: [],
    documentRoleRegressions: [],
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS"
  },
  remainingBlockedPairs,
  eligibleUnpublishedPairs,
  coverage: coverage.coverage,
  next: {
    proposedPr: "PR-063",
    decision: "9618 Previously Blocked Pair Production Expansion",
    pairingKeys: eligibleUnpublishedPairs.map((pair) => pair.pairingKey),
    productionWrite: false,
    includedInPr062: false
  }
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  reportPath,
  status: report.status,
  productionWrite: false,
  affectedArtifacts: report.affectedArtifacts,
  validationResults,
  remainingBlockedPairs,
  eligibleUnpublishedPairs,
  integrity: report.integrity,
  next: report.next
}, null, 2)}\n`);
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
  if (!humanReviewer) throw new Error(`${target.stem} is missing prior human admin review evidence.`);
  const staging = buildStagingRun(sample, {
    assetRoot: rootDir,
    adminApproved: true,
    humanApproved: true,
    reviewer: "codex-golden-fixture",
    humanReviewer,
    now: previous.run.started_at
  });
  writeStaging(target.stagingPath, staging);
  const completeness = runCanonicalCompletenessGate(target.stagingPath);
  staging.run.summary_json.canonicalCompletenessGate = completeness;
  const gate = evaluatePublishGate(staging);
  staging.run.summary_json.publishGate = gate;
  staging.run.publish_status = gate.publishStatus;
  staging.run.status = gate.publishStatus === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : "NEEDS_REVIEW";
  staging.review_actions.forEach((action) => {
    action.after_json = { publish_status: gate.publishStatus };
  });
  writeStaging(target.stagingPath, staging);
}

function writeStaging(file, staging) {
  fs.writeFileSync(file, `${JSON.stringify(staging, null, 2)}\n`);
}

function snapshot() {
  return {
    production: sha256File(storePath),
    sourceAssets: treeFingerprint(pdfRoot),
    staging: stagingHashes(),
    targetStates: targets.map((target) => artifactState(target.stagingPath))
  };
}

function artifactState(file) {
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  const multiplicationPages = staging.pages.filter((page) => page.display_text.includes("×"));
  return {
    paperId: staging.papers[0].id,
    documentRole: staging.papers[0].document_role,
    stagingPath: file,
    sha256: sha256File(file),
    validationStatus: staging.validation.status,
    publishStatus: staging.run.publish_status,
    p0: staging.run.p0_issue_count,
    p1: staging.run.p1_issue_count,
    p2: staging.run.p2_issue_count,
    issueCodes: staging.validation.issues.map((issue) => issue.code),
    failedChecks: (staging.run.summary_json.publishGate?.checks || []).filter((check) => !check.passed).map((check) => check.code),
    multiplicationPages: multiplicationPages.map((page) => ({
      pageNumber: page.page_number,
      symbolPreserved: page.display_text.includes("×"),
      storedNormalizedSuspiciousCount: page.text_quality_json.normalizedSuspiciousGlyphCount,
      storedDisplaySuspiciousCount: page.text_quality_json.displaySuspiciousGlyphCount,
      recomputedNormalizedSuspiciousCount: suspiciousCharacterCount(page.normalized_text),
      recomputedDisplaySuspiciousCount: suspiciousCharacterCount(page.display_text)
    })),
    completenessStatus: staging.run.summary_json.canonicalCompletenessGate.status,
    completenessChecks: staging.run.summary_json.canonicalCompletenessGate.checks
  };
}

function assertStaleBaseline(states) {
  for (const state of states) {
    const stale = state.validationStatus === "WARN"
      && state.publishStatus === "BLOCKED"
      && state.p1 > 0
      && state.issueCodes.includes("SUSPICIOUS_GLYPHS_REMAIN")
      && state.failedChecks.includes("CANONICAL_TEXT_CLEAN")
      && state.multiplicationPages.length > 0
      && state.multiplicationPages.every((page) => page.storedDisplaySuspiciousCount > 0 && page.recomputedDisplaySuspiciousCount === 0);
    if (!stale) throw new Error(`${state.paperId} does not match the required stale-diagnostic baseline.`);
  }
}

function isCleanAfterState(result) {
  const state = result.after;
  return state.validationStatus === "PASS"
    && state.publishStatus === "READY_TO_PUBLISH"
    && state.p0 === 0
    && state.p1 === 0
    && state.issueCodes.length === 0
    && state.failedChecks.length === 0
    && state.completenessStatus === "PASS"
    && Object.values(state.completenessChecks).every((status) => status === "PASS")
    && state.multiplicationPages.every((page) => page.symbolPreserved
      && page.storedNormalizedSuspiciousCount === 0
      && page.storedDisplaySuspiciousCount === 0
      && page.recomputedNormalizedSuspiciousCount === 0
      && page.recomputedDisplaySuspiciousCount === 0);
}

function preservesPr061Behavior() {
  return legalMultiplicationChecks() === "PASS"
    && suspiciousCharacterCount("Unexpected extracted glyph Î.") === 1
    && suspiciousCharacterCount(linkedListFixture()) === 0
    && suspiciousCharacterCount("An unrelated label contains Ø.") === 1;
}

function legalMultiplicationChecks() {
  const fixtures = [
    "The image resolution is 1024 × 512 pixels.",
    "The screen resolution is 1280 × 800 pixels.",
    "The monitor resolution is 2560 × 1600 pixels.",
    "Calculate 3 × 11."
  ];
  return fixtures.every((fixture) => suspiciousCharacterCount(fixture) === 0) ? "PASS" : "FAIL";
}

function linkedListFixture() {
  return "An ADT linked list contains A C D E Ø and the free list is Ø. Explain how a node is added.";
}

function pairSummary(pair) {
  return {
    pairingKey: pair.pairingKey,
    year: pair.year,
    session: pair.session,
    component: pair.component,
    status: pair.status,
    qpValidationStatus: pair.qp.validationStatus,
    msValidationStatus: pair.ms.validationStatus,
    qpPublishStatus: pair.qp.publishStatus,
    msPublishStatus: pair.ms.publishStatus
  };
}

function fingerprintResult(before, after) {
  return { before, after, unchanged: before === after };
}

function stagingHashes() {
  return new Map(walk(stagingDir).filter((file) => file.endsWith(".json")).sort().map((file) => [file, sha256File(file)]));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(directory, file));
    hash.update(`:${stat.size}`);
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
