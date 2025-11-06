# Quick Migration Steps - Package System

## When Database Connection is Available:

### Step 1: Push Schema Changes (Development)
```bash
npx prisma db push
```
This will add the new tables (Package, UserPackage, Subscription) and update the Realtor table.

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```
Updates the TypeScript types to match your new schema.

### Step 3: Seed Default Packages
```bash
# Option A: Use the seed script
npx tsx scripts/seed-packages.ts

# Option B: Create an API route to seed (temporary)
# Or manually create packages in your admin interface
```

### Step 4: Verify
Check that tables were created:
```bash
npx prisma studio
```
Look for `Package`, `UserPackage`, and `Subscription` tables.

---

## Alternative: If `db push` doesn't work

If you need to use migrations instead:

### Option A: Baseline Migration
```bash
# Mark current state as baseline
npx prisma migrate resolve --applied <migration_name>

# Or create a fresh migration
npx prisma migrate dev --name add_package_system
```

### Option B: Manual SQL (Last Resort)
If Prisma continues to have issues, you can create the tables manually:

```sql
-- Run in your database directly
CREATE TABLE "Package" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  price DECIMAL,
  "stripePriceId" TEXT UNIQUE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "UserPackage" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "Realtor"(id) ON DELETE CASCADE,
  "packageId" TEXT NOT NULL REFERENCES "Package"(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  "startsAt" TIMESTAMP DEFAULT NOW(),
  "expiresAt" TIMESTAMP,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "packageId")
);

CREATE TABLE "Subscription" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "Realtor"(id) ON DELETE CASCADE,
  "packageId" TEXT NOT NULL REFERENCES "Package"(id) ON DELETE CASCADE,
  "stripeSubscriptionId" TEXT UNIQUE NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  status TEXT NOT NULL,
  "currentPeriodStart" TIMESTAMP NOT NULL,
  "currentPeriodEnd" TIMESTAMP NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "cancelledAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add columns to Realtor table
ALTER TABLE "Realtor" 
ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'inactive',
ADD COLUMN "stripeCustomerId" TEXT UNIQUE;

-- Create indexes
CREATE INDEX "Package_slug_isActive_idx" ON "Package"("slug", "isActive");
CREATE INDEX "UserPackage_userId_idx" ON "UserPackage"("userId");
CREATE INDEX "UserPackage_status_idx" ON "UserPackage"("status");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
```

Then run:
```bash
npx prisma generate
npx prisma db pull  # Sync Prisma schema with actual database
```

