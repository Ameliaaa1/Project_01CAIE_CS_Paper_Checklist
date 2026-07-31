const VERCEL_ENVIRONMENTS = new Set(["production", "preview", "development"]);

class RuntimeEnvironmentConflictError extends Error {
  constructor(vercelEnv, vercelTargetEnv) {
    super(
      `Conflicting Vercel environment signals: VERCEL_ENV=${vercelEnv}, VERCEL_TARGET_ENV=${vercelTargetEnv}`
    );
    this.name = "RuntimeEnvironmentConflictError";
    this.code = "CONFLICTING_VERCEL_ENVIRONMENT_SIGNALS";
  }
}

function normalizedEnvironmentValue(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveRuntimeEnvironment(env = {}) {
  const vercelEnv = normalizedEnvironmentValue(env.VERCEL_ENV);
  const vercelTargetEnv = normalizedEnvironmentValue(env.VERCEL_TARGET_ENV);
  const nodeEnv = normalizedEnvironmentValue(env.NODE_ENV);
  const recognizedVercelEnv = VERCEL_ENVIRONMENTS.has(vercelEnv) ? vercelEnv : "";
  const recognizedVercelTargetEnv = VERCEL_ENVIRONMENTS.has(vercelTargetEnv)
    ? vercelTargetEnv
    : "";

  if (
    recognizedVercelEnv &&
    recognizedVercelTargetEnv &&
    recognizedVercelEnv !== recognizedVercelTargetEnv
  ) {
    throw new RuntimeEnvironmentConflictError(
      recognizedVercelEnv,
      recognizedVercelTargetEnv
    );
  }

  const vercelMode = recognizedVercelEnv || recognizedVercelTargetEnv;
  if (vercelMode) return `vercel-${vercelMode}`;
  if (nodeEnv === "production") return "local-production";
  if (!nodeEnv || nodeEnv === "development" || nodeEnv === "test") {
    return "local-development";
  }
  return "unknown";
}

function requiresProductionConfiguration(runtimeEnvironment) {
  return (
    runtimeEnvironment === "vercel-production" ||
    runtimeEnvironment === "local-production"
  );
}

module.exports = {
  RuntimeEnvironmentConflictError,
  requiresProductionConfiguration,
  resolveRuntimeEnvironment
};
