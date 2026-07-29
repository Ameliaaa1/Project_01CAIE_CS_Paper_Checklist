"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ALLOWED_STATUSES, BASELINE_CLASSIFICATIONS, RULES } = require("./constants");
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
  if (!fs.existsSync(absolute)) return { schemaVersion: 1, authority: {}, entries: [] };
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
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
  const output = runGit(root, ["diff", "--name-status", `${base}...HEAD`]);
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

function validateBaseline({ root, baseline, fileSet, changedPathSet, findings }) {
  for (const entry of baseline.entries || []) {
    if (/[?*[\]{}]/.test(entry.path) || entry.path.endsWith("/")) {
      findings.push(makeFinding(
        RULES.BASELINE_GLOB,
        entry.path,
        "Baseline entries must use exact file paths.",
        "exact repository-relative file path",
        entry.path,
      ));
      continue;
    }
    if (!BASELINE_CLASSIFICATIONS.has(entry.classification)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE,
        entry.path,
        "Baseline classification is not recognized.",
        [...BASELINE_CLASSIFICATIONS].join(", "),
        entry.classification,
      ));
    }
    if (!fileSet.has(entry.path)) {
      findings.push(makeFinding(
        RULES.BASELINE_PATH,
        entry.path,
        "Baseline entry points to a missing path.",
        "existing tracked document",
        "missing",
      ));
      continue;
    }
    if (!entry.reason || !entry.sourceFinding || !Array.isArray(entry.rules)) {
      findings.push(makeFinding(
        RULES.PROTECTED_BASELINE,
        entry.path,
        "Baseline entry lacks required review provenance.",
        "reason, sourceFinding, and rules",
        "incomplete entry",
      ));
    }
    if (isProtected(entry)) {
      const bytes = fs.readFileSync(path.join(root, entry.path));
      if (bytes.length !== entry.sizeBytes || sha256(bytes) !== entry.sha256) {
        findings.push(makeFinding(
          RULES.PROTECTED_HASH,
          entry.path,
          "Protected document bytes differ from the reviewed baseline.",
          `${entry.sizeBytes} bytes / ${entry.sha256}`,
          `${bytes.length} bytes / ${sha256(bytes)}`,
        ));
      }
      if (changedPathSet.has(entry.path)) {
        findings.push(makeFinding(
          entry.classification === "ARCHIVED" ? RULES.PROTECTED_ARCHIVE_CHANGE : RULES.PROTECTED_HASH,
          entry.path,
          "Protected or archived evidence changed in the current diff.",
          "unchanged protected bytes",
          "changed",
        ));
      }
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
    const { target, anchor } = resolveLink(file, destination);
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
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(match[1])));
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

