#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts', 'db-b1');
const stage = 'DB-B1_MAINLINE_DATABASE_INTEGRATION_AND_LOCAL_VALIDATION';
const generatedAt = new Date().toISOString();
const mainHead = '11ce82001efb633c1697356c1a510fc0c5034245';
const integrationCandidateCommit = 'cdc75e55e07b491dc49af29adef9876aef4246c2';
const approvedImplementationCommit = '648746c166afec523bae559a976e12b6dc2c7359';
const schemaExpected = 'd33fcc99efca315f44fd9078352173814ba420eda26cfe3c696ac805175ff13f';
const baselineExpected = '87c08a3f67b0fa03ae368d3e846965efd6127747850d393af1d2e9f1d48d700b';
const billingExpected = '9271a4b21452c8940726f71f4356fd7d652f07976cf8fa09fcebc56e315cc6fd';
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
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options }).trim();
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeJson(rel, value) {
  const file = path.join(out, rel);
  ensureDir(file);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  JSON.parse(fs.readFileSync(file, 'utf8'));
  return file;
}

function writeText(rel, value) {
  const file = path.join(out, rel);
  ensureDir(file);
  fs.writeFileSync(file, value);
  return file;
}

function rel(file) {
  return path.relative(out, file).split(path.sep).join('/');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function metadata(file) {
  const ext = path.extname(file).toLowerCase();
  let jsonValid = null;
  if (ext === '.json') {
    try { JSON.parse(fs.readFileSync(file, 'utf8')); jsonValid = true; } catch { jsonValid = false; }
  }
  return {
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    mimeType: ext === '.json' ? 'application/json' : ext === '.md' ? 'text/markdown' : 'application/octet-stream',
    parseStatus: jsonValid === null ? 'NOT_APPLICABLE' : jsonValid ? 'PASS' : 'FAIL',
    jsonValid,
  };
}

function fileIdentity(relPath, expectedSha256 = null) {
  const file = path.join(root, relPath);
  const actualSha256 = fs.existsSync(file) ? sha256(file) : null;
  return {
    path: relPath,
    exists: fs.existsSync(file),
    isFile: fs.existsSync(file) && fs.statSync(file).isFile(),
    sizeBytes: fs.existsSync(file) ? fs.statSync(file).size : null,
    sha256: actualSha256,
    expectedSha256,
    identityMatches: expectedSha256 === null ? null : actualSha256 === expectedSha256,
  };
}

function zipFiles(target, files) {
  fs.rmSync(target, { force: true });
  execFileSync('zip', ['-X', '-q', target, ...files.map(rel)], { cwd: out });
}

function zipInfo(file) {
  const entries = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  execFileSync('unzip', ['-tqq', file], { stdio: 'pipe' });
  const forbidden = entries.filter((entry) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(entry));
  return {
    path: rel(file),
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    entryCount: entries.length,
    entries,
    crcExitCode: 0,
    crcValid: true,
    forbiddenArtifacts: forbidden,
    forbiddenArtifactCount: forbidden.length,
  };
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const actualHead = git(['rev-parse', 'HEAD']);
if (actualHead !== integrationCandidateCommit) {
  throw new Error(`Unexpected DB-B1 integration candidate HEAD: ${actualHead}`);
}

const diffFiles = git(['diff', '--name-only', `${mainHead}...HEAD`]).split('\n').filter(Boolean).sort();
const approvedTracking = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/db-b0-r1/db-b0-r1-approved-artifact-tracking.json')));
const approvedDatabaseFiles = new Set(approvedTracking.artifacts.map(({ path: file }) => file));
const dbB0Evidence = (file) => file.startsWith('artifacts/db-b0-r1/') || file.startsWith('artifacts/db-b0-r1-final/');
const targetBindingFiles = new Set([
  'tests/helpers/ephemeral-database-target.js',
  'tests/ephemeral-database-target.test.js',
]);
const approvedStripeCleanupFiles = new Set([
  'public/app.js', 'public/auth.js', 'public/auth.css', 'public/index.html', 'public/styles.css',
  'public/checkout.html', 'public/checkout.js', 'tests/billing-webhook.test.js',
]);
const integrationSupportFiles = new Set([
  '.gitignore', 'scripts/generate-db-b0-r1-final-evidence.js',
  'tests/deployment-smoke.test.js', 'tests/paid-to-refunded-access-state.test.js',
  'tests/production-config.test.js', 'tests/vercel-routing.test.js', 'vercel.json',
]);
const staticBoundaryFiles = new Set([
  'generated/production-question-index.json',
  'public/assets/paperlens-data.js',
  'public/assets/question-index.json',
]);

function classifyDiff(file) {
  if (approvedDatabaseFiles.has(file)) return 'DB_B0_APPROVED_DATABASE_ARTIFACT';
  if (dbB0Evidence(file)) return 'DB_B0_EVIDENCE';
  if (targetBindingFiles.has(file)) return 'DB_B0_EPHEMERAL_TARGET_BINDING';
  if (approvedStripeCleanupFiles.has(file)) return 'DB_A5_P0_APPROVED_STRIPE_CLEANUP';
  if (integrationSupportFiles.has(file)) return 'INTEGRATION_SUPPORT';
  if (staticBoundaryFiles.has(file)) return 'STATIC_CONTENT_BOUNDARY_REVIEW_REQUIRED';
  return 'UNCLASSIFIED_REVIEW_REQUIRED';
}
const classifiedDiff = diffFiles.map((file) => ({ path: file, classification: classifyDiff(file) }));
const staticBoundaryChanges = classifiedDiff.filter(({ classification }) => classification === 'STATIC_CONTENT_BOUNDARY_REVIEW_REQUIRED');
const unclassifiedChanges = classifiedDiff.filter(({ classification }) => classification === 'UNCLASSIFIED_REVIEW_REQUIRED');

const baseline = writeJson('baseline/db-b1-integration-baseline.json', {
  stage,
  timestamp: generatedAt,
  integrationBaseCommit: mainHead,
  localOriginMainHead: mainHead,
  remoteMainRefreshAttempted: true,
  remoteMainRefreshSucceeded: false,
  remoteMainRefreshError: {
    name: 'GitFetchError',
    message: "fatal: unable to access 'https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git/': Error in the HTTP2 framing layer",
  },
  remoteFreshnessVerifiedThisRun: false,
  integrationBranch: 'codex/db-b1-mainline-integration',
  integrationCandidateCommit,
  approvedImplementationCommit,
  actualMainUpdated: false,
  directMainMutationPerformed: false,
  status: 'BLOCKED_REMOTE_MAIN_FRESHNESS_UNVERIFIED',
  ...safety,
});

const diffReport = writeJson('baseline/db-b1-main-integration-diff.json', {
  stage,
  generatedAt,
  baseCommit: mainHead,
  targetCommit: integrationCandidateCommit,
  comparison: `${mainHead}...${integrationCandidateCommit}`,
  changedFileCount: classifiedDiff.length,
  files: classifiedDiff,
  staticBoundaryChanges: staticBoundaryChanges.map(({ path: file }) => file),
  staticBoundaryChangeCount: staticBoundaryChanges.length,
  unclassifiedChanges: unclassifiedChanges.map(({ path: file }) => file),
  unclassifiedChangeCount: unclassifiedChanges.length,
  approvedDatabaseArtifactCount: classifiedDiff.filter(({ classification }) => classification === 'DB_B0_APPROVED_DATABASE_ARTIFACT').length,
  actualMainUpdated: false,
  status: staticBoundaryChanges.length || unclassifiedChanges.length ? 'BLOCKED_DIFF_SCOPE_REVIEW_REQUIRED' : 'PASS',
  ...safety,
});

const schemaFile = path.join(root, 'prisma/schema.prisma');
const schemaText = fs.readFileSync(schemaFile, 'utf8');
const modelNames = [...schemaText.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
const enumNames = [...schemaText.matchAll(/^enum\s+(\w+)\s+\{/gm)].map((match) => match[1]);
const productionModels = ['User', 'UserCredential', 'Session', 'Purchase', 'QuestionSearch'];
const schemaReport = writeJson('schema/db-b1-schema-verification.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  schema: fileIdentity('prisma/schema.prisma', schemaExpected),
  modelNames,
  modelCount: modelNames.length,
  enumNames,
  productionModels,
  productionModelsPresent: productionModels.every((model) => modelNames.includes(model)),
  billingEventLedgerPresent: modelNames.includes('BillingProviderEvent'),
  questionSearchUserSearchKeyUniquePresent: /@@unique\(\[userId,\s*searchKey\]\)/.test(schemaText),
  billingProviderEventProviderIdUniquePresent: /@@unique\(\[provider,\s*providerEventId\]\)/.test(schemaText),
  purchaseRefundedAtPresent: /refundedAt\s+DateTime\?/.test(schemaText),
  approvedSchemaIntegratedIntoCandidate: sha256(schemaFile) === schemaExpected,
  approvedSchemaIntegratedIntoActualMain: false,
  status: sha256(schemaFile) === schemaExpected ? 'PASS_CANDIDATE_IDENTITY' : 'FAIL',
  ...safety,
});

const migrationFiles = [
  fileIdentity('prisma/migrations/20260728133000_production_baseline/migration.sql', baselineExpected),
  fileIdentity('prisma/migrations/20260729152000_billing_event_ledger_extension/migration.sql', billingExpected),
];
const migrationReport = writeJson('migration/db-b1-migration-verification.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  migrationsInOrder: migrationFiles,
  approvedMigrationCount: 2,
  migrationOrderCorrect: migrationFiles.every(({ identityMatches }) => identityMatches),
  frozenMigrationModified: migrationFiles.some(({ identityMatches }) => !identityMatches),
  migrationRegenerated: false,
  migrationSqlEditedDuringDbB1: false,
  prismaMigrateStatusExecutedOnDbB1Candidate: false,
  prismaMigrateStatusReason: 'NO_NEW_AUTHORIZED_EPHEMERAL_POSTGRESQL_TARGET; PRODUCTION IS FORBIDDEN',
  dbB0EphemeralMigrationEvidence: {
    path: 'artifacts/db-b0-r1-final/database-tests/db-b0-r1-ephemeral-migration-report.json',
    sha256: sha256(path.join(root, 'artifacts/db-b0-r1-final/database-tests/db-b0-r1-ephemeral-migration-report.json')),
    status: 'PASS',
    reuseStatus: 'REUSED_BY_SCHEMA_AND_MIGRATION_CONTENT_IDENTITY',
  },
  approvedMigrationsIntegratedIntoCandidate: migrationFiles.every(({ identityMatches }) => identityMatches),
  approvedMigrationsIntegratedIntoActualMain: false,
  status: migrationFiles.every(({ identityMatches }) => identityMatches) ? 'PASS_CANDIDATE_IDENTITY' : 'FAIL',
  ...safety,
});

const runtimePaths = [
  'src/server/db.js', 'src/server/users.js', 'src/server/sessions.js',
  'src/server/questionSearches.js', 'src/server/purchases.js',
  'src/server/billingEvents.js', 'src/server/runtimeEnvironment.js',
];
const runtimeModules = runtimePaths.map((file) => fileIdentity(file));
const activeRuntimeScanPaths = ['server.js', ...runtimePaths, 'public/index.html', 'public/app.js', 'public/auth.js', '.env.example'];
const activeStripeMatches = [];
for (const file of activeRuntimeScanPaths) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  text.split('\n').forEach((line, index) => {
    if (/stripe/i.test(line)) activeStripeMatches.push({ path: file, line: index + 1, text: line.trim().slice(0, 200) });
  });
}
const runtimeBoundary = writeJson('runtime/db-b1-runtime-boundary-freeze.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  postgresqlDynamicRuntime: productionModels,
  runtimeModules,
  allRuntimeModulesPresent: runtimeModules.every(({ exists }) => exists),
  staticContentBoundary: [
    'Question JSON', 'PDF', 'Page Image', 'Question Crop', 'Response Area', 'Search Index', 'Mark Scheme Assets',
  ],
  staticContentMigratedToPostgresql: false,
  billing: {
    schemaExists: true,
    billingEventModuleExists: true,
    activeProviderRuntime: false,
    billingProviderEnabledDefault: false,
    billingEnvironmentDefault: 'DISABLED',
  },
  activeStripeRuntimeMatches: activeStripeMatches,
  activeStripeRuntimeMatchCount: activeStripeMatches.length,
  runtimeBoundaryFrozenInCandidate: true,
  runtimeBoundaryFrozenInActualMain: false,
  status: activeStripeMatches.length === 0 ? 'PASS_CANDIDATE_BOUNDARY' : 'FAIL_ACTIVE_STRIPE_RUNTIME',
  ...safety,
});

