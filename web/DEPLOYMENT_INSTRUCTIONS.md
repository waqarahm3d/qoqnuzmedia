# Deployment Instructions - Database-Based Admin System

## Overview

This update implements a **pure database-based admin role management system**. Admin access is granted ONLY through the database - there are no environment variable fallbacks or shortcuts.

## Critical Changes

### What Changed:
1. **Removed ADMIN_EMAILS environment variable** - No longer used or needed
2. **Database-only admin management** - All admins must be in the `admin_users` table
3. **Improved authentication** - Uses service role client to bypass RLS issues
4. **Better error messages** - Clear instructions when access is denied

### Files Modified:
1. `src/lib/auth/admin-middleware.ts` - Removed ADMIN_EMAILS fallback
2. `src/lib/auth-utils.ts` - Updated to use service role client, removed ADMIN_EMAILS
3. `middleware.ts` - Removed ADMIN_EMAILS check, uses service role client
4. `supabase/scripts/setup_admin_system.sql` - NEW comprehensive admin setup script

## Required Environment Variables

**NO NEW VARIABLES NEEDED!** The ADMIN_EMAILS variable has been removed.

Ensure these existing variables are still set in your production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Before Deploying: Setup Admin Users

**IMPORTANT:** Before deploying this update, you MUST add at least one admin user to the database. Otherwise, NO ONE will have admin access.

### Step 1: Run the Admin Setup Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/scripts/setup_admin_system.sql`
4. Paste and run it in the SQL Editor

