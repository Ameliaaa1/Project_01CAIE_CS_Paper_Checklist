#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  classifyValidationFinding,
  createProductionSnapshot,
  createQualityDashboard,
  extractPdfGeometry,
  markTokens,
  parserDecisionTrace,
  prepareSyllabusExpansion,
  productionRecordCounts,
  rollbackPlan,
  sliceQuestionPaper,
  summarizeFindings
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "quality-governance");
const stagingDir = path.join(rootDir, "output", "phase2", "staging");
const productionPath = path.join(rootDir, "output", "production", "production-store.json");
const canonicalPath = path.join(rootDir, "src", "ingestion", "canonicalCompleteness.js");
const reportPath = path.join(outputDir, "phase8-long-term-data-quality-improvement-report.json");
const debugPath = path.join(outputDir, "phase8-long-term-data-quality-improvement-debug.json");
const sourceRoots = {
  "0478": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478"),
  "9618": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9618"),
  "9709": path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-as-a-level-9709")
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

async function main() {
  const before = protectedState();
  const coverage = coverageAudits();
  const stagingHealth = inspectStagingHealth();
  const regression = await regressionIntelligence();
  const monitoring = qualityMonitoring(coverage, stagingHealth, regression);
  const observability = await parserObservability();
  const validation = validationIntelligence(stagingHealth);
  const governance = productionGovernance();
  const subphases = {
    A: phaseResult("Quality Monitoring", monitoring.checks, monitoring),
    B: phaseResult("Regression Intelligence", regression.checks, regression),
    C: phaseResult("Parser Observability", observability.checks, observability),
    D: phaseResult("Validation Intelligence", validation.checks, validation),
    E: phaseResult("Production Governance", governance.checks, governance)
  };
  const after = protectedState();
  const integrity = {
    production: comparison(before.production, after.production),
    canonical: comparison(before.canonical, after.canonical),
    productionRecordCounts: {
      before: before.recordCounts,
      after: after.recordCounts,
      unchanged: JSON.stringify(before.recordCounts) === JSON.stringify(after.recordCounts)
    }
  };
  const architectureFailures = architectureAudit();
  const checks = {
    qualityMetricsAutomated: subphases.A.status === "PASS",
    regressionVisibilityImproved: subphases.B.status === "PASS",
    parserDecisionsTraceable: subphases.C.status === "PASS",
    validationPrecisionImproved: subphases.D.status === "PASS",
    productionChangesAuditable: subphases.E.status === "PASS",
    existingProductionUnchanged: integrity.production.unchanged && integrity.productionRecordCounts.unchanged,
    canonicalConsistent: integrity.canonical.unchanged,
    validationNotWeakened: validation.levels.critical.blocksProduction && validation.levels.warning.requiresReview,
    architectureStable: architectureFailures.length === 0
  };
  const remainingIssues = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => ({
    check,
    severity: "P0",
    level: "Critical",
    issue: "PHASE_8_COMPLETION_CHECK_FAILED"
  }));
  const status = remainingIssues.length ? "FAIL" : "PASS";
  const reports = writeSubphaseReports(subphases);
  const report = {
    generatedFor: "Phase-8-Long-Term-Data-Quality-Improvement-Plan-v2",
    phaseId: "Phase 8",
    title: "Long-Term Data Quality Improvement",
    status,
    phaseStatus: status === "PASS" ? "COMPLETE" : "BLOCKED",
    completionDecision: status === "PASS" ? "FULL_PASS" : "BLOCKED",
    productionWrite: false,
    subphases,
    dashboard: monitoring.dashboard,
    integrity,
    architectureFailures,
    completionChecks: checks,
    remainingIssues,
    deliverables: { subphases: reports, reportPath, debugPath },
    next: status === "PASS"
      ? { phase: "Phase 8 Continuous Operation", decision: "Run monitoring and governance checks for every future ingestion change", productionWrite: false }
      : { phase: "Phase 8", decision: "Resolve quality gate failures before further expansion", productionWrite: false }
  };
  writeJson(reportPath, report);
  writeJson(debugPath, {
    generatedFor: report.generatedFor,
    phaseId: report.phaseId,
    status,
    phaseStatus: report.phaseStatus,
    completionDecision: report.completionDecision,
    productionWrite: false,
    dashboard: report.dashboard,
    subphases,
    integrity,
    architectureFailures,
    completionChecks: checks,
    remainingIssues,
    reports: report.deliverables,
    next: report.next
  });
  process.stdout.write(`${JSON.stringify({ status, phaseStatus: report.phaseStatus, completionDecision: report.completionDecision, productionWrite: false, dashboardStatus: monitoring.dashboard.status, debugPath, remainingIssues }, null, 2)}\n`);
  if (status !== "PASS") process.exitCode = 1;
}

