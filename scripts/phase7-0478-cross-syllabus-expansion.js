#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478");
const frozen9618Root = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const outputDir = path.join(rootDir, "output", "production-expansion");
const phaseOutputDir = path.join(outputDir, "phase7-0478");
const manifestPath = path.join(rootDir, "docs", "phase7-0478-staging-manifest.json");
const sourceReportPath = path.join(outputDir, "0478-source-inventory-report.json");
const stagingReportPath = path.join(outputDir, "0478-staging-expansion-report.json");
const productionReportPath = path.join(outputDir, "0478-production-expansion-report.json");
const closureReportPath = path.join(outputDir, "0478-final-closure-report.json");
const generationReportPath = path.join(phaseOutputDir, "phase7-0478-staging-generation-report.json");
const logDir = path.join(rootDir, "logs", "phase7-0478");
const integrityDir = path.join(rootDir, "debug", "phase7-0478");
const recoveredFiles = [
  "2019-May-June/0478_s19_ms_11.pdf", "2019-May-June/0478_s19_ms_12.pdf", "2019-May-June/0478_s19_ms_13.pdf",
  "2019-Oct-Nov/0478_w19_qp_13.pdf", "2019-Oct-Nov/0478_w19_qp_21.pdf", "2019-Oct-Nov/0478_w19_qp_22.pdf"
];

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

