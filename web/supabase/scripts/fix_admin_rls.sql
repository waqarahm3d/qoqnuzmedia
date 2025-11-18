-- Fix RLS Policies for admin_users table
-- This ensures the API can check if a user is an admin

-- Check current policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'admin_users';

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can manage admin users" ON admin_users;

-- Create policy that allows authenticated users to check if they are admin
-- This is needed for the API routes to work
CREATE POLICY "Users can check their own admin status"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy that allows service role (used by API) to read all admin users
CREATE POLICY "Service role can read admin users"
  ON admin_users FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow existing admins to view all admin users
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Allow existing admins to add new admins
CREATE POLICY "Admins can insert admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Verify policies were created
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'admin_users';
