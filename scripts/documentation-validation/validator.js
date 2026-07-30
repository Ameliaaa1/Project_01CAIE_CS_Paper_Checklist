"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const {
  ALLOWED_STATUSES,
  BASELINE_CLASSIFICATIONS,
  EVIDENCE_CLASSES,
  IMPLEMENTED_RULES,
  RULES,
} = require("./constants");
const { parseHeadings, parseLinks, parseMetadata } = require("./markdown");
const { sortFindings } = require("./format-results");

const toPosix = (value) => value.split(path.sep).join("/");
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const utcIso = (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)
  && !Number.isNaN(Date.parse(value));

function runGit(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function discoverFiles(root) {
  try {
    const output = runGit(root, ["ls-files", "--cached", "--others", "--exclude-standard"]);
    return output ? [...new Set(output.split("\n"))].sort() : [];
  } catch {
    const found = [];
    function walk(relative) {
      const absolute = path.join(root, relative);
      for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        const child = toPosix(path.join(relative, entry.name));
        if (entry.isDirectory()) walk(child);
        else found.push(child);
      }
    }
    walk("");
    return found.sort();
  }
}

function readBaseline(root, baselinePath) {
  const absolute = path.join(root, baselinePath);
  if (!fs.existsSync(absolute)) return { schemaVersion: 1, authority: null, entries: [] };
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (cause) {
    const error = new Error("Documentation baseline is not valid JSON.");
    error.code = "BASELINE_JSON_INVALID";
    error.path = baselinePath;
    error.cause = cause;
    throw error;
  }
}

function readBaselineAtRef(root, ref, baselinePath) {
  try {
    runGit(root, ["cat-file", "-e", `${ref}:${baselinePath}`]);
  } catch {
    try {
      runGit(root, ["cat-file", "-e", `${ref}^{commit}`]);
      return null;
    } catch {
      const error = new Error(`Unable to resolve the baseline base ref: ${ref}.`);
      error.code = "BASELINE_BASE_READ_FAILED";
      error.path = baselinePath;
      throw error;
    }
  }
  try {
    return JSON.parse(runGit(root, ["show", `${ref}:${baselinePath}`]));
  } catch (cause) {
    const error = new Error(`Unable to read the baseline at ${ref}.`);
    error.code = "BASELINE_BASE_READ_FAILED";
    error.path = baselinePath;
    error.cause = cause;
    throw error;
  }
}

function parseChangedFiles(root, base) {
  if (!base) {
    const error = new Error("Changed mode requires --base.");
    error.code = "BASE_UNRESOLVED";
    throw error;
  }
  try {
    runGit(root, ["rev-parse", "--verify", `${base}^{commit}`]);
  } catch {
    const error = new Error(`Unable to resolve changed-mode base: ${base}`);
    error.code = "BASE_UNRESOLVED";
    throw error;
  }
  const output = runGit(root, ["diff", "--find-renames", "--name-status", `${base}...HEAD`]);
  if (!output) return [];
  return output.split("\n").map((line) => {
    const parts = line.split("\t");
    const status = parts[0];
    if (status.startsWith("R") || status.startsWith("C")) {
      return { status, oldPath: parts[1], path: parts[2] };
    }
    return { status, path: parts[1] };
  });
}

function makeFinding(ruleId, pathName, message, expected, actual, location = {}) {
  return {
    ruleId,
    severity: "ERROR",
    path: pathName,
    ...location,
    message,
    expected: String(expected),
    actual: String(actual),
    baselineStatus: "NOT_BASELINED",
  };
}

function isProtected(entry) {
  return entry && (entry.classification === "PROTECTED_IMMUTABLE" || entry.classification === "ARCHIVED");
}

function emptySummary() {
  return {
    documents: 0,
    strictDocuments: 0,
    baselineEntries: 0,
    protectedEntries: 0,
    linksChecked: 0,
    evidencePairsChecked: 0,
    evidenceHashesChecked: 0,
    activeAuthorityEvidenceChecked: 0,
    protectedHashesChecked: 0,
    blockingFindings: 0,
    baselinedFindings: 0,
  };
}

function blockedResult(mode, result, errorCode, errorPath, message) {
  return {
    schemaVersion: 1,
    mode,
    result,
    exitCode: 2,
    errorCode,
    error: { path: errorPath || null, message },
    summary: emptySummary(),
    findings: [],
  };
}

function baselineConfigurationError(root, baseline) {
  if (baseline.authority === null && Array.isArray(baseline.entries) && baseline.entries.length === 0) {
    return null;
  }
  if (baseline.schemaVersion !== 1) {
    return { code: "BASELINE_SCHEMA_INVALID", message: "Baseline schemaVersion must equal 1." };
  }
  if (!baseline.authority || typeof baseline.authority !== "object"
    || typeof baseline.authority.approvedBy !== "string" || !baseline.authority.approvedBy.trim()) {
    return { code: "BASELINE_AUTHORITY_INVALID", message: "Baseline authority.approvedBy is required." };
  }
  const baseCommit = baseline.authority.baseCommit;
  if (typeof baseCommit !== "string" || !/^[0-9a-f]{40}$/.test(baseCommit)) {
    return { code: "BASELINE_BASE_COMMIT_INVALID", message: "Baseline authority.baseCommit must be a 40-character lowercase commit SHA." };
  }
  try {
    runGit(root, ["rev-parse", "--verify", `${baseCommit}^{commit}`]);
  } catch {
    return { code: "BASELINE_BASE_COMMIT_UNRESOLVED", message: `Baseline authority.baseCommit cannot be resolved: ${baseCommit}` };
  }
  if (!Array.isArray(baseline.entries)) {
    return { code: "BASELINE_ENTRIES_INVALID", message: "Baseline entries must be an array." };
  }
  return null;
}

