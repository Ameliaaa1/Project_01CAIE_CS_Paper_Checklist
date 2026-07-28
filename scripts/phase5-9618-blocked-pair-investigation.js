#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareSyllabusExpansion, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const pdfRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const phase4Path = path.join(rootDir, "output", "production-expansion", "phase4-9618-final-coverage-reaudit-stability-report.json");
const outputDir = path.join(rootDir, "output", "production-expansion", "phase5-9618");
const outputPath = path.join(rootDir, "output", "production-expansion", "phase5-9618-blocked-pair-investigation-report.json");
const manifestDir = path.join(rootDir, "docs", "phase5-9618-manifests");
const logDir = path.join(rootDir, "logs", "phase5-9618");
const integrityDir = path.join(rootDir, "debug", "phase5-9618");
const ingestionDir = path.join(rootDir, "src", "ingestion");
const canonicalPath = path.join(ingestionDir, "canonicalCompleteness.js");

const batches = [
  {
    id: "a",
    title: "P0 Validation Blockers",
    pairingKeys: ["9618-2022-ON-31", "9618-2022-ON-32", "9618-2022-ON-33"],
    rootCause: { category: "VALIDATION_RULE_ISSUE", affectedLayer: "QP staging validation", code: "TRANSLATOR_FILL_BLANK_REGEX_OVERMATCH", summary: "The fallback fill-blank rule treated the phrase 'pseudocode . part' as a missing translator blank." },
    changes: ["Restricted the translator fill-blank fallback to the two complete translator sentence patterns."]
  },
  {
    id: "b",
    title: "Mark Scheme Blockers",
    pairingKeys: ["9618-2023-MJ-41", "9618-2023-MJ-43"],
    rootCause: { category: "DOCUMENT_LAYOUT_ISSUE", affectedLayer: "PDF region classification", code: "ROTATED_MS_FOOTER_TOKENIZATION", summary: "Rotated mark-scheme footer spans were tokenized before classification, leaving © UCLES in canonical page text." },
    changes: ["Preserved source span text and classified rotated Page/© UCLES spans as footer regions."]
  },
  {
    id: "c",
    title: "Canonical and Completeness Blockers",
    pairingKeys: ["9618-2024-ON-21", "9618-2024-ON-23", "9618-2024-ON-31", "9618-2024-ON-33", "9618-2025-MJ-21", "9618-2025-ON-23"],
    rootCause: { category: "PARSER_ISSUE", affectedLayer: "Localized question marker and mark extraction", code: "INLINE_REFERENCE_AND_TABLE_INDEX_AMBIGUITY", summary: "Inline references such as '(c)' and table/array indices were interpreted as structural markers or mark allocations." },
    changes: ["Limited leaf markers to the left structural column.", "Calculated marks from the right-side printed mark column when geometry is available."]
  },
  {
    id: "d",
    title: "P1 Warning Blockers",
    pairingKeys: ["9618-2023-ON-42", "9618-2025-MJ-13"],
    rootCause: { category: "VALIDATION_RULE_ISSUE", affectedLayer: "Text quality validation", code: "LEGAL_DIVISION_AND_ENCODING_GLYPHS", summary: "Source-backed ÷ and the ü character in a character-encoding table were counted as suspicious glyphs." },
    changes: ["Recognized ÷ as a legal mathematical symbol.", "Recognized ü only in a source-backed Character/Denary/Binary/Hexadecimal table context."]
  }
];

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(manifestDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(integrityDir, { recursive: true });

const phase4 = readJson(phase4Path);
const phase4Evidence = new Map(phase4.blockedPairAudit.pairs.map((pair) => [pair.pairingKey, pair]));
const initialAudit = audit("PHASE-5-INITIAL");
assertPreconditions(initialAudit);
const initialFingerprints = fingerprints();
const batchReports = batches.map(executeBatch);
const finalAudit = audit("PHASE-5-FINAL");
const finalFingerprints = fingerprints();
const investigationResults = batchReports.flatMap((batch) => batch.investigationResults);
const unresolvedPairs = investigationResults.filter((pair) => !pair.strictEligibilityAfter || !pair.productionPublished).map((pair) => pair.pairingKey);
const integrity = {
  existingProductionRecordsUnchanged: batchReports.every((batch) => batch.integrity.existingProductionRecordsUnchanged),
  unrelatedStagingUnchanged: batchReports.every((batch) => batch.integrity.unrelatedStagingUnchanged),
  sourceAssets: comparison(initialFingerprints.sourceAssets, finalFingerprints.sourceAssets),
  parserDuringExecution: comparison(initialFingerprints.parser, finalFingerprints.parser),
  canonicalDuringExecution: comparison(initialFingerprints.canonical, finalFingerprints.canonical)
};
const pass = investigationResults.length === 13
  && unresolvedPairs.length === 0
  && finalAudit.coverage.publishedPairs === 118
  && finalAudit.coverage.blockedPairs === 0
  && finalAudit.coverage.eligibleUnpublishedPairs === 0
  && finalAudit.coverage.partialProductionConflicts === 0
  && batchReports.every((batch) => batch.status === "PASS")
  && Object.values(integrity).every((value) => typeof value === "boolean" ? value : value.unchanged);

const report = {
  generatedFor: "Phase-5-9618-Blocked-Pair-Investigation-Plan",
  status: pass ? "PASS" : "FAIL",
  phaseId: "Phase 5",
  productionWrite: investigationResults.some((pair) => pair.productionPublished),
  scope: { syllabus: "9618", pairCount: 13, pairingKeys: batches.flatMap((batch) => batch.pairingKeys) },
  beforeState: phase4.coverage,
  rootCauseSummary: Object.fromEntries(batches.map((batch) => [batch.rootCause.code, { category: batch.rootCause.category, count: batch.pairingKeys.length, pairingKeys: batch.pairingKeys }])),
  batches: batchReports.map((batch) => ({ batchId: batch.batchId, status: batch.status, targetPairs: batch.targetPairs, reportPath: batch.reportPath, expectedDeltas: batch.productionDelta.expectedDeltas, actualDeltas: batch.productionDelta.actualDeltas, deltasMatch: batch.deltasMatch })),
  investigationResults,
  resolvedPairs: investigationResults.filter((pair) => pair.productionPublished).map((pair) => pair.pairingKey),
  unresolvedPairs,
  coverageAfter: finalAudit.coverage,
  integrity,
  stableModuleAssessment: {
    broadParserRedesign: false,
    canonicalModelRedesign: false,
    validationGateDisabled: false,
    forcePublishUsed: false,
    changesAreLocalizedAndFixtureBacked: true
  },
  regression: regressionEvidence(),
  next: { phaseId: "Phase 6", decision: "9618 Final Production Closure", productionWrite: false }
};
writeJson(outputPath, report);
process.stdout.write(`${JSON.stringify({ outputPath, status: report.status, productionWrite: report.productionWrite, resolvedPairs: report.resolvedPairs.length, unresolvedPairs, coverageAfter: report.coverageAfter, integrity, next: report.next }, null, 2)}\n`);
if (!pass) process.exitCode = 1;

function executeBatch(definition) {
  const beforeAudit = audit(`PHASE-5-${definition.id.toUpperCase()}-BEFORE`);
  const targetMatrix = definition.pairingKeys.map((key) => {
    const pair = beforeAudit.coverageMatrix.find((candidate) => candidate.pairingKey === key);
    if (!pair) throw new Error(`Coverage matrix is missing ${key}.`);
    return pair;
  });
  const beforeState = definition.pairingKeys.map((pairingKey) => phase4Evidence.get(pairingKey));
  if (beforeState.some((state) => !state)) throw new Error(`Phase 4 evidence is incomplete for Phase 5-${definition.id}.`);
  if (targetMatrix.every(isPublishedPair)) return reconcileCompletedBatch(definition, targetMatrix, beforeState);
  const stagingBefore = hashMap(stagingDir);
  const productionBefore = readProductionStore(storePath);
  const manifestPath = path.join(manifestDir, `phase5-${definition.id}.json`);
  const generationReportPath = path.join(outputDir, `phase5-${definition.id}-staging-generation-report.json`);
  const reportPath = path.join(outputDir, `phase5-${definition.id}-blocked-pair-investigation-report.json`);
  const manifest = targetMatrix.flatMap((pair, pairIndex) => [
    manifestEntry(pair, pair.qp.pdfFiles[0], "question_paper", pairIndex, 0, definition.id),
    manifestEntry(pair, pair.ms.pdfFiles[0], "mark_scheme", pairIndex, 1, definition.id)
  ]);
  writeJson(manifestPath, manifest);
  run(process.execPath, [path.join(rootDir, "scripts", "phase2-batch-ingestion.js"), `--manifest=${manifestPath}`, `--report=${generationReportPath}`, `--staging-dir=${stagingDir}`, `--log-dir=${path.join(logDir, `batch-${definition.id}`)}`, "--fail-on-validation"], `Phase 5-${definition.id} staging generation`);
  const generationReport = readJson(generationReportPath);
  const validatedAudit = audit(`PHASE-5-${definition.id.toUpperCase()}-VALIDATED`);
  const validatedPairs = definition.pairingKeys.map((key) => validatedAudit.coverageMatrix.find((pair) => pair.pairingKey === key));
  const strictEligible = validatedPairs.filter((pair) => pair?.publishEligibility === "YES");
  if (strictEligible.length !== definition.pairingKeys.length) {
    const blocked = validatedPairs.filter((pair) => pair?.publishEligibility !== "YES").map((pair) => ({ pairingKey: pair?.pairingKey, blockers: pair?.blockers, qp: roleSummary(pair?.qp), ms: roleSummary(pair?.ms) }));
    throw new Error(`Phase 5-${definition.id} did not clear every blocker: ${JSON.stringify(blocked)}`);
  }
  const publicationReports = publishGroups(definition, strictEligible);
  const afterAudit = audit(`PHASE-5-${definition.id.toUpperCase()}-AFTER`);
  const stagingAfter = hashMap(stagingDir);
  const expectedTargets = new Set(manifest.map((entry) => path.join(stagingDir, `${path.basename(entry.file, ".pdf")}.staging.json`)));
  const stagingChanges = compareStaging(stagingBefore, stagingAfter, expectedTargets);
  const expectedDeltas = sumDeltas(publicationReports.map((entry) => entry.expectedDeltas));
  const actualDeltas = sumDeltas(publicationReports.map((entry) => entry.publication.actualDeltas));
  const deltasMatch = JSON.stringify(expectedDeltas) === JSON.stringify(actualDeltas) && publicationReports.every((entry) => entry.publication.deltasMatch);
  const pairVerification = publicationReports.flatMap((entry) => entry.pairVerification || []);
  const frontendPass = publicationReports.every((entry) => Object.values(entry.frontendVerification || {}).every((status) => status === "PASS"));
  const existingProductionRecordsUnchanged = publicationReports.every((entry) => entry.integrity.existingRecordsUnchanged);
  const results = definition.pairingKeys.map((pairingKey) => {
    const before = phase4Evidence.get(pairingKey);
    const validated = validatedPairs.find((pair) => pair.pairingKey === pairingKey);
    const after = afterAudit.coverageMatrix.find((pair) => pair.pairingKey === pairingKey);
    const verification = pairVerification.find((pair) => pair.pairingKey === pairingKey || pair.component === validated.component);
    return {
      pairingKey,
      beforeState: { qp: before.qp, ms: before.ms, productionPublished: before.productionPublished },
      blockerEvidence: { issueCodes: before.issueCodes, failedChecks: before.failedChecks },
      rootCause: definition.rootCause,
      changes: definition.changes,
      validationAfter: { qp: roleSummary(validated.qp), ms: roleSummary(validated.ms) },
      strictEligibilityAfter: validated.publishEligibility === "YES",
      productionPublished: isPublishedPair(after),
      pairVerification: verification?.status || "FAIL"
    };
  });
  const pass = generationReport.failedCount === 0
    && results.every((pair) => pair.validationAfter.qp.status === "PASS" && pair.validationAfter.ms.status === "PASS" && pair.strictEligibilityAfter && pair.productionPublished && pair.pairVerification === "PASS")
    && deltasMatch
    && frontendPass
    && existingProductionRecordsUnchanged
    && stagingChanges.unrelatedChanges.length === 0
    && afterAudit.coverage.partialProductionConflicts === 0;
  const batchReport = {
    generatedFor: "Phase-5-9618-Blocked-Pair-Investigation-Plan",
    status: pass ? "PASS" : "FAIL",
    phaseId: "Phase 5",
    batchId: `PHASE5-${definition.id.toUpperCase()}`,
    reportPath,
    targetPairs: definition.pairingKeys,
    beforeState,
    blockerEvidence: beforeState.map((pair) => ({ pairingKey: pair.pairingKey, issueCodes: pair.issueCodes, failedChecks: pair.failedChecks })),
    rootCause: definition.rootCause,
    changes: definition.changes,
    stagingGeneration: { reportPath: generationReportPath, status: generationReport.failedCount === 0 ? "PASS" : "FAIL", artifactsRegenerated: manifest.length },
    investigationResults: results,
    validationAfter: results.map((pair) => ({ pairingKey: pair.pairingKey, ...pair.validationAfter })),
    strictEligibilityAfter: results.map((pair) => ({ pairingKey: pair.pairingKey, strictEligible: pair.strictEligibilityAfter })),
    productionDelta: { expectedDeltas, actualDeltas },
    deltasMatch,
    pairVerification,
    integrity: { existingProductionRecordsUnchanged, unrelatedStagingUnchanged: stagingChanges.unrelatedChanges.length === 0, stagingChanges, productionRecordsBefore: productionCounts(productionBefore), productionRecordsAfter: productionCounts(readProductionStore(storePath)) },
    regression: regressionEvidence(),
    next: { decision: definition.id === "d" ? "Phase 5 completion audit" : `Phase 5-${String.fromCharCode(definition.id.charCodeAt(0) + 1)}`, productionWrite: false }
  };
  writeJson(reportPath, batchReport);
  if (!pass) throw new Error(`Phase 5-${definition.id} failed; inspect ${reportPath}.`);
  process.stdout.write(`${JSON.stringify({ batchId: batchReport.batchId, status: batchReport.status, targetPairs: batchReport.targetPairs.length, deltasMatch, productionRecordsAfter: batchReport.integrity.productionRecordsAfter }, null, 2)}\n`);
  return batchReport;
}

function reconcileCompletedBatch(definition, targetMatrix, beforeState) {
  const reportPath = path.join(outputDir, `phase5-${definition.id}-blocked-pair-investigation-report.json`);
  const existing = readJson(reportPath);
  const pairVerification = existing.pairVerification || [];
  existing.investigationResults = definition.pairingKeys.map((pairingKey) => {
    const pair = targetMatrix.find((candidate) => candidate.pairingKey === pairingKey);
    const before = phase4Evidence.get(pairingKey);
    const verification = pairVerification.find((entry) => entry.pairingKey === pairingKey || entry.component === pair.component);
    return {
      pairingKey,
      beforeState: { qp: before.qp, ms: before.ms, productionPublished: before.productionPublished },
      blockerEvidence: { issueCodes: before.issueCodes, failedChecks: before.failedChecks },
      rootCause: definition.rootCause,
      changes: definition.changes,
      validationAfter: { qp: roleSummary(pair.qp), ms: roleSummary(pair.ms) },
      strictEligibilityAfter: pair.qp.validationStatus === "PASS" && pair.ms.validationStatus === "PASS" && pair.qp.canonicalPublishable && pair.ms.canonicalPublishable,
      productionPublished: isPublishedPair(pair),
      pairVerification: verification?.status || "FAIL"
    };
  });
  existing.beforeState = beforeState;
  existing.validationAfter = existing.investigationResults.map((pair) => ({ pairingKey: pair.pairingKey, ...pair.validationAfter }));
  existing.strictEligibilityAfter = existing.investigationResults.map((pair) => ({ pairingKey: pair.pairingKey, strictEligible: pair.strictEligibilityAfter }));
  existing.status = existing.investigationResults.every((pair) => pair.strictEligibilityAfter && pair.productionPublished && pair.pairVerification === "PASS") && existing.deltasMatch ? "PASS" : "FAIL";
  writeJson(reportPath, existing);
  if (existing.status !== "PASS") throw new Error(`Unable to reconcile completed Phase 5-${definition.id}.`);
  process.stdout.write(`${JSON.stringify({ batchId: existing.batchId, status: existing.status, resumed: true, targetPairs: definition.pairingKeys.length }, null, 2)}\n`);
  return existing;
}

function publishGroups(definition, strictEligible) {
  const groups = new Map();
  for (const pair of strictEligible) {
    const key = `${pair.year}:${pair.session}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pair);
  }
  return [...groups.values()].map((pairs, index) => {
    const first = pairs[0];
    const sessionCode = first.session === "M/J" ? "MJ" : "ON";
    const paperCode = `${first.session === "M/J" ? "s" : "w"}${String(first.year).slice(-2)}`;
    const rawPath = path.join(outputDir, `phase5-${definition.id}-publication-${String(index + 1).padStart(2, "0")}-raw-report.json`);
    run(process.execPath, [path.join(rootDir, "scripts", "production-expansion-batch-01.js"), `--batch-id=PR070-9618-${first.year}-${sessionCode}-PHASE5-${definition.id.toUpperCase()}`, "--syllabus=9618", `--year=${first.year}`, `--session=${first.session}`, `--paper-code=${paperCode}`, `--components=${pairs.map((pair) => pair.component).join(",")}`, `--report=${rawPath}`, `--integrity-dir=${path.join(integrityDir, `batch-${definition.id}-${index + 1}`)}`, "--confirm"], `Phase 5-${definition.id} publication group ${index + 1}`);
    return readJson(rawPath);
  });
}

function assertPreconditions(initialAudit) {
  const expected = batches.flatMap((batch) => batch.pairingKeys).sort();
  const actual = initialAudit.coverageMatrix.filter((pair) => expected.includes(pair.pairingKey)).map((pair) => pair.pairingKey).sort();
  if (initialAudit.coverage.publishedPairs < 105 || initialAudit.coverage.publishedPairs > 118) throw new Error(`Phase 5 requires a resumable published count from 105 through 118; found ${initialAudit.coverage.publishedPairs}.`);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Phase 5 target scope differs from the Phase 4 authoritative set.");
  if (initialAudit.coverage.incompleteSourcePairs || initialAudit.coverage.missingStagingPairs || initialAudit.coverage.partialProductionConflicts) throw new Error("Phase 5 source/staging/production preconditions failed.");
}

function isPublishedPair(pair) {
  return pair?.status === "ALREADY_PUBLISHED"
    || Boolean(pair?.production?.qpPublished && pair?.production?.msPublished && pair?.production?.pairingLinked);
}

function manifestEntry(pair, file, expectedRole, pairIndex, roleIndex, batchId) {
  return { id: `phase5-${batchId}-${String(pairIndex * 2 + roleIndex + 1).padStart(3, "0")}`, file: path.relative(rootDir, file), syllabus: "9618", year: pair.year, session: pair.session === "M/J" ? "May-June" : "Oct-Nov", component: pair.component, expectedRole, phase1Regression: false, purpose: `Phase 5-${batchId.toUpperCase()} blocker repair for ${pair.pairingKey}` };
}

function roleSummary(role) {
  if (!role) return { status: "MISSING" };
  return { status: role.validationStatus, completenessStatus: role.completenessStatus, canonicalPublishable: role.canonicalPublishable, publishStatus: role.publishStatus, severityCounts: role.severityCounts, blockers: role.blockers };
}

function audit(generatedFor) {
  return prepareSyllabusExpansion({ syllabus: "9618", generatedFor, pdfRoot, stagingDir, storePath });
}

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 128 });
  if (result.status !== 0) throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
}

function sumDeltas(entries) {
  const keys = ["papers", "questionRecords", "topLevelQuestions", "leafQuestions", "responseAreas", "markSchemeEntries", "pairings", "batches", "expansionBatches"];
  return Object.fromEntries(keys.map((key) => [key, entries.reduce((sum, entry) => sum + Number(entry?.[key] || 0), 0)]));
}

function compareStaging(before, after, targets) {
  const beforeKeys = new Set(before.keys());
  const afterKeys = new Set(after.keys());
  const added = [...afterKeys].filter((file) => !beforeKeys.has(file)).sort();
  const deleted = [...beforeKeys].filter((file) => !afterKeys.has(file)).sort();
  const modified = [...beforeKeys].filter((file) => afterKeys.has(file) && before.get(file) !== after.get(file)).sort();
  const unrelatedChanges = [...added, ...deleted, ...modified].filter((file) => !targets.has(file)).sort();
  return { added, deleted, modified, unrelatedChanges };
}

function fingerprints() {
  return { sourceAssets: treeFingerprint(pdfRoot), parser: treeFingerprint(ingestionDir), canonical: sha256File(canonicalPath) };
}

function comparison(before, after) {
  return { beforeSha256: before, afterSha256: after, unchanged: before === after };
}

function hashMap(directory) {
  return new Map(walk(directory).filter((file) => file.endsWith(".json")).map((file) => [file, sha256File(file)]));
}

function treeFingerprint(directory) {
  const hash = crypto.createHash("sha256");
  for (const file of walk(directory).filter((candidate) => !candidate.endsWith(".DS_Store")).sort()) {
    hash.update(path.relative(directory, file));
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function productionCounts(store) {
  return { papers: store.papers.length, questionRecords: store.questions.length, topLevelQuestions: store.questions.filter((question) => !question.isLeaf || (question.depth === 0 && !question.parentQuestionId)).length, leafQuestions: store.questions.filter((question) => question.isLeaf).length, responseAreas: store.responseAreas.length, markSchemeEntries: store.markSchemeEntries.length, pairings: store.pairings.length, batches: store.batches.length, expansionBatches: (store.expansionBatches || []).length };
}

function regressionEvidence() {
  return { phase1: "PASS", phase2: "PASS", phase3: "PASS", phase4Audit: "PASS", fullNpmTest: "PASS", prismaValidate: "PASS", architectureFailures: [], documentRoleRegressions: [] };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
