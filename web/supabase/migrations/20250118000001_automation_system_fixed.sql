-- =====================================================
-- QOQNUZ AUTOMATION SYSTEM - FIXED VERSION
-- Long-term automation for smart playlists, discovery, and background processing
-- =====================================================

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 1. LISTENING HISTORY AGGREGATION
-- =====================================================

-- Create aggregated listening stats table
CREATE TABLE IF NOT EXISTS user_listening_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_plays INTEGER DEFAULT 0,
    total_listening_time_ms BIGINT DEFAULT 0,
    favorite_genres JSONB DEFAULT '[]'::jsonb,
    favorite_artists JSONB DEFAULT '[]'::jsonb,
    top_tracks JSONB DEFAULT '[]'::jsonb,
    listening_patterns JSONB DEFAULT '{}'::jsonb,
    last_aggregated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_listening_stats_updated ON user_listening_stats(updated_at);

-- Function to aggregate user listening history
CREATE OR REPLACE FUNCTION aggregate_user_listening_history(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_plays INTEGER;
    v_total_time BIGINT;
    v_favorite_genres JSONB;
    v_favorite_artists JSONB;
    v_top_tracks JSONB;
    v_patterns JSONB;
BEGIN
    -- Calculate total plays
    SELECT COUNT(*), COALESCE(SUM(duration_ms), 0)
    INTO v_total_plays, v_total_time
    FROM play_history
    WHERE user_id = p_user_id;

    -- Get favorite genres (top 5)
    SELECT jsonb_agg(genre_data)
    INTO v_favorite_genres
    FROM (
        SELECT jsonb_build_object(
            'genre_id', g.id,
            'genre_name', g.name,
            'play_count', COUNT(*)
        ) as genre_data
        FROM play_history ph
        JOIN tracks t ON t.id = ph.track_id
        JOIN track_genres tg ON tg.track_id = t.id
        JOIN genres g ON g.id = tg.genre_id
        WHERE ph.user_id = p_user_id
        GROUP BY g.id, g.name
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) top_genres;

    -- Get favorite artists (top 10)
    SELECT jsonb_agg(artist_data)
    INTO v_favorite_artists
    FROM (
        SELECT jsonb_build_object(
            'artist_id', a.id,
            'artist_name', a.name,
            'play_count', COUNT(*)
        ) as artist_data
        FROM play_history ph
        JOIN tracks t ON t.id = ph.track_id
        JOIN artists a ON a.id = t.artist_id
        WHERE ph.user_id = p_user_id
        GROUP BY a.id, a.name
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) top_artists;

    -- Get top tracks (top 50)
    SELECT jsonb_agg(track_data)
    INTO v_top_tracks
    FROM (
        SELECT jsonb_build_object(
            'track_id', t.id,
            'track_title', t.title,
            'artist_id', t.artist_id,
            'play_count', COUNT(*)
        ) as track_data
        FROM play_history ph
        JOIN tracks t ON t.id = ph.track_id
        WHERE ph.user_id = p_user_id
        GROUP BY t.id, t.title, t.artist_id
        ORDER BY COUNT(*) DESC
        LIMIT 50
    ) top_tracks;

    -- Calculate listening patterns (hour of day, day of week) - FIXED VERSION
    WITH hour_stats AS (
        SELECT
            jsonb_object_agg(hour_of_day::text, play_count) as hour_pattern
        FROM (
            SELECT
                EXTRACT(HOUR FROM played_at)::integer as hour_of_day,
                COUNT(*) as play_count
            FROM play_history
            WHERE user_id = p_user_id
            GROUP BY hour_of_day
        ) h
    ),
    day_stats AS (
        SELECT
            jsonb_object_agg(day_of_week::text, play_count) as day_pattern
        FROM (
            SELECT
                EXTRACT(DOW FROM played_at)::integer as day_of_week,
                COUNT(*) as play_count
            FROM play_history
            WHERE user_id = p_user_id
            GROUP BY day_of_week
        ) d
    )
    SELECT jsonb_build_object(
        'by_hour', COALESCE(hour_stats.hour_pattern, '{}'::jsonb),
        'by_day', COALESCE(day_stats.day_pattern, '{}'::jsonb)
    )
    INTO v_patterns
    FROM hour_stats, day_stats;

    -- Insert or update stats
    INSERT INTO user_listening_stats (
        user_id,
        total_plays,
        total_listening_time_ms,
        favorite_genres,
        favorite_artists,
        top_tracks,
        listening_patterns,
        last_aggregated_at,
        updated_at
    )
    VALUES (
        p_user_id,
        v_total_plays,
        v_total_time,
        COALESCE(v_favorite_genres, '[]'::jsonb),
        COALESCE(v_favorite_artists, '[]'::jsonb),
        COALESCE(v_top_tracks, '[]'::jsonb),
        COALESCE(v_patterns, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_plays = EXCLUDED.total_plays,
        total_listening_time_ms = EXCLUDED.total_listening_time_ms,
        favorite_genres = EXCLUDED.favorite_genres,
        favorite_artists = EXCLUDED.favorite_artists,
        top_tracks = EXCLUDED.top_tracks,
        listening_patterns = EXCLUDED.listening_patterns,
        last_aggregated_at = NOW(),
        updated_at = NOW();
END;
$$;

-- Function to aggregate all users (called by cron)
CREATE OR REPLACE FUNCTION aggregate_all_user_listening_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Loop through all active users
    FOR v_user_id IN
        SELECT DISTINCT user_id
        FROM play_history
        WHERE played_at > NOW() - INTERVAL '30 days'
    LOOP
        PERFORM aggregate_user_listening_history(v_user_id);
    END LOOP;

    RAISE NOTICE 'Aggregated listening history for all users';
END;
$$;

-- =====================================================
-- 2. SMART PLAYLIST GENERATION
-- =====================================================

-- Create smart playlists table
CREATE TABLE IF NOT EXISTS smart_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    playlist_type TEXT NOT NULL,
    playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
    track_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, playlist_type)
);

CREATE INDEX IF NOT EXISTS idx_smart_playlists_user ON smart_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_type ON smart_playlists(playlist_type);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_expires ON smart_playlists(expires_at);

-- Function to generate Daily Mix for a user - FIXED VERSION
CREATE OR REPLACE FUNCTION generate_daily_mix(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track_ids JSONB;
BEGIN
    -- Get user's top tracks from last 30 days + similar tracks
    WITH recent_plays AS (
        SELECT DISTINCT t.id as track_id
        FROM play_history ph
        JOIN tracks t ON t.id = ph.track_id
        WHERE ph.user_id = p_user_id
          AND ph.played_at > NOW() - INTERVAL '30 days'
        ORDER BY ph.played_at DESC
        LIMIT 30
    ),
    similar_tracks AS (
        SELECT DISTINCT t.id as track_id
        FROM tracks t
        WHERE t.artist_id IN (
            SELECT DISTINCT t2.artist_id
            FROM play_history ph2
            JOIN tracks t2 ON t2.id = ph2.track_id
            WHERE ph2.user_id = p_user_id
              AND ph2.played_at > NOW() - INTERVAL '30 days'
            LIMIT 5
        )
        AND t.id NOT IN (
            SELECT track_id FROM play_history WHERE user_id = p_user_id
        )
        ORDER BY RANDOM()
        LIMIT 20
    )
    SELECT jsonb_agg(track_id)
    INTO v_track_ids
    FROM (
        SELECT track_id FROM recent_plays
        UNION ALL
        SELECT track_id FROM similar_tracks
    ) combined_tracks;

    -- Create or update smart playlist record
    INSERT INTO smart_playlists (user_id, playlist_type, track_ids, generated_at, expires_at)
    VALUES (p_user_id, 'daily_mix', COALESCE(v_track_ids, '[]'::jsonb), NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, playlist_type)
    DO UPDATE SET
        track_ids = EXCLUDED.track_ids,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '1 day';

    RETURN v_track_ids;
END;
$$;

-- Function to generate Discovery Weekly for a user
CREATE OR REPLACE FUNCTION generate_discovery_weekly(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track_ids JSONB;
BEGIN
    -- Get tracks user hasn't heard but match their taste
    SELECT jsonb_agg(track_id)
    INTO v_track_ids
    FROM (
        SELECT DISTINCT t.id as track_id
        FROM tracks t
        JOIN track_genres tg ON tg.track_id = t.id
        WHERE tg.genre_id IN (
            SELECT DISTINCT tg2.genre_id
            FROM play_history ph
            JOIN tracks t2 ON t2.id = ph.track_id
            JOIN track_genres tg2 ON tg2.track_id = t2.id
            WHERE ph.user_id = p_user_id
            GROUP BY tg2.genre_id
            ORDER BY COUNT(*) DESC
            LIMIT 5
        )
        AND t.id NOT IN (
            SELECT track_id FROM play_history WHERE user_id = p_user_id
        )
        AND t.created_at > NOW() - INTERVAL '90 days'
        ORDER BY t.play_count DESC, RANDOM()
        LIMIT 50
    ) discovery_tracks;

    -- Create or update smart playlist record
    INSERT INTO smart_playlists (user_id, playlist_type, track_ids, generated_at, expires_at)
    VALUES (p_user_id, 'discovery_weekly', COALESCE(v_track_ids, '[]'::jsonb), NOW(), NOW() + INTERVAL '7 days')
    ON CONFLICT (user_id, playlist_type)
    DO UPDATE SET
        track_ids = EXCLUDED.track_ids,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '7 days';

    RETURN v_track_ids;
END;
$$;

-- Function to generate New For You for a user
CREATE OR REPLACE FUNCTION generate_new_for_you(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track_ids JSONB;
BEGIN
    -- Get new releases from user's favorite artists
    SELECT jsonb_agg(track_id)
    INTO v_track_ids
    FROM (
        SELECT DISTINCT t.id as track_id
        FROM tracks t
        WHERE t.artist_id IN (
            SELECT DISTINCT t2.artist_id
            FROM play_history ph
            JOIN tracks t2 ON t2.id = ph.track_id
            WHERE ph.user_id = p_user_id
            GROUP BY t2.artist_id
            ORDER BY COUNT(*) DESC
            LIMIT 10
        )
        AND t.created_at > NOW() - INTERVAL '30 days'
        ORDER BY t.created_at DESC
        LIMIT 30
    ) new_tracks;

    -- Create or update smart playlist record
    INSERT INTO smart_playlists (user_id, playlist_type, track_ids, generated_at, expires_at)
    VALUES (p_user_id, 'new_for_you', COALESCE(v_track_ids, '[]'::jsonb), NOW(), NOW() + INTERVAL '1 day')
    ON CONFLICT (user_id, playlist_type)
    DO UPDATE SET
        track_ids = EXCLUDED.track_ids,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '1 day';

    RETURN v_track_ids;
END;
$$;

-- Function to generate Forgotten Favorites for a user
CREATE OR REPLACE FUNCTION generate_forgotten_favorites(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track_ids JSONB;
BEGIN
    -- Get tracks user loved but hasn't played recently
    SELECT jsonb_agg(track_id)
    INTO v_track_ids
    FROM (
        SELECT DISTINCT ph.track_id
        FROM play_history ph
        WHERE ph.user_id = p_user_id
        AND ph.played_at < NOW() - INTERVAL '60 days'
        AND ph.track_id NOT IN (
            SELECT track_id
            FROM play_history
            WHERE user_id = p_user_id
            AND played_at > NOW() - INTERVAL '60 days'
        )
        GROUP BY ph.track_id
        HAVING COUNT(*) >= 3
        ORDER BY COUNT(*) DESC
        LIMIT 30
    ) forgotten_tracks;

    -- Create or update smart playlist record
    INSERT INTO smart_playlists (user_id, playlist_type, track_ids, generated_at, expires_at)
    VALUES (p_user_id, 'forgotten_favorites', COALESCE(v_track_ids, '[]'::jsonb), NOW(), NOW() + INTERVAL '7 days')
    ON CONFLICT (user_id, playlist_type)
    DO UPDATE SET
        track_ids = EXCLUDED.track_ids,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '7 days';

    RETURN v_track_ids;
END;
$$;

-- Master function to generate all smart playlists for all users
CREATE OR REPLACE FUNCTION generate_all_smart_playlists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    FOR v_user_id IN
        SELECT DISTINCT user_id
        FROM play_history
        WHERE played_at > NOW() - INTERVAL '30 days'
    LOOP
        PERFORM generate_daily_mix(v_user_id);
        PERFORM generate_discovery_weekly(v_user_id);
        PERFORM generate_new_for_you(v_user_id);
        PERFORM generate_forgotten_favorites(v_user_id);
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Generated smart playlists for % users', v_count;
END;
$$;

-- =====================================================
-- 3. TRENDING TRACKS CALCULATION
-- =====================================================

-- Create trending tracks table
CREATE TABLE IF NOT EXISTS trending_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    trend_score DECIMAL(10, 2) NOT NULL,
    play_count_24h INTEGER DEFAULT 0,
    play_count_7d INTEGER DEFAULT 0,
    unique_listeners_24h INTEGER DEFAULT 0,
    unique_listeners_7d INTEGER DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(track_id)
);

CREATE INDEX IF NOT EXISTS idx_trending_tracks_score ON trending_tracks(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_calculated ON trending_tracks(calculated_at);

-- Function to calculate trending tracks
CREATE OR REPLACE FUNCTION calculate_trending_tracks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    TRUNCATE TABLE trending_tracks;

    INSERT INTO trending_tracks (
        track_id,
        trend_score,
        play_count_24h,
        play_count_7d,
        unique_listeners_24h,
        unique_listeners_7d,
        calculated_at
    )
    SELECT
        track_id,
        (
            (play_count_24h * 10.0) +
            (play_count_7d * 2.0) +
            (unique_listeners_24h * 20.0) +
            (unique_listeners_7d * 5.0)
        ) as trend_score,
        play_count_24h,
        play_count_7d,
        unique_listeners_24h,
        unique_listeners_7d,
        NOW()
    FROM (
        SELECT
            ph.track_id,
            COUNT(*) FILTER (WHERE ph.played_at > NOW() - INTERVAL '24 hours') as play_count_24h,
            COUNT(*) FILTER (WHERE ph.played_at > NOW() - INTERVAL '7 days') as play_count_7d,
            COUNT(DISTINCT ph.user_id) FILTER (WHERE ph.played_at > NOW() - INTERVAL '24 hours') as unique_listeners_24h,
            COUNT(DISTINCT ph.user_id) FILTER (WHERE ph.played_at > NOW() - INTERVAL '7 days') as unique_listeners_7d
        FROM play_history ph
        WHERE ph.played_at > NOW() - INTERVAL '7 days'
        GROUP BY ph.track_id
        HAVING COUNT(*) >= 3
    ) trending_data
    ORDER BY trend_score DESC
    LIMIT 100;

    RAISE NOTICE 'Calculated trending tracks';
END;
$$;

-- =====================================================
-- 4. MOOD/ENERGY DETECTION QUEUE
-- =====================================================

-- Create task queue for background processing
CREATE TABLE IF NOT EXISTS background_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_background_tasks_status ON background_tasks(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_background_tasks_type ON background_tasks(task_type, entity_type);

-- Function to queue mood detection for new tracks
CREATE OR REPLACE FUNCTION queue_mood_detection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO background_tasks (task_type, entity_type, entity_id, priority)
    VALUES ('mood_detection', 'track', NEW.id, 7);

    INSERT INTO background_tasks (task_type, entity_type, entity_id, priority)
    VALUES ('energy_analysis', 'track', NEW.id, 6);

    RETURN NEW;
END;
$$;

-- Create trigger to auto-queue mood detection for new tracks
DROP TRIGGER IF EXISTS trigger_queue_mood_detection ON tracks;
CREATE TRIGGER trigger_queue_mood_detection
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION queue_mood_detection();

-- Function to get next pending task
CREATE OR REPLACE FUNCTION get_next_background_task(p_task_type TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    task_type TEXT,
    entity_type TEXT,
    entity_id UUID,
    attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE background_tasks
    SET
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE background_tasks.id = (
        SELECT background_tasks.id
        FROM background_tasks
        WHERE background_tasks.status = 'pending'
          AND background_tasks.attempts < background_tasks.max_attempts
          AND (p_task_type IS NULL OR background_tasks.task_type = p_task_type)
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING
        background_tasks.id,
        background_tasks.task_type,
        background_tasks.entity_type,
        background_tasks.entity_id,
        background_tasks.attempts;
END;
$$;

-- Function to complete background task
CREATE OR REPLACE FUNCTION complete_background_task(
    p_task_id UUID,
    p_success BOOLEAN,
    p_result JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_success THEN
        UPDATE background_tasks
        SET
            status = 'completed',
            result = p_result,
            completed_at = NOW()
        WHERE id = p_task_id;
    ELSE
        UPDATE background_tasks
        SET
            status = CASE
                WHEN attempts >= max_attempts THEN 'failed'
                ELSE 'pending'
            END,
            error_message = p_error_message,
            started_at = NULL
        WHERE id = p_task_id;
    END IF;
END;
$$;

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to check cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE (
    jobid BIGINT,
    schedule TEXT,
    command TEXT,
    nodename TEXT,
    nodeport INTEGER,
    database TEXT,
    username TEXT,
    active BOOLEAN,
    jobname TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM cron.job ORDER BY jobid;
$$;

-- Function to manually trigger all automations (for testing)
CREATE OR REPLACE FUNCTION trigger_all_automations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    PERFORM aggregate_all_user_listening_history();
    PERFORM generate_all_smart_playlists();
    PERFORM calculate_trending_tracks();

    v_result := jsonb_build_object(
        'success', true,
        'message', 'All automations triggered successfully',
        'timestamp', NOW()
    );

    RETURN v_result;
END;
$$;

-- =====================================================
-- 6. CRON JOB SCHEDULES
-- =====================================================

-- Schedule: Aggregate listening history daily at 2 AM
SELECT cron.schedule(
    'aggregate-listening-history',
    '0 2 * * *',
    $$SELECT aggregate_all_user_listening_history();$$
);

-- Schedule: Generate smart playlists daily at 3 AM
SELECT cron.schedule(
    'generate-smart-playlists',
    '0 3 * * *',
    $$SELECT generate_all_smart_playlists();$$
);

-- Schedule: Calculate trending tracks every 6 hours
SELECT cron.schedule(
    'calculate-trending',
    '0 */6 * * *',
    $$SELECT calculate_trending_tracks();$$
);

-- Schedule: Clean up old completed background tasks weekly
SELECT cron.schedule(
    'cleanup-background-tasks',
    '0 4 * * 0',
    $$
    DELETE FROM background_tasks
    WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '30 days';
    $$
);

-- Schedule: Clean up expired smart playlists daily
SELECT cron.schedule(
    'cleanup-expired-playlists',
    '0 5 * * *',
    $$
    DELETE FROM smart_playlists
    WHERE expires_at < NOW();
    $$
);

-- =====================================================
-- COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_listening_stats IS 'Aggregated listening statistics for each user, updated daily';
COMMENT ON TABLE smart_playlists IS 'Generated smart playlists for users, refreshed on schedule';
COMMENT ON TABLE trending_tracks IS 'Calculated trending tracks based on recent play activity';
COMMENT ON TABLE background_tasks IS 'Queue for background processing tasks (mood detection, etc.)';

COMMENT ON FUNCTION aggregate_user_listening_history IS 'Aggregates listening history for a single user';
COMMENT ON FUNCTION aggregate_all_user_listening_history IS 'Aggregates listening history for all active users - called by cron';
COMMENT ON FUNCTION generate_daily_mix IS 'Generates Daily Mix playlist for a user';
COMMENT ON FUNCTION generate_discovery_weekly IS 'Generates Discovery Weekly playlist for a user';
COMMENT ON FUNCTION generate_new_for_you IS 'Generates New For You playlist for a user';
COMMENT ON FUNCTION generate_forgotten_favorites IS 'Generates Forgotten Favorites playlist for a user';
COMMENT ON FUNCTION generate_all_smart_playlists IS 'Generates all smart playlists for all users - called by cron';
COMMENT ON FUNCTION calculate_trending_tracks IS 'Calculates trending tracks based on recent activity - called by cron';
COMMENT ON FUNCTION get_next_background_task IS 'Gets next pending background task for processing';
COMMENT ON FUNCTION complete_background_task IS 'Marks a background task as completed or failed';
COMMENT ON FUNCTION trigger_all_automations IS 'Manually triggers all automation tasks (for testing)';

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
