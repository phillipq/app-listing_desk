# Package System Migration Guide

## Issue
Prisma detected schema drift - the database schema doesn't match migration history. This is common when:
- Database was created without migrations
- Migrations got out of sync
- Working with an existing database

## Solution Options

### Option 1: Use `prisma db push` (Recommended for Development)

This syncs your schema directly without migration history. Safe for development:

```bash
npx prisma db push
```

**Pros:**
- ✅ Fast and simple
- ✅ No data loss
- ✅ Perfect for development

**Cons:**
- ⚠️ Doesn't create migration history
- ⚠️ Can't be used for production deployments

### Option 2: Create Baseline Migration (For Production)

If you need proper migration history:

```bash
# 1. Create migration without applying
npx prisma migrate dev --create-only --name add_package_system

# 2. Mark existing migrations as applied (if you want to keep them)
# OR delete existing migration files and create fresh baseline

# 3. Apply the migration
npx prisma migrate deploy
```

### Option 3: Reset Database (⚠️ DANGER - DROPS ALL DATA)

Only use if you're okay losing all data:

```bash
npx prisma migrate reset
```

**⚠️ WARNING: This will delete ALL data in your database!**

## Recommended Approach

For development with existing data:
1. Use `npx prisma db push` - it will add the new tables (Package, UserPackage, Subscription) without touching existing data
2. After successful push, run `npx prisma generate` to update Prisma Client
3. Then seed the default packages

## After Migration

Once the schema is synced:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Seed Default Packages:**
   Create a script to seed packages or run:
   ```typescript
   import { seedDefaultPackages } from '@/lib/packages/service'
   await seedDefaultPackages()
   ```

## Verify Migration

Check that new tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Package', 'UserPackage', 'Subscription');
```