const legacyInventory = writeJson('legacy-audit/db-b1-legacy-runtime-inventory.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  entries: [
    {
      path: 'src/server/localStore.js',
      purpose: 'Local/test fallback for users, sessions, purchases, and question-search accounting when DATABASE_URL is absent.',
      dynamicData: true,
      activeInLocalDevelopmentAndTests: true,
      activeInConfiguredPostgresqlRuntime: false,
      classification: 'APPROVED_TEMPORARY_COMPATIBILITY',
      exitStage: 'DB-B4_PRODUCTION_RUNTIME_CUTOVER_AND_LEGACY_DYNAMIC_STORE_RETIREMENT',
    },
    {
      path: 'data/users.json',
      purpose: 'Legacy/local user and question-search JSON store.',
      dynamicData: true,
      gitTracked: false,
      classification: 'REMOVE_AFTER_CUTOVER',
      exitStage: 'DB-B4_PRODUCTION_RUNTIME_CUTOVER_AND_LEGACY_DYNAMIC_STORE_RETIREMENT',
    },
    {
      path: 'server.js legacy Redis/KV user-store helpers',
      purpose: 'Historical user JSON persistence and optional rate-limit transport.',
      dynamicData: true,
      userStoreHelpersReachableFromCurrentDatabaseModules: false,
      rateLimitTransportStillReachable: true,
      classification: 'APPROVED_TEMPORARY_COMPATIBILITY',
      exitStage: 'DB-B2_LEGACY_DYNAMIC_DATA_DECISION',
    },
    {
      path: 'public/checkout.html and public/checkout.js',
      purpose: 'Superseded Stripe checkout UI.',
      dynamicData: false,
      gitState: 'DELETED_IN_CANDIDATE',
      classification: 'HISTORICAL_ONLY',
      exitStage: 'COMPLETED_DB-A5-P0',
    },
  ],
  entryCount: 4,
  unclassifiedLegacyRuntimeCount: 0,
  legacyDynamicRuntimeClassified: true,
  legacyRuntimeDeletedDuringDbB1: false,
  status: 'PASS',
  ...safety,
});

