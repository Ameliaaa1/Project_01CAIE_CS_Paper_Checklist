#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const usersDbPath = process.env.LEGACY_USERS_JSON ? path.resolve(process.env.LEGACY_USERS_JSON) : path.join(dataDir, "users.json");
const redisRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const usersStoreKey = process.env.PAPERLENS_USERS_KEY || "paperlens:users";
const dryRun = process.argv.includes("--dry-run");

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parseDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function readRemoteJson(key) {
  if (!redisRestUrl || !redisRestToken) return null;
  const response = await fetch(redisRestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisRestToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(["GET", key])
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error || !payload.result) return null;
  return typeof payload.result === "string" ? JSON.parse(payload.result) : payload.result;
}

function readLocalJson() {
  if (!fs.existsSync(usersDbPath)) return null;
  return JSON.parse(fs.readFileSync(usersDbPath, "utf8"));
}

async function readLegacyUsers() {
  const remote = await readRemoteJson(usersStoreKey);
  const local = remote || readLocalJson() || { users: [] };
  return Array.isArray(local.users) ? local.users : [];
}

async function migrate() {
  if (!process.env.DATABASE_URL && !dryRun) {
    throw new Error("DATABASE_URL is required unless --dry-run is used.");
  }

  const legacyUsers = await readLegacyUsers();
  const seenEmails = new Map();
  const duplicateEmails = [];

  for (const user of legacyUsers) {
    const email = normaliseEmail(user.email);
    if (!email) continue;
    if (seenEmails.has(email)) duplicateEmails.push({ email, ids: [seenEmails.get(email), user.id].filter(Boolean) });
    seenEmails.set(email, user.id);
  }

  const report = {
    source: redisRestUrl && redisRestToken ? `redis:${usersStoreKey}` : usersDbPath,
    dryRun,
    totalLegacyUsers: legacyUsers.length,
    duplicateEmails,
    insertedUsers: 0,
    skippedExistingUsers: 0,
    migratedPurchases: 0,
    migratedQuestionSearches: 0
  };

  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const legacyUser of legacyUsers) {
      const email = normaliseEmail(legacyUser.email);
      if (!email || !legacyUser.id) continue;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== legacyUser.id) {
        report.skippedExistingUsers += 1;
        continue;
      }

      const createdAt = parseDate(legacyUser.createdAt);
      await prisma.user.upsert({
        where: { id: legacyUser.id },
        create: {
          id: legacyUser.id,
          email,
          firstName: String(legacyUser.firstName || ""),
          lastName: String(legacyUser.lastName || ""),
          createdAt,
          credential: {
            create: {
              passwordHash: String(legacyUser.passwordHash || ""),
              passwordSalt: String(legacyUser.passwordSalt || ""),
              passwordAlgorithm: legacyUser.passwordAlgorithm || "pbkdf2-sha256",
              passwordIterations: Number(legacyUser.passwordIterations || 120000)
            }
          }
        },
        update: {
          email,
          firstName: String(legacyUser.firstName || ""),
          lastName: String(legacyUser.lastName || "")
        }
      });
      await prisma.userCredential.upsert({
        where: { userId: legacyUser.id },
        create: {
          userId: legacyUser.id,
          passwordHash: String(legacyUser.passwordHash || ""),
          passwordSalt: String(legacyUser.passwordSalt || ""),
          passwordAlgorithm: legacyUser.passwordAlgorithm || "pbkdf2-sha256",
          passwordIterations: Number(legacyUser.passwordIterations || 120000)
        },
        update: {
          passwordHash: String(legacyUser.passwordHash || ""),
          passwordSalt: String(legacyUser.passwordSalt || ""),
          passwordAlgorithm: legacyUser.passwordAlgorithm || "pbkdf2-sha256",
          passwordIterations: Number(legacyUser.passwordIterations || 120000)
        }
      });
      report.insertedUsers += existing ? 0 : 1;

      if (legacyUser.purchased) {
        await prisma.purchase.upsert({
          where: { id: legacyUser.checkoutSessionId || `legacy-${legacyUser.id}` },
          create: {
            id: legacyUser.checkoutSessionId || `legacy-${legacyUser.id}`,
            userId: legacyUser.id,
            provider: "STRIPE",
            status: "PAID",
            stripeCheckoutSessionId: legacyUser.checkoutSessionId || null,
            providerEventId: legacyUser.providerEventId || null,
            purchasedAt: parseDate(legacyUser.purchasedAt, createdAt)
          },
          update: {
            status: "PAID",
            purchasedAt: parseDate(legacyUser.purchasedAt, createdAt)
          }
        });
        report.migratedPurchases += 1;
      }

      for (const search of Array.isArray(legacyUser.questionFinderSearches) ? legacyUser.questionFinderSearches : []) {
        const searchId = search.id || `${legacyUser.id}-${search.key}`;
        await prisma.questionSearch.upsert({
          where: { id: searchId },
          create: {
            id: searchId,
            userId: legacyUser.id,
            searchKey: search.key || null,
            query: String(search.query || ""),
            filters: { syllabusIds: Array.isArray(search.syllabusIds) ? search.syllabusIds : [] },
            questionIds: Array.isArray(search.questionIds) ? search.questionIds : [],
            resultCount: Array.isArray(search.questionIds) ? search.questionIds.length : 0,
            source: "legacy-question-finder",
            createdAt: parseDate(search.createdAt, createdAt)
          },
          update: {}
        });
        report.migratedQuestionSearches += 1;
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(JSON.stringify(report, null, 2));
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
