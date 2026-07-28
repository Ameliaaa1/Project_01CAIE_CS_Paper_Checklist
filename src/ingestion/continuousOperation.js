const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_INGESTION_WORKFLOW = Object.freeze([
  "SOURCE_COLLECTION",
  "DOCUMENT_PROFILE_VERIFICATION",
  "PARSER_PROCESSING",
  "CANONICAL_GENERATION",
  "STAGING_VALIDATION",
  "REGRESSION_TEST",
  "PRODUCTION_ELIGIBILITY_CHECK",
  "PRODUCTION_PUBLISH",
  "AUDIT_REPORT"
]);

function evaluateOperationalGate(candidate = {}) {
  const blockers = [];
  if (candidate.validationStatus !== "PASS") blockers.push("VALIDATION_NOT_PASS");
  if (candidate.completenessStatus !== "PASS") blockers.push("COMPLETENESS_NOT_PASS");
  if (candidate.canonicalPublishable !== true) blockers.push("CANONICAL_NOT_PUBLISHABLE");
  if (Number(candidate.p0Count || 0) !== 0) blockers.push("P0_NOT_ZERO");
  if (Number(candidate.p1Count || 0) !== 0) blockers.push("P1_NOT_ZERO");
  if (candidate.regression !== "PASS") blockers.push("REGRESSION_NOT_PASS");
  return {
    status: blockers.length ? "DO_NOT_PUBLISH" : "ELIGIBLE",
    publishAllowed: blockers.length === 0,
    blockers,
    requirements: {
      validationStatus: "PASS",
      completenessStatus: "PASS",
      canonicalPublishable: true,
      p0Count: 0,
      p1Count: 0,
      regression: "PASS"
    }
  };
}

function validateIngestionWorkflow(steps = []) {
  const normalized = steps.map((step) => String(step || "").toUpperCase());
  const missing = REQUIRED_INGESTION_WORKFLOW.filter((step) => !normalized.includes(step));
  const orderingFailures = [];
  for (let index = 1; index < REQUIRED_INGESTION_WORKFLOW.length; index += 1) {
    const previous = REQUIRED_INGESTION_WORKFLOW[index - 1];
    const current = REQUIRED_INGESTION_WORKFLOW[index];
    if (normalized.indexOf(previous) > normalized.indexOf(current)) orderingFailures.push(`${previous}_AFTER_${current}`);
  }
  const sourceIndex = normalized.indexOf("SOURCE_COLLECTION");
  const productionIndex = normalized.indexOf("PRODUCTION_PUBLISH");
  const stagingIndex = normalized.indexOf("STAGING_VALIDATION");
  const directProductionPath = sourceIndex >= 0 && productionIndex === sourceIndex + 1;
  const bypassedStaging = productionIndex >= 0 && (stagingIndex < 0 || stagingIndex > productionIndex);
  return {
    status: missing.length || orderingFailures.length || directProductionPath || bypassedStaging ? "FAIL" : "PASS",
    steps: normalized,
    missing,
    orderingFailures,
    directProductionPath,
    bypassedStaging
  };
}

function createFileSnapshot(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const bytes = fs.readFileSync(absolutePath);
  const sha256 = digest(bytes);
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  const snapshotDir = path.resolve(options.snapshotDir || path.join(projectRoot, "output", "continuous-operation", "snapshots"));
  const extension = path.extname(absolutePath) || ".snapshot";
  const label = options.label || path.basename(absolutePath, extension);
  const snapshotPath = path.join(snapshotDir, `${label}-${sha256}${extension}`);
  fs.mkdirSync(snapshotDir, { recursive: true });
  if (!fs.existsSync(snapshotPath)) fs.writeFileSync(snapshotPath, bytes);
  const verified = digest(fs.readFileSync(snapshotPath)) === sha256;
  return {
    type: "FILE_SNAPSHOT",
    label,
    sourcePath: projectRelativePath(absolutePath, projectRoot),
    snapshotPath: projectRelativePath(snapshotPath, projectRoot),
    sha256,
    byteLength: bytes.length,
    verified,
    immutable: true
  };
}

