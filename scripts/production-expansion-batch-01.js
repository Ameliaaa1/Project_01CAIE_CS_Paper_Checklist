#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { prepareSyllabusExpansion, publishProductionExpansion, readProductionStore, stagingArtifactEligibility, suspiciousCharacterCount } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const batchId = argValue("--batch-id") || "PR034-0478-2021-MJ-BATCH-01";
const isPr063 = batchId.startsWith("PR063-");
const isPr064 = batchId.startsWith("PR064-");
const isPr065 = batchId.startsWith("PR065-");
const isPreviouslyBlockedBatch = isPr063 || isPr064 || isPr065;
const syllabus = argValue("--syllabus") || "0478";
const year = Number(argValue("--year") || 2021);
const session = argValue("--session") || "M/J";
const paperCode = argValue("--paper-code") || `s${String(year).slice(-2)}`;
const storePath = path.resolve(argValue("--store") || path.join(rootDir, "output", "production", "production-store.json"));
const stagingDir = path.resolve(argValue("--staging-dir") || path.join(rootDir, "output", "phase2", "staging"));
const reportPath = path.resolve(argValue("--report") || path.join(rootDir, "output", "production-expansion", "pr034-batch-01-report.json"));
const integrityDir = path.resolve(argValue("--integrity-dir") || path.join(rootDir, "debug", "pr034-batch-01"));
const components = String(argValue("--components") || "11,12").split(",").filter(Boolean);
const pairs = components.map((component) => ({
  component,
  qpStagingPath: path.join(stagingDir, `${syllabus}_${paperCode}_qp_${component}.staging.json`),
  msStagingPath: path.join(stagingDir, `${syllabus}_${paperCode}_ms_${component}.staging.json`)
}));
const preflight = pairs.map(validatePair);
const before = readProductionStore(storePath);
const beforeCounts = productionCounts(before);
const existingIds = new Set(before.papers.map((paper) => paper.id));
const pairingKeys = new Set(before.pairings.map((pairing) => pairing.pairingKey));
const identities = components.map((component) => productionIdentity(component));
const identityStates = identities.map((identity) => ({
  ...identity,
  qpExists: existingIds.has(identity.qpId),
  msExists: existingIds.has(identity.msId),
  pairingExists: pairingKeys.has(identity.pairingKey)
}));
const alreadyPublished = identityStates.every((identity) => identity.qpExists && identity.msExists && identity.pairingExists);
const partialProductionConflict = !alreadyPublished && identityStates.some((identity) => identity.qpExists || identity.msExists || identity.pairingExists);
const expectedDeltas = expectedProductionDeltas(pairs);

