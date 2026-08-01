"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { parseStrictJson } = require("../scripts/promotion-validator/strict-json");
const { canonicalize, evidenceProjection, sha256 } = require("../scripts/promotion-validator/hash");
const { loadBoundary, validateLifecycleTransition, validateRepository, writeReport } = require("../scripts/promotion-validator/validator");

const sourceRoot = path.resolve(__dirname, "..");
const tests = [];
let passed = 0;
const register = (name, category, callback) => tests.push({ name, category, callback });
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
const write = (root, relative, bytes) => { const absolute = path.join(root, relative); fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, bytes); };
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function copyFile(root, relative) { write(root, relative, fs.readFileSync(path.join(sourceRoot, relative))); }

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "promotion-validator-"));
  git(root, ["init", "-q"]); git(root, ["config", "user.name", "Promotion Fixture"]); git(root, ["config", "user.email", "fixture@example.invalid"]);
  for (const relative of [
    "contracts/promotion/promotion-validator-contract-v4.json", "contracts/promotion/schema-registry-v2.json", "contracts/promotion/generator-registry-v1.json",
    "contracts/promotion/schemas/bootstrap-approval-v1.schema.json", "contracts/promotion/schemas/promotion-manifest-v3.schema.json", "contracts/promotion/schemas/promotion-manifest-v4.schema.json",
    "contracts/promotion/schemas/promotion-validation-evidence-v1.schema.json", "contracts/promotion/schemas/promotion-validation-evidence-v2.schema.json", "contracts/promotion/schemas/question-corpus-v1.schema.json",
    "contracts/promotion/schemas/update-approval-v1.schema.json", "contracts/promotion/schemas/update-difference-request-v1.schema.json",
    "docs/repository-maintenance/pr-06c-r3/pr06c-r3-contract-hash-manifest.json",
  ]) copyFile(root, relative);
  git(root, ["add", "."]); git(root, ["commit", "-qm", "synthetic source boundary"]);
  const sourceCommit = git(root, ["rev-parse", "HEAD"]);
  git(root, ["remote", "add", "origin", "https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git"]);
  git(root, ["update-ref", "refs/remotes/origin/main", sourceCommit]);
  return { root, sourceCommit };
}

function hashesForRecords(records) {
  const artifactBytes = jsonBytes({ schemaVersion: 1, records });
  const ids = records.map((record) => record.stableId).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const scope = [...new Set(records.map((record) => record.syllabus))].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  return { artifactBytes, artifactSha: sha256(artifactBytes), stableHash: sha256(Buffer.from(`${JSON.stringify(ids)}\n`)), scope, scopeHash: sha256(Buffer.from(`${JSON.stringify({ supportedSyllabi: scope })}\n`)) };
}

const roleSpec = {
  candidate: { manifest: "promotion/candidate/manifest.json", artifact: "promotion/candidate/artifacts/corpus.json", evidence: "promotion/candidate/evidence/validation.json", lifecycle: "CANDIDATE_VALIDATED", phase: "candidate", result: "PASS" },
  "current-production": { manifest: "promotion/production/manifest.json", artifact: "promotion/production/artifacts/corpus.json", evidence: "promotion/production/evidence/validation.json", lifecycle: "PRODUCTION_CURRENT", phase: "current-production", result: "PASS" },
  "promotion-target": { manifest: "promotion/target/manifest.json", artifact: "promotion/target/artifacts/corpus.json", evidence: "promotion/target/evidence/validation.json", lifecycle: "READY_FOR_HUMAN_REVIEW", phase: "target-pre-review", result: "READY_FOR_HUMAN_REVIEW" },
};

function nonPromotion() { return { mode: null, baselineProductionSha256: null, differenceRequestPath: null, differenceRequestSha256: null, approvalEvidencePath: null, approvalEvidenceSha256: null, reviewDecision: "NOT_APPLICABLE", reviewer: null, reviewedAt: null, promotionId: null }; }

