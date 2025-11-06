-- Supabase Security Fix: Enable RLS and Create Policies (Safe Version)
-- Run this in the Supabase SQL Editor
-- This version handles existing policies gracefully

-- 1. Enable Row Level Security on all tables (safe - won't error if already enabled)
DO $$ 
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE "property_embeddings" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "PropertyEmbedding" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "PropertyProximity" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "ProximityPreference" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "CustomerProfile" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "Realtor" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

DO $$ 
BEGIN
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS already enabled, continue
END $$;

-- 2. Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Realtors can access their own properties" ON "Property";
CREATE POLICY "Realtors can access their own properties" ON "Property"
FOR ALL USING (auth.uid()::text = "realtorId");

-- 3. Create RLS policies for Session table
DROP POLICY IF EXISTS "Realtors can access their own sessions" ON "Session";
CREATE POLICY "Realtors can access their own sessions" ON "Session"
FOR ALL USING (auth.uid()::text = "realtorId");

-- 4. Create RLS policies for CustomerProfile table
DROP POLICY IF EXISTS "Realtors can access profiles from their sessions" ON "CustomerProfile";
CREATE POLICY "Realtors can access profiles from their sessions" ON "CustomerProfile"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Session" 
    WHERE "Session".id = "CustomerProfile"."sessionId" 
    AND "Session"."realtorId" = auth.uid()::text
  )
);

-- 5. Create RLS policies for Message table
DROP POLICY IF EXISTS "Realtors can access messages from their sessions" ON "Message";
CREATE POLICY "Realtors can access messages from their sessions" ON "Message"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Session" 
    WHERE "Session".id = "Message"."sessionId" 
    AND "Session"."realtorId" = auth.uid()::text
  )
);

-- 6. Create RLS policies for property_embeddings table
DROP POLICY IF EXISTS "Realtors can access embeddings for their properties" ON "property_embeddings";
CREATE POLICY "Realtors can access embeddings for their properties" ON "property_embeddings"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Property" 
    WHERE "Property"."mlsId" = "property_embeddings"."mls_id" 
    AND "Property"."realtorId" = auth.uid()::text
  )
);

-- 7. Create RLS policies for Realtor table
DROP POLICY IF EXISTS "Realtors can view their own profile" ON "Realtor";
CREATE POLICY "Realtors can view their own profile" ON "Realtor"
FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Admins can manage all realtors" ON "Realtor";
CREATE POLICY "Admins can manage all realtors" ON "Realtor"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Realtor" 
    WHERE "Realtor".id = auth.uid()::text 
    AND "Realtor"."isAdmin" = true
  )
);

-- 8. Create RLS policies for User table
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Admins can manage all users" ON "User";
CREATE POLICY "Admins can manage all users" ON "User"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Realtor" 
    WHERE "Realtor".id = auth.uid()::text 
    AND "Realtor"."isAdmin" = true
  )
);

-- 9. Create RLS policies for PropertyEmbedding table (if it exists)
DROP POLICY IF EXISTS "Realtors can access their property embeddings" ON "PropertyEmbedding";
CREATE POLICY "Realtors can access their property embeddings" ON "PropertyEmbedding"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Property" 
    WHERE "Property"."mlsId" = "PropertyEmbedding"."mlsId" 
    AND "Property"."realtorId" = auth.uid()::text
  )
);

-- 10. Create RLS policies for PropertyProximity table
DROP POLICY IF EXISTS "Realtors can access their property proximity data" ON "PropertyProximity";
CREATE POLICY "Realtors can access their property proximity data" ON "PropertyProximity"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Property" 
    WHERE "Property"."mlsId" = "PropertyProximity"."mlsId" 
    AND "Property"."realtorId" = auth.uid()::text
  )
);

-- 11. Create RLS policies for ProximityPreference table
DROP POLICY IF EXISTS "Realtors can access their proximity preferences" ON "ProximityPreference";
CREATE POLICY "Realtors can access their proximity preferences" ON "ProximityPreference"
FOR ALL USING (auth.uid()::text = "realtorId");

-- 12. Fix function security (if needed)
-- Note: You may need to adjust these based on your specific function requirements
-- The functions should be accessible to authenticated users

-- 13. Move vector extension to a separate schema (optional but recommended)
-- CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION vector SET SCHEMA extensions;

-- Success message
SELECT 'RLS policies created successfully!' as status;
