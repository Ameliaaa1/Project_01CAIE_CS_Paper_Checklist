"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const { parseStrictJson } = require("./strict-json");
const { canonicalize, evidenceProjection, sha256 } = require("./hash");
const { assertRepositoryPath } = require("./safe-path");

const VALIDATOR_ID = "paperlens-promotion-gate-validator";
const VALIDATOR_VERSION = "1.0.0";
const CONTRACT_PATH = "contracts/promotion/promotion-validator-contract-v4.json";
const CONTRACT_SHA256 = "f884e5dafe3715204363f0e706172f0adbbce8d22139e6b3113145c7419941e6";
const HASH_MANIFEST_PATH = "docs/repository-maintenance/pr-06c-r3/pr06c-r3-contract-hash-manifest.json";
const HASH_MANIFEST_SHA256 = "51635c921e68d5de9cb5a4bd992ae9076ad4d3c35308b91188250d06e4390a07";

class ValidatorBlock extends Error {
  constructor(code, message, objectPath = null) {
    super(message);
    this.name = "ValidatorBlock";
    this.code = code;
    this.objectPath = objectPath;
  }
}

function block(code, message, objectPath = null) {
  throw new ValidatorBlock(code, message, objectPath);
}

function readBytes(root, relative, options = {}) {
  let absolute;
  try { absolute = assertRepositoryPath(root, relative, { mustExist: true, prefix: options.prefix }); }
  catch (error) { block(error.code || "PATH_INVALID", error.message, relative); }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) block("PATH_NOT_FILE", `Expected a file: ${relative}`, relative);
  return fs.readFileSync(absolute);
}

function readJson(root, relative, options = {}) {
  const bytes = readBytes(root, relative, options);
  try { return { bytes, value: parseStrictJson(bytes) }; }
  catch (error) { block(error.code || "JSON_INVALID", error.message, relative); }
}

function canonicalSha(value) {
  return sha256(Buffer.from(canonicalize(value), "utf8"));
}

