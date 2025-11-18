-- ================================================================
-- SMART PLAYLISTS & DISCOVERY SYSTEM
-- Database schema for auto-generated playlists and music discovery
-- ================================================================

-- ================================================================
-- Collaborative Playlists
-- ================================================================

-- Playlist collaborators table
CREATE TABLE IF NOT EXISTS playlist_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'edit', -- 'view', 'edit', 'admin'
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'

  CONSTRAINT unique_playlist_collaborator UNIQUE (playlist_id, user_id),
  CONSTRAINT valid_permission CHECK (permission IN ('view', 'edit', 'admin')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE INDEX idx_playlist_collaborators_playlist ON playlist_collaborators(playlist_id);
CREATE INDEX idx_playlist_collaborators_user ON playlist_collaborators(user_id);
CREATE INDEX idx_playlist_collaborators_status ON playlist_collaborators(status);

-- ================================================================
-- Enhanced Track Metadata for Discovery
-- ================================================================

-- Add discovery metadata to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tempo_bpm INTEGER;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS key_signature VARCHAR(5); -- C, Am, D#, etc.
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS energy_level INTEGER; -- 1-10 scale
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS danceability INTEGER; -- 1-10 scale
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS valence INTEGER; -- 1-10 (sad to happy)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS acousticness INTEGER; -- 1-10
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS instrumentalness INTEGER; -- 1-10
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_year INTEGER;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS mood_tags TEXT[]; -- happy, sad, energetic, chill, angry, peaceful
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS activity_tags TEXT[]; -- workout, study, sleep, party, relax, focus
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS last_metadata_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for discovery queries
CREATE INDEX IF NOT EXISTS idx_tracks_tempo_bpm ON tracks(tempo_bpm);
CREATE INDEX IF NOT EXISTS idx_tracks_energy_level ON tracks(energy_level);
CREATE INDEX IF NOT EXISTS idx_tracks_valence ON tracks(valence);
CREATE INDEX IF NOT EXISTS idx_tracks_release_year ON tracks(release_year);
CREATE INDEX IF NOT EXISTS idx_tracks_mood_tags ON tracks USING gin(mood_tags);
CREATE INDEX IF NOT EXISTS idx_tracks_activity_tags ON tracks USING gin(activity_tags);

-- ================================================================
-- Smart Playlists
-- ================================================================

-- Smart playlist definitions
CREATE TABLE IF NOT EXISTS smart_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'daily_mix', 'new_for_you', 'forgotten_favorites', 'discovery', 'mood', 'activity', 'bpm'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false, -- System-wide vs user-specific
  rules JSONB NOT NULL, -- Playlist generation rules
  update_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  max_tracks INTEGER DEFAULT 50,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  track_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_type CHECK (type IN ('daily_mix', 'new_for_you', 'forgotten_favorites', 'discovery', 'mood', 'activity', 'bpm', 'genre', 'custom')),
  CONSTRAINT valid_frequency CHECK (update_frequency IN ('hourly', 'daily', 'weekly', 'manual'))
);

CREATE INDEX idx_smart_playlists_user ON smart_playlists(user_id);
CREATE INDEX idx_smart_playlists_type ON smart_playlists(type);
CREATE INDEX idx_smart_playlists_is_system ON smart_playlists(is_system);
CREATE INDEX idx_smart_playlists_last_generated ON smart_playlists(last_generated_at);

-- Smart playlist tracks (cached results)
CREATE TABLE IF NOT EXISTS smart_playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_playlist_id UUID NOT NULL REFERENCES smart_playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  score DECIMAL(5,2), -- Relevance score 0-100
  reason TEXT, -- Why this track was included
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_smart_playlist_track UNIQUE (smart_playlist_id, track_id)
);

CREATE INDEX idx_smart_playlist_tracks_playlist ON smart_playlist_tracks(smart_playlist_id, position);
CREATE INDEX idx_smart_playlist_tracks_track ON smart_playlist_tracks(track_id);