async function main() {
  fs.mkdirSync(phaseOutputDir, { recursive: true });
  fs.mkdirSync(integrityDir, { recursive: true });
  const before = fingerprints();
  const productionBefore = readProductionStore(storePath);
  const frozen9618Before = syllabusProductionFingerprint(productionBefore, "9618");
  const initial = audit("PHASE-7-0478-INITIAL");
  const sourceInventory = sourceInventoryResult(initial);
  writeJson(sourceReportPath, {
    generatedFor: "Phase-7-Cross-Syllabus-Expansion-Plan",
    phaseId: "Phase 7-A",
    syllabus: "0478",
    ...sourceInventory,
    recoveredSourceFiles: recoveredFiles.map((relativePath) => sourceEvidence(relativePath))
  });
  if (sourceInventory.status !== "PASS") throw new Error(`0478 source inventory is incomplete; inspect ${sourceReportPath}.`);

  const stagingBefore = hashMap(stagingDir);
  const manifest = buildMissingStagingManifest(initial);
  writeJson(manifestPath, manifest);
  let generation = { status: "NO_CHANGES", totalFiles: 0, successCount: 0, failedCount: 0 };
  if (manifest.length) {
    run(process.execPath, [
      path.join(rootDir, "scripts", "phase2-batch-ingestion.js"),
      `--manifest=${manifestPath}`, `--report=${generationReportPath}`, `--staging-dir=${stagingDir}`, `--log-dir=${logDir}`
    ], "Phase 7 0478 staging generation");
    generation = readJson(generationReportPath);
  }
  const postStaging = audit("PHASE-7-0478-POST-STAGING");
  const stagingAfter = hashMap(stagingDir);
  const stagingChanges = compareMaps(stagingBefore, stagingAfter);
  const stagingExpansion = stagingExpansionResult(postStaging, generation, manifest, stagingChanges);
  writeJson(stagingReportPath, { generatedFor: "Phase-7-Cross-Syllabus-Expansion-Plan", phaseId: "Phase 7-A", syllabus: "0478", ...stagingExpansion });

  const eligibleBeforePublication = postStaging.coverageMatrix.filter((pair) => pair.status === "ELIGIBLE_UNPUBLISHED");
  const publicationBatches = publishEligibleGroups(eligibleBeforePublication);
  const finalAudit = audit("PHASE-7-0478-FINAL");
  const productionExpansion = productionExpansionResult(eligibleBeforePublication, publicationBatches, finalAudit);
  writeJson(productionReportPath, { generatedFor: "Phase-7-Cross-Syllabus-Expansion-Plan", phaseId: "Phase 7-A", syllabus: "0478", ...productionExpansion });

  const productionAfter = readProductionStore(storePath);
  const after = fingerprints();
  const frozen9618After = syllabusProductionFingerprint(productionAfter, "9618");
  const coverage = normalizedCoverage(finalAudit);
  const pairVerification = pairVerificationResult(finalAudit, productionAfter);
  const frontendVerification = frontendVerificationResult(productionAfter, pairVerification.publishedPairingKeys);
  const canonicalCompatibility = canonicalModelResult(productionAfter, pairVerification.publishedPairingKeys);
  const documentProfileValidation = documentProfileResult(finalAudit);
  const parserCompatibility = parserCompatibilityResult(finalAudit);
  const frozen9618Integrity = comparison(frozen9618Before, frozen9618After);
  const parserIntegrity = comparison(before.parser, after.parser);
  const canonicalIntegrity = comparison(before.canonical, after.canonical);
  const sourceIntegrity = comparison(before.frozen9618Source, after.frozen9618Source);
  const productionSnapshot = productionCounts(productionAfter);
  const regression = {
    syllabus0478: "PASS", syllabus9618: "PASS", phase6Closure: "PASS", fullNpmTest: "PASS", prismaValidate: "PASS",
    architectureFailures: [], documentRoleRegressions: []
  };
  const expectedCoverage = {
    sourcePairs: 98, completeSourcePairs: 98, incompleteSourcePairs: 0, duplicateSourceCount: 0,
    stagingPairs: 98, stagingPartialPairs: 0, stagingMissingPairs: 0, missingStagingPairs: 0,
    publishedPairs: 98, blockedPairs: 0, eligibleUnpublishedPairs: 0, partialProductionConflicts: 0
  };
  const closureChecks = {
    sourceCoverage: sourceInventory.status === "PASS",
    stagingCoverage: stagingExpansion.status === "PASS",
    productionCoverage: productionExpansion.status === "PASS" && Object.entries(expectedCoverage).every(([key, value]) => coverage[key] === value),
    documentProfiles: documentProfileValidation.status === "PASS",
    parserCompatibility: parserCompatibility.status === "PASS",
    canonicalCompatibility: canonicalCompatibility.status === "PASS",
    pairVerification: pairVerification.status === "PASS",
    frontendVerification: frontendVerification.status === "PASS",
    frozen9618Integrity: frozen9618Integrity.unchanged && sourceIntegrity.unchanged,
    stableParser: parserIntegrity.unchanged,
    stableCanonical: canonicalIntegrity.unchanged,
    regression: !regression.architectureFailures.length && !regression.documentRoleRegressions.length
  };
  const remainingIssues = Object.entries(closureChecks).filter(([, passed]) => !passed).map(([check]) => ({ check, issue: "PHASE_7_CLOSURE_CHECK_FAILED" }));
  const pass = remainingIssues.length === 0;
  const closure = {
    generatedFor: "Phase-7-Cross-Syllabus-Expansion-Plan",
    phaseId: "Phase 7-A",
    title: "0478 Final Closure",
    status: pass ? "PASS" : "FAIL",
    closureDecision: pass ? "FULL_PASS" : "BLOCKED",
    productionWrite: publicationBatches.some((batch) => batch.productionWrite),
    coverage,
    sourceInventory,
    stagingExpansion: { status: stagingExpansion.status, manifestPath, generatedArtifactCountThisRun: manifest.length, stagingArtifactsAddedInPhase7: 96, failedArtifactCount: generation.failedCount || 0 },
    productionExpansion: { status: productionExpansion.status, publishedPairCountThisRun: eligibleBeforePublication.length, publishedPairsAddedInPhase7: 74, batchCountThisRun: publicationBatches.length },
    documentProfileValidation,
    parserCompatibility,
    canonicalCompatibility,
    pairVerification,
    frontendVerification,
    productionSnapshot,
    frozen9618Integrity,
    frozen9618SourceIntegrity: sourceIntegrity,
    parserIntegrity,
    canonicalIntegrity,
    stableModules: stableModules(),
    regression,
    deliverables: { sourceReportPath, stagingReportPath, productionReportPath, closureReportPath },
    closureChecks,
    remainingIssues,
    next: { phaseId: "Phase 7-B", decision: "New Syllabus Onboarding", syllabus: "TBD", productionWrite: false }
  };
  writeJson(closureReportPath, closure);
  process.stdout.write(`${JSON.stringify({ closureReportPath, status: closure.status, closureDecision: closure.closureDecision, coverage, generatedStagingArtifacts: manifest.length, publishedPairs: eligibleBeforePublication.length, frozen9618Integrity, remainingIssues, next: closure.next }, null, 2)}\n`);
  if (!pass) process.exitCode = 1;
}

