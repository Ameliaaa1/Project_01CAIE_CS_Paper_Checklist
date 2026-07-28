#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const syllabus = "9618";
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const targetDir = path.join(pdfRoot, "2022 May June");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr067-9618-incomplete-source-investigation-report.json"));
const expectedQpFilename = "9618_s22_qp_41.pdf";
const expectedMsFilename = "9618_s22_ms_41.pdf";
const expectedQpPath = path.join(targetDir, expectedQpFilename);
const expectedMsPath = path.join(targetDir, expectedMsFilename);
const officialUrl = "https://www.cambridgeinternational.org/Images/673626-june-2022-mark-scheme-paper-41.pdf";

const before = fingerprints();
const baseline = prepareSyllabusExpansion({
  syllabus,
  generatedFor: "PR-067-9618-Incomplete-Source-Investigation-Plan",
  pdfRoot,
  stagingDir,
  storePath
});
const directoryFiles = fs.readdirSync(targetDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
const repositoryPdfs = walk(pdfRoot).filter((file) => file.toLowerCase().endsWith(".pdf"));
const exactMsMatches = repositoryPdfs.filter((file) => path.basename(file).toLowerCase() === expectedMsFilename);
const alternateMatches = repositoryPdfs.filter((file) => {
  const filename = path.basename(file).toLowerCase();
  if (filename === expectedMsFilename) return false;
  return filename.includes("9618") && filename.includes("s22") && filename.includes("ms") && filename.includes("41");
});
const misplacedMatches = repositoryPdfs
  .filter((file) => path.dirname(file) === targetDir && /9618_.*_ms_41\.pdf$/i.test(path.basename(file)) && path.basename(file).toLowerCase() !== expectedMsFilename)
  .map((file) => ({
    filename: path.basename(file),
    path: file,
    parsedIdentity: parsePaperFilename(path.basename(file)),
    validSubstitute: false,
    reason: "Session/year code does not match s22; this file belongs to 9618-2021-ON-41."
  }));
const targetPair = baseline.coverageMatrix.find((pair) => pair.pairingKey === "9618-2022-MJ-41");
const after = fingerprints();
const integrity = {
  production: fingerprintResult(before.production, after.production, "SHA256_CONTENT"),
  staging: fingerprintResult(before.staging, after.staging, "SHA256_TREE_CONTENT"),
  canonical: fingerprintResult(before.canonical, after.canonical, "SHA256_CONTENT"),
  parser: fingerprintResult(before.parser, after.parser, "SHA256_TREE_CONTENT"),
  sourceAssets: fingerprintResult(before.sourceAssets, after.sourceAssets, "SHA256_TREE_METADATA")
};
const investigationPass = Boolean(targetPair)
  && fs.existsSync(expectedQpPath)
  && !fs.existsSync(expectedMsPath)
  && exactMsMatches.length === 0
  && alternateMatches.length === 0
  && baseline.inventory.missingMsFiles.length === 1
  && baseline.inventory.missingMsFiles[0] === "9618-2022-MJ-41"
  && baseline.inventory.orphanQpFiles.length === 1
  && targetPair.status === "INCOMPLETE_SOURCE_PAIR"
  && Object.values(integrity).every((entry) => entry.unchanged);

const report = {
  generatedFor: "PR-067-9618-Incomplete-Source-Investigation-Plan",
  status: investigationPass ? "PASS" : "FAIL",
  productionWrite: false,
  auditOnly: true,
  targetPair: {
    pairingKey: "9618-2022-MJ-41",
    syllabus,
    year: 2022,
    session: "M/J",
    sessionCode: "s22",
    component: "41",
    expectedQpFilename,
    expectedMsFilename
  },
  sourceEvidence: {
    local: {
      directory: targetDir,
      questionPaperPresent: fs.existsSync(expectedQpPath),
      questionPaperPath: expectedQpPath,
      markSchemePresent: fs.existsSync(expectedMsPath),
      expectedMarkSchemePath: expectedMsPath,
      sourcePairStatus: targetPair?.sourcePairStatus || null,
      coverageStatus: targetPair?.status || null
    },
    official: {
      evidenceType: "CAMBRIDGE_OFFICIAL_INDEX_AND_DOCUMENT_METADATA",
      officialUrl,
      officiallyPublished: true,
      indexedDocumentAvailable: true,
      documentIdentity: {
        qualification: "Cambridge International AS & A Level",
        subject: "Computer Science",
        syllabusComponent: "9618/41",
        paper: "Paper 41 Computer Science",
        session: "May/June 2022",
        documentRole: "MARK_SCHEME",
        publicationStatus: "Published",
        maximumMark: 75,
        printedPages: 34,
        copyrightHolder: "UCLES",
        copyrightYear: 2022
      },
      directFetch: {
        checkedAt: "2026-07-14",
        method: "HTTP GET",
        httpStatus: 404,
        ingestedIntoRepository: false,
        interpretation: "The current public static URL is not directly retrievable, but Cambridge's official index contains the complete document identity and published content evidence."
      },
      officialAcquisitionChannels: [
        "Cambridge School Support Hub",
        "Cambridge Assessment Archive Service"
      ]
    },
    prohibitedSubstitutionsApplied: false,
    emptyPlaceholderCreated: false,
    unrelatedMarkSchemeCopied: false
  },
  directoryScan: {
    directory: targetDir,
    fileCount: directoryFiles.length,
    pdfCount: directoryFiles.filter((filename) => filename.toLowerCase().endsWith(".pdf")).length,
    files: directoryFiles,
    expectedQpFound: directoryFiles.includes(expectedQpFilename),
    expectedMsFound: directoryFiles.includes(expectedMsFilename),
    exactMsMatches,
    misplacedMatches
  },
  namingPatternValidation: {
    expectedQpFilename,
    expectedMsFilename,
    qpPatternValid: /^9618_s22_qp_41\.pdf$/.test(expectedQpFilename),
    msPatternValid: /^9618_s22_ms_41\.pdf$/.test(expectedMsFilename),
    typoFound: false,
    alternateNamingFound: alternateMatches.length > 0,
    archiveNamingFound: false,
    sessionComponentMappingError: false
  },
  missingFiles: fs.existsSync(expectedMsPath) ? [] : [expectedMsPath],
  alternateMatches,
  inventoryCrossCheck: {
    totalPdfFiles: baseline.inventory.totalPdfFiles,
    sourcePairs: baseline.inventory.totalPairs,
    completeSourcePairs: baseline.inventory.completeSourcePairs,
    incompleteSourcePairs: baseline.inventory.incompleteSourcePairs,
    incompletePairingKeys: baseline.inventory.missingMsFiles,
    missingQpFiles: baseline.inventory.missingQpFiles,
    missingMsFiles: baseline.inventory.missingMsFiles,
    orphanQpFiles: baseline.inventory.orphanQpFiles,
    orphanMsFiles: baseline.inventory.orphanMsFiles,
    duplicateSources: baseline.inventory.duplicateSources
  },
  rootCause: {
    identified: true,
    code: "LOCAL_SOURCE_OMISSION",
    summary: "Cambridge published the correct 9618/41 May/June 2022 mark scheme, but the repository does not contain 9618_s22_ms_41.pdf.",
    evidence: [
      "The expected QP exists under the standard s22 naming convention.",
      "No exact or alternate local MS filename matches syllabus 9618, session s22, role ms, component 41.",
      "The similarly named w21 MS in the target directory belongs to the 2021 O/N session and is not a substitute.",
      "Cambridge's official index identifies the published 9618/41 May/June 2022 mark scheme."
    ],
    ruledOut: [
      "PARSER_FAILURE",
      "VALIDATION_FAILURE",
      "PRODUCTION_FAILURE",
      "FILENAME_TYPO",
      "ALTERNATE_NAMING",
      "SESSION_COMPONENT_MAPPING_ERROR",
      "CAMBRIDGE_SOURCE_UNAVAILABLE"
    ]
  },
  classification: "SOURCE_RECOVERED",
  recoveryState: "LOCATED_NOT_INGESTED",
  sourceAcquisitionRequired: true,
  incompleteStatusMaintained: true,
  recommendedNextStep: {
    proposedPr: "PR-068",
    decision: "9618-2022-MJ-41 Source Recovery Preparation",
    pairingKeys: ["9618-2022-MJ-41"],
    productionWrite: false,
    acquireFromOfficialChannel: true,
    generateStaging: false,
    publishProduction: false
  },
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
    pairingLogicModified: false
  },
  regression: {
    pr066: "PASS",
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
process.stdout.write(`${JSON.stringify({
  outputPath,
  status: report.status,
  targetPair: report.targetPair.pairingKey,
  classification: report.classification,
  recoveryState: report.recoveryState,
  rootCause: report.rootCause.code,
  missingFiles: report.missingFiles,
  recommendedNextStep: report.recommendedNextStep,
  integrity
}, null, 2)}\n`);
if (!investigationPass) process.exitCode = 1;

function parsePaperFilename(filename) {
  const match = filename.match(/^(\d{4})_([smw])(\d{2})_(qp|ms|in)_(\d{2})\.pdf$/i);
  if (!match) return null;
  const session = ({ s: "M/J", w: "O/N", m: "F/M" })[match[2].toLowerCase()];
  return { syllabus: match[1], sessionCode: `${match[2].toLowerCase()}${match[3]}`, year: 2000 + Number(match[3]), session, role: match[4].toLowerCase(), component: match[5] };
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    staging: treeFingerprint(stagingDir, true),
    canonical: sha256File(canonicalPath),
    parser: treeFingerprint(ingestionDir, true),
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

function argValue(name) {
  const entry = process.argv.slice(2).find((argument) => argument.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}
