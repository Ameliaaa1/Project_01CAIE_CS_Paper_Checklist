"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { parseStrictJson } = require("../promotion-validator/strict-json");
const { canonicalize, evidenceProjection, sha256 } = require("../promotion-validator/hash");
const { assertRepositoryPath } = require("../promotion-validator/safe-path");
const { captureRemoteHistory } = require("../promotion-validator/remote-history");
const { loadBoundary, validateRepository } = require("../promotion-validator/validator");

const WORKFLOW_ID = "paperlens-pr06e-production-bootstrap";
const WORKFLOW_VERSION = "1.0.0";
const CANDIDATE_MANIFEST_PATH = "promotion/candidate/manifest.json";
const TARGET_MANIFEST_PATH = "promotion/target/manifest.json";
const PRODUCTION_MANIFEST_PATH = "promotion/production/manifest.json";
const RUNTIME_PATH = "promotion/target/evidence/pr06e-runtime-remote-history.json";
const PREFLIGHT_EVIDENCE_PATH = "promotion/target/evidence/pr06e-target-preflight-validation.json";
const PREFLIGHT_REPORT_PATH = "promotion/target/evidence/pr06e-preflight-report.json";
const APPROVAL_PATH = "promotion/target/evidence/pr06e-bootstrap-approval.json";
const POST_REVIEW_EVIDENCE_PATH = "promotion/target/evidence/pr06e-target-post-review-validation.json";

function bootstrapError(code, message, objectPath = null) {
  const error = new Error(message);
  error.code = code;
  error.objectPath = objectPath;
  return error;
}

function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function assertUtc(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || Number.isNaN(Date.parse(value))) throw bootstrapError("PR06E_TIMESTAMP_INVALID", `${name} must be an exact UTC timestamp`);
}

function readJson(root, relative, prefix = null) {
  const absolute = assertRepositoryPath(root, relative, { mustExist: true, ...(prefix ? { prefix } : {}) });
  const bytes = fs.readFileSync(absolute);
  return { absolute, bytes, value: parseStrictJson(bytes), sha256: sha256(bytes) };
}

