# Automation Setup Troubleshooting

## Error: "column playlist_type does not exist"

### Cause
This error occurs when there's an existing `smart_playlists` table with a different schema from a previous installation attempt.

### Solution Options

Choose **ONE** of these solutions:

---

### ✅ **Option 1: Clean Install (Recommended)**

This removes all automation components and lets you start fresh.

**Steps:**

1. **Run the clean install script:**
   - Open Supabase SQL Editor
   - Copy contents of `supabase/clean_install.sql`
   - Paste and click **Run**
   - Wait for "✅ Clean install complete!"

2. **Run the main migration:**
   - Copy contents of `supabase/migrations/20250118000000_automation_system.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Verify:**
   - Run `supabase/quick_check.sql`
   - Should show all green checkmarks

**⚠️ Warning:** This deletes existing automation data (but NOT your tracks, users, or play history).

---

### ✅ **Option 2: Fix Existing Table**

If you want to keep existing data, run the fix script.

**Steps:**

1. **Run the fix script:**
   - Open Supabase SQL Editor
   - Copy contents of `supabase/fix_smart_playlists.sql`
   - Paste and click **Run**

2. **Then run main migration:**
   - Copy contents of `supabase/migrations/20250118000000_automation_system.sql`
   - Paste and run

**Note:** This will recreate the smart_playlists table, losing any data in it.

---

### ✅ **Option 3: Manual Check & Fix**

If you want to investigate first:

**Check what exists:**
```sql
-- Check if table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'smart_playlists'
ORDER BY ordinal_position;
```

**If table exists with wrong schema, drop it:**
```sql
DROP TABLE IF EXISTS smart_playlists CASCADE;
```

**Then run the main migration.**

---

## Other Common Errors

### Error: "extension pg_cron does not exist"

**Cause:** pg_cron extension not enabled.

**Solution:**
1. Go to Supabase Dashboard
2. Database → Extensions
3. Search `pg_cron`
4. Click Enable

Or via SQL:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

### Error: "permission denied for schema cron"

**Cause:** Insufficient permissions.

**Solution:**
```sql
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
```

Then re-run the migration.

---

### Error: "relation already exists"

**Cause:** Partial migration already ran.

**Solution:**
1. Run `clean_install.sql` to remove everything
2. Then run the full migration again

---

### Error: Migration runs but no cron jobs scheduled

**Check if they exist:**
```sql
SELECT * FROM cron.job;
```

**If empty, manually schedule:**
```sql
-- Listening history aggregation
SELECT cron.schedule(
    'aggregate-listening-history',
    '0 2 * * *',
    $$SELECT aggregate_all_user_listening_history();$$
);

-- Smart playlists
SELECT cron.schedule(
    'generate-smart-playlists',
    '0 3 * * *',
    $$SELECT generate_all_smart_playlists();$$
);

-- Trending tracks
SELECT cron.schedule(
    'calculate-trending',
    '0 */6 * * *',
    $$SELECT calculate_trending_tracks();$$
);

-- Cleanup tasks
SELECT cron.schedule(
    'cleanup-background-tasks',
    '0 4 * * 0',
    $$DELETE FROM background_tasks WHERE status IN ('completed', 'failed') AND completed_at < NOW() - INTERVAL '30 days';$$
);

-- Cleanup playlists
SELECT cron.schedule(
    'cleanup-expired-playlists',
    '0 5 * * *',
    $$DELETE FROM smart_playlists WHERE expires_at < NOW();$$
);
```

---

### Error: Functions return empty results

**Cause:** No play history data.

**Check:**
```sql
SELECT COUNT(*) FROM play_history;
```

**If zero:**
- Play some tracks in your app first
- Or add test data:

```sql
-- Get a user and track
SELECT id FROM auth.users LIMIT 1; -- Copy user_id
SELECT id FROM tracks LIMIT 1;     -- Copy track_id