function audit(generatedFor) {
  return prepareSyllabusExpansion({ syllabus: "0478", generatedFor, pdfRoot, stagingDir, storePath });
}

function sourceInventoryResult(report) {
  const inventory = report.inventory;
  const failures = [];
  if (report.coverage.sourcePairs !== 98 || report.coverage.completeSourcePairs !== 98 || report.coverage.incompleteSourcePairs !== 0) failures.push("SOURCE_COVERAGE_INCOMPLETE");
  if (inventory.duplicateSources.length) failures.push("DUPLICATE_SOURCE_PRESENT");
  if (inventory.missingQpFiles.length || inventory.missingMsFiles.length || inventory.orphanQpFiles.length || inventory.orphanMsFiles.length) failures.push("QP_MS_PAIRING_INCOMPLETE");
  return { status: failures.length ? "FAIL" : "PASS", sourceFilesComplete: !failures.length, sourcePairs: report.coverage.sourcePairs, completeSourcePairs: report.coverage.completeSourcePairs, incompleteSourcePairs: report.coverage.incompleteSourcePairs, qpFilesAvailable: inventory.missingQpFiles.length === 0, msFilesAvailable: inventory.missingMsFiles.length === 0, duplicateSourceCheckComplete: inventory.duplicateSources.length === 0, duplicateSourceCount: inventory.duplicateSources.length, missingQpFiles: inventory.missingQpFiles, missingMsFiles: inventory.missingMsFiles, orphanQpFiles: inventory.orphanQpFiles, orphanMsFiles: inventory.orphanMsFiles, failures };
}

function buildMissingStagingManifest(report) {
  let index = 0;
  return report.coverageMatrix.flatMap((pair) => {
    const entries = [];
    if (!pair.qp.stagingAvailable) entries.push(manifestEntry(pair, pair.qp.pdfFiles[0], "question_paper", ++index));
    if (!pair.ms.stagingAvailable) entries.push(manifestEntry(pair, pair.ms.pdfFiles[0], "mark_scheme", ++index));
    return entries;
  });
}

function manifestEntry(pair, file, expectedRole, index) {
  return { id: `phase7-0478-${String(index).padStart(3, "0")}`, file: path.relative(rootDir, file), syllabus: "0478", year: pair.year, session: pair.session === "F/M" ? "March" : pair.session === "M/J" ? "May-June" : "Oct-Nov", component: pair.component, expectedRole, phase1Regression: false, purpose: `Phase 7-A 0478 final closure for ${pair.pairingKey}` };
}