function pathExists(root, relative) {
  const absolute = assertRepositoryPath(root, relative, { mustExist: false });
  try { fs.lstatSync(absolute); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

function assertProductionAbsent(root) {
  if (pathExists(root, PRODUCTION_MANIFEST_PATH) || pathExists(root, "promotion/production")) throw bootstrapError("PR06E_PRODUCTION_ALREADY_PRESENT", "Production authority must be absent before Bootstrap", PRODUCTION_MANIFEST_PATH);
}

function assertClean(root) {
  const { execFileSync } = require("child_process");
  const output = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (output.trim()) throw bootstrapError("PR06E_WORKTREE_NOT_CLEAN", "PR-06E authority transition requires a clean worktree");
}

function identity(manifest) {
  return { artifact: { artifactId: manifest.artifact.artifactId, artifactVersion: manifest.artifact.artifactVersion, sizeBytes: manifest.artifact.sizeBytes, sha256: manifest.artifact.sha256, recordCount: manifest.artifact.recordCount, stableIdSetSha256: manifest.artifact.stableIdSetSha256 }, scope: manifest.scope, schema: manifest.schema, provenance: { sourceCommit: manifest.provenance.sourceCommit, generator: manifest.provenance.generator } };
}

function evidenceFor(manifest, options) {
  return {
    schemaVersion: 2,
    evidenceId: options.evidenceId,
    validator: { id: "paperlens-promotion-gate-validator", version: "1.0.0", contractVersion: 4 },
    phase: options.phase,
    result: options.result,
    manifest: { role: manifest.authorityRole, lifecycleState: options.lifecycleState, path: options.manifestPath, sha256: "0".repeat(64) },
    artifact: { artifactId: manifest.artifact.artifactId, artifactVersion: manifest.artifact.artifactVersion, path: options.artifactPath || manifest.artifact.artifactPath, sizeBytes: manifest.artifact.sizeBytes, sha256: manifest.artifact.sha256, recordCount: manifest.artifact.recordCount, stableIdSetSha256: manifest.artifact.stableIdSetSha256 },
    schema: { id: manifest.schema.artifactSchemaId, version: manifest.schema.artifactSchemaVersion, path: manifest.schema.artifactSchemaPath, sha256: manifest.schema.artifactSchemaSha256 },
    scope: { supportedSyllabi: manifest.scope.supportedSyllabi, sha256: manifest.scope.scopeSha256 },
    sourceCommit: manifest.provenance.sourceCommit,
    generatedAt: options.generatedAt,
    supersedes: options.supersedes || null,
    findings: [{ code: options.findingCode, severity: "INFO", message: options.findingMessage, path: options.artifactPath || manifest.artifact.artifactPath }],
  };
}

function bindManifestEvidence(manifest, evidence, evidencePath, result, validatedAt) {
  manifest.validation = { result, validatedAt, evidencePath, evidenceProjectionProfile: "paperlens-evidence-binding-v1", evidenceProjectionSha256: sha256(evidenceProjection(evidence)) };
  const manifestBytes = jsonBytes(manifest);
  evidence.manifest.sha256 = sha256(manifestBytes);
  return { manifest, manifestBytes, evidence, evidenceBytes: jsonBytes(evidence) };
}

function writeNew(root, relative, bytes) {
  const absolute = assertRepositoryPath(root, relative, { mustExist: false });
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, bytes, { flag: "wx" });
}

function replaceExact(root, relative, expectedSha256, bytes) {
  const current = readJson(root, relative);
  if (current.sha256 !== expectedSha256) throw bootstrapError("PR06E_TARGET_MANIFEST_DRIFT", "Target manifest does not match the approved input boundary", relative);
  const temporary = `${relative}.pr06e-new`;
  const tempAbsolute = assertRepositoryPath(root, temporary, { mustExist: false });
  fs.writeFileSync(tempAbsolute, bytes, { flag: "wx" });
  fs.renameSync(tempAbsolute, current.absolute);
}

function buildFreshTarget(options) {
  const root = path.resolve(options.root);
  assertUtc(options.capturedAt, "capturedAt");
  if (!/^[A-Za-z0-9._-]+$/.test(options.promotionId || "")) throw bootstrapError("PR06E_PROMOTION_ID_INVALID", "promotionId is required and must use safe characters");
  assertProductionAbsent(root);
  assertClean(root);
  const candidate = readJson(root, CANDIDATE_MANIFEST_PATH);
  const target = readJson(root, TARGET_MANIFEST_PATH);
  if (options.expectedTargetManifestSha256 && target.sha256 !== options.expectedTargetManifestSha256) throw bootstrapError("PR06E_TARGET_MANIFEST_DRIFT", "Target manifest SHA does not match approved PR-06D package", TARGET_MANIFEST_PATH);
  if (candidate.value.authorityRole !== "candidate" || target.value.authorityRole !== "promotion-target" || target.value.lifecycleState !== "READY_FOR_HUMAN_REVIEW" || target.value.promotion.mode !== "bootstrap") throw bootstrapError("PR06E_TARGET_STATE_INVALID", "Target is not the approved Bootstrap pre-review package");
  if (canonicalize(identity(candidate.value)) !== canonicalize(identity(target.value))) throw bootstrapError("PR06E_CANDIDATE_TARGET_IDENTITY_DRIFT", "Candidate and Target identity differ");
  const artifact = fs.readFileSync(assertRepositoryPath(root, target.value.artifact.artifactPath, { mustExist: true, prefix: "promotion/target/artifacts/" }));
  if (artifact.length !== target.value.artifact.sizeBytes || sha256(artifact) !== target.value.artifact.sha256) throw bootstrapError("PR06E_TARGET_ARTIFACT_DRIFT", "Target artifact bytes drifted");
  for (const relative of [RUNTIME_PATH, PREFLIGHT_EVIDENCE_PATH, PREFLIGHT_REPORT_PATH, APPROVAL_PATH, POST_REVIEW_EVIDENCE_PATH]) if (pathExists(root, relative)) throw bootstrapError("PR06E_OUTPUT_EXISTS", `PR-06E output already exists: ${relative}`, relative);
  const boundary = loadBoundary(root);
  const runtime = options.runtimeRemoteHistory || captureRemoteHistory(root, boundary.contract, { promotionId: options.promotionId, now: () => new Date(options.capturedAt), execGit: options.execGit });
  if (runtime.promotionSessionId !== options.promotionId || runtime.evidencePurpose !== "RUNTIME_PROMOTION") throw bootstrapError("PR06E_RUNTIME_BINDING_INVALID", "Fresh runtime evidence does not bind the Promotion session");
  const runtimeBytes = jsonBytes(runtime);
  const next = clone(target.value);
  next.lifecycleState = "READY_FOR_HUMAN_REVIEW";
  next.promotion = { ...next.promotion, approvalEvidencePath: null, approvalEvidenceSha256: null, runtimeRemoteHistoryEvidencePath: RUNTIME_PATH, runtimeRemoteHistoryEvidenceSha256: sha256(runtimeBytes), reviewDecision: "PENDING", reviewer: null, reviewedAt: null, promotionId: options.promotionId };
  const oldEvidence = readJson(root, target.value.validation.evidencePath, "promotion/target/evidence/");
  const evidence = evidenceFor(next, { evidenceId: `${options.promotionId}-target-preflight`, phase: "target-pre-review", result: "READY_FOR_HUMAN_REVIEW", lifecycleState: "READY_FOR_HUMAN_REVIEW", manifestPath: TARGET_MANIFEST_PATH, generatedAt: options.capturedAt, supersedes: { evidencePath: target.value.validation.evidencePath, evidenceSha256: oldEvidence.sha256 }, findingCode: "PR06E_FRESH_RUNTIME_PREFLIGHT", findingMessage: "Target rebound to a fresh runtime Promotion session without artifact identity drift" });
  const bound = bindManifestEvidence(next, evidence, PREFLIGHT_EVIDENCE_PATH, "READY_FOR_HUMAN_REVIEW", options.capturedAt);
  return { root, promotionId: options.promotionId, capturedAt: options.capturedAt, inputTargetSha256: target.sha256, candidateManifestSha256: candidate.sha256, artifactSha256: next.artifact.sha256, runtime, runtimeBytes, ...bound };
}

function writeFreshTarget(result) {
  writeNew(result.root, RUNTIME_PATH, result.runtimeBytes);
  writeNew(result.root, PREFLIGHT_EVIDENCE_PATH, result.evidenceBytes);
  replaceExact(result.root, TARGET_MANIFEST_PATH, result.inputTargetSha256, result.manifestBytes);
  const validation = validateRepository({ root: result.root, intent: "bootstrap-pre-review" });
  if (validation.result !== "READY_FOR_HUMAN_REVIEW" || validation.exitCode !== 0) throw bootstrapError("PR06E_PREFLIGHT_BLOCKED", JSON.stringify(validation));
  const report = {
    schemaVersion: 1,
    task: "PR06E_FIRST_PRODUCTION_BOOTSTRAP_PREFLIGHT",
    result: "READY_PR06E_FIRST_PRODUCTION_BOOTSTRAP_FOR_HUMAN_REVIEW",
    generatedAt: result.capturedAt,
    promotionId: result.promotionId,
    candidateManifestSha256: result.candidateManifestSha256,
    inputTargetManifestSha256: result.inputTargetSha256,
    targetManifestSha256: sha256(result.manifestBytes),
    targetArtifactSha256: result.artifactSha256,
    runtimeEvidence: { path: RUNTIME_PATH, sha256: sha256(result.runtimeBytes), remoteCommitSHA: result.runtime.remoteCommitSHA, promotionSessionId: result.runtime.promotionSessionId },
    targetValidationEvidence: { path: PREFLIGHT_EVIDENCE_PATH, sha256: sha256(result.evidenceBytes) },
    expectedProduction: { artifactSha256: result.artifactSha256, manifestRole: "current-production", lifecycleState: "PRODUCTION_CURRENT" },
    validation,
    safety: { productionManifestCreated: false, productionWrite: false, promotionExecuted: false, approvalEvidenceCreated: false },
  };
  const reportBytes = jsonBytes(report);
  writeNew(result.root, PREFLIGHT_REPORT_PATH, reportBytes);
  return { ...result, report, reportBytes };
}

function prepareFreshTarget(options) { return writeFreshTarget(buildFreshTarget(options)); }

function approveTarget(options) {
  const root = path.resolve(options.root);
  assertUtc(options.reviewedAt, "reviewedAt");
  assertProductionAbsent(root);
  assertClean(root);
  const target = readJson(root, TARGET_MANIFEST_PATH);
  if (target.sha256 !== options.expectedTargetManifestSha256) throw bootstrapError("PR06E_TARGET_MANIFEST_DRIFT", "Preflight Target manifest does not match human-approved SHA", TARGET_MANIFEST_PATH);
  if (target.value.lifecycleState !== "READY_FOR_HUMAN_REVIEW" || target.value.promotion.reviewDecision !== "PENDING" || target.value.promotion.promotionId !== options.promotionId) throw bootstrapError("PR06E_TARGET_NOT_REVIEWABLE", "Target is not the requested fresh pre-execution session");
  for (const relative of [APPROVAL_PATH, POST_REVIEW_EVIDENCE_PATH]) if (pathExists(root, relative)) throw bootstrapError("PR06E_OUTPUT_EXISTS", `Approval output already exists: ${relative}`, relative);
  const candidate = readJson(root, CANDIDATE_MANIFEST_PATH);
  const approval = { schemaVersion: 1, decision: "APPROVE", reviewer: options.reviewer, reviewedAt: options.reviewedAt, promotionId: options.promotionId, candidateArtifactSha256: candidate.value.artifact.sha256, targetArtifactSha256: target.value.artifact.sha256, sourceCommit: target.value.provenance.sourceCommit };
  const approvalBytes = jsonBytes(approval);
  const next = clone(target.value);
  next.lifecycleState = "APPROVED_FOR_EXECUTION";
  next.promotion = { ...next.promotion, approvalEvidencePath: APPROVAL_PATH, approvalEvidenceSha256: sha256(approvalBytes), reviewDecision: "APPROVE", reviewer: options.reviewer, reviewedAt: options.reviewedAt };
  const evidence = evidenceFor(next, { evidenceId: `${options.promotionId}-target-post-review`, phase: "target-post-review", result: "PROMOTION_TARGET_VALIDATION_PASS", lifecycleState: "APPROVED_FOR_EXECUTION", manifestPath: TARGET_MANIFEST_PATH, generatedAt: options.reviewedAt, findingCode: "PR06E_EXECUTION_HUMAN_APPROVED", findingMessage: "Exact fresh-session Target approved for first Production Bootstrap execution" });
  const bound = bindManifestEvidence(next, evidence, POST_REVIEW_EVIDENCE_PATH, "PROMOTION_TARGET_VALIDATION_PASS", options.reviewedAt);
  writeNew(root, APPROVAL_PATH, approvalBytes);
  writeNew(root, POST_REVIEW_EVIDENCE_PATH, bound.evidenceBytes);
  replaceExact(root, TARGET_MANIFEST_PATH, target.sha256, bound.manifestBytes);
  const validation = validateRepository({ root, intent: "bootstrap-post-review" });
  if (validation.result !== "PROMOTION_TARGET_VALIDATION_PASS" || validation.exitCode !== 0) throw bootstrapError("PR06E_POST_REVIEW_BLOCKED", JSON.stringify(validation));
  return { root, approval, approvalBytes, ...bound, validation, targetManifestSha256: sha256(bound.manifestBytes) };
}

function nonPromotionMetadata() { return { mode: null, baselineProductionSha256: null, differenceRequestPath: null, differenceRequestSha256: null, approvalEvidencePath: null, approvalEvidenceSha256: null, runtimeRemoteHistoryEvidencePath: null, runtimeRemoteHistoryEvidenceSha256: null, reviewDecision: "NOT_APPLICABLE", reviewer: null, reviewedAt: null, promotionId: null }; }

function buildProduction(options) {
  const root = path.resolve(options.root);
  assertUtc(options.executedAt, "executedAt");
  assertProductionAbsent(root);
  assertClean(root);
  const target = readJson(root, TARGET_MANIFEST_PATH);
  if (target.sha256 !== options.expectedApprovedTargetManifestSha256) throw bootstrapError("PR06E_APPROVED_TARGET_DRIFT", "Approved Target manifest SHA drifted before execution", TARGET_MANIFEST_PATH);
  const postReview = validateRepository({ root, intent: "bootstrap-post-review" });
  if (postReview.result !== "PROMOTION_TARGET_VALIDATION_PASS" || postReview.exitCode !== 0) throw bootstrapError("PR06E_EXECUTION_NOT_AUTHORIZED", JSON.stringify(postReview));
  const targetArtifact = fs.readFileSync(assertRepositoryPath(root, target.value.artifact.artifactPath, { mustExist: true, prefix: "promotion/target/artifacts/" }));
  const history = readJson(root, target.value.provenance.manifestHistoryEvidence.evidencePath, "promotion/target/evidence/");
  const artifactPath = "promotion/production/artifacts/question-corpus-v1.json";
  const historyPath = "promotion/production/evidence/manifest-history.json";
  const validationPath = "promotion/production/evidence/validation.json";
  const manifest = clone(target.value);
  manifest.authorityRole = "current-production";
  manifest.lifecycleState = "PRODUCTION_CURRENT";
  manifest.artifact.artifactPath = artifactPath;
  manifest.provenance.manifestHistoryEvidence = { evidencePath: historyPath, evidenceSha256: history.sha256 };
  manifest.promotion = nonPromotionMetadata();
  const evidence = evidenceFor(manifest, { evidenceId: `${options.executionId}-production-validation`, phase: "current-production", result: "PASS", lifecycleState: "PRODUCTION_CURRENT", manifestPath: PRODUCTION_MANIFEST_PATH, artifactPath, generatedAt: options.executedAt, findingCode: "PR06E_FIRST_PRODUCTION_BOOTSTRAP_EXECUTED", findingMessage: `First Production Bootstrap executed by ${options.executor} under ${options.executionId}` });
  const bound = bindManifestEvidence(manifest, evidence, validationPath, "PASS", options.executedAt);
  const execution = { schemaVersion: 1, task: "PR06E_FIRST_PRODUCTION_BOOTSTRAP_EXECUTION", result: "PASS_PR06E_PRODUCTION_BOOTSTRAP_EXECUTED", executionId: options.executionId, executor: options.executor, executedAt: options.executedAt, promotionId: target.value.promotion.promotionId, approvedTargetManifestSha256: target.sha256, productionManifestSha256: sha256(bound.manifestBytes), productionArtifactSha256: sha256(targetArtifact), productionValidationEvidenceSha256: sha256(bound.evidenceBytes), sourceCommit: target.value.provenance.sourceCommit, productionWrite: true, deploymentExecuted: false, databaseMigration: false };
  const files = new Map([[artifactPath, targetArtifact], [historyPath, history.bytes], [validationPath, bound.evidenceBytes], ["promotion/production/evidence/pr06e-bootstrap-execution.json", jsonBytes(execution)], [PRODUCTION_MANIFEST_PATH, bound.manifestBytes]]);
  return { root, target, postReview, files, execution, ...bound };
}

function writeProduction(result) {
  const stagingName = `.pr06e-production-staging-${result.execution.executionId}`;
  const stagingRoot = assertRepositoryPath(result.root, `promotion/${stagingName}`, { mustExist: false });
  const productionRoot = assertRepositoryPath(result.root, "promotion/production", { mustExist: false });
  if (fs.existsSync(stagingRoot) || fs.existsSync(productionRoot)) throw bootstrapError("PR06E_PRODUCTION_PATH_CONFLICT", "Production or staging path already exists");
  fs.mkdirSync(stagingRoot);
  for (const [relative, bytes] of result.files) {
    const suffix = relative.replace(/^promotion\/production\//, "");
    const absolute = path.join(stagingRoot, suffix);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, bytes, { flag: "wx" });
  }
  fs.renameSync(stagingRoot, productionRoot);
  const validation = validateRepository({ root: result.root, intent: "current-production" });
  if (validation.result !== "PASS" || validation.exitCode !== 0) throw bootstrapError("PR06E_POST_PROMOTION_VALIDATION_BLOCKED", JSON.stringify(validation));
  return { ...result, validation };
}

function executeProduction(options) { return writeProduction(buildProduction(options)); }

module.exports = { APPROVAL_PATH, POST_REVIEW_EVIDENCE_PATH, PREFLIGHT_EVIDENCE_PATH, PREFLIGHT_REPORT_PATH, PRODUCTION_MANIFEST_PATH, RUNTIME_PATH, TARGET_MANIFEST_PATH, WORKFLOW_ID, WORKFLOW_VERSION, approveTarget, bootstrapError, buildFreshTarget, buildProduction, executeProduction, jsonBytes, prepareFreshTarget, writeFreshTarget, writeProduction };
