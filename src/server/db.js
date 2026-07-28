const isProduction = process.env.NODE_ENV === "production";

let prisma = null;

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPrisma() {
  if (!isDatabaseConfigured()) return null;
  if (prisma) return prisma;

  try {
    const { PrismaClient } = require("@prisma/client");
    prisma = new PrismaClient();
    return prisma;
  } catch (error) {
    if (isProduction) throw error;
    return null;
  }
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
  isDatabaseConfigured,
  assertProductionDatabaseConfigured,
  isUniqueConstraintError
};