function readEvidenceLifecycle(root) {
  const lifecyclePath = "scripts/documentation-validation/evidence-lifecycle.json";
  const absolute = path.join(root, lifecyclePath);
  if (!fs.existsSync(absolute)) {
    return {
      path: lifecyclePath,
      schemaVersion: 1,
      legacyMixedEvidenceSources: [],
      activeAuthorityPaths: [],
      activeAuthorityPrefixes: [],
      historicalEvidence: [],
    };
  }
  try {
    return { path: lifecyclePath, ...JSON.parse(fs.readFileSync(absolute, "utf8")) };
  } catch (cause) {
    const error = new Error("Evidence lifecycle configuration is not valid JSON.");
    error.code = "EVIDENCE_LIFECYCLE_JSON_INVALID";
    error.path = lifecyclePath;
    error.cause = cause;
    throw error;
  }
}

function evidenceLifecycleConfigurationError(lifecycle) {
  if (lifecycle.schemaVersion !== 1) return "schemaVersion must equal 1";
  for (const key of [
    "legacyMixedEvidenceSources", "activeAuthorityPaths", "activeAuthorityPrefixes", "historicalEvidence",
  ]) {
    if (!Array.isArray(lifecycle[key])) return `${key} must be an array`;
  }
  const strings = [
    ...lifecycle.legacyMixedEvidenceSources,
    ...lifecycle.activeAuthorityPaths,
    ...lifecycle.activeAuthorityPrefixes,
  ];
  if (strings.some((value) => typeof value !== "string" || !value || path.isAbsolute(value))) {
    return "configured paths and prefixes must be non-empty repository-relative strings";
  }
  if (new Set(lifecycle.legacyMixedEvidenceSources).size !== lifecycle.legacyMixedEvidenceSources.length
    || new Set(lifecycle.activeAuthorityPaths).size !== lifecycle.activeAuthorityPaths.length
    || new Set(lifecycle.activeAuthorityPrefixes).size !== lifecycle.activeAuthorityPrefixes.length) {
    return "configured paths and prefixes must be unique";
  }
  for (const entry of lifecycle.historicalEvidence) {
    if (!entry || entry.evidenceClass !== "historical" || typeof entry.path !== "string"
      || !Number.isInteger(entry.sizeBytes) || entry.sizeBytes < 0
      || typeof entry.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(entry.sha256)) {
      return "historicalEvidence entries require path, historical class, sizeBytes, and lowercase SHA-256";
    }
  }
  return null;
}

function isActiveAuthorityPath(lifecycle, file) {
  return lifecycle.activeAuthorityPaths.includes(file)
    || lifecycle.activeAuthorityPrefixes.some((prefix) => file.startsWith(prefix));
}

