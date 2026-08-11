"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { approveTarget, buildProduction, executeProduction, prepareFreshTarget } = require("../scripts/promotion-package/production-bootstrap");
const { sha256 } = require("../scripts/promotion-validator/hash");
const { validateRepository } = require("../scripts/promotion-validator/validator");

const sourceRoot = path.resolve(__dirname, "..");
const capturedAt = "2026-08-11T13:00:00Z";
const reviewedAt = "2026-08-11T13:01:00Z";
const executedAt = "2026-08-11T13:02:00Z";
const promotionId = "pr06e-synthetic-bootstrap-001";
const pr06eBaseMain = "4d2363e7df3a4231252e0864c4ceb29e4196baa8";
const tests = [];
let passed = 0;

function register(name, callback) { tests.push({ name, callback }); }
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pr06e-bootstrap-"));
  fs.rmdirSync(root);
  execFileSync("git", ["clone", "-q", "--shared", sourceRoot, root], { stdio: ["ignore", "pipe", "pipe"] });
  git(root, ["config", "user.name", "PR06E Fixture"]); git(root, ["config", "user.email", "pr06e@example.invalid"]);
  fs.rmSync(path.join(root, "promotion", "target"), { recursive: true, force: true });
  git(root, ["checkout", pr06eBaseMain, "--", "promotion/target"]);
  if (git(root, ["status", "--porcelain"])) { git(root, ["add", "-A"]); git(root, ["commit", "-qm", "restore approved PR06D Target baseline"]); }
  const main = git(root, ["rev-parse", "HEAD"]);
  git(root, ["remote", "set-url", "origin", "https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git"]);
  git(root, ["update-ref", "refs/remotes/origin/main", main]);
  return { root, main };
}
function cleanup(f) { fs.rmSync(f.root, { recursive: true, force: true }); }
function withFixture(callback) { const f=fixture(); try { return callback(f); } finally { cleanup(f); } }
function runtime(f, overrides={}) { return { schemaVersion:1,evidenceType:"REMOTE_HISTORY_CAPTURE_V1",evidencePurpose:"RUNTIME_PROMOTION",promotionSessionId:promotionId,repositoryIdentity:"Ameliaaa1/Project_01CAIE_CS_Paper_Checklist",remoteURL:"https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git",remoteBranch:"refs/heads/main",remoteCommitSHA:f.main,captureTimestamp:"2026-08-11T13:00:00.000Z",captureMethod:"git ls-remote origin refs/heads/main",localTrackingRef:"refs/remotes/origin/main",localTrackingRefSHA:f.main,verificationResult:"PASS",...overrides }; }
function currentTargetSha(root) { return sha256(fs.readFileSync(path.join(root,"promotion/target/manifest.json"))); }
function prepare(f, overrides={}) { return prepareFreshTarget({root:f.root,capturedAt,promotionId,expectedTargetManifestSha256:currentTargetSha(f.root),runtimeRemoteHistory:runtime(f),...overrides}); }
function commit(f, message) { git(f.root,["add","-A"]); git(f.root,["commit","-qm",message]); }
function approve(f, prepared, overrides={}) { commit(f,"fresh PR06E preflight"); return approveTarget({root:f.root,reviewer:"Amelia Cai",reviewedAt,promotionId,expectedTargetManifestSha256:sha256(prepared.manifestBytes),...overrides}); }

