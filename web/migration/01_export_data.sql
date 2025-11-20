-- ================================================================
-- DATA EXPORT SCRIPT FOR play.qoqnuz.com MIGRATION
-- Run this on the OLD database to export data
-- ================================================================

-- Export Users (excluding sensitive password data)
COPY (
  SELECT
    id,
    email,
    created_at,
    updated_at
  FROM auth.users
  ORDER BY created_at
) TO '/tmp/export_users.csv' WITH CSV HEADER;

-- Export Profiles
COPY (
  SELECT
    id,
    username,
    display_name,
    bio,
    avatar_url,
    created_at,
    updated_at
  FROM profiles
  ORDER BY created_at
) TO '/tmp/export_profiles.csv' WITH CSV HEADER;

-- Export Artists
COPY (
  SELECT
    id,
    name,
    bio,
    image_url,
    verified,
    created_at,
    updated_at
  FROM artists
  ORDER BY created_at
) TO '/tmp/export_artists.csv' WITH CSV HEADER;

-- Export Albums
COPY (
  SELECT
    id,
    title,
    artist_id,
    release_date,
    cover_url,
    type,
    created_at,
    updated_at
  FROM albums
  ORDER BY created_at
) TO '/tmp/export_albums.csv' WITH CSV HEADER;

-- Export Tracks
COPY (
  SELECT
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
  FROM tracks
  ORDER BY created_at
) TO '/tmp/export_tracks.csv' WITH CSV HEADER;

-- Export Genres
COPY (
  SELECT
    id,
    name,
    description,
    image_url,
    created_at,
    updated_at
  FROM genres
  ORDER BY name
) TO '/tmp/export_genres.csv' WITH CSV HEADER;

-- Export Track Genres (relationships)
COPY (
  SELECT
    track_id,
    genre_id
  FROM track_genres
) TO '/tmp/export_track_genres.csv' WITH CSV HEADER;

-- Export Playlists
COPY (
  SELECT
    id,
    name,
    description,
    user_id,
    cover_url,
    is_public,
    created_at,
    updated_at
  FROM playlists
  ORDER BY created_at
) TO '/tmp/export_playlists.csv' WITH CSV HEADER;

-- Export Playlist Tracks
COPY (
  SELECT
    playlist_id,
    track_id,
    position,
    added_at
  FROM playlist_tracks
  ORDER BY playlist_id, position
) TO '/tmp/export_playlist_tracks.csv' WITH CSV HEADER;

-- Export Liked Songs
COPY (
  SELECT
    user_id,
    track_id,
    created_at
  FROM liked_tracks
  ORDER BY user_id, created_at
) TO '/tmp/export_liked_tracks.csv' WITH CSV HEADER;

-- Export Listening History/Play Count
COPY (
  SELECT
    user_id,
    track_id,
    played_at,
    play_duration
  FROM play_history
  ORDER BY played_at DESC
  LIMIT 1000000
) TO '/tmp/export_play_history.csv' WITH CSV HEADER;

-- Export Follows (if exists)
COPY (
  SELECT
    follower_id,
    following_id,
    created_at
  FROM follows
) TO '/tmp/export_follows.csv' WITH CSV HEADER;

-- Export Admin Users
COPY (
  SELECT
    user_id,
    role,
    created_at
  FROM admin_users
) TO '/tmp/export_admin_users.csv' WITH CSV HEADER;

-- Summary Statistics
SELECT
  'users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'artists', COUNT(*) FROM artists
UNION ALL
SELECT 'albums', COUNT(*) FROM albums
UNION ALL
SELECT 'tracks', COUNT(*) FROM tracks
UNION ALL
SELECT 'genres', COUNT(*) FROM genres
UNION ALL
SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL
SELECT 'liked_tracks', COUNT(*) FROM liked_tracks
UNION ALL
SELECT 'play_history', COUNT(*) FROM play_history;
