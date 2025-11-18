-- =====================================================
-- AUTOMATION SYSTEM VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify setup
-- =====================================================

-- Color output helper (works in psql, limited in Supabase UI)
\set QUIET on
\pset border 2
\pset format wrapped

\echo ''
\echo '========================================='
\echo '   AUTOMATION SYSTEM VERIFICATION'
\echo '========================================='
\echo ''

-- =====================================================
-- 1. CHECK PG_CRON EXTENSION
-- =====================================================
\echo '1. Checking pg_cron extension...'
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
        THEN '✓ pg_cron extension is ENABLED'
        ELSE '✗ ERROR: pg_cron extension NOT FOUND - Please enable it first!'
    END as status;

\echo ''

-- =====================================================
-- 2. CHECK TABLES
-- =====================================================
\echo '2. Checking automation tables...'
SELECT
    table_name,
    CASE
        WHEN table_name IS NOT NULL THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM (
    VALUES
        ('user_listening_stats'),
        ('smart_playlists'),
        ('trending_tracks'),
        ('background_tasks')
) AS expected(table_name)
LEFT JOIN information_schema.tables t
    ON t.table_name = expected.table_name
    AND t.table_schema = 'public'
ORDER BY expected.table_name;

\echo ''

-- Count rows in each table
\echo '   Table row counts:'
SELECT
    'user_listening_stats' as table_name,
    COUNT(*) as row_count
FROM user_listening_stats
UNION ALL
SELECT 'smart_playlists', COUNT(*) FROM smart_playlists
UNION ALL
SELECT 'trending_tracks', COUNT(*) FROM trending_tracks
UNION ALL
SELECT 'background_tasks', COUNT(*) FROM background_tasks
ORDER BY table_name;

\echo ''

-- =====================================================
-- 3. CHECK FUNCTIONS
-- =====================================================
\echo '3. Checking automation functions...'
SELECT
    routine_name,
    routine_type,
    '✓ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_daily_mix',
    'generate_discovery_weekly',
    'generate_new_for_you',
    'generate_forgotten_favorites',
    'generate_all_smart_playlists',
    'calculate_trending_tracks',
    'aggregate_user_listening_history',
    'aggregate_all_user_listening_history',
    'get_next_background_task',
    'complete_background_task',
    'trigger_all_automations'
  )
ORDER BY routine_name;

\echo ''

-- Check for missing functions
SELECT
    expected.function_name,
    '✗ MISSING' as status
FROM (
    VALUES
        ('generate_daily_mix'),
        ('generate_discovery_weekly'),
        ('generate_new_for_you'),
        ('generate_forgotten_favorites'),
        ('generate_all_smart_playlists'),
        ('calculate_trending_tracks'),
        ('aggregate_user_listening_history'),
        ('aggregate_all_user_listening_history'),
        ('get_next_background_task'),
        ('complete_background_task'),
        ('trigger_all_automations')
) AS expected(function_name)
WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = expected.function_name
);

\echo ''

-- =====================================================
-- 4. CHECK CRON JOBS
-- =====================================================
\echo '4. Checking cron job schedules...'
SELECT
    jobid,
    jobname,
    schedule,
    CASE
        WHEN active THEN '✓ ACTIVE'
        ELSE '✗ INACTIVE'
    END as status,
    database,
    nodename
FROM cron.job
ORDER BY jobid;

\echo ''

-- Expected cron jobs
\echo '   Expected cron jobs:'
SELECT
    expected.jobname,
    CASE
        WHEN j.jobname IS NOT NULL THEN '✓ SCHEDULED'
        ELSE '✗ NOT SCHEDULED'
    END as status,
    expected.expected_schedule
FROM (
    VALUES
        ('aggregate-listening-history', '0 2 * * *'),
        ('generate-smart-playlists', '0 3 * * *'),
        ('calculate-trending', '0 */6 * * *'),
        ('cleanup-background-tasks', '0 4 * * 0'),
        ('cleanup-expired-playlists', '0 5 * * *')
) AS expected(jobname, expected_schedule)
LEFT JOIN cron.job j ON j.jobname = expected.jobname
ORDER BY expected.jobname;

\echo ''

-- =====================================================
-- 5. CHECK CRON EXECUTION HISTORY
-- =====================================================
\echo '5. Recent cron job executions (last 10)...'
SELECT
    j.jobname,
    jrd.status,
    jrd.start_time,
    jrd.end_time,
    EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time)) as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;

