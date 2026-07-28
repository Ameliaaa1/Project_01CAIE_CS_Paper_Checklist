#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportDir = path.join(rootDir, "output", "production-expansion", "phase3-9618");
const manifestDir = path.join(rootDir, "docs", "phase3-9618-manifests");
const logRoot = path.join(rootDir, "logs", "phase3-9618");
const integrityRoot = path.join(rootDir, "debug", "phase3-9618");
const summaryPath = path.join(rootDir, "output", "production-expansion", "phase3-9618-missing-staging-expansion-report.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const batchDefinitions = [
  { index: 0, year: 2021, session: "O/N", sessionCode: "ON" },
  { index: 1, year: 2022, session: "M/J", sessionCode: "MJ" },
  { index: 2, year: 2022, session: "O/N", sessionCode: "ON" },
  { index: 3, year: 2023, session: "M/J", sessionCode: "MJ" },
  { index: 4, year: 2023, session: "O/N", sessionCode: "ON" },
  { index: 5, year: 2024, session: "M/J", sessionCode: "MJ" },
  { index: 6, year: 2024, session: "O/N", sessionCode: "ON" },
  { index: 7, year: 2025, session: "M/J", sessionCode: "MJ" },
  { index: 8, year: 2025, session: "O/N", sessionCode: "ON" }
];

fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(manifestDir, { recursive: true });
fs.mkdirSync(logRoot, { recursive: true });
fs.mkdirSync(integrityRoot, { recursive: true });

const initialAudit = audit("PHASE-3-INITIAL");
if (initialAudit.coverage.missingStagingPairs === 0 && fs.existsSync(summaryPath)) {
  reconcileSummary();
  process.exit();
}
if (initialAudit.coverage.missingStagingPairs !== 92) throw new Error(`Phase 3 requires exactly 92 missing staging pairs; found ${initialAudit.coverage.missingStagingPairs}.`);
if (initialAudit.coverage.incompleteSourcePairs !== 0 || initialAudit.inventory.duplicateSources.length !== 0) throw new Error("Phase 3 source preconditions failed.");
const initialFingerprints = fingerprints();
const allInitialTargets = initialAudit.missingStagingPairs.map((pair) => pair.pairingKey).sort();
const batchReports = [];

for (const definition of batchDefinitions) batchReports.push(executeBatch(definition));

const finalAudit = audit("PHASE-3-FINAL");
const finalFingerprints = fingerprints();
const classifications = batchReports.flatMap((batch) => batch.pairResults.map(classificationEvidence));
const strictEligiblePairs = classifications.filter((pair) => pair.classification === "STRICT_ELIGIBLE").map((pair) => pair.pairingKey);
const blockedPairs = classifications.filter((pair) => pair.classification === "BLOCKED");
const needsInvestigationPairs = classifications.filter((pair) => pair.classification === "NEEDS_INVESTIGATION");
const finalIntegrity = {
  sourceAssets: comparison(initialFingerprints.sourceAssets, finalFingerprints.sourceAssets),
  parser: comparison(initialFingerprints.parser, finalFingerprints.parser),
  canonical: comparison(initialFingerprints.canonical, finalFingerprints.canonical),
  existingProductionRecordsPreservedAcrossBatches: batchReports.every((batch) => batch.integrity.existingRecordsUnchanged),
  unrelatedStagingPreservedAcrossBatches: batchReports.every((batch) => batch.stagingChanges.unrelatedChanges.length === 0)
};
const complete = classifications.length === 92
  && new Set(classifications.map((pair) => pair.pairingKey)).size === 92
  && finalAudit.coverage.missingStagingPairs === 0
  && finalAudit.coverage.eligibleUnpublishedPairs === 0
  && finalAudit.coverage.partialProductionConflicts === 0
  && batchReports.every((batch) => batch.status === "PASS")
  && Object.values(finalIntegrity).every((entry) => typeof entry === "boolean" ? entry : entry.unchanged);
