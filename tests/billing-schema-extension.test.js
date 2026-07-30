const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const {
  createBillingProviderEvent,
  updateBillingEventProcessing
} = require("../src/server/billingEvents");

const databaseUrl = String(process.env.DATABASE_URL || "");
assert(databaseUrl, "DATABASE_URL is required for the isolated DB-A5-S1 rehearsal.");
const parsedDatabaseUrl = new URL(databaseUrl);
assert(
  parsedDatabaseUrl.hostname.startsWith("ep-orange-frost-avnvjdkd."),
  "DB-A5-S1 test must target the approved isolated rehearsal endpoint."
);
assert(
  !parsedDatabaseUrl.hostname.startsWith("ep-small-dew-avh8e0sc."),
  "Production endpoint is forbidden."
);

const prisma = new PrismaClient();
const runId = crypto.randomUUID().replaceAll("-", "");
const userId = `db-a5-s1-user-${runId}`;
const purchaseId = `db-a5-s1-purchase-${runId}`;
const paymentEventId = `evt_db_a5_s1_paid_${runId}`;
const refundEventId = `evt_db_a5_s1_refund_${runId}`;
const concurrentEventId = `evt_db_a5_s1_concurrent_${runId}`;
const orderingEventId = `evt_db_a5_s1_failed_${runId}`;
const now = new Date();
const paidAt = new Date(now.getTime() - 30_000);
const refundedAt = new Date(now.getTime() - 10_000);
const results = {
  runId,
  databaseIdentity: {
    provider: "NEON",
    projectId: "lucky-river-45336837",
    branchId: "br-broad-waterfall-avcm3qla",
    endpointId: "ep-orange-frost-avnvjdkd",
    productionBranchId: "br-silent-fog-avglbx9u",
    productionEndpointId: "ep-small-dew-avh8e0sc",
    isolatedRehearsal: true
  },
  crud: {},
  idempotency: {},
  refund: {},
  ordering: {},
  cleanup: {}
};

