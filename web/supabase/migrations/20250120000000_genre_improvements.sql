-- Genre System Improvements
-- Adds missing columns and relationships for full genre functionality

-- 1. Add genre_ids column to playlists table
ALTER TABLE playlists
ADD COLUMN IF NOT EXISTS genre_ids UUID[] DEFAULT '{}';

-- 2. Create index for genre_ids on playlists for efficient queries
CREATE INDEX IF NOT EXISTS idx_playlists_genre_ids ON playlists USING GIN (genre_ids);

-- 3. Add genre_id column to artists for primary genre (optional, in addition to genres TEXT[])
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS primary_genre_id UUID REFERENCES genres(id) ON DELETE SET NULL;

-- 4. Add genre_id column to albums for primary genre
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS primary_genre_id UUID REFERENCES genres(id) ON DELETE SET NULL;

-- 5. Create indexes for faster genre lookups
CREATE INDEX IF NOT EXISTS idx_artists_primary_genre ON artists(primary_genre_id);
CREATE INDEX IF NOT EXISTS idx_albums_primary_genre ON albums(primary_genre_id);

-- 6. Create a junction table for album_genres (proper many-to-many relationship)
CREATE TABLE IF NOT EXISTS album_genres (
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (album_id, genre_id)
);

-- 7. Create a junction table for artist_genres (proper many-to-many relationship)
CREATE TABLE IF NOT EXISTS artist_genres (
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, genre_id)
);

-- 8. Create indexes for the junction tables
CREATE INDEX IF NOT EXISTS idx_album_genres_genre ON album_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_genre ON artist_genres(genre_id);

-- 9. Enable RLS on new tables
ALTER TABLE album_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_genres ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for album_genres
CREATE POLICY "Public read access for album_genres"
    ON album_genres FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admin can manage album_genres"
    ON album_genres FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- 11. Create RLS policies for artist_genres
CREATE POLICY "Public read access for artist_genres"
    ON artist_genres FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admin can manage artist_genres"
    ON artist_genres FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
        )
    );

-- 12. Comment the tables for documentation
COMMENT ON TABLE album_genres IS 'Junction table linking albums to genres';
COMMENT ON TABLE artist_genres IS 'Junction table linking artists to genres';
COMMENT ON COLUMN playlists.genre_ids IS 'Array of genre IDs associated with this playlist';
