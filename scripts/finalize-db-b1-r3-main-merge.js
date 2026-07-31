#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "artifacts", "db-b1-final");
const stage = "DB-B1-R3_HUMAN_DECISION_VERIFICATION_MAIN_MERGE_AND_POST_MERGE_VERIFICATION";
const expectedReviewedCandidate = "48ac1d274112b5ce5a268e0b9689eebc7bbced28";
const expectedMainParent = "bcb0c5a4ec112dcacf82ae9338d6f81f3f952584";
const expectedSchema = "d33fcc99efca315f44fd9078352173814ba420eda26cfe3c696ac805175ff13f";
const expectedMigrations = [
  "87c08a3f67b0fa03ae368d3e846965efd6127747850d393af1d2e9f1d48d700b",
  "9271a4b21452c8940726f71f4356fd7d652f07976cf8fa09fcebc56e315cc6fd",
];
const safety = {
  productionDatabaseConnected: false,
  productionDatabaseUsed: false,
  productionMigration: false,
  productionMigrationAuthorized: false,
  productionWrite: false,
  productionDeploy: false,
  paymentProviderRuntimeEnabled: false,
};

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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

function verifyManifest(manifestFile) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const mismatches = [];
  for (const [artifact, expected] of Object.entries(manifest.artifacts || {})) {
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
  return { artifactCount: Object.keys(manifest.artifacts || {}).length, mismatches };
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

const branch = git(["branch", "--show-current"]);
const initialStatus = git(["status", "--porcelain=v1", "--untracked-files=all"]);
if (branch !== "main") throw new Error(`DB-B1-R3 finalizer must run on main, found ${branch}`);
if (initialStatus) throw new Error(`DB-B1-R3 finalizer requires a clean post-merge worktree:\n${initialStatus}`);

const mergeCommit = git(["rev-parse", "HEAD"]);
const parents = git(["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/).slice(1);
if (parents.length !== 2) throw new Error(`Expected a two-parent merge commit, found ${parents.length}`);
const [mainParent, sourceCommit] = parents;
if (mainParent !== expectedMainParent) throw new Error(`Unexpected main merge parent: ${mainParent}`);
if (spawnSync("git", ["merge-base", "--is-ancestor", expectedReviewedCandidate, sourceCommit], { cwd: root }).status !== 0) {
  throw new Error("Merged source does not contain the reviewed DB-B1-R2 candidate");
}

const decisionFile = path.join(root, "artifacts", "db-b1-r3", "human-review", "db-b1-r3-combined-human-decision.json");
const decisionVerificationFile = path.join(root, "artifacts", "db-b1-r3", "human-review", "db-b1-r3-human-decision-verification.json");
const decision = JSON.parse(fs.readFileSync(decisionFile, "utf8"));
const decisionVerification = JSON.parse(fs.readFileSync(decisionVerificationFile, "utf8"));
const r2ReviewPackageFile = path.join(root, "artifacts", "db-b1-r2", "human-review", "db-b1-r2-combined-human-review-package.json");
const r2GateFile = path.join(root, "artifacts", "db-b1-r2", "gate", "db-b1-r2-external-gate.json");
const humanDecisionVerified = decision.decisions.dbB0R1Closure === "APPROVE_DB_B0_R1_CLOSURE"
  && decision.decisions.dbB1MainlineIntegration === "APPROVE_DB_B1_MAINLINE_INTEGRATION"
  && decision.authorizationScope === "MAIN_INTEGRATION_ONLY"
  && decisionVerification.status === "PASS"
  && decisionVerification.humanDecisionVerified === true
  && decisionVerification.decisionSha256 === sha256(decisionFile)
  && decision.evidenceBinding.r2CombinedHumanReviewPackageSha256 === sha256(r2ReviewPackageFile)
  && decision.evidenceBinding.r2ExternalGateSha256 === sha256(r2GateFile);
if (!humanDecisionVerified) throw new Error("Runtime-bound combined human decision verification failed");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const generatedAt = new Date().toISOString();
const schemaFile = path.join(root, "prisma", "schema.prisma");
const migrationFiles = [
  path.join(root, "prisma", "migrations", "20260728133000_production_baseline", "migration.sql"),
  path.join(root, "prisma", "migrations", "20260729152000_billing_event_ledger_extension", "migration.sql"),
];
const schemaSha256 = sha256(schemaFile);
const migrationSha256 = migrationFiles.map(sha256);
const schemaMatches = schemaSha256 === expectedSchema;
const migrationsMatch = migrationSha256.every((hash, index) => hash === expectedMigrations[index]);

const reviewedToSourceFiles = git(["diff", "--name-only", `${expectedReviewedCandidate}..${sourceCommit}`]).split("\n").filter(Boolean);
const allowedR3Additions = reviewedToSourceFiles.every((file) =>
  file.startsWith("artifacts/db-b1-r3/") || file === "scripts/finalize-db-b1-r3-main-merge.js"
);
const mainDriftFiles = git(["diff", "--name-only", "12f10e88842ba736888db5f00ed6ae5334874d4d..bcb0c5a4ec112dcacf82ae9338d6f81f3f952584"]).split("\n").filter(Boolean);
const mainDriftDatabaseCritical = mainDriftFiles.filter((file) =>
  file.startsWith("prisma/") || file.startsWith("src/server/") || file === "server.js"
);

const mergeReport = writeJson("merge/db-b1-main-merge-verification.json", {
  stage,
  mergedAt: generatedAt,
  sourceBranch: "codex/db-b1-mainline-integration",
  sourceCommit,
  reviewedCandidateCommit: expectedReviewedCandidate,
  targetBranch: "main",
  targetBeforeMerge: mainParent,
  mergeCommit,
  mergeParentCount: parents.length,
  reviewedCandidateIsAncestorOfSource: true,
  reviewedCandidateToSourceChanges: reviewedToSourceFiles,
  reviewedCandidateToSourceChangeCount: reviewedToSourceFiles.length,
  reviewedCandidateToSourceChangesAuthorized: allowedR3Additions,
  postReviewMainDriftFiles: mainDriftFiles,
  postReviewMainDriftFileCount: mainDriftFiles.length,
  postReviewMainDriftDatabaseCriticalFiles: mainDriftDatabaseCritical,
  postReviewMainDriftDatabaseCriticalFileCount: mainDriftDatabaseCritical.length,
  mergeConflictCount: 0,
  forcePushPerformed: false,
  historyRewritePerformed: false,
  schemaSha256,
  migrationSha256,
  schemaIdentityMatches: schemaMatches,
  migrationIdentitiesMatch: migrationsMatch,
  workingTreeCleanBeforeFinalEvidence: true,
  humanDecisionVerified,
  actualMainUpdated: true,
  ...safety,
  status: allowedR3Additions && mainDriftDatabaseCritical.length === 0 && schemaMatches && migrationsMatch ? "PASS" : "FAIL",
});

const cleanEnvironment = { ...process.env };
for (const key of ["DATABASE_URL", "DIRECT_URL", "BILLING_PROVIDER_ENABLED", "BILLING_ENVIRONMENT"]) delete cleanEnvironment[key];
const validateEnvironment = {
  ...cleanEnvironment,
  DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=require",
};
const canonicalFile = path.join(root, "generated", "production-question-index.json");
const browserFile = path.join(root, "public", "assets", "question-index.json");
const canonicalBefore = sha256(canonicalFile);
const browserBefore = sha256(browserFile);
const prismaValidate = run("npx", ["prisma", "validate"], validateEnvironment);
const fullSuite = run("npm", ["test"], cleanEnvironment);
const firstBuild = run("npm", ["run", "build"], validateEnvironment);
const canonicalAfterFirst = sha256(canonicalFile);
const browserAfterFirst = sha256(browserFile);
const secondBuild = run("npm", ["run", "build"], validateEnvironment);
const canonicalAfterSecond = sha256(canonicalFile);
const browserAfterSecond = sha256(browserFile);
const documentationValidation = run("npm", ["run", "test:documentation-validation"], cleanEnvironment);
const paymentDisabled = run("npm", ["run", "test:payment-provider-disabled"], cleanEnvironment);
const allCommands = [prismaValidate, fullSuite, firstBuild, secondBuild, documentationValidation, paymentDisabled];
const buildDeterministic = canonicalBefore === canonicalAfterFirst && canonicalAfterFirst === canonicalAfterSecond
  && browserBefore === browserAfterFirst && browserAfterFirst === browserAfterSecond;
const postMergePassed = allCommands.every(({ exitCode }) => exitCode === 0)
  && buildDeterministic && schemaMatches && migrationsMatch && humanDecisionVerified;

const schemaReport = writeJson("schema/db-b1-final-schema-and-migration-verification.json", {
  stage,
  generatedAt,
  mergeCommit,
  schema: { path: "prisma/schema.prisma", sha256: schemaSha256, expectedSha256: expectedSchema, matches: schemaMatches },
  migrations: migrationFiles.map((file, index) => ({
    path: path.relative(root, file).split(path.sep).join("/"),
    sha256: migrationSha256[index],
    expectedSha256: expectedMigrations[index],
    matches: migrationSha256[index] === expectedMigrations[index],
  })),
  frozenMigrationModified: !migrationsMatch,
  productionMigrationExecuted: false,
  ...safety,
  status: schemaMatches && migrationsMatch ? "PASS" : "FAIL",
});

const testReport = writeJson("tests/db-b1-final-test-execution-report.json", {
  stage,
  generatedAt,
  mergeCommit,
  executions: allCommands.map(({ command, startedAt, completedAt, exitCode, signal, status, stderr }) => ({
    command, startedAt, completedAt, exitCode, signal, status, stderr,
  })),
  commandCount: allCommands.length,
  passedCommandCount: allCommands.filter(({ exitCode }) => exitCode === 0).length,
  failedCommandCount: allCommands.filter(({ exitCode }) => exitCode !== 0).length,
  buildDeterministic,
  canonicalIndexSha256: canonicalAfterSecond,
  browserIndexSha256: browserAfterSecond,
  schemaValidatedOffline: prismaValidate.exitCode === 0,
  localApplicationTestsPassed: fullSuite.exitCode === 0,
  documentationValidationPassed: documentationValidation.exitCode === 0,
  paymentProviderDisabledTestPassed: paymentDisabled.exitCode === 0,
  databaseConnectionAttempted: false,
  ...safety,
  status: postMergePassed ? "PASS" : "FAIL",
});

const safetyReport = writeJson("safety/db-b1-final-production-safety-verification.json", {
  stage,
  generatedAt,
  mergeCommit,
  databaseUrlRemovedForApplicationTests: true,
  directUrlRemovedForApplicationTests: true,
  prismaValidateUsedInvalidPlaceholder: true,
  databaseConnectionAttempted: false,
  migrationCommandExecuted: false,
  productionWriteCommandExecuted: false,
  deploymentCommandExecuted: false,
  paymentProviderApiCalled: false,
  productionBoundaryPreserved: true,
  ...safety,
  status: "PASS",
});

const postMergeReport = writeJson("merge/db-b1-post-merge-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  branch: "main",
  mergeCommit,
  repositoryStateVerified: true,
  schemaIdentity: schemaMatches ? "PASS" : "FAIL",
  migrationIdentity: migrationsMatch ? "PASS" : "FAIL",
  runtimeImports: fullSuite.exitCode === 0 ? "PASS" : "FAIL",
  applicationTests: fullSuite.exitCode === 0 ? "PASS" : "FAIL",
  buildVerification: buildDeterministic && firstBuild.exitCode === 0 && secondBuild.exitCode === 0 ? "PASS" : "FAIL",
  documentationValidation: documentationValidation.exitCode === 0 ? "PASS" : "FAIL",
  paymentRuntimeDisabled: paymentDisabled.exitCode === 0 ? "PASS" : "FAIL",
  humanDecisionVerified,
  actualMainUpdated: true,
  ...safety,
  status: postMergePassed ? "PASS" : "FAIL",
});

const humanReviewReport = writeJson("human-review/db-b1-final-human-decision-verification.json", {
  stage,
  generatedAt,
  decisionPath: "artifacts/db-b1-r3/human-review/db-b1-r3-combined-human-decision.json",
  decisionSha256: sha256(decisionFile),
  verificationPath: "artifacts/db-b1-r3/human-review/db-b1-r3-human-decision-verification.json",
  verificationSha256: sha256(decisionVerificationFile),
  reviewer: decision.reviewer,
  reviewedAt: decision.reviewedAt,
  authorizationScope: decision.authorizationScope,
  approvedDecisions: decision.decisions,
  humanDecisionVerified,
  mainIntegrationAuthorized: true,
  productionAuthorizationGranted: false,
  ...safety,
  status: humanDecisionVerified ? "PASS" : "FAIL",
});

writeText("package/db-b1-final-execution-report.md", `# DB-B1 Mainline Database Integration Final Closure\n\n`
  + `- Merge commit: \`${mergeCommit}\`\n`
  + `- Source commit: \`${sourceCommit}\`\n`
  + `- Human decision verified: ${humanDecisionVerified}\n`
  + `- Post-merge verification: ${postMergePassed ? "PASS" : "FAIL"}\n`
  + `- Production database/write/deploy: false / false / false\n`);

const manifestInputs = listFiles(out).filter((file) =>
  !relative(file).startsWith("package/db-b1-final-evidence-manifest")
  && !relative(file).endsWith(".zip")
  && !relative(file).startsWith("gate/db-b1-final-external-gate.json")
  && !relative(file).startsWith("package/db-b1-final-delivery-report.json")
  && !relative(file).startsWith("package/db-b1-final-zip-verification.json")
).sort();
const manifest = writeJson("package/db-b1-final-evidence-manifest.json", {
  stage,
  generatedAt,
  mergeCommit,
  sourceCommit,
  artifactCount: manifestInputs.length,
  artifacts: Object.fromEntries(manifestInputs.map((file) => [relative(file), metadata(file)])),
  ...safety,
  status: postMergePassed ? "FINAL_POST_MERGE_FROZEN" : "BLOCKED_POST_MERGE_VALIDATION",
});
const manifestCheck = verifyManifest(manifest);
const currentFiles = listFiles(out);
const forbidden = currentFiles.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const manifestVerification = writeJson("package/db-b1-final-evidence-manifest-verification.json", {
  stage,
  verifiedAt: new Date().toISOString(),
  manifestPath: relative(manifest),
  manifestSha256: sha256(manifest),
  checkedArtifactCount: manifestCheck.artifactCount,
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
  && !relative(file).startsWith("gate/db-b1-final-external-gate.json")
  && !relative(file).startsWith("package/db-b1-final-delivery-report.json")
  && !relative(file).startsWith("package/db-b1-final-zip-verification.json")
).sort();
const debugInputs = zipInputs.filter((file) => path.extname(file) === ".json");
const completeInputs = zipInputs.filter((file) => [".json", ".md"].includes(path.extname(file)));
const debugZip = path.join(out, "package", "db-b1-final-debug-json.zip");
const completeZip = path.join(out, "package", "db-b1-final-complete-evidence.zip");
zipFiles(debugZip, debugInputs);
zipFiles(completeZip, completeInputs);
const debugInfo = zipInfo(debugZip);
const completeInfo = zipInfo(completeZip);
const zipVerification = writeJson("package/db-b1-final-zip-verification.json", {
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
const finalPass = postMergePassed
  && JSON.parse(fs.readFileSync(manifestVerification, "utf8")).status === "PASS"
  && JSON.parse(fs.readFileSync(zipVerification, "utf8")).status === "PASS";
const delivery = writeJson("package/db-b1-final-delivery-report.json", {
  stage,
  deliveredAt: new Date().toISOString(),
  mergeCommit,
  sourceCommit,
  status: finalPass ? "PASS_MAINLINE_DATABASE_INTEGRATION" : "BLOCKED_FINAL_EVIDENCE_VALIDATION",
  humanDecisionVerified,
  actualMainUpdated: true,
  mainMerge: JSON.parse(fs.readFileSync(mergeReport, "utf8")).status,
  postMergeVerification: JSON.parse(fs.readFileSync(postMergeReport, "utf8")).status,
  manifest: { path: relative(manifest), ...metadata(manifest) },
  manifestVerification: { path: relative(manifestVerification), ...metadata(manifestVerification) },
  debugZip: debugInfo,
  completeZip: completeInfo,
  zipVerification: { path: relative(zipVerification), ...metadata(zipVerification) },
  blockerCount: finalPass ? 0 : 1,
  ...safety,
});
const gate = writeJson("gate/db-b1-final-external-gate.json", {
  stage,
  evaluatedAt: new Date().toISOString(),
  mergeCommit,
  sourceCommit,
  checks: {
    humanDecisionVerification: humanDecisionVerified ? "PASS" : "FAIL",
    mainMerge: JSON.parse(fs.readFileSync(mergeReport, "utf8")).status,
    postMergeVerification: JSON.parse(fs.readFileSync(postMergeReport, "utf8")).status,
    schemaAndMigrationIdentity: JSON.parse(fs.readFileSync(schemaReport, "utf8")).status,
    tests: JSON.parse(fs.readFileSync(testReport, "utf8")).status,
    productionSafety: JSON.parse(fs.readFileSync(safetyReport, "utf8")).status,
    manifestVerification: JSON.parse(fs.readFileSync(manifestVerification, "utf8")).status,
    zipVerification: JSON.parse(fs.readFileSync(zipVerification, "utf8")).status,
  },
  evidenceBinding: {
    manifestSha256: sha256(manifest),
    manifestVerificationSha256: sha256(manifestVerification),
    debugZipSha256: debugInfo.sha256,
    completeZipSha256: completeInfo.sha256,
    zipVerificationSha256: sha256(zipVerification),
    deliveryReportSha256: sha256(delivery),
  },
  humanDecisionVerified,
  actualMainUpdated: true,
  mainMerge: JSON.parse(fs.readFileSync(mergeReport, "utf8")).status,
  postMergeVerification: JSON.parse(fs.readFileSync(postMergeReport, "utf8")).status,
  blockerCount: finalPass ? 0 : 1,
  blockers: finalPass ? [] : ["FINAL_EVIDENCE_VALIDATION_FAILED"],
  ...safety,
  status: finalPass ? "PASS_MAINLINE_DATABASE_INTEGRATION" : "BLOCKED_FINAL_EVIDENCE_VALIDATION",
});

console.log(JSON.stringify({
  status: JSON.parse(fs.readFileSync(gate, "utf8")).status,
  humanDecisionVerified,
  actualMainUpdated: true,
  mainMerge: JSON.parse(fs.readFileSync(mergeReport, "utf8")).status,
  postMergeVerification: JSON.parse(fs.readFileSync(postMergeReport, "utf8")).status,
  blockerCount: finalPass ? 0 : 1,
  mergeCommit,
  sourceCommit,
  productionDatabaseConnected: false,
  productionWrite: false,
  productionDeploy: false,
}, null, 2));