-- ================================================================
-- User Preferences for Smart Playlists
-- ================================================================

CREATE TABLE IF NOT EXISTS user_music_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Listening patterns
  favorite_genres TEXT[],
  favorite_moods TEXT[],
  favorite_activities TEXT[],
  preferred_tempo_min INTEGER,
  preferred_tempo_max INTEGER,
  preferred_energy_level INTEGER,

  -- Discovery preferences
  discovery_adventurousness INTEGER DEFAULT 5, -- 1-10: conservative to adventurous
  include_explicit BOOLEAN DEFAULT true,
  preferred_decades INTEGER[], -- [1980, 1990, 2000, 2010, 2020]

  -- Computed from listening history
  top_artists UUID[], -- Array of artist IDs
  listening_time_distribution JSONB, -- Time of day preferences
  average_session_length INTEGER, -- in minutes

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

-- ================================================================
-- Track Similarity Scores (Pre-computed)
-- ================================================================

CREATE TABLE IF NOT EXISTS track_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  similar_track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  similarity_score DECIMAL(4,3) NOT NULL, -- 0.000 to 1.000
  similarity_factors JSONB, -- Breakdown: {genre: 0.8, tempo: 0.6, mood: 0.7}
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_track_similarity UNIQUE (track_id, similar_track_id),
  CONSTRAINT no_self_similarity CHECK (track_id != similar_track_id)
);

CREATE INDEX idx_track_similarities_track ON track_similarities(track_id, similarity_score DESC);
CREATE INDEX idx_track_similarities_similar ON track_similarities(similar_track_id);
CREATE INDEX idx_track_similarities_score ON track_similarities(similarity_score DESC);

-- ================================================================
-- Mood & Activity Presets
-- ================================================================

CREATE TABLE IF NOT EXISTS mood_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  tags TEXT[], -- Associated mood tags
  color_hex VARCHAR(7), -- UI color
  filters JSONB, -- {energy: [6,10], valence: [7,10], tempo: [120,160]}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  tags TEXT[], -- Associated activity tags
  filters JSONB, -- {tempo: [140,180], energy: [7,10]}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default mood presets
INSERT INTO mood_presets (name, display_name, description, emoji, tags, color_hex, filters) VALUES
  ('happy', 'Happy & Upbeat', 'Feel-good tracks to lift your spirits', '😊', ARRAY['happy', 'joyful', 'upbeat'], '#FFD700', '{"valence": [7, 10], "energy": [6, 10]}'),
  ('sad', 'Sad & Melancholic', 'Emotional tracks for introspective moments', '😢', ARRAY['sad', 'melancholic', 'emotional'], '#4A90E2', '{"valence": [1, 4], "energy": [1, 5]}'),
  ('energetic', 'Energetic & Powerful', 'High-energy tracks to pump you up', '⚡', ARRAY['energetic', 'powerful', 'intense'], '#FF4A14', '{"energy": [8, 10], "tempo": [130, 200]}'),
  ('chill', 'Chill & Relaxed', 'Laid-back tracks for relaxation', '😌', ARRAY['chill', 'relaxed', 'mellow'], '#87CEEB', '{"energy": [1, 4], "tempo": [60, 100]}'),
  ('focused', 'Focused & Productive', 'Tracks to help you concentrate', '🎯', ARRAY['focused', 'instrumental', 'ambient'], '#9370DB', '{"instrumentalness": [7, 10], "energy": [3, 6]}'),
  ('romantic', 'Romantic & Intimate', 'Tracks for romantic moments', '❤️', ARRAY['romantic', 'intimate', 'love'], '#FF69B4', '{"valence": [6, 9], "energy": [3, 6]}'),
  ('angry', 'Angry & Aggressive', 'Intense tracks for releasing energy', '😠', ARRAY['angry', 'aggressive', 'intense'], '#DC143C', '{"energy": [9, 10], "tempo": [140, 200]}'),
  ('peaceful', 'Peaceful & Calm', 'Serene tracks for meditation', '☮️', ARRAY['peaceful', 'calm', 'serene'], '#98FB98', '{"energy": [1, 3], "acousticness": [7, 10]}')
