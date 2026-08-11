#!/usr/bin/env node
"use strict";

const path = require("path");
const { loadBoundary } = require("./promotion-validator/validator");
const { captureRemoteHistory } = require("./promotion-validator/remote-history");

function rootArgument(argv) {
  const index = argv.indexOf("--root");
  if (index === -1) return process.cwd();
  if (!argv[index + 1]) throw new Error("--root requires a path");
  return path.resolve(argv[index + 1]);
}

function requiredArgument(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1 || !argv[index + 1]) {
    const error = new Error(`${name} requires a value`);
    error.code = "REMOTE_CAPTURE_SESSION_ID_REQUIRED";
    throw error;
  }
  return argv[index + 1];
}

try {
  const argv = process.argv.slice(2);
  const root = rootArgument(argv);
  const promotionId = requiredArgument(argv, "--promotion-id");
  const boundary = loadBoundary(root);
  process.stdout.write(`${JSON.stringify(captureRemoteHistory(root, boundary.contract, { promotionId }), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ result: "BLOCK_REMOTE_HISTORY_CAPTURE", code: error.code || "REMOTE_CAPTURE_INTERNAL_ERROR", message: error.message })}\n`);
  process.exitCode = 1;
}
