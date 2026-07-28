const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr067-9618-incomplete-source-investigation-report.json");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const expectedMsPath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_ms_41.pdf");
const productionHashBefore = sha256(storePath);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "PR-067-9618-Incomplete-Source-Investigation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.auditOnly, true);
assert.deepEqual(report.targetPair, {
  pairingKey: "9618-2022-MJ-41",
  syllabus: "9618",
  year: 2022,
  session: "M/J",
  sessionCode: "s22",
  component: "41",
  expectedQpFilename: "9618_s22_qp_41.pdf",
  expectedMsFilename: "9618_s22_ms_41.pdf"
});
assert.equal(report.sourceEvidence.local.questionPaperPresent, true);
assert.equal(report.sourceEvidence.local.markSchemePresent, false);
assert.equal(report.sourceEvidence.local.expectedMarkSchemePath, expectedMsPath);
assert.equal(report.sourceEvidence.official.officiallyPublished, true);
assert.equal(report.sourceEvidence.official.documentIdentity.syllabusComponent, "9618/41");
assert.equal(report.sourceEvidence.official.documentIdentity.session, "May/June 2022");
assert.equal(report.sourceEvidence.official.documentIdentity.documentRole, "MARK_SCHEME");
assert.equal(report.sourceEvidence.official.documentIdentity.maximumMark, 75);
assert.equal(report.sourceEvidence.official.documentIdentity.printedPages, 34);
assert.equal(report.sourceEvidence.official.directFetch.httpStatus, 404);
assert.equal(report.sourceEvidence.official.directFetch.ingestedIntoRepository, false);
assert.equal(report.directoryScan.expectedQpFound, true);
assert.equal(report.directoryScan.expectedMsFound, false);
assert.equal(report.directoryScan.exactMsMatches.length, 0);
assert(report.directoryScan.misplacedMatches.some((entry) => entry.filename === "9618_w21_ms_41.pdf"));
assert.deepEqual(report.namingPatternValidation, {
  expectedQpFilename: "9618_s22_qp_41.pdf",
  expectedMsFilename: "9618_s22_ms_41.pdf",
  qpPatternValid: true,
  msPatternValid: true,
  typoFound: false,
  alternateNamingFound: false,
  archiveNamingFound: false,
  sessionComponentMappingError: false
});
assert.deepEqual(report.missingFiles, [expectedMsPath]);
assert.deepEqual(report.alternateMatches, []);
assert.equal(report.inventoryCrossCheck.incompleteSourcePairs, 1);
assert.deepEqual(report.inventoryCrossCheck.incompletePairingKeys, ["9618-2022-MJ-41"]);
assert.deepEqual(report.inventoryCrossCheck.orphanQpFiles, [path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_qp_41.pdf")]);
assert.equal(report.inventoryCrossCheck.duplicateSources.length, 1);
assert.equal(report.rootCause.code, "LOCAL_SOURCE_OMISSION");
assert.equal(report.rootCause.identified, true);
assert.deepEqual(report.rootCause.ruledOut, [
  "PARSER_FAILURE",
  "VALIDATION_FAILURE",
  "PRODUCTION_FAILURE",
  "FILENAME_TYPO",
  "ALTERNATE_NAMING",
  "SESSION_COMPONENT_MAPPING_ERROR",
  "CAMBRIDGE_SOURCE_UNAVAILABLE"
]);
assert.equal(report.classification, "SOURCE_RECOVERED");
assert.equal(report.recoveryState, "LOCATED_NOT_INGESTED");
assert.equal(report.sourceAcquisitionRequired, true);
assert.deepEqual(report.recommendedNextStep, {
  proposedPr: "PR-068",
  decision: "9618-2022-MJ-41 Source Recovery Preparation",
  pairingKeys: ["9618-2022-MJ-41"],
  productionWrite: false,
  acquireFromOfficialChannel: true,
  generateStaging: false,
  publishProduction: false
});
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert.equal(report.regression.phase1, "PASS (20/20)");
assert.equal(report.regression.phase2, "PASS (120/120)");
assert.equal(report.regression.fullNpmTest, "PASS");
assert.equal(report.regression.prismaValidate, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.equal(sha256(storePath), productionHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
