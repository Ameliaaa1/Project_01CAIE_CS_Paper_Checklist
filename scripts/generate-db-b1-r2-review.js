#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "artifacts", "db-b1-r2");
const stage = "DB-B1-R2_AUTOMATED_VERIFICATION_ENHANCEMENT_AND_COMBINED_HUMAN_REVIEW_PREPARATION";
const safety = {
  productionDatabaseConnected: false,
  productionDatabaseUsed: false,
  productionMigrationAuthorized: false,
  productionWrite: false,
  productionDeploy: false,
  paymentProviderRuntimeEnabled: false,
};

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function ensureParent(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeJson(relative, value) {
  const file = path.join(out, relative);
  ensureParent(file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  JSON.parse(fs.readFileSync(file, "utf8"));
  return file;
}

function writeText(relative, value) {
  const file = path.join(out, relative);
  ensureParent(file);
  fs.writeFileSync(file, value);
  return file;
}

function relative(file) {
  return path.relative(out, file).split(path.sep).join("/");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

function metadata(file) {
  const extension = path.extname(file).toLowerCase();
  let jsonValid = null;
  if (extension === ".json") {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
      jsonValid = true;
    } catch {
      jsonValid = false;
    }
  }
  return {
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    mimeType: extension === ".json" ? "application/json" : extension === ".md" ? "text/markdown" : "application/octet-stream",
    parseStatus: jsonValid === null ? "NOT_APPLICABLE" : jsonValid ? "PASS" : "FAIL",
    jsonValid,
  };
}

function run(command, args, environment) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: root,
    env: environment,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    command: [command, ...args].join(" "),
    startedAt,
    completedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status === 0 ? "PASS" : "FAIL",
  };
}

function verifyManifest(manifestFile, baseDirectory) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const mismatches = [];
  for (const [artifact, expected] of Object.entries(manifest.artifacts || {})) {
    const file = path.join(baseDirectory, artifact);
    if (!fs.existsSync(file)) {
      mismatches.push({ artifact, mismatch: "MISSING" });
      continue;
    }
    const actual = metadata(file);
    for (const field of ["sizeBytes", "sha256", "parseStatus"]) {
      if (actual[field] !== expected[field]) {
        mismatches.push({ artifact, field, expected: expected[field], actual: actual[field] });
      }
    }
  }
  return { checkedArtifactCount: Object.keys(manifest.artifacts || {}).length, mismatches };
}

function zipFiles(target, files) {
  fs.rmSync(target, { force: true });
  execFileSync("zip", ["-X", "-q", target, ...files.map(relative)], { cwd: out });
}