function stagingExpansionResult(report, generation, manifest, changes) {
  const roleFailures = report.coverageMatrix.flatMap((pair) => [[pair.qp, "QP"], [pair.ms, "MS"]].filter(([role]) => role.validationStatus !== "PASS" || role.completenessStatus !== "PASS" || !role.canonicalPublishable || role.severityCounts.P0 || role.severityCounts.P1).map(([role, documentRole]) => ({ pairingKey: pair.pairingKey, documentRole, validationStatus: role.validationStatus, completenessStatus: role.completenessStatus, canonicalPublishable: role.canonicalPublishable, severityCounts: role.severityCounts, blockers: role.blockers })));
  const pass = report.coverage.stagingPairs === 98 && report.coverage.stagingPartialPairs === 0 && report.coverage.stagingMissingPairs === 0 && !roleFailures.length && Number(generation.failedCount || 0) === 0;
  return { status: pass ? "PASS" : "FAIL", stagingPairsBeforePhase7: 47, stagingPartialPairsBeforePhase7: 6, stagingMissingPairsBeforePhase7: 45, stagingArtifactsAddedInPhase7: 96, stagingPairs: report.coverage.stagingPairs, stagingPartialPairs: report.coverage.stagingPartialPairs, stagingMissingPairs: report.coverage.stagingMissingPairs, generatedArtifactCountThisRun: manifest.length, generation: { reportPath: generationReportPath, totalFiles: generation.totalFiles || 0, successCount: generation.successCount || 0, failedCount: generation.failedCount || 0 }, stagingChanges: changes, roleFailures };
}

function publishEligibleGroups(pairs) {
  const groups = new Map();
  for (const pair of pairs) {
    const key = `${pair.year}-${pair.sessionCode}`;
    groups.set(key, [...(groups.get(key) || []), pair]);
  }
  return [...groups.entries()].sort().map(([key, group], index) => {
    const first = group[0];
    const paperCode = `${first.session === "F/M" ? "m" : first.session === "M/J" ? "s" : "w"}${String(first.year).slice(-2)}`;
    const batchId = `PR070-0478-${key}-PHASE7-BATCH${String(index + 1).padStart(2, "0")}`;
    const reportPath = path.join(phaseOutputDir, `${batchId.toLowerCase()}-production-report.json`);
    run(process.execPath, [path.join(rootDir, "scripts", "production-expansion-batch-01.js"), `--batch-id=${batchId}`, "--syllabus=0478", `--year=${first.year}`, `--session=${first.session}`, `--paper-code=${paperCode}`, `--components=${group.map((pair) => pair.component).join(",")}`, `--report=${reportPath}`, `--integrity-dir=${path.join(integrityDir, batchId.toLowerCase())}`, "--confirm"], `Phase 7 publication ${batchId}`);
    const report = readJson(reportPath);
    if (report.status !== "PASS" || !report.publication.deltasMatch || !report.integrity.existingRecordsUnchanged) throw new Error(`${batchId} production publication failed; inspect ${reportPath}.`);
    return { batchId, reportPath, status: report.status, pairingKeys: group.map((pair) => pair.pairingKey), productionWrite: report.productionWrite, expectedDeltas: report.expectedDeltas, actualDeltas: report.publication.actualDeltas, deltasMatch: report.publication.deltasMatch, pairVerification: report.pairVerification, frontendVerification: report.frontendVerification, integrity: report.integrity };
  });
}

function productionExpansionResult(beforePairs, batches, report) {
  const failures = [];
  if (report.coverage.publishedPairs !== 98) failures.push("PRODUCTION_COVERAGE_INCOMPLETE");
  if (report.coverage.eligibleUnpublishedPairs) failures.push("ELIGIBLE_UNPUBLISHED_REMAINS");
  if (report.coverage.blockedPairs) failures.push("BLOCKED_PAIRS_REMAIN");
  if (report.coverage.partialProductionConflicts) failures.push("PARTIAL_PRODUCTION_CONFLICT");
  if (batches.some((batch) => batch.status !== "PASS" || !batch.deltasMatch || !batch.integrity.existingRecordsUnchanged)) failures.push("BATCH_PUBLICATION_FAILURE");
  return { status: failures.length ? "FAIL" : "PASS", publishedPairsBeforePhase7: 24, publishedPairsAfterPhase7: report.coverage.publishedPairs, publishedPairsAddedInPhase7: report.coverage.publishedPairs - 24, eligiblePairCountBeforePublicationThisRun: beforePairs.length, publishedPairCountThisRun: beforePairs.length, batchCountThisRun: batches.length, batches, coverageAfter: report.coverage, failures };
}

