# 🚀 Qoqnuz Music - Quick Start Guide

Get up and running in **10 minutes**!

---

## 📋 Prerequisites Checklist

- [ ] Ubuntu/Debian Linux (VPS or local)
- [ ] Terminal access
- [ ] Internet connection
- [ ] Text editor (nano, vim, or VS Code)

---

## ⚡ 3-Step Setup

### STEP 1: Run Setup Script (5 mins)

```bash
# Navigate to project
cd /home/user/qoqnuzmedia

# Run automated setup
bash setup-milestone-a.sh
```

**What it does:**
- Installs Node.js, pnpm, Supabase CLI, AWS CLI
- Sets up web application
- Installs all dependencies

---

### STEP 2: Create External Services (3 mins)

#### A) Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** Qoqnuz Music
   - **Password:** (save this!)
   - **Region:** (closest to you)
4. Wait 2 minutes for creation
5. Copy these from Settings → API:
   - Project URL
   - `anon` public key
   - `service_role` key

#### B) Cloudflare R2 Bucket

1. Go to https://dash.cloudflare.com
2. Click "R2" → "Create bucket"
3. **Name:** `qoqnuz-media`
4. Click "Manage R2 API Tokens" → "Create API Token"
5. Copy:
   - Access Key ID
   - Secret Access Key
   - Account ID (top of page)

---

### STEP 3: Configure & Run (2 mins)

```bash
cd web

# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Paste your credentials:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

R2_ACCOUNT_ID=abc123...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=qoqnuz-media
R2_ENDPOINT=https://abc123.r2.cloudflarestorage.com
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

## 🗄️ Database Setup (2 mins)

### Apply Database Schema

1. Open `supabase/migrations/20250114000000_initial_schema.sql`
2. Copy entire contents
3. Go to your Supabase project → **SQL Editor**
4. Paste and click **Run**
5. Verify: Should see "Success" message

### Add Sample Data (Optional)

1. Open `supabase/seed.sql`
2. Copy contents
3. Paste in SQL Editor
4. Click **Run**

---

## 🎵 Upload Sample Music (3 mins)

```bash
# Configure AWS CLI for R2
aws configure
# Enter your R2 Access Key ID
# Enter your R2 Secret Access Key
# Region: auto
# Format: json

# Set R2 endpoint
export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"

# Upload a sample MP3 (replace with your file)
aws s3 cp ~/your-song.mp3 \
  s3://qoqnuz-media/tracks/luna-eclipse/aurora.mp3 \
  --endpoint-url $R2_ENDPOINT

# Verify upload
aws s3 ls s3://qoqnuz-media/ --recursive --endpoint-url $R2_ENDPOINT
```

---

## 🎉 Start Development Server

```bash
cd web
pnpm dev
```

**Expected output:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## ✅ Test It Works

### 1. Open Homepage

Visit: http://localhost:3000

Should see: "Qoqnuz Music" landing page

### 2. Test Streaming

Visit: http://localhost:3000/test

1. Enter track ID: `t3333333-3333-3333-3333-333333333331`
2. Click "Test Stream"
3. **Should play audio!** 🎵

---

## 🐛 Troubleshooting

### "Missing environment variable"
→ Check `web/.env.local` is filled out correctly

### "Track not found"
→ Run seed.sql in Supabase SQL Editor

### "Access Denied" from R2
→ Verify R2 credentials in `.env.local`

### Audio won't play
→ Ensure you uploaded an MP3 file to R2
→ Check browser console for errors

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -p 3001
```

---

## 📚 Full Documentation

- **Complete Setup:** `setup-milestone-a.sh`
- **Verification:** `VERIFICATION_CHECKLIST.md`
- **R2 Guide:** `docs/CLOUDFLARE_R2_SETUP.md`
- **Summary:** `MILESTONE_A_SUMMARY.md`
- **README:** `README.md`

---

## 🎯 Quick Reference

| Service | URL |
|---------|-----|
| Supabase Dashboard | https://app.supabase.com |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Local Dev Server | http://localhost:3000 |
| Test Page | http://localhost:3000/test |

**Sample Track IDs:**
```
t3333333-3333-3333-3333-333333333331  # Maya Rivers - Golden
t1111111-1111-1111-1111-111111111111  # Luna Eclipse - Aurora
t2222222-2222-2222-2222-222222222222  # The Crimson Waves - Ocean Heart
```

---

## ⏱️ Time Breakdown

| Step | Time |
|------|------|
| Run setup script | 5 min |
| Create Supabase project | 2 min |
| Create R2 bucket | 1 min |
| Configure .env.local | 2 min |
| Apply database schema | 1 min |
| Upload sample music | 3 min |
| Start dev server | 1 min |
| **Total** | **~15 min** |

---

## ✅ Success Checklist

- [ ] Setup script completed successfully
- [ ] Supabase project created
- [ ] R2 bucket created
- [ ] `.env.local` configured
- [ ] Database schema applied
- [ ] Sample music uploaded
- [ ] Dev server running
- [ ] Test page works
- [ ] **Audio plays successfully** 🎵

---

## 🚀 Next Steps After Milestone A

Once everything works:

1. **Confirm completion** to developer
2. **Proceed to Milestone B:** Backend APIs & Authentication
3. **Start building** user registration, login, and full API

---

## 💡 Pro Tips

**Use pnpm instead of npm** - It's faster!

**Keep .env.local secret** - Never commit to git

**Check browser console** - Most errors show there

**Use the test page** - It's your best friend

**Read the docs** - Everything is documented

---

## 🎉 You're Done!

If you can:
- ✅ See the homepage
- ✅ Visit test page
- ✅ Play audio

**Congratulations!** Milestone A is complete! 🎵

---

**Need help?** Check `VERIFICATION_CHECKLIST.md` for detailed troubleshooting.

**Ready to continue?** Report Milestone A completion and we'll start Milestone B!
