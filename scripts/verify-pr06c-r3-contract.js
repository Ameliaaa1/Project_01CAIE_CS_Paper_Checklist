#!/usr/bin/env node
"use strict";

const { loadBoundary } = require("./promotion-validator/validator");
const { evidenceProjection, sha256 } = require("./promotion-validator/hash");

function assert(condition, message) { if (!condition) throw new Error(message); }
function hasCycle(edges) {
  const graph = new Map();
  for (const edge of edges) { const [from, to] = edge.split("->"); if (!graph.has(from)) graph.set(from, []); graph.get(from).push(to); }
  const visiting = new Set(), visited = new Set();
  function walk(node) { if (visiting.has(node)) return true; if (visited.has(node)) return false; visiting.add(node); for (const next of graph.get(node) || []) if (walk(next)) return true; visiting.delete(node); visited.add(node); return false; }
  return [...graph.keys()].some(walk);
}

function main() {
  const boundary = loadBoundary(process.cwd());
  const c = boundary.contract;
  assert(!hasCycle(c.hashBindingModel.dependencyEdges), "hash dependency graph contains a cycle");
  assert(JSON.stringify(c.hashBindingModel.evidenceProjection.excludedJsonPointers) === JSON.stringify(["/manifest/sha256"]), "projection exclusions are not exact");
  const artifactSha = "1".repeat(64), stableSha = "2".repeat(64), scopeSha = "3".repeat(64), sourceCommit = "4".repeat(40), generatedAt = "2026-07-31T12:00:00Z";
  const evidence = { schemaVersion: 2, evidenceId: "synthetic-constructibility-proof", validator: { id: "paperlens-promotion-gate-validator", version: "1.0.0", contractVersion: 4 }, phase: "candidate", result: "PASS", manifest: { role: "candidate", lifecycleState: "CANDIDATE_VALIDATED", path: "promotion/candidate/manifest.json", sha256: "0".repeat(64) }, artifact: { artifactId: "paperlens-question-corpus", artifactVersion: "synthetic-v1", path: "promotion/candidate/artifacts/corpus.json", sizeBytes: 1, sha256: artifactSha, recordCount: 1, stableIdSetSha256: stableSha }, schema: { id: "paperlens-question-corpus-records", version: 1, path: "contracts/promotion/schemas/question-corpus-v1.schema.json", sha256: "8eb88e79f22918a80d86bad28e322e316d03684bb69539478d908ba3aa7fe872" }, scope: { supportedSyllabi: ["0478"], sha256: scopeSha }, sourceCommit, generatedAt, supersedes: null, findings: [] };
  const projectionSha = sha256(evidenceProjection(evidence));
  const manifest = { schemaVersion: 4, authorityRole: "candidate", lifecycleState: "CANDIDATE_VALIDATED", artifact: { artifactId: "paperlens-question-corpus", artifactVersion: "synthetic-v1", artifactPath: evidence.artifact.path, sizeBytes: 1, sha256: artifactSha, recordCount: 1, stableIdSetSha256: stableSha }, scope: { supportedSyllabi: ["0478"], scopeSha256: scopeSha }, schema: { artifactSchemaId: evidence.schema.id, artifactSchemaVersion: 1, artifactSchemaPath: evidence.schema.path, artifactSchemaSha256: evidence.schema.sha256 }, provenance: { sourceCommit, generatedAt, generator: { id: "paperlens-promotion-manifest-generator", version: "1.0.0", registryPath: c.generatorRegistry.path, registrySha256: c.generatorRegistry.byteSha256 }, remoteHistory: { evidencePath: "promotion/candidate/evidence/remote-history.json", evidenceSha256: "5".repeat(64) } }, validation: { result: "PASS", validatedAt: generatedAt, evidencePath: "promotion/candidate/evidence/validation.json", evidenceProjectionProfile: c.hashBindingModel.evidenceProjection.profileId, evidenceProjectionSha256: projectionSha }, promotion: { mode: null, baselineProductionSha256: null, differenceRequestPath: null, differenceRequestSha256: null, approvalEvidencePath: null, approvalEvidenceSha256: null, reviewDecision: "NOT_APPLICABLE", reviewer: null, reviewedAt: null, promotionId: null } };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  evidence.manifest.sha256 = sha256(manifestBytes);
  const manifestSchema = boundary.schemas.get("paperlens-promotion-manifest@4").validate;
  const evidenceSchema = boundary.schemas.get("paperlens-promotion-validation-evidence@2").validate;
  assert(manifestSchema(manifest), JSON.stringify(manifestSchema.errors));
  assert(evidenceSchema(evidence), JSON.stringify(evidenceSchema.errors));
  assert(sha256(evidenceProjection(evidence)) === manifest.validation.evidenceProjectionSha256, "projection hash is not reproducible");
  assert(evidence.manifest.sha256 === sha256(manifestBytes), "evidence does not bind exact manifest bytes");
  process.stdout.write(`${JSON.stringify({ result: "PASS_PR06C_R3_CONTRACT_CONSTRUCTIBILITY", contractVersion: 4, projectionProfile: "paperlens-evidence-binding-v1", excludedPointers: ["/manifest/sha256"], dependencyGraph: c.hashBindingModel.dependencyEdges, cycles: 0, schemasCompiled: boundary.schemas.size, manifestHashBinding: "PASS", evidenceProjectionBinding: "PASS" })}\n`);
}

try { main(); } catch (error) { process.stderr.write(`${JSON.stringify({ result: "BLOCK_PR06C_R3_CONTRACT_CONSTRUCTIBILITY", error: error.message })}\n`); process.exitCode = 1; }
