-- ============================================
-- ADMIN SYSTEM MIGRATION SCRIPT
-- ============================================
-- This script migrates existing admin tables or creates them if they don't exist
-- Safe to run multiple times - will only make changes if needed
-- ============================================

-- ============================================
-- STEP 1: Add missing columns to admin_roles if needed
-- ============================================
DO $$
BEGIN
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_roles' AND column_name = 'description'
  ) THEN
    ALTER TABLE admin_roles ADD COLUMN description TEXT;
  END IF;

  -- Add permissions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_roles' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE admin_roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_roles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admin_roles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- STEP 2: Add missing columns to admin_users if needed
-- ============================================
DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

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
DROP POLICY IF EXISTS "Service role can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role can read admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can read admin roles" ON admin_roles;

-- ============================================
-- STEP 5: Create RLS policies
-- ============================================

-- Policy 1: Users can check their own admin status
CREATE POLICY "Users can check their own admin status"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow service role full access (for backend queries)
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
-- STEP 6: Insert or update default roles
-- ============================================
INSERT INTO admin_roles (name, description, permissions) VALUES
  ('Super Admin', 'Full system access with all permissions', '["*"]'::jsonb),
  ('Admin', 'Standard admin access', '["users:read", "users:write", "content:read", "content:write", "analytics:read"]'::jsonb),
  ('Content Manager', 'Can manage content but not users', '["content:read", "content:write", "analytics:read"]'::jsonb),
  ('Viewer', 'Read-only access to admin panel', '["users:read", "content:read", "analytics:read"]'::jsonb)
ON CONFLICT (name) DO UPDATE
  SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ============================================
-- STEP 7: Show current state
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
-- STEP 8: Instructions for adding your first admin
-- ============================================

SELECT '
============================================
NEXT STEP: ADD YOUR FIRST ADMIN USER
============================================

If you do not see yourself in the admin users list above,
run ONE of the following commands (replacing the email):

-- OPTION A: Make yourself a Super Admin (recommended)
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = ''your-email@example.com''
  AND r.name = ''Super Admin''
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();

-- OPTION B: Make someone a regular Admin
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = ''other-user@example.com''
  AND r.name = ''Admin''
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();

============================================
' as instructions;