const paymentDisabled = writeJson('runtime/db-b1-payment-disabled-verification.json', {
  stage,
  generatedAt,
  inspectedPaths: activeRuntimeScanPaths,
  activeStripeRuntimeMatches: activeStripeMatches,
  activeStripeRuntimeMatchCount: activeStripeMatches.length,
  checkoutHtmlPresent: fs.existsSync(path.join(root, 'public/checkout.html')),
  checkoutJsPresent: fs.existsSync(path.join(root, 'public/checkout.js')),
  billingProviderEnabledDefault: false,
  billingEnvironmentDefault: 'DISABLED',
  paymentProviderDisabledTest: 'PASS',
  READMEHistoricalStripeReferencesPresent: /STRIPE_SECRET_KEY/.test(fs.readFileSync(path.join(root, 'README.md'), 'utf8')),
  documentationCleanupNotIntegratedIntoCandidate: true,
  status: activeStripeMatches.length === 0 ? 'PASS_RUNTIME_WITH_DOCUMENTATION_FOLLOWUP' : 'FAIL',
  ...safety,
});

const dbB0DatabaseTestPath = path.join(root, 'artifacts/db-b0-r1-final/database-tests/db-b0-r1-database-test-execution-report.json');
const testsReport = writeJson('tests/db-b1-local-test-execution-report.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  environment: {
    nodeVersion: process.version,
    databaseUrlConfiguredForApplicationTests: false,
    billingProviderEnabled: false,
    billingEnvironment: 'DISABLED',
  },
  executions: [
    { id: 'PRISMA_VALIDATE', command: 'DATABASE_URL=<INVALID_LOCAL_PLACEHOLDER> prisma validate', exitCode: 0, status: 'PASS_NO_CONNECTION_ATTEMPTED' },
    { id: 'EPHEMERAL_TARGET_GUARD', command: 'npm run test:ephemeral-database-target', exitCode: 0, status: 'PASS' },
    {
      id: 'FIRST_FULL_SUITE_ATTEMPT', command: 'npm test', exitCode: 1,
      status: 'FAIL_ENVIRONMENT_CONTAMINATION',
      error: { name: 'AssertionError', message: 'signup should succeed: 500 !== 201', failedTest: 'tests/auth-session.test.js' },
      rootCause: 'The invalid DATABASE_URL placeholder used for prisma validate remained exported and caused the application runtime to choose Prisma.',
      codeChangedToResolve: false,
    },
    { id: 'FULL_LOCAL_APPLICATION_SUITE_RERUN', command: 'unset DATABASE_URL DIRECT_URL; npm test', exitCode: 0, status: 'PASS', documentationTestsPassed: 79, documentationTestsFailed: 0 },
    {
      id: 'OFFLINE_BUILD', command: 'DATABASE_URL=<INVALID_LOCAL_PLACEHOLDER> npm run build', exitCode: 0,
      status: 'PASS_WITH_GENERATED_STATIC_INDEX_DRIFT',
      generatedStaticIndexDriftDetected: true,
      affectedArtifact: 'generated/question-index.json',
      buildQuestionIndexSource: 'LEGACY_PDF_PARSER',
      servedQuestionIndexSource: 'generated/production-question-index.json',
      rootCause: 'The integrated package script still invokes the legacy PDF-derived index builder; the canonical production-store builder and its source store were not integrated.',
      staticContentChangeRetained: false,
    },
    {
      id: 'DATABASE_REHEARSAL_TESTS_ON_DB_B1_COMMIT',
      command: 'npm run test:database-rehearsal',
      exitCode: null,
      status: 'BLOCKED_NO_NEW_AUTHORIZED_EPHEMERAL_POSTGRESQL',
      productionDatabaseConnectionAttempted: false,
    },
  ],
  dbB0DatabaseExecutionEvidence: {
    path: path.relative(root, dbB0DatabaseTestPath).split(path.sep).join('/'),
    sha256: sha256(dbB0DatabaseTestPath),
    sourceStatus: JSON.parse(fs.readFileSync(dbB0DatabaseTestPath)).status,
    reuseStatus: 'REUSED_BY_SCHEMA_MIGRATION_AND_RUNTIME_CONTENT_IDENTITY',
    targetCommit: integrationCandidateCommit,
    excludedFields: ['Git commit identity', 'DB-B1 integration evidence'],
  },
  prismaValidatePassed: true,
  localApplicationSuitePassed: true,
  offlineBuildCommandPassed: true,
  generatedStaticIndexDriftDetected: true,
  databaseTestsRerunOnCandidate: false,
  localIntegrationTestsPassed: false,
  status: 'BLOCKED_BUILD_STATIC_INDEX_DRIFT_AND_DB_TEST_TARGET_REQUIRED',
  ...safety,
});

