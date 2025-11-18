-- Add Admin User
-- Run this in Supabase SQL Editor to make a user an admin

-- First, check if admin_users table exists
-- If it doesn't exist, create it:
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin users
CREATE POLICY IF NOT EXISTS "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    user_id IN (SELECT user_id FROM admin_users)
  );

-- Policy: Only existing admins can add new admins
CREATE POLICY IF NOT EXISTS "Admins can insert admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- To add yourself as an admin, replace 'your-email@example.com' with your actual email:
-- OPTION 1: Add by email
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- OPTION 2: If you know your user ID, use it directly:
-- INSERT INTO admin_users (user_id)
-- VALUES ('your-user-id-here')
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was added:
SELECT u.email, a.created_at
FROM admin_users a
JOIN auth.users u ON u.id = a.user_id;
