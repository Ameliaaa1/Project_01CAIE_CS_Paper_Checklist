const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const VALIDATION_LEVELS = Object.freeze({
  CRITICAL: "Critical",
  WARNING: "Warning",
  INFORMATIONAL: "Informational"
});

function validationLevel(severity) {
  const value = String(severity || "").toUpperCase();
  if (value === "P0" || value === "CRITICAL" || value === "ERROR") return VALIDATION_LEVELS.CRITICAL;
  if (value === "P1" || value === "WARNING" || value === "WARN") return VALIDATION_LEVELS.WARNING;
  return VALIDATION_LEVELS.INFORMATIONAL;
}

function classifyValidationFinding(finding = {}) {
  const code = String(finding.code || finding.errorCode || "UNCLASSIFIED");
  const domain = failureDomain(code);
  const level = validationLevel(finding.severity);
  return {
    ...finding,
    code,
    domain,
    level,
    blocksProduction: level === VALIDATION_LEVELS.CRITICAL,
    requiresReview: level === VALIDATION_LEVELS.CRITICAL || level === VALIDATION_LEVELS.WARNING
  };
}

function failureDomain(code) {
  const value = String(code || "").toUpperCase();
  if (/SOURCE|FILENAME|DUPLICATE/.test(value)) return "SOURCE";
  if (/ROLE|PROFILE|PAIRING/.test(value)) return "DOCUMENT_STRUCTURE";
  if (/QUESTION|LEAF|PARENT|PAGE_RANGE|BOUNDARY/.test(value)) return "QUESTION_STRUCTURE";
  if (/MARK|ANSWER_STRUCTURE/.test(value)) return "MARK_ALLOCATION";
  if (/RESPONSE_AREA|ORPHAN|VISUAL/.test(value)) return "RESPONSE_AREA";
  if (/TEXT|GLYPH|BARCODE|FOOTER|MARGIN|BACK_MATTER/.test(value)) return "TEXT_QUALITY";
  if (/TRACE|ASSET/.test(value)) return "TRACEABILITY";
  if (/APPROVAL|PUBLISH/.test(value)) return "GOVERNANCE";
  return "GENERAL";
}

function parserDecisionTrace(input = {}) {
  const span = input.span || {};
  const classification = input.classification || span.regionType || "unknown";
  const included = input.included === undefined ? classification === "content" : Boolean(input.included);
  return {
    traceVersion: "1.0",
    source: {
      page: span.pageNumber ?? null,
      blockIndex: span.blockIndex ?? null,
      lineIndex: span.lineIndex ?? null,
      spanIndex: span.spanIndex ?? null,
      text: String(span.text || ""),
      font: span.font || null,
      size: Number.isFinite(Number(span.size)) ? Number(span.size) : null,
      bbox: span.bboxTopLeft || span.bbox || null
    },
    decision: {
      classification,
      includedInCanonical: included,
      reason: input.reason || defaultDecisionReason(classification, included),
      evidence: Array.isArray(input.evidence) ? input.evidence : []
    },
    transformation: {
      operation: input.operation || (included ? "NORMALIZE_AND_INCLUDE" : "EXCLUDE_FROM_CANONICAL"),
      input: String(span.text || ""),
      output: included ? String(input.output ?? span.text ?? "") : ""
    },
    canonicalTarget: included ? input.canonicalTarget || "page.normalizedText" : null
  };
}

function defaultDecisionReason(classification, included) {
  if (included) return "Canonical content region admitted.";
  return `${classification} regions are retained for diagnostics but excluded from canonical text.`;
}

function summarizeFindings(findings = []) {
  const classified = findings.map(classifyValidationFinding);
  const byLevel = { Critical: 0, Warning: 0, Informational: 0 };
  const byDomain = {};
  for (const finding of classified) {
    byLevel[finding.level] += 1;
    byDomain[finding.domain] = (byDomain[finding.domain] || 0) + 1;
  }
  return {
    total: classified.length,
    byLevel,
    byDomain,
    productionBlocked: classified.some((finding) => finding.blocksProduction),
    findings: classified
  };
}