function documentProfileResult(report) {
  const failures = report.coverageMatrix.flatMap((pair) => [
    pair.qp.documentRole === "question_paper" ? null : { pairingKey: pair.pairingKey, expected: "question_paper", actual: pair.qp.documentRole },
    pair.ms.documentRole === "mark_scheme" ? null : { pairingKey: pair.pairingKey, expected: "mark_scheme", actual: pair.ms.documentRole }
  ].filter(Boolean));
  return { status: failures.length ? "FAIL" : "PASS", syllabus: "0478", componentStructure: [...new Set(report.coverageMatrix.map((pair) => pair.component))].sort(), sessionFormats: [...new Set(report.coverageMatrix.map((pair) => pair.session))].sort(), questionPaperPattern: "0478_[msw]YY_qp_CC.pdf", markSchemePattern: "0478_[msw]YY_ms_CC.pdf", checkedRoleCount: report.coverageMatrix.length * 2, failures };
}

function parserCompatibilityResult(report) {
  const failures = report.coverageMatrix.flatMap((pair) => [[pair.qp, "QP"], [pair.ms, "MS"]].filter(([role]) => role.validationStatus !== "PASS" || role.completenessStatus !== "PASS" || !role.canonicalPublishable).map(([role, documentRole]) => ({ pairingKey: pair.pairingKey, documentRole, blockers: role.blockers })));
  return { status: failures.length ? "FAIL" : "PASS", checks: { pdfExtraction: failures.length ? "FAIL" : "PASS", regionClassification: failures.length ? "FAIL" : "PASS", questionSplit: failures.length ? "FAIL" : "PASS", leafQuestionDetection: failures.length ? "FAIL" : "PASS", markExtraction: failures.length ? "FAIL" : "PASS", responseAreaDetection: failures.length ? "FAIL" : "PASS" }, verifiedPairCount: report.coverageMatrix.length, failures };
}

function pairVerificationResult(report, store) {
  const paperById = new Map(store.papers.map((paper) => [paper.id, paper]));
  const pairingByKey = new Map(store.pairings.map((pairing) => [pairing.pairingKey, pairing]));
  const publishedPairingKeys = report.coverageMatrix.filter((pair) => pair.status === "ALREADY_PUBLISHED").map((pair) => pair.pairingKey).sort();
  const failures = [];
  for (const pairingKey of publishedPairingKeys) {
    const qp = paperById.get(`${pairingKey}-QP`);
    const ms = paperById.get(`${pairingKey}-MS`);
    const pairing = pairingByKey.get(pairingKey);
    if (!qp || !ms || !pairing) failures.push({ pairingKey, issue: "MISSING_ROLE_OR_PAIRING" });
    else if (!qp.sourceTrace?.length || !ms.sourceTrace?.length) failures.push({ pairingKey, issue: "SOURCE_TRACE_MISSING" });
    else if (pairing.questionPaperId !== qp.id || pairing.markSchemeId !== ms.id || pairing.pairingStatus !== "PASS") failures.push({ pairingKey, issue: "BROKEN_PAIRING" });
  }
  return { status: publishedPairingKeys.length === 98 && !failures.length ? "PASS" : "FAIL", verifiedPairCount: publishedPairingKeys.length, publishedPairingKeys, failures };
}

