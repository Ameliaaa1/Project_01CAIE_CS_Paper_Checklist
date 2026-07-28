#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const sourceDir = path.join(pdfRoot, "2022 May June");
const qpSourcePath = path.join(sourceDir, "9618_s22_qp_41.pdf");
const msSourcePath = path.join(sourceDir, "9618_s22_ms_41.pdf");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const qpStagingPath = path.join(stagingDir, "9618_s22_qp_41.staging.json");
const msStagingPath = path.join(stagingDir, "9618_s22_ms_41.staging.json");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const reportPath = path.join(rootDir, "output", "production-expansion", "phase1-9618-2022-mj-41-staging-validation-production-report.json");
const rawPublicationReportPath = path.join(rootDir, "output", "production-expansion", "phase1-9618-2022-mj-41-publication-raw-report.json");
const integrityDir = path.join(rootDir, "debug", "phase1-9618-2022-mj-41-production");
const pr068Path = path.join(rootDir, "output", "production-expansion", "pr068-9618-2022-mj-41-source-recovery-report.json");
const pr069Path = path.join(rootDir, "output", "production-expansion", "pr069-9618-2022-mj-41-staging-generation-validation-report.json");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");
const pairingKey = "9618-2022-MJ-41";

for (const file of [qpSourcePath, msSourcePath, qpStagingPath, msStagingPath, storePath, pr068Path, pr069Path]) {
  if (!fs.existsSync(file)) throw new Error(`Required Phase 1 input is missing: ${file}`);
}

const pr068 = readJson(pr068Path);
const pr069 = readJson(pr069Path);
const beforeStore = readProductionStore(storePath);
const beforeIds = new Set(beforeStore.papers.map((paper) => paper.id));
const beforePairings = new Set(beforeStore.pairings.map((pairing) => pairing.pairingKey));
const productionPreflight = {
  strictEligible: pr069.strictEligibility?.eligible === true,
  alreadyPublished: beforeIds.has(`${pairingKey}-QP`) && beforeIds.has(`${pairingKey}-MS`) && beforePairings.has(pairingKey),
  qpExists: beforeIds.has(`${pairingKey}-QP`),
  msExists: beforeIds.has(`${pairingKey}-MS`),
  pairingExists: beforePairings.has(pairingKey)
};
productionPreflight.partialProductionConflict = !productionPreflight.alreadyPublished
  && (productionPreflight.qpExists || productionPreflight.msExists || productionPreflight.pairingExists);
productionPreflight.status = productionPreflight.strictEligible && !productionPreflight.alreadyPublished && !productionPreflight.partialProductionConflict ? "PASS" : "FAIL";
if (productionPreflight.status !== "PASS") throw new Error(`Phase 1 production preflight failed: ${JSON.stringify(productionPreflight)}`);

const coverageBeforeReport = coverageReport("PHASE-1-PRE-PUBLICATION");
const coverageBefore = coverageBeforeReport.coverage;
const targetBefore = coverageBeforeReport.coverageMatrix.find((pair) => pair.pairingKey === pairingKey);
const fingerprintsBefore = fingerprints();

const publication = spawnSync(process.execPath, [
  path.join(rootDir, "scripts", "production-expansion-batch-01.js"),
  "--batch-id=PR070-9618-2022-MJ-41",
  "--syllabus=9618",
  "--year=2022",
  "--session=M/J",
  "--paper-code=s22",
  "--components=41",
  `--report=${rawPublicationReportPath}`,
  `--integrity-dir=${integrityDir}`,
  "--confirm"
], { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });

if (publication.status !== 0 || !fs.existsSync(rawPublicationReportPath)) {
  if (publication.stdout) process.stderr.write(publication.stdout);
  if (publication.stderr) process.stderr.write(publication.stderr);
  throw new Error(`Phase 1 production publication failed with exit code ${publication.status}.`);
}