function materializeRole(fixture, role, records, options = {}) {
  const spec = { ...roleSpec[role], ...(options.spec || {}) };
  const hashes = hashesForRecords(records);
  write(fixture.root, spec.artifact, hashes.artifactBytes);
  const timestamp = options.timestamp || "2026-07-31T12:00:00Z";
  const generator = { id: "paperlens-promotion-manifest-generator", version: "1.0.0", registryPath: "contracts/promotion/generator-registry-v1.json", registrySha256: "a2933baefec15d2188f8549dbfd44ae78c0b18585380e231432b970f113c3dfd" };
  const artifact = { artifactId: "paperlens-question-corpus", artifactVersion: options.artifactVersion || "synthetic-v1", artifactPath: spec.artifact, sizeBytes: hashes.artifactBytes.length, sha256: hashes.artifactSha, recordCount: records.length, stableIdSetSha256: hashes.stableHash };
  const schema = { artifactSchemaId: "paperlens-question-corpus-records", artifactSchemaVersion: 1, artifactSchemaPath: "contracts/promotion/schemas/question-corpus-v1.schema.json", artifactSchemaSha256: "8eb88e79f22918a80d86bad28e322e316d03684bb69539478d908ba3aa7fe872" };
  const scope = { supportedSyllabi: hashes.scope, scopeSha256: hashes.scopeHash };
  const promotion = options.promotion || nonPromotion();
  const evidence = {
    schemaVersion: 2, evidenceId: options.evidenceId || `${role}-synthetic-evidence`, validator: { id: "paperlens-promotion-gate-validator", version: "1.0.0", contractVersion: 4 }, phase: spec.phase, result: spec.result,
    manifest: { role, lifecycleState: spec.lifecycle, path: spec.manifest, sha256: "0".repeat(64) },
    artifact: { artifactId: artifact.artifactId, artifactVersion: artifact.artifactVersion, path: artifact.artifactPath, sizeBytes: artifact.sizeBytes, sha256: artifact.sha256, recordCount: artifact.recordCount, stableIdSetSha256: artifact.stableIdSetSha256 },
    schema: { id: schema.artifactSchemaId, version: schema.artifactSchemaVersion, path: schema.artifactSchemaPath, sha256: schema.artifactSchemaSha256 }, scope: { supportedSyllabi: scope.supportedSyllabi, sha256: scope.scopeSha256 }, sourceCommit: fixture.sourceCommit, generatedAt: timestamp, supersedes: options.supersedes || null, findings: [],
  };
  if (options.mutateEvidenceBeforeProjection) options.mutateEvidenceBeforeProjection(evidence);
  const projectionSha = sha256(evidenceProjection(evidence));
  const manifest = { schemaVersion: 4, authorityRole: role, lifecycleState: spec.lifecycle, artifact, scope, schema, provenance: { sourceCommit: fixture.sourceCommit, generatedAt: timestamp, generator }, validation: { result: spec.result, validatedAt: timestamp, evidencePath: spec.evidence, evidenceProjectionProfile: "paperlens-evidence-binding-v1", evidenceProjectionSha256: projectionSha }, promotion };
  if (options.mutateManifest) options.mutateManifest(manifest);
  const manifestBytes = jsonBytes(manifest);
  evidence.manifest.sha256 = sha256(manifestBytes);
  if (options.mutateEvidenceAfterManifest) options.mutateEvidenceAfterManifest(evidence);
  write(fixture.root, spec.manifest, manifestBytes); write(fixture.root, spec.evidence, jsonBytes(evidence));
  return { spec, hashes, artifact, schema, scope, manifest, evidence, manifestBytes, evidenceBytes: jsonBytes(evidence) };
}

const candidateRecords = [{ stableId: "synthetic-0478-a", syllabus: "0478" }, { stableId: "synthetic-9618-b", syllabus: "9618" }];
const productionRecords = [{ stableId: "synthetic-old-a", syllabus: "0478" }];

function targetPromotion(mode, post, extras = {}) {
  return { mode, baselineProductionSha256: extras.baseline || null, differenceRequestPath: extras.requestPath || null, differenceRequestSha256: extras.requestSha || null, approvalEvidencePath: extras.approvalPath || null, approvalEvidenceSha256: extras.approvalSha || null, reviewDecision: post ? "APPROVE" : "PENDING", reviewer: post ? "Synthetic Reviewer" : null, reviewedAt: post ? "2026-07-31T12:00:00Z" : null, promotionId: `${mode}-synthetic-001` };
}

