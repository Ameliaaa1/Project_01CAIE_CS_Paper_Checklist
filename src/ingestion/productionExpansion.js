const fs = require("node:fs");
const path = require("node:path");
const { publishProductionPilot, readProductionStore, rollbackProductionPilot } = require("./productionPilot");

const EXPANSION_PHASES = [
  { phase: "A", title: "0478 same period", syllabus: "0478", years: [2023], sessions: ["M/J"] },
  { phase: "B", title: "0478 multi-year", syllabus: "0478", years: [2020, 2021, 2022, 2023] },
  { phase: "C", title: "Add 9618", syllabus: "9618" },
  { phase: "D", title: "Full supported production", prerequisites: ["A", "B", "C"] }
];

function planProductionExpansion(options) {
  const stagingDir = path.resolve(options.stagingDir);
  const store = readProductionStore(path.resolve(options.storePath));
  const pdfDir = path.resolve(options.pdfDir);
  const candidates = phaseACandidates(pdfDir);
  const publishedIds = new Set(store.papers.map((paper) => paper.id));
  const pairs = candidates.map((candidate) => {
    const qpStagingPath = path.join(stagingDir, `${candidate.basename}_qp_${candidate.component}.staging.json`);
    const msStagingPath = path.join(stagingDir, `${candidate.basename}_ms_${candidate.component}.staging.json`);
    const qpId = `0478-2023-MJ-${candidate.component}-QP`;
    const msId = `0478-2023-MJ-${candidate.component}-MS`;
    let status = "ELIGIBLE";
    const blockers = [];
    if (publishedIds.has(qpId) || publishedIds.has(msId)) status = "ALREADY_PUBLISHED";
    if (!fs.existsSync(qpStagingPath) || !fs.existsSync(msStagingPath)) {
      status = "BLOCKED";
      blockers.push("MISSING_STAGING_PAIR");
    } else if (status !== "ALREADY_PUBLISHED") {
      const qpEligibility = stagingArtifactEligibility(qpStagingPath, "question_paper");
      const msEligibility = stagingArtifactEligibility(msStagingPath, "mark_scheme");
      blockers.push(...qpEligibility.blockers.map((blocker) => `QP_${blocker}`));
      blockers.push(...msEligibility.blockers.map((blocker) => `MS_${blocker}`));
      if (blockers.length) status = "BLOCKED";
    }
    return { pairingKey: `0478-2023-MJ-${candidate.component}`, component: candidate.component, qpId, msId, qpStagingPath, msStagingPath, status, blockers };
  });
  return {
    batchId: options.batchId || "PR028-0478-2023-MJ",
    phase: "A",
    scope: { syllabus: "0478", year: 2023, session: "M/J", components: pairs.map((pair) => pair.component) },
    strategy: EXPANSION_PHASES,
    pairs,
    summary: countStatuses(pairs),
    readyToExecute: pairs.some((pair) => pair.status === "ELIGIBLE") && !pairs.some((pair) => pair.status === "BLOCKED"),
    productionWrite: false
  };
}

function publishProductionExpansion(options) {
  const batchId = String(options.batchId || "");
  if (!/^PR(?:028|034|035|036|037|039|041|043|045|047|049|050|051|052|053|054|055|056|057|058|063|064|065|070)-(?:0478|9618|9709)-\d{4}-(?:MJ|ON|FM)(?:-[A-Z0-9]+)*$/.test(batchId)) throw new Error(`Invalid production expansion batchId: ${batchId}`);
  const storePath = path.resolve(options.storePath);
  const before = readProductionStore(storePath);
  if ((before.expansionBatches || []).some((batch) => batch.id === batchId)) throw new Error(`Duplicate production expansion batch identity: ${batchId}`);
  const pairs = options.pairs || [];
  if (!pairs.length) throw new Error("Production expansion batch has no pairs.");
  const tempPath = `${storePath}.${process.pid}.expansion.tmp`;
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(tempPath, `${JSON.stringify(before, null, 2)}\n`);
  const pairReports = [];
  const childBatchIds = [];
  try {
    pairs.forEach((pair) => {
      const childBatchId = `${batchId}-${pair.component}`;
      const report = publishProductionPilot({
        rootDir: options.rootDir,
        storePath: tempPath,
        pilotBatchId: childBatchId,
        qpStagingPath: pair.qpStagingPath,
        msStagingPath: pair.msStagingPath,
        failAfterWrite: options.failComponent === pair.component
      });
      childBatchIds.push(childBatchId);
      pairReports.push({
        component: pair.component,
        childBatchId,
        status: report.status,
        verification: report.productionVerification,
        frontendVerification: report.frontendVerification
      });
    });
    const stagedStore = readProductionStore(tempPath);
    stagedStore.expansionBatches ||= [];
    stagedStore.expansionBatches.push({
      id: batchId,
      syllabus: options.syllabus,
      year: options.year,
      session: options.session,
      componentRange: pairs.map((pair) => pair.component),
      migratedAt: new Date().toISOString(),
      validationResult: "PASS",
      childBatchIds
    });
    fs.writeFileSync(tempPath, `${JSON.stringify(stagedStore, null, 2)}\n`);
    fs.renameSync(tempPath, storePath);
    const after = readProductionStore(storePath);
    return expansionReport({ batchId, pairs, pairReports, before, after, productionWrite: true });
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    error.productionRollback = "BATCH_TRANSACTION_DISCARDED";
    throw error;
  }
}

