# Milestone A: Verification Checklist

## 🎯 Overview

This checklist ensures that all components of **Milestone A: Infrastructure & Foundation** are properly set up and working.

**Milestone A Goals:**
- ✅ Complete Supabase database schema
- ✅ Cloudflare R2 storage configured
- ✅ Next.js web app with streaming API
- ✅ Sample data loaded
- ✅ Test streaming functionality

---

## 📋 Pre-Setup Checklist

Before starting, ensure you have:

- [ ] Ubuntu/Debian Linux server or VPS
- [ ] SSH access to the server
- [ ] Domain name pointed to server (app.qoqnuz.com)
- [ ] Email address for registrations

---

## 🔧 Installation Verification

### 1. System Tools

Run each command and verify output:

```bash
# Node.js (should be v20.x)
node -v
# Expected: v20.x.x

# npm
npm -v
# Expected: 10.x.x or higher

# pnpm
pnpm -v
# Expected: 8.x.x or higher

# Supabase CLI
supabase --version
# Expected: 1.x.x or higher

# AWS CLI (for R2)
aws --version
# Expected: aws-cli/2.x.x or higher
```

**Status:**
- [ ] All tools installed successfully
- [ ] Versions match expected ranges

---

## 🗄️ Database Setup

### 2. Supabase Project

- [ ] Created Supabase project at https://app.supabase.com
- [ ] Project name: "Qoqnuz Music" (or similar)
- [ ] Saved database password securely
- [ ] Project is in "Active" status

### 3. Database Schema

- [ ] Opened Supabase SQL Editor (in your project dashboard)
- [ ] Copied contents of `supabase/migrations/20250114000000_initial_schema.sql`
- [ ] Pasted and executed in SQL Editor
- [ ] No errors in execution
- [ ] Verified tables created:

```sql
-- Run this in Supabase SQL Editor to verify
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables** (50+ tables):
- profiles
- artists
- albums
- tracks
- playlists
- user_follows
- artist_follows
- liked_tracks
- play_history
- messages
- posts
- comments
- reactions
- listening_sessions
- admin_roles
- site_settings
- (and many more...)

**Status:**
- [ ] All tables created successfully
- [ ] Row Level Security (RLS) enabled on key tables
- [ ] Triggers and functions created

### 4. Seed Data (Optional but Recommended)

- [ ] Copied contents of `supabase/seed.sql`
- [ ] Executed in Supabase SQL Editor
- [ ] Verified data inserted:

```sql
-- Check artists
SELECT id, name FROM artists;
-- Should see: Luna Eclipse, The Crimson Waves, Maya Rivers, etc.

-- Check tracks
SELECT id, title FROM tracks LIMIT 5;
-- Should see: Aurora, Golden, Ocean Heart, etc.

-- Check site settings
SELECT key, value FROM site_settings;
-- Should see: theme colors, site name, etc.
```

**Status:**
- [ ] Sample artists inserted (5 artists)
- [ ] Sample albums inserted (5 albums)
- [ ] Sample tracks inserted (15+ tracks)
- [ ] Site settings configured
- [ ] Pages created (Terms, Privacy, About)

### 5. Supabase API Keys

- [ ] Navigated to Project Settings → API
- [ ] Copied **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copied **anon public** key
- [ ] Copied **service_role** key (keep secret!)

**Status:**
- [ ] All API keys saved securely

---

## ☁️ Cloudflare R2 Setup

### 6. R2 Bucket Creation

- [ ] Logged in to Cloudflare Dashboard
- [ ] Navigated to R2
- [ ] Created bucket named: `qoqnuz-media`
- [ ] Bucket is in "Active" status

### 7. R2 API Tokens

- [ ] Created R2 API Token
- [ ] Token has "Object Read & Write" permissions
- [ ] Saved:
  - Access Key ID
  - Secret Access Key
  - Account ID

**Status:**
- [ ] R2 bucket created
- [ ] API credentials saved

### 8. CORS Configuration

- [ ] Created CORS policy file (see `docs/CLOUDFLARE_R2_SETUP.md`)
- [ ] Applied CORS to bucket using AWS CLI:

```bash
aws s3api put-bucket-cors \
  --bucket qoqnuz-media \
  --cors-configuration file://~/cors-policy.json \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

