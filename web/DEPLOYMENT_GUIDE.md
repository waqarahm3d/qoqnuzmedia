# Smart Playlists & Discovery - Deployment Guide

**Quick Reference for Deploying to Production**

---

## ⚡ Quick Start (5 Steps)

### Step 1: Run Database Migrations (5 minutes)

In your Supabase SQL Editor, run these files **in order**:

```bash
# 1. Smart playlists schema
supabase-migrations/002_smart_playlists_discovery.sql

# 2. Helper functions
supabase-migrations/003_helper_functions.sql
```

**What this does:**
- Creates 8 new tables
- Adds columns to `tracks` table
- Inserts 16 mood/activity presets
- Creates 6 SQL helper functions

---

### Step 2: Test the API Endpoints (5 minutes)

Open your browser and test (replace with your domain):

```
# Smart Playlists
https://yoursite.com/api/playlists/smart?type=daily_mix

# Mood Discovery
https://yoursite.com/api/discovery/mood?mood=happy

# Activity Discovery
https://yoursite.com/api/discovery/activity?activity=workout

# BPM Discovery
https://yoursite.com/api/discovery/bpm?target=160&range=10
```

**Expected:** You'll get empty arrays because tracks don't have metadata yet. That's OK!

---

### Step 3: Add Sample Track Metadata (10 minutes)

Run this SQL to add metadata to a few tracks:

```sql
-- Update some tracks with metadata
UPDATE tracks SET
  tempo_bpm = 128,
  energy_level = 8,
  valence = 7,
  mood_tags = ARRAY['happy', 'energetic'],
  activity_tags = ARRAY['workout', 'party']
WHERE genres @> ARRAY['electronic']
LIMIT 10;

UPDATE tracks SET
  tempo_bpm = 90,
  energy_level = 4,
  valence = 3,
  mood_tags = ARRAY['chill', 'peaceful'],
  activity_tags = ARRAY['study', 'sleep']
WHERE genres @> ARRAY['ambient', 'chillout']
LIMIT 10;

UPDATE tracks SET
  tempo_bpm = 165,
  energy_level = 9,
  valence = 8,
  mood_tags = ARRAY['energetic', 'happy'],
  activity_tags = ARRAY['running', 'workout']
WHERE genres @> ARRAY['rock', 'punk']
LIMIT 10;
```

**Optional:** You can manually update more tracks via admin UI later.

---

### Step 4: Deploy Frontend (2 minutes)

If using Vercel:
```bash
git add .
git commit -m "Add smart playlists and discovery features"
git push
```

If using another platform, just deploy as usual.

**The new pages will automatically be available:**
- `/playlists/smart`
- `/discover` (enhanced)
- `/discover/mood/[mood]`
- `/discover/activity/[activity]`
- `/discover/bpm/[bpm]`

---

### Step 5: Test in Browser (10 minutes)

1. **Navigate to Discover** (`/discover`)
   - Should see mood cards, activity cards, BPM calculator

2. **Click a mood card** (e.g., "Happy")
   - Should show tracks with happy mood tag

3. **Go to Smart Playlists** (`/playlists/smart`)
   - Click "Generate" on Daily Mix
   - Should see personalized tracks (if you have listening history)

4. **Test Collaborators**
   - Open any playlist you own
   - Click the user icon
   - Invite someone by email
   - They should receive the invite

---

## 🎯 You're Done!

The feature is now live. Users can:
- ✅ Generate smart playlists
- ✅ Browse by mood
- ✅ Browse by activity
- ✅ Find tracks by BPM
- ✅ Collaborate on playlists

---

## 🔧 Optional: Set Up Cron Job

For better performance, run similarity computation daily:

### Option A: Supabase Edge Function

1. Create edge function:
```typescript
// supabase/functions/compute-similarities/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.rpc('compute_track_similarities_batch', {
    batch_size: 500
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    success: true,
    processed: data
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

2. Deploy:
```bash
supabase functions deploy compute-similarities
```

3. Schedule in Supabase Dashboard:
   - Go to Database > Cron Jobs
   - Create new job: `0 2 * * *` (daily at 2 AM)
   - Command: `SELECT net.http_post('https://YOUR_PROJECT.supabase.co/functions/v1/compute-similarities')`

### Option B: Simple SQL Cron (if supported by your hosting)

```sql
-- Run daily at 2 AM
SELECT compute_track_similarities_batch(500);
```

---

## 📊 Monitoring

### Check if Playlists are Being Generated

```sql
-- Count smart playlist generations
SELECT COUNT(*) FROM smart_playlists;

-- See most popular types
SELECT type, COUNT(*)
FROM smart_playlists
GROUP BY type
ORDER BY count DESC;
```

### Check Collaborator Activity

```sql
-- Count playlist collaborators
SELECT COUNT(*) FROM playlist_collaborators;

-- See invite status breakdown
SELECT status, COUNT(*)
FROM playlist_collaborators
GROUP BY status;
```

### Check Track Metadata Coverage

```sql
-- How many tracks have BPM?
SELECT COUNT(*) FROM tracks WHERE tempo_bpm IS NOT NULL;

-- How many tracks have mood tags?
SELECT COUNT(*) FROM tracks WHERE mood_tags IS NOT NULL AND array_length(mood_tags, 1) > 0;

-- How many tracks have activity tags?
SELECT COUNT(*) FROM tracks WHERE activity_tags IS NOT NULL AND array_length(activity_tags, 1) > 0;
```

---

## 🐛 Troubleshooting

### "No tracks found" in discovery

**Cause:** Tracks don't have metadata yet

**Fix:** Run the SQL from Step 3 to add metadata to more tracks

---

### "Empty playlist" when generating smart playlists

**Cause:** User has no listening history

**Fix:** This is expected for new users. Tell them to listen to music first, or show a fallback message.

---

### "Failed to invite collaborator"

**Cause:** User might not exist or email is invalid

**Fix:** Check that the email exists in your `auth.users` table

---

### Similarity scores not working

**Cause:** Similarities haven't been computed yet

**Fix:** Manually run:
```sql
SELECT compute_track_similarities_batch(100);
```

---

## 📈 Metrics to Track

1. **Smart Playlist Usage**
   - How many playlists generated per day
   - Which types are most popular
   - Average tracks per playlist

2. **Discovery Usage**
   - Mood page views
   - Activity page views
   - BPM searches

3. **Collaboration**
   - Invites sent
   - Acceptance rate
   - Average collaborators per playlist

---

## 🎊 That's It!

Your smart playlists and discovery features are now live. Users will love the personalized experience!

**Need help?** Check the full implementation guide in `SMART_PLAYLISTS_IMPLEMENTATION.md`