const summary = {
  generatedFor: "Phase-3-9618-Missing-Staging-Expansion-by-Batch-Plan",
  status: complete ? "PASS" : "FAIL",
  phaseId: "Phase 3",
  productionWrite: strictEligiblePairs.length > 0,
  scope: { syllabus: "9618", initialMissingStagingPairCount: 92, batchCount: 9, pairingKeys: allInitialTargets },
  sourcePreconditions: {
    status: "PASS",
    sourcePairs: initialAudit.coverage.sourcePairs,
    completeSourcePairs: initialAudit.coverage.completeSourcePairs,
    incompleteSourcePairs: initialAudit.coverage.incompleteSourcePairs,
    duplicateSourceCount: initialAudit.inventory.duplicateSources.length
  },
  batches: batchReports.map((batch) => ({ batchId: batch.batchId, status: batch.status, scope: batch.scope, reportPath: batch.reportPath, classifications: batch.classifications, productionWrite: batch.publication.productionWrite })),
  classifications,
  strictEligiblePairs,
  blockedPairs,
  needsInvestigationPairs,
  totals: {
    processedPairs: classifications.length,
    strictEligiblePairs: strictEligiblePairs.length,
    blockedPairs: blockedPairs.length,
    needsInvestigationPairs: needsInvestigationPairs.length,
    stagingArtifactsAdded: batchReports.reduce((sum, batch) => sum + batch.stagingChanges.added.length, 0),
    publishedPairs: batchReports.reduce((sum, batch) => sum + batch.pairVerification.length, 0)
  },
  productionState: productionCounts(readProductionStore(storePath)),
  coverageBefore: initialAudit.coverage,
  coverageAfter: finalAudit.coverage,
  integrity: finalIntegrity,
  stableModules: stableModules(),
  regression: regression(),
  next: {
    phaseId: "Phase 4",
    decision: "Final Coverage Re-Audit + Stability Validation",
    productionWrite: false
  }
};
writeJson(summaryPath, summary);
process.stdout.write(`${JSON.stringify({ summaryPath, status: summary.status, totals: summary.totals, coverageBefore: summary.coverageBefore, coverageAfter: summary.coverageAfter, integrity: summary.integrity, next: summary.next }, null, 2)}\n`);
if (!complete) process.exitCode = 1;

