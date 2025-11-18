-- =====================================================
-- QUICK AUTOMATION CHECK
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

-- 1. Check pg_cron is enabled
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
        THEN '✅ pg_cron ENABLED'
        ELSE '❌ pg_cron NOT ENABLED - Enable it first!'
    END as pg_cron_status;

-- 2. Check tables exist
SELECT
    'user_listening_stats' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM user_listening_stats) OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_listening_stats')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
    (SELECT COUNT(*) FROM user_listening_stats) as row_count
UNION ALL
SELECT
    'smart_playlists',
    CASE WHEN EXISTS (SELECT 1 FROM smart_playlists) OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_playlists')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END,
    (SELECT COUNT(*) FROM smart_playlists)
UNION ALL
SELECT
    'trending_tracks',
    CASE WHEN EXISTS (SELECT 1 FROM trending_tracks) OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trending_tracks')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END,
    (SELECT COUNT(*) FROM trending_tracks)
UNION ALL
SELECT
    'background_tasks',
    CASE WHEN EXISTS (SELECT 1 FROM background_tasks) OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'background_tasks')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END,
    (SELECT COUNT(*) FROM background_tasks);

-- 3. Check cron jobs are scheduled
SELECT
    jobid,
    jobname as cron_job,
    schedule,
    CASE WHEN active THEN '✅ ACTIVE' ELSE '❌ INACTIVE' END as status,
    database
FROM cron.job
ORDER BY jobid;

-- 4. Check functions exist
SELECT
    routine_name as function_name,
    '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_daily_mix',
    'generate_discovery_weekly',
    'generate_new_for_you',
    'generate_forgotten_favorites',
    'calculate_trending_tracks',
    'aggregate_all_user_listening_history',
    'trigger_all_automations'
  )
ORDER BY routine_name;

-- 5. Check recent cron executions
SELECT
    j.jobname,
    jrd.status,
    jrd.start_time,
    ROUND(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))::numeric, 2) as duration_seconds
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
ORDER BY jrd.start_time DESC
LIMIT 10;

-- 6. Overall system status
SELECT
    CASE
        WHEN (
            EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_playlists') AND
            EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-smart-playlists')
        )
        THEN '✅ AUTOMATION SYSTEM IS READY!'
        ELSE '❌ SETUP INCOMPLETE - Check results above'
    END as overall_status;

-- ==================================================
-- NEXT STEPS:
-- ==================================================
-- To manually trigger all automations for testing:
--   SELECT trigger_all_automations();
--
-- To generate playlist for specific user:
--   SELECT generate_daily_mix('your-user-id-here');
--
-- To check play history exists:
--   SELECT COUNT(*) FROM play_history;
-- ==================================================
