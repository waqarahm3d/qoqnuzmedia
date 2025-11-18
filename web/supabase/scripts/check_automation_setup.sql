-- ============================================
-- AUTOMATION DIAGNOSTIC SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor to check automation configuration
-- Copy and paste ALL the output back to me
-- ============================================

-- ============================================
-- STEP 1: Check if automation tables exist
-- ============================================
SELECT '=== AUTOMATION TABLES ===' as info;
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%automation%'
    OR table_name LIKE '%background%'
    OR table_name LIKE '%trending%'
    OR table_name LIKE '%smart_playlist%'
    OR table_name = 'cron_job'
  )
ORDER BY table_name;

-- ============================================
-- STEP 2: Check background_tasks table structure
-- ============================================
SELECT '=== BACKGROUND_TASKS TABLE STRUCTURE ===' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'background_tasks'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Check smart_playlists table structure
-- ============================================
SELECT '=== SMART_PLAYLISTS TABLE STRUCTURE ===' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'smart_playlists'
ORDER BY ordinal_position;

-- ============================================
-- STEP 4: Check trending_tracks table structure
-- ============================================
SELECT '=== TRENDING_TRACKS TABLE STRUCTURE ===' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'trending_tracks'
ORDER BY ordinal_position;

-- ============================================
-- STEP 5: Check RLS policies on automation tables
-- ============================================
SELECT '=== RLS POLICIES ON AUTOMATION TABLES ===' as info;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('background_tasks', 'smart_playlists', 'trending_tracks', 'cron_job')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 6: Check if RLS is enabled on automation tables
-- ============================================
SELECT '=== RLS STATUS ON AUTOMATION TABLES ===' as info;
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('background_tasks', 'smart_playlists', 'trending_tracks', 'cron_job')
ORDER BY tablename;

-- ============================================
-- STEP 7: Check automation-related functions
-- ============================================
SELECT '=== AUTOMATION FUNCTIONS ===' as info;
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%automation%'
    OR routine_name LIKE '%trending%'
    OR routine_name LIKE '%smart_playlist%'
    OR routine_name LIKE '%background%'
    OR routine_name LIKE 'trigger_all%'
    OR routine_name LIKE 'calculate_%'
    OR routine_name LIKE 'generate_%'
    OR routine_name LIKE 'aggregate_%'
    OR routine_name = 'get_cron_job_status'
  )
ORDER BY routine_name;

-- ============================================
-- STEP 8: Check cron extension
-- ============================================
SELECT '=== CRON EXTENSION ===' as info;
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'pg_cron';

-- ============================================
-- STEP 9: Sample data from background_tasks
-- ============================================
SELECT '=== RECENT BACKGROUND TASKS (Last 10) ===' as info;
SELECT
  id,
  task_type,
  status,
  created_at,
  started_at,
  completed_at,
  error_message
FROM background_tasks
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 10: Sample data from smart_playlists
-- ============================================
SELECT '=== SMART PLAYLISTS SAMPLE (Last 10) ===' as info;
SELECT
  id,
  user_id,
  playlist_type,
  generated_at,
  expires_at
FROM smart_playlists
ORDER BY generated_at DESC
LIMIT 10;

-- ============================================
-- STEP 11: Sample data from trending_tracks
-- ============================================
SELECT '=== TRENDING TRACKS SAMPLE (Last 10) ===' as info;
SELECT
  track_id,
  trend_score,
  play_count_24h,
  play_count_7d,
  calculated_at
FROM trending_tracks
ORDER BY trend_score DESC
LIMIT 10;

-- ============================================
-- STEP 12: Check if automation functions can be called
-- ============================================
SELECT '=== TESTING FUNCTION ACCESS ===' as info;

-- Try to call get_cron_job_status
DO $$
BEGIN
  PERFORM get_cron_job_status();
  RAISE NOTICE 'SUCCESS: get_cron_job_status() is callable';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR calling get_cron_job_status(): %', SQLERRM;
END $$;

-- ============================================
-- STEP 13: Check function definitions
-- ============================================
SELECT '=== FUNCTION DETAILS ===' as info;
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_cron_job_status',
    'trigger_all_automations',
    'calculate_trending_tracks',
    'generate_all_smart_playlists',
    'aggregate_all_user_listening_history'
  );

-- ============================================
-- STEP 14: Check your admin status
-- ============================================
SELECT '=== YOUR ADMIN STATUS ===' as info;
SELECT
  u.email,
  u.id as user_id,
  ar.name as role_name,
  ar.permissions
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY au.created_at DESC;

-- ============================================
-- DONE
-- ============================================
SELECT '
============================================
DIAGNOSTIC COMPLETE
============================================
Please copy ALL the output above and send it back.
Include any error messages you see.
' as instructions;
