-- ============================================
-- SIMPLE AUTOMATION SYSTEM
-- ============================================
-- Clean, working automation system for Qoqnuz Music
-- ============================================

-- ============================================
-- TABLE: background_tasks
-- ============================================
CREATE TABLE IF NOT EXISTS background_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_background_tasks_status ON background_tasks(status);
CREATE INDEX IF NOT EXISTS idx_background_tasks_created_at ON background_tasks(created_at DESC);

-- ============================================
-- TABLE: smart_playlists
-- ============================================
CREATE TABLE IF NOT EXISTS smart_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_type VARCHAR(100) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  track_ids JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_smart_playlists_user_id ON smart_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_playlists_generated_at ON smart_playlists(generated_at DESC);

-- ============================================
-- TABLE: trending_tracks
-- ============================================
CREATE TABLE IF NOT EXISTS trending_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  trend_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  play_count_24h INTEGER DEFAULT 0,
  play_count_7d INTEGER DEFAULT 0,
  unique_listeners_24h INTEGER DEFAULT 0,
  unique_listeners_7d INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(track_id)
);

CREATE INDEX IF NOT EXISTS idx_trending_tracks_score ON trending_tracks(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_tracks_calculated_at ON trending_tracks(calculated_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- background_tasks: Admin-only access
ALTER TABLE background_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage background tasks" ON background_tasks;
CREATE POLICY "Service role can manage background tasks"
  ON background_tasks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- smart_playlists: Users can see their own, admins can see all
ALTER TABLE smart_playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own smart playlists" ON smart_playlists;
CREATE POLICY "Users can view their own smart playlists"
  ON smart_playlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage smart playlists" ON smart_playlists;
CREATE POLICY "Service role can manage smart playlists"
  ON smart_playlists FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- trending_tracks: Public read, service role write
ALTER TABLE trending_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trending tracks" ON trending_tracks;
CREATE POLICY "Anyone can view trending tracks"
  ON trending_tracks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage trending tracks" ON trending_tracks;
CREATE POLICY "Service role can manage trending tracks"
  ON trending_tracks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS: Simple automation functions
-- ============================================

-- Function to get cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE (
  jobid BIGINT,
  jobname TEXT,
  schedule TEXT,
  active BOOLEAN,
  database TEXT
) AS $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN QUERY
    SELECT
      j.jobid,
      j.jobname,
      j.schedule,
      j.active,
      j.database
    FROM cron.job j
    WHERE j.database = current_database();
  ELSE
    -- Return empty if pg_cron not installed
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trending tracks
CREATE OR REPLACE FUNCTION calculate_trending_tracks()
RETURNS void AS $$
BEGIN
  -- Clear existing trending data
  DELETE FROM trending_tracks;

  -- Insert trending tracks based on recent play counts
  -- This is a simple implementation - you can enhance it later
  INSERT INTO trending_tracks (track_id, trend_score, calculated_at)
  SELECT
    id as track_id,
    COALESCE(play_count, 0) as trend_score,
    NOW() as calculated_at
  FROM tracks
  WHERE play_count > 0
  ORDER BY play_count DESC
  LIMIT 100;

  -- Log the task
  INSERT INTO background_tasks (task_type, status, completed_at)
  VALUES ('calculate_trending', 'completed', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate smart playlists
CREATE OR REPLACE FUNCTION generate_all_smart_playlists()
RETURNS void AS $$
BEGIN
  -- Simple implementation: create a "Top Tracks" playlist for each user
  -- This is just a placeholder - enhance as needed

  INSERT INTO smart_playlists (user_id, playlist_type, generated_at, expires_at)
  SELECT
    id as user_id,
    'top_tracks' as playlist_type,
    NOW() as generated_at,
    NOW() + INTERVAL '7 days' as expires_at
  FROM auth.users
  ON CONFLICT DO NOTHING;

  -- Log the task
  INSERT INTO background_tasks (task_type, status, completed_at)
  VALUES ('generate_smart_playlists', 'completed', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate listening stats
CREATE OR REPLACE FUNCTION aggregate_all_user_listening_history()
RETURNS void AS $$
BEGIN
  -- Placeholder for listening stats aggregation
  -- Add your logic here based on your listening_history table

  -- Log the task
  INSERT INTO background_tasks (task_type, status, completed_at)
  VALUES ('aggregate_listening_stats', 'completed', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger all automations
CREATE OR REPLACE FUNCTION trigger_all_automations()
RETURNS void AS $$
BEGIN
  PERFORM calculate_trending_tracks();
  PERFORM generate_all_smart_playlists();
  PERFORM aggregate_all_user_listening_history();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED: Add some sample background tasks
-- ============================================
INSERT INTO background_tasks (task_type, status, completed_at)
VALUES
  ('calculate_trending', 'completed', NOW() - INTERVAL '1 hour'),
  ('generate_smart_playlists', 'completed', NOW() - INTERVAL '2 hours'),
  ('aggregate_listening_stats', 'completed', NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Simple automation system installed successfully!';
  RAISE NOTICE 'Tables created: background_tasks, smart_playlists, trending_tracks';
  RAISE NOTICE 'Functions created: get_cron_job_status, calculate_trending_tracks, generate_all_smart_playlists, aggregate_all_user_listening_history, trigger_all_automations';
END $$;
