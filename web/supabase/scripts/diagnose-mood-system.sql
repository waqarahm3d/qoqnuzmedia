-- Mood Analysis System Diagnostic Script
-- Run this in Supabase SQL Editor to diagnose mood analysis issues
-- ================================================================

-- 1. CHECK REQUIRED COLUMNS ON TRACKS TABLE
-- =========================================
SELECT '=== TRACKS TABLE COLUMN CHECK ===' as diagnostic;

SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name IN ('mood_tags', 'activity_tags', 'energy_level', 'valence',
                         'danceability', 'acousticness', 'instrumentalness',
                         'tempo_bpm', 'last_metadata_update', 'audio_url')
    THEN 'REQUIRED for mood analysis'
    ELSE 'Standard column'
  END as importance
FROM information_schema.columns
WHERE table_name = 'tracks'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK IF MOOD COLUMNS EXIST
-- ==============================
SELECT '=== MISSING MOOD COLUMNS CHECK ===' as diagnostic;

WITH required_columns AS (
  SELECT unnest(ARRAY[
    'mood_tags', 'activity_tags', 'energy_level', 'valence',
    'danceability', 'acousticness', 'instrumentalness',
    'tempo_bpm', 'last_metadata_update', 'audio_url'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'tracks' AND table_schema = 'public'
)
SELECT
  r.column_name as missing_column,
  'MISSING - Run migration to add this column' as status
FROM required_columns r
LEFT JOIN existing_columns e ON r.column_name = e.column_name
WHERE e.column_name IS NULL;

-- 3. CHECK MOOD_PRESETS TABLE
-- ===========================
SELECT '=== MOOD PRESETS TABLE CHECK ===' as diagnostic;

SELECT
  name,
  display_name,
  is_active,
  tags,
  filters,
  CASE
    WHEN tags IS NULL OR array_length(tags, 1) = 0 THEN 'WARNING: No tags defined'
    ELSE 'OK: ' || array_length(tags, 1) || ' tags'
  END as tag_status
FROM mood_presets
ORDER BY name;

-- 4. CHECK ACTIVITY_PRESETS TABLE
-- ===============================
SELECT '=== ACTIVITY PRESETS TABLE CHECK ===' as diagnostic;

SELECT
  name,
  display_name,
  is_active,
  tags,
  filters,
  CASE
    WHEN tags IS NULL OR array_length(tags, 1) = 0 THEN 'WARNING: No tags defined'
    ELSE 'OK: ' || array_length(tags, 1) || ' tags'
  END as tag_status
FROM activity_presets
ORDER BY name;

-- 5. TRACK MOOD DATA STATISTICS
-- =============================
SELECT '=== TRACK MOOD DATA STATISTICS ===' as diagnostic;

SELECT
  COUNT(*) as total_tracks,
  COUNT(*) FILTER (WHERE mood_tags IS NOT NULL AND mood_tags != '{}') as tracks_with_mood,
  COUNT(*) FILTER (WHERE mood_tags IS NULL OR mood_tags = '{}') as tracks_without_mood,
  COUNT(*) FILTER (WHERE audio_url IS NOT NULL) as tracks_with_audio,
  COUNT(*) FILTER (WHERE audio_url IS NULL) as tracks_without_audio,
  COUNT(*) FILTER (WHERE energy_level IS NOT NULL) as tracks_with_energy,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE mood_tags IS NOT NULL AND mood_tags != '{}') /
    NULLIF(COUNT(*), 0),
    1
  ) as percent_analyzed
FROM tracks;

-- 6. MOOD TAG DISTRIBUTION
-- ========================
SELECT '=== MOOD TAG DISTRIBUTION ===' as diagnostic;

SELECT
  mood_tags[1] as primary_mood,
  COUNT(*) as track_count
FROM tracks
WHERE mood_tags IS NOT NULL AND array_length(mood_tags, 1) > 0
GROUP BY mood_tags[1]
ORDER BY track_count DESC;

-- 7. ACTIVITY TAG DISTRIBUTION
-- ============================
SELECT '=== ACTIVITY TAG DISTRIBUTION ===' as diagnostic;

SELECT
  unnest(activity_tags) as activity,
  COUNT(*) as track_count
