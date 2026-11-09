-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_paymentRef_key" ON "Feature"("paymentRef");

-- CreateIndex
CREATE INDEX "Feature_listingId_idx" ON "Feature"("listingId");

-- CreateIndex
CREATE INDEX "ListingEvent_createdAt_idx" ON "ListingEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