\echo ''

-- Check for failed executions
\echo '   Failed cron executions (if any):'
SELECT
    j.jobname,
    jrd.start_time,
    jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed'
ORDER BY jrd.start_time DESC
LIMIT 5;

\echo ''

-- =====================================================
-- 6. CHECK INDEXES
-- =====================================================
\echo '6. Checking performance indexes...'
SELECT
    schemaname,
    tablename,
    indexname,
    '✓ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_user_listening_stats%' OR
    indexname LIKE 'idx_smart_playlists%' OR
    indexname LIKE 'idx_trending_%' OR
    indexname LIKE 'idx_background_tasks%'
  )
ORDER BY tablename, indexname;

\echo ''

-- =====================================================
-- 7. CHECK TRIGGERS
-- =====================================================
\echo '7. Checking triggers...'
SELECT
    trigger_name,
    event_object_table as table_name,
    action_timing as timing,
    event_manipulation as event,
    '✓ EXISTS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_queue_mood_detection'
ORDER BY event_object_table;

\echo ''

-- =====================================================
-- 8. DATA VALIDATION
-- =====================================================
\echo '8. Data validation checks...'

-- Check play history exists
SELECT
    CASE
        WHEN COUNT(*) > 0
        THEN '✓ Play history exists (' || COUNT(*) || ' records)'
        ELSE '⚠ No play history yet - automations need data to work'
    END as play_history_status
FROM play_history
WHERE played_at > NOW() - INTERVAL '30 days';

\echo ''

-- Check users exist
SELECT
    CASE
        WHEN COUNT(*) > 0
        THEN '✓ Users exist (' || COUNT(*) || ' users)'
        ELSE '✗ No users found'
    END as user_status
FROM auth.users;

\echo ''

-- Check tracks exist
SELECT
    CASE
        WHEN COUNT(*) > 0
        THEN '✓ Tracks exist (' || COUNT(*) || ' tracks)'
        ELSE '✗ No tracks found'
    END as track_status
FROM tracks;

\echo ''

-- =====================================================
-- 9. BACKGROUND TASKS STATUS
-- =====================================================
\echo '9. Background tasks queue status...'
SELECT
    status,
    task_type,
    COUNT(*) as count
FROM background_tasks
GROUP BY status, task_type
ORDER BY status, task_type;

\echo ''

-- Check for stuck tasks
SELECT
    CASE
        WHEN COUNT(*) > 0
        THEN '⚠ WARNING: ' || COUNT(*) || ' tasks stuck in processing (>30 mins)'
        ELSE '✓ No stuck tasks'
    END as stuck_tasks_status
FROM background_tasks
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '30 minutes';

\echo ''

-- =====================================================
-- 10. AUTOMATION COVERAGE
-- =====================================================
\echo '10. Automation coverage...'

-- Smart playlists coverage
SELECT
    'Smart Playlists' as automation_type,
    COUNT(DISTINCT user_id) as users_covered,
    MAX(generated_at) as last_generated
FROM smart_playlists;

\echo ''

-- Trending tracks status
SELECT
    'Trending Tracks' as automation_type,
    COUNT(*) as track_count,
    MAX(calculated_at) as last_calculated
FROM trending_tracks;

\echo ''

-- Listening stats coverage
SELECT
    'Listening Stats' as automation_type,
    COUNT(*) as users_covered,
    MAX(last_aggregated_at) as last_aggregated
FROM user_listening_stats;

\echo ''

-- =====================================================
-- SUMMARY
-- =====================================================
\echo ''
\echo '========================================='
\echo '   VERIFICATION SUMMARY'
\echo '========================================='
\echo ''

SELECT
    CASE
        WHEN (
            EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_listening_stats' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_playlists' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trending_tracks' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'background_tasks' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'aggregate-listening-history') AND
            EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-smart-playlists') AND
            EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'calculate-trending')
        )
        THEN '✅ AUTOMATION SYSTEM IS FULLY SET UP!'
        ELSE '❌ SETUP INCOMPLETE - Check errors above'
    END as overall_status;

\echo ''
\echo 'To manually trigger all automations, run:'
\echo '  SELECT trigger_all_automations();'
\echo ''
\echo 'To test smart playlist generation for a user:'
\echo '  SELECT generate_daily_mix(''USER_ID_HERE'');'
\echo ''
\echo 'To check cron schedule:'
\echo '  SELECT * FROM cron.job;'
\echo ''
\echo '========================================='
