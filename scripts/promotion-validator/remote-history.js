"use strict";

const { execFileSync } = require("child_process");

function captureError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function defaultExecGit(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function captureRemoteHistory(root, contract, options = {}) {
  const execGit = options.execGit || ((args) => defaultExecGit(root, args));
  const provenance = contract.provenanceValidation;
  let remoteURL;
  try { remoteURL = execGit(["remote", "get-url", "origin"]); }
  catch (error) { throw captureError("REMOTE_CAPTURE_ORIGIN_FAILED", "Cannot resolve origin for remote history capture"); }
  if (remoteURL !== provenance.approvedRepository) throw captureError("REMOTE_CAPTURE_REPOSITORY_MISMATCH", "Capture origin is not the approved repository");
  let remoteOutput;
  try { remoteOutput = execGit(["ls-remote", "origin", provenance.approvedRemoteBranch]); }
  catch (error) { throw captureError("REMOTE_CAPTURE_FAILED", "git ls-remote failed; local refs are not an allowed fallback"); }
  const rows = remoteOutput.split(/\r?\n/).filter(Boolean).map((line) => line.split(/\s+/));
  if (rows.length !== 1 || rows[0][1] !== provenance.approvedRemoteBranch || !/^[0-9a-f]{40}$/.test(rows[0][0])) throw captureError("REMOTE_CAPTURE_INVALID", "git ls-remote did not return exactly one approved branch SHA");
  const remoteCommitSHA = rows[0][0];
  let localTrackingRefSHA;
  try { localTrackingRefSHA = execGit(["rev-parse", provenance.approvedHistoryRef]); }
  catch (error) { throw captureError("REMOTE_CAPTURE_LOCAL_REF_MISSING", "Approved local tracking ref is missing"); }
  if (localTrackingRefSHA !== remoteCommitSHA) throw captureError("REMOTE_CAPTURE_LOCAL_REF_MISMATCH", "Local tracking ref does not equal the captured remote branch");
  const repositoryIdentity = provenance.approvedRepository.replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  return { schemaVersion: 1, evidenceType: "REMOTE_HISTORY_CAPTURE_V1", evidencePurpose: "RUNTIME_PROMOTION", repositoryIdentity, remoteURL, remoteBranch: provenance.approvedRemoteBranch, remoteCommitSHA, captureTimestamp: (options.now || (() => new Date()))().toISOString(), captureMethod: provenance.captureMethod, localTrackingRef: provenance.approvedHistoryRef, localTrackingRefSHA, verificationResult: "PASS" };
}

module.exports = { captureRemoteHistory, captureError };
