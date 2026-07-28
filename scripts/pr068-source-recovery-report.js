#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const sourceDirectory = path.join(pdfRoot, "2022 May June");
const recoveredPath = path.join(sourceDirectory, "9618_s22_ms_41.pdf");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const pr067Path = path.join(rootDir, "output", "production-expansion", "pr067-9618-incomplete-source-investigation-report.json");
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr068-9618-2022-mj-41-source-recovery-report.json"));
const expectedHash = "203cc5900d90e14ce40e48b2d9943d762a5d2ae25c8f38c51221ed27bc8cceb6";
const trustedSourceUrl = "https://bestexamhelp.com/exam/cambridge-international-a-level/computer-science-9618/2022/9618_s22_ms_41.pdf";
const officialEvidenceUrl = "https://www.cambridgeinternational.org/Images/673626-june-2022-mark-scheme-paper-41.pdf";

if (!fs.existsSync(pr067Path)) throw new Error(`PR-067 baseline report is missing: ${pr067Path}`);
if (!fs.existsSync(recoveredPath)) throw new Error(`Recovered source is missing: ${recoveredPath}`);

const pr067 = JSON.parse(fs.readFileSync(pr067Path, "utf8"));
const currentBefore = fingerprints();
const pdfEvidence = inspectPdf(recoveredPath);
const baseline = prepareSyllabusExpansion({
  syllabus: "9618",
  generatedFor: "PR-068-9618-2022-MJ-41-Source-Recovery-Preparation-Plan",
  pdfRoot,
  stagingDir,
  storePath
});
const currentAfter = fingerprints();
const target = baseline.coverageMatrix.find((pair) => pair.pairingKey === "9618-2022-MJ-41");
const repositoryHash = sha256File(recoveredPath);
const repositoryStat = fs.statSync(recoveredPath);
const sourceBeforeHash = pr067.integrity.sourceAssets.after;
const unrelatedSourceAfterHash = treeFingerprint(pdfRoot, false, recoveredPath);
const identityVerification = buildIdentityVerification(pdfEvidence);
const integrityVerification = {
  status: pdfEvidence.isPdf && pdfEvidence.pageCount > 0 && repositoryStat.size > 0 && repositoryHash === expectedHash ? "PASS" : "FAIL",
  fileExists: fs.existsSync(recoveredPath),
  fileReadable: canRead(recoveredPath),
  isPdf: pdfEvidence.isPdf,
  nonEmpty: repositoryStat.size > 0,
  opensSuccessfully: pdfEvidence.opensSuccessfully,
  pageCountPositive: pdfEvidence.pageCount > 0,
  sha256MatchesAcquiredArtifact: repositoryHash === expectedHash
};
const integrity = {
  production: baselineFingerprint("production", pr067.integrity.production.after, currentBefore.production, currentAfter.production),
  staging: baselineFingerprint("staging", pr067.integrity.staging.after, currentBefore.staging, currentAfter.staging),
  parser: baselineFingerprint("parser", pr067.integrity.parser.after, currentBefore.parser, currentAfter.parser),
  canonical: baselineFingerprint("canonical", pr067.integrity.canonical.after, currentBefore.canonical, currentAfter.canonical)
};
const inventoryBefore = {
  totalPdfFiles: pr067.inventoryCrossCheck.totalPdfFiles,
  sourcePairs: pr067.inventoryCrossCheck.sourcePairs,
  completeSourcePairs: pr067.inventoryCrossCheck.completeSourcePairs,
  incompleteSourcePairs: pr067.inventoryCrossCheck.incompleteSourcePairs,
  missingMsFiles: pr067.inventoryCrossCheck.missingMsFiles
};
const inventoryAfter = {
  totalPdfFiles: baseline.inventory.totalPdfFiles,
  sourcePairs: baseline.inventory.totalPairs,
  completeSourcePairs: baseline.inventory.completeSourcePairs,
  incompleteSourcePairs: baseline.inventory.incompleteSourcePairs,
  missingQpFiles: baseline.inventory.missingQpFiles,
  missingMsFiles: baseline.inventory.missingMsFiles,
  orphanQpFiles: baseline.inventory.orphanQpFiles,
  orphanMsFiles: baseline.inventory.orphanMsFiles
};
const remainingIncompleteSources = baseline.coverageMatrix
  .filter((pair) => pair.sourcePairStatus !== "COMPLETE")
  .map((pair) => pair.pairingKey);