This script will:
- Create `admin_roles` and `admin_users` tables (if they don't exist)
- Set up proper RLS policies
- Create default admin roles (Super Admin, Admin, Content Manager, Viewer)
- Show you all registered users

### Step 2: Add Your First Admin

After running the setup script, you'll see a list of all registered users. Choose the option that fits your needs:

**Option A: Make yourself a Super Admin (recommended)**

```sql
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'your-email@example.com'  -- Replace with your email
  AND r.name = 'Super Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
```

**Option B: Make someone a regular Admin**

```sql
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'user@example.com'  -- Replace with their email
  AND r.name = 'Admin'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
```

### Step 3: Verify Admin Was Added

Run this query to verify:

```sql
SELECT
  u.email,
  ar.name as role_name,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = 'your-email@example.com';  -- Replace with your email
```

You should see your admin user listed.

## Deployment Steps

### Option 1: Using PM2 (Recommended)

```bash
# 1. SSH into your production server
ssh your-server

# 2. Navigate to the web application directory
cd /path/to/qoqnuzmedia/web

# 3. Pull the latest changes
git pull origin main  # or your production branch name

# 4. Install any new dependencies
npm install  # or pnpm install or yarn install

# 5. Build the application
npm run build

# 6. Restart the application with PM2
pm2 restart qoqnuz-web

# 7. Check the logs to ensure it started successfully
pm2 logs qoqnuz-web --lines 50
```

### Option 2: Using Docker

```bash
# 1. Pull the latest changes
git pull origin main

# 2. Rebuild and restart the container
docker-compose down
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f web
```

### Option 3: Using Vercel/Netlify

1. Push changes to your git repository
2. The platform will automatically redeploy
3. No environment variable changes needed

## Verification Steps

After deployment, verify the fix worked:

### 1. Test Admin Dashboard Access

1. Go to `https://app.qoqnuz.com/admin`
2. Sign in with your admin email (the one you added to admin_users)
3. You should see the admin dashboard

**Expected Behavior:**
- If you're in admin_users: You see the dashboard
- If you're NOT in admin_users: You're redirected to /home

### 2. Test Automation Page

1. Go to `https://app.qoqnuz.com/admin/automation`
2. You should see automation status
3. No "Unauthorized" errors

### 3. Test Settings API

Open browser console and run:

```javascript
fetch('/api/admin/settings')
  .then(r => r.json())
  .then(d => console.log('Settings:', d))
  .catch(e => console.error('Error:', e))
```

**Expected:**
- If you're an admin: You see settings data
- If you're NOT an admin: You see `{"error": "Forbidden - Admin access required"}`

### 4. Test Automation API

```javascript
fetch('/api/automation/trigger')
  .then(r => r.json())
  .then(d => console.log('Automation:', d))
  .catch(e => console.error('Error:', e))
```

**Expected:**
- If you're an admin: You see automation status
- If you're NOT an admin: You see `{"error": "Forbidden - Admin access required"}`

## Managing Admin Users

### Add a New Admin

```sql
INSERT INTO admin_users (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM auth.users u
CROSS JOIN admin_roles r
WHERE u.email = 'new-admin@example.com'
  AND r.name = 'Admin'  -- or 'Super Admin', 'Content Manager', 'Viewer'
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      updated_at = NOW();
```

### Remove Admin Access

```sql
DELETE FROM admin_users
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### Change a User's Role

```sql
UPDATE admin_users
SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Content Manager'),
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### List All Admins

```sql
SELECT
  u.email,
  ar.name as role,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY au.created_at;
```

## Available Admin Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Full system access | All permissions (`*`) |
| **Admin** | Standard admin access | users:read, users:write, content:read, content:write, analytics:read |
| **Content Manager** | Can manage content but not users | content:read, content:write, analytics:read |
| **Viewer** | Read-only access | users:read, content:read, analytics:read |

## Troubleshooting

### Still Getting "Unauthorized" or "Forbidden" Errors?

**Check 1: Verify you're in the admin_users table**

```sql
SELECT
  u.email,
  ar.name as role_name
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = 'your-email@example.com';
```

If this returns no rows, you're not an admin. Run the "Add Your First Admin" SQL command.

**Check 2: Verify the tables exist**

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_roles');
```

You should see both tables. If not, run the setup_admin_system.sql script.

**Check 3: Clear browser cache and cookies**

1. Open DevTools (F12)
2. Go to Application tab
3. Clear all cookies for your domain
4. Sign out and sign in again

**Check 4: Check application logs**

```bash
# PM2
pm2 logs qoqnuz-web --lines 100

# Docker
docker-compose logs web --tail 100

# Look for auth-related errors
```

### Cannot Access Admin Panel After Sign In?

**Symptom:** You're signed in, but redirected to /home when accessing /admin

**Cause:** You're not in the admin_users table

**Fix:** Run the SQL command to add yourself as an admin (see "Add Your First Admin" above)

### RLS Policy Errors?

**Symptom:** Getting "permission denied" or "row level security" errors

**Cause:** RLS policies might not be set up correctly

**Fix:** Run the setup_admin_system.sql script again. It will recreate all policies.

## Summary of Changes

### What Was Fixed:
- Removed ADMIN_EMAILS environment variable completely
- Implemented pure database-based role management
- All admin checks now use service role client (bypasses RLS)
- Better error messages when authorization fails
- Comprehensive admin setup and management scripts

### What Changed for Users:
- Admins must be in the database (no environment variable shortcut)
- Easy to add/remove admins through SQL queries
- Proper role-based access control
- Clear permission system for future expansion

### What Stayed the Same:
- Sign-in flow unchanged
- Admin UI unchanged
- API endpoints unchanged (just better auth)
- No new environment variables needed

## Important Notes

1. **At least one admin required:** Always ensure there's at least one Super Admin in the database
2. **Database backups:** Consider backing up admin_users table before making changes
3. **Security:** Never share your SUPABASE_SERVICE_ROLE_KEY - it bypasses all RLS
4. **Role permissions:** Customize permissions in admin_roles table as needed

## Support

If you continue to experience issues after following these instructions:

1. Check the browser console for specific error messages
2. Check server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure the latest code is deployed and built
5. Verify you're in the admin_users table with the correct role
