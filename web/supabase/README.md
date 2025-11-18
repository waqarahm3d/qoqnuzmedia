# Supabase Migrations and Setup

This folder contains all database migrations and setup scripts for the Qoqnuz music platform.

## Quick Start

### 1. Enable pg_cron Extension

**Supabase Dashboard:**
1. Go to **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **Enable**

**Or via SQL:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Run Automation Migration

**Supabase Dashboard:**
1. Go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `migrations/20250118000000_automation_system.sql`
4. Paste and click **Run**

**Or via Supabase CLI:**
```bash
supabase db push
```

### 3. Verify Setup

Run `quick_check.sql` in SQL Editor to verify everything is set up correctly.

## Files

| File | Description |
|------|-------------|
| `migrations/20250118000000_automation_system.sql` | Main automation system migration |
| `SETUP_AUTOMATION.md` | Detailed step-by-step setup guide |
| `quick_check.sql` | Quick verification script for Supabase UI |
| `verify_automation.sql` | Comprehensive verification (for psql) |
| `README.md` | This file |

## Migrations

### 20250118000000_automation_system.sql

Creates the complete automation infrastructure:

**Tables:**
- `user_listening_stats` - Aggregated user analytics
- `smart_playlists` - Pre-generated personalized playlists
- `trending_tracks` - Calculated trending songs
- `background_tasks` - Queue for async processing

**Functions:**
- `generate_daily_mix()` - Creates daily personalized mix
- `generate_discovery_weekly()` - Creates weekly discovery playlist
- `generate_new_for_you()` - Latest from favorite artists
- `generate_forgotten_favorites()` - Rediscover old favorites
- `calculate_trending_tracks()` - Calculates trending with scoring
- `aggregate_user_listening_history()` - Aggregates user stats
- `trigger_all_automations()` - Manual trigger for all automations

**Cron Jobs:**
- `0 2 * * *` - Aggregate listening history (daily 2 AM)
- `0 3 * * *` - Generate smart playlists (daily 3 AM)
- `0 */6 * * *` - Calculate trending (every 6 hours)
- `0 4 * * 0` - Cleanup tasks (Sunday 4 AM)
- `0 5 * * *` - Cleanup expired playlists (daily 5 AM)

## Verification

### Quick Check (Supabase UI)

```bash
# In SQL Editor, run:
supabase/quick_check.sql
```

Expected output:
- ✅ pg_cron ENABLED
- ✅ All tables exist
- ✅ All cron jobs active
- ✅ Functions exist
- ✅ AUTOMATION SYSTEM IS READY!

### Detailed Check

See `SETUP_AUTOMATION.md` for comprehensive verification steps.

## Testing

### Test Smart Playlist Generation

```sql
-- Get your user ID
SELECT id FROM auth.users LIMIT 1;

-- Generate Daily Mix (replace USER_ID)
SELECT generate_daily_mix('USER_ID');

-- Check result
SELECT * FROM smart_playlists WHERE user_id = 'USER_ID';
```

### Test Trending Calculation

```sql
-- Calculate trending
SELECT calculate_trending_tracks();

-- View results
SELECT
    t.title,
    tt.trend_score,
    tt.play_count_24h
FROM trending_tracks tt
JOIN tracks t ON t.id = tt.track_id
ORDER BY tt.trend_score DESC
LIMIT 10;
```

### Manual Trigger All

```sql
-- Trigger everything at once
SELECT trigger_all_automations();
```

## Troubleshooting

### pg_cron not found

**Symptom:** `ERROR: extension "pg_cron" does not exist`

**Solution:**
1. Enable via Dashboard → Database → Extensions
2. Or run: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

### Cron jobs not executing

**Check status:**
```sql
SELECT * FROM cron.job WHERE active = false;
```

**Activate:**
```sql
UPDATE cron.job SET active = true WHERE jobname = 'job-name';
```

### Empty playlists generated

**Cause:** Insufficient play history data

**Solution:**
```sql
-- Check play history
SELECT COUNT(*) FROM play_history;

-- Need at least some plays for personalization
-- Play some tracks or add test data
```

### Functions missing

**Re-run migration:**
1. Drop existing: `DROP FUNCTION IF EXISTS function_name CASCADE;`
2. Re-run migration file

## Monitoring

### Check Cron Execution

```sql
-- Recent executions
SELECT
    j.jobname,
    jrd.status,
    jrd.start_time,
    jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 20;
```

### Check Automation Data

```sql
-- Smart playlists generated
SELECT
    playlist_type,
    COUNT(*) as user_count,
    MAX(generated_at) as last_generated
FROM smart_playlists
GROUP BY playlist_type;

-- Trending freshness
SELECT
    COUNT(*) as track_count,
    MAX(calculated_at) as last_calculated
FROM trending_tracks;

-- Listening stats coverage
SELECT COUNT(*) FROM user_listening_stats;
```

## Maintenance

### Clean Up Old Data

```sql
-- Remove old completed tasks (done automatically weekly)
DELETE FROM background_tasks
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '30 days';

-- Remove expired playlists (done automatically daily)
DELETE FROM smart_playlists
WHERE expires_at < NOW();
```

### Reschedule Cron Jobs

```sql
-- Example: Change trending to every 3 hours
SELECT cron.unschedule('calculate-trending');
SELECT cron.schedule(
    'calculate-trending',
    '0 */3 * * *',
    $$SELECT calculate_trending_tracks();$$
);
```

## Performance Tips

### For Large Databases (>100k users)

1. **Partition tables:**
```sql
-- Partition smart_playlists by user_id range
-- See PostgreSQL partitioning docs
```

2. **Add more indexes:**
```sql
-- If queries are slow, analyze and add indexes
CREATE INDEX idx_custom ON table_name(column);
```

3. **Adjust cron timing:**
```sql
-- Spread load across different times
-- Instead of all at 3 AM, stagger:
-- - Some users at 3 AM
-- - Some at 4 AM, etc.
```

## Support

For detailed documentation:
- **Setup Guide:** `SETUP_AUTOMATION.md`
- **Main Docs:** `../AUTOMATION_GUIDE.md`
- **Supabase Docs:** https://supabase.com/docs

For issues:
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Review cron execution: `SELECT * FROM cron.job_run_details`
- Check migration status: `SELECT * FROM supabase_migrations.schema_migrations`

## Next Steps

After successful setup:

1. ✅ Verify with `quick_check.sql`
2. ✅ Test manual trigger
3. ✅ Wait for first scheduled run (or trigger manually)
4. ✅ Check API endpoints work
5. ✅ Monitor first 24 hours
6. ✅ Set up alerts for failures

---

**Your automation system is now ready to run!** 🎉

The cron jobs will execute automatically on schedule. Check back tomorrow to see generated playlists and trending data.