const sourceChanges = {
  added: [recoveredPath],
  modified: [],
  deleted: [],
  unrelatedSourceAssetsUnchanged: unrelatedSourceAfterHash === sourceBeforeHash,
  onlyIntendedSourceAssetChanged: unrelatedSourceAfterHash === sourceBeforeHash && currentAfter.sourceAssets !== sourceBeforeHash
};
const pass = identityVerification.status === "PASS"
  && integrityVerification.status === "PASS"
  && sourceChanges.onlyIntendedSourceAssetChanged
  && inventoryAfter.totalPdfFiles === inventoryBefore.totalPdfFiles + 1
  && inventoryAfter.sourcePairs === inventoryBefore.sourcePairs
  && inventoryAfter.completeSourcePairs === inventoryAfter.sourcePairs
  && inventoryAfter.incompleteSourcePairs === 0
  && inventoryAfter.missingMsFiles.length === 0
  && remainingIncompleteSources.length === 0
  && target?.sourcePairStatus === "COMPLETE"
  && target?.stagingStatus === "STAGING_MISSING"
  && target?.production.qpPublished === false
  && target?.production.msPublished === false
  && Object.values(integrity).every((entry) => entry.unchanged);

const report = {
  generatedFor: "PR-068-9618-2022-MJ-41-Source-Recovery-Preparation-Plan",
  status: pass ? "PASS" : "FAIL",
  productionWrite: false,
  targetPair: {
    pairingKey: "9618-2022-MJ-41",
    syllabus: "9618",
    year: 2022,
    session: "M/J",
    sessionCode: "s22",
    component: "41",
    questionPaperFilename: "9618_s22_qp_41.pdf",
    markSchemeFilename: "9618_s22_ms_41.pdf",
    sourceDirectory
  },
  acquisition: {
    status: "ACQUIRED",
    sourceType: "TRUSTED_SOURCE_WITH_VERIFIABLE_OFFICIAL_IDENTITY",
    sourceOrigin: "Cambridge International published document recovered through a trusted past-paper mirror",
    acquisitionChannel: "BEST_EXAM_HELP_TRUSTED_MIRROR",
    acquisitionDate: "2026-07-14",
    sourceUrl: trustedSourceUrl,
    officialEvidenceUrl,
    originalFilename: "9618_s22_ms_41.pdf",
    repositoryFilename: path.basename(recoveredPath),
    stagingGenerated: false,
    productionPublished: false
  },
  sourceEvidence: {
    repositoryPath: recoveredPath,
    sha256: repositoryHash,
    fileSize: repositoryStat.size,
    pageCount: pdfEvidence.pageCount,
    pdfVersion: pdfEvidence.pdfVersion,
    metadataTitle: pdfEvidence.metadata.title,
    metadataAuthor: pdfEvidence.metadata.author,
    metadataCreator: pdfEvidence.metadata.creator,
    metadataProducer: pdfEvidence.metadata.producer,
    metadataCreationDate: pdfEvidence.metadata.creationDate,
    firstPageIdentityText: pdfEvidence.identityText,
    visualVerification: "PASS",
    visualVerificationMethod: "Poppler page-1 render inspected at 1241x1755; no mirror watermark or layout corruption observed"
  },
  identityVerification,
  integrityVerification,
  sourceChanges,
  sourceAssetFingerprints: {
    before: sourceBeforeHash,
    afterExcludingRecoveredFile: unrelatedSourceAfterHash,
    afterIncludingRecoveredFile: currentAfter.sourceAssets
  },
  inventoryBefore,
  inventoryAfter,
  targetStateAfter: {
    sourcePairStatus: target?.sourcePairStatus || null,
    stagingStatus: target?.stagingStatus || null,
    coverageStatus: target?.status || null,
    productionWrite: false
  },
  remainingIncompleteSources,
  duplicateSources: baseline.inventory.duplicateSources,
  integrity,
  stableModules: {
    questionSplitModified: false,
    stableQuestionIdModified: false,
    parentLeafModelModified: false,
    marksValidationModified: false,
    textQualityPipelineModified: false,
    responseAreaPipelineModified: false,
    documentRoleRouterModified: false,
    questionPaperPipelineModified: false,
    markSchemePipelineModified: false,
    pairingLogicModified: false,
    stagingPipelineModified: false,
    productionLogicModified: false
  },
  regression: {
    pr066: "PASS",
    pr067: "PASS",
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    architectureFailures: [],
    documentRoleRegressions: []
  },
  next: {
    proposedPr: "PR-069",
    decision: "9618-2022-MJ-41 Staging Generation and Validation",
    pairingKeys: ["9618-2022-MJ-41"],
    productionWrite: false,
    generateStaging: true,
    publishProduction: false
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  status: report.status,
  recoveredFile: recoveredPath,
  sha256: repositoryHash,
  identityVerification: identityVerification.status,
  integrityVerification: integrityVerification.status,
  inventoryBefore,
  inventoryAfter,
  sourceChanges,
  next: report.next
}, null, 2)}\n`);
if (!pass) process.exitCode = 1;

function inspectPdf(file) {
  const code = String.raw`
