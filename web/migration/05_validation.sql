-- ================================================================
-- DATA VALIDATION SCRIPT
-- Run this on the NEW database after migration to verify data integrity
-- ================================================================

\echo '========================================='
\echo 'DATA VALIDATION REPORT'
\echo '========================================='
\echo ''

-- ================================================================
-- 1. Record Count Comparison
-- ================================================================
\echo '1. RECORD COUNTS'
\echo '----------------'

SELECT
  'artists' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM artists
UNION ALL
SELECT 'albums', COUNT(*), MIN(created_at), MAX(created_at) FROM albums
UNION ALL
SELECT 'tracks', COUNT(*), MIN(created_at), MAX(created_at) FROM tracks
UNION ALL
SELECT 'genres', COUNT(*), MIN(created_at), MAX(created_at) FROM genres
UNION ALL
SELECT 'playlists', COUNT(*), MIN(created_at), MAX(created_at) FROM playlists
UNION ALL
SELECT 'profiles', COUNT(*), MIN(created_at), MAX(created_at) FROM profiles
ORDER BY table_name;

\echo ''

-- ================================================================
-- 2. Data Integrity Checks
-- ================================================================
\echo '2. DATA INTEGRITY ISSUES'
\echo '------------------------'

-- Tracks without artists
SELECT 'Tracks without artists' as issue, COUNT(*) as count
FROM tracks WHERE artist_id IS NULL
UNION ALL

-- Tracks without albums
SELECT 'Tracks without albums', COUNT(*)
FROM tracks WHERE album_id IS NULL
UNION ALL

-- Albums without artists
SELECT 'Albums without artists', COUNT(*)
FROM albums WHERE artist_id IS NULL
UNION ALL

-- Tracks without audio URL
SELECT 'Tracks without audio_url', COUNT(*)
FROM tracks WHERE audio_url IS NULL OR audio_url = ''
UNION ALL

-- Playlists without owners
SELECT 'Playlists without user_id', COUNT(*)
FROM playlists WHERE user_id IS NULL
UNION ALL

