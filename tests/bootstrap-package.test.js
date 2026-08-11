"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { buildBootstrapPackage, jsonBytes, runBootstrapDryRun, writeBootstrapPackage, writePackageHashReport } = require("../scripts/promotion-package/bootstrap");
const { sha256 } = require("../scripts/promotion-validator/hash");
const { validateRepository } = require("../scripts/promotion-validator/validator");

const sourceRoot = path.resolve(__dirname, "..");
const generatedAt = "2026-08-11T12:00:00Z";
const promotionId = "pr06d-synthetic-bootstrap-001";
const tests = [];
let passed = 0;

function register(name, callback) { tests.push({ name, callback }); }
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function write(root, relative, bytes) { const absolute = path.join(root, relative); fs.mkdirSync(path.dirname(absolute), { recursive: true }); fs.writeFileSync(absolute, bytes); }

function syntheticSource(records = null) {
  const entries = records || [
    { syllabusId: "caie-igcse-0478", canonicalQuestionId: "0478-2025-MJ-11-Q1", question: "Synthetic 0478 question", answer: "Synthetic answer", sourceReferences: {} },
    { syllabusId: "caie-a-level-9618", canonicalQuestionId: "9618-2025-MJ-11-Q1", question: "Synthetic 9618 question", answer: "Synthetic answer", sourceReferences: {} },
  ];
  return { schemaVersion: "2.0", dataSource: "PRODUCTION_CANONICAL", productionStoreSha256: "a".repeat(64), productionUpdatedAt: generatedAt, papers: 2, questions: entries.length, markSchemeEntries: 0, entries };
}

function fixture(records = null) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pr06d-bootstrap-"));
  fs.rmdirSync(root);
  execFileSync("git", ["clone", "-q", "--shared", sourceRoot, root], { stdio: ["ignore", "pipe", "pipe"] });
  git(root, ["config", "user.name", "PR06D Fixture"]); git(root, ["config", "user.email", "pr06d@example.invalid"]);
  fs.rmSync(path.join(root, "promotion/candidate"), { recursive: true, force: true });
  fs.rmSync(path.join(root, "promotion/target"), { recursive: true, force: true });
  write(root, "generated/production-question-index.json", jsonBytes(syntheticSource(records)));
  git(root, ["add", "-A"]); git(root, ["commit", "-qm", "synthetic validated source"]);
  const sourceCommit = git(root, ["rev-parse", "HEAD"]);
  git(root, ["remote", "set-url", "origin", "https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git"]);
  git(root, ["update-ref", "refs/remotes/origin/main", sourceCommit]);
  return { root, sourceCommit };
}

function runtimeEvidence(sourceCommit, overrides = {}) {
  return { schemaVersion: 1, evidenceType: "REMOTE_HISTORY_CAPTURE_V1", evidencePurpose: "RUNTIME_PROMOTION", promotionSessionId: promotionId, repositoryIdentity: "Ameliaaa1/Project_01CAIE_CS_Paper_Checklist", remoteURL: "https://github.com/Ameliaaa1/Project_01CAIE_CS_Paper_Checklist.git", remoteBranch: "refs/heads/main", remoteCommitSHA: sourceCommit, captureTimestamp: generatedAt, captureMethod: "git ls-remote origin refs/heads/main", localTrackingRef: "refs/remotes/origin/main", localTrackingRefSHA: sourceCommit, verificationResult: "PASS", ...overrides };
}

function build(f) { return buildBootstrapPackage({ root: f.root, sourceCommit: f.sourceCommit, generatedAt, promotionId, runtimeRemoteHistory: runtimeEvidence(f.sourceCommit) }); }
function cleanup(f) { fs.rmSync(f.root, { recursive: true, force: true }); }
function withFixture(callback, records = null) { const f = fixture(records); try { return callback(f); } finally { cleanup(f); } }
function assertBlock(report, code) { assert.strictEqual(report.result, "BLOCK", JSON.stringify(report)); assert(report.findings.some((finding) => finding.code === code), `${code} not found in ${JSON.stringify(report)}`); }