**Status:**
- [ ] CORS policy applied successfully

### 9. Sample Files Upload

- [ ] Prepared 3 sample MP3 files
- [ ] Configured AWS CLI with R2 credentials:

```bash
aws configure
# Enter R2 Access Key ID
# Enter R2 Secret Access Key
# Region: auto
# Format: json
```

- [ ] Uploaded sample files:

```bash
# Set endpoint
export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"

# Upload files (replace with your actual files)
aws s3 cp sample1.mp3 s3://qoqnuz-media/tracks/luna-eclipse/aurora.mp3 --endpoint-url $R2_ENDPOINT
aws s3 cp sample2.mp3 s3://qoqnuz-media/tracks/crimson-waves/ocean-heart.mp3 --endpoint-url $R2_ENDPOINT
aws s3 cp sample3.mp3 s3://qoqnuz-media/tracks/maya-rivers/golden.mp3 --endpoint-url $R2_ENDPOINT
```

- [ ] Verified uploads:

```bash
aws s3 ls s3://qoqnuz-media/ --recursive --endpoint-url $R2_ENDPOINT
```

**Expected output:**
```
2025-01-14 12:00:00    3456789 tracks/luna-eclipse/aurora.mp3
2025-01-14 12:00:01    4567890 tracks/crimson-waves/ocean-heart.mp3
2025-01-14 12:00:02    5678901 tracks/maya-rivers/golden.mp3
```

**Status:**
- [ ] AWS CLI configured for R2
- [ ] Sample MP3 files uploaded
- [ ] Files visible in bucket

---

## 🌐 Web Application Setup

### 10. Dependencies Installation

```bash
cd web
pnpm install
```

**Status:**
- [ ] All npm packages installed
- [ ] No errors during installation
- [ ] `node_modules` folder created

### 11. Environment Variables

- [ ] Copied `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

- [ ] Edited `.env.local` with actual credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

# Cloudflare R2
R2_ACCOUNT_ID=abc123...
R2_ACCESS_KEY_ID=xxxx...
R2_SECRET_ACCESS_KEY=xxxx...
R2_BUCKET_NAME=qoqnuz-media
R2_ENDPOINT=https://abc123.r2.cloudflarestorage.com

# App
NEXT_PUBLIC_APP_URL=https://app.qoqnuz.com
```

**Status:**
- [ ] `.env.local` created
- [ ] All required variables filled in
- [ ] No placeholder values remaining

### 12. Development Server

```bash
pnpm dev
```

**Expected output:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

**Status:**
- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000
- [ ] No error messages in console

---

## ✅ Functional Testing

### 13. Homepage Test

- [ ] Open http://localhost:3000
- [ ] Homepage loads successfully
- [ ] See "Qoqnuz Music" branding
- [ ] See "Milestone A" status section
- [ ] "Test Streaming" button is visible

### 14. Streaming Test

- [ ] Navigate to http://localhost:3000/test
- [ ] Test page loads
- [ ] Enter a track ID: `t3333333-3333-3333-3333-333333333331`
- [ ] Click "Test Stream" button
- [ ] Wait for response (should be ~2 seconds)
- [ ] Verify:
  - [ ] No error messages
  - [ ] "Stream URL Generated!" message appears
  - [ ] Track info displays: "Golden by Maya Rivers"
  - [ ] Signed URL is shown
  - [ ] Audio player appears
  - [ ] **Audio plays successfully** 🎵

### 15. API Endpoint Test

Test the API directly:

```bash
# Get stream URL via API (replace with actual track ID)
curl http://localhost:3000/api/stream/t3333333-3333-3333-3333-333333333331
```

**Expected response:**
```json
{
  "streamUrl": "https://...r2.cloudflarestorage.com/...",
  "track": {
    "id": "t3333333-3333-3333-3333-333333333331",
    "title": "Golden",
    "artist": "Maya Rivers"
  }
}
```

