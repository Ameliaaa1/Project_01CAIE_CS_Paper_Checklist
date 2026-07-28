const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { stagingArtifactEligibility } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const reportPath = path.join(rootDir, "output", "production-expansion", "pr069-9618-2022-mj-41-staging-generation-validation-report.json");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const qpSourcePath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_qp_41.pdf");
const msSourcePath = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618", "2022 May June", "9618_s22_ms_41.pdf");
const qpStagingPath = path.join(stagingDir, "9618_s22_qp_41.staging.json");
const msStagingPath = path.join(stagingDir, "9618_s22_ms_41.staging.json");
const productionHashBefore = sha256(storePath);
const qpSourceHashBefore = sha256(qpSourcePath);
const msSourceHashBefore = sha256(msSourcePath);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

assert.equal(report.generatedFor, "PR-069-9618-2022-MJ-41-Staging-Generation-and-Validation-Plan");
assert.equal(report.status, "PASS");
assert.equal(report.productionWrite, false);
assert.equal(report.sourceRecoveredBy, "PR-068");
assert.deepEqual(report.targetPair, {
  pairingKey: "9618-2022-MJ-41",
  syllabus: "9618",
  year: 2022,
  session: "M/J",
  component: "41",
  qpId: "9618-2022-MJ-41-QP",
  msId: "9618-2022-MJ-41-MS"
});
assert.equal(report.sourcePreconditions.status, "PASS");
assert.equal(report.sourcePreconditions.qp.exists, true);
assert.equal(report.sourcePreconditions.ms.exists, true);
assert.equal(report.sourcePreconditions.sourcePairStatus, "COMPLETE");
assert.equal(report.sourcePreconditions.ms.identityStatus, "PASS");
assert.equal(report.sourcePreconditions.ms.pageCount, 34);
assert.equal(report.stagingGeneration.status, "PASS");
assert.equal(report.stagingGeneration.qp.generated, true);
assert.equal(report.stagingGeneration.ms.generated, true);
assert.equal(report.stagingGeneration.qp.path, qpStagingPath);
assert.equal(report.stagingGeneration.ms.path, msStagingPath);

for (const [role, validation] of [["question_paper", report.qpValidation], ["mark_scheme", report.msValidation]]) {
  assert.equal(validation.documentRole, role);
  assert.equal(validation.validationStatus, "PASS");
  assert.equal(validation.completenessStatus, "PASS");
  assert.equal(validation.canonicalPublishable, true);
  assert.equal(validation.publishStatus, "READY_TO_PUBLISH");
  assert.equal(validation.severityCounts.P0, 0);
  assert.equal(validation.severityCounts.P1, 0);
  assert.deepEqual(validation.issueCodes, []);
  assert.deepEqual(validation.failedChecks, []);
  assert.equal(validation.completenessEvidence.questionCoverage.status, "PASS");
  assert.equal(validation.completenessEvidence.leafCoverage.status, "PASS");
  assert.equal(validation.completenessEvidence.markCoverage.status, "PASS");
  assert.equal(validation.completenessEvidence.responseAreaCoverage.status, "PASS");
  assert.equal(validation.completenessEvidence.sourceTraceCoverage.status, "PASS");
  assert.equal(validation.completenessEvidence.canonicalStructureCompleteness.status, "PASS");
}
assert(report.qpValidation.counts.questionCount > 0);
assert(report.qpValidation.counts.leafQuestionCount > 0);
assert(report.qpValidation.counts.responseAreaCount > 0);
assert.equal(report.msValidation.counts.questionCount, 0);
assert.equal(report.msValidation.counts.leafQuestionCount, 0);
assert(report.msValidation.counts.markSchemeEntryCount > 0);
assert.deepEqual(report.pairVerification, {
  status: "PASS",
  pairingKey: "9618-2022-MJ-41",
  qpStagingAvailable: true,
  msStagingAvailable: true,
  stagingPairComplete: true,
  sourceTraceAvailable: true,
  qpMsCorrespondence: "PASS"
});
assert.equal(report.strictEligibility.eligible, true);
assert.deepEqual(report.strictEligibility.blockers, []);
assert.deepEqual(report.stagingChanges, {
  added: [msStagingPath, qpStagingPath],
  modified: [],
  deleted: [],
  unrelatedChanges: [],
  unrelatedStagingArtifactsUnchanged: true
});
assert.deepEqual(report.coverageBefore, {
  sourcePairs: 118,
  completeSourcePairs: 118,
  stagingPairs: 25,
  stagingPartialPairs: 0,
  stagingMissingPairs: 93,
  publishedPairs: 25,
  eligibleUnpublishedPairs: 0,
  missingStagingPairs: 93,
  blockedPairs: 0,
  incompleteSourcePairs: 0,
  partialProductionConflicts: 0
});
assert.deepEqual(report.coverageAfter, {
  sourcePairs: 118,
  completeSourcePairs: 118,
  stagingPairs: 26,
  stagingPartialPairs: 0,
  stagingMissingPairs: 92,
  publishedPairs: 25,
  eligibleUnpublishedPairs: 1,
  missingStagingPairs: 92,
  blockedPairs: 0,
  incompleteSourcePairs: 0,
  partialProductionConflicts: 0
});
assert(Object.values(report.integrity).every((entry) => entry.unchanged));
assert(Object.values(report.frontendVerification).every((status) => status === "PASS"));
assert(Object.values(report.stableModules).every((modified) => modified === false));
assert.equal(report.regression.pr066, "PASS");
assert.equal(report.regression.pr067, "PASS");
assert.equal(report.regression.pr068, "PASS");
assert.equal(report.regression.phase1, "PASS (20/20)");
assert.equal(report.regression.phase2, "PASS (120/120)");
assert.equal(report.regression.fullNpmTest, "PASS");
assert.equal(report.regression.prismaValidate, "PASS");
assert.equal(report.regression.legalMultiplicationResolutionContexts, "PASS");
assert.equal(report.regression.otherSuspiciousGlyphsRemainDetected, "PASS");
assert.equal(report.regression.linkedListNullPointerContext, "PASS");
assert.equal(report.regression.unrelatedNullPointerGlyphRemainsSuspicious, "PASS");
assert.deepEqual(report.regression.architectureFailures, []);
assert.deepEqual(report.regression.documentRoleRegressions, []);
assert.deepEqual(report.next, {
  proposedPr: "PR-070",
  decision: "9618-2022-MJ-41 Production Expansion",
  pairingKeys: ["9618-2022-MJ-41"],
  productionWrite: false
});

for (const [file, role] of [[qpStagingPath, "question_paper"], [msStagingPath, "mark_scheme"]]) {
  assert(fs.existsSync(file));
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(staging.papers[0].document_role, role);
  assert.equal(staging.validation.status, "PASS");
  assert.equal(staging.run.summary_json.canonicalCompletenessGate.status, "PASS");
  assert.equal(staging.run.summary_json.canonicalCompletenessGate.publishable, true);
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH");
  assert.equal(stagingArtifactEligibility(file, role).eligible, true);
}
assert.equal(sha256(storePath), productionHashBefore);
assert.equal(sha256(qpSourcePath), qpSourceHashBefore);
assert.equal(sha256(msSourcePath), msSourceHashBefore);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
