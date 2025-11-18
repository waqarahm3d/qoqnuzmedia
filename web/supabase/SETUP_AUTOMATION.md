# Supabase Automation Setup - Step by Step Guide

## Prerequisites
- Supabase project created
- Admin access to Supabase Dashboard
- Database connection established

## Step 1: Enable pg_cron Extension

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - URL: `https://app.supabase.com/project/YOUR_PROJECT_ID`

2. **Navigate to Extensions**
   - Click **Database** in the left sidebar
   - Click **Extensions**

3. **Enable pg_cron**
   - Search for `pg_cron` in the search box
   - Click the toggle to **Enable** it
   - Wait for confirmation (usually instant)

### Option B: Via SQL Editor

1. **Go to SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

2. **Run this command:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

3. **Verify it's enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

   You should see a row with `pg_cron`.

---

## Step 2: Run the Automation Migration

### Using Supabase Dashboard (Easiest)

1. **Open SQL Editor**
   - Dashboard → SQL Editor → New Query

2. **Copy the migration file**
   - Open: `supabase/migrations/20250118000000_automation_system.sql`
   - Copy the ENTIRE contents (it's a large file)

3. **Paste into SQL Editor**
   - Paste the SQL into the editor

4. **Execute the migration**
   - Click **Run** or press `Cmd/Ctrl + Enter`
   - Wait for execution (may take 10-30 seconds)

5. **Check for errors**
   - If successful, you'll see "Success. No rows returned"
   - If errors occur, check the error message and fix

### Using Supabase CLI (Advanced)

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase db push --include-schemas public
```

---

## Step 3: Verify the Setup

### Check Tables Were Created

Run this query in SQL Editor:

```sql
-- Check all automation tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_listening_stats',
    'smart_playlists',
    'trending_tracks',
    'background_tasks'
  )
ORDER BY table_name;
```

**Expected output:** You should see all 4 tables listed.

---

### Check Functions Were Created

```sql
-- Check automation functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%playlist%'
   OR routine_name LIKE '%trending%'
   OR routine_name LIKE '%aggregate%'
ORDER BY routine_name;
```

**Expected output:** Multiple functions including:
- `generate_daily_mix`
- `generate_discovery_weekly`
- `generate_new_for_you`
- `generate_forgotten_favorites`
- `generate_all_smart_playlists`
- `calculate_trending_tracks`
- `aggregate_all_user_listening_history`

---

### Check Cron Jobs Are Scheduled

```sql
-- List all scheduled cron jobs
SELECT
    jobid,
    jobname,
    schedule,
    active,
    database
FROM cron.job
ORDER BY jobid;
```

**Expected output:** You should see 5 cron jobs:
1. `aggregate-listening-history` - `0 2 * * *`
2. `generate-smart-playlists` - `0 3 * * *`
3. `calculate-trending` - `0 */6 * * *`
4. `cleanup-background-tasks` - `0 4 * * 0`
5. `cleanup-expired-playlists` - `0 5 * * *`

---

## Step 4: Test the Automation

### Test Smart Playlist Generation

```sql
-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 1;

-- Generate a Daily Mix for your user (replace USER_ID)
SELECT generate_daily_mix('YOUR_USER_ID_HERE');

-- Check if playlist was created
SELECT * FROM smart_playlists WHERE user_id = 'YOUR_USER_ID_HERE';
```

**Expected output:**
- First query returns your user info
- Second query returns JSON array of track IDs
- Third query shows the created playlist

---

### Test Trending Calculation

```sql
-- Calculate trending tracks
SELECT calculate_trending_tracks();

-- View trending tracks
SELECT
    t.title,
    t.artists->>'name' as artist,
    tt.trend_score,
    tt.play_count_24h,
    tt.play_count_7d
FROM trending_tracks tt
JOIN tracks t ON t.id = tt.track_id
ORDER BY tt.trend_score DESC
LIMIT 10;
```

**Expected output:** List of top 10 trending tracks with scores

---

### Test Listening History Aggregation

```sql
-- Aggregate stats for all users
SELECT aggregate_all_user_listening_history();

-- View aggregated stats
SELECT
    u.email,
    uls.total_plays,
    uls.total_listening_time_ms / 60000 as minutes_listened,
    uls.last_aggregated_at
