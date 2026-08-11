#!/usr/bin/env node
"use strict";

const path = require("path");
const { prepareFreshTarget, WORKFLOW_ID, WORKFLOW_VERSION } = require("./promotion-package/production-bootstrap");

function arg(argv, name, required = false) { const i = argv.indexOf(name); if (i >= 0 && argv[i + 1]) return argv[i + 1]; if (required) throw Object.assign(new Error(`${name} is required`), { code: "PR06E_ARGUMENT_REQUIRED" }); return null; }

try {
  const argv = process.argv.slice(2);
  const result = prepareFreshTarget({ root: path.resolve(arg(argv, "--root") || process.cwd()), capturedAt: arg(argv, "--captured-at", true), promotionId: arg(argv, "--promotion-id", true), expectedTargetManifestSha256: arg(argv, "--expected-target-sha", true) });
  process.stdout.write(`${JSON.stringify({ result: result.report.result, workflow: { id: WORKFLOW_ID, version: WORKFLOW_VERSION }, promotionId: result.promotionId, targetManifestSha256: result.report.targetManifestSha256, runtimeRemoteCommitSHA: result.runtime.remoteCommitSHA, productionWrite: false, promotionExecuted: false }, null, 2)}\n`);
} catch (error) { process.stderr.write(`${JSON.stringify({ result: "BLOCK_PR06E_PREFLIGHT", code: error.code || "PR06E_INTERNAL_ERROR", message: error.message, path: error.objectPath || null })}\n`); process.exitCode = 1; }
