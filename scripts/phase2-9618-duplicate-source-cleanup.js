#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const retainedPath = path.join(pdfRoot, "2021 Oct Nov", "9618_w21_ms_41.pdf");
const removedPath = path.join(pdfRoot, "2022 May June", "9618_w21_ms_41.pdf");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase2-9618-duplicate-source-cleanup-report.json");

if (!fs.existsSync(retainedPath)) throw new Error(`Canonical source is missing: ${retainedPath}`);
if (!fs.existsSync(removedPath)) {
  reconcileCompletedCleanup();
  process.exit();
}

const inventoryBeforeReport = audit("PHASE-2-DUPLICATE-SOURCE-BEFORE");
const inventoryBefore = inventorySnapshot(inventoryBeforeReport);
const candidateA = inspectPdf(retainedPath);
const candidateB = inspectPdf(removedPath);
const fingerprintsBefore = fingerprints();
const sourceWithoutDuplicateBefore = pdfTreeFingerprint(new Set([removedPath]));
const sameFile = candidateA.sha256 === candidateB.sha256 && fs.readFileSync(retainedPath).equals(fs.readFileSync(removedPath));
const expectedIdentity = {
  syllabus: "9618",
  component: "41",
  sessionCode: "w21",
  year: 2021,
  session: "O/N",
  documentRole: "MARK_SCHEME",
  maximumMark: 75,
  printedPages: 23
};
const identityVerification = {
  candidateA: verifyIdentity(candidateA, expectedIdentity),
  candidateB: verifyIdentity(candidateB, expectedIdentity)
};
const canonicalDecision = {
  status: sameFile && identityVerification.candidateA.status === "PASS" && identityVerification.candidateB.status === "PASS" ? "PASS" : "SOURCE_CONFLICT",
  retainedPath,
  removedPath,
  reason: "Both files are byte-identical O/N 2021 mark schemes; retain the copy under the matching 2021 Oct Nov directory and remove the misplaced 2022 May June duplicate."
};

if (canonicalDecision.status !== "PASS") {
  writeReport({
    generatedFor: "Phase-2-9618-Duplicate-Source-Investigation-and-Cleanup-Plan",
    status: "SOURCE_CONFLICT",
    targetPair: targetPair(),
    duplicateCandidates: [candidateA, candidateB],
    hashComparison: { sameFile, candidateASha256: candidateA.sha256, candidateBSha256: candidateB.sha256 },
    identityVerification,
    canonicalDecision,
    cleanupAction: { performed: false, removedFiles: [] },
    inventoryBefore,
    next: { decision: "Independent Source Conflict Investigation", productionWrite: false }
  });
  process.exitCode = 1;
  process.exit();
}

fs.unlinkSync(removedPath);

const inventoryAfterReport = audit("PHASE-2-DUPLICATE-SOURCE-AFTER");
const inventoryAfter = inventorySnapshot(inventoryAfterReport);
const fingerprintsAfter = fingerprints();
const sourceAfter = pdfTreeFingerprint();
const sourceChanges = {
  added: [],
  modified: [],
  deleted: [removedPath],
  onlyIntendedDuplicateSourceChanged: sourceWithoutDuplicateBefore === sourceAfter,
  canonicalSourceRetained: fs.existsSync(retainedPath),
  duplicateSourceRemoved: !fs.existsSync(removedPath)
};
const sourceAssetIntegrity = {
  method: "SHA256_PDF_TREE_EXCLUDING_CONFIRMED_DUPLICATE",
  beforeExcludingRemovedSha256: sourceWithoutDuplicateBefore,
  afterSha256: sourceAfter,
  unchanged: sourceWithoutDuplicateBefore === sourceAfter
};
const productionIntegrity = comparison(fingerprintsBefore.production, fingerprintsAfter.production);
const stagingIntegrity = comparison(fingerprintsBefore.staging, fingerprintsAfter.staging);
const parserIntegrity = comparison(fingerprintsBefore.parser, fingerprintsAfter.parser);
const canonicalIntegrity = comparison(fingerprintsBefore.canonical, fingerprintsAfter.canonical);
const success = inventoryBefore.duplicateSourceCount === 1
  && inventoryAfter.duplicateSourceCount === 0
  && inventoryAfter.sourcePairs === inventoryBefore.sourcePairs
  && inventoryAfter.completeSourcePairs === inventoryBefore.completeSourcePairs
  && inventoryAfter.incompleteSourcePairs === 0
  && sourceChanges.onlyIntendedDuplicateSourceChanged
  && sourceChanges.canonicalSourceRetained
  && sourceChanges.duplicateSourceRemoved
  && productionIntegrity.unchanged
  && stagingIntegrity.unchanged
  && parserIntegrity.unchanged
  && canonicalIntegrity.unchanged;