FROM tracks
WHERE activity_tags IS NOT NULL AND array_length(activity_tags, 1) > 0
GROUP BY activity
ORDER BY track_count DESC;

-- 8. VERIFY MOOD TAG MATCHING
-- ===========================
SELECT '=== MOOD TAG MATCHING TEST ===' as diagnostic;

-- Check if tracks with 'energetic' tag exist
SELECT
  'energetic' as mood,
  COUNT(*) as matching_tracks,
  CASE
    WHEN COUNT(*) = 0 THEN 'ERROR: No tracks match this mood'
    ELSE 'OK: ' || COUNT(*) || ' tracks found'
  END as status
FROM tracks
WHERE mood_tags && ARRAY['energetic'];

-- Check other moods
SELECT
  mood,
  COUNT(*) FILTER (WHERE mood_tags && ARRAY[mood]) as matching_tracks
FROM (
  SELECT unnest(ARRAY['happy', 'sad', 'energetic', 'chill', 'focused', 'romantic', 'angry', 'peaceful']) as mood
) moods
CROSS JOIN tracks
GROUP BY mood
ORDER BY mood;

-- 9. CHECK PRESET-TO-TRACK MATCHING
-- =================================
SELECT '=== PRESET TO TRACK MATCHING ===' as diagnostic;

SELECT
  mp.name as preset_name,
  mp.tags as preset_tags,
  COUNT(t.id) as matching_tracks,
  CASE
    WHEN COUNT(t.id) = 0 THEN 'WARNING: No tracks match preset tags'
    ELSE 'OK'
  END as status
FROM mood_presets mp
LEFT JOIN tracks t ON t.mood_tags && mp.tags
WHERE mp.is_active = true
GROUP BY mp.name, mp.tags
ORDER BY mp.name;

-- 10. CHECK GIN INDEXES
-- =====================
SELECT '=== INDEX CHECK ===' as diagnostic;

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tracks'
  AND (indexdef LIKE '%mood_tags%' OR indexdef LIKE '%activity_tags%' OR indexdef LIKE '%gin%')
ORDER BY indexname;

-- 11. SAMPLE ANALYZED TRACKS
-- ==========================
SELECT '=== SAMPLE ANALYZED TRACKS (5) ===' as diagnostic;

SELECT
  id,
  title,
  mood_tags,
  activity_tags,
  energy_level,
  valence,
  tempo_bpm
FROM tracks
WHERE mood_tags IS NOT NULL AND array_length(mood_tags, 1) > 0
LIMIT 5;

-- 12. SAMPLE UNANALYZED TRACKS
-- ============================
SELECT '=== SAMPLE UNANALYZED TRACKS (5) ===' as diagnostic;

SELECT
  id,
  title,
  audio_url,
  CASE
    WHEN audio_url IS NULL THEN 'ERROR: No audio URL'
    ELSE 'Ready for analysis'
  END as status
FROM tracks
WHERE mood_tags IS NULL OR mood_tags = '{}'
LIMIT 5;

-- 13. CHECK ADMIN_USERS TABLE
-- ===========================
SELECT '=== ADMIN USERS CHECK ===' as diagnostic;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'admin_users' AND table_schema = 'public'
  ) as admin_users_table_exists,
  (SELECT COUNT(*) FROM admin_users) as admin_count;

-- SUMMARY
-- =======
SELECT '=== DIAGNOSTIC SUMMARY ===' as diagnostic;

SELECT
  'Total tracks' as metric,
  COUNT(*)::text as value
FROM tracks
UNION ALL
SELECT
  'Tracks with mood data',
  COUNT(*)::text
FROM tracks WHERE mood_tags IS NOT NULL AND mood_tags != '{}'
UNION ALL
SELECT
  'Tracks ready for analysis',
  COUNT(*)::text
FROM tracks WHERE (mood_tags IS NULL OR mood_tags = '{}') AND audio_url IS NOT NULL
UNION ALL
SELECT
  'Active mood presets',
  COUNT(*)::text
FROM mood_presets WHERE is_active = true
UNION ALL
SELECT
  'Active activity presets',
  COUNT(*)::text
FROM activity_presets WHERE is_active = true;
