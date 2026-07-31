-- CreateEnum
CREATE TYPE "BillingEventProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BillingProviderEvent" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processingStatus" "BillingEventProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "checkoutSessionId" TEXT,
    "paymentIntentId" TEXT,
    "chargeId" TEXT,
    "refundId" TEXT,
    "occurredAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingErrorCode" TEXT,
    "payloadSha256" TEXT,

    CONSTRAINT "BillingProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingProviderEvent_provider_providerEventId_key" ON "BillingProviderEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "BillingProviderEvent_purchaseId_receivedAt_idx" ON "BillingProviderEvent"("purchaseId", "receivedAt");

-- CreateIndex
CREATE INDEX "BillingProviderEvent_eventType_idx" ON "BillingProviderEvent"("eventType");

-- CreateIndex
CREATE INDEX "BillingProviderEvent_chargeId_idx" ON "BillingProviderEvent"("chargeId");

-- CreateIndex
CREATE INDEX "BillingProviderEvent_refundId_idx" ON "BillingProviderEvent"("refundId");

-- CreateIndex
CREATE INDEX "BillingProviderEvent_processingStatus_idx" ON "BillingProviderEvent"("processingStatus");

-- AddForeignKey
ALTER TABLE "BillingProviderEvent" ADD CONSTRAINT "BillingProviderEvent_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
