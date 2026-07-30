"use strict";

const { getPrisma } = require("./db");
const { memory } = require("./localStore");
const {
  resolveRuntimeEnvironment,
  requiresProductionConfiguration
} = require("./runtimeEnvironment");

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getUserPurchaseStatus(userId, options = {}) {
  const id = String(userId || "").trim();
  if (!id) throw httpError("Purchase entitlement requires a user.", 400);
  const prisma = options.client || getPrisma();
  if (prisma) {
    const paidPurchases = await prisma.purchase.findMany({
      where: { userId: id, status: "PAID" },
      select: { id: true, provider: true, purchasedAt: true, createdAt: true },
      orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }]
    });
    return {
      userId: id,
      hasPaidEntitlement: paidPurchases.length > 0,
      paidPurchaseCount: paidPurchases.length,
      entitlementPurchaseId: paidPurchases[0]?.id || null,
      entitlementProvider: paidPurchases[0]?.provider || null
    };
  }

  const paidPurchases = memory.purchases
    .filter((purchase) => purchase.userId === id && purchase.status === "PAID")
    .sort((left, right) =>
      String(right.purchasedAt || right.createdAt || "").localeCompare(
        String(left.purchasedAt || left.createdAt || "")
      )
    );
  return {
    userId: id,
    hasPaidEntitlement: paidPurchases.length > 0,
    paidPurchaseCount: paidPurchases.length,
    entitlementPurchaseId: paidPurchases[0]?.id || null,
    entitlementProvider: paidPurchases[0]?.provider || null
  };
}

async function hasPaidEntitlement(userId, options = {}) {
  return (await getUserPurchaseStatus(userId, options)).hasPaidEntitlement;
}

async function createSyntheticPurchase(
  { id, userId, amount = 0, currency = "usd" },
  options = {}
) {
  const runtime = resolveRuntimeEnvironment(options.env || process.env);
  if (requiresProductionConfiguration(runtime)) {
    throw httpError("Synthetic purchases are forbidden in production runtime.", 403);
  }
  const purchaseId = String(id || "").trim();
  const ownerId = String(userId || "").trim();
  if (!purchaseId || !ownerId) {
    throw httpError("Synthetic purchase requires an id and owner.", 400);
  }
  const prisma = options.client || getPrisma();
  if (prisma) {
    const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (existing) {
      if (existing.userId !== ownerId) {
        throw httpError("Synthetic purchase does not belong to this account.", 403);
      }
      return { purchase: existing, createdNew: false };
    }
    const purchase = await prisma.purchase.create({
      data: {
        id: purchaseId,
        userId: ownerId,
        provider: "TEST",
        status: "PAID",
        amount,
        currency,
        purchasedAt: new Date()
      }
    });
    return { purchase, createdNew: true };
  }

  const existing = memory.purchases.find((purchase) => purchase.id === purchaseId);
  if (existing) {
    if (existing.userId !== ownerId) {
      throw httpError("Synthetic purchase does not belong to this account.", 403);
    }
    return { purchase: existing, createdNew: false };
  }
  const purchase = {
    id: purchaseId,
    userId: ownerId,
    provider: "TEST",
    status: "PAID",
    amount,
    currency,
    purchasedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memory.purchases.push(purchase);
  return { purchase, createdNew: true };
}

module.exports = {
  createSyntheticPurchase,
  getUserPurchaseStatus,
  hasPaidEntitlement
};