function coverageAudits() {
  return Object.fromEntries(Object.entries(sourceRoots).map(([syllabus, pdfRoot]) => {
    const audit = prepareSyllabusExpansion({
      syllabus,
      pdfRoot,
      stagingDir,
      storePath: productionPath,
      generatedFor: "PHASE-8-QUALITY-MONITORING"
    });
    return [syllabus, {
      sourcePairs: audit.coverage.sourcePairs,
      completeSourcePairs: audit.coverage.completeSourcePairs,
      incompleteSourcePairs: audit.coverage.incompleteSourcePairs,
      stagingPairs: audit.coverage.stagingPairs,
      stagingMissingPairs: audit.coverage.stagingMissingPairs,
      publishedPairs: audit.coverage.publishedPairs,
      blockedPairs: audit.coverage.blockedPairs,
      eligibleUnpublishedPairs: audit.coverage.eligibleUnpublishedPairs,
      duplicateSourceCount: audit.inventory.duplicateSources.length,
      totalPdfFiles: audit.inventory.totalPdfFiles
    }];
  }));
}

function inspectStagingHealth() {
  const files = fs.readdirSync(stagingDir).filter((file) => /^(0478|9618|9709)_.+\.staging\.json$/.test(file)).sort();
  const findings = [];
  const malformed = [];
  for (const file of files) {
    try {
      const staging = JSON.parse(fs.readFileSync(path.join(stagingDir, file), "utf8"));
      for (const issue of staging.issues || []) findings.push({ ...issue, sourceFile: file });
    } catch (error) {
      malformed.push({ file, error: error.message });
      findings.push({ severity: "P0", code: "STAGING_JSON_INVALID", sourceFile: file, message: error.message });
    }
  }
  const summary = summarizeFindings(findings);
  const failedDocuments = new Set(summary.findings.filter((finding) => finding.blocksProduction).map((finding) => finding.sourceFile)).size + malformed.length;
  return {
    processedDocuments: files.length,
    failedDocuments,
    failureRate: files.length ? Number((failedDocuments / files.length).toFixed(6)) : 0,
    malformed,
    findings: summary
  };
}

function qualityMonitoring(coverage, stagingHealth, regression) {
  const dashboard = createQualityDashboard({
    syllabi: coverage,
    validation: stagingHealth.findings,
    parser: stagingHealth,
    regression: Object.fromEntries(Object.entries(regression.fixtures).map(([key, fixture]) => [key, fixture.status]))
  });
  const checks = {
    dashboardPass: dashboard.status === "PASS",
    sourceCoverageVisible: dashboard.coverage.every((row) => row.sourceCoverage === 1),
    stagingCoverageVisible: dashboard.coverage.every((row) => row.stagingCoverage === 1),
    productionCoverageVisible: dashboard.coverage.every((row) => row.productionCoverage === 1),
    validationVisible: Boolean(dashboard.validation.byLevel),
    regressionVisible: Object.keys(dashboard.regression).length >= 4,
    parserFailureRateVisible: Number.isFinite(dashboard.parser.failureRate) && dashboard.parser.failureRate === 0
  };
  return { dashboard, checks };
}

