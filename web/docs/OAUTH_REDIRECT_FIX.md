# OAuth Redirect URL Fix

## The Problem

After OAuth authentication (Facebook, Google, etc.), the redirect URL becomes malformed:

```
❌ localhost:3000supabase
❌ yourdomain.comsupabase
```

Instead of the correct format:

```
✅ http://localhost:3000/auth/callback
✅ https://yourdomain.com/auth/callback
```

---

## Root Cause

This is caused by **incorrect Site URL configuration in Supabase Dashboard**. The URL is being concatenated without proper protocol or slashes.

---

## Quick Fix

### Step 1: Fix Site URL in Supabase

1. Open **Supabase Dashboard**
2. Go to **Authentication** → **URL Configuration**
3. Find **Site URL** field
4. Set it correctly:

   **For Local Development:**
   ```
   http://localhost:3000
   ```

   **For Production:**
   ```
   https://yourdomain.com
   ```

   ⚠️ **IMPORTANT**:
   - ✅ Must include protocol (`http://` or `https://`)
   - ✅ No trailing slash
   - ❌ Don't use `localhost:3000` (missing protocol)
   - ❌ Don't use `http://localhost:3000/` (trailing slash)

### Step 2: Configure Redirect URLs

In the same **URL Configuration** section, set **Redirect URLs**:

**Option A - Wildcard (Recommended):**
```
http://localhost:3000/**
https://yourdomain.com/**
```

**Option B - Specific Paths:**
```
http://localhost:3000/auth/callback
http://localhost:3000/home
https://yourdomain.com/auth/callback
https://yourdomain.com/home
```

### Step 3: Verify OAuth Provider Callbacks

For **each OAuth provider** (Facebook, Google, etc.):

1. **Authentication** → **Providers** → Select provider
2. Verify the callback URL shown:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. This MUST match what you entered in the provider's developer console

### Step 4: Clear Cache & Test

1. Clear browser cookies and cache
2. Try OAuth login again
3. Should now redirect correctly:
   ```
   http://localhost:3000/auth/callback?code=xxx&next=/home
   ↓
   http://localhost:3000/home
   ```

---

## Common Configuration Mistakes

### ❌ Wrong Configurations:

```bash
# Missing protocol
Site URL: localhost:3000

# Missing protocol
Site URL: yourdomain.com

# Has trailing slash
Site URL: http://localhost:3000/

# Wrong protocol for local
Site URL: https://localhost:3000
```

### ✅ Correct Configurations:

```bash
# Local development
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/**

# Production
Site URL: https://yourdomain.com
Redirect URLs: https://yourdomain.com/**
```

---

## Environment Variables Check

If you're using environment variables, verify your `.env.local`:

### ❌ Wrong:
```bash
NEXT_PUBLIC_SITE_URL=localhost:3000
NEXT_PUBLIC_SUPABASE_URL=supabase.co/your-project
```

### ✅ Correct:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Verification Checklist

Before testing, verify:

- [ ] **Site URL** in Supabase includes `http://` or `https://`
- [ ] **Site URL** has NO trailing slash
- [ ] **Redirect URLs** include protocol
- [ ] **Redirect URLs** end with `/**` or specific paths
- [ ] **OAuth provider callback** in Supabase matches what's in provider console
- [ ] Environment variables (if used) have correct format
- [ ] Browser cookies/cache cleared

---

## Still Having Issues?

### Check Browser Developer Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors:
   - "Invalid redirect URL"
   - "URL mismatch"
   - "CORS error"

### Check Supabase Logs

1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for authentication errors
3. Check for "Invalid redirect" or "URL mismatch" messages

### Verify Provider Console

For Facebook/Google/etc., the redirect URI MUST exactly match:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

**Common mistakes:**
- Case sensitivity (must be lowercase)
- Extra slashes
- Wrong project reference
- HTTP instead of HTTPS

### Test the Flow

1. Click OAuth button (e.g., "Continue with Facebook")
2. Should redirect to: `https://www.facebook.com/v18.0/dialog/oauth?...`
3. After approval, should redirect to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback?code=...`
4. Then redirect to: `http://localhost:3000/auth/callback?code=...&next=/home`
5. Finally redirect to: `http://localhost:3000/home`

If any step fails, note where and check the configuration for that step.

---

## Multiple Environment Setup

If you have multiple environments (dev, staging, prod):

### Supabase Dashboard:

```bash
Site URL: https://yourdomain.com
```

### Redirect URLs (all environments):

```bash
http://localhost:3000/**
https://dev.yourdomain.com/**
https://staging.yourdomain.com/**
https://yourdomain.com/**
```

### Provider Console:

Add callback URLs for all environments:

```bash
https://dev-project.supabase.co/auth/v1/callback
https://staging-project.supabase.co/auth/v1/callback
https://prod-project.supabase.co/auth/v1/callback
```

---

## Quick Debugging Commands

### Check Current URL in Browser Console:

```javascript
// Should show proper origin
console.log(window.location.origin);
// Should be: "http://localhost:3000"

// Check current URL
console.log(window.location.href);
```

### Check Supabase Client Configuration:

```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SITE_URL);
```

---

## Summary

The malformed URL `localhost:3000supabase` happens when:

1. **Site URL** in Supabase is missing protocol
2. **Site URL** has trailing slash
3. Redirect URLs don't match
4. Environment variables are incorrect

**Fix by ensuring all URLs have proper format with protocol and no trailing slashes.**

After fixing, OAuth redirects will work correctly:
```
Provider → Supabase → Your App → Success! ✅
```
