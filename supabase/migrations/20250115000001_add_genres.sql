-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    color TEXT DEFAULT '#1DB954', -- Spotify green as default
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_genres_active ON genres(is_active);

-- Enable RLS
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Public can read active genres
CREATE POLICY "Genres are viewable by everyone" ON genres
    FOR SELECT USING (is_active = true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage genres" ON genres
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON genres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default genres (like Spotify)
INSERT INTO genres (name, slug, description, color) VALUES
    ('Pop', 'pop', 'Popular music from around the world', '#FF6B6B'),
    ('Rock', 'rock', 'Classic and modern rock music', '#4ECDC4'),
    ('Hip-Hop', 'hip-hop', 'Hip hop and rap music', '#FFE66D'),
    ('R&B', 'r-n-b', 'Rhythm and blues music', '#A8E6CF'),
    ('Electronic', 'electronic', 'Electronic and dance music', '#C7CEEA'),
    ('Jazz', 'jazz', 'Jazz and instrumental music', '#FFDAC1'),
    ('Classical', 'classical', 'Classical and orchestral music', '#B5EAD7'),
    ('Country', 'country', 'Country and folk music', '#FFB7B2'),
    ('Latin', 'latin', 'Latin and reggaeton music', '#FF6F91'),
    ('Metal', 'metal', 'Heavy metal and rock music', '#95E1D3'),
    ('Indie', 'indie', 'Independent and alternative music', '#F38181'),
    ('Soul', 'soul', 'Soul and funk music', '#AA96DA')
ON CONFLICT (slug) DO NOTHING;