ON CONFLICT (name) DO NOTHING;

-- Insert default activity presets
INSERT INTO activity_presets (name, display_name, description, icon, tags, filters) VALUES
  ('workout', 'Workout', 'High-energy tracks to power your workout', '💪', ARRAY['workout', 'gym', 'exercise'], '{"tempo": [120, 180], "energy": [8, 10]}'),
  ('running', 'Running', 'Steady-tempo tracks perfect for running', '🏃', ARRAY['running', 'cardio'], '{"tempo": [160, 180], "energy": [7, 10]}'),
  ('study', 'Study & Focus', 'Instrumental tracks for concentration', '📚', ARRAY['study', 'focus', 'concentration'], '{"instrumentalness": [6, 10], "energy": [3, 6]}'),
  ('sleep', 'Sleep & Rest', 'Calming tracks to help you sleep', '😴', ARRAY['sleep', 'rest', 'bedtime'], '{"energy": [1, 2], "tempo": [50, 80]}'),
  ('party', 'Party', 'Upbeat tracks to get the party started', '🎉', ARRAY['party', 'dance', 'celebration'], '{"danceability": [7, 10], "energy": [7, 10]}'),
  ('driving', 'Driving', 'Perfect tracks for road trips', '🚗', ARRAY['driving', 'roadtrip'], '{"tempo": [100, 140], "energy": [5, 8]}'),
  ('cooking', 'Cooking', 'Feel-good tracks for the kitchen', '👨‍🍳', ARRAY['cooking', 'kitchen'], '{"valence": [6, 10], "energy": [4, 7]}'),
  ('meditation', 'Meditation', 'Ambient tracks for mindfulness', '🧘', ARRAY['meditation', 'mindfulness', 'zen'], '{"energy": [1, 2], "instrumentalness": [8, 10]}')
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================

ALTER TABLE playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_music_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_similarities ENABLE ROW LEVEL SECURITY;

-- Playlist collaborators policies
CREATE POLICY "Users can view their collaborations"
  ON playlist_collaborators FOR SELECT
  USING (user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Playlist owners can manage collaborators"
  ON playlist_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_collaborators.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view"
  ON playlist_collaborators FOR SELECT
  USING (user_id = auth.uid());

-- Smart playlists policies
CREATE POLICY "Users can view their smart playlists"
  ON smart_playlists FOR SELECT
  USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can create smart playlists"
  ON smart_playlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their smart playlists"
  ON smart_playlists FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their smart playlists"
  ON smart_playlists FOR DELETE
  USING (user_id = auth.uid());

-- Smart playlist tracks policies
CREATE POLICY "Users can view smart playlist tracks"
  ON smart_playlist_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM smart_playlists
      WHERE smart_playlists.id = smart_playlist_tracks.smart_playlist_id
      AND (smart_playlists.user_id = auth.uid() OR smart_playlists.is_system = true)
    )
  );

-- User preferences policies
CREATE POLICY "Users can view their preferences"
  ON user_music_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their preferences"
  ON user_music_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their preferences"
  ON user_music_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Track similarities are public (read-only for users)
CREATE POLICY "Anyone can view track similarities"
  ON track_similarities FOR SELECT
  USING (true);

-- Admins can manage everything
CREATE POLICY "Admins can manage smart playlists"
  ON smart_playlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage track similarities"
  ON track_similarities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- ================================================================
-- Functions & Triggers
-- ================================================================

-- Function to update smart playlist updated_at
CREATE OR REPLACE FUNCTION update_smart_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smart_playlists_updated_at
    BEFORE UPDATE ON smart_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_smart_playlist_updated_at();