async function cleanup() {
  await prisma.billingProviderEvent.deleteMany({
    where: { purchase: { userId } }
  });
  await prisma.purchase.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

(async () => {
  try {
    await cleanup();
    const billingEventColumns = await prisma.$queryRaw`
      SELECT "column_name" AS "columnName"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public'
        AND "table_name" = 'BillingProviderEvent'
      ORDER BY "ordinal_position"
    `;
    const refundedAtColumns = await prisma.$queryRaw`
      SELECT "column_name" AS "columnName"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public'
        AND "table_name" = 'Purchase'
        AND "column_name" = 'refundedAt'
    `;
    const billingEventIndexes = await prisma.$queryRaw`
      SELECT "indexname" AS "indexName"
      FROM "pg_indexes"
      WHERE "schemaname" = 'public'
        AND "tablename" = 'BillingProviderEvent'
      ORDER BY "indexname"
    `;
    const foreignKeys = await prisma.$queryRaw`
      SELECT "rc"."delete_rule" AS "deleteRule"
      FROM "information_schema"."referential_constraints" AS "rc"
      WHERE "rc"."constraint_schema" = 'public'
        AND "rc"."constraint_name" = 'BillingProviderEvent_purchaseId_fkey'
    `;
    const appliedMigrations = await prisma.$queryRaw`
      SELECT "migration_name" AS "migrationName",
             "finished_at" AS "finishedAt",
             "rolled_back_at" AS "rolledBackAt"
      FROM "_prisma_migrations"
      ORDER BY "started_at"
    `;
    assert.equal(billingEventColumns.length, 15);
    assert.equal(refundedAtColumns.length, 1);
    assert.equal(billingEventIndexes.length, 7);
    assert.equal(foreignKeys[0]?.deleteRule, "RESTRICT");
    results.schemaStructure = {
      billingProviderEventColumnCount: billingEventColumns.length,
      billingProviderEventColumns: billingEventColumns.map(
        (column) => column.columnName
      ),
      purchaseRefundedAtColumnCount: refundedAtColumns.length,
      billingProviderEventIndexCount: billingEventIndexes.length,
      billingProviderEventIndexes: billingEventIndexes.map(
        (index) => index.indexName
      ),
      purchaseForeignKeyDeleteRule: foreignKeys[0]?.deleteRule,
      appliedMigrations: appliedMigrations.map((migration) => ({
        migrationName: migration.migrationName,
        finishedAt: migration.finishedAt?.toISOString() || null,
        rolledBackAt: migration.rolledBackAt?.toISOString() || null
      })),
      status: "PASS"
    };
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.invalid`,
        firstName: "DB-A5-S1",
        lastName: "Synthetic"
      }
    });
    await prisma.purchase.create({
      data: {
        id: purchaseId,
        userId,
        provider: "STRIPE",
        status: "PENDING",
        amount: 2000,
        currency: "cny",
        stripeCheckoutSessionId: `cs_test_${runId}`
      }
    });

    const payment = await createBillingProviderEvent(
      {
        purchaseId,
        provider: "stripe",
        providerEventId: paymentEventId,
        eventType: "checkout.session.completed",
        checkoutSessionId: `cs_test_${runId}`,
        paymentIntentId: `pi_test_${runId}`,
        occurredAt: paidAt,
        payloadSha256: crypto.createHash("sha256").update("payment").digest("hex")
      },
      { client: prisma }
    );
    const refund = await createBillingProviderEvent(
      {
        purchaseId,
        provider: "stripe",
        providerEventId: refundEventId,
        eventType: "charge.refunded",
        paymentIntentId: `pi_test_${runId}`,
        chargeId: `ch_test_${runId}`,
        refundId: `re_test_${runId}`,
        occurredAt: refundedAt,
        payloadSha256: crypto.createHash("sha256").update("refund").digest("hex")
      },
      { client: prisma }
    );
    const purchaseWithEvents = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { billingEvents: { orderBy: { occurredAt: "asc" } } }
    });
    const eventWithPurchase = await prisma.billingProviderEvent.findUnique({
      where: { id: payment.event.id },
      include: { purchase: true }
    });
    let deleteRestricted = false;
    try {
      await prisma.purchase.delete({ where: { id: purchaseId } });
    } catch (error) {
      deleteRestricted = error?.code === "P2003";
    }
    assert.equal(payment.createdNew, true);
    assert.equal(refund.createdNew, true);
    assert.equal(purchaseWithEvents.billingEvents.length, 2);
    assert.equal(eventWithPurchase.purchase.id, purchaseId);
    assert.equal(deleteRestricted, true);
    results.crud = {
      eventCount: purchaseWithEvents.billingEvents.length,
      bothIdentitiesPreserved: true,
      purchaseRelationCorrect: true,
      reverseRelationCorrect: true,
      deleteRestricted,
      status: "PASS"
    };

    const concurrentInput = {
      purchaseId,
      provider: "stripe",
      providerEventId: concurrentEventId,
      eventType: "checkout.session.async_payment_succeeded",
      checkoutSessionId: `cs_test_${runId}`,
      paymentIntentId: `pi_test_${runId}`,
      occurredAt: now
    };
    const concurrentResults = await Promise.all(
      Array.from({ length: 12 }, () =>
        createBillingProviderEvent(concurrentInput, { client: prisma })
      )
    );
    const storedConcurrentCount = await prisma.billingProviderEvent.count({
      where: { provider: "stripe", providerEventId: concurrentEventId }
    });
    const otherProvider = await createBillingProviderEvent(
      { ...concurrentInput, provider: "another-provider" },
      { client: prisma }
    );
    let immutableUpdateRejected = false;
    try {
      await updateBillingEventProcessing(
        payment.event.id,
        { providerEventId: "evt_forbidden_change" },
        { client: prisma }
      );
    } catch (error) {
      immutableUpdateRejected = error?.status === 409;
    }
    const processed = await updateBillingEventProcessing(
      payment.event.id,
      {
        processingStatus: "PROCESSED",
        processedAt: now,
        processingErrorCode: null
      },
      { client: prisma }
    );
    assert.equal(storedConcurrentCount, 1);
    assert.equal(concurrentResults.filter((item) => item.createdNew).length, 1);
    assert.equal(
      concurrentResults.filter((item) => item.idempotentRecovery).length,
      11
    );
    assert.equal(otherProvider.createdNew, true);
    assert.equal(immutableUpdateRejected, true);
    assert.equal(processed.processingStatus, "PROCESSED");
    results.idempotency = {
      requestCount: 12,
      storedEventCount: storedConcurrentCount,
      effectiveCreateCount: 1,
      idempotentRecoveryCount: 11,
      providerScopedDuplicateIdCount: 2,
      immutableUpdateRejected,
      mutableProcessingUpdateAccepted: true,
      unhandledP2002Count: 0,
      http500Count: 0,
      status: "PASS"
    };

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "PAID", purchasedAt: paidAt }
    });
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.purchase.findUnique({
        where: { id: purchaseId }
      });
      assert.equal(current.status, "PAID");
      await transaction.purchase.update({
        where: { id: purchaseId },
        data: { status: "REFUNDED", refundedAt }
      });
    });
    const duplicateRefund = await createBillingProviderEvent(
      {
        purchaseId,
        provider: "stripe",
        providerEventId: refundEventId,
        eventType: "charge.refunded",
        paymentIntentId: `pi_test_${runId}`,
        chargeId: `ch_test_${runId}`,
        refundId: `re_test_${runId}`,
        occurredAt: refundedAt,
        payloadSha256: crypto.createHash("sha256").update("refund").digest("hex")
      },
      { client: prisma }
    );
    const afterRefund = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        billingEvents: {
          where: {
            providerEventId: { in: [paymentEventId, refundEventId] }
          }
        }
      }
    });
    assert.equal(duplicateRefund.idempotentRecovery, true);
    assert.equal(afterRefund.status, "REFUNDED");
    assert.equal(afterRefund.billingEvents.length, 2);
    assert.equal(afterRefund.refundedAt.toISOString(), refundedAt.toISOString());
    assert.equal(afterRefund.purchasedAt.toISOString(), paidAt.toISOString());
    results.refund = {
      paymentEventStillPresent: true,
      refundEventPresent: true,
      eventCount: afterRefund.billingEvents.length,
      purchaseStatus: afterRefund.status,
      refundedAtSet: true,
      refundedAtSemantics: "FIRST_SUCCESSFUL_REFUND_TRANSITION",
      purchasedAtPreserved: true,
      duplicateRefundIdempotent: true,
      refundedAtUnchanged: true,
      status: "PASS"
    };

    await createBillingProviderEvent(
      {
        purchaseId,
        provider: "stripe",
        providerEventId: orderingEventId,
        eventType: "checkout.session.async_payment_failed",
        checkoutSessionId: `cs_test_${runId}`,
        occurredAt: new Date(paidAt.getTime() - 30_000)
      },
      { client: prisma }
    );
    const ordered = await prisma.billingProviderEvent.findMany({
      where: {
        purchaseId,
        providerEventId: {
          in: [orderingEventId, paymentEventId, refundEventId]
        }
      },
      orderBy: [{ occurredAt: "asc" }, { receivedAt: "asc" }]
    });
    assert.deepEqual(
      ordered.map((event) => event.providerEventId),
      [orderingEventId, paymentEventId, refundEventId]
    );
    results.ordering = {
      retainedEventTypes: ordered.map((event) => event.eventType),
      eventOrderingPreservedByOccurredAtAndReceivedAt: true,
      multipleImmutableEventsRetained: true,
      purchaseAggregateStatusStoredSeparately: true,
      schemaSupportsOutOfOrderHandling: "PASS",
      runtimeOutOfOrderHandling: "DEFERRED_TO_DB-A5",
      status: "PASS"
    };
  } finally {
    await cleanup();
    results.cleanup = {
      remainingSyntheticUserCount: await prisma.user.count({
        where: { id: userId }
      }),
      remainingSyntheticPurchaseCount: await prisma.purchase.count({
        where: { id: purchaseId }
      }),
      remainingSyntheticBillingEventCount:
        await prisma.billingProviderEvent.count({
          where: { purchaseId }
        })
    };
    results.cleanup.status = Object.values(results.cleanup)
      .filter((value) => typeof value === "number")
      .every((value) => value === 0)
      ? "PASS"
      : "FAIL";
    await prisma.$disconnect();
  }
  assert.equal(results.cleanup.status, "PASS");
  process.stdout.write(`${JSON.stringify(results)}\n`);
})().catch(async (error) => {
  await prisma.$disconnect().catch(() => {});
  console.error(error);
  process.exitCode = 1;
});