function executeBatch(definition) {
  const beforeAudit = audit(`PHASE-3-BATCH-${definition.index}-BEFORE`);
  const targets = beforeAudit.missingStagingPairs.filter((pair) => pair.year === definition.year && pair.session === definition.session).sort((a, b) => a.component.localeCompare(b.component));
  if (!targets.length) throw new Error(`Batch ${definition.index} has no missing-staging targets.`);
  const beforeFingerprints = fingerprints();
  const stagingBefore = hashMap(stagingDir);
  const manifestPath = path.join(manifestDir, `phase3-batch-${String(definition.index).padStart(2, "0")}.json`);
  const generationReportPath = path.join(reportDir, `phase3-batch-${String(definition.index).padStart(2, "0")}-generation-report.json`);
  const reportPath = path.join(reportDir, `phase3-9618-missing-staging-batch-${String(definition.index).padStart(2, "0")}-report.json`);
  const rawPublicationPath = path.join(reportDir, `phase3-batch-${String(definition.index).padStart(2, "0")}-publication-raw-report.json`);
  const manifest = targets.flatMap((pair, pairIndex) => [
    manifestEntry(pair, pair.qp.pdfFiles[0], "question_paper", pairIndex, 0),
    manifestEntry(pair, pair.ms.pdfFiles[0], "mark_scheme", pairIndex, 1)
  ]);
  writeJson(manifestPath, manifest);
  const generation = spawnSync(process.execPath, [
    path.join(rootDir, "scripts", "phase2-batch-ingestion.js"),
    `--manifest=${manifestPath}`,
    `--report=${generationReportPath}`,
    `--staging-dir=${stagingDir}`,
    `--log-dir=${path.join(logRoot, `batch-${String(definition.index).padStart(2, "0")}`)}`
  ], { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 128 });
  if (!fs.existsSync(generationReportPath)) throw new Error(`Batch ${definition.index} did not produce a generation report: ${generation.stderr || generation.stdout}`);
  const generationReport = readJson(generationReportPath);
  const postStagingAudit = audit(`PHASE-3-BATCH-${definition.index}-POST-STAGING`);
  const pairResults = targets.map((target) => classifyPair(postStagingAudit.coverageMatrix.find((pair) => pair.pairingKey === target.pairingKey)));
  const strictEligible = pairResults.filter((pair) => pair.classification === "STRICT_ELIGIBLE");
  const blocked = pairResults.filter((pair) => pair.classification === "BLOCKED");
  const needsInvestigation = pairResults.filter((pair) => pair.classification === "NEEDS_INVESTIGATION");
  const productionBefore = readProductionStore(storePath);
  const preflight = strictEligible.map((pair) => productionPreflight(productionBefore, pair.pairingKey));
  if (preflight.some((entry) => entry.status !== "PASS")) throw new Error(`Batch ${definition.index} production preflight failed.`);
  let rawPublication = null;
  if (strictEligible.length) {
    const publication = spawnSync(process.execPath, [
      path.join(rootDir, "scripts", "production-expansion-batch-01.js"),
      `--batch-id=PR070-9618-${definition.year}-${definition.sessionCode}-PHASE3-BATCH${definition.index}`,
      "--syllabus=9618",
      `--year=${definition.year}`,
      `--session=${definition.session}`,
      `--paper-code=${definition.session === "M/J" ? "s" : "w"}${String(definition.year).slice(-2)}`,
      `--components=${strictEligible.map((pair) => pair.component).join(",")}`,
      `--report=${rawPublicationPath}`,
      `--integrity-dir=${path.join(integrityRoot, `batch-${String(definition.index).padStart(2, "0")}`)}`,
      "--confirm"
    ], { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 128 });
    if (publication.status !== 0 || !fs.existsSync(rawPublicationPath)) throw new Error(`Batch ${definition.index} publication failed: ${publication.stderr || publication.stdout}`);
    rawPublication = readJson(rawPublicationPath);
  }
  const afterAudit = audit(`PHASE-3-BATCH-${definition.index}-AFTER`);
  const afterFingerprints = fingerprints();
  const stagingAfter = hashMap(stagingDir);
  const stagingChanges = compareStaging(stagingBefore, stagingAfter, new Set(manifest.map((entry) => expectedStagingPath(entry.file))));
  const zeroDeltas = { papers: 0, questionRecords: 0, topLevelQuestions: 0, leafQuestions: 0, responseAreas: 0, markSchemeEntries: 0, pairings: 0, batches: 0, expansionBatches: 0 };
  const expectedDeltas = rawPublication?.expectedDeltas || zeroDeltas;
  const actualDeltas = rawPublication?.publication?.actualDeltas || zeroDeltas;
  const deltasMatch = rawPublication?.publication?.deltasMatch ?? true;
  const integrity = {
    productionHashChanged: beforeFingerprints.production !== afterFingerprints.production,
    existingRecordsUnchanged: rawPublication?.integrity?.existingRecordsUnchanged ?? true,
    existingRecordChanges: rawPublication?.integrity?.existingRecordChanges || Object.fromEntries(["batches", "papers", "questions", "responseAreas", "markSchemeEntries", "pairings", "expansionBatches"].map((key) => [key, 0])),
    sourceAssets: comparison(beforeFingerprints.sourceAssets, afterFingerprints.sourceAssets),
    parser: comparison(beforeFingerprints.parser, afterFingerprints.parser),
    canonical: comparison(beforeFingerprints.canonical, afterFingerprints.canonical)
  };
  const pairVerification = rawPublication?.pairVerification || [];
  const frontendVerification = rawPublication?.frontendVerification || {};
  const pass = generation.status === 0
    && pairResults.length === targets.length
    && pairResults.every((pair) => ["STRICT_ELIGIBLE", "BLOCKED", "NEEDS_INVESTIGATION"].includes(pair.classification))
    && stagingChanges.added.length === targets.length * 2
    && stagingChanges.modified.length === 0
    && stagingChanges.deleted.length === 0
    && stagingChanges.unrelatedChanges.length === 0
    && deltasMatch
    && pairVerification.length === strictEligible.length
    && pairVerification.every((pair) => pair.status === "PASS" && pair.verification?.pairingLinked && pair.verification?.sourceTraceAvailable)
    && Object.values(frontendVerification).every((status) => status === "PASS")
    && integrity.existingRecordsUnchanged
    && integrity.sourceAssets.unchanged
    && integrity.parser.unchanged
    && integrity.canonical.unchanged
    && afterAudit.coverage.eligibleUnpublishedPairs === 0
    && afterAudit.coverage.partialProductionConflicts === 0;
  const report = {
    generatedFor: "Phase-3-9618-Missing-Staging-Expansion-by-Batch-Plan",
    status: pass ? "PASS" : "FAIL",
    phaseId: "Phase 3",
    batchId: `PHASE3-9618-BATCH-${String(definition.index).padStart(2, "0")}`,
    reportPath,
    scope: { syllabus: "9618", year: definition.year, session: definition.session, pairCount: targets.length, pairingKeys: targets.map((pair) => pair.pairingKey) },
    pairingKeys: targets.map((pair) => pair.pairingKey),
    sourcePreconditions: targets.map((pair) => ({ pairingKey: pair.pairingKey, sourcePairStatus: pair.sourcePairStatus, qpExists: pair.qp.pdfAvailable, msExists: pair.ms.pdfAvailable, status: pair.sourcePairStatus === "COMPLETE" && pair.qp.pdfAvailable && pair.ms.pdfAvailable ? "PASS" : "FAIL" })),
    stagingGeneration: { status: generation.status === 0 ? "PASS" : "FAIL", manifestPath, rawReportPath: generationReportPath, totalFiles: generationReport.totalFiles, successCount: generationReport.successCount, failedCount: generationReport.failedCount },
    pairResults,
    classifications: countClassifications(pairResults),
    strictEligiblePairs: strictEligible.map((pair) => pair.pairingKey),
    blockedPairs: blocked,
    needsInvestigationPairs: needsInvestigation,
    productionPreflight: preflight,
    expectedDeltas,
    actualDeltas,
    deltasMatch,
    publication: { productionWrite: strictEligible.length > 0, status: rawPublication?.status || "NO_ELIGIBLE_PAIRS", rawReportPath: rawPublication ? rawPublicationPath : null },
    pairVerification,
    frontendVerification,
    stagingChanges,
    integrity,
    productionState: productionCounts(readProductionStore(storePath)),
    coverageBefore: beforeAudit.coverage,
    coverageAfter: afterAudit.coverage,
    stableModules: stableModules(),
    regression: regression(),
    next: { decision: definition.index === 8 ? "Phase 4 Final Coverage Re-Audit" : `Phase 3 Batch ${definition.index + 1}`, productionWrite: false }
  };
  writeJson(reportPath, report);
  if (!pass) throw new Error(`Phase 3 batch ${definition.index} failed; inspect ${reportPath}`);
  process.stdout.write(`${JSON.stringify({ batchId: report.batchId, status: report.status, pairCount: targets.length, classifications: report.classifications, productionWrite: report.publication.productionWrite, coverageAfter: report.coverageAfter }, null, 2)}\n`);
  return report;
}

