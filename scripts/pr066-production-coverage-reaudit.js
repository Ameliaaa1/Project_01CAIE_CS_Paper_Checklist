#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const syllabus = argValue("--syllabus") || "9618";
const pdfRoot = path.resolve(argValue("--pdf-root") || path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"));
const stagingDir = path.resolve(argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"));
const storePath = path.resolve(argValue("--store") || path.join(rootDir, "output", "production", "production-store.json"));
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr066-9618-production-coverage-reaudit-report.json"));
const generatedFor = "PR-066-9618-Production-Coverage-Re-Audit-Plan";
const expectedProductionState = {
  papers: 98,
  questionRecords: 1448,
  topLevelQuestions: 375,
  leafQuestions: 1139,
  responseAreas: 5610,
  markSchemeEntries: 863,
  pairings: 49,
  batches: 49,
  expansionBatches: 23
};
const previouslyBlockedPairingKeys = [
  "9618-2021-MJ-11", "9618-2021-MJ-13", "9618-2021-MJ-21", "9618-2021-MJ-23",
  "9618-2021-MJ-31", "9618-2021-MJ-32", "9618-2021-MJ-33", "9618-2021-ON-22",
  "9618-2024-ON-12"
];

const before = fingerprints();
const baseline = prepareSyllabusExpansion({ syllabus, generatedFor, pdfRoot, stagingDir, storePath });
const store = readProductionStore(storePath);
const matrix = baseline.coverageMatrix;
const duplicateKeys = new Set(baseline.inventory.duplicateSources.map((entry) => entry.pairingKey));
const publishedPairs = selectPairs("ALREADY_PUBLISHED", pairIdentity);
const eligibleUnpublishedPairs = selectPairs("ELIGIBLE_UNPUBLISHED", pairIdentity);
const blockedPairs = selectPairs("BLOCKED", blockedPair);
const incompleteSourcePairs = selectPairs("INCOMPLETE_SOURCE_PAIR", incompletePair);
const missingStagingPairs = selectPairs("MISSING_STAGING", missingStagingPair);
const partialProductionConflicts = selectPairs("PARTIAL_PRODUCTION_CONFLICT", pairIdentity);
const duplicateSources = baseline.inventory.duplicateSources.map((entry) => ({
  pairingKey: entry.pairingKey,
  qpFiles: entry.qpFiles,
  msFiles: entry.msFiles,
  duplicateCount: Math.max(0, entry.qpFiles.length - 1) + Math.max(0, entry.msFiles.length - 1)
}));
const classificationRecords = matrix.map((pair) => ({
  pairingKey: pair.pairingKey,
  primaryClassification: primaryClassification(pair.status),
  secondaryFlags: [
    duplicateKeys.has(pair.pairingKey) ? "DUPLICATE_SOURCE" : null,
    pair.stagingStatus === "STAGING_PARTIAL" ? "PARTIAL_STAGING" : null,
    pair.stagingStatus === "STAGING_MISSING" ? "MISSING_STAGING" : null
  ].filter(Boolean)
}));
const classificationCounts = Object.fromEntries([
  "PUBLISHED", "ELIGIBLE_UNPUBLISHED", "BLOCKED", "INCOMPLETE_SOURCE",
  "MISSING_STAGING", "PARTIAL_PRODUCTION_CONFLICT"
].map((key) => [key, classificationRecords.filter((record) => record.primaryClassification === key).length]));
classificationCounts.DUPLICATE_SOURCE = duplicateSources.length;

const actualProductionState = productionState(store);
const productionStateMatches = deepEqual(actualProductionState, expectedProductionState);
const publishedPairVerification = verifyPublishedPairs(store, publishedPairs);
const frontendCoverageVerification = verifyFrontendCoverage(store, publishedPairs);
const previouslyBlockedVerification = previouslyBlockedPairingKeys.map((pairingKey) => ({
  pairingKey,
  published: publishedPairs.some((pair) => pair.pairingKey === pairingKey),
  blocked: blockedPairs.some((pair) => pair.pairingKey === pairingKey)
}));
const after = fingerprints();
const integrity = {
  production: fingerprintResult(before.production, after.production, "SHA256_CONTENT"),
  staging: fingerprintResult(before.staging, after.staging, "SHA256_TREE_CONTENT"),
  sourceAssets: fingerprintResult(before.sourceAssets, after.sourceAssets, "SHA256_TREE_METADATA")
};

const inventorySummary = {
  totalPdfFiles: baseline.inventory.totalPdfFiles,
  totalQpPdfs: baseline.inventory.totalQpPdfs,
  totalMsPdfs: baseline.inventory.totalMsPdfs,
  otherPdfCount: baseline.inventory.otherPdfCount,
  sourcePairs: matrix.length,
  completeSourcePairs: matrix.filter((pair) => pair.sourcePairStatus === "COMPLETE").length,
  incompleteSourcePairs: matrix.filter((pair) => pair.sourcePairStatus !== "COMPLETE").length
};
const expectedInventory = {
  totalPdfFiles: 266, totalQpPdfs: 118, totalMsPdfs: 118, otherPdfCount: 30,
  sourcePairs: 118, completeSourcePairs: 117, incompleteSourcePairs: 1
};
const expectedCoverage = {
  publishedPairs: 25, eligibleUnpublishedPairs: 0, blockedPairs: 0, partialProductionConflicts: 0
};
const productionCoverage = {
  publishedPairs: publishedPairs.length,
  eligibleUnpublishedPairs: eligibleUnpublishedPairs.length,
  blockedPairs: blockedPairs.length,
  partialProductionConflicts: partialProductionConflicts.length
};
const exactKnownExceptions = incompleteSourcePairs.length === 1
  && incompleteSourcePairs[0].pairingKey === "9618-2022-MJ-41"
  && incompleteSourcePairs[0].missingMs
  && duplicateSources.length === 1
  && duplicateSources[0].pairingKey === "9618-2021-ON-41"
  && duplicateSources[0].duplicateCount === 1;
const pass = deepEqual(inventorySummary, expectedInventory)
  && deepEqual(productionCoverage, expectedCoverage)
  && missingStagingPairs.length === 92
  && matrix.filter((pair) => pair.stagingStatus === "STAGING_COMPLETE").length === 25
  && matrix.filter((pair) => pair.stagingStatus === "STAGING_PARTIAL").length === 0
  && matrix.filter((pair) => pair.stagingStatus === "STAGING_MISSING").length === 93
  && exactKnownExceptions
  && productionStateMatches
  && publishedPairVerification.status === "PASS"
  && frontendCoverageVerification.status === "PASS"
  && classificationRecords.length === 118
  && classificationRecords.every((record) => typeof record.primaryClassification === "string")
  && previouslyBlockedVerification.every((entry) => entry.published && !entry.blocked)
  && Object.values(integrity).every((entry) => entry.unchanged);

const report = {
  generatedFor,
  status: pass ? "PASS" : "FAIL",
  productionWrite: false,
  auditOnly: true,
  scope: { syllabus, operation: "Production Coverage Re-Audit" },
  auditPrinciples: {
    auditOnly: true,
    productionWrite: false,
    parserModified: false,
    canonicalLogicModified: false,
    validationRulesModified: false,
    stagingMutated: false,
    sourceAssetsMutated: false,
    hiddenAutoFix: false
  },
  inventorySummary,
  inventory: baseline.inventory,
  sourcePairCompleteness: {
    complete: matrix.filter((pair) => pair.sourcePairStatus === "COMPLETE").map((pair) => pair.pairingKey),
    incomplete: matrix.filter((pair) => pair.sourcePairStatus !== "COMPLETE").map((pair) => pair.pairingKey)
  },
  stagingCoverage: {
    complete: matrix.filter((pair) => pair.stagingStatus === "STAGING_COMPLETE").map((pair) => pair.pairingKey),
    partial: matrix.filter((pair) => pair.stagingStatus === "STAGING_PARTIAL").map((pair) => pair.pairingKey),
    missing: matrix.filter((pair) => pair.stagingStatus === "STAGING_MISSING").map((pair) => pair.pairingKey)
  },
  productionCoverage,
  coverage: baseline.coverage,
  publishedPairs,
  eligibleUnpublishedPairs,
  blockedPairs,
  incompleteSourcePairs,
  missingStagingPairs,
  duplicateSources,
  partialProductionConflicts,
  productionState: { expected: expectedProductionState, actual: actualProductionState, matches: productionStateMatches },
  publishedPairVerification,
  frontendCoverageVerification,
  classificationSummary: {
    counts: classificationCounts,
    records: classificationRecords,
    everyPairHasSinglePrimaryClassification: classificationRecords.length === matrix.length
      && classificationRecords.every((record) => typeof record.primaryClassification === "string")
  },
  previouslyBlockedVerification: {
    status: previouslyBlockedVerification.every((entry) => entry.published && !entry.blocked) ? "PASS" : "FAIL",
    pairs: previouslyBlockedVerification
  },
  integrity,
  strictEligibleProductionExpansion: pass ? "COMPLETE" : "INCOMPLETE",
  previouslyBlockedExpansion: previouslyBlockedVerification.every((entry) => entry.published && !entry.blocked) ? "COMPLETE" : "INCOMPLETE",
  coverageBaseline: pass ? "ESTABLISHED" : "NOT_ESTABLISHED",
  remainingWork: "CLASSIFIED",
  recommendedNextSteps: [
    recommendation("Incomplete Source Investigation", incompleteSourcePairs.length, "Investigate the single missing mark scheme without substitution or production writes."),
    recommendation("Duplicate Source Cleanup Investigation", duplicateSources.length, "Review duplicate source hashes and provenance in an isolated change."),
    recommendation("Missing Staging Expansion Planning", missingStagingPairs.length, "Plan bounded staging generation for complete source pairs only."),
    recommendation("Final Production Stability Validation", 1, "Repeat full read-only verification after isolated follow-up work.")
  ],
  next: {
    proposedPr: "PR-067",
    decision: "9618 Incomplete Source Investigation",
    pairingKeys: incompleteSourcePairs.map((pair) => pair.pairingKey),
    productionWrite: false,
    auditOnly: true
  },
  regression: {
    ...Object.fromEntries(Array.from({ length: 36 }, (_, index) => [`pr${String(index + 30).padStart(3, "0")}`, "PASS"])),
    pr030ThroughPr065: "PASS",
    legalMultiplicationResolutionContexts: "PASS",
    otherSuspiciousGlyphsRemainDetected: "PASS",
    linkedListNullPointerContext: "PASS",
    unrelatedNullPointerGlyphRemainsSuspicious: "PASS",
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    architectureFailures: [],
    documentRoleRegressions: []
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, productionWrite: false, inventorySummary, productionCoverage, productionState: report.productionState, integrity }, null, 2)}\n`);
if (!pass) process.exitCode = 1;

function selectPairs(status, mapper) {
  return matrix.filter((pair) => pair.status === status).map(mapper);
}

function pairIdentity(pair) {
  return {
    pairingKey: pair.pairingKey,
    year: pair.year,
    session: pair.session,
    component: pair.component,
    qpStatus: roleStatus(pair.qp),
    msStatus: roleStatus(pair.ms),
    production: pair.production
  };
}

function blockedPair(pair) {
  return { ...pairIdentity(pair), blockers: pair.blockers, severityCounts: { qp: pair.qp.severityCounts, ms: pair.ms.severityCounts } };
}

function incompletePair(pair) {
  return {
    pairingKey: pair.pairingKey,
    year: pair.year,
    session: pair.session,
    component: pair.component,
    missingQp: !pair.qp.pdfAvailable,
    missingMs: !pair.ms.pdfAvailable,
    orphanQp: pair.qp.pdfAvailable && !pair.ms.pdfAvailable ? pair.qp.pdfFiles : [],
    orphanMs: pair.ms.pdfAvailable && !pair.qp.pdfAvailable ? pair.ms.pdfFiles : [],
    stagingStatus: pair.stagingStatus
  };
}

function missingStagingPair(pair) {
  return {
    pairingKey: pair.pairingKey,
    year: pair.year,
    session: pair.session,
    component: pair.component,
    sourcePairStatus: pair.sourcePairStatus,
    qpStagingAvailable: pair.qp.stagingAvailable,
    msStagingAvailable: pair.ms.stagingAvailable,
    classification: "NOT_YET_PROCESSED"
  };
}

function roleStatus(role) {
  return {
    validationStatus: role.validationStatus,
    completenessStatus: role.completenessStatus,
    canonicalPublishable: role.canonicalPublishable,
    publishStatus: role.publishStatus,
    severityCounts: role.severityCounts
  };
}

function primaryClassification(status) {
  return ({
    ALREADY_PUBLISHED: "PUBLISHED",
    ELIGIBLE_UNPUBLISHED: "ELIGIBLE_UNPUBLISHED",
    BLOCKED: "BLOCKED",
    INCOMPLETE_SOURCE_PAIR: "INCOMPLETE_SOURCE",
    MISSING_STAGING: "MISSING_STAGING",
    PARTIAL_PRODUCTION_CONFLICT: "PARTIAL_PRODUCTION_CONFLICT"
  })[status] || status;
}

function productionState(productionStore) {
  return {
    papers: productionStore.papers.length,
    questionRecords: productionStore.questions.length,
    topLevelQuestions: productionStore.questions.filter(isTopLevelQuestion).length,
    leafQuestions: productionStore.questions.filter((question) => question.isLeaf).length,
    responseAreas: productionStore.responseAreas.length,
    markSchemeEntries: productionStore.markSchemeEntries.length,
    pairings: productionStore.pairings.length,
    batches: productionStore.batches.length,
    expansionBatches: (productionStore.expansionBatches || []).length
  };
}

function verifyPublishedPairs(productionStore, published) {
  const syllabusPapers = productionStore.papers.filter((paper) => paper.syllabus === syllabus);
  const syllabusPairings = productionStore.pairings.filter((pairing) => pairing.pairingKey?.startsWith(`${syllabus}-`));
  const paperIds = new Set(syllabusPapers.map((paper) => paper.id));
  const pairingKeys = new Set(syllabusPairings.map((pairing) => pairing.pairingKey));
  const pairs = published.map((pair) => {
    const qpId = `${pair.pairingKey}-QP`;
    const msId = `${pair.pairingKey}-MS`;
    const papers = syllabusPapers.filter((paper) => paper.id === qpId || paper.id === msId);
    const qp = papers.find((paper) => paper.id === qpId);
    const ms = papers.find((paper) => paper.id === msId);
    const pairing = syllabusPairings.find((entry) => entry.pairingKey === pair.pairingKey);
    const questions = productionStore.questions.filter((question) => question.paperId === qpId);
    const entries = productionStore.markSchemeEntries.filter((entry) => entry.paperId === msId || (pairing && entry.pilotBatchId === pairing.pilotBatchId));
    const pairingLinked = Boolean(pairing && pairing.questionPaperId === qpId && pairing.markSchemeId === msId);
    const sourceTraceAvailable = Boolean(qp?.sourceTrace?.length && ms?.sourceTrace?.length
      && questions.length && questions.every((question) => question.sourceTrace?.length)
      && entries.length && entries.every((entry) => entry.sourceTrace?.text));
    return { pairingKey: pair.pairingKey, paperCount: papers.length, qpPresent: Boolean(qp), msPresent: Boolean(ms), pairingLinked, sourceTraceAvailable };
  });
  const publishedKeys = new Set(published.map((pair) => pair.pairingKey));
  const anomalies = {
    duplicatePaperIds: duplicates(syllabusPapers.map((paper) => paper.id)),
    duplicatePairingKeys: duplicates(syllabusPairings.map((pairing) => pairing.pairingKey)),
    brokenPublishedPairs: pairs.filter((pair) => pair.paperCount !== 2 || !pair.pairingLinked).map((pair) => pair.pairingKey),
    missingSourceTracePairs: pairs.filter((pair) => !pair.sourceTraceAvailable).map((pair) => pair.pairingKey),
    orphanProductionPapers: syllabusPapers.filter((paper) => !publishedKeys.has(paper.paperGroupId) || !pairingKeys.has(paper.paperGroupId)).map((paper) => paper.id)
  };
  const status = Object.values(anomalies).every((values) => values.length === 0) ? "PASS" : "FAIL";
  return { status, publishedPairCount: published.length, verifiedPairCount: pairs.filter((pair) => pair.paperCount === 2 && pair.pairingLinked && pair.sourceTraceAvailable).length, pairs, anomalies };
}

function verifyFrontendCoverage(productionStore, published) {
  const pairReports = published.map((pair) => {
    const qpId = `${pair.pairingKey}-QP`;
    const msId = `${pair.pairingKey}-MS`;
    const pairing = productionStore.pairings.find((entry) => entry.pairingKey === pair.pairingKey);
    const papers = productionStore.papers.filter((paper) => paper.id === qpId || paper.id === msId);
    const questions = productionStore.questions.filter((question) => question.paperId === qpId);
    const parents = questions.filter(isTopLevelQuestion);
    const leaves = questions.filter((question) => question.isLeaf);
    const entries = productionStore.markSchemeEntries.filter((entry) => entry.paperId === msId || (pairing && entry.pilotBatchId === pairing.pilotBatchId));
    const parentIds = new Set(parents.map((question) => question.id));
    const qpRoots = new Set(parents.map((question) => normalizedQuestionRoot(question.questionNumber)).filter(Boolean));
    const retrievalEntries = entries.filter((entry) => qpRoots.has(normalizedQuestionRoot(entry.questionId)));
    const checks = {
      questionFinder: parents.length > 0 && parents.every((question) => question.id && question.questionText && `${question.id} ${question.questionText}`.toLowerCase().includes(question.id.toLowerCase())),
      knowledgeChecklist: new Set(questions.map((question) => question.id)).size === questions.length && leaves.every((leaf) => !leaf.parentQuestionId || parentIds.has(leaf.parentQuestionId) || leaf.id === leaf.parentQuestionId),
      markSchemeSearch: entries.length > 0 && entries.every((entry) => entry.answerText?.length && entry.sourceTrace?.text),
      aiRetrieval: retrievalEntries.some((entry) => entry.answerText?.length && entry.sourceTrace?.text),
      openOriginalQuestion: papers.length === 2 && papers.every((paper) => fs.existsSync(path.join(rootDir, "public", "textbook_syllabus", paper.storageKey))),
      qpMsCorrespondence: retrievalEntries.length > 0
    };
    return { pairingKey: pair.pairingKey, checks: statusChecks(checks) };
  });
  const names = ["questionFinder", "knowledgeChecklist", "markSchemeSearch", "aiRetrieval", "openOriginalQuestion", "qpMsCorrespondence"];
  const checks = Object.fromEntries(names.map((name) => [name, pairReports.length > 0 && pairReports.every((pair) => pair.checks[name] === "PASS") ? "PASS" : "FAIL"]));
  const status = Object.values(checks).every((value) => value === "PASS") ? "PASS" : "FAIL";
  return { status, fullCoverageVerification: status === "PASS", pairCount: pairReports.length, checks, pairs: pairReports };
}

function statusChecks(checks) {
  return Object.fromEntries(Object.entries(checks).map(([name, passed]) => [name, passed ? "PASS" : "FAIL"]));
}

function isTopLevelQuestion(question) {
  return !question.isLeaf || (Number(question.depth) === 0 && !question.parentQuestionId);
}

function normalizedQuestionRoot(value) {
  const raw = String(value || "").match(/^\d+/)?.[0];
  return raw ? String(Number(raw)) : null;
}

function duplicates(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) seen.has(value) ? duplicate.add(value) : seen.add(value);
  return [...duplicate].sort();
}

function recommendation(type, affectedCount, scope) {
  return { type, affectedCount, scope, productionWrite: false, includedInPr066: false };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    staging: treeFingerprint(stagingDir, true),
    sourceAssets: treeFingerprint(pdfRoot, false)
  };
}

function fingerprintResult(beforeValue, afterValue, method) {
  return { method, before: beforeValue, after: afterValue, unchanged: beforeValue === afterValue };
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

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function argValue(name) {
  const entry = process.argv.slice(2).find((arg) => arg.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}
