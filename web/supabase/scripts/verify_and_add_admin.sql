-- Complete Admin Setup and Verification Script
-- Run this in Supabase SQL Editor to diagnose and fix admin access

-- ============================================
-- STEP 1: Check if you're logged in and get your email
-- ============================================
SELECT
    id as user_id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 2: Check if admin_roles table exists and see available roles
-- ============================================
SELECT * FROM admin_roles;

-- ============================================
-- STEP 3: Check current admin users
-- ============================================
SELECT
    au.id,
    u.email,
    ar.name as role_name,
    au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY au.created_at DESC;

-- ============================================
-- STEP 4: Add yourself as admin
-- IMPORTANT: Replace 'YOUR_EMAIL_HERE@example.com' with your actual email
-- ============================================

-- If you have a 'super_admin' role:
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id,
  r.id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'YOUR_EMAIL_HERE@example.com'
  AND r.name = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;

-- If you have an 'admin' role (comment out the above and uncomment this):
-- INSERT INTO admin_users (user_id, role_id)
-- SELECT
--   u.id,
--   r.id
-- FROM auth.users u
-- CROSS JOIN admin_roles r
-- WHERE u.email = 'YOUR_EMAIL_HERE@example.com'
--   AND r.name = 'admin'
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STEP 5: Verify you were added successfully
-- ============================================
SELECT
    au.id,
    u.email,
    ar.name as role_name,
    au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = 'YOUR_EMAIL_HERE@example.com';

-- ============================================
-- TROUBLESHOOTING: If admin_roles table doesn't exist
-- ============================================
-- You may need to create it first. Check if you need to run the initial migrations:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%admin%';
