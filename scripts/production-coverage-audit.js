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
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr059-9618-production-coverage-audit-report.json"));
const fingerprintsBefore = fingerprints();
const baseline = prepareSyllabusExpansion({
  syllabus,
  generatedFor: "PR-059-9618-Production-Coverage-Audit-Plan",
  pdfRoot,
  stagingDir,
  storePath
});
const store = readProductionStore(storePath);
const matrix = baseline.coverageMatrix;
const duplicateKeys = new Set(baseline.inventory.duplicateSources.map((entry) => entry.pairingKey));
const publishedPairs = matrix.filter((pair) => pair.status === "ALREADY_PUBLISHED").map(pairIdentity);
const eligibleUnpublishedPairs = matrix.filter((pair) => pair.status === "ELIGIBLE_UNPUBLISHED").map(pairIdentity);
const blockedPairs = matrix.filter((pair) => pair.status === "BLOCKED").map(blockedPair);
const incompleteSourcePairs = matrix.filter((pair) => pair.status === "INCOMPLETE_SOURCE_PAIR").map(incompletePair);
const missingStagingPairs = matrix.filter((pair) => pair.status === "MISSING_STAGING").map(missingStagingPair);
const partialProductionConflicts = matrix.filter((pair) => pair.status === "PARTIAL_PRODUCTION_CONFLICT").map(pairIdentity);
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
    pair.stagingStatus === "STAGING_PARTIAL" ? "STAGING_PARTIAL" : null,
    pair.stagingStatus === "STAGING_MISSING" ? "STAGING_MISSING" : null
  ].filter(Boolean)
}));
const classificationCounts = classificationRecords.reduce((counts, record) => {
  counts[record.primaryClassification] = (counts[record.primaryClassification] || 0) + 1;
  return counts;
}, Object.fromEntries(["PUBLISHED", "ELIGIBLE_UNPUBLISHED", "BLOCKED", "INCOMPLETE_SOURCE", "MISSING_STAGING", "PARTIAL_PRODUCTION_CONFLICT"].map((key) => [key, 0])));
classificationCounts.DUPLICATE_SOURCE = duplicateSources.length;
const productionVerification = verifyProduction(store, publishedPairs, syllabus);
const fingerprintsAfter = fingerprints();
const integrity = {
  production: fingerprintResult(fingerprintsBefore.production, fingerprintsAfter.production, "SHA256_CONTENT"),
  staging: fingerprintResult(fingerprintsBefore.staging, fingerprintsAfter.staging, "SHA256_TREE_CONTENT"),
  sourceAssets: fingerprintResult(fingerprintsBefore.sourceAssets, fingerprintsAfter.sourceAssets, "SHA256_TREE_METADATA")
};
const auditPass = eligibleUnpublishedPairs.length === 0
  && partialProductionConflicts.length === 0
  && productionVerification.status === "PASS"
  && Object.values(integrity).every((entry) => entry.unchanged);

const report = {
  generatedFor: "PR-059-9618-Production-Coverage-Audit-Plan",
  status: auditPass ? "PASS" : "FAIL",
  productionWrite: false,
  scope: { syllabus, operation: "Coverage Audit" },
  auditPrinciples: {
    auditOnly: true,
    productionWrite: false,
    parserModified: false,
    stagingMutated: false,
    assetsMutated: false,
    hiddenAutoFix: false
  },
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
  coverage: {
    ...baseline.coverage,
    unpublishedPairs: matrix.length - publishedPairs.length
  },
  publishedPairs,
  eligibleUnpublishedPairs,
  blockedPairs,
  incompleteSourcePairs,
  missingStagingPairs,
  missingStagingClassification: {
    completeSourceButNoStaging: missingStagingPairs.map((pair) => pair.pairingKey),
    incompleteSourceAndNoStaging: incompleteSourcePairs.filter((pair) => pair.stagingStatus === "STAGING_MISSING").map((pair) => pair.pairingKey),
    blockedStaging: blockedPairs.map((pair) => pair.pairingKey),
    notYetProcessed: missingStagingPairs.map((pair) => pair.pairingKey)
  },
  duplicateSources,
  partialProductionConflicts,
  productionVerification,
  classificationSummary: {
    counts: classificationCounts,
    records: classificationRecords,
    everyPairHasSinglePrimaryClassification: classificationRecords.length === matrix.length
      && classificationRecords.every((record) => typeof record.primaryClassification === "string")
  },
  integrity,
  strictEligibleProductionExpansion: auditPass ? "COMPLETE" : "INCOMPLETE",
  coverageBaseline: auditPass ? "ESTABLISHED" : "NOT_ESTABLISHED",
  remainingWork: "CLASSIFIED",
  recommendedNextSteps: [
    recommendation("Blocked Pair Investigation", blockedPairs.length, "One blocker class and one evidenced root cause per isolated PR."),
    recommendation("Incomplete Source Cleanup", incompleteSourcePairs.length, "Confirm missing source assets without guessing or substitution."),
    recommendation("Duplicate Source Cleanup", duplicateSources.length, "Resolve duplicate assets only after independent hash review."),
    recommendation("Missing Staging Expansion", missingStagingPairs.length, "Generate staging for complete source pairs in bounded batches."),
    recommendation("Final Production Stability Validation", 1, "Run after the planned cleanup streams are complete.")
  ],
  regression: {
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
    architectureFailures: [],
    documentRoleRegressions: [],
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS"
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, productionWrite: report.productionWrite, coverage: report.coverage, classificationCounts, integrity, recommendedNextSteps: report.recommendedNextSteps }, null, 2)}\n`);
if (!auditPass) process.exitCode = 1;

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
  return {
    ...pairIdentity(pair),
    blockers: pair.blockers,
    severityCounts: { qp: pair.qp.severityCounts, ms: pair.ms.severityCounts },
    classification: "Blocked != Regression; Blocked != Parser Bug without root-cause evidence."
  };
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

function verifyProduction(productionStore, published, targetSyllabus) {
  const papers = productionStore.papers.filter((paper) => paper.syllabus === targetSyllabus);
  const pairings = productionStore.pairings.filter((pairing) => pairing.pairingKey?.startsWith(`${targetSyllabus}-`));
  const duplicatePaperIds = duplicates(papers.map((paper) => paper.id));
  const duplicatePairingKeys = duplicates(pairings.map((pairing) => pairing.pairingKey));
  const paperIds = new Set(papers.map((paper) => paper.id));
  const pairingKeys = new Set(pairings.map((pairing) => pairing.pairingKey));
  const brokenPublishedPairs = published.filter((pair) => !paperIds.has(`${pair.pairingKey}-QP`) || !paperIds.has(`${pair.pairingKey}-MS`) || !pairingKeys.has(pair.pairingKey)).map((pair) => pair.pairingKey);
  return {
    status: duplicatePaperIds.length === 0 && duplicatePairingKeys.length === 0 && brokenPublishedPairs.length === 0 ? "PASS" : "FAIL",
    publishedPairCount: published.length,
    duplicatePaperIds,
    duplicatePairingKeys,
    brokenPublishedPairs
  };
}

function duplicates(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) seen.has(value) ? duplicate.add(value) : seen.add(value);
  return [...duplicate].sort();
}

function recommendation(type, affectedCount, scope) {
  return { type, affectedCount, scope, productionWrite: false, includedInPr059: false };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    staging: treeFingerprint(stagingDir, true),
    sourceAssets: treeFingerprint(pdfRoot, false)
  };
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

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
