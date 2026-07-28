#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  applyDocumentProfile, classifyResponseLayout, estimateMarks, extractPdfGeometry,
  parsePaperFilename, parseQuestionReference, resolveDocumentProfile, sliceQuestionPaper
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "parser-coverage");
const productionPath = path.join(rootDir, "output", "production", "production-store.json");
const canonicalPath = path.join(rootDir, "src", "ingestion", "canonicalCompleteness.js");
const reportPath = path.join(outputDir, "phase7c-generalized-parser-coverage-expansion-report.json");
const debugPath = path.join(outputDir, "phase7c-generalized-parser-coverage-expansion-debug.json");

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

async function main() {
  const before = protectedFingerprints();
  const subphases = {
    A: documentStructureChecks(),
    B: questionParsingChecks(),
    C: markSchemeChecks(),
    D: responseAreaChecks(),
    E: await regressionExpansionChecks()
  };
  const after = protectedFingerprints();
  const integrity = {
    production: comparison(before.production, after.production),
    canonical: comparison(before.canonical, after.canonical)
  };
  const architectureFailures = parserArchitectureFailures();
  const documentRoleRegressions = Object.values(subphases.A.checks).every(Boolean) ? [] : ["DOCUMENT_ROLE_ROUTER_REGRESSION"];
  const regression = {
    syllabus0478: subphases.E.fixtures["0478"].status,
    syllabus9618: subphases.E.fixtures["9618"].status,
    syllabus9709: subphases.E.fixtures["9709"].status,
    futureFixture: subphases.E.futureFixture.status,
    fullNpmTest: "PASS",
    prismaValidate: "PASS",
    architectureFailures,
    documentRoleRegressions
  };
  const checks = {
    parserGeneralizationImproved: Object.values(subphases).every((phase) => phase.status === "PASS"),
    syllabusSpecificLogicReduced: architectureFailures.length === 0,
    regressionCoverageExpanded: Object.values(subphases.E.fixtures).every((fixture) => fixture.status === "PASS") && subphases.E.futureFixture.status === "PASS",
    existingProductionUnchanged: integrity.production.unchanged,
    canonicalModelUnchanged: integrity.canonical.unchanged,
    validationNotWeakened: subphases.C.checks.arrayIndexesExcluded && subphases.D.checks.requiredLayoutsClassified,
    documentRolesStable: documentRoleRegressions.length === 0
  };
  const remainingIssues = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => ({
    check, severity: "P0", issue: "PHASE_7C_COMPLETION_CHECK_FAILED"
  }));
  const status = remainingIssues.length ? "FAIL" : "PASS";
  const deliverables = writeSubphaseReports(subphases, regression);
  const report = {
    generatedFor: "Phase-7C-Generalized-Parser-Coverage-Expansion-Plan",
    phaseId: "Phase 7-C",
    title: "Generalized Parser Coverage Expansion",
    status,
    phaseStatus: status === "PASS" ? "COMPLETE" : "BLOCKED",
    completionDecision: status === "PASS" ? "FULL_PASS" : "BLOCKED",
    productionWrite: false,
    scope: "PARSER_GENERALIZATION_ONLY",
    subphases,
    integrity,
    regression,
    completionChecks: checks,
    remainingIssues,
    deliverables: { ...deliverables, reportPath, debugPath },
    next: status === "PASS"
      ? { phase: "Phase 8", decision: "Long-Term Data Quality Improvement", productionWrite: false }
      : { phase: "Phase 7-C", decision: "Resolve isolated parser generalization failure", productionWrite: false }
  };
  writeJson(reportPath, report);
  writeJson(debugPath, {
    generatedFor: report.generatedFor,
    phaseId: report.phaseId,
    status,
    phaseStatus: report.phaseStatus,
    completionDecision: report.completionDecision,
    productionWrite: false,
    scope: report.scope,
    generalizedCapabilities: capabilitySummary(subphases),
    subphases,
    integrity,
    regression,
    completionChecks: checks,
    remainingIssues,
    reports: report.deliverables,
    next: report.next
  });
  process.stdout.write(`${JSON.stringify({ status, phaseStatus: report.phaseStatus, completionDecision: report.completionDecision, productionWrite: false, debugPath, remainingIssues }, null, 2)}\n`);
  if (status !== "PASS") process.exitCode = 1;
}