function validateBaseline({
  root, baseline, baseBaseline, baselinePath, fileSet, changed, changedPathSet, findings,
}) {
  const entries = baseline.entries || [];
  const seenPaths = new Set();
  const knownRules = new Set(Object.values(RULES));

  if (baseBaseline && changedPathSet.has(baselinePath)) {
    findings.push(makeFinding(
      RULES.PROTECTED_BASELINE,
      baselinePath,
      "The reviewed baseline cannot change in ordinary documentation validation.",
      "separately authorized baseline-governance change",
      "baseline file changed",
    ));
  }
  for (const legacyPath of (baseline.authority && baseline.authority.legacyPaths) || []) {
    if (!entries.some((entry) => entry.path === legacyPath)) {
      findings.push(makeFinding(
        RULES.BASELINE_NEW,
        legacyPath,
        "Declared legacy inventory path has no exact reviewed baseline entry.",
        "exact baseline entry",
        "missing",
      ));
    }
  }

  for (const entry of entries) {
    if (!entry || typeof entry.path !== "string" || !entry.path) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE, baselinePath,
        "Baseline entry path must be a non-empty string.",
        "exact repository-relative path", "invalid path",
      ));
      continue;
    }
    if (seenPaths.has(entry.path)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE, entry.path,
        "Baseline contains a duplicate path.", "one entry per exact path", entry.path,
      ));
    }
    seenPaths.add(entry.path);
    if (/[?*[\]{}]/.test(entry.path) || entry.path.endsWith("/")) {
      findings.push(makeFinding(
        RULES.BASELINE_GLOB, entry.path,
        "Baseline entries must use exact file paths.",
        "exact repository-relative file path", entry.path,
      ));
      continue;
    }
    if (!BASELINE_CLASSIFICATIONS.has(entry.classification)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE, entry.path,
        "Baseline classification is not recognized.",
        [...BASELINE_CLASSIFICATIONS].join(", "), entry.classification,
      ));
    }
    if (!Array.isArray(entry.rules)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE, entry.path,
        "Baseline entry rules must be an array.",
        "array of known unique rule IDs", typeof entry.rules,
      ));
    } else {
      const seenRules = new Set();
      for (const ruleId of entry.rules) {
        if (!knownRules.has(ruleId) || seenRules.has(ruleId)) {
          findings.push(makeFinding(
            RULES.PROTECTED_BASELINE, entry.path,
            !knownRules.has(ruleId)
              ? "Baseline entry references an unknown rule ID."
              : "Baseline entry repeats a rule ID.",
            "known unique rule IDs", ruleId,
          ));
        }
        seenRules.add(ruleId);
      }
    }
    if (!fileSet.has(entry.path)) {
      if (isProtected(entry)) {
        findings.push(makeFinding(
          RULES.PROTECTED_PATH, entry.path,
          "Protected baseline path is missing, deleted, or moved.",
          "unchanged protected path", "missing",
        ));
      }
      findings.push(makeFinding(
        RULES.BASELINE_PATH, entry.path,
        "Baseline entry points to a missing path.",
        "existing tracked document", "missing",
      ));
      continue;
    }
    if (!entry.reason || !entry.sourceFinding || !Array.isArray(entry.rules)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE, entry.path,
        "Baseline entry lacks required review provenance.",
        "reason, sourceFinding, and rules", "incomplete entry",
      ));
    }
    if (isProtected(entry)) {
      const bytes = fs.readFileSync(path.join(root, entry.path));
      const digest = sha256(bytes);
      if (bytes.length !== entry.sizeBytes || digest !== entry.sha256) {
        findings.push(makeFinding(
          RULES.PROTECTED_HASH, entry.path,
          "Protected document bytes differ from the reviewed baseline.",
          `${entry.sizeBytes} bytes / ${entry.sha256}`,
          `${bytes.length} bytes / ${digest}`,
        ));
      }
      if (changedPathSet.has(entry.path)) {
        findings.push(makeFinding(
          entry.classification === "ARCHIVED" ? RULES.PROTECTED_ARCHIVE_CHANGE : RULES.PROTECTED_HASH,
          entry.path,
          "Protected or archived evidence changed in the current diff.",
          "unchanged protected bytes", "changed",
        ));
      }
    }
  }

  if (!baseBaseline) return;
  const currentByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const baseEntries = baseBaseline.entries || [];
  const baseByPath = new Map(baseEntries.map((entry) => [entry.path, entry]));
  for (const baseEntry of baseEntries) {
    const current = currentByPath.get(baseEntry.path);
    if (!current && isProtected(baseEntry)) {
      findings.push(makeFinding(
        RULES.PROTECTED_PATH, baseEntry.path,
        "Protected baseline entry was removed.", baseEntry.classification, "entry removed",
      ));
    }
    if (current && isProtected(baseEntry) && !isProtected(current)) {
      findings.push(makeFinding(
        RULES.BASELINE_REGRESSION, baseEntry.path,
        "Protected classification was weakened.", baseEntry.classification, current.classification,
      ));
    }
    if (current && Array.isArray(baseEntry.rules) && Array.isArray(current.rules)) {
      const addedRules = current.rules.filter((ruleId) => !baseEntry.rules.includes(ruleId));
      if (addedRules.length) {
        findings.push(makeFinding(
          RULES.BASELINE_REGRESSION, baseEntry.path,
          "Baseline rule exemptions increased.", "no new rule exemptions", addedRules.join(", "),
        ));
      }
    }
  }
  for (const current of entries) {
    if (!baseByPath.has(current.path)) {
      findings.push(makeFinding(
        RULES.BASELINE_REGRESSION, current.path,
        "Baseline entry count increased in ordinary changed mode.",
        "no new baseline entries", "entry added",
      ));
    }
  }
  for (const diff of changed) {
    const oldEntry = diff.oldPath ? baseByPath.get(diff.oldPath) : baseByPath.get(diff.path);
    const newEntry = currentByPath.get(diff.path);
    if (((oldEntry && isProtected(oldEntry)) || (newEntry && isProtected(newEntry)))
      && (diff.status === "D" || diff.status.startsWith("R") || diff.status.startsWith("C"))) {
      findings.push(makeFinding(
        RULES.PROTECTED_PATH, (oldEntry && oldEntry.path) || diff.oldPath || diff.path,
        "Protected path was deleted, renamed, moved, or copied.",
        "unchanged protected path",
        `status=${diff.status}; oldPath=${diff.oldPath || diff.path}; newPath=${diff.path || "deleted"}`,
      ));
    }
  }
}

function validateName(file, findings) {
  const base = path.posix.basename(file);
  if (/^(final\d*|latest|new-plan|fixed|debug-copy|report-final-final)\.(md|json)$/i.test(base)) {
    findings.push(makeFinding(
      RULES.NAME_AMBIGUOUS,
      file,
      "Ambiguous recency-based filename is forbidden.",
      "stable purpose and document type",
      base,
    ));
  }
  if (file === "README.md") return;
  if (/^docs\/[^/]+\.md$/.test(file) && !/^[A-Z][A-Z0-9_]*\.md$/.test(base)) {
    findings.push(makeFinding(
      RULES.NAME_LONG_LIVED,
      file,
      "Long-lived documentation must use UPPER_SNAKE_CASE.md.",
      "UPPER_SNAKE_CASE.md",
      base,
    ));
  }
  if (/^docs\/repository-maintenance\/pr-[^/]+\/.*\.md$/.test(file)
    && !/^PR\d{2}[A-Z]?_[A-Z0-9_]+\.md$/.test(base)) {
    findings.push(makeFinding(
      RULES.NAME_MAINTENANCE_MD,
      file,
      "Maintenance Markdown filename does not follow the PR convention.",
      "PR{NN}_{PURPOSE}_{TYPE}.md",
      base,
    ));
  }
  if (/^docs\/repository-maintenance\/pr-[^/]+\/.*\.json$/.test(file)
    && !/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(base)) {
    findings.push(makeFinding(
      RULES.NAME_PAIRED_JSON,
      file,
      "Paired JSON filename must use lowercase kebab-case.",
      "lowercase-kebab-case.json",
      base,
    ));
  }
}

