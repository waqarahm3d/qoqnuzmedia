# Deployment Instructions - Admin Authorization Fix

## Critical Fixes Completed

This update fixes the "Unauthorized" errors on all admin pages by:
1. Fixing cookie authentication in the admin middleware
2. Adding support for ADMIN_EMAILS environment variable
3. Updating automation API routes to check both database and env vars

## Required Environment Variables

Before deploying, ensure these environment variables are set in your production environment:

### ADMIN_EMAILS (CRITICAL - NEW VARIABLE)
```bash
ADMIN_EMAILS=your-admin-email@example.com,another-admin@example.com
```

This variable grants super admin access to users with these email addresses, even if they're not in the `admin_users` database table yet.

**Important:**
- Use ONLY the email addresses you want to have super admin access
- Separate multiple emails with commas
- No spaces between emails
- Must match the exact email used for Supabase authentication

### Existing Variables (Must Already Be Set)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment Steps

### Option 1: Using PM2 (Recommended)

```bash
# 1. SSH into your production server
ssh your-server

# 2. Navigate to the web application directory
cd /path/to/qoqnuzmedia/web

# 3. Pull the latest changes
git pull origin main  # or your production branch name

# 4. Set the ADMIN_EMAILS environment variable
export ADMIN_EMAILS="your-admin-email@example.com"

# Alternative: Add to .env.local file
echo "ADMIN_EMAILS=your-admin-email@example.com" >> .env.local

# 5. Install any new dependencies
npm install  # or pnpm install or yarn install

# 6. Build the application
npm run build

# 7. Restart the application with PM2
pm2 restart qoqnuz-web

# 8. Check the logs to ensure it started successfully
pm2 logs qoqnuz-web --lines 50
```

### Option 2: Using Docker

```bash
# 1. Pull the latest changes
git pull origin main

# 2. Update docker-compose.yml or .env file with ADMIN_EMAILS
# Add this line to your environment section:
ADMIN_EMAILS=your-admin-email@example.com

# 3. Rebuild and restart the container
docker-compose down
docker-compose up -d --build

# 4. Check logs
docker-compose logs -f web
```

### Option 3: Using Vercel/Netlify

1. Push changes to your git repository (already done)
2. Go to your hosting provider dashboard
3. Add environment variable:
   - Name: `ADMIN_EMAILS`
   - Value: `your-admin-email@example.com`
4. Redeploy the application

## Verification Steps

After deployment, verify the fix worked:

### 1. Test Admin Dashboard Access
1. Go to `https://app.qoqnuz.com/admin`
2. Sign in with your admin email (must match ADMIN_EMAILS)
3. You should see the admin dashboard without redirects

### 2. Test Automation Page
1. Go to `https://app.qoqnuz.com/admin/automation`
2. You should NOT see any "Unauthorized" errors
3. The page should load with automation status

### 3. Test Settings API
Open browser console and run:
```javascript
fetch('/api/admin/settings')
  .then(r => r.json())
  .then(d => console.log('Settings:', d))
  .catch(e => console.error('Error:', e))
```

You should see settings data, NOT "Unauthorized" error.

### 4. Test Automation API
```javascript
fetch('/api/automation/trigger')
  .then(r => r.json())
  .then(d => console.log('Automation:', d))
  .catch(e => console.error('Error:', e))
```

You should see automation status, NOT "Unauthorized" error.

## Troubleshooting

### Still Getting "Unauthorized" Errors?

**Check 1: Verify ADMIN_EMAILS is set correctly**
```bash
# On your server, check if the variable is set
echo $ADMIN_EMAILS

# If using PM2, check the environment
pm2 env qoqnuz-web | grep ADMIN_EMAILS
```

**Check 2: Verify email matches**
The email in ADMIN_EMAILS must EXACTLY match the email you use to sign in to Supabase Auth.
- Check for typos
- Check for extra spaces
- Ensure lowercase matching

**Check 3: Clear browser cache and cookies**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all cookies for your domain
4. Sign out and sign in again
```

**Check 4: Check application logs**
```bash
# PM2
pm2 logs qoqnuz-web --lines 100

# Docker
docker-compose logs web --tail 100

# Look for auth-related errors
```

### Still Not Working?

If you're still getting errors after deployment:

1. **Verify the code was actually deployed**
   ```bash
   # Check git commit on server
   git log -1 --oneline
   # Should show: "Fix cookie authentication in requireAdmin middleware"
   ```

2. **Check if the build completed successfully**
   ```bash
   # Look for build errors in logs
   pm2 logs qoqnuz-web | grep -i error
   ```

3. **Verify Supabase connection**
   - Ensure NEXT_PUBLIC_SUPABASE_URL is correct
   - Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
   - Ensure SUPABASE_SERVICE_ROLE_KEY is valid

4. **Test with a fresh browser session**
   - Open an incognito/private window
   - Navigate to https://app.qoqnuz.com/admin
   - Sign in with the admin email

## Summary of Changes

### Files Modified:
1. `src/lib/auth/admin-middleware.ts` - Fixed cookie handling
2. `src/lib/auth-utils.ts` - New centralized auth utility
3. `src/app/api/automation/trigger/route.ts` - Uses new auth
4. `src/app/api/automation/trending/route.ts` - Uses new auth

### What Was Fixed:
- Cookie authentication now uses proper Supabase SSR methods
- ADMIN_EMAILS environment variable is now respected across all routes
- All admin API routes now work with the existing session
- No more "Unauthorized" errors for authenticated admins

### What Changed for Users:
- Once signed in to admin portal, all admin functions work automatically
- No need to add users to database if their email is in ADMIN_EMAILS
- Better error messages when authorization fails

## Environment Variable Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `ADMIN_EMAILS` | **YES (NEW)** | Super admin emails | `admin@example.com,user@example.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Supabase anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Supabase service key | `eyJhbG...` |

## Support

If you continue to experience issues after following these instructions:
1. Check the browser console for specific error messages
2. Check server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure the latest code is deployed and built