function bootstrapFixture(post = false) {
  const fixture = createRoot();
  const candidate = materializeRole(fixture, "candidate", candidateRecords);
  let approvalPath = null, approvalSha = null;
  if (post) {
    approvalPath = "promotion/target/evidence/bootstrap-approval.json";
    const approval = { schemaVersion: 1, decision: "APPROVE", reviewer: "Synthetic Reviewer", reviewedAt: "2026-07-31T12:00:00Z", promotionId: "bootstrap-synthetic-001", candidateArtifactSha256: candidate.artifact.sha256, targetArtifactSha256: candidate.artifact.sha256, sourceCommit: fixture.sourceCommit };
    const bytes = jsonBytes(approval); write(fixture.root, approvalPath, bytes); approvalSha = sha256(bytes);
  }
  const spec = post ? { lifecycle: "APPROVED_FOR_EXECUTION", phase: "target-post-review", result: "PROMOTION_TARGET_VALIDATION_PASS" } : undefined;
  const target = materializeRole(fixture, "promotion-target", candidateRecords, { spec, promotion: targetPromotion("bootstrap", post, { approvalPath, approvalSha }) });
  return { ...fixture, candidate, target };
}

function updateFixture(post = false) {
  const fixture = createRoot();
  const production = materializeRole(fixture, "current-production", productionRecords);
  const candidate = materializeRole(fixture, "candidate", candidateRecords);
  const requestPath = "promotion/target/evidence/update-request.json";
  const request = { schemaVersion: 1, requestId: "update-request-synthetic-001", currentProductionArtifactSha256: production.artifact.sha256, candidateArtifactSha256: candidate.artifact.sha256, targetArtifactSha256: candidate.artifact.sha256, schemaChange: { from: { id: production.schema.artifactSchemaId, version: 1, sha256: production.schema.artifactSchemaSha256 }, to: { id: candidate.schema.artifactSchemaId, version: 1, sha256: candidate.schema.artifactSchemaSha256 } }, scopeChange: { from: production.scope.supportedSyllabi, to: candidate.scope.supportedSyllabi, added: ["9618"], removed: [] }, sourceCommit: fixture.sourceCommit, createdAt: "2026-07-31T11:59:00Z" };
  const requestBytes = jsonBytes(request); write(fixture.root, requestPath, requestBytes);
  let approvalPath = null, approvalSha = null;
  if (post) {
    approvalPath = "promotion/target/evidence/update-approval.json";
    const approval = { schemaVersion: 1, decision: "APPROVE", reviewer: "Synthetic Reviewer", reviewedAt: "2026-07-31T12:00:00Z", requestPath, requestSha256: sha256(requestBytes), requestId: request.requestId, currentProductionArtifactSha256: production.artifact.sha256, candidateArtifactSha256: candidate.artifact.sha256, targetArtifactSha256: candidate.artifact.sha256, sourceCommit: fixture.sourceCommit, approvedDifferences: { schemaChange: false, scopeChange: true } };
    const bytes = jsonBytes(approval); write(fixture.root, approvalPath, bytes); approvalSha = sha256(bytes);
  }
  const spec = post ? { lifecycle: "APPROVED_FOR_EXECUTION", phase: "target-post-review", result: "PROMOTION_TARGET_VALIDATION_PASS" } : undefined;
  const target = materializeRole(fixture, "promotion-target", candidateRecords, { spec, promotion: targetPromotion("update", post, { baseline: production.artifact.sha256, requestPath, requestSha: sha256(requestBytes), approvalPath, approvalSha }) });
  return { ...fixture, production, candidate, target, requestPath, approvalPath };
}

