"use strict";

const assert = require("node:assert/strict");

const EXPECTED_PROJECT_ID = "lucky-river-45336837";
const PRODUCTION_BRANCH_ID = "br-silent-fog-avglbx9u";
const PRODUCTION_ENDPOINT_ID = "ep-small-dew-avh8e0sc";

function requireEphemeralDatabaseTarget(environment = process.env) {
  const databaseUrl = String(environment.DATABASE_URL || "");
  const projectId = String(environment.DB_B0_R1_EPHEMERAL_PROJECT_ID || "");
  const branchId = String(environment.DB_B0_R1_EPHEMERAL_BRANCH_ID || "");
  const branchName = String(environment.DB_B0_R1_EPHEMERAL_BRANCH_NAME || "");
  const endpointId = String(environment.DB_B0_R1_EPHEMERAL_ENDPOINT_ID || "");
  const parentBranchId = String(environment.DB_B0_R1_PARENT_BRANCH_ID || "");
  const scope = String(environment.DB_B0_R1_DATABASE_SCOPE || "");

  assert(databaseUrl, "DATABASE_URL is required for the isolated DB-B0-R1 rehearsal.");
  assert.equal(projectId, EXPECTED_PROJECT_ID, "Neon project identity mismatch.");
  assert(branchId && branchId !== PRODUCTION_BRANCH_ID, "Production branch is forbidden.");
  assert.match(branchName, /^db-b0-r1-test-\d{8}(?:-[a-z0-9-]+)?$/);
  assert(endpointId && endpointId !== PRODUCTION_ENDPOINT_ID, "Production endpoint is forbidden.");
  assert.equal(parentBranchId, PRODUCTION_BRANCH_ID, "Ephemeral branch parent identity mismatch.");
  assert.equal(scope, "EPHEMERAL_ONLY", "Database scope must be EPHEMERAL_ONLY.");

  const parsedDatabaseUrl = new URL(databaseUrl);
  assert(
    parsedDatabaseUrl.hostname.startsWith(`${endpointId}.`),
    "DATABASE_URL does not match the declared ephemeral endpoint."
  );
  assert(
    !parsedDatabaseUrl.hostname.startsWith(`${PRODUCTION_ENDPOINT_ID}.`),
    "Production endpoint is forbidden."
  );

  return {
    databaseUrl,
    parsedDatabaseUrl,
    identity: {
      provider: "NEON",
      projectId,
      branchId,
      branchName,
      endpointId,
      parentBranchId,
      productionBranchId: PRODUCTION_BRANCH_ID,
      productionEndpointId: PRODUCTION_ENDPOINT_ID,
      databaseUrlScope: scope,
      isolatedRehearsal: true,
      productionEndpointUsed: false
    }
  };
}

module.exports = {
  EXPECTED_PROJECT_ID,
  PRODUCTION_BRANCH_ID,
  PRODUCTION_ENDPOINT_ID,
  requireEphemeralDatabaseTarget
};