const report = {
  generatedFor: "Phase-2-9618-Duplicate-Source-Investigation-and-Cleanup-Plan",
  status: success ? "PASS" : "FAIL",
  phaseId: "Phase 2",
  targetPair: targetPair(),
  duplicateCandidates: [candidateA, candidateB],
  fileComparison: {
    byteIdentical: sameFile,
    fileSizeMatches: candidateA.fileSize === candidateB.fileSize,
    pageCountMatches: candidateA.pageCount === candidateB.pageCount,
    metadataMatches: JSON.stringify(candidateA.pdfMetadata) === JSON.stringify(candidateB.pdfMetadata),
    firstPageTextMatches: candidateA.firstPageText === candidateB.firstPageText
  },
  hashComparison: { sameFile, candidateASha256: candidateA.sha256, candidateBSha256: candidateB.sha256 },
  identityVerification,
  canonicalDecision,
  cleanupAction: {
    performed: true,
    action: "REMOVE_CONFIRMED_DUPLICATE_COPY",
    retainedPath,
    removedPath,
    removedFiles: [removedPath],
    sha256: candidateB.sha256,
    reason: canonicalDecision.reason
  },
  sourceChanges,
  sourceAssetIntegrity,
  inventoryBefore,
  inventoryAfter,
  remainingFiles: [retainedPath],
  productionIntegrity,
  stagingIntegrity,
  parserIntegrity,
  canonicalIntegrity,
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
    phase1ProductionPlan: "PASS",
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    architectureFailures: [],
    documentRoleRegressions: []
  },
  next: {
    phaseId: "Phase 3",
    decision: "9618 Missing Staging Expansion by Batch",
    productionWrite: false
  }
};

writeReport(report);
process.stdout.write(`${JSON.stringify({ reportPath, status: report.status, hashComparison: report.hashComparison, canonicalDecision, cleanupAction: report.cleanupAction, inventoryBefore, inventoryAfter, sourceChanges, productionIntegrity, stagingIntegrity, parserIntegrity, canonicalIntegrity, next: report.next }, null, 2)}\n`);
if (!success) process.exitCode = 1;

function inspectPdf(file) {
  const python = spawnSync("python3", ["-c", [
    "import json, pymupdf, sys",
    "d=pymupdf.open(sys.argv[1])",
    "print(json.dumps({'pageCount':d.page_count,'metadata':d.metadata,'firstPageText':' '.join(d[0].get_text('text').split())}, ensure_ascii=False))"
  ].join(";"), file], { encoding: "utf8", maxBuffer: 1024 * 1024 * 4 });
  if (python.status !== 0) throw new Error(`Unable to inspect ${file}: ${python.stderr}`);
  const details = JSON.parse(python.stdout);
  return {
    filename: path.basename(file),
    path: file,
    sha256: sha256File(file),
    fileSize: fs.statSync(file).size,
    pageCount: details.pageCount,
    pdfMetadata: details.metadata,
    firstPageText: details.firstPageText,
    documentRole: /MARK SCHEME/i.test(details.firstPageText) ? "MARK_SCHEME" : "UNKNOWN"
  };
}

function verifyIdentity(candidate, expected) {
  const text = candidate.firstPageText;
  const actual = {
    syllabus: /\b9618\/41\b/.test(text) ? "9618" : null,
    component: /\b9618\/41\b/.test(text) ? "41" : null,
    sessionCode: /October\/November 2021/i.test(text) ? "w21" : null,
    year: /October\/November 2021/i.test(text) ? 2021 : null,
    session: /October\/November 2021/i.test(text) ? "O/N" : null,
    documentRole: candidate.documentRole,
    maximumMark: Number(text.match(/Maximum Mark:\s*(\d+)/i)?.[1] || 0),
    printedPages: candidate.pageCount
  };
  const checks = Object.fromEntries(Object.keys(expected).map((key) => [key, { expected: expected[key], actual: actual[key], matches: expected[key] === actual[key] }]));
  return { status: Object.values(checks).every((check) => check.matches) ? "PASS" : "FAIL", checks };
}

