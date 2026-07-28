#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { loadProductionQuestionEntries } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const indexPath = path.join(rootDir, "generated", "production-question-index.json");
const publicIndexPath = path.join(rootDir, "public", "assets", "question-index.json");
const outputDir = path.join(rootDir, "output", "website-pdf-dependency-migration");
const reportPath = path.join(outputDir, "website-pdf-dependency-migration-report.json");
const debugPath = path.join(outputDir, "website-pdf-dependency-migration-debug.json");

function runMigration(options = {}) {
  const storeShaBefore = sha256File(storePath);
  if (options.build !== false) {
    execFileSync(process.execPath, [path.join(rootDir, "scripts", "build-question-index.js")], {
      cwd: rootDir,
      stdio: options.quiet ? "pipe" : "inherit"
    });
  }

  const storeShaAfter = sha256File(storePath);
  const index = readJson(indexPath);
  const publicIndex = readJson(publicIndexPath);
  const canonicalEntries = loadProductionQuestionEntries(storePath);
  const dependencyAudit = auditWebsiteDependencies();
  const missingReferences = [];
  const syllabusCounts = {};
  const answerCounts = {};

  for (const entry of index.entries || []) {
    syllabusCounts[entry.syllabusId] = (syllabusCounts[entry.syllabusId] || 0) + 1;
    if (entry.answer) answerCounts[entry.syllabusId] = (answerCounts[entry.syllabusId] || 0) + 1;
    for (const [role, reference] of Object.entries(entry.sourceReferences || {})) {
      const localPath = reference?.url ? path.join(rootDir, "public", reference.url.replace(/^\/+/, "")) : "";
      if (!reference?.url || !fs.existsSync(localPath)) {
        missingReferences.push({ canonicalQuestionId: entry.canonicalQuestionId, role, url: reference?.url || null });
      }
    }
  }

  const canonicalMatches = JSON.stringify(index.entries) === JSON.stringify(canonicalEntries);
  const publicMatches = JSON.stringify(publicIndex) === JSON.stringify(index);
  const expectedSyllabuses = ["caie-igcse-0478", "caie-as-a-level-9618", "caie-as-a-level-9709"];
  const checks = {
    questionDisplay: Boolean(index.entries?.length) && index.entries.every((entry) => entry.question && entry.dataSource === "PRODUCTION_CANONICAL"),
    markSchemeDisplay: index.entries.some((entry) => entry.answer) && index.entries.every((entry) => entry.sourceReferences?.markScheme?.url),
    search: index.entries.every((entry) => `${entry.question || ""} ${entry.answer || ""}`.trim().length > 0),
    pdfViewer: missingReferences.length === 0 && index.entries.every((entry) => entry.sourceReferences?.questionPaper?.pageStart),
    canonicalIntegrity: canonicalMatches && publicMatches,
    noWebsitePdfParsing: dependencyAudit.violations.length === 0,
    syllabusRegression: expectedSyllabuses.every((syllabusId) => syllabusCounts[syllabusId] > 0),
    productionStoreUnchanged: storeShaBefore === storeShaAfter
  };
  const status = Object.values(checks).every(Boolean) ? "PASS" : "FAIL";
  const generatedAt = new Date().toISOString();
  const report = {
    schemaVersion: "1.0.0",
    generatedAt,
    status,
    architecture: "PDF -> Parser Pipeline -> Canonical -> Production -> Website",
    dataSource: index.dataSource,
    checks,
    counts: {
      questions: index.entries.length,
      markSchemeAnswers: Object.values(answerCounts).reduce((sum, count) => sum + count, 0),
      sourceReferencesChecked: index.entries.length * 2,
      missingReferences: missingReferences.length,
      bySyllabus: syllabusCounts,
      answersBySyllabus: answerCounts
    },
    rollback: "Restore the previous production API/data adapter only; never restore website PDF parsing."
  };
  const debug = {
    ...report,
    files: {
      productionStore: relative(storePath),
      serverIndex: relative(indexPath),
      browserIndex: relative(publicIndexPath),
      report: relative(reportPath),
      debug: relative(debugPath)
    },
    hashes: {
      productionStoreBefore: storeShaBefore,
      productionStoreAfter: storeShaAfter,
      serverIndex: sha256File(indexPath),
      browserIndex: sha256File(publicIndexPath)
    },
    dependencyAudit,
    integrity: {
      adapterEntryCount: canonicalEntries.length,
      serverEntryCount: index.entries.length,
      publicEntryCount: publicIndex.entries.length,
      serverEqualsProductionAdapter: canonicalMatches,
      browserEqualsServer: publicMatches,
      missingReferences
    },
    samples: Object.fromEntries(expectedSyllabuses.map((syllabusId) => [
      syllabusId,
      index.entries.find((entry) => entry.syllabusId === syllabusId && entry.answer) ||
        index.entries.find((entry) => entry.syllabusId === syllabusId) ||
        null
    ]))
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(debugPath, `${JSON.stringify(debug, null, 2)}\n`);
  return { report, debug, reportPath, debugPath };
}

function auditWebsiteDependencies() {
  const files = ["server.js", "public/app.js", "scripts/build-question-index.js"];
  const forbidden = [
    { label: "pdf-parse runtime", pattern: /PDFParse|require\(["']pdf-parse["']\)/ },
    { label: "canvas PDF rendering", pattern: /getScreenshot|canvasTools/ },
    { label: "PDF text extraction", pattern: /getTextContent|parsedPdfGeometry/ },
    { label: "source PDF loading", pattern: /PDFDocument\.load/ },
    { label: "website question detection", pattern: /findQuestionMarker|questionSelectorsFromRef|sourceSegmentsForQuestion/ },
    { label: "frontend preview extraction endpoint", pattern: /api\/question-preview/ }
  ];
  const violations = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(rootDir, file), "utf8");
    for (const rule of forbidden) {
      if (rule.pattern.test(source) && !(file === "server.js" && rule.label === "frontend preview extraction endpoint")) {
        violations.push({ file, rule: rule.label });
      }
    }
  }
  return {
    status: violations.length ? "FAIL" : "PASS",
    files,
    violations,
    allowedPdfUse: ["Static original-reference serving", "Canonical-text practice PDF generation via PDFDocument.create"]
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function relative(filePath) {
  return path.relative(rootDir, filePath);
}

if (require.main === module) {
  const result = runMigration();
  process.stdout.write(`Website PDF dependency migration: ${result.report.status}\n`);
  process.stdout.write(`Debug JSON: ${relative(result.debugPath)}\n`);
  if (result.report.status !== "PASS") process.exitCode = 1;
}

module.exports = { runMigration, auditWebsiteDependencies, paths: { reportPath, debugPath } };