function validateEvidenceJson({ root, file, json, fileSet, metadataByFile, findings, summary }) {
  if (Array.isArray(json.files)) {
    for (const entry of json.files) {
      if (!entry || typeof entry.path !== "string" || !entry.sha256) continue;
      summary.protectedHashesChecked += 1;
      if (!fileSet.has(entry.path)) {
        findings.push(makeFinding(
          RULES.EVIDENCE_PAIR_MISSING,
          file,
          "Manifest-protected file is missing.",
          entry.path,
          "missing",
          { pointer: "/files" },
        ));
        continue;
      }
      const bytes = fs.readFileSync(path.join(root, entry.path));
      if (bytes.length !== entry.sizeBytes) {
        findings.push(makeFinding(
          RULES.EVIDENCE_SIZE,
          entry.path,
          "Recorded sizeBytes does not match actual bytes.",
          entry.sizeBytes,
          bytes.length,
        ));
      }
      if (sha256(bytes) !== entry.sha256) {
        findings.push(makeFinding(
          RULES.EVIDENCE_HASH,
          entry.path,
          "Recorded SHA-256 does not match actual bytes.",
          entry.sha256,
          sha256(bytes),
        ));
      }
    }
  }
  if (Array.isArray(json.evidenceFiles)) {
    for (const entry of json.evidenceFiles) {
      if (entry.path === file) {
        findings.push(makeFinding(
          RULES.EVIDENCE_SELF_HASH,
          file,
          "Evidence JSON must not hash itself.",
          "SELF_HASH_EXCLUDED_TO_AVOID_CIRCULAR_REFERENCE",
          file,
          { pointer: "/evidenceFiles" },
        ));
        continue;
      }
      if (!fileSet.has(entry.path)) {
        findings.push(makeFinding(
          RULES.EVIDENCE_PAIR_MISSING,
          file,
          "Evidence file is missing.",
          entry.path,
          "missing",
          { pointer: "/evidenceFiles" },
        ));
        continue;
      }
      summary.evidenceHashesChecked += 1;
      const bytes = fs.readFileSync(path.join(root, entry.path));
      if (bytes.length !== entry.sizeBytes) {
        findings.push(makeFinding(
          RULES.EVIDENCE_SIZE,
          entry.path,
          "Recorded evidence size does not match actual bytes.",
          entry.sizeBytes,
          bytes.length,
        ));
      }
      if (sha256(bytes) !== entry.sha256) {
        findings.push(makeFinding(
          RULES.EVIDENCE_HASH,
          entry.path,
          "Recorded evidence SHA-256 does not match actual bytes.",
          entry.sha256,
          sha256(bytes),
        ));
      }
    }
  }
  if (json.markdownReport) {
    summary.evidencePairsChecked += 1;
    if (!fileSet.has(json.markdownReport)) {
      findings.push(makeFinding(
        RULES.EVIDENCE_PAIR_MISSING,
        file,
        "Declared Markdown evidence report is missing.",
        json.markdownReport,
        "missing",
        { pointer: "/markdownReport" },
      ));
      return;
    }
    const md = metadataByFile.get(json.markdownReport)
      || parseMetadata(fs.readFileSync(path.join(root, json.markdownReport), "utf8"));
    const comparisons = [
      ["Task", json.task],
      ["Status", json.status],
      ["Result", json.result],
      ["Base SHA", json.baseSha],
      ["Generated at", json.generatedAt],
    ];
    const mismatches = comparisons.filter(([key, value]) => !md[key] || md[key].value !== value);
    if (mismatches.length) {
      findings.push(makeFinding(
        RULES.EVIDENCE_PAIR_MISMATCH,
        file,
        "Markdown and JSON evidence fields differ.",
        "task/status/result/baseSha/generatedAt match",
        mismatches.map(([key]) => key).join(", "),
        { pointer: "/" },
      ));
    }
  }
  if (json.result && json.result.startsWith("PASS_")) {
    const serialized = JSON.stringify(json.validation || {});
    if (serialized.includes("NOT_RUN") || serialized.includes("BLOCKED")) {
      findings.push(makeFinding(
        RULES.EVIDENCE_FALSE_PASS,
        file,
        "PASS result contains an unexecuted or blocked validation.",
        "all required validation facts executed",
        "NOT_RUN or BLOCKED",
        { pointer: "/validation" },
      ));
    }
  }
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

function validateRepository(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const mode = options.mode || "full";
  const baselinePath = options.baselinePath || "docs/documentation-validation-baseline.json";
  let changed = [];
  try {
    if (mode === "changed") changed = parseChangedFiles(root, options.base);
  } catch (error) {
    return {
      mode,
      result: "BLOCKED_DOCUMENTATION_VALIDATION_BASE_UNRESOLVED",
      exitCode: 2,
      findings: [],
      summary: { documents: 0, linksChecked: 0, blockingFindings: 0, baselinedFindings: 0 },
      error: error.message,
    };
  }
  if (!["full", "changed"].includes(mode)) {
    return {
      mode,
      result: "BLOCKED_DOCUMENTATION_VALIDATION_USAGE",
      exitCode: 2,
      findings: [],
      summary: { documents: 0, linksChecked: 0, blockingFindings: 0, baselinedFindings: 0 },
      error: `Unsupported mode: ${mode}`,
    };
  }

  const allFiles = discoverFiles(root);
  const documentFiles = allFiles.filter((file) => file === "README.md"
    || (file.startsWith("docs/") && /\.(md|json)$/.test(file)));
  const fileSet = new Set(allFiles);
  const baseline = readBaseline(root, baselinePath);
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
    protectedHashesChecked: 0,
  };
  validateBaseline({ root, baseline, fileSet, changedPathSet, findings });
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
            validateEvidenceJson({ root, file, json, fileSet, metadataByFile, findings, summary });
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
      validateEvidenceJson({ root, file, json, fileSet, metadataByFile, findings, summary });
    }
  }

  validateAuthority({ root, fileSet, metadataByFile, findings });
  if (mode === "changed") {
    for (const entry of changed) {
      if (entry.status === "D") {
        for (const file of documentFiles.filter((candidate) => candidate.endsWith(".md"))) {
          const text = fs.readFileSync(path.join(root, file), "utf8");
          for (const link of parseLinks(text)) {
            if (/^(https?:|mailto:)/i.test(link.destination)) continue;
            const target = resolveLink(file, link.destination).target;
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

module.exports = {
  discoverFiles,
  sha256,
  validateRepository,
};