function cleanup(fixture) { fs.rmSync(fixture.root, { recursive: true, force: true }); }
function hashTree(root) { const rows=[]; function walk(current){ for(const entry of fs.readdirSync(current,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){ if(entry.name===".git") continue; const absolute=path.join(current,entry.name); if(entry.isDirectory()) walk(absolute); else rows.push([path.relative(root,absolute),crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex")]); }} walk(root); return JSON.stringify(rows); }
function result(fixture, intent) { return validateRepository({ root: fixture.root, intent }); }
function assertPass(report, outcome) { assert.strictEqual(report.exitCode, 0, JSON.stringify(report)); assert.strictEqual(report.result, outcome); assert.strictEqual(report.promotionAuthorized, false); assert.strictEqual(report.promotionExecuted, false); }
function assertBlock(report, code) { assert.strictEqual(report.result, "BLOCK", JSON.stringify(report)); assert(report.findings.some((finding) => finding.code === code), `${code} not found: ${JSON.stringify(report)}`); }
function withFixture(factory, callback) { const fixture = factory(); try { return callback(fixture); } finally { cleanup(fixture); } }

register("strict JSON accepts deterministic object", "strict-json", () => assert.deepStrictEqual({ ...parseStrictJson(Buffer.from('{"a":1}')) }, { a: 1 }));
for (const [name, bytes, code] of [
  ["duplicate key", Buffer.from('{"a":1,"a":2}'), "JSON_DUPLICATE_KEY"], ["BOM", Buffer.from([0xef,0xbb,0xbf,0x7b,0x7d]), "JSON_BOM_BLOCKED"], ["invalid UTF-8", Buffer.from([0xc3,0x28]), "JSON_INVALID_UTF8"], ["trailing content", Buffer.from('{} x'), "JSON_TRAILING_CONTENT"], ["trailing comma", Buffer.from('{"a":1,}'), "JSON_TRAILING_COMMA"], ["integer precision", Buffer.from('9007199254740992'), "JSON_INTEGER_PRECISION_LOSS"], ["unpaired surrogate", Buffer.from('"\\ud800"'), "JSON_UNPAIRED_SURROGATE"],
]) register(`strict JSON blocks ${name}`, "strict-json", () => assert.throws(() => parseStrictJson(bytes), (error) => error.code === code));

register("projection excludes exactly manifest sha", "constructibility", () => { const evidence = { manifest: { role: "candidate", sha256: "a".repeat(64) }, value: 1 }; const one = sha256(evidenceProjection(evidence)); evidence.manifest.sha256 = "b".repeat(64); assert.strictEqual(sha256(evidenceProjection(evidence)), one); evidence.value = 2; assert.notStrictEqual(sha256(evidenceProjection(evidence)), one); });
register("valid Candidate", "positive", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => assertPass(result(f,"candidate"),"PASS")));
register("valid Candidate post-transition state", "positive", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{spec:{lifecycle:"READY_FOR_PROMOTION_REVIEW"}}); return f; }, (f) => assertPass(result(f,"candidate"),"PASS")));
register("valid Current Production", "positive", () => withFixture(() => { const f=createRoot(); materializeRole(f,"current-production",productionRecords); return f; }, (f) => assertPass(result(f,"current-production"),"PASS")));
register("valid Bootstrap pre-review", "positive", () => withFixture(() => bootstrapFixture(false), (f) => assertPass(result(f,"bootstrap-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("valid Bootstrap post-review", "positive", () => withFixture(() => bootstrapFixture(true), (f) => assertPass(result(f,"bootstrap-post-review"),"PROMOTION_TARGET_VALIDATION_PASS")));
register("valid Target post-review", "positive", () => withFixture(() => bootstrapFixture(true), (f) => assertPass(result(f,"target-post-review"),"PROMOTION_TARGET_VALIDATION_PASS")));
register("valid Target pre-review Bootstrap dispatch", "positive", () => withFixture(() => bootstrapFixture(false), (f) => assertPass(result(f,"target-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("valid Target pre-review Update dispatch", "positive", () => withFixture(() => updateFixture(false), (f) => assertPass(result(f,"target-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("valid Target pre-review source state", "positive", () => withFixture(() => { const f=bootstrapFixture(false); materializeRole(f,"promotion-target",candidateRecords,{spec:{lifecycle:"TARGET_VALIDATED"},promotion:targetPromotion("bootstrap",false)}); return f; }, (f) => assertPass(result(f,"target-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("valid Update pre-review", "positive", () => withFixture(() => updateFixture(false), (f) => assertPass(result(f,"update-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("valid Update post-review", "positive", () => withFixture(() => updateFixture(true), (f) => assertPass(result(f,"update-post-review"),"PROMOTION_TARGET_VALIDATION_PASS")));
register("invalid lifecycle transition blocks", "lifecycle", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); const boundary=loadBoundary(f.root); boundary.contract.lifecycleTransitions[0].to="APPROVED_FOR_EXECUTION"; assert.throws(() => validateLifecycleTransition(boundary,"candidate","CANDIDATE_VALIDATED"), (error) => error.code === "LIFECYCLE_TRANSITION_INVALID"); return f; }, () => {}));

register("contract drift blocks", "boundary", () => withFixture(() => createRoot(), (f) => { fs.appendFileSync(path.join(f.root,"contracts/promotion/promotion-validator-contract-v4.json")," "); assertBlock(result(f,"candidate"),"CONTRACT_HASH_DRIFT"); }));
register("unknown generator blocks", "provenance", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateManifest:m=>{m.provenance.generator.id="unknown";}}); return f; }, (f) => assertBlock(result(f,"candidate"),"GENERATOR_UNKNOWN")));
register("checkout mismatch blocks", "provenance", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); git(f.root,["commit","--allow-empty","-qm","different checkout"]); return f; }, (f) => assertBlock(result(f,"candidate"),"SOURCE_COMMIT_CHECKOUT_MISMATCH")));
register("wrong origin blocks", "provenance", () => withFixture(() => { const f=createRoot(); git(f.root,["remote","set-url","origin","https://example.invalid/wrong.git"]); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => assertBlock(result(f,"candidate"),"REPOSITORY_ORIGIN_MISMATCH")));
register("missing origin blocks", "provenance", () => withFixture(() => { const f=createRoot(); git(f.root,["remote","remove","origin"]); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => assertBlock(result(f,"candidate"),"REPOSITORY_ORIGIN_MISSING")));
register("shallow repository blocks", "provenance", () => withFixture(() => { const f=createRoot(); fs.writeFileSync(path.join(f.root,".git/shallow"),`${f.sourceCommit}\n`); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => assertBlock(result(f,"candidate"),"REPOSITORY_SHALLOW")));
register("missing approved history blocks", "provenance", () => withFixture(() => { const f=createRoot(); git(f.root,["update-ref","-d","refs/remotes/origin/main"]); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => assertBlock(result(f,"candidate"),"APPROVED_HISTORY_REF_MISSING")));
register("duplicate stable ID blocks", "artifact", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",[{stableId:"dup",syllabus:"0478"},{stableId:"dup",syllabus:"0478"}]); return f; }, (f) => assertBlock(result(f,"candidate"),"STABLE_ID_DUPLICATE")));
register("unsupported 9709 blocks", "artifact", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",[{stableId:"synthetic",syllabus:"9709"}]); return f; }, (f) => assertBlock(result(f,"candidate"),"SCHEMA_VALIDATION_FAILED")));
register("projection mismatch blocks", "evidence", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateEvidenceAfterManifest:e=>{e.evidenceId="changed";}}); return f; }, (f) => assertBlock(result(f,"candidate"),"EVIDENCE_PROJECTION_HASH_MISMATCH")));
register("manifest hash mismatch blocks", "evidence", () => withFixture(() => { const f=createRoot(); const r=materializeRole(f,"candidate",candidateRecords); const e=JSON.parse(fs.readFileSync(path.join(f.root,r.spec.evidence))); e.manifest.sha256="f".repeat(64); write(f.root,r.spec.evidence,jsonBytes(e)); return f; }, (f) => assertBlock(result(f,"candidate"),"EVIDENCE_MANIFEST_HASH_MISMATCH")));
register("stale evidence binding blocks", "evidence", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateEvidenceBeforeProjection:e=>{e.sourceCommit="f".repeat(40);}}); return f; }, (f) => assertBlock(result(f,"candidate"),"EVIDENCE_SOURCE_COMMIT_MISMATCH")));
register("valid evidence supersession", "evidence", () => withFixture(() => { const f=createRoot(); const older=materializeRole(f,"candidate",candidateRecords,{timestamp:"2026-07-31T11:00:00Z",evidenceId:"older"}); const olderPath="promotion/candidate/evidence/older.json"; write(f.root,olderPath,older.evidenceBytes); materializeRole(f,"candidate",candidateRecords,{timestamp:"2026-07-31T12:00:00Z",evidenceId:"newer",supersedes:{evidencePath:olderPath,evidenceSha256:sha256(older.evidenceBytes)}}); return f; }, (f) => assertPass(result(f,"candidate"),"PASS")));
register("evidence supersession cycle blocks", "evidence", () => withFixture(() => { const f=createRoot(); const currentPath="promotion/candidate/evidence/validation.json"; const olderPath="promotion/candidate/evidence/older.json"; const older=materializeRole(f,"candidate",candidateRecords,{timestamp:"2026-07-31T11:00:00Z",evidenceId:"older",supersedes:{evidencePath:currentPath,evidenceSha256:"0".repeat(64)}}); write(f.root,olderPath,older.evidenceBytes); materializeRole(f,"candidate",candidateRecords,{timestamp:"2026-07-31T12:00:00Z",evidenceId:"newer",supersedes:{evidencePath:olderPath,evidenceSha256:sha256(older.evidenceBytes)}}); return f; }, (f) => assertBlock(result(f,"candidate"),"EVIDENCE_SUPERSESSION_CYCLE")));
register("artifact schema binding mismatch blocks", "schema", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateManifest:m=>{m.schema.artifactSchemaSha256="f".repeat(64);}}); return f; }, (f) => assertBlock(result(f,"candidate"),"ARTIFACT_SCHEMA_BINDING_MISMATCH")));
register("role lifecycle mismatch blocks", "lifecycle", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateManifest:m=>{m.lifecycleState="PRODUCTION_CURRENT";}}); return f; }, (f) => assertBlock(result(f,"candidate"),"SCHEMA_VALIDATION_FAILED")));
register("path traversal blocks", "path", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords,{mutateManifest:m=>{m.artifact.artifactPath="promotion/candidate/artifacts/../escape.json";}}); return f; }, (f) => assertBlock(result(f,"candidate"),"SCHEMA_VALIDATION_FAILED")));
register("symlink artifact blocks", "path", () => withFixture(() => { const f=createRoot(); const r=materializeRole(f,"candidate",candidateRecords); fs.unlinkSync(path.join(f.root,r.spec.artifact)); fs.symlinkSync("../../../contracts/promotion/generator-registry-v1.json",path.join(f.root,r.spec.artifact)); return f; }, (f) => assertBlock(result(f,"candidate"),"PATH_SYMLINK")));
register("root symlink blocks", "path", () => { const f=createRoot(); const link=`${f.root}-link`; fs.symlinkSync(f.root,link); try { assertBlock(validateRepository({root:link,intent:"candidate"}),"PATH_ROOT_SYMLINK"); } finally { fs.rmSync(link,{force:true}); cleanup(f); } });
register("broken symlink blocks", "path", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); const artifact=path.join(f.root,"promotion/candidate/artifacts/corpus.json"); fs.unlinkSync(artifact); fs.symlinkSync("missing-artifact.json",artifact); return f; }, (f) => assertBlock(result(f,"candidate"),"PATH_SYMLINK")));
register("Target pre-review Bootstrap uses full gate", "bootstrap", () => withFixture(() => { const f=bootstrapFixture(false); materializeRole(f,"current-production",productionRecords); return f; }, (f) => assertBlock(result(f,"target-pre-review"),"BOOTSTRAP_PRODUCTION_PRESENT")));
register("Target pre-review Update uses full gate", "update", () => withFixture(() => { const f=updateFixture(false); fs.rmSync(path.join(f.root,"promotion/production"),{recursive:true,force:true}); return f; }, (f) => assertBlock(result(f,"target-pre-review"),"PATH_MISSING")));
register("Bootstrap rejects Production presence", "bootstrap", () => withFixture(() => { const f=bootstrapFixture(false); materializeRole(f,"current-production",productionRecords); return f; }, (f) => assertBlock(result(f,"bootstrap-pre-review"),"BOOTSTRAP_PRODUCTION_PRESENT")));
register("Bootstrap allows empty Production directory", "bootstrap", () => withFixture(() => { const f=bootstrapFixture(false); fs.mkdirSync(path.join(f.root,"promotion/production"),{recursive:true}); return f; }, (f) => assertPass(result(f,"bootstrap-pre-review"),"READY_FOR_HUMAN_REVIEW")));
register("Bootstrap blocks Production directory symlink", "bootstrap", () => withFixture(() => { const f=bootstrapFixture(false); fs.mkdirSync(path.join(f.root,"elsewhere")); fs.mkdirSync(path.join(f.root,"promotion"),{recursive:true}); fs.symlinkSync("../elsewhere",path.join(f.root,"promotion/production")); return f; }, (f) => assertBlock(result(f,"bootstrap-pre-review"),"PATH_SYMLINK")));
register("Bootstrap blocks broken Production manifest symlink", "bootstrap", () => withFixture(() => { const f=bootstrapFixture(false); const manifest=path.join(f.root,"promotion/production/manifest.json"); fs.mkdirSync(path.dirname(manifest),{recursive:true}); fs.symlinkSync("missing.json",manifest); return f; }, (f) => assertBlock(result(f,"bootstrap-pre-review"),"PATH_SYMLINK")));
register("Update approval mismatch blocks", "update", () => withFixture(() => { const f=updateFixture(true); const p=path.join(f.root,f.approvalPath); const a=JSON.parse(fs.readFileSync(p)); a.approvedDifferences.scopeChange=false; write(f.root,f.approvalPath,jsonBytes(a)); return f; }, (f) => assertBlock(result(f,"update-post-review"),"APPROVAL_HASH_MISMATCH")));
register("bound Update approval mismatch blocks", "update", () => withFixture(() => { const f=updateFixture(true); const approval=JSON.parse(fs.readFileSync(path.join(f.root,f.approvalPath))); approval.approvedDifferences.scopeChange=false; const approvalBytes=jsonBytes(approval); write(f.root,f.approvalPath,approvalBytes); const requestBytes=fs.readFileSync(path.join(f.root,f.requestPath)); materializeRole(f,"promotion-target",candidateRecords,{spec:{lifecycle:"APPROVED_FOR_EXECUTION",phase:"target-post-review",result:"PROMOTION_TARGET_VALIDATION_PASS"},promotion:targetPromotion("update",true,{baseline:f.production.artifact.sha256,requestPath:f.requestPath,requestSha:sha256(requestBytes),approvalPath:f.approvalPath,approvalSha:sha256(approvalBytes)})}); return f; }, (f) => assertBlock(result(f,"update-post-review"),"UPDATE_APPROVAL_BINDING_MISMATCH")));
register("create-new report succeeds", "output", () => withFixture(() => { const f=createRoot(); fs.mkdirSync(path.join(f.root,"reports/promotion-validator"),{recursive:true}); return f; }, (f) => { const report={result:"PASS"}; writeReport(f.root,"reports/promotion-validator/result.json",report); assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(f.root,"reports/promotion-validator/result.json"))),report); }));
register("report overwrite blocks", "output", () => withFixture(() => { const f=createRoot(); fs.mkdirSync(path.join(f.root,"reports/promotion-validator"),{recursive:true}); write(f.root,"reports/promotion-validator/result.json",Buffer.from("{}\n")); return f; }, (f) => assert.throws(()=>writeReport(f.root,"reports/promotion-validator/result.json",{}),(e)=>e.code==="REPORT_EXISTS")));
register("report escape blocks", "output", () => withFixture(() => createRoot(), (f) => assert.throws(()=>writeReport(f.root,"docs/result.json",{}),(e)=>e.code==="PATH_ROLE_BOUNDARY")));
register("CLI stdout is JSON and read-only", "output", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => { const before=git(f.root,["status","--porcelain"]); const run=spawnSync(process.execPath,[path.join(sourceRoot,"scripts/validate-promotion.js"),"--root",f.root,"--intent","candidate"],{encoding:"utf8"}); assert.strictEqual(run.status,0,run.stderr); assert.strictEqual(JSON.parse(run.stdout).result,"PASS"); assert.strictEqual(git(f.root,["status","--porcelain"]),before); }));
register("PASS and BLOCK executions mutate zero bytes", "mutation", () => withFixture(() => { const f=createRoot(); materializeRole(f,"candidate",candidateRecords); return f; }, (f) => { const before=hashTree(f.root); assertPass(result(f,"candidate"),"PASS"); assert.strictEqual(hashTree(f.root),before); const artifactPath=path.join(f.root,"promotion/candidate/artifacts/corpus.json"); fs.appendFileSync(artifactPath," "); const blockedBaseline=hashTree(f.root); assertBlock(result(f,"candidate"),"ARTIFACT_SIZE_MISMATCH"); assert.strictEqual(hashTree(f.root),blockedBaseline); }));

for (const test of tests) {
  try { test.callback(); passed += 1; }
  catch (error) { process.stderr.write(`FAIL ${test.category}: ${test.name}\n${error.stack}\n`); process.exitCode = 1; }
}
const categories = Object.fromEntries([...new Set(tests.map((test) => test.category))].sort().map((category) => [category, tests.filter((test) => test.category === category).length]));
const summary = { result: passed === tests.length ? "PASS_PR06C_PROMOTION_VALIDATOR_TESTS" : "BLOCK_PR06C_PROMOTION_VALIDATOR_TESTS", passed, failed: tests.length - passed, total: tests.length, categories };
process.stdout.write(`${JSON.stringify(summary)}\n`);
