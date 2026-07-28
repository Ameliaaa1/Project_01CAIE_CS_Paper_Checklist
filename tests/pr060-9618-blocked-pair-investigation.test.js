const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const productionHashBefore = sha256(storePath);
const report = JSON.parse(fs.readFileSync(path.join(rootDir, "output", "production-expansion", "pr060-9618-blocked-pair-investigation-report.json"), "utf8"));

assert.equal(report.generatedFor, "PR-060-9618-Blocked-Pair-Investigation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.blockedPairsReviewed.expected, 9);
assert.equal(report.blockedPairsReviewed.actual, 9);
assert.equal(report.blockedPairsReviewed.allReviewed, true);
assert.equal(report.blockedPairsReviewed.allRemainUnpublished, true);
assert.equal(report.investigationResults.length, 9);
assert(report.investigationResults.every((result) => result.rootCauseCategory.code === "A"));
assert(report.investigationResults.every((result) => result.rootCauseCategory.parserIssue === false));
assert(report.investigationResults.every((result) => result.rootCauseCategory.canonicalMappingIssue === false));
assert(report.investigationResults.every((result) => result.rootCauseCategory.humanReviewRequired === false));
assert(report.investigationResults.every((result) => result.validationWarnings.every((warning) => warning.code === "SUSPICIOUS_GLYPHS_REMAIN")));
assert(report.investigationResults.every((result) => result.failedChecks.every((failure) => failure.check === "CANONICAL_TEXT_CLEAN")));
assert(report.investigationResults.every((result) => result.parserEvidence.every((evidence) => evidence.assessment === "PARSER_OUTPUT_CORRECT" && evidence.rawTextPreservesSymbols)));
assert(report.investigationResults.every((result) => result.canonicalEvidence.every((evidence) => evidence.assessment === "CANONICAL_MAPPING_CORRECT")));
assert.deepEqual(report.rootCauseSummary.categories, {
  A_VALIDATION_FALSE_POSITIVE: 9,
  B_PARSER_ISSUE: 0,
  C_CANONICAL_MAPPING_ISSUE: 0,
  D_DATA_QUALITY_ISSUE: 0,
  E_HUMAN_REVIEW_REQUIRED: 0
});
assert.deepEqual(report.rootCauseSummary.subtypes, {
  STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC: 7,
  CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE: 2
});
assert.equal(report.rootCauseSummary.affectedRoleDocuments, 11);
assert.equal(report.rootCauseSummary.logicalP1Warnings, 11);
assert.equal(report.rootCauseSummary.persistedP1Rows, 11);
const staleResults = report.investigationResults.filter((result) => result.rootCauseSubtypes.includes("STALE_LEGAL_MULTIPLICATION_GLYPH_DIAGNOSTIC"));
assert(staleResults.every((result) => result.canonicalEvidence.every((evidence) => evidence.pages.every((page) => page.symbols.includes("×") && page.currentRecomputedSuspiciousCount === 0))));
const nullResults = report.investigationResults.filter((result) => result.rootCauseSubtypes.includes("CURRENT_NULL_POINTER_GLYPH_FALSE_POSITIVE"));
assert.deepEqual(nullResults.map((result) => result.pairingKey), ["9618-2021-MJ-21", "9618-2021-MJ-23"]);
assert(nullResults.every((result) => result.parserEvidence.every((evidence) => evidence.historicalSnapshotUsed === true)));
assert(nullResults.every((result) => result.canonicalEvidence.every((evidence) => evidence.pages.every((page) => page.symbols.includes("Ø") && page.currentRecomputedSuspiciousCount === 0))));
assert.deepEqual(report.recommendedFixPRs.map((fix) => fix.proposedPr), ["PR-061", "PR-062"]);
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert.equal(report.investigationPrinciples.mutationApplied, false);
assert.equal(report.investigationPrinciples.validationRuleModified, false);
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(sha256(storePath), productionHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
