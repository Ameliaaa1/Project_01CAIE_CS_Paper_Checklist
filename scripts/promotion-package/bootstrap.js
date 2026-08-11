"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { parseStrictJson } = require("../promotion-validator/strict-json");
const { canonicalize, evidenceProjection, sha256 } = require("../promotion-validator/hash");
const { assertRepositoryPath } = require("../promotion-validator/safe-path");
const { captureRemoteHistory } = require("../promotion-validator/remote-history");
const { loadBoundary, validateRepository } = require("../promotion-validator/validator");

const WORKFLOW_ID = "paperlens-pr06d-bootstrap-package-generator";
const WORKFLOW_VERSION = "1.0.0";
const DEFAULT_SOURCE_PATH = "generated/production-question-index.json";
const CANDIDATE_MANIFEST_PATH = "promotion/candidate/manifest.json";
const TARGET_MANIFEST_PATH = "promotion/target/manifest.json";
const PRODUCTION_MANIFEST_PATH = "promotion/production/manifest.json";

function packageError(code, message, objectPath = null) {
  const error = new Error(message);
  error.code = code;
  error.objectPath = objectPath;
  return error;
}

function jsonBytes(value, pretty = true) {
  return Buffer.from(`${JSON.stringify(value, null, pretty ? 2 : 0)}\n`, "utf8");
}