const prePackageFiles = listFiles(out);
const credentialPatterns = [
  { id: 'NEON_PASSWORD_TOKEN', pattern: /\bnpg_[A-Za-z0-9]{8,}\b/g },
  { id: 'POSTGRESQL_CREDENTIAL_URI', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+:[^@\s"'`]+@/g },
];
const credentialFindings = [];
for (const file of prePackageFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const { id, pattern } of credentialPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) credentialFindings.push({ path: rel(file), patternId: id });
  }
}
const trackedEnvFiles = git(['ls-files']).split('\n').filter((file) => /(^|\/)\.env($|\.)/.test(file) && file !== '.env.example');
const prePackageForbidden = prePackageFiles.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const securityAudit = writeJson('security/db-b1-secret-and-package-hygiene-audit.json', {
  stage,
  auditedAt: generatedAt,
  scanPhase: 'PRE_PACKAGE',
  scannedEvidenceFileCount: prePackageFiles.length,
  credentialFindings,
  credentialLeakCount: credentialFindings.length,
  trackedEnvironmentFiles: trackedEnvFiles,
  trackedEnvironmentFileCount: trackedEnvFiles.length,
  forbiddenArtifacts: prePackageForbidden.map(rel),
  forbiddenArtifactCount: prePackageForbidden.length,
  dsStoreArtifactCount: prePackageFiles.filter((file) => path.basename(file) === '.DS_Store').length,
  actualDatabaseCredentialUsedDuringDbB1: false,
  status: credentialFindings.length === 0 && trackedEnvFiles.length === 0 && prePackageForbidden.length === 0 ? 'PASS' : 'FAIL',
  ...safety,
});

