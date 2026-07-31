const assert = require("node:assert/strict");
const {
  RuntimeEnvironmentConflictError,
  requiresProductionConfiguration,
  resolveRuntimeEnvironment
} = require("../src/server/runtimeEnvironment");

const cases = [
  [{ VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production" }, "vercel-production", true],
  [{ NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "preview" }, "vercel-preview", false],
  [{ VERCEL_TARGET_ENV: "development" }, "vercel-development", false],
  [{ NODE_ENV: "production" }, "local-production", true],
  [{ NODE_ENV: "test" }, "local-development", false],
  [{}, "local-development", false]
];

for (const [env, expectedMode, expectedProductionRequirement] of cases) {
  const mode = resolveRuntimeEnvironment(env);
  assert.equal(mode, expectedMode);
  assert.equal(requiresProductionConfiguration(mode), expectedProductionRequirement);
}

assert.throws(
  () => resolveRuntimeEnvironment({
    VERCEL_ENV: "production",
    VERCEL_TARGET_ENV: "preview"
  }),
  (error) =>
    error instanceof RuntimeEnvironmentConflictError &&
    error.code === "CONFLICTING_VERCEL_ENVIRONMENT_SIGNALS"
);