function validateMetadata(file, text, metadata, findings) {
  const required = [
    ["Status", RULES.META_STATUS],
    ["Owner", RULES.META_OWNER],
    ["Created at", RULES.META_CREATED_AT],
    ["Authoritative scope", RULES.META_AUTHORITY],
    ["Related documents", RULES.META_RELATED],
  ];
  for (const [key, ruleId] of required) {
    if (!metadata[key]) {
      findings.push(makeFinding(
        ruleId,
        file,
        `Required top-of-document metadata is missing: ${key}.`,
        key,
        "missing",
      ));
    }
  }
  const status = metadata.Status && metadata.Status.value;
  if (status && status.startsWith("PASS_")) {
    findings.push(makeFinding(
      RULES.LIFECYCLE_PASS_STATUS,
      file,
      "PASS_* cannot be used as a lifecycle Status.",
      "allowed lifecycle status",
      status,
      { line: metadata.Status.line },
    ));
  } else if (status && !ALLOWED_STATUSES.has(status)) {
    findings.push(makeFinding(
      RULES.LIFECYCLE_INVALID,
      file,
      "Lifecycle Status is not recognized.",
      [...ALLOWED_STATUSES].join(", "),
      status,
      { line: metadata.Status.line },
    ));
  }
  if (metadata["Created at"] && !utcIso(metadata["Created at"].value)) {
    findings.push(makeFinding(
      RULES.META_CREATED_AT,
      file,
      "Created at must use UTC ISO 8601.",
      "YYYY-MM-DDTHH:mm:ssZ",
      metadata["Created at"].value,
      { line: metadata["Created at"].line },
    ));
  }
  if (metadata["Reviewed at"] && !utcIso(metadata["Reviewed at"].value)) {
    findings.push(makeFinding(
      RULES.LIFECYCLE_APPROVAL,
      file,
      "Reviewed at must use UTC ISO 8601.",
      "YYYY-MM-DDTHH:mm:ssZ",
      metadata["Reviewed at"].value,
      { line: metadata["Reviewed at"].line },
    ));
  }
  const hasApproval = metadata.Approval && metadata.Approval.value === "APPROVED_BY_HUMAN_REVIEW";
  if (hasApproval && (!metadata.Reviewer || !metadata["Reviewed at"])) {
    findings.push(makeFinding(
      RULES.LIFECYCLE_APPROVAL,
      file,
      "Human approval metadata is incomplete.",
      "Approval, Reviewer, and Reviewed at",
      "incomplete",
    ));
  }
  if (metadata["Effective upon merge"]) {
    if (!/^GitHub PR #\d+$/.test(metadata["Effective upon merge"].value)
      || status !== "CURRENT" || !hasApproval) {
      findings.push(makeFinding(
        RULES.LIFECYCLE_APPROVAL,
        file,
        "Conditional activation requires CURRENT, human approval, and a GitHub PR number.",
        "CURRENT + APPROVED_BY_HUMAN_REVIEW + GitHub PR #N",
        `${status || "missing"} / ${metadata["Effective upon merge"].value}`,
      ));
    }
  }
  if (status === "SUPERSEDED") {
    const missing = ["Superseded by", "Superseded at", "Replacement commit or PR"]
      .filter((key) => !metadata[key]);
    if (missing.length) {
      findings.push(makeFinding(
        RULES.LIFECYCLE_SUPERSEDED,
        file,
        "SUPERSEDED document lacks replacement metadata.",
        "Superseded by/at and replacement commit or PR",
        missing.join(", "),
      ));
    }
  }
  if (/\/Users\/|[A-Za-z]:\\\\|file:\/\//.test(text)) {
    findings.push(makeFinding(
      RULES.LINK_ABSOLUTE,
      file,
      "Committed documentation contains a local absolute path.",
      "repository-relative path",
      "local absolute path",
    ));
  }
}

function resolveLink(fromFile, destination) {
  const hashIndex = destination.indexOf("#");
  const rawPath = hashIndex === -1 ? destination : destination.slice(0, hashIndex);
  const anchor = hashIndex === -1 ? "" : decodeURIComponent(destination.slice(hashIndex + 1)).toLowerCase();
  const decoded = decodeURIComponent(rawPath);
  const target = decoded
    ? path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), decoded))
    : fromFile;
  return { target, anchor };
}

function validateLinks({ root, file, text, fileSet, headingsByFile, findings, summary }) {
  for (const link of parseLinks(text)) {
    const destination = link.destination;
    if (/^(https?:|mailto:)/i.test(destination)) continue;
    summary.linksChecked += 1;
    if (/^(?:\/|file:)|^[A-Za-z]:[\\/]/.test(destination)) {
      findings.push(makeFinding(
        RULES.LINK_ABSOLUTE,
        file,
        "Local documentation links must be repository-relative.",
        "relative path",
        destination,
        { line: link.line },
      ));
      continue;
    }
    let resolved;
    try {
      resolved = resolveLink(file, destination);
    } catch {
      findings.push(makeFinding(
        RULES.LINK_MISSING,
        file,
        "Documentation link contains invalid percent encoding.",
        "valid URL encoding",
        destination,
        { line: link.line },
      ));
      continue;
    }
    const { target, anchor } = resolved;
    if (target.startsWith("docs/archive/")
      && /(?:current\s+authority|authoritative)/i.test(link.label)) {
      findings.push(makeFinding(
        RULES.LINK_ARCHIVE_CURRENT,
        file,
        "A current-authority link cannot target archived documentation.",
        "active non-archive authority target",
        target,
        { line: link.line },
      ));
    }
    const targetExists = fileSet.has(target)
      || fs.existsSync(path.join(root, target));
    if (!targetExists) {
      findings.push(makeFinding(
        RULES.LINK_MISSING,
        file,
        "Repository-relative link target does not exist.",
        target,
        "missing",
        { line: link.line },
      ));
      continue;
    }
    if (anchor && target.endsWith(".md")) {
      const headings = headingsByFile.get(target)
        || parseHeadings(fs.readFileSync(path.join(root, target), "utf8"));
      headingsByFile.set(target, headings);
      if (!headings.has(anchor)) {
        findings.push(makeFinding(
          RULES.LINK_ANCHOR,
          file,
          "Markdown link anchor does not exist.",
          `#${anchor}`,
          "missing anchor",
          { line: link.line },
        ));
      }
    }
  }
}