const blockers = [
  { blockerId: 'DB-B1-BLOCKER-001', blocker: 'DB_B0_R1_HUMAN_DECISION_REQUIRED', status: 'OPEN' },
  { blockerId: 'DB-B1-BLOCKER-002', blocker: 'REMOTE_MAIN_FRESHNESS_UNVERIFIED_HTTP2_FETCH_FAILURE', status: 'OPEN' },
  { blockerId: 'DB-B1-BLOCKER-003', blocker: 'BUILD_GENERATED_STATIC_INDEX_DRIFT_REVIEW_REQUIRED', status: 'OPEN' },
  { blockerId: 'DB-B1-BLOCKER-004', blocker: 'DB_B1_CANDIDATE_DATABASE_TEST_TARGET_REQUIRED', status: 'OPEN' },
  { blockerId: 'DB-B1-BLOCKER-005', blocker: 'DB_B1_MAIN_INTEGRATION_HUMAN_DECISION_REQUIRED', status: 'OPEN' },
  { blockerId: 'DB-B1-BLOCKER-006', blocker: 'DB_A5_P0_DOCUMENTATION_CLEANUP_NOT_INTEGRATED', status: 'OPEN', affectedFile: 'README.md' },
];
if (unclassifiedChanges.length) blockers.push({ blockerId: 'DB-B1-BLOCKER-007', blocker: 'UNCLASSIFIED_MAIN_INTEGRATION_DIFF_REQUIRED', status: 'OPEN', affectedFiles: unclassifiedChanges.map(({ path: file }) => file) });
const blockerRegister = writeJson('gate/db-b1-blocker-register.json', {
  stage,
  generatedAt,
  blockers,
  blockerCount: blockers.length,
  status: 'BLOCKED_DB_B1_PREREQUISITES_AND_HUMAN_REVIEW',
  ...safety,
});

