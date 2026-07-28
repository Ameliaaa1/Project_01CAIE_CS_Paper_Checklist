#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const defaultManifestPath = path.join(rootDir, "docs", "staging-manifest-phase2.json");
const defaultReportPath = path.join(rootDir, "output", "phase2", "phase2-ingestion-report.json");
const defaultStagingDir = path.join(rootDir, "output", "phase2", "staging");
const defaultLogDir = path.join(rootDir, "logs", "phase2");

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(options.manifest || defaultManifestPath);
  const reportPath = path.resolve(options.report || defaultReportPath);
  const stagingDir = path.resolve(options.stagingDir || defaultStagingDir);
  const logDir = path.resolve(options.logDir || defaultLogDir);
  const manifest = readManifest(manifestPath);

  const phase1Args = [
    path.join(rootDir, "scripts", "phase1-batch-ingestion.js"),
    "--manifest", manifestPath,
    "--report", reportPath,
    "--staging-dir", stagingDir,
    "--log-dir", logDir
  ];
  if (options.dryRun) phase1Args.push("--dry-run");
  if (options.failOnValidation) phase1Args.push("--fail-on-validation");

  const run = spawnSync(process.execPath, phase1Args, {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.status !== 0 && !fs.existsSync(reportPath)) process.exit(run.status || 1);

  const report = readJson(reportPath);
  const enriched = enrichPhase2Report(report, manifest, manifestPath);
  fs.writeFileSync(reportPath, `${JSON.stringify(enriched, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    reportPath,
    totalFiles: enriched.totalFiles,
    successCount: enriched.successCount,
    failedCount: enriched.failedCount,
    skippedCount: enriched.skippedCount,
    successRate: enriched.phase2Analysis.successRate,
    datasetGaps: enriched.phase2Analysis.datasetGaps,
    failureCategories: enriched.phase2Analysis.failureCategories
  }, null, 2)}\n`);
  if (options.failOnValidation && enriched.failedCount > 0) process.exitCode = 1;
}

function enrichPhase2Report(report, manifest, manifestPath) {
  const manifestByFile = new Map(manifest.map((entry) => [entry.file, entry]));
  const results = (report.results || []).map((result) => {
    const entry = manifestByFile.get(result.file) || {};
    return {
      ...result,
      syllabus: entry.syllabus || inferSyllabus(result.file),
      year: entry.year || inferYear(result.file),
      session: entry.session || inferSession(result.file),
      component: entry.component || inferComponent(result.file),
      expectedRole: result.expectedRole || entry.expectedRole,
      phase1Regression: Boolean(entry.phase1Regression)
    };
  });
  const failures = results.flatMap((result) => (result.failures || []).map((failure) => ({
    ...failure,
    file: result.file,
    filename: path.basename(result.file),
    syllabus: result.syllabus,
    year: result.year,
    session: result.session,
    component: result.component,
    documentRole: result.documentRole || result.expectedRole,
    errorCode: primaryErrorCode(failure),
    issue: primaryErrorCode(failure)
  })));
  const groupStats = {
    bySyllabus: groupStatsFor(results, "syllabus"),
    byYear: groupStatsFor(results, "year"),
    bySession: groupStatsFor(results, "session"),
    byDocumentRole: groupStatsFor(results, "expectedRole"),
    byComponent: groupStatsFor(results, "component")
  };
  const failureCategories = failureCategoryStats(failures);
  const datasetGaps = [];

  return {
    ...report,
    phase: "Phase 2",
    manifestPath: path.relative(rootDir, manifestPath),
    generatedAt: new Date().toISOString(),
    failures,
    results,
    groupStats,
    phase2Analysis: {
      successRate: report.totalFiles ? Number((report.successCount / report.totalFiles).toFixed(4)) : 0,
      architectureFailures: failures.filter((failure) => ["EXTRACTION_ERROR", "STAGING_ERROR", "UNHANDLED_EXCEPTION"].includes(failure.suspectedRootCause)),
      documentRoleRegressions: failures.filter((failure) => failure.suspectedRootCause === "DOCUMENT_ROLE_MISMATCH"),
      textQualityRegressions: failures.filter((failure) => primaryErrorCode(failure) === "TEXT_QUALITY_METRIC_INCONSISTENT" || primaryErrorCode(failure) === "BARCODE_TEXT_PRESENT"),
      failureCategories,
      datasetGaps,
      recommendedFuturePRs: recommendedFuturePRs(failureCategories, datasetGaps)
    }
  };
}

