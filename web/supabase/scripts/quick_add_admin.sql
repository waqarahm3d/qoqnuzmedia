-- ============================================
-- QUICK ADD ADMIN USER
-- ============================================
-- Simple script to add an admin user to the database
-- Replace 'your-email@example.com' with the actual email
-- ============================================

-- STEP 1: Check who is already an admin
SELECT
  u.email,
  ar.name as role
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id;

-- STEP 2: See all registered users
SELECT
  email,
  created_at,
  CASE
    WHEN id IN (SELECT user_id FROM admin_users) THEN 'YES - Already Admin'
    ELSE 'NO - Not Admin'
  END as admin_status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Add your admin user
-- Copy ONE of the commands below and replace the email
-- ============================================

-- OPTION A: Super Admin (full access)
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

-- OPTION B: Regular Admin
/*
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'your-email@example.com'
  AND r.name = 'Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
*/

-- OPTION C: Content Manager (can manage content but not users)
/*
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'your-email@example.com'
  AND r.name = 'Content Manager'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
*/

-- STEP 4: Verify the user was added
/*
SELECT
  u.email,
  ar.name as role,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = 'your-email@example.com';
*/
