-- Add nullable contacts JSONB to Listing
ALTER TABLE "Listing" ADD COLUMN "contacts" JSONB;