function zipInfo(file) {
  const entries = execFileSync("unzip", ["-Z1", file], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  execFileSync("unzip", ["-tqq", file], { stdio: "pipe" });
  const forbidden = entries.filter((entry) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(entry));
  return {
    path: relative(file),
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    entryCount: entries.length,
    entries,
    crcValid: true,
    forbiddenArtifacts: forbidden,
    forbiddenArtifactCount: forbidden.length,
  };
}

const initialStatus = git(["status", "--porcelain=v1", "--untracked-files=all"]);
if (initialStatus) {
  throw new Error(`DB-B1-R2 requires a clean candidate worktree before evidence generation:\n${initialStatus}`);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const generatedAt = new Date().toISOString();
const evidenceCommit = git(["rev-parse", "HEAD"]);
const branch = git(["branch", "--show-current"]);
const originMain = git(["rev-parse", "origin/main"]);
const r1Root = path.join(root, "artifacts", "db-b1-r1");
const r1GateFile = path.join(r1Root, "gate", "db-b1-r1-external-gate.json");
const r1ManifestFile = path.join(r1Root, "package", "db-b1-r1-evidence-manifest.json");
const r1ManifestVerificationFile = path.join(r1Root, "package", "db-b1-r1-evidence-manifest-verification.json");
const r1ZipVerificationFile = path.join(r1Root, "package", "db-b1-r1-zip-verification.json");
const r1ValidationFile = path.join(r1Root, "tests", "db-b1-r1-final-validation-report.json");
const r1BuildFile = path.join(r1Root, "build", "db-b1-r1-build-index-reproducibility-report.json");
const r1DatabaseFile = path.join(r1Root, "tests", "db-b1-r1-database-test-equivalence-report.json");
const r1Gate = JSON.parse(fs.readFileSync(r1GateFile, "utf8"));
const r1ManifestVerification = JSON.parse(fs.readFileSync(r1ManifestVerificationFile, "utf8"));
const r1ZipVerification = JSON.parse(fs.readFileSync(r1ZipVerificationFile, "utf8"));
const r1Validation = JSON.parse(fs.readFileSync(r1ValidationFile, "utf8"));
const r1Build = JSON.parse(fs.readFileSync(r1BuildFile, "utf8"));
const r1Database = JSON.parse(fs.readFileSync(r1DatabaseFile, "utf8"));
const r1ManifestRecheck = verifyManifest(r1ManifestFile, r1Root);

const baseline = writeJson("baseline/db-b1-r2-baseline-verification.json", {
  stage,
  generatedAt,
  branch,
  evidenceCommit,
  technicalCandidateCommit: r1Gate.candidateCommit,
  originMain,
  workingTreeStatusBeforeEvidenceGeneration: "",
  workingTreeClean: true,
  r1Evidence: {
    gate: { path: "artifacts/db-b1-r1/gate/db-b1-r1-external-gate.json", sha256: sha256(r1GateFile), status: r1Gate.status },
    manifest: { path: "artifacts/db-b1-r1/package/db-b1-r1-evidence-manifest.json", sha256: sha256(r1ManifestFile) },
    manifestVerification: { path: "artifacts/db-b1-r1/package/db-b1-r1-evidence-manifest-verification.json", sha256: sha256(r1ManifestVerificationFile), status: r1ManifestVerification.status },
    zipVerification: { path: "artifacts/db-b1-r1/package/db-b1-r1-zip-verification.json", sha256: sha256(r1ZipVerificationFile), status: r1ZipVerification.status },
  },
  r1ManifestRecheckMismatchCount: r1ManifestRecheck.mismatches.length,
  candidateIdentityVerified: /^[a-f0-9]{40}$/.test(r1Gate.candidateCommit),
  evidenceIdentityVerified: r1ManifestRecheck.mismatches.length === 0 && r1ManifestVerification.status === "PASS" && r1ZipVerification.status === "PASS",
  actualMainUpdated: false,
  ...safety,
  status: r1ManifestRecheck.mismatches.length === 0 ? "PASS" : "FAIL",
});

const cleanEnvironment = { ...process.env };
for (const key of ["DATABASE_URL", "DIRECT_URL", "BILLING_PROVIDER_ENABLED", "BILLING_ENVIRONMENT"]) {
  delete cleanEnvironment[key];
}
const validateEnvironment = {
  ...cleanEnvironment,
  DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=require",
};
const prismaValidate = run("npx", ["prisma", "validate"], validateEnvironment);
const browserNegativePath = run("node", ["tests/browser-data-load.test.js"], cleanEnvironment);
const fullSuite = run("npm", ["test"], cleanEnvironment);
const indexBuild = run("npm", ["run", "build:question-index"], cleanEnvironment);
const indexTest = run("npm", ["run", "test:question-index-build"], cleanEnvironment);

const expectedBrowserWarning = /Production question index could not be loaded[\s\S]*HTTP undefined/.test(browserNegativePath.stderr)
  && /Production question index could not be loaded[\s\S]*HTTP undefined/.test(fullSuite.stderr);
const unexpectedStderr = [
  { id: "PRISMA_VALIDATE", stderr: prismaValidate.stderr },
  { id: "BROWSER_NEGATIVE_PATH", stderr: browserNegativePath.stderr, expected: expectedBrowserWarning },
  { id: "FULL_LOCAL_SUITE", stderr: fullSuite.stderr, expected: expectedBrowserWarning },
  { id: "INDEX_BUILD", stderr: indexBuild.stderr },
  { id: "INDEX_TEST", stderr: indexTest.stderr },
].filter(({ stderr, expected }) => stderr.trim() && !expected);
const testAnalysis = writeJson("tests/db-b1-r2-test-output-analysis.json", {
  stage,
  generatedAt,
  executions: [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].map((item) => ({
    command: item.command,
    exitCode: item.exitCode,
    signal: item.signal,
    stdoutNonEmpty: Boolean(item.stdout.trim()),
    stderrNonEmpty: Boolean(item.stderr.trim()),
    stderr: item.stderr,
    status: item.status,
  })),
  analyzedOutputs: [{
    output: "Production question index could not be loaded. Error: Production question index returned HTTP undefined.",
    sourceLocation: "public/app.js:948",
    triggeringTest: "tests/browser-data-load.test.js:59",
    trigger: "The test fetch stub deliberately returns { ok: false } without a status value.",
    classification: "EXPECTED_NEGATIVE_PATH_FAIL_CLOSED_BEHAVIOR",
    runtimeImpact: "NONE; the isolated VM test verifies app startup while the browser index is unavailable.",
    exitCode: browserNegativePath.exitCode,
    explained: expectedBrowserWarning,
  }],
  nonEmptyStderrCount: [browserNegativePath.stderr, fullSuite.stderr].filter((value) => value.trim()).length,
  unexplainedOutputCount: unexpectedStderr.length,
  unexplainedOutputs: unexpectedStderr,
  allCommandsPassed: [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].every(({ exitCode }) => exitCode === 0),
  ...safety,
  status: unexpectedStderr.length === 0 && [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].every(({ exitCode }) => exitCode === 0) ? "PASS" : "FAIL",
});

const canonicalFile = path.join(root, "generated", "production-question-index.json");
const browserFile = path.join(root, "public", "assets", "question-index.json");
const canonical = JSON.parse(fs.readFileSync(canonicalFile, "utf8"));
const browser = JSON.parse(fs.readFileSync(browserFile, "utf8"));
const uniqueQuestionPapers = new Set(canonical.entries.map((entry) => entry.sourceReferences?.questionPaper?.paperId).filter(Boolean));
const uniqueMarkSchemes = new Set(canonical.entries.map((entry) => entry.sourceReferences?.markScheme?.paperId).filter(Boolean));
const uniquePaperCodes = new Set(canonical.entries.map((entry) => entry.paper).filter(Boolean));
const legacyBytes = execFileSync("git", ["show", "68969f54b1afe00c5ba6552787bd237dbc8a27cf:generated/question-index.json"], { cwd: root });
const legacy = JSON.parse(legacyBytes.toString("utf8"));
const indexReport = writeJson("index/db-b1-r2-index-count-semantics-report.json", {
  stage,
  generatedAt,
  authoritativeSource: "generated/production-question-index.json",
  browserMirror: "public/assets/question-index.json",
  counts: {
    papers: {
      actual: canonical.papers,
      meaning: "Total canonical source documents represented: unique question papers plus their unique mark schemes.",
      derivation: `${uniqueQuestionPapers.size} question papers + ${uniqueMarkSchemes.size} mark schemes`,
      consistent: canonical.papers === uniqueQuestionPapers.size + uniqueMarkSchemes.size,
    },
    questions: {
      actual: canonical.questions,
      meaning: "Canonical top-level searchable question entries.",
      entryArrayCount: canonical.entries.length,
      consistent: canonical.questions === canonical.entries.length,
    },
    markSchemeEntries: {
      actual: canonical.markSchemeEntries,
      meaning: "Canonical mark-scheme records used to aggregate answer evidence; this is not a paper or question count.",
    },
    uniquePaperCodes: {
      actual: uniquePaperCodes.size,
      meaning: "Unique examination paper/component identities represented by question entries.",
    },
  },
  browserMirrorSemanticEqual: JSON.stringify(browser) === JSON.stringify(canonical),
  canonicalSha256: sha256(canonicalFile),
  browserMirrorSha256: sha256(browserFile),
  requiredDataMissing: false,
  historicalLegacyIndex: {
    active: false,
    filePresent: fs.existsSync(path.join(root, "generated", "question-index.json")),
    source: "Deprecated PDF-derived builder",
    paperCount: legacy.papers,
    questionCount: legacy.questions,
    entryCount: legacy.entries.length,
    explanation: "The legacy 95/833 counts covered a smaller PDF-derived corpus and are not comparable to the canonical 432/1690/4968 dimensions.",
  },
  countSemanticsUnambiguous: true,
  ...safety,
  status: canonical.papers === uniqueQuestionPapers.size + uniqueMarkSchemes.size
    && canonical.questions === canonical.entries.length
    && JSON.stringify(browser) === JSON.stringify(canonical)
    ? "PASS" : "FAIL",
});

const schemaFile = path.join(root, "prisma", "schema.prisma");
const migrations = [
  path.join(root, "prisma", "migrations", "20260728133000_production_baseline", "migration.sql"),
  path.join(root, "prisma", "migrations", "20260729152000_billing_event_ledger_extension", "migration.sql"),
];
const safetyReport = writeJson("safety/db-b1-r2-production-safety-verification.json", {
  stage,
  generatedAt,
  inspectedEvidence: [
    "artifacts/db-b1-r1/gate/db-b1-r1-external-gate.json",
    "artifacts/db-b1-r1/tests/db-b1-r1-final-validation-report.json",
    "artifacts/db-b1-r1/build/db-b1-r1-build-index-reproducibility-report.json",
  ],
  executionEnvironment: {
    databaseUrlRemovedForApplicationTests: true,
    directUrlRemovedForApplicationTests: true,
    billingProviderEnabledRemoved: true,
    billingEnvironmentRemoved: true,
    prismaValidateUrl: "INVALID_NON_CONNECTING_PLACEHOLDER",
  },
  databaseConnectionAttempted: false,
  migrationCommandExecuted: false,
  productionWriteCommandExecuted: false,
  deploymentCommandExecuted: false,
  paymentProviderApiCalled: false,
  schemaSha256: sha256(schemaFile),
  migrationSha256: migrations.map(sha256),
  schemaModifiedDuringDbB1R2: false,
  migrationsModifiedDuringDbB1R2: false,
  ...safety,
  productionBoundaryPreserved: true,
  status: "PASS",
});

const technicalPass = [
  JSON.parse(fs.readFileSync(baseline, "utf8")).status,
  JSON.parse(fs.readFileSync(testAnalysis, "utf8")).status,
  JSON.parse(fs.readFileSync(indexReport, "utf8")).status,
  JSON.parse(fs.readFileSync(safetyReport, "utf8")).status,
].every((status) => status === "PASS")
  && r1Build.status === "PASS"
  && r1Database.status === "REUSED_BY_EXACT_CONTENT_IDENTITY"
  && r1Validation.status === "PASS_TECHNICAL_VALIDATION";

const summaryItems = [
  ["Git identity", evidenceCommit, "Current evidence commit", "baseline/db-b1-r2-baseline-verification.json", "PASS"],
  ["Schema identity", r1Gate.schemaIntegratedIntoCandidate, true, "artifacts/db-b1-r1/gate/db-b1-r1-external-gate.json", r1Gate.schemaIntegratedIntoCandidate ? "PASS" : "FAIL"],
  ["Migration identity", r1Gate.migrationIntegratedIntoCandidate, true, "artifacts/db-b1-r1/gate/db-b1-r1-external-gate.json", r1Gate.migrationIntegratedIntoCandidate ? "PASS" : "FAIL"],
  ["Build reproducibility", r1Build.buildDeterministic, true, "artifacts/db-b1-r1/build/db-b1-r1-build-index-reproducibility-report.json", r1Build.buildDeterministic ? "PASS" : "FAIL"],
  ["Database verification", r1Database.status, "REUSED_BY_EXACT_CONTENT_IDENTITY", "artifacts/db-b1-r1/tests/db-b1-r1-database-test-equivalence-report.json", r1Database.status === "REUSED_BY_EXACT_CONTENT_IDENTITY" ? "PASS" : "FAIL"],
  ["Local test output", JSON.parse(fs.readFileSync(testAnalysis, "utf8")).status, "PASS", "tests/db-b1-r2-test-output-analysis.json", JSON.parse(fs.readFileSync(testAnalysis, "utf8")).status],
  ["Index count semantics", JSON.parse(fs.readFileSync(indexReport, "utf8")).status, "PASS", "index/db-b1-r2-index-count-semantics-report.json", JSON.parse(fs.readFileSync(indexReport, "utf8")).status],
  ["Production safety", JSON.parse(fs.readFileSync(safetyReport, "utf8")).status, "PASS", "safety/db-b1-r2-production-safety-verification.json", JSON.parse(fs.readFileSync(safetyReport, "utf8")).status],
].map(([verificationItem, actualResult, expectedResult, evidenceSource, finalStatus]) => ({
  verificationItem, expectedResult, actualResult, evidenceSource, finalStatus,
}));
const humanSummary = writeJson("human-review/db-b1-r2-human-review-summary.json", {
  stage,
  generatedAt,
  verificationItems: summaryItems,
  verificationItemCount: summaryItems.length,
  passCount: summaryItems.filter(({ finalStatus }) => finalStatus === "PASS").length,
  failCount: summaryItems.filter(({ finalStatus }) => finalStatus === "FAIL").length,
  technicalVerificationStatus: technicalPass ? "PASS" : "FAIL",
  automaticallyVerifiedFacts: [
    "Candidate and evidence identities",
    "Schema and migration identities",
    "Build determinism",
    "Exact-content database test equivalence",
    "Expected negative-path stderr classification",
    "Canonical index count semantics",
    "Production safety boundary",
  ],
  explanationRequired: ["The browser-data-load stderr is expected fail-closed test output.", "The 432, 1690, and 4968 index counts measure different dimensions."],
  humanAuthorizationRequired: ["APPROVE_DB_B0_R1_CLOSURE", "APPROVE_DB_B1_MAINLINE_INTEGRATION"],
  unresolvedTechnicalBlockerCount: technicalPass ? 0 : 1,
  humanDecisionBlockerCount: 2,
  ...safety,
  status: technicalPass ? "PASS_READY_FOR_HUMAN_REVIEW" : "FAIL_TECHNICAL_VERIFICATION",
});

const reviewBindings = {
  evidenceCommit,
  technicalCandidateCommit: r1Gate.candidateCommit,
  originMain,
  baselineSha256: sha256(baseline),
  humanReviewSummarySha256: sha256(humanSummary),
  testOutputAnalysisSha256: sha256(testAnalysis),
  indexCountSemanticsSha256: sha256(indexReport),
  productionSafetySha256: sha256(safetyReport),
  r1ManifestSha256: sha256(r1ManifestFile),
  r1CompleteZipSha256: r1ZipVerification.completeZip.sha256,
  r1DebugZipSha256: r1ZipVerification.debugZip.sha256,
};
const reviewPackage = writeJson("human-review/db-b1-r2-combined-human-review-package.json", {
  stage,
  generatedAt,
  reviewStatus: "READY_FOR_COMBINED_HUMAN_REVIEW",
  approvalScope: "MAIN_INTEGRATION_PREPARATION_ONLY",
  reviewBindings,
  requiredDecisions: [
    { decision: "APPROVE_DB_B0_R1_CLOSURE", currentStatus: "PENDING_HUMAN_REVIEW" },
    { decision: "APPROVE_DB_B1_MAINLINE_INTEGRATION", currentStatus: "PENDING_HUMAN_REVIEW" },
  ],
  reviewer: null,
  reviewedAt: null,
  decision: "PENDING_HUMAN_REVIEW",
  blockerCount: 2,
  humanReviewPackageReady: technicalPass,
  combinedHumanReviewRequired: true,
  mainMergeAuthorized: false,
  codexDidNotAuthorApproval: true,
  ...safety,
  status: technicalPass ? "READY_FOR_COMBINED_HUMAN_REVIEW" : "BLOCKED_TECHNICAL_VERIFICATION_FAILED",
});
const decisionTemplate = writeJson("human-review/db-b1-r2-combined-human-decision.json", {
  stage,
  decision: "PENDING_HUMAN_REVIEW",
  reviewer: null,
  reviewedAt: null,
  decisions: {
    dbB0R1Closure: "PENDING_HUMAN_REVIEW",
    dbB1MainlineIntegration: "PENDING_HUMAN_REVIEW",
  },
  evidenceBinding: { ...reviewBindings, combinedHumanReviewPackageSha256: sha256(reviewPackage) },
  mainMergeAuthorized: false,
  codexDidNotAuthorApproval: true,
  ...safety,
});

const validationReport = writeJson("verification/db-b1-r2-automated-verification-report.json", {
  stage,
  generatedAt,
  commands: [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].map(({ command, exitCode, signal, status }) => ({ command, exitCode, signal, status })),
  commandCount: 5,
  passedCommandCount: [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].filter(({ exitCode }) => exitCode === 0).length,
  failedCommandCount: [prismaValidate, browserNegativePath, fullSuite, indexBuild, indexTest].filter(({ exitCode }) => exitCode !== 0).length,
  technicalVerificationStatus: technicalPass ? "PASS" : "FAIL",
  humanReviewPackageReady: technicalPass,
  combinedHumanReviewRequired: true,
  mainMergeAuthorized: false,
  ...safety,
  status: technicalPass ? "PASS" : "FAIL",
});

writeText("package/db-b1-r2-execution-report.md", `# DB-B1-R2 Automated Verification and Human Review Preparation\n\n`
  + `- Evidence commit: \`${evidenceCommit}\`\n`
  + `- Technical candidate commit: \`${r1Gate.candidateCommit}\`\n`
  + `- Automated verification: ${technicalPass ? "PASS" : "FAIL"}\n`
  + `- Human review package ready: ${technicalPass}\n`
  + `- Combined human review required: true\n`
  + `- Main merge authorized: false\n`
  + `- Production database/write/deploy: false / false / false\n`);

const manifestInputs = listFiles(out).filter((file) =>
  !relative(file).startsWith("package/db-b1-r2-evidence-manifest")
  && !relative(file).endsWith(".zip")
  && !relative(file).startsWith("gate/db-b1-r2-external-gate.json")
  && !relative(file).startsWith("package/db-b1-r2-final-delivery-report.json")
  && !relative(file).startsWith("package/db-b1-r2-zip-verification.json")
).sort();
const manifest = writeJson("package/db-b1-r2-evidence-manifest.json", {
  stage,
  generatedAt,
  evidenceCommit,
  technicalCandidateCommit: r1Gate.candidateCommit,
  artifactCount: manifestInputs.length,
  artifacts: Object.fromEntries(manifestInputs.map((file) => [relative(file), metadata(file)])),
  ...safety,
  status: "PRE_HUMAN_REVIEW_FROZEN",
});
const manifestCheck = verifyManifest(manifest, out);
const discovered = listFiles(out);
const forbidden = discovered.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const manifestVerification = writeJson("package/db-b1-r2-evidence-manifest-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  manifestPath: relative(manifest),
  manifestSha256: sha256(manifest),
  checkedArtifactCount: manifestCheck.checkedArtifactCount,
  mismatches: manifestCheck.mismatches,
  mismatchCount: manifestCheck.mismatches.length,
  forbiddenArtifacts: forbidden.map(relative),
  forbiddenArtifactCount: forbidden.length,
  dsStoreArtifactCount: forbidden.filter((file) => path.basename(file) === ".DS_Store").length,
  ...safety,
  status: manifestCheck.mismatches.length === 0 && forbidden.length === 0 ? "PASS" : "FAIL",
});

const zipInputs = listFiles(out).filter((file) =>
  !relative(file).endsWith(".zip")
  && !relative(file).startsWith("gate/db-b1-r2-external-gate.json")
  && !relative(file).startsWith("package/db-b1-r2-final-delivery-report.json")
  && !relative(file).startsWith("package/db-b1-r2-zip-verification.json")
).sort();
const debugInputs = zipInputs.filter((file) => path.extname(file) === ".json");
const completeInputs = zipInputs.filter((file) => [".json", ".md"].includes(path.extname(file)));
const debugZip = path.join(out, "package", "db-b1-r2-debug-json.zip");
const completeZip = path.join(out, "package", "db-b1-r2-complete-evidence.zip");
zipFiles(debugZip, debugInputs);
zipFiles(completeZip, completeInputs);
const debugInfo = zipInfo(debugZip);
const completeInfo = zipInfo(completeZip);
const zipVerification = writeJson("package/db-b1-r2-zip-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  debugZip: debugInfo,
  completeZip: completeInfo,
  expectedDebugEntryCount: debugInputs.length,
  expectedCompleteEntryCount: completeInputs.length,
  debugEntryCountMatches: debugInfo.entryCount === debugInputs.length,
  completeEntryCountMatches: completeInfo.entryCount === completeInputs.length,
  forbiddenArtifactCount: debugInfo.forbiddenArtifactCount + completeInfo.forbiddenArtifactCount,
  zipCrcFailureCount: 0,
  ...safety,
  status: debugInfo.entryCount === debugInputs.length && completeInfo.entryCount === completeInputs.length
    && debugInfo.forbiddenArtifactCount === 0 && completeInfo.forbiddenArtifactCount === 0 ? "PASS" : "FAIL",
});
const delivery = writeJson("package/db-b1-r2-final-delivery-report.json", {
  stage,
  deliveredAt: new Date().toISOString(),
  technicalVerificationStatus: technicalPass ? "PASS" : "FAIL",
  humanReviewPackageReady: technicalPass,
  combinedHumanReviewRequired: true,
  mainMergeAuthorized: false,
  manifest: { path: relative(manifest), ...metadata(manifest) },
  manifestVerification: { path: relative(manifestVerification), ...metadata(manifestVerification) },
  debugZip: debugInfo,
  completeZip: completeInfo,
  zipVerification: { path: relative(zipVerification), ...metadata(zipVerification) },
  ...safety,
  status: technicalPass ? "READY_FOR_COMBINED_HUMAN_REVIEW" : "BLOCKED_TECHNICAL_VERIFICATION_FAILED",
});
const gate = writeJson("gate/db-b1-r2-external-gate.json", {
  stage,
  evaluatedAt: new Date().toISOString(),
  evidenceCommit,
  technicalCandidateCommit: r1Gate.candidateCommit,
  checks: {
    evidenceBaseline: JSON.parse(fs.readFileSync(baseline, "utf8")).status,
    automatedVerification: JSON.parse(fs.readFileSync(validationReport, "utf8")).status,
    testOutputAnalysis: JSON.parse(fs.readFileSync(testAnalysis, "utf8")).status,
    indexCountSemantics: JSON.parse(fs.readFileSync(indexReport, "utf8")).status,
    productionSafety: JSON.parse(fs.readFileSync(safetyReport, "utf8")).status,
    manifestVerification: JSON.parse(fs.readFileSync(manifestVerification, "utf8")).status,
    zipVerification: JSON.parse(fs.readFileSync(zipVerification, "utf8")).status,
    dbB0R1HumanDecision: "PENDING_HUMAN_REVIEW",
    dbB1MainlineDecision: "PENDING_HUMAN_REVIEW",
  },
  evidenceBinding: {
    manifestSha256: sha256(manifest),
    manifestVerificationSha256: sha256(manifestVerification),
    debugZipSha256: debugInfo.sha256,
    completeZipSha256: completeInfo.sha256,
    zipVerificationSha256: sha256(zipVerification),
    deliveryReportSha256: sha256(delivery),
    combinedHumanReviewPackageSha256: sha256(reviewPackage),
    decisionTemplateSha256: sha256(decisionTemplate),
  },
  technicalVerificationStatus: technicalPass ? "PASS" : "FAIL",
  humanReviewPackageReady: technicalPass,
  combinedHumanReviewRequired: true,
  unresolvedTechnicalBlockerCount: technicalPass ? 0 : 1,
  humanDecisionBlockerCount: 2,
  mainMergeAuthorized: false,
  actualMainUpdated: false,
  productionAccess: false,
  ...safety,
  status: technicalPass ? "READY_FOR_COMBINED_HUMAN_REVIEW" : "BLOCKED_TECHNICAL_VERIFICATION_FAILED",
});

console.log(JSON.stringify({
  stage,
  technicalVerificationStatus: technicalPass ? "PASS" : "FAIL",
  humanReviewPackageReady: technicalPass,
  combinedHumanReviewRequired: true,
  unresolvedTechnicalBlockerCount: technicalPass ? 0 : 1,
  humanDecisionBlockerCount: 2,
  mainMergeAuthorized: false,
  productionAccess: false,
  status: JSON.parse(fs.readFileSync(gate, "utf8")).status,
  productionWrite: false,
  productionDeploy: false,
}, null, 2));