async function regressionIntelligence() {
  const definitions = {
    golden0478: ["golden", "0478", "public/textbook_syllabus/pastpaper/caie-igcse-0478/2025-May-June/0478_s25_qp_12.pdf", "0478-2025-MJ-12", 5, 27],
    edge9618: ["edge_case", "9618", "public/textbook_syllabus/pastpaper/caie-as-a-level-9618/2021 May June/9618_s21_qp_11.pdf", "9618-2021-MJ-11", 8, 30],
    cross9709: ["cross_syllabus", "9709", "public/textbook_syllabus/pastpaper/caie-as-a-level-9709/2024 May June/9709_s24_qp_12.pdf", "9709-2024-MJ-12", 10, 27]
  };
  const fixtures = {};
  for (const [name, [fixtureClass, syllabus, relativePath, paperId, expectedQuestions, expectedLeaves]] of Object.entries(definitions)) {
    const questions = sliceQuestionPaper(await extractPdfGeometry(path.join(rootDir, relativePath)), { paperId });
    const leafCount = questions.flatMap((question) => question.leafQuestions || []).length;
    const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0);
    const passed = questions.length === expectedQuestions && leafCount === expectedLeaves && totalMarks === 75 && questions.every((question) => question.markValidation.valid);
    fixtures[name] = {
      fixtureClass,
      syllabus,
      relativePath,
      status: passed ? "PASS" : "FAIL",
      expected: { questionCount: expectedQuestions, leafCount: expectedLeaves, totalMarks: 75 },
      actual: { questionCount: questions.length, leafCount, totalMarks },
      failureClassification: passed ? null : "QUESTION_STRUCTURE"
    };
  }
  fixtures.future = {
    fixtureClass: "future_syllabus",
    syllabus: "generic",
    status: classifyValidationFinding({ severity: "P0", code: "CANONICAL_RESPONSE_AREA_REQUIRED_MISSING" }).domain === "RESPONSE_AREA" ? "PASS" : "FAIL",
    expected: { failureDomain: "RESPONSE_AREA" },
    actual: { failureDomain: classifyValidationFinding({ severity: "P0", code: "CANONICAL_RESPONSE_AREA_REQUIRED_MISSING" }).domain },
    failureClassification: null
  };
  const checks = {
    goldenFixture: fixtures.golden0478.status === "PASS",
    edgeCaseFixture: fixtures.edge9618.status === "PASS",
    crossSyllabusFixture: fixtures.cross9709.status === "PASS",
    futureFixture: fixtures.future.status === "PASS",
    failureClassification: fixtures.future.actual.failureDomain === "RESPONSE_AREA"
  };
  return { fixtures, checks };
}

async function parserObservability() {
  const relativePath = "public/textbook_syllabus/pastpaper/caie-igcse-0478/2025-May-June/0478_s25_qp_12.pdf";
  const geometry = await extractPdfGeometry(path.join(rootDir, relativePath));
  const items = geometry.pages.flatMap((page) => page.items || []);
  const content = items.find((item) => item.regionType === "content" && String(item.text || "").length > 6);
  const barcode = items.find((item) => item.regionType === "barcode");
  const footer = items.find((item) => item.regionType === "footer");
  const traces = [
    parserDecisionTrace({ span: content, classification: "content", included: true, output: content?.text, evidence: ["regionType=content"] }),
    parserDecisionTrace({ span: barcode, classification: "barcode", included: false, evidence: ["machine-readable barcode geometry or font signal"] }),
    parserDecisionTrace({ span: footer, classification: "footer", included: false, evidence: ["footer geometry or repeated footer token"] })
  ];
  const checks = {
    sourceSpanRecorded: traces.every((trace) => trace.source.page && trace.source.text),
    classificationRecorded: traces.every((trace) => trace.decision.classification),
    transformationRecorded: traces.every((trace) => trace.transformation.operation),
    canonicalOutputRecorded: traces[0].transformation.output.length > 0 && traces[0].canonicalTarget === "page.normalizedText",
    exclusionsExplainable: traces.slice(1).every((trace) => !trace.decision.includedInCanonical && trace.transformation.output === ""),
    traceVersioned: traces.every((trace) => trace.traceVersion === "1.0")
  };
  return { sourceFixture: relativePath, traces, checks };
}

