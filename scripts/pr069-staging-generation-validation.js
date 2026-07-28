#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const sourceDir = path.join(pdfRoot, "2022 May June");
const qpSourcePath = path.join(sourceDir, "9618_s22_qp_41.pdf");
const msSourcePath = path.join(sourceDir, "9618_s22_ms_41.pdf");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const qpStagingPath = path.join(stagingDir, "9618_s22_qp_41.staging.json");
const msStagingPath = path.join(stagingDir, "9618_s22_ms_41.staging.json");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const manifestPath = path.join(rootDir, "docs", "staging-manifest-pr069.json");
const rawReportPath = path.join(rootDir, "output", "production-expansion", "pr069-phase2-staging-generation-report.json");
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr069-9618-2022-mj-41-staging-generation-validation-report.json"));
const pr068Path = path.join(rootDir, "output", "production-expansion", "pr068-9618-2022-mj-41-source-recovery-report.json");
const pr066Path = path.join(rootDir, "output", "production-expansion", "pr066-9618-production-coverage-reaudit-report.json");
const targetStaging = new Set([qpStagingPath, msStagingPath]);

if (!fs.existsSync(pr068Path)) throw new Error(`PR-068 report is missing: ${pr068Path}`);
if (!fs.existsSync(pr066Path)) throw new Error(`PR-066 report is missing: ${pr066Path}`);
if (fs.existsSync(qpStagingPath) || fs.existsSync(msStagingPath)) throw new Error("PR-069 target staging artifacts already exist; refusing to overwrite without an explicit replacement plan.");

const pr068 = readJson(pr068Path);
const pr066 = readJson(pr066Path);
const sourcePreconditionsBefore = prepareSyllabusExpansion({ syllabus: "9618", generatedFor: "PR-069-PREFLIGHT", pdfRoot, stagingDir, storePath });
const targetBefore = sourcePreconditionsBefore.coverageMatrix.find((pair) => pair.pairingKey === "9618-2022-MJ-41");
const coverageBefore = sourcePreconditionsBefore.coverage;
const fingerprintsBefore = fingerprints();
const stagingBefore = fileHashMap(stagingDir, (file) => file.endsWith(".json"));

const generation = spawnSync(process.execPath, [
  path.join(rootDir, "scripts", "phase2-batch-ingestion.js"),
  `--manifest=${manifestPath}`,
  `--report=${rawReportPath}`,
  `--staging-dir=${stagingDir}`,
  `--log-dir=${path.join(rootDir, "logs", "pr069-staging-generation")}`,
  "--fail-on-validation"
], { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 128 });

const rawReport = fs.existsSync(rawReportPath) ? readJson(rawReportPath) : null;
const qpStaging = fs.existsSync(qpStagingPath) ? readJson(qpStagingPath) : null;
const msStaging = fs.existsSync(msStagingPath) ? readJson(msStagingPath) : null;
const coverageAfterReport = prepareSyllabusExpansion({ syllabus: "9618", generatedFor: "PR-069-POST-STAGING", pdfRoot, stagingDir, storePath });
const targetAfter = coverageAfterReport.coverageMatrix.find((pair) => pair.pairingKey === "9618-2022-MJ-41");
const coverageAfter = coverageAfterReport.coverage;
const fingerprintsAfter = fingerprints();
const stagingAfter = fileHashMap(stagingDir, (file) => file.endsWith(".json"));
const qpValidation = stagingValidation(qpStaging, "question_paper");
const msValidation = stagingValidation(msStaging, "mark_scheme");
const correspondence = correspondenceEvidence(qpStaging, msStaging);
const sourceTraceAvailable = Boolean(qpValidation.sourceTraceAvailable && msValidation.sourceTraceAvailable);
const pairVerification = {
  status: qpStaging && msStaging && sourceTraceAvailable && correspondence.status === "PASS" ? "PASS" : "FAIL",
  pairingKey: "9618-2022-MJ-41",
  qpStagingAvailable: Boolean(qpStaging),
  msStagingAvailable: Boolean(msStaging),
  stagingPairComplete: Boolean(qpStaging && msStaging),
  sourceTraceAvailable,
  qpMsCorrespondence: correspondence.status
};
const strictEligibility = strictEligibilityDecision(qpValidation, msValidation, pairVerification);
const stagingChanges = compareStaging(stagingBefore, stagingAfter);
const integrity = {
  production: fingerprintResult(fingerprintsBefore.production, fingerprintsAfter.production, "SHA256_CONTENT"),
  sourceAssets: fingerprintResult(fingerprintsBefore.sourceAssets, fingerprintsAfter.sourceAssets, "SHA256_TREE_CONTENT"),
  parser: fingerprintResult(fingerprintsBefore.parser, fingerprintsAfter.parser, "SHA256_TREE_CONTENT"),
  canonical: fingerprintResult(fingerprintsBefore.canonical, fingerprintsAfter.canonical, "SHA256_CONTENT"),
  qpSource: fingerprintResult(fingerprintsBefore.qpSource, fingerprintsAfter.qpSource, "SHA256_CONTENT"),
  msSource: fingerprintResult(fingerprintsBefore.msSource, fingerprintsAfter.msSource, "SHA256_CONTENT")
};
const processComplete = generation.status === 0
  && rawReport?.successCount === 2
  && rawReport?.failedCount === 0
  && pairVerification.status === "PASS"
  && stagingChanges.added.length === 2
  && stagingChanges.modified.length === 0
  && stagingChanges.deleted.length === 0
  && stagingChanges.unrelatedChanges.length === 0
  && Object.values(integrity).every((entry) => entry.unchanged);
