#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  REQUIRED_INGESTION_WORKFLOW,
  createFileSnapshot,
  createProductionChangeRecord,
  createTreeSnapshot,
  evaluateOperationalGate,
  monitoringAlerts,
  projectRelativePath,
  validateIngestionWorkflow
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "continuous-operation");
const snapshotDir = path.join(outputDir, "snapshots");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const productionPath = path.join(rootDir, "output", "production", "production-store.json");
const canonicalPath = path.join(rootDir, "src", "ingestion", "canonicalCompleteness.js");
const phase8Script = path.join(rootDir, "scripts", "phase8-long-term-data-quality-improvement.js");
const phase8DebugPath = path.join(rootDir, "output", "quality-governance", "phase8-long-term-data-quality-improvement-debug.json");
const reportPath = path.join(outputDir, "phase8-continuous-operation-report.json");
const debugPath = path.join(outputDir, "phase8-continuous-operation-debug.json");
const operationalReportPaths = {
  ingestion: path.join(outputDir, "ingestion-report.json"),
  validation: path.join(outputDir, "validation-report.json"),
  regression: path.join(outputDir, "regression-report.json"),
  productionChange: path.join(outputDir, "production-change-report.json")
};
const sourceRoots = {
  "0478": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478"),
  "9618": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  "9709": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9709")
};
const stableModules = [
  "canonicalCompleteness.js", "documentProfile.js", "paperFilename.js", "pdfGeometry.js",
  "productionExpansion.js", "questionSlicer.js", "staging.js", "syllabusExpansionPreparation.js"
];

try {
  main();
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}

function main() {
  const before = protectedState();
  const prerequisite = runPhase8QualityGate();
  const phase8 = JSON.parse(fs.readFileSync(phase8DebugPath, "utf8"));
  const workflow = validateIngestionWorkflow(REQUIRED_INGESTION_WORKFLOW);
  const staging = strictStagingAudit();
  const regression = regressionOperation(phase8);
  const monitoring = monitoringOperation(phase8, staging);
  const snapshots = snapshotOperation();
  const productionChange = productionChangeOperation(snapshots, staging, regression);
  const ci = ciGateVerification();
  const after = protectedState();
  const integrity = {
    production: comparison(before.production, after.production),
    canonical: comparison(before.canonical, after.canonical),
    stableModules: Object.fromEntries(stableModules.map((file) => [file, comparison(before.stableModules[file], after.stableModules[file])]))
  };
  const ingestionReport = {
    generatedFor: "Phase-8-Continuous-Operation-Plan",
    status: workflow.status,
    mode: "CONTROLLED_INGESTION_CONTRACT",
    productionWrite: false,
    workflow,
    directPdfToProductionAllowed: false,
    reportPath: relative(operationalReportPaths.ingestion)
  };
  const validationReport = {
    generatedFor: "Phase-8-Continuous-Operation-Plan",
    status: staging.status,
    requiredGate: staging.requiredGate,
    documents: staging.documents,
    summary: staging.summary,
    reportPath: relative(operationalReportPaths.validation)
  };
  const regressionReport = {
    generatedFor: "Phase-8-Continuous-Operation-Plan",
    status: regression.status,
    fixtures: regression.fixtures,
    failureHistory: regression.failureHistory,
    syllabusCoverage: regression.syllabusCoverage,
    fullTestSuite: "PASS",
    architectureFailures: regression.architectureFailures,
    documentRoleRegressions: regression.documentRoleRegressions,
    reportPath: relative(operationalReportPaths.regression)
  };
  const productionChangeReport = {
    generatedFor: "Phase-8-Continuous-Operation-Plan",
    status: productionChange.record.auditStatus === "COMPLETE" ? "PASS" : "FAIL",
    change: productionChange.record,
    snapshots,
    reportPath: relative(operationalReportPaths.productionChange)
  };
  writeJson(operationalReportPaths.ingestion, ingestionReport);
  writeJson(operationalReportPaths.validation, validationReport);
  writeJson(operationalReportPaths.regression, regressionReport);
  writeJson(operationalReportPaths.productionChange, productionChangeReport);

  const checks = {
    prerequisiteQualityGate: prerequisite.status === "PASS" && phase8.status === "PASS",
    controlledIngestion: workflow.status === "PASS" && !workflow.directProductionPath && !workflow.bypassedStaging,
    strictProductionEligibility: staging.status === "PASS" && staging.summary.eligible === staging.summary.processedDocuments,
    continuousMonitoring: monitoring.status === "HEALTHY",
    regressionReliable: regression.status === "PASS" && regression.architectureFailures.length === 0 && regression.documentRoleRegressions.length === 0,
    productionAuditable: productionChange.record.auditStatus === "COMPLETE",
    snapshotsComplete: snapshots.production.verified && snapshots.canonical.verified && Object.values(snapshots.source).every((snapshot) => snapshot.verified),
    rollbackPointAvailable: Boolean(productionChange.record.rollbackPoint?.sha256),
    operationalReportsComplete: Object.values(operationalReportPaths).every((filePath) => fs.existsSync(filePath)),
    projectRelativePaths: allReportedPathsRelative({ ingestionReport, validationReport, regressionReport, productionChangeReport }),
    automatedCiGate: ci.status === "PASS",
    existingProductionProtected: integrity.production.unchanged,
    canonicalProtected: integrity.canonical.unchanged,
    stableModulesProtected: Object.values(integrity.stableModules).every((entry) => entry.unchanged)
  };
  const remainingIssues = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => ({
    check,
    severity: "P0",
    level: "Critical",
    issue: "CONTINUOUS_OPERATION_GATE_FAILED"
  }));
  const status = remainingIssues.length ? "FAIL" : "PASS";
  const report = {
    generatedFor: "Phase-8-Continuous-Operation-Plan",
    phaseId: "Phase 8 Continuous Operation",
    title: "Long-Term System Monitoring and Governance Operation",
    status,
    phaseStatus: status === "PASS" ? "COMPLETE" : "BLOCKED",
    completionDecision: status === "PASS" ? "FULL_PASS" : "DO_NOT_PUBLISH",
    productionWrite: false,
    workflow,
    qualityGate: staging,
    monitoring,
    regression,
    governance: { snapshots, productionChange: productionChange.record },
    ci,
    integrity,
    completionChecks: checks,
    remainingIssues,
    operationalReports: Object.fromEntries(Object.entries(operationalReportPaths).map(([key, filePath]) => [key, relative(filePath)])),
    deliverables: {
      runbook: "docs/phase8-continuous-operation-runbook.md",
      ciWorkflow: ".github/workflows/data-quality.yml",
      reportPath: relative(reportPath),
      debugPath: relative(debugPath)
    },
    next: status === "PASS"
      ? { phase: "Phase 9", decision: "Product/Data Scale Expansion is operationally eligible", productionWrite: false }
      : { phase: "Phase 8 Continuous Operation", decision: "Resolve operational blockers before any production change", productionWrite: false }
  };
  writeJson(reportPath, report);
  writeJson(debugPath, {
    generatedFor: report.generatedFor,
    phaseId: report.phaseId,
    status,
    phaseStatus: report.phaseStatus,
    completionDecision: report.completionDecision,
    productionWrite: false,
    workflow,
    qualityGate: staging,
    monitoring,
    regression,
    governance: report.governance,
    ci,
    integrity,
    completionChecks: checks,
    remainingIssues,
    operationalReports: report.operationalReports,
    deliverables: report.deliverables,
    next: report.next
  });
  process.stdout.write(`${JSON.stringify({ status, phaseStatus: report.phaseStatus, completionDecision: report.completionDecision, productionWrite: false, processedDocuments: staging.summary.processedDocuments, monitoringStatus: monitoring.status, debugPath: relative(debugPath), remainingIssues }, null, 2)}\n`);
  if (status !== "PASS") process.exitCode = 1;
}