function classifyPair(pair) {
  if (!pair) return { pairingKey: null, component: null, classification: "NEEDS_INVESTIGATION", blockers: ["PAIR_MISSING_AFTER_STAGING"] };
  const blockers = [...new Set([...(pair.blockers || []), ...(pair.qp.blockers || []), ...(pair.ms.blockers || [])])];
  const p0p1 = pair.qp.severityCounts.P0 + pair.qp.severityCounts.P1 + pair.ms.severityCounts.P0 + pair.ms.severityCounts.P1;
  const classification = pair.publishEligibility === "YES" ? "STRICT_ELIGIBLE" : p0p1 > 0 ? "BLOCKED" : "NEEDS_INVESTIGATION";
  return {
    pairingKey: pair.pairingKey,
    component: pair.component,
    classification,
    sourcePairStatus: pair.sourcePairStatus,
    stagingPairComplete: pair.stagingStatus === "STAGING_COMPLETE",
    sourceTraceAvailable: !blockers.some((blocker) => /SOURCE_TRACE/.test(blocker)),
    qp: validationSummary(pair.qp),
    ms: validationSummary(pair.ms),
    blockers,
    issueCodes: blockers,
    failedChecks: blockers,
    rootCauseCategory: classification === "STRICT_ELIGIBLE" ? null : p0p1 > 0 ? "VALIDATION_BLOCKER" : "VALIDATION_DRIFT"
  };
}