function createQualityDashboard(input = {}) {
  const syllabi = input.syllabi || {};
  const rows = Object.entries(syllabi).map(([syllabus, audit]) => ({
    syllabus,
    sourceCoverage: ratio(audit.completeSourcePairs, audit.sourcePairs),
    stagingCoverage: ratio(audit.stagingPairs, audit.sourcePairs),
    productionCoverage: ratio(audit.publishedPairs, audit.sourcePairs),
    incompleteSourcePairs: audit.incompleteSourcePairs || 0,
    blockedPairs: audit.blockedPairs || 0,
    eligibleUnpublishedPairs: audit.eligibleUnpublishedPairs || 0,
    duplicateSourceCount: audit.duplicateSourceCount || 0
  }));
  const parser = input.parser || {};
  const regression = input.regression || {};
  return {
    generatedFor: "Phase-8-Quality-Monitoring",
    status: rows.every((row) => row.sourceCoverage === 1 && row.stagingCoverage === 1 && row.productionCoverage === 1 && row.incompleteSourcePairs === 0 && row.blockedPairs === 0 && row.eligibleUnpublishedPairs === 0 && row.duplicateSourceCount === 0)
      && Number(parser.failureRate || 0) === 0
      && Object.values(regression).every((value) => value === "PASS") ? "PASS" : "ATTENTION_REQUIRED",
    coverage: rows,
    validation: input.validation || {},
    regression,
    parser: {
      processedDocuments: Number(parser.processedDocuments || 0),
      failedDocuments: Number(parser.failedDocuments || 0),
      failureRate: Number(parser.failureRate || 0)
    }
  };
}

function createProductionSnapshot(storePath, snapshotDir, options = {}) {
  const absoluteStore = path.resolve(storePath);
  const bytes = fs.readFileSync(absoluteStore);
  const sha256 = digest(bytes);
  const snapshotPath = path.join(path.resolve(snapshotDir), `production-store-${sha256}.json`);
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  if (!fs.existsSync(snapshotPath)) fs.writeFileSync(snapshotPath, bytes);
  const snapshotBytes = fs.readFileSync(snapshotPath);
  if (digest(snapshotBytes) !== sha256) throw new Error("Production snapshot verification failed.");
  const store = JSON.parse(bytes);
  const manifest = {
    snapshotVersion: "1.0",
    snapshotId: sha256,
    sourcePath: absoluteStore,
    snapshotPath,
    sha256,
    byteLength: bytes.length,
    schemaVersion: store.schemaVersion || null,
    sourceUpdatedAt: store.updatedAt || null,
    recordCounts: productionRecordCounts(store),
    immutable: true,
    reason: options.reason || "QUALITY_GOVERNANCE_SNAPSHOT"
  };
  const manifestPath = path.join(path.resolve(snapshotDir), `production-store-${sha256}.manifest.json`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { ...manifest, manifestPath };
}

function rollbackPlan(snapshotManifest, currentStorePath) {
  const currentPath = path.resolve(currentStorePath);
  const snapshotPath = path.resolve(snapshotManifest.snapshotPath);
  const snapshotSha256 = digest(fs.readFileSync(snapshotPath));
  const currentSha256 = digest(fs.readFileSync(currentPath));
  const valid = snapshotSha256 === snapshotManifest.sha256;
  return {
    mode: "DRY_RUN",
    executable: valid,
    snapshotVerified: valid,
    snapshotPath,
    targetPath: currentPath,
    currentSha256,
    restoreSha256: snapshotSha256,
    changeRequired: currentSha256 !== snapshotSha256,
    productionWrite: false,
    guard: "Explicit allowWrite=true is required by restoreProductionSnapshot."
  };
}

function restoreProductionSnapshot(snapshotManifest, currentStorePath, options = {}) {
  if (options.allowWrite !== true) throw new Error("Production restore requires explicit allowWrite=true.");
  const plan = rollbackPlan(snapshotManifest, currentStorePath);
  if (!plan.snapshotVerified) throw new Error("Production snapshot hash does not match its manifest.");
  fs.copyFileSync(plan.snapshotPath, plan.targetPath);
  if (digest(fs.readFileSync(plan.targetPath)) !== plan.restoreSha256) throw new Error("Production restore verification failed.");
  return { ...plan, mode: "EXECUTED", productionWrite: true, restored: true };
}

function productionRecordCounts(store) {
  return Object.fromEntries(["batches", "papers", "questions", "responseAreas", "markSchemeEntries", "pairings", "expansionBatches"].map((key) => [key, Array.isArray(store[key]) ? store[key].length : 0]));
}

function ratio(numerator, denominator) {
  return denominator ? Number((Number(numerator || 0) / Number(denominator)).toFixed(6)) : 1;
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = {
  VALIDATION_LEVELS,
  classifyValidationFinding,
  createProductionSnapshot,
  createQualityDashboard,
  failureDomain,
  parserDecisionTrace,
  productionRecordCounts,
  restoreProductionSnapshot,
  rollbackPlan,
  summarizeFindings,
  validationLevel
};