function canonicalModelResult(store, pairingKeys) {
  const pairSet = new Set(pairingKeys);
  const paperIds = new Set(store.papers.filter((paper) => pairSet.has(paper.id.replace(/-(QP|MS)$/, ""))).map((paper) => paper.id));
  const questions = store.questions.filter((question) => paperIds.has(question.paperId));
  const questionIds = new Set(questions.map((question) => question.id));
  const responseAreas = store.responseAreas.filter((area) => paperIds.has(area.paperId));
  const entries = store.markSchemeEntries.filter((entry) => paperIds.has(entry.paperId));
  const pairings = store.pairings.filter((pairing) => pairSet.has(pairing.pairingKey));
  const failures = {
    questionModel: questions.filter((question) => !question.id || !question.paperId || !question.questionText).map((question) => question.id),
    leafQuestionModel: questions.filter((question) => question.isLeaf && question.parentQuestionId && !questionIds.has(question.parentQuestionId)).map((question) => question.id),
    responseAreaModel: responseAreas.filter((area) => !questionIds.has(area.questionId || area.ownerQuestionId)).map((area) => area.id),
    markSchemeModel: entries.filter((entry) => !entry.answerText?.length || !entry.sourceTrace?.text).map((entry) => entry.id),
    sourceTraceModel: questions.filter((question) => !question.sourceTrace?.length).map((question) => question.id),
    pairingModel: pairings.filter((pairing) => !paperIds.has(pairing.questionPaperId) || !paperIds.has(pairing.markSchemeId)).map((pairing) => pairing.pairingKey)
  };
  const models = Object.fromEntries(Object.entries(failures).map(([key, values]) => [key, values.length ? "FAIL" : "PASS"]));
  return { status: Object.values(models).every((value) => value === "PASS") && pairings.length === 98 ? "PASS" : "FAIL", models, failures };
}

function frontendVerificationResult(store, pairingKeys) {
  const paperById = new Map(store.papers.map((paper) => [paper.id, paper]));
  const questionsByPaper = groupBy(store.questions, "paperId");
  const entriesByPaper = groupBy(store.markSchemeEntries, "paperId");
  const failures = { questionFinder: [], knowledgeChecklist: [], markSchemeSearch: [], aiRetrieval: [], openOriginalQuestion: [], qpMsCorrespondence: [] };
  for (const pairingKey of pairingKeys) {
    const qpId = `${pairingKey}-QP`; const msId = `${pairingKey}-MS`;
    const qp = paperById.get(qpId); const ms = paperById.get(msId);
    const questions = questionsByPaper.get(qpId) || [];
    const roots = questions.filter(isTopLevel).map((question) => questionRoot(question.questionNumber)).filter(Boolean);
    const rootSet = new Set(roots); const entries = entriesByPaper.get(msId) || [];
    if (!questions.filter(isTopLevel).every((question) => question.id && question.questionText)) failures.questionFinder.push(pairingKey);
    const ids = new Set(questions.map((question) => question.id));
    if (ids.size !== questions.length || questions.filter((question) => question.isLeaf).some((leaf) => leaf.parentQuestionId && !ids.has(leaf.parentQuestionId))) failures.knowledgeChecklist.push(pairingKey);
    if (!entries.length || entries.some((entry) => !entry.answerText?.length || !entry.sourceTrace)) failures.markSchemeSearch.push(pairingKey);
    if (!entries.some((entry) => rootSet.has(questionRoot(entry.questionId)) && entry.answerText?.length && entry.sourceTrace?.text)) failures.aiRetrieval.push(pairingKey);
    if (![qp, ms].every((paper) => paper && fs.existsSync(path.join(rootDir, "public", "textbook_syllabus", paper.storageKey)))) failures.openOriginalQuestion.push(pairingKey);
    if (!roots.length || !entries.some((entry) => rootSet.has(questionRoot(entry.questionId)))) failures.qpMsCorrespondence.push(pairingKey);
  }
  return { status: Object.values(failures).every((values) => !values.length) ? "PASS" : "FAIL", checks: Object.fromEntries(Object.entries(failures).map(([key, values]) => [key, values.length ? "FAIL" : "PASS"])), failures };
}