function validateAuthority({ root, fileSet, metadataByFile, findings }) {
  const file = "docs/AUTHORITATIVE_DOCUMENT_MAP.md";
  if (!fileSet.has(file)) return;
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const subjects = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.startsWith("|") || line.includes("---") || line.includes("Information subject")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) continue;
    const subject = cells[0];
    if (subjects.has(subject)) {
      findings.push(makeFinding(
        RULES.AUTH_DUPLICATE,
        file,
        "Authority subject appears more than once.",
        "unique subject",
        subject,
        { line: index + 1 },
      ));
    }
    subjects.set(subject, index + 1);
    const match = cells[1].match(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/);
    if (!match) continue;
    let target;
    try {
      target = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(match[1])));
    } catch {
      findings.push(makeFinding(
        RULES.LINK_MISSING, file,
        "Authority-map link contains invalid percent encoding.",
        "valid URL encoding", match[1], { line: index + 1 },
      ));
      continue;
    }
    if (!fileSet.has(target)) {
      findings.push(makeFinding(
        RULES.AUTH_TARGET_MISSING,
        file,
        "Authority target does not exist.",
        target,
        "missing",
        { line: index + 1 },
      ));
    }
    if (target.startsWith("docs/archive/")) {
      findings.push(makeFinding(
        RULES.AUTH_ARCHIVE,
        file,
        "Archive content cannot be current authority.",
        "non-archive target",
        target,
        { line: index + 1 },
      ));
    }
    const targetStatus = metadataByFile.get(target);
    if (targetStatus && ["DRAFT", "BLOCKED"].includes(targetStatus.Status && targetStatus.Status.value)) {
      findings.push(makeFinding(
        RULES.AUTH_TARGET_STATE,
        file,
        "Authority target has a non-authoritative lifecycle state.",
        "not DRAFT or BLOCKED",
        targetStatus.Status.value,
        { line: index + 1 },
      ));
    }
  }
}

function validateLifecycleNavigation({ root, fileSet, metadataByFile, findings }) {
  const navigationPaths = ["docs/DOCUMENTATION_INDEX.md", "docs/AUTHORITATIVE_DOCUMENT_MAP.md"];
  if (!navigationPaths.every((file) => fileSet.has(file))) return;
  const navigationText = navigationPaths.map((file) => fs.readFileSync(path.join(root, file), "utf8"));
  for (const [file, metadata] of metadataByFile.entries()) {
    if (navigationPaths.includes(file)) continue;
    const status = metadata.Status && metadata.Status.value;
    const scope = metadata["Authoritative scope"] && metadata["Authoritative scope"].value;
    if (status !== "CURRENT" || !scope || scope === "NONE") continue;
    const relativeFromDocs = file.startsWith("docs/") ? file.slice("docs/".length) : file;
    if (!navigationText.every((text) => text.includes(relativeFromDocs) || text.includes(file))) {
      findings.push(makeFinding(
        RULES.LIFECYCLE_AUTHORITY_SYNC,
        file,
        "CURRENT authoritative documentation is not synchronized across root navigation and authority map.",
        "listed in DOCUMENTATION_INDEX.md and AUTHORITATIVE_DOCUMENT_MAP.md",
        "navigation declaration missing",
      ));
    }
  }
}

function evidenceEntryValid(entry, evidenceClass = entry && entry.evidenceClass) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)
    || typeof entry.path !== "string" || entry.path.length === 0) return false;
  if (evidenceClass === "active-authority") return true;
  return evidenceClass === "historical"
    && Number.isInteger(entry.sizeBytes) && entry.sizeBytes >= 0
    && typeof entry.sha256 === "string" && /^[0-9a-f]{64}$/.test(entry.sha256);
}

function validateEvidenceEntries({
  root, file, list, pointer, fileSet, findings, summary, protectedList, lifecycle,
  allowLegacyClassInference = false,
}) {
  const legacySource = allowLegacyClassInference
    || lifecycle.legacyMixedEvidenceSources.includes(file);
  for (const [index, entry] of list.entries()) {
    const entryPointer = `${pointer}/${index}`;
    let evidenceClass = entry && entry.evidenceClass;
    if (evidenceClass === undefined && legacySource && entry && typeof entry.path === "string") {
      evidenceClass = isActiveAuthorityPath(lifecycle, entry.path) ? "active-authority" : "historical";
    } else if (evidenceClass === undefined) {
      findings.push(makeFinding(
        RULES.EVIDENCE_CLASS_MISSING,
        file,
        "Evidence entry is missing evidenceClass.",
        "historical or active-authority",
        "missing",
        { pointer: entryPointer },
      ));
      continue;
    }
    if (!EVIDENCE_CLASSES.has(evidenceClass)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_CLASS_INVALID,
        file,
        "Evidence entry has an invalid evidenceClass.",
        "historical or active-authority",
        evidenceClass,
        { pointer: entryPointer },
      ));
      continue;
    }
    if (entry && typeof entry.path === "string") {
      const activePath = isActiveAuthorityPath(lifecycle, entry.path);
      if ((evidenceClass === "historical" && activePath)
        || (evidenceClass === "active-authority" && !activePath)) {
        findings.push(makeFinding(
          RULES.EVIDENCE_CLASS_CONFLICT,
          file,
          "Evidence class conflicts with the active-authority lifecycle registry.",
          activePath ? "active-authority" : "historical",
          evidenceClass,
          { pointer: entryPointer },
        ));
        continue;
      }
    }
    if (!evidenceEntryValid(entry, evidenceClass)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_ENTRY_MALFORMED,
        file,
        "Evidence entry does not match the schema for its evidenceClass.",
        evidenceClass === "historical"
          ? "historical entry with path, sizeBytes, and lowercase SHA-256"
          : "active-authority entry with path",
        JSON.stringify(entry),
        { pointer: entryPointer },
      ));
      continue;
    }
    if (entry.path === file) {
      findings.push(makeFinding(
        RULES.EVIDENCE_SELF_HASH,
        file,
        "Evidence JSON must not hash itself (SELF_HASH_ENTRY_PRESENT).",
        "self hash excluded",
        entry.path,
        { pointer: entryPointer },
      ));
      continue;
    }
    if (!fileSet.has(entry.path)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_PAIR_MISSING,
        file,
        protectedList ? "Manifest-protected file is missing." : "Evidence file is missing.",
        entry.path,
        "missing",
        { pointer: entryPointer },
      ));
      continue;
    }
    if (evidenceClass === "active-authority") {
      summary.activeAuthorityEvidenceChecked += 1;
      continue;
    }
    if (protectedList) summary.protectedHashesChecked += 1;
    else summary.evidenceHashesChecked += 1;
    const bytes = fs.readFileSync(path.join(root, entry.path));
    const digest = sha256(bytes);
    if (bytes.length !== entry.sizeBytes) {
      findings.push(makeFinding(
        RULES.EVIDENCE_SIZE,
        entry.path,
        "Recorded evidence size does not match actual bytes.",
        entry.sizeBytes,
        bytes.length,
      ));
    }
    if (digest !== entry.sha256) {
      findings.push(makeFinding(
        RULES.EVIDENCE_HASH,
        entry.path,
        "Recorded evidence SHA-256 does not match actual bytes.",
        entry.sha256,
        digest,
      ));
    }
  }
}