-- Function to update track count in smart playlists
CREATE OR REPLACE FUNCTION update_smart_playlist_track_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE smart_playlists
        SET track_count = track_count + 1
        WHERE id = NEW.smart_playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE smart_playlists
        SET track_count = GREATEST(track_count - 1, 0)
        WHERE id = OLD.smart_playlist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_smart_playlist_track_count_trigger
    AFTER INSERT OR DELETE ON smart_playlist_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_smart_playlist_track_count();

-- Function to calculate track similarity score
CREATE OR REPLACE FUNCTION calculate_track_similarity(
    track1_id UUID,
    track2_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    t1 RECORD;
    t2 RECORD;
    genre_similarity DECIMAL := 0;
    tempo_similarity DECIMAL := 0;
    mood_similarity DECIMAL := 0;
    energy_similarity DECIMAL := 0;
    final_score DECIMAL := 0;
BEGIN
    SELECT * INTO t1 FROM tracks WHERE id = track1_id;
    SELECT * INTO t2 FROM tracks WHERE id = track2_id;

    -- Genre similarity (40% weight)
    IF t1.genres && t2.genres THEN
        genre_similarity := 0.4 * (
            CARDINALITY(t1.genres & t2.genres)::DECIMAL /
            CARDINALITY(t1.genres | t2.genres)::DECIMAL
        );
    END IF;

    -- Tempo similarity (20% weight)
    IF t1.tempo_bpm IS NOT NULL AND t2.tempo_bpm IS NOT NULL THEN
        tempo_similarity := 0.2 * (1 - ABS(t1.tempo_bpm - t2.tempo_bpm)::DECIMAL / 200);
    END IF;

    -- Mood similarity (25% weight)
    IF t1.mood_tags IS NOT NULL AND t2.mood_tags IS NOT NULL AND t1.mood_tags && t2.mood_tags THEN
        mood_similarity := 0.25 * (
            CARDINALITY(t1.mood_tags & t2.mood_tags)::DECIMAL /
            CARDINALITY(t1.mood_tags | t2.mood_tags)::DECIMAL
        );
    END IF;

    -- Energy similarity (15% weight)
    IF t1.energy_level IS NOT NULL AND t2.energy_level IS NOT NULL THEN
        energy_similarity := 0.15 * (1 - ABS(t1.energy_level - t2.energy_level)::DECIMAL / 10);
    END IF;

    final_score := genre_similarity + tempo_similarity + mood_similarity + energy_similarity;

    RETURN GREATEST(LEAST(final_score, 1.0), 0.0);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Comments
-- ================================================================

COMMENT ON TABLE playlist_collaborators IS 'Manages collaborative playlists with invite system';
COMMENT ON TABLE smart_playlists IS 'Auto-generated playlists based on listening patterns';
COMMENT ON TABLE smart_playlist_tracks IS 'Cached tracks for smart playlists';
COMMENT ON TABLE user_music_preferences IS 'User preferences and listening patterns for smart recommendations';
COMMENT ON TABLE track_similarities IS 'Pre-computed similarity scores between tracks';
COMMENT ON TABLE mood_presets IS 'Predefined mood categories for discovery';
COMMENT ON TABLE activity_presets IS 'Predefined activity categories for discovery';

COMMENT ON COLUMN tracks.tempo_bpm IS 'Tempo in beats per minute (BPM)';
COMMENT ON COLUMN tracks.energy_level IS 'Energy level from 1 (calm) to 10 (intense)';
COMMENT ON COLUMN tracks.valence IS 'Musical positivity from 1 (sad) to 10 (happy)';
COMMENT ON COLUMN tracks.mood_tags IS 'Mood descriptors: happy, sad, energetic, chill, etc.';
COMMENT ON COLUMN tracks.activity_tags IS 'Activity contexts: workout, study, sleep, party, etc.';
