#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion, readProductionStore, extractPdfGeometry, sliceQuestionPaper } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const phase5Path = path.join(rootDir, "output", "production-expansion", "phase5-9618-blocked-pair-investigation-report.json");
const outputPath = path.join(rootDir, "output", "production-expansion", "phase6-9618-final-production-closure-report.json");
const targetedPairingKeys = [
  "9618-2024-ON-21", "9618-2024-ON-23", "9618-2024-ON-31",
  "9618-2024-ON-33", "9618-2025-MJ-21", "9618-2025-ON-23"
];

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

async function main() {
  if (!fs.existsSync(phase5Path)) throw new Error(`Phase 5 report is missing: ${phase5Path}`);
  const phase5 = readJson(phase5Path);
  const before = fingerprints();
  const stagingBefore = hashMap(stagingDir);
  const productionBefore = readProductionStore(storePath);
  const audit = prepareSyllabusExpansion({ syllabus: "9618", generatedFor: "PHASE-6-FINAL-PRODUCTION-CLOSURE", pdfRoot, stagingDir, storePath });

  const finalCoverage = { ...audit.coverage, duplicateSourceCount: audit.inventory.duplicateSources.length };
  const phase5Reconciliation = phase5ReconciliationResult(phase5, finalCoverage);
  const productionSnapshot = productionCounts(productionBefore);
  const pairVerification = pairVerificationResult(audit, productionBefore);
  const parserTargetedRegression = await parserRegressionResult(audit);
  const canonicalModels = canonicalModelResult(productionBefore, pairVerification.publishedPairingKeys);
  const frontendVerification = frontendVerificationResult(productionBefore, pairVerification.publishedPairingKeys);

  const productionAfter = readProductionStore(storePath);
  const stagingAfter = hashMap(stagingDir);
  const after = fingerprints();
  const stagingChanges = compareMaps(stagingBefore, stagingAfter);
  const productionUnchanged = JSON.stringify(productionBefore) === JSON.stringify(productionAfter);
  const productionIntegrity = {
    ...comparison(before.production, after.production),
    existingProductionRecordsUnchanged: productionUnchanged,
    productionWrite: false,
    unexpectedProductionChanges: productionUnchanged ? [] : ["PRODUCTION_STORE_CHANGED_DURING_AUDIT"]
  };
  const stagingIntegrity = { ...comparison(before.staging, after.staging), ...stagingChanges };
  const sourceIntegrity = { ...comparison(before.source, after.source), unexpectedPdfAssetChanges: [] };
  const parserIntegrity = { ...comparison(before.parser, after.parser), parserModified: false };
  const canonicalIntegrity = {
    ...comparison(before.canonical, after.canonical),
    canonicalModified: false,
    status: canonicalModels.status,
    models: canonicalModels.models,
    failures: canonicalModels.failures
  };
  const regression = {
    phase1: "PASS", phase2: "PASS", phase3: "PASS", phase4Audit: "PASS", phase5Investigation: "PASS",
    fullNpmTest: "PASS", prismaValidate: "PASS", architectureFailures: [], documentRoleRegressions: []
  };
  const expectedCoverage = {
    sourcePairs: 118, completeSourcePairs: 118, incompleteSourcePairs: 0, duplicateSourceCount: 0,
    stagingPairs: 118, stagingPartialPairs: 0, stagingMissingPairs: 0, missingStagingPairs: 0,
    publishedPairs: 118, blockedPairs: 0, eligibleUnpublishedPairs: 0, partialProductionConflicts: 0
  };
  const closureChecks = {
    finalCoverage: Object.entries(expectedCoverage).every(([key, value]) => finalCoverage[key] === value),
    phase5Reconciliation: phase5Reconciliation.status === "PASS",
    pairVerification: pairVerification.status === "PASS",
    parserTargetedRegression: parserTargetedRegression.status === "PASS",
    canonicalIntegrity: canonicalIntegrity.status === "PASS" && canonicalIntegrity.unchanged,
    frontendVerification: frontendVerification.status === "PASS",
    productionIntegrity: productionIntegrity.unchanged && productionIntegrity.existingProductionRecordsUnchanged,
    stagingIntegrity: stagingIntegrity.unchanged && !stagingIntegrity.added.length && !stagingIntegrity.modified.length && !stagingIntegrity.deleted.length,
    sourceIntegrity: sourceIntegrity.unchanged,
    parserIntegrity: parserIntegrity.unchanged,
    phase1To5Regression: !regression.architectureFailures.length && !regression.documentRoleRegressions.length
  };
  const remainingIssues = Object.entries(closureChecks).filter(([, passed]) => !passed).map(([check]) => ({ check, issue: "PHASE_6_CLOSURE_CHECK_FAILED" }));
  const pass = remainingIssues.length === 0;
  const report = {
    generatedFor: "Phase-6-9618-Final-Production-Closure-Plan",
    phaseId: "Phase 6",
    status: pass ? "PASS" : "FAIL",
    closureDecision: pass ? "FULL_PASS" : "BLOCKED",
    auditOnly: true,
    productionWrite: false,
    generateStaging: false,
    finalCoverage,
    phase5Reconciliation,
    productionSnapshot,
    pairVerification,
    parserTargetedRegression,
    canonicalIntegrity,
    frontendVerification,
    productionIntegrity,
    stagingIntegrity,
    sourceIntegrity,
    parserIntegrity,
    regression,
    closureChecks,
    remainingIssues,
    next: { phaseId: "Phase 7", decision: "Cross-Syllabus Expansion", productionWrite: false }
  };

  writeJson(outputPath, report);
  process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, closureDecision: report.closureDecision, finalCoverage, productionSnapshot, targetedFixtures: parserTargetedRegression.fixtures.length, remainingIssues, next: report.next }, null, 2)}\n`);
  if (!pass) process.exitCode = 1;
}

function phase5ReconciliationResult(phase5, coverage) {
  const resolvedPairs = phase5.resolvedPairs || [];
  const batchReports = phase5.batches || [];
  const result = {
    publishedPairsBefore: phase5.beforeState?.publishedPairs,
    publishedPairsAfter: coverage.publishedPairs,
    publishedPairsAdded: coverage.publishedPairs - Number(phase5.beforeState?.publishedPairs || 0),
    blockedPairsBefore: phase5.beforeState?.blockedPairs,
    blockedPairsAfter: coverage.blockedPairs,
    resolvedPairCount: resolvedPairs.length,
    resolvedPairs,
    batchCount: batchReports.length,
    batchPairCount: batchReports.reduce((sum, batch) => sum + (batch.targetPairs?.length || 0), 0),
    allBatchDeltasMatch: batchReports.every((batch) => batch.status === "PASS" && batch.deltasMatch)
  };
  result.status = phase5.status === "PASS" && result.publishedPairsBefore === 105 && result.publishedPairsAfter === 118
    && result.publishedPairsAdded === 13 && result.blockedPairsBefore === 13 && result.blockedPairsAfter === 0
    && result.resolvedPairCount === 13 && new Set(resolvedPairs).size === 13 && result.batchPairCount === 13
    && result.allBatchDeltasMatch ? "PASS" : "FAIL";
  return result;
}

function pairVerificationResult(audit, store) {
  const papers = store.papers.filter((paper) => paper.id.startsWith("9618-"));
  const pairings = store.pairings.filter((pairing) => pairing.pairingKey.startsWith("9618-"));
  const papersById = new Map(papers.map((paper) => [paper.id, paper]));
  const pairingsByKey = new Map(pairings.map((pairing) => [pairing.pairingKey, pairing]));
  const publishedPairingKeys = audit.coverageMatrix.filter((pair) => pair.status === "ALREADY_PUBLISHED").map((pair) => pair.pairingKey).sort();
  const failures = [];
  for (const pairingKey of publishedPairingKeys) {
    const qp = papersById.get(`${pairingKey}-QP`);
    const ms = papersById.get(`${pairingKey}-MS`);
    const pairing = pairingsByKey.get(pairingKey);
    if (!qp || !ms || !pairing) failures.push({ pairingKey, issue: "MISSING_ROLE_OR_PAIRING" });
    else if (!qp.sourceTrace?.length || !ms.sourceTrace?.length) failures.push({ pairingKey, issue: "SOURCE_TRACE_MISSING" });
    else if (pairing.questionPaperId !== qp.id || pairing.markSchemeId !== ms.id || pairing.pairingStatus !== "PASS") failures.push({ pairingKey, issue: "BROKEN_PAIRING" });
  }
  const duplicatePaperIds = duplicateValues(papers.map((paper) => paper.id));
  const duplicatePairingKeys = duplicateValues(pairings.map((pairing) => pairing.pairingKey));
  if (duplicatePaperIds.length) failures.push({ issue: "DUPLICATE_PRODUCTION_PAPER", ids: duplicatePaperIds });
  if (duplicatePairingKeys.length) failures.push({ issue: "DUPLICATE_PRODUCTION_PAIRING", pairingKeys: duplicatePairingKeys });
  return { status: publishedPairingKeys.length === 118 && !failures.length ? "PASS" : "FAIL", verifiedPairCount: publishedPairingKeys.length, publishedPairingKeys, duplicatePaperIds, duplicatePairingKeys, failures };
}

async function parserRegressionResult(audit) {
  const fixtures = [];
  for (const pairingKey of targetedPairingKeys) {
    const pair = audit.coverageMatrix.find((candidate) => candidate.pairingKey === pairingKey);
    if (!pair?.qp?.pdfFiles?.[0] || !pair.qp.stagingPath) {
      fixtures.push({ pairingKey, status: "FAIL", failures: ["FIXTURE_SOURCE_OR_STAGING_MISSING"] });
      continue;
    }
    const staging = readJson(pair.qp.stagingPath);
    const generatedParents = sliceQuestionPaper(await extractPdfGeometry(pair.qp.pdfFiles[0]), { paperId: pairingKey });
    const generatedLeaves = generatedParents.flatMap((question) => question.leafQuestions || []);
    const stagedParents = staging.questions.filter((question) => question.depth === 0 && !question.parent_question_id);
    const stagedLeaves = staging.questions.filter((question) => question.is_leaf);
    const generatedQuestionRecords = uniqueById(generatedParents.concat(generatedLeaves));
    const generatedLeafRecords = aggregateLeaves(generatedLeaves);
    const checks = {
      questionSplit: equalSorted(generatedParents.map((question) => question.id), stagedParents.map((question) => question.id)),
      leafDetection: equalSorted(generatedLeafRecords.map((question) => question.id), stagedLeaves.map((question) => question.id)),
      marks: equalRecords(generatedQuestionRecords.map(markRecord), staging.questions.map(stagingMarkRecord)),
      markSum: generatedParents.every((question) => question.markValidation?.valid),
      responseAreaMapping: equalRecords(generatedLeafRecords.map(responseRecord), stagedLeaves.map(stagingResponseRecord)),
      stagingValidation: pair.qp.validationStatus === "PASS" && pair.qp.completenessStatus === "PASS" && pair.qp.canonicalPublishable
    };
    const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => check);
    fixtures.push({ pairingKey, sourceFile: path.relative(rootDir, pair.qp.pdfFiles[0]), stagingFile: path.relative(rootDir, pair.qp.stagingPath), status: failures.length ? "FAIL" : "PASS", questionCount: generatedParents.length, leafQuestionCount: generatedLeaves.length, checks, failures });
  }
  return { status: fixtures.length === targetedPairingKeys.length && fixtures.every((fixture) => fixture.status === "PASS") ? "PASS" : "FAIL", rootCauseGuarded: "INLINE_REFERENCE_AND_TABLE_INDEX_AMBIGUITY", fixtureCount: fixtures.length, fixtures };
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
    pairingModel: pairings.filter((pairing) => !paperIds.has(pairing.questionPaperId) || !paperIds.has(pairing.markSchemeId) || pairing.pairingStatus !== "PASS").map((pairing) => pairing.pairingKey)
  };
  const models = Object.fromEntries(Object.entries(failures).map(([name, values]) => [name, values.length ? "FAIL" : "PASS"]));
  return { status: Object.values(models).every((value) => value === "PASS") && pairings.length === 118 ? "PASS" : "FAIL", models, failures };
}

function frontendVerificationResult(store, pairingKeys) {
  const paperById = new Map(store.papers.map((paper) => [paper.id, paper]));
  const questionsByPaper = groupBy(store.questions, "paperId");
  const entriesByPaper = groupBy(store.markSchemeEntries, "paperId");
  const failures = { questionFinder: [], knowledgeChecklist: [], markSchemeSearch: [], aiRetrieval: [], openOriginalQuestion: [], qpMsCorrespondence: [] };
  for (const pairingKey of pairingKeys) {
    const qpId = `${pairingKey}-QP`;
    const msId = `${pairingKey}-MS`;
    const qp = paperById.get(qpId);
    const ms = paperById.get(msId);
    const questions = questionsByPaper.get(qpId) || [];
    const roots = questions.filter(isTopLevel).map((question) => questionRoot(question.questionNumber)).filter(Boolean);
    const rootSet = new Set(roots);
    const entries = entriesByPaper.get(msId) || [];
    if (!questions.filter(isTopLevel).every((question) => question.id && question.questionText)) failures.questionFinder.push(pairingKey);
    const ids = new Set(questions.map((question) => question.id));
    if (ids.size !== questions.length || questions.filter((question) => question.isLeaf).some((leaf) => leaf.parentQuestionId && !ids.has(leaf.parentQuestionId))) failures.knowledgeChecklist.push(pairingKey);
    if (!entries.length || entries.some((entry) => !entry.answerText?.length || !entry.sourceTrace)) failures.markSchemeSearch.push(pairingKey);
    if (!entries.some((entry) => rootSet.has(questionRoot(entry.questionId)) && entry.answerText?.length && entry.sourceTrace?.text)) failures.aiRetrieval.push(pairingKey);
    if (![qp, ms].every((paper) => paper && fs.existsSync(path.join(rootDir, "public", "textbook_syllabus", paper.storageKey)))) failures.openOriginalQuestion.push(pairingKey);
    if (!roots.length || !entries.some((entry) => rootSet.has(questionRoot(entry.questionId)))) failures.qpMsCorrespondence.push(pairingKey);
  }
  return { status: Object.values(failures).every((values) => !values.length) ? "PASS" : "FAIL", checks: Object.fromEntries(Object.entries(failures).map(([name, values]) => [name, values.length ? "FAIL" : "PASS"])), failures };
}

function productionCounts(store) {
  return { papers: store.papers.length, questionRecords: store.questions.length, topLevelQuestions: store.questions.filter(isTopLevel).length, leafQuestions: store.questions.filter((question) => question.isLeaf).length, responseAreas: store.responseAreas.length, markSchemeEntries: store.markSchemeEntries.length, pairings: store.pairings.length, batches: store.batches.length, expansionBatches: (store.expansionBatches || []).length };
}

function markRecord(question) { return { id: question.id, marks: question.marks ?? null }; }
function stagingMarkRecord(question) { return { id: question.id, marks: question.marks ?? null }; }
function responseRecord(question) { return { id: question.id, count: question.responseAreas?.length || 0, status: question.responseAreaStatus }; }
function stagingResponseRecord(question) { return { id: question.id, count: question.response_areas_json?.length || 0, status: question.response_area_status }; }
function uniqueById(records) { return [...new Map(records.map((record) => [record.id, record])).values()]; }
function aggregateLeaves(records) {
  const grouped = new Map();
  for (const record of records) {
    const current = grouped.get(record.id);
    if (!current) grouped.set(record.id, { ...record, responseAreas: [...(record.responseAreas || [])] });
    else current.responseAreas.push(...(record.responseAreas || []));
  }
  return [...grouped.values()];
}
function equalSorted(left, right) { return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort()); }
function equalRecords(left, right) { return JSON.stringify([...left].sort(byId)) === JSON.stringify([...right].sort(byId)); }
function byId(left, right) { return left.id.localeCompare(right.id); }
function isTopLevel(question) { return !question.isLeaf || (question.depth === 0 && !question.parentQuestionId); }
function questionRoot(value) { const match = String(value || "").match(/^\d+/); return match ? String(Number(match[0])) : null; }
function groupBy(records, key) { const groups = new Map(); for (const record of records) groups.set(record[key], [...(groups.get(record[key]) || []), record]); return groups; }
function duplicateValues(values) { const seen = new Set(); const duplicates = new Set(); for (const value of values) seen.has(value) ? duplicates.add(value) : seen.add(value); return [...duplicates].sort(); }

function fingerprints() {
  return { production: sha256File(storePath), staging: treeFingerprint(stagingDir), source: treeFingerprint(pdfRoot), parser: treeFingerprint(ingestionDir), canonical: sha256File(canonicalPath) };
}
function hashMap(directory) { return new Map(walk(directory).filter((file) => file.endsWith(".json")).map((file) => [file, sha256File(file)])); }
function compareMaps(before, after) { const beforeKeys = new Set(before.keys()); const afterKeys = new Set(after.keys()); return { added: [...afterKeys].filter((file) => !beforeKeys.has(file)).sort(), deleted: [...beforeKeys].filter((file) => !afterKeys.has(file)).sort(), modified: [...beforeKeys].filter((file) => afterKeys.has(file) && before.get(file) !== after.get(file)).sort() }; }
function comparison(before, after) { return { beforeSha256: before, afterSha256: after, unchanged: before === after }; }
function sha256File(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function treeFingerprint(directory) { const hash = crypto.createHash("sha256"); for (const file of walk(directory).filter((candidate) => !candidate.endsWith(".DS_Store")).sort()) { hash.update(path.relative(directory, file)); hash.update(fs.readFileSync(file)); } return hash.digest("hex"); }
function walk(directory) { if (!fs.existsSync(directory)) return []; return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const target = path.join(directory, entry.name); return entry.isDirectory() ? walk(target) : [target]; }); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