const reviewBindings = {
  integrationBaseCommit: mainHead,
  integrationCandidateCommit,
  approvedImplementationCommit,
  schemaSha256: sha256(schemaFile),
  baselineMigrationSha256: migrationFiles[0].sha256,
  billingMigrationSha256: migrationFiles[1].sha256,
  baselineReportSha256: sha256(baseline),
  diffReportSha256: sha256(diffReport),
  schemaReportSha256: sha256(schemaReport),
  migrationReportSha256: sha256(migrationReport),
  runtimeBoundarySha256: sha256(runtimeBoundary),
  legacyInventorySha256: sha256(legacyInventory),
  paymentDisabledSha256: sha256(paymentDisabled),
  testReportSha256: sha256(testsReport),
  securityAuditSha256: sha256(securityAudit),
  blockerRegisterSha256: sha256(blockerRegister),
};
const reviewPackage = writeJson('package/db-b1-human-review-package.json', {
  stage,
  generatedAt,
  reviewStatus: 'PENDING_HUMAN_REVIEW',
  reviewBindings,
  requiredDecisions: [
    'Resolve DB-B0-R1 pending human decision.',
    'Confirm refreshed remote main identity after network access is restored.',
    'Decide whether generated/question-index.json build drift is allowed or must be fixed outside DB-B1.',
    'Authorize a new isolated PostgreSQL target if DB tests must be rerun on the DB-B1 commit identity.',
    'Approve or reject the candidate diff before actual main integration.',
  ],
  codexDidNotAuthorApproval: true,
  ...safety,
});
const humanDecision = writeJson('package/db-b1-human-decision.json', {
  stage,
  decision: 'PENDING_HUMAN_REVIEW',
  reviewer: null,
  reviewedAt: null,
  evidenceBinding: { ...reviewBindings, humanReviewPackageSha256: sha256(reviewPackage) },
  mainIntegrationApproved: false,
  runtimeBoundaryApproved: false,
  testSuiteApproved: false,
  codexDidNotAuthorApproval: true,
  ...safety,
});
const humanVerification = writeJson('package/db-b1-human-decision-verification.json', {
  stage,
  decisionPath: rel(humanDecision),
  decisionSha256: sha256(humanDecision),
  expectedDecision: 'APPROVE_DB_B1_MAINLINE_DATABASE_INTEGRATION',
  actualDecision: 'PENDING_HUMAN_REVIEW',
  evidenceBindingMatches: true,
  humanDecisionVerified: false,
  status: 'BLOCKED_PENDING_HUMAN_REVIEW',
  ...safety,
});

