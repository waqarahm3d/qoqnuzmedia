-- ================================================================
-- HELPER FUNCTIONS FOR SMART PLAYLISTS & DISCOVERY
-- PostgreSQL functions to support smart playlist generation
-- ================================================================

-- Function to get user's favorite genres
CREATE OR REPLACE FUNCTION get_user_favorite_genres(
  user_id_param UUID,
  days_back INTEGER DEFAULT 60
)
RETURNS TABLE (genre TEXT, play_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(t.genres) as genre, COUNT(*) as play_count
  FROM play_history ph
  JOIN tracks t ON t.id = ph.track_id
  WHERE ph.user_id = user_id_param
    AND ph.played_at >= NOW() - (days_back || ' days')::INTERVAL
    AND t.genres IS NOT NULL
  GROUP BY genre
  ORDER BY play_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's favorite artists
CREATE OR REPLACE FUNCTION get_user_favorite_artists(
  user_id_param UUID,
  days_back INTEGER DEFAULT 60
)
RETURNS TABLE (artist_id UUID, artist_name TEXT, play_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.artist_id,
    a.name as artist_name,
    COUNT(*) as play_count
  FROM play_history ph
  JOIN tracks t ON t.id = ph.track_id
  JOIN artists a ON a.id = t.artist_id
  WHERE ph.user_id = user_id_param
    AND ph.played_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY t.artist_id, a.name
  ORDER BY play_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tracks not played recently
CREATE OR REPLACE FUNCTION get_unplayed_tracks(
  user_id_param UUID,
  days_back INTEGER DEFAULT 90,
  limit_count INTEGER DEFAULT 50
)
RETURNS SETOF tracks AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM tracks t
  WHERE NOT EXISTS (
    SELECT 1 FROM play_history ph
    WHERE ph.track_id = t.id
    AND ph.user_id = user_id_param
    AND ph.played_at >= NOW() - (days_back || ' days')::INTERVAL
  )
  ORDER BY t.popularity DESC NULLS LAST, t.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user's taste profile
CREATE OR REPLACE FUNCTION calculate_user_taste_profile(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  profile JSONB;
  top_genres TEXT[];
  top_moods TEXT[];
  top_activities TEXT[];
  avg_energy NUMERIC;
  avg_tempo NUMERIC;
  avg_valence NUMERIC;
BEGIN
  -- Get top genres
  SELECT array_agg(genre) INTO top_genres
  FROM (
    SELECT unnest(t.genres) as genre, COUNT(*) as cnt
    FROM play_history ph
    JOIN tracks t ON t.id = ph.track_id
    WHERE ph.user_id = user_id_param
      AND ph.played_at >= NOW() - INTERVAL '60 days'
      AND t.genres IS NOT NULL
    GROUP BY genre
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Get top moods
  SELECT array_agg(mood) INTO top_moods
  FROM (
    SELECT unnest(t.mood_tags) as mood, COUNT(*) as cnt
    FROM play_history ph
    JOIN tracks t ON t.id = ph.track_id
    WHERE ph.user_id = user_id_param
      AND ph.played_at >= NOW() - INTERVAL '60 days'
      AND t.mood_tags IS NOT NULL
    GROUP BY mood
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Get top activities
  SELECT array_agg(activity) INTO top_activities
  FROM (
    SELECT unnest(t.activity_tags) as activity, COUNT(*) as cnt
    FROM play_history ph
    JOIN tracks t ON t.id = ph.track_id
    WHERE ph.user_id = user_id_param
      AND ph.played_at >= NOW() - INTERVAL '60 days'
      AND t.activity_tags IS NOT NULL
    GROUP BY activity
    ORDER BY cnt DESC
    LIMIT 5
  ) sub;

  -- Get average metrics
  SELECT
    AVG(t.energy_level),
    AVG(t.tempo_bpm),
    AVG(t.valence)
  INTO avg_energy, avg_tempo, avg_valence
  FROM play_history ph
  JOIN tracks t ON t.id = ph.track_id
  WHERE ph.user_id = user_id_param
    AND ph.played_at >= NOW() - INTERVAL '60 days';

  -- Build profile JSON
  profile := jsonb_build_object(
    'top_genres', COALESCE(top_genres, ARRAY[]::TEXT[]),
    'top_moods', COALESCE(top_moods, ARRAY[]::TEXT[]),
    'top_activities', COALESCE(top_activities, ARRAY[]::TEXT[]),
    'avg_energy_level', COALESCE(avg_energy, 5),
    'avg_tempo_bpm', COALESCE(avg_tempo, 120),
    'avg_valence', COALESCE(avg_valence, 5),
    'calculated_at', NOW()
  );

  -- Update or insert user preferences
  INSERT INTO user_music_preferences (
    user_id,
    favorite_genres,
    favorite_moods,
    favorite_activities,
    preferred_tempo_min,
    preferred_tempo_max,
    preferred_energy_level,
    updated_at
  )
  VALUES (
    user_id_param,
    COALESCE(top_genres, ARRAY[]::TEXT[]),
    COALESCE(top_moods, ARRAY[]::TEXT[]),
    COALESCE(top_activities, ARRAY[]::TEXT[]),
    GREATEST(COALESCE(avg_tempo, 120) - 20, 60),
    LEAST(COALESCE(avg_tempo, 120) + 20, 200),
    ROUND(COALESCE(avg_energy, 5)),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    favorite_genres = EXCLUDED.favorite_genres,
    favorite_moods = EXCLUDED.favorite_moods,
    favorite_activities = EXCLUDED.favorite_activities,
    preferred_tempo_min = EXCLUDED.preferred_tempo_min,
    preferred_tempo_max = EXCLUDED.preferred_tempo_max,
    preferred_energy_level = EXCLUDED.preferred_energy_level,
    updated_at = NOW();

  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar tracks (if similarities not pre-computed)
CREATE OR REPLACE FUNCTION find_similar_tracks(
  track_id_param UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  similar_track_id UUID,
  similarity_score NUMERIC,
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH source_track AS (
    SELECT * FROM tracks WHERE id = track_id_param
  )
  SELECT
    t.id as similar_track_id,
    (
      -- Genre match (40% weight)
      CASE WHEN t.genres && (SELECT genres FROM source_track) THEN 0.4 ELSE 0 END +
      -- Mood match (25% weight)
      CASE WHEN t.mood_tags && (SELECT mood_tags FROM source_track) THEN 0.25 ELSE 0 END +
      -- Energy match (15% weight)
      CASE WHEN t.energy_level IS NOT NULL AND (SELECT energy_level FROM source_track) IS NOT NULL
        THEN 0.15 * (1 - ABS(t.energy_level - (SELECT energy_level FROM source_track))::NUMERIC / 10)
        ELSE 0
      END +
      -- Tempo match (20% weight)
      CASE WHEN t.tempo_bpm IS NOT NULL AND (SELECT tempo_bpm FROM source_track) IS NOT NULL
        THEN 0.20 * (1 - ABS(t.tempo_bpm - (SELECT tempo_bpm FROM source_track))::NUMERIC / 200)
        ELSE 0
      END
    ) as similarity_score,
    CASE
      WHEN t.genres && (SELECT genres FROM source_track) THEN 'Same genre'
      WHEN t.mood_tags && (SELECT mood_tags FROM source_track) THEN 'Similar mood'
      WHEN t.artist_id = (SELECT artist_id FROM source_track) THEN 'Same artist'
      ELSE 'Similar characteristics'
    END as match_reason
  FROM tracks t
  WHERE t.id != track_id_param
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch compute track similarities (for cron job)
CREATE OR REPLACE FUNCTION compute_track_similarities_batch(
  batch_size INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
  tracks_processed INTEGER := 0;
  track_record RECORD;
BEGIN
  -- Get tracks that haven't been processed or are old
  FOR track_record IN
    SELECT t.id
    FROM tracks t
    LEFT JOIN track_similarities ts ON ts.track_id = t.id
    GROUP BY t.id
    HAVING COUNT(ts.id) < 20 OR MAX(ts.computed_at) < NOW() - INTERVAL '30 days'
    LIMIT batch_size
  LOOP
    -- Delete old similarities for this track
    DELETE FROM track_similarities WHERE track_id = track_record.id;

    -- Compute and insert new similarities
    INSERT INTO track_similarities (track_id, similar_track_id, similarity_score, similarity_factors, computed_at)
    SELECT
      track_record.id,
      similar_track_id,
      similarity_score,
      jsonb_build_object('match_reason', match_reason),
      NOW()
    FROM find_similar_tracks(track_record.id, 20)
    WHERE similarity_score > 0.3;

    tracks_processed := tracks_processed + 1;
  END LOOP;

  RETURN tracks_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON FUNCTION get_user_favorite_genres IS 'Returns user''s most listened genres from play history';
COMMENT ON FUNCTION get_user_favorite_artists IS 'Returns user''s most listened artists from play history';
COMMENT ON FUNCTION get_unplayed_tracks IS 'Returns tracks the user has not played recently';
COMMENT ON FUNCTION calculate_user_taste_profile IS 'Calculates and caches user''s music preferences';
COMMENT ON FUNCTION find_similar_tracks IS 'Finds similar tracks using multi-factor similarity algorithm';
COMMENT ON FUNCTION compute_track_similarities_batch IS 'Batch processes track similarities for performance';