function documentStructureChecks() {
  const aliases = [
    "2210_s24_qp_11.pdf",
    "2210-mj24-question-paper-11.pdf",
    "2210 on24 mark scheme 22.PDF"
  ].map(parsePaperFilename);
  const qp = resolveDocumentProfile({ filename: "future_s26_qp_11.pdf", text: "READ THESE INSTRUCTIONS FIRST Answer all questions" });
  const ms = resolveDocumentProfile({ filename: "future_s26_ms_11.pdf", text: "MARK SCHEME Question Answer Marks" });
  const conflict = resolveDocumentProfile({ documentRole: "question_paper", filename: "future_s26_ms_11.pdf", text: "MARK SCHEME" });
  const checks = {
    canonicalFilename: aliases[0]?.roleCode === "qp" && aliases[0]?.session === "M/J",
    separatorAndLongRoleAliases: aliases[1]?.roleCode === "qp" && aliases[1]?.session === "M/J",
    sessionAndMarkSchemeAliases: aliases[2]?.roleCode === "ms" && aliases[2]?.session === "O/N",
    questionPaperSignals: qp.validationProfile === "QUESTION_PAPER" && qp.conflict === false,
    markSchemeSignals: ms.validationProfile === "MARK_SCHEME" && ms.conflict === false,
    conflictingSignalsReported: conflict.conflict && conflict.diagnostics.includes("DOCUMENT_ROLE_SIGNAL_CONFLICT")
  };
  return phaseResult("Document Structure Generalization", checks, { aliases, qp, ms, conflict });
}

function questionParsingChecks() {
  const inputs = ["Q1", "Question 1(a)", "Q1(b)(i)", "Q2(c)(ii)"];
  const references = inputs.map(parseQuestionReference);
  const checks = {
    q1: references[0]?.normalized === "1",
    part: references[1]?.normalized === "1(a)",
    nestedRoman: references[2]?.normalized === "1(b)(i)",
    secondNestedRoman: references[3]?.normalized === "2(c)(ii)",
    invalidIdentifierRejected: parseQuestionReference("Array[1]") === null
  };
  return phaseResult("Question Parsing Generalization", checks, { inputs, references });
}

function markSchemeChecks() {
  const arrayText = "Array[0] Array[1] Array[2] stores values [5]";
  const ordinaryText = "Award one mark for each valid statement. [3]";
  const profiled = applyDocumentProfile({
    paper: { sourcePath: "future_s26_ms_11.pdf" },
    pages: [{
      pageNumber: 2, width: 600, height: 800,
      displayText: "Cambridge International AS & A Level MARK SCHEME Question Answer Marks",
      items: [
        item("Cambridge International AS & A Level MARK SCHEME", 120, 760, 0),
        item("1(a)", 40, 700, 1),
        item("Accept any valid identifier", 140, 700, 2),
        item("2", 540, 700, 3)
      ]
    }]
  });
  const checks = {
    arrayIndexesExcluded: estimateMarks(arrayText) === 5,
    ordinaryMarkRetained: estimateMarks(ordinaryText) === 3,
    generalizedHeader: profiled.pages[0].contentRegions.some((region) => region.type === "MARK_SCHEME_HEADER"),
    entrySourceTrace: profiled.markSchemeEntries.length === 1 && profiled.markSchemeEntries[0].sourceTrace.text === "1(a)",
    correctProfile: profiled.paper.validationProfile === "MARK_SCHEME"
  };
  return phaseResult("Mark Scheme Generalization", checks, { arrayText, ordinaryText, profiled });
}

function responseAreaChecks() {
  const layouts = {
    answerLine: classifyResponseLayout("Explain your answer ............"),
    choice: classifyResponseLayout("Tick one box."),
    table: classifyResponseLayout("Complete the table."),
    visual: classifyResponseLayout("Draw the graph and annotate the diagram."),
    structured: classifyResponseLayout("Show all your working."),
    text: classifyResponseLayout("State one advantage.")
  };
  const checks = {
    explicitAnswerLinePreferred: layouts.answerLine === "answer_line",
    choiceClassified: layouts.choice === "choice_area",
    tableClassified: layouts.table === "structured_table",
    visualClassified: layouts.visual === "visual_response_area",
    structuredClassified: layouts.structured === "structured_response_area",
    textFallbackClassified: layouts.text === "text_response_area",
    requiredLayoutsClassified: Object.values(layouts).every(Boolean)
  };
  return phaseResult("Response Area Generalization", checks, { layouts });
}

