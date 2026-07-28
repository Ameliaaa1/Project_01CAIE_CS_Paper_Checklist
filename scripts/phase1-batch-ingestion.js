#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const defaultManifestPath = path.join(rootDir, "docs", "staging-manifest-phase1.json");
const defaultReportPath = path.join(rootDir, "output", "phase1", "phase1-ingestion-report.json");
const defaultStagingDir = path.join(rootDir, "output", "phase1", "staging");
const defaultLogDir = path.join(rootDir, "logs", "phase1");
const sampleDir = path.join(rootDir, "output", "ingestion-samples");

function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(options.manifest || defaultManifestPath);
  const reportPath = path.resolve(options.report || defaultReportPath);
  const stagingDir = path.resolve(options.stagingDir || defaultStagingDir);
  const logDir = path.resolve(options.logDir || defaultLogDir);
  const manifest = readManifest(manifestPath);
  const startedAt = new Date().toISOString();

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  const results = manifest.map((entry, index) => processEntry(entry, {
    index,
    dryRun: options.dryRun,
    logDir,
    stagingDir
  }));
  const failures = results.flatMap((result) => result.failures || []);
  const report = {
    generatedAt: new Date().toISOString(),
    startedAt,
    completedAt: new Date().toISOString(),
    productionWrite: false,
    manifestPath: path.relative(rootDir, manifestPath),
    totalFiles: results.length,
    successCount: results.filter((result) => result.status === "PASS").length,
    failedCount: results.filter((result) => result.status === "FAIL").length,
    skippedCount: results.filter((result) => result.status === "SKIPPED").length,
    failures,
    results
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    reportPath,
    totalFiles: report.totalFiles,
    successCount: report.successCount,
    failedCount: report.failedCount,
    skippedCount: report.skippedCount,
    failures: report.failures.map((failure) => ({
      file: failure.file,
      stage: failure.stage,
      severity: failure.severity,
      suspectedRootCause: failure.suspectedRootCause
    }))
  }, null, 2)}\n`);

  if (options.failOnValidation && report.failedCount > 0) process.exitCode = 1;
}

function processEntry(entry, context) {
  const startTime = new Date().toISOString();
  const filePath = path.resolve(rootDir, entry.file);
  const basename = path.basename(entry.file, ".pdf");
  const logPath = path.join(context.logDir, `${basename}.log`);
  const log = [];
  const failures = [];
  const result = {
    file: entry.file,
    expectedRole: entry.expectedRole,
    purpose: entry.purpose || null,
    status: "FAIL",
    startTime,
    endTime: null,
    samplePath: null,
    stagingPath: null,
    logPath: path.relative(rootDir, logPath),
    parserVersion: null,
    documentRole: null,
    parserProfile: null,
    validationProfile: null,
    stagingId: null,
    validationStatus: null,
    canonicalCompletenessStatus: null,
    canonicalPublishable: null,
    publishStatus: null,
    issueCounts: { P0: 0, P1: 0, P2: 0 },
    stages: []
  };

  try {
    appendLog(log, `file=${entry.file}`);
    appendLog(log, `startTime=${startTime}`);
    appendLog(log, `expectedRole=${entry.expectedRole}`);
    if (!fs.existsSync(filePath)) {
      throw failure("manifest", `PDF not found: ${entry.file}`, "P0", "MISSING_FILE");
    }
    if (context.dryRun) {
      result.status = "SKIPPED";
      result.stages.push({ stage: "dry_run", ok: true });
      return result;
    }

    const extractRun = runNodeScript("scripts/extract-paper-sample.js", [filePath]);
    result.stages.push(stageRecord("extract", extractRun));
    appendCommandLog(log, "extract", extractRun);
    if (extractRun.status !== 0) {
      throw failure("extract", extractRun.stderr || extractRun.stdout || "Extraction failed.", "P0", "EXTRACTION_ERROR");
    }

    const samplePath = path.join(sampleDir, `${basename}.sample.json`);
    result.samplePath = path.relative(rootDir, samplePath);
    const sample = readJson(samplePath, "extract");
    result.parserVersion = sample.paper?.parserVersion || null;
    result.documentRole = sample.paper?.documentRole || null;
    result.parserProfile = sample.paper?.parserProfile || null;
    result.validationProfile = sample.paper?.validationProfile || null;
    appendLog(log, `parserVersion=${result.parserVersion}`);
    appendLog(log, `documentRole=${result.documentRole}`);
    appendLog(log, `validationProfile=${result.validationProfile}`);

    if (entry.expectedRole && result.documentRole !== entry.expectedRole) {
      failures.push(normalizeFailure(
        failure("role_validation", `Expected ${entry.expectedRole}, got ${result.documentRole}.`, "P0", "DOCUMENT_ROLE_MISMATCH"),
        entry.file
      ));
    }

    const stagingPath = path.join(context.stagingDir, `${basename}.staging.json`);
    const stageRun = runNpmScript("pdf:stage-sample", [
      "--",
      `--sample=${samplePath}`,
      `--output=${stagingPath}`,
      "--approve-golden",
      "--human-admin-review",
      "--human-reviewer=phase-batch-regression"
    ]);
    result.stages.push(stageRecord("stage", stageRun));
    appendCommandLog(log, "stage", stageRun);
    if (stageRun.status !== 0) {
      throw failure("stage", stageRun.stderr || stageRun.stdout || "Staging failed.", "P0", "STAGING_ERROR");
    }

    result.stagingPath = path.relative(rootDir, stagingPath);
    const staging = readJson(stagingPath, "stage");
    result.stagingId = staging.run?.id || null;
    result.validationStatus = staging.validation?.status || staging.run?.summary_json?.validationStatus || null;
    result.publishStatus = staging.run?.publish_status || null;
    const completeness = staging.run?.summary_json?.canonicalCompletenessGate || null;
    result.canonicalCompletenessStatus = completeness?.status || null;
    result.canonicalPublishable = completeness?.publishable === true;
    result.issueCounts = {
      P0: Number(staging.run?.p0_issue_count || 0),
      P1: Number(staging.run?.p1_issue_count || 0),
      P2: Number(staging.run?.p2_issue_count || 0)
    };
    result.stageSummary = {
      pageCount: sample.pages?.length || 0,
      questionCount: sample.questions?.length || 0,
      leafQuestionCount: (sample.questions || []).flatMap((question) => question.leafQuestions || []).length,
      markSchemeEntryCount: (sample.markSchemeEntries || []).length,
      issueCount: staging.issues?.length || 0
    };
    appendLog(log, `stagingId=${result.stagingId}`);
    appendLog(log, `validationStatus=${result.validationStatus}`);
    appendLog(log, `publishStatus=${result.publishStatus}`);
    appendLog(log, `canonicalCompletenessStatus=${result.canonicalCompletenessStatus}`);
    appendLog(log, `canonicalPublishable=${result.canonicalPublishable}`);
    appendLog(log, `issueCounts=${JSON.stringify(result.issueCounts)}`);

    if (result.issueCounts.P0 > 0) {
      failures.push(normalizeFailure(
        failure("validation", "Staging validation produced P0 issues.", "P0", "STAGING_VALIDATION_P0", issueSummary(staging.issues || [])),
        entry.file
      ));
    }
    if (result.validationStatus !== "PASS") {
      failures.push(normalizeFailure(
        failure("validation", `Staging validation status is ${result.validationStatus || "missing"}.`, "P1", "STAGING_VALIDATION_NOT_PASS", issueSummary(staging.issues || [])),
        entry.file
      ));
    }
    if (result.issueCounts.P1 > 0 || result.issueCounts.P2 > 0) {
      failures.push(normalizeFailure(
        failure("validation", "Staging validation produced blocking P1/P2 issues.", result.issueCounts.P1 > 0 ? "P1" : "P2", "STAGING_VALIDATION_BLOCKING_ISSUES", issueSummary(staging.issues || [])),
        entry.file
      ));
    }
    if (!result.canonicalPublishable) {
      failures.push(normalizeFailure(
        failure("canonical_completeness", "Canonical completeness gate blocked the staging artifact.", "P0", "CANONICAL_COMPLETENESS_GATE_FAILED", {
          status: result.canonicalCompletenessStatus,
          issues: completeness?.issues || []
        }),
        entry.file
      ));
    }
    if (result.publishStatus !== "READY_TO_PUBLISH") {
      failures.push(normalizeFailure(
        failure("publish_gate", `Publish status is ${result.publishStatus || "missing"}.`, "P2", "STAGING_NOT_READY_TO_PUBLISH"),
        entry.file
      ));
    }
    result.status = failures.length ? "FAIL" : "PASS";
  } catch (error) {
    const normalized = normalizeFailure(error, entry.file);
    failures.push(normalized);
    appendLog(log, `error=${normalized.message}`);
    appendLog(log, `suspectedRootCause=${normalized.suspectedRootCause}`);
    result.status = "FAIL";
  } finally {
    result.endTime = new Date().toISOString();
    appendLog(log, `endTime=${result.endTime}`);
    appendLog(log, `status=${result.status}`);
    result.failures = failures.map((item) => ({ ...item, file: entry.file }));
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, `${log.join("\n")}\n`);
  }
  return result;
}

function readManifest(manifestPath) {
  const manifest = readJson(manifestPath, "manifest");
  if (!Array.isArray(manifest)) throw new Error("Phase 1 manifest must be a JSON array.");
  return manifest.map((entry, index) => {
    if (!entry.file) throw new Error(`Manifest entry ${index} is missing file.`);
    if (!["question_paper", "mark_scheme"].includes(entry.expectedRole)) {
      throw new Error(`Manifest entry ${index} has invalid expectedRole: ${entry.expectedRole}`);
    }
    return entry;
  });
}

function readJson(filePath, stage) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw failure(stage, `Could not read JSON ${filePath}: ${error.message}`, "P0", "JSON_READ_ERROR");
  }
}

function runNodeScript(script, args) {
  return spawnSync(process.execPath, [path.join(rootDir, script), ...args], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
}

function runNpmScript(script, args) {
  return spawnSync("npm", ["run", script, ...args], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
}

function stageRecord(stage, result) {
  return {
    stage,
    ok: result.status === 0,
    exitCode: result.status,
    signal: result.signal || null
  };
}

function appendLog(log, line) {
  log.push(`[${new Date().toISOString()}] ${line}`);
}

function appendCommandLog(log, stage, result) {
  appendLog(log, `${stage}.exitCode=${result.status}`);
  if (result.stdout) appendLog(log, `${stage}.stdout=\n${result.stdout.trim()}`);
  if (result.stderr) appendLog(log, `${stage}.stderr=\n${result.stderr.trim()}`);
}

function failure(stage, message, severity, suspectedRootCause, observed = null) {
  const error = new Error(message);
  error.phase1Failure = { stage, message, severity, suspectedRootCause, observed };
  return error;
}

function normalizeFailure(error, file = null) {
  const base = error.phase1Failure || {
    stage: "unknown",
    message: error.message || String(error),
    severity: "P0",
    suspectedRootCause: "UNHANDLED_EXCEPTION",
    observed: null
  };
  return {
    file,
    stage: base.stage,
    message: base.message,
    severity: base.severity,
    suspectedRootCause: base.suspectedRootCause,
    observed: base.observed || null
  };
}

function issueSummary(issues) {
  const countsByCode = {};
  const p0Issues = issues.filter((issue) => issue.severity === "P0");
  p0Issues.forEach((issue) => {
    countsByCode[issue.code] = (countsByCode[issue.code] || 0) + 1;
  });
  return {
    p0IssueCount: p0Issues.length,
    countsByCode,
    examples: p0Issues.slice(0, 10).map((issue) => ({
      code: issue.code,
      message: issue.message,
      questionId: issue.question_id || null,
      pageNumber: issue.page_number || null
    }))
  };
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