function validationIntelligence(stagingHealth) {
  const examples = {
    critical: classifyValidationFinding({ severity: "P0", code: "CANONICAL_REQUIRED_MARK_MISSING" }),
    warning: classifyValidationFinding({ severity: "P1", code: "CANONICAL_RESPONSE_AREA_COVERAGE_LOW" }),
    informational: classifyValidationFinding({ severity: "P2", code: "SOURCE_PAIR_PENDING_REVIEW" })
  };
  const identifierText = "Array[5] contains the value. Award [3].";
  const parsedMarks = markTokens(identifierText);
  const checks = {
    threeLevels: examples.critical.level === "Critical" && examples.warning.level === "Warning" && examples.informational.level === "Informational",
    criticalBlocks: examples.critical.blocksProduction === true,
    warningDoesNotBypassReview: examples.warning.requiresReview === true,
    informationalNonBlocking: examples.informational.blocksProduction === false,
    arrayIdentifierNotMark: parsedMarks.length === 1 && parsedMarks[0].value === 3,
    persistedFindingsClassified: stagingHealth.findings.findings.every((finding) => finding.level && finding.domain)
  };
  return { levels: examples, identifierExample: { text: identifierText, parsedMarks, classification: "Array[5] is an identifier; [3] is a mark allocation." }, persistedFindings: stagingHealth.findings, checks };
}

function productionGovernance() {
  const snapshot = createProductionSnapshot(productionPath, path.join(outputDir, "snapshots"), { reason: "PHASE_8_PRODUCTION_GOVERNANCE_BASELINE" });
  const rollback = rollbackPlan(snapshot, productionPath);
  const store = JSON.parse(fs.readFileSync(productionPath, "utf8"));
  const changeHistory = (store.expansionBatches || []).map((batch) => ({
    id: batch.id || batch.batchId || null,
    syllabus: batch.syllabus || null,
    status: batch.status || batch.decision || null
  }));
  const auditTrail = {
    productionSha256: snapshot.sha256,
    sourceUpdatedAt: snapshot.sourceUpdatedAt,
    schemaVersion: snapshot.schemaVersion,
    recordCounts: snapshot.recordCounts,
    expansionBatchCount: changeHistory.length,
    changeHistory
  };
  const checks = {
    snapshotCreated: fs.existsSync(snapshot.snapshotPath) && fs.existsSync(snapshot.manifestPath),
    snapshotVerified: rollback.snapshotVerified,
    contentAddressed: path.basename(snapshot.snapshotPath).includes(snapshot.sha256),
    changeHistoryAvailable: changeHistory.length > 0,
    auditTrailComplete: auditTrail.productionSha256 && auditTrail.schemaVersion && auditTrail.recordCounts.papers > 0,
    rollbackDryRun: rollback.mode === "DRY_RUN" && rollback.productionWrite === false && rollback.executable,
    noRestoreRequired: rollback.changeRequired === false
  };
  return { snapshot, rollback, auditTrail, checks };
}

function protectedState() {
  const store = JSON.parse(fs.readFileSync(productionPath, "utf8"));
  return {
    production: sha256File(productionPath),
    canonical: sha256File(canonicalPath),
    recordCounts: productionRecordCounts(store)
  };
}

function architectureAudit() {
  const source = fs.readFileSync(path.join(rootDir, "src", "ingestion", "qualityIntelligence.js"), "utf8");
  const failures = [];
  if (/syllabus\s*={2,3}\s*["'](?:0478|9618|9709)["']/.test(source)) failures.push("SYLLABUS_SPECIFIC_BRANCH");
  if (/validationLevel\([^)]*\).*return\s+VALIDATION_LEVELS\.INFORMATIONAL[\s\S]*P0/.test(source)) failures.push("VALIDATION_SEVERITY_DOWNGRADE");
  return failures;
}

function phaseResult(title, checks, details) {
  return { title, status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL", checks, ...details };
}

function writeSubphaseReports(subphases) {
  return Object.fromEntries(Object.entries(subphases).map(([key, phase]) => {
    const prefix = `phase8-${key.toLowerCase()}`;
    const implementationPath = path.join(outputDir, `${prefix}-implementation-report.json`);
    const regressionPath = path.join(outputDir, `${prefix}-regression-report.json`);
    writeJson(implementationPath, { generatedFor: `Phase-8-${key}`, status: phase.status, title: phase.title, checks: phase.checks, details: phase });
    writeJson(regressionPath, { generatedFor: `Phase-8-${key}`, status: phase.status, productionWrite: false, checks: phase.checks });
    return [key, { designPath: path.join(rootDir, "docs", `${prefix}-design.md`), implementationPath, regressionPath }];
  }));
}

function comparison(beforeSha256, afterSha256) {
  return { beforeSha256, afterSha256, unchanged: beforeSha256 === afterSha256 };
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
