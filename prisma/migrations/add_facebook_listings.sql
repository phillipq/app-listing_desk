-- Create FacebookGroups table
CREATE TABLE "FacebookGroups" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScraped" TIMESTAMP(3),
    "nextScrape" TIMESTAMP(3),
    "scrapeInterval" INTEGER NOT NULL DEFAULT 24, -- hours
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookGroups_pkey" PRIMARY KEY ("id")
);

-- Create FacebookListings table
CREATE TABLE "FacebookListings" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(3,1),
    "propertyType" TEXT,
    "images" TEXT[],
    "postedDate" TIMESTAMP(3) NOT NULL,
    "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookListings_pkey" PRIMARY KEY ("id")
);

-- Add indexes for better performance
CREATE INDEX "FacebookGroups_userId_idx" ON "FacebookGroups"("userId");
CREATE INDEX "FacebookGroups_groupId_idx" ON "FacebookGroups"("groupId");
CREATE INDEX "FacebookListings_userId_idx" ON "FacebookListings"("userId");
CREATE INDEX "FacebookListings_groupId_idx" ON "FacebookListings"("groupId");
CREATE INDEX "FacebookListings_postId_idx" ON "FacebookListings"("postId");
CREATE INDEX "FacebookListings_isActive_idx" ON "FacebookListings"("isActive");

-- Add foreign key constraints
ALTER TABLE "FacebookGroups" ADD CONSTRAINT "FacebookGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FacebookListings" ADD CONSTRAINT "FacebookListings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FacebookListings" ADD CONSTRAINT "FacebookListings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "FacebookGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