FROM user_listening_stats uls
JOIN auth.users u ON u.id = uls.user_id
ORDER BY uls.total_plays DESC
LIMIT 10;
```

---

## Step 5: Check Cron Execution History

```sql
-- View recent cron job executions
SELECT
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    start_time,
    end_time,
    end_time - start_time as duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

**What to look for:**
- Jobs should show `succeeded` status
- Recent executions (if past scheduled time)
- No errors in the command output

---

## Step 6: Manual Trigger Test

Test triggering all automations manually:

```sql
-- Trigger everything
SELECT trigger_all_automations();
```

This will:
- Aggregate listening history for all users
- Generate smart playlists for all users
- Calculate trending tracks

**Note:** This may take a while if you have many users!

---

## Troubleshooting

### Issue: pg_cron extension not found

**Solution:**
```sql
-- Check if extension is available
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- If not available, contact Supabase support
-- pg_cron should be available on all Supabase projects
```

---

### Issue: Permission denied on cron.schedule

**Solution:**
The migration should handle permissions automatically. If not:

```sql
-- Grant permissions (run as postgres user)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
```

---

### Issue: Cron jobs not executing

**Check cron job status:**
```sql
-- See if jobs are active
SELECT jobname, active FROM cron.job;

-- If a job is inactive, activate it
UPDATE cron.job SET active = true WHERE jobname = 'your-job-name';
```

**Check execution logs:**
```sql
-- Look for errors
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

---

### Issue: Functions return empty results

**Likely causes:**
1. No play history data yet
2. User has insufficient listening data

**Solution - Add test data:**
```sql
-- Check if you have play history
SELECT COUNT(*) FROM play_history;

-- If zero, you need to play some tracks first!
-- Or insert test data (see below)
```

---

## Adding Test Data (Optional)

If you want to test with sample data:

```sql
-- Add test play history (replace USER_ID and TRACK_IDs with real ones)
INSERT INTO play_history (user_id, track_id, played_at, duration_ms)
SELECT
    'YOUR_USER_ID'::uuid,
    id,
    NOW() - (random() * INTERVAL '30 days'),
    duration_ms
FROM tracks
LIMIT 50;

-- Now test automation again
SELECT generate_daily_mix('YOUR_USER_ID');
```

---

## Verification Checklist

Run through this checklist:

- [ ] pg_cron extension enabled
- [ ] All 4 automation tables created
- [ ] All automation functions created
- [ ] All 5 cron jobs scheduled and active
- [ ] Test playlist generation works
- [ ] Test trending calculation works
- [ ] Test listening aggregation works
- [ ] Cron execution history shows success
- [ ] Manual trigger test completes

---

## What Happens Next

Once setup is complete:

### Automatic Execution:
- **Tonight at 2 AM:** Listening stats will be aggregated
- **Tonight at 3 AM:** Smart playlists will be generated
- **Every 6 hours:** Trending tracks will be calculated

### Check Tomorrow Morning:
```sql
-- See when last automation ran
SELECT
    'Smart Playlists' as automation,
    MAX(generated_at) as last_run
FROM smart_playlists
UNION ALL
SELECT
    'Trending Tracks',
    MAX(calculated_at)
FROM trending_tracks
UNION ALL
SELECT
    'Listening Stats',
    MAX(last_aggregated_at)
FROM user_listening_stats;
```

---

## Next Steps

After successful setup:

1. **Set Environment Variable**
   ```bash
   # Add to .env.local
   WORKER_SECRET=$(openssl rand -base64 32)
   ```

2. **Test API Endpoints**
   ```bash
   # Get smart playlists
   GET /api/automation/smart-playlists

   # Get trending
   GET /api/automation/trending
   ```

3. **Monitor via Admin Dashboard**
   ```bash
   # Check status
   GET /api/automation/trigger
   ```

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review `AUTOMATION_GUIDE.md` for detailed documentation
3. Check Supabase logs: Dashboard → Logs → Postgres Logs
4. Review cron execution: `SELECT * FROM cron.job_run_details`

---

## Summary

You now have:
✅ Automated smart playlist generation (daily/weekly)
✅ Trending tracks calculation (every 6 hours)
✅ User listening analytics (daily aggregation)
✅ Background task queue for mood detection
✅ Automatic data cleanup (weekly)

Your music platform is now fully automated! 🎉