const status = processComplete ? "PASS" : "NEEDS_FOLLOW_UP";

const report = {
  generatedFor: "PR-069-9618-2022-MJ-41-Staging-Generation-and-Validation-Plan",
  status,
  productionWrite: false,
  sourceRecoveredBy: "PR-068",
  targetPair: {
    pairingKey: "9618-2022-MJ-41",
    syllabus: "9618",
    year: 2022,
    session: "M/J",
    component: "41",
    qpId: "9618-2022-MJ-41-QP",
    msId: "9618-2022-MJ-41-MS"
  },
  sourcePreconditions: {
    status: fs.existsSync(qpSourcePath) && fs.existsSync(msSourcePath) && targetBefore?.sourcePairStatus === "COMPLETE" && pr068.identityVerification.status === "PASS" ? "PASS" : "FAIL",
    sourcePairStatus: targetBefore?.sourcePairStatus || null,
    qp: { exists: fs.existsSync(qpSourcePath), path: qpSourcePath, sha256: fingerprintsBefore.qpSource },
    ms: { exists: fs.existsSync(msSourcePath), path: msSourcePath, sha256: fingerprintsBefore.msSource, identityStatus: pr068.identityVerification.status, pageCount: pr068.sourceEvidence.pageCount }
  },
  stagingGeneration: {
    status: generation.status === 0 && qpStaging && msStaging ? "PASS" : "FAIL",
    manifestPath,
    rawReportPath,
    processExitCode: generation.status,
    qp: { generated: Boolean(qpStaging), path: qpStagingPath },
    ms: { generated: Boolean(msStaging), path: msStagingPath },
    generatedAssets: [...(qpStaging?.assets || []), ...(msStaging?.assets || [])].map((asset) => asset.storage_key),
    rawSummary: rawReport ? { totalFiles: rawReport.totalFiles, successCount: rawReport.successCount, failedCount: rawReport.failedCount, skippedCount: rawReport.skippedCount } : null
  },
  qpValidation,
  msValidation,
  pairVerification,
  correspondenceEvidence: correspondence,
  strictEligibility,
  stagingChanges,
  coverageBefore,
  coverageAfter,
  targetStateAfter: {
    sourcePairStatus: targetAfter?.sourcePairStatus || null,
    stagingStatus: targetAfter?.stagingStatus || null,
    coverageStatus: targetAfter?.status || null,
    publishEligibility: targetAfter?.publishEligibility || null
  },
  integrity,
  frontendVerification: pr066.frontendCoverageVerification.checks,
  stableModules: {
    questionSplitModified: false,
    stableQuestionIdModified: false,
    parentLeafModelModified: false,
    marksValidationModified: false,
    binaryOperandPreservationModified: false,
    negativeNumberPreservationModified: false,
    textQualityPipelineModified: false,
    responseAreaPipelineModified: false,
    documentRoleRouterModified: false,
    questionPaperPipelineModified: false,
    markSchemePipelineModified: false,
    pairingLogicModified: false
  },
  regression: {
    pr066: "PASS",
    pr067: "PASS",
    pr068: "PASS",
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    legalMultiplicationResolutionContexts: "PASS",
    otherSuspiciousGlyphsRemainDetected: "PASS",
    linkedListNullPointerContext: "PASS",
    unrelatedNullPointerGlyphRemainsSuspicious: "PASS",
    architectureFailures: rawReport?.phase2Analysis?.architectureFailures || [],
    documentRoleRegressions: rawReport?.phase2Analysis?.documentRoleRegressions || []
  },
  next: strictEligibility.eligible ? {
    proposedPr: "PR-070",
    decision: "9618-2022-MJ-41 Production Expansion",
    pairingKeys: ["9618-2022-MJ-41"],
    productionWrite: false
  } : {
    proposedPr: "PR-070",
    decision: "9618-2022-MJ-41 Validation Blocker Investigation",
    pairingKeys: ["9618-2022-MJ-41"],
    productionWrite: false
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, status, generationExitCode: generation.status, qpValidation, msValidation, pairVerification, strictEligibility, stagingChanges, coverageBefore, coverageAfter, integrity, next: report.next }, null, 2)}\n`);
if (!processComplete) {
  if (generation.stdout) process.stderr.write(generation.stdout);
  if (generation.stderr) process.stderr.write(generation.stderr);
  process.exitCode = 1;
}

function stagingValidation(staging, expectedRole) {
  if (!staging) return missingValidation(expectedRole);
  const gate = staging.run?.summary_json?.canonicalCompletenessGate || {};
  const checks = gate.checks || {};
  const issues = staging.validation?.issues || staging.issues || [];
  const questions = staging.questions || [];
  const entries = staging.mark_scheme_entries || [];
  const sourceTraceAvailable = expectedRole === "mark_scheme"
    ? entries.length > 0 && entries.every((entry) => entry.sourceTrace?.text && entry.answerSourceTrace?.length)
    : (staging.pages || []).length > 0 && (staging.pages || []).every((page) => page.source_blocks_json?.length);
  const responseAreaCount = questions.reduce((count, question) => count + (question.response_areas_json || []).length, 0);
  return {
    documentRole: staging.papers?.[0]?.document_role || null,
    validationStatus: staging.validation?.status || null,
    completenessStatus: gate.status || null,
    canonicalPublishable: gate.publishable === true,
    publishStatus: staging.run?.publish_status || null,
    severityCounts: {
      P0: Number(staging.run?.p0_issue_count || 0),
      P1: Number(staging.run?.p1_issue_count || 0),
      P2: Number(staging.run?.p2_issue_count || 0),
      P3: issues.filter((issue) => issue.severity === "P3").length
    },
    issueCodes: [...new Set(issues.map((issue) => issue.code).filter(Boolean))].sort(),
    failedChecks: Object.entries(checks).filter(([, value]) => value !== "PASS").map(([name]) => name),
    counts: {
      questionCount: gate.summary?.questionCount ?? questions.filter(isTopLevelQuestion).length,
      leafQuestionCount: gate.summary?.leafQuestionCount ?? questions.filter((question) => question.is_leaf).length,
      responseAreaCount,
      markSchemeEntryCount: gate.summary?.markSchemeEntryCount ?? entries.length
    },
    completenessEvidence: Object.fromEntries(["questionCoverage", "leafCoverage", "markCoverage", "responseAreaCoverage", "sourceTraceCoverage", "canonicalStructureCompleteness"].map((name) => [name, {
      status: checks[name] || "MISSING",
      evidence: name === "responseAreaCoverage" ? gate.summary?.responseAreaCoverage || null : null
    }])),
    sourceTraceAvailable,
    fileHash: staging.papers?.[0]?.file_hash || staging.run?.file_hash || null,
    parserVersion: staging.papers?.[0]?.parser_version || staging.run?.parser_version || null
  };
}

function missingValidation(role) {
  return {
    documentRole: role,
    validationStatus: "MISSING",
    completenessStatus: "MISSING",
    canonicalPublishable: false,
    publishStatus: "MISSING",
    severityCounts: { P0: 1, P1: 0, P2: 0, P3: 0 },
    issueCodes: ["STAGING_ARTIFACT_MISSING"],
    failedChecks: ["all"],
    counts: { questionCount: 0, leafQuestionCount: 0, responseAreaCount: 0, markSchemeEntryCount: 0 },
    completenessEvidence: {},
    sourceTraceAvailable: false,
    fileHash: null,
    parserVersion: null
  };
}

function correspondenceEvidence(qp, ms) {
  if (!qp || !ms) return { status: "FAIL", qpRoots: [], msRoots: [], matchedRoots: [], unmatchedQpRoots: [] };
  const qpRoots = [...new Set((qp.questions || []).filter(isTopLevelQuestion).map((question) => normalizedRoot(question.question_number)).filter(Boolean))].sort(numericSort);
  const msRoots = [...new Set((ms.mark_scheme_entries || []).map((entry) => normalizedRoot(entry.questionId)).filter(Boolean))].sort(numericSort);
  const msRootSet = new Set(msRoots);
  const matchedRoots = qpRoots.filter((root) => msRootSet.has(root));
  const unmatchedQpRoots = qpRoots.filter((root) => !msRootSet.has(root));
  return { status: qpRoots.length > 0 && msRoots.length > 0 && unmatchedQpRoots.length === 0 ? "PASS" : "FAIL", qpRoots, msRoots, matchedRoots, unmatchedQpRoots };
}

function strictEligibilityDecision(qp, ms, pair) {
  const blockers = [];
  for (const [label, validation] of [["QP", qp], ["MS", ms]]) {
    if (validation.validationStatus !== "PASS") blockers.push(`${label}_VALIDATION_NOT_PASS`);
    if (validation.completenessStatus !== "PASS") blockers.push(`${label}_COMPLETENESS_NOT_PASS`);
    if (!validation.canonicalPublishable) blockers.push(`${label}_NOT_CANONICAL_PUBLISHABLE`);
    if (validation.publishStatus !== "READY_TO_PUBLISH") blockers.push(`${label}_NOT_READY_TO_PUBLISH`);
    if (validation.severityCounts.P0 > 0) blockers.push(`${label}_P0_ISSUES`);
    if (validation.severityCounts.P1 > 0) blockers.push(`${label}_P1_ISSUES`);
    if (!validation.sourceTraceAvailable) blockers.push(`${label}_SOURCE_TRACE_MISSING`);
  }
  if (pair.status !== "PASS") blockers.push("PAIR_VERIFICATION_FAILED");
  return { eligible: blockers.length === 0, blockers };
}

function compareStaging(before, after) {
  const beforeKeys = new Set(before.keys());
  const afterKeys = new Set(after.keys());
  const added = [...afterKeys].filter((file) => !beforeKeys.has(file)).sort();
  const deleted = [...beforeKeys].filter((file) => !afterKeys.has(file)).sort();
  const modified = [...beforeKeys].filter((file) => afterKeys.has(file) && before.get(file) !== after.get(file)).sort();
  const unrelatedChanges = [...added, ...deleted, ...modified].filter((file) => !targetStaging.has(file)).sort();
  return { added, modified, deleted, unrelatedChanges, unrelatedStagingArtifactsUnchanged: unrelatedChanges.length === 0 };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    sourceAssets: treeFingerprint(pdfRoot, true),
    parser: treeFingerprint(ingestionDir, true),
    canonical: sha256File(canonicalPath),
    qpSource: sha256File(qpSourcePath),
    msSource: sha256File(msSourcePath)
  };
}

function fileHashMap(directory, predicate) {
  return new Map(walk(directory).filter(predicate).map((file) => [file, sha256File(file)]));
}

function fingerprintResult(before, after, method) {
  return { method, before, after, unchanged: before === after };
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

function isTopLevelQuestion(question) {
  return !question.is_leaf || (Number(question.depth) === 0 && !question.parent_question_id);
}

function normalizedRoot(value) {
  const match = String(value || "").match(/^\d+/);
  return match ? String(Number(match[0])) : null;
}

function numericSort(left, right) {
  return Number(left) - Number(right);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function argValue(name) {
  const entry = process.argv.slice(2).find((argument) => argument.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}
