const crypto = require("node:crypto");
const { getPrisma } = require("./db");
const { createSecureToken, hashToken } = require("./auth");
const { memory } = require("./localStore");
const { findUserById } = require("./users");

function clientAddress(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

async function createSession(userId, req, maxAgeSeconds) {
  const token = createSecureToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000);
  const prisma = getPrisma();

  if (prisma) {
    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: clientAddress(req),
        userAgent: String(req.headers["user-agent"] || "").slice(0, 512)
      }
    });
    return token;
  }

  memory.sessions.push({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    ipAddress: clientAddress(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 512),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return token;
}

async function authenticatedUserFromToken(token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const prisma = getPrisma();

  if (prisma) {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { purchases: true, questionSearches: true }
        }
      }
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.deletedAt || session.user.status !== "ACTIVE") {
      return null;
    }
    return {
      ...session.user,
      purchased: session.user.purchases.some((purchase) => purchase.status === "PAID")
    };
  }

  const session = memory.sessions.find((candidate) => candidate.tokenHash === tokenHash);
  if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) return null;
  return findUserById(session.userId);
}

async function revokeSessionToken(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  const prisma = getPrisma();

  if (prisma) {
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return;
  }

  const session = memory.sessions.find((candidate) => candidate.tokenHash === tokenHash);
  if (session && !session.revokedAt) {
    session.revokedAt = new Date().toISOString();
    session.updatedAt = session.revokedAt;
  }
}

async function deleteSessionToken(token) {
  if (!token) return false;
  const tokenHash = hashToken(token);
  const prisma = getPrisma();
  if (prisma) {
    const deleted = await prisma.session.deleteMany({ where: { tokenHash } });
    return deleted.count > 0;
  }
  const index = memory.sessions.findIndex((candidate) => candidate.tokenHash === tokenHash);
  if (index < 0) return false;
  memory.sessions.splice(index, 1);
  return true;
}

module.exports = {
  createSession,
  authenticatedUserFromToken,
  deleteSessionToken,
  revokeSessionToken
};