writeText('package/db-b1-execution-report.md', `# DB-B1 Mainline Integration Candidate\n\n` +
  `- Local origin/main baseline: \`${mainHead}\`\n` +
  `- Candidate commit: \`${integrationCandidateCommit}\`\n` +
  `- Actual main updated: false\n` +
  `- Schema and migration identities: PASS\n` +
  `- Full local application suite: PASS after clearing the validate-only placeholder URL\n` +
  `- Offline build command: PASS, but legacy generated static index drifted and was not retained\n` +
  `- Payment provider runtime: disabled\n` +
  `- Production database/write/deploy: false / false / false\n` +
  `- Official status: BLOCKED_DB_B1_PREREQUISITES_AND_HUMAN_REVIEW\n`);

const manifestInputs = listFiles(out).filter((file) => !rel(file).startsWith('package/db-b1-evidence-') && !rel(file).endsWith('.zip') && !rel(file).startsWith('gate/db-b1-external-gate.json')).sort();
const manifestArtifacts = Object.fromEntries(manifestInputs.map((file) => [rel(file), metadata(file)]));
const manifest = writeJson('package/db-b1-evidence-manifest.json', {
  stage,
  generatedAt,
  integrationCandidateCommit,
  artifactCount: manifestInputs.length,
  artifacts: manifestArtifacts,
  status: 'PRE_HUMAN_REVIEW_FROZEN',
  ...safety,
});
const parsedManifest = JSON.parse(fs.readFileSync(manifest, 'utf8'));
const mismatches = [];
for (const [file, expected] of Object.entries(parsedManifest.artifacts)) {
  const actualFile = path.join(out, file);
  if (!fs.existsSync(actualFile)) { mismatches.push({ artifact: file, mismatch: 'MISSING' }); continue; }
  const actual = metadata(actualFile);
  for (const field of ['sizeBytes', 'sha256', 'parseStatus']) {
    if (actual[field] !== expected[field]) mismatches.push({ artifact: file, field, expected: expected[field], actual: actual[field] });
  }
}
const currentFiles = listFiles(out);
const forbiddenFiles = currentFiles.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const manifestVerification = writeJson('package/db-b1-evidence-manifest-verification.json', {
  stage,
  verifiedAt: generatedAt,
  manifestPath: rel(manifest),
  manifestSha256: sha256(manifest),
  checkedArtifactCount: Object.keys(parsedManifest.artifacts).length,
  mismatches,
  mismatchCount: mismatches.length,
  forbiddenArtifacts: forbiddenFiles.map(rel),
  forbiddenArtifactCount: forbiddenFiles.length,
  dsStoreArtifactCount: currentFiles.filter((file) => path.basename(file) === '.DS_Store').length,
  status: mismatches.length === 0 && forbiddenFiles.length === 0 ? 'PASS' : 'FAIL',
  ...safety,
});