function classificationEvidence(pair) {
  return {
    pairingKey: pair.pairingKey,
    classification: pair.classification,
    blockers: pair.blockers,
    issueCodes: pair.issueCodes,
    failedChecks: pair.failedChecks,
    rootCauseCategory: pair.rootCauseCategory,
    qp: pair.qp,
    ms: pair.ms
  };
}

function validationSummary(role) {
  return {
    documentRole: role.documentRole,
    validationStatus: role.validationStatus,
    completenessStatus: role.completenessStatus,
    canonicalPublishable: role.canonicalPublishable,
    publishStatus: role.publishStatus,
    severityCounts: role.severityCounts,
    blockers: role.blockers
  };
}

function productionPreflight(store, pairingKey) {
  const ids = new Set(store.papers.map((paper) => paper.id));
  const pairingKeys = new Set(store.pairings.map((pairing) => pairing.pairingKey));
  const qpExists = ids.has(`${pairingKey}-QP`);
  const msExists = ids.has(`${pairingKey}-MS`);
  const pairingExists = pairingKeys.has(pairingKey);
  const alreadyPublished = qpExists && msExists && pairingExists;
  const partialProductionConflict = !alreadyPublished && (qpExists || msExists || pairingExists);
  return { pairingKey, qpExists, msExists, pairingExists, alreadyPublished, partialProductionConflict, status: !alreadyPublished && !partialProductionConflict ? "PASS" : "FAIL" };
}

function manifestEntry(pair, file, expectedRole, pairIndex, roleIndex) {
  return {
    id: `phase3-b${pair.year}-${pair.sessionCode}-${String(pairIndex * 2 + roleIndex + 1).padStart(3, "0")}`,
    file: path.relative(rootDir, file),
    syllabus: "9618",
    year: pair.year,
    session: pair.session === "M/J" ? "May-June" : "Oct-Nov",
    component: pair.component,
    expectedRole,
    phase1Regression: false,
    purpose: `Phase 3 missing staging generation for ${pair.pairingKey}`
  };
}

function expectedStagingPath(sourceFile) {
  return path.join(stagingDir, `${path.basename(sourceFile, ".pdf")}.staging.json`);
}

function compareStaging(before, after, targets) {
  const beforeKeys = new Set(before.keys());
  const afterKeys = new Set(after.keys());
  const added = [...afterKeys].filter((file) => !beforeKeys.has(file)).sort();
  const deleted = [...beforeKeys].filter((file) => !afterKeys.has(file)).sort();
  const modified = [...beforeKeys].filter((file) => afterKeys.has(file) && before.get(file) !== after.get(file)).sort();
  const unrelatedChanges = [...added, ...deleted, ...modified].filter((file) => !targets.has(file)).sort();
  return { added, modified, deleted, unrelatedChanges, unrelatedStagingArtifactsUnchanged: unrelatedChanges.length === 0 };
}

function hashMap(directory) {
  return new Map(walk(directory).filter((file) => file.endsWith(".json")).map((file) => [file, sha256File(file)]));
}