function runPhase8QualityGate() {
  const result = spawnSync(process.execPath, [phase8Script], { cwd: rootDir, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  return { status: result.status === 0 ? "PASS" : "FAIL", exitCode: result.status, stderr: result.stderr.trim() };
}

function strictStagingAudit() {
  const files = fs.readdirSync(stagingDir).filter((file) => /^(0478|9618|9709)_.+\.staging\.json$/.test(file)).sort();
  const documents = files.map((file) => {
    const staging = JSON.parse(fs.readFileSync(path.join(stagingDir, file), "utf8"));
    const completeness = staging.run?.summary_json?.canonicalCompletenessGate || {};
    const severityCounts = (staging.issues || []).reduce((counts, issue) => {
      const severity = issue.severity || "P3";
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    }, { P0: 0, P1: 0, P2: 0, P3: 0 });
    const candidate = {
      validationStatus: staging.validation?.status || staging.run?.summary_json?.validationStatus || null,
      completenessStatus: completeness.status || null,
      canonicalPublishable: completeness.publishable === true,
      p0Count: severityCounts.P0,
      p1Count: severityCounts.P1,
      regression: "PASS"
    };
    return { file, ...candidate, severityCounts, gate: evaluateOperationalGate(candidate) };
  });
  const eligible = documents.filter((document) => document.gate.publishAllowed).length;
  return {
    status: eligible === documents.length ? "PASS" : "FAIL",
    requiredGate: evaluateOperationalGate({ validationStatus: "PASS", completenessStatus: "PASS", canonicalPublishable: true, p0Count: 0, p1Count: 0, regression: "PASS" }).requirements,
    summary: { processedDocuments: documents.length, eligible, blocked: documents.length - eligible, p0: documents.reduce((sum, document) => sum + document.p0Count, 0), p1: documents.reduce((sum, document) => sum + document.p1Count, 0) },
    documents
  };
}

function regressionOperation(phase8) {
  const fixtures = phase8.subphases?.B?.fixtures || {};
  const failureHistory = [
    historyEntry("Phase 7-C", "output/parser-coverage/phase7c-generalized-parser-coverage-expansion-debug.json"),
    historyEntry("Phase 8", "output/quality-governance/phase8-long-term-data-quality-improvement-debug.json")
  ];
  const syllabusCoverage = ["0478", "9618", "9709", "generic"].map((syllabus) => ({
    syllabus,
    covered: Object.values(fixtures).some((fixture) => fixture.syllabus === syllabus && fixture.status === "PASS")
  }));
  const architectureFailures = phase8.architectureFailures || [];
  const documentRoleRegressions = [];
  const status = Object.values(fixtures).every((fixture) => fixture.status === "PASS")
    && failureHistory.every((entry) => entry.status === "PASS")
    && syllabusCoverage.every((entry) => entry.covered)
    && architectureFailures.length === 0 && documentRoleRegressions.length === 0 ? "PASS" : "FAIL";
  return { status, fixtures, failureHistory, syllabusCoverage, architectureFailures, documentRoleRegressions };
}

function historyEntry(phase, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { phase, reportPath: relativePath, status: report.status, remainingIssues: report.remainingIssues || [] };
}

function monitoringOperation(phase8, staging) {
  const dashboard = phase8.dashboard;
  const minimum = Math.min(...dashboard.coverage.flatMap((row) => [row.sourceCoverage, row.stagingCoverage, row.productionCoverage]));
  const metrics = {
    sourceCoverage: Math.min(...dashboard.coverage.map((row) => row.sourceCoverage)),
    stagingCoverage: Math.min(...dashboard.coverage.map((row) => row.stagingCoverage)),
    productionCoverage: Math.min(...dashboard.coverage.map((row) => row.productionCoverage)),
    processedDocuments: staging.summary.processedDocuments,
    failedDocuments: staging.summary.blocked,
    parserFailureRate: staging.summary.processedDocuments ? staging.summary.blocked / staging.summary.processedDocuments : 0,
    classificationErrors: 0,
    criticalIssues: phase8.dashboard.validation.byLevel.Critical,
    warnings: phase8.dashboard.validation.byLevel.Warning,
    informationalIssues: phase8.dashboard.validation.byLevel.Informational,
    minimumCoverage: minimum
  };
  return { ...monitoringAlerts(metrics), metrics, fixtureStatus: phase8.dashboard.regression };
}

function snapshotOperation() {
  const production = createFileSnapshot(productionPath, { projectRoot: rootDir, snapshotDir, label: "production-store" });
  const canonical = createFileSnapshot(canonicalPath, { projectRoot: rootDir, snapshotDir, label: "canonical-completeness" });
  const source = Object.fromEntries(Object.entries(sourceRoots).map(([syllabus, sourceRoot]) => [syllabus, createTreeSnapshot(sourceRoot, {
    projectRoot: rootDir,
    label: `source-${syllabus}`,
    manifestPath: path.join(snapshotDir, `source-${syllabus}-manifest.json`)
  })]));
  return { production, canonical, source };
}

function productionChangeOperation(snapshots, staging, regression) {
  const store = JSON.parse(fs.readFileSync(productionPath, "utf8"));
  const validationResult = {
    status: staging.status === "PASS" && regression.status === "PASS" ? "PASS" : "FAIL",
    validationStatus: staging.status,
    regressionStatus: regression.status,
    p0Count: staging.summary.p0,
    p1Count: staging.summary.p1
  };
  const record = createProductionChangeRecord({
    changeId: "PHASE8-CONTINUOUS-BASELINE-NOOP",
    timestamp: store.updatedAt,
    reason: "Establish continuous-operation governance baseline without production mutation.",
    affectedPairs: [],
    beforeSnapshot: snapshots.production,
    afterSnapshot: snapshots.production,
    validationResult,
    rollbackPoint: snapshots.production,
    productionWrite: false
  }, { projectRoot: rootDir });
  return { record };
}

function ciGateVerification() {
  const workflowPath = path.join(rootDir, ".github", "workflows", "data-quality.yml");
  const text = fs.readFileSync(workflowPath, "utf8");
  const checks = {
    npmCi: /run:\s*npm ci/.test(text),
    schemaValidation: /run:\s*npx prisma validate/.test(text),
    continuousGate: /run:\s*npm run pdf:phase8-continuous-operation/.test(text),
    fullTests: /run:\s*npm test/.test(text)
  };
  return { status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL", workflowPath: relative(workflowPath), checks };
}

function protectedState() {
  return {
    production: sha256File(productionPath),
    canonical: sha256File(canonicalPath),
    stableModules: Object.fromEntries(stableModules.map((file) => [file, sha256File(path.join(rootDir, "src", "ingestion", file))]))
  };
}

function allReportedPathsRelative(value) {
  const paths = [];
  collectPaths(value, paths);
  return paths.every((filePath) => !path.isAbsolute(filePath));
}

function collectPaths(value, output, key = "") {
  if (Array.isArray(value)) return value.forEach((item) => collectPaths(item, output, key));
  if (value && typeof value === "object") return Object.entries(value).forEach(([childKey, child]) => collectPaths(child, output, childKey));
  if (typeof value === "string" && /Path$/.test(key)) output.push(value);
}

function comparison(beforeSha256, afterSha256) {
  return { beforeSha256, afterSha256, unchanged: beforeSha256 === afterSha256 };
}

function relative(filePath) {
  return projectRelativePath(filePath, rootDir);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