function createTreeSnapshot(directory, options = {}) {
  const root = path.resolve(directory);
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  const files = walkFiles(root).map((filePath) => ({
    path: projectRelativePath(filePath, projectRoot),
    sha256: digest(fs.readFileSync(filePath)),
    byteLength: fs.statSync(filePath).size
  }));
  const sha256 = digest(Buffer.from(JSON.stringify(files)));
  const manifest = {
    type: "TREE_SNAPSHOT",
    label: options.label || path.basename(root),
    sourcePath: projectRelativePath(root, projectRoot),
    sha256,
    fileCount: files.length,
    byteLength: files.reduce((sum, file) => sum + file.byteLength, 0),
    files,
    verified: true,
    immutable: true
  };
  if (options.manifestPath) {
    const manifestPath = path.resolve(options.manifestPath);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    manifest.manifestPath = projectRelativePath(manifestPath, projectRoot);
  }
  return manifest;
}

function createProductionChangeRecord(input = {}, options = {}) {
  const required = ["changeId", "timestamp", "reason", "affectedPairs", "beforeSnapshot", "afterSnapshot", "validationResult", "rollbackPoint"];
  const missing = required.filter((field) => input[field] === undefined || input[field] === null || input[field] === "");
  if (missing.length) throw new Error(`Production change record missing: ${missing.join(", ")}`);
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  return {
    schemaVersion: "1.0",
    changeId: String(input.changeId),
    timestamp: String(input.timestamp),
    reason: String(input.reason),
    affectedPairs: Array.isArray(input.affectedPairs) ? input.affectedPairs : [],
    beforeSnapshot: portableSnapshot(input.beforeSnapshot, projectRoot),
    afterSnapshot: portableSnapshot(input.afterSnapshot, projectRoot),
    validationResult: input.validationResult,
    rollbackPoint: portableSnapshot(input.rollbackPoint, projectRoot),
    productionWrite: input.productionWrite === true,
    auditStatus: missing.length ? "INVALID" : "COMPLETE"
  };
}

function monitoringAlerts(metrics = {}, thresholds = {}) {
  const limits = {
    parserFailureRate: Number(thresholds.parserFailureRate ?? 0),
    criticalIssues: Number(thresholds.criticalIssues ?? 0),
    warnings: Number(thresholds.warnings ?? 0),
    minimumCoverage: Number(thresholds.minimumCoverage ?? 1)
  };
  const alerts = [];
  if (Number(metrics.parserFailureRate || 0) > limits.parserFailureRate) alerts.push("PARSER_FAILURE_RATE_EXCEEDED");
  if (Number(metrics.criticalIssues || 0) > limits.criticalIssues) alerts.push("CRITICAL_ISSUES_PRESENT");
  if (Number(metrics.warnings || 0) > limits.warnings) alerts.push("WARNINGS_PRESENT");
  for (const name of ["sourceCoverage", "stagingCoverage", "productionCoverage"]) {
    if (Number(metrics[name] ?? 0) < limits.minimumCoverage) alerts.push(`${name.replace(/([A-Z])/g, "_$1").toUpperCase()}_BELOW_THRESHOLD`);
  }
  return { status: alerts.length ? "ALERT" : "HEALTHY", thresholds: limits, alerts };
}

function projectRelativePath(filePath, projectRoot = process.cwd()) {
  const relative = path.relative(path.resolve(projectRoot), path.resolve(filePath));
  return relative.split(path.sep).join("/");
}

function portableSnapshot(snapshot, projectRoot) {
  if (!snapshot || typeof snapshot !== "object") return snapshot;
  const output = { ...snapshot };
  for (const field of ["sourcePath", "snapshotPath", "manifestPath"]) {
    if (output[field] && path.isAbsolute(output[field])) output[field] = projectRelativePath(output[field], projectRoot);
  }
  return output;
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : entry.isFile() ? [entryPath] : [];
  }).sort();
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = {
  REQUIRED_INGESTION_WORKFLOW,
  createFileSnapshot,
  createProductionChangeRecord,
  createTreeSnapshot,
  evaluateOperationalGate,
  monitoringAlerts,
  projectRelativePath,
  validateIngestionWorkflow
};
