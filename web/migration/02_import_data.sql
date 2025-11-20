-- ================================================================
-- DATA IMPORT SCRIPT FOR NEW PLATFORM
-- Run this on the NEW database after exporting from old platform
-- ================================================================

-- IMPORTANT: Run this script as a Supabase admin or service role
-- Make sure to disable RLS temporarily or use service role

BEGIN;

-- ================================================================
-- 1. Import Artists
-- ================================================================
COPY artists (
  id,
  name,
  bio,
  image_url,
  verified,
  created_at,
  updated_at
)
FROM '/tmp/export_artists.csv'
WITH CSV HEADER;

-- Reset artist sequence
SELECT setval('artists_id_seq', (SELECT MAX(id) FROM artists));

-- ================================================================
-- 2. Import Albums
-- ================================================================
COPY albums (
  id,
  title,
  artist_id,
  release_date,
  cover_url,
  type,
  created_at,
  updated_at
)
FROM '/tmp/export_albums.csv'
WITH CSV HEADER;

SELECT setval('albums_id_seq', (SELECT MAX(id) FROM albums));

-- ================================================================
-- 3. Import Genres
-- ================================================================
COPY genres (
  id,
  name,
  description,
  image_url,
  created_at,
  updated_at
)
FROM '/tmp/export_genres.csv'
WITH CSV HEADER;

SELECT setval('genres_id_seq', (SELECT MAX(id) FROM genres));

-- ================================================================
-- 4. Import Tracks
-- ================================================================
COPY tracks (
  id,
  title,
  artist_id,
  album_id,
  duration,
  audio_url,
  cover_url,
  play_count,
  is_explicit,
  created_at,
  updated_at
)
FROM '/tmp/export_tracks.csv'
WITH CSV HEADER;

SELECT setval('tracks_id_seq', (SELECT MAX(id) FROM tracks));

-- ================================================================
-- 5. Import Track-Genre Relationships
-- ================================================================
COPY track_genres (track_id, genre_id)
FROM '/tmp/export_track_genres.csv'
WITH CSV HEADER;

-- ================================================================
-- 6. Import Users
-- NOTE: Users should be migrated through Supabase Auth API
-- This requires using Supabase Admin API, not SQL
-- See: https://supabase.com/docs/reference/javascript/auth-admin-createuser
-- ================================================================

-- For now, create a temporary import table
CREATE TEMP TABLE temp_users (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

COPY temp_users FROM '/tmp/export_users.csv' WITH CSV HEADER;

-- Users will need to be recreated via Supabase Admin API
-- Script provided separately (03_migrate_users.js)

-- ================================================================
-- 7. Import Profiles
-- ================================================================
COPY profiles (
  id,
  username,
  display_name,
  bio,
  avatar_url,
  created_at,
  updated_at
)
FROM '/tmp/export_profiles.csv'
WITH CSV HEADER
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url;

-- ================================================================
-- 8. Import Playlists
-- ================================================================
COPY playlists (
  id,
  name,
  description,
  user_id,
  cover_url,
  is_public,
  created_at,
  updated_at
)
FROM '/tmp/export_playlists.csv'
WITH CSV HEADER;

SELECT setval('playlists_id_seq', (SELECT MAX(id) FROM playlists));

-- ================================================================
-- 9. Import Playlist Tracks
-- ================================================================
COPY playlist_tracks (
  playlist_id,
  track_id,
  position,
  added_at
)
FROM '/tmp/export_playlist_tracks.csv'
WITH CSV HEADER;

-- ================================================================
-- 10. Import Liked Tracks
-- ================================================================
COPY liked_tracks (
  user_id,
  track_id,
  created_at
)
FROM '/tmp/export_liked_tracks.csv'
WITH CSV HEADER
ON CONFLICT (user_id, track_id) DO NOTHING;

-- ================================================================
-- 11. Import Play History
-- ================================================================
COPY play_history (
  user_id,
  track_id,
  played_at,
  play_duration
)
FROM '/tmp/export_play_history.csv'
WITH CSV HEADER;

-- ================================================================
-- 12. Import Admin Users
-- ================================================================
COPY admin_users (
  user_id,
  role,
  created_at
)
FROM '/tmp/export_admin_users.csv'
WITH CSV HEADER
ON CONFLICT (user_id) DO NOTHING;

-- ================================================================
-- 13. Update Play Counts
-- ================================================================
UPDATE tracks t
SET play_count = COALESCE((
  SELECT COUNT(*)
  FROM play_history ph
  WHERE ph.track_id = t.id
), 0);

-- ================================================================
-- 14. Verify Import
-- ================================================================
SELECT
  'artists' as table_name, COUNT(*) as imported_count FROM artists
UNION ALL
SELECT 'albums', COUNT(*) FROM albums
UNION ALL
SELECT 'tracks', COUNT(*) FROM tracks
UNION ALL
SELECT 'genres', COUNT(*) FROM genres
UNION ALL
SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL
SELECT 'playlist_tracks', COUNT(*) FROM playlist_tracks
UNION ALL
SELECT 'liked_tracks', COUNT(*) FROM liked_tracks
UNION ALL
SELECT 'play_history', COUNT(*) FROM play_history
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;

COMMIT;

-- ================================================================
-- NOTES:
-- 1. User migration requires Supabase Admin API (see 03_migrate_users.js)
-- 2. Media files need separate migration (see 04_migrate_media.md)
-- 3. Test thoroughly before running on production
-- 4. Always keep backups!
-- ================================================================
