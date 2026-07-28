const crypto = require("node:crypto");
const { getPrisma } = require("./db");
const { memory } = require("./localStore");
const { findUserById, publicUser } = require("./users");

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createPendingPurchase({ id, user, amount, currency, checkoutUrl, stripeCheckoutSessionId }) {
  const prisma = getPrisma();
  if (prisma) {
    await prisma.purchase.create({
      data: {
        id,
        userId: user.id,
        provider: "STRIPE",
        status: "PENDING",
        amount,
        currency,
        checkoutUrl,
        stripeCheckoutSessionId
      }
    });
    return;
  }

  memory.purchases.push({
    id,
    userId: user.id,
    email: user.email,
    provider: "STRIPE",
    status: "PENDING",
    amount,
    currency,
    checkoutUrl,
    stripeCheckoutSessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

async function checkoutSessionStatus(sessionId, authenticatedUser) {
  const id = String(sessionId || "").trim();
  const prisma = getPrisma();
  let purchase = null;
  if (prisma) {
    purchase = await prisma.purchase.findUnique({ where: { id } });
  } else {
    purchase = memory.purchases.find((candidate) => candidate.id === id);
  }

  if (!purchase) throw httpError("Checkout session not found.", 404);
  if (purchase.userId !== authenticatedUser.id) throw httpError("Checkout session does not belong to this account.", 403);
  const user = await findUserById(authenticatedUser.id);
  if (!user) throw httpError("Session user not found.", 404);

  return {
    ok: true,
    status: purchase.status === "PAID" ? "paid" : String(purchase.status || "pending").toLowerCase(),
    paid: purchase.status === "PAID",
    amount: purchase.amount,
    currency: purchase.currency,
    user: publicUser(user)
  };
}

async function markCheckoutSessionPaid(sessionId, providerEvent) {
  const id = String(sessionId || "").trim();
  const paidAt = new Date();
  const prisma = getPrisma();

  if (prisma) {
    const purchase = await prisma.purchase.findUnique({ where: { id } });
    if (!purchase) throw httpError("Checkout session not found.", 404);
    if (purchase.status === "PAID") return { ok: true, alreadyPaid: true };

    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        status: "PAID",
        purchasedAt: paidAt,
        provider: "STRIPE",
        providerEventId: providerEvent.eventId,
        stripeCheckoutSessionId: providerEvent.providerSessionId || purchase.stripeCheckoutSessionId || null,
        stripePaymentIntentId: providerEvent.paymentIntentId || null,
        stripeCustomerId: providerEvent.customerId || null
      },
      include: { user: { include: { purchases: true } } }
    });
    return { ok: true, user: publicUser({ ...updated.user, purchased: true }) };
  }

  const purchase = memory.purchases.find((candidate) => candidate.id === id);
  if (!purchase) throw httpError("Checkout session not found.", 404);
  if (purchase.status === "PAID") return { ok: true, alreadyPaid: true };
  purchase.status = "PAID";
  purchase.purchasedAt = paidAt.toISOString();
  purchase.providerEventId = providerEvent.eventId;
  purchase.stripeCheckoutSessionId = providerEvent.providerSessionId || purchase.stripeCheckoutSessionId || null;
  purchase.updatedAt = purchase.purchasedAt;

  const user = await findUserById(purchase.userId);
  if (!user) throw httpError("User for checkout session not found.", 404);
  return { ok: true, user: publicUser({ ...user, purchased: true }) };
}

function createCheckoutId() {
  return crypto.randomUUID();
}

module.exports = {
  createCheckoutId,
  createPendingPurchase,
  checkoutSessionStatus,
  markCheckoutSessionPaid
};