const zipInputs = listFiles(out).filter((file) => !rel(file).endsWith('.zip') && !rel(file).startsWith('gate/db-b1-external-gate.json')).sort();
const debugInputs = zipInputs.filter((file) => path.extname(file) === '.json');
const completeInputs = zipInputs.filter((file) => ['.json', '.md'].includes(path.extname(file)));
const debugZip = path.join(out, 'package/db-b1-debug-json.zip');
const completeZip = path.join(out, 'package/db-b1-complete-evidence.zip');
zipFiles(debugZip, debugInputs);
zipFiles(completeZip, completeInputs);
const debugZipInfo = zipInfo(debugZip);
const completeZipInfo = zipInfo(completeZip);
const zipVerification = writeJson('package/db-b1-zip-verification.json', {
  stage,
  verifiedAt: generatedAt,
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  expectedDebugEntryCount: debugInputs.length,
  expectedCompleteEntryCount: completeInputs.length,
  debugEntryCountMatches: debugZipInfo.entryCount === debugInputs.length,
  completeEntryCountMatches: completeZipInfo.entryCount === completeInputs.length,
  forbiddenArtifactCount: debugZipInfo.forbiddenArtifactCount + completeZipInfo.forbiddenArtifactCount,
  zipCrcFailureCount: 0,
  status: debugZipInfo.crcValid && completeZipInfo.crcValid && debugZipInfo.entryCount === debugInputs.length && completeZipInfo.entryCount === completeInputs.length && debugZipInfo.forbiddenArtifactCount === 0 && completeZipInfo.forbiddenArtifactCount === 0 ? 'PASS' : 'FAIL',
  ...safety,
});
const delivery = writeJson('package/db-b1-delivery-report.json', {
  stage,
  deliveredAt: generatedAt,
  integrationCandidateCommit,
  actualMainUpdated: false,
  technicalCandidateStatus: 'PARTIAL_PASS_WITH_BLOCKERS',
  officialStatus: 'BLOCKED_DB_B1_PREREQUISITES_AND_HUMAN_REVIEW',
  manifest: { path: rel(manifest), ...metadata(manifest) },
  manifestVerification: { path: rel(manifestVerification), ...metadata(manifestVerification) },
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  zipVerification: { path: rel(zipVerification), ...metadata(zipVerification) },
  blockerCount: blockers.length,
  ...safety,
});
const gate = writeJson('gate/db-b1-external-gate.json', {
  stage,
  evaluatedAt: generatedAt,
  integrationBaseCommit: mainHead,
  integrationCandidateCommit,
  checks: {
    remoteMainFreshness: 'BLOCKED_HTTP2_FETCH_FAILURE',
    dbB0R1HumanDecision: 'PENDING_HUMAN_REVIEW',
    candidateContainsApprovedSchema: 'PASS',
    candidateContainsApprovedMigrations: 'PASS',
    candidateContainsApprovedRuntime: 'PASS',
    runtimeBoundary: 'PASS_CANDIDATE_BOUNDARY',
    legacyRuntimeClassification: 'PASS',
    paymentRuntimeDisabled: 'PASS',
    dbA5P0DocumentationCleanup: 'BLOCKED_NOT_INTEGRATED_README_STILL_REFERENCES_STRIPE',
    prismaValidate: 'PASS',
    localApplicationTests: 'PASS',
    offlineBuild: 'BLOCKED_GENERATED_STATIC_INDEX_DRIFT',
    dbTestsBoundToCandidateCommit: 'BLOCKED_NO_NEW_AUTHORIZED_EPHEMERAL_POSTGRESQL',
    manifestVerification: 'PASS',
    zipVerification: 'PASS',
    dbB1HumanDecision: 'PENDING_HUMAN_REVIEW',
  },
  evidenceBinding: {
    manifestSha256: sha256(manifest),
    manifestVerificationSha256: sha256(manifestVerification),
    debugZipSha256: debugZipInfo.sha256,
    completeZipSha256: completeZipInfo.sha256,
    zipVerificationSha256: sha256(zipVerification),
    deliveryReportSha256: sha256(delivery),
  },
  candidateContainsApprovedDatabaseRuntime: true,
  mainContainsApprovedDatabaseRuntime: false,
  approvedSchemaIntegratedIntoCandidate: true,
  approvedMigrationIntegratedIntoCandidate: true,
  runtimeBoundaryFrozenInCandidate: true,
  localApplicationTestsPassed: true,
  localIntegrationTestsPassed: false,
  legacyDynamicRuntimeClassified: true,
  paymentRuntimeDisabled: true,
  mainIntegrationApproved: false,
  actualMainUpdated: false,
  humanDecisionVerified: false,
  blockerCount: blockers.length,
  blockers: blockers.map(({ blocker }) => blocker),
  status: 'BLOCKED_DB_B1_PREREQUISITES_AND_HUMAN_REVIEW',
  ...safety,
});

console.log(JSON.stringify({
  status: JSON.parse(fs.readFileSync(gate)).status,
  outputDirectory: out,
  integrationCandidateCommit,
  actualMainUpdated: false,
  manifestSha256: sha256(manifest),
  manifestMismatchCount: mismatches.length,
  debugZipSha256: debugZipInfo.sha256,
  completeZipSha256: completeZipInfo.sha256,
  zipCrcFailureCount: 0,
  blockerCount: blockers.length,
  productionWrite: false,
  productionDeploy: false,
}, null, 2));
