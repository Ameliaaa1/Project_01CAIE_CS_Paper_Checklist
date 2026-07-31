const {
  resolveRuntimeEnvironment,
  requiresProductionConfiguration
} = require("./runtimeEnvironment");

const runtimeEnvironment = resolveRuntimeEnvironment(process.env);
const isProduction = requiresProductionConfiguration(runtimeEnvironment);

let prisma = null;
let prismaCreatedAt = null;

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPrisma() {
  if (!isDatabaseConfigured()) return null;
  if (prisma) return prisma;

  try {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
    prismaCreatedAt = new Date().toISOString();
    return prisma;
  } catch (error) {
    if (isProduction) throw error;
    return null;
  }
}

async function disconnectPrisma() {
  if (!prisma) return false;
  const client = prisma;
  prisma = null;
  prismaCreatedAt = null;
  await client.$disconnect();
  return true;
}

function getDatabaseRuntimeStatus() {
  return {
    runtimeEnvironment,
    productionConfigurationRequired: isProduction,
    databaseConfigured: isDatabaseConfigured(),
    clientCreated: Boolean(prisma),
    clientCreatedAt: prismaCreatedAt
  };
}

function assertProductionDatabaseConfigured() {
  if (isProduction && !isDatabaseConfigured()) {
    throw new Error("Production configuration is incomplete: DATABASE_URL");
  }
}

function isUniqueConstraintError(error) {
  return error && error.code === "P2002";
}

module.exports = {
  getPrisma,
  disconnectPrisma,
  getDatabaseRuntimeStatus,
  isDatabaseConfigured,
  assertProductionDatabaseConfigured,
  isUniqueConstraintError
};