function git(root, args) {
  try { return execFileSync("git", args, { cwd: root, encoding: args[0] === "show" ? null : "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }); }
  catch (error) { throw packageError("PACKAGE_GIT_BOUNDARY_FAILED", `git ${args.join(" ")} failed`); }
}

function assertUtc(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || Number.isNaN(Date.parse(value))) throw packageError("PACKAGE_TIMESTAMP_INVALID", "generatedAt must be an exact UTC timestamp ending in Z");
}

function lstatState(root, relative) {
  const absolute = assertRepositoryPath(root, relative, { mustExist: false });
  try { return fs.lstatSync(absolute); }
  catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function assertSourceAtCommit(root, sourcePath, sourceCommit, sourceBytes) {
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw packageError("PACKAGE_SOURCE_COMMIT_INVALID", "sourceCommit must be a lowercase full SHA");
  const type = String(git(root, ["cat-file", "-t", sourceCommit])).trim();
  if (type !== "commit") throw packageError("PACKAGE_SOURCE_COMMIT_NOT_COMMIT", "sourceCommit is not a commit");
  const committedBytes = git(root, ["show", `${sourceCommit}:${sourcePath}`]);
  if (!Buffer.from(committedBytes).equals(sourceBytes)) throw packageError("PACKAGE_SOURCE_BYTES_NOT_AT_COMMIT", "Source bytes do not match sourceCommit", sourcePath);
}

function sourceSyllabus(entry) {
  const fromStableId = typeof entry.canonicalQuestionId === "string" ? entry.canonicalQuestionId.match(/^(0478|9618)-/)?.[1] : null;
  const fromSyllabusId = typeof entry.syllabusId === "string" ? entry.syllabusId.match(/(0478|9618)$/)?.[1] : null;
  if (!fromStableId || !fromSyllabusId || fromStableId !== fromSyllabusId) throw packageError("PACKAGE_SOURCE_SYLLABUS_INVALID", `Cannot establish exact syllabus for ${entry.canonicalQuestionId || "unknown record"}`);
  return fromStableId;
}

function buildArtifact(source) {
  if (!source || source.schemaVersion !== "2.0" || source.dataSource !== "PRODUCTION_CANONICAL" || !Array.isArray(source.entries) || source.entries.length === 0 || source.entries.length !== source.questions) throw packageError("PACKAGE_SOURCE_INVALID", "Source must be the validated canonical question index");
  const seen = new Set();
  const records = source.entries.map((entry, sourceOrdinal) => {
    const stableId = entry.canonicalQuestionId;
    if (typeof stableId !== "string" || stableId.length === 0) throw packageError("PACKAGE_SOURCE_STABLE_ID_INVALID", "Every source entry requires canonicalQuestionId");
    if (seen.has(stableId)) throw packageError("PACKAGE_SOURCE_STABLE_ID_DUPLICATE", `Duplicate source stable ID: ${stableId}`);
    seen.add(stableId);
    return { stableId, syllabus: sourceSyllabus(entry), sourceOrdinal, sourceRecordSha256: sha256(Buffer.from(canonicalize(entry), "utf8")), sourceRecord: entry };
  });
  records.sort((left, right) => Buffer.compare(Buffer.from(left.stableId, "utf8"), Buffer.from(right.stableId, "utf8")));
  return { schemaVersion: 1, records };
}

function nonPromotionMetadata() {
  return { mode: null, baselineProductionSha256: null, differenceRequestPath: null, differenceRequestSha256: null, approvalEvidencePath: null, approvalEvidenceSha256: null, runtimeRemoteHistoryEvidencePath: null, runtimeRemoteHistoryEvidenceSha256: null, reviewDecision: "NOT_APPLICABLE", reviewer: null, reviewedAt: null, promotionId: null };
}

function artifactBinding(artifactBytes, artifact, artifactPath, artifactVersion) {
  const ids = artifact.records.map((record) => record.stableId);
  const scope = [...new Set(artifact.records.map((record) => record.syllabus))].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
  return {
    artifact: { artifactId: "paperlens-question-corpus", artifactVersion, artifactPath, sizeBytes: artifactBytes.length, sha256: sha256(artifactBytes), recordCount: artifact.records.length, stableIdSetSha256: sha256(Buffer.from(`${JSON.stringify(ids)}\n`, "utf8")) },
    scope: { supportedSyllabi: scope, scopeSha256: sha256(Buffer.from(`${JSON.stringify({ supportedSyllabi: scope })}\n`, "utf8")) },
  };
}

function validationEvidence({ role, lifecycleState, phase, result, manifestPath, artifact, scope, schema, sourceCommit, generatedAt, evidenceId }) {
  return {
    schemaVersion: 2,
    evidenceId,
    validator: { id: "paperlens-promotion-gate-validator", version: "1.0.0", contractVersion: 4 },
    phase,
    result,
    manifest: { role, lifecycleState, path: manifestPath, sha256: "0".repeat(64) },
    artifact: { artifactId: artifact.artifactId, artifactVersion: artifact.artifactVersion, path: artifact.artifactPath, sizeBytes: artifact.sizeBytes, sha256: artifact.sha256, recordCount: artifact.recordCount, stableIdSetSha256: artifact.stableIdSetSha256 },
    schema: { id: schema.artifactSchemaId, version: schema.artifactSchemaVersion, path: schema.artifactSchemaPath, sha256: schema.artifactSchemaSha256 },
    scope: { supportedSyllabi: scope.supportedSyllabi, sha256: scope.scopeSha256 },
    sourceCommit,
    generatedAt,
    supersedes: null,
    findings: [{ code: "PR06D_PACKAGE_GENERATED", severity: "INFO", message: "Package generated deterministically from the bound validated source", path: artifact.artifactPath }],
  };
}

function buildRole({ role, lifecycleState, phase, result, manifestPath, artifactPath, evidencePath, historyPath, artifactBytes, artifactObject, artifactVersion, schema, generator, sourceCommit, generatedAt, historyBytes, promotion, evidenceId }) {
  const bindings = artifactBinding(artifactBytes, artifactObject, artifactPath, artifactVersion);
  const evidence = validationEvidence({ role, lifecycleState, phase, result, manifestPath, artifact: bindings.artifact, scope: bindings.scope, schema, sourceCommit, generatedAt, evidenceId });
  const projectionSha256 = sha256(evidenceProjection(evidence));
  const manifest = {
    schemaVersion: 4,
    authorityRole: role,
    lifecycleState,
    artifact: bindings.artifact,
    scope: bindings.scope,
    schema,
    provenance: { sourceCommit, generatedAt, generator, manifestHistoryEvidence: { evidencePath: historyPath, evidenceSha256: sha256(historyBytes) } },
    validation: { result, validatedAt: generatedAt, evidencePath, evidenceProjectionProfile: "paperlens-evidence-binding-v1", evidenceProjectionSha256: projectionSha256 },
    promotion,
  };
  const manifestBytes = jsonBytes(manifest);
  evidence.manifest.sha256 = sha256(manifestBytes);
  return { manifest, manifestBytes, evidence, evidenceBytes: jsonBytes(evidence), ...bindings };
}

function buildBootstrapPackage(options) {
  const root = path.resolve(options.root);
  const sourcePath = options.sourcePath || DEFAULT_SOURCE_PATH;
  const sourceCommit = options.sourceCommit;
  const generatedAt = options.generatedAt;
  assertUtc(generatedAt);
  const sourceAbsolute = assertRepositoryPath(root, sourcePath, { mustExist: true });
  const sourceBytes = fs.readFileSync(sourceAbsolute);
  assertSourceAtCommit(root, sourcePath, sourceCommit, sourceBytes);
  const source = parseStrictJson(sourceBytes);
  const artifactObject = buildArtifact(source);
  const artifactBytes = jsonBytes(artifactObject, false);
  const artifactSha256 = sha256(artifactBytes);
  const promotionId = options.promotionId || `pr06d-bootstrap-${sourceCommit.slice(0, 12)}-${artifactSha256.slice(0, 12)}`;
  if (!/^[A-Za-z0-9._-]+$/.test(promotionId)) throw packageError("PACKAGE_PROMOTION_ID_INVALID", "promotionId contains unsupported characters");
  const boundary = loadBoundary(root);
  const runtimeRemoteHistory = options.runtimeRemoteHistory || captureRemoteHistory(root, boundary.contract, { promotionId, now: () => new Date(generatedAt), execGit: options.execGit });
  if (runtimeRemoteHistory.promotionSessionId !== promotionId) throw packageError("PACKAGE_RUNTIME_SESSION_MISMATCH", "Runtime history does not bind promotionId");
  const manifestHistory = { ...runtimeRemoteHistory, evidencePurpose: "MANIFEST_PROVENANCE", promotionSessionId: null };
  const historyBytes = jsonBytes(manifestHistory);
  const runtimeBytes = jsonBytes(runtimeRemoteHistory);
  const schemaEntry = boundary.registry.entries.find((entry) => entry.schemaId === "paperlens-question-corpus-records" && entry.version === 1);
  if (!schemaEntry) throw packageError("PACKAGE_ARTIFACT_SCHEMA_MISSING", "Question corpus schema is not registered");
  const schema = { artifactSchemaId: schemaEntry.schemaId, artifactSchemaVersion: schemaEntry.version, artifactSchemaPath: schemaEntry.path, artifactSchemaSha256: schemaEntry.canonicalSha256 };
  const generator = { id: "paperlens-promotion-manifest-generator", version: "1.0.0", registryPath: boundary.contract.generatorRegistry.path, registrySha256: boundary.contract.generatorRegistry.byteSha256 };
  const artifactVersion = `pr06d-${sourceCommit.slice(0, 12)}-${sha256(sourceBytes).slice(0, 12)}`;
  const candidatePaths = { artifact: "promotion/candidate/artifacts/question-corpus-v1.json", evidence: "promotion/candidate/evidence/validation.json", history: "promotion/candidate/evidence/manifest-history.json" };
  const targetPaths = { artifact: "promotion/target/artifacts/question-corpus-v1.json", evidence: "promotion/target/evidence/validation.json", history: "promotion/target/evidence/manifest-history.json", runtime: "promotion/target/evidence/runtime-remote-history.json" };
  const candidate = buildRole({ role: "candidate", lifecycleState: "READY_FOR_PROMOTION_REVIEW", phase: "candidate", result: "PASS", manifestPath: CANDIDATE_MANIFEST_PATH, artifactPath: candidatePaths.artifact, evidencePath: candidatePaths.evidence, historyPath: candidatePaths.history, artifactBytes, artifactObject, artifactVersion, schema, generator, sourceCommit, generatedAt, historyBytes, promotion: nonPromotionMetadata(), evidenceId: `${promotionId}-candidate-validation` });
  const targetPromotion = { mode: "bootstrap", baselineProductionSha256: null, differenceRequestPath: null, differenceRequestSha256: null, approvalEvidencePath: null, approvalEvidenceSha256: null, runtimeRemoteHistoryEvidencePath: targetPaths.runtime, runtimeRemoteHistoryEvidenceSha256: sha256(runtimeBytes), reviewDecision: "PENDING", reviewer: null, reviewedAt: null, promotionId };
  const target = buildRole({ role: "promotion-target", lifecycleState: "READY_FOR_HUMAN_REVIEW", phase: "target-pre-review", result: "READY_FOR_HUMAN_REVIEW", manifestPath: TARGET_MANIFEST_PATH, artifactPath: targetPaths.artifact, evidencePath: targetPaths.evidence, historyPath: targetPaths.history, artifactBytes, artifactObject, artifactVersion, schema, generator, sourceCommit, generatedAt, historyBytes, promotion: targetPromotion, evidenceId: `${promotionId}-target-validation` });
  const files = new Map([
    [candidatePaths.artifact, artifactBytes], [candidatePaths.history, historyBytes], [candidatePaths.evidence, candidate.evidenceBytes], [CANDIDATE_MANIFEST_PATH, candidate.manifestBytes],
    [targetPaths.artifact, artifactBytes], [targetPaths.history, historyBytes], [targetPaths.runtime, runtimeBytes], [targetPaths.evidence, target.evidenceBytes], [TARGET_MANIFEST_PATH, target.manifestBytes],
  ]);
  return { root, sourcePath, sourceCommit, generatedAt, promotionId, sourceSha256: sha256(sourceBytes), artifactSha256, recordCount: artifactObject.records.length, scope: candidate.scope.supportedSyllabi, files, candidate, target };
}

function writeBootstrapPackage(result) {
  for (const conflict of ["promotion/candidate", "promotion/target"]) if (lstatState(result.root, conflict)) throw packageError("PACKAGE_AUTHORITY_PATH_CONFLICT", `Authority output already exists: ${conflict}`, conflict);
  if (lstatState(result.root, PRODUCTION_MANIFEST_PATH)) throw packageError("PACKAGE_PRODUCTION_AUTHORITY_PRESENT", "Bootstrap requires Production manifest to remain absent", PRODUCTION_MANIFEST_PATH);
  for (const [relative, bytes] of result.files) {
    const absolute = assertRepositoryPath(result.root, relative, { mustExist: false });
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, bytes, { flag: "wx" });
  }
}

function coreInventory(result) {
  return [...result.files].map(([relative, bytes]) => ({ path: relative, sizeBytes: bytes.length, sha256: sha256(bytes) })).sort((left, right) => left.path.localeCompare(right.path));
}

function runBootstrapDryRun(result, options = {}) {
  const candidateValidation = validateRepository({ root: result.root, intent: "candidate" });
  const targetValidation = validateRepository({ root: result.root, intent: "bootstrap-pre-review" });
  const pass = candidateValidation.exitCode === 0 && targetValidation.exitCode === 0 && candidateValidation.result === "PASS" && targetValidation.result === "READY_FOR_HUMAN_REVIEW";
  const report = {
    schemaVersion: 1,
    task: "PR06D_BOOTSTRAP_PACKAGE_GENERATION_AND_DRY_RUN",
    result: pass ? "PASS_PR06D_BOOTSTRAP_DRY_RUN" : "BLOCK_PR06D_BOOTSTRAP_DRY_RUN",
    generatedAt: result.generatedAt,
    dryRun: true,
    source: { path: result.sourcePath, sourceCommit: result.sourceCommit, sha256: result.sourceSha256 },
    package: { promotionId: result.promotionId, artifactSha256: result.artifactSha256, recordCount: result.recordCount, supportedSyllabi: result.scope, inventory: coreInventory(result) },
    validation: { candidate: candidateValidation, target: targetValidation },
    approvalSimulation: { simulated: true, decision: "PENDING_HUMAN_REVIEW", authorityGranted: false, approvalEvidenceCreated: false },
    safety: { currentProductionManifestCreated: false, productionWrite: false, promotionExecuted: false, deploymentExecuted: false },
  };
  if (!pass) throw packageError("PACKAGE_DRY_RUN_BLOCKED", JSON.stringify(report.validation));
  if (options.reportPath) {
    const absolute = assertRepositoryPath(result.root, options.reportPath, { mustExist: false, prefix: "promotion/target/evidence/" });
    fs.writeFileSync(absolute, jsonBytes(report), { flag: "wx" });
  }
  return report;
}

function writePackageHashReport(result, dryRunReport, relative = "promotion/target/evidence/pr06d-package-hash-report.json") {
  const dryRunBytes = jsonBytes(dryRunReport);
  const report = {
    schemaVersion: 1,
    task: "PR06D_BOOTSTRAP_PACKAGE_HASH_INVENTORY",
    generatedAt: result.generatedAt,
    promotionId: result.promotionId,
    sourceCommit: result.sourceCommit,
    files: [...coreInventory(result), { path: "promotion/target/evidence/pr06d-dry-run-report.json", sizeBytes: dryRunBytes.length, sha256: sha256(dryRunBytes) }].sort((left, right) => left.path.localeCompare(right.path)),
    selfHash: "EXCLUDED_TO_AVOID_SELF_REFERENCE",
  };
  const absolute = assertRepositoryPath(result.root, relative, { mustExist: false, prefix: "promotion/target/evidence/" });
  fs.writeFileSync(absolute, jsonBytes(report), { flag: "wx" });
  return report;
}

module.exports = { CANDIDATE_MANIFEST_PATH, DEFAULT_SOURCE_PATH, PRODUCTION_MANIFEST_PATH, TARGET_MANIFEST_PATH, WORKFLOW_ID, WORKFLOW_VERSION, buildArtifact, buildBootstrapPackage, coreInventory, jsonBytes, packageError, runBootstrapDryRun, writeBootstrapPackage, writePackageHashReport };
