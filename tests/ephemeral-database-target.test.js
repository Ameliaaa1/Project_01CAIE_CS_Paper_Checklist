"use strict";

const assert = require("node:assert/strict");
const {
  requireEphemeralDatabaseTarget
} = require("./helpers/ephemeral-database-target");

const valid = {
  DATABASE_URL: "postgresql://test:test@ep-example.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require",
  DB_B0_R1_EPHEMERAL_PROJECT_ID: "lucky-river-45336837",
  DB_B0_R1_EPHEMERAL_BRANCH_ID: "br-example",
  DB_B0_R1_EPHEMERAL_BRANCH_NAME: "db-b0-r1-test-20260730",
  DB_B0_R1_EPHEMERAL_ENDPOINT_ID: "ep-example",
  DB_B0_R1_PARENT_BRANCH_ID: "br-silent-fog-avglbx9u",
  DB_B0_R1_DATABASE_SCOPE: "EPHEMERAL_ONLY"
};

assert.equal(requireEphemeralDatabaseTarget(valid).identity.isolatedRehearsal, true);
assert.throws(
  () => requireEphemeralDatabaseTarget({
    ...valid,
    DATABASE_URL: "postgresql://test:test@ep-small-dew-avh8e0sc.c-11.us-east-1.aws.neon.tech/neondb",
    DB_B0_R1_EPHEMERAL_BRANCH_ID: "br-silent-fog-avglbx9u",
    DB_B0_R1_EPHEMERAL_ENDPOINT_ID: "ep-small-dew-avh8e0sc"
  }),
  /Production branch is forbidden/
);
assert.throws(
  () => requireEphemeralDatabaseTarget({
    ...valid,
    DATABASE_URL: "postgresql://test:test@ep-other.c-11.us-east-1.aws.neon.tech/neondb"
  }),
  /does not match the declared ephemeral endpoint/
);
assert.throws(
  () => requireEphemeralDatabaseTarget({
    ...valid,
    DB_B0_R1_DATABASE_SCOPE: "PRODUCTION"
  }),
  /EPHEMERAL_ONLY/
);
