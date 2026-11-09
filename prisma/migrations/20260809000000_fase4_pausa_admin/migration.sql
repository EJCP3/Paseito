-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "adminPausedAt" TIMESTAMP(3),
ADD COLUMN     "adminPausedReason" TEXT;

