"use strict";

const crypto = require("crypto");

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function cloneJson(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneJson);
  const result = Object.create(null);
  for (const key of Object.keys(value)) result[key] = cloneJson(value[key]);
  return result;
}

function evidenceProjection(evidence, profile = "paperlens-evidence-binding-v1") {
  if (profile !== "paperlens-evidence-binding-v1") {
    const error = new Error(`Unknown evidence projection profile: ${profile}`);
    error.code = "EVIDENCE_PROJECTION_PROFILE_UNKNOWN";
    throw error;
  }
  const projected = cloneJson(evidence);
  if (!projected.manifest || typeof projected.manifest.sha256 !== "string") {
    const error = new Error("Projection requires /manifest/sha256");
    error.code = "EVIDENCE_PROJECTION_POINTER_MISSING";
    throw error;
  }
  delete projected.manifest.sha256;
  return Buffer.from(canonicalize(projected), "utf8");
}

module.exports = { canonicalize, cloneJson, evidenceProjection, sha256 };
