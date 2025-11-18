-- Add Admin User
-- Run this in Supabase SQL Editor to make a user an admin

-- STEP 1: First, check what roles exist in your system
SELECT * FROM admin_roles;

-- STEP 2: Get the role_id for 'super_admin' or 'admin' role
-- Replace 'your-email@example.com' with your actual email

-- OPTION A: If you have a 'super_admin' role
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id,
  r.id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'your-email@example.com'
  AND r.name = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;

-- OPTION B: If you have an 'admin' role instead
-- INSERT INTO admin_users (user_id, role_id)
-- SELECT
--   u.id,
--   r.id
-- FROM auth.users u
-- CROSS JOIN admin_roles r
-- WHERE u.email = 'your-email@example.com'
--   AND r.name = 'admin'
-- ON CONFLICT (user_id) DO NOTHING;

-- OPTION C: If you know the role_id directly (check from step 1)
-- INSERT INTO admin_users (user_id, role_id)
-- SELECT id, 'role-id-from-step-1-here'
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- STEP 3: Verify the admin was added
SELECT
  u.email,
  ar.name as role_name,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id;
