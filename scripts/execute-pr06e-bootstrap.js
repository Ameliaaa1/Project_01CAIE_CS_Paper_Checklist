#!/usr/bin/env node
"use strict";

const path = require("path");
const { executeProduction } = require("./promotion-package/production-bootstrap");
function arg(argv, name, required = false) { const i = argv.indexOf(name); if (i >= 0 && argv[i + 1]) return argv[i + 1]; if (required) throw Object.assign(new Error(`${name} is required`), { code: "PR06E_ARGUMENT_REQUIRED" }); return null; }
try { const argv=process.argv.slice(2); const result=executeProduction({root:path.resolve(arg(argv,"--root")||process.cwd()),executionId:arg(argv,"--execution-id",true),executor:arg(argv,"--executor",true),executedAt:arg(argv,"--executed-at",true),expectedApprovedTargetManifestSha256:arg(argv,"--expected-approved-target-sha",true)}); process.stdout.write(`${JSON.stringify({result:"PASS_PR06E_FIRST_PRODUCTION_BOOTSTRAP_AND_POST_PROMOTION_VERIFICATION",execution:result.execution,validation:result.validation.result},null,2)}\n`); }
catch(error){process.stderr.write(`${JSON.stringify({result:"BLOCK_PR06E_PRODUCTION_BOOTSTRAP",code:error.code||"PR06E_INTERNAL_ERROR",message:error.message,path:error.objectPath||null})}\n`);process.exitCode=1;}