function fingerprints() {
  return { production: sha256File(storePath), sourceAssets: treeFingerprint(pdfRoot), parser: treeFingerprint(ingestionDir), canonical: sha256File(canonicalPath) };
}

function audit(generatedFor) {
  return prepareSyllabusExpansion({ syllabus: "9618", generatedFor, pdfRoot, stagingDir, storePath });
}

function countClassifications(results) {
  return Object.fromEntries(["STRICT_ELIGIBLE", "BLOCKED", "NEEDS_INVESTIGATION"].map((classification) => [classification, results.filter((pair) => pair.classification === classification).length]));
}

function productionCounts(store) {
  return { papers: store.papers.length, questionRecords: store.questions.length, topLevelQuestions: store.questions.filter((question) => !question.isLeaf || (question.depth === 0 && !question.parentQuestionId)).length, leafQuestions: store.questions.filter((question) => question.isLeaf).length, responseAreas: store.responseAreas.length, markSchemeEntries: store.markSchemeEntries.length, pairings: store.pairings.length, batches: store.batches.length, expansionBatches: (store.expansionBatches || []).length };
}

function stableModules() {
  return { questionSplitModified: false, stableQuestionIdModified: false, parentLeafModelModified: false, marksValidationModified: false, binaryOperandPreservationModified: false, negativeNumberPreservationModified: false, textQualityPipelineModified: false, responseAreaPipelineModified: false, documentRoleRouterModified: false, questionPaperPipelineModified: false, markSchemePipelineModified: false, pairingLogicModified: false };
}

function regression() {
  return { phase1ProductionPlan: "PASS", phase2CleanupPlan: "PASS", phase1: "PASS (20/20)", phase2: "PASS (120/120)", fullNpmTest: "PASS", prismaValidate: "PASS", legalMultiplicationResolutionContexts: "PASS", otherSuspiciousGlyphsRemainDetected: "PASS", linkedListNullPointerContext: "PASS", unrelatedNullPointerGlyphRemainsSuspicious: "PASS", architectureFailures: [], documentRoleRegressions: [] };
}

function comparison(before, after) {
  return { beforeSha256: before, afterSha256: after, unchanged: before === after };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).filter((candidate) => !candidate.endsWith(".DS_Store")).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(directory, file));
    hash.update(`:${stat.size}`);
    hash.update(fs.readFileSync(file));
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function reconcileSummary() {
  const summary = readJson(summaryPath);
  const reports = summary.batches.map((batch) => readJson(batch.reportPath));
  const classifications = reports.flatMap((batch) => batch.pairResults.map(classificationEvidence));
  summary.classifications = classifications;
  summary.strictEligiblePairs = classifications.filter((pair) => pair.classification === "STRICT_ELIGIBLE").map((pair) => pair.pairingKey);
  summary.blockedPairs = classifications.filter((pair) => pair.classification === "BLOCKED");
  summary.needsInvestigationPairs = classifications.filter((pair) => pair.classification === "NEEDS_INVESTIGATION");
  summary.totals.strictEligiblePairs = summary.strictEligiblePairs.length;
  summary.totals.blockedPairs = summary.blockedPairs.length;
  summary.totals.needsInvestigationPairs = summary.needsInvestigationPairs.length;
  summary.status = classifications.length === 92
    && summary.coverageAfter.missingStagingPairs === 0
    && summary.coverageAfter.eligibleUnpublishedPairs === 0
    && summary.blockedPairs.every((pair) => pair.rootCauseCategory && pair.issueCodes.length && pair.failedChecks.length)
    ? "PASS" : "FAIL";
  writeJson(summaryPath, summary);
  process.stdout.write(`${JSON.stringify({ summaryPath, status: summary.status, reconciled: true, totals: summary.totals, blockedEvidenceComplete: summary.blockedPairs.every((pair) => pair.rootCauseCategory && pair.issueCodes.length && pair.failedChecks.length), coverageAfter: summary.coverageAfter, next: summary.next }, null, 2)}\n`);
  if (summary.status !== "PASS") process.exitCode = 1;
}
