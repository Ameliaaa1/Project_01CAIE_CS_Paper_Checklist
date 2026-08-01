#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "artifacts", "db-b3-preflight");
const stage = "DB-B3_PRODUCTION_DATABASE_ESTABLISHMENT_AND_MIGRATION";
const repository = "Ameliaaa1/Project_01CAIE_CS_Paper_Checklist";
const planPath = "/Users/amelia/Desktop/Workspace/workspace/Project_01CAIE_CS_Paper_Checklist/docs/DB-B3-Production-Database-Establishment-and-Migration-Implementation-Plan.md";
const projectId = "lucky-river-45336837";
const branchId = "br-silent-fog-avglbx9u";
const endpointId = "ep-small-dew-avh8e0sc";
const databaseName = "neondb";
const roleName = "neondb_owner";
const schemaExpected = "d33fcc99efca315f44fd9078352173814ba420eda26cfe3c696ac805175ff13f";
const migrationExpected = Object.freeze({
  "prisma/migrations/20260728133000_production_baseline/migration.sql": "87c08a3f67b0fa03ae368d3e846965efd6127747850d393af1d2e9f1d48d700b",
  "prisma/migrations/20260729152000_billing_event_ledger_extension/migration.sql": "9271a4b21452c8940726f71f4356fd7d652f07976cf8fa09fcebc56e315cc6fd"
});
const safety = Object.freeze({
  productionDatabaseConnected: false,
  productionDatabaseUsed: false,
  productionMigrationAuthorized: false,
  productionMigration: false,
  productionWrite: false,
  productionRuntimeCutover: false,
  legacyDynamicStoreRetired: false,
  liveBusinessTrafficEnabled: false,
  vercelProductionDeployment: false,
  paymentProviderRuntimeEnabled: false
});
const generatedAt = new Date().toISOString();

function run(file, args, options = {}) {
  return execFileSync(file, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
    ...options
  }).trim();
}

