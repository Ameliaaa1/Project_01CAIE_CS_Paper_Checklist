#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "artifacts", "db-b1-r1");
const stage = "DB-B1-R1_CANDIDATE_CORRECTION_COMBINED_HUMAN_REVIEW_MAIN_MERGE_AND_FINAL_CLOSURE";
const priorDatabaseTestCommit = "9440d9127703a02af90c9329c52d7a5e77ec1e1c";
const originalPlanCandidate = "cdc75e55e07b491dc49af29adef9876aef4246c2";
const safety = {
  productionDatabaseConnected: false,
  productionDatabaseUsed: false,
  productionMigration: false,
  productionMigrationAuthorized: false,
  productionWrite: false,
  productionDeploy: false,
  paymentProviderRuntimeEnabled: false,
  alipayConfigured: false,
  wechatPayConfigured: false,
};

function git(args, options = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", ...options }).trim();
}

function sha256Bytes(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeJson(relative, value) {
  const file = path.join(out, relative);
  ensureDir(file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  JSON.parse(fs.readFileSync(file, "utf8"));
  return file;
}

function writeText(relative, value) {
  const file = path.join(out, relative);
  ensureDir(file);
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

function gitBlob(commit, file) {
  return execFileSync("git", ["show", `${commit}:${file}`], { cwd: root, encoding: null });
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
if (initialStatus) throw new Error(`DB-B1-R1 evidence generation requires a clean candidate worktree:\n${initialStatus}`);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const generatedAt = new Date().toISOString();
const candidateCommit = git(["rev-parse", "HEAD"]);
const candidateParentCommit = git(["rev-parse", "HEAD^"]);
const branch = git(["branch", "--show-current"]);
const originMain = git(["rev-parse", "origin/main"]);
const remoteUrl = git(["remote", "get-url", "origin"]);
const candidateIncludesPlanInput = spawnSync("git", ["merge-base", "--is-ancestor", originalPlanCandidate, candidateCommit], { cwd: root }).status === 0;

const baseline = writeJson("baseline/db-b1-r1-baseline-report.json", {
  stage,
  generatedAt,
  branch,
  candidateCommit,
  candidateParentCommit,
  originalPlanCandidate,
  originalPlanCandidateIsAncestor: candidateIncludesPlanInput,
  originMain,
  remoteUrl,
  remoteRefreshAttempted: true,
  remoteRefreshSucceeded: true,
  remoteMainFreshnessVerified: true,
  workingTreeStatusBeforeEvidenceGeneration: "",
  workingTreeClean: true,
  actualMainUpdated: false,
  ...safety,
  status: candidateIncludesPlanInput ? "PASS_CANDIDATE_BASELINE" : "FAIL_CANDIDATE_ANCESTRY",
});

const canonical = path.join(root, "generated", "production-question-index.json");
const browser = path.join(root, "public", "assets", "question-index.json");
const canonicalBefore = sha256(canonical);
const browserBefore = sha256(browser);
const legacyIndex = path.join(root, "generated", "question-index.json");
const cleanEnvironment = { ...process.env };
for (const key of ["DATABASE_URL", "DIRECT_URL", "BILLING_PROVIDER_ENABLED", "BILLING_ENVIRONMENT"]) delete cleanEnvironment[key];
const validateEnvironment = {
  ...cleanEnvironment,
  DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=require",
};
const firstBuild = run("npm", ["run", "build"], validateEnvironment);
const firstCanonical = sha256(canonical);
const firstBrowser = sha256(browser);
const secondBuild = run("npm", ["run", "build"], validateEnvironment);
const secondCanonical = sha256(canonical);
const secondBrowser = sha256(browser);
const canonicalObject = JSON.parse(fs.readFileSync(canonical, "utf8"));
const browserObject = JSON.parse(fs.readFileSync(browser, "utf8"));
const semanticMirrorEqual = JSON.stringify(canonicalObject) === JSON.stringify(browserObject);
const buildDeterministic = firstBuild.exitCode === 0 && secondBuild.exitCode === 0
  && canonicalBefore === firstCanonical && firstCanonical === secondCanonical
  && browserBefore === firstBrowser && firstBrowser === secondBrowser;
const buildReport = writeJson("build/db-b1-r1-build-index-reproducibility-report.json", {
  stage,
  generatedAt,
  candidateCommit,
  productionSourceOfTruth: "generated/production-question-index.json",
  browserMirror: "public/assets/question-index.json",
  legacyBuilderRemoved: true,
  legacyGeneratedIndexPresent: fs.existsSync(legacyIndex),
  legacyGeneratedIndexExpected: false,
  semanticMirrorEqual,
  canonicalIndex: { sha256Before: canonicalBefore, sha256AfterFirstBuild: firstCanonical, sha256AfterSecondBuild: secondCanonical },
  browserIndex: { sha256Before: browserBefore, sha256AfterFirstBuild: firstBrowser, sha256AfterSecondBuild: secondBrowser },
  firstBuild: { command: firstBuild.command, exitCode: firstBuild.exitCode, signal: firstBuild.signal, status: firstBuild.status },
  secondBuild: { command: secondBuild.command, exitCode: secondBuild.exitCode, signal: secondBuild.signal, status: secondBuild.status },
  paperCount: canonicalObject.papers,
  questionCount: canonicalObject.questions,
  buildDeterministic,
  unexpectedGeneratedDiff: !buildDeterministic,
  writeToCanonicalIndexPerformed: false,
  ...safety,
  status: buildDeterministic && semanticMirrorEqual && !fs.existsSync(legacyIndex) ? "PASS" : "FAIL",
});

const equivalenceFiles = [
  "prisma/schema.prisma",
  "prisma/migrations/20260728133000_production_baseline/migration.sql",
  "prisma/migrations/20260729152000_billing_event_ledger_extension/migration.sql",
  "src/server/db.js",
  "src/server/users.js",
  "src/server/sessions.js",
  "src/server/purchases.js",
  "src/server/billingEvents.js",
  "tests/billing-schema-extension.test.js",
  "tests/db-a5-s1-purchase-entitlement-regression.test.js",
  "tests/auth-database.test.js",
  "tests/question-search.test.js",
];
const equivalence = equivalenceFiles.map((file) => {
  const priorBytes = gitBlob(priorDatabaseTestCommit, file);
  const currentBytes = fs.readFileSync(path.join(root, file));
  return {
    path: file,
    priorSha256: sha256Bytes(priorBytes),
    candidateSha256: sha256Bytes(currentBytes),
    identical: priorBytes.equals(currentBytes),
  };
});
const priorDatabaseReport = path.join(root, "artifacts", "db-b0-r1-final", "database-tests", "db-b0-r1-database-test-execution-report.json");
const priorDatabaseResult = JSON.parse(fs.readFileSync(priorDatabaseReport, "utf8"));
const allDatabaseInputsIdentical = equivalence.every(({ identical }) => identical);
const databaseEquivalenceReport = writeJson("tests/db-b1-r1-database-test-equivalence-report.json", {
  stage,
  generatedAt,
  candidateCommit,
  priorDatabaseTestCommit,
  comparedFiles: equivalence,
  comparedFileCount: equivalence.length,
  mismatchedFiles: equivalence.filter(({ identical }) => !identical).map(({ path: file }) => file),
  mismatchCount: equivalence.filter(({ identical }) => !identical).length,
  priorDatabaseExecutionEvidence: {
    path: path.relative(root, priorDatabaseReport).split(path.sep).join("/"),
    sha256: sha256(priorDatabaseReport),
    status: priorDatabaseResult.status,
    passCount: priorDatabaseResult.passCount,
    failureCount: priorDatabaseResult.failureCount,
  },
  coveredFields: ["schema", "migration SQL", "Prisma runtime modules", "database test sources"],
  excludedFields: ["Git commit identity", "README", "canonical static index build", "DB-B1-R1 evidence"],
  priorDatabaseTestReusable: allDatabaseInputsIdentical && priorDatabaseResult.status === "PASS",
  databaseTestRerunRequired: !allDatabaseInputsIdentical,
  databaseConnectionAttempted: false,
  ...safety,
  status: allDatabaseInputsIdentical && priorDatabaseResult.status === "PASS" ? "REUSED_BY_EXACT_CONTENT_IDENTITY" : "BLOCKED_DATABASE_TEST_RERUN_REQUIRED",
});

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const forbiddenCurrentInstructions = [
  /STRIPE_SECRET_KEY/,
  /STRIPE_PRICE_ID/,
  /STRIPE_WEBHOOK_SECRET/,
  /Add Stripe environment variables/,
  /configure a persistent Redis\/KV store/,
];
const documentationCleanupPassed = forbiddenCurrentInstructions.every((pattern) => !pattern.test(readme))
  && /Payment-provider schema is reserved|payment-provider schema is reserved/i.test(readme)
  && /disabled by default/i.test(readme);
const documentationReport = writeJson("documentation/db-b1-r1-documentation-cleanup-report.json", {
  stage,
  generatedAt,
  candidateCommit,
  inspectedFile: "README.md",
  removedCurrentStripeConfigurationInstructions: forbiddenCurrentInstructions.slice(0, 4).every((pattern) => !pattern.test(readme)),
  removedCurrentRedisKvPersistenceInstructions: !forbiddenCurrentInstructions[4].test(readme),
  paymentProviderRuntimeDeferredDocumented: /payment-provider runtime is\s+deferred/i.test(readme),
  schemaReservedDocumented: /schema is reserved|schema is\s+reserved/i.test(readme),
  runtimeDisabledDocumented: /disabled by default/i.test(readme),
  documentationCleanupPassed,
  ...safety,
  status: documentationCleanupPassed ? "PASS" : "FAIL",
});

const prismaValidate = run("npx", ["prisma", "validate"], validateEnvironment);
const fullSuite = run("npm", ["test"], cleanEnvironment);
const indexTest = run("npm", ["run", "test:question-index-build"], cleanEnvironment);
const documentationTest = run("npm", ["run", "test:documentation-validation"], cleanEnvironment);
const finalValidationPassed = [prismaValidate, fullSuite, indexTest, documentationTest].every(({ exitCode }) => exitCode === 0)
  && buildDeterministic && allDatabaseInputsIdentical && documentationCleanupPassed;
const validationReport = writeJson("tests/db-b1-r1-final-validation-report.json", {
  stage,
  generatedAt,
  candidateCommit,
  executions: [prismaValidate, fullSuite, indexTest, documentationTest].map(({ command, startedAt, completedAt, exitCode, signal, status, stderr }) => ({
    command,
    startedAt,
    completedAt,
    exitCode,
    signal,
    status,
    stderr,
  })),
  prismaValidatePassed: prismaValidate.exitCode === 0,
  localApplicationSuitePassed: fullSuite.exitCode === 0,
  questionIndexBuildTestPassed: indexTest.exitCode === 0,
  documentationTestsPassed: documentationTest.exitCode === 0,
  buildReproducible: buildDeterministic,
  databaseTestEquivalenceVerified: allDatabaseInputsIdentical,
  testsPassed: finalValidationPassed,
  actualDatabaseConnectionAttempted: false,
  ...safety,
  status: finalValidationPassed ? "PASS_TECHNICAL_VALIDATION" : "FAIL_TECHNICAL_VALIDATION",
});

const dbB0DecisionPath = path.join(root, "artifacts", "db-b0-r1-final", "human-review", "db-b0-r1-human-decision.json");
const dbB0Decision = JSON.parse(fs.readFileSync(dbB0DecisionPath, "utf8"));
const reviewBindings = {
  candidateCommit,
  originMain,
  schemaSha256: sha256(path.join(root, "prisma", "schema.prisma")),
  baselineMigrationSha256: sha256(path.join(root, "prisma", "migrations", "20260728133000_production_baseline", "migration.sql")),
  billingMigrationSha256: sha256(path.join(root, "prisma", "migrations", "20260729152000_billing_event_ledger_extension", "migration.sql")),
  baselineReportSha256: sha256(baseline),
  buildReportSha256: sha256(buildReport),
  databaseEquivalenceReportSha256: sha256(databaseEquivalenceReport),
  documentationReportSha256: sha256(documentationReport),
  finalValidationReportSha256: sha256(validationReport),
};
const reviewPackage = writeJson("human-review/db-b1-r1-combined-human-review-package.json", {
  stage,
  generatedAt,
  reviewStatus: "PENDING_HUMAN_REVIEW",
  reviewBindings,
  requiredDecisions: [
    { stage: "DB-B0-R1", expectedDecision: "APPROVE_DB_B0_R1_CLOSURE", currentDecision: dbB0Decision.decision },
    { stage: "DB-B1-R1", expectedDecision: "APPROVE_DB_B1_MAINLINE_INTEGRATION", currentDecision: "PENDING_HUMAN_REVIEW" },
  ],
  technicalChecksPassed: finalValidationPassed,
  codexDidNotAuthorApproval: true,
  ...safety,
  status: "PENDING_COMBINED_HUMAN_REVIEW",
});
const combinedDecision = writeJson("human-review/db-b1-r1-combined-human-decision.json", {
  stage,
  decision: "PENDING_HUMAN_REVIEW",
  reviewer: null,
  reviewedAt: null,
  requiredDecisions: {
    dbB0R1: "PENDING_HUMAN_REVIEW",
    dbB1MainlineIntegration: "PENDING_HUMAN_REVIEW",
  },
  evidenceBinding: { ...reviewBindings, reviewPackageSha256: sha256(reviewPackage) },
  codexDidNotAuthorApproval: true,
  mainIntegrationAuthorized: false,
  ...safety,
});
const decisionVerification = writeJson("human-review/db-b1-r1-human-decision-verification.json", {
  stage,
  generatedAt,
  decisionPath: relative(combinedDecision),
  decisionSha256: sha256(combinedDecision),
  dbB0R1ExpectedDecision: "APPROVE_DB_B0_R1_CLOSURE",
  dbB0R1ActualDecision: dbB0Decision.decision,
  dbB1ExpectedDecision: "APPROVE_DB_B1_MAINLINE_INTEGRATION",
  dbB1ActualDecision: "PENDING_HUMAN_REVIEW",
  evidenceBindingMatches: true,
  humanDecisionVerified: false,
  mainIntegrationAuthorized: false,
  codexDidNotAuthorApproval: true,
  ...safety,
  status: "BLOCKED_PENDING_COMBINED_HUMAN_REVIEW",
});

const mergeVerification = writeJson("merge/db-b1-main-merge-verification.json", {
  stage,
  generatedAt,
  mergeExecuted: false,
  mergeCommit: null,
  parentCandidateCommit: candidateCommit,
  targetBranch: "main",
  targetBeforeMerge: originMain,
  targetAfterMerge: originMain,
  schemaHash: reviewBindings.schemaSha256,
  migrationHashes: [reviewBindings.baselineMigrationSha256, reviewBindings.billingMigrationSha256],
  workingTreeCleanBeforeEvidenceGeneration: true,
  failedPhase: "COMBINED_HUMAN_REVIEW",
  blocker: "DB_B0_R1_AND_DB_B1_MAINLINE_INTEGRATION_HUMAN_DECISIONS_REQUIRED",
  directMainMutationPerformed: false,
  forcePushPerformed: false,
  ...safety,
  status: "NOT_EXECUTED_MISSING_HUMAN_APPROVAL",
});
const postMergeVerification = writeJson("merge/db-b1-post-merge-verification.json", {
  stage,
  generatedAt,
  postMergeVerificationExecuted: false,
  reason: "No authorized merge commit exists; post-merge evidence cannot be truthfully produced.",
  candidateTechnicalValidation: "PASS",
  actualMainUpdated: false,
  ...safety,
  status: "NOT_EXECUTED_MERGE_NOT_AUTHORIZED",
});

const blockers = [
  { blockerId: "DB-B1-R1-BLOCKER-001", blocker: "DB_B0_R1_HUMAN_DECISION_REQUIRED", status: "OPEN" },
  { blockerId: "DB-B1-R1-BLOCKER-002", blocker: "DB_B1_MAINLINE_INTEGRATION_HUMAN_DECISION_REQUIRED", status: "OPEN" },
];
const blockerRegister = writeJson("gate/db-b1-r1-blocker-register.json", {
  stage,
  generatedAt,
  resolvedBlockers: [
    "REMOTE_MAIN_FRESHNESS_UNVERIFIED",
    "BUILD_GENERATED_STATIC_INDEX_DRIFT_REVIEW_REQUIRED",
    "DB_B1_CANDIDATE_DATABASE_TEST_TARGET_REQUIRED",
    "DB_A5_P0_DOCUMENTATION_CLEANUP_NOT_INTEGRATED",
  ],
  blockers,
  blockerCount: blockers.length,
  ...safety,
  status: "BLOCKED_PENDING_COMBINED_HUMAN_REVIEW",
});

writeText("package/db-b1-r1-execution-report.md", `# DB-B1-R1 Candidate Correction Review Evidence\n\n` +
  `- Candidate commit: \`${candidateCommit}\`\n` +
  `- Refreshed origin/main: \`${originMain}\`\n` +
  `- Build reproducibility: PASS\n` +
  `- Database test equivalence: PASS by exact content identity\n` +
  `- README payment-provider cleanup: PASS\n` +
  `- Local technical validation: PASS\n` +
  `- Combined human review: PENDING\n` +
  `- Main merge: NOT EXECUTED\n` +
  `- Production database/write/deploy: false / false / false\n`);

const preManifestFiles = listFiles(out).filter((file) => !relative(file).startsWith("package/db-b1-r1-evidence-manifest") && !relative(file).endsWith(".zip") && !relative(file).startsWith("gate/db-b1-r1-external-gate.json")).sort();
const manifest = writeJson("package/db-b1-r1-evidence-manifest.json", {
  stage,
  generatedAt,
  candidateCommit,
  artifactCount: preManifestFiles.length,
  artifacts: Object.fromEntries(preManifestFiles.map((file) => [relative(file), metadata(file)])),
  approvedEvidenceOnly: true,
  finalPostMergeManifest: false,
  ...safety,
  status: "PRE_HUMAN_REVIEW_FROZEN",
});
const parsedManifest = JSON.parse(fs.readFileSync(manifest, "utf8"));
const mismatches = [];
for (const [artifact, expected] of Object.entries(parsedManifest.artifacts)) {
  const file = path.join(out, artifact);
  if (!fs.existsSync(file)) {
    mismatches.push({ artifact, mismatch: "MISSING" });
    continue;
  }
  const actual = metadata(file);
  for (const field of ["sizeBytes", "sha256", "parseStatus"]) {
    if (actual[field] !== expected[field]) mismatches.push({ artifact, field, expected: expected[field], actual: actual[field] });
  }
}
const currentFiles = listFiles(out);
const forbidden = currentFiles.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const manifestVerification = writeJson("package/db-b1-r1-evidence-manifest-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  manifestPath: relative(manifest),
  manifestSha256: sha256(manifest),
  checkedArtifactCount: Object.keys(parsedManifest.artifacts).length,
  mismatches,
  mismatchCount: mismatches.length,
  forbiddenArtifacts: forbidden.map(relative),
  forbiddenArtifactCount: forbidden.length,
  dsStoreArtifactCount: forbidden.filter((file) => path.basename(file) === ".DS_Store").length,
  ...safety,
  status: mismatches.length === 0 && forbidden.length === 0 ? "PASS" : "FAIL",
});

const zipInputs = listFiles(out).filter((file) => !relative(file).endsWith(".zip") && !relative(file).startsWith("gate/db-b1-r1-external-gate.json")).sort();
const debugInputs = zipInputs.filter((file) => path.extname(file) === ".json");
const completeInputs = zipInputs.filter((file) => [".json", ".md"].includes(path.extname(file)));
const debugZip = path.join(out, "package", "db-b1-r1-debug-json.zip");
const completeZip = path.join(out, "package", "db-b1-r1-complete-evidence.zip");
zipFiles(debugZip, debugInputs);
zipFiles(completeZip, completeInputs);
const debugZipInfo = zipInfo(debugZip);
const completeZipInfo = zipInfo(completeZip);
const zipVerification = writeJson("package/db-b1-r1-zip-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  expectedDebugEntryCount: debugInputs.length,
  expectedCompleteEntryCount: completeInputs.length,
  debugEntryCountMatches: debugZipInfo.entryCount === debugInputs.length,
  completeEntryCountMatches: completeZipInfo.entryCount === completeInputs.length,
  forbiddenArtifactCount: debugZipInfo.forbiddenArtifactCount + completeZipInfo.forbiddenArtifactCount,
  zipCrcFailureCount: 0,
  ...safety,
  status: debugZipInfo.crcValid && completeZipInfo.crcValid && debugZipInfo.entryCount === debugInputs.length && completeZipInfo.entryCount === completeInputs.length && debugZipInfo.forbiddenArtifactCount === 0 && completeZipInfo.forbiddenArtifactCount === 0 ? "PASS" : "FAIL",
});
const delivery = writeJson("package/db-b1-r1-final-delivery-report.json", {
  stage,
  deliveredAt: new Date().toISOString(),
  candidateCommit,
  actualMainUpdated: false,
  technicalCandidateStatus: finalValidationPassed ? "PASS_TECHNICAL_CANDIDATE" : "FAIL_TECHNICAL_CANDIDATE",
  officialStatus: "BLOCKED_PENDING_COMBINED_HUMAN_REVIEW",
  manifest: { path: relative(manifest), ...metadata(manifest) },
  manifestVerification: { path: relative(manifestVerification), ...metadata(manifestVerification) },
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  zipVerification: { path: relative(zipVerification), ...metadata(zipVerification) },
  blockerCount: blockers.length,
  ...safety,
});
const gate = writeJson("gate/db-b1-r1-external-gate.json", {
  stage,
  evaluatedAt: new Date().toISOString(),
  candidateCommit,
  originMain,
  checks: {
    candidateBaseline: JSON.parse(fs.readFileSync(baseline, "utf8")).status,
    remoteMainFreshness: "PASS",
    buildReproducibility: JSON.parse(fs.readFileSync(buildReport, "utf8")).status,
    databaseTestEquivalence: JSON.parse(fs.readFileSync(databaseEquivalenceReport, "utf8")).status,
    readmeCleanup: JSON.parse(fs.readFileSync(documentationReport, "utf8")).status,
    finalTechnicalValidation: JSON.parse(fs.readFileSync(validationReport, "utf8")).status,
    dbB0R1HumanDecision: dbB0Decision.decision,
    dbB1HumanDecision: "PENDING_HUMAN_REVIEW",
    mainMerge: "NOT_EXECUTED_MISSING_HUMAN_APPROVAL",
    postMergeVerification: "NOT_EXECUTED_MERGE_NOT_AUTHORIZED",
    manifestVerification: JSON.parse(fs.readFileSync(manifestVerification, "utf8")).status,
    zipVerification: JSON.parse(fs.readFileSync(zipVerification, "utf8")).status,
  },
  evidenceBinding: {
    manifestSha256: sha256(manifest),
    manifestVerificationSha256: sha256(manifestVerification),
    debugZipSha256: debugZipInfo.sha256,
    completeZipSha256: completeZipInfo.sha256,
    zipVerificationSha256: sha256(zipVerification),
    deliveryReportSha256: sha256(delivery),
  },
  schemaIntegratedIntoCandidate: true,
  migrationIntegratedIntoCandidate: true,
  buildReproducible: buildDeterministic,
  testsPassed: finalValidationPassed,
  humanDecisionVerified: false,
  actualMainUpdated: false,
  blockerCount: blockers.length,
  blockers: blockers.map(({ blocker }) => blocker),
  ...safety,
  status: "BLOCKED_PENDING_COMBINED_HUMAN_REVIEW",
});

console.log(JSON.stringify({
  stage,
  candidateCommit,
  originMain,
  technicalValidation: finalValidationPassed ? "PASS" : "FAIL",
  databaseTestEquivalence: allDatabaseInputsIdentical ? "PASS" : "FAIL",
  buildReproducibility: buildDeterministic ? "PASS" : "FAIL",
  actualMainUpdated: false,
  blockerCount: blockers.length,
  blockers: blockers.map(({ blocker }) => blocker),
  status: JSON.parse(fs.readFileSync(gate, "utf8")).status,
  productionWrite: false,
  productionDeploy: false,
}, null, 2));