function schemaErrors(validate) {
  return (validate.errors || []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

function loadBoundary(root) {
  const contractFile = readJson(root, CONTRACT_PATH);
  if (sha256(contractFile.bytes) !== CONTRACT_SHA256) block("CONTRACT_HASH_DRIFT", "Contract v4 byte hash drifted", CONTRACT_PATH);
  const hashManifestFile = readJson(root, HASH_MANIFEST_PATH);
  if (sha256(hashManifestFile.bytes) !== HASH_MANIFEST_SHA256) block("CONTRACT_HASH_MANIFEST_DRIFT", "Contract hash manifest drifted", HASH_MANIFEST_PATH);
  const contract = contractFile.value;
  if (contract.contractVersion !== 4) block("CONTRACT_VERSION_MISMATCH", "Contract version must be 4", CONTRACT_PATH);
  for (const binding of [contract.schemaRegistry, contract.generatorRegistry]) {
    const file = readJson(root, binding.path);
    if (sha256(file.bytes) !== binding.byteSha256) block("REGISTRY_HASH_MISMATCH", `Registry hash mismatch: ${binding.path}`, binding.path);
  }
  const registry = readJson(root, contract.schemaRegistry.path).value;
  const seen = new Set();
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const schemas = new Map();
  for (const entry of registry.entries) {
    const key = `${entry.schemaId}@${entry.version}`;
    if (seen.has(key)) block("SCHEMA_REGISTRY_DUPLICATE", `Duplicate schema entry: ${key}`, contract.schemaRegistry.path);
    seen.add(key);
    const schema = readJson(root, entry.path).value;
    if (canonicalSha(schema) !== entry.canonicalSha256) block("SCHEMA_HASH_MISMATCH", `Canonical schema hash mismatch: ${key}`, entry.path);
    try { schemas.set(key, { entry, validate: ajv.compile(schema) }); }
    catch (error) { block("SCHEMA_STRICT_COMPILE_FAILED", error.message, entry.path); }
  }
  const generators = readJson(root, contract.generatorRegistry.path).value;
  return { contract, registry, schemas, generators };
}

function schemaValidator(boundary, id, version, currentOnly = true) {
  const resolved = boundary.schemas.get(`${id}@${version}`);
  if (!resolved) block("SCHEMA_UNKNOWN", `Unknown schema: ${id}@${version}`);
  if (currentOnly && resolved.entry.status && resolved.entry.status !== "CURRENT") block("SCHEMA_SUPERSEDED", `Schema is not current: ${id}@${version}`);
  return resolved;
}

function validateSchema(boundary, id, version, value, objectPath) {
  const resolved = schemaValidator(boundary, id, version);
  if (!resolved.validate(value)) block("SCHEMA_VALIDATION_FAILED", schemaErrors(resolved.validate), objectPath);
  return resolved.entry;
}

function utf8Sort(values) {
  return [...values].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
}

function inspectArtifact(root, boundary, manifest, role) {
  const roleSpec = boundary.contract.authorityRoles[role];
  const bytes = readBytes(root, manifest.artifact.artifactPath, { prefix: roleSpec.artifactPrefix });
  if (bytes.length !== manifest.artifact.sizeBytes) block("ARTIFACT_SIZE_MISMATCH", "Artifact size does not match manifest", manifest.artifact.artifactPath);
  if (sha256(bytes) !== manifest.artifact.sha256) block("ARTIFACT_HASH_MISMATCH", "Artifact byte hash does not match manifest", manifest.artifact.artifactPath);
  let artifact;
  try { artifact = parseStrictJson(bytes); } catch (error) { block(error.code || "ARTIFACT_JSON_INVALID", error.message, manifest.artifact.artifactPath); }
  const schemaEntry = validateSchema(boundary, manifest.schema.artifactSchemaId, manifest.schema.artifactSchemaVersion, artifact, manifest.artifact.artifactPath);
  if (schemaEntry.kind !== "artifact" || !schemaEntry.supportedArtifactSchema) block("ARTIFACT_SCHEMA_NOT_ALLOWED", "Schema is not an allowed artifact schema", schemaEntry.path);
  if (schemaEntry.path !== manifest.schema.artifactSchemaPath || schemaEntry.canonicalSha256 !== manifest.schema.artifactSchemaSha256) block("ARTIFACT_SCHEMA_BINDING_MISMATCH", "Artifact schema binding mismatch");
  if (!Array.isArray(artifact.records) || artifact.records.length === 0) block("ARTIFACT_RECORDS_MISSING", "Artifact records must be a non-empty array");
  const stableIds = [];
  const idSet = new Set();
  const syllabusSet = new Set();
  for (const record of artifact.records) {
    if (typeof record.stableId !== "string" || Buffer.byteLength(record.stableId, "utf8") === 0) block("STABLE_ID_INVALID", "stableId must be a non-empty exact string");
    if (idSet.has(record.stableId)) block("STABLE_ID_DUPLICATE", `Duplicate stableId: ${record.stableId}`);
    idSet.add(record.stableId); stableIds.push(record.stableId);
    if (!boundary.contract.artifactExtraction.allowedSyllabi.includes(record.syllabus)) block("SYLLABUS_UNSUPPORTED", `Unsupported syllabus: ${record.syllabus}`);
    syllabusSet.add(record.syllabus);
  }
  const sortedIds = utf8Sort(stableIds);
  const stableHash = sha256(Buffer.from(`${JSON.stringify(sortedIds)}\n`, "utf8"));
  const scope = utf8Sort([...syllabusSet]);
  const scopeHash = sha256(Buffer.from(`${JSON.stringify({ supportedSyllabi: scope })}\n`, "utf8"));
  if (artifact.records.length !== manifest.artifact.recordCount) block("ARTIFACT_RECORD_COUNT_MISMATCH", "recordCount mismatch");
  if (stableHash !== manifest.artifact.stableIdSetSha256) block("STABLE_ID_HASH_MISMATCH", "stable-ID-set hash mismatch");
  if (canonicalize(scope) !== canonicalize(manifest.scope.supportedSyllabi)) block("SCOPE_SET_MISMATCH", "Observed scope differs from manifest");
  if (scopeHash !== manifest.scope.scopeSha256) block("SCOPE_HASH_MISMATCH", "Scope hash mismatch");
  return { bytes, artifact, stableIds: sortedIds, scope };
}

function validateProvenance(root, boundary, manifest) {
  const source = manifest.provenance.sourceCommit;
  if (!/^[0-9a-f]{40}$/.test(source)) block("SOURCE_COMMIT_FORMAT", "sourceCommit must be lowercase full SHA");
  const git = (args) => {
    try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch (error) { block("SOURCE_COMMIT_UNREACHABLE", `Git provenance check failed: git ${args.join(" ")}`); }
  };
  if (git(["cat-file", "-t", source]) !== "commit") block("SOURCE_COMMIT_NOT_COMMIT", "sourceCommit is not a commit");
  const head = git(["rev-parse", "HEAD"]);
  if (head !== source) block("SOURCE_COMMIT_CHECKOUT_MISMATCH", "Validator checkout must equal sourceCommit");
  git(["merge-base", "--is-ancestor", source, boundary.contract.provenanceValidation.approvedHistoryRef]);
  const generator = boundary.generators.generators.find((entry) => entry.generatorId === manifest.provenance.generator.id && entry.version === manifest.provenance.generator.version);
  if (!generator) block("GENERATOR_UNKNOWN", "Generator identity is not registered");
  if (generator.status !== "APPROVED_FOR_CONTRACT_USE" || !generator.allowedOutputs.includes("promotion-manifest")) block("GENERATOR_NOT_APPROVED", "Generator is not approved for promotion manifests");
  if (manifest.provenance.generator.registryPath !== boundary.contract.generatorRegistry.path || manifest.provenance.generator.registrySha256 !== boundary.contract.generatorRegistry.byteSha256) block("GENERATOR_REGISTRY_BINDING_MISMATCH", "Generator registry binding mismatch");
}

function bindEqual(actual, expected, code, name) {
  if (canonicalize(actual) !== canonicalize(expected)) block(code, `${name} binding mismatch`);
}

function validateSupersession(root, boundary, evidence, roleSpec, visited) {
  if (evidence.supersedes === null) return;
  const relative = evidence.supersedes.evidencePath;
  if (visited.has(relative)) block("EVIDENCE_SUPERSESSION_CYCLE", "Evidence supersession cycle detected", relative);
  visited.add(relative);
  const olderFile = readJson(root, relative, { prefix: roleSpec.evidencePrefix });
  if (sha256(olderFile.bytes) !== evidence.supersedes.evidenceSha256) block("EVIDENCE_SUPERSESSION_HASH_MISMATCH", "Superseded evidence hash mismatch", relative);
  const older = olderFile.value;
  validateSchema(boundary, "paperlens-promotion-validation-evidence", 2, older, relative);
  if (older.phase !== evidence.phase || older.manifest.role !== evidence.manifest.role || older.artifact.artifactId !== evidence.artifact.artifactId) block("EVIDENCE_SUPERSESSION_IDENTITY_MISMATCH", "Superseded evidence identity mismatch", relative);
  if (!(Date.parse(evidence.generatedAt) > Date.parse(older.generatedAt))) block("EVIDENCE_SUPERSESSION_CHRONOLOGY", "New evidence must be strictly later", relative);
  validateSupersession(root, boundary, older, roleSpec, visited);
}

function validateEvidence(root, boundary, manifestFile, manifest, manifestPath, role) {
  const roleSpec = boundary.contract.authorityRoles[role];
  const evidenceFile = readJson(root, manifest.validation.evidencePath, { prefix: roleSpec.evidencePrefix });
  const evidence = evidenceFile.value;
  validateSchema(boundary, "paperlens-promotion-validation-evidence", 2, evidence, manifest.validation.evidencePath);
  let projection;
  try { projection = evidenceProjection(evidence, manifest.validation.evidenceProjectionProfile); }
  catch (error) { block(error.code || "EVIDENCE_PROJECTION_INVALID", error.message, manifest.validation.evidencePath); }
  if (sha256(projection) !== manifest.validation.evidenceProjectionSha256) block("EVIDENCE_PROJECTION_HASH_MISMATCH", "Evidence projection hash mismatch", manifest.validation.evidencePath);
  if (evidence.manifest.sha256 !== sha256(manifestFile.bytes)) block("EVIDENCE_MANIFEST_HASH_MISMATCH", "Evidence does not bind exact manifest bytes", manifest.validation.evidencePath);
  const phaseSpec = boundary.contract.evidencePhaseMapping.find((entry) => entry.phase === evidence.phase);
  if (!phaseSpec || phaseSpec.requiredManifestRole !== role || !phaseSpec.allowedLifecycleStates.includes(manifest.lifecycleState)) block("EVIDENCE_PHASE_ROLE_MISMATCH", "Evidence phase does not match role/lifecycle");
  if (evidence.result !== manifest.validation.result || evidence.result !== phaseSpec.successOutcome) block("EVIDENCE_RESULT_MISMATCH", "Evidence result does not match expected outcome");
  if (evidence.findings.some((finding) => finding.severity === "BLOCK")) block("EVIDENCE_PASS_WITH_BLOCK_FINDING", "Successful evidence contains a blocking finding");
  bindEqual(evidence.manifest, { role, lifecycleState: manifest.lifecycleState, path: manifestPath, sha256: sha256(manifestFile.bytes) }, "EVIDENCE_MANIFEST_BINDING_MISMATCH", "manifest");
  bindEqual(evidence.artifact, { artifactId: manifest.artifact.artifactId, artifactVersion: manifest.artifact.artifactVersion, path: manifest.artifact.artifactPath, sizeBytes: manifest.artifact.sizeBytes, sha256: manifest.artifact.sha256, recordCount: manifest.artifact.recordCount, stableIdSetSha256: manifest.artifact.stableIdSetSha256 }, "EVIDENCE_ARTIFACT_BINDING_MISMATCH", "artifact");
  bindEqual(evidence.schema, { id: manifest.schema.artifactSchemaId, version: manifest.schema.artifactSchemaVersion, path: manifest.schema.artifactSchemaPath, sha256: manifest.schema.artifactSchemaSha256 }, "EVIDENCE_SCHEMA_BINDING_MISMATCH", "schema");
  bindEqual(evidence.scope, { supportedSyllabi: manifest.scope.supportedSyllabi, sha256: manifest.scope.scopeSha256 }, "EVIDENCE_SCOPE_BINDING_MISMATCH", "scope");
  if (evidence.sourceCommit !== manifest.provenance.sourceCommit) block("EVIDENCE_SOURCE_COMMIT_MISMATCH", "Evidence sourceCommit mismatch");
  if (evidence.generatedAt !== manifest.validation.validatedAt) block("EVIDENCE_TIMESTAMP_MISMATCH", "Evidence generatedAt must equal manifest validatedAt");
  validateSupersession(root, boundary, evidence, roleSpec, new Set([manifest.validation.evidencePath]));
  return { evidence, bytes: evidenceFile.bytes, sha256: sha256(evidenceFile.bytes) };
}

function validateRole(root, boundary, role, phase) {
  const roleSpec = boundary.contract.authorityRoles[role];
  const manifestFile = readJson(root, roleSpec.manifestPath);
  const manifest = manifestFile.value;
  validateSchema(boundary, "paperlens-promotion-manifest", 4, manifest, roleSpec.manifestPath);
  const allowed = boundary.contract.roleLifecycleMatrix.some((entry) => entry.role === role && entry.lifecycleState === manifest.lifecycleState);
  if (!allowed || manifest.authorityRole !== role) block("ROLE_LIFECYCLE_MISMATCH", "Manifest role/lifecycle combination is not allowed", roleSpec.manifestPath);
  if (phase) {
    const mapping = boundary.contract.evidencePhaseMapping.find((entry) => entry.phase === phase);
    if (!mapping || mapping.requiredManifestRole !== role || !mapping.allowedLifecycleStates.includes(manifest.lifecycleState)) block("INTENT_LIFECYCLE_MISMATCH", `Manifest does not satisfy intent ${phase}`);
  }
  const artifact = inspectArtifact(root, boundary, manifest, role);
  validateProvenance(root, boundary, manifest);
  const evidence = validateEvidence(root, boundary, manifestFile, manifest, roleSpec.manifestPath, role);
  return { role, manifest, manifestBytes: manifestFile.bytes, artifact, evidence };
}

function identity(manifest) {
  return { artifact: { artifactId: manifest.artifact.artifactId, artifactVersion: manifest.artifact.artifactVersion, sizeBytes: manifest.artifact.sizeBytes, sha256: manifest.artifact.sha256, recordCount: manifest.artifact.recordCount, stableIdSetSha256: manifest.artifact.stableIdSetSha256 }, scope: manifest.scope, schema: manifest.schema, provenance: { sourceCommit: manifest.provenance.sourceCommit, generator: manifest.provenance.generator } };
}

function approvalFile(root, boundary, target, kind) {
  const promotion = target.manifest.promotion;
  const file = readJson(root, promotion.approvalEvidencePath, { prefix: boundary.contract.authorityRoles["promotion-target"].evidencePrefix });
  if (sha256(file.bytes) !== promotion.approvalEvidenceSha256) block("APPROVAL_HASH_MISMATCH", "Approval evidence hash mismatch");
  validateSchema(boundary, kind === "bootstrap" ? "paperlens-bootstrap-approval" : "paperlens-update-approval", 1, file.value, promotion.approvalEvidencePath);
  if (file.value.decision !== "APPROVE" || file.value.reviewer !== promotion.reviewer || file.value.reviewedAt !== promotion.reviewedAt) block("APPROVAL_REVIEW_BINDING_MISMATCH", "Approval review metadata mismatch");
  return file.value;
}

function validateBootstrap(root, boundary, postReview) {
  const productionPath = boundary.contract.authorityRoles["current-production"].manifestPath;
  if (fs.existsSync(path.join(root, productionPath))) block("BOOTSTRAP_PRODUCTION_PRESENT", "Bootstrap requires Current Production manifest to be absent");
  const candidate = validateRole(root, boundary, "candidate", "candidate");
  const target = validateRole(root, boundary, "promotion-target", postReview ? "target-post-review" : "target-pre-review");
  if (canonicalize(identity(candidate.manifest)) !== canonicalize(identity(target.manifest))) block("CANDIDATE_TARGET_IDENTITY_MISMATCH", "Candidate and Target identities differ");
  const promotion = target.manifest.promotion;
  if (promotion.mode !== "bootstrap" || promotion.baselineProductionSha256 !== null || promotion.differenceRequestPath !== null || promotion.differenceRequestSha256 !== null) block("BOOTSTRAP_METADATA_INVALID", "Bootstrap promotion metadata is invalid");
  if (postReview) {
    const approval = approvalFile(root, boundary, target, "bootstrap");
    bindEqual({ promotionId: approval.promotionId, candidateArtifactSha256: approval.candidateArtifactSha256, targetArtifactSha256: approval.targetArtifactSha256, sourceCommit: approval.sourceCommit }, { promotionId: promotion.promotionId, candidateArtifactSha256: candidate.manifest.artifact.sha256, targetArtifactSha256: target.manifest.artifact.sha256, sourceCommit: target.manifest.provenance.sourceCommit }, "BOOTSTRAP_APPROVAL_BINDING_MISMATCH", "bootstrap approval");
  }
  return { outcome: postReview ? "PROMOTION_TARGET_VALIDATION_PASS" : "READY_FOR_HUMAN_REVIEW", roles: [candidate, target] };
}

function setDifference(left, right) { return utf8Sort(left.filter((value) => !right.includes(value))); }
function schemaIdentity(manifest) { return { id: manifest.schema.artifactSchemaId, version: manifest.schema.artifactSchemaVersion, sha256: manifest.schema.artifactSchemaSha256 }; }

function validateUpdate(root, boundary, postReview) {
  const production = validateRole(root, boundary, "current-production", "current-production");
  const candidate = validateRole(root, boundary, "candidate", "candidate");
  const target = validateRole(root, boundary, "promotion-target", postReview ? "target-post-review" : "target-pre-review");
  if (canonicalize(identity(candidate.manifest)) !== canonicalize(identity(target.manifest))) block("CANDIDATE_TARGET_IDENTITY_MISMATCH", "Candidate and Target identities differ");
  if (target.manifest.artifact.sha256 === production.manifest.artifact.sha256) block("UPDATE_CONTENT_UNCHANGED", "Update Target must differ from Current Production");
  const promotion = target.manifest.promotion;
  if (promotion.mode !== "update" || promotion.baselineProductionSha256 !== production.manifest.artifact.sha256) block("UPDATE_BASELINE_MISMATCH", "Update baseline does not bind Current Production");
  const requestFile = readJson(root, promotion.differenceRequestPath, { prefix: boundary.contract.authorityRoles["promotion-target"].evidencePrefix });
  if (sha256(requestFile.bytes) !== promotion.differenceRequestSha256) block("UPDATE_REQUEST_HASH_MISMATCH", "Difference request hash mismatch");
  const request = requestFile.value;
  validateSchema(boundary, "paperlens-update-difference-request", 1, request, promotion.differenceRequestPath);
  const expectedRequest = { currentProductionArtifactSha256: production.manifest.artifact.sha256, candidateArtifactSha256: candidate.manifest.artifact.sha256, targetArtifactSha256: target.manifest.artifact.sha256, sourceCommit: target.manifest.provenance.sourceCommit, schemaChange: { from: schemaIdentity(production.manifest), to: schemaIdentity(target.manifest) }, scopeChange: { from: production.manifest.scope.supportedSyllabi, to: target.manifest.scope.supportedSyllabi, added: setDifference(target.manifest.scope.supportedSyllabi, production.manifest.scope.supportedSyllabi), removed: setDifference(production.manifest.scope.supportedSyllabi, target.manifest.scope.supportedSyllabi) } };
  for (const key of Object.keys(expectedRequest)) bindEqual(request[key], expectedRequest[key], "UPDATE_REQUEST_BINDING_MISMATCH", key);
  if (postReview) {
    const approval = approvalFile(root, boundary, target, "update");
    const detected = { schemaChange: canonicalize(expectedRequest.schemaChange.from) !== canonicalize(expectedRequest.schemaChange.to), scopeChange: canonicalize(expectedRequest.scopeChange.from) !== canonicalize(expectedRequest.scopeChange.to) };
    const expectedApproval = { requestPath: promotion.differenceRequestPath, requestSha256: promotion.differenceRequestSha256, requestId: request.requestId, currentProductionArtifactSha256: production.manifest.artifact.sha256, candidateArtifactSha256: candidate.manifest.artifact.sha256, targetArtifactSha256: target.manifest.artifact.sha256, sourceCommit: target.manifest.provenance.sourceCommit, approvedDifferences: detected };
    for (const key of Object.keys(expectedApproval)) bindEqual(approval[key], expectedApproval[key], "UPDATE_APPROVAL_BINDING_MISMATCH", key);
  }
  return { outcome: postReview ? "PROMOTION_TARGET_VALIDATION_PASS" : "READY_FOR_HUMAN_REVIEW", roles: [production, candidate, target] };
}

function validateRepository(options) {
  const root = path.resolve(options.root || process.cwd());
  const intent = options.intent;
  try {
    const boundary = loadBoundary(root);
    let validation;
    if (intent === "candidate") validation = { outcome: "PASS", roles: [validateRole(root, boundary, "candidate", "candidate")] };
    else if (intent === "current-production") validation = { outcome: "PASS", roles: [validateRole(root, boundary, "current-production", "current-production")] };
    else if (intent === "target-pre-review") validation = { outcome: "READY_FOR_HUMAN_REVIEW", roles: [validateRole(root, boundary, "promotion-target", "target-pre-review")] };
    else if (intent === "target-post-review") {
      const target = readJson(root, boundary.contract.authorityRoles["promotion-target"].manifestPath).value;
      if (target.promotion && target.promotion.mode === "bootstrap") validation = validateBootstrap(root, boundary, true);
      else if (target.promotion && target.promotion.mode === "update") validation = validateUpdate(root, boundary, true);
      else block("TARGET_PROMOTION_MODE_INVALID", "Post-review Target must declare bootstrap or update mode");
    }
    else if (intent === "bootstrap-pre-review") validation = validateBootstrap(root, boundary, false);
    else if (intent === "bootstrap-post-review") validation = validateBootstrap(root, boundary, true);
    else if (intent === "update-pre-review") validation = validateUpdate(root, boundary, false);
    else if (intent === "update-post-review") validation = validateUpdate(root, boundary, true);
    else block("INTENT_UNKNOWN", `Unknown validation intent: ${intent}`);
    return { schemaVersion: 1, validator: { id: VALIDATOR_ID, version: VALIDATOR_VERSION, contractVersion: 4 }, intent, result: validation.outcome, exitCode: 0, promotionAuthorized: false, promotionExecuted: false, findings: [], validatedRoles: validation.roles.map((role) => role.role) };
  } catch (error) {
    const finding = { code: error.code || "VALIDATOR_INTERNAL_ERROR", severity: "BLOCK", message: error.message || String(error), path: error.objectPath || null };
    return { schemaVersion: 1, validator: { id: VALIDATOR_ID, version: VALIDATOR_VERSION, contractVersion: 4 }, intent, result: "BLOCK", exitCode: error instanceof ValidatorBlock || error.code ? 1 : 2, promotionAuthorized: false, promotionExecuted: false, findings: [finding], validatedRoles: [] };
  }
}

function writeReport(root, relative, report) {
  let absolute;
  try { absolute = assertRepositoryPath(root, relative, { mustExist: false, prefix: "reports/promotion-validator/" }); }
  catch (error) { block(error.code || "REPORT_PATH_INVALID", error.message, relative); }
  if (!relative.endsWith(".json")) block("REPORT_EXTENSION_INVALID", "Report output must use .json", relative);
  const parent = path.dirname(absolute);
  if (!fs.existsSync(parent)) block("REPORT_PARENT_MISSING", "Report parent directory must already exist", relative);
  try { fs.writeFileSync(absolute, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); }
  catch (error) { block(error.code === "EEXIST" ? "REPORT_EXISTS" : "REPORT_WRITE_FAILED", error.message, relative); }
}

module.exports = { CONTRACT_PATH, CONTRACT_SHA256, HASH_MANIFEST_PATH, HASH_MANIFEST_SHA256, VALIDATOR_ID, VALIDATOR_VERSION, ValidatorBlock, loadBoundary, validateRepository, writeReport };