function evidencePairComparisons(json) {
  const finalHead = json.finalPrHeadSha === null ? "PENDING" : json.finalPrHeadSha;
  return [
    ["Task", json.task],
    ["Status", json.status],
    ["Result", json.result],
    ["Base SHA", json.baseSha],
    ["Validated implementation SHA", json.validatedImplementationSha],
    ["Final PR head SHA", finalHead],
    ["Generated at", json.generatedAt],
    ["Tests cases", json.tests && json.tests.cases],
    ["Tests passed", json.tests && json.tests.passed],
    ["Tests failed", json.tests && json.tests.failed],
    ["Blocking findings", json.summary && json.summary.blockingFindings],
    ["Baselined findings", json.summary && json.summary.baselinedFindings],
    ["Changed files", json.gitBoundary && json.gitBoundary.changedFiles],
    ["Files deleted", json.gitBoundary && json.gitBoundary.filesDeleted],
    ["Files renamed", json.gitBoundary && json.gitBoundary.filesRenamed],
    ["Files moved", json.gitBoundary && json.gitBoundary.filesMoved],
    ["Line additions", json.gitBoundary && json.gitBoundary.lineAdditions],
    ["Line deletions", json.gitBoundary && json.gitBoundary.lineDeletions],
    ["Human review decision", json.humanReview && json.humanReview.decision],
  ];
}

function validateSuccessEvidence(file, json, findings) {
  const fail = (pointer, message, expected, actual) => findings.push(makeFinding(
    RULES.EVIDENCE_FALSE_PASS, file, message, expected, actual, { pointer },
  ));
  const requiredObjects = ["validation", "tests", "gitBoundary", "humanReview"];
  for (const key of requiredObjects) {
    if (!json[key] || typeof json[key] !== "object" || Array.isArray(json[key])) {
      fail(`/${key}`, "Successful evidence lacks a required gate object.", "object", "missing or invalid");
    }
  }
  if (!json.validation || !json.tests || !json.gitBoundary || !json.humanReview) return;
  if (!Number.isInteger(json.tests.cases) || json.tests.failed !== 0
    || json.tests.passed !== json.tests.cases) {
    fail("/tests", "Successful evidence contains failed or incomplete tests.",
      "failed=0 and passed=cases", JSON.stringify(json.tests));
  }
  const requiredGates = [
    "fullMode", "changedMode", "links", "authority", "evidencePairs",
    "protectedEvidence", "baseline", "gitDiffCheck", "readOnlyDefault",
  ];
  for (const gate of requiredGates) {
    if (json.validation[gate] !== "PASS") {
      fail(`/validation/${gate}`, "Successful evidence gate is missing or not PASS.", "PASS", json.validation[gate]);
    }
  }
  for (const key of ["filesDeleted", "filesRenamed", "filesMoved"]) {
    if (json.gitBoundary[key] !== 0) {
      fail(`/gitBoundary/${key}`, "Successful evidence exceeds its declared Git boundary.", 0, json.gitBoundary[key]);
    }
  }
  const serialized = JSON.stringify(json.validation);
  if (serialized.includes("NOT_RUN") || serialized.includes("BLOCKED")) {
    fail("/validation", "Successful evidence contains an unexecuted or blocked validation.",
      "all required validation facts executed", "NOT_RUN or BLOCKED");
  }
}

function validateHumanReviewState(file, json, findings) {
  if (!json.status || !json.humanReview) return;
  const review = json.humanReview;
  let valid = true;
  if (json.status === "READY_FOR_HUMAN_REVIEW") {
    valid = review.decision === "PENDING" && !review.reviewer && !review.reviewedAt;
  } else if (["APPROVED", "CURRENT"].includes(json.status)) {
    valid = review.decision === "APPROVE" && typeof review.reviewer === "string"
      && review.reviewer.length > 0 && utcIso(review.reviewedAt);
  }
  if (!valid) {
    findings.push(makeFinding(
      RULES.EVIDENCE_FALSE_PASS,
      file,
      "Evidence lifecycle status conflicts with human-review metadata.",
      "review state consistent with status",
      JSON.stringify(review),
      { pointer: "/humanReview" },
    ));
  }
}

