#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const canonicalPath = path.join(rootDir, "generated", "production-question-index.json");
const browserPath = path.join(rootDir, "public", "assets", "question-index.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readIndex(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`Question index is missing: ${file}`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (parsed.dataSource !== "PRODUCTION_CANONICAL") {
    throw new Error(`Question index is not canonical Production data: ${file}`);
  }
  if (!Array.isArray(parsed.entries) || parsed.entries.length !== parsed.questions) {
    throw new Error(`Question index count is inconsistent: ${file}`);
  }
  return parsed;
}

function validateIndexes(paths = {}) {
  const canonicalFile = paths.canonicalPath || canonicalPath;
  const browserFile = paths.browserPath || browserPath;
  const canonicalBefore = sha256(canonicalFile);
  const browserBefore = sha256(browserFile);
  const canonical = readIndex(canonicalFile);
  const browser = readIndex(browserFile);

  assert.deepStrictEqual(
    browser,
    canonical,
    "Browser question index must be a semantic mirror of the canonical Production index"
  );

  return {
    status: "PASS_CANONICAL_INDEX_REPRODUCIBILITY",
    sourceOfTruth: path.relative(rootDir, canonicalFile),
    browserMirror: path.relative(rootDir, browserFile),
    canonicalSha256: canonicalBefore,
    browserSha256: browserBefore,
    semanticMirrorEqual: true,
    paperCount: canonical.papers,
    questionCount: canonical.questions,
    writePerformed: false,
    canonicalUnchanged: sha256(canonicalFile) === canonicalBefore,
    browserMirrorUnchanged: sha256(browserFile) === browserBefore,
  };
}

function main() {
  process.stdout.write(`${JSON.stringify(validateIndexes(), null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { readIndex, sha256, validateIndexes };
