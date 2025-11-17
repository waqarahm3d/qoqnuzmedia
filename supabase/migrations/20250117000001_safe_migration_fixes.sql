-- =====================================================
-- QOQNUZ MUSIC - SAFE MIGRATION (HANDLES EXISTING OBJECTS)
-- =====================================================
-- Migration Date: 2025-01-17
-- Description: Safe version that handles existing tables/policies
-- =====================================================

-- =====================================================
-- 1. CREATE MISSING GENRES TABLE (IF NOT EXISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    color TEXT DEFAULT '#1DB954',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (safe - won't fail if exists)
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_genres_display_order ON genres(display_order);

-- Enable RLS (safe if already enabled)
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate (clean approach)
DROP POLICY IF EXISTS "Genres are viewable by everyone" ON genres;
DROP POLICY IF EXISTS "Admins can insert genres" ON genres;
DROP POLICY IF EXISTS "Admins can update genres" ON genres;
DROP POLICY IF EXISTS "Admins can delete genres" ON genres;

-- Recreate RLS Policies for genres
CREATE POLICY "Genres are viewable by everyone"
    ON genres FOR SELECT
    USING (true);

CREATE POLICY "Admins can insert genres"
    ON genres FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update genres"
    ON genres FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete genres"
    ON genres FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 2. ADD TRACK-GENRE RELATIONSHIP TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS track_genres (
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (track_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_track_genres_track ON track_genres(track_id);
CREATE INDEX IF NOT EXISTS idx_track_genres_genre ON track_genres(genre_id);

-- Enable RLS
ALTER TABLE track_genres ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Track genres are viewable by everyone" ON track_genres;

CREATE POLICY "Track genres are viewable by everyone"
    ON track_genres FOR SELECT
    USING (true);

-- =====================================================
-- 3. FIX ADMIN ROLES PERMISSIONS
-- =====================================================

-- Update existing admin roles to use proper permission format
UPDATE admin_roles
SET permissions = '["*"]'::jsonb
WHERE name = 'Super Admin';

-- Insert or update default admin roles
INSERT INTO admin_roles (name, permissions)
VALUES
    ('Super Admin', '["*"]'::jsonb),
    ('Editor', '["content.create", "content.edit"]'::jsonb),
    ('Moderator', '["users.view", "content.view"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions;

-- =====================================================
-- 4. ADD MISSING FOLLOWER_COUNT COLUMN TO ARTISTS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'follower_count'
    ) THEN
        ALTER TABLE artists ADD COLUMN follower_count INTEGER DEFAULT 0;

        -- Update follower counts based on existing follows
        UPDATE artists SET follower_count = (
            SELECT COUNT(*)
            FROM artist_follows
            WHERE artist_follows.artist_id = artists.id
        );
    END IF;
END $$;

-- =====================================================
-- 5. INSERT DEFAULT GENRES (SAFE)
-- =====================================================

INSERT INTO genres (name, slug, description, color, display_order)
VALUES
    ('Pop', 'pop', 'Popular music across all styles', '#FF6B6B', 1),
    ('Rock', 'rock', 'Rock and alternative music', '#4ECDC4', 2),
    ('Hip Hop', 'hip-hop', 'Rap and hip hop music', '#FFE66D', 3),
    ('R&B', 'r-and-b', 'Rhythm and blues', '#95E1D3', 4),
    ('Electronic', 'electronic', 'Electronic and dance music', '#A8E6CF', 5),
    ('Jazz', 'jazz', 'Jazz and blues', '#DCEDC1', 6),
    ('Classical', 'classical', 'Classical and orchestral music', '#FFD3B6', 7),
    ('Country', 'country', 'Country and folk music', '#FFAAA5', 8),
    ('Latin', 'latin', 'Latin and world music', '#FF8B94', 9),
    ('Indie', 'indie', 'Independent and alternative music', '#A8DADC', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 6. ADD UPDATED_AT TRIGGER FOR GENRES
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_genres_updated_at ON genres;

-- Recreate trigger
CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON genres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FIX ARTIST FOLLOWS TRIGGER
-- =====================================================

-- Create or replace function
CREATE OR REPLACE FUNCTION update_artist_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artists SET follower_count = follower_count + 1 WHERE id = NEW.artist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artists SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.artist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_artist_followers ON artist_follows;

CREATE TRIGGER update_artist_followers AFTER INSERT OR DELETE ON artist_follows
    FOR EACH ROW EXECUTE FUNCTION update_artist_follower_count();

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    genre_count INTEGER;
BEGIN
    -- Check genres table exists and has data
    SELECT COUNT(*) INTO genre_count FROM genres;

    IF genre_count = 0 THEN
        RAISE WARNING 'Genres table is empty! Default genres should have been inserted.';
    ELSE
        RAISE NOTICE '✅ Genres table has % records', genre_count;
    END IF;

    -- Verify tables exist
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'genres'),
        'genres table does not exist';
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'track_genres'),
        'track_genres table does not exist';

    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '✅ All tables created and configured';
END $$;

-- Show what was created
SELECT 'Genres created:' as info, COUNT(*) as count FROM genres;