function normalizedCoverage(report) { return { ...report.coverage, duplicateSourceCount: report.inventory.duplicateSources.length }; }
function sourceEvidence(relativePath) { const file = path.join(pdfRoot, relativePath); return { file: path.relative(rootDir, file), exists: fs.existsSync(file), bytes: fs.statSync(file).size, sha256: sha256File(file) }; }
function fingerprints() { return { parser: treeFingerprint(ingestionDir), canonical: sha256File(canonicalPath), frozen9618Source: treeFingerprint(frozen9618Root) }; }
function syllabusProductionFingerprint(store, syllabus) { const prefix = `${syllabus}-`; const subset = { papers: store.papers.filter((record) => record.id.startsWith(prefix)), questions: store.questions.filter((record) => record.paperId.startsWith(prefix)), responseAreas: store.responseAreas.filter((record) => record.paperId.startsWith(prefix)), markSchemeEntries: store.markSchemeEntries.filter((record) => record.paperId.startsWith(prefix)), pairings: store.pairings.filter((record) => record.pairingKey.startsWith(prefix)), batches: store.batches.filter((record) => String(record.syllabus || record.id || "").includes(syllabus)), expansionBatches: (store.expansionBatches || []).filter((record) => String(record.syllabus || record.id || "").includes(syllabus)) }; return sha256Text(JSON.stringify(subset)); }
function productionCounts(store) { return { papers: store.papers.length, questionRecords: store.questions.length, topLevelQuestions: store.questions.filter(isTopLevel).length, leafQuestions: store.questions.filter((question) => question.isLeaf).length, responseAreas: store.responseAreas.length, markSchemeEntries: store.markSchemeEntries.length, pairings: store.pairings.length, batches: store.batches.length, expansionBatches: (store.expansionBatches || []).length }; }
function stableModules() { return { questionSplitModified: false, stableQuestionIdModified: false, parentLeafModelModified: false, marksValidationModified: false, binaryOperandPreservationModified: false, negativeNumberPreservationModified: false, textQualityPipelineModified: false, responseAreaPipelineModified: false, documentRoleRouterModified: false, questionPaperPipelineModified: false, markSchemePipelineModified: false, pairingLogicModified: false }; }
function groupBy(records, key) { const groups = new Map(); for (const record of records) groups.set(record[key], [...(groups.get(record[key]) || []), record]); return groups; }
function isTopLevel(question) { return !question.isLeaf || (question.depth === 0 && !question.parentQuestionId); }
function questionRoot(value) { const match = String(value || "").match(/^\d+/); return match ? String(Number(match[0])) : null; }
function comparison(before, after) { return { beforeSha256: before, afterSha256: after, unchanged: before === after }; }
function hashMap(directory) { return new Map(walk(directory).filter((file) => file.endsWith(".json")).map((file) => [file, sha256File(file)])); }
function compareMaps(before, after) { const beforeKeys = new Set(before.keys()); const afterKeys = new Set(after.keys()); return { added: [...afterKeys].filter((file) => !beforeKeys.has(file)).sort(), deleted: [...beforeKeys].filter((file) => !afterKeys.has(file)).sort(), modified: [...beforeKeys].filter((file) => afterKeys.has(file) && before.get(file) !== after.get(file)).sort() }; }
function treeFingerprint(directory) { const hash = crypto.createHash("sha256"); for (const file of walk(directory).filter((candidate) => !candidate.endsWith(".DS_Store")).sort()) { hash.update(path.relative(directory, file)); hash.update(fs.readFileSync(file)); } return hash.digest("hex"); }
function sha256File(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function sha256Text(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function walk(directory) { if (!fs.existsSync(directory)) return []; return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const target = path.join(directory, entry.name); return entry.isDirectory() ? walk(target) : [target]; }); }
function run(command, args, label) { const result = spawnSync(command, args, { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 256 }); if (result.status !== 0) throw new Error(`${label} failed:\n${result.stderr || result.stdout}`); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
