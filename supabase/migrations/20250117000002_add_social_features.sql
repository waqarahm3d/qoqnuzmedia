-- Migration: Add Social Features (Likes, Reactions, Featured Sections)
-- Created: 2025-01-17
-- Description: Adds tables for liked tracks, emoji reactions, and admin-managed featured sections

-- ============================================================================
-- LIKED TRACKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS liked_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_liked_tracks_user_id ON liked_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_track_id ON liked_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_created_at ON liked_tracks(created_at DESC);

-- RLS Policies for liked_tracks
ALTER TABLE liked_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own liked tracks" ON liked_tracks;
CREATE POLICY "Users can view their own liked tracks"
    ON liked_tracks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like tracks" ON liked_tracks;
CREATE POLICY "Users can like tracks"
    ON liked_tracks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike tracks" ON liked_tracks;
CREATE POLICY "Users can unlike tracks"
    ON liked_tracks FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRACK REACTIONS TABLE (Emoji Reactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS track_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (char_length(emoji) <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_reactions_track_id ON track_reactions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_reactions_user_id ON track_reactions(user_id);

-- RLS Policies for track_reactions
ALTER TABLE track_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON track_reactions;
CREATE POLICY "Anyone can view reactions"
    ON track_reactions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON track_reactions;
CREATE POLICY "Users can add reactions"
    ON track_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON track_reactions;
CREATE POLICY "Users can remove their reactions"
    ON track_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FEATURED SECTIONS TABLE (Admin-managed "Hyped" sections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS featured_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    section_type TEXT NOT NULL CHECK (section_type IN ('tracks', 'albums', 'artists', 'playlists')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_sections_active ON featured_sections(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_featured_sections_type ON featured_sections(section_type);

-- RLS Policies for featured_sections
ALTER TABLE featured_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active featured sections" ON featured_sections;
CREATE POLICY "Anyone can view active featured sections"
    ON featured_sections FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage featured sections" ON featured_sections;
CREATE POLICY "Only admins can manage featured sections"
    ON featured_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- FEATURED ITEMS TABLE (Items within featured sections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS featured_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES featured_sections(id) ON DELETE CASCADE,
    item_id UUID NOT NULL, -- References tracks, albums, artists, or playlists
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_items_section_id ON featured_items(section_id);
CREATE INDEX IF NOT EXISTS idx_featured_items_item_id ON featured_items(item_id);
CREATE INDEX IF NOT EXISTS idx_featured_items_order ON featured_items(section_id, display_order);

-- RLS Policies for featured_items
ALTER TABLE featured_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view featured items" ON featured_items;
CREATE POLICY "Anyone can view featured items"
    ON featured_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage featured items" ON featured_items;
CREATE POLICY "Only admins can manage featured items"
    ON featured_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get like count for a track
CREATE OR REPLACE FUNCTION get_track_like_count(track_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM liked_tracks
    WHERE track_id = track_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if user liked a track
CREATE OR REPLACE FUNCTION user_liked_track(track_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM liked_tracks
        WHERE track_id = track_uuid AND user_id = user_uuid
    );
$$ LANGUAGE SQL STABLE;

-- Function to get reaction counts for a track
CREATE OR REPLACE FUNCTION get_track_reaction_counts(track_uuid UUID)
RETURNS TABLE(emoji TEXT, count BIGINT) AS $$
    SELECT emoji, COUNT(*) as count
    FROM track_reactions
    WHERE track_id = track_uuid
    GROUP BY emoji
    ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- UPDATE TRIGGER FOR featured_sections
-- ============================================================================
CREATE OR REPLACE FUNCTION update_featured_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_featured_sections_updated_at ON featured_sections;
CREATE TRIGGER trigger_update_featured_sections_updated_at
    BEFORE UPDATE ON featured_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_sections_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE liked_tracks IS 'Stores user liked tracks for the like/unlike functionality';
COMMENT ON TABLE track_reactions IS 'Stores emoji reactions that users can add to tracks';
COMMENT ON TABLE featured_sections IS 'Admin-managed featured sections (like Spotify hyped sections)';
COMMENT ON TABLE featured_items IS 'Items (tracks/albums/artists) within featured sections';