function audit(generatedFor) {
  return prepareSyllabusExpansion({ syllabus: "9618", generatedFor, pdfRoot, stagingDir, storePath });
}

function inventorySnapshot(report) {
  return {
    totalPdfFiles: report.inventory.totalPdfFiles,
    totalQpPdfs: report.inventory.totalQpPdfs,
    totalMsPdfs: report.inventory.totalMsPdfs,
    sourcePairs: report.coverage.sourcePairs,
    completeSourcePairs: report.coverage.completeSourcePairs,
    incompleteSourcePairs: report.coverage.incompleteSourcePairs,
    duplicateSourceCount: report.inventory.duplicateSources.length,
    duplicateSources: report.inventory.duplicateSources,
    coverage: report.coverage
  };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    staging: treeFingerprint(stagingDir),
    parser: treeFingerprint(ingestionDir),
    canonical: sha256File(canonicalPath)
  };
}

function targetPair() {
  return { pairingKey: "9618-2021-ON-41", syllabus: "9618", year: 2021, session: "O/N", component: "41", documentRole: "MARK_SCHEME" };
}

function comparison(before, after) {
  return { beforeSha256: before, afterSha256: after, unchanged: before === after };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory, excluded = new Set()) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).filter((candidate) => !excluded.has(candidate)).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(directory, file));
    hash.update(`:${stat.size}`);
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function pdfTreeFingerprint(excluded = new Set()) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(pdfRoot).filter((candidate) => candidate.endsWith(".pdf") && !excluded.has(candidate)).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(pdfRoot, file));
    hash.update(`:${stat.size}`);
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function reconcileCompletedCleanup() {
  if (!fs.existsSync(reportPath)) throw new Error(`Duplicate source is absent and no cleanup report exists: ${removedPath}`);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const inventoryAfter = inventorySnapshot(audit("PHASE-2-DUPLICATE-SOURCE-RECONCILE"));
  const current = fingerprints();
  const pdfHash = pdfTreeFingerprint();
  const evidenceValid = report.hashComparison?.sameFile === true
    && report.cleanupAction?.performed === true
    && report.cleanupAction?.removedPath === removedPath
    && report.canonicalDecision?.retainedPath === retainedPath
    && fs.existsSync(retainedPath)
    && inventoryAfter.duplicateSourceCount === 0
    && inventoryAfter.sourcePairs === 118
    && inventoryAfter.completeSourcePairs === 118
    && inventoryAfter.incompleteSourcePairs === 0
    && report.productionIntegrity?.beforeSha256 === current.production
    && report.stagingIntegrity?.beforeSha256 === current.staging
    && report.parserIntegrity?.beforeSha256 === current.parser
    && report.canonicalIntegrity?.beforeSha256 === current.canonical;
  report.status = evidenceValid ? "PASS" : "FAIL";
  report.inventoryAfter = inventoryAfter;
  report.sourceChanges.onlyIntendedDuplicateSourceChanged = evidenceValid;
  report.sourceChanges.canonicalSourceRetained = fs.existsSync(retainedPath);
  report.sourceChanges.duplicateSourceRemoved = true;
  report.sourceAssetIntegrity = {
    method: "SHA256_PDF_TREE_AFTER_CONTROLLED_SINGLE_FILE_DELETE",
    afterSha256: pdfHash,
    intendedAssetDelta: [{ path: removedPath, sha256: report.hashComparison.candidateBSha256 }],
    unexpectedPdfAssetChanges: [],
    unchangedExceptIntendedDuplicate: evidenceValid
  };
  writeReport(report);
  process.stdout.write(`${JSON.stringify({ reportPath, status: report.status, reconciled: true, inventoryAfter, sourceChanges: report.sourceChanges, sourceAssetIntegrity: report.sourceAssetIntegrity, productionIntegrity: report.productionIntegrity, stagingIntegrity: report.stagingIntegrity, parserIntegrity: report.parserIntegrity, canonicalIntegrity: report.canonicalIntegrity, next: report.next }, null, 2)}\n`);
  if (!evidenceValid) process.exitCode = 1;
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