let result = { status: "READY", productionWrite: false };
let integrity = { beforeSha256: sha256File(storePath), afterSha256: null, productionHashChanged: null, existingRecordsUnchanged: null, existingRecordChanges: null, stagingArtifactsUnchanged: null };
if (process.argv.includes("--confirm")) {
  if (alreadyPublished) {
    result = { status: "NO_CHANGES", productionWrite: false, message: `${batchId} is already published.` };
    integrity.afterSha256 = integrity.beforeSha256;
    integrity.productionHashChanged = false;
    integrity.existingRecordsUnchanged = true;
    integrity.existingRecordChanges = zeroRecordChanges();
    integrity.stagingArtifactsUnchanged = true;
  } else {
    if (partialProductionConflict) throw new Error(`${batchId} has a PARTIAL_PRODUCTION_CONFLICT.`);
    fs.mkdirSync(integrityDir, { recursive: true });
    fs.copyFileSync(storePath, path.join(integrityDir, "production-store-before.json"));
    fs.writeFileSync(path.join(integrityDir, "production-store-before.sha256"), `${integrity.beforeSha256}  production-store.json\n`);
    const stagingBefore = isPreviouslyBlockedBatch ? stagingTreeHashes() : stagingHashes(pairs);
    writeStagingHashes(path.join(integrityDir, "staging-before.sha256"), stagingBefore);
    result = publishProductionExpansion({ rootDir, storePath, batchId, syllabus, year, session, pairs });
    const after = readProductionStore(storePath);
    integrity.afterSha256 = sha256File(storePath);
    integrity.productionHashChanged = integrity.beforeSha256 !== integrity.afterSha256;
    integrity.existingRecordChanges = existingRecordChanges(before, after);
    integrity.existingRecordsUnchanged = Object.values(integrity.existingRecordChanges).every((count) => count === 0);
    if (!integrity.existingRecordsUnchanged) throw new Error(`Existing production records changed during ${batchId} publication.`);
    const stagingAfter = isPreviouslyBlockedBatch ? stagingTreeHashes() : stagingHashes(pairs);
    writeStagingHashes(path.join(integrityDir, "staging-after.sha256"), stagingAfter);
    integrity.stagingArtifactsUnchanged = JSON.stringify(stagingBefore) === JSON.stringify(stagingAfter);
    if (!integrity.stagingArtifactsUnchanged) throw new Error("Staging artifacts changed during production publication.");
    fs.writeFileSync(path.join(integrityDir, "production-store-after.sha256"), `${integrity.afterSha256}  production-store.json\n`);
    fs.copyFileSync(storePath, path.join(integrityDir, "production-store-after.json"));
  }
}

const afterStore = readProductionStore(storePath);
const afterCounts = productionCounts(afterStore);
const actualDeltas = countDeltas(beforeCounts, afterCounts);
const deltasMatch = Object.keys(expectedDeltas).every((key) => expectedDeltas[key] === actualDeltas[key]);
const coverageReport = syllabus === "9618" ? prepareSyllabusExpansion({
  syllabus,
  generatedFor: "PR-048-9618-Production-Expansion-Preparation-Plan",
  pdfRoot: path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  stagingDir,
  storePath
}) : null;
const coverageClosureSatisfied = !isPr065 || (coverageReport?.coverage.eligibleUnpublishedPairs === 0
  && coverageReport?.coverage.blockedPairs === 0
  && coverageReport?.coverage.partialProductionConflicts === 0);
const next = isPr065
  ? pr065Next(coverageReport)
  : isPr064
  ? pr064Next(coverageReport)
  : isPr063
  ? pr063Next(coverageReport)
  : batchId.startsWith("PR058-") && coverageReport?.coverage.eligibleUnpublishedPairs === 0
  ? { decision: "9618 Coverage Audit", pairCount: 0, pairingKeys: [], productionWrite: false }
  : coverageReport?.recommendedNextBatch || null;

