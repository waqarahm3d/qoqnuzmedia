-- =====================================================
-- CLEAN INSTALL - Automation System
-- Use this if you're getting schema conflicts
-- WARNING: This will delete existing automation data!
-- =====================================================

-- This script will:
-- 1. Remove all existing automation tables and functions
-- 2. Remove all cron jobs
-- 3. Allow you to run the migration fresh

-- =====================================================
-- STEP 1: Unschedule all cron jobs (if they exist)
-- =====================================================

DO $$
DECLARE
    job_rec RECORD;
BEGIN
    FOR job_rec IN
        SELECT jobname
        FROM cron.job
        WHERE jobname IN (
            'aggregate-listening-history',
            'generate-smart-playlists',
            'calculate-trending',
            'cleanup-background-tasks',
            'cleanup-expired-playlists'
        )
    LOOP
        BEGIN
            PERFORM cron.unschedule(job_rec.jobname);
            RAISE NOTICE 'Unscheduled cron job: %', job_rec.jobname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not unschedule %: %', job_rec.jobname, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Drop all automation tables
-- =====================================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS trending_tracks CASCADE;
DROP TABLE IF EXISTS smart_playlists CASCADE;
DROP TABLE IF EXISTS background_tasks CASCADE;
DROP TABLE IF EXISTS user_listening_stats CASCADE;

-- =====================================================
-- STEP 3: Drop all automation functions
-- =====================================================

DROP FUNCTION IF EXISTS get_cron_job_status() CASCADE;
DROP FUNCTION IF EXISTS trigger_all_automations() CASCADE;
DROP FUNCTION IF EXISTS complete_background_task(UUID, BOOLEAN, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_next_background_task(TEXT) CASCADE;
DROP FUNCTION IF EXISTS queue_mood_detection() CASCADE;
DROP FUNCTION IF EXISTS calculate_trending_tracks() CASCADE;
DROP FUNCTION IF EXISTS generate_forgotten_favorites(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_new_for_you(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_discovery_weekly(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_daily_mix(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_all_smart_playlists() CASCADE;
DROP FUNCTION IF EXISTS aggregate_all_user_listening_history() CASCADE;
DROP FUNCTION IF EXISTS aggregate_user_listening_history(UUID) CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that tables are gone
SELECT
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ All automation tables removed successfully'
        ELSE '⚠️ Some tables still exist: ' || string_agg(table_name, ', ')
    END as tables_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_listening_stats',
    'smart_playlists',
    'trending_tracks',
    'background_tasks'
  );

-- Check that functions are gone
SELECT
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ All automation functions removed successfully'
        ELSE '⚠️ Some functions still exist: ' || string_agg(routine_name, ', ')
    END as functions_status
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
    'aggregate_all_user_listening_history'
  );

-- Check that cron jobs are gone
SELECT
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ All cron jobs removed successfully'
        ELSE '⚠️ Some cron jobs still exist: ' || string_agg(jobname, ', ')
    END as cron_status
FROM cron.job
WHERE jobname IN (
    'aggregate-listening-history',
    'generate-smart-playlists',
    'calculate-trending',
    'cleanup-background-tasks',
    'cleanup-expired-playlists'
);

-- =====================================================
-- NEXT STEPS
-- =====================================================
/*

✅ Clean install complete!

Now run the main automation migration:
1. Open: supabase/migrations/20250118000000_automation_system.sql
2. Copy all contents
3. Paste into SQL Editor
4. Click Run

The migration will create everything fresh with no conflicts.

*/
