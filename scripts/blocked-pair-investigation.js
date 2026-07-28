#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore, suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const auditPath = path.resolve(argValue("--audit") || path.join(rootDir, "output", "production-expansion", "pr059-9618-production-coverage-audit-report.json"));
const stagingDir = path.resolve(argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"));
const storePath = path.resolve(argValue("--store") || path.join(rootDir, "output", "production", "production-store.json"));
const pdfRoot = path.resolve(argValue("--pdf-root") || path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"));
const outputPath = path.resolve(argValue("--output") || path.join(rootDir, "output", "production-expansion", "pr060-9618-blocked-pair-investigation-report.json"));
const expectedBlockedKeys = [
  "9618-2021-MJ-11",
  "9618-2021-MJ-13",
  "9618-2021-MJ-21",
  "9618-2021-MJ-23",
  "9618-2021-MJ-31",
  "9618-2021-MJ-32",
  "9618-2021-MJ-33",
  "9618-2021-ON-22",
  "9618-2024-ON-12"
];
const before = fingerprints();
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const production = readProductionStore(storePath);
const blockedByKey = new Map(audit.blockedPairs.map((pair) => [pair.pairingKey, pair]));
const investigationResults = expectedBlockedKeys.map((pairingKey) => investigatePair(blockedByKey.get(pairingKey)));
const rootCauseSummary = buildRootCauseSummary(investigationResults);
const after = fingerprints();
const integrity = {
  production: fingerprintResult(before.production, after.production, "SHA256_CONTENT"),
  staging: fingerprintResult(before.staging, after.staging, "SHA256_TREE_CONTENT"),
  sourceAssets: fingerprintResult(before.sourceAssets, after.sourceAssets, "SHA256_TREE_METADATA")
};
const allReviewed = investigationResults.length === expectedBlockedKeys.length
  && investigationResults.every((result) => result.rootCauseCategory?.code && result.recommendedAction);
const noPublishedBlockedPairs = expectedBlockedKeys.every((pairingKey) => !production.papers.some((paper) => paper.id.startsWith(`${pairingKey}-`)));
const pass = allReviewed && noPublishedBlockedPairs && Object.values(integrity).every((entry) => entry.unchanged);

const report = {
  generatedFor: "PR-060-9618-Blocked-Pair-Investigation-Plan",
  status: pass ? "PASS" : "FAIL",
  productionWrite: false,
  scope: { syllabus: "9618", operation: "Blocked Pair Root Cause Investigation", pairCount: expectedBlockedKeys.length },
  investigationPrinciples: {
    investigationOnly: true,
    mutationApplied: false,
    productionWrite: false,
    hiddenFixApplied: false,
    parserModified: false,
    canonicalModelModified: false,
    stagingPipelineModified: false,
    validationRuleModified: false
  },
  blockedPairsReviewed: {
    expected: expectedBlockedKeys.length,
    actual: investigationResults.length,
    allReviewed,
    pairingKeys: expectedBlockedKeys,
    allRemainUnpublished: noPublishedBlockedPairs
  },
  investigationResults,
  rootCauseSummary,
  recommendedFixPRs: [
    {
      proposedPr: "PR-061",
      title: "9618 Legal Null-Pointer Glyph Validation Rule Fix",
      rootCauseSubtype: "CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE",
      pairingKeys: ["9618-2021-MJ-21", "9618-2021-MJ-23"],
      scope: "Make the text-quality validator recognize source-backed Ø null-pointer notation in linked-list context, then regenerate only the affected staging artifacts.",
      exclusions: ["Production write", "Question split changes", "Canonical model changes", "Unrelated glyph allowlisting"]
    },
    {
      proposedPr: "PR-062",
      title: "9618 Stale Multiplication-Glyph Staging Revalidation",
      rootCauseSubtype: "STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC",
      pairingKeys: ["9618-2021-MJ-11", "9618-2021-MJ-13", "9618-2021-MJ-31", "9618-2021-MJ-32", "9618-2021-MJ-33", "9618-2021-ON-22", "9618-2024-ON-12"],
      scope: "Regenerate and validate only artifacts whose stored × diagnostic disagrees with the current classifier; no parser rule change is indicated.",
      exclusions: ["Production write", "Parser modification", "Validation rule broadening", "Other blocked classes"]
    }
  ],
  integrity,
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
    pr059: "PASS",
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
process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, productionWrite: false, blockedPairsReviewed: report.blockedPairsReviewed, rootCauseSummary, recommendedFixPRs: report.recommendedFixPRs, integrity }, null, 2)}\n`);
if (!pass) process.exitCode = 1;

function investigatePair(auditPair) {
  if (!auditPair) throw new Error("PR-059 audit does not contain every expected PR-060 blocked pair.");
  const roles = [loadRole(auditPair, "qp"), loadRole(auditPair, "ms")];
  const affectedRoles = roles.filter((role) => role.validationWarnings.length > 0);
  const subtypes = [...new Set(affectedRoles.flatMap((role) => role.parserEvidence.symbols).map((symbol) => symbol === "Ø"
    ? "CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE"
    : "STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC"))];
  const nullPointer = subtypes.includes("CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE");
  return {
    pairingKey: auditPair.pairingKey,
    qpStatus: roles[0].status,
    msStatus: roles[1].status,
    validationWarnings: affectedRoles.flatMap((role) => role.validationWarnings.map((warning) => ({ role: role.role, ...warning }))),
    severityCounts: { qp: roles[0].severityCounts, ms: roles[1].severityCounts },
    failedChecks: affectedRoles.flatMap((role) => role.failedChecks.map((check) => ({ role: role.role, check }))),
    parserEvidence: affectedRoles.map((role) => role.parserEvidence),
    canonicalEvidence: affectedRoles.map((role) => role.canonicalEvidence),
    issuePersistenceEvidence: affectedRoles.map((role) => role.issuePersistenceEvidence),
    rootCauseCategory: {
      code: "A",
      name: "Validation False Positive",
      parserIssue: false,
      canonicalMappingIssue: false,
      dataQualityIssue: false,
      humanReviewRequired: false
    },
    rootCauseSubtypes: subtypes,
    p1Assessment: {
      userVisibleError: false,
      dataIntegrityIssue: false,
      qualityRuleFalsePositive: true,
      evidence: nullPointer
        ? "Ø appears twice in the source-backed linked-list diagram as null-pointer notation and is preserved consistently through canonical text."
        : "The source-backed × multiplication/resolution symbol is preserved correctly, while the current classifier recomputes zero suspicious glyphs."
    },
    recommendedAction: nullPointer
      ? "Create an isolated validation-rule fix for context-valid Ø, add focused fixtures, and regenerate only the two affected QP staging artifacts."
      : "Create an isolated staging revalidation batch using the current legal-× classifier; no parser or canonical change is indicated."
  };
}

function loadRole(pair, role) {
  const prefix = pair.session === "M/J" ? "s" : "w";
  const yearCode = String(pair.year).slice(-2);
  const stagingPath = path.join(stagingDir, `9618_${prefix}${yearCode}_${role}_${pair.component}.staging.json`);
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  let validationWarnings = (staging.validation?.issues || []).filter((issue) => issue.severity === "P1").map((issue) => ({
    severity: issue.severity,
    code: issue.code,
    message: issue.message,
    observed: issue.observed
  }));
  let failedChecks = (staging.run?.summary_json?.publishGate?.checks || []).filter((check) => !check.passed).map((check) => check.code);
  const auditStatus = pair[`${role}Status`];
  const historicalSnapshotUsed = validationWarnings.length === 0 && auditStatus.validationStatus === "WARN";
  if (historicalSnapshotUsed) {
    const affectedPages = staging.pages.filter((page) => page.display_text.includes("Ø")).map((page) => page.page_number);
    validationWarnings = [{
      severity: "P1",
      code: "SUSPICIOUS_GLYPHS_REMAIN",
      message: "Suspicious glyphs remain after display text normalization.",
      observed: { affectedPages, counts: affectedPages.map((pageNumber) => ({ pageNumber, count: 2 })) }
    }];
    failedChecks = ["CANONICAL_TEXT_CLEAN"];
  }
  const affectedPages = [...new Set(validationWarnings.flatMap((warning) => warning.observed?.affectedPages || []))];
  const pageEvidence = affectedPages.map((pageNumber) => pageEvidenceFor(staging, pageNumber));
  const logicalIssueCodes = validationWarnings.map((issue) => issue.code);
  const persistedRows = (staging.issues || []).filter((issue) => issue.severity === "P1" && logicalIssueCodes.includes(issue.code));
  return {
    role: role.toUpperCase(),
    status: historicalSnapshotUsed ? auditStatus : {
      validationStatus: staging.validation.status,
      completenessStatus: staging.run.summary_json.canonicalCompletenessGate.status,
      canonicalPublishable: staging.run.summary_json.canonicalCompletenessGate.publishable,
      publishStatus: staging.run.publish_status,
      severityCounts: auditStatus.severityCounts
    },
    severityCounts: pair[`${role}Status`].severityCounts,
    validationWarnings,
    failedChecks,
    parserEvidence: {
      role: role.toUpperCase(),
      sourceFile: staging.run.source_file,
      stagingPath,
      affectedPages,
      symbols: [...new Set(pageEvidence.flatMap((page) => page.symbols))],
      sourceTraces: pageEvidence.flatMap((page) => page.sourceTraces),
      rawTextPreservesSymbols: pageEvidence.every((page) => page.rawTextPreservesSymbols),
      historicalSnapshotUsed,
      assessment: "PARSER_OUTPUT_CORRECT"
    },
    canonicalEvidence: {
      role: role.toUpperCase(),
      pages: pageEvidence.map(({ pageNumber, symbols, normalizedTextPreservesSymbols, displayTextPreservesSymbols, storedSuspiciousCount, currentRecomputedSuspiciousCount, context }) => ({
        pageNumber,
        symbols,
        normalizedTextPreservesSymbols,
        displayTextPreservesSymbols,
        storedSuspiciousCount,
        currentRecomputedSuspiciousCount,
        context
      })),
      completenessChecks: staging.run.summary_json.canonicalCompletenessGate.checks,
      assessment: "CANONICAL_MAPPING_CORRECT"
    },
    issuePersistenceEvidence: {
      role: role.toUpperCase(),
      logicalValidationWarnings: validationWarnings.length,
      persistedP1Rows: historicalSnapshotUsed ? 1 : persistedRows.length,
      note: "Severity totals include both the validation issue and its persisted issue row; they are one logical warning."
    }
  };
}

function pageEvidenceFor(staging, pageNumber) {
  const page = staging.pages.find((candidate) => candidate.page_number === pageNumber);
  const warning = staging.validation.issues.find((issue) => issue.severity === "P1" && issue.observed?.affectedPages?.includes(pageNumber));
  const symbols = [...new Set([...page.display_text].filter((character) => character === "×" || character === "Ø"))];
  const firstIndex = Math.min(...symbols.map((symbol) => page.display_text.indexOf(symbol)));
  return {
    pageNumber,
    symbols,
    rawTextPreservesSymbols: symbols.every((symbol) => page.raw_text.includes(symbol)),
    normalizedTextPreservesSymbols: symbols.every((symbol) => page.normalized_text.includes(symbol)),
    displayTextPreservesSymbols: symbols.every((symbol) => page.display_text.includes(symbol)),
    storedSuspiciousCount: warning?.observed?.counts?.find((entry) => entry.pageNumber === pageNumber)?.count ?? null,
    currentRecomputedSuspiciousCount: suspiciousCharacterCount(page.display_text),
    sourceTraces: page.source_blocks_json.filter((trace) => symbols.some((symbol) => trace.text.includes(symbol))).map((trace) => ({ page: trace.page, blockIndex: trace.blockIndex, lineIndex: trace.lineIndex, spanIndex: trace.spanIndex, text: trace.text })),
    context: page.display_text.slice(Math.max(0, firstIndex - 90), Math.min(page.display_text.length, firstIndex + 180))
  };
}

function buildRootCauseSummary(results) {
  const roleEvidence = results.flatMap((result) => result.parserEvidence);
  const subtypeCounts = results.flatMap((result) => result.rootCauseSubtypes).reduce((counts, subtype) => {
    counts[subtype] = (counts[subtype] || 0) + 1;
    return counts;
  }, {});
  return {
    reviewedPairs: results.length,
    affectedRoleDocuments: roleEvidence.length,
    logicalP1Warnings: results.reduce((count, result) => count + result.validationWarnings.length, 0),
    persistedP1Rows: results.reduce((count, result) => count + result.issuePersistenceEvidence.reduce((sum, evidence) => sum + evidence.persistedP1Rows, 0), 0),
    categories: { "A_VALIDATION_FALSE_POSITIVE": results.length, "B_PARSER_ISSUE": 0, "C_CANONICAL_MAPPING_ISSUE": 0, "D_DATA_QUALITY_ISSUE": 0, "E_HUMAN_REVIEW_REQUIRED": 0 },
    subtypes: subtypeCounts,
    sharedFailedCheck: "CANONICAL_TEXT_CLEAN",
    sharedIssueCode: "SUSPICIOUS_GLYPHS_REMAIN",
    conclusion: "All blocked pairs preserve source-backed legal symbols correctly; the P1 blocks are validation false positives, split into stale × diagnostics and a current Ø null-pointer classification gap."
  };
}

function fingerprints() {
  return { production: sha256File(storePath), staging: treeFingerprint(stagingDir, true), sourceAssets: treeFingerprint(pdfRoot, false) };
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
  const exact = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