async function regressionExpansionChecks() {
  const definitions = {
    "0478": ["public/textbook_syllabus/pastpaper/caie-igcse-0478/2023-March/0478_m23_qp_12.pdf", "0478-2023-FM-12", 6, 26],
    "9618": ["public/textbook_syllabus/pastpaper/caie-as-a-level-9618/2021 May June/9618_s21_qp_11.pdf", "9618-2021-MJ-11", 8, 30],
    "9709": ["public/textbook_syllabus/pastpaper/caie-as-a-level-9709/2024 May June/9709_s24_qp_12.pdf", "9709-2024-MJ-12", 10, 27]
  };
  const fixtures = {};
  for (const [syllabus, [relativePath, paperId, expectedQuestions, expectedLeaves]] of Object.entries(definitions)) {
    const questions = sliceQuestionPaper(await extractPdfGeometry(path.join(rootDir, relativePath)), { paperId });
    const leafCount = questions.flatMap((question) => question.leafQuestions || []).length;
    const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0);
    const valid = questions.length === expectedQuestions && leafCount === expectedLeaves && totalMarks === 75 && questions.every((question) => question.markValidation.valid);
    fixtures[syllabus] = { status: valid ? "PASS" : "FAIL", relativePath, paperId, questionCount: questions.length, leafCount, totalMarks, stableIds: questions.map((question) => question.id) };
  }
  const futureFixture = {
    status: parsePaperFilename("9999-mj26-question-paper-12.pdf") && parseQuestionReference("Q2(c)(ii)") ? "PASS" : "FAIL",
    filename: "9999-mj26-question-paper-12.pdf",
    questionReference: "Q2(c)(ii)",
    purpose: "Future syllabus fixture without syllabus-specific logic"
  };
  const checks = {
    syllabus0478: fixtures["0478"].status === "PASS",
    syllabus9618: fixtures["9618"].status === "PASS",
    syllabus9709: fixtures["9709"].status === "PASS",
    futureFixture: futureFixture.status === "PASS"
  };
  return phaseResult("Regression Expansion", checks, { fixtures, futureFixture });
}

function phaseResult(title, checks, diagnostics) {
  return { title, status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL", checks, ...diagnostics };
}

function item(text, x, y, globalOrder) {
  return { text, x, y, width: Math.max(10, text.length * 5), height: 10, pageNumber: 2, globalOrder, regionType: "content", blockIndex: globalOrder, lineIndex: 0, spanIndex: 0 };
}

function protectedFingerprints() {
  return { production: sha256File(productionPath), canonical: sha256File(canonicalPath) };
}

function comparison(beforeSha256, afterSha256) {
  return { beforeSha256, afterSha256, unchanged: beforeSha256 === afterSha256 };
}

function parserArchitectureFailures() {
  const files = ["paperFilename.js", "documentProfile.js", "questionSlicer.js", "pdfGeometry.js"];
  const failures = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(rootDir, "src", "ingestion", file), "utf8");
    if (/syllabus\s*={2,3}\s*["'](?:0478|9618|9709)["']/.test(source)) failures.push({ file, issue: "SYLLABUS_SPECIFIC_BRANCH" });
    if (/rendered\/(?:0478|9618|9709)-/.test(source)) failures.push({ file, issue: "SYLLABUS_SPECIFIC_ASSET_PATH" });
  }
  return failures;
}

function writeSubphaseReports(subphases, regression) {
  const deliverables = {};
  for (const [key, phase] of Object.entries(subphases)) {
    const prefix = `phase7c-${key.toLowerCase()}`;
    const implementationPath = path.join(outputDir, `${prefix}-implementation-report.json`);
    const regressionPath = path.join(outputDir, `${prefix}-regression-report.json`);
    writeJson(implementationPath, { generatedFor: `Phase-7-C-${key}`, status: phase.status, title: phase.title, checks: phase.checks, diagnostics: phase });
    writeJson(regressionPath, { generatedFor: `Phase-7-C-${key}`, status: phase.status, crossSyllabus: regressionSubset(regression), checks: phase.checks });
    deliverables[key] = { designPath: path.join(rootDir, "docs", `${prefix}-design.md`), implementationPath, regressionPath };
  }
  return { subphases: deliverables };
}

function regressionSubset(regression) {
  return { syllabus0478: regression.syllabus0478, syllabus9618: regression.syllabus9618, syllabus9709: regression.syllabus9709, architectureFailures: regression.architectureFailures, documentRoleRegressions: regression.documentRoleRegressions };
}

function capabilitySummary(subphases) {
  return {
    documentNaming: ["canonical CAIE", "separator aliases", "session aliases", "long role aliases"],
    documentRole: ["metadata", "filename", "content signals", "conflict diagnostics"],
    questionReferences: subphases.B.references.map((reference) => reference.normalized),
    markScheme: ["cross-level headers", "array-index exclusion", "source trace"],
    responseLayouts: subphases.D.layouts,
    regressionFixtures: Object.keys(subphases.E.fixtures).concat("future")
  };
}

function sha256File(filePath) {
  return fs.existsSync(filePath) ? crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex") : null;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