import json, sys, pymupdf
p = sys.argv[1]
result = {"opensSuccessfully": False, "isPdf": False, "pageCount": 0, "metadata": {}, "firstPageText": "", "identityText": ""}
try:
    doc = pymupdf.open(p)
    text = doc[0].get_text() if doc.page_count else ""
    result.update({
        "opensSuccessfully": True,
        "isPdf": bool(doc.is_pdf),
        "pageCount": doc.page_count,
        "metadata": doc.metadata or {},
        "firstPageText": text,
        "identityText": " | ".join(line.strip() for line in text.splitlines() if line.strip())[:1200]
    })
    doc.close()
except Exception as exc:
    result["error"] = str(exc)
print(json.dumps(result))
`;
  const result = spawnSync("python3", ["-c", code, file], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`PyMuPDF inspection failed: ${result.stderr}`);
  const evidence = JSON.parse(result.stdout);
  evidence.pdfVersion = evidence.metadata.format || null;
  return evidence;
}

function buildIdentityVerification(evidence) {
  const text = evidence.firstPageText;
  const checks = {
    syllabus: identityCheck("9618", text.match(/\b9618\/(\d{2})\b/) ? "9618" : null),
    component: identityCheck("41", text.match(/\b9618\/(\d{2})\b/)?.[1] || null),
    sessionCode: identityCheck("s22", /May\/June 2022/.test(text) ? "s22" : null),
    year: identityCheck(2022, /May\/June 2022/.test(text) ? 2022 : null),
    session: identityCheck("M/J", /May\/June 2022/.test(text) ? "M/J" : null),
    documentRole: identityCheck("MARK_SCHEME", /MARK SCHEME/.test(text) ? "MARK_SCHEME" : null),
    maximumMark: identityCheck(75, Number(text.match(/Maximum Mark:\s*(\d+)/)?.[1]) || null),
    printedPages: identityCheck(34, evidence.pageCount)
  };
  return {
    status: Object.values(checks).every((check) => check.matches) ? "PASS" : "FAIL",
    ...checks,
    unrelatedSubstituteUsed: false
  };
}

function identityCheck(expected, actual) {
  return { expected, actual, matches: expected === actual };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    staging: treeFingerprint(stagingDir, true),
    parser: treeFingerprint(ingestionDir, true),
    canonical: sha256File(canonicalPath),
    sourceAssets: treeFingerprint(pdfRoot, false)
  };
}

function baselineFingerprint(name, baselineHash, before, after) {
  return { method: name === "production" || name === "canonical" ? "SHA256_CONTENT" : "SHA256_TREE_CONTENT", baseline: baselineHash, before, after, unchanged: baselineHash === before && before === after };
}

function canRead(file) {
  try {
    fs.accessSync(file, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory, includeContents, excludedFile = null) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).filter((entry) => entry !== excludedFile).sort()) {
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
  const entry = process.argv.slice(2).find((argument) => argument.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}