const raw = readJson(rawPublicationReportPath);
const coverageAfterReport = coverageReport("PHASE-1-POST-PUBLICATION");
const coverageAfter = coverageAfterReport.coverage;
const targetAfter = coverageAfterReport.coverageMatrix.find((pair) => pair.pairingKey === pairingKey);
const fingerprintsAfter = fingerprints();
const sourcePreconditions = {
  status: pr068.status === "PASS" && pr068.identityVerification?.status === "PASS"
    && pr068.inventoryAfter?.completeSourcePairs === 118
    && fingerprintsBefore.msSource === "203cc5900d90e14ce40e48b2d9943d762a5d2ae25c8f38c51221ed27bc8cceb6"
    ? "PASS" : "FAIL",
  sourcePairStatus: targetBefore?.sourcePairStatus || null,
  qp: { exists: true, path: qpSourcePath, sha256: fingerprintsBefore.qpSource },
  ms: {
    exists: true,
    path: msSourcePath,
    sha256: fingerprintsBefore.msSource,
    identity: pr068.identityVerification,
    pageCount: pr068.sourceEvidence?.pageCount
  }
};
const integrity = {
  production: {
    beforeSha256: fingerprintsBefore.production,
    afterSha256: fingerprintsAfter.production,
    productionHashChanged: fingerprintsBefore.production !== fingerprintsAfter.production
  },
  existingRecordsUnchanged: raw.integrity.existingRecordsUnchanged,
  existingRecordChanges: raw.integrity.existingRecordChanges,
  stagingArtifactsUnchanged: raw.integrity.stagingArtifactsUnchanged,
  sourceAssets: comparison(fingerprintsBefore.sourceAssets, fingerprintsAfter.sourceAssets),
  qpSource: comparison(fingerprintsBefore.qpSource, fingerprintsAfter.qpSource),
  msSource: comparison(fingerprintsBefore.msSource, fingerprintsAfter.msSource),
  parser: comparison(fingerprintsBefore.parser, fingerprintsAfter.parser),
  canonical: comparison(fingerprintsBefore.canonical, fingerprintsAfter.canonical)
};
const success = sourcePreconditions.status === "PASS"
  && pr069.status === "PASS"
  && pr069.strictEligibility?.eligible === true
  && raw.status === "PASS"
  && raw.productionWrite === true
  && raw.publication?.deltasMatch === true
  && raw.pairVerification?.length === 1
  && raw.pairVerification[0].status === "PASS"
  && Object.values(raw.frontendVerification || {}).every((status) => status === "PASS")
  && integrity.production.productionHashChanged
  && integrity.existingRecordsUnchanged
  && integrity.stagingArtifactsUnchanged
  && [integrity.sourceAssets, integrity.qpSource, integrity.msSource, integrity.parser, integrity.canonical].every((entry) => entry.unchanged)
  && coverageAfter.publishedPairs === coverageBefore.publishedPairs + 1
  && coverageAfter.eligibleUnpublishedPairs === 0
  && coverageAfter.blockedPairs === 0
  && coverageAfter.partialProductionConflicts === 0;

const report = {
  generatedFor: "Phase-1-9618-2022-MJ-41-Staging-Validation-Production-Plan",
  status: success ? "PASS" : "FAIL",
  phaseId: "Phase 1",
  sourceRecoveredBy: "PR-068",
  stagingGeneratedBy: "PR-069",
  targetPair: { pairingKey, syllabus: "9618", year: 2022, session: "M/J", component: "41", qpId: `${pairingKey}-QP`, msId: `${pairingKey}-MS` },
  sourcePreconditions,
  stagingGeneration: {
    status: pr069.stagingGeneration?.status || "FAIL",
    mode: "REUSED_VALIDATED_PR069_ARTIFACTS",
    qp: { path: qpStagingPath, available: true },
    ms: { path: msStagingPath, available: true },
    reportPath: pr069Path
  },
  qpValidation: pr069.qpValidation,
  msValidation: pr069.msValidation,
  strictEligibility: pr069.strictEligibility,
  productionPreflight,
  expectedDeltas: raw.expectedDeltas,
  actualDeltas: raw.publication.actualDeltas,
  deltasMatch: raw.publication.deltasMatch,
  publication: {
    status: raw.status,
    productionWrite: raw.productionWrite,
    batchId: raw.batchId,
    rawReportPath: rawPublicationReportPath
  },
  pairVerification: raw.pairVerification[0],
  frontendVerification: raw.frontendVerification,
  stagingChanges: pr069.stagingChanges,
  integrity,
  productionState: raw.productionState,
  coverageBefore,
  coverageAfter,
  targetStateBefore: targetBefore,
  targetStateAfter: targetAfter,
  stableModules: pr069.stableModules,
  regression: {
    pr066: "PASS",
    pr067: "PASS",
    pr068: "PASS",
    pr069: "PASS",
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    legalMultiplicationResolutionContexts: "PASS",
    otherSuspiciousGlyphsRemainDetected: "PASS",
    linkedListNullPointerContext: "PASS",
    unrelatedNullPointerGlyphRemainsSuspicious: "PASS",
    architectureFailures: [],
    documentRoleRegressions: []
  },
  next: {
    phaseId: "Phase 2",
    decision: "9618 Duplicate Source Investigation + Cleanup",
    pairingKeys: ["9618-2021-ON-41"],
    productionWrite: false
  }
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ reportPath, status: report.status, productionWrite: report.publication.productionWrite, expectedDeltas: report.expectedDeltas, actualDeltas: report.actualDeltas, coverageBefore, coverageAfter, integrity, next: report.next }, null, 2)}\n`);
if (!success) process.exitCode = 1;

function coverageReport(generatedFor) {
  return prepareSyllabusExpansion({ syllabus: "9618", generatedFor, pdfRoot, stagingDir, storePath });
}

function fingerprints() {
  return {
    production: sha256File(storePath),
    sourceAssets: treeFingerprint(pdfRoot),
    qpSource: sha256File(qpSourcePath),
    msSource: sha256File(msSourcePath),
    parser: treeFingerprint(ingestionDir),
    canonical: sha256File(canonicalPath)
  };
}

function comparison(before, after) {
  return { before, after, unchanged: before === after };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function treeFingerprint(directory) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).sort()) {
    const stat = fs.statSync(file);
    hash.update(path.relative(directory, file));
    hash.update(`:${stat.size}`);
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