function rollbackProductionExpansion(options) {
  const storePath = path.resolve(options.storePath);
  const batchId = options.batchId;
  const store = readProductionStore(storePath);
  const batch = (store.expansionBatches || []).find((candidate) => candidate.id === batchId);
  if (!batch) return { status: "NOT_FOUND", batchId, productionWrite: false };
  const tempPath = `${storePath}.${process.pid}.rollback.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(store, null, 2)}\n`);
  try {
    batch.childBatchIds.forEach((childBatchId) => rollbackProductionPilot({ storePath: tempPath, pilotBatchId: childBatchId }));
    const next = readProductionStore(tempPath);
    next.expansionBatches = (next.expansionBatches || []).filter((candidate) => candidate.id !== batchId);
    fs.writeFileSync(tempPath, `${JSON.stringify(next, null, 2)}\n`);
    fs.renameSync(tempPath, storePath);
    return { status: "ROLLED_BACK", batchId, childBatchIds: batch.childBatchIds, productionWrite: true };
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw error;
  }
}

function productionMonitoringReport(storePath, operation = {}) {
  const store = readProductionStore(path.resolve(storePath));
  const questions = store.questions || [];
  const attempts = Number(operation.attempts || 0);
  const failures = Number(operation.failures || 0);
  const completenessFailures = Number(operation.completenessFailures || 0);
  return {
    generatedAt: new Date().toISOString(),
    dataQualityMetrics: {
      ingestionSuccessRate: attempts ? Number(((attempts - failures) / attempts).toFixed(4)) : 1,
      validationFailureRate: attempts ? Number((failures / attempts).toFixed(4)) : 0,
      completenessFailureRate: attempts ? Number((completenessFailures / attempts).toFixed(4)) : 0,
      rollbackCount: Number(operation.rollbackCount || 0)
    },
    datasetMetrics: {
      totalPapers: (store.papers || []).length,
      totalQuestions: questions.filter(isTopLevelQuestion).length,
      totalLeafQuestions: questions.filter((question) => question.isLeaf).length,
      totalResponseAreas: (store.responseAreas || []).length,
      totalMarkEntries: (store.markSchemeEntries || []).length,
      totalPairings: (store.pairings || []).length,
      totalExpansionBatches: (store.expansionBatches || []).length
    }
  };
}

function expansionReport({ batchId, pairs, pairReports, before, after, productionWrite }) {
  return {
    batchId,
    status: "PASS",
    productionWrite,
    scope: { components: pairs.map((pair) => pair.component) },
    pairs: pairReports,
    verification: {
      paperDelta: after.papers.length - before.papers.length,
      questionDelta: after.questions.length - before.questions.length,
      responseAreaDelta: after.responseAreas.length - before.responseAreas.length,
      markEntryDelta: after.markSchemeEntries.length - before.markSchemeEntries.length,
      pairingDelta: after.pairings.length - before.pairings.length
    },
    issues: []
  };
}

function phaseACandidates(pdfDir) {
  const names = fs.existsSync(pdfDir) ? fs.readdirSync(pdfDir) : [];
  const components = new Set(names.map((name) => name.match(/^0478_s23_(?:qp|ms)_(\d{2})\.pdf$/i)?.[1]).filter(Boolean));
  return [...components].sort().map((component) => ({ basename: "0478_s23", component }));
}

function countStatuses(pairs) {
  return pairs.reduce((counts, pair) => {
    counts[pair.status] = (counts[pair.status] || 0) + 1;
    return counts;
  }, { ELIGIBLE: 0, ALREADY_PUBLISHED: 0, BLOCKED: 0 });
}

function isTopLevelQuestion(question) {
  return !question.isLeaf || (Number(question.depth) === 0 && !question.parentQuestionId);
}

function stagingArtifactEligibility(stagingPath, expectedRole) {
  try {
    const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
    const blockers = [];
    if (staging.papers?.[0]?.document_role !== expectedRole) blockers.push("DOCUMENT_ROLE_INVALID");
    if (staging.validation?.status !== "PASS") blockers.push("STAGING_VALIDATION_FAIL");
    const completeness = staging.run?.summary_json?.canonicalCompletenessGate;
    if (completeness?.status !== "PASS" || completeness?.publishable !== true) blockers.push("COMPLETENESS_GATE_FAIL");
    if ((staging.issues || []).some((issue) => issue.severity === "P0")) blockers.push("UNRESOLVED_P0");
    return { eligible: blockers.length === 0, blockers };
  } catch {
    return { eligible: false, blockers: ["STAGING_JSON_INVALID"] };
  }
}

module.exports = { EXPANSION_PHASES, planProductionExpansion, productionMonitoringReport, publishProductionExpansion, rollbackProductionExpansion, stagingArtifactEligibility };
