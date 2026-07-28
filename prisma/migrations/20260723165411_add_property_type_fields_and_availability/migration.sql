-- CreateEnum
CREATE TYPE "ListingMode" AS ENUM ('SALE', 'RENT_LONG_TERM', 'RENT_DAILY');

-- CreateEnum
CREATE TYPE "FurnishedStatus" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'RENOVATED', 'USED', 'UNDER_CONSTRUCTION');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'BOOKED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bedsCount" INTEGER,
ADD COLUMN     "cancellationPolicy" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "condition" "PropertyCondition",
ADD COLUMN     "constructionYear" INTEGER,
ADD COLUMN     "floorNumber" INTEGER,
ADD COLUMN     "floors" INTEGER,
ADD COLUMN     "furnished" "FurnishedStatus",
ADD COLUMN     "garageSpots" INTEGER,
ADD COLUMN     "guestCapacity" INTEGER,
ADD COLUMN     "hasBalcony" BOOLEAN,
ADD COLUMN     "hasCistern" BOOLEAN,
ADD COLUMN     "hasElevator" BOOLEAN,
ADD COLUMN     "hasGarage" BOOLEAN,
ADD COLUMN     "hasGenerator" BOOLEAN,
ADD COLUMN     "hasPatio" BOOLEAN,
ADD COLUMN     "hasPool" BOOLEAN,
ADD COLUMN     "landAreaM2" DOUBLE PRECISION,
ADD COLUMN     "maintenanceFee" DECIMAL(65,30),
ADD COLUMN     "minNights" INTEGER,
ADD COLUMN     "mode" "ListingMode",
ADD COLUMN     "patioSize" DOUBLE PRECISION,
ADD COLUMN     "petsAllowed" BOOLEAN,
ADD COLUMN     "power24h" BOOLEAN,
ADD COLUMN     "pricePerDay" DECIMAL(65,30),
ADD COLUMN     "pricePerWeek" DECIMAL(65,30),
ADD COLUMN     "securityDeposit" DECIMAL(65,30),
ADD COLUMN     "totalFloors" INTEGER,
ADD COLUMN     "villaPoolSize" DOUBLE PRECISION,
ADD COLUMN     "villaPoolType" TEXT,
ADD COLUMN     "villaServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "water24h" BOOLEAN;

-- CreateTable
CREATE TABLE "AvailabilityRange" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityRange_listingId_startDate_endDate_idx" ON "AvailabilityRange"("listingId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "AvailabilityRange" ADD CONSTRAINT "AvailabilityRange_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
