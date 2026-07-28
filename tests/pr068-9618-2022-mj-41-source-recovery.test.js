const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr068-9618-2022-mj-41-source-recovery-report.json");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const recoveredPath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_ms_41.pdf");
const productionHashBefore = sha256(storePath);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "PR-068-9618-2022-MJ-41-Source-Recovery-Preparation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.deepEqual(report.targetPair, {
  pairingKey: "9618-2022-MJ-41",
  syllabus: "9618",
  year: 2022,
  session: "M/J",
  sessionCode: "s22",
  component: "41",
  questionPaperFilename: "9618_s22_qp_41.pdf",
  markSchemeFilename: "9618_s22_ms_41.pdf",
  sourceDirectory: path.dirname(recoveredPath)
});
assert.equal(report.acquisition.status, "ACQUIRED");
assert.equal(report.acquisition.sourceType, "TRUSTED_SOURCE_WITH_VERIFIABLE_OFFICIAL_IDENTITY");
assert.equal(report.acquisition.originalFilename, "9618_s22_ms_41.pdf");
assert.equal(report.acquisition.repositoryFilename, "9618_s22_ms_41.pdf");
assert.equal(report.acquisition.acquisitionDate, "2026-07-14");
assert.equal(report.acquisition.stagingGenerated, false);
assert.equal(report.acquisition.productionPublished, false);
assert.equal(report.sourceEvidence.repositoryPath, recoveredPath);
assert.equal(report.sourceEvidence.sha256, "203cc5900d90e14ce40e48b2d9943d762a5d2ae25c8f38c51221ed27bc8cceb6");
assert.equal(report.sourceEvidence.fileSize, 308797);
assert.equal(report.sourceEvidence.pageCount, 34);
assert.equal(report.sourceEvidence.pdfVersion, "PDF 1.3");
assert.equal(report.sourceEvidence.metadataTitle, "Microsoft Word - 9618_s22_ms_41");
assert.equal(report.sourceEvidence.visualVerification, "PASS");
assert.deepEqual(report.identityVerification, {
  status: "PASS",
  syllabus: { expected: "9618", actual: "9618", matches: true },
  component: { expected: "41", actual: "41", matches: true },
  sessionCode: { expected: "s22", actual: "s22", matches: true },
  year: { expected: 2022, actual: 2022, matches: true },
  session: { expected: "M/J", actual: "M/J", matches: true },
  documentRole: { expected: "MARK_SCHEME", actual: "MARK_SCHEME", matches: true },
  maximumMark: { expected: 75, actual: 75, matches: true },
  printedPages: { expected: 34, actual: 34, matches: true },
  unrelatedSubstituteUsed: false
});
assert.equal(report.integrityVerification.status, "PASS");
assert.equal(report.integrityVerification.fileExists, true);
assert.equal(report.integrityVerification.fileReadable, true);
assert.equal(report.integrityVerification.isPdf, true);
assert.equal(report.integrityVerification.nonEmpty, true);
assert.equal(report.integrityVerification.opensSuccessfully, true);
assert.equal(report.integrityVerification.pageCountPositive, true);
assert.deepEqual(report.sourceChanges, {
  added: [recoveredPath],
  modified: [],
  deleted: [],
  unrelatedSourceAssetsUnchanged: true,
  onlyIntendedSourceAssetChanged: true
});
assert.deepEqual(report.inventoryBefore, {
  totalPdfFiles: 266,
  sourcePairs: 118,
  completeSourcePairs: 117,
  incompleteSourcePairs: 1,
  missingMsFiles: ["9618-2022-MJ-41"]
});
assert.deepEqual(report.inventoryAfter, {
  totalPdfFiles: 267,
  sourcePairs: 118,
  completeSourcePairs: 118,
  incompleteSourcePairs: 0,
  missingQpFiles: [],
  missingMsFiles: [],
  orphanQpFiles: [],
  orphanMsFiles: []
});
assert.deepEqual(report.remainingIncompleteSources, []);
assert.deepEqual(report.duplicateSources.map((entry) => entry.pairingKey), ["9618-2021-ON-41"]);
assert.equal(report.duplicateSources[0].msFiles.length, 2);
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert(Object.values(report.stableModules).every((modified) => modified === false));
assert.equal(report.regression.pr066, "PASS");
assert.equal(report.regression.pr067, "PASS");
assert.equal(report.regression.phase1, "PASS (20/20)");
assert.equal(report.regression.phase2, "PASS (120/120)");
assert.equal(report.regression.fullNpmTest, "PASS");
assert.equal(report.regression.prismaValidate, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.deepEqual(report.next, {
  proposedPr: "PR-069",
  decision: "9618-2022-MJ-41 Staging Generation and Validation",
  pairingKeys: ["9618-2022-MJ-41"],
  productionWrite: false,
  generateStaging: true,
  publishProduction: false
});
assert.equal(fs.existsSync(recoveredPath), true);
assert.equal(sha256(recoveredPath), report.sourceEvidence.sha256);
assert.equal(sha256(storePath), productionHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
