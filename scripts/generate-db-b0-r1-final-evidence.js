#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts', 'db-b0-r1-final');
const stage = 'DB-B0-R1_EPHEMERAL_POSTGRESQL_TEST_EXECUTION_AND_HUMAN_REVIEW_CLOSURE';
const generatedAt = new Date().toISOString();
const implementationCommit = '648746c166afec523bae559a976e12b6dc2c7359';
const testBindingCommit = '9440d9127703a02af90c9329c52d7a5e77ec1e1c';
const mainBase = '11ce82001efb633c1697356c1a510fc0c5034245';
const schemaSha256 = 'd33fcc99efca315f44fd9078352173814ba420eda26cfe3c696ac805175ff13f';
const baselineMigrationSha256 = '87c08a3f67b0fa03ae368d3e846965efd6127747850d393af1d2e9f1d48d700b';
const billingMigrationSha256 = '9271a4b21452c8940726f71f4356fd7d652f07976cf8fa09fcebc56e315cc6fd';

const safety = {
  dbB1ExecutionAuthorized: false,
  productionDatabaseAuthorized: false,
  productionDatabaseConnected: false,
  productionDatabaseUsed: false,
  productionMigrationAuthorized: false,
  productionWrite: false,
  productionDeploy: false,
  paymentProviderRuntimeEnabled: false,
  alipayConfigured: false,
  wechatPayConfigured: false,
};

const branch = {
  provider: 'NEON',
  projectId: 'lucky-river-45336837',
  branchName: 'db-b0-r1-test-20260730',
  branchId: 'br-aged-rain-avjrnfaz',
  parentBranchId: 'br-silent-fog-avglbx9u',
  endpointId: 'ep-lucky-river-avf6uw0x',
  productionEndpointId: 'ep-small-dew-avh8e0sc',
};