register("fresh runtime Target preflight passes without Candidate mutation",()=>withFixture((f)=>{const candidateTree=git(f.root,["rev-parse","HEAD:promotion/candidate"]);const result=prepare(f);assert.strictEqual(result.report.validation.result,"READY_FOR_HUMAN_REVIEW");assert.strictEqual(git(f.root,["rev-parse","HEAD:promotion/candidate"]),candidateTree);assert.strictEqual(fs.existsSync(path.join(f.root,"promotion/production/manifest.json")),false);}));
register("fresh Target preserves approved artifact identity",()=>withFixture((f)=>{const before=JSON.parse(fs.readFileSync(path.join(f.root,"promotion/target/manifest.json")));const result=prepare(f);assert.strictEqual(result.manifest.artifact.sha256,before.artifact.sha256);assert.strictEqual(result.manifest.artifact.artifactVersion,before.artifact.artifactVersion);assert.strictEqual(result.manifest.provenance.sourceCommit,before.provenance.sourceCommit);}));
register("wrong approved Target hash blocks before writes",()=>withFixture((f)=>{assert.throws(()=>prepare(f,{expectedTargetManifestSha256:"0".repeat(64)}),(e)=>e.code==="PR06E_TARGET_MANIFEST_DRIFT");assert.strictEqual(fs.existsSync(path.join(f.root,"promotion/target/evidence/pr06e-runtime-remote-history.json")),false);}));
register("runtime session mismatch blocks",()=>withFixture((f)=>{assert.throws(()=>prepare(f,{runtimeRemoteHistory:runtime(f,{promotionSessionId:"wrong"})}),(e)=>e.code==="PR06E_RUNTIME_BINDING_INVALID");}));
register("Production execution blocks before human approval",()=>withFixture((f)=>{const prepared=prepare(f);commit(f,"fresh PR06E preflight");assert.throws(()=>buildProduction({root:f.root,executionId:"exec-1",executor:"test",executedAt,expectedApprovedTargetManifestSha256:sha256(prepared.manifestBytes)}),(e)=>e.code==="PR06E_EXECUTION_NOT_AUTHORIZED");assert.strictEqual(fs.existsSync(path.join(f.root,"promotion/production")),false);}));
register("exact human approval produces post-review-valid Target",()=>withFixture((f)=>{const prepared=prepare(f);const approved=approve(f,prepared);assert.strictEqual(approved.validation.result,"PROMOTION_TARGET_VALIDATION_PASS");assert.strictEqual(approved.manifest.lifecycleState,"APPROVED_FOR_EXECUTION");assert.strictEqual(approved.approval.promotionId,promotionId);}));
register("approved Target bootstraps valid Production with exact artifact bytes",()=>withFixture((f)=>{const prepared=prepare(f);const approved=approve(f,prepared);commit(f,"approved PR06E target");const executed=executeProduction({root:f.root,executionId:"pr06e-exec-001",executor:"paperlens-pr06e-bootstrap-executor@1.0.0",executedAt,expectedApprovedTargetManifestSha256:approved.targetManifestSha256});assert.strictEqual(executed.validation.result,"PASS");assert.strictEqual(validateRepository({root:f.root,intent:"current-production"}).result,"PASS");assert.deepStrictEqual(fs.readFileSync(path.join(f.root,"promotion/production/artifacts/question-corpus-v1.json")),fs.readFileSync(path.join(f.root,"promotion/target/artifacts/question-corpus-v1.json")));}));
register("second Production Bootstrap is blocked",()=>withFixture((f)=>{const prepared=prepare(f);const approved=approve(f,prepared);commit(f,"approved PR06E target");executeProduction({root:f.root,executionId:"pr06e-exec-001",executor:"test",executedAt,expectedApprovedTargetManifestSha256:approved.targetManifestSha256});assert.throws(()=>executeProduction({root:f.root,executionId:"pr06e-exec-002",executor:"test",executedAt,expectedApprovedTargetManifestSha256:approved.targetManifestSha256}),(e)=>e.code==="PR06E_PRODUCTION_ALREADY_PRESENT");}));

for (const test of tests) { try { test.callback(); passed += 1; } catch (error) { process.stderr.write(`FAIL: ${test.name}\n${error.stack}\n`); process.exitCode=1; } }
process.stdout.write(`${JSON.stringify({result:passed===tests.length?"PASS_PR06E_PRODUCTION_BOOTSTRAP_TESTS":"BLOCK_PR06E_PRODUCTION_BOOTSTRAP_TESTS",passed,failed:tests.length-passed,total:tests.length})}\n`);