function validateEvidenceJson({
  root, file, json, fileSet, metadataByFile, findings, summary, lifecycle, historical = false,
}) {
  if (Object.hasOwn(json, "files")) {
    if (!Array.isArray(json.files)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_ENTRY_MALFORMED, file,
        "Evidence files field must be an array.", "array", typeof json.files,
        { pointer: "/files" },
      ));
    } else {
      validateEvidenceEntries({
        root, file, list: json.files, pointer: "/files", fileSet, findings, summary, protectedList: true, lifecycle,
        allowLegacyClassInference: historical,
      });
    }
  }
  if (Object.hasOwn(json, "evidenceFiles")) {
    if (!Array.isArray(json.evidenceFiles)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_ENTRY_MALFORMED, file,
        "Evidence files field must be an array.", "array", typeof json.evidenceFiles,
        { pointer: "/evidenceFiles" },
      ));
    } else {
      if (json.selfHash !== "SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE") {
        findings.push(makeFinding(
          RULES.EVIDENCE_SELF_HASH, file,
          json.selfHash === undefined ? "Evidence selfHash marker is missing (SELF_HASH_MARKER_MISSING)."
            : "Evidence selfHash marker is invalid (SELF_HASH_MARKER_INVALID).",
          "SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE",
          json.selfHash,
          { pointer: "/selfHash" },
        ));
      }
      validateEvidenceEntries({
        root, file, list: json.evidenceFiles, pointer: "/evidenceFiles", fileSet, findings, summary, protectedList: false, lifecycle,
        allowLegacyClassInference: historical,
      });
    }
  }
  if (historical) return;
  if (json.markdownReport) {
    summary.evidencePairsChecked += 1;
    if (!fileSet.has(json.markdownReport)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_PAIR_MISSING, file,
        "Declared Markdown evidence report is missing.", json.markdownReport, "missing",
        { pointer: "/markdownReport" },
      ));
    } else {
      const md = metadataByFile.get(json.markdownReport)
        || parseMetadata(fs.readFileSync(path.join(root, json.markdownReport), "utf8"));
      const mismatches = evidencePairComparisons(json).filter(([key, value]) =>
        value === undefined || !md[key] || md[key].value !== String(value));
      if (mismatches.length) {
        findings.push(makeFinding(
          RULES.EVIDENCE_PAIR_MISMATCH, file,
          "Markdown and JSON evidence fields differ or are missing.",
          "identity, SHA, test, summary, Git-boundary, and review fields match",
          mismatches.map(([key]) => key).join(", "),
          { pointer: "/" },
        ));
      }
    }
  }
  const successful = typeof json.result === "string"
    && (json.result.startsWith("PASS_") || json.result.startsWith("READY_"));
  if (successful) validateSuccessEvidence(file, json, findings);
  validateHumanReviewState(file, json, findings);
}

function applyBaseline(findings, baselineByPath, strictPaths) {
  for (const finding of findings) {
    const entry = baselineByPath.get(finding.path);
    if (!entry || strictPaths.has(finding.path) || isProtected(entry)) continue;
    if (entry.rules.includes(finding.ruleId)) {
      finding.severity = "INFO";
      finding.baselineStatus = "BASELINED";
    }
  }
}