function groupStatsFor(results, key) {
  return results.reduce((groups, result) => {
    const value = String(result[key] ?? "unknown");
    groups[value] ||= { total: 0, success: 0, failed: 0, skipped: 0 };
    groups[value].total += 1;
    if (result.status === "PASS") groups[value].success += 1;
    else if (result.status === "FAIL") groups[value].failed += 1;
    else groups[value].skipped += 1;
    return groups;
  }, {});
}

function failureCategoryStats(failures) {
  return failures.reduce((groups, failure) => {
    const key = primaryErrorCode(failure) || failure.suspectedRootCause || "UNKNOWN";
    groups[key] ||= { count: 0, severity: failure.severity || "P0", examples: [] };
    groups[key].count += 1;
    if (groups[key].examples.length < 10) {
      groups[key].examples.push({
        file: failure.file,
        syllabus: failure.syllabus,
        documentRole: failure.documentRole,
        stage: failure.stage,
        suspectedRootCause: failure.suspectedRootCause
      });
    }
    return groups;
  }, {});
}

function recommendedFuturePRs(failureCategories, datasetGaps) {
  const recommendations = [];
  Object.entries(failureCategories).forEach(([code, category]) => {
    recommendations.push({
      title: `Investigate ${code}`,
      priority: category.severity === "P0" ? "high" : "medium",
      evidenceCount: category.count,
      scope: "Create a targeted parser/staging PR only after reviewing affected debug logs and staging JSON."
    });
  });
  datasetGaps.forEach((gap) => {
    recommendations.push({
      title: `Add ${gap.syllabus} controlled fixtures`,
      priority: "medium",
      evidenceCount: 0,
      scope: gap.message
    });
  });
  return recommendations;
}

function primaryErrorCode(failure) {
  const counts = failure.observed?.countsByCode || {};
  const first = Object.keys(counts)[0];
  return first || failure.suspectedRootCause || failure.stage || "UNKNOWN";
}

function readManifest(manifestPath) {
  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest)) throw new Error("Phase 2 manifest must be a JSON array.");
  return manifest.map((entry, index) => {
    if (!entry.file) throw new Error(`Manifest entry ${index} is missing file.`);
    if (!["question_paper", "mark_scheme"].includes(entry.expectedRole)) {
      throw new Error(`Manifest entry ${index} has invalid expectedRole: ${entry.expectedRole}`);
    }
    return entry;
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function inferSyllabus(file) {
  return path.basename(file).match(/^(\d{4})_/)?.[1] || "unknown";
}

function inferYear(file) {
  const yearCode = path.basename(file).match(/^[0-9]{4}_[msw](\d{2})_/)?.[1];
  return yearCode ? 2000 + Number(yearCode) : "unknown";
}

function inferSession(file) {
  const code = path.basename(file).match(/^[0-9]{4}_([msw])\d{2}_/)?.[1];
  return { m: "March", s: "May-June", w: "Oct-Nov" }[code] || "unknown";
}

function inferComponent(file) {
  return path.basename(file).match(/_(?:qp|ms)_(\d{2})\.pdf$/i)?.[1] || "unknown";
}

function parseArgs(args) {
  const options = {
    manifest: null,
    report: null,
    stagingDir: null,
    logDir: null,
    dryRun: false,
    failOnValidation: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--fail-on-validation") options.failOnValidation = true;
    else if (arg.startsWith("--manifest=")) options.manifest = arg.slice("--manifest=".length);
    else if (arg === "--manifest") options.manifest = args[++index];
    else if (arg.startsWith("--report=")) options.report = arg.slice("--report=".length);
    else if (arg === "--report") options.report = args[++index];
    else if (arg.startsWith("--staging-dir=")) options.stagingDir = arg.slice("--staging-dir=".length);
    else if (arg === "--staging-dir") options.stagingDir = args[++index];
    else if (arg.startsWith("--log-dir=")) options.logDir = arg.slice("--log-dir=".length);
    else if (arg === "--log-dir") options.logDir = args[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

main();