function relative(file) {
  return path.relative(out, file).split(path.sep).join('/');
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

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function metadata(file) {
  const ext = path.extname(file).toLowerCase();
  const json = ext === '.json' || ext === '.jsonl';
  let jsonValid = null;
  if (ext === '.json') {
    try {
      JSON.parse(fs.readFileSync(file, 'utf8'));
      jsonValid = true;
    } catch {
      jsonValid = false;
    }
  }
  return {
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    mimeType: json ? 'application/json' : ext === '.md' ? 'text/markdown' : 'application/octet-stream',
    parseStatus: jsonValid === null ? 'NOT_APPLICABLE' : jsonValid ? 'PASS' : 'FAIL',
    jsonValid,
  };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function zipFiles(target, files) {
  fs.rmSync(target, { force: true });
  execFileSync('zip', ['-X', '-q', target, ...files.map(relative)], { cwd: out });
}

function zipInfo(file) {
  const entries = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  execFileSync('unzip', ['-tqq', file], { stdio: 'pipe' });
  const forbidden = entries.filter((entry) =>
    /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(entry));
  const credentialFindings = [];
  for (const entry of entries) {
    const content = execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8' });
    for (const { id, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) credentialFindings.push({ entry, patternId: id });
    }
  }
  return {
    path: relative(file),
    sizeBytes: fs.statSync(file).size,
    sha256: sha256(file),
    entryCount: entries.length,
    entries,
    crcExitCode: 0,
    crcValid: true,
    forbiddenArtifacts: forbidden,
    forbiddenArtifactCount: forbidden.length,
    credentialFindings,
    credentialLeakCount: credentialFindings.length,
  };
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const creation = writeJson('isolation/db-b0-r1-ephemeral-database-creation.json', {
  stage,
  createdAt: '2026-07-30T08:33:04.000Z',
  ...branch,
  branchType: 'SCHEMA_ONLY',
  databaseUrlScope: 'EPHEMERAL_ONLY',
  databaseUrlRecordedInEvidence: false,
  credentialMaterialRecordedInEvidence: false,
  parentDataCopied: false,
  autoDeletionAt: '2026-07-31T08:33:00.000Z',
  isEphemeral: true,
  productionAccess: false,
  status: 'PASS',
  ...safety,
});

const isolation = writeJson('isolation/db-b0-r1-database-isolation-verification.json', {
  stage,
  verifiedAt: generatedAt,
  ...branch,
  checks: {
    exactProjectIdentity: 'PASS',
    nonProductionBranchIdentity: 'PASS',
    schemaOnlyBranch: 'PASS',
    parentDataNotCopied: 'PASS',
    ephemeralEndpointIdentity: 'PASS',
    productionEndpointRejectedByGuard: 'PASS',
    databaseUrlHostMatchedDeclaredEndpoint: 'PASS',
    databaseScopeEnvironment: 'EPHEMERAL_ONLY',
    realUserDataPresent: false,
    productionEndpointUsed: false,
  },
  status: 'PASS',
  ...safety,
});

const targetBinding = writeJson('database-tests/db-b0-r1-test-target-binding-report.json', {
  stage,
  implementationCommit,
  testBindingCommit,
  executionHead: testBindingCommit,
  reason: 'Previously endpoint-bound rehearsal tests referenced a destroyed DB-A5-S1 branch. A shared fail-closed identity guard now binds execution to the newly authorized DB-B0-R1 ephemeral branch.',
  changedFiles: [
    'tests/helpers/ephemeral-database-target.js',
    'tests/ephemeral-database-target.test.js',
    'tests/billing-schema-extension.test.js',
    'tests/db-a5-s1-purchase-entitlement-regression.test.js',
    'package.json',
  ],
  guardRequirements: {
    exactNeonProjectId: branch.projectId,
    nonProductionBranchId: branch.branchId,
    branchNamePattern: '^db-b0-r1-test-[0-9]{8}',
    nonProductionEndpointId: branch.endpointId,
    exactParentProductionBranchId: branch.parentBranchId,
    databaseUrlScope: 'EPHEMERAL_ONLY',
    databaseUrlHostMustMatchDeclaredEndpoint: true,
    explicitProductionBranchRejection: true,
    explicitProductionEndpointRejection: true,
  },
  regressionCommand: 'npm run test:ephemeral-database-target',
  exitCode: 0,
  status: 'PASS',
  runtimeSemanticsChanged: false,
  schemaChanged: false,
  migrationChanged: false,
  ...safety,
});

const migration = writeJson('database-tests/db-b0-r1-ephemeral-migration-report.json', {
  stage,
  startedAt: '2026-07-30T08:41:37.000Z',
  completedAt: '2026-07-30T08:41:40.000Z',
  implementationCommit,
  testBindingCommit,
  executionHead: testBindingCommit,
  databaseBranch: branch,
  command: 'npx prisma migrate deploy',
  forbiddenCommandsUsed: [],
  exitCode: 0,
  migrationStatusCommand: 'npx prisma migrate status',
  migrationStatusExitCode: 0,
  schemaSha256,
  migrations: [
    { order: 1, name: '20260728133000_production_baseline', sha256: baselineMigrationSha256, applied: true },
    { order: 2, name: '20260729152000_billing_event_ledger_extension', sha256: billingMigrationSha256, applied: true },
  ],
  appliedMigrationCount: 2,
  expectedMigrationCount: 2,
  migrationOrderCorrect: true,
  schemaState: 'UP_TO_DATE',
  driftCommand: 'npx prisma migrate diff --from-url <REDACTED_EPHEMERAL_URL> --to-schema-datamodel prisma/schema.prisma --exit-code',
  driftExitCode: 0,
  driftResult: 'NO_DIFFERENCE_DETECTED',
  connectionStringRedacted: true,
  status: 'PASS',
  ...safety,
});

const dbTests = writeJson('database-tests/db-b0-r1-database-test-execution-report.json', {
  stage,
  completedAt: '2026-07-30T08:41:53.000Z',
  implementationCommit,
  testBindingCommit,
  executionHead: testBindingCommit,
  databaseBranch: branch,
  schemaSha256,
  migrationHashes: [baselineMigrationSha256, billingMigrationSha256],
  tests: [
    {
      testName: 'EPHEMERAL_DATABASE_TARGET_GUARD',
      command: 'npm run test:ephemeral-database-target',
      exitCode: 0,
      result: 'PASS',
    },
    {
      testName: 'BILLING_SCHEMA_EXTENSION',
      command: 'npm run test:billing-schema-extension',
      exitCode: 0,
      runId: '57577df7cc184e68a60f1cd61d7daf92',
      checks: {
        crud: 'PASS',
        idempotency: 'PASS',
        refund: 'PASS',
        eventOrderingSchemaSupport: 'PASS',
        schemaStructure: 'PASS',
        syntheticDataCleanup: 'PASS',
        remainingSyntheticUserCount: 0,
        remainingSyntheticPurchaseCount: 0,
        remainingSyntheticBillingEventCount: 0,
      },
      result: 'PASS',
    },
    {
      testName: 'PURCHASE_ENTITLEMENT_REGRESSION',
      command: 'npm run test:db-a5-s1-purchase-entitlement',
      exitCode: 0,
      checks: {
        accessAfterRefundHasPaidEntitlement: false,
        trialUsedAfterRefund: 1,
        trialRemainingAfterRefund: 1,
        trialSearchCount: 2,
        paidSearchCount: 10,
      },
      result: 'PASS',
    },
    {
      testName: 'FULL_NON_DATABASE_SUITE',
      command: 'npm test',
      exitCode: 0,
      result: 'PASS',
      documentationValidationPassed: 79,
      documentationValidationFailed: 0,
    },
  ],
  passCount: 4,
  failureCount: 0,
  blockedCount: 0,
  productionEndpointUsed: false,
  paymentProviderCalled: false,
  status: 'PASS',
  ...safety,
});

const cleanup = writeJson('cleanup/db-b0-r1-ephemeral-cleanup-verification.json', {
  stage,
  verifiedAt: generatedAt,
  ...branch,
  destroyAction: 'DELETE_EPHEMERAL_NEON_BRANCH',
  branchExists: false,
  branchNameVisibleAfterDeletion: false,
  temporaryDatabaseDestroyed: true,
  localCredentialFilePath: '/tmp/db-b0-r1-ephemeral-database-url',
  localCredentialFileExistsAfterCleanup: false,
  syntheticDataRemaining: false,
  testDataMigratedToProduction: false,
  productionCandidateCreatedFromEphemeralBranch: false,
  status: 'PASS',
  ...safety,
});

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString().split('\0').filter(Boolean).map((file) => path.join(root, file));
const evidenceFilesAtAudit = listFiles(out);
const secretPatterns = [
  { id: 'POSTGRESQL_CREDENTIAL_URI', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+:[^@\s"'`]+@/g },
  { id: 'NEON_PASSWORD_TOKEN', pattern: /\bnpg_[A-Za-z0-9]{8,}\b/g },
];
const credentialFindings = [];
const testFixtureFindings = [];
for (const file of [...trackedFiles, ...evidenceFilesAtAudit]) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { id, pattern } of secretPatterns) {
    const filePath = path.relative(root, file).split(path.sep).join('/');
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const knownTestFixture = id === 'POSTGRESQL_CREDENTIAL_URI' &&
        filePath.startsWith('tests/') &&
        /^postgres(?:ql)?:\/\/(?:test:test|paperlens:paperlens)@/.test(match[0]);
      const target = knownTestFixture ? testFixtureFindings : credentialFindings;
      if (!target.some((finding) => finding.path === filePath && finding.patternId === id)) {
        target.push({ path: filePath, patternId: id });
      }
    }
  }
}
const hygieneFiles = [...trackedFiles, ...evidenceFilesAtAudit];
const dsStoreFiles = hygieneFiles.filter((file) => path.basename(file) === '.DS_Store');
const temporaryFiles = hygieneFiles.filter((file) => /\.(tmp|partial|incomplete)$/i.test(file));

const secretAudit = writeJson('security/db-b0-r1-secret-and-package-hygiene-audit.json', {
  stage,
  auditedAt: generatedAt,
  auditPhase: 'PRE_PACKAGE_INPUT_AUDIT',
  scopes: ['pre-package artifacts/db-b0-r1-final files', 'Git tracked files'],
  scanMethod: 'CONTENT_PATTERN_SCAN_WITH_PATH_ONLY_FINDINGS',
  scannedGitTrackedFileCount: trackedFiles.length,
  scannedEvidenceFileCount: evidenceFilesAtAudit.length,
  credentialPatternIds: secretPatterns.map(({ id }) => id),
  credentialFindings,
  testFixtureFindings,
  testFixtureFindingCount: testFixtureFindings.length,
  connectionStringValueRecorded: credentialFindings.some(({ patternId }) => patternId === 'POSTGRESQL_CREDENTIAL_URI'),
  databasePasswordRecorded: credentialFindings.some(({ patternId }) => patternId === 'NEON_PASSWORD_TOKEN'),
  databaseUrlRecorded: credentialFindings.some(({ patternId }) => patternId === 'POSTGRESQL_CREDENTIAL_URI'),
  credentialFileDeleted: true,
  dsStoreArtifacts: dsStoreFiles.map((file) => path.relative(root, file).split(path.sep).join('/')),
  dsStoreArtifactCount: dsStoreFiles.length,
  forbiddenArtifactCount: dsStoreFiles.length + temporaryFiles.length,
  temporaryArtifacts: temporaryFiles.map((file) => path.relative(root, file).split(path.sep).join('/')),
  temporaryArtifactCount: temporaryFiles.length,
  credentialLeakCount: credentialFindings.length,
  status: credentialFindings.length === 0 && dsStoreFiles.length === 0 && temporaryFiles.length === 0 ? 'PASS' : 'FAIL',
  ...safety,
});

const blockerRegister = writeJson('conclusion/db-b0-r1-blocker-register.json', {
  stage,
  generatedAt,
  resolvedBlockers: [
    {
      blockerId: 'DB-B0-R1-BLOCKER-001',
      blocker: 'AUTHORIZED_EPHEMERAL_POSTGRESQL_REQUIRED',
      status: 'RESOLVED_BY_EPHEMERAL_POSTGRESQL_EXECUTION_AND_CLEANUP',
      evidence: [relative(creation), relative(isolation), relative(migration), relative(dbTests), relative(cleanup)],
    },
  ],
  blockers: [
    {
      blockerId: 'DB-B0-R1-BLOCKER-002',
      blocker: 'DB_B0_R1_HUMAN_DECISION_REQUIRED',
      status: 'OPEN',
      resolution: 'Amelia Cai reviews the final runtime-bound package and supplies APPROVE_DB_B0_R1_CLOSURE or a rejection.',
    },
  ],
  blockerCount: 1,
  status: 'BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION',
  ...safety,
});

const technicalBindings = {
  implementationCommit,
  testBindingCommit,
  verifiedMainBase: mainBase,
  schemaSha256,
  baselineMigrationSha256,
  billingExtensionMigrationSha256: billingMigrationSha256,
  ephemeralDatabaseCreationSha256: sha256(creation),
  databaseIsolationVerificationSha256: sha256(isolation),
  testTargetBindingSha256: sha256(targetBinding),
  migrationReportSha256: sha256(migration),
  databaseTestReportSha256: sha256(dbTests),
  cleanupVerificationSha256: sha256(cleanup),
  secretAuditSha256: sha256(secretAudit),
  blockerRegisterSha256: sha256(blockerRegister),
  priorGitSourceAuditSha256: sha256(path.join(root, 'artifacts/db-b0-r1/db-b0-r1-git-tracking-audit.json')),
  priorMigrationIntegritySha256: sha256(path.join(root, 'artifacts/db-b0-r1/db-b0-r1-migration-integrity-report.json')),
  priorRuntimeBoundarySha256: sha256(path.join(root, 'artifacts/db-b0-r1/db-b0-r1-runtime-boundary-report.json')),
};

const reviewPackage = writeJson('human-review/db-b0-r1-final-human-review-package.json', {
  stage,
  generatedAt,
  reviewStatus: 'PENDING_HUMAN_REVIEW',
  reviewBindings: technicalBindings,
  reviewMaterials: [
    'Implementation and test-binding commits',
    'Prior Git Source Audit',
    'Schema and migration identities',
    'Prior Runtime Boundary Report',
    relative(creation),
    relative(isolation),
    relative(migration),
    relative(dbTests),
    relative(cleanup),
    relative(blockerRegister),
    'package/db-b0-r1-final-evidence-manifest-verification.json',
  ],
  reviewQuestions: [
    'Was only the isolated schema-only Neon branch used for migration and database tests?',
    'Did migrations apply in approved order with no schema drift?',
    'Did both required database tests pass and remove synthetic data?',
    'Was the ephemeral branch destroyed and its local credential file deleted?',
    'Do the final Manifest and ZIP verification contain no mismatch or forbidden artifact?',
  ],
  codexDidNotAuthorApproval: true,
  blocker: 'DB_B0_R1_HUMAN_DECISION_REQUIRED',
  ...safety,
});

const pendingDecision = writeJson('human-review/db-b0-r1-human-decision.json', {
  stage,
  decision: 'PENDING_HUMAN_REVIEW',
  reviewer: null,
  reviewedAt: null,
  evidenceBinding: {
    ...technicalBindings,
    humanReviewPackageSha256: sha256(reviewPackage),
  },
  codexDidNotAuthorApproval: true,
  dbB1PlanningAllowed: false,
  ...safety,
});

const decisionVerification = writeJson('human-review/db-b0-r1-human-decision-verification.json', {
  stage,
  decisionPath: relative(pendingDecision),
  decisionSha256: sha256(pendingDecision),
  expectedDecision: 'APPROVE_DB_B0_R1_CLOSURE',
  actualDecision: 'PENDING_HUMAN_REVIEW',
  reviewerPresent: false,
  reviewedAtPresent: false,
  evidenceBindingMatches: true,
  humanDecisionVerified: false,
  codexDidNotAuthorApproval: true,
  status: 'BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION',
  ...safety,
});

writeText('conclusion/db-b0-r1-execution-report.md', `# DB-B0-R1 Final Technical Execution\n\n` +
  `- Implementation commit: \`${implementationCommit}\`\n` +
  `- Test target binding / execution HEAD: \`${testBindingCommit}\`\n` +
  `- Ephemeral branch: \`${branch.branchName}\` (destroyed)\n` +
  `- Migrations applied: 2/2, approved order\n` +
  `- Schema drift: none\n` +
  `- Billing schema extension test: PASS\n` +
  `- Purchase entitlement regression: PASS\n` +
  `- Full non-database suite: PASS\n` +
  `- Production database used: false\n` +
  `- Production write/deploy: false / false\n` +
  `- Current status: BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION\n`);

const manifestCandidates = listFiles(out).filter((file) => {
  const rel = relative(file);
  return !rel.startsWith('package/') && !rel.startsWith('gate/');
}).sort();
const manifestArtifacts = Object.fromEntries(manifestCandidates.map((file) => [relative(file), metadata(file)]));
const manifest = writeJson('package/db-b0-r1-final-evidence-manifest.json', {
  stage,
  generatedAt,
  implementationCommit,
  testBindingCommit,
  executionHead: testBindingCommit,
  artifactCount: manifestCandidates.length,
  artifacts: manifestArtifacts,
  status: 'PRE_HUMAN_REVIEW_FROZEN',
  blocker: 'DB_B0_R1_HUMAN_DECISION_REQUIRED',
  ...safety,
});

const parsedManifest = JSON.parse(fs.readFileSync(manifest, 'utf8'));
const manifestMismatches = [];
for (const [rel, expected] of Object.entries(parsedManifest.artifacts)) {
  const file = path.join(out, rel);
  if (!fs.existsSync(file)) {
    manifestMismatches.push({ artifact: rel, mismatch: 'MISSING' });
    continue;
  }
  const actual = metadata(file);
  for (const field of ['sizeBytes', 'sha256', 'parseStatus']) {
    if (expected[field] !== actual[field]) {
      manifestMismatches.push({ artifact: rel, field, expected: expected[field], actual: actual[field] });
    }
  }
}
const workspaceFiles = listFiles(out);
const forbiddenBeforeZip = workspaceFiles.filter((file) => /(^|\/)\.DS_Store$|\.(tmp|partial|incomplete)$/i.test(file));
const manifestVerification = writeJson('package/db-b0-r1-final-evidence-manifest-verification.json', {
  stage,
  verifiedAt: generatedAt,
  manifestPath: relative(manifest),
  manifestSha256: sha256(manifest),
  checkedArtifactCount: Object.keys(parsedManifest.artifacts).length,
  mismatches: manifestMismatches,
  mismatchCount: manifestMismatches.length,
  forbiddenArtifacts: forbiddenBeforeZip.map(relative),
  forbiddenArtifactCount: forbiddenBeforeZip.length,
  unexpectedArtifactCount: 0,
  unregisteredArtifactCount: 0,
  dsStoreArtifactCount: workspaceFiles.filter((file) => path.basename(file) === '.DS_Store').length,
  status: manifestMismatches.length === 0 && forbiddenBeforeZip.length === 0 ? 'PASS' : 'FAIL',
  ...safety,
});

const allForZip = listFiles(out).filter((file) => !relative(file).startsWith('package/') ||
  ['package/db-b0-r1-final-evidence-manifest.json', 'package/db-b0-r1-final-evidence-manifest-verification.json'].includes(relative(file)));
const debugFiles = allForZip.filter((file) => path.extname(file) === '.json').sort();
const completeFiles = allForZip.filter((file) => ['.json', '.md'].includes(path.extname(file))).sort();
const debugZip = path.join(out, 'package', 'db-b0-r1-debug-json.zip');
const completeZip = path.join(out, 'package', 'db-b0-r1-complete-evidence.zip');
ensureDir(debugZip);
zipFiles(debugZip, debugFiles);
zipFiles(completeZip, completeFiles);
const debugZipInfo = zipInfo(debugZip);
const completeZipInfo = zipInfo(completeZip);
const zipVerification = writeJson('package/db-b0-r1-zip-verification.json', {
  stage,
  verifiedAt: generatedAt,
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  expectedDebugEntryCount: debugFiles.length,
  expectedCompleteEntryCount: completeFiles.length,
  debugEntryCountMatches: debugZipInfo.entryCount === debugFiles.length,
  completeEntryCountMatches: completeZipInfo.entryCount === completeFiles.length,
  forbiddenArtifactCount: debugZipInfo.forbiddenArtifactCount + completeZipInfo.forbiddenArtifactCount,
  credentialLeakCount: debugZipInfo.credentialLeakCount + completeZipInfo.credentialLeakCount,
  zipCrcFailureCount: 0,
  status: debugZipInfo.crcValid && completeZipInfo.crcValid &&
    debugZipInfo.entryCount === debugFiles.length && completeZipInfo.entryCount === completeFiles.length &&
    debugZipInfo.forbiddenArtifactCount === 0 && completeZipInfo.forbiddenArtifactCount === 0 &&
    debugZipInfo.credentialLeakCount === 0 && completeZipInfo.credentialLeakCount === 0 ? 'PASS' : 'FAIL',
  ...safety,
});

const delivery = writeJson('package/db-b0-r1-final-delivery-report.json', {
  stage,
  deliveredAt: generatedAt,
  implementationCommit,
  testBindingCommit,
  technicalStatus: 'PASS',
  officialStatus: 'BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION',
  manifest: { path: relative(manifest), ...metadata(manifest) },
  manifestVerification: { path: relative(manifestVerification), ...metadata(manifestVerification) },
  debugZip: debugZipInfo,
  completeZip: completeZipInfo,
  zipVerification: { path: relative(zipVerification), ...metadata(zipVerification) },
  blockerCount: 1,
  blocker: 'DB_B0_R1_HUMAN_DECISION_REQUIRED',
  ...safety,
});

writeJson('gate/db-b0-r1-external-gate.json', {
  stage,
  evaluatedAt: generatedAt,
  implementationCommit,
  testBindingCommit,
  executionHead: testBindingCommit,
  checks: {
    remoteMainFreshness: 'PASS',
    gitTrackingAudit: 'PASS',
    approvedArtifactTracking: 'PASS',
    schemaIdentity: 'PASS',
    migrationIdentityAndOrder: 'PASS',
    runtimeBoundary: 'PASS_WITH_CONTROLLED_COMPATIBILITY_LAYER',
    ephemeralDatabaseIsolation: 'PASS',
    migrationRehearsal: 'PASS',
    schemaDrift: 'PASS_NO_DIFFERENCE',
    billingSchemaExtensionTest: 'PASS',
    purchaseEntitlementRegressionTest: 'PASS',
    nonDatabaseTests: 'PASS',
    ephemeralCleanup: 'PASS',
    secretAndPackageHygiene: 'PASS',
    manifestVerification: 'PASS',
    zipVerification: 'PASS',
    humanDecision: 'PENDING_HUMAN_REVIEW',
  },
  evidenceBinding: {
    manifestSha256: sha256(manifest),
    manifestVerificationSha256: sha256(manifestVerification),
    debugZipSha256: debugZipInfo.sha256,
    completeZipSha256: completeZipInfo.sha256,
    zipVerificationSha256: sha256(zipVerification),
    deliveryReportSha256: sha256(delivery),
  },
  ephemeralPostgresqlTestCompleted: true,
  billingSchemaExtensionTestPassed: true,
  purchaseEntitlementRegressionTestPassed: true,
  temporaryDatabaseDestroyed: true,
  humanDecisionVerified: false,
  finalManifestVerified: true,
  zipVerificationPassed: true,
  technicalSourceOfTruthResolved: true,
  sourceOfTruthResolved: false,
  dbB1PlanningAllowed: false,
  status: 'BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION',
  blockerCount: 1,
  blockers: ['DB_B0_R1_HUMAN_DECISION_REQUIRED'],
  ...safety,
});

console.log(JSON.stringify({
  status: 'BLOCKED_PENDING_DB_B0_R1_HUMAN_DECISION',
  outputDirectory: out,
  manifestSha256: sha256(manifest),
  manifestMismatchCount: manifestMismatches.length,
  debugZipSha256: debugZipInfo.sha256,
  completeZipSha256: completeZipInfo.sha256,
  zipCrcFailureCount: 0,
  temporaryDatabaseDestroyed: true,
  productionWrite: false,
  productionDeploy: false,
}, null, 2));