-- Orphaned playlist tracks (track doesn't exist)
SELECT 'Orphaned playlist tracks', COUNT(*)
FROM playlist_tracks pt
LEFT JOIN tracks t ON pt.track_id = t.id
WHERE t.id IS NULL
UNION ALL

-- Orphaned liked tracks
SELECT 'Orphaned liked tracks', COUNT(*)
FROM liked_tracks lt
LEFT JOIN tracks t ON lt.track_id = t.id
WHERE t.id IS NULL
UNION ALL

-- Invalid genre references
SELECT 'Invalid track_genres references', COUNT(*)
FROM track_genres tg
LEFT JOIN tracks t ON tg.track_id = t.id
LEFT JOIN genres g ON tg.genre_id = g.id
WHERE t.id IS NULL OR g.id IS NULL;

\echo ''

-- ================================================================
-- 3. URL Validation
-- ================================================================
\echo '3. URL VALIDATION'
\echo '-----------------'

-- Check for URLs that might not have been updated
SELECT
  'Old domain URLs in tracks' as issue,
  COUNT(*) as count
FROM tracks
WHERE audio_url LIKE '%play.qoqnuz.com%'
UNION ALL
SELECT 'Old domain URLs in albums', COUNT(*)
FROM albums WHERE cover_url LIKE '%play.qoqnuz.com%'
UNION ALL
SELECT 'Old domain URLs in artists', COUNT(*)
FROM artists WHERE image_url LIKE '%play.qoqnuz.com%'
UNION ALL
SELECT 'Old domain URLs in profiles', COUNT(*)
FROM profiles WHERE avatar_url LIKE '%play.qoqnuz.com%';

\echo ''

-- ================================================================
-- 4. User Data Validation
-- ================================================================
\echo '4. USER DATA'
\echo '------------'

-- Profiles without users (if auth.users is accessible)
SELECT
  'Total profiles' as metric,
  COUNT(*) as value
FROM profiles
UNION ALL
SELECT 'Profiles with NULL username', COUNT(*)
FROM profiles WHERE username IS NULL
UNION ALL
SELECT 'Total playlists', COUNT(*)
FROM playlists
UNION ALL
SELECT 'Total liked tracks', COUNT(*)
FROM liked_tracks
UNION ALL
SELECT 'Total play history records', COUNT(*)
FROM play_history;

\echo ''

-- ================================================================
-- 5. Relationship Integrity
-- ================================================================
\echo '5. RELATIONSHIP INTEGRITY'
\echo '-------------------------'

-- Check all foreign key relationships
WITH relationship_checks AS (
  SELECT 'Tracks → Artists' as relationship, COUNT(*) as valid_count
  FROM tracks t
  INNER JOIN artists a ON t.artist_id = a.id

  UNION ALL

  SELECT 'Tracks → Albums', COUNT(*)
  FROM tracks t
  INNER JOIN albums al ON t.album_id = al.id

  UNION ALL

  SELECT 'Albums → Artists', COUNT(*)
  FROM albums al
  INNER JOIN artists a ON al.artist_id = a.id

  UNION ALL

  SELECT 'Playlists → Users', COUNT(*)
  FROM playlists p
  INNER JOIN profiles u ON p.user_id = u.id

  UNION ALL

  SELECT 'Playlist Tracks → Playlists', COUNT(*)
  FROM playlist_tracks pt
  INNER JOIN playlists p ON pt.playlist_id = p.id

  UNION ALL

  SELECT 'Playlist Tracks → Tracks', COUNT(*)
  FROM playlist_tracks pt
  INNER JOIN tracks t ON pt.track_id = t.id
)
SELECT * FROM relationship_checks;

\echo ''

-- ================================================================
-- 6. Play Count Validation
-- ================================================================
\echo '6. PLAY COUNT VALIDATION'
\echo '------------------------'

-- Compare play_count in tracks with play_history
SELECT
  t.id,
  t.title,
  t.play_count as stored_play_count,
  COUNT(ph.id) as actual_play_count,
  (t.play_count - COUNT(ph.id)) as difference
FROM tracks t
LEFT JOIN play_history ph ON t.track_id = ph.track_id
GROUP BY t.id, t.title, t.play_count
HAVING t.play_count != COUNT(ph.id)
ORDER BY ABS(t.play_count - COUNT(ph.id)) DESC
LIMIT 10;

\echo ''

-- ================================================================
-- 7. Duplicate Check
-- ================================================================
\echo '7. DUPLICATE RECORDS'
\echo '--------------------'

-- Check for duplicate artists
SELECT 'Duplicate artist names' as issue, COUNT(*) as count
FROM (
  SELECT name, COUNT(*) as cnt
  FROM artists
  GROUP BY name
  HAVING COUNT(*) > 1
) duplicates
UNION ALL

-- Check for duplicate tracks (same title and artist)
SELECT 'Duplicate tracks (same title+artist)', COUNT(*)
FROM (
  SELECT title, artist_id, COUNT(*) as cnt
  FROM tracks
  GROUP BY title, artist_id
  HAVING COUNT(*) > 1
) duplicates
UNION ALL

-- Check for duplicate playlists (same name and user)
SELECT 'Duplicate playlists (same name+user)', COUNT(*)
FROM (
  SELECT name, user_id, COUNT(*) as cnt
  FROM playlists
  GROUP BY name, user_id
  HAVING COUNT(*) > 1
) duplicates;

\echo ''

-- ================================================================
-- 8. Admin Users
-- ================================================================
\echo '8. ADMIN USERS'
\echo '--------------'

SELECT
  'Total admin users' as metric,
  COUNT(*) as value
FROM admin_users
UNION ALL
SELECT 'Admin users with valid profiles', COUNT(*)
FROM admin_users au
INNER JOIN profiles p ON au.user_id = p.id;

\echo ''

-- ================================================================
-- 9. Storage Statistics
-- ================================================================
\echo '9. STORAGE STATISTICS'
\echo '---------------------'

-- Calculate total durations
SELECT
  'Total track duration (hours)' as metric,
  ROUND(SUM(duration::numeric) / 3600, 2) as value
FROM tracks
UNION ALL
SELECT 'Average track duration (minutes)', ROUND(AVG(duration::numeric) / 60, 2)
FROM tracks
UNION ALL
SELECT 'Tracks with duration > 0', COUNT(*)
FROM tracks WHERE duration > 0
UNION ALL
SELECT 'Tracks with duration = 0 or NULL', COUNT(*)
FROM tracks WHERE duration IS NULL OR duration = 0;

\echo ''

-- ================================================================
-- 10. Recent Activity
-- ================================================================
\echo '10. RECENT ACTIVITY'
\echo '-------------------'

SELECT
  'Playlists created (last 7 days)' as activity,
  COUNT(*) as count
FROM playlists
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'Tracks played (last 7 days)', COUNT(*)
FROM play_history
WHERE played_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 'Tracks liked (last 7 days)', COUNT(*)
FROM liked_tracks
WHERE created_at > NOW() - INTERVAL '7 days';

\echo ''

-- ================================================================
-- SUMMARY
-- ================================================================
\echo '========================================='
\echo 'VALIDATION SUMMARY'
\echo '========================================='

DO $$
DECLARE
  issue_count INTEGER;
BEGIN
  -- Count all data integrity issues
  SELECT
    COALESCE(SUM(cnt), 0) INTO issue_count
  FROM (
    SELECT COUNT(*) as cnt FROM tracks WHERE artist_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM tracks WHERE audio_url IS NULL
    UNION ALL
    SELECT COUNT(*) FROM playlists WHERE user_id IS NULL
  ) issues;

  IF issue_count = 0 THEN
    RAISE NOTICE '✅ No critical data integrity issues found!';
  ELSE
    RAISE WARNING '⚠️  Found % data integrity issues - review above', issue_count;
  END IF;
END $$;

\echo ''
\echo 'Validation complete! Review any issues above.'
\echo ''
