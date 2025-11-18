-- ============================================
-- ADMIN SYSTEM SETUP SCRIPT
-- ============================================
-- This script sets up the complete admin system for the application.
-- Run this in Supabase SQL Editor to initialize or fix the admin system.
--
-- IMPORTANT: This is the ONLY way to grant admin access.
-- There is no environment variable fallback - all admins must be in the database.
-- ============================================

-- ============================================
-- STEP 1: Create admin_roles table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create admin_users table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: Enable RLS on both tables
-- ============================================
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Drop existing policies (if any) to avoid conflicts
-- ============================================
DROP POLICY IF EXISTS "Users can check their own admin status" ON admin_users;
DROP POLICY IF EXISTS "Service role can read admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role can read admin roles" ON admin_roles;

-- ============================================
-- STEP 5: Create RLS policies
-- ============================================

-- Policy 1: Users can check their own admin status
-- This allows a user to see if THEY are an admin
CREATE POLICY "Users can check their own admin status"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow service role full access (for backend queries)
-- This is used by our API routes that use the service role client
CREATE POLICY "Service role can manage admin users"
  ON admin_users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: Allow service role to read admin roles
CREATE POLICY "Service role can read admin roles"
  ON admin_roles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 4: Users can read admin roles
CREATE POLICY "Users can read admin roles"
  ON admin_roles FOR SELECT
  USING (true);

-- ============================================
-- STEP 6: Insert default roles (if they don't exist)
-- ============================================
INSERT INTO admin_roles (name, description, permissions) VALUES
  ('Super Admin', 'Full system access with all permissions', '["*"]'::jsonb),
  ('Admin', 'Standard admin access', '["users:read", "users:write", "content:read", "content:write", "analytics:read"]'::jsonb),
  ('Content Manager', 'Can manage content but not users', '["content:read", "content:write", "analytics:read"]'::jsonb),
  ('Viewer', 'Read-only access to admin panel', '["users:read", "content:read", "analytics:read"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 7: Check current state
-- ============================================

-- Show all available roles
SELECT '=== AVAILABLE ROLES ===' as info;
SELECT
  id,
  name,
  description,
  permissions
FROM admin_roles
ORDER BY
  CASE name
    WHEN 'Super Admin' THEN 1
    WHEN 'Admin' THEN 2
    WHEN 'Content Manager' THEN 3
    WHEN 'Viewer' THEN 4
    ELSE 5
  END;

-- Show all current admin users
SELECT '=== CURRENT ADMIN USERS ===' as info;
SELECT
  au.id,
  u.email,
  ar.name as role_name,
  ar.description as role_description,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY au.created_at DESC;

-- Show all registered users (to help you identify which user to make admin)
SELECT '=== ALL REGISTERED USERS ===' as info;
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE
    WHEN id IN (SELECT user_id FROM admin_users) THEN 'YES'
    ELSE 'NO'
  END as is_admin
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 8: Add your first admin user
-- ============================================
-- INSTRUCTIONS:
-- 1. Copy ONE of the commands below
-- 2. Replace 'your-email@example.com' with your actual email
-- 3. Run the command in the SQL Editor
-- ============================================

-- OPTION A: Make yourself a Super Admin (recommended for first user)
/*
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'your-email@example.com'
  AND r.name = 'Super Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
*/

-- OPTION B: Make someone a regular Admin
/*
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'other-user@example.com'
  AND r.name = 'Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
*/

-- OPTION C: Make someone a Content Manager
/*
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'content-manager@example.com'
  AND r.name = 'Content Manager'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
*/

-- ============================================
-- STEP 9: Verification query
-- ============================================
-- Run this after adding your admin user to verify it worked
/*
SELECT
  u.email,
  ar.name as role_name,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = 'your-email@example.com';
*/

-- ============================================
-- USEFUL MANAGEMENT QUERIES
-- ============================================

-- Remove admin access from a user:
/*
DELETE FROM admin_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
*/

-- Change a user's role:
/*
UPDATE admin_users
SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Admin'),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
*/

-- List all admins with their roles:
/*
SELECT
  u.email,
  ar.name as role,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY au.created_at;
*/