register("deterministic package bytes", () => withFixture((f) => { const first = build(f), second = build(f); assert.deepStrictEqual([...first.files].map(([p,b]) => [p,sha256(b)]), [...second.files].map(([p,b]) => [p,sha256(b)])); }));
register("Candidate and Bootstrap Target validate", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); const candidate=validateRepository({root:f.root,intent:"candidate"}); const target=validateRepository({root:f.root,intent:"bootstrap-pre-review"}); assert.strictEqual(candidate.result,"PASS",JSON.stringify(candidate)); assert.strictEqual(target.result,"READY_FOR_HUMAN_REVIEW",JSON.stringify(target)); assert.strictEqual(candidate.promotionExecuted,false); assert.strictEqual(target.promotionAuthorized,false); }));
register("dry-run and hash reports preserve no-authority outcome", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); const report=runBootstrapDryRun(result,{reportPath:"promotion/target/evidence/pr06d-dry-run-report.json"}); const hashes=writePackageHashReport(result,report); assert.strictEqual(report.dryRun,true); assert.strictEqual(report.safety.productionWrite,false); assert.strictEqual(report.approvalSimulation.authorityGranted,false); assert.strictEqual(hashes.files.length,result.files.size+1); assert.strictEqual(fs.existsSync(path.join(f.root,"promotion/production/manifest.json")),false); }));
register("invalid source duplicate stable ID blocks", () => withFixture((f) => assert.throws(()=>build(f),(error)=>error.code==="PACKAGE_SOURCE_STABLE_ID_DUPLICATE"), [{ syllabusId:"caie-igcse-0478",canonicalQuestionId:"0478-dup" },{ syllabusId:"caie-igcse-0478",canonicalQuestionId:"0478-dup" }]));
register("artifact hash mismatch blocks", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); fs.appendFileSync(path.join(f.root,"promotion/candidate/artifacts/question-corpus-v1.json")," "); assertBlock(validateRepository({root:f.root,intent:"candidate"}),"ARTIFACT_SIZE_MISMATCH"); }));
register("Manifest history evidence drift blocks", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); fs.appendFileSync(path.join(f.root,"promotion/candidate/evidence/manifest-history.json")," "); assertBlock(validateRepository({root:f.root,intent:"candidate"}),"MANIFEST_HISTORY_EVIDENCE_HASH_MISMATCH"); }));
register("repository mismatch blocks", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); git(f.root,["remote","set-url","origin","https://example.invalid/wrong.git"]); assertBlock(validateRepository({root:f.root,intent:"candidate"}),"REPOSITORY_ORIGIN_MISMATCH"); }));
register("invalid Manifest blocks", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); const manifestPath=path.join(f.root,"promotion/candidate/manifest.json"); const manifest=JSON.parse(fs.readFileSync(manifestPath)); manifest.unapprovedField=true; fs.writeFileSync(manifestPath,jsonBytes(manifest)); assertBlock(validateRepository({root:f.root,intent:"candidate"}),"SCHEMA_VALIDATION_FAILED"); }));
register("lifecycle violation blocks", () => withFixture((f) => { const result=build(f); writeBootstrapPackage(result); const manifestPath=path.join(f.root,"promotion/target/manifest.json"); const manifest=JSON.parse(fs.readFileSync(manifestPath)); manifest.lifecycleState="APPROVED_FOR_EXECUTION"; fs.writeFileSync(manifestPath,jsonBytes(manifest)); assertBlock(validateRepository({root:f.root,intent:"bootstrap-pre-review"}),"SCHEMA_VALIDATION_FAILED"); }));
register("authority output conflict blocks", () => withFixture((f) => { const result=build(f); fs.mkdirSync(path.join(f.root,"promotion/candidate"),{recursive:true}); assert.throws(()=>writeBootstrapPackage(result),(error)=>error.code==="PACKAGE_AUTHORITY_PATH_CONFLICT"); }));
register("Production authority conflict blocks", () => withFixture((f) => { const result=build(f); write(f.root,"promotion/production/manifest.json",Buffer.from("{}\n")); assert.throws(()=>writeBootstrapPackage(result),(error)=>error.code==="PACKAGE_PRODUCTION_AUTHORITY_PRESENT"); }));
register("runtime session mismatch blocks before writes", () => withFixture((f) => assert.throws(()=>buildBootstrapPackage({root:f.root,sourceCommit:f.sourceCommit,generatedAt,promotionId,runtimeRemoteHistory:runtimeEvidence(f.sourceCommit,{promotionSessionId:"other"})}),(error)=>error.code==="PACKAGE_RUNTIME_SESSION_MISMATCH")));

for (const test of tests) {
  try { test.callback(); passed += 1; }
  catch (error) { process.stderr.write(`FAIL: ${test.name}\n${error.stack}\n`); process.exitCode = 1; }
}
process.stdout.write(`${JSON.stringify({ result: passed === tests.length ? "PASS_PR06D_BOOTSTRAP_PACKAGE_TESTS" : "BLOCK_PR06D_BOOTSTRAP_PACKAGE_TESTS", passed, failed: tests.length-passed, total: tests.length })}\n`);
