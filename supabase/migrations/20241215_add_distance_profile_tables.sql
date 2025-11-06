-- Add distance profile tables without dropping existing data
-- This migration adds new tables for distance profiling functionality

-- 1. Create PropertyDistanceProfile table
CREATE TABLE IF NOT EXISTS "PropertyDistanceProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "totalAmenities" INTEGER NOT NULL DEFAULT 0,
  "schools" INTEGER NOT NULL DEFAULT 0,
  "hospitals" INTEGER NOT NULL DEFAULT 0,
  "parks" INTEGER NOT NULL DEFAULT 0,
  "shopping" INTEGER NOT NULL DEFAULT 0,
  "dining" INTEGER NOT NULL DEFAULT 0,
  "services" INTEGER NOT NULL DEFAULT 0,
  "transit" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 2. Create Amenity table
CREATE TABLE IF NOT EXISTS "Amenity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "rating" DOUBLE PRECISION,
  "placeId" TEXT UNIQUE,
  "phone" TEXT,
  "website" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "profileId" TEXT
);

-- 3. Create TravelTime table
CREATE TABLE IF NOT EXISTS "TravelTime" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "amenityId" TEXT NOT NULL,
  "profileId" TEXT,
  "mode" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "distanceMeters" INTEGER NOT NULL,
  "cachedUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 4. Create indexes for PropertyDistanceProfile
CREATE INDEX IF NOT EXISTS "PropertyDistanceProfile_propertyId_idx" ON "PropertyDistanceProfile"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyDistanceProfile_generatedAt_idx" ON "PropertyDistanceProfile"("generatedAt");
CREATE INDEX IF NOT EXISTS "PropertyDistanceProfile_isActive_idx" ON "PropertyDistanceProfile"("isActive");

-- 5. Create indexes for Amenity
CREATE INDEX IF NOT EXISTS "Amenity_category_idx" ON "Amenity"("category");
CREATE INDEX IF NOT EXISTS "Amenity_latitude_longitude_idx" ON "Amenity"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Amenity_placeId_idx" ON "Amenity"("placeId");
CREATE INDEX IF NOT EXISTS "Amenity_isActive_idx" ON "Amenity"("isActive");

-- 6. Create indexes for TravelTime
CREATE INDEX IF NOT EXISTS "TravelTime_propertyId_idx" ON "TravelTime"("propertyId");
CREATE INDEX IF NOT EXISTS "TravelTime_amenityId_idx" ON "TravelTime"("amenityId");
CREATE INDEX IF NOT EXISTS "TravelTime_mode_idx" ON "TravelTime"("mode");
CREATE INDEX IF NOT EXISTS "TravelTime_cachedUntil_idx" ON "TravelTime"("cachedUntil");

-- 7. Create unique constraint for TravelTime
CREATE UNIQUE INDEX IF NOT EXISTS "TravelTime_propertyId_amenityId_mode_key" ON "TravelTime"("propertyId", "amenityId", "mode");

-- 8. Add foreign key constraints
ALTER TABLE "PropertyDistanceProfile" ADD CONSTRAINT "PropertyDistanceProfile_propertyId_fkey" 
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Amenity" ADD CONSTRAINT "Amenity_profileId_fkey" 
  FOREIGN KEY ("profileId") REFERENCES "PropertyDistanceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TravelTime" ADD CONSTRAINT "TravelTime_propertyId_fkey" 
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelTime" ADD CONSTRAINT "TravelTime_amenityId_fkey" 
  FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelTime" ADD CONSTRAINT "TravelTime_profileId_fkey" 
  FOREIGN KEY ("profileId") REFERENCES "PropertyDistanceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Success message
SELECT 'Distance profile tables created successfully!' as status;