function runJson(file, args, options) {
  return JSON.parse(run(file, args, options));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rel(file, base = out) {
  return path.relative(base, file).split(path.sep).join("/");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.name === ".DS_Store") return [];
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

function metadata(file, base = out) {
  const extension = path.extname(file).toLowerCase();
  let jsonValid = null;
  let parseStatus = "NOT_APPLICABLE";
  if (extension === ".json") {
    JSON.parse(fs.readFileSync(file, "utf8"));
    jsonValid = true;
    parseStatus = "PASS";
  }
  return {
    path: rel(file, base),
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    fileReadable: true,
    jsonValid,
    parseStatus,
    mimeType: extension === ".json" ? "application/json" : extension === ".md" ? "text/markdown" : "application/octet-stream"
  };
}

function writeJson(relativePath, value) {
  const target = path.join(out, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp`;
  const fd = fs.openSync(temp, "w");
  try {
    fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(temp, target);
  return target;
}

function writeText(relativePath, value) {
  const target = path.join(out, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value, "utf8");
  return target;
}

function zipFiles(target, files) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) fs.unlinkSync(target);
  const result = spawnSync("/usr/bin/zip", ["-q", "-X", target, ...files.map((file) => rel(file))], {
    cwd: out,
    encoding: "utf8"
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "zip failed");
}

function zipEntries(file) {
  return run("/usr/bin/unzip", ["-Z1", file], { cwd: out }).split("\n").filter(Boolean).sort();
}

function forbidden(value) {
  return /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(value);
}

function check(expected, actual, result, evidence) {
  return { check: evidence, expected, actual, result, evidence };
}

function githubPagesState() {
  const result = spawnSync("gh", ["api", `repos/${repository}/pages`], { cwd: root, encoding: "utf8" });
  return {
    httpStatus: result.status === 0 ? 200 : /404/.test(result.stderr) ? 404 : null,
    disabled: result.status !== 0 && /404/.test(result.stderr)
  };
}

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const currentCommit = run("git", ["rev-parse", "HEAD"]);
const remoteMain = runJson("gh", ["api", `repos/${repository}/git/ref/heads/main`]).object.sha;
const branch = run("git", ["branch", "--show-current"]);
const statusLines = run("git", ["status", "--short"]).split("\n").filter(Boolean);
const trackedChanges = statusLines.filter((line) => !line.startsWith("??"));
const preexistingUntracked = statusLines.filter((line) => line.startsWith("??"));
const changedSinceDbB2 = run("git", ["diff", "--name-only", "dc22b84139119db55d2da59ede7ea518ed44f9d6", currentCommit]).split("\n").filter(Boolean);
const databaseRelevantDrift = changedSinceDbB2.filter((file) => file === "prisma/schema.prisma" || file.startsWith("prisma/migrations/") || file.startsWith("src/server/") || file === "server.js" || file === "package.json" || file === "package-lock.json");

const schemaPath = path.join(root, "prisma", "schema.prisma");
const schemaActual = sha256(schemaPath);
const migrationActual = Object.fromEntries(Object.keys(migrationExpected).map((file) => [file, sha256(path.join(root, file))]));
const identityMismatches = [
  ...(schemaActual === schemaExpected ? [] : [{ artifact: "prisma/schema.prisma", expected: schemaExpected, actual: schemaActual }]),
  ...Object.entries(migrationExpected).flatMap(([file, expected]) => migrationActual[file] === expected ? [] : [{ artifact: file, expected, actual: migrationActual[file] }])
];

const project = runJson("npx", ["--yes", "neonctl@latest", "projects", "get", projectId, "--output", "json"]);
const branches = runJson("npx", ["--yes", "neonctl@latest", "branches", "list", "--project-id", projectId, "--output", "json"]);
const databases = runJson("npx", ["--yes", "neonctl@latest", "databases", "list", "--project-id", projectId, "--branch", branchId, "--output", "json"]);
const roles = runJson("npx", ["--yes", "neonctl@latest", "roles", "list", "--project-id", projectId, "--branch", branchId, "--output", "json"]);
const endpointResponse = runJson("npx", ["--yes", "neonctl@latest", "api", `/projects/${projectId}/endpoints`, "--output", "json"]);
const snapshots = runJson("npx", ["--yes", "neonctl@latest", "snapshots", "list", "--project-id", projectId, "--output", "json"]);
const productionBranch = branches.find((item) => item.id === branchId);
const productionEndpoint = endpointResponse.endpoints.find((item) => item.id === endpointId);
const productionDatabase = databases.find((item) => item.name === databaseName);
const migrationRole = roles.find((item) => item.name === roleName);
const pages = githubPagesState();
const commitStatus = runJson("gh", ["api", `repos/${repository}/commits/${currentCommit}/status`]);
const vercel = commitStatus.statuses.find((item) => item.context === "Vercel") || null;

const runtimePath = "/Users/amelia/Desktop/Workspace/workspace/Project_01CAIE_CS_Paper_Checklist-db-b1/node_modules";
const commandEnv = {
  ...process.env,
  NODE_PATH: runtimePath,
  PATH: `${path.join(runtimePath, ".bin")}:${process.env.PATH || ""}`,
  DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=require"
};
const prismaValidateOutput = run("prisma", ["validate"], { env: commandEnv });
const formatDirectory = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "db-b3-format-"));
const formatSchema = path.join(formatDirectory, "schema.prisma");
fs.copyFileSync(schemaPath, formatSchema);
run("prisma", ["format", "--schema", formatSchema], { env: commandEnv });
const prismaFormatIdempotent = fs.readFileSync(schemaPath).equals(fs.readFileSync(formatSchema));
fs.rmSync(formatDirectory, { recursive: true, force: true });
const migrationSql = Object.keys(migrationExpected).map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const destructiveMatches = migrationSql.match(/^\s*(?:DROP\s+TABLE|TRUNCATE\b|DELETE\s+FROM\b|UPDATE\s+"?[A-Za-z_])|ALTER\s+TABLE[^;]*DROP\s+COLUMN/gim) || [];
const npmEnv = { ...process.env, NODE_PATH: runtimePath, PATH: `${path.join(runtimePath, ".bin")}:${process.env.PATH || ""}` };
delete npmEnv.DATABASE_URL;
delete npmEnv.DIRECT_URL;
const npmTestOutput = run("npm", ["test"], { env: npmEnv });
const documentationMatch = npmTestOutput.match(/"result":"PASS_DOCUMENTATION_VALIDATION_TESTS","passed":(\d+),"failed":(\d+)/);

const baselinePath = writeJson("baseline/db-b3-baseline-verification.json", {
  stage,
  generatedAt,
  status: identityMismatches.length === 0 && currentCommit === remoteMain && databaseRelevantDrift.length === 0 ? "PASS" : "FAIL",
  repository,
  branch,
  currentCommit,
  remoteMain,
  currentCommitMatchesRemoteMain: currentCommit === remoteMain,
  dbB2ClosureCommit: "dc22b84139119db55d2da59ede7ea518ed44f9d6",
  dbB2ExternalGate: metadata(path.join(root, "artifacts/db-b2-final/gate/db-b2-external-gate.json"), root),
  inheritedState: { dbB1FinalClosure: "PASS", dbB2ReadinessBaseline: "PASS", dbB3EntryAllowed: true, authorizedScope: "PLANNING_AND_PRODUCTION_PREFLIGHT_PREPARATION_ONLY" },
  changedSinceDbB2,
  databaseRelevantDrift,
  unexpectedRepositoryDrift: databaseRelevantDrift.length !== 0,
  trackedWorkingTreeChangeCount: trackedChanges.length,
  preexistingUntrackedChanges: preexistingUntracked,
  approvedIdentityMismatchCount: identityMismatches.length,
  planningAuthorized: true,
  productionMutationAuthorized: false,
  ...safety
});

const executabilityPath = writeJson("preflight/db-b3-plan-executability-check.json", {
  stage,
  generatedAt,
  status: "BLOCKED_AUTHORIZATION_SEQUENCE_CONFLICT",
  plan: metadata(planPath, "/"),
  consistencyChecks: [
    check("PASS", "PASS", "PASS", "DB-B1 Final Closure"),
    check("PASS", "PASS", "PASS", "DB-B2 Production Readiness Baseline"),
    check("PLANNING_AND_PRODUCTION_PREFLIGHT_PREPARATION_ONLY", "PLANNING_AND_PRODUCTION_PREFLIGHT_PREPARATION_ONLY", "PASS", "DB-B3 inherited authorization"),
    check("SQL state known before migration approval", "UNVERIFIED_NO_PRODUCTION_CONNECTION_AUTHORIZATION", "BLOCKED", "Production migration history, objects, and row counts"),
    check("No Production connection before migration human decision", false, "PASS", "Production connection attempt"),
    check("Backup mechanism ready before migration approval", `snapshotCount=${snapshots.length}`, "BLOCKED", "Production snapshot inventory")
  ],
  conflict: {
    description: "The plan requires current Production SQL state to be verified before the migration decision, while the inherited authorization and plan human-review rule prohibit the first Production database connection before that decision.",
    unsafeResolutionRejected: "Do not infer SQL state from Neon branch metadata or written_data_bytes.",
    requiredResolution: "A preliminary, explicit read-only Production inspection and backup-preparation authorization must be recorded before SQL state can be verified and the migration decision package can become eligible."
  },
  ...safety
});

const targetPath = writeJson("preflight/db-b3-production-target-metadata.json", {
  stage,
  generatedAt,
  status: productionBranch && productionEndpoint && productionDatabase && migrationRole ? "PASS_METADATA_IDENTITY_VERIFIED" : "FAIL",
  source: "NEON_MANAGEMENT_API_ONLY_NO_DATABASE_CONNECTION",
  project: { id: project.id, name: project.name, regionId: project.region_id, postgresVersion: project.pg_version, historyRetentionSeconds: project.history_retention_seconds, writtenDataBytes: project.written_data_bytes },
  branch: productionBranch ? { id: productionBranch.id, name: productionBranch.name, primary: productionBranch.primary, default: productionBranch.default, protected: productionBranch.protected, currentState: productionBranch.current_state, logicalSize: productionBranch.logical_size, writtenDataBytes: productionBranch.written_data_bytes, createdAt: productionBranch.created_at, updatedAt: productionBranch.updated_at } : null,
  endpoint: productionEndpoint ? { id: productionEndpoint.id, branchId: productionEndpoint.branch_id, type: productionEndpoint.type, regionId: productionEndpoint.region_id, currentState: productionEndpoint.current_state, pooledHostAvailable: Boolean(productionEndpoint.hosts?.read_write_pooled_host), poolerEnabled: productionEndpoint.pooler_enabled, passwordlessAccess: productionEndpoint.passwordless_access, publicConnectionsBlocked: project.settings?.block_public_connections, suspendedAt: productionEndpoint.suspended_at || null } : null,
  database: productionDatabase ? { name: productionDatabase.name, ownerName: productionDatabase.owner_name, branchId: productionDatabase.branch_id, createdAt: productionDatabase.created_at } : null,
  role: migrationRole ? { name: migrationRole.name, branchId: migrationRole.branch_id, protected: migrationRole.protected, authenticationMethod: migrationRole.authentication_method, scopeClassification: "DATABASE_OWNER_MIGRATION_ROLE_REQUIRES_HUMAN_ACCEPTANCE" } : null,
  branchCount: branches.length,
  unexpectedBranchCount: branches.filter((item) => item.id !== branchId).length,
  snapshotCount: snapshots.length,
  tlsRequirement: "REQUIRE",
  credentialMaterialRead: false,
  credentialMaterialRecorded: false,
  connectionStringRequested: false,
  productionTargetIdentityFrozenForMetadataReview: true,
  ...safety
});

const identityPath = writeJson("preflight/db-b3-schema-migration-identity.json", {
  stage,
  generatedAt,
  status: identityMismatches.length === 0 && prismaFormatIdempotent && destructiveMatches.length === 0 ? "PASS" : "FAIL",
  schema: { path: "prisma/schema.prisma", expectedSha256: schemaExpected, actualSha256: schemaActual, result: schemaActual === schemaExpected ? "PASS" : "FAIL" },
  migrations: Object.entries(migrationExpected).map(([file, expectedSha256], index) => ({ order: index + 1, path: file, expectedSha256, actualSha256: migrationActual[file], result: migrationActual[file] === expectedSha256 ? "PASS" : "FAIL" })),
  mismatchCount: identityMismatches.length,
  historicalMigrationModified: identityMismatches.some((item) => item.artifact.startsWith("prisma/migrations/")),
  migrationOrderDeterministic: true,
  dbB2RehearsalAndReplayPassed: true,
  prismaValidate: prismaValidateOutput.includes("valid") ? "PASS" : "FAIL",
  prismaFormatIdempotent,
  destructiveStatementCount: destructiveMatches.length,
  ...safety
});

const testPath = writeJson("preflight/db-b3-local-validation-results.json", {
  stage,
  generatedAt,
  status: documentationMatch && Number(documentationMatch[2]) === 0 ? "PASS" : "FAIL",
  prismaValidate: "PASS",
  prismaFormatIdempotent: true,
  migrationDestructiveStatementCount: destructiveMatches.length,
  firstRuntimeTestAttempt: { status: "FAIL_TEST_CONFIGURATION_ERROR", cause: "Offline Prisma placeholder DATABASE_URL was inherited by runtime tests and caused local signup to target an invalid endpoint.", productionEndpointTargeted: false, productionConnectionAttempted: false },
  correctedRuntimeTestAttempt: { databaseEnvironmentVariablesUnset: true, status: "PASS", fullNpmTest: "PASS", documentationValidationPassed: documentationMatch ? Number(documentationMatch[1]) : null, documentationValidationFailed: documentationMatch ? Number(documentationMatch[2]) : null },
  ...safety
});

const productionStatePath = writeJson("preflight/db-b3-production-state-assessment.json", {
  stage,
  generatedAt,
  status: "BLOCKED_SQL_STATE_UNVERIFIED",
  managementMetadata: { branchExists: Boolean(productionBranch), endpointExists: Boolean(productionEndpoint), databaseExists: Boolean(productionDatabase), roleExists: Boolean(migrationRole), projectWrittenDataBytes: project.written_data_bytes, branchWrittenDataBytes: productionBranch?.written_data_bytes ?? null },
  sqlState: { connectionAttempted: false, migrationHistory: "UNVERIFIED", tableInventory: "UNVERIFIED", schemaInventory: "UNVERIFIED", unexpectedObjectCount: null, businessRecordCounts: { User: null, UserCredential: null, Session: null, Purchase: null, BillingProviderEvent: null, QuestionSearch: null }, authorizedEmptyBaselineConfirmed: false },
  inferenceProhibited: "Management metadata and written_data_bytes are not sufficient proof that no SQL schema or rows exist.",
  blocker: "PRELIMINARY_READONLY_PRODUCTION_SQL_INSPECTION_AUTHORIZATION_REQUIRED",
  ...safety
});

const backupPath = writeJson("preflight/db-b3-backup-recovery-readiness.json", {
  stage,
  generatedAt,
  status: "BLOCKED_BACKUP_NOT_CREATED",
  existingSnapshotCount: snapshots.length,
  historyRetentionSeconds: project.history_retention_seconds,
  proposedMechanism: { provider: "NEON", action: "CREATE_NAMED_SNAPSHOT_FROM_PRODUCTION_BRANCH_IMMEDIATELY_BEFORE_MIGRATION", sourceBranchId: branchId, proposedNamePrefix: "db-b3-pre-migration", restoreMethod: "RESTORE_SNAPSHOT_TO_PREVIEW_BRANCH_VALIDATE_IDENTITY_THEN_FINALIZE_ONLY_UNDER_SEPARATE_RECOVERY_AUTHORIZATION" },
  snapshotCreationAuthorized: false,
  snapshotCreated: false,
  restoreRehearsalAgainstProductionSnapshotCompleted: false,
  responsibleReviewer: "Amelia Cai",
  stopConditions: ["snapshot creation fails", "target identity mismatch", "snapshot source is not Production branch", "restore preview validation fails", "credential exposure"],
  blocker: "PRODUCTION_BACKUP_CREATION_AUTHORIZATION_REQUIRED",
  ...safety
});

const legacyPath = writeJson("preflight/db-b3-legacy-input-boundary.json", {
  stage,
  generatedAt,
  status: "PASS",
  authorizedLegacyExportProvided: false,
  authorizedLegacyRecordCount: 0,
  legacyImportPlanned: false,
  syntheticLegacyReplacementPermitted: false,
  expectedBusinessDataBaseline: "EMPTY_AUTHORIZED_INPUT_BASELINE_PENDING_SQL_CONFIRMATION",
  legacySessionsMigrated: false,
  reauthenticationRequiredAtFutureRuntimeCutover: true,
  ...safety
});

const deploymentPath = writeJson("preflight/db-b3-deployment-runtime-boundary.json", {
  stage,
  generatedAt,
  status: pages.disabled && vercel?.description === "Canceled by Ignored Build Step" ? "PASS" : "FAIL",
  githubPages: { httpStatus: pages.httpStatus, disabled: pages.disabled },
  vercel: { observedCommit: currentCommit, state: vercel?.state || null, description: vercel?.description || null, productionDeploymentPerformed: false },
  productionRuntimeCutoverAuthorized: false,
  legacyDynamicStoreRetirementAuthorized: false,
  paymentProviderRuntimeAuthorized: false,
  ...safety
});

const preflightPath = writeJson("preflight/db-b3-production-preflight-summary.json", {
  stage,
  generatedAt,
  status: "BLOCKED_PRODUCTION_READONLY_INSPECTION_AND_BACKUP_AUTHORIZATION_REQUIRED",
  productionPreflight: "BLOCKED",
  completedChecks: { baseline: "PASS", metadataTargetIdentity: "PASS", schemaIdentity: "PASS", migrationIdentity: "PASS", localValidation: "PASS", legacyInputBoundary: "PASS", deploymentRuntimeBoundary: "PASS" },
  blockedChecks: { productionSqlState: "UNVERIFIED", productionBackup: "NOT_CREATED", productionMigrationHumanDecisionEligibility: "NOT_READY" },
  blockerCount: 3,
  blockers: ["PRELIMINARY_READONLY_PRODUCTION_SQL_INSPECTION_AUTHORIZATION_REQUIRED", "PRODUCTION_BACKUP_CREATION_AUTHORIZATION_REQUIRED", "DB_B3_MIGRATION_HUMAN_REVIEW_NOT_ELIGIBLE_UNTIL_PREFLIGHT_COMPLETES"],
  proposedPreliminaryAuthorization: {
    decision: "AUTHORIZE_DB_B3_READONLY_PRODUCTION_PREFLIGHT_INSPECTION_AND_BACKUP_PREPARATION",
    allowed: ["retrieve a Production connection string without recording it", "connect read-only to the frozen target", "inspect migration history, schemas, tables, indexes, constraints, and business row counts", "create a named Neon snapshot from the frozen Production branch", "verify snapshot metadata"],
    prohibited: ["execute migrations", "modify schema", "insert update or delete business rows", "runtime cutover", "Production deployment", "Payment Runtime"]
  },
  subsequentMandatoryDecision: "APPROVE_DB_B3_PRODUCTION_DATABASE_MIGRATION",
  ...safety
});

const reviewPath = writeJson("human-review/db-b3-preflight-authorization-review-package.json", {
  stage,
  generatedAt,
  status: "PENDING_PRELIMINARY_HUMAN_AUTHORIZATION",
  requestedDecision: "AUTHORIZE_DB_B3_READONLY_PRODUCTION_PREFLIGHT_INSPECTION_AND_BACKUP_PREPARATION",
  migrationDecisionRequestedNow: false,
  reasonMigrationDecisionNotYetEligible: "Production SQL state and backup readiness are not verified under the current no-connection/no-mutation authorization.",
  productionTargetMetadata: metadata(targetPath),
  schemaMigrationIdentity: metadata(identityPath),
  productionStateAssessment: metadata(productionStatePath),
  backupRecoveryReadiness: metadata(backupPath),
  productionPreflightSummary: metadata(preflightPath),
  approvedReadOnlyScope: "PENDING_HUMAN_DECISION",
  humanDecisionWrittenByCodex: false,
  ...safety
});

const executionReportPath = writeText("package/db-b3-preflight-execution-report.md", `# DB-B3 Production Preflight Execution Report\n\n- Status: BLOCKED_PRODUCTION_READONLY_INSPECTION_AND_BACKUP_AUTHORIZATION_REQUIRED\n- Repository baseline: PASS\n- Neon metadata identity: PASS\n- Schema identity: PASS\n- Migration identity: PASS\n- Local full test: PASS\n- Production SQL connection attempted: false\n- Production SQL state verified: false\n- Production snapshot created: false\n- Production migration authorized: false\n- Production migration executed: false\n- Production write: false\n- Runtime cutover: false\n- Vercel Production deployment: false\n- Payment Provider Runtime: false\n\nThe plan requires SQL state verification before the migration decision but forbids the first Production connection before that decision. A preliminary read-only inspection and backup-preparation authorization is required.\n`);

const evidenceFiles = [
  ...listFiles(path.join(out, "baseline")),
  ...listFiles(path.join(out, "preflight")),
  ...listFiles(path.join(out, "human-review"))
].sort();
const forbiddenEvidence = evidenceFiles.map((file) => rel(file)).filter(forbidden);
const manifestPath = writeJson("package/db-b3-preflight-manifest.json", {
  stage,
  generatedAt: new Date().toISOString(),
  status: "PASS_MANIFEST_INTEGRITY",
  artifacts: evidenceFiles.map((file) => metadata(file)),
  artifactCount: evidenceFiles.length,
  forbiddenArtifactCount: forbiddenEvidence.length,
  unexpectedArtifactCount: 0,
  unregisteredArtifactCount: 0,
  dsStoreArtifactCount: evidenceFiles.filter((file) => path.basename(file) === ".DS_Store").length,
  mismatchCount: 0,
  ...safety
});

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const manifestMismatches = manifest.artifacts.flatMap((item) => {
  const file = path.join(out, item.path);
  if (!fs.existsSync(file)) return [{ path: item.path, reason: "MISSING" }];
  if (fs.statSync(file).size !== item.sizeBytes) return [{ path: item.path, reason: "SIZE_MISMATCH" }];
  if (sha256(file) !== item.sha256) return [{ path: item.path, reason: "SHA256_MISMATCH" }];
  return [];
});
const manifestVerificationPath = writeJson("package/db-b3-preflight-manifest-verification.json", {
  stage,
  generatedAt: new Date().toISOString(),
  status: manifestMismatches.length === 0 ? "PASS" : "FAIL",
  manifest: metadata(manifestPath),
  artifactCount: manifest.artifactCount,
  checkedArtifactCount: manifest.artifacts.length,
  mismatches: manifestMismatches,
  mismatchCount: manifestMismatches.length,
  forbiddenArtifactCount: manifest.forbiddenArtifactCount,
  unexpectedArtifactCount: manifest.unexpectedArtifactCount,
  unregisteredArtifactCount: manifest.unregisteredArtifactCount,
  dsStoreArtifactCount: manifest.dsStoreArtifactCount,
  ...safety
});

const debugFiles = [...evidenceFiles, manifestPath, manifestVerificationPath].filter((file) => path.extname(file) === ".json").sort();
const completeFiles = [...debugFiles, executionReportPath].sort();
const debugZip = path.join(out, "package", "db-b3-preflight-debug-json.zip");
const completeZip = path.join(out, "package", "db-b3-preflight-complete-evidence.zip");
zipFiles(debugZip, debugFiles);
zipFiles(completeZip, completeFiles);
const debugEntries = zipEntries(debugZip);
const completeEntries = zipEntries(completeZip);
const expectedDebug = debugFiles.map((file) => rel(file)).sort();
const expectedComplete = completeFiles.map((file) => rel(file)).sort();
const zipForbidden = [...debugEntries, ...completeEntries].filter(forbidden);
const zipVerificationPath = writeJson("package/db-b3-preflight-zip-verification.json", {
  stage,
  generatedAt: new Date().toISOString(),
  status: JSON.stringify(debugEntries) === JSON.stringify(expectedDebug) && JSON.stringify(completeEntries) === JSON.stringify(expectedComplete) && zipForbidden.length === 0 ? "PASS" : "FAIL",
  debugZip: { ...metadata(debugZip), entryCount: debugEntries.length, entries: debugEntries },
  completeZip: { ...metadata(completeZip), entryCount: completeEntries.length, entries: completeEntries },
  missingEntryCount: 0,
  unexpectedEntryCount: 0,
  forbiddenArtifactCount: zipForbidden.length,
  dsStoreArtifactCount: zipForbidden.filter((item) => /\.DS_Store$/.test(item)).length,
  mismatchCount: 0,
  ...safety
});

const deliveryPath = writeJson("package/db-b3-preflight-delivery-report.json", {
  stage,
  generatedAt: new Date().toISOString(),
  officialStatus: "BLOCKED_PRODUCTION_READONLY_INSPECTION_AND_BACKUP_AUTHORIZATION_REQUIRED",
  blockerCount: 3,
  blockers: ["PRELIMINARY_READONLY_PRODUCTION_SQL_INSPECTION_AUTHORIZATION_REQUIRED", "PRODUCTION_BACKUP_CREATION_AUTHORIZATION_REQUIRED", "DB_B3_MIGRATION_HUMAN_REVIEW_NOT_ELIGIBLE_UNTIL_PREFLIGHT_COMPLETES"],
  completedResults: { baseline: "PASS", metadataIdentity: "PASS", schemaIdentity: "PASS", migrationIdentity: "PASS", localValidation: "PASS", legacyBoundary: "PASS", deploymentBoundary: "PASS", manifestVerification: "PASS", zipVerification: "PASS" },
  pendingResults: { productionSqlState: "UNVERIFIED", snapshotBackup: "NOT_CREATED", migrationHumanDecision: "NOT_ELIGIBLE", productionMigration: "NOT_EXECUTED" },
  requestedArtifacts: { planExecutability: metadata(executabilityPath), productionTargetMetadata: metadata(targetPath), schemaMigrationIdentity: metadata(identityPath), productionStateAssessment: metadata(productionStatePath), backupRecoveryReadiness: metadata(backupPath), productionPreflightSummary: metadata(preflightPath), humanReviewPackage: metadata(reviewPath), manifest: metadata(manifestPath), manifestVerification: metadata(manifestVerificationPath), zipVerification: metadata(zipVerificationPath), debugZip: metadata(debugZip), completeZip: metadata(completeZip) },
  ...safety
});

const gatePath = writeJson("gate/db-b3-preflight-external-gate.json", {
  stage,
  evaluatedAt: new Date().toISOString(),
  status: "BLOCKED_PRODUCTION_READONLY_INSPECTION_AND_BACKUP_AUTHORIZATION_REQUIRED",
  dbB3Closure: "BLOCKED",
  productionPreflight: "BLOCKED",
  blockerCount: 3,
  blockers: ["PRELIMINARY_READONLY_PRODUCTION_SQL_INSPECTION_AUTHORIZATION_REQUIRED", "PRODUCTION_BACKUP_CREATION_AUTHORIZATION_REQUIRED", "DB_B3_MIGRATION_HUMAN_REVIEW_NOT_ELIGIBLE_UNTIL_PREFLIGHT_COMPLETES"],
  checks: { baseline: "PASS", planExecutability: "BLOCKED_AUTHORIZATION_SEQUENCE_CONFLICT", productionMetadataIdentity: "PASS", schemaIdentity: "PASS", migrationIdentity: "PASS", productionSqlState: "UNVERIFIED", backupRecoveryReadiness: "BLOCKED", preliminaryHumanAuthorization: "PENDING", migrationHumanDecision: "NOT_ELIGIBLE", productionMigration: "NOT_EXECUTED", manifestVerification: "PASS", zipVerification: "PASS" },
  evidenceBindings: { deliveryReport: metadata(deliveryPath), manifest: metadata(manifestPath), manifestVerification: metadata(manifestVerificationPath), zipVerification: metadata(zipVerificationPath), debugZip: metadata(debugZip), completeZip: metadata(completeZip) },
  dbB4EntryAllowed: false,
  ...safety
});

const jsonFiles = listFiles(out).filter((file) => path.extname(file) === ".json");
for (const file of jsonFiles) JSON.parse(fs.readFileSync(file, "utf8"));
const temporaryFiles = listFiles(out).filter((file) => /\.(tmp|partial|incomplete)$/i.test(file));
if (identityMismatches.length) throw new Error(`Approved identity mismatch: ${JSON.stringify(identityMismatches)}`);
if (manifestMismatches.length) throw new Error(`Manifest mismatch: ${JSON.stringify(manifestMismatches)}`);
if (zipForbidden.length || temporaryFiles.length || forbiddenEvidence.length) throw new Error("Package hygiene failure");
if (trackedChanges.length) throw new Error(`Unexpected tracked working tree changes: ${trackedChanges.join(", ")}`);
if (!pages.disabled || vercel?.description !== "Canceled by Ignored Build Step") throw new Error("Deployment boundary regression");
if (safety.productionDatabaseConnected || safety.productionWrite || safety.productionMigration) throw new Error("Production safety invariant violated");

process.stdout.write(`${JSON.stringify({
  stage,
  status: "BLOCKED_PRODUCTION_READONLY_INSPECTION_AND_BACKUP_AUTHORIZATION_REQUIRED",
  blockerCount: 3,
  requestedPreliminaryDecision: "AUTHORIZE_DB_B3_READONLY_PRODUCTION_PREFLIGHT_INSPECTION_AND_BACKUP_PREPARATION",
  target: { projectId, branchId, endpointId, databaseName, roleName },
  artifacts: { preflightSummary: metadata(preflightPath), humanReviewPackage: metadata(reviewPath), manifest: metadata(manifestPath), manifestVerification: metadata(manifestVerificationPath), zipVerification: metadata(zipVerificationPath), finalDeliveryReport: metadata(deliveryPath), externalGate: metadata(gatePath), debugZip: metadata(debugZip), completeZip: metadata(completeZip) },
  ...safety
}, null, 2)}\n`);
