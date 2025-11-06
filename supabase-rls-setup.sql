-- Row Level Security (RLS) Setup for Multi-Tenant SaaS
-- This ensures each realtor can only access their own data

-- Enable RLS on all tables
ALTER TABLE "Realtor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- Realtor table policies
-- Realtors can only see and modify their own record
CREATE POLICY "realtors_can_manage_own_data" ON "Realtor"
  FOR ALL USING (id = current_setting('app.current_realtor_id', true)::text);

-- Session table policies
-- Realtors can only see sessions belonging to them
CREATE POLICY "realtors_can_see_own_sessions" ON "Session"
  FOR ALL USING (realtor_id = current_setting('app.current_realtor_id', true)::text);

-- Message table policies
-- Realtors can only see messages from their sessions
CREATE POLICY "realtors_can_see_own_messages" ON "Message"
  FOR ALL USING (
    session_id IN (
      SELECT id FROM "Session" 
      WHERE realtor_id = current_setting('app.current_realtor_id', true)::text
    )
  );

-- CustomerProfile table policies
-- Realtors can only see profiles from their sessions
CREATE POLICY "realtors_can_see_own_profiles" ON "CustomerProfile"
  FOR ALL USING (
    session_id IN (
      SELECT id FROM "Session" 
      WHERE realtor_id = current_setting('app.current_realtor_id', true)::text
    )
  );

-- Property table policies
-- Realtors can only see properties they own
CREATE POLICY "realtors_can_see_own_properties" ON "Property"
  FOR ALL USING (realtor_id = current_setting('app.current_realtor_id', true)::text);

-- Create a function to set the current realtor context
CREATE OR REPLACE FUNCTION set_current_realtor(realtor_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_realtor_id', realtor_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current realtor
CREATE OR REPLACE FUNCTION get_current_realtor()
RETURNS text AS $$
BEGIN
  RETURN current_setting('app.current_realtor_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