-- Add test plays
INSERT INTO play_history (user_id, track_id, played_at, duration_ms)
VALUES
('USER_ID_HERE', 'TRACK_ID_HERE', NOW() - INTERVAL '1 day', 180000),
('USER_ID_HERE', 'TRACK_ID_HERE', NOW() - INTERVAL '2 days', 180000),
('USER_ID_HERE', 'TRACK_ID_HERE', NOW() - INTERVAL '3 days', 180000);
```

---

### Error: Cron jobs show as inactive

**Activate them:**
```sql
UPDATE cron.job SET active = true WHERE active = false;
```

**Verify:**
```sql
SELECT jobname, active FROM cron.job;
```

---

### Error: Tasks stuck in "processing" status

**Reset stuck tasks:**
```sql
UPDATE background_tasks
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '30 minutes';
```

---

## Step-by-Step Migration Guide

If you're still having issues, follow this exact sequence:

### Step 1: Clean State
```sql
-- Run clean_install.sql in SQL Editor
```

### Step 2: Enable Extension
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 3: Verify Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Should return 1 row
```

### Step 4: Run Main Migration
```sql
-- Paste entire contents of:
-- supabase/migrations/20250118000000_automation_system.sql
```

### Step 5: Verify Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_listening_stats',
    'smart_playlists',
    'trending_tracks',
    'background_tasks'
  );
-- Should return 4 rows
```

### Step 6: Verify Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%playlist%'
   OR routine_name LIKE '%trending%';
-- Should return multiple functions
```

### Step 7: Verify Cron Jobs
```sql
SELECT jobname, schedule, active
FROM cron.job;
-- Should return 5 jobs, all active = true
```

### Step 8: Test
```sql
-- Get your user ID
SELECT id FROM auth.users LIMIT 1;

-- Test playlist generation (replace USER_ID)
SELECT generate_daily_mix('USER_ID_HERE');

-- Check result
SELECT * FROM smart_playlists WHERE user_id = 'USER_ID_HERE';
```

---

## Still Having Issues?

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** in sidebar
3. Select **Postgres Logs**
4. Look for errors around the time you ran the migration

### Check Migration Status

```sql
-- See what migrations have run
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### Get Detailed Error Info

```sql
-- Check recent cron failures
SELECT
    j.jobname,
    jrd.start_time,
    jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed'
ORDER BY jrd.start_time DESC
LIMIT 5;
```

---

## Prevention Tips

### Before Running Migrations:

1. ✅ Backup your database (Supabase Dashboard → Settings → Database → Backup)
2. ✅ Check for existing tables: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
3. ✅ Verify pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron'`
4. ✅ Use clean_install.sql if re-running

### After Migration Success:

1. ✅ Run quick_check.sql immediately
2. ✅ Test manual trigger: `SELECT trigger_all_automations();`
3. ✅ Check cron execution: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5`
4. ✅ Monitor for 24 hours

---

## Getting Help

If none of these solutions work:

1. **Check the error message carefully** - it often tells you exactly what's wrong
2. **Run quick_check.sql** - shows current state of system
3. **Copy the exact error** - include full SQL error message
4. **Check what exists** - run the diagnostic queries above

Common issue patterns:
- "does not exist" → Something wasn't created
- "already exists" → Something is conflicting
- "permission denied" → Need to grant permissions
- "invalid reference" → Foreign key constraint issue

---

## Success Checklist

Your automation system is ready when:

- [ ] pg_cron extension enabled
- [ ] 4 automation tables created
- [ ] All functions exist (11 total)
- [ ] 5 cron jobs scheduled and active
- [ ] Test playlist generation works
- [ ] quick_check.sql shows all green
- [ ] No errors in Supabase logs
- [ ] Can access /admin/automation dashboard

---

## Quick Recovery Commands

**Reset everything:**
```sql
\i supabase/clean_install.sql
```

**Rebuild from scratch:**
```sql
-- 1. Clean
\i supabase/clean_install.sql

-- 2. Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Run migration
\i supabase/migrations/20250118000000_automation_system.sql

-- 4. Verify
\i supabase/quick_check.sql
```

**Emergency fix for specific table:**
```sql
DROP TABLE IF EXISTS smart_playlists CASCADE;
-- Then re-run just that CREATE TABLE statement from the migration
```