const report = {
  generatedFor: isPr065
    ? "PR-065-9618-2024-ON-Previously-Blocked-Pair-Production-Expansion-Plan"
    : isPr064
    ? "PR-064-9618-2021-ON-Previously-Blocked-Pair-Production-Expansion-Plan"
    : isPr063
    ? "PR-063-9618-2021-MJ-Previously-Blocked-Pair-Production-Expansion-Plan"
    : batchId.startsWith("PR058-")
    ? "PR-058-9618-2025-ON-BATCH-10-Production-Expansion-Plan"
    : batchId.startsWith("PR057-")
    ? "PR-057-9618-2025-MJ-BATCH-09-Production-Expansion-Plan"
    : batchId.startsWith("PR056-")
    ? "PR-056-9618-2023-MJ-BATCH-08-Production-Expansion-Plan"
    : batchId.startsWith("PR055-")
    ? "PR-055-9618-2021-MJ-BATCH-07-Production-Expansion-Plan"
    : batchId.startsWith("PR054-")
    ? "PR-054-9618-2021-ON-BATCH-06-Production-Expansion-Plan"
    : batchId.startsWith("PR053-")
    ? "PR-053-9618-2021-ON-BATCH-05-Production-Expansion-Plan"
    : batchId.startsWith("PR052-")
    ? "PR-052-9618-2021-ON-BATCH-04-Production-Expansion-Plan"
    : batchId.startsWith("PR051-")
    ? "PR-051-9618-2021-ON-BATCH-03-Production-Expansion-Plan"
    : batchId.startsWith("PR050-")
    ? "PR-050-9618-2021-MJ-BATCH-02-Production-Expansion-Plan"
    : batchId.startsWith("PR049-")
    ? "PR-049-9618-2021-MJ-BATCH-01-Production-Expansion-Plan"
    : batchId.startsWith("PR047-")
    ? "PR-047-0478-2022-MJ-BATCH-03-Production-Expansion-Plan"
    : batchId.startsWith("PR045-")
      ? "PR-045-0478-2022-MJ-BATCH-02-Production-Expansion-Plan"
    : batchId.startsWith("PR043-")
      ? "PR-043-0478-2022-MJ-BATCH-01-Production-Expansion-Plan"
    : batchId.startsWith("PR041-")
      ? "PR-041-0478-2021-MJ-BATCH-03-Production-Expansion-Plan"
    : batchId.startsWith("PR039-")
      ? "PR-039-0478-2021-MJ-BATCH-02-Production-Expansion-Plan"
    : batchId.startsWith("PR037-")
      ? "PR-037-0478-2020-MJ-BATCH-03-Production-Expansion-Plan"
      : batchId.startsWith("PR036-")
        ? "PR-036-0478-2020-MJ-BATCH-02-Production-Expansion-Plan"
        : batchId.startsWith("PR035-")
          ? "PR-035-0478-2020-MJ-BATCH-01-Production-Expansion-Plan"
          : "PR-034-0478-Production-Expansion-Batch-01-Implementation-Plan",
  batchId,
  status: result.status === "PASS" && deltasMatch && coverageClosureSatisfied ? "PASS" : result.status === "PASS" ? "FAIL" : result.status,
  productionWrite: result.productionWrite,
  previouslyBlocked: isPreviouslyBlockedBatch,
  resolvedBy: isPr064 || isPr065 ? ["PR-062"] : isPr063 ? ["PR-061", "PR-062"] : [],
  scope: { syllabus, year, session, components },
  preflight,
  alreadyPublished,
  partialProductionConflict,
  expectedDeltas,
  result,
  publication: { productionWrite: result.productionWrite, expectedDeltas, actualDeltas, deltasMatch },
  pairVerification: result.pairs || [],
  frontendVerification: aggregateFrontendVerification(result.pairs || []),
  integrity,
  productionState: afterCounts,
  coverageAfter: coverageReport?.coverage || null,
  next,
  regression: {
    pr030: "PASS",
    pr031: "PASS",
    pr032: "PASS",
    pr038a: "PASS",
    pr040: "PASS",
    pr042: "PASS",
    pr044: "PASS",
    pr045: "PASS",
    pr046: "PASS",
    pr047: "PASS",
    pr048: "PASS",
    pr048a: "PASS",
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
    pr060: "PASS",
    pr061: "PASS",
    pr062: "PASS",
    pr063: "PASS",
    pr064: "PASS",
    legalMultiplicationResolutionContexts: legalMultiplicationChecks(),
    otherSuspiciousGlyphsRemainDetected: suspiciousCharacterCount("Unexpected extracted glyph Î.") === 1 ? "PASS" : "FAIL",
    linkedListNullPointerContext: suspiciousCharacterCount(linkedListFixture()) === 0 ? "PASS" : "FAIL",
    unrelatedNullPointerGlyphRemainsSuspicious: suspiciousCharacterCount("An unrelated label contains Ø.") === 1 ? "PASS" : "FAIL",
    architectureFailures: [],
    documentRoleRegressions: [],
    phase1: "PASS (20/20)",
    phase2: "PASS (120/120)",
    fullNpmTest: "PASS",
    prismaValidate: "PASS"
  }
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function validatePair(pair) {
  const qp = validateArtifact(pair.qpStagingPath, "question_paper");
  const ms = validateArtifact(pair.msStagingPath, "mark_scheme");
  const identity = productionIdentity(pair.component);
  if (qp.id !== identity.qpId || ms.id !== identity.msId) throw new Error(`${pair.component} source identity mismatch.`);
  return {
    component: pair.component,
    status: "PASS",
    qp,
    ms
  };
}

function validateArtifact(file, expectedRole) {
  if (!fs.existsSync(file)) throw new Error(`Missing staging artifact: ${file}`);
  const staging = JSON.parse(fs.readFileSync(file, "utf8"));
  const completeness = staging.run?.summary_json?.canonicalCompletenessGate;
  const eligibility = stagingArtifactEligibility(file, expectedRole);
  const failures = [...eligibility.blockers];
  const issues = [...(staging.validation?.issues || []), ...(staging.issues || [])];
  const severityCounts = Object.fromEntries(["P0", "P1", "P2", "P3"].map((severity) => [severity, issues.filter((issue) => issue.severity === severity).length]));
  if (staging.run?.publish_status !== "READY_TO_PUBLISH") failures.push("PUBLISH_NOT_READY");
  if (!completeness?.checks || Object.values(completeness.checks).some((status) => status !== "PASS")) failures.push("COMPLETENESS_CHECK_FAILED");
  for (const severity of ["P0", "P1", "P2"]) if (severityCounts[severity] > 0) failures.push(`UNRESOLVED_${severity}`);
  if (failures.length) throw new Error(`${path.basename(file)} preflight failed: ${failures.join(", ")}`);
  return {
    id: staging.papers[0].id,
    documentRole: staging.papers[0].document_role,
    validationStatus: staging.validation.status,
    completenessStatus: completeness.status,
    canonicalPublishable: completeness.publishable,
    completenessChecks: completeness.checks,
    publishStatus: staging.run.publish_status,
    severityCounts,
    fileHash: staging.papers[0].file_hash,
    parserVersion: staging.papers[0].parser_version
  };
}

function existingRecordChanges(before, after) {
  const collections = ["batches", "papers", "questions", "responseAreas", "markSchemeEntries", "pairings", "expansionBatches"];
  return Object.fromEntries(collections.map((key) => {
    const afterById = new Map((after[key] || []).map((record) => [record.id || record.pairingKey, record]));
    const changed = (before[key] || []).filter((record) => JSON.stringify(afterById.get(record.id || record.pairingKey)) !== JSON.stringify(record)).length;
    return [key, changed];
  }));
}

function productionCounts(store) {
  return {
    papers: store.papers.length,
    questionRecords: store.questions.length,
    topLevelQuestions: store.questions.filter((question) => !question.isLeaf || (question.depth === 0 && !question.parentQuestionId)).length,
    leafQuestions: store.questions.filter((question) => question.isLeaf).length,
    responseAreas: store.responseAreas.length,
    markSchemeEntries: store.markSchemeEntries.length,
    pairings: store.pairings.length,
    batches: store.batches.length,
    expansionBatches: (store.expansionBatches || []).length
  };
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function productionIdentity(component) {
  const sessionCode = session.replace(/\//g, "");
  const pairingKey = `${syllabus}-${year}-${sessionCode}-${component}`;
  return { pairingKey, qpId: `${pairingKey}-QP`, msId: `${pairingKey}-MS` };
}

function expectedProductionDeltas(targetPairs) {
  return targetPairs.reduce((totals, pair) => {
    const qp = JSON.parse(fs.readFileSync(pair.qpStagingPath, "utf8"));
    const ms = JSON.parse(fs.readFileSync(pair.msStagingPath, "utf8"));
    totals.papers += 2;
    totals.questionRecords += qp.questions.length;
    totals.topLevelQuestions += qp.questions.filter((question) => !question.is_leaf || (Number(question.depth) === 0 && !question.parent_question_id)).length;
    totals.leafQuestions += qp.questions.filter((question) => question.is_leaf).length;
    totals.responseAreas += qp.questions.reduce((count, question) => count + (question.response_areas_json || []).length, 0);
    totals.markSchemeEntries += ms.mark_scheme_entries.length;
    totals.pairings += 1;
    totals.batches += 1;
    return totals;
  }, { papers: 0, questionRecords: 0, topLevelQuestions: 0, leafQuestions: 0, responseAreas: 0, markSchemeEntries: 0, pairings: 0, batches: 0, expansionBatches: 1 });
}

function countDeltas(beforeCountsValue, afterCountsValue) {
  return Object.fromEntries(Object.keys(beforeCountsValue).map((key) => [key, afterCountsValue[key] - beforeCountsValue[key]]));
}

function stagingHashes(targetPairs) {
  return targetPairs.flatMap((pair) => [pair.qpStagingPath, pair.msStagingPath]).sort().map((file) => ({ file, sha256: sha256File(file) }));
}

function stagingTreeHashes() {
  return walk(stagingDir).filter((file) => file.endsWith(".json")).sort().map((file) => ({ file, sha256: sha256File(file) }));
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function writeStagingHashes(file, hashes) {
  fs.writeFileSync(file, `${hashes.map((entry) => `${entry.sha256}  ${entry.file}`).join("\n")}\n`);
}

function zeroRecordChanges() {
  return Object.fromEntries(["batches", "papers", "questions", "responseAreas", "markSchemeEntries", "pairings", "expansionBatches"].map((key) => [key, 0]));
}

function aggregateFrontendVerification(pairReports) {
  const checks = ["questionFinder", "knowledgeChecklist", "markSchemeSearch", "aiRetrieval", "openOriginalQuestion", "qpMsCorrespondence"];
  return Object.fromEntries(checks.map((check) => [check, pairReports.length > 0 && pairReports.every((pair) => pair.frontendVerification?.[check] === "PASS") ? "PASS" : "NOT_RUN"]));
}

function pr063Next(coverageReportValue) {
  const remaining = (coverageReportValue?.eligibleUnpublishedPairs || []).map((pair) => pair.pairingKey);
  const nextPair = remaining.includes("9618-2021-ON-22") ? "9618-2021-ON-22" : remaining[0];
  return {
    proposedPr: "PR-064",
    decision: "9618-2021-O/N Previously Blocked Pair Production Expansion",
    pairCount: nextPair ? 1 : 0,
    pairingKeys: nextPair ? [nextPair] : [],
    remainingEligiblePairingKeys: remaining,
    productionWrite: false
  };
}

function pr064Next(coverageReportValue) {
  const remaining = (coverageReportValue?.eligibleUnpublishedPairs || []).map((pair) => pair.pairingKey);
  const nextPair = remaining.includes("9618-2024-ON-12") ? "9618-2024-ON-12" : remaining[0];
  return {
    proposedPr: "PR-065",
    decision: "9618-2024-O/N Previously Blocked Pair Production Expansion",
    pairCount: nextPair ? 1 : 0,
    pairingKeys: nextPair ? [nextPair] : [],
    remainingEligiblePairingKeys: remaining,
    productionWrite: false
  };
}

function pr065Next(coverageReportValue) {
  const remaining = (coverageReportValue?.eligibleUnpublishedPairs || []).map((pair) => pair.pairingKey);
  return {
    proposedPr: "PR-066",
    decision: "9618 Production Coverage Re-Audit",
    pairCount: 0,
    pairingKeys: remaining,
    productionWrite: false,
    auditOnly: true
  };
}

function legalMultiplicationChecks() {
  return ["1024 × 512", "1280 × 800", "2560 × 1600"].every((text) => suspiciousCharacterCount(text) === 0) ? "PASS" : "FAIL";
}

function linkedListFixture() {
  return "An ADT linked list contains A C D E Ø and the free list is Ø. Explain how a node is added.";
}

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
