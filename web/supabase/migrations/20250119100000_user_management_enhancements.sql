-- ============================================
-- USER MANAGEMENT ENHANCEMENTS
-- ============================================
-- Social links, user-artist relationship, enhanced profiles
-- ============================================

-- ============================================
-- TABLE: social_links
-- ============================================
-- Stores social media links for both users and artists
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('user', 'artist')),
  entity_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_links_entity ON social_links(entity_type, entity_id);

-- ============================================
-- TABLE: user_artist_links
-- ============================================
-- Links users to their artist profiles (for when a user becomes an artist)
CREATE TABLE IF NOT EXISTS user_artist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_user_artist_links_user ON user_artist_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artist_links_artist ON user_artist_links(artist_id);

-- ============================================
-- ADD COLUMNS TO PROFILES (if they don't exist)
-- ============================================
DO $$
BEGIN
  -- Add country field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country VARCHAR(100);
  END IF;

  -- Add website field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE profiles ADD COLUMN website TEXT;
  END IF;

  -- Add phone field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(50);
  END IF;

  -- Add preferences (JSON for notification settings, privacy, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
    ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add last_active timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active') THEN
    ALTER TABLE profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- social_links policies
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view social links" ON social_links;
CREATE POLICY "Anyone can view social links"
  ON social_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own social links" ON social_links;
CREATE POLICY "Users can manage their own social links"
  ON social_links FOR ALL
  USING (
    (entity_type = 'user' AND entity_id = auth.uid()) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS "Service role can manage all social links" ON social_links;
CREATE POLICY "Service role can manage all social links"
  ON social_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- user_artist_links policies
ALTER TABLE user_artist_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user-artist links" ON user_artist_links;
CREATE POLICY "Anyone can view user-artist links"
  ON user_artist_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage user-artist links" ON user_artist_links;
CREATE POLICY "Service role can manage user-artist links"
  ON user_artist_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to convert user to artist
CREATE OR REPLACE FUNCTION convert_user_to_artist(
  p_user_id UUID,
  p_artist_name VARCHAR(255),
  p_bio TEXT DEFAULT NULL,
  p_genres TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
  v_artist_id UUID;
  v_avatar_url TEXT;
BEGIN
  -- Get user's avatar to use for artist
  SELECT avatar_url INTO v_avatar_url
  FROM profiles
  WHERE id = p_user_id;

  -- Create the artist
  INSERT INTO artists (name, bio, avatar_url, verified, genres)
  VALUES (p_artist_name, p_bio, v_avatar_url, false, p_genres)
  RETURNING id INTO v_artist_id;

  -- Link user to artist
  INSERT INTO user_artist_links (user_id, artist_id, is_primary)
  VALUES (p_user_id, v_artist_id, true);

  RETURN v_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's linked artist
CREATE OR REPLACE FUNCTION get_user_artist(p_user_id UUID)
RETURNS TABLE (
  artist_id UUID,
  artist_name VARCHAR(255),
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    ual.is_primary
  FROM user_artist_links ual
  JOIN artists a ON a.id = ual.artist_id
  WHERE ual.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'User management enhancements installed successfully!';
  RAISE NOTICE 'Tables created: social_links, user_artist_links';
  RAISE NOTICE 'Functions created: convert_user_to_artist, get_user_artist';
END $$;
