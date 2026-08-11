#!/usr/bin/env node
"use strict";

const path = require("path");
const { buildBootstrapPackage, runBootstrapDryRun, writeBootstrapPackage, writePackageHashReport } = require("./promotion-package/bootstrap");

function argument(argv, name, required = false) {
  const index = argv.indexOf(name);
  if (index !== -1 && argv[index + 1]) return argv[index + 1];
  if (required) {
    const error = new Error(`${name} is required`);
    error.code = "PACKAGE_ARGUMENT_REQUIRED";
    throw error;
  }
  return null;
}

try {
  const argv = process.argv.slice(2);
  const root = path.resolve(argument(argv, "--root") || process.cwd());
  const result = buildBootstrapPackage({ root, sourcePath: argument(argv, "--source") || undefined, sourceCommit: argument(argv, "--source-commit", true), generatedAt: argument(argv, "--generated-at", true), promotionId: argument(argv, "--promotion-id") || undefined });
  writeBootstrapPackage(result);
  const reportPath = "promotion/target/evidence/pr06d-dry-run-report.json";
  const report = runBootstrapDryRun(result, { reportPath });
  const hashReportPath = "promotion/target/evidence/pr06d-package-hash-report.json";
  writePackageHashReport(result, report, hashReportPath);
  process.stdout.write(`${JSON.stringify({ result: "READY_PR06D_FIRST_REAL_BOOTSTRAP_PACKAGE_FOR_HUMAN_REVIEW", workflow: { id: "paperlens-pr06d-bootstrap-package-generator", version: "1.0.0" }, promotionId: result.promotionId, sourceCommit: result.sourceCommit, artifactSha256: result.artifactSha256, recordCount: result.recordCount, supportedSyllabi: result.scope, dryRun: report.result, dryRunReportPath: reportPath, hashReportPath, productionWrite: false, promotionExecuted: false, deploymentExecuted: false }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ result: "BLOCK_PR06D_BOOTSTRAP_PACKAGE_GENERATION", code: error.code || "PACKAGE_INTERNAL_ERROR", message: error.message, path: error.objectPath || null })}\n`);
  process.exitCode = 1;
}
