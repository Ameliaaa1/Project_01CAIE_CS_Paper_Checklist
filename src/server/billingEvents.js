const IMMUTABLE_EVENT_FIELDS = Object.freeze([
  "provider",
  "providerEventId",
  "eventType",
  "purchaseId",
  "checkoutSessionId",
  "paymentIntentId",
  "chargeId",
  "refundId",
  "occurredAt",
  "payloadSha256"
]);
const MUTABLE_PROCESSING_FIELDS = new Set([
  "processingStatus",
  "processedAt",
  "processingErrorCode"
]);

function billingEventError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizedComparable(value) {
  if (value instanceof Date) return value.toISOString();
  return value == null ? null : String(value);
}

function assertSameImmutableIdentity(existing, requested) {
  const mismatches = IMMUTABLE_EVENT_FIELDS.filter(
    (field) =>
      normalizedComparable(existing[field]) !==
      normalizedComparable(requested[field])
  );
  if (mismatches.length) {
    throw billingEventError(
      `Billing provider event identity conflict: ${mismatches.join(", ")}`,
      409
    );
  }
}

async function createBillingProviderEvent(data, options = {}) {
  const client = options.client;
  if (!client?.billingProviderEvent) {
    throw billingEventError("Billing event persistence requires a Prisma client.");
  }
  const provider = String(data?.provider || "").trim();
  const providerEventId = String(data?.providerEventId || "").trim();
  const purchaseId = String(data?.purchaseId || "").trim();
  const eventType = String(data?.eventType || "").trim();
  if (!provider || !providerEventId || !purchaseId || !eventType) {
    throw billingEventError(
      "Billing event requires provider, providerEventId, purchaseId, and eventType."
    );
  }
  const createData = {
    purchaseId,
    provider,
    providerEventId,
    eventType,
    processingStatus: data.processingStatus || "RECEIVED",
    checkoutSessionId: data.checkoutSessionId || null,
    paymentIntentId: data.paymentIntentId || null,
    chargeId: data.chargeId || null,
    refundId: data.refundId || null,
    occurredAt: data.occurredAt || null,
    processedAt: data.processedAt || null,
    processingErrorCode: data.processingErrorCode || null,
    payloadSha256: data.payloadSha256 || null
  };
  try {
    const event = await client.billingProviderEvent.create({ data: createData });
    return {
      event,
      createdNew: true,
      idempotentRecovery: false
    };
  } catch (error) {
    if (error?.code !== "P2002") throw error;
    const event = await client.billingProviderEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId
        }
      }
    });
    if (!event) throw error;
    assertSameImmutableIdentity(event, createData);
    return {
      event,
      createdNew: false,
      idempotentRecovery: true
    };
  }
}

async function updateBillingEventProcessing(eventId, changes, options = {}) {
  const client = options.client;
  if (!client?.billingProviderEvent) {
    throw billingEventError("Billing event persistence requires a Prisma client.");
  }
  const keys = Object.keys(changes || {});
  const forbidden = keys.filter((key) => !MUTABLE_PROCESSING_FIELDS.has(key));
  if (forbidden.length) {
    throw billingEventError(
      `Immutable billing event fields cannot be updated: ${forbidden.join(", ")}`,
      409
    );
  }
  if (!keys.length) {
    throw billingEventError("Billing event processing update is empty.");
  }
  return client.billingProviderEvent.update({
    where: { id: eventId },
    data: changes
  });
}

module.exports = {
  IMMUTABLE_EVENT_FIELDS,
  createBillingProviderEvent,
  updateBillingEventProcessing
};