function validateRepositoryUnsafe(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const mode = options.mode || "full";
  const baselinePath = options.baselinePath || "docs/documentation-validation-baseline.json";
  if (!["full", "changed"].includes(mode)) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_USAGE",
      "UNSUPPORTED_MODE",
      null,
      `Unsupported mode: ${mode}`,
    );
  }
  let changed = [];
  try {
    if (mode === "changed") changed = parseChangedFiles(root, options.base);
  } catch (error) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_BASE_UNRESOLVED",
      error.code || "BASE_UNRESOLVED",
      null,
      error.message,
    );
  }

  let baseline;
  let baseBaseline = null;
  let lifecycle;
  try {
    baseline = readBaseline(root, baselinePath);
    lifecycle = readEvidenceLifecycle(root);
    if (mode === "changed") baseBaseline = readBaselineAtRef(root, options.base, baselinePath);
  } catch (error) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_CONFIGURATION",
      error.code || "BASELINE_READ_FAILED",
      error.path || baselinePath,
      error.message,
    );
  }
  const baselineError = baselineConfigurationError(root, baseline);
  if (baselineError) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_CONFIGURATION",
      baselineError.code,
      baselinePath,
      baselineError.message,
    );
  }
  const lifecycleError = evidenceLifecycleConfigurationError(lifecycle);
  if (lifecycleError) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_CONFIGURATION",
      "EVIDENCE_LIFECYCLE_INVALID",
      lifecycle.path,
      lifecycleError,
    );
  }

  let allFiles;
  try {
    allFiles = discoverFiles(root);
  } catch (error) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_IO",
      "FILE_DISCOVERY_FAILED",
      null,
      error.message,
    );
  }
  const documentFiles = allFiles.filter((file) => file === "README.md"
    || (file.startsWith("docs/") && /\.(md|json)$/.test(file)));
  const fileSet = new Set(allFiles);
  const baselineByPath = new Map((baseline.entries || []).map((entry) => [entry.path, entry]));
  const changedPathSet = new Set();
  for (const entry of changed) {
    if (entry.oldPath) changedPathSet.add(entry.oldPath);
    if (entry.path) changedPathSet.add(entry.path);
  }
  const strictPaths = new Set(documentFiles.filter((file) => !baselineByPath.has(file)));
  if (mode === "changed") {
    for (const file of changedPathSet) {
      if (documentFiles.includes(file) && !isProtected(baselineByPath.get(file))) strictPaths.add(file);
    }
  }

  const findings = [];
  const summary = {
    documents: documentFiles.length,
    strictDocuments: strictPaths.size,
    baselineEntries: (baseline.entries || []).length,
    protectedEntries: (baseline.entries || []).filter(isProtected).length,
    linksChecked: 0,
    evidencePairsChecked: 0,
    evidenceHashesChecked: 0,
    activeAuthorityEvidenceChecked: 0,
    protectedHashesChecked: 0,
    rulesDefined: Object.values(RULES).length,
    rulesImplemented: IMPLEMENTED_RULES.size,
  };
  try {
    validateBaseline({
      root,
      baseline,
      baseBaseline,
      baselinePath,
      fileSet,
      changed,
      changedPathSet,
      findings,
    });
    validateEvidenceEntries({
      root,
      file: lifecycle.path,
      list: lifecycle.historicalEvidence,
      pointer: "/historicalEvidence",
      fileSet,
      findings,
      summary,
      protectedList: true,
      lifecycle,
    });
  } catch (error) {
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_IO",
      "PROTECTED_FILE_READ_FAILED",
      null,
      error.message,
    );
  }
  const metadataByFile = new Map();
  const headingsByFile = new Map();

  for (const file of documentFiles) {
    const entry = baselineByPath.get(file);
    const absolute = path.join(root, file);
    if (isProtected(entry)) {
      if (file.endsWith(".json")) {
        try {
          const json = JSON.parse(fs.readFileSync(absolute, "utf8"));
          if (Array.isArray(json.files)) {
            validateEvidenceJson({
              root, file, json, fileSet, metadataByFile, findings, summary, lifecycle, historical: true,
            });
          }
        } catch (error) {
          findings.push(makeFinding(
            RULES.EVIDENCE_JSON_PARSE,
            file,
            "Protected JSON evidence cannot be parsed.",
            "valid JSON",
            error.message,
          ));
        }
      }
      continue;
    }
    validateName(file, findings);
    if (file.endsWith(".md")) {
      const text = fs.readFileSync(absolute, "utf8");
      const metadata = parseMetadata(text);
      metadataByFile.set(file, metadata);
      headingsByFile.set(file, parseHeadings(text));
      validateMetadata(file, text, metadata, findings);
      validateLinks({ root, file, text, fileSet, headingsByFile, findings, summary });
    } else {
      let json;
      try {
        json = JSON.parse(fs.readFileSync(absolute, "utf8"));
      } catch (error) {
        findings.push(makeFinding(
          RULES.EVIDENCE_JSON_PARSE,
          file,
          "JSON document cannot be parsed.",
          "valid JSON",
          error.message,
        ));
        continue;
      }
      validateEvidenceJson({ root, file, json, fileSet, metadataByFile, findings, summary, lifecycle });
    }
  }

  validateAuthority({ root, fileSet, metadataByFile, findings });
  validateLifecycleNavigation({ root, fileSet, metadataByFile, findings });
  if (mode === "changed") {
    for (const entry of changed) {
      if (entry.status === "D") {
        for (const file of documentFiles.filter((candidate) => candidate.endsWith(".md"))) {
          const text = fs.readFileSync(path.join(root, file), "utf8");
          for (const link of parseLinks(text)) {
            if (/^(https?:|mailto:)/i.test(link.destination)) continue;
            let target;
            try {
              target = resolveLink(file, link.destination).target;
            } catch {
              continue;
            }
            if (target === entry.path) {
              findings.push(makeFinding(
                RULES.LINK_DELETED_TARGET,
                file,
                "Deleted documentation target still has an inbound link.",
                "link updated or removed",
                entry.path,
                { line: link.line },
              ));
            }
          }
        }
      }
    }
    const newAuthorityDocs = [...strictPaths].filter((file) => {
      const meta = metadataByFile.get(file);
      return meta && meta["Authoritative scope"] && meta["Authoritative scope"].value !== "NONE"
        && changedPathSet.has(file);
    });
    if (newAuthorityDocs.length
      && (!changedPathSet.has("docs/DOCUMENTATION_INDEX.md")
        || !changedPathSet.has("docs/AUTHORITATIVE_DOCUMENT_MAP.md"))) {
      findings.push(makeFinding(
        RULES.AUTH_SYNC,
        newAuthorityDocs[0],
        "Authoritative documentation changed without synchronized index and authority map updates.",
        "DOCUMENTATION_INDEX.md and AUTHORITATIVE_DOCUMENT_MAP.md changed",
        "navigation update missing",
      ));
    }
  }

  for (const entry of baseline.entries || []) {
    if (entry.classification !== "LEGACY_BASELINED" || strictPaths.has(entry.path)) continue;
    const activeRules = new Set(
      findings.filter((finding) => finding.path === entry.path).map((finding) => finding.ruleId),
    );
    for (const ruleId of entry.rules) {
      if (!activeRules.has(ruleId)) {
        findings.push(makeFinding(
          RULES.BASELINE_STALE,
          entry.path,
          "A reviewed legacy violation is no longer present but remains in the baseline.",
          `remove stale ${ruleId} entry through reviewed baseline governance`,
          "stale baseline rule",
        ));
      }
    }
  }

  applyBaseline(findings, baselineByPath, strictPaths);
  const sorted = sortFindings(findings);
  summary.blockingFindings = sorted.filter((finding) => finding.severity === "ERROR").length;
  summary.baselinedFindings = sorted.filter((finding) => finding.baselineStatus === "BASELINED").length;
  const passed = summary.blockingFindings === 0;
  return {
    schemaVersion: 1,
    mode,
    result: passed ? "PASS_DOCUMENTATION_VALIDATION" : "BLOCKED_DOCUMENTATION_VALIDATION",
    exitCode: passed ? 0 : 1,
    summary,
    findings: sorted,
  };
}

function validateRepository(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const mode = options.mode || "full";
  try {
    return validateRepositoryUnsafe(options);
  } catch (error) {
    let errorPath = null;
    if (typeof error.path === "string") {
      const relative = path.relative(root, error.path);
      if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) errorPath = toPosix(relative);
    }
    return blockedResult(
      mode,
      "BLOCKED_DOCUMENTATION_VALIDATION_INTERNAL_ERROR",
      "DOCUMENTATION_VALIDATOR_INTERNAL_ERROR",
      errorPath,
      error.message || String(error),
    );
  }
}

module.exports = {
  discoverFiles,
  evidenceEntryValid,
  sha256,
  validateRepository,
};