**Status:**
- [ ] API returns 200 status
- [ ] Response includes streamUrl
- [ ] Response includes track info
- [ ] streamUrl is accessible (can download/stream)

### 16. Database Connection Test

Verify the app can connect to Supabase:

```bash
# Check browser console at http://localhost:3000
# Should see no Supabase connection errors
```

**Status:**
- [ ] No Supabase errors in console
- [ ] API can query database
- [ ] Authentication system initializes

---

## 🎉 Milestone A Completion Criteria

**All of the following must be ✅ checked:**

### Core Infrastructure
- [ ] Supabase project created and active
- [ ] 50+ database tables created
- [ ] Seed data loaded
- [ ] Row Level Security policies active

### Storage
- [ ] Cloudflare R2 bucket created
- [ ] R2 API credentials configured
- [ ] CORS policy applied
- [ ] Sample MP3 files uploaded and accessible

### Web Application
- [ ] Next.js app runs without errors
- [ ] Environment variables configured
- [ ] All dependencies installed
- [ ] TypeScript compiles successfully

### Functionality
- [ ] Homepage loads successfully
- [ ] Test page works
- [ ] API generates signed URLs
- [ ] Audio streaming works end-to-end
- [ ] Database queries succeed

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Missing environment variable"
**Solution:** Check that `.env.local` has all required variables filled in

#### Issue: "Track not found"
**Solution:** Verify seed data was inserted. Run this SQL:
```sql
SELECT id, title FROM tracks;
```

#### Issue: "Access Denied" from R2
**Solution:**
- Check R2 credentials in `.env.local`
- Verify API token has correct permissions
- Ensure bucket name matches exactly

#### Issue: "CORS error" when streaming
**Solution:** Apply CORS policy to R2 bucket (see step 8)

#### Issue: Audio won't play
**Solution:**
- Check browser console for errors
- Verify MP3 file is actually uploaded to R2
- Try accessing the signed URL directly in browser
- Check audio file is a valid MP3

#### Issue: Supabase connection fails
**Solution:**
- Verify project URL is correct
- Check API keys are correct
- Ensure project is "Active" in Supabase dashboard

---

## 📊 Performance Checks

### Optional: Verify Performance

- [ ] Test page loads in < 2 seconds
- [ ] API response time < 1 second
- [ ] Audio starts playing within 3 seconds
- [ ] No memory leaks (check browser dev tools)

---

## 📝 Documentation Review

- [ ] Read `docs/CLOUDFLARE_R2_SETUP.md`
- [ ] Read `web/README.md`
- [ ] Understand project structure
- [ ] Familiar with API routes

---

## ✅ Final Sign-Off

**Milestone A is complete when:**

1. ✅ All installation steps completed
2. ✅ Database schema deployed
3. ✅ R2 storage configured with sample files
4. ✅ Web app runs locally
5. ✅ **Audio streaming works end-to-end**

---

## 🎯 Next Steps

Once Milestone A is complete and verified:

1. **Report completion** to continue
2. **Milestone B**: Backend APIs & Authentication
   - User registration/login
   - Complete REST API
   - Playlist management
   - Social features APIs

3. **Milestone C**: Admin Portal
   - Theme customization
   - Content management
   - Analytics dashboard
   - User management

---

## 📸 Evidence Checklist (Optional)

For documentation purposes, take screenshots of:

- [ ] Supabase dashboard showing active project
- [ ] Tables list in Supabase
- [ ] R2 bucket with uploaded files
- [ ] Development server running
- [ ] Test page with successful stream
- [ ] Audio playing in browser

---

## ✍️ Sign-Off

**Completed by:** ___________________

**Date:** ___________________

**Notes:**

_______________________________________
_______________________________________
_______________________________________

---

**🎉 Congratulations on completing Milestone A!**

You now have a fully functional music streaming infrastructure. The foundation is set for building the complete Qoqnuz Music platform!

**Ready for Milestone B?** Let me know and we'll build the complete backend API and authentication system!
