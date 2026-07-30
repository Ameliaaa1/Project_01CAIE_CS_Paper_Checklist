const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.BILLING_PROVIDER_ENABLED = "false";
process.env.SESSION_SECRET = "db-a5-s1-rehearsal-session-secret";

const databaseUrl = String(process.env.DATABASE_URL || "");
assert(databaseUrl, "DATABASE_URL is required for the isolated rehearsal.");
const parsedDatabaseUrl = new URL(databaseUrl);
assert(
  parsedDatabaseUrl.hostname.startsWith("ep-orange-frost-avnvjdkd."),
  "Purchase entitlement regression must use the isolated rehearsal endpoint."
);

const handleRequest = require("../server");
const db = require("../src/server/db");
const userStore = require("../src/server/users");
const sessionStore = require("../src/server/sessions");
const purchaseStore = require("../src/server/purchases");
const questionSearchStore = require("../src/server/questionSearches");
const {
  runPaidToRefundedAccessStateTest
} = require("./paid-to-refunded-access-state.test");

(async () => {
  const prisma = db.getPrisma();
  let userId = null;
  try {
    const result = await runPaidToRefundedAccessStateTest({
      handleRequest,
      prisma,
      userStore,
      sessionStore,
      purchaseStore,
      questionSearchStore
    });
    userId = result.userId;
    assert.equal(result.status, "PASS");
    process.stdout.write(
      `${JSON.stringify({
        accessAfterRefund: {
          hasPaidEntitlement: result.accessAfterRefund.hasPaidEntitlement,
          trialUsed: result.accessAfterRefund.trialUsed,
          trialRemaining: result.accessAfterRefund.trialRemaining
        },
        trialSearchCount: result.trialSearchCount,
        paidSearchCount: result.paidSearchCount,
        status: "PASS"
      })}\n`
    );
  } finally {
    if (userId) {
      await prisma.questionSearch.deleteMany({ where: { userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.purchase.deleteMany({ where: { userId } });
      await prisma.userCredential.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await db.disconnectPrisma();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
